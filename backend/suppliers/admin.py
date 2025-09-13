from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Sum
from django.urls import reverse
from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    """Administration des fournisseurs"""

    list_display = (
        'name', 'contact_person', 'phone', 'email', 'city',
        'is_active_badge', 'total_purchases', 'created_at'
    )
    list_filter = ('is_active', 'city', 'created_at')
    search_fields = ('name', 'contact_person', 'phone', 'email', 'address', 'city')
    ordering = ('name',)

    fieldsets = (
        ('Informations générales', {
            'fields': ('name', 'notes')
        }),
        ('Contact', {
            'fields': ('contact_person', 'phone', 'email', 'address', 'city')
        }),
        ('Statut', {
            'fields': ('is_active',)
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at', 'updated_at')

    def is_active_badge(self, obj):
        """Affiche le statut actif avec un badge coloré"""
        if obj.is_active:
            return format_html(
                '<span style="background-color: #198754; color: white; padding: 3px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">ACTIF</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #6c757d; color: white; padding: 3px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">INACTIF</span>'
            )
    is_active_badge.short_description = 'Statut'

    def total_purchases(self, obj):
        """Affiche le nombre total d'achats"""
        count = obj.purchases.count()
        if count > 0:
            # Lien vers les achats de ce fournisseur
            return format_html('<strong>{} achat(s)</strong>', count)
        return '0 achat'
    total_purchases.short_description = 'Achats'

    actions = ['mark_active', 'mark_inactive']

    def mark_active(self, request, queryset):
        """Active les fournisseurs sélectionnés"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} fournisseur(s) activé(s).')
    mark_active.short_description = "Activer les fournisseurs"

    def mark_inactive(self, request, queryset):
        """Désactive les fournisseurs sélectionnés"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} fournisseur(s) désactivé(s).')
    mark_inactive.short_description = "Désactiver les fournisseurs"

    def get_queryset(self, request):
        """Optimise les requêtes avec annotations"""
        return super().get_queryset(request).annotate(
            purchases_count=Count('purchases')
        )
