from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Count, Avg
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import ExpenseCategory, Expense


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    """Administration des catégories de dépenses"""

    list_display = ('name', 'expenses_count', 'total_amount', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)

    fieldsets = (
        ('Informations générales', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Dates', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at',)

    def expenses_count(self, obj):
        """Affiche le nombre de dépenses dans cette catégorie"""
        count = obj.expenses.count()
        if count > 0:
            url = reverse('admin:expenses_expense_changelist') + f'?category__id__exact={obj.id}'
            return format_html('<a href="{}">{} dépense(s)</a>', url, count)
        return '0 dépense'
    expenses_count.short_description = 'Dépenses'

    def total_amount(self, obj):
        """Affiche le montant total des dépenses de cette catégorie"""
        total = obj.expenses.aggregate(total=Sum('amount'))['total'] or 0
        return format_html('{} BIF', total)
    total_amount.short_description = 'Montant total'

    def get_queryset(self, request):
        """Optimise les requêtes"""
        return super().get_queryset(request).prefetch_related('expenses')


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    """Administration des dépenses"""

    list_display = (
        'reference', 'description', 'category', 'amount', 'payment_method_badge',
        'user', 'expense_date'
    )
    list_filter = (
        'category', 'payment_method', 'expense_date', 'created_at'
    )
    search_fields = ('reference', 'description', 'user__username')
    ordering = ('-expense_date',)

    fieldsets = (
        ('Informations générales', {
            'fields': ('reference', 'category', 'description')
        }),
        ('Montant et paiement', {
            'fields': ('amount', 'payment_method', 'supplier')
        }),
        ('Détails', {
            'fields': ('receipt_number', 'notes')
        }),
        ('Dates', {
            'fields': ('expense_date', 'user')
        }),
        ('Dates système', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at', 'updated_at')

    def payment_method_badge(self, obj):
        """Affiche le mode de paiement avec un badge coloré"""
        colors = {
            'cash': '#198754',      # Vert
            'card': '#0d6efd',      # Bleu
            'mobile': '#6f42c1',    # Violet
            'bank': '#fd7e14',      # Orange
            'check': '#20c997',     # Teal
        }
        color = colors.get(obj.payment_method, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_payment_method_display()
        )
    payment_method_badge.short_description = 'Paiement'

    actions = ['export_as_csv']

    def get_queryset(self, request):
        """Optimise les requêtes"""
        return super().get_queryset(request).select_related('category', 'user', 'supplier')

    def save_model(self, request, obj, form, change):
        """Définit automatiquement l'utilisateur créateur"""
        if not change:  # Nouveau objet
            obj.user = request.user
        super().save_model(request, obj, form, change)
