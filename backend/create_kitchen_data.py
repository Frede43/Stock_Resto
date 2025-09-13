#!/usr/bin/env python
"""
Script pour créer des données d'exemple pour la cuisine
Basé sur l'exemple fourni par Alain
"""
import os
import sys
import django
from decimal import Decimal

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from kitchen.models import Ingredient, Recipe, RecipeIngredient
from products.models import Product, Category
from accounts.models import User


def create_ingredients():
    """Créer les ingrédients selon l'exemple du cahier des charges"""
    
    ingredients_data = [
        {
            'nom': 'Poulet',
            'quantite_restante': Decimal('10.000'),
            'unite': 'kg',
            'seuil_alerte': Decimal('2.000'),
            'prix_unitaire': Decimal('3500.00'),  # 3500 BIF/kg
            'description': 'Poulet frais pour les plats principaux'
        },
        {
            'nom': 'Riz',
            'quantite_restante': Decimal('5.000'),
            'unite': 'kg',
            'seuil_alerte': Decimal('1.000'),
            'prix_unitaire': Decimal('1200.00'),  # 1200 BIF/kg
            'description': 'Riz blanc de qualité'
        },
        {
            'nom': 'Huile',
            'quantite_restante': Decimal('2.000'),
            'unite': 'L',
            'seuil_alerte': Decimal('0.500'),
            'prix_unitaire': Decimal('2000.00'),  # 2000 BIF/L
            'description': 'Huile de cuisson'
        },
        {
            'nom': 'Tomates',
            'quantite_restante': Decimal('3.000'),
            'unite': 'kg',
            'seuil_alerte': Decimal('0.500'),
            'prix_unitaire': Decimal('800.00'),  # 800 BIF/kg
            'description': 'Tomates fraîches'
        },
        {
            'nom': 'Épices',
            'quantite_restante': Decimal('0.500'),  # 500g = 0.5kg
            'unite': 'kg',
            'seuil_alerte': Decimal('0.050'),  # 50g = 0.05kg
            'prix_unitaire': Decimal('15000.00'),  # 15000 BIF/kg
            'description': 'Mélange d\'épices pour assaisonnement'
        },
        # Ingrédients supplémentaires
        {
            'nom': 'Oignons',
            'quantite_restante': Decimal('2.500'),
            'unite': 'kg',
            'seuil_alerte': Decimal('0.500'),
            'prix_unitaire': Decimal('600.00'),
            'description': 'Oignons frais'
        },
        {
            'nom': 'Ail',
            'quantite_restante': Decimal('0.300'),
            'unite': 'kg',
            'seuil_alerte': Decimal('0.100'),
            'prix_unitaire': Decimal('5000.00'),
            'description': 'Ail frais'
        },
        {
            'nom': 'Sel',
            'quantite_restante': Decimal('1.000'),
            'unite': 'kg',
            'seuil_alerte': Decimal('0.200'),
            'prix_unitaire': Decimal('500.00'),
            'description': 'Sel de cuisine'
        }
    ]
    
    created_ingredients = []
    for ingredient_data in ingredients_data:
        ingredient, created = Ingredient.objects.get_or_create(
            nom=ingredient_data['nom'],
            defaults=ingredient_data
        )
        if created:
            created_ingredients.append(ingredient)
            print(f"Ingrédient créé: {ingredient.nom} - {ingredient.quantite_restante} {ingredient.unite}")
    
    return created_ingredients


