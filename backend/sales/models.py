from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
from datetime import timedelta
from django.contrib.auth import get_user_model
from products.models import Product

class Table(models.Model):
    """
    Modèle pour les tables du restaurant
    """

    STATUS_CHOICES = [
        ('available', 'Disponible'),
        ('occupied', 'Occupée'),
        ('reserved', 'Réservée'),
        ('cleaning', 'Nettoyage'),
    ]

    number = models.CharField(
        max_length=10,
        unique=True,
        verbose_name='Numéro de table'
    )

    capacity = models.PositiveIntegerField(
        default=4,
        verbose_name='Capacité (personnes)'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='available',
        verbose_name='Statut'
    )

    location = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Emplacement'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Table active'
    )

    # Informations supplémentaires
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notes'
    )

    # Temps d'occupation
    occupied_since = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Occupée depuis'
    )

    # Serveur assigné
    server = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Serveur assigné'
    )

    # Client/Réservation
    customer = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Client/Réservation'
    )

    last_cleaned = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Dernier nettoyage'
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
        verbose_name = 'Table'
        verbose_name_plural = 'Tables'
        ordering = ['number']

    def __str__(self):
        return f"Table {self.number}"

    @property
    def is_occupied(self):
        """Vérifie si la table est occupée"""
        return self.status == 'occupied'

    @property
    def is_available(self):
        """Vérifie si la table est disponible"""
        return self.status == 'available' and self.is_active

    @property
    def occupation_duration(self):
        """Durée d'occupation en minutes"""
        if self.occupied_since and self.is_occupied:
            from django.utils import timezone
            duration = timezone.now() - self.occupied_since
            return int(duration.total_seconds() / 60)
        return 0

    @property
    def current_sale(self):
        """Vente en cours pour cette table"""
        return self.sales.filter(status__in=['pending', 'preparing', 'ready', 'served']).first()

    def occupy(self, user=None):
        """Marque la table comme occupée"""
        from django.utils import timezone
        self.status = 'occupied'
        self.occupied_since = timezone.now()
        self.save()

    def free(self, user=None):
        """Libère la table"""
        self.status = 'available'
        self.occupied_since = None
        self.save()

    def start_cleaning(self, user=None):
        """Met la table en nettoyage"""
        self.status = 'cleaning'
        self.save()

    def finish_cleaning(self, user=None):
        """Termine le nettoyage"""
        from django.utils import timezone
        self.status = 'available'
        self.last_cleaned = timezone.now()
        self.save()


class TableReservation(models.Model):
    """
    Modèle pour les réservations de tables
    """

    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('seated', 'Installée'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
        ('no_show', 'Absent'),
    ]

    table = models.ForeignKey(
        Table,
        on_delete=models.CASCADE,
        related_name='reservations',
        verbose_name='Table'
    )

    customer_name = models.CharField(
        max_length=100,
        verbose_name='Nom du client'
    )

    customer_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Téléphone'
    )

    customer_email = models.EmailField(
        blank=True,
        null=True,
        verbose_name='Email'
    )

    party_size = models.PositiveIntegerField(
        verbose_name='Nombre de personnes'
    )

    reservation_date = models.DateField(
        verbose_name='Date de réservation'
    )

    reservation_time = models.TimeField(
        verbose_name='Heure de réservation'
    )

    duration_minutes = models.PositiveIntegerField(
        default=120,
        verbose_name='Durée prévue (minutes)'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Statut'
    )

    special_requests = models.TextField(
        blank=True,
        null=True,
        verbose_name='Demandes spéciales'
    )

    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notes internes'
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_reservations',
        verbose_name='Créé par'
    )

    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='confirmed_reservations',
        verbose_name='Confirmé par'
    )

    seated_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Installé à'
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
        verbose_name = 'Réservation'
        verbose_name_plural = 'Réservations'
        ordering = ['reservation_date', 'reservation_time']
        unique_together = ['table', 'reservation_date', 'reservation_time']

    def __str__(self):
        return f"Réservation {self.customer_name} - Table {self.table.number} - {self.reservation_date} {self.reservation_time}"

    @property
    def is_today(self):
        """Vérifie si la réservation est pour aujourd'hui"""
        from django.utils import timezone
        return self.reservation_date == timezone.now().date()

    @property
    def is_upcoming(self):
        """Vérifie si la réservation est à venir"""
        from django.utils import timezone
        now = timezone.now()
        reservation_datetime = timezone.datetime.combine(
            self.reservation_date,
            self.reservation_time
        )
        return reservation_datetime > now

    @property
    def is_overdue(self):
        """Vérifie si la réservation est en retard"""
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        reservation_datetime = timezone.datetime.combine(
            self.reservation_date,
            self.reservation_time
        )
        # Considéré en retard après 15 minutes
        return now > (reservation_datetime + timedelta(minutes=15)) and self.status == 'confirmed'

    def confirm(self, user):
        """Confirme la réservation"""
        self.status = 'confirmed'
        self.confirmed_by = user
        self.save()

    def seat(self, user):
        """Marque la réservation comme installée"""
        from django.utils import timezone
        self.status = 'seated'
        self.seated_at = timezone.now()
        self.table.occupy(user)
        self.save()

    def cancel(self, reason=None):
        """Annule la réservation"""
        self.status = 'cancelled'
        if reason:
            self.notes = f"{self.notes or ''}\nAnnulé: {reason}".strip()
        self.save()


