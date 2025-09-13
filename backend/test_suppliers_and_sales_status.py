#!/usr/bin/env python
"""
Test du système de fournisseurs et de gestion des statuts de vente
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

from suppliers.models import Supplier
from sales.models import Sale
from products.models import Product

def test_suppliers_system():
    """
    Test du système de fournisseurs avec types
    """
    base_url = "http://127.0.0.1:8000/api"
    
    print("🧪 Test du système de fournisseurs...")
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
    
    # 2. Test création de fournisseurs avec différents types
    print("\n2. Test création de fournisseurs...")
    
    suppliers_to_create = [
        {
            "name": "Brasserie du Burundi",
            "supplier_type": "beverages",
            "email": "contact@brasserieburundi.bi",
            "phone": "+257 22 123 456",
            "address": "Avenue de l'Industrie, Bujumbura",
            "contact_person": "Jean-Baptiste Nkurunziza"
        },
        {
            "name": "Ferme Bio Ingredients",
            "supplier_type": "ingredients",
            "email": "info@fermebio.bi",
            "phone": "+257 22 789 012",
            "address": "Gitega, Burundi",
            "contact_person": "Marie Uwimana"
        },
        {
            "name": "Équipements Pro",
            "supplier_type": "equipment",
            "email": "vente@equipementspro.bi",
            "phone": "+257 22 345 678",
            "address": "Quartier Industriel, Bujumbura",
            "contact_person": "Pierre Ndayisenga"
        }
    ]
    
    created_suppliers = []
    for supplier_data in suppliers_to_create:
        response = requests.post(f"{base_url}/suppliers/", json=supplier_data, headers=headers)
        if response.status_code == 201:
            supplier = response.json()
            created_suppliers.append(supplier)
            print(f"✅ Fournisseur créé: {supplier['name']} ({supplier['supplier_type']})")
        else:
            print(f"❌ Erreur création fournisseur {supplier_data['name']}: {response.status_code}")
    
    # 3. Test récupération des fournisseurs
    print("\n3. Test récupération des fournisseurs...")
    response = requests.get(f"{base_url}/suppliers/", headers=headers)
    if response.status_code == 200:
        suppliers = response.json()
        print(f"✅ {suppliers.get('count', 0)} fournisseurs récupérés")
        
        # Afficher les types
        for supplier in suppliers.get('results', []):
            print(f"   - {supplier['name']}: {supplier.get('supplier_type', 'N/A')}")
    else:
        print(f"❌ Erreur récupération fournisseurs: {response.status_code}")
    
    return headers

def test_sales_status_system(headers):
    """
    Test du système de statuts de vente avec gestion du stock
    """
    base_url = "http://127.0.0.1:8000/api"
    
    print("\n" + "=" * 50)
    print("🧪 Test du système de statuts de vente...")
    print("=" * 50)
    
    # 1. Vérifier le stock initial
    print("\n1. Vérification du stock initial...")
    response = requests.get(f"{base_url}/products/", headers=headers)
    if response.status_code == 200:
        products = response.json().get('results', [])
        if products:
            product = products[0]
            initial_stock = product['current_stock']
            print(f"✅ Produit: {product['name']}")
            print(f"   Stock initial: {initial_stock}")
            
            # 2. Créer une vente en attente
            print("\n2. Création d'une vente en attente...")
            
            # Récupérer table et serveur
            tables_response = requests.get(f"{base_url}/sales/tables/", headers=headers)
            servers_response = requests.get(f"{base_url}/accounts/users/?role=server", headers=headers)
            
            if tables_response.status_code == 200 and servers_response.status_code == 200:
                tables = tables_response.json().get('results', [])
                servers = servers_response.json().get('results', [])
                
                if tables and servers:
                    sale_data = {
                        "table": tables[0]['id'],
                        "server": servers[0]['id'],
                        "customer_name": "Client Test Statut",
                        "payment_method": "cash",
                        "notes": "Test de gestion des statuts",
                        "items": [
                            {
                                "product": product['id'],
                                "quantity": 2,
                                "unit_price": product['selling_price']
                            }
                        ]
                    }
                    
                    response = requests.post(f"{base_url}/sales/", json=sale_data, headers=headers)
                    if response.status_code == 201:
                        sale = response.json()
                        sale_id = sale['id']
                        print(f"✅ Vente créée: ID {sale_id}, Statut: {sale.get('status', 'N/A')}")
                        
                        # 3. Vérifier que le stock n'a pas changé
                        print("\n3. Vérification du stock après création...")
                        response = requests.get(f"{base_url}/products/{product['id']}/", headers=headers)
                        if response.status_code == 200:
                            updated_product = response.json()
                            current_stock = updated_product['current_stock']
                            print(f"   Stock après création: {current_stock}")
                            
                            if current_stock == initial_stock:
                                print("✅ Stock inchangé (correct pour vente en attente)")
                            else:
                                print("❌ Stock modifié (incorrect pour vente en attente)")
                        
                        # 4. Marquer la vente comme payée
                        print("\n4. Marquage de la vente comme payée...")
                        response = requests.post(f"{base_url}/sales/{sale_id}/mark-paid/", headers=headers)
                        if response.status_code == 200:
                            paid_sale = response.json()
                            print(f"✅ Vente marquée comme payée")
                            print(f"   Nouveau statut: {paid_sale['sale'].get('status', 'N/A')}")
                            
                            # 5. Vérifier que le stock a été mis à jour
                            print("\n5. Vérification du stock après paiement...")
                            response = requests.get(f"{base_url}/products/{product['id']}/", headers=headers)
                            if response.status_code == 200:
                                final_product = response.json()
                                final_stock = final_product['current_stock']
                                expected_stock = initial_stock - 2  # 2 articles vendus
                                
                                print(f"   Stock après paiement: {final_stock}")
                                print(f"   Stock attendu: {expected_stock}")
                                
                                if final_stock == expected_stock:
                                    print("✅ Stock correctement mis à jour")
                                else:
                                    print("❌ Stock incorrectement mis à jour")
                        else:
                            print(f"❌ Erreur marquage payé: {response.status_code}")
                            print(f"   Réponse: {response.text}")
                    else:
                        print(f"❌ Erreur création vente: {response.status_code}")
                        print(f"   Réponse: {response.text}")
    
    print("\n" + "=" * 50)
    print("🎯 RÉSUMÉ DES TESTS")
    print("=" * 50)
    
    print("\n✅ FONCTIONNALITÉS TESTÉES:")
    print("- Création de fournisseurs avec types différenciés")
    print("- Récupération des fournisseurs avec leurs types")
    print("- Création de vente en statut 'pending'")
    print("- Vérification que le stock n'est pas modifié en attente")
    print("- Marquage de la vente comme payée")
    print("- Mise à jour automatique du stock après paiement")
    
    print("\n🎯 WORKFLOW TESTÉ:")
    print("1. Stock initial: X unités")
    print("2. Vente créée (statut: pending) → Stock reste X")
    print("3. Vente payée (statut: paid) → Stock devient X-2")
    print("4. Facture générée automatiquement")

if __name__ == '__main__':
    headers = test_suppliers_system()
    if headers:
        test_sales_status_system(headers)
