"""
Services pour la gestion des tables et réservations
"""

from django.db import transaction
from django.utils import timezone
from datetime import datetime, timedelta, time
from typing import Dict, List, Optional
from .models import Table, TableReservation, Sale


class TableService:
    """Service pour la gestion des tables"""
    
    @staticmethod
    def get_table_status_summary() -> Dict:
        """
        Résumé du statut de toutes les tables
        
        Returns:
            {
                'total': int,
                'available': int,
                'occupied': int,
                'reserved': int,
                'cleaning': int,
                'occupation_rate': float
            }
        """
        tables = Table.objects.filter(is_active=True)
        total = tables.count()
        
        if total == 0:
            return {
                'total': 0,
                'available': 0,
                'occupied': 0,
                'reserved': 0,
                'cleaning': 0,
                'occupation_rate': 0.0
            }
        
        status_counts = {}
        for status, _ in Table.STATUS_CHOICES:
            status_counts[status] = tables.filter(status=status).count()
        
        occupation_rate = (status_counts.get('occupied', 0) / total) * 100
        
        return {
            'total': total,
            'available': status_counts.get('available', 0),
            'occupied': status_counts.get('occupied', 0),
            'reserved': status_counts.get('reserved', 0),
            'cleaning': status_counts.get('cleaning', 0),
            'occupation_rate': round(occupation_rate, 1)
        }
    
    @staticmethod
    def get_available_tables(party_size: int, date: str = None, time_slot: str = None) -> List[Table]:
        """
        Trouve les tables disponibles pour un nombre de personnes
        
        Args:
            party_size: Nombre de personnes
            date: Date au format YYYY-MM-DD (optionnel)
            time_slot: Heure au format HH:MM (optionnel)
        
        Returns:
            Liste des tables disponibles
        """
        tables = Table.objects.filter(
            is_active=True,
            capacity__gte=party_size,
            status='available'
        ).order_by('capacity')
        
        # Si date et heure spécifiées, vérifier les réservations
        if date and time_slot:
            try:
                reservation_date = datetime.strptime(date, '%Y-%m-%d').date()
                reservation_time = datetime.strptime(time_slot, '%H:%M').time()
                
                # Exclure les tables avec réservations conflictuelles
                conflicting_reservations = TableReservation.objects.filter(
                    reservation_date=reservation_date,
                    status__in=['confirmed', 'seated'],
                    table__in=tables
                )
                
                # Vérifier les conflits d'horaires (2h de marge)
                for reservation in conflicting_reservations:
                    start_time = reservation.reservation_time
                    end_time = (datetime.combine(reservation_date, start_time) + 
                              timedelta(minutes=reservation.duration_minutes)).time()
                    
                    if (start_time <= reservation_time <= end_time or
                        reservation_time <= start_time <= 
                        (datetime.combine(reservation_date, reservation_time) + 
                         timedelta(hours=2)).time()):
                        tables = tables.exclude(id=reservation.table.id)
            
            except ValueError:
                pass  # Format de date/heure invalide, ignorer le filtrage
        
        return list(tables)
    
    @staticmethod
    @transaction.atomic
    def occupy_table(table_id: int, user, customer_name: str = None) -> Dict:
        """
        Occupe une table
        
        Returns:
            {
                'success': bool,
                'message': str,
                'table': Table (optionnel)
            }
        """
        try:
            table = Table.objects.get(id=table_id, is_active=True)
            
            if not table.is_available:
                return {
                    'success': False,
                    'message': f'Table {table.number} non disponible (statut: {table.get_status_display()})'
                }
            
            table.occupy(user)

            # Créer une vente si nom client fourni
            if customer_name:
                Sale.objects.create(
                    table=table,
                    customer_name=customer_name,
                    server=user,
                    status='pending'
                )

            # Diffuser la mise à jour via WebSocket
            from .consumers import broadcast_table_occupied
            from .serializers import TableListSerializer

            table_data = TableListSerializer(table).data
            broadcast_table_occupied(
                table_id=table.id,
                customer_name=customer_name,
                occupied_since=table.occupied_since,
                table_data=table_data
            )

            # Mettre à jour le résumé
            summary = TableService.get_table_status_summary()
            from .consumers import broadcast_tables_summary_update
            broadcast_tables_summary_update(summary)

            return {
                'success': True,
                'message': f'Table {table.number} occupée avec succès',
                'table': table
            }
            
        except Table.DoesNotExist:
            return {
                'success': False,
                'message': 'Table non trouvée'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Erreur: {str(e)}'
            }
    
    @staticmethod
    @transaction.atomic
    def free_table(table_id: int, user) -> Dict:
        """
        Libère une table
        """
        try:
            table = Table.objects.get(id=table_id, is_active=True)
            
            if not table.is_occupied:
                return {
                    'success': False,
                    'message': f'Table {table.number} n\'est pas occupée'
                }
            
            # Vérifier s'il y a une vente en cours
            current_sale = table.current_sale
            if current_sale and current_sale.status not in ['paid', 'cancelled']:
                return {
                    'success': False,
                    'message': f'Impossible de libérer la table {table.number}: vente en cours non payée'
                }
            
            table.free(user)

            # Diffuser la mise à jour via WebSocket
            from .consumers import broadcast_table_freed
            from .serializers import TableListSerializer

            table_data = TableListSerializer(table).data
            broadcast_table_freed(
                table_id=table.id,
                table_data=table_data
            )

            # Mettre à jour le résumé
            summary = TableService.get_table_status_summary()
            from .consumers import broadcast_tables_summary_update
            broadcast_tables_summary_update(summary)

            return {
                'success': True,
                'message': f'Table {table.number} libérée avec succès',
                'table': table
            }
            
        except Table.DoesNotExist:
            return {
                'success': False,
                'message': 'Table non trouvée'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Erreur: {str(e)}'
            }
    
    @staticmethod
    def get_table_analytics(days: int = 7) -> Dict:
        """
        Analyse de l'utilisation des tables sur une période
        
        Returns:
            {
                'period_days': int,
                'total_sales': int,
                'average_occupation_time': float,
                'peak_hours': list,
                'table_performance': list
            }
        """
        from django.db.models import Avg, Count, Sum
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Ventes sur la période
        sales = Sale.objects.filter(
            created_at__range=[start_date, end_date],
            table__isnull=False
        )
        
        # Performance par table
        table_performance = []
        for table in Table.objects.filter(is_active=True):
            table_sales = sales.filter(table=table)
            performance = {
                'table_number': table.number,
                'total_sales': table_sales.count(),
                'total_revenue': table_sales.aggregate(
                    total=Sum('total_amount')
                )['total'] or 0,
                'average_sale': table_sales.aggregate(
                    avg=Avg('total_amount')
                )['avg'] or 0
            }
            table_performance.append(performance)
        
        # Trier par revenus
        table_performance.sort(key=lambda x: x['total_revenue'], reverse=True)
        
        return {
            'period_days': days,
            'total_sales': sales.count(),
            'table_performance': table_performance[:10]  # Top 10
        }


