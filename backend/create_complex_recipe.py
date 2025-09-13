#!/usr/bin/env python
"""
Script pour créer une recette complexe avec de nombreux ingrédients
Test du système de gestion transactionnelle
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


def create_additional_ingredients():
    """Créer des ingrédients supplémentaires pour la recette complexe"""
    
    additional_ingredients = [
        {
            'nom': 'Beurre',
            'quantite_restante': Decimal('1.000'),
            'unite': 'kg',
            'seuil_alerte': Decimal('0.200'),
            'prix_unitaire': Decimal('4000.00'),
            'description': 'Beurre de cuisine'
        },
        {
            'nom': 'Lait',
            'quantite_restante': Decimal('3.000'),
            'unite': 'L',
            'seuil_alerte': Decimal('0.500'),
            'prix_unitaire': Decimal('1500.00'),
            'description': 'Lait frais'
        },
        {
            'nom': 'Farine',
            'quantite_restante': Decimal('5.000'),
            'unite': 'kg',
            'seuil_alerte': Decimal('1.000'),
            'prix_unitaire': Decimal('1000.00'),
            'description': 'Farine de blé'
        },
        {
            'nom': 'Œufs',
            'quantite_restante': Decimal('2.000'),  # 2 kg (environ 30 œufs)
            'unite': 'kg',
            'seuil_alerte': Decimal('0.500'),
            'prix_unitaire': Decimal('3000.00'),
            'description': 'Œufs frais'
        },
        {
            'nom': 'Carottes',
            'quantite_restante': Decimal('2.500'),
            'unite': 'kg',
            'seuil_alerte': Decimal('0.500'),
            'prix_unitaire': Decimal('700.00'),
            'description': 'Carottes fraîches'
        },
        {
            'nom': 'Pommes de terre',
            'quantite_restante': Decimal('8.000'),
            'unite': 'kg',
            'seuil_alerte': Decimal('2.000'),
            'prix_unitaire': Decimal('500.00'),
            'description': 'Pommes de terre'
        },
        {
            'nom': 'Persil',
            'quantite_restante': Decimal('0.200'),
            'unite': 'kg',
            'seuil_alerte': Decimal('0.050'),
            'prix_unitaire': Decimal('8000.00'),
            'description': 'Persil frais'
        },
        {
            'nom': 'Thym',
            'quantite_restante': Decimal('0.100'),
            'unite': 'kg',
            'seuil_alerte': Decimal('0.020'),
            'prix_unitaire': Decimal('12000.00'),
            'description': 'Thym séché'
        },
        {
            'nom': 'Laurier',
            'quantite_restante': Decimal('0.050'),
            'unite': 'kg',
            'seuil_alerte': Decimal('0.010'),
            'prix_unitaire': Decimal('15000.00'),
            'description': 'Feuilles de laurier'
        },
        {
            'nom': 'Vin blanc',
            'quantite_restante': Decimal('1.500'),
            'unite': 'L',
            'seuil_alerte': Decimal('0.250'),
            'prix_unitaire': Decimal('8000.00'),
            'description': 'Vin blanc de cuisine'
        },
        {
            'nom': 'Bouillon de poule',
            'quantite_restante': Decimal('2.000'),
            'unite': 'L',
            'seuil_alerte': Decimal('0.500'),
            'prix_unitaire': Decimal('2500.00'),
            'description': 'Bouillon de poule concentré'
        }
    ]
    
    created = []
    for ingredient_data in additional_ingredients:
        ingredient, was_created = Ingredient.objects.get_or_create(
            nom=ingredient_data['nom'],
            defaults=ingredient_data
        )
        if was_created:
            created.append(ingredient)
            print(f"✅ Ingrédient créé: {ingredient.nom}")
    
    return created


def create_complex_recipe():
    """Créer une recette complexe: Coq au Vin Burundais (15 ingrédients)"""
    
    # Créer le produit
    plat_category = Category.objects.get_or_create(
        name='Plats principaux',
        defaults={'type': 'plats', 'description': 'Plats de résistance'}
    )[0]
    
    coq_au_vin, created = Product.objects.get_or_create(
        name='Coq au Vin Burundais',
        category=plat_category,
        defaults={
            'unit': 'portion',
            'purchase_price': Decimal('4500.00'),
            'selling_price': Decimal('7500.00'),
            'current_stock': 15,
            'minimum_stock': 3,
            'description': 'Spécialité burundaise: coq mijoté au vin blanc avec légumes'
        }
    )
    
    if not created and hasattr(coq_au_vin, 'recipe'):
        print(f"⚠️ La recette pour {coq_au_vin.name} existe déjà")
        return coq_au_vin.recipe
    
    # Récupérer un utilisateur
    user = User.objects.filter(is_superuser=True).first() or User.objects.first()
    if not user:
        print("❌ Aucun utilisateur trouvé")
        return None
    
    # Créer la recette
    recipe = Recipe.objects.create(
        plat=coq_au_vin,
        nom_recette='Coq au Vin Burundais Traditionnel',
        description='Recette traditionnelle burundaise du coq au vin avec 15 ingrédients soigneusement sélectionnés',
        instructions="""
