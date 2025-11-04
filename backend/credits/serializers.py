from rest_framework import serializers
from .models import CreditAccount, CreditTransaction, CreditReminder


class CreditTransactionSerializer(serializers.ModelSerializer):
    """
    Serializer pour les transactions de crédit
    """
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CreditTransaction
        fields = [
            'id', 'credit_account', 'transaction_type', 'transaction_type_display',
            'amount', 'payment_method', 'payment_method_display', 'sale',
            'notes', 'transaction_date', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['id', 'transaction_date', 'created_by']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None


class CreditAccountSerializer(serializers.ModelSerializer):
    """
    Serializer pour les comptes crédit
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    available_credit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    is_over_limit = serializers.BooleanField(read_only=True)
    created_by_name = serializers.SerializerMethodField()
    transactions_count = serializers.SerializerMethodField()
    last_transaction_date = serializers.SerializerMethodField()
    
    class Meta:
        model = CreditAccount
        fields = [
            'id', 'customer_name', 'phone', 'email', 'address',
            'credit_limit', 'current_balance', 'available_credit',
            'status', 'status_display', 'is_over_limit', 'notes',
            'created_at', 'updated_at', 'created_by', 'created_by_name',
            'transactions_count', 'last_transaction_date'
        ]
        read_only_fields = ['id', 'current_balance', 'created_at', 'updated_at', 'created_by']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_transactions_count(self, obj):
        return obj.transactions.count()
    
    def get_last_transaction_date(self, obj):
        last_transaction = obj.transactions.first()
        return last_transaction.transaction_date if last_transaction else None


class CreditAccountDetailSerializer(CreditAccountSerializer):
    """
    Serializer détaillé avec les transactions
    """
    transactions = CreditTransactionSerializer(many=True, read_only=True)
    
    class Meta(CreditAccountSerializer.Meta):
        fields = CreditAccountSerializer.Meta.fields + ['transactions']


class CreditReminderSerializer(serializers.ModelSerializer):
    """
    Serializer pour les relances
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    customer_name = serializers.CharField(source='credit_account.customer_name', read_only=True)
    customer_phone = serializers.CharField(source='credit_account.phone', read_only=True)
    sent_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CreditReminder
        fields = [
            'id', 'credit_account', 'customer_name', 'customer_phone',
            'reminder_date', 'amount_due', 'message', 'status', 'status_display',
            'sent_at', 'sent_by', 'sent_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'sent_at', 'sent_by', 'created_at']
    
    def get_sent_by_name(self, obj):
        if obj.sent_by:
            return f"{obj.sent_by.first_name} {obj.sent_by.last_name}".strip() or obj.sent_by.username
        return None
