from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import redirect
from django.contrib import messages
from .models import ExpenseCategory, Expense, ExpenseBudget


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    """Administration des catégories de dépenses"""
    
    list_display = [
        'name',
        'category_type',
        'budget_monthly_display',
        'expenses_count',
        'total_amount_display',
        'is_active',
        'requires_approval',
    ]
    list_filter = ['category_type', 'is_active', 'requires_approval']
    search_fields = ['name', 'description']
    ordering = ['name']
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('name', 'category_type', 'description', 'is_active')
        }),
        ('Budget', {
            'fields': ('budget_monthly',)
        }),
        ('Approbation', {
            'fields': ('requires_approval', 'approval_threshold')
        }),
    )
    
    def budget_monthly_display(self, obj):
        if obj.budget_monthly:
            return f"{obj.budget_monthly:,.0f} BIF"
        return "-"
    budget_monthly_display.short_description = 'Budget mensuel'
    
    def total_amount_display(self, obj):
        total = obj.total_amount
        if total:
            return f"{total:,.0f} BIF"
        return "0 BIF"
    total_amount_display.short_description = 'Total dépensé'


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    """Administration des dépenses"""
    
    list_display = [
        'description',
        'category',
        'amount_display',
        'payment_method',
        'expense_date',
        'status_display',
        'action_buttons',
        'created_by',
        'approved_by',
    ]
    list_filter = [
        'status',
        'payment_method',
        'category',
        'expense_date',
        'is_recurring',
    ]
    search_fields = [
        'description',
        'receipt_number',
        'payment_reference',
        'notes',
    ]
    ordering = ['-expense_date', '-created_at']
    date_hierarchy = 'expense_date'
    
    fieldsets = (
        ('Informations de base', {
            'fields': (
                'category',
                'description',
                'amount',
                'expense_date',
                'due_date',
            )
        }),
        ('Paiement', {
            'fields': (
                'payment_method',
                'payment_reference',
                'receipt_number',
                'receipt_file',
            )
        }),
        ('Fournisseur', {
            'fields': ('supplier',)
        }),
        ('Statut et Approbation', {
            'fields': (
                'status',
                'created_by',
                'approved_by',
                'approved_at',
                'rejection_reason',
            )
        }),
        ('Récurrence', {
            'fields': (
                'is_recurring',
                'recurrence_period',
            ),
            'classes': ('collapse',)
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_by', 'approved_by', 'approved_at']
    
    def amount_display(self, obj):
        return f"{obj.amount:,.0f} BIF"
    amount_display.short_description = 'Montant'
    
    def status_display(self, obj):
        colors = {
            'pending': 'orange',
            'approved': 'green',
            'rejected': 'red',
            'paid': 'blue',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_display.short_description = 'Statut'
    
    def action_buttons(self, obj):
        """Afficher les boutons d'action selon le statut"""
        if obj.status == 'pending':
            return format_html(
                '<a class="button" href="/admin/expenses/expense/{}/approve/" style="background-color: #28a745; color: white; padding: 5px 10px; border-radius: 3px; text-decoration: none; margin-right: 5px;">✓ Approuver</a>'
                '<a class="button" href="/admin/expenses/expense/{}/reject/" style="background-color: #dc3545; color: white; padding: 5px 10px; border-radius: 3px; text-decoration: none;">✗ Rejeter</a>',
                obj.pk,
                obj.pk
            )
        return '-'
    action_buttons.short_description = 'Actions'
    action_buttons.allow_tags = True
    
    def save_model(self, request, obj, form, change):
        """Enregistrer l'utilisateur créateur"""
        if not change:  # Nouvelle dépense
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_urls(self):
        """Ajouter des URLs personnalisées pour approuver/rejeter"""
        urls = super().get_urls()
        custom_urls = [
            path('<int:expense_id>/approve/', self.admin_site.admin_view(self.approve_expense_view), name='expenses_expense_approve'),
            path('<int:expense_id>/reject/', self.admin_site.admin_view(self.reject_expense_view), name='expenses_expense_reject'),
        ]
        return custom_urls + urls
    
    def approve_expense_view(self, request, expense_id):
        """Vue pour approuver une dépense"""
        expense = Expense.objects.get(pk=expense_id)
        if expense.status == 'pending':
            expense.approve(request.user)
            messages.success(request, f'Dépense "{expense.description}" approuvée avec succès.')
        else:
            messages.warning(request, f'Cette dépense ne peut pas être approuvée (statut: {expense.get_status_display()}).')
        return redirect('admin:expenses_expense_changelist')
    
    def reject_expense_view(self, request, expense_id):
        """Vue pour rejeter une dépense"""
        expense = Expense.objects.get(pk=expense_id)
        if expense.status == 'pending':
            expense.reject(request.user, 'Rejeté depuis l\'admin')
            messages.success(request, f'Dépense "{expense.description}" rejetée.')
        else:
            messages.warning(request, f'Cette dépense ne peut pas être rejetée (statut: {expense.get_status_display()}).')
        return redirect('admin:expenses_expense_changelist')
    
    actions = ['approve_expenses', 'reject_expenses']
    
    def approve_expenses(self, request, queryset):
        """Action pour approuver plusieurs dépenses"""
        count = 0
        for expense in queryset.filter(status='pending'):
            expense.approve(request.user)
            count += 1
        self.message_user(request, f'{count} dépense(s) approuvée(s).')
    approve_expenses.short_description = 'Approuver les dépenses sélectionnées'
    
    def reject_expenses(self, request, queryset):
        """Action pour rejeter plusieurs dépenses"""
        count = 0
        for expense in queryset.filter(status='pending'):
            expense.reject(request.user, 'Rejet groupé depuis l\'admin')
            count += 1
        self.message_user(request, f'{count} dépense(s) rejetée(s).')
    reject_expenses.short_description = 'Rejeter les dépenses sélectionnées'


@admin.register(ExpenseBudget)
class ExpenseBudgetAdmin(admin.ModelAdmin):
    """Administration des budgets de dépenses"""
    
    list_display = [
        'category',
        'month',
        'year',
        'budget_amount_display',
        'actual_amount_display',
        'variance_display',
        'usage_percentage_display',
    ]
    list_filter = ['year', 'month', 'category']
    search_fields = ['category__name', 'notes']
    ordering = ['-year', '-month', 'category__name']
    
    fieldsets = (
        ('Période', {
            'fields': ('category', 'year', 'month')
        }),
        ('Montants', {
            'fields': ('budget_amount', 'actual_amount')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
    )
    
    readonly_fields = ['actual_amount']
    
    def budget_amount_display(self, obj):
        return f"{obj.budget_amount:,.0f} BIF"
    budget_amount_display.short_description = 'Budget'
    
    def actual_amount_display(self, obj):
        return f"{obj.actual_amount:,.0f} BIF"
    actual_amount_display.short_description = 'Réel'
    
    def variance_display(self, obj):
        variance = obj.variance
        color = 'green' if variance >= 0 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:,.0f} BIF</span>',
            color,
            variance
        )
    variance_display.short_description = 'Écart'
    
    def usage_percentage_display(self, obj):
        percentage = obj.usage_percentage
        color = 'green' if percentage < 80 else ('orange' if percentage < 100 else 'red')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
            color,
            percentage
        )
    usage_percentage_display.short_description = 'Utilisation'
    
    actions = ['update_actual_amounts']
    
    def update_actual_amounts(self, request, queryset):
        """Mettre à jour les montants réels"""
        count = 0
        for budget in queryset:
            budget.update_actual_amount()
            count += 1
        self.message_user(request, f'{count} budget(s) mis à jour.')
    update_actual_amounts.short_description = 'Mettre à jour les montants réels'
