from rest_framework import serializers
from decimal import Decimal
from .models import Ingredient, IngredientMovement, Recipe, RecipeIngredient
from products.models import Product
from suppliers.serializers import SupplierSerializer


class IngredientSerializer(serializers.ModelSerializer):
    """Serializer pour les ingrédients"""
    
    is_low_stock = serializers.ReadOnlyField()
    is_out_of_stock = serializers.ReadOnlyField()
    stock_value = serializers.ReadOnlyField()
    fournisseur_name = serializers.CharField(source='fournisseur.name', read_only=True)
    unite_display = serializers.CharField(source='get_unite_display', read_only=True)
    
    class Meta:
        model = Ingredient
        fields = [
            'id', 'nom', 'quantite_restante', 'unite', 'unite_display',
            'seuil_alerte', 'prix_unitaire', 'description', 'fournisseur',
            'fournisseur_name', 'is_active', 'is_low_stock', 'is_out_of_stock',
            'stock_value', 'date_maj', 'created_at'
        ]
        read_only_fields = ['date_maj', 'created_at']

    def to_representation(self, instance):
        """Personnaliser la représentation pour formater les nombres"""
        data = super().to_representation(instance)
        
        # Formater les champs décimaux pour éviter les .000 inutiles
        if 'quantite_restante' in data and data['quantite_restante'] is not None:
            # Convertir en float puis formater
            val = float(data['quantite_restante'])
            data['quantite_restante'] = int(val) if val.is_integer() else val
            
        if 'seuil_alerte' in data and data['seuil_alerte'] is not None:
            val = float(data['seuil_alerte'])
            data['seuil_alerte'] = int(val) if val.is_integer() else val
            
        if 'prix_unitaire' in data and data['prix_unitaire'] is not None:
            val = float(data['prix_unitaire'])
            data['prix_unitaire'] = int(val) if val.is_integer() else val
            
        return data


class IngredientListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des ingrédients"""
    
    is_low_stock = serializers.ReadOnlyField()
    is_out_of_stock = serializers.ReadOnlyField()
    unite_display = serializers.CharField(source='get_unite_display', read_only=True)
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = Ingredient
        fields = [
            'id', 'nom', 'quantite_restante', 'unite', 'unite_display',
            'seuil_alerte', 'prix_unitaire', 'stock_value', 'is_low_stock', 'is_out_of_stock', 'status'
        ]
    
    def get_status(self, obj):
        if obj.is_out_of_stock:
            return 'rupture'
        elif obj.is_low_stock:
            return 'alerte'
        else:
            return 'ok'

    def to_representation(self, instance):
        """Personnaliser la représentation pour formater les nombres"""
        data = super().to_representation(instance)
        
        # Formater les champs décimaux pour éviter les .000 inutiles
        if 'quantite_restante' in data and data['quantite_restante'] is not None:
            val = float(data['quantite_restante'])
            data['quantite_restante'] = int(val) if val.is_integer() else val
            
        if 'seuil_alerte' in data and data['seuil_alerte'] is not None:
            val = float(data['seuil_alerte'])
            data['seuil_alerte'] = int(val) if val.is_integer() else val
            
        if 'prix_unitaire' in data and data['prix_unitaire'] is not None:
            val = float(data['prix_unitaire'])
            data['prix_unitaire'] = int(val) if val.is_integer() else val
            
        return data


class IngredientMovementSerializer(serializers.ModelSerializer):
    """Serializer pour les mouvements d'ingrédients"""
    
    ingredient_name = serializers.CharField(source='ingredient.nom', read_only=True)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    
    class Meta:
        model = IngredientMovement
        fields = [
            'id', 'ingredient', 'ingredient_name', 'movement_type', 
            'movement_type_display', 'reason', 'reason_display', 'quantity',
            'unit_price', 'total_amount', 'stock_before', 'stock_after',
            'supplier', 'supplier_name', 'user', 'user_name', 'notes',
            'reference', 'created_at'
        ]
        read_only_fields = ['created_at']


