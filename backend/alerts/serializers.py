from rest_framework import serializers
from .models import Alert
from accounts.serializers import UserSerializer

class AlertSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    resolved_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Alert
        fields = [
            'id', 'type', 'priority', 'status', 'title', 'message',
            'created_by', 'resolved_by', 'created_at', 'resolved_at',
            'related_product', 'related_sale'
        ]
        read_only_fields = ['created_at', 'resolved_at', 'created_by', 'resolved_by']

class AlertCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = [
            'type', 'priority', 'title', 'message',
            'related_product', 'related_sale'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class AlertUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ['status', 'priority']
