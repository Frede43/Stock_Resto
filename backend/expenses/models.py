from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
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
    
    # Nouveaux champs pour l'approbation
    is_approved = models.BooleanField(
        default=False,
        verbose_name='Approuvée'
    )
    
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_expenses',
        verbose_name='Approuvé par'
    )
    
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date d\'approbation'
    )
    
    rejection_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name='Raison du rejet'
    )
    
    receipt_file = models.FileField(
        upload_to='expenses/receipts/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Fichier reçu/facture'
    )
    
    supplier_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Nom du fournisseur (texte libre)'
    )

    class Meta:
        verbose_name = 'Dépense'
        verbose_name_plural = 'Dépenses'
        ordering = ['-expense_date']

    def __str__(self):
        return f"{self.reference} - {self.description} - {self.amount} BIF"


class BudgetSetting(models.Model):
    """
    Paramètres de budget mensuel par catégorie
    """
    
    category = models.OneToOneField(
        ExpenseCategory,
        on_delete=models.CASCADE,
        related_name='budget_setting',
        verbose_name='Catégorie'
    )
    
    monthly_budget = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Budget mensuel (BIF)'
    )
    
    alert_threshold = models.IntegerField(
        default=80,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Seuil d\'alerte (%)',
        help_text='Pourcentage du budget pour déclencher une alerte'
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name='Actif'
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
        verbose_name = 'Paramètre de budget'
        verbose_name_plural = 'Paramètres de budget'
        ordering = ['category__name']
    
    def __str__(self):
        return f"{self.category.name} - {self.monthly_budget} BIF/mois"
    
    def get_current_month_spent(self):
        """Calcule le montant dépensé ce mois"""
        from django.utils import timezone
        from django.db.models import Sum
        
        now = timezone.now()
        spent = Expense.objects.filter(
            category=self.category,
            expense_date__year=now.year,
            expense_date__month=now.month,
            is_approved=True
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        return spent
    
    def get_budget_percentage(self):
        """Calcule le pourcentage du budget utilisé"""
        spent = self.get_current_month_spent()
        if self.monthly_budget > 0:
            return float((spent / self.monthly_budget) * 100)
        return 0.0
    
    def is_over_threshold(self):
        """Vérifie si le seuil d'alerte est dépassé"""
        return self.get_budget_percentage() >= self.alert_threshold
    
    def is_over_budget(self):
        """Vérifie si le budget est dépassé"""
        return self.get_budget_percentage() > 100
