from rest_framework import serializers
from .models import ExpenseCategory, Expense, BudgetSetting
from decimal import Decimal
import uuid
from datetime import datetime

class ExpenseCategorySerializer(serializers.ModelSerializer):
    expenses_count = serializers.IntegerField(read_only=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = ExpenseCategory
        fields = [
            'id', 'name', 'description', 'is_active',
            'expenses_count', 'total_amount', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def validate_name(self, value):
        if ExpenseCategory.objects.filter(name=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("Une catégorie avec ce nom existe déjà.")
        return value

class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True, allow_null=True)
    supplier_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = [
            'id', 'reference', 'category', 'category_name', 'description', 'amount',
            'payment_method', 'supplier', 'supplier_name', 'supplier_display',
            'expense_date', 'receipt_number', 'receipt_file', 'notes',
            'user', 'user_name', 'is_approved', 'approved_by', 'approved_by_name',
            'approved_at', 'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['reference', 'user', 'is_approved', 'approved_by', 'approved_at', 'created_at', 'updated_at']
    
    def get_supplier_display(self, obj):
        """Retourne le nom du fournisseur (relation ou texte libre)"""
        if obj.supplier:
            return obj.supplier.name
        return obj.supplier_name or 'Non spécifié'
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être positif.")
        return value
    
    def validate_expense_date(self, value):
        from django.utils import timezone
        if value > timezone.now():
            raise serializers.ValidationError("La date de dépense ne peut pas être dans le futur.")
        return value
    
    def create(self, validated_data):
        """Génère automatiquement une référence unique"""
        validated_data['reference'] = f"EXP-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8].upper()}"
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ExpenseSummarySerializer(serializers.Serializer):
    total_today = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_this_week = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_this_month = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_this_year = serializers.DecimalField(max_digits=12, decimal_places=2)
    expenses_count_today = serializers.IntegerField()
    expenses_count_this_month = serializers.IntegerField()
    average_daily_expense = serializers.DecimalField(max_digits=12, decimal_places=2)
    top_category = serializers.CharField()
    top_category_amount = serializers.DecimalField(max_digits=12, decimal_places=2)

class MonthlyExpenseReportSerializer(serializers.Serializer):
    month = serializers.CharField()
    year = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    expenses_count = serializers.IntegerField()
    categories = serializers.ListField()
    daily_breakdown = serializers.ListField()

class ExpenseByCategorySerializer(serializers.Serializer):
    category_id = serializers.IntegerField()
    category_name = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    expenses_count = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    average_amount = serializers.DecimalField(max_digits=12, decimal_places=2)


class BudgetSettingSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    current_spent = serializers.SerializerMethodField()
    percentage = serializers.SerializerMethodField()
    is_over_threshold = serializers.SerializerMethodField()
    is_over_budget = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = BudgetSetting
        fields = [
            'id', 'category', 'category_name', 'monthly_budget',
            'alert_threshold', 'is_active', 'current_spent',
            'percentage', 'remaining', 'is_over_threshold', 'is_over_budget',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_current_spent(self, obj):
        """Montant dépensé ce mois"""
        return float(obj.get_current_month_spent())
    
    def get_percentage(self, obj):
        """Pourcentage du budget utilisé"""
        return round(obj.get_budget_percentage(), 2)
    
    def get_is_over_threshold(self, obj):
        """Vérifie si le seuil d'alerte est dépassé"""
        return obj.is_over_threshold()
    
    def get_is_over_budget(self, obj):
        """Vérifie si le budget est dépassé"""
        return obj.is_over_budget()
    
    def get_remaining(self, obj):
        """Montant restant dans le budget"""
        spent = obj.get_current_month_spent()
        remaining = obj.monthly_budget - spent
        return float(remaining)