1. Découper le poulet en morceaux et le faire mariner 2h dans le vin blanc
2. Éplucher et couper les légumes (carottes, pommes de terre, oignons)
3. Faire revenir le poulet dans le beurre et l'huile
4. Ajouter les oignons et l'ail, faire dorer
5. Saupoudrer de farine, mélanger
6. Verser le vin de marinade et le bouillon
7. Ajouter les herbes (thym, laurier, persil)
8. Laisser mijoter 45 minutes
9. Ajouter les légumes et cuire 30 minutes
10. Assaisonner et servir avec du riz
        """.strip(),
        temps_preparation=120,  # 2 heures
        portions=1,
        created_by=user
    )
    
    # Définir les ingrédients et leurs quantités (pour 1 portion)
    ingredients_recipe = [
        ('Poulet', Decimal('0.600')),      # 600g de poulet
        ('Vin blanc', Decimal('0.200')),   # 200ml de vin
        ('Bouillon de poule', Decimal('0.150')), # 150ml de bouillon
        ('Oignons', Decimal('0.100')),     # 100g d'oignons
        ('Carottes', Decimal('0.150')),    # 150g de carottes
        ('Pommes de terre', Decimal('0.300')), # 300g de pommes de terre
        ('Ail', Decimal('0.015')),         # 15g d'ail
        ('Beurre', Decimal('0.030')),      # 30g de beurre
        ('Huile', Decimal('0.020')),       # 20ml d'huile
        ('Farine', Decimal('0.025')),      # 25g de farine
        ('Thym', Decimal('0.002')),        # 2g de thym
        ('Laurier', Decimal('0.001')),     # 1g de laurier
        ('Persil', Decimal('0.010')),      # 10g de persil
        ('Sel', Decimal('0.008')),         # 8g de sel
        ('Épices', Decimal('0.005'))       # 5g d'épices mélangées
    ]
    
    # Créer les liens ingrédients-recette
    created_links = []
    for ingredient_name, quantity in ingredients_recipe:
        try:
            ingredient = Ingredient.objects.get(nom=ingredient_name)
            
            recipe_ingredient = RecipeIngredient.objects.create(
                recipe=recipe,
                ingredient=ingredient,
                quantite_utilisee_par_plat=quantity,
                unite=ingredient.unite,
                is_optional=False  # Tous les ingrédients sont obligatoires
            )
            created_links.append(recipe_ingredient)
            print(f"  ✅ {ingredient_name}: {quantity} {ingredient.unite}")
            
        except Ingredient.DoesNotExist:
            print(f"  ❌ Ingrédient manquant: {ingredient_name}")
    
    print(f"\n🍽️ Recette créée: {recipe.nom_recette}")
    print(f"   📊 Ingrédients: {len(created_links)}/15")
    print(f"   💰 Coût estimé: {recipe.total_cost:.0f} BIF")
    print(f"   ⏱️ Temps de préparation: {recipe.temps_preparation} minutes")
    
    return recipe


def test_complex_recipe():
    """Tester la recette complexe"""
    
    print("\n🧪 TEST DE LA RECETTE COMPLEXE")
    print("=" * 50)
    
    try:
        recipe = Recipe.objects.get(nom_recette='Coq au Vin Burundais Traditionnel')
    except Recipe.DoesNotExist:
        print("❌ Recette non trouvée")
        return
    
    print(f"📝 Recette: {recipe.nom_recette}")
    print(f"📊 Nombre d'ingrédients: {recipe.ingredients.count()}")
    
    # Test 1: Vérifier la disponibilité pour 1 portion
    print(f"\n🔍 Test 1: Disponibilité pour 1 portion")
    validation = recipe.validate_ingredients_availability(1)
    print(f"   Peut être préparée: {'✅ OUI' if validation['can_prepare'] else '❌ NON'}")
    print(f"   Ingrédients disponibles: {validation['available_count']}/{validation['total_ingredients']}")
    
    if validation['missing_ingredients']:
        print(f"   Ingrédients manquants:")
        for missing in validation['missing_ingredients']:
            print(f"     - {missing['name']}: besoin {missing['needed']} {missing['unit']}, disponible {missing['available']}")
    
    # Test 2: Vérifier pour 5 portions (stress test)
    print(f"\n🔍 Test 2: Disponibilité pour 5 portions (stress test)")
    validation_5 = recipe.validate_ingredients_availability(5)
    print(f"   Peut être préparée: {'✅ OUI' if validation_5['can_prepare'] else '❌ NON'}")
    print(f"   Ingrédients disponibles: {validation_5['available_count']}/{validation_5['total_ingredients']}")
    
    if validation_5['missing_ingredients']:
        print(f"   Ingrédients manquants pour 5 portions:")
        for missing in validation_5['missing_ingredients']:
            print(f"     - {missing['name']}: besoin {missing['needed']} {missing['unit']}, disponible {missing['available']}")
    
    # Test 3: Simulation de préparation (si possible)
    if validation['can_prepare']:
        print(f"\n⚡ Test 3: Simulation de préparation d'1 portion")
        try:
            user = User.objects.first()
            consumed = recipe.consume_ingredients(quantity=1, user=user)
            print(f"   ✅ Préparation réussie!")
            print(f"   📋 Ingrédients consommés:")
            for item in consumed:
                print(f"     - {item['ingredient'].nom}: -{item['quantity_consumed']} {item['ingredient'].unite}")
        except Exception as e:
            print(f"   ❌ Erreur lors de la préparation: {e}")
    
    print(f"\n📊 Résumé du coût:")
    print(f"   Coût des ingrédients: {recipe.total_cost:.0f} BIF")
    print(f"   Prix de vente: {recipe.plat.selling_price:.0f} BIF")
    print(f"   Marge bénéficiaire: {recipe.plat.selling_price - recipe.total_cost:.0f} BIF")


if __name__ == '__main__':
    print("🍽️ CRÉATION D'UNE RECETTE COMPLEXE")
    print("=" * 50)
    
    print("\n1. Création des ingrédients supplémentaires...")
    create_additional_ingredients()
    
    print("\n2. Création de la recette complexe...")
    recipe = create_complex_recipe()
    
    if recipe:
        print("\n3. Tests de la recette...")
        test_complex_recipe()
    
    print(f"\n✅ Terminé!")
    print(f"📊 Total ingrédients: {Ingredient.objects.count()}")
    print(f"📝 Total recettes: {Recipe.objects.count()}")
