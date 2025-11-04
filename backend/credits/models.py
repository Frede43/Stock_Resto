from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()


class CreditAccount(models.Model):
    """
    Compte crédit pour un client
    """
    STATUS_CHOICES = [
        ('active', 'Actif'),
        ('suspended', 'Suspendu'),
        ('closed', 'Fermé'),
    ]
    
    customer_name = models.CharField(max_length=255, verbose_name='Nom du client')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Téléphone')
    email = models.EmailField(blank=True, null=True, verbose_name='Email')
    address = models.TextField(blank=True, null=True, verbose_name='Adresse')
    
    # Limites de crédit
    credit_limit = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        verbose_name='Limite de crédit (FBu)'
    )
    
    # Solde actuel
    current_balance = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        verbose_name='Solde actuel (FBu)'
    )
    
    # Statut
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active',
        verbose_name='Statut'
    )
    
    # Notes
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Créé par
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_credit_accounts'
    )
    
    class Meta:
        verbose_name = 'Compte Crédit'
        verbose_name_plural = 'Comptes Crédit'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.customer_name} - {self.current_balance} FBu"
    
    @property
    def available_credit(self):
        """Crédit disponible"""
        return self.credit_limit - self.current_balance
    
    @property
    def is_over_limit(self):
        """Client a dépassé sa limite"""
        return self.current_balance > self.credit_limit


class CreditTransaction(models.Model):
    """
    Transaction de crédit (dette ou paiement)
    """
    TYPE_CHOICES = [
        ('debt', 'Dette (vente à crédit)'),
        ('payment', 'Paiement'),
        ('adjustment', 'Ajustement'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Espèces'),
        ('card', 'Carte bancaire'),
        ('mobile', 'Mobile Money'),
        ('bank_transfer', 'Virement bancaire'),
    ]
    
    credit_account = models.ForeignKey(
        CreditAccount, 
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    
    transaction_type = models.CharField(
        max_length=20, 
        choices=TYPE_CHOICES,
        verbose_name='Type'
    )
    
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        verbose_name='Montant (FBu)'
    )
    
    payment_method = models.CharField(
        max_length=20, 
        choices=PAYMENT_METHOD_CHOICES,
        blank=True,
        null=True,
        verbose_name='Méthode de paiement'
    )
    
    # Référence à la vente (si dette)
    sale = models.ForeignKey(
        'sales.Sale',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='credit_transactions'
    )
    
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    
    # Dates
    transaction_date = models.DateTimeField(auto_now_add=True)
    
    # Créé par
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='credit_transactions'
    )
    
    class Meta:
        verbose_name = 'Transaction Crédit'
        verbose_name_plural = 'Transactions Crédit'
        ordering = ['-transaction_date']
    
    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.amount} FBu"
    
    def save(self, *args, **kwargs):
        """Mettre à jour le solde du compte lors de la sauvegarde"""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            # Mettre à jour le solde du compte
            if self.transaction_type == 'debt':
                self.credit_account.current_balance += self.amount
            elif self.transaction_type == 'payment':
                self.credit_account.current_balance -= self.amount
            elif self.transaction_type == 'adjustment':
                # Ajustement peut être positif ou négatif
                self.credit_account.current_balance += self.amount
            
            self.credit_account.save()


class CreditReminder(models.Model):
    """
    Relance pour paiement de crédit
    """
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('sent', 'Envoyée'),
        ('acknowledged', 'Accusée'),
    ]
    
    credit_account = models.ForeignKey(
        CreditAccount, 
        on_delete=models.CASCADE,
        related_name='reminders'
    )
    
    reminder_date = models.DateField(verbose_name='Date de relance')
    amount_due = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        verbose_name='Montant dû (FBu)'
    )
    
    message = models.TextField(verbose_name='Message')
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    
    sent_at = models.DateTimeField(null=True, blank=True)
    sent_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='sent_reminders'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Relance Crédit'
        verbose_name_plural = 'Relances Crédit'
        ordering = ['-reminder_date']
    
    def __str__(self):
        return f"Relance {self.credit_account.customer_name} - {self.reminder_date}"
