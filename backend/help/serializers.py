from rest_framework import serializers
from django.contrib.auth.models import User
from .models import HelpCategory, FAQ, Tutorial, SupportRequest, FAQHelpful, ViewTracking

class HelpCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = HelpCategory
        fields = ['id', 'name', 'description', 'created_at']

class FAQSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)
    
    class Meta:
        model = FAQ
        fields = [
            'id', 'question', 'answer', 'category', 'category_id',
            'helpful_count', 'views', 'is_active', 
            'created_at', 'updated_at'
        ]

class TutorialSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)
    
    class Meta:
        model = Tutorial
        fields = [
            'id', 'title', 'description', 'duration', 'category', 'category_id',
            'difficulty', 'video_url', 'views', 'is_active',
            'created_at', 'updated_at'
        ]

class SupportRequestSerializer(serializers.ModelSerializer):
    created_by = serializers.CharField(source='created_by.username', read_only=True)
    assigned_to = serializers.CharField(source='assigned_to.username', read_only=True)
    
    class Meta:
        model = SupportRequest
        fields = [
            'id', 'subject', 'message', 'category', 'priority', 'status',
            'created_by', 'assigned_to', 'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'resolved_at']

class SupportRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportRequest
        fields = ['subject', 'message', 'category', 'priority']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class HelpStatsSerializer(serializers.Serializer):
    total_faqs = serializers.IntegerField()
    total_tutorials = serializers.IntegerField()
    total_support_requests = serializers.IntegerField()
    avg_resolution_time = serializers.CharField()
    popular_categories = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
