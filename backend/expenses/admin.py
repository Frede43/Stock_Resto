from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Count, Avg
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import ExpenseCategory, Expense, BudgetSetting


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
        'approval_status', 'user', 'expense_date'
    )
    list_filter = (
        'category', 'payment_method', 'is_approved', 'expense_date', 'created_at'
    )
    search_fields = ('reference', 'description', 'user__username')
    ordering = ('-expense_date',)

    fieldsets = (
        ('Informations générales', {
            'fields': ('reference', 'category', 'description')
        }),
        ('Montant et paiement', {
            'fields': ('amount', 'payment_method', 'supplier', 'supplier_name')
        }),
        ('Détails', {
            'fields': ('receipt_number', 'receipt_file', 'notes')
        }),
        ('Approbation', {
            'fields': ('is_approved', 'approved_by', 'approved_at', 'rejection_reason')
        }),
        ('Dates', {
            'fields': ('expense_date', 'user')
        }),
        ('Dates système', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at', 'updated_at', 'approved_by', 'approved_at')

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

    def approval_status(self, obj):
        """Affiche le statut d'approbation avec badge"""
        if obj.is_approved:
            return format_html(
                '<span style="background-color: #198754; color: white; padding: 3px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">✓ Approuvée</span>'
            )
        elif obj.rejection_reason:
            return format_html(
                '<span style="background-color: #dc3545; color: white; padding: 3px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">✗ Rejetée</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #ffc107; color: black; padding: 3px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">⏳ En attente</span>'
            )
    approval_status.short_description = 'Statut'

    def save_model(self, request, obj, form, change):
        """Définit automatiquement l'utilisateur créateur"""
        if not change:  # Nouveau objet
            obj.user = request.user
        super().save_model(request, obj, form, change)


@admin.register(BudgetSetting)
class BudgetSettingAdmin(admin.ModelAdmin):
    """Administration des paramètres de budget"""
    
    list_display = (
        'category', 'monthly_budget', 'alert_threshold', 'budget_status',
        'is_active', 'created_at'
    )
    list_filter = ('is_active', 'created_at')
    search_fields = ('category__name',)
    ordering = ('category__name',)
    
    fieldsets = (
        ('Catégorie', {
            'fields': ('category',)
        }),
        ('Budget', {
            'fields': ('monthly_budget', 'alert_threshold', 'is_active')
        }),
        ('Statistiques', {
            'fields': ('current_spent', 'budget_percentage', 'status_display'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'current_spent', 'budget_percentage', 'status_display')
    
    def current_spent(self, obj):
        """Affiche le montant dépensé ce mois"""
        spent = obj.get_current_month_spent()
        return format_html('{} BIF', spent)
    current_spent.short_description = 'Dépensé ce mois'
    
    def budget_percentage(self, obj):
        """Affiche le pourcentage du budget utilisé"""
        percentage = obj.get_budget_percentage()
        return format_html('{}%', round(percentage, 1))
    budget_percentage.short_description = 'Utilisation'
    
    def budget_status(self, obj):
        """Affiche le statut du budget avec badge coloré"""
        percentage = obj.get_budget_percentage()
        
        if percentage > 100:
            color = '#dc3545'  # Rouge
            icon = '⚠️'
            text = 'Dépassé'
        elif percentage >= obj.alert_threshold:
            color = '#ffc107'  # Jaune
            icon = '⚡'
            text = 'Alerte'
        else:
            color = '#198754'  # Vert
            icon = '✓'
            text = 'OK'
        
        return format_html(
            '<span style="background-color: {}; color: {}; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{} {} ({}%)</span>',
            color, 'white' if percentage >= obj.alert_threshold else 'black',
            icon, text, round(percentage, 1)
        )
    budget_status.short_description = 'Statut Budget'
    
    def status_display(self, obj):
        """Affiche un résumé détaillé du statut"""
        spent = obj.get_current_month_spent()
        percentage = obj.get_budget_percentage()
        remaining = obj.monthly_budget - spent
        
        html = f"""
        <div style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            <p><strong>Budget mensuel:</strong> {obj.monthly_budget} BIF</p>
            <p><strong>Dépensé:</strong> {spent} BIF ({round(percentage, 1)}%)</p>
            <p><strong>Restant:</strong> {remaining} BIF</p>
            <div style="background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; margin-top: 10px;">
                <div style="background: {'#dc3545' if percentage > 100 else '#ffc107' if percentage >= obj.alert_threshold else '#198754'}; 
                            height: 100%; width: {min(percentage, 100)}%;"></div>
            </div>
        </div>
        """
        return mark_safe(html)
    status_display.short_description = 'Résumé'
