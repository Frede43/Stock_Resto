#!/usr/bin/env python3
"""
Script pour créer des données de test pour l'architecture à deux niveaux
"""
import os
import sys
import django
from decimal import Decimal

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from products.models_enhanced import (
    IngredientCategory, Ingredient, MenuCategory, Recipe, 
    RecipeIngredient, MenuItem
)
from suppliers.models import Supplier

def create_enhanced_test_data():
    """Créer des données de test pour l'architecture améliorée"""
    
    print("🚀 Création des données pour l'architecture à deux niveaux...")
    
    # 1. Créer les catégories d'ingrédients
    print("\n📂 Création des catégories d'ingrédients...")
    ingredient_categories = [
        {'name': 'Protéines', 'type': 'proteins'},
        {'name': 'Légumes', 'type': 'vegetables'},
        {'name': 'Céréales', 'type': 'grains'},
        {'name': 'Produits laitiers', 'type': 'dairy'},
        {'name': 'Épices', 'type': 'spices'},
        {'name': 'Base boissons', 'type': 'beverages_base'},
        {'name': 'Alcool', 'type': 'alcohol'},
        {'name': 'Condiments', 'type': 'condiments'},
    ]
    
    for cat_data in ingredient_categories:
        category, created = IngredientCategory.objects.get_or_create(
            name=cat_data['name'],
            defaults={'type': cat_data['type']}
        )
        if created:
            print(f"✅ Catégorie ingrédient: {category.name}")
    
    # 2. Créer les ingrédients
    print("\n🥕 Création des ingrédients...")
    
    # Récupérer les catégories
    proteins = IngredientCategory.objects.get(name='Protéines')
    vegetables = IngredientCategory.objects.get(name='Légumes')
    grains = IngredientCategory.objects.get(name='Céréales')
    dairy = IngredientCategory.objects.get(name='Produits laitiers')
    spices = IngredientCategory.objects.get(name='Épices')
    beverages = IngredientCategory.objects.get(name='Base boissons')
    alcohol = IngredientCategory.objects.get(name='Alcool')
    condiments = IngredientCategory.objects.get(name='Condiments')
    
    ingredients_data = [
        # Protéines
        {'name': 'Viande de bœuf', 'category': proteins, 'stock': 5.0, 'unit': 'kg', 'cost': 8000, 'min_stock': 1.0},
        {'name': 'Poulet', 'category': proteins, 'stock': 3.0, 'unit': 'kg', 'cost': 6000, 'min_stock': 0.5},
        {'name': 'Poisson', 'category': proteins, 'stock': 2.0, 'unit': 'kg', 'cost': 7000, 'min_stock': 0.5},
        
        # Légumes
        {'name': 'Tomates', 'category': vegetables, 'stock': 10.0, 'unit': 'kg', 'cost': 1500, 'min_stock': 2.0},
        {'name': 'Oignons', 'category': vegetables, 'stock': 8.0, 'unit': 'kg', 'cost': 1200, 'min_stock': 1.0},
        {'name': 'Salade', 'category': vegetables, 'stock': 5.0, 'unit': 'kg', 'cost': 2000, 'min_stock': 1.0},
        {'name': 'Pommes de terre', 'category': vegetables, 'stock': 20.0, 'unit': 'kg', 'cost': 800, 'min_stock': 5.0},
        
        # Céréales
        {'name': 'Pain', 'category': grains, 'stock': 50, 'unit': 'pieces', 'cost': 500, 'min_stock': 10},
        {'name': 'Riz', 'category': grains, 'stock': 25.0, 'unit': 'kg', 'cost': 1800, 'min_stock': 5.0},
        {'name': 'Pâtes', 'category': grains, 'stock': 15.0, 'unit': 'kg', 'cost': 2200, 'min_stock': 3.0},
        
        # Produits laitiers
        {'name': 'Fromage', 'category': dairy, 'stock': 2.0, 'unit': 'kg', 'cost': 5000, 'min_stock': 0.5},
        {'name': 'Lait', 'category': dairy, 'stock': 10.0, 'unit': 'l', 'cost': 1000, 'min_stock': 2.0},
        
        # Épices et condiments
        {'name': 'Sel', 'category': spices, 'stock': 5.0, 'unit': 'kg', 'cost': 500, 'min_stock': 1.0},
        {'name': 'Poivre', 'category': spices, 'stock': 1.0, 'unit': 'kg', 'cost': 8000, 'min_stock': 0.2},
        {'name': 'Huile', 'category': condiments, 'stock': 8.0, 'unit': 'l', 'cost': 3000, 'min_stock': 2.0},
        
        # Boissons
        {'name': 'Eau gazeuse', 'category': beverages, 'stock': 100, 'unit': 'pieces', 'cost': 800, 'min_stock': 20},
        {'name': 'Sirop de fruits', 'category': beverages, 'stock': 5.0, 'unit': 'l', 'cost': 4000, 'min_stock': 1.0},
        
        # Alcool
        {'name': 'Bière Primus', 'category': alcohol, 'stock': 200, 'unit': 'pieces', 'cost': 1500, 'min_stock': 50},
        {'name': 'Vin rouge', 'category': alcohol, 'stock': 20, 'unit': 'pieces', 'cost': 8000, 'min_stock': 5},
        {'name': 'Whisky', 'category': alcohol, 'stock': 5, 'unit': 'pieces', 'cost': 25000, 'min_stock': 2},
    ]
    
    for ing_data in ingredients_data:
        ingredient, created = Ingredient.objects.get_or_create(
            name=ing_data['name'],
            defaults={
                'category': ing_data['category'],
                'current_stock': ing_data['stock'],
                'unit': ing_data['unit'],
                'cost_per_unit': ing_data['cost'],
                'minimum_stock': ing_data['min_stock']
            }
        )
        if created:
            print(f"✅ Ingrédient: {ingredient.name} ({ingredient.current_stock} {ingredient.unit})")
    
    # 3. Créer les catégories de menu
    print("\n📋 Création des catégories de menu...")
    menu_categories = [
        {'name': 'Boissons', 'type': 'beverages', 'order': 1},
        {'name': 'Cocktails', 'type': 'cocktails', 'order': 2},
        {'name': 'Entrées', 'type': 'appetizers', 'order': 3},
        {'name': 'Plats principaux', 'type': 'main_courses', 'order': 4},
        {'name': 'Snacks', 'type': 'snacks', 'order': 5},
    ]
    
    for cat_data in menu_categories:
        category, created = MenuCategory.objects.get_or_create(
            name=cat_data['name'],
            defaults={
                'type': cat_data['type'],
                'display_order': cat_data['order']
            }
        )
        if created:
            print(f"✅ Catégorie menu: {category.name}")
    
    # 4. Créer des recettes
    print("\n👨‍🍳 Création des recettes...")
    
    # Récupérer les ingrédients
    viande = Ingredient.objects.get(name='Viande de bœuf')
    pain = Ingredient.objects.get(name='Pain')
    tomates = Ingredient.objects.get(name='Tomates')
    salade = Ingredient.objects.get(name='Salade')
    fromage = Ingredient.objects.get(name='Fromage')
    poulet = Ingredient.objects.get(name='Poulet')
    riz = Ingredient.objects.get(name='Riz')
    
    # Recette Burger
    burger_recipe, created = Recipe.objects.get_or_create(
        name='Burger Deluxe',
        defaults={
            'description': 'Burger avec viande, fromage et légumes',
            'instructions': '1. Griller la viande\n2. Toaster le pain\n3. Assembler',
            'prep_time': 15,
            'cook_time': 10,
            'portions': 1
        }
    )
    if created:
        print(f"✅ Recette: {burger_recipe.name}")
        
        # Ingrédients du burger
        RecipeIngredient.objects.create(recipe=burger_recipe, ingredient=viande, quantity=0.15, unit='kg')
        RecipeIngredient.objects.create(recipe=burger_recipe, ingredient=pain, quantity=1, unit='pieces')
        RecipeIngredient.objects.create(recipe=burger_recipe, ingredient=tomates, quantity=0.05, unit='kg')
        RecipeIngredient.objects.create(recipe=burger_recipe, ingredient=salade, quantity=0.03, unit='kg')
        RecipeIngredient.objects.create(recipe=burger_recipe, ingredient=fromage, quantity=0.05, unit='kg')
    
    # Recette Poulet au riz
    poulet_recipe, created = Recipe.objects.get_or_create(
        name='Poulet au riz',
        defaults={
            'description': 'Poulet grillé avec riz et légumes',
            'instructions': '1. Cuire le riz\n2. Griller le poulet\n3. Servir ensemble',
            'prep_time': 20,
            'cook_time': 25,
            'portions': 1
        }
    )
    if created:
        print(f"✅ Recette: {poulet_recipe.name}")
        
        # Ingrédients du poulet au riz
        RecipeIngredient.objects.create(recipe=poulet_recipe, ingredient=poulet, quantity=0.2, unit='kg')
        RecipeIngredient.objects.create(recipe=poulet_recipe, ingredient=riz, quantity=0.15, unit='kg')
        RecipeIngredient.objects.create(recipe=poulet_recipe, ingredient=tomates, quantity=0.08, unit='kg')
    
    # 5. Créer les articles du menu
    print("\n🍽️ Création des articles du menu...")
    
    # Récupérer les catégories de menu
    boissons_cat = MenuCategory.objects.get(name='Boissons')
    plats_cat = MenuCategory.objects.get(name='Plats principaux')
    
    # Articles du menu
    menu_items = [
        # Boissons simples (stock direct)
        {
            'name': 'Bière Primus',
            'category': boissons_cat,
            'type': 'simple',
            'price': 3000,
            'stock': 45,
            'description': 'Bière locale fraîche'
        },
        {
            'name': 'Eau gazeuse',
            'category': boissons_cat,
            'type': 'simple',
            'price': 1500,
            'stock': 80,
            'description': 'Eau gazeuse rafraîchissante'
        },
        
        # Plats basés sur recettes
        {
            'name': 'Burger Deluxe',
            'category': plats_cat,
            'type': 'recipe',
            'price': 15000,
            'recipe': burger_recipe,
            'description': 'Burger premium avec viande de qualité'
        },
        {
            'name': 'Poulet au riz',
            'category': plats_cat,
            'type': 'recipe',
            'price': 12000,
            'recipe': poulet_recipe,
            'description': 'Poulet grillé avec riz parfumé'
        },
    ]
    
    for item_data in menu_items:
        menu_item, created = MenuItem.objects.get_or_create(
            name=item_data['name'],
            defaults={
                'category': item_data['category'],
                'type': item_data['type'],
                'selling_price': item_data['price'],
                'description': item_data['description'],
                'recipe': item_data.get('recipe'),
                'direct_stock': item_data.get('stock', 0)
            }
        )
        if created:
            print(f"✅ Article menu: {menu_item.name} - {menu_item.selling_price} BIF")
    
    print("\n🎉 Données créées avec succès !")
    print("\n📊 Résumé:")
    print(f"   • Catégories d'ingrédients: {IngredientCategory.objects.count()}")
    print(f"   • Ingrédients: {Ingredient.objects.count()}")
    print(f"   • Catégories de menu: {MenuCategory.objects.count()}")
    print(f"   • Recettes: {Recipe.objects.count()}")
    print(f"   • Articles du menu: {MenuItem.objects.count()}")

if __name__ == '__main__':
    create_enhanced_test_data()