class ReservationService:
    """Service pour la gestion des réservations"""
    
    @staticmethod
    @transaction.atomic
    def create_reservation(
        table_id: int,
        customer_name: str,
        party_size: int,
        reservation_date: str,
        reservation_time: str,
        user,
        **kwargs
    ) -> Dict:
        """
        Crée une nouvelle réservation
        
        Returns:
            {
                'success': bool,
                'message': str,
                'reservation': TableReservation (optionnel)
            }
        """
        try:
            table = Table.objects.get(id=table_id, is_active=True)
            
            # Vérifier la capacité
            if party_size > table.capacity:
                return {
                    'success': False,
                    'message': f'Table {table.number} trop petite (capacité: {table.capacity})'
                }
            
            # Convertir les dates
            res_date = datetime.strptime(reservation_date, '%Y-%m-%d').date()
            res_time = datetime.strptime(reservation_time, '%H:%M').time()
            
            # Vérifier les conflits
            existing = TableReservation.objects.filter(
                table=table,
                reservation_date=res_date,
                status__in=['confirmed', 'seated']
            )
            
            for existing_res in existing:
                # Vérifier le chevauchement (2h de marge)
                existing_start = existing_res.reservation_time
                existing_end = (datetime.combine(res_date, existing_start) + 
                              timedelta(minutes=existing_res.duration_minutes)).time()
                
                if (existing_start <= res_time <= existing_end or
                    res_time <= existing_start <= 
                    (datetime.combine(res_date, res_time) + timedelta(hours=2)).time()):
                    return {
                        'success': False,
                        'message': f'Conflit avec réservation existante à {existing_start}'
                    }
            
            # Créer la réservation
            reservation = TableReservation.objects.create(
                table=table,
                customer_name=customer_name,
                party_size=party_size,
                reservation_date=res_date,
                reservation_time=res_time,
                created_by=user,
                customer_phone=kwargs.get('customer_phone'),
                customer_email=kwargs.get('customer_email'),
                special_requests=kwargs.get('special_requests'),
                duration_minutes=kwargs.get('duration_minutes', 120)
            )
            
            # Envoyer les notifications de confirmation
            from core.notifications import NotificationService
            try:
                notification_result = NotificationService.send_reservation_confirmation(reservation)
                if notification_result['email_sent'] or notification_result['sms_sent']:
                    message = 'Réservation créée avec succès. '
                    if notification_result['email_sent']:
                        message += 'Email de confirmation envoyé. '
                    if notification_result['sms_sent']:
                        message += 'SMS de confirmation envoyé.'
                else:
                    message = 'Réservation créée avec succès (notifications non envoyées)'
            except Exception as e:
                message = f'Réservation créée avec succès (erreur notifications: {str(e)})'

            return {
                'success': True,
                'message': message,
                'reservation': reservation
            }
            
        except Table.DoesNotExist:
            return {
                'success': False,
                'message': 'Table non trouvée'
            }
        except ValueError as e:
            return {
                'success': False,
                'message': f'Format de date/heure invalide: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Erreur: {str(e)}'
            }
    
    @staticmethod
    def get_todays_reservations() -> List[TableReservation]:
        """Récupère les réservations du jour"""
        today = timezone.now().date()
        return list(TableReservation.objects.filter(
            reservation_date=today,
            status__in=['pending', 'confirmed', 'seated']
        ).select_related('table').order_by('reservation_time'))
    
    @staticmethod
    def get_upcoming_reservations(hours: int = 2) -> List[TableReservation]:
        """Récupère les réservations des prochaines heures"""
        now = timezone.now()
        end_time = now + timedelta(hours=hours)
        
        return list(TableReservation.objects.filter(
            reservation_date=now.date(),
            reservation_time__range=[now.time(), end_time.time()],
            status='confirmed'
        ).select_related('table').order_by('reservation_time'))
    
    @staticmethod
    def check_overdue_reservations() -> List[TableReservation]:
        """Vérifie les réservations en retard"""
        reservations = TableReservation.objects.filter(
            status='confirmed',
            reservation_date=timezone.now().date()
        )
        
        return [res for res in reservations if res.is_overdue]
