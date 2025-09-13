"""
Services pour la logique automatique de gestion des stocks et recettes
"""

from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from .models_enhanced import MenuItem, Recipe, Ingredient, RecipeIngredient


class StockService:
    """Service pour la gestion automatique des stocks"""
    
    @staticmethod
    def check_availability(menu_item_id, quantity=1):
        """Vérifie la disponibilité d'un article du menu"""
        try:
            menu_item = MenuItem.objects.get(id=menu_item_id)
            
            if menu_item.type == 'simple':
                # Produit simple : vérifier le stock direct
                return menu_item.direct_stock >= quantity
            
            elif menu_item.recipe:
                # Produit basé sur recette : vérifier les ingrédients
                return menu_item.recipe.can_be_prepared(quantity)
            
            return False
            
        except MenuItem.DoesNotExist:
            return False
    
    @staticmethod
    def get_availability_info(menu_item_id):
        """Retourne les informations détaillées de disponibilité"""
        try:
            menu_item = MenuItem.objects.get(id=menu_item_id)
            
            info = {
                'item_name': menu_item.name,
                'type': menu_item.type,
                'is_available': menu_item.is_available,
                'available_quantity': 0,
                'limiting_factors': []
            }
            
            if menu_item.type == 'simple':
                info['available_quantity'] = int(menu_item.direct_stock)
                if menu_item.direct_stock <= 0:
                    info['limiting_factors'].append('Stock épuisé')
            
            elif menu_item.recipe:
                max_portions = menu_item.recipe.max_portions_possible()
                info['available_quantity'] = max_portions
                
                # Identifier les ingrédients limitants
                for recipe_ingredient in menu_item.recipe.recipe_ingredients.all():
                    ingredient = recipe_ingredient.ingredient
                    required = recipe_ingredient.quantity
                    available = ingredient.current_stock
                    
                    if available < required:
                        info['limiting_factors'].append(
                            f"Manque {ingredient.name}: {available}/{required} {ingredient.unit}"
                        )
            
            return info
            
        except MenuItem.DoesNotExist:
            return None
    
    @staticmethod
    @transaction.atomic
    def consume_ingredients(menu_item_id, quantity=1):
        """Consomme les ingrédients lors d'une vente"""
        try:
            menu_item = MenuItem.objects.get(id=menu_item_id)
            
            if menu_item.type == 'simple':
                # Déduire du stock direct
                if menu_item.direct_stock >= quantity:
                    menu_item.direct_stock -= quantity
                    menu_item.save()
                    return True
                return False
            
            elif menu_item.recipe:
                # Vérifier d'abord la disponibilité
                if not menu_item.recipe.can_be_prepared(quantity):
                    return False
                
                # Déduire les ingrédients
                for recipe_ingredient in menu_item.recipe.recipe_ingredients.all():
                    ingredient = recipe_ingredient.ingredient
                    required_quantity = recipe_ingredient.quantity * quantity
                    
                    ingredient.current_stock -= required_quantity
                    ingredient.save()
                
                return True
            
            return False
            
        except MenuItem.DoesNotExist:
            return False


class MenuService:
    """Service pour la gestion du menu commercial"""
    
    @staticmethod
    def get_available_menu():
        """Retourne le menu avec les disponibilités en temps réel"""
        menu_items = MenuItem.objects.filter(is_available=True).select_related(
            'category', 'recipe'
        ).prefetch_related('recipe__recipe_ingredients__ingredient')
        
        menu_data = []
        for item in menu_items:
            availability_info = StockService.get_availability_info(item.id)
            
            item_data = {
                'id': item.id,
                'name': item.name,
                'category': item.category.name,
                'price': item.selling_price,
                'description': item.description,
                'type': item.type,
                'is_featured': item.is_featured,
                'availability': availability_info,
                'margin_percentage': item.margin_percentage,
            }
            
            menu_data.append(item_data)
        
        return menu_data
    
    @staticmethod
    def get_menu_by_category():
        """Retourne le menu organisé par catégories"""
        from collections import defaultdict
        
        menu_items = MenuService.get_available_menu()
        categorized_menu = defaultdict(list)
        
        for item in menu_items:
            categorized_menu[item['category']].append(item)
        
        return dict(categorized_menu)


