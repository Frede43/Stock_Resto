from rest_framework import serializers
from .models import Supplier
from django.core.validators import RegexValidator

class SupplierSerializer(serializers.ModelSerializer):
    # Champs optionnels pour les statistiques (calculés dynamiquement si disponibles)
    total_purchases = serializers.SerializerMethodField()
    purchases_count = serializers.SerializerMethodField()
    last_purchase_date = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'supplier_type', 'contact_person', 'phone', 'email', 'address',
            'city', 'notes', 'is_active', 'total_purchases', 'purchases_count',
            'last_purchase_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_total_purchases(self, obj):
        """Calculer le total des achats"""
        if hasattr(obj, 'total_purchases') and obj.total_purchases is not None:
            return obj.total_purchases
        return 0

    def get_purchases_count(self, obj):
        """Calculer le nombre d'achats"""
        if hasattr(obj, 'purchases_count') and obj.purchases_count is not None:
            return obj.purchases_count
        return 0

    def get_last_purchase_date(self, obj):
        """Obtenir la date du dernier achat"""
        if hasattr(obj, 'last_purchase_date') and obj.last_purchase_date is not None:
            return obj.last_purchase_date
        return None
    
    def validate_phone(self, value):
        if value:
            # Validation simple pour les numéros de téléphone
            phone_validator = RegexValidator(
                regex=r'^\+?[\d\s\-\(\)]{8,15}$',
                message="Format de téléphone invalide. Utilisez un format valide avec 8-15 chiffres."
            )
            phone_validator(value)
        return value
    
    def validate_email(self, value):
        if value and Supplier.objects.filter(email=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("Un fournisseur avec cet email existe déjà.")
        return value
    
    def validate_name(self, value):
        if Supplier.objects.filter(name=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("Un fournisseur avec ce nom existe déjà.")
        return value

class SupplierStatisticsSerializer(serializers.Serializer):
    supplier_id = serializers.IntegerField()
    supplier_name = serializers.CharField()
    total_purchases = serializers.DecimalField(max_digits=12, decimal_places=2)
    purchases_count = serializers.IntegerField()
    average_purchase_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    last_purchase_date = serializers.DateTimeField()
    products_supplied = serializers.IntegerField()
    payment_reliability = serializers.CharField()  # 'excellent', 'good', 'average', 'poor'
