from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Sum, Avg
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Administration des catégories de produits"""

    list_display = ('name', 'type_badge', 'products_count', 'is_active', 'created_at')
    list_filter = ('type', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)

    fieldsets = (
        ('Informations générales', {
            'fields': ('name', 'type', 'description', 'is_active')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at', 'updated_at')

    def type_badge(self, obj):
        """Affiche le type avec un badge coloré"""
        colors = {
            'boissons': '#0d6efd',   # Bleu
            'plats': '#198754',      # Vert
            'snacks': '#fd7e14',     # Orange
        }
        color = colors.get(obj.type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_type_display()
        )
    type_badge.short_description = 'Type'

    def products_count(self, obj):
        """Affiche le nombre de produits dans la catégorie"""
        count = obj.products.count()
        url = reverse('admin:products_product_changelist') + f'?category__id__exact={obj.id}'
        return format_html('<a href="{}">{} produit(s)</a>', url, count)
    products_count.short_description = 'Produits'

    def get_queryset(self, request):
        """Optimise les requêtes avec prefetch"""
        return super().get_queryset(request).prefetch_related('products')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Administration des produits"""

    list_display = (
        'name', 'category', 'stock_status', 'current_stock', 'minimum_stock',
        'purchase_price', 'selling_price', 'profit_margin_display', 'is_active'
    )
    list_filter = (
        'category', 'unit', 'is_active', 'is_available',
        'created_at', 'category__type'
    )
    search_fields = ('name', 'code', 'description', 'category__name')
    ordering = ('category', 'name')

    fieldsets = (
        ('Informations générales', {
            'fields': ('name', 'category', 'code', 'description', 'unit')
        }),
        ('Prix (BIF)', {
            'fields': ('purchase_price', 'selling_price', 'case_price')
        }),
        ('Stock', {
            'fields': ('initial_stock', 'current_stock', 'minimum_stock', 'units_per_case')
        }),
        ('Statut', {
            'fields': ('is_active', 'is_available')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at', 'updated_at')

    def stock_status(self, obj):
        """Affiche le statut du stock avec des couleurs"""
        if obj.is_out_of_stock:
            return format_html(
                '<span style="background-color: #dc3545; color: white; padding: 3px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">RUPTURE</span>'
            )
        elif obj.is_low_stock:
            return format_html(
                '<span style="background-color: #fd7e14; color: white; padding: 3px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">STOCK BAS</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #198754; color: white; padding: 3px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">EN STOCK</span>'
            )
    stock_status.short_description = 'Statut Stock'

    def profit_margin_display(self, obj):
        """Affiche la marge bénéficiaire"""
        margin = obj.profit_margin
        percentage = obj.profit_percentage
        try:
            percentage_float = float(percentage)
            percentage_str = f"{percentage_float:.1f}%"
        except (ValueError, TypeError):
            percentage_str = f"{percentage}%"

        return format_html(
            '{} BIF<br><small>({})</small>',
            margin, percentage_str
        )
    profit_margin_display.short_description = 'Marge'

    actions = ['mark_as_active', 'mark_as_inactive', 'update_stock_alert']

    def mark_as_active(self, request, queryset):
        """Active les produits sélectionnés"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} produit(s) activé(s).')
    mark_as_active.short_description = "Activer les produits sélectionnés"

    def mark_as_inactive(self, request, queryset):
        """Désactive les produits sélectionnés"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} produit(s) désactivé(s).')
    mark_as_inactive.short_description = "Désactiver les produits sélectionnés"

    def update_stock_alert(self, request, queryset):
        """Met à jour le seuil d'alerte stock"""
        # Cette action pourrait ouvrir un formulaire pour définir le nouveau seuil
        self.message_user(request, 'Fonctionnalité à implémenter : mise à jour des seuils d\'alerte.')
    update_stock_alert.short_description = "Mettre à jour les seuils d'alerte"

    def get_queryset(self, request):
        """Optimise les requêtes"""
        return super().get_queryset(request).select_related('category')
