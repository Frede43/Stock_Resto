from django.contrib import admin
from django.utils.html import format_html
from .models import CreditAccount, CreditTransaction, CreditReminder


@admin.register(CreditAccount)
class CreditAccountAdmin(admin.ModelAdmin):
    list_display = [
        'customer_name', 
        'phone', 
        'current_balance_display',
        'credit_limit_display',
        'available_credit_display',
        'status_badge',
        'is_over_limit',
        'get_transactions_count',
        'created_at'
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['customer_name', 'phone', 'email']
    readonly_fields = [
        'current_balance', 
        'available_credit', 
        'is_over_limit',
        'get_transactions_count',
        'get_last_transaction_date',
        'created_at',
        'updated_at'
    ]
    fieldsets = (
        ('Informations Client', {
            'fields': ('customer_name', 'phone', 'email', 'address')
        }),
        ('Crédit', {
            'fields': (
                'credit_limit',
                'current_balance',
                'available_credit',
                'is_over_limit',
                'status'
            )
        }),
        ('Statistiques', {
            'fields': (
                'get_transactions_count',
                'get_last_transaction_date'
            )
        }),
        ('Notes & Dates', {
            'fields': ('notes', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def current_balance_display(self, obj):
        color = 'red' if obj.current_balance > 0 else 'green'
        formatted_amount = f'{obj.current_balance:,.0f}'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} FBu</span>',
            color,
            formatted_amount
        )
    current_balance_display.short_description = 'Solde Actuel'
    
    def credit_limit_display(self, obj):
        formatted_amount = f'{obj.credit_limit:,.0f}'
        return format_html('{} FBu', formatted_amount)
    credit_limit_display.short_description = 'Limite'
    
    def available_credit_display(self, obj):
        color = 'green' if obj.available_credit > 0 else 'orange'
        formatted_amount = f'{obj.available_credit:,.0f}'
        return format_html(
            '<span style="color: {};">{} FBu</span>',
            color,
            formatted_amount
        )
    available_credit_display.short_description = 'Disponible'
    
    def status_badge(self, obj):
        colors = {
            'active': 'green',
            'suspended': 'orange',
            'closed': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Statut'
    
    def get_transactions_count(self, obj):
        """Nombre de transactions"""
        return obj.transactions.count()
    get_transactions_count.short_description = 'Nb Transactions'
    
    def get_last_transaction_date(self, obj):
        """Date de la dernière transaction"""
        last_transaction = obj.transactions.first()
        if last_transaction:
            return last_transaction.transaction_date
        return '-'
    get_last_transaction_date.short_description = 'Dernière Transaction'


@admin.register(CreditTransaction)
class CreditTransactionAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'credit_account',
        'transaction_type_badge',
        'amount_display',
        'payment_method_display',
        'sale_link',
        'transaction_date',
        'created_by'
    ]
    list_filter = ['transaction_type', 'payment_method', 'transaction_date']
    search_fields = ['credit_account__customer_name', 'notes']
    readonly_fields = ['transaction_date', 'created_by']
    date_hierarchy = 'transaction_date'
    
    fieldsets = (
        ('Transaction', {
            'fields': (
                'credit_account',
                'transaction_type',
                'amount',
                'payment_method',
                'sale'
            )
        }),
        ('Détails', {
            'fields': ('notes', 'transaction_date', 'created_by')
        })
    )
    
    def transaction_type_badge(self, obj):
        colors = {
            'debt': 'red',
            'payment': 'green',
            'adjustment': 'blue'
        }
        color = colors.get(obj.transaction_type, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_transaction_type_display()
        )
    transaction_type_badge.short_description = 'Type'
    
    def amount_display(self, obj):
        color = 'red' if obj.transaction_type == 'debt' else 'green'
        prefix = '+' if obj.transaction_type == 'debt' else '-'
        formatted_amount = f'{obj.amount:,.0f}'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}{} FBu</span>',
            color,
            prefix,
            formatted_amount
        )
    amount_display.short_description = 'Montant'
    
    def payment_method_display(self, obj):
        if obj.payment_method:
            return obj.get_payment_method_display()
        return '-'
    payment_method_display.short_description = 'Mode de paiement'
    
    def sale_link(self, obj):
        if obj.sale:
            return format_html(
                '<a href="/admin/sales/sale/{}/change/">Vente #{}</a>',
                obj.sale.id,
                obj.sale.reference
            )
        return '-'
    sale_link.short_description = 'Vente'


@admin.register(CreditReminder)
class CreditReminderAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'credit_account',
        'get_customer_name',
        'amount_due_display',
        'reminder_date',
        'status_badge',
        'sent_at',
        'sent_by'
    ]
    list_filter = ['status', 'reminder_date', 'sent_at']
    search_fields = ['credit_account__customer_name', 'message']
    readonly_fields = ['sent_at', 'sent_by', 'created_at']
    date_hierarchy = 'reminder_date'
    
    fieldsets = (
        ('Relance', {
            'fields': (
                'credit_account',
                'reminder_date',
                'amount_due',
                'message'
            )
        }),
        ('Statut', {
            'fields': ('status', 'sent_at', 'sent_by', 'created_at')
        })
    )
    
    def amount_due_display(self, obj):
        formatted_amount = f'{obj.amount_due:,.0f}'
        return format_html(
            '<span style="color: red; font-weight: bold;">{} FBu</span>',
            formatted_amount
        )
    amount_due_display.short_description = 'Montant Dû'
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'sent': 'blue',
            'acknowledged': 'green'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Statut'
    
    def get_customer_name(self, obj):
        """Nom du client depuis le compte crédit"""
        return obj.credit_account.customer_name
    get_customer_name.short_description = 'Client'
