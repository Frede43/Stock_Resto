from rest_framework import serializers
from .models import ExpenseCategory, Expense
from decimal import Decimal

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
    
    class Meta:
        model = Expense
        fields = [
            'id', 'category', 'category_name', 'description', 'amount',
            'expense_date', 'receipt_number', 'notes', 'user', 'user_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être positif.")
        return value
    
    def validate_expense_date(self, value):
        from django.utils import timezone
        if value > timezone.now().date():
            raise serializers.ValidationError("La date de dépense ne peut pas être dans le futur.")
        return value

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
