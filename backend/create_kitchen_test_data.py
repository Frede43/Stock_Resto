#!/usr/bin/env python
"""
Script pour créer des données de test spécifiques à la cuisine
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
from suppliers.models import Supplier

def create_kitchen_test_data():
    print("🍽️ Création des données de test pour la cuisine...")
    
    # Créer des fournisseurs
    print("🚚 Création des fournisseurs...")
    suppliers_data = [
        {'name': 'Marché Central Bujumbura', 'contact_person': 'Jean Baptiste', 'phone': '+257 22 123 456'},
        {'name': 'Ferme Bio Burundi', 'contact_person': 'Marie Claire', 'phone': '+257 22 789 012'},
        {'name': 'Distributeur Alimentaire', 'contact_person': 'Pierre Nkurunziza', 'phone': '+257 22 345 678'},
    ]
    
    for supplier_data in suppliers_data:
        supplier, created = Supplier.objects.get_or_create(
            name=supplier_data['name'],
            defaults=supplier_data
        )
        if created:
            print(f"✅ Fournisseur {supplier.name} créé")
        else:
            print(f"ℹ️ Fournisseur {supplier.name} existe déjà")
    
    # Créer des ingrédients avec différents niveaux de stock
    print("🥬 Création des ingrédients...")
    marche_central = Supplier.objects.get(name='Marché Central Bujumbura')
    ferme_bio = Supplier.objects.get(name='Ferme Bio Burundi')
    
    ingredients_data = [
        # Ingrédients en rupture (pour tester les alertes critiques)
        {'nom': 'Tomates', 'quantite_restante': 0, 'unite': 'kg', 'seuil_alerte': 5, 'prix_unitaire': 1200, 'supplier': marche_central},
        {'nom': 'Oignons', 'quantite_restante': 0, 'unite': 'kg', 'seuil_alerte': 3, 'prix_unitaire': 800, 'supplier': marche_central},
        
        # Ingrédients en stock faible (pour tester les alertes d'avertissement)
        {'nom': 'Riz', 'quantite_restante': 2, 'unite': 'kg', 'seuil_alerte': 10, 'prix_unitaire': 1500, 'supplier': ferme_bio},
        {'nom': 'Huile de palme', 'quantite_restante': 1, 'unite': 'L', 'seuil_alerte': 5, 'prix_unitaire': 3000, 'supplier': marche_central},
        {'nom': 'Poulet', 'quantite_restante': 3, 'unite': 'kg', 'seuil_alerte': 8, 'prix_unitaire': 4500, 'supplier': ferme_bio},
        
        # Ingrédients avec stock correct
        {'nom': 'Haricots', 'quantite_restante': 15, 'unite': 'kg', 'seuil_alerte': 5, 'prix_unitaire': 1800, 'supplier': ferme_bio},
        {'nom': 'Pommes de terre', 'quantite_restante': 20, 'unite': 'kg', 'seuil_alerte': 8, 'prix_unitaire': 900, 'supplier': marche_central},
        {'nom': 'Carottes', 'quantite_restante': 12, 'unite': 'kg', 'seuil_alerte': 4, 'prix_unitaire': 1100, 'supplier': marche_central},
        {'nom': 'Épices mélangées', 'quantite_restante': 2, 'unite': 'kg', 'seuil_alerte': 1, 'prix_unitaire': 5000, 'supplier': marche_central},
        {'nom': 'Sel', 'quantite_restante': 5, 'unite': 'kg', 'seuil_alerte': 2, 'prix_unitaire': 500, 'supplier': marche_central},
        
        # Ingrédients pour boissons
        {'nom': 'Citrons', 'quantite_restante': 8, 'unite': 'kg', 'seuil_alerte': 3, 'prix_unitaire': 2000, 'supplier': marche_central},
        {'nom': 'Sucre', 'quantite_restante': 25, 'unite': 'kg', 'seuil_alerte': 10, 'prix_unitaire': 1200, 'supplier': ferme_bio},
    ]
    
    for ing_data in ingredients_data:
        ingredient, created = Ingredient.objects.get_or_create(
            nom=ing_data['nom'],
            defaults={
                'quantite_restante': Decimal(str(ing_data['quantite_restante'])),
                'unite': ing_data['unite'],
                'seuil_alerte': Decimal(str(ing_data['seuil_alerte'])),
                'prix_unitaire': Decimal(str(ing_data['prix_unitaire'])),
                'fournisseur': ing_data['supplier'],
                'description': f"Ingrédient de base: {ing_data['nom']}"
            }
        )
        if created:
            print(f"✅ Ingrédient {ingredient.nom} créé - Stock: {ingredient.quantite_restante} {ingredient.unite}")
        else:
            print(f"ℹ️ Ingrédient {ingredient.nom} existe déjà")
    
    # Créer des catégories de plats
    print("🍽️ Création des catégories de plats...")
    plats_cat, created = Category.objects.get_or_create(
        name='Plats',
        defaults={'description': 'Plats principaux'}
    )
    if created:
        print(f"✅ Catégorie {plats_cat.name} créée")
    
    # Créer des produits avec recettes
    print("🍛 Création des produits avec recettes...")
    
    # Produit 1: Riz au Poulet Maison
    riz_poulet, created = Product.objects.get_or_create(
        name='Riz au Poulet Maison',
        defaults={
            'category': plats_cat,
            'selling_price': Decimal('5000'),
            'purchase_price': Decimal('0'),  # Sera calculé automatiquement
            'current_stock': 50,
            'minimum_stock': 5,
            'unit': 'portion',
            'description': 'Plat traditionnel burundais'
        }
    )
    if created:
        print(f"✅ Produit {riz_poulet.name} créé")
    
    # Créer la recette pour Riz au Poulet
    recette_riz_poulet, created = Recipe.objects.get_or_create(
        produit=riz_poulet,
        defaults={
            'nom': 'Recette Riz au Poulet Maison',
            'description': 'Recette traditionnelle du riz au poulet',
            'portions': 1,
            'temps_preparation': 45,
            'instructions': 'Cuire le riz, préparer le poulet avec les légumes et épices'
        }
    )
    if created:
        print(f"✅ Recette {recette_riz_poulet.nom} créée")
        
        # Ajouter les ingrédients à la recette
        ingredients_recette = [
            {'ingredient': 'Riz', 'quantite': Decimal('0.3')},  # 300g de riz
            {'ingredient': 'Poulet', 'quantite': Decimal('0.4')},  # 400g de poulet
            {'ingredient': 'Tomates', 'quantite': Decimal('0.2')},  # 200g de tomates
            {'ingredient': 'Oignons', 'quantite': Decimal('0.1')},  # 100g d'oignons
            {'ingredient': 'Huile de palme', 'quantite': Decimal('0.05')},  # 50ml d'huile
            {'ingredient': 'Épices mélangées', 'quantite': Decimal('0.02')},  # 20g d'épices
        ]
        
        for ing_rec in ingredients_recette:
            try:
                ingredient = Ingredient.objects.get(nom=ing_rec['ingredient'])
                RecipeIngredient.objects.get_or_create(
                    recette=recette_riz_poulet,
                    ingredient=ingredient,
                    defaults={'quantite_necessaire': ing_rec['quantite']}
                )
                print(f"  ✅ Ingrédient {ingredient.nom} ajouté à la recette")
            except Ingredient.DoesNotExist:
                print(f"  ❌ Ingrédient {ing_rec['ingredient']} non trouvé")
    
    # Produit 2: Haricots aux Légumes
    haricots_legumes, created = Product.objects.get_or_create(
        name='Haricots aux Légumes',
        defaults={
            'category': plats_cat,
            'selling_price': Decimal('3500'),
            'purchase_price': Decimal('0'),
            'current_stock': 30,
            'minimum_stock': 5,
            'unit': 'portion',
            'description': 'Haricots mijotés avec légumes frais'
        }
    )
    if created:
        print(f"✅ Produit {haricots_legumes.name} créé")
    
    # Créer la recette pour Haricots aux Légumes
    recette_haricots, created = Recipe.objects.get_or_create(
        produit=haricots_legumes,
        defaults={
            'nom': 'Recette Haricots aux Légumes',
            'description': 'Haricots mijotés avec légumes de saison',
            'portions': 1,
            'temps_preparation': 60,
            'instructions': 'Cuire les haricots, ajouter les légumes et assaisonnements'
        }
    )
    if created:
        print(f"✅ Recette {recette_haricots.nom} créée")
        
        ingredients_haricots = [
            {'ingredient': 'Haricots', 'quantite': Decimal('0.25')},  # 250g
            {'ingredient': 'Carottes', 'quantite': Decimal('0.15')},  # 150g
            {'ingredient': 'Pommes de terre', 'quantite': Decimal('0.2')},  # 200g
            {'ingredient': 'Oignons', 'quantite': Decimal('0.1')},  # 100g
            {'ingredient': 'Huile de palme', 'quantite': Decimal('0.03')},  # 30ml
            {'ingredient': 'Sel', 'quantite': Decimal('0.01')},  # 10g
        ]
        
        for ing_rec in ingredients_haricots:
            try:
                ingredient = Ingredient.objects.get(nom=ing_rec['ingredient'])
                RecipeIngredient.objects.get_or_create(
                    recette=recette_haricots,
                    ingredient=ingredient,
                    defaults={'quantite_necessaire': ing_rec['quantite']}
                )
                print(f"  ✅ Ingrédient {ingredient.nom} ajouté à la recette")
            except Ingredient.DoesNotExist:
                print(f"  ❌ Ingrédient {ing_rec['ingredient']} non trouvé")
    
    # Afficher les statistiques
    print("\n📊 Statistiques de la cuisine:")
    print(f"Fournisseurs: {Supplier.objects.count()}")
    print(f"Ingrédients: {Ingredient.objects.count()}")
    print(f"Recettes: {Recipe.objects.count()}")
    print(f"Ingrédients de recettes: {RecipeIngredient.objects.count()}")
    
    # Afficher les alertes
    from django.db import models
    ingredients_rupture = Ingredient.objects.filter(quantite_restante=0)
    ingredients_faible = Ingredient.objects.filter(
        quantite_restante__gt=0,
        quantite_restante__lte=models.F('seuil_alerte')
    )
    
    print(f"\n🚨 Alertes:")
    print(f"Ruptures de stock: {ingredients_rupture.count()}")
    print(f"Stocks faibles: {ingredients_faible.count()}")
    
    if ingredients_rupture.exists():
        print("  Ruptures:")
        for ing in ingredients_rupture:
            print(f"    - {ing.nom}")
    
    if ingredients_faible.exists():
        print("  Stocks faibles:")
        for ing in ingredients_faible:
            print(f"    - {ing.nom}: {ing.quantite_restante}/{ing.seuil_alerte} {ing.unite}")
    
    print("\n🎉 Données de test cuisine créées avec succès!")
    print("🔗 Vous pouvez maintenant tester la page Kitchen dans l'interface web")

if __name__ == '__main__':
    create_kitchen_test_data()
