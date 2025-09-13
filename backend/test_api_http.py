#!/usr/bin/env python
"""
Test HTTP de l'API Products
"""

import requests
import json
import time

def test_api_http():
    print("🧪 Test HTTP API Products")
    print("=" * 30)
    
    base_url = "http://localhost:8000/api"
    
    try:
        # Test 1: Login pour obtenir le token
        print("\n📡 Test POST /api/auth/login/")
        
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        response = requests.post(f"{base_url}/auth/login/", json=login_data)
        print(f"📥 Status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data['access']
            print(f"✅ Token obtenu: {access_token[:30]}...")
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
        else:
            print(f"❌ Erreur login: {response.text}")
            return False
        
        # Test 2: GET categories
        print(f"\n📡 Test GET /api/products/categories/")
        response = requests.get(f"{base_url}/products/categories/", headers=headers)
        print(f"📥 Status: {response.status_code}")
        
        if response.status_code == 200:
            categories_data = response.json()
            categories = categories_data.get('results', categories_data)
            if categories:
                first_category = categories[0]
                print(f"✅ Catégorie: {first_category['name']} (ID: {first_category['id']})")
                category_id = first_category['id']
            else:
                print("❌ Aucune catégorie trouvée")
                return False
        else:
            print(f"❌ Erreur GET categories: {response.text}")
            return False
        
        # Test 3: POST nouveau produit
        print(f"\n📡 Test POST /api/products/")
        
        timestamp = str(int(time.time()))[-6:]
        
        product_data = {
            'name': f'Test HTTP {timestamp}',
            'category': category_id,
            'purchase_price': 400.0,
            'selling_price': 600.0,
            'unit': 'piece',
            'is_active': True,
            'description': 'Test via HTTP'
        }
        
        print(f"📤 Données envoyées:")
        print(json.dumps(product_data, indent=2))
        
        response = requests.post(f"{base_url}/products/", json=product_data, headers=headers)
        print(f"📥 Status: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ SUCCÈS! Produit créé")
            response_data = response.json()
            product_id = response_data['id']
            print(f"📋 Produit créé: ID {product_id}, Nom: {response_data['name']}")
            
            # Test 4: PUT mise à jour
            print(f"\n📡 Test PUT /api/products/{product_id}/")
            
            update_data = {
                'name': f'Test HTTP Updated {timestamp}',
                'category': category_id,
                'purchase_price': 500.0,
                'selling_price': 750.0,
                'unit': 'piece',
                'is_active': True,
                'description': 'Test via HTTP - mis à jour'
            }
            
            response = requests.put(f"{base_url}/products/{product_id}/", json=update_data, headers=headers)
            print(f"📥 Status: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ SUCCÈS! Produit mis à jour")
                response_data = response.json()
                print(f"📋 Nom: {response_data['name']}")
                print(f"   Prix: {response_data['purchase_price']} → {response_data['selling_price']}")
                return True
            else:
                print("❌ ÉCHEC mise à jour!")
                print(f"📄 Réponse: {response.text}")
                return False
            
        else:
            print("❌ ÉCHEC création!")
            print(f"📄 Réponse: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au serveur Django")
        print("   Vérifiez que le serveur est démarré sur http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_api_http()
    
    print("\n" + "=" * 30)
    if success:
        print("🎉 L'API HTTP fonctionne parfaitement!")
        print("Le problème est côté frontend ou configuration.")
    else:
        print("⚠️ L'API HTTP a des problèmes.")
        print("Vérifiez le serveur Django.")
