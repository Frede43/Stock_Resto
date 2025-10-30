from rest_framework import serializers
from .models import SystemSettings, UserPreferences, SystemInfo


class RestaurantSettingsSerializer(serializers.Serializer):
    """Serializer pour les paramètres du restaurant"""
    name = serializers.CharField(max_length=200)
    address = serializers.CharField()
    phone = serializers.CharField(max_length=50)
    email = serializers.EmailField()
    currency = serializers.CharField(max_length=10)
    tax_rate = serializers.DecimalField(max_digits=5, decimal_places=2)


class NotificationSettingsSerializer(serializers.Serializer):
    """Serializer pour les paramètres de notifications"""
    email_enabled = serializers.BooleanField()
    sms_enabled = serializers.BooleanField()
    low_stock_alerts = serializers.BooleanField()
    daily_reports = serializers.BooleanField()


class PrintingSettingsSerializer(serializers.Serializer):
    """Serializer pour les paramètres d'impression"""
    auto_print_receipts = serializers.BooleanField(required=False)
    auto_print_daily_reports = serializers.BooleanField(required=False)
    thermal_format = serializers.BooleanField(required=False)
    copies = serializers.IntegerField(min_value=1, max_value=10, required=False)
    receipt_printer = serializers.CharField(max_length=200, required=False, allow_blank=True)
    report_printer = serializers.CharField(max_length=200, required=False, allow_blank=True)
    printer_name = serializers.CharField(max_length=200, required=False)
    receipt_copies = serializers.IntegerField(min_value=1, max_value=10, required=False)  # Pour compatibilité


class SystemSettingsNestedSerializer(serializers.Serializer):
    """Serializer pour les paramètres système"""
    language = serializers.CharField(max_length=10, required=False)
    timezone = serializers.CharField(max_length=50, required=False)
    date_format = serializers.CharField(max_length=20, required=False)
    backup_frequency = serializers.CharField(max_length=20, required=False)
    two_factor_auth = serializers.BooleanField(required=False)
    auto_logout = serializers.BooleanField(required=False)
    audit_logs = serializers.BooleanField(required=False)
    session_timeout = serializers.IntegerField(min_value=5, max_value=480, required=False)
    max_login_attempts = serializers.IntegerField(min_value=3, max_value=10, required=False)


class SystemSettingsSerializer(serializers.Serializer):
    """Serializer principal pour tous les paramètres système"""
    restaurant = RestaurantSettingsSerializer()
    notifications = NotificationSettingsSerializer()
    printing = PrintingSettingsSerializer()
    system = SystemSettingsNestedSerializer()
    
    def create(self, validated_data):
        """Créer ou mettre à jour les paramètres système"""
        settings = SystemSettings.get_settings()
        settings.update_from_dict(validated_data)
        settings.save()
        return settings
    
    def update(self, instance, validated_data):
        """Mettre à jour les paramètres système"""
        instance.update_from_dict(validated_data)
        instance.save()
        return instance
    
    def to_representation(self, instance):
        """Convertir le modèle en représentation JSON"""
        if isinstance(instance, SystemSettings):
            return instance.to_dict()
        return super().to_representation(instance)


class UserPreferencesSerializer(serializers.ModelSerializer):
    """Serializer pour les préférences utilisateur"""
    notifications = serializers.SerializerMethodField()
    display = serializers.SerializerMethodField()
    
    class Meta:
        model = UserPreferences
        fields = ['theme', 'language', 'notifications', 'display']
    
    def get_notifications(self, obj):
        return {
            'email': obj.email_notifications,
            'browser': obj.browser_notifications,
            'sound': obj.sound_notifications
        }
    
    def get_display(self, obj):
        return {
            'items_per_page': obj.items_per_page,
            'currency_display': obj.default_currency_display
        }
    
    def update(self, instance, validated_data):
        # Gérer les champs imbriqués
        notifications_data = validated_data.pop('notifications', {})
        display_data = validated_data.pop('display', {})
        
        # Mettre à jour les champs simples
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Mettre à jour les notifications
        if notifications_data:
            instance.email_notifications = notifications_data.get('email', instance.email_notifications)
            instance.browser_notifications = notifications_data.get('browser', instance.browser_notifications)
            instance.sound_notifications = notifications_data.get('sound', instance.sound_notifications)
        
        # Mettre à jour l'affichage
        if display_data:
            instance.items_per_page = display_data.get('items_per_page', instance.items_per_page)
            instance.default_currency_display = display_data.get('currency_display', instance.default_currency_display)
        
        instance.save()
        return instance


class SystemInfoSerializer(serializers.Serializer):
    """Serializer pour les informations système"""
    version = serializers.CharField()
    database = serializers.CharField()
    server = serializers.CharField()
    uptime = serializers.CharField()
    last_backup = serializers.CharField(allow_null=True)
    storage_used = serializers.CharField()
    memory_usage = serializers.CharField()
    cpu_usage = serializers.CharField()
    updated_at = serializers.CharField()
    
    def to_representation(self, instance):
        """Convertir le modèle en représentation JSON"""
        if isinstance(instance, SystemInfo):
            return instance.to_dict()
        return super().to_representation(instance)
