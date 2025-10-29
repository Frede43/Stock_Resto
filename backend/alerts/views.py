from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework import permissions
from django.utils import timezone

from .models import Alert
from .serializers import AlertSerializer, AlertCreateSerializer, AlertUpdateSerializer
from accounts.permissions import IsAuthenticated

class AlertViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les alertes"""
    queryset = Alert.objects.all()
    permission_classes = [permissions.AllowAny]  # Temporairement public pour debug
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type', 'priority', 'status']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'priority', 'resolved_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AlertCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AlertUpdateSerializer
        return AlertSerializer
    
    def get_queryset(self):
        return Alert.objects.select_related('created_by', 'resolved_by', 'related_product', 'related_sale')
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Résoudre une alerte"""
        alert = self.get_object()
        
        if alert.status == 'resolved':
            return Response(
                {'error': 'Cette alerte est déjà résolue.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        alert.resolve(user=request.user if request.user.is_authenticated else None)
        
        return Response({
            'message': 'Alerte résolue avec succès.',
            'resolved_at': alert.resolved_at
        })
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archiver une alerte"""
        alert = self.get_object()
        alert.status = 'archived'
        alert.save()
        
        return Response({'message': 'Alerte archivée avec succès.'})
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Récupérer les alertes actives"""
        active_alerts = self.get_queryset().filter(status='active')
        serializer = self.get_serializer(active_alerts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def critical(self, request):
        """Récupérer les alertes critiques"""
        critical_alerts = self.get_queryset().filter(
            status='active',
            priority='critical'
        )
        serializer = self.get_serializer(critical_alerts, many=True)
        return Response(serializer.data)
