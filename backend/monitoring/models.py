from django.db import models
from django.conf import settings
from django.utils import timezone
import json

class SystemMetric(models.Model):
    """
    Modèle pour les métriques système
    """
    
    METRIC_TYPES = [
        ('cpu', 'CPU'),
        ('memory', 'Mémoire'),
        ('disk', 'Disque'),
        ('network', 'Réseau'),
        ('database', 'Base de données'),
        ('api_response_time', 'Temps de réponse API'),
        ('active_users', 'Utilisateurs actifs'),
        ('sales_per_hour', 'Ventes par heure'),
    ]
    
    metric_type = models.CharField(
        max_length=50,
        choices=METRIC_TYPES,
        verbose_name='Type de métrique'
    )
    
    value = models.FloatField(
        verbose_name='Valeur'
    )
    
    unit = models.CharField(
        max_length=20,
        verbose_name='Unité',
        help_text='%, MB, ms, etc.'
    )
    
    timestamp = models.DateTimeField(
        default=timezone.now,
        verbose_name='Horodatage'
    )
    
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Métadonnées'
    )
    
    class Meta:
        verbose_name = 'Métrique système'
        verbose_name_plural = 'Métriques système'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['metric_type', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.get_metric_type_display()}: {self.value}{self.unit}"

class SystemAlert(models.Model):
    """
    Alertes système basées sur les métriques
    """
    
    SEVERITY_LEVELS = [
        ('info', 'Information'),
        ('warning', 'Avertissement'),
        ('error', 'Erreur'),
        ('critical', 'Critique'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('acknowledged', 'Acquittée'),
        ('resolved', 'Résolue'),
    ]
    
    title = models.CharField(
        max_length=200,
        verbose_name='Titre'
    )
    
    message = models.TextField(
        verbose_name='Message'
    )
    
    severity = models.CharField(
        max_length=20,
        choices=SEVERITY_LEVELS,
        default='info',
        verbose_name='Sévérité'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='Statut'
    )
    
    metric = models.ForeignKey(
        SystemMetric,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='Métrique liée'
    )
    
    threshold_value = models.FloatField(
        null=True,
        blank=True,
        verbose_name='Valeur seuil'
    )
    
    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name='Date de création'
    )
    
    acknowledged_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date d\'acquittement'
    )
    
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Acquittée par'
    )
    
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date de résolution'
    )
    
    class Meta:
        verbose_name = 'Alerte système'
        verbose_name_plural = 'Alertes système'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_severity_display()} - {self.title}"

class PerformanceLog(models.Model):
    """
    Logs de performance pour les endpoints API
    """
    
    endpoint = models.CharField(
        max_length=200,
        verbose_name='Endpoint'
    )
    
    method = models.CharField(
        max_length=10,
        verbose_name='Méthode HTTP'
    )
    
    response_time = models.FloatField(
        verbose_name='Temps de réponse (ms)'
    )
    
    status_code = models.IntegerField(
        verbose_name='Code de statut'
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Utilisateur'
    )
    
    timestamp = models.DateTimeField(
        default=timezone.now,
        verbose_name='Horodatage'
    )
    
    class Meta:
        verbose_name = 'Log de performance'
        verbose_name_plural = 'Logs de performance'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['endpoint', '-timestamp']),
            models.Index(fields=['status_code', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.method} {self.endpoint} - {self.response_time}ms"
