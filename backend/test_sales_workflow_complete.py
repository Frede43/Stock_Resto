#!/usr/bin/env python
"""
Test complet du workflow de vente avec gestion du stock
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
from django.contrib.auth import get_user_model

def test_complete_sales_workflow():
    """
    Test complet du workflow de vente
    """
    base_url = "http://127.0.0.1:8000/api"
    
    print("🧪 TEST COMPLET DU WORKFLOW DE VENTE")
    print("=" * 60)
    
    # 1. Connexion admin
    print("\n1. 🔐 Connexion admin...")
    login_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{base_url}/accounts/login/", json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Erreur de connexion: {response.status_code}")
        print(f"   Réponse: {response.text}")
        return
    
    access_token = response.json()['tokens']['access']
    headers = {'Authorization': f'Bearer {access_token}'}
    print("✅ Connexion admin réussie")
    
    # 2. Vérifier les produits disponibles
    print("\n2. 📦 Vérification des produits...")
    response = requests.get(f"{base_url}/products/", headers=headers)
    if response.status_code != 200:
        print(f"❌ Erreur récupération produits: {response.status_code}")
        return
    
    products = response.json().get('results', [])
    if not products:
        print("❌ Aucun produit disponible")
        return
    
    product = products[0]
    initial_stock = product['current_stock']
    print(f"✅ Produit sélectionné: {product['name']}")
    print(f"   Stock initial: {initial_stock}")
    print(f"   Prix de vente: {product['selling_price']} BIF")
    
    # 3. Récupérer tables et serveurs
    print("\n3. 🏪 Récupération des tables et serveurs...")
    tables_response = requests.get(f"{base_url}/sales/tables/", headers=headers)
    servers_response = requests.get(f"{base_url}/accounts/users/?role=server", headers=headers)
    
    if tables_response.status_code != 200 or servers_response.status_code != 200:
        print("❌ Erreur récupération tables/serveurs")
        return
    
    tables = tables_response.json().get('results', [])
    servers = servers_response.json().get('results', [])
    
    if not tables or not servers:
        print("❌ Tables ou serveurs manquants")
        return
    
    table = tables[0]
    server = servers[0]
    print(f"✅ Table: {table['number']}, Serveur: {server['username']}")
    
    # 4. Créer une vente
    print("\n4. 🛒 Création d'une vente...")
    
    sale_data = {
        "table": table['id'],
        "customer_name": "Client Test Workflow",
        "payment_method": "cash",
        "notes": "Test complet du workflow",
        "items": [
            {
                "product": product['id'],
                "quantity": 3,
                "notes": "Test de déduction de stock"
            }
        ]
    }
    
    print(f"   Données de vente: {json.dumps(sale_data, indent=2)}")
    
    response = requests.post(f"{base_url}/sales/", json=sale_data, headers=headers)
    print(f"   Status de création: {response.status_code}")
    
    if response.status_code != 201:
        print(f"❌ Erreur création vente: {response.status_code}")
        print(f"   Réponse: {response.text}")
        return
    
    sale = response.json()
    sale_id = sale['id']
    print(f"✅ Vente créée avec succès")
    print(f"   ID: {sale_id}")
    print(f"   Référence: {sale.get('reference', 'N/A')}")
    print(f"   Statut initial: {sale.get('status', 'N/A')}")
    print(f"   Total: {sale.get('total_amount', 'N/A')} BIF")
    
    # 5. Vérifier le stock après création
    print("\n5. 📊 Vérification du stock après création...")
    response = requests.get(f"{base_url}/products/{product['id']}/", headers=headers)
    if response.status_code == 200:
        updated_product = response.json()
        stock_after_creation = updated_product['current_stock']
        print(f"   Stock après création: {stock_after_creation}")
        
        if stock_after_creation == initial_stock:
            print("✅ Stock inchangé (correct pour vente en attente)")
        else:
            print(f"⚠️ Stock modifié: {initial_stock} → {stock_after_creation}")
            print("   (Le stock ne devrait pas changer avant le paiement)")
    
    # 6. Vérifier les détails de la vente dans la base
    print("\n6. 🔍 Vérification des détails de la vente...")
    response = requests.get(f"{base_url}/sales/{sale_id}/", headers=headers)
    if response.status_code == 200:
        sale_details = response.json()
        print(f"   Statut actuel: {sale_details.get('status', 'N/A')}")
        print(f"   Items: {len(sale_details.get('items', []))}")
        
        for item in sale_details.get('items', []):
            print(f"     - {item.get('product_name', 'N/A')}: {item.get('quantity', 0)} x {item.get('unit_price', 0)} BIF")
    
    # 7. Marquer la vente comme payée
    print("\n7. 💰 Marquage de la vente comme payée...")
    response = requests.post(f"{base_url}/sales/{sale_id}/mark-paid/", headers=headers)
    print(f"   Status de paiement: {response.status_code}")
    
    if response.status_code == 200:
        paid_response = response.json()
        print("✅ Vente marquée comme payée")
        print(f"   Message: {paid_response.get('message', 'N/A')}")
        print(f"   Nouveau statut: {paid_response.get('sale', {}).get('status', 'N/A')}")
    else:
        print(f"❌ Erreur marquage payé: {response.status_code}")
        print(f"   Réponse: {response.text}")
        return
    
    # 8. Vérifier le stock après paiement
    print("\n8. 📈 Vérification du stock après paiement...")
    response = requests.get(f"{base_url}/products/{product['id']}/", headers=headers)
    if response.status_code == 200:
        final_product = response.json()
        final_stock = final_product['current_stock']
        expected_stock = initial_stock - 3  # 3 articles vendus
        
        print(f"   Stock initial: {initial_stock}")
        print(f"   Stock après paiement: {final_stock}")
        print(f"   Stock attendu: {expected_stock}")
        
        if final_stock == expected_stock:
            print("✅ Stock correctement mis à jour")
        else:
            print(f"❌ Stock incorrectement mis à jour")
            print(f"   Différence: {expected_stock - final_stock}")
    
    # 9. Vérifier la vente finale
    print("\n9. 📋 Vérification de la vente finale...")
    response = requests.get(f"{base_url}/sales/{sale_id}/", headers=headers)
    if response.status_code == 200:
        final_sale = response.json()
        print(f"   Statut final: {final_sale.get('status', 'N/A')}")
        print(f"   Référence: {final_sale.get('reference', 'N/A')}")
        print(f"   Total payé: {final_sale.get('total_amount', 'N/A')} BIF")
    
    # 10. Test de la base de données directement
    print("\n10. 🗄️ Vérification directe en base de données...")
    try:
        sale_obj = Sale.objects.get(id=sale_id)
        print(f"   Statut en base: {sale_obj.status}")
        print(f"   Référence en base: {sale_obj.reference}")
        print(f"   Items en base: {sale_obj.items.count()}")
        
        for item in sale_obj.items.all():
            print(f"     - {item.product.name}: {item.quantity} x {item.unit_price} BIF")
            print(f"       Stock produit actuel: {item.product.current_stock}")
    except Sale.DoesNotExist:
        print("❌ Vente non trouvée en base")
    
    print("\n" + "=" * 60)
    print("🎯 RÉSUMÉ DU TEST")
    print("=" * 60)
    
    print("\n✅ ÉTAPES TESTÉES:")
    print("1. Connexion admin")
    print("2. Récupération des produits")
    print("3. Récupération des tables/serveurs")
    print("4. Création de vente")
    print("5. Vérification stock après création")
    print("6. Vérification détails vente")
    print("7. Marquage comme payé")
    print("8. Vérification stock après paiement")
    print("9. Vérification vente finale")
    print("10. Vérification base de données")
    
    print("\n🎯 WORKFLOW ATTENDU:")
    print("1. Vente créée → Statut: 'pending' → Stock inchangé")
    print("2. Vente payée → Statut: 'paid' → Stock mis à jour")

if __name__ == '__main__':
    test_complete_sales_workflow()
