from django.contrib import admin
from .models import SystemSettings, UserPreferences, SystemInfo


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour les paramètres système
    """
    list_display = [
        'restaurant_name', 
        'currency', 
        'tax_rate', 
        'language', 
        'updated_at', 
        'updated_by'
    ]
    
    fieldsets = (
        ('Informations du Restaurant', {
            'fields': (
                'restaurant_name', 
                'restaurant_address', 
                'restaurant_phone', 
                'restaurant_email', 
                'currency', 
                'tax_rate'
            )
        }),
        ('Notifications', {
            'fields': (
                'email_notifications_enabled',
                'sms_notifications_enabled', 
                'low_stock_alerts', 
                'daily_reports'
            )
        }),
        ('Impression', {
            'fields': (
                'auto_print_receipts', 
                'receipt_copies', 
                'printer_name'
            )
        }),
        ('Système', {
            'fields': (
                'language', 
                'timezone', 
                'date_format', 
                'backup_frequency'
            )
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def save_model(self, request, obj, form, change):
        """Enregistrer l'utilisateur qui fait la modification"""
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
    
    def has_add_permission(self, request):
        """Limiter à une seule instance"""
        return not SystemSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        """Empêcher la suppression"""
        return False


@admin.register(UserPreferences)
class UserPreferencesAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour les préférences utilisateur
    """
    list_display = [
        'user', 
        'theme', 
        'language', 
        'email_notifications', 
        'browser_notifications',
        'updated_at'
    ]
    
    list_filter = [
        'theme', 
        'language', 
        'email_notifications', 
        'browser_notifications'
    ]
    
    search_fields = ['user__username', 'user__email']
    
    fieldsets = (
        ('Utilisateur', {
            'fields': ('user',)
        }),
        ('Interface', {
            'fields': ('theme', 'language')
        }),
        ('Notifications', {
            'fields': (
                'email_notifications', 
                'browser_notifications', 
                'sound_notifications'
            )
        }),
        ('Affichage', {
            'fields': (
                'items_per_page', 
                'default_currency_display'
            )
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SystemInfo)
class SystemInfoAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour les informations système
    """
    list_display = [
        'version', 
        'database_version', 
        'server_info', 
        'storage_used', 
        'memory_usage', 
        'cpu_usage',
        'updated_at'
    ]
    
    fieldsets = (
        ('Version', {
            'fields': ('version', 'database_version', 'server_info')
        }),
        ('Performance', {
            'fields': (
                'storage_used', 
                'memory_usage', 
                'cpu_usage', 
                'uptime_start'
            )
        }),
        ('Sauvegarde', {
            'fields': ('last_backup',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'uptime_start']
    
    def has_add_permission(self, request):
        """Limiter à une seule instance"""
        return not SystemInfo.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        """Empêcher la suppression"""
        return False
