"""
URLs pour l'architecture à deux niveaux
"""

from django.urls import path
from . import api_enhanced

app_name = 'products_enhanced'

urlpatterns = [
    # ==================== SALES API (Niveau Commercial) ====================
    
    # Menu commercial pour la page Sales
    path('sales/menu/', api_enhanced.sales_menu, name='sales_menu'),
    
    # Traitement des ventes
    path('sales/process/', api_enhanced.process_sale, name='process_sale'),

    # Gestion des tables
    path('sales/free-table/<int:table_id>/', api_enhanced.free_table, name='free_table'),

    # Vérification de disponibilité
    path('sales/availability/<int:item_id>/', api_enhanced.item_availability, name='item_availability'),
    
    # ==================== KITCHEN API (Niveau Technique) ====================
    
    # Dashboard cuisine
    path('kitchen/dashboard/', api_enhanced.kitchen_dashboard, name='kitchen_dashboard'),
    
    # Gestion des ingrédients
    path('kitchen/ingredients/', api_enhanced.ingredients_list, name='ingredients_list'),
    path('kitchen/ingredients/<int:ingredient_id>/update-stock/', api_enhanced.update_ingredient_stock, name='update_ingredient_stock'),
    
    # Gestion des recettes
    path('kitchen/recipes/', api_enhanced.recipes_list, name='recipes_list'),
]
