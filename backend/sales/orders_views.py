"""
ViewSet dédié aux commandes (cuisine)
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta

from .models import Sale
from .serializers import SaleListSerializer


class OrderViewSet(viewsets.ModelViewSet):
    """
    API dédiée aux commandes en cours (cuisine/serveurs)
    
    Endpoints:
    - GET /api/orders/ - Liste des commandes en cours
    - GET /api/orders/{id}/ - Détails d'une commande
    - PATCH /api/orders/{id}/start_preparation/ - Commencer la préparation
    - PATCH /api/orders/{id}/mark_ready/ - Marquer comme prête
    - PATCH /api/orders/{id}/cancel/ - Annuler une commande
    """
    serializer_class = SaleListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Récupère les commandes en cours"""
        # Utilise le manager orders (pending, preparing, ready)
        queryset = Sale.orders.all()
        
        # Filtres optionnels
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        table_id = self.request.query_params.get('table')
        if table_id:
            queryset = queryset.filter(table_id=table_id)
        
        # Filtrer par serveur si nécessaire
        if self.request.user.role == 'server':
            queryset = queryset.filter(server=self.request.user)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['patch'])
    def start_preparation(self, request, pk=None):
        """
        Commencer la préparation d'une commande
        
        Endpoint: PATCH /api/orders/{id}/start_preparation/
        """
        order = self.get_object()
        
        # Validation du statut
        if order.status != 'pending':
            return Response(
                {
                    'error': 'Seules les commandes en attente peuvent être préparées',
                    'current_status': order.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérification supplémentaire
        if not order.can_be_modified:
            return Response(
                {'error': 'Cette commande ne peut plus être modifiée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Changement de statut
        order.status = 'preparing'
        order.save()
        
        print(f"🔥 Commande #{order.id} ({order.reference}) en préparation")
        
        # TODO: Envoyer notification au serveur
        # notify_server(order.server, f"Commande {order.reference} en préparation")
        
        return Response({
            'message': 'Préparation commencée',
            'order': SaleListSerializer(order).data
        })
    
    @action(detail=True, methods=['patch'])
    def mark_ready(self, request, pk=None):
        """
        Marquer une commande comme prête
        
        Endpoint: PATCH /api/orders/{id}/mark_ready/
        """
        order = self.get_object()
        
        # Validation du statut
        if order.status != 'preparing':
            return Response(
                {
                    'error': 'Seules les commandes en préparation peuvent être marquées prêtes',
                    'current_status': order.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Changement de statut
        order.status = 'ready'
        order.save()
        
        # Calcul du temps de préparation
        prep_time = order.get_preparation_time()
        prep_minutes = int(prep_time.total_seconds() / 60) if prep_time else 0
        
        print(f"✅ Commande #{order.id} ({order.reference}) prête (préparée en {prep_minutes} min)")
        
        # TODO: Envoyer notification au serveur
        # notify_server(order.server, f"Commande {order.reference} prête !")
        
        return Response({
            'message': 'Commande prête',
            'preparation_time_minutes': prep_minutes,
            'order': SaleListSerializer(order).data
        })
    
    @action(detail=True, methods=['patch'])
    def serve(self, request, pk=None):
        """
        Marquer une commande comme servie
        
        Endpoint: PATCH /api/orders/{id}/serve/
        """
        order = self.get_object()
        
        # Validation du statut
        if order.status != 'ready':
            return Response(
                {
                    'error': 'Seules les commandes prêtes peuvent être servies',
                    'current_status': order.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Changement de statut
        order.status = 'served'
        order.save()
        
        print(f"🍽️ Commande #{order.id} ({order.reference}) servie")
        
        return Response({
            'message': 'Commande servie',
            'order': SaleListSerializer(order).data
        })
    
    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        """
        Annuler une commande
        
        Endpoint: PATCH /api/orders/{id}/cancel/
        Body: {"reason": "Raison de l'annulation"}
        """
        order = self.get_object()
        
        # Vérification
        if not order.can_be_cancelled:
            return Response(
                {
                    'error': 'Cette commande ne peut plus être annulée',
                    'current_status': order.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Récupérer la raison
        reason = request.data.get('reason', 'Annulée par le personnel')
        
        # Annulation
        order.status = 'cancelled'
        if order.notes:
            order.notes += f"\n\nAnnulée: {reason}"
        else:
            order.notes = f"Annulée: {reason}"
        order.save()
        
        print(f"❌ Commande #{order.id} ({order.reference}) annulée: {reason}")
        
        return Response({
            'message': 'Commande annulée',
            'reason': reason,
            'order': SaleListSerializer(order).data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Statistiques des commandes en cours
        
        Endpoint: GET /api/orders/stats/
        """
        now = timezone.now()
        today = now.date()
        
        # Commandes du jour
        today_orders = Sale.orders.filter(created_at__date=today)
        
        # Statistiques par statut
        stats = {
            'total': today_orders.count(),
            'pending': today_orders.filter(status='pending').count(),
            'preparing': today_orders.filter(status='preparing').count(),
            'ready': today_orders.filter(status='ready').count(),
            
            # Commandes en retard (> 30 min)
            'late_orders': today_orders.filter(
                status__in=['pending', 'preparing'],
                created_at__lt=now - timedelta(minutes=30)
            ).count(),
            
            # Temps moyen de préparation (approximatif)
            'avg_preparation_time_minutes': self._calculate_avg_prep_time(today_orders),
            
            # Commandes récentes
            'recent_orders': SaleListSerializer(
                today_orders.order_by('-created_at')[:5],
                many=True
            ).data,
        }
        
        return Response(stats)
    
    def _calculate_avg_prep_time(self, queryset):
        """Calcule le temps moyen de préparation"""
        completed_orders = queryset.filter(status__in=['ready', 'served', 'paid'])
        
        if not completed_orders.exists():
            return 0
        
        total_minutes = 0
        count = 0
        
        for order in completed_orders:
            prep_time = order.get_preparation_time()
            if prep_time:
                total_minutes += prep_time.total_seconds() / 60
                count += 1
        
        return int(total_minutes / count) if count > 0 else 0
