#!/usr/bin/env python
"""
Test rapide pour créer des recettes avec les données existantes
"""

import os
import sys
import django
import requests
import json

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

def test_quick_recipes():
    """
    Test rapide avec les données existantes
    """
    base_url = "http://127.0.0.1:8000/api"
    
    print("🚀 TEST RAPIDE AVEC DONNÉES EXISTANTES")
    print("=" * 60)
    
    # 1. Connexion admin
    print("\n1. 🔐 Connexion admin...")
    login_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{base_url}/accounts/login/", json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Erreur de connexion: {response.status_code}")
        return
    
    access_token = response.json()['tokens']['access']
    headers = {'Authorization': f'Bearer {access_token}'}
    print("✅ Connexion admin réussie")
    
    # 2. Récupérer les catégories existantes
    print("\n2. 📂 Récupération des catégories...")
    categories_response = requests.get(f"{base_url}/products/categories/", headers=headers)
    if categories_response.status_code == 200:
        categories = categories_response.json().get('results', [])
        print(f"✅ {len(categories)} catégories trouvées:")
        for cat in categories:
            print(f"   - {cat['name']} (ID: {cat['id']})")
        
        # Utiliser la première catégorie ou créer "Plats"
        plats_category = None
        for cat in categories:
            if 'plat' in cat['name'].lower():
                plats_category = cat
                break
        
        if not plats_category and categories:
            plats_category = categories[0]  # Utiliser la première catégorie
            print(f"   → Utilisation de la catégorie: {plats_category['name']}")
    
    # 3. Récupérer les ingrédients existants
    print("\n3. 🥕 Récupération des ingrédients...")
    ingredients_response = requests.get(f"{base_url}/kitchen/ingredients/", headers=headers)
    if ingredients_response.status_code == 200:
        ingredients = ingredients_response.json().get('results', [])
        print(f"✅ {len(ingredients)} ingrédients disponibles:")
        for ing in ingredients[:5]:
            print(f"   - {ing['nom']}: {ing['quantite_restante']} {ing['unite']}")
    
    # 4. Créer des produits simples
    if 'plats_category' in locals() and plats_category:
        print("\n4. 🛍️ Création de produits...")
        
        products_data = [
            {
                "name": "Salade Spéciale",
                "description": "Salade avec ingrédients frais",
                "category": plats_category['id'],  # Utiliser l'ID de la catégorie
                "purchase_price": 0,
                "selling_price": 4500,
                "current_stock": 0,
                "min_stock": 0
            },
            {
                "name": "Plat du Chef",
                "description": "Plat signature du restaurant",
                "category": plats_category['id'],  # Utiliser l'ID de la catégorie
                "purchase_price": 0,
                "selling_price": 7500,
                "current_stock": 0,
                "min_stock": 0
            }
        ]
        
        created_products = []
        for product_data in products_data:
            response = requests.post(f"{base_url}/products/", json=product_data, headers=headers)
            if response.status_code == 201:
                product = response.json()
                created_products.append(product)
                print(f"✅ {product['name']}: {float(product['selling_price']):,.0f} BIF")
            else:
                print(f"❌ Erreur création produit: {response.status_code}")
                print(f"   Réponse: {response.text}")
    
    # 5. Créer des recettes avec les ingrédients existants
    if 'created_products' in locals() and created_products and len(ingredients) >= 3:
        print("\n5. 🍽️ Création de recettes...")
        
        recipes_data = [
            {
                "plat": created_products[0]['id'],
                "nom_recette": "Salade Fraîcheur",
                "description": "Salade avec les meilleurs ingrédients",
                "temps_preparation": 15,
                "portions": 2,
                "instructions": "Mélanger tous les ingrédients frais",
                "ingredients": [
                    {
                        "ingredient": ingredients[0]['id'],
                        "quantite_utilisee_par_plat": 1.0,
                        "unite": ingredients[0]['unite']
                    },
                    {
                        "ingredient": ingredients[1]['id'],
                        "quantite_utilisee_par_plat": 0.5,
                        "unite": ingredients[1]['unite']
                    }
                ]
            }
        ]
        
        if len(created_products) > 1:
            recipes_data.append({
                "plat": created_products[1]['id'],
                "nom_recette": "Plat Signature",
                "description": "Notre spécialité maison",
                "temps_preparation": 30,
                "portions": 4,
                "instructions": "Cuire avec soin tous les ingrédients",
                "ingredients": [
                    {
                        "ingredient": ingredients[2]['id'],
                        "quantite_utilisee_par_plat": 2.0,
                        "unite": ingredients[2]['unite']
                    },
                    {
                        "ingredient": ingredients[0]['id'],
                        "quantite_utilisee_par_plat": 0.8,
                        "unite": ingredients[0]['unite']
                    }
                ]
            })
        
        created_recipes = []
        for recipe_data in recipes_data:
            response = requests.post(f"{base_url}/kitchen/recipes/", json=recipe_data, headers=headers)
            if response.status_code == 201:
                recipe = response.json()
                created_recipes.append(recipe)
                
                # Calculer le coût
                total_cost = 0
                for ing in recipe.get('ingredients', []):
                    cost = float(ing['quantite_utilisee_par_plat']) * float(ing['ingredient']['prix_unitaire'])
                    total_cost += cost
                
                print(f"✅ {recipe['nom_recette']}: Coût {total_cost:,.0f} BIF")
            else:
                print(f"❌ Erreur création recette: {response.status_code}")
                print(f"   Réponse: {response.text}")
        
        print(f"\n🎯 {len(created_recipes)} recettes créées avec succès !")
    
    # 6. Test d'une vente
    if 'created_products' in locals() and created_products:
        print("\n6. 💰 Test de vente...")
        
        # Récupérer les tables
        tables_response = requests.get(f"{base_url}/sales/tables/", headers=headers)
        if tables_response.status_code == 200:
            tables = tables_response.json().get('results', [])
            if tables:
                sale_data = {
                    "table": tables[0]['id'],
                    "customer_name": "Client Test Dynamique",
                    "payment_method": "cash",
                    "notes": "Test avec recette",
                    "items": [
                        {"product": created_products[0]['id'], "quantity": 1}
                    ]
                }
                
                response = requests.post(f"{base_url}/sales/", json=sale_data, headers=headers)
                if response.status_code == 201:
                    sale = response.json()
                    print(f"✅ Vente créée: {sale['customer_name']}")
                    
                    # Marquer comme payé
                    paid_response = requests.post(f"{base_url}/sales/{sale['id']}/mark-paid/", headers=headers)
                    if paid_response.status_code == 200:
                        print("   💳 Vente payée → Ingrédients décomptés")
                    else:
                        print(f"   ⚠️ Erreur paiement: {paid_response.status_code}")
    
    print("\n" + "="*60)
    print("🎯 RÉSULTATS DU TEST RAPIDE")
    print("="*60)
    
    print("\n✅ DONNÉES CRÉÉES AVEC SUCCÈS:")
    print(f"   🥕 Ingrédients: {len(ingredients)} disponibles")
    if 'created_products' in locals():
        print(f"   🛍️ Produits: {len(created_products)} créés")
    if 'created_recipes' in locals():
        print(f"   🍽️ Recettes: {len(created_recipes)} créées")
    
    print("\n🎯 TESTEZ MAINTENANT LES PAGES:")
    print("   📋 Daily Report: http://localhost:8081/daily-report")
    print("   📦 Stocks: http://localhost:8081/stocks")
    print("   🍽️ Kitchen: http://localhost:8081/kitchen")
    
    print("\n🚀 SYSTÈME PRÊT AVEC DONNÉES DYNAMIQUES !")

if __name__ == '__main__':
    test_quick_recipes()
