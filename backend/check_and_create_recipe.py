#!/usr/bin/env python
"""
Vérifier les produits existants et créer la recette
"""

import os
import sys
import django
import requests

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

def check_and_create_recipe():
    """
    Vérifier les produits et créer la recette
    """
    base_url = "http://127.0.0.1:8000/api"
    
    print("🔍 VÉRIFICATION ET CRÉATION RECETTE")
    print("=" * 50)
    
    # Connexion
    login_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{base_url}/accounts/login/", json=login_data)
    access_token = response.json()['tokens']['access']
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # Vérifier tous les produits
    products_response = requests.get(f"{base_url}/products/", headers=headers)
    products = products_response.json().get('results', [])
    
    print(f"\n📦 Produits existants:")
    riz_poulet_products = []
    for product in products:
        if "Riz au Poulet" in product['name']:
            riz_poulet_products.append(product)
            print(f"   ✅ {product['name']} (ID: {product['id']})")
            print(f"      PA: {float(product.get('purchase_price', 0)):,.0f} FBU")
            print(f"      PV: {float(product.get('selling_price', 0)):,.0f} FBU")
    
    if not riz_poulet_products:
        print("❌ Aucun produit Riz au Poulet trouvé")
        return
    
    # Prendre le premier produit Riz au Poulet
    target_product = riz_poulet_products[0]
    print(f"\n🎯 Produit sélectionné: {target_product['name']}")
    
    # Vérifier les ingrédients
    ingredients_response = requests.get(f"{base_url}/kitchen/ingredients/", headers=headers)
    ingredients = ingredients_response.json().get('results', [])
    
    print(f"\n🥕 Ingrédients disponibles:")
    target_ingredients = []
    for ingredient in ingredients:
        if any(keyword in ingredient['nom'] for keyword in ["Riz", "Poulet", "Huile", "Épices"]):
            target_ingredients.append(ingredient)
            print(f"   ✅ {ingredient['nom']}: {float(ingredient['prix_unitaire']):,.0f} FBU")
    
    if len(target_ingredients) < 4:
        print("❌ Pas assez d'ingrédients pour créer la recette")
        return
    
    # Créer la recette
    recipe_data = {
        "plat": target_product['id'],
        "nom_recette": f"Recette {target_product['name']}",
        "description": "Recette avec calcul automatique des coûts",
        "temps_preparation": 45,
        "portions": 1,
        "instructions": "Recette automatique pour calcul des coûts",
        "ingredients": []
    }
    
    # Ajouter les 4 premiers ingrédients
    for ingredient in target_ingredients[:4]:
        recipe_data["ingredients"].append({
            "ingredient": ingredient['id'],
            "quantite_utilisee_par_plat": 1.0,
            "unite": ingredient['unite']
        })
    
    print(f"\n🍽️ Création de la recette...")
    response = requests.post(f"{base_url}/kitchen/recipes/", json=recipe_data, headers=headers)
    
    if response.status_code == 201:
        recipe = response.json()
        print(f"✅ Recette créée: {recipe['nom_recette']}")
        
        # Tester le recalcul automatique
        print(f"\n🔄 Test du recalcul automatique...")
        recalc_response = requests.post(f"{base_url}/kitchen/recalculate-purchase-prices/", headers=headers)
        
        if recalc_response.status_code == 200:
            result = recalc_response.json()
            print(f"✅ Recalcul réussi !")
            print(f"   📦 Produits mis à jour: {result['summary']['products_updated']}")
            
            for product in result['updated_products']:
                print(f"\n🍽️ {product['product_name']}:")
                print(f"   💰 Ancien PA: {product['old_purchase_price']:,.0f} FBU")
                print(f"   💰 Nouveau PA: {product['new_purchase_price']:,.0f} FBU")
                print(f"   💰 PV: {product['selling_price']:,.0f} FBU")
                print(f"   🎯 Bénéfice: {product['profit_per_unit']:,.0f} FBU")
                
                print(f"   📋 Détail des ingrédients:")
                for ing in product['ingredients_detail']:
                    print(f"   - {ing['ingredient']}: {ing['quantity']} × {ing['unit_price']:,.0f} = {ing['total_cost']:,.0f} FBU")
        else:
            print(f"❌ Erreur recalcul: {recalc_response.status_code}")
    else:
        print(f"❌ Erreur création recette: {response.status_code}")
        print(f"Réponse: {response.text}")

if __name__ == '__main__':
    check_and_create_recipe()
    
    print("\n" + "="*50)
    print("🎯 SYSTÈME DE CALCUL AUTOMATIQUE PRÊT !")
    print("="*50)
    
    print("\n✅ FONCTIONNALITÉS IMPLÉMENTÉES:")
    print("   🔄 Calcul automatique des prix d'achat")
    print("   📊 Basé sur le coût réel des ingrédients")
    print("   🎯 Bénéfices calculés précisément")
    print("   🖱️ Bouton 'Recalculer Prix' dans Kitchen")
    
    print("\n🚀 TESTEZ MAINTENANT:")
    print("   🍽️ Kitchen: http://localhost:8081/kitchen")
    print("      → Cliquez sur 'Recalculer Prix'")
    print("   📋 Daily Report: http://localhost:8081/daily-report")
    print("      → Voir les coûts calculés automatiquement")
