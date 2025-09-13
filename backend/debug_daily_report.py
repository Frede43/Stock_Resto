#!/usr/bin/env python
"""
Déboguer et corriger l'affichage du Daily Report
"""

import os
import sys
import django
import requests
from datetime import datetime

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

def debug_daily_report():
    """
    Déboguer les données du Daily Report
    """
    base_url = "http://127.0.0.1:8000/api"
    
    print("📋 DÉBOGAGE DAILY REPORT")
    print("=" * 50)
    
    # Connexion
    login_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{base_url}/accounts/login/", json=login_data)
    access_token = response.json()['tokens']['access']
    headers = {'Authorization': f'Bearer {access_token}'}
    
    today = datetime.now().strftime('%Y-%m-%d')
    print(f"📅 Date: {today}")
    
    # 1. Vérifier les commandes du jour
    print(f"\n1. 📦 Commandes du jour:")
    orders_response = requests.get(f"{base_url}/sales/?date={today}", headers=headers)
    if orders_response.status_code == 200:
        orders = orders_response.json().get('results', [])
        print(f"   ✅ {len(orders)} commandes trouvées")
        
        total_revenue = 0
        total_cost = 0
        total_profit = 0
        
        for i, order in enumerate(orders, 1):
            print(f"\n   📋 Commande {i}:")
            print(f"   - ID: {order['id']}")
            print(f"   - Status: {order['status']}")
            print(f"   - Total: {order.get('total_amount', 0)} FBU")
            print(f"   - Items: {len(order.get('items', []))}")
            
            if order['status'] == 'paid' and order.get('items'):
                order_revenue = 0
                order_cost = 0
                
                for item in order['items']:
                    quantity = item.get('quantity', 0)
                    product_id = item.get('product')

                    # Récupérer les détails du produit
                    product_response = requests.get(f"{base_url}/products/{product_id}/", headers=headers)
                    if product_response.status_code == 200:
                        product = product_response.json()
                        selling_price = float(product.get('selling_price', 0))
                        purchase_price = float(product.get('purchase_price', 0))
                        
                        item_revenue = quantity * selling_price
                        item_cost = quantity * purchase_price
                        item_profit = item_revenue - item_cost

                        order_revenue += item_revenue
                        order_cost += item_cost

                        print(f"     - {product.get('name', 'Produit')}: {quantity} × {selling_price:,.0f} = {item_revenue:,.0f} FBU")
                        print(f"       Coût: {quantity} × {purchase_price:,.0f} = {item_cost:,.0f} FBU")
                        print(f"       Bénéfice: {item_profit:,.0f} FBU")
                    else:
                        print(f"     ❌ Produit {product_id} non trouvé")
                
                total_revenue += order_revenue
                total_cost += order_cost
                
                print(f"   💰 Total commande: {order_revenue:,.0f} FBU")
                print(f"   💰 Coût commande: {order_cost:,.0f} FBU")
                print(f"   🎯 Bénéfice commande: {order_revenue - order_cost:,.0f} FBU")
        
        total_profit = total_revenue - total_cost
        
        print(f"\n📊 RÉSUMÉ TOTAL:")
        print(f"   💰 Chiffre d'affaires: {total_revenue:,.0f} FBU")
        print(f"   💰 Coût total: {total_cost:,.0f} FBU")
        print(f"   🎯 Bénéfice total: {total_profit:,.0f} FBU")
        print(f"   📈 Marge: {(total_profit/total_revenue*100) if total_revenue > 0 else 0:.1f}%")
        
    else:
        print(f"   ❌ Erreur commandes: {orders_response.status_code}")
    
    # 2. Vérifier les produits
    print(f"\n2. 🛍️ Produits:")
    products_response = requests.get(f"{base_url}/products/", headers=headers)
    if products_response.status_code == 200:
        products = products_response.json().get('results', [])
        print(f"   ✅ {len(products)} produits trouvés")
        
        for product in products:
            if "Riz au Poulet" in product['name']:
                print(f"\n   🍽️ {product['name']}:")
                print(f"   - ID: {product['id']}")
                print(f"   - Prix d'achat: {float(product.get('purchase_price', 0)):,.0f} FBU")
                print(f"   - Prix de vente: {float(product.get('selling_price', 0)):,.0f} FBU")
                print(f"   - Stock: {product.get('current_stock', 0)}")
                print(f"   - Bénéfice unitaire: {float(product.get('selling_price', 0)) - float(product.get('purchase_price', 0)):,.0f} FBU")
    else:
        print(f"   ❌ Erreur produits: {products_response.status_code}")
    
    # 3. Tester l'endpoint du rapport détaillé
    print(f"\n3. 📋 Rapport détaillé:")
    report_response = requests.get(f"{base_url}/reports/daily-detailed/?date={today}", headers=headers)
    print(f"   Status: {report_response.status_code}")
    
    if report_response.status_code == 200:
        report = report_response.json()
        print(f"   ✅ Rapport récupéré")
        
        if 'summary' in report:
            summary = report['summary']
            print(f"   💰 Chiffre d'affaires: {summary.get('total_revenue', 0):,.0f} FBU")
            print(f"   💰 Coût total: {summary.get('total_cost', 0):,.0f} FBU")
            print(f"   🎯 Bénéfice total: {summary.get('total_profit', 0):,.0f} FBU")
        else:
            print(f"   ⚠️ Pas de résumé dans le rapport")
    else:
        print(f"   ❌ Erreur rapport: {report_response.status_code}")
        print(f"   Réponse: {report_response.text[:200]}...")

