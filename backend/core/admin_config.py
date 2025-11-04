"""
Configuration personnalisée pour l'interface d'administration Django
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.contrib.admin import AdminSite
from django.contrib.auth.models import Group



class BarStockWiseAdminSite(AdminSite):
    """Interface d'administration personnalisée pour BarStockWise"""
    
    site_header = "Bar-Resto System" - 'Administration'
    site_title = 'Bar-Resto System Admin'
    index_title = 'Tableau de bord administrateur'
    
    def index(self, request, extra_context=None):
        """Page d'accueil personnalisée de l'admin"""
        extra_context = extra_context or {}
        
        # Statistiques rapides
        from django.apps import apps
        
        # Compter les modèles principaux
        try:
            User = apps.get_model('accounts', 'User')
            Product = apps.get_model('products', 'Product')
            Sale = apps.get_model('sales', 'Sale')
            
            stats = {
                'users_count': User.objects.filter(is_active=True).count(),
                'products_count': Product.objects.filter(is_active=True).count(),
                'sales_today': Sale.objects.filter(created_at__date=timezone.now().date()).count(),
            }
            
            extra_context['stats'] = stats
        except:
            # En cas d'erreur, on continue sans les stats
            pass
        
        return super().index(request, extra_context)


# Instance personnalisée de l'admin
admin_site = BarStockWiseAdminSite(name='barstockwise_admin')


# Configuration des groupes d'utilisateurs
def setup_user_groups():
    """Configure les groupes d'utilisateurs par défaut"""
    from django.contrib.auth.models import Group, Permission
    from django.contrib.contenttypes.models import ContentType
    
    # Groupe Gérant
    gerant_group, created = Group.objects.get_or_create(name='Gérants')
    if created:
        # Permissions pour les gérants (presque tout)
        permissions = Permission.objects.exclude(
            codename__in=['delete_user', 'add_user']  # Pas de gestion des utilisateurs
        )
        gerant_group.permissions.set(permissions)
    
    # Groupe Serveur
    serveur_group, created = Group.objects.get_or_create(name='Serveurs')
    if created:
        # Permissions limitées pour les serveurs
        allowed_models = ['sale', 'saleitem', 'table', 'product']
        permissions = Permission.objects.filter(
            content_type__model__in=allowed_models,
            codename__startswith=('view_', 'add_sale', 'change_sale')
        )
        serveur_group.permissions.set(permissions)


# Personnalisation de l'interface admin
def customize_admin_interface():
    """Personnalise l'interface d'administration"""
    
    # Masquer le modèle Group par défaut si on utilise des rôles personnalisés
    try:
        admin.site.unregister(Group)
    except:
        pass
    
    # Ajouter des styles CSS personnalisés
    admin.site.enable_nav_sidebar = True


# Fonctions utilitaires pour les admins
def get_colored_badge(value, color_map, default_color='#6c757d'):
    """Génère un badge coloré pour les valeurs"""
    color = color_map.get(value, default_color)
    return format_html(
        '<span style="background-color: {}; color: white; padding: 3px 8px; '
        'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
        color, value
    )


def get_admin_url(obj, text=None):
    """Génère un lien vers la page d'administration d'un objet"""
    if not obj:
        return '-'
    
    url = reverse(
        f'admin:{obj._meta.app_label}_{obj._meta.model_name}_change',
        args=[obj.pk]
    )
    display_text = text or str(obj)
    return format_html('<a href="{}">{}</a>', url, display_text)


def format_currency(amount, currency='BIF'):
    """Formate un montant en devise"""
    if amount is None:
        return '-'
    return format_html('{:,.0f} {}', amount, currency)


def get_status_icon(status, status_map):
    """Retourne une icône basée sur le statut"""
    icons = {
        'success': '✅',
        'warning': '⚠️',
        'error': '❌',
        'info': 'ℹ️',
        'pending': '⏳',
    }
    
    icon_type = status_map.get(status, 'info')
    return icons.get(icon_type, '❓')


# Mixins pour les admins
class TimestampAdminMixin:
    """Mixin pour afficher les timestamps de création/modification"""
    
    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(super().get_readonly_fields(request, obj))
        if hasattr(self.model, 'created_at'):
            readonly_fields.append('created_at')
        if hasattr(self.model, 'updated_at'):
            readonly_fields.append('updated_at')
        return readonly_fields


class UserTrackingAdminMixin:
    """Mixin pour tracker l'utilisateur qui crée/modifie"""
    
    def save_model(self, request, obj, form, change):
        if not change and hasattr(obj, 'created_by'):
            obj.created_by = request.user
        if hasattr(obj, 'updated_by'):
            obj.updated_by = request.user
        super().save_model(request, obj, form, change)


class BulkActionsMixin:
    """Mixin pour ajouter des actions en lot communes"""
    
    def get_actions(self, request):
        actions = super().get_actions(request)
        
        # Ajouter l'action d'export CSV si elle n'existe pas
        if 'export_as_csv' not in actions:
            actions['export_as_csv'] = (self.export_as_csv, 'export_as_csv', 'Exporter en CSV')
        
        return actions
    
    def export_as_csv(self, request, queryset):
        """Exporte les objets sélectionnés en CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{self.model._meta.verbose_name_plural}.csv"'
        
        writer = csv.writer(response)
        
        # En-têtes
        field_names = [field.verbose_name for field in self.model._meta.fields]
        writer.writerow(field_names)
        
        # Données
        for obj in queryset:
            row = []
            for field in self.model._meta.fields:
                value = getattr(obj, field.name)
                if value is None:
                    value = ''
                row.append(str(value))
            writer.writerow(row)
        
        return response
    
    export_as_csv.short_description = "Exporter les éléments sélectionnés en CSV"


# Configuration des filtres personnalisés
class DateRangeFilter(admin.SimpleListFilter):
    """Filtre par plage de dates"""
    title = 'Période'
    parameter_name = 'date_range'
    
    def lookups(self, request, model_admin):
        return (
            ('today', 'Aujourd\'hui'),
            ('yesterday', 'Hier'),
            ('this_week', 'Cette semaine'),
            ('last_week', 'Semaine dernière'),
            ('this_month', 'Ce mois'),
            ('last_month', 'Mois dernier'),
        )
    
    def queryset(self, request, queryset):
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        today = now.date()
        
        if self.value() == 'today':
            return queryset.filter(created_at__date=today)
        elif self.value() == 'yesterday':
            yesterday = today - timedelta(days=1)
            return queryset.filter(created_at__date=yesterday)
        elif self.value() == 'this_week':
            start_week = today - timedelta(days=today.weekday())
            return queryset.filter(created_at__date__gte=start_week)
        elif self.value() == 'last_week':
            start_last_week = today - timedelta(days=today.weekday() + 7)
            end_last_week = start_last_week + timedelta(days=6)
            return queryset.filter(
                created_at__date__gte=start_last_week,
                created_at__date__lte=end_last_week
            )
        elif self.value() == 'this_month':
            start_month = today.replace(day=1)
            return queryset.filter(created_at__date__gte=start_month)
        elif self.value() == 'last_month':
            if today.month == 1:
                start_last_month = today.replace(year=today.year-1, month=12, day=1)
            else:
                start_last_month = today.replace(month=today.month-1, day=1)
            
            end_last_month = today.replace(day=1) - timedelta(days=1)
            return queryset.filter(
                created_at__date__gte=start_last_month,
                created_at__date__lte=end_last_month
            )
        
        return queryset


# Initialisation
def initialize_admin():
    """Initialise la configuration de l'admin"""
    setup_user_groups()
    customize_admin_interface()
