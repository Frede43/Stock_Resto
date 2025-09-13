#!/usr/bin/env python
"""
Créer un système complet de recettes dans Gestion Cuisine
avec calcul automatique des prix et gestion des stocks
"""

import os
import sys
import django
import requests

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

def create_complete_recipe_system():
    """
    Créer le système complet selon vos spécifications
    """
    base_url = "http://127.0.0.1:8000/api"
    
    print("🍽️ CRÉATION SYSTÈME COMPLET GESTION CUISINE")
    print("=" * 70)
    
    # Connexion
    login_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{base_url}/accounts/login/", json=login_data)
    access_token = response.json()['tokens']['access']
    headers = {'Authorization': f'Bearer {access_token}'}
    
    print("\n📦 ÉTAPE 1: CRÉATION DES INGRÉDIENTS AVEC STOCKS")
    print("-" * 50)
    
    # Créer les ingrédients avec stocks réalistes
    ingredients_data = [
        {
            "nom": "Riz Basmati",
            "quantite_restante": 100.0,  # 100 portions en stock
            "unite": "portion",
            "seuil_alerte": 20.0,
            "prix_unitaire": 300.0,  # 300 FBU par portion
            "description": "Riz basmati de qualité - coût par portion pour recette"
        },
        {
            "nom": "Poulet Frais",
            "quantite_restante": 50.0,   # 50 portions en stock
            "unite": "portion",
            "seuil_alerte": 10.0,
            "prix_unitaire": 2000.0,  # 2000 FBU par portion
            "description": "Poulet frais local - coût par portion pour recette"
        },
        {
            "nom": "Huile de Cuisson",
            "quantite_restante": 200.0,  # 200 portions en stock
            "unite": "portion",
            "seuil_alerte": 30.0,
            "prix_unitaire": 200.0,   # 200 FBU par portion
            "description": "Huile de tournesol - coût par portion pour recette"
        },
        {
            "nom": "Épices et Légumes",
            "quantite_restante": 150.0,  # 150 portions en stock
            "unite": "portion",
            "seuil_alerte": 25.0,
            "prix_unitaire": 500.0,   # 500 FBU par portion
            "description": "Mélange épices et légumes - coût par portion pour recette"
        }
    ]
    
    created_ingredients = []
    for ingredient_data in ingredients_data:
        response = requests.post(f"{base_url}/kitchen/ingredients/", json=ingredient_data, headers=headers)
        if response.status_code == 201:
            ingredient = response.json()
            created_ingredients.append(ingredient)
            print(f"✅ {ingredient['nom']}: {ingredient['quantite_restante']} {ingredient['unite']} × {ingredient['prix_unitaire']} FBU")
        else:
            print(f"❌ Erreur {ingredient_data['nom']}: {response.status_code}")
    
    print(f"\n🎯 {len(created_ingredients)} ingrédients créés avec stocks")
    
    print("\n🛍️ ÉTAPE 2: CRÉATION DU PRODUIT DANS PRODUCTS")
    print("-" * 50)
    
    # Récupérer les catégories
    categories_response = requests.get(f"{base_url}/products/categories/", headers=headers)
    categories = categories_response.json().get('results', [])
    category_id = categories[0]['id'] if categories else 1
    
    # Créer le produit "Riz au Poulet"
    product_data = {
        "name": "Riz au Poulet Maison",
        "description": "Plat signature du restaurant - recette maison",
        "category": category_id,
        "purchase_price": 0,      # Sera calculé automatiquement par la recette
        "selling_price": 5000,    # Prix de vente fixé par le bar
        "current_stock": 0,       # Stock sera géré par les recettes
        "min_stock": 5
    }
    
    response = requests.post(f"{base_url}/products/", json=product_data, headers=headers)
    if response.status_code == 201:
        product = response.json()
        print(f"✅ Produit créé: {product['name']} (ID: {product['id']})")
        print(f"   💰 Prix de vente fixé: {float(product['selling_price']):,.0f} FBU")
        print(f"   📦 Stock initial: {product['current_stock']}")
    else:
        print(f"❌ Erreur création produit: {response.status_code}")
        return
    
    print("\n🍽️ ÉTAPE 3: CRÉATION DE LA RECETTE DANS GESTION CUISINE")
    print("-" * 50)
    
    if len(created_ingredients) >= 4:
        # Créer la recette avec les ingrédients
        recipe_data = {
            "plat": product['id'],
            "nom_recette": "Riz au Poulet Maison",
            "description": "Recette signature: Riz + Poulet + Huile + Épices = 3000 FBU de coût",
            "temps_preparation": 45,
            "portions": 1,  # 1 assiette
            "instructions": "1. Cuire le riz basmati (300 FBU)\n2. Préparer le poulet frais (2000 FBU)\n3. Ajouter huile de cuisson (200 FBU)\n4. Assaisonner avec épices et légumes (500 FBU)\n\nCoût total: 3000 FBU\nPrix vente: 5000 FBU\nBénéfice: 2000 FBU",
            "ingredients": [
                {
                    "ingredient": created_ingredients[0]['id'],  # Riz
                    "quantite_utilisee_par_plat": 1.0,
                    "unite": created_ingredients[0]['unite']
                },
                {
                    "ingredient": created_ingredients[1]['id'],  # Poulet
                    "quantite_utilisee_par_plat": 1.0,
                    "unite": created_ingredients[1]['unite']
                },
                {
                    "ingredient": created_ingredients[2]['id'],  # Huile
                    "quantite_utilisee_par_plat": 1.0,
                    "unite": created_ingredients[2]['unite']
                },
                {
                    "ingredient": created_ingredients[3]['id'],  # Épices
                    "quantite_utilisee_par_plat": 1.0,
                    "unite": created_ingredients[3]['unite']
                }
            ]
        }
        
        response = requests.post(f"{base_url}/kitchen/recipes/", json=recipe_data, headers=headers)
        if response.status_code == 201:
            recipe = response.json()
            print(f"✅ Recette créée: {recipe['nom_recette']}")
            
            # Calculer et afficher le coût
            total_cost = 0
            print(f"   📊 Composition et coûts:")
            for i, ing_data in enumerate(recipe.get('ingredients', [])):
                ingredient = created_ingredients[i]
                cost = float(ing_data['quantite_utilisee_par_plat']) * float(ingredient['prix_unitaire'])
                total_cost += cost
                print(f"   - {ingredient['nom']}: {cost:,.0f} FBU")
            
            print(f"   💰 Coût total: {total_cost:,.0f} FBU")
            print(f"   💰 Prix de vente: {float(product['selling_price']):,.0f} FBU")
            print(f"   🎯 Bénéfice: {float(product['selling_price']) - total_cost:,.0f} FBU")
            
            if total_cost == 3000:
                print(f"   ✅ COÛT EXACT SELON VOS SPÉCIFICATIONS !")
        else:
            print(f"❌ Erreur création recette: {response.status_code}")
            print(f"Réponse: {response.text}")
            return
    
    print("\n🔄 ÉTAPE 4: CALCUL AUTOMATIQUE DU PRIX D'ACHAT")
    print("-" * 50)
    
    # Recalculer automatiquement le prix d'achat du produit
    recalc_response = requests.post(f"{base_url}/kitchen/recalculate-purchase-prices/", headers=headers)
    if recalc_response.status_code == 200:
        result = recalc_response.json()
        print(f"✅ Prix d'achat calculé automatiquement !")
        
        for product_update in result['updated_products']:
            if product_update['product_id'] == product['id']:
                print(f"   💰 Prix d'achat: {product_update['old_purchase_price']:,.0f} → {product_update['new_purchase_price']:,.0f} FBU")
                print(f"   💰 Prix de vente: {product_update['selling_price']:,.0f} FBU")
                print(f"   🎯 Bénéfice unitaire: {product_update['profit_per_unit']:,.0f} FBU")
                print(f"   📈 Marge: {product_update['profit_margin_percent']:.1f}%")
    else:
        print(f"❌ Erreur recalcul: {recalc_response.status_code}")
    
    print("\n📦 ÉTAPE 5: MISE À JOUR DU STOCK PRODUIT")
    print("-" * 50)
    
    # Mettre à jour le stock du produit pour permettre les ventes
    product_update_data = {
        "current_stock": 30  # 30 assiettes disponibles
    }
    
    response = requests.patch(f"{base_url}/products/{product['id']}/", json=product_update_data, headers=headers)
    if response.status_code == 200:
        updated_product = response.json()
        print(f"✅ Stock produit mis à jour: {updated_product['current_stock']} assiettes")
    
    print("\n" + "="*70)
    print("🎯 SYSTÈME COMPLET CRÉÉ AVEC SUCCÈS !")
    print("="*70)
    
    print("\n✅ RÉCAPITULATIF SELON VOS SPÉCIFICATIONS:")
    print("   🥕 Riz Basmati: 300 FBU (Stock: 100 portions)")
    print("   🍗 Poulet Frais: 2,000 FBU (Stock: 50 portions)")
    print("   🫒 Huile de Cuisson: 200 FBU (Stock: 200 portions)")
    print("   🌶️ Épices et Légumes: 500 FBU (Stock: 150 portions)")
    print("   ➕ Coût de revient total = 3,000 FBU")
    print("   💰 Prix de vente au client = 5,000 FBU")
    print("   🎯 Bénéfice unitaire = 2,000 FBU")
    print("   📦 Stock produit: 30 assiettes disponibles")
    
    print("\n🎯 MAINTENANT VOUS POUVEZ:")
    print("   1. 🍽️ Aller dans Gestion Cuisine voir la recette")
    print("   2. 💰 Aller dans Sales vendre quelques assiettes")
    print("   3. 📋 Aller dans Rapport Journalier voir les données exactes")
    print("   4. 📦 Voir les stocks d'ingrédients diminuer automatiquement")
    
    print("\n🚀 PAGES À TESTER:")
    print("   🍽️ Kitchen: http://localhost:8081/kitchen")
    print("   💰 Sales: http://localhost:8081/sales")
    print("   📋 Daily Report: http://localhost:8081/daily-report")
    print("   📦 Stocks: http://localhost:8081/stocks")

if __name__ == '__main__':
    create_complete_recipe_system()
