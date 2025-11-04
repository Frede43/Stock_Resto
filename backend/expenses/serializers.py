from rest_framework import serializers
from .models import ExpenseCategory, Expense, ExpenseBudget
from accounts.models import User
from suppliers.models import Supplier


class ExpenseCategorySerializer(serializers.ModelSerializer):
    """Serializer pour les catégories de dépenses"""
    
    expenses_count = serializers.IntegerField(read_only=True)
    total_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = ExpenseCategory
        fields = [
            'id',
            'name',
            'category_type',
            'description',
            'budget_monthly',
            'is_active',
            'requires_approval',
            'approval_threshold',
            'expenses_count',
            'total_amount',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer pour les dépenses"""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_type = serializers.CharField(source='category.category_type', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Expense
        fields = [
            'id',
            'category',
            'category_name',
            'category_type',
            'description',
            'amount',
            'payment_method',
            'payment_reference',
            'receipt_number',
            'receipt_file',
            'supplier',
            'supplier_name',
            'expense_date',
            'due_date',
            'status',
            'created_by',
            'created_by_name',
            'approved_by',
            'approved_by_name',
            'approved_at',
            'rejection_reason',
            'notes',
            'is_recurring',
            'recurrence_period',
            'is_approved',
            'is_overdue',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'created_by',
            'approved_by',
            'approved_at',
            'created_at',
            'updated_at',
        ]
    
    def create(self, validated_data):
        """Créer une dépense avec l'utilisateur connecté"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ExpenseCreateSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la création de dépenses"""
    
    class Meta:
        model = Expense
        fields = [
            'category',
            'description',
            'amount',
            'payment_method',
            'payment_reference',
            'receipt_number',
            'receipt_file',
            'supplier',
            'expense_date',
            'due_date',
            'notes',
            'is_recurring',
            'recurrence_period',
        ]
    
    def create(self, validated_data):
        """Créer une dépense avec l'utilisateur connecté"""
        user = self.context['request'].user
        validated_data['created_by'] = user
        
        # Toutes les dépenses créées par des non-admins doivent être en attente
        # Seul l'admin peut approuver via l'interface /expenses
        validated_data['status'] = 'pending'
        
        return super().create(validated_data)


class ExpenseApprovalSerializer(serializers.Serializer):
    """Serializer pour approuver/rejeter une dépense"""
    
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        if data['action'] == 'reject' and not data.get('rejection_reason'):
            raise serializers.ValidationError({
                'rejection_reason': 'Une raison de rejet est requise.'
            })
        return data


class ExpenseBudgetSerializer(serializers.ModelSerializer):
    """Serializer pour les budgets de dépenses"""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    variance = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )
    variance_percentage = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    usage_percentage = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = ExpenseBudget
        fields = [
            'id',
            'category',
            'category_name',
            'year',
            'month',
            'budget_amount',
            'actual_amount',
            'variance',
            'variance_percentage',
            'usage_percentage',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['actual_amount', 'created_at', 'updated_at']


class ExpenseStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques de dépenses"""
    
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_pending = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_approved = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_rejected = serializers.DecimalField(max_digits=12, decimal_places=2)
    count_pending = serializers.IntegerField()
    count_approved = serializers.IntegerField()
    count_rejected = serializers.IntegerField()
    by_category = serializers.ListField()
    by_payment_method = serializers.ListField()
    monthly_trend = serializers.ListField()
