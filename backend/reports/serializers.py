from rest_framework import serializers
from .models import DailyReport, StockAlert
from products.serializers import ProductListSerializer

class StockAlertSerializer(serializers.ModelSerializer):
    """Serializer pour les alertes de stock"""
    
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_category = serializers.CharField(source='product.category.name', read_only=True)
    current_stock = serializers.IntegerField(source='product.current_stock', read_only=True)
    minimum_stock = serializers.IntegerField(source='product.minimum_stock', read_only=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = StockAlert
        fields = [
            'id', 'product', 'product_name', 'product_category',
            'current_stock', 'minimum_stock', 'alert_type',
            'alert_type_display', 'message', 'status',
            'status_display', 'created_at'
        ]
        read_only_fields = ['created_at']

class DailyReportSerializer(serializers.ModelSerializer):
    """Serializer pour les rapports quotidiens"""
    
    created_by_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = DailyReport
        fields = [
            'id', 'date', 'user', 'created_by_name',
            'total_sales', 'total_profit', 'total_expenses',
            'net_result', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class DailyReportCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer un rapport quotidien"""
    
    class Meta:
        model = DailyReport
        fields = [
            'date', 'notes'
        ]
    
    def create(self, validated_data):
        # Le rapport sera automatiquement généré avec les données du jour
        report = DailyReport.objects.create(
            user=self.context['request'].user,
            **validated_data
        )
        
        # Générer automatiquement les données
        report.generate_report_data()
        
        return report

class StockAlertCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer une alerte de stock"""
    
    class Meta:
        model = StockAlert
        fields = ['product', 'alert_type', 'message']
    
    def validate(self, data):
        product = data['product']
        alert_type = data['alert_type']
        
        # Vérifier qu'il n'y a pas déjà une alerte active pour ce produit
        existing_alert = StockAlert.objects.filter(
            product=product,
            alert_type=alert_type,
            status='active'
        ).first()
        
        if existing_alert:
            raise serializers.ValidationError(
                f"Une alerte {alert_type} existe déjà pour ce produit."
            )
        
        return data

class ReportSummarySerializer(serializers.Serializer):
    """Serializer pour le résumé des rapports"""
    
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    total_reports = serializers.IntegerField()
    total_sales = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    average_daily_sales = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_daily_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    best_day = serializers.DateField()
    best_day_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_alerts = serializers.IntegerField()
    unresolved_alerts = serializers.IntegerField()
