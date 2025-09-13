"""
WebSocket Consumers pour les mises à jour temps réel
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import Table, TableReservation
from .serializers import TableListSerializer, TableReservationSerializer


class TableStatusConsumer(AsyncWebsocketConsumer):
    """Consumer pour les mises à jour de statut des tables"""
    
    async def connect(self):
        # Vérifier l'authentification
        if self.scope["user"] == AnonymousUser():
            await self.close()
            return
        
        # Rejoindre le groupe des tables
        self.room_group_name = 'tables_status'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Envoyer l'état initial des tables
        tables_data = await self.get_tables_data()
        await self.send(text_data=json.dumps({
            'type': 'tables_initial',
            'data': tables_data
        }))
    
    async def disconnect(self, close_code):
        # Quitter le groupe
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Gérer les messages reçus du client"""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': text_data_json.get('timestamp')
                }))
            elif message_type == 'request_tables_update':
                tables_data = await self.get_tables_data()
                await self.send(text_data=json.dumps({
                    'type': 'tables_update',
                    'data': tables_data
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Format JSON invalide'
            }))
    
    # Handlers pour les messages du groupe
    async def table_status_changed(self, event):
        """Diffuser les changements de statut de table"""
        await self.send(text_data=json.dumps({
            'type': 'table_status_changed',
            'table_id': event['table_id'],
            'status': event['status'],
            'data': event['data']
        }))
    
    async def table_occupied(self, event):
        """Diffuser l'occupation d'une table"""
        await self.send(text_data=json.dumps({
            'type': 'table_occupied',
            'table_id': event['table_id'],
            'customer_name': event.get('customer_name'),
            'occupied_since': event['occupied_since'],
            'data': event['data']
        }))
    
    async def table_freed(self, event):
        """Diffuser la libération d'une table"""
        await self.send(text_data=json.dumps({
            'type': 'table_freed',
            'table_id': event['table_id'],
            'data': event['data']
        }))
    
    async def tables_summary_update(self, event):
        """Diffuser la mise à jour du résumé des tables"""
        await self.send(text_data=json.dumps({
            'type': 'tables_summary_update',
            'summary': event['summary']
        }))
    
    @database_sync_to_async
    def get_tables_data(self):
        """Récupérer les données des tables"""
        tables = Table.objects.filter(is_active=True).select_related().prefetch_related('sales')
        serializer = TableListSerializer(tables, many=True)
        return serializer.data


class ReservationConsumer(AsyncWebsocketConsumer):
    """Consumer pour les mises à jour des réservations"""
    
    async def connect(self):
        # Vérifier l'authentification
        if self.scope["user"] == AnonymousUser():
            await self.close()
            return
        
        # Rejoindre le groupe des réservations
        self.room_group_name = 'reservations_updates'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Envoyer les réservations du jour
        reservations_data = await self.get_todays_reservations()
        await self.send(text_data=json.dumps({
            'type': 'reservations_initial',
            'data': reservations_data
        }))
    
    async def disconnect(self, close_code):
        # Quitter le groupe
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Gérer les messages reçus du client"""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'request_reservations_update':
                reservations_data = await self.get_todays_reservations()
                await self.send(text_data=json.dumps({
                    'type': 'reservations_update',
                    'data': reservations_data
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Format JSON invalide'
            }))
    
    # Handlers pour les messages du groupe
    async def reservation_created(self, event):
        """Diffuser la création d'une réservation"""
        await self.send(text_data=json.dumps({
            'type': 'reservation_created',
            'reservation_id': event['reservation_id'],
            'data': event['data']
        }))
    
    async def reservation_updated(self, event):
        """Diffuser la mise à jour d'une réservation"""
        await self.send(text_data=json.dumps({
            'type': 'reservation_updated',
            'reservation_id': event['reservation_id'],
            'status': event['status'],
            'data': event['data']
        }))
    
    async def reservation_reminder(self, event):
        """Diffuser un rappel de réservation"""
        await self.send(text_data=json.dumps({
            'type': 'reservation_reminder',
            'reservation_id': event['reservation_id'],
            'customer_name': event['customer_name'],
            'table_number': event['table_number'],
            'time_until': event['time_until']
        }))
    
    @database_sync_to_async
    def get_todays_reservations(self):
        """Récupérer les réservations du jour"""
        from django.utils import timezone
        today = timezone.now().date()
        
        reservations = TableReservation.objects.filter(
            reservation_date=today,
            status__in=['pending', 'confirmed', 'seated']
        ).select_related('table', 'created_by').order_by('reservation_time')
        
        serializer = TableReservationSerializer(reservations, many=True)
        return serializer.data


# Fonctions utilitaires pour envoyer des messages WebSocket
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

channel_layer = get_channel_layer()

def broadcast_table_status_change(table_id, status, table_data=None):
    """Diffuser un changement de statut de table"""
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            'tables_status',
            {
                'type': 'table_status_changed',
                'table_id': table_id,
                'status': status,
                'data': table_data
            }
        )

def broadcast_table_occupied(table_id, customer_name=None, occupied_since=None, table_data=None):
    """Diffuser l'occupation d'une table"""
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            'tables_status',
            {
                'type': 'table_occupied',
                'table_id': table_id,
                'customer_name': customer_name,
                'occupied_since': occupied_since.isoformat() if occupied_since else None,
                'data': table_data
            }
        )

def broadcast_table_freed(table_id, table_data=None):
    """Diffuser la libération d'une table"""
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            'tables_status',
            {
                'type': 'table_freed',
                'table_id': table_id,
                'data': table_data
            }
        )

def broadcast_tables_summary_update(summary):
    """Diffuser la mise à jour du résumé des tables"""
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            'tables_status',
            {
                'type': 'tables_summary_update',
                'summary': summary
            }
        )

def broadcast_reservation_created(reservation_id, reservation_data):
    """Diffuser la création d'une réservation"""
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            'reservations_updates',
            {
                'type': 'reservation_created',
                'reservation_id': reservation_id,
                'data': reservation_data
            }
        )

def broadcast_reservation_updated(reservation_id, status, reservation_data):
    """Diffuser la mise à jour d'une réservation"""
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            'reservations_updates',
            {
                'type': 'reservation_updated',
                'reservation_id': reservation_id,
                'status': status,
                'data': reservation_data
            }
        )
