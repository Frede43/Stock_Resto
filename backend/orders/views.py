from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework import permissions
from django.utils import timezone

from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer, OrderUpdateSerializer
from accounts.permissions import IsAuthenticated

class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les commandes"""
    queryset = Order.objects.all()
    permission_classes = [permissions.AllowAny]  # Temporairement public pour debug
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'table', 'server']
    search_fields = ['order_number', 'notes']
    ordering_fields = ['created_at', 'priority', 'total_amount']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrderUpdateSerializer
        return OrderSerializer
    
    def get_queryset(self):
        return Order.objects.select_related('table', 'server').prefetch_related('items__product')
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirmer une commande"""
        order = self.get_object()
        
        if order.status != 'pending':
            return Response(
                {'error': 'Seules les commandes en attente peuvent être confirmées.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'confirmed'
        order.confirmed_at = timezone.now()
        order.save()
        
        return Response({'message': 'Commande confirmée avec succès.'})
    
    @action(detail=True, methods=['post'])
    def start_preparing(self, request, pk=None):
        """Commencer la préparation"""
        order = self.get_object()
        
        if order.status != 'confirmed':
            return Response(
                {'error': 'Seules les commandes confirmées peuvent être mises en préparation.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'preparing'
        order.save()
        
        return Response({'message': 'Préparation commencée.'})
    
    @action(detail=True, methods=['post'])
    def mark_ready(self, request, pk=None):
        """Marquer comme prête"""
        order = self.get_object()
        
        if order.status != 'preparing':
            return Response(
                {'error': 'Seules les commandes en préparation peuvent être marquées comme prêtes.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'ready'
        order.ready_at = timezone.now()
        order.save()
        
        return Response({'message': 'Commande prête.'})
    
    @action(detail=True, methods=['post'])
    def serve(self, request, pk=None):
        """Marquer comme servie"""
        order = self.get_object()
        
        if order.status != 'ready':
            return Response(
                {'error': 'Seules les commandes prêtes peuvent être servies.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'served'
        order.served_at = timezone.now()
        order.save()
        
        return Response({'message': 'Commande servie.'})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Annuler une commande"""
        order = self.get_object()
        
        if order.status in ['served', 'cancelled']:
            return Response(
                {'error': 'Cette commande ne peut pas être annulée.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'cancelled'
        order.save()
        
        return Response({'message': 'Commande annulée.'})
    
    @action(detail=False, methods=['get'])
    def kitchen_queue(self, request):
        """Récupérer la file d'attente de la cuisine"""
        kitchen_orders = self.get_queryset().filter(
            status__in=['confirmed', 'preparing']
        ).order_by('priority', 'created_at')
        
        serializer = self.get_serializer(kitchen_orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def ready_orders(self, request):
        """Récupérer les commandes prêtes"""
        ready_orders = self.get_queryset().filter(status='ready')
        serializer = self.get_serializer(ready_orders, many=True)
        return Response(serializer.data)
