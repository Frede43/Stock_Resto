from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Count, Q
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import StockMovement, Purchase, PurchaseItem


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    """Administration des mouvements de stock"""

    list_display = (
        'product', 'movement_type_badge', 'reason_badge', 'quantity',
        'stock_before', 'stock_after', 'user', 'created_at'
    )
    list_filter = (
        'movement_type', 'reason', 'created_at', 'product__category', 'user'
    )
    search_fields = ('product__name', 'reference', 'notes', 'user__username')
    ordering = ('-created_at',)

    fieldsets = (
        ('Informations générales', {
            'fields': ('product', 'movement_type', 'reason', 'quantity')
        }),
        ('Stock', {
            'fields': ('stock_before', 'stock_after', 'unit_price', 'total_amount')
        }),
        ('Détails', {
            'fields': ('reference', 'notes', 'user')
        }),
        ('Dates', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at',)

    def movement_type_badge(self, obj):
        """Affiche le type de mouvement avec un badge coloré"""
        colors = {
            'in': '#198754',         # Vert
            'out': '#dc3545',        # Rouge
            'adjustment': '#fd7e14', # Orange
            'loss': '#6c757d',       # Gris
            'return': '#0d6efd',     # Bleu
        }
        color = colors.get(obj.movement_type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_movement_type_display()
        )
    movement_type_badge.short_description = 'Type'

    def reason_badge(self, obj):
        """Affiche la raison avec un badge coloré"""
        colors = {
            'purchase': '#198754',    # Vert
            'sale': '#0d6efd',        # Bleu
            'inventory': '#6f42c1',   # Violet
            'damage': '#dc3545',      # Rouge
            'expiry': '#fd7e14',      # Orange
            'theft': '#dc3545',       # Rouge
            'correction': '#ffc107',  # Jaune
        }
        color = colors.get(obj.reason, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_reason_display()
        )
    reason_badge.short_description = 'Raison'

    def has_add_permission(self, request):
        """Limite l'ajout manuel de mouvements"""
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        """Limite la modification des mouvements"""
        return request.user.is_superuser

    def get_queryset(self, request):
        """Optimise les requêtes"""
        return super().get_queryset(request).select_related('product', 'user')



class PurchaseItemInline(admin.TabularInline):
    """Inline pour les articles d'achat"""
    model = PurchaseItem
    extra = 0
    readonly_fields = ('total_price',)


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    """Administration des achats"""

    list_display = (
        'reference', 'supplier', 'status_badge', 'total_amount',
        'items_count', 'user', 'order_date'
    )
    list_filter = ('status', 'supplier', 'order_date', 'delivery_date')
    search_fields = ('reference', 'supplier__name', 'notes', 'user__username')
    ordering = ('-order_date',)

    fieldsets = (
        ('Informations générales', {
            'fields': ('reference', 'supplier', 'user')
        }),
        ('Statut et dates', {
            'fields': ('status', 'delivery_date')
        }),
        ('Montants (BIF)', {
            'fields': ('total_amount',)
        }),
        ('Détails', {
            'fields': ('notes',)
        }),
        ('Dates système', {
            'fields': ('order_date', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at', 'updated_at', 'reference', 'order_date')
    inlines = [PurchaseItemInline]

    def status_badge(self, obj):
        """Affiche le statut avec un badge coloré"""
        colors = {
            'pending': '#6c757d',     # Gris
            'ordered': '#fd7e14',     # Orange
            'delivered': '#198754',   # Vert
            'cancelled': '#dc3545',   # Rouge
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Statut'

    def items_count(self, obj):
        """Affiche le nombre d'articles dans l'achat"""
        count = obj.items.count()
        return f"{count} article(s)"
    items_count.short_description = 'Articles'

    actions = ['mark_delivered', 'mark_cancelled']

    def mark_delivered(self, request, queryset):
        """Marque les achats comme livrés"""
        from django.utils import timezone
        updated = queryset.update(status='delivered', delivery_date=timezone.now())
        self.message_user(request, f'{updated} achat(s) marqué(s) comme livré(s).')
    mark_delivered.short_description = "Marquer comme livré"

    def mark_cancelled(self, request, queryset):
        """Annule les achats sélectionnés"""
        updated = queryset.update(status='cancelled')
        self.message_user(request, f'{updated} achat(s) annulé(s).')
    mark_cancelled.short_description = "Annuler les achats"

    def get_queryset(self, request):
        """Optimise les requêtes"""
        return super().get_queryset(request).select_related('supplier', 'user').prefetch_related('items')


@admin.register(PurchaseItem)
class PurchaseItemAdmin(admin.ModelAdmin):
    """Administration des articles d'achat"""

    list_display = ('purchase', 'product', 'quantity_ordered', 'quantity_received', 'unit_price', 'total_price')
    list_filter = ('product__category', 'purchase__status', 'purchase__order_date')
    search_fields = ('purchase__reference', 'product__name')
    ordering = ('-purchase__order_date',)

    readonly_fields = ('total_price',)

    def get_queryset(self, request):
        """Optimise les requêtes"""
        return super().get_queryset(request).select_related('purchase', 'product')
