from rest_framework import serializers
from .models import SystemMetric, SystemAlert, PerformanceLog
from accounts.serializers import UserSerializer

class SystemMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemMetric
        fields = [
            'id', 'metric_type', 'value', 'unit', 
            'timestamp', 'metadata'
        ]

class SystemAlertSerializer(serializers.ModelSerializer):
    acknowledged_by = UserSerializer(read_only=True)
    metric = SystemMetricSerializer(read_only=True)
    
    class Meta:
        model = SystemAlert
        fields = [
            'id', 'title', 'message', 'severity', 'status',
            'metric', 'threshold_value', 'created_at',
            'acknowledged_at', 'acknowledged_by', 'resolved_at'
        ]

class PerformanceLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = PerformanceLog
        fields = [
            'id', 'endpoint', 'method', 'response_time',
            'status_code', 'user', 'timestamp'
        ]

class SystemStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques système agrégées"""
    cpu_usage = serializers.FloatField()
    memory_usage = serializers.FloatField()
    disk_usage = serializers.FloatField()
    active_users = serializers.IntegerField()
    api_calls_today = serializers.IntegerField()
    avg_response_time = serializers.FloatField()
    error_rate = serializers.FloatField()
    uptime = serializers.CharField()
