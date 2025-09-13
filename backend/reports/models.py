from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.conf import settings

class DailyReport(models.Model):
    """
    Modèle pour les rapports journaliers
    """

    date = models.DateField(
        unique=True,
        verbose_name='Date du rapport'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name='Utilisateur'
    )

    # Ventes
    total_sales = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        verbose_name='Total des ventes (BIF)'
    )

    total_profit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        verbose_name='Bénéfice total (BIF)'
    )

    number_of_sales = models.PositiveIntegerField(
        default=0,
        verbose_name='Nombre de ventes'
    )

    # Dépenses
    total_expenses = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        verbose_name='Total des dépenses (BIF)'
    )

    # Stock
    stock_alerts_count = models.PositiveIntegerField(
        default=0,
        verbose_name='Nombre d\'alertes stock'
    )

    out_of_stock_count = models.PositiveIntegerField(
        default=0,
        verbose_name='Produits en rupture'
    )

    # Résumé
    net_result = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Résultat net (BIF)'
    )

    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notes'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Date de modification'
    )

    class Meta:
        verbose_name = 'Rapport journalier'
        verbose_name_plural = 'Rapports journaliers'
        ordering = ['-date']

    def __str__(self):
        return f"Rapport du {self.date}"

    def generate_report_data(self):
        """Générer automatiquement les données du rapport"""
        from sales.models import Sale
        from django.db.models import Sum, Count

        # Ventes du jour
        daily_sales = Sale.objects.filter(created_at__date=self.date)

        # Calculs
        self.total_sales = daily_sales.count()

        paid_sales = daily_sales.filter(status='paid')
        self.total_revenue = paid_sales.aggregate(total=Sum('final_amount'))['total'] or 0
        self.total_discount = daily_sales.aggregate(total=Sum('discount_amount'))['total'] or 0

        # Ventes par méthode de paiement
        self.cash_sales = paid_sales.filter(payment_method='cash').count()
        self.mobile_sales = paid_sales.filter(payment_method='mobile').count()
        self.pending_sales = daily_sales.filter(status='pending').count()

        # Produits vendus
        from sales.models import SaleItem
        self.products_sold = SaleItem.objects.filter(
            sale__in=paid_sales
        ).aggregate(total=Sum('quantity'))['total'] or 0

        # Alertes de stock
        from products.models import Product
        from django.db import models

        self.low_stock_alerts = Product.objects.filter(
            current_stock__lte=models.F('minimum_stock'),
            current_stock__gt=0,
            is_active=True
        ).count()

        self.out_of_stock_alerts = Product.objects.filter(
            current_stock=0,
            is_active=True
        ).count()

        self.save()

    def save(self, *args, **kwargs):
        # Calculer le résultat net
        self.net_result = self.total_profit - self.total_expenses
        super().save(*args, **kwargs)


class StockAlert(models.Model):
    """
    Modèle pour les alertes de stock
    """

    ALERT_TYPES = [
        ('low_stock', 'Stock faible'),
        ('out_of_stock', 'Rupture de stock'),
        ('expiry_soon', 'Expiration proche'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('resolved', 'Résolue'),
        ('ignored', 'Ignorée'),
    ]

    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='alerts',
        verbose_name='Produit'
    )

    alert_type = models.CharField(
        max_length=20,
        choices=ALERT_TYPES,
        verbose_name='Type d\'alerte'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='Statut'
    )

    current_stock = models.PositiveIntegerField(
        verbose_name='Stock actuel'
    )

    threshold = models.PositiveIntegerField(
        verbose_name='Seuil d\'alerte'
    )

    message = models.TextField(
        verbose_name='Message d\'alerte'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )

    resolved_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Date de résolution'
    )

    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        verbose_name='Résolu par'
    )

    class Meta:
        verbose_name = 'Alerte de stock'
        verbose_name_plural = 'Alertes de stock'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product.name} - {self.get_alert_type_display()}"
