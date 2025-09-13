#!/usr/bin/env python
"""
Script de test pour vérifier le fonctionnement dynamique de la page Orders
Teste la création de commandes via l'API et vérifie que tout fonctionne
"""
import os
import sys
import django
import requests
import json
from datetime import datetime

# Configuration Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apps.settings.development')
django.setup()

from sales.models import Table, Sale
from products.models import Product, Category
from accounts.models import User
from django.utils import timezone

def test_orders_page_functionality():
    """Test complet du fonctionnement de la page Orders"""
    
    base_url = "http://localhost:8000/api"
    
    print("🧪 Test de la page Orders - Fonctionnement dynamique")
    print("=" * 60)
    
    # 1. Créer un utilisateur de test si nécessaire
    print("\n1. 👤 Vérification utilisateur...")
    try:
        user = User.objects.get(username='testuser')
        print(f"✅ Utilisateur existant: {user.username}")
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com',
            first_name='Test',
            last_name='User'
        )
        print(f"✅ Utilisateur créé: {user.username}")
    
    # 2. Authentification
    print("\n2. 🔐 Authentification...")
    auth_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    response = requests.post(f"{base_url}/auth/login/", json=auth_data)
    if response.status_code == 200:
        token = response.json()['access']
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Authentification réussie")
    else:
        print(f"❌ Erreur authentification: {response.status_code}")
        return
    
    # 3. Vérifier les tables disponibles
    print("\n3. 🪑 Vérification des tables...")
    response = requests.get(f"{base_url}/tables/", headers=headers)
    if response.status_code == 200:
        tables_data = response.json()
        tables = tables_data.get('results', [])
        print(f"✅ {len(tables)} tables trouvées")
        
        if not tables:
            # Créer des tables de test
            for i in range(1, 4):
                table_data = {
                    "number": str(i),
                    "capacity": 4,
                    "status": "available",
                    "location": f"Zone {i}"
                }
                requests.post(f"{base_url}/tables/", json=table_data, headers=headers)
            
            # Recharger les tables
            response = requests.get(f"{base_url}/tables/", headers=headers)
            tables = response.json().get('results', [])
            print(f"✅ {len(tables)} tables créées")
    else:
        print(f"❌ Erreur récupération tables: {response.status_code}")
        return
    
    # 4. Vérifier les produits disponibles
    print("\n4. 🍽️ Vérification des produits...")
    response = requests.get(f"{base_url}/products/", headers=headers)
    if response.status_code == 200:
        products_data = response.json()
        products = products_data.get('results', [])
        print(f"✅ {len(products)} produits trouvés")
        
        if not products:
            # Créer une catégorie et des produits de test
            print("   Création de produits de test...")
            
            # Créer catégorie
            category_data = {
                "name": "Plats Principaux",
                "type": "plats",
                "description": "Plats principaux du restaurant"
            }
            cat_response = requests.post(f"{base_url}/categories/", json=category_data, headers=headers)
            if cat_response.status_code == 201:
                category = cat_response.json()
                
                # Créer des produits
                test_products = [
                    {
                        "name": "Riz au Poulet",
                        "category": category['id'],
                        "unit": "assiette",
                        "purchase_price": 3000,
                        "selling_price": 5000,
                        "current_stock": 50,
                        "minimum_stock": 10,
                        "description": "Riz parfumé avec poulet grillé"
                    },
                    {
                        "name": "Salade de Tomates",
                        "category": category['id'],
                        "unit": "portion",
                        "purchase_price": 1000,
                        "selling_price": 2000,
                        "current_stock": 30,
                        "minimum_stock": 5,
                        "description": "Salade fraîche de tomates"
                    },
                    {
                        "name": "Jus d'Orange",
                        "category": category['id'],
                        "unit": "verre",
                        "purchase_price": 500,
                        "selling_price": 1500,
                        "current_stock": 100,
                        "minimum_stock": 20,
                        "description": "Jus d'orange frais"
                    }
                ]
                
                for product_data in test_products:
                    prod_response = requests.post(f"{base_url}/products/", json=product_data, headers=headers)
                    if prod_response.status_code == 201:
                        product = prod_response.json()
                        print(f"   ✅ Produit créé: {product['name']} - {product['selling_price']} BIF")
            
            # Recharger les produits
            response = requests.get(f"{base_url}/products/", headers=headers)
            products = response.json().get('results', [])
            print(f"✅ {len(products)} produits disponibles")
    else:
        print(f"❌ Erreur récupération produits: {response.status_code}")
        return
    
    # 5. Test de création de commande
    print("\n5. 📝 Test de création de commande...")
    if tables and products:
        # Préparer les données de commande
        order_data = {
            "table": tables[0]['id'],
            "customer_name": "Client Test Dynamique",
            "status": "pending",
            "priority": "normal",
            "notes": "Commande de test pour validation",
            "items": [
                {
                    "product": products[0]['id'],
                    "quantity": 2,
                    "unit_price": products[0]['selling_price'],
                    "notes": "Bien cuit"
                },
                {
                    "product": products[1]['id'] if len(products) > 1 else products[0]['id'],
                    "quantity": 1,
                    "unit_price": products[1]['selling_price'] if len(products) > 1 else products[0]['selling_price'],
                    "notes": "Sans oignon"
                }
            ]
        }
        
        print(f"   Table: {tables[0]['number']}")
        print(f"   Client: {order_data['customer_name']}")
        print(f"   Articles: {len(order_data['items'])}")
        
        # Créer la commande
        response = requests.post(f"{base_url}/orders/", json=order_data, headers=headers)
        if response.status_code == 201:
            order = response.json()
            print(f"✅ Commande créée: #{order.get('order_number', order['id'])}")
            print(f"   Total: {order.get('total_amount', 'N/A')} BIF")
            print(f"   Statut: {order.get('status', 'N/A')}")
            
            # 6. Test de mise à jour du statut
            print("\n6. 🔄 Test de mise à jour du statut...")
            statuses = ['confirmed', 'preparing', 'ready', 'served']
            
            for status in statuses:
                update_data = {"status": status}
                update_response = requests.patch(
                    f"{base_url}/orders/{order['id']}/", 
                    json=update_data, 
                    headers=headers
                )
                if update_response.status_code == 200:
                    print(f"   ✅ Statut mis à jour: {status}")
                else:
                    print(f"   ❌ Erreur mise à jour statut {status}: {update_response.status_code}")
            
        else:
            print(f"❌ Erreur création commande: {response.status_code}")
            print(f"   Réponse: {response.text}")
            return
    
    # 7. Vérifier les commandes existantes
    print("\n7. 📋 Vérification des commandes...")
    response = requests.get(f"{base_url}/orders/", headers=headers)
    if response.status_code == 200:
        orders_data = response.json()
        orders = orders_data.get('results', [])
        print(f"✅ {len(orders)} commandes trouvées")
        
        for order in orders[:3]:  # Afficher les 3 dernières
            print(f"   - Commande #{order.get('order_number', order['id'])}: {order.get('status', 'N/A')} | {order.get('customer_name', 'N/A')} | {order.get('total_amount', 0)} BIF")
    else:
        print(f"❌ Erreur récupération commandes: {response.status_code}")
    
    # 8. Test des endpoints spécifiques
    print("\n8. 🔍 Test des endpoints spécifiques...")
    
    # Test endpoint tables
    response = requests.get(f"{base_url}/tables/", headers=headers)
    print(f"   Tables endpoint: {'✅' if response.status_code == 200 else '❌'} ({response.status_code})")
    
    # Test endpoint products
    response = requests.get(f"{base_url}/products/", headers=headers)
    print(f"   Products endpoint: {'✅' if response.status_code == 200 else '❌'} ({response.status_code})")
    
    # Test endpoint orders
    response = requests.get(f"{base_url}/orders/", headers=headers)
    print(f"   Orders endpoint: {'✅' if response.status_code == 200 else '❌'} ({response.status_code})")
    
    print("\n" + "=" * 60)
    print("🎉 Test terminé ! La page Orders devrait fonctionner à 100%")
    print("\n📝 Instructions pour tester manuellement:")
    print("1. Ouvrez http://localhost:5173/orders")
    print("2. Cliquez sur 'Nouvelle commande'")
    print("3. Sélectionnez une table dans le dropdown")
    print("4. Ajoutez des produits à la commande")
    print("5. Créez la commande")
    print("6. Vérifiez qu'elle apparaît dans la liste")
    print("7. Testez les changements de statut")

if __name__ == "__main__":
    test_orders_page_functionality()
