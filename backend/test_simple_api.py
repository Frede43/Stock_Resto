#!/usr/bin/env python
"""
Script pour créer une API simple de test pour le rapport journalier
"""
import os
import sys
import django
from datetime import date
from decimal import Decimal

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.http import JsonResponse
from sales.models import Sale, SaleItem
from products.models import Product

def simple_daily_report():
    """Créer un rapport journalier simple"""
    today = date.today()
    print(f"🔍 Génération du rapport pour: {today}")
    
    # Récupérer les ventes d'aujourd'hui
    today_sales = Sale.objects.filter(
        created_at__date=today,
        status__in=['completed', 'paid']
    )
    
    print(f"📊 Ventes trouvées: {today_sales.count()}")
    
    # Calculer les totaux
    total_revenue = Decimal('0.00')
    total_sales_count = 0
    products_data = {}
    
    for sale in today_sales:
        total_sales_count += 1
        sale_total = sale.total_amount or Decimal('0.00')
        total_revenue += sale_total
        
        print(f"  Vente #{sale.id}: {sale_total} BIF")
        
        # Analyser les articles
        for item in sale.items.all():
            product_name = item.product.name
            category_name = item.product.category.name if item.product.category else 'Sans catégorie'
            
            if product_name not in products_data:
                products_data[product_name] = {
                    'name': product_name,
                    'category': category_name,
                    'quantity_sold': 0,
                    'revenue': Decimal('0.00'),
                    'unit_price': item.unit_price
                }
            
            products_data[product_name]['quantity_sold'] += item.quantity
            products_data[product_name]['revenue'] += item.total_price
    
    # Organiser par catégories
    categories_data = {}
    for product_data in products_data.values():
        category = product_data['category']
        if category not in categories_data:
            categories_data[category] = {
                'name': category,
                'products': [],
                'total_revenue': Decimal('0.00'),
                'total_quantity': 0
            }
        
        categories_data[category]['products'].append(product_data)
        categories_data[category]['total_revenue'] += product_data['revenue']
        categories_data[category]['total_quantity'] += product_data['quantity_sold']
    
    # Créer la réponse JSON
    response_data = {
        'date': today.strftime('%Y-%m-%d'),
        'summary': {
            'total_sales': total_sales_count,
            'total_revenue': float(total_revenue),  # Convertir en float pour JSON
            'total_profit': 0,  # Simplifié pour l'instant
            'profit_margin': 0
        },
        'categories': {}
    }
    
    # Ajouter les catégories
    for category_name, category_data in categories_data.items():
        response_data['categories'][category_name] = {
            'name': category_name,
            'total_revenue': float(category_data['total_revenue']),
            'total_quantity': category_data['total_quantity'],
            'products': []
        }
        
        for product in category_data['products']:
            response_data['categories'][category_name]['products'].append({
                'name': product['name'],
                'quantity_sold': product['quantity_sold'],
                'revenue': float(product['revenue']),
                'unit_price': float(product['unit_price'])
            })
    
    print(f"\n✅ Rapport généré avec succès!")
    print(f"📊 Résumé:")
    print(f"  • Total ventes: {total_sales_count}")
    print(f"  • Chiffre d'affaires: {total_revenue} BIF")
    print(f"  • Catégories: {len(categories_data)}")
    
    return response_data

if __name__ == '__main__':
    import json
    
    # Générer le rapport
    report_data = simple_daily_report()
    
    # Afficher le JSON
    print(f"\n📄 Données JSON:")
    print(json.dumps(report_data, indent=2, ensure_ascii=False))
    
    # Sauvegarder dans un fichier pour test
    with open('test_report.json', 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Rapport sauvegardé dans 'test_report.json'")