def create_recipes():
    """Créer les recettes selon l'exemple du cahier des charges"""
    
    # Récupérer les ingrédients
    try:
        poulet = Ingredient.objects.get(nom='Poulet')
        riz = Ingredient.objects.get(nom='Riz')
        huile = Ingredient.objects.get(nom='Huile')
        tomates = Ingredient.objects.get(nom='Tomates')
        epices = Ingredient.objects.get(nom='Épices')
        oignons = Ingredient.objects.get(nom='Oignons')
        ail = Ingredient.objects.get(nom='Ail')
        sel = Ingredient.objects.get(nom='Sel')
    except Ingredient.DoesNotExist as e:
        print(f"Erreur: Ingrédient manquant - {e}")
        return []
    
    # Récupérer ou créer les plats
    plat_category = Category.objects.get_or_create(
        name='Plats principaux',
        defaults={'type': 'plats', 'description': 'Plats de résistance'}
    )[0]
    
    # Créer les produits (plats) s'ils n'existent pas
    poulet_roti, created = Product.objects.get_or_create(
        name='Poulet rôti',
        category=plat_category,
        defaults={
            'unit': 'portion',
            'purchase_price': Decimal('2500.00'),
            'selling_price': Decimal('4000.00'),
            'current_stock': 20,
            'minimum_stock': 5
        }
    )
    
    riz_saute, created = Product.objects.get_or_create(
        name='Riz sauté',
        category=plat_category,
        defaults={
            'unit': 'portion',
            'purchase_price': Decimal('1500.00'),
            'selling_price': Decimal('2500.00'),
            'current_stock': 30,
            'minimum_stock': 10
        }
    )
    
    # Récupérer un utilisateur pour créer les recettes
    try:
        user = User.objects.filter(is_superuser=True).first()
        if not user:
            user = User.objects.first()
        if not user:
            print("Erreur: Aucun utilisateur trouvé pour créer les recettes")
            return []
    except:
        print("Erreur: Impossible de récupérer un utilisateur")
        return []
    
    created_recipes = []
    
    # Recette 1: Poulet rôti
    if not hasattr(poulet_roti, 'recipe') or not poulet_roti.recipe:
        recipe_poulet = Recipe.objects.create(
            plat=poulet_roti,
            nom_recette='Poulet rôti aux épices',
            description='Délicieux poulet rôti avec des épices locales',
            instructions='1. Nettoyer le poulet\n2. Assaisonner avec les épices\n3. Faire rôtir avec l\'huile\n4. Servir chaud',
            temps_preparation=45,
            portions=1,
            created_by=user
        )
        
        # Ingrédients pour le poulet rôti (selon l'exemple)
        RecipeIngredient.objects.create(
            recipe=recipe_poulet,
            ingredient=poulet,
            quantite_utilisee_par_plat=Decimal('0.500'),  # 0.5 kg
            unite='kg'
        )
        RecipeIngredient.objects.create(
            recipe=recipe_poulet,
            ingredient=huile,
            quantite_utilisee_par_plat=Decimal('0.050'),  # 50 ml = 0.05 L
            unite='L'
        )
        RecipeIngredient.objects.create(
            recipe=recipe_poulet,
            ingredient=epices,
            quantite_utilisee_par_plat=Decimal('0.010'),  # 10 g = 0.01 kg
            unite='kg'
        )
        RecipeIngredient.objects.create(
            recipe=recipe_poulet,
            ingredient=sel,
            quantite_utilisee_par_plat=Decimal('0.005'),  # 5 g = 0.005 kg
            unite='kg'
        )
        
        created_recipes.append(recipe_poulet)
        print(f"Recette créée: {recipe_poulet.nom_recette}")
    
    # Recette 2: Riz sauté
    if not hasattr(riz_saute, 'recipe') or not riz_saute.recipe:
        recipe_riz = Recipe.objects.create(
            plat=riz_saute,
            nom_recette='Riz sauté aux légumes',
            description='Riz sauté avec tomates et oignons',
            instructions='1. Faire cuire le riz\n2. Faire revenir les oignons\n3. Ajouter les tomates\n4. Mélanger avec le riz\n5. Assaisonner',
            temps_preparation=30,
            portions=1,
            created_by=user
        )
        
        # Ingrédients pour le riz sauté (selon l'exemple)
        RecipeIngredient.objects.create(
            recipe=recipe_riz,
            ingredient=riz,
            quantite_utilisee_par_plat=Decimal('0.300'),  # 0.3 kg
            unite='kg'
        )
        RecipeIngredient.objects.create(
            recipe=recipe_riz,
            ingredient=huile,
            quantite_utilisee_par_plat=Decimal('0.030'),  # 30 ml = 0.03 L
            unite='L'
        )
        RecipeIngredient.objects.create(
            recipe=recipe_riz,
            ingredient=tomates,
            quantite_utilisee_par_plat=Decimal('0.100'),  # 100 g = 0.1 kg
            unite='kg'
        )
        RecipeIngredient.objects.create(
            recipe=recipe_riz,
            ingredient=epices,
            quantite_utilisee_par_plat=Decimal('0.005'),  # 5 g = 0.005 kg
            unite='kg'
        )
        RecipeIngredient.objects.create(
            recipe=recipe_riz,
            ingredient=oignons,
            quantite_utilisee_par_plat=Decimal('0.050'),  # 50 g = 0.05 kg
            unite='kg'
        )
        RecipeIngredient.objects.create(
            recipe=recipe_riz,
            ingredient=ail,
            quantite_utilisee_par_plat=Decimal('0.010'),  # 10 g = 0.01 kg
            unite='kg'
        )
        RecipeIngredient.objects.create(
            recipe=recipe_riz,
            ingredient=sel,
            quantite_utilisee_par_plat=Decimal('0.003'),  # 3 g = 0.003 kg
            unite='kg'
        )
        
        created_recipes.append(recipe_riz)
        print(f"Recette créée: {recipe_riz.nom_recette}")
    
    return created_recipes


if __name__ == '__main__':
    print("Création des données d'exemple pour la cuisine...")
    print("Basé sur l'exemple du cahier des charges d'Alain")
    
    print("\n1. Création des ingrédients...")
    create_ingredients()
    
    print("\n2. Création des recettes...")
    create_recipes()
    
    print("\nDonnées de cuisine créées avec succès!")
    print(f"Ingrédients: {Ingredient.objects.count()}")
    print(f"Recettes: {Recipe.objects.count()}")
    print(f"Ingrédients de recettes: {RecipeIngredient.objects.count()}")
    
    print("\n📊 Résumé du stock actuel:")
    for ingredient in Ingredient.objects.all():
        status = "🔴 RUPTURE" if ingredient.is_out_of_stock else "🟡 ALERTE" if ingredient.is_low_stock else "🟢 OK"
        print(f"  {status} {ingredient.nom}: {ingredient.quantite_restante} {ingredient.unite} (seuil: {ingredient.seuil_alerte})")
