from rest_framework import serializers
from .models import Category, Product

class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer pour les catégories de produits
    """
    
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    products_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'type', 'type_display', 'description',
            'is_active', 'products_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_products_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer pour les produits
    """
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_type = serializers.CharField(source='category.type', read_only=True)
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    profit_margin = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    profit_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)
    available_quantity = serializers.SerializerMethodField()
    is_available_for_sale = serializers.SerializerMethodField()
    has_recipe = serializers.SerializerMethodField()
    recipe_cost = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_name', 'category_type',
            'code', 'description', 'unit', 'unit_display',
            'purchase_price', 'selling_price', 'profit_margin', 'profit_percentage',
            'initial_stock', 'current_stock', 'minimum_stock',
            'is_low_stock', 'is_out_of_stock', 'available_quantity', 'is_available_for_sale',
            'has_recipe', 'recipe_cost',
            'units_per_case', 'case_price',
            'is_active', 'is_available',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'profit_margin', 'profit_percentage']
    
    def validate(self, data):
        # Validation des prix
        selling_price = data.get('selling_price')
        purchase_price = data.get('purchase_price')

        if selling_price is not None and purchase_price is not None:
            if selling_price <= purchase_price:
                raise serializers.ValidationError({
                    'selling_price': "Le prix de vente doit être supérieur au prix d'achat."
                })

        # Validation du stock minimum
        minimum_stock = data.get('minimum_stock')
        if minimum_stock is not None and minimum_stock < 0:
            raise serializers.ValidationError({
                'minimum_stock': "Le stock minimum ne peut pas être négatif."
            })

        # Validation du stock actuel
        current_stock = data.get('current_stock')
        if current_stock is not None and current_stock < 0:
            raise serializers.ValidationError({
                'current_stock': "Le stock actuel ne peut pas être négatif."
            })

        # Validation de la catégorie
        category = data.get('category')
        if category and not hasattr(category, 'id'):
            # Si c'est un ID, vérifier que la catégorie existe
            from .models import Category
            try:
                Category.objects.get(id=category)
            except (Category.DoesNotExist, ValueError, TypeError):
                raise serializers.ValidationError({
                    'category': "Catégorie invalide."
                })

        return data

    def get_has_recipe(self, obj):
        """Vérifie si le produit a une recette"""
        return hasattr(obj, 'recipe') and obj.recipe is not None

    def get_available_quantity(self, obj):
        """Quantité disponible basée sur la recette ou le stock"""
        if hasattr(obj, 'recipe') and obj.recipe:
            return obj.recipe.max_portions_available()
        return obj.current_stock

    def get_is_available_for_sale(self, obj):
        """Vérifie si le produit peut être vendu"""
        if hasattr(obj, 'recipe') and obj.recipe:
            return obj.recipe.can_be_prepared
        return obj.current_stock > 0

    def get_recipe_cost(self, obj):
        """Coût basé sur la recette si elle existe"""
        if hasattr(obj, 'recipe') and obj.recipe:
            return float(obj.recipe.total_cost)
        return float(obj.purchase_price)


class ProductListSerializer(serializers.ModelSerializer):
    """
    Serializer simplifié pour la liste des produits
    """
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_name', 'code', 'unit_display',
            'purchase_price', 'selling_price', 'current_stock', 'minimum_stock',
            'is_low_stock', 'is_out_of_stock', 'is_available'
        ]


class ProductStockUpdateSerializer(serializers.Serializer):
    """
    Serializer pour mettre à jour le stock d'un produit
    """
    
    quantity = serializers.IntegerField(min_value=1)
    operation = serializers.ChoiceField(choices=['add', 'subtract', 'set'])
    reason = serializers.CharField(max_length=200, required=False)
    
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("La quantité doit être positive.")
        return value


class ProductBulkUpdateSerializer(serializers.Serializer):
    """
    Serializer pour les mises à jour en lot
    """
    
    products = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
    def validate_products(self, value):
        for item in value:
            if 'id' not in item:
                raise serializers.ValidationError("L'ID du produit est requis.")
            
            # Vérifier que le produit existe
            try:
                Product.objects.get(id=item['id'])
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Produit avec ID {item['id']} introuvable.")
        
        return value