class OrderManager(models.Manager):
    """Manager pour les commandes en cours (cuisine)"""
    def get_queryset(self):
        return super().get_queryset().filter(
            status__in=['pending', 'preparing', 'ready']
        ).select_related('table', 'server', 'created_by').prefetch_related('items__product')


class CompletedSaleManager(models.Manager):
    """Manager pour les ventes complètes (payées)"""
    def get_queryset(self):
        return super().get_queryset().filter(
            status='paid'
        ).select_related('table', 'server', 'created_by').prefetch_related('items__product')


class Sale(models.Model):
    """
    Modèle pour les ventes/commandes
    """

    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('preparing', 'En préparation'),
        ('ready', 'Prêt'),
        ('served', 'Servi'),
        ('paid', 'Payé'),
        ('cancelled', 'Annulé'),
    ]

    PAYMENT_METHODS = [
        ('cash', 'Espèces'),
        ('card', 'Carte'),
        ('mobile', 'Mobile Money'),
        ('credit', 'Crédit'),
    ]

    reference = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Référence de vente'
    )

    table = models.ForeignKey(
        Table,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='sales',
        verbose_name='Table'
    )

    customer_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Nom du client'
    )

    server = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sales',
        blank=True,
        null=True,
        verbose_name='Serveur'
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_sales',
        null=True,
        blank=True,
        verbose_name='Créé par'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Statut'
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        blank=True,
        null=True,
        verbose_name='Mode de paiement'
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        verbose_name='Sous-total (BIF)'
    )

    tax_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        verbose_name='Montant TVA (BIF)'
    )

    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        verbose_name='Remise (BIF)'
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        verbose_name='Montant total (BIF)'
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

    paid_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Date de paiement'
    )

    # Managers
    objects = models.Manager()        # Manager par défaut (toutes les ventes)
    orders = OrderManager()           # Commandes en cours (pending, preparing, ready)
    completed = CompletedSaleManager() # Ventes complètes (paid)

    class Meta:
        verbose_name = 'Vente'
        verbose_name_plural = 'Ventes'
        ordering = ['-created_at']

    def __str__(self):
        return f"Vente {self.reference} - {self.total_amount} BIF"

    def save(self, *args, **kwargs):
        # Générer automatiquement la référence si elle n'existe pas
        if not self.reference:
            from django.utils import timezone
            import uuid
            
            # Format: SALE-YYYYMMDD-HHMMSS-UUID4
            timestamp = timezone.now().strftime('%Y%m%d-%H%M%S')
            unique_id = str(uuid.uuid4())[:8]
            self.reference = f"SALE-{timestamp}-{unique_id}"
        
        super().save(*args, **kwargs)

    @property
    def profit(self):
        """Calcule le bénéfice total de la vente"""
        total_profit = Decimal('0.00')
        for item in self.items.all():
            total_profit += item.profit
        return total_profit

    @property
    def final_amount(self):
        """Calcule le montant final après remise"""
        return self.total_amount - (self.discount_amount or Decimal('0.00'))

    @property
    def is_order(self):
        """Vérifie si c'est une commande en cours (pas encore payée)"""
        return self.status in ['pending', 'preparing', 'ready', 'served']
    
    @property
    def is_completed(self):
        """Vérifie si c'est une vente complète et payée"""
        return self.status == 'paid'
    
    @property
    def is_in_kitchen(self):
        """Vérifie si la commande est en cours de préparation"""
        return self.status in ['preparing', 'ready']
    
    @property
    def can_be_cancelled(self):
        """Vérifie si la commande peut être annulée"""
        return self.status in ['pending', 'preparing']
    
    @property
    def can_be_modified(self):
        """Vérifie si la vente peut être modifiée"""
        return self.status not in ['paid', 'cancelled']
    
    @property
    def time_since_creation(self):
        """Temps écoulé depuis la création"""
        return timezone.now() - self.created_at
    
    def get_preparation_time(self):
        """Calcule le temps de préparation (si applicable)"""
        if self.status in ['ready', 'served', 'paid'] and self.updated_at:
            return self.updated_at - self.created_at
        return None

    def mark_as_paid(self, user=None):
        """
        Marque la vente comme payée et met à jour le stock
        """
        if self.status == 'paid':
            return  # Déjà payé

        # Mettre à jour le stock pour chaque item
        for item in self.items.all():
            # Vérifier si le produit a une recette
            if hasattr(item.product, 'recipe') and item.product.recipe:
                # Pour les plats avec recette, décompter les ingrédients
                try:
                    # Consommer les ingrédients de la recette pour la quantité vendue
                    item.product.recipe.consume_ingredients(quantity=item.quantity, user=user)
                except Exception as e:
                    raise ValueError(f"Impossible de préparer {item.product.name}: {str(e)}")
            else:
                # Pour les produits simples, décompter le stock produit
                if item.product.current_stock >= item.quantity:
                    item.product.current_stock -= item.quantity
                    item.product.save()
                else:
                    raise ValueError(f"Stock insuffisant pour {item.product.name}")
            
            # Créer un mouvement de stock pour tracer la sortie
            try:
                from inventory.models import StockMovement
                stock_before = item.product.current_stock + item.quantity  # Stock avant la sortie
                stock_after = item.product.current_stock  # Stock après la sortie
                
                StockMovement.objects.create(
                    product=item.product,
                    movement_type='out',
                    reason='sale',
                    quantity=item.quantity,
                    stock_before=stock_before,
                    stock_after=stock_after,
                    unit_price=item.unit_price,
                    reference=f"SALE-{self.id}",
                    notes=f"Vente #{self.id} - {item.product.name}",
                    user=user if user else self.created_by
                )
                print(f" Mouvement de stock créé: {item.product.name} - {item.quantity} sortie(s)")
            except Exception as e:
                print(f" Erreur création mouvement de stock: {e}")
                # Ne pas bloquer la vente si le mouvement échoue

        # Marquer comme payé
        self.status = 'paid'
        self.paid_at = timezone.now()
        self.save()

        # Libérer la table si elle était occupée
        if self.table and self.table.status == 'occupied':
            self.table.free(user)

    def cancel_sale(self, reason=None):
        """
        Annule la vente et remet le stock si nécessaire
        """
        if self.status == 'paid':
            # Remettre le stock si la vente était déjà payée
            for item in self.items.all():
                item.product.current_stock += item.quantity
                item.product.save()

        self.status = 'cancelled'
        if reason:
            self.notes = f"{self.notes or ''}\nAnnulé: {reason}".strip()
        self.save()


class SaleItem(models.Model):
    """
    Détails des articles dans une vente
    """

    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Vente'
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
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Prix unitaire (BIF)'
    )

    total_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Prix total (BIF)'
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

    class Meta:
        verbose_name = 'Article de vente'
        verbose_name_plural = 'Articles de vente'
        unique_together = ['sale', 'product']

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"

    @property
    def profit(self):
        """Calcule le bénéfice pour cet article"""
        return (self.unit_price - self.product.purchase_price) * self.quantity

    def save(self, *args, **kwargs):
        # Calculer le prix total
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)
