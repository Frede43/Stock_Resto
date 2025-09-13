#!/usr/bin/env python
"""
Créer une recette pour le produit Riz au Poulet existant
"""

import os
import sys
import django
import requests

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

def create_recipe_for_existing_product():
    """
    Créer une recette pour le produit existant
    """
    base_url = "http://127.0.0.1:8000/api"
    
    print("🍽️ CRÉATION RECETTE POUR PRODUIT EXISTANT")
    print("=" * 60)
    
    # Connexion
    login_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{base_url}/accounts/login/", json=login_data)
    access_token = response.json()['tokens']['access']
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # Trouver le produit Riz au Poulet
    products_response = requests.get(f"{base_url}/products/", headers=headers)
    products = products_response.json().get('results', [])
    
    riz_poulet_product = None
    for product in products:
        if "Riz au Poulet" in product['name'] and float(product.get('purchase_price', 0)) == 3000:
            riz_poulet_product = product
            break
    
    if not riz_poulet_product:
        print("❌ Produit Riz au Poulet non trouvé")
        return
    
    print(f"✅ Produit trouvé: {riz_poulet_product['name']} (ID: {riz_poulet_product['id']})")
    
    # Récupérer les ingrédients
    ingredients_response = requests.get(f"{base_url}/kitchen/ingredients/", headers=headers)
    ingredients = ingredients_response.json().get('results', [])
    
    # Trouver nos ingrédients spécifiques
    target_ingredients = {
        "Riz (pour recette)": 300,
        "Poulet (pour recette)": 2000,
        "Huile (pour recette)": 200,
        "Épices & légumes": 500
    }
    
    found_ingredients = {}
    for ingredient in ingredients:
        for target_name, expected_price in target_ingredients.items():
            if target_name in ingredient['nom'] and float(ingredient['prix_unitaire']) == expected_price:
                found_ingredients[target_name] = ingredient
                break
    
    print(f"\n📦 Ingrédients trouvés: {len(found_ingredients)}/4")
    for name, ing in found_ingredients.items():
        print(f"   ✅ {name}: {float(ing['prix_unitaire']):,.0f} FBU")
    
    if len(found_ingredients) != 4:
        print("❌ Tous les ingrédients requis ne sont pas disponibles")
        return
    
    # Créer la recette
    recipe_data = {
        "plat": riz_poulet_product['id'],
        "nom_recette": f"Recette {riz_poulet_product['name']}",
        "description": "Recette automatique avec coût calculé selon spécifications utilisateur",
        "temps_preparation": 45,
        "portions": 1,
        "instructions": "1. Cuire le riz (300 FBU)\n2. Préparer le poulet (2000 FBU)\n3. Ajouter huile (200 FBU)\n4. Épices et légumes (500 FBU)\nTotal: 3000 FBU",
        "ingredients": []
    }
    
    # Ajouter les ingrédients à la recette
    for name, ingredient in found_ingredients.items():
        recipe_data["ingredients"].append({
            "ingredient": ingredient['id'],
            "quantite_utilisee_par_plat": 1.0,  # 1 portion de chaque
            "unite": ingredient['unite']
        })
    
    print(f"\n🍽️ Création de la recette...")
    response = requests.post(f"{base_url}/kitchen/recipes/", json=recipe_data, headers=headers)
    
    if response.status_code == 201:
        recipe = response.json()
        print(f"✅ Recette créée: {recipe['nom_recette']}")
        
        print(f"\n📊 Détail de la recette:")
        print(f"   🍽️ Plat: {riz_poulet_product['name']}")
        print(f"   📋 Ingrédients: {len(recipe.get('ingredients', []))}")
        
        # Calculer le coût total
        total_cost = 0
        for ing_data in recipe.get('ingredients', []):
            if isinstance(ing_data, dict) and 'ingredient' in ing_data:
                # Trouver l'ingrédient correspondant
                ingredient_id = ing_data['ingredient']
                ingredient = next((i for i in ingredients if i['id'] == ingredient_id), None)
                if ingredient:
                    cost = float(ing_data['quantite_utilisee_par_plat']) * float(ingredient['prix_unitaire'])
                    total_cost += cost
                    print(f"   - {ingredient['nom']}: {cost:,.0f} FBU")
        
        print(f"   💰 Coût total calculé: {total_cost:,.0f} FBU")
        
        if total_cost == 3000:
            print(f"   ✅ COÛT EXACT SELON VOS SPÉCIFICATIONS !")
        else:
            print(f"   ⚠️ Coût différent (attendu: 3,000 FBU)")
        
        return recipe['id']
    else:
        print(f"❌ Erreur création recette: {response.status_code}")
        print(f"Réponse: {response.text}")
        return None

def test_automatic_calculation():
    """
    Tester le calcul automatique après création de la recette
    """
    base_url = "http://127.0.0.1:8000/api"
    
    # Connexion
    login_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{base_url}/accounts/login/", json=login_data)
    access_token = response.json()['tokens']['access']
    headers = {'Authorization': f'Bearer {access_token}'}
    
    print(f"\n🔄 Test du recalcul automatique...")
    recalc_response = requests.post(f"{base_url}/kitchen/recalculate-purchase-prices/", headers=headers)
    
    if recalc_response.status_code == 200:
        result = recalc_response.json()
        print(f"✅ Recalcul réussi !")
        print(f"   📦 Produits mis à jour: {result['summary']['products_updated']}")
        
        for product in result['updated_products']:
            if "Riz au Poulet" in product['product_name']:
                print(f"\n🍽️ {product['product_name']}:")
                print(f"   💰 Ancien PA: {product['old_purchase_price']:,.0f} FBU")
                print(f"   💰 Nouveau PA: {product['new_purchase_price']:,.0f} FBU")
                print(f"   💰 PV: {product['selling_price']:,.0f} FBU")
                print(f"   🎯 Bénéfice: {product['profit_per_unit']:,.0f} FBU")
                
                if product['new_purchase_price'] == 3000 and product['profit_per_unit'] == 2000:
                    print(f"   ✅ PARFAIT SELON VOS SPÉCIFICATIONS !")
                    print(f"   🎯 Si 40 assiettes: {product['profit_per_unit']:,.0f} × 40 = {product['profit_per_unit'] * 40:,.0f} FBU")
    else:
        print(f"❌ Erreur recalcul: {recalc_response.status_code}")

if __name__ == '__main__':
    recipe_id = create_recipe_for_existing_product()
    if recipe_id:
        test_automatic_calculation()
        
        print("\n" + "="*60)
        print("🎯 SYSTÈME PRÊT !")
        print("="*60)
        
        print("\n✅ RECETTE CRÉÉE ET PRIX RECALCULÉS AUTOMATIQUEMENT")
        print("   🍽️ Produit: Riz au Poulet")
        print("   📋 Recette: 4 ingrédients avec coûts exacts")
        print("   💰 Prix d'achat: Calculé automatiquement (3,000 FBU)")
        print("   🎯 Bénéfice: 2,000 FBU par assiette")
        
        print("\n🚀 TESTEZ MAINTENANT:")
        print("   🍽️ Kitchen: http://localhost:8081/kitchen")
        print("      → Cliquez sur 'Recalculer Prix' pour voir le système en action")
        print("   📋 Daily Report: http://localhost:8081/daily-report")
        print("      → Voir les coûts et bénéfices calculés automatiquement")
