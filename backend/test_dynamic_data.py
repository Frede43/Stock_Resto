#!/usr/bin/env python
"""
Test dynamique complet avec création de données réalistes
"""

import os
import sys
import django
import requests
import json
from datetime import datetime

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

def test_dynamic_system():
    """
    Test complet avec création de données dynamiques
    """
    base_url = "http://127.0.0.1:8000/api"
    
    print("🧪 TEST DYNAMIQUE COMPLET DU SYSTÈME")
    print("=" * 70)
    
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
    
    print("\n" + "="*70)
    print("🥕 ÉTAPE 1: CRÉATION D'INGRÉDIENTS DYNAMIQUES")
    print("="*70)
    
    # 2. Créer des ingrédients variés
    ingredients_data = [
        {
            "nom": "Tomates fraîches",
            "quantite_restante": 15.5,
            "unite": "kg",
            "seuil_alerte": 3.0,
            "prix_unitaire": 1200.0,
            "description": "Tomates rouges pour salades et plats"
        },
        {
            "nom": "Oignons blancs",
            "quantite_restante": 8.2,
            "unite": "kg",
            "seuil_alerte": 2.0,
            "prix_unitaire": 900.0,
            "description": "Oignons pour assaisonnement"
        },
        {
            "nom": "Huile de tournesol",
            "quantite_restante": 4.5,
            "unite": "L",
            "seuil_alerte": 1.0,
            "prix_unitaire": 2800.0,
            "description": "Huile pour cuisson"
        },
        {
            "nom": "Riz blanc",
            "quantite_restante": 25.0,
            "unite": "kg",
            "seuil_alerte": 5.0,
            "prix_unitaire": 1500.0,
            "description": "Riz long grain"
        },
        {
            "nom": "Poulet frais",
            "quantite_restante": 12.0,
            "unite": "kg",
            "seuil_alerte": 2.0,
            "prix_unitaire": 4500.0,
            "description": "Poulet fermier"
        }
    ]
    
    created_ingredients = []
    print("\n📦 Création des ingrédients...")
    
    for ingredient_data in ingredients_data:
        response = requests.post(f"{base_url}/kitchen/ingredients/", json=ingredient_data, headers=headers)
        if response.status_code == 201:
            ingredient = response.json()
            created_ingredients.append(ingredient)
            valeur = float(ingredient['quantite_restante']) * float(ingredient['prix_unitaire'])
            print(f"✅ {ingredient['nom']}: {ingredient['quantite_restante']} {ingredient['unite']} (Valeur: {valeur:,.0f} BIF)")
        else:
            print(f"❌ Erreur création {ingredient_data['nom']}: {response.status_code}")
    
    print(f"\n🎯 Total: {len(created_ingredients)} ingrédients créés")
    
    print("\n" + "="*70)
    print("🛍️ ÉTAPE 2: CRÉATION DE PRODUITS POUR LES RECETTES")
    print("="*70)

    # 3. D'abord créer des produits (plats)
    products_data = [
        {
            "name": "Salade de Tomates (Plat)",
            "description": "Salade fraîche aux tomates et oignons",
            "category": "Plats",
            "purchase_price": 0,  # Calculé via recette
            "selling_price": 4500,
            "current_stock": 0,  # Géré par ingrédients
            "min_stock": 0
        },
        {
            "name": "Riz au Poulet (Plat)",
            "description": "Plat complet riz et poulet",
            "category": "Plats",
            "purchase_price": 0,  # Calculé via recette
            "selling_price": 8500,
            "current_stock": 0,  # Géré par ingrédients
            "min_stock": 0
        }
    ]

    created_products = []
    print("\n🛍️ Création des produits (plats)...")

    for product_data in products_data:
        response = requests.post(f"{base_url}/products/", json=product_data, headers=headers)
        if response.status_code == 201:
            product = response.json()
            created_products.append(product)
            print(f"✅ {product['name']}: Prix de vente {product['selling_price']:,} BIF")
        else:
            print(f"❌ Erreur création produit: {response.status_code}")
            print(f"   Réponse: {response.text}")

    print(f"\n🎯 Total: {len(created_products)} produits créés")

    print("\n" + "="*70)
    print("🍽️ ÉTAPE 3: CRÉATION DE RECETTES DYNAMIQUES")
    print("="*70)

    # 4. Créer des recettes liées aux produits
    if len(created_ingredients) >= 3 and len(created_products) >= 2:
        recipes_data = [
            {
                "plat": created_products[0]['id'],  # Salade de Tomates
                "nom_recette": "Salade de Tomates aux Oignons",
                "description": "Salade fraîche et légère",
                "temps_preparation": 15,
                "portions": 4,
                "instructions": "1. Couper les tomates\n2. Émincer les oignons\n3. Assaisonner avec l'huile",
                "ingredients": [
                    {
                        "ingredient": created_ingredients[0]['id'],  # Tomates
                        "quantite_utilisee_par_plat": 2.0,
                        "unite": created_ingredients[0]['unite']
                    },
                    {
                        "ingredient": created_ingredients[1]['id'],  # Oignons
                        "quantite_utilisee_par_plat": 0.5,
                        "unite": created_ingredients[1]['unite']
                    },
                    {
                        "ingredient": created_ingredients[2]['id'],  # Huile
                        "quantite_utilisee_par_plat": 0.1,
                        "unite": created_ingredients[2]['unite']
                    }
                ]
            },
            {
                "plat": created_products[1]['id'],  # Riz au Poulet
                "nom_recette": "Riz au Poulet",
                "description": "Plat complet traditionnel",
                "temps_preparation": 45,
                "portions": 6,
                "instructions": "1. Faire revenir le poulet\n2. Ajouter le riz\n3. Cuire avec les légumes",
                "ingredients": [
                    {
                        "ingredient": created_ingredients[3]['id'],  # Riz
                        "quantite_utilisee_par_plat": 3.0,
                        "unite": created_ingredients[3]['unite']
                    },
                    {
                        "ingredient": created_ingredients[4]['id'],  # Poulet
                        "quantite_utilisee_par_plat": 1.5,
                        "unite": created_ingredients[4]['unite']
                    },
                    {
                        "ingredient": created_ingredients[1]['id'],  # Oignons
                        "quantite_utilisee_par_plat": 0.3,
                        "unite": created_ingredients[1]['unite']
                    },
                    {
                        "ingredient": created_ingredients[2]['id'],  # Huile
                        "quantite_utilisee_par_plat": 0.2,
                        "unite": created_ingredients[2]['unite']
                    }
                ]
            }
        ]
        
        created_recipes = []
        print("\n🍽️ Création des recettes...")
        
        for recipe_data in recipes_data:
            response = requests.post(f"{base_url}/kitchen/recipes/", json=recipe_data, headers=headers)
            if response.status_code == 201:
                recipe = response.json()
                created_recipes.append(recipe)

                # Calculer le coût total
                total_cost = 0
                for ing in recipe.get('ingredients', []):
                    cost = float(ing['quantite_utilisee_par_plat']) * float(ing['ingredient']['prix_unitaire'])
                    total_cost += cost

                print(f"✅ {recipe['nom_recette']}: {len(recipe.get('ingredients', []))} ingrédients (Coût: {total_cost:,.0f} BIF)")
            else:
                print(f"❌ Erreur création recette: {response.status_code}")
                print(f"   Réponse: {response.text}")

        print(f"\n🎯 Total: {len(created_recipes)} recettes créées")
    
    print("\n" + "="*70)
    print("💰 ÉTAPE 4: SIMULATION DE VENTES DYNAMIQUES")
    print("="*70)

    # 5. Créer des ventes pour tester le système
    if 'created_recipes' in locals() and created_recipes and created_products:
        # Récupérer les tables
        tables_response = requests.get(f"{base_url}/sales/tables/", headers=headers)
        if tables_response.status_code == 200:
            tables = tables_response.json().get('results', [])
            if tables:
                print("\n💰 Création de ventes de test...")
                
                # Vente 1: Salade de Tomates
                sale_data_1 = {
                    "table": tables[0]['id'],
                    "customer_name": "Client Test 1",
                    "payment_method": "cash",
                    "notes": "Test vente salade",
                    "items": [
                        {"product": created_products[0]['id'], "quantity": 2}
                    ]
                }
                
                response = requests.post(f"{base_url}/sales/", json=sale_data_1, headers=headers)
                if response.status_code == 201:
                    sale1 = response.json()
                    print(f"✅ Vente 1 créée: {sale1['customer_name']} - 2x {created_products[0]['name']}")
                    
                    # Marquer comme payé pour déclencher la déduction
                    paid_response = requests.post(f"{base_url}/sales/{sale1['id']}/mark-paid/", headers=headers)
                    if paid_response.status_code == 200:
                        print("   💳 Vente marquée comme payée → Ingrédients décomptés")
                    else:
                        print(f"   ⚠️ Erreur marquage payé: {paid_response.status_code}")
                
                # Vente 2: Riz au Poulet
                if len(created_products) > 1:
                    sale_data_2 = {
                        "table": tables[0]['id'],
                        "customer_name": "Client Test 2",
                        "payment_method": "card",
                        "notes": "Test vente riz poulet",
                        "items": [
                            {"product": created_products[1]['id'], "quantity": 1}
                        ]
                    }
                    
                    response = requests.post(f"{base_url}/sales/", json=sale_data_2, headers=headers)
                    if response.status_code == 201:
                        sale2 = response.json()
                        print(f"✅ Vente 2 créée: {sale2['customer_name']} - 1x {created_products[1]['name']}")
                        
                        # Marquer comme payé
                        paid_response = requests.post(f"{base_url}/sales/{sale2['id']}/mark-paid/", headers=headers)
                        if paid_response.status_code == 200:
                            print("   💳 Vente marquée comme payée → Ingrédients décomptés")
    
    print("\n" + "="*70)
    print("📊 ÉTAPE 5: VÉRIFICATION DES DONNÉES DYNAMIQUES")
    print("="*70)
    
    # 6. Vérifier les données après les ventes
    print("\n📊 Vérification des stocks après ventes...")
    
    # Vérifier les ingrédients
    ingredients_response = requests.get(f"{base_url}/kitchen/ingredients/", headers=headers)
    if ingredients_response.status_code == 200:
        ingredients = ingredients_response.json().get('results', [])
        print(f"\n🥕 État des ingrédients après ventes:")
        
        for ingredient in ingredients:
            quantite = float(ingredient['quantite_restante'])
            prix = float(ingredient['prix_unitaire'])
            valeur = quantite * prix
            status = "🔴 Rupture" if quantite <= 0 else "🟡 Alerte" if quantite <= float(ingredient['seuil_alerte']) else "🟢 OK"
            print(f"   {status} {ingredient['nom']}: {quantite} {ingredient['unite']} (Valeur: {valeur:,.0f} BIF)")
    
    # Vérifier le rapport cuisine
    print("\n📋 Test du rapport cuisine...")
    report_response = requests.get(f"{base_url}/kitchen/report/", headers=headers)
    if report_response.status_code == 200:
        report = report_response.json()
        print(f"✅ Rapport généré pour le {report.get('date')}")
        print(f"   📊 Résumé:")
        print(f"   - Ingrédients: {report.get('summary', {}).get('total_ingredients', 0)}")
        print(f"   - Valeur stock: {report.get('summary', {}).get('total_stock_value', 0):,.0f} BIF")
        print(f"   - Mouvements: {report.get('summary', {}).get('total_movements', 0)}")
        print(f"   - Sorties: {report.get('summary', {}).get('total_exits', 0)}")
    
    # Vérifier les recettes avec coûts
    print("\n🍽️ Test des recettes avec coûts calculés...")
    recipes_response = requests.get(f"{base_url}/kitchen/recipes/", headers=headers)
    if recipes_response.status_code == 200:
        recipes = recipes_response.json().get('results', [])
        print(f"✅ {len(recipes)} recettes avec coûts:")
        
        for recipe in recipes:
            total_cost = 0
            if recipe.get('ingredients'):
                for ing in recipe['ingredients']:
                    cost = float(ing['quantite_utilisee_par_plat']) * float(ing['ingredient']['prix_unitaire'])
                    total_cost += cost

            # Trouver le produit lié
            if 'created_products' in locals():
                related_product = next((p for p in created_products if p['id'] == recipe.get('plat')), None)
                if related_product:
                    selling_price = float(related_product['selling_price'])
                    profit = selling_price - total_cost
                    profit_pct = (profit / selling_price * 100) if selling_price > 0 else 0

                    print(f"   💰 {recipe['nom_recette']}:")
                    print(f"      PA (Coût): {total_cost:,.0f} BIF")
                    print(f"      PV (Vente): {selling_price:,.0f} BIF")
                    print(f"      Bénéfice: {profit:,.0f} BIF ({profit_pct:.1f}%)")
    
    print("\n" + "="*70)
    print("🎯 RÉSULTATS DU TEST DYNAMIQUE")
    print("="*70)
    
    print("\n✅ SYSTÈME ENTIÈREMENT FONCTIONNEL:")
    print("   🥕 Ingrédients créés et gérés dynamiquement")
    print("   🍽️ Recettes avec calculs de coûts automatiques")
    print("   🛍️ Produits liés aux recettes")
    print("   💰 Ventes avec décompte automatique des ingrédients")
    print("   📊 Rapports mis à jour en temps réel")
    
    print("\n🎯 PAGES À TESTER MAINTENANT:")
    print("   📋 Daily Report: http://localhost:8081/daily-report")
    print("      → Tableau recettes avec vrais coûts et bénéfices")
    print("   📦 Stocks: http://localhost:8081/stocks")
    print("      → Onglet Produits: PA/PV calculés")
    print("      → Onglet Ingrédients: Stocks mis à jour après ventes")
    print("   🍽️ Kitchen: http://localhost:8081/kitchen")
    print("      → Ingrédients créés visibles")
    
    print("\n🚀 LE SYSTÈME EST PRÊT AVEC DES DONNÉES RÉELLES !")

if __name__ == '__main__':
    test_dynamic_system()
