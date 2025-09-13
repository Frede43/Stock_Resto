from django.db import models
from django.conf import settings
from django.utils import timezone

class Alert(models.Model):
    """
    Modèle pour les alertes système
    """
    
    ALERT_TYPES = [
        ('stock', 'Stock'),
        ('sales', 'Ventes'),
        ('system', 'Système'),
        ('security', 'Sécurité'),
        ('maintenance', 'Maintenance'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Faible'),
        ('medium', 'Moyen'),
        ('high', 'Élevé'),
        ('critical', 'Critique'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('resolved', 'Résolue'),
        ('archived', 'Archivée'),
    ]
    
    type = models.CharField(
        max_length=20,
        choices=ALERT_TYPES,
        verbose_name='Type d\'alerte'
    )
    
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_LEVELS,
        default='medium',
        verbose_name='Priorité'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='Statut'
    )
    
    title = models.CharField(
        max_length=200,
        verbose_name='Titre'
    )
    
    message = models.TextField(
        verbose_name='Message'
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_alerts',
        null=True,
        blank=True,
        verbose_name='Créé par'
    )
    
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='resolved_alerts',
        null=True,
        blank=True,
        verbose_name='Résolu par'
    )
    
    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name='Date de création'
    )
    
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date de résolution'
    )
    
    # Champs optionnels pour lier à d'autres objets
    related_product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='Produit lié'
    )
    
    related_sale = models.ForeignKey(
        'sales.Sale',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='Vente liée'
    )
    
    class Meta:
        verbose_name = 'Alerte'
        verbose_name_plural = 'Alertes'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.get_priority_display()} - {self.title}"
    
    def resolve(self, user=None):
        """Marquer l'alerte comme résolue"""
        self.status = 'resolved'
        self.resolved_at = timezone.now()
        if user:
            self.resolved_by = user
        self.save()