class RecipeIngredientSerializer(serializers.ModelSerializer):
    """Serializer pour les ingrédients de recette"""
    
    ingredient_name = serializers.CharField(source='ingredient.nom', read_only=True)
    ingredient_stock = serializers.DecimalField(source='ingredient.quantite_restante', max_digits=10, decimal_places=3, read_only=True)
    ingredient_unit = serializers.CharField(source='ingredient.unite', read_only=True)
    cost_per_portion = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()
    unite_display = serializers.CharField(source='get_unite_display', read_only=True)
    
    class Meta:
        model = RecipeIngredient
        fields = [
            'id', 'ingredient', 'ingredient_name', 'ingredient_stock', 
            'ingredient_unit', 'quantite_utilisee_par_plat', 'unite', 
            'unite_display', 'cost_per_portion', 'is_available', 
            'is_optional', 'notes'
        ]


class RecipeIngredientCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer des ingrédients de recette"""
    
    class Meta:
        model = RecipeIngredient
        fields = [
            'ingredient', 'quantite_utilisee_par_plat', 'unite', 
            'is_optional', 'notes'
        ]
    
    def validate(self, data):
        ingredient = data['ingredient']
        unite = data['unite']
        
        # Vérifier que l'unité correspond à celle de l'ingrédient
        if unite != ingredient.unite:
            raise serializers.ValidationError(
                f"L'unité doit correspondre à celle de l'ingrédient ({ingredient.unite})"
            )
        
        return data


class RecipeSerializer(serializers.ModelSerializer):
    """Serializer pour les recettes"""
    
    plat_name = serializers.CharField(source='plat.name', read_only=True)
    ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    total_cost = serializers.ReadOnlyField()
    can_be_prepared = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    missing_ingredients = serializers.SerializerMethodField()
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'plat', 'plat_name', 'nom_recette', 'description',
            'instructions', 'temps_preparation', 'portions', 'total_cost',
            'can_be_prepared', 'missing_ingredients', 'is_active',
            'created_by', 'created_by_name', 'ingredients',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_missing_ingredients(self, obj):
        missing = obj.get_missing_ingredients()
        return [
            {
                'ingredient': item['ingredient'].nom,
                'needed': item['needed'],
                'available': item['available'],
                'shortage': item['shortage'],
                'unit': item['ingredient'].unite
            }
            for item in missing
        ]


class RecipeCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer des recettes avec ingrédients"""
    
    ingredients = RecipeIngredientCreateSerializer(many=True)
    
    class Meta:
        model = Recipe
        fields = [
            'plat', 'nom_recette', 'description', 'instructions',
            'temps_preparation', 'portions', 'is_active', 'ingredients'
        ]
    
    def validate_plat(self, value):
        # Vérifier qu'il n'y a pas déjà une recette pour ce plat
        if hasattr(value, 'recipe') and value.recipe:
            raise serializers.ValidationError(
                f"Une recette existe déjà pour le plat {value.name}"
            )
        return value
    
    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients')
        
        print(f"🔧 CREATE RECIPE - Recipe data: {validated_data}")
        print(f"🔧 CREATE RECIPE - Ingredients data: {ingredients_data}")

        # Créer la recette (created_by sera ajouté par perform_create)
        recipe = Recipe.objects.create(**validated_data)
        print(f"🔧 CREATE RECIPE - Recipe created: {recipe.id} - {recipe.nom_recette}")
        
        # Créer les ingrédients de la recette
        created_ingredients = []
        for ingredient_data in ingredients_data:
            print(f"🔧 CREATE RECIPE - Creating ingredient: {ingredient_data}")
            recipe_ingredient = RecipeIngredient.objects.create(
                recipe=recipe,
                **ingredient_data
            )
            created_ingredients.append(recipe_ingredient)
            print(f"🔧 CREATE RECIPE - Ingredient created: {recipe_ingredient}")
        
        print(f"🔧 CREATE RECIPE - Total ingredients created: {len(created_ingredients)}")
        
        # Optionnel : Consommer les ingrédients si demandé
        consume_ingredients = self.context.get('request') and self.context['request'].data.get('consume_ingredients', False)
        if consume_ingredients:
            try:
                print(f"🔧 CREATE RECIPE - Consuming ingredients for recipe preparation")
                user = self.context['request'].user if self.context.get('request') else None
                recipe.consume_ingredients(quantity=1, user=user)
                print(f"🔧 CREATE RECIPE - Ingredients consumed successfully")
            except Exception as e:
                print(f"❌ CREATE RECIPE - Error consuming ingredients: {e}")
                # Ne pas bloquer la création de la recette si la consommation échoue
        
        return recipe


class RecipeUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour mettre à jour des recettes avec ingrédients"""
    
    ingredients = RecipeIngredientCreateSerializer(many=True, required=False)
    
    class Meta:
        model = Recipe
        fields = [
            'nom_recette', 'description', 'instructions',
            'temps_preparation', 'portions', 'is_active', 'ingredients'
        ]
    
    def update(self, instance, validated_data):
        from django.db import transaction
        
        print(f"🔧 UPDATE RECIPE - Starting update for recipe {instance.id}: {instance.nom_recette}")
        print(f"🔧 UPDATE RECIPE - Validated data: {validated_data}")
        
        ingredients_data = validated_data.pop('ingredients', [])
        print(f"🔧 UPDATE RECIPE - Ingredients data: {ingredients_data}")
        
        try:
            with transaction.atomic():
                # Mettre à jour les champs de la recette
                for attr, value in validated_data.items():
                    print(f"🔧 UPDATE RECIPE - Setting {attr} = {value}")
                    setattr(instance, attr, value)
                instance.save()
                print(f"🔧 UPDATE RECIPE - Recipe fields updated successfully")
                
                # Si des ingrédients sont fournis, les mettre à jour
                if ingredients_data:
                    # Supprimer tous les anciens ingrédients
                    old_ingredients_count = instance.ingredients.count()
                    print(f"🔧 UPDATE RECIPE - Found {old_ingredients_count} existing ingredients")
                    
                    # Méthode alternative : utiliser bulk_delete pour éviter les problèmes de contraintes
                    try:
                        instance.ingredients.all().delete()
                        print(f"🔧 UPDATE RECIPE - All old ingredients deleted with bulk_delete")
                    except Exception as delete_error:
                        print(f"❌ UPDATE RECIPE - Bulk delete failed: {delete_error}")
                        # Fallback: supprimer un par un
                        for old_ingredient in instance.ingredients.all():
                            print(f"🔧 UPDATE RECIPE - Deleting ingredient individually: {old_ingredient}")
                            old_ingredient.delete()
                        print(f"🔧 UPDATE RECIPE - All old ingredients deleted individually")
                    
                    # Créer les nouveaux ingrédients
                    created_ingredients = []
                    for i, ingredient_data in enumerate(ingredients_data):
                        print(f"🔧 UPDATE RECIPE - Creating ingredient {i+1}/{len(ingredients_data)}: {ingredient_data}")
                        
                        # Validation des données avant création
                        if not ingredient_data.get('ingredient'):
                            raise ValueError(f"Ingredient ID manquant pour l'ingrédient {i+1}")
                        if not ingredient_data.get('quantite_utilisee_par_plat'):
                            raise ValueError(f"Quantité manquante pour l'ingrédient {i+1}")
                        if not ingredient_data.get('unite'):
                            raise ValueError(f"Unité manquante pour l'ingrédient {i+1}")
                        
                        # Vérifier que l'ingrédient existe
                        try:
                            from .models import Ingredient
                            ingredient_obj = Ingredient.objects.get(id=ingredient_data['ingredient'])
                            print(f"🔧 UPDATE RECIPE - Ingredient found: {ingredient_obj}")
                        except Ingredient.DoesNotExist:
                            raise ValueError(f"Ingrédient avec ID {ingredient_data['ingredient']} n'existe pas")
                        
                        recipe_ingredient = RecipeIngredient.objects.create(
                            recipe=instance,
                            ingredient=ingredient_obj,
                            quantite_utilisee_par_plat=ingredient_data['quantite_utilisee_par_plat'],
                            unite=ingredient_data['unite'],
                            is_optional=ingredient_data.get('is_optional', False),
                            notes=ingredient_data.get('notes', '')
                        )
                        created_ingredients.append(recipe_ingredient)
                        print(f"🔧 UPDATE RECIPE - Ingredient created: {recipe_ingredient}")
                    
                    print(f"🔧 UPDATE RECIPE - Total new ingredients created: {len(created_ingredients)}")
                
                print(f"🔧 UPDATE RECIPE - Recipe update completed successfully")
            
        except Exception as e:
            print(f"❌ UPDATE RECIPE - Error during update: {e}")
            print(f"❌ UPDATE RECIPE - Error type: {type(e).__name__}")
            import traceback
            print(f"❌ UPDATE RECIPE - Traceback: {traceback.format_exc()}")
            raise e
        
        return instance


class RecipeListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des recettes"""
    
    plat_name = serializers.CharField(source='plat.name', read_only=True)
    ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    ingredients_count = serializers.SerializerMethodField()
    total_cost = serializers.ReadOnlyField()
    can_be_prepared = serializers.ReadOnlyField()
    status = serializers.SerializerMethodField()
    missing_ingredients = serializers.SerializerMethodField()
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'plat_name', 'nom_recette', 'portions', 
            'temps_preparation', 'ingredients', 'ingredients_count', 'total_cost',
            'can_be_prepared', 'status', 'missing_ingredients', 'is_active'
        ]
    
    def get_ingredients_count(self, obj):
        return obj.ingredients.count()
    
    def get_status(self, obj):
        if not obj.is_active:
            return 'inactive'
        elif obj.can_be_prepared:
            return 'available'
        else:
            return 'unavailable'
    
    def get_missing_ingredients(self, obj):
        missing = obj.get_missing_ingredients()
        return [
            {
                'ingredient': item['ingredient'].nom,
                'needed': item['needed'],
                'available': item['available'],
                'shortage': item['shortage'],
                'unit': item['ingredient'].unite
            }
            for item in missing
        ]


class IngredientStockUpdateSerializer(serializers.Serializer):
    """Serializer pour mettre à jour le stock d'un ingrédient"""

    movement_type = serializers.ChoiceField(choices=IngredientMovement.MOVEMENT_TYPES)
    reason = serializers.ChoiceField(choices=IngredientMovement.REASONS)
    quantity = serializers.DecimalField(max_digits=10, decimal_places=3, min_value=0.001)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, required=False)
    supplier = serializers.IntegerField(required=False, allow_null=True)
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)
    reference = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate_supplier(self, value):
        if value is not None:
            from suppliers.models import Supplier
            try:
                return Supplier.objects.get(id=value, is_active=True)
            except Supplier.DoesNotExist:
                raise serializers.ValidationError("Fournisseur non trouvé ou inactif")
        return None
    
    def validate(self, data):
        movement_type = data['movement_type']
        quantity = data['quantity']
        
        # Pour les sorties, vérifier le stock disponible
        if movement_type == 'out':
            ingredient = self.context['ingredient']
            if not ingredient.can_fulfill_quantity(quantity):
                raise serializers.ValidationError(
                    f"Stock insuffisant. Disponible: {ingredient.quantite_restante} {ingredient.unite}"
                )
        
        return data
