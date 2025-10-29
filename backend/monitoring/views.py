from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework import permissions
from django.utils import timezone
from django.db.models import Avg, Count
from datetime import timedelta
import psutil
import platform

from .models import SystemMetric, SystemAlert, PerformanceLog
from .serializers import (
    SystemMetricSerializer, SystemAlertSerializer, 
    PerformanceLogSerializer, SystemStatsSerializer
)

class SystemMetricViewSet(viewsets.ModelViewSet):
    """ViewSet pour les métriques système"""
    queryset = SystemMetric.objects.all()
    serializer_class = SystemMetricSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['metric_type']
    ordering = ['-timestamp']

class SystemAlertViewSet(viewsets.ModelViewSet):
    """ViewSet pour les alertes système"""
    queryset = SystemAlert.objects.all()
    serializer_class = SystemAlertSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['severity', 'status']
    search_fields = ['title', 'message']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acquitter une alerte"""
        alert = self.get_object()
        alert.status = 'acknowledged'
        alert.acknowledged_at = timezone.now()
        alert.acknowledged_by = request.user if request.user.is_authenticated else None
        alert.save()
        return Response({'message': 'Alerte acquittée'})

class PerformanceLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les logs de performance"""
    queryset = PerformanceLog.objects.all()
    serializer_class = PerformanceLogSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['endpoint', 'method', 'status_code']
    ordering = ['-timestamp']

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def system_stats(request):
    """Statistiques système en temps réel"""
    try:
        # Métriques système
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Statistiques de performance
        today = timezone.now().date()
        logs_today = PerformanceLog.objects.filter(timestamp__date=today)
        
        avg_response_time = logs_today.aggregate(
            avg=Avg('response_time')
        )['avg'] or 0
        
        error_count = logs_today.filter(status_code__gte=400).count()
        total_requests = logs_today.count()
        error_rate = (error_count / total_requests * 100) if total_requests > 0 else 0
        
        # Uptime (simulé)
        uptime = "99.9%"
        
        stats = {
            'cpu_usage': cpu_usage,
            'memory_usage': memory.percent,
            'disk_usage': disk.percent,
            'active_users': 0,  # À implémenter
            'api_calls_today': total_requests,
            'avg_response_time': round(avg_response_time, 2),
            'error_rate': round(error_rate, 2),
            'uptime': uptime
        }
        
        serializer = SystemStatsSerializer(stats)
        return Response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': f'Erreur lors de la récupération des statistiques: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
