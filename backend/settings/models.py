from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
import json

User = get_user_model()


class SystemSettings(models.Model):
    """
    Modèle pour stocker les paramètres système de BarStock Wise
    """
    # Informations du restaurant
    restaurant_name = models.CharField(max_length=200, default="BarStock Wise")
    restaurant_address = models.TextField(default="Bujumbura, Burundi")
    restaurant_phone = models.CharField(max_length=50, default="+257 XX XX XX XX")
    restaurant_email = models.EmailField(default="contact@barstock.bi")
    currency = models.CharField(max_length=10, default="BIF")
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    
    # Paramètres de notifications
    email_notifications_enabled = models.BooleanField(default=True)
    sms_notifications_enabled = models.BooleanField(default=False)
    low_stock_alerts = models.BooleanField(default=True)
    daily_reports = models.BooleanField(default=True)
    
    # Paramètres d'impression
    auto_print_receipts = models.BooleanField(default=True)
    auto_print_daily_reports = models.BooleanField(default=False)
    thermal_format = models.BooleanField(default=False)
    receipt_copies = models.IntegerField(default=1)
    receipt_printer = models.CharField(max_length=200, default="", blank=True)
    report_printer = models.CharField(max_length=200, default="", blank=True)
    printer_name = models.CharField(max_length=200, default="Imprimante par défaut")
    
    # Paramètres système
    language = models.CharField(max_length=10, default="fr")
    timezone = models.CharField(max_length=50, default="Africa/Bujumbura")
    date_format = models.CharField(max_length=20, default="DD/MM/YYYY")
    backup_frequency = models.CharField(max_length=20, default="daily")
    
    # Paramètres de sécurité
    two_factor_auth = models.BooleanField(default=False)
    auto_logout = models.BooleanField(default=True)
    audit_logs = models.BooleanField(default=True)
    session_timeout = models.IntegerField(default=30)  # en minutes
    max_login_attempts = models.IntegerField(default=5)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        verbose_name = "Paramètres Système"
        verbose_name_plural = "Paramètres Système"
    
    def __str__(self):
        return f"Paramètres - {self.restaurant_name}"
    
    @classmethod
    def get_settings(cls):
        """Récupérer les paramètres (singleton pattern)"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings
    
    def to_dict(self):
        """Convertir en dictionnaire pour l'API"""
        return {
            'restaurant': {
                'name': self.restaurant_name,
                'address': self.restaurant_address,
                'phone': self.restaurant_phone,
                'email': self.restaurant_email,
                'currency': self.currency,
                'tax_rate': float(self.tax_rate)
            },
            'notifications': {
                'email_enabled': self.email_notifications_enabled,
                'sms_enabled': self.sms_notifications_enabled,
                'low_stock_alerts': self.low_stock_alerts,
                'daily_reports': self.daily_reports
            },
            'printing': {
                'auto_print_receipts': self.auto_print_receipts,
                'auto_print_daily_reports': self.auto_print_daily_reports,
                'thermal_format': self.thermal_format,
                'copies': self.receipt_copies,
                'receipt_printer': self.receipt_printer,
                'report_printer': self.report_printer,
                'printer_name': self.printer_name
            },
            'system': {
                'language': self.language,
                'timezone': self.timezone,
                'date_format': self.date_format,
                'backup_frequency': self.backup_frequency,
                'two_factor_auth': self.two_factor_auth,
                'auto_logout': self.auto_logout,
                'audit_logs': self.audit_logs,
                'session_timeout': self.session_timeout,
                'max_login_attempts': self.max_login_attempts
            }
        }
    
    def update_from_dict(self, data):
        """Mettre à jour depuis un dictionnaire"""
        if 'restaurant' in data:
            restaurant = data['restaurant']
            self.restaurant_name = restaurant.get('name', self.restaurant_name)
            self.restaurant_address = restaurant.get('address', self.restaurant_address)
            self.restaurant_phone = restaurant.get('phone', self.restaurant_phone)
            self.restaurant_email = restaurant.get('email', self.restaurant_email)
            self.currency = restaurant.get('currency', self.currency)
            self.tax_rate = restaurant.get('tax_rate', self.tax_rate)
        
        if 'notifications' in data:
            notifications = data['notifications']
            self.email_notifications_enabled = notifications.get('email_enabled', self.email_notifications_enabled)
            self.sms_notifications_enabled = notifications.get('sms_enabled', self.sms_notifications_enabled)
            self.low_stock_alerts = notifications.get('low_stock_alerts', self.low_stock_alerts)
            self.daily_reports = notifications.get('daily_reports', self.daily_reports)
        
        if 'printing' in data:
            printing = data['printing']
            self.auto_print_receipts = printing.get('auto_print_receipts', self.auto_print_receipts)
            self.auto_print_daily_reports = printing.get('auto_print_daily_reports', self.auto_print_daily_reports)
            self.thermal_format = printing.get('thermal_format', self.thermal_format)
            self.receipt_copies = printing.get('copies', printing.get('receipt_copies', self.receipt_copies))
            self.receipt_printer = printing.get('receipt_printer', self.receipt_printer)
            self.report_printer = printing.get('report_printer', self.report_printer)
            self.printer_name = printing.get('printer_name', self.printer_name)
        
        if 'system' in data:
            system = data['system']
            self.language = system.get('language', self.language)
            self.timezone = system.get('timezone', self.timezone)
            self.date_format = system.get('date_format', self.date_format)
            self.backup_frequency = system.get('backup_frequency', self.backup_frequency)
            self.two_factor_auth = system.get('two_factor_auth', self.two_factor_auth)
            self.auto_logout = system.get('auto_logout', self.auto_logout)
            self.audit_logs = system.get('audit_logs', self.audit_logs)
            self.session_timeout = system.get('session_timeout', self.session_timeout)
            self.max_login_attempts = system.get('max_login_attempts', self.max_login_attempts)


