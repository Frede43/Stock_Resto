#!/usr/bin/env python
import os
import django
import requests
import json

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from accounts.models import User
from products.models import Product
from kitchen.models import Ingredient

print("=== Test Création de Recette ===")

# 1. Obtenir un token d'authentification
login_data = {"username": "admin", "password": "Lumenge4242"}
login_response = requests.post('http://127.0.0.1:8000/api/accounts/login/', json=login_data)

if login_response.status_code == 200:
    token = login_response.json()['tokens']['access']
    print(f"✅ Token obtenu: {token[:20]}...")
    
    # 2. Vérifier les produits disponibles
    products = Product.objects.filter(is_active=True)[:5]
    print(f"\n📦 Produits disponibles: {[p.name for p in products]}")
    
    # 3. Vérifier les ingrédients disponibles
    ingredients = Ingredient.objects.filter(is_active=True)[:5]
    print(f"🥕 Ingrédients disponibles: {[i.nom for i in ingredients]}")
    
    if products and ingredients:
        # 4. Tester la création d'une recette
        recipe_data = {
            "plat": products[0].id,
            "nom_recette": "Test Recette API",
            "description": "Recette de test",
            "instructions": "Instructions de test",
            "temps_preparation": 30,
            "portions": 1,
            "ingredients": [{
                "ingredient": ingredients[0].id,
                "quantite_utilisee_par_plat": 1.0,
                "unite": ingredients[0].unite,
                "is_optional": False,
                "notes": ""
            }]
        }
        
        print(f"\n📤 Données envoyées:")
        print(json.dumps(recipe_data, indent=2))
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        response = requests.post(
            'http://127.0.0.1:8000/api/kitchen/recipes/',
            json=recipe_data,
            headers=headers
        )
        
        print(f"\n📡 Réponse API:")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 201:
            print("❌ Erreur de création")
        else:
            print("✅ Recette créée avec succès")
    else:
        print("❌ Pas de produits ou ingrédients disponibles")
else:
    print(f"❌ Échec de connexion: {login_response.status_code}")
    print(login_response.text)
