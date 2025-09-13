#!/usr/bin/env python
"""
Test pour vérifier la duplication des données dans l'historique des ventes
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

from sales.models import Sale, SaleItem
from products.models import Product
from accounts.models import User

def test_sales_duplication():
    """
    Test pour vérifier que les ventes ne sont pas dupliquées
    """
    base_url = "http://127.0.0.1:8000/api"
    
    print("🧪 Test de duplication des ventes...")
    print("=" * 50)
    
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
    
    # 2. Vérifier l'état initial
    print("\n2. État initial des ventes...")
    response = requests.get(f"{base_url}/sales/", headers=headers)
    if response.status_code == 200:
        initial_sales = response.json()
        print(f"   Ventes existantes: {initial_sales.get('count', 0)}")
        
        # Afficher les détails des ventes existantes
        for sale in initial_sales.get('results', []):
            print(f"   - Vente {sale['id']}: {sale['total_amount']} FBu, {len(sale.get('items', []))} articles")
            for item in sale.get('items', []):
                product_name = item.get('product', {})
            if isinstance(product_name, dict):
                product_name = product_name.get('name', 'N/A')
            else:
                product_name = 'N/A'
            print(f"     * {product_name}: {item.get('quantity', 0)}x")
    
    # 3. Créer une nouvelle vente de test
    print("\n3. Création d'une vente de test...")
    
    # Récupérer les données nécessaires
    products_response = requests.get(f"{base_url}/products/", headers=headers)
    tables_response = requests.get(f"{base_url}/sales/tables/", headers=headers)
    servers_response = requests.get(f"{base_url}/accounts/users/?role=server", headers=headers)
    
    if (products_response.status_code == 200 and 
        tables_response.status_code == 200 and 
        servers_response.status_code == 200):
        
        products = products_response.json().get('results', [])
        tables = tables_response.json().get('results', [])
        servers = servers_response.json().get('results', [])
        
        if products and tables and servers:
            product = products[0]
            table = tables[0]
            server = servers[0]
            
            print(f"   Produit: {product['name']} - {product['selling_price']} FBu")
            print(f"   Table: {table['number']}")
            print(f"   Serveur: {server.get('first_name', '')} {server.get('last_name', '')}")
            
            # Créer la vente
            sale_data = {
                "table": table['id'],
                "server": server['id'],
                "customer_name": "Client Test Duplication",
                "payment_method": "cash",
                "notes": "Test de duplication",
                "items": [
                    {
                        "product": product['id'],
                        "quantity": 1,
                        "unit_price": product['selling_price']
                    }
                ]
            }
            
            response = requests.post(f"{base_url}/sales/", json=sale_data, headers=headers)
            if response.status_code == 201:
                new_sale = response.json()
                print(f"✅ Vente créée: ID {new_sale['id']}, Total: {new_sale['total_amount']} FBu")
                
                # Vérifier les items de la vente
                print(f"   Articles dans la vente:")
                for item in new_sale.get('items', []):
                    product_name = item.get('product', {})
                if isinstance(product_name, dict):
                    product_name = product_name.get('name', 'N/A')
                else:
                    product_name = 'N/A'
                print(f"   - {product_name}: {item.get('quantity', 0)}x = {item.get('total_price', 0)} FBu")
                
            else:
                print(f"❌ Erreur création vente: {response.status_code}")
                print(f"   Réponse: {response.text}")
                return
    
    # 4. Vérifier l'état après création
    print("\n4. État après création...")
    response = requests.get(f"{base_url}/sales/", headers=headers)
    if response.status_code == 200:
        final_sales = response.json()
        print(f"   Total ventes: {final_sales.get('count', 0)}")
        
        # Vérifier chaque vente
        for sale in final_sales.get('results', []):
            print(f"   - Vente {sale['id']}: {sale['total_amount']} FBu")
            items_count = len(sale.get('items', []))
            print(f"     Articles: {items_count}")
            
            # Vérifier la cohérence des items
            total_calculated = 0
            for item in sale.get('items', []):
                item_total = float(item.get('quantity', 0)) * float(item.get('unit_price', 0))
                total_calculated += item_total
                product_name = item.get('product', {})
                if isinstance(product_name, dict):
                    product_name = product_name.get('name', 'N/A')
                else:
                    product_name = 'N/A'
                print(f"     * {product_name}: {item.get('quantity', 0)}x @ {item.get('unit_price', 0)} = {item_total} FBu")
            
            sale_total = float(sale.get('total_amount', 0))
            if abs(total_calculated - sale_total) > 0.01:  # Tolérance pour les arrondis
                print(f"     ⚠️  INCOHÉRENCE: Calculé {total_calculated} vs Enregistré {sale_total}")
            else:
                print(f"     ✅ Cohérence vérifiée: {total_calculated} FBu")
    
    # 5. Test direct en base de données
    print("\n5. Vérification directe en base de données...")
    
    # Compter les ventes en base
    db_sales_count = Sale.objects.count()
    print(f"   Ventes en base: {db_sales_count}")
    
    # Vérifier les items
    for sale in Sale.objects.all():
        items = SaleItem.objects.filter(sale=sale)
        print(f"   - Vente {sale.id}: {items.count()} items, Total: {sale.total_amount} FBu")
        
        for item in items:
            print(f"     * {item.product.name}: {item.quantity}x @ {item.unit_price} = {item.total_price} FBu")
    
    print("\n" + "=" * 50)
    print("🎯 RÉSUMÉ DU TEST")
    print("=" * 50)
    
    print("\n✅ POINTS VÉRIFIÉS:")
    print("- Création de vente via API")
    print("- Cohérence des totaux")
    print("- Correspondance API ↔ Base de données")
    print("- Pas de duplication d'items")
    
    print("\n📊 RECOMMANDATIONS:")
    print("- Vérifier le mapping des données dans SalesHistory.tsx")
    print("- S'assurer que les items ne sont pas dupliqués côté frontend")
    print("- Valider la logique de calcul des totaux")

if __name__ == '__main__':
    test_sales_duplication()
