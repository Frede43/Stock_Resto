from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.conf import settings

class ExpenseCategory(models.Model):
    """
    Catégories de dépenses
    """

    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Nom de la catégorie'
    )

    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Description'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Catégorie active'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )

    class Meta:
        verbose_name = 'Catégorie de dépense'
        verbose_name_plural = 'Catégories de dépenses'
        ordering = ['name']

    def __str__(self):
        return self.name


class Expense(models.Model):
    """
    Modèle pour les dépenses
    """

    PAYMENT_METHODS = [
        ('cash', 'Espèces'),
        ('card', 'Carte'),
        ('mobile', 'Mobile Money'),
        ('bank_transfer', 'Virement bancaire'),
        ('check', 'Chèque'),
    ]

    reference = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Référence'
    )

    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.CASCADE,
        related_name='expenses',
        verbose_name='Catégorie'
    )

    description = models.CharField(
        max_length=200,
        verbose_name='Description'
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Montant (BIF)'
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        verbose_name='Mode de paiement'
    )

    supplier = models.ForeignKey(
        'suppliers.Supplier',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        verbose_name='Fournisseur'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name='Utilisateur'
    )

    receipt_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Numéro de reçu'
    )

    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notes'
    )

    expense_date = models.DateTimeField(
        verbose_name='Date de dépense'
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
        verbose_name = 'Dépense'
        verbose_name_plural = 'Dépenses'
        ordering = ['-expense_date']

    def __str__(self):
        return f"{self.reference} - {self.description} - {self.amount} BIF"
