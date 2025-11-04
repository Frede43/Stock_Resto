from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal


class ExpenseCategory(models.Model):
    """Catégories de dépenses pour classification"""
    
    CATEGORY_TYPES = [
        ('operational', 'Opérationnel'),
        ('inventory', 'Inventaire/Achats'),
        ('staff', 'Personnel'),
        ('utilities', 'Charges fixes'),
        ('marketing', 'Marketing'),
        ('maintenance', 'Maintenance'),
        ('other', 'Autres'),
    ]
    
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Nom de la catégorie'
    )
    category_type = models.CharField(
        max_length=20,
        choices=CATEGORY_TYPES,
        default='other',
        verbose_name='Type de catégorie'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Description'
    )
    budget_monthly = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Budget mensuel alloué à cette catégorie",
        verbose_name='Budget mensuel'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Catégorie active'
    )
    requires_approval = models.BooleanField(
        default=False,
        help_text="Les dépenses de cette catégorie nécessitent une approbation",
        verbose_name='Nécessite approbation'
    )
    approval_threshold = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Montant au-delà duquel l'approbation est requise",
        verbose_name='Seuil d\'approbation'
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
        verbose_name = "Catégorie de dépense"
        verbose_name_plural = "Catégories de dépenses"
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    @property
    def expenses_count(self):
        """Nombre de dépenses dans cette catégorie"""
        return self.expenses.count()
    
    @property
    def total_amount(self):
        """Montant total des dépenses approuvées"""
        return self.expenses.filter(
            status='approved'
        ).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0')
    
    def get_monthly_total(self, year, month):
        """Montant total pour un mois donné"""
        return self.expenses.filter(
            status='approved',
            expense_date__year=year,
            expense_date__month=month
        ).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0')


class Expense(models.Model):
    """Dépenses de l'établissement"""
    
    PAYMENT_METHODS = [
        ('cash', 'Espèces'),
        ('card', 'Carte bancaire'),
        ('mobile', 'Mobile Money'),
        ('bank_transfer', 'Virement bancaire'),
        ('check', 'Chèque'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvée'),
        ('rejected', 'Rejetée'),
        ('paid', 'Payée'),
    ]
    
    # Informations de base
    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.PROTECT,
        related_name='expenses',
        verbose_name='Catégorie'
    )
    description = models.CharField(
        max_length=255,
        verbose_name='Description'
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Montant'
    )
    
    # Détails de paiement
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        verbose_name='Méthode de paiement'
    )
    payment_reference = models.CharField(
        max_length=100,
        blank=True,
        help_text="Numéro de transaction/chèque/référence",
        verbose_name='Référence de paiement'
    )
    
    # Documents justificatifs
    receipt_number = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Numéro de reçu'
    )
    receipt_file = models.FileField(
        upload_to='expenses/receipts/%Y/%m/',
        blank=True,
        null=True,
        help_text="Scan du reçu/facture",
        verbose_name='Fichier reçu'
    )
    
    # Fournisseur (optionnel)
    supplier = models.ForeignKey(
        'suppliers.Supplier',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses',
        verbose_name='Fournisseur'
    )
    
    # Dates
    expense_date = models.DateField(
        default=timezone.now,
        verbose_name='Date de la dépense'
    )
    due_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date d'échéance si paiement différé",
        verbose_name='Date d\'échéance'
    )
    
    # Workflow d'approbation
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Statut'
    )
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='expenses_created',
        verbose_name='Créée par'
    )
    approved_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses_approved',
        verbose_name='Approuvée par'
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date d\'approbation'
    )
    rejection_reason = models.TextField(
        blank=True,
        verbose_name='Raison du rejet'
    )
    
    # Informations complémentaires
    notes = models.TextField(
        blank=True,
        verbose_name='Notes'
    )
    is_recurring = models.BooleanField(
        default=False,
        help_text="Dépense récurrente (loyer, abonnements, etc.)",
        verbose_name='Dépense récurrente'
    )
    recurrence_period = models.CharField(
        max_length=20,
        choices=[
            ('daily', 'Quotidien'),
            ('weekly', 'Hebdomadaire'),
            ('monthly', 'Mensuel'),
            ('quarterly', 'Trimestriel'),
            ('yearly', 'Annuel'),
        ],
        blank=True,
        null=True,
        verbose_name='Période de récurrence'
    )
    
    # Métadonnées
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Date de modification'
    )
    
    class Meta:
        verbose_name = "Dépense"
        verbose_name_plural = "Dépenses"
        ordering = ['-expense_date', '-created_at']
        indexes = [
            models.Index(fields=['expense_date']),
            models.Index(fields=['status']),
            models.Index(fields=['category']),
            models.Index(fields=['created_by']),
        ]
    
    def __str__(self):
        return f"{self.description} - {self.amount} BIF ({self.expense_date})"
    
    @property
    def is_approved(self):
        """Vérifie si la dépense est approuvée"""
        return self.status == 'approved'
    
    @property
    def is_overdue(self):
        """Vérifie si la dépense est en retard"""
        if self.due_date and self.status not in ['paid', 'rejected']:
            return self.due_date < timezone.now().date()
        return False
    
    def approve(self, user):
        """Approuver la dépense"""
        self.status = 'approved'
        self.approved_by = user
        self.approved_at = timezone.now()
        self.save()
    
    def reject(self, user, reason):
        """Rejeter la dépense"""
        self.status = 'rejected'
        self.approved_by = user
        self.rejection_reason = reason
        self.approved_at = timezone.now()
        self.save()
    
    def mark_as_paid(self):
        """Marquer comme payée"""
        self.status = 'paid'
        self.save()


class ExpenseBudget(models.Model):
    """Budgets mensuels par catégorie"""
    
    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.CASCADE,
        related_name='budgets',
        verbose_name='Catégorie'
    )
    year = models.IntegerField(
        verbose_name='Année'
    )
    month = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)],
        verbose_name='Mois'
    )
    budget_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Montant budgété'
    )
    actual_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        editable=False,
        verbose_name='Montant réel'
    )
    notes = models.TextField(
        blank=True,
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
        verbose_name = "Budget de dépense"
        verbose_name_plural = "Budgets de dépenses"
        unique_together = ['category', 'year', 'month']
        ordering = ['-year', '-month']
    
    def __str__(self):
        return f"{self.category.name} - {self.month:02d}/{self.year}"
    
    @property
    def variance(self):
        """Écart budget vs réel"""
        return self.budget_amount - self.actual_amount
    
    @property
    def variance_percentage(self):
        """Écart en pourcentage"""
        if self.budget_amount > 0:
            return (self.variance / self.budget_amount) * 100
        return Decimal('0')
    
    @property
    def usage_percentage(self):
        """Pourcentage d'utilisation du budget"""
        if self.budget_amount > 0:
            return (self.actual_amount / self.budget_amount) * 100
        return Decimal('0')
    
    def update_actual_amount(self):
        """Mettre à jour le montant réel basé sur les dépenses approuvées"""
        self.actual_amount = self.category.get_monthly_total(self.year, self.month)
        self.save()