def create_manual_report_data():
    """
    Créer manuellement les données du rapport pour test
    """
    from sales.models import Sale, SaleItem
    from products.models import Product
    from datetime import datetime
    
    print(f"\n🔧 CRÉATION DONNÉES RAPPORT MANUEL:")
    
    # Récupérer les ventes du jour
    today = datetime.now().date()
    sales = Sale.objects.filter(created_at__date=today, status='paid')
    
    print(f"   📦 {sales.count()} ventes payées trouvées")
    
    total_revenue = 0
    total_cost = 0
    products_sold = {}
    
    for sale in sales:
        print(f"\n   📋 Vente {sale.id}:")
        sale_revenue = 0
        sale_cost = 0
        
        for item in sale.items.all():
            product = item.product
            quantity = item.quantity
            
            selling_price = float(product.selling_price)
            purchase_price = float(product.purchase_price)
            
            item_revenue = quantity * selling_price
            item_cost = quantity * purchase_price
            
            sale_revenue += item_revenue
            sale_cost += item_cost
            
            # Accumuler par produit
            if product.name not in products_sold:
                products_sold[product.name] = {
                    'quantity': 0,
                    'revenue': 0,
                    'cost': 0,
                    'selling_price': selling_price,
                    'purchase_price': purchase_price
                }
            
            products_sold[product.name]['quantity'] += quantity
            products_sold[product.name]['revenue'] += item_revenue
            products_sold[product.name]['cost'] += item_cost
            
            print(f"     - {product.name}: {quantity} × {selling_price:,.0f} = {item_revenue:,.0f} FBU")
        
        total_revenue += sale_revenue
        total_cost += sale_cost
        
        print(f"   💰 Total vente: {sale_revenue:,.0f} FBU")
    
    print(f"\n📊 RAPPORT MANUEL GÉNÉRÉ:")
    print(f"   💰 Chiffre d'affaires total: {total_revenue:,.0f} FBU")
    print(f"   💰 Coût total: {total_cost:,.0f} FBU")
    print(f"   🎯 Bénéfice total: {total_revenue - total_cost:,.0f} FBU")
    
    print(f"\n🍽️ DÉTAIL PAR PRODUIT:")
    for product_name, data in products_sold.items():
        profit = data['revenue'] - data['cost']
        print(f"   - {product_name}:")
        print(f"     Quantité: {data['quantity']}")
        print(f"     Chiffre d'affaires: {data['revenue']:,.0f} FBU")
        print(f"     Coût: {data['cost']:,.0f} FBU")
        print(f"     Bénéfice: {profit:,.0f} FBU")
    
    return {
        'total_revenue': total_revenue,
        'total_cost': total_cost,
        'total_profit': total_revenue - total_cost,
        'products': products_sold
    }

if __name__ == '__main__':
    debug_daily_report()
    
    print("\n" + "="*50)
    print("🔧 CRÉATION DONNÉES MANUELLES")
    print("="*50)
    
    manual_data = create_manual_report_data()
    
    print("\n" + "="*50)
    print("🎯 SOLUTIONS POUR CORRIGER L'AFFICHAGE")
    print("="*50)
    
    print("\n✅ PROBLÈMES IDENTIFIÉS:")
    print("   1. Les données des commandes ne sont peut-être pas au bon format")
    print("   2. Le frontend ne récupère peut-être pas les bonnes données")
    print("   3. Les calculs de bénéfices ne sont pas affichés correctement")
    
    print("\n🔧 SOLUTIONS À APPLIQUER:")
    print("   1. Vérifier le format des données dans l'API")
    print("   2. Corriger l'affichage dans le frontend")
    print("   3. S'assurer que les prix d'achat sont corrects")
    
    print("\n🚀 DONNÉES ATTENDUES DANS LE RAPPORT:")
    if manual_data['total_revenue'] > 0:
        print(f"   💰 Chiffre d'affaires: {manual_data['total_revenue']:,.0f} FBU")
        print(f"   💰 Coût total: {manual_data['total_cost']:,.0f} FBU")
        print(f"   🎯 Bénéfice total: {manual_data['total_profit']:,.0f} FBU")
    else:
        print("   ⚠️ Aucune vente trouvée pour aujourd'hui")
