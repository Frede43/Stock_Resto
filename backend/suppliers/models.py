from django.db import models
from django.core.validators import RegexValidator

class Supplier(models.Model):
    """
    Modèle pour les fournisseurs
    """

    SUPPLIER_TYPES = [
        ('beverages', 'Boissons'),
        ('food', 'Produits alimentaires'),
        ('ingredients', 'Ingrédients pour recettes'),
        ('equipment', 'Équipements'),
        ('cleaning', 'Produits d\'entretien'),
        ('other', 'Autres'),
    ]

    name = models.CharField(
        max_length=200,
        verbose_name='Nom du fournisseur'
    )

    supplier_type = models.CharField(
        max_length=20,
        choices=SUPPLIER_TYPES,
        default='other',
        verbose_name='Type de fournisseur'
    )

    contact_person = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Personne de contact'
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Téléphone'
    )

    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name='Email'
    )

    address = models.TextField(
        blank=True,
        null=True,
        verbose_name='Adresse'
    )

    city = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Ville'
    )

    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notes'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Fournisseur actif'
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
        verbose_name = 'Fournisseur'
        verbose_name_plural = 'Fournisseurs'
        ordering = ['name']

    def __str__(self):
        return self.name