class KitchenService:
    """Service pour la gestion de la cuisine"""
    
    @staticmethod
    def get_stock_alerts():
        """Retourne les alertes de stock"""
        from django.db import models
        from .models import Product

        # Utiliser la table Product au lieu d'Ingredient
        low_stock_products = Product.objects.filter(
            current_stock__lte=models.F('minimum_stock'),
            is_active=True
        )

        alerts = []
        for product in low_stock_products:
            alerts.append({
                'ingredient': product.name,
                'current_stock': product.current_stock,
                'minimum_stock': product.minimum_stock,
                'unit': 'unités',  # Unité par défaut
                'severity': 'critical' if product.current_stock == 0 else 'warning'
            })

        return alerts
    
    @staticmethod
    def get_production_forecast():
        """Calcule les prévisions de production"""
        recipes = Recipe.objects.filter(is_active=True).prefetch_related(
            'recipe_ingredients__ingredient'
        )
        
        forecast = []
        for recipe in recipes:
            max_portions = recipe.max_portions_possible()
            
            # Trouver l'ingrédient limitant
            limiting_ingredient = None
            min_portions = float('inf')
            
            for recipe_ingredient in recipe.recipe_ingredients.all():
                ingredient = recipe_ingredient.ingredient
                possible = int(ingredient.current_stock / recipe_ingredient.quantity)
                if possible < min_portions:
                    min_portions = possible
                    limiting_ingredient = ingredient.name
            
            forecast.append({
                'recipe': recipe.name,
                'max_portions': max_portions,
                'limiting_ingredient': limiting_ingredient,
                'cost_per_portion': recipe.cost_per_portion,
                'prep_time': recipe.prep_time,
            })
        
        return forecast
    
    @staticmethod
    def calculate_shopping_list():
        """Calcule la liste de courses basée sur les stocks minimum"""
        from django.db import models
        from .models import Product

        # Utiliser la table Product au lieu d'Ingredient
        products_to_buy = Product.objects.filter(
            current_stock__lte=models.F('minimum_stock'),
            is_active=True
        )

        shopping_list = []
        for product in products_to_buy:
            quantity_needed = max(0, product.minimum_stock - product.current_stock + 10)  # +10 pour sécurité
            if quantity_needed > 0:
                estimated_cost = quantity_needed * float(product.purchase_price or 0)
                priority = 'urgent' if product.current_stock == 0 else 'high' if product.current_stock <= 2 else 'normal'

                shopping_list.append({
                    'ingredient': product.name,
                    'quantity_needed': quantity_needed,
                    'unit': 'unités',
                    'estimated_cost': estimated_cost,
                    'priority': priority,
                    'supplier': 'Fournisseur principal'  # Par défaut
                })
        
        return shopping_list


class AnalyticsService:
    """Service pour les analyses et rapports"""
    
    @staticmethod
    def get_profitability_analysis():
        """Analyse de rentabilité des articles du menu"""
        menu_items = MenuItem.objects.filter(is_available=True).select_related('recipe')
        
        analysis = []
        for item in menu_items:
            cost_price = item.cost_price
            margin = item.margin
            margin_percentage = item.margin_percentage
            
            analysis.append({
                'item': item.name,
                'selling_price': item.selling_price,
                'cost_price': cost_price,
                'margin': margin,
                'margin_percentage': margin_percentage,
                'category': item.category.name,
                'profitability_score': margin_percentage  # Peut être plus complexe
            })
        
        # Trier par rentabilité
        analysis.sort(key=lambda x: x['margin_percentage'], reverse=True)
        return analysis
    
    @staticmethod
    def get_stock_value_report():
        """Rapport de la valeur du stock"""
        ingredients = Ingredient.objects.filter(is_active=True)
        
        total_value = Decimal('0')
        stock_report = []
        
        for ingredient in ingredients:
            value = ingredient.stock_value
            total_value += value
            
            stock_report.append({
                'ingredient': ingredient.name,
                'quantity': ingredient.current_stock,
                'unit': ingredient.unit,
                'cost_per_unit': ingredient.cost_per_unit,
                'total_value': value,
                'category': ingredient.category.name
            })
        
        return {
            'total_stock_value': total_value,
            'items': stock_report
        }
