"""
API endpoints pour l'architecture à deux niveaux
"""

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db import transaction
from .models_enhanced import MenuItem, Recipe, Ingredient, MenuCategory, IngredientCategory
from .services import StockService, MenuService, KitchenService, AnalyticsService


# ==================== SALES API (Niveau Commercial) ====================

@api_view(['GET'])
@permission_classes([AllowAny])  # Temporairement public pour debug
def sales_menu(request):
    """
    API pour la page Sales - Menu commercial simplifié
    """
    try:
        # Menu organisé par catégories avec disponibilités
        categorized_menu = MenuService.get_menu_by_category()
        
        # Statistiques rapides
        total_items = MenuItem.objects.filter(is_available=True).count()
        available_items = sum(
            1 for items in categorized_menu.values() 
            for item in items 
            if item['availability']['available_quantity'] > 0
        )
        
        return Response({
            'success': True,
            'menu': categorized_menu,
            'stats': {
                'total_items': total_items,
                'available_items': available_items,
                'unavailable_items': total_items - available_items
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])  # Temporairement public pour debug
def process_sale(request):
    """
    Traiter une vente - Déduction automatique des stocks
    """
    try:
        items = request.data.get('items', [])
        order_id = request.data.get('order_id')  # ID de la commande si applicable
        table_id = request.data.get('table_id')  # ID de la table si applicable

        if not items:
            return Response({
                'success': False,
                'error': 'Aucun article spécifié'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier la disponibilité de tous les articles
        availability_check = []
        for item in items:
            menu_item_id = item.get('menu_item_id')
            quantity = item.get('quantity', 1)
            
            is_available = StockService.check_availability(menu_item_id, quantity)
            availability_info = StockService.get_availability_info(menu_item_id)
            
            availability_check.append({
                'menu_item_id': menu_item_id,
                'quantity': quantity,
                'is_available': is_available,
                'info': availability_info
            })
        
        # Si tous les articles sont disponibles, traiter la vente
        all_available = all(item['is_available'] for item in availability_check)
        
        if all_available:
            with transaction.atomic():
                for item in items:
                    menu_item_id = item.get('menu_item_id')
                    quantity = item.get('quantity', 1)
                    
                    success = StockService.consume_ingredients(menu_item_id, quantity)
                    if not success:
                        raise Exception(f"Erreur lors de la déduction pour l'article {menu_item_id}")
            
            # 4. Libérer la table si applicable
            table_freed = False
            if table_id:
                try:
                    from sales.models import Table
                    table = Table.objects.get(id=table_id)
                    table.status = 'cleaning'  # Marquer pour nettoyage avant libération
                    table.save()
                    table_freed = True
                except Exception as e:
                    print(f"Erreur libération table: {e}")

            return Response({
                'success': True,
                'message': 'Vente traitée avec succès',
                'items_processed': len(items),
                'order_id': order_id,
                'table_freed': table_freed
            })
        else:
            return Response({
                'success': False,
                'error': 'Certains articles ne sont pas disponibles',
                'availability_check': availability_check
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def item_availability(request, item_id):
    """
    Vérifier la disponibilité d'un article spécifique
    """
    try:
        availability_info = StockService.get_availability_info(item_id)
        
        if availability_info:
            return Response({
                'success': True,
                'availability': availability_info
            })
        else:
            return Response({
                'success': False,
                'error': 'Article non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== KITCHEN API (Niveau Technique) ====================

@api_view(['GET'])
@permission_classes([AllowAny])  # Temporairement public pour debug
def kitchen_dashboard(request):
    """
    API pour la page Kitchen - Gestion technique complète
    """
    try:
        # Alertes de stock
        stock_alerts = KitchenService.get_stock_alerts()
        
        # Prévisions de production
        production_forecast = KitchenService.get_production_forecast()
        
        # Liste de courses
        shopping_list = KitchenService.calculate_shopping_list()
        
        # Analyse de rentabilité
        profitability = AnalyticsService.get_profitability_analysis()
        
        # Valeur du stock
        stock_value = AnalyticsService.get_stock_value_report()
        
        return Response({
            'success': True,
            'stock_alerts': stock_alerts,
            'production_forecast': production_forecast,
            'shopping_list': shopping_list,
            'profitability_analysis': profitability[:10],  # Top 10
            'stock_value': stock_value,
            'summary': {
                'critical_alerts': len([a for a in stock_alerts if a['severity'] == 'critical']),
                'warning_alerts': len([a for a in stock_alerts if a['severity'] == 'warning']),
                'total_stock_value': stock_value['total_stock_value'],
                'items_to_buy': len(shopping_list)
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def ingredients_list(request):
    """
    Liste des ingrédients avec stocks
    """
    try:
        ingredients = Ingredient.objects.filter(is_active=True).select_related('category')
        
        ingredients_data = []
        for ingredient in ingredients:
            ingredients_data.append({
                'id': ingredient.id,
                'name': ingredient.name,
                'category': ingredient.category.name,
                'current_stock': ingredient.current_stock,
                'minimum_stock': ingredient.minimum_stock,
                'unit': ingredient.unit,
                'cost_per_unit': ingredient.cost_per_unit,
                'stock_value': ingredient.stock_value,
                'is_low_stock': ingredient.is_low_stock,
                'supplier': ingredient.supplier.name if ingredient.supplier else None
            })
        
        return Response({
            'success': True,
            'ingredients': ingredients_data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def recipes_list(request):
    """
    Liste des recettes avec coûts
    """
    try:
        recipes = Recipe.objects.filter(is_active=True).prefetch_related(
            'recipe_ingredients__ingredient'
        )
        
        recipes_data = []
        for recipe in recipes:
            recipes_data.append({
                'id': recipe.id,
                'name': recipe.name,
                'description': recipe.description,
                'prep_time': recipe.prep_time,
                'cook_time': recipe.cook_time,
                'total_time': recipe.total_time,
                'portions': recipe.portions,
                'cost_price': recipe.cost_price,
                'cost_per_portion': recipe.cost_per_portion,
                'max_portions_possible': recipe.max_portions_possible(),
                'ingredients_count': recipe.recipe_ingredients.count(),
                'difficulty': recipe.difficulty
            })
        
        return Response({
            'success': True,
            'recipes': recipes_data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def update_ingredient_stock(request, ingredient_id):
    """
    Mettre à jour le stock d'un ingrédient
    """
    try:
        ingredient = Ingredient.objects.get(id=ingredient_id)
        new_stock = request.data.get('new_stock')
        
        if new_stock is None:
            return Response({
                'success': False,
                'error': 'new_stock requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_stock = ingredient.current_stock
        ingredient.current_stock = new_stock
        ingredient.save()
        
        return Response({
            'success': True,
            'message': f'Stock mis à jour: {old_stock} → {new_stock} {ingredient.unit}',
            'ingredient': {
                'id': ingredient.id,
                'name': ingredient.name,
                'old_stock': old_stock,
                'new_stock': new_stock,
                'unit': ingredient.unit
            }
        })
        
    except Ingredient.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Ingrédient non trouvé'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def free_table(request, table_id):
    """
    Libérer une table après encaissement
    """
    try:
        from sales.models import Table

        table = Table.objects.get(id=table_id)
        old_status = table.status

        # Marquer la table comme nécessitant un nettoyage puis la libérer
        table.status = 'available'
        table.server = None
        table.customer = None
        table.occupied_since = None
        table.save()

        return Response({
            'success': True,
            'message': f'Table {table.number} libérée',
            'table': {
                'id': table.id,
                'number': table.number,
                'old_status': old_status,
                'new_status': table.status
            }
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