class UserPreferences(models.Model):
    """
    Préférences utilisateur individuelles
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='preferences')
    
    # Préférences d'interface
    theme = models.CharField(max_length=20, default="light", choices=[
        ('light', 'Clair'),
        ('dark', 'Sombre'),
        ('auto', 'Automatique')
    ])
    language = models.CharField(max_length=10, default="fr")
    
    # Préférences de notifications
    email_notifications = models.BooleanField(default=True)
    browser_notifications = models.BooleanField(default=True)
    sound_notifications = models.BooleanField(default=True)
    
    # Préférences d'affichage
    items_per_page = models.IntegerField(default=25)
    default_currency_display = models.CharField(max_length=10, default="BIF")
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Préférences Utilisateur"
        verbose_name_plural = "Préférences Utilisateur"
    
    def __str__(self):
        return f"Préférences - {self.user.username}"
    
    def to_dict(self):
        """Convertir en dictionnaire pour l'API"""
        return {
            'theme': self.theme,
            'language': self.language,
            'notifications': {
                'email': self.email_notifications,
                'browser': self.browser_notifications,
                'sound': self.sound_notifications
            },
            'display': {
                'items_per_page': self.items_per_page,
                'currency_display': self.default_currency_display
            }
        }


class SystemInfo(models.Model):
    """
    Informations système pour le monitoring
    """
    version = models.CharField(max_length=20, default="1.0.0")
    database_version = models.CharField(max_length=50, default="PostgreSQL 14")
    server_info = models.CharField(max_length=100, default="Django 4.2")
    last_backup = models.DateTimeField(null=True, blank=True)
    storage_used = models.CharField(max_length=20, default="0 GB")
    memory_usage = models.CharField(max_length=20, default="0%")
    cpu_usage = models.CharField(max_length=20, default="0%")
    uptime_start = models.DateTimeField(auto_now_add=True)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Informations Système"
        verbose_name_plural = "Informations Système"
    
    def __str__(self):
        return f"Système v{self.version}"
    
    @classmethod
    def get_info(cls):
        """Récupérer les informations système (singleton pattern)"""
        info, created = cls.objects.get_or_create(pk=1)
        return info
    
    def to_dict(self):
        """Convertir en dictionnaire pour l'API"""
        from django.utils import timezone
        import datetime
        
        # Calculer l'uptime
        now = timezone.now()
        uptime_delta = now - self.uptime_start
        days = uptime_delta.days
        hours, remainder = divmod(uptime_delta.seconds, 3600)
        
        if days > 0:
            uptime = f"{days} jour{'s' if days > 1 else ''}, {hours} heure{'s' if hours > 1 else ''}"
        else:
            uptime = f"{hours} heure{'s' if hours > 1 else ''}"
        
        return {
            'version': self.version,
            'database': self.database_version,
            'server': self.server_info,
            'uptime': uptime,
            'last_backup': self.last_backup.isoformat() if self.last_backup else None,
            'storage_used': self.storage_used,
            'memory_usage': self.memory_usage,
            'cpu_usage': self.cpu_usage,
            'updated_at': self.updated_at.isoformat()
        }
