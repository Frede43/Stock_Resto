from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal

class Order(models.Model):
    """
    Modèle pour les commandes
    """
    
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('preparing', 'En préparation'),
        ('ready', 'Prête'),
        ('served', 'Servie'),
        ('cancelled', 'Annulée'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Faible'),
        ('normal', 'Normale'),
        ('high', 'Élevée'),
        ('urgent', 'Urgente'),
    ]
    
    order_number = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Numéro de commande'
    )
    
    table = models.ForeignKey(
        'sales.Table',
        on_delete=models.CASCADE,
        related_name='orders',
        null=True,
        blank=True,
        verbose_name='Table'
    )
    
    server = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='Serveur'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Statut'
    )
    
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_LEVELS,
        default='normal',
        verbose_name='Priorité'
    )
    
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Montant total'
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notes'
    )
    
    estimated_time = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Temps estimé (minutes)'
    )
    
    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name='Date de création'
    )
    
    confirmed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date de confirmation'
    )
    
    ready_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date de préparation'
    )
    
    served_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date de service'
    )
    
    class Meta:
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Commande {self.order_number} - Table {self.table.number if self.table else 'N/A'}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            # Générer un numéro de commande unique
            import uuid
            self.order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

class OrderItem(models.Model):
    """
    Articles dans une commande
    """
    
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Commande'
    )
    
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        verbose_name='Produit'
    )
    
    quantity = models.PositiveIntegerField(
        verbose_name='Quantité'
    )
    
    unit_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        verbose_name='Prix unitaire'
    )
    
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Prix total'
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notes spéciales'
    )
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'En attente'),
            ('preparing', 'En préparation'),
            ('ready', 'Prêt'),
            ('served', 'Servi'),
        ],
        default='pending',
        verbose_name='Statut'
    )
    
    class Meta:
        verbose_name = 'Article de commande'
        verbose_name_plural = 'Articles de commande'
    
    def __str__(self):
        return f"{self.product.name} x{self.quantity}"
    
    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)
