#!/usr/bin/env python
"""
Script de test pour les permissions des produits
"""

import requests
import json

def test_product_permissions():
    """Test des permissions pour les produits avec différents utilisateurs"""
    
    print("🔍 Test des permissions produits...")
    
    # Test avec l'utilisateur caissier
    print("\n1. Test avec l'utilisateur caissier...")
    login_data = {
        "username": "caissier",
        "password": "temp123456"
    }
    
    try:
        response = requests.post('http://127.0.0.1:8000/api/accounts/login/', json=login_data)
        if response.status_code == 200:
            auth_data = response.json()
            access_token = auth_data['tokens']['access']
            user_info = auth_data['user']
            print(f"✅ Connexion caissier réussie - User: {user_info['username']}, Role: {user_info['role']}")
            
            # Test de modification d'un produit
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Récupérer un produit existant
            products_response = requests.get('http://127.0.0.1:8000/api/products/', headers=headers)
            if products_response.status_code == 200:
                products = products_response.json()
                if products.get('results') and len(products['results']) > 0:
                    product = products['results'][0]
                    product_id = product['id']
                    print(f"📦 Test avec le produit: {product['name']} (ID: {product_id})")
                    
                    # Test de modification
                    update_data = {
                        "name": product['name'],
                        "price": float(product['price']) + 100,  # Augmenter le prix
                        "category": product['category'],
                        "description": product.get('description', ''),
                        "current_stock": product.get('current_stock', 0),
                        "minimum_stock": product.get('minimum_stock', 0),
                        "is_available": product.get('is_available', True)
                    }
                    
                    update_response = requests.put(
                        f'http://127.0.0.1:8000/api/products/{product_id}/',
                        json=update_data,
                        headers=headers
                    )
                    
                    print(f"   PUT /api/products/{product_id}/ - Status: {update_response.status_code}")
                    if update_response.status_code == 200:
                        print("✅ Caissier peut modifier les produits")
                        updated_product = update_response.json()
                        print(f"   Nouveau prix: {updated_product['price']}")
                    else:
                        print(f"❌ Caissier ne peut pas modifier les produits: {update_response.text}")
                else:
                    print("❌ Aucun produit trouvé pour le test")
            else:
                print(f"❌ Impossible de récupérer les produits: {products_response.status_code}")
        else:
            print(f"❌ Échec de connexion caissier: {response.text}")
            
    except Exception as e:
        print(f"❌ Erreur lors du test caissier: {e}")
    
    # Test avec l'utilisateur admin
    print("\n2. Test avec l'utilisateur admin...")
    admin_login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post('http://127.0.0.1:8000/api/accounts/login/', json=admin_login_data)
        if response.status_code == 200:
            auth_data = response.json()
            access_token = auth_data['tokens']['access']
            user_info = auth_data['user']
            print(f"✅ Connexion admin réussie - User: {user_info['username']}, Role: {user_info['role']}")
            
            # Test de création d'un produit
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Récupérer une catégorie pour le test
            categories_response = requests.get('http://127.0.0.1:8000/api/products/categories/', headers=headers)
            if categories_response.status_code == 200:
                categories = categories_response.json()
                if categories.get('results') and len(categories['results']) > 0:
                    category_id = categories['results'][0]['id']
                    
                    # Test de création
                    create_data = {
                        "name": "Produit Test Admin",
                        "price": 1500.00,
                        "category": category_id,
                        "description": "Produit créé par admin pour test",
                        "current_stock": 10,
                        "minimum_stock": 2,
                        "is_available": True
                    }
                    
                    create_response = requests.post(
                        'http://127.0.0.1:8000/api/products/',
                        json=create_data,
                        headers=headers
                    )
                    
                    print(f"   POST /api/products/ - Status: {create_response.status_code}")
                    if create_response.status_code == 201:
                        print("✅ Admin peut créer des produits")
                        new_product = create_response.json()
                        print(f"   Produit créé: {new_product['name']} (ID: {new_product['id']})")
                    else:
                        print(f"❌ Admin ne peut pas créer des produits: {create_response.text}")
                else:
                    print("❌ Aucune catégorie trouvée pour le test")
            else:
                print(f"❌ Impossible de récupérer les catégories: {categories_response.status_code}")
        else:
            print(f"❌ Échec de connexion admin: {response.text}")
            
    except Exception as e:
        print(f"❌ Erreur lors du test admin: {e}")

if __name__ == '__main__':
    test_product_permissions()
