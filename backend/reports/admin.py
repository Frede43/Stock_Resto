from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Count, Avg
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import DailyReport, StockAlert


@admin.register(DailyReport)
class DailyReportAdmin(admin.ModelAdmin):
    """Administration des rapports journaliers"""

    list_display = (
        'date', 'user', 'total_sales', 'total_expenses', 'net_profit_display',
        'number_of_sales', 'status_badge', 'created_at'
    )
    list_filter = ('date', 'user', 'created_at')
    search_fields = ('date', 'user__username', 'notes')
    ordering = ('-date',)

    fieldsets = (
        ('Informations générales', {
            'fields': ('date', 'user')
        }),
        ('Ventes (BIF)', {
            'fields': ('total_sales', 'total_profit', 'number_of_sales')
        }),
        ('Dépenses (BIF)', {
            'fields': ('total_expenses',)
        }),
        ('Stock', {
            'fields': ('opening_stock_value', 'closing_stock_value', 'stock_movements')
        }),
        ('Détails', {
            'fields': ('notes',)
        }),
        ('Dates système', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at', 'updated_at')

    def net_profit_display(self, obj):
        """Affiche le profit net avec couleur"""
        net_profit = obj.total_profit - obj.total_expenses
        color = '#198754' if net_profit >= 0 else '#dc3545'  # Vert si positif, rouge si négatif
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} BIF</span>',
            color, net_profit
        )
    net_profit_display.short_description = 'Profit Net'

    def status_badge(self, obj):
        """Affiche un badge de statut basé sur la performance"""
        net_profit = obj.total_profit - obj.total_expenses
        if net_profit > 0:
            return format_html(
                '<span style="background-color: #198754; color: white; padding: 3px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">PROFITABLE</span>'
            )
        elif net_profit == 0:
            return format_html(
                '<span style="background-color: #ffc107; color: black; padding: 3px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">ÉQUILIBRÉ</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #dc3545; color: white; padding: 3px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">PERTE</span>'
            )
    status_badge.short_description = 'Performance'

    def get_queryset(self, request):
        """Optimise les requêtes"""
        return super().get_queryset(request).select_related('user')


@admin.register(StockAlert)
class StockAlertAdmin(admin.ModelAdmin):
    """Administration des alertes de stock"""

    list_display = (
        'product', 'alert_type_badge', 'status_badge', 'current_stock',
        'threshold', 'created_at', 'resolved_by'
    )
    list_filter = ('alert_type', 'status', 'created_at', 'resolved_at')
    search_fields = ('product__name', 'message')
    ordering = ('-created_at',)

    fieldsets = (
        ('Informations générales', {
            'fields': ('product', 'alert_type', 'status')
        }),
        ('Stock', {
            'fields': ('current_stock', 'threshold', 'message')
        }),
        ('Résolution', {
            'fields': ('resolved_at', 'resolved_by')
        }),
        ('Dates', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at',)

    def alert_type_badge(self, obj):
        """Affiche le type d'alerte avec un badge coloré"""
        colors = {
            'low_stock': '#fd7e14',      # Orange
            'out_of_stock': '#dc3545',   # Rouge
            'expiry_soon': '#ffc107',    # Jaune
        }
        color = colors.get(obj.alert_type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_alert_type_display()
        )
    alert_type_badge.short_description = 'Type'

    def status_badge(self, obj):
        """Affiche le statut avec un badge coloré"""
        colors = {
            'active': '#dc3545',      # Rouge
            'resolved': '#198754',    # Vert
            'ignored': '#6c757d',     # Gris
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Statut'

    actions = ['mark_resolved', 'mark_ignored']

    def mark_resolved(self, request, queryset):
        """Marque les alertes comme résolues"""
        from django.utils import timezone
        updated = queryset.update(
            status='resolved',
            resolved_at=timezone.now(),
            resolved_by=request.user
        )
        self.message_user(request, f'{updated} alerte(s) marquée(s) comme résolue(s).')
    mark_resolved.short_description = "Marquer comme résolu"

    def mark_ignored(self, request, queryset):
        """Marque les alertes comme ignorées"""
        updated = queryset.update(status='ignored')
        self.message_user(request, f'{updated} alerte(s) ignorée(s).')
    mark_ignored.short_description = "Ignorer les alertes"

    def get_queryset(self, request):
        """Optimise les requêtes"""
        return super().get_queryset(request).select_related('product', 'resolved_by')
