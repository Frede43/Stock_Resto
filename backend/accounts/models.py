from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator

class User(AbstractUser):
    """
    Modèle utilisateur personnalisé avec système de rôles
    basé sur le cahier des charges du bar-restaurant
    """

    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('manager', 'Manager'),
        ('server', 'Serveur'),
        ('cashier', 'Caissier'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='server',
        verbose_name='Rôle'
    )
# 
    phone = models.CharField(
        max_length=15,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$')],
        blank=True,
        null=True,
        verbose_name='Téléphone'
    )

    address = models.TextField(
        blank=True,
        null=True,
        verbose_name='Adresse'
    )

    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        verbose_name='Photo de profil'
    )

    is_active_session = models.BooleanField(
        default=False,
        verbose_name='Session active'
    )

    last_activity = models.DateTimeField(
        auto_now=True,
        verbose_name='Dernière activité'
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
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_admin(self):
        """Vérifie si l'utilisateur est admin"""
        return self.role == 'admin'

    @property
    def is_manager(self):
        """Vérifie si l'utilisateur est manager"""
        return self.role == 'manager'

    @property
    def is_server(self):
        """Vérifie si l'utilisateur est serveur"""
        return self.role == 'server'

    @property
    def is_cashier(self):
        """Vérifie si l'utilisateur est caissier"""
        return self.role == 'cashier'

    def can_manage_users(self):
        """Peut gérer les utilisateurs"""
        return self.role in ['admin', 'manager']

    def can_manage_products(self):
        """Peut ajouter/modifier des produits (création/suppression)"""
        return self.role in ['admin', 'manager']
    
    def can_edit_products(self):
        """Peut modifier des produits existants (prix, stock, disponibilité)"""
        return self.role in ['admin', 'manager', 'cashier']

    def can_make_sales(self):
        """Peut effectuer des ventes"""
        return self.role in ['admin', 'manager', 'server', 'cashier']

    def can_view_sales_history(self):
        """Peut voir l'historique des ventes"""
        return self.role in ['admin', 'manager', 'cashier']

    def can_manage_inventory(self):
        """Peut gérer les approvisionnements"""
        return self.role in ['admin', 'manager']

    def can_view_stock_alerts(self):
        """Peut voir les stocks et alertes"""
        return self.role in ['admin', 'manager']

    def can_generate_reports(self):
        """Peut générer des rapports"""
        return self.role in ['admin', 'manager']

    def can_manage_expenses(self):
        """Peut enregistrer des dépenses"""
        return self.role in ['admin', 'manager']

    def can_delete_records(self):
        """Peut supprimer des enregistrements"""
        return self.role == 'admin'

    def can_manage_database(self):
        """Peut gérer la base de données"""
        return self.role == 'admin'

    def can_manage_tables(self):
        """Peut gérer les tables (créer, modifier)"""
        return self.role in ['admin', 'manager', 'server', 'cashier']

    def can_delete_tables(self):
        """Peut supprimer des tables"""
        return self.role in ['admin', 'manager']

    def has_permission(self, permission_code):
        """
        Vérifie si l'utilisateur a une permission spécifique
        """
        # Les admins ont toutes les permissions
        if self.role == 'admin':
            return True

        # Vérifier les permissions personnalisées
        return self.custom_permissions.filter(
            permission__code=permission_code,
            permission__is_active=True,
            is_active=True
        ).exists()

    def get_permissions(self):
        """
        Retourne toutes les permissions de l'utilisateur
        """
        # Utiliser apps.get_model pour éviter les références circulaires
        from django.apps import apps
        PermissionModel = apps.get_model('accounts', 'Permission')

        if self.role == 'admin':
            # Les admins ont toutes les permissions
            return PermissionModel.objects.filter(is_active=True)

        # Permissions personnalisées
        return PermissionModel.objects.filter(
            user_assignments__user=self,
            user_assignments__is_active=True,
            is_active=True
        ).distinct()

    def get_permissions_by_category(self):
        """
        Retourne les permissions groupées par catégorie
        """
        permissions = self.get_permissions()
        grouped = {}

        for permission in permissions:
            category = permission.category
            if category not in grouped:
                grouped[category] = []
            grouped[category].append({
                'code': permission.code,
                'name': permission.name,
                'description': permission.description
            })

        return grouped


class UserActivity(models.Model):
    """
    Modèle pour tracer les activités des utilisateurs
    """

    ACTION_CHOICES = [
        ('login', 'Connexion'),
        ('logout', 'Déconnexion'),
        ('create', 'Création'),
        ('update', 'Modification'),
        ('delete', 'Suppression'),
        ('view', 'Consultation'),
        ('sale', 'Vente'),
        ('inventory', 'Inventaire'),
        ('report', 'Rapport'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='activities',
        verbose_name='Utilisateur'
    )

    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        verbose_name='Action'
    )

    description = models.TextField(
        verbose_name='Description'
    )

    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
        verbose_name='Adresse IP'
    )

    user_agent = models.TextField(
        blank=True,
        null=True,
        verbose_name='User Agent'
    )

    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Horodatage'
    )

    class Meta:
        verbose_name = 'Activité utilisateur'
        verbose_name_plural = 'Activités utilisateurs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} - {self.get_action_display()} - {self.timestamp}"


class Permission(models.Model):
    """
    Modèle pour les permissions granulaires du système
    """

    PERMISSION_CATEGORIES = [
        ('sales', 'Ventes'),
        ('products', 'Produits'),
        ('stocks', 'Stocks'),
        ('tables', 'Tables'),
        ('orders', 'Commandes'),
        ('kitchen', 'Cuisine'),
        ('reports', 'Rapports'),
        ('analytics', 'Analyses'),
        ('users', 'Utilisateurs'),
        ('suppliers', 'Fournisseurs'),
        ('expenses', 'Dépenses'),
        ('settings', 'Paramètres'),
    ]

    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Code permission'
    )

    name = models.CharField(
        max_length=100,
        verbose_name='Nom de la permission'
    )

    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Description'
    )

    category = models.CharField(
        max_length=20,
        choices=PERMISSION_CATEGORIES,
        verbose_name='Catégorie'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Permission active'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )

    class Meta:
        verbose_name = 'Permission'
        verbose_name_plural = 'Permissions'
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class UserPermission(models.Model):
    """
    Modèle pour associer des permissions spécifiques aux utilisateurs
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='custom_permissions',
        verbose_name='Utilisateur'
    )

    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name='user_assignments',
        verbose_name='Permission'
    )

    granted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='granted_permissions',
        verbose_name='Accordée par'
    )

    granted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date d\'attribution'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Permission active'
    )

    class Meta:
        verbose_name = 'Permission utilisateur'
        verbose_name_plural = 'Permissions utilisateurs'
        unique_together = ['user', 'permission']
        ordering = ['-granted_at']

    def __str__(self):
        return f"{self.user.username} - {self.permission.name}"
