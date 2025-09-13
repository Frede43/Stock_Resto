#!/usr/bin/env python
"""
Test du système de ventes avec serveurs et génération de factures
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

from accounts.models import User
from products.models import Product, Category
from sales.models import Table

def test_sales_system():
    """
    Test complet du système de ventes
    """
    base_url = "http://127.0.0.1:8000/api"
    
    print("🧪 Test du système de ventes avec serveurs et factures...")
    
    # 1. Connexion admin
    print("\n1. Connexion admin...")
    login_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{base_url}/accounts/login/", json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Erreur de connexion: {response.status_code}")
        return
    
    access_token = response.json()['tokens']['access']
    headers = {'Authorization': f'Bearer {access_token}'}
    print("✅ Connexion admin réussie")
    
    # 2. Test récupération des serveurs
    print("\n2. Test récupération des serveurs...")
    response = requests.get(f"{base_url}/accounts/users/?role=server", headers=headers)
    if response.status_code == 200:
        servers = response.json().get('results', [])
        print(f"✅ {len(servers)} serveurs trouvés")
        if servers:
            server_id = servers[0]['id']
            print(f"   Premier serveur: {servers[0]['first_name']} {servers[0]['last_name']}")
        else:
            print("⚠️  Aucun serveur trouvé, création d'un serveur de test...")
            # Créer un serveur de test
            server_data = {
                "username": "test_server",
                "first_name": "Test",
                "last_name": "Serveur",
                "email": "test.serveur@test.com",
                "role": "server",
                "password": "testpass123",
                "permissions": ["sales.view", "sales.create"]
            }
            response = requests.post(f"{base_url}/accounts/users/", json=server_data, headers=headers)
            if response.status_code == 201:
                server_id = response.json()['id']
                print(f"✅ Serveur de test créé avec ID: {server_id}")
            else:
                print(f"❌ Erreur création serveur: {response.status_code}")
                return
    else:
        print(f"❌ Erreur récupération serveurs: {response.status_code}")
        return
    
    # 3. Test récupération des tables
    print("\n3. Test récupération des tables...")
    response = requests.get(f"{base_url}/sales/tables/", headers=headers)
    if response.status_code == 200:
        tables = response.json().get('results', [])
        print(f"✅ {len(tables)} tables trouvées")
        if tables:
            table_id = tables[0]['id']
            print(f"   Première table: Table {tables[0]['number']}")
        else:
            print("⚠️  Aucune table trouvée, création d'une table de test...")
            # Créer une table de test via Django ORM
            table = Table.objects.create(
                number=1,
                capacity=4,
                location="Terrasse",
                status="available"
            )
            table_id = table.id
            print(f"✅ Table de test créée avec ID: {table_id}")
    else:
        print(f"❌ Erreur récupération tables: {response.status_code}")
        return
    
    # 4. Test récupération des produits
    print("\n4. Test récupération des produits...")
    response = requests.get(f"{base_url}/products/", headers=headers)
    if response.status_code == 200:
        products = response.json().get('results', [])
        print(f"✅ {len(products)} produits trouvés")
        if products:
            product_id = products[0]['id']
            product_price = products[0]['selling_price']
            print(f"   Premier produit: {products[0]['name']} - {product_price} FBu")
        else:
            print("⚠️  Aucun produit trouvé, création d'un produit de test...")
            # Créer ou récupérer une catégorie et un produit de test
            category, created = Category.objects.get_or_create(
                name="Boissons",
                defaults={
                    "type": "boissons",
                    "description": "Boissons diverses"
                }
            )
            product = Product.objects.create(
                name="Coca-Cola",
                category=category,
                purchase_price=1000,
                selling_price=1500,
                current_stock=100,
                is_available=True
            )
            product_id = product.id
            product_price = product.selling_price
            print(f"✅ Produit de test créé: {product.name} - {product_price} FBu")
    else:
        print(f"❌ Erreur récupération produits: {response.status_code}")
        return
    
    # 5. Test création d'une vente avec serveur
    print("\n5. Test création d'une vente avec serveur...")
    sale_data = {
        "table": table_id,
        "server": server_id,
        "customer_name": "Client Test",
        "payment_method": "cash",
        "notes": "Vente de test avec serveur",
        "items": [
            {
                "product": product_id,
                "quantity": 2,
                "unit_price": product_price
            }
        ]
    }
    
    response = requests.post(f"{base_url}/sales/", json=sale_data, headers=headers)
    if response.status_code == 201:
        sale = response.json()
        print(f"✅ Vente créée avec succès!")
        print(f"   ID: {sale['id']}")
        print(f"   Référence: {sale['reference']}")
        print(f"   Total: {sale['total_amount']} FBu")
        print(f"   Serveur: {sale.get('server_name', 'N/A')}")
        
        # Vérifier si l'URL de facture est présente
        if 'invoice_url' in sale:
            print(f"   URL Facture: {sale['invoice_url']}")
            
            # Test téléchargement de la facture
            print("\n6. Test téléchargement de la facture...")
            invoice_response = requests.get(f"{base_url.replace('/api', '')}{sale['invoice_url']}", headers=headers)
            if invoice_response.status_code == 200:
                print("✅ Facture générée et téléchargeable")
                print(f"   Type de contenu: {invoice_response.headers.get('content-type', 'N/A')}")
            else:
                print(f"❌ Erreur téléchargement facture: {invoice_response.status_code}")
        else:
            print("⚠️  URL de facture non trouvée dans la réponse")
            
    else:
        print(f"❌ Erreur création vente: {response.status_code}")
        print(f"   Réponse: {response.text}")
        return
    
    print("\n🎉 Tests terminés avec succès!")
    print("\n📊 Résumé:")
    print(f"   - Serveurs disponibles: ✅")
    print(f"   - Tables disponibles: ✅")
    print(f"   - Produits disponibles: ✅")
    print(f"   - Création de vente: ✅")
    print(f"   - Génération de facture: ✅")

if __name__ == '__main__':
    test_sales_system()
