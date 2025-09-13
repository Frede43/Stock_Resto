#!/usr/bin/env python
"""
Script pour tester les APIs
"""
import requests
import json

BASE_URL = 'http://localhost:8000/api'

def get_auth_token():
    """Obtenir un token d'authentification"""
    
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        token = data['tokens']['access']
        print("✅ Authentification réussie")
        return token
    else:
        print("❌ Échec de l'authentification")
        print(response.text)
        return None

def test_products_api(token):
    """Tester l'API des produits"""
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print("\n🧪 Test de l'API des produits...")
    
    # 1. Lister les produits
    print("\n1. Liste des produits:")
    response = requests.get(f'{BASE_URL}/products/', headers=headers)
    if response.status_code == 200:
        data = response.json()
        # L'API peut retourner une structure paginée ou une liste directe
        if isinstance(data, dict) and 'results' in data:
            products = data['results']
        else:
            products = data

        print(f"✅ {len(products)} produits trouvés")
        for product in products[:3]:  # Afficher les 3 premiers
            print(f"   - {product['name']}: {product['selling_price']} BIF (Stock: {product['current_stock']})")
    else:
        print(f"❌ Erreur: {response.status_code}")
        print(response.text)
    
    # 2. Lister les catégories
    print("\n2. Liste des catégories:")
    response = requests.get(f'{BASE_URL}/products/categories/', headers=headers)
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, dict) and 'results' in data:
            categories = data['results']
        else:
            categories = data

        print(f"✅ {len(categories)} catégories trouvées")
        for category in categories:
            print(f"   - {category['name']} ({category['type_display']}): {category['products_count']} produits")
    else:
        print(f"❌ Erreur: {response.status_code}")
        print(response.text)
    
    # 3. Produits avec stock faible
    print("\n3. Produits avec stock faible:")
    response = requests.get(f'{BASE_URL}/products/low-stock/', headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ {data['count']} produits avec stock faible")
        for product in data['products']:
            print(f"   - {product['name']}: {product['current_stock']}/{product['minimum_stock']}")
    else:
        print(f"❌ Erreur: {response.status_code}")
        print(response.text)
    
    # 4. Créer un nouveau produit
    print("\n4. Création d'un nouveau produit:")
    import random
    product_name = f'Test Produit API {random.randint(1000, 9999)}'
    new_product = {
        'name': product_name,
        'category': 1,  # ID de la première catégorie
        'unit': 'piece',
        'purchase_price': '500.00',
        'selling_price': '800.00',
        'current_stock': 10,
        'minimum_stock': 5,
        'description': 'Produit créé via API pour test'
    }
    
    response = requests.post(f'{BASE_URL}/products/', json=new_product, headers=headers)
    if response.status_code == 201:
        product = response.json()
        print(f"✅ Produit créé: {product['name']} (ID: {product['id']})")
        
        # 5. Mettre à jour le stock du produit créé
        print("\n5. Mise à jour du stock:")
        stock_update = {
            'quantity': 5,
            'operation': 'add',
            'reason': 'Test d\'ajout de stock'
        }
        
        response = requests.post(
            f'{BASE_URL}/products/{product["id"]}/update-stock/',
            json=stock_update,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Stock mis à jour: {data['old_stock']} → {data['new_stock']}")
        else:
            print(f"❌ Erreur mise à jour stock: {response.status_code}")
            print(response.text)
        
    else:
        print(f"❌ Erreur création produit: {response.status_code}")
        print(response.text)

def test_sales_api(token):
    """Tester l'API des ventes"""

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    print("\n🛒 Test de l'API des ventes...")

    # 1. Créer une table
    print("\n1. Création d'une table:")
    import random
    table_number = f'T{random.randint(100, 999)}'
    new_table = {
        'number': table_number,
        'name': f'Table Test {table_number}',
        'capacity': 4,
        'location': 'Terrasse'
    }

    response = requests.post(f'{BASE_URL}/sales/tables/', json=new_table, headers=headers)
    if response.status_code == 201:
        table = response.json()
        print(f"✅ Table créée: {table['name']} (ID: {table['id']})")
        table_id = table['id']
    else:
        print(f"❌ Erreur création table: {response.status_code}")
        print(response.text)
        return

    # 2. Créer une vente
    print("\n2. Création d'une vente:")
    new_sale = {
        'table': table_id,
        'payment_method': 'cash',
        'discount_amount': '0.00',
        'notes': 'Vente test via API',
        'items': [
            {
                'product': 1,  # Premier produit
                'quantity': 2,
                'notes': 'Bien frais'
            },
            {
                'product': 2,  # Deuxième produit
                'quantity': 1
            }
        ]
    }

    response = requests.post(f'{BASE_URL}/sales/', json=new_sale, headers=headers)
    if response.status_code == 201:
        sale = response.json()
        print(f"✅ Vente créée: ID {sale['id']}, Total: {sale['total_amount']} BIF")
        sale_id = sale['id']

        # 3. Marquer la vente comme payée
        print("\n3. Paiement de la vente:")
        payment_data = {
            'status': 'paid',
            'payment_method': 'cash'
        }

        response = requests.post(
            f'{BASE_URL}/sales/{sale_id}/update-status/',
            json=payment_data,
            headers=headers
        )

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Vente payée avec succès")
        else:
            print(f"❌ Erreur paiement: {response.status_code}")
            print(response.text)

    else:
        print(f"❌ Erreur création vente: {response.status_code}")
        print(response.text)

def test_reports_api(token):
    """Tester l'API des rapports"""

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    print("\n📊 Test de l'API des rapports...")

    # 1. Générer des alertes de stock
    print("\n1. Génération des alertes de stock:")
    response = requests.post(f'{BASE_URL}/reports/alerts/generate/', headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ {data['alerts_created']} alertes créées")
    else:
        print(f"❌ Erreur génération alertes: {response.status_code}")
        print(response.text)

    # 2. Lister les alertes
    print("\n2. Liste des alertes:")
    response = requests.get(f'{BASE_URL}/reports/alerts/', headers=headers)
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, dict) and 'results' in data:
            alerts = data['results']
        else:
            alerts = data

        print(f"✅ {len(alerts)} alertes trouvées")
        for alert in alerts[:3]:
            print(f"   - {alert['product_name']}: {alert['alert_type_display']}")
    else:
        print(f"❌ Erreur liste alertes: {response.status_code}")
        print(response.text)

    # 3. Statistiques du tableau de bord
    print("\n3. Statistiques du tableau de bord:")
    response = requests.get(f'{BASE_URL}/reports/dashboard/', headers=headers)
    if response.status_code == 200:
        stats = response.json()
        print(f"✅ Statistiques récupérées:")
        print(f"   - Ventes aujourd'hui: {stats['today']['sales']}")
        print(f"   - Revenus aujourd'hui: {stats['today']['revenue']} BIF")
        print(f"   - Alertes non résolues: {stats['alerts']['total_unresolved']}")
        print(f"   - Produits actifs: {stats['quick_stats']['active_products']}")
    else:
        print(f"❌ Erreur statistiques: {response.status_code}")
        print(response.text)

def test_user_permissions(token):
    """Tester les permissions utilisateur"""
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print("\n🔐 Test des permissions utilisateur...")
    
    response = requests.get(f'{BASE_URL}/auth/permissions/', headers=headers)
    if response.status_code == 200:
        permissions = response.json()
        print(f"✅ Rôle: {permissions['role']}")
        print("Permissions:")
        for perm, value in permissions['permissions'].items():
            status = "✅" if value else "❌"
            print(f"   {status} {perm}")
    else:
        print(f"❌ Erreur: {response.status_code}")
        print(response.text)

if __name__ == '__main__':
    print("🚀 Test des APIs BarStock...")
    
    # Authentification
    token = get_auth_token()
    if not token:
        exit(1)
    
    # Tests
    test_user_permissions(token)
    test_products_api(token)
    test_sales_api(token)
    test_reports_api(token)

    print("\n✅ Tests terminés!")

    # Test des nouvelles APIs
    print("\n🔧 Test des nouvelles APIs...")
    test_inventory_api(token)
    test_suppliers_api(token)
    test_expenses_api(token)
    test_export_apis(token)

def test_inventory_api(token):
    """Test de l'API inventory"""
    print("\n📦 Test de l'API Inventory...")

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    # Test des mouvements de stock
    response = requests.get(f"{BASE_URL}/inventory/movements/", headers=headers)
    if response.status_code == 200:
        movements = response.json()
        print(f"✅ {movements.get('count', 0)} mouvements de stock trouvés")
    else:
        print(f"❌ Erreur mouvements: {response.status_code}")

    # Test du résumé de stock
    response = requests.get(f"{BASE_URL}/inventory/stock-summary/", headers=headers)
    if response.status_code == 200:
        summary = response.json()
        print(f"✅ Résumé de stock récupéré: {len(summary)} produits")
    else:
        print(f"❌ Erreur résumé stock: {response.status_code}")

def test_suppliers_api(token):
    """Test de l'API suppliers"""
    print("\n🏪 Test de l'API Suppliers...")

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    # Test de la liste des fournisseurs
    response = requests.get(f"{BASE_URL}/suppliers/suppliers/", headers=headers)
    if response.status_code == 200:
        suppliers = response.json()
        print(f"✅ {suppliers.get('count', 0)} fournisseurs trouvés")
    else:
        print(f"❌ Erreur fournisseurs: {response.status_code}")

def test_expenses_api(token):
    """Test de l'API expenses"""
    print("\n💰 Test de l'API Expenses...")

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    # Test des catégories de dépenses
    response = requests.get(f"{BASE_URL}/expenses/categories/", headers=headers)
    if response.status_code == 200:
        categories = response.json()
        print(f"✅ {categories.get('count', 0)} catégories de dépenses trouvées")
    else:
        print(f"❌ Erreur catégories dépenses: {response.status_code}")

    # Test du résumé des dépenses
    response = requests.get(f"{BASE_URL}/expenses/summary/", headers=headers)
    if response.status_code == 200:
        summary = response.json()
        print(f"✅ Résumé des dépenses récupéré")
        print(f"   - Total aujourd'hui: {summary.get('total_today', 0)} BIF")
        print(f"   - Total ce mois: {summary.get('total_this_month', 0)} BIF")
    else:
        print(f"❌ Erreur résumé dépenses: {response.status_code}")

def test_export_apis(token):
    """Test des APIs d'export"""
    print("\n📄 Test des APIs d'Export...")

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    # Test export stock PDF
    response = requests.get(f"{BASE_URL}/reports/export/stock-report/pdf/", headers=headers)
    if response.status_code == 200:
        print("✅ Export PDF stock réussi")
    else:
        print(f"❌ Erreur export PDF stock: {response.status_code}")

    # Test export stock Excel
    response = requests.get(f"{BASE_URL}/reports/export/stock-report/excel/", headers=headers)
    if response.status_code == 200:
        print("✅ Export Excel stock réussi")
    else:
        print(f"❌ Erreur export Excel stock: {response.status_code}")

    print("\n🎉 Tous les tests terminés!")
