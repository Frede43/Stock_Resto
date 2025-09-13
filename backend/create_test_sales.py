#!/usr/bin/env python
"""
Script pour créer des ventes de test pour tester le rapport journalier
"""
import os
import sys
import django
from datetime import datetime, date
from decimal import Decimal

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Product
from sales.models import Sale, SaleItem, Table

User = get_user_model()

def create_test_sales():
    """Créer des ventes de test pour aujourd'hui"""
    print("🧪 Création de ventes de test pour le rapport journalier...")
    
    # Récupérer ou créer un utilisateur pour les ventes
    try:
        user = User.objects.get(username='admin')
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='testuser',
            email='test@barwise.com',
            password='testpass123'
        )
    
    # Récupérer quelques produits
    products = Product.objects.all()[:10]  # Prendre les 10 premiers produits
    
    if not products:
        print("❌ Aucun produit trouvé. Exécutez d'abord create_sample_data.py")
        return
    
    # Créer plusieurs ventes de test
    sales_data = [
        {
            'products': [
                {'product': 'Primus 65cl', 'quantity': 5},
                {'product': 'Coca-Cola 33cl', 'quantity': 3},
            ],
            'table_number': 1
        },
        {
            'products': [
                {'product': 'Mutzig 65cl', 'quantity': 2},
                {'product': 'Brochettes de bœuf', 'quantity': 1},
                {'product': 'Riz pilaf', 'quantity': 1},
            ],
            'table_number': 2
        },
        {
            'products': [
                {'product': 'Amstel 33cl', 'quantity': 4},
                {'product': 'Fanta Orange 33cl', 'quantity': 2},
                {'product': 'Cacahuètes grillées', 'quantity': 3},
            ],
            'table_number': 3
        },
        {
            'products': [
                {'product': 'Poisson grillé', 'quantity': 2},
                {'product': 'Salade mixte', 'quantity': 2},
                {'product': 'Sprite 33cl', 'quantity': 2},
            ],
            'table_number': 4
        },
        {
            'products': [
                {'product': 'Whisky Johnnie Walker', 'quantity': 1},
                {'product': 'Soupe du jour', 'quantity': 1},
            ],
            'table_number': 5
        }
    ]
    
    total_sales = 0
    total_revenue = Decimal('0.00')
    
    for i, sale_data in enumerate(sales_data, 1):
        print(f"\n📋 Création de la vente #{i} (Table {sale_data['table_number']})...")

        # Créer ou récupérer la table
        table, created = Table.objects.get_or_create(
            number=sale_data['table_number'],
            defaults={'capacity': 4, 'status': 'available'}
        )

        # Créer la vente
        sale = Sale.objects.create(
            server=user,
            table=table,
            status='paid',  # Vente terminée et payée
            payment_method='cash'
        )
        
        sale_total = Decimal('0.00')
        
        # Ajouter les articles à la vente
        for item_data in sale_data['products']:
            try:
                product = Product.objects.get(name=item_data['product'])
                quantity = item_data['quantity']
                unit_price = product.selling_price
                total_price = unit_price * quantity
                
                # Créer l'article de vente
                sale_item = SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_price
                )
                
                # Mettre à jour le stock du produit
                if product.current_stock >= quantity:
                    product.current_stock -= quantity
                    product.save()
                    print(f"  ✅ {product.name}: {quantity} × {unit_price} BIF = {total_price} BIF")
                else:
                    print(f"  ⚠️ {product.name}: Stock insuffisant ({product.current_stock} disponible)")
                
                sale_total += total_price
                
            except Product.DoesNotExist:
                print(f"  ❌ Produit '{item_data['product']}' non trouvé")
        
        # Mettre à jour le total de la vente
        sale.total_amount = sale_total
        sale.save()
        
        total_sales += 1
        total_revenue += sale_total
        
        print(f"  💰 Total vente: {sale_total} BIF")
    
    print(f"\n🎉 Ventes de test créées avec succès!")
    print(f"📊 Résumé:")
    print(f"  • Nombre de ventes: {total_sales}")
    print(f"  • Chiffre d'affaires total: {total_revenue} BIF")
    print(f"  • Date: {date.today()}")
    
    print(f"\n🔗 Vous pouvez maintenant:")
    print(f"  1. Ouvrir http://localhost:8082/ dans votre navigateur")
    print(f"  2. Aller sur la page 'Rapport Journalier'")
    print(f"  3. Sélectionner la date d'aujourd'hui")
    print(f"  4. Voir les données réelles dans le rapport!")

if __name__ == '__main__':
    create_test_sales()
