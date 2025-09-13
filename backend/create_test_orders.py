#!/usr/bin/env python3
"""
Script pour créer des commandes de test
"""
import os
import sys
import django
from decimal import Decimal

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from orders.models import Order, OrderItem
from sales.models import Table
from products.models import Product

User = get_user_model()

def create_test_orders():
    """Créer des commandes de test"""
    
    print("🔄 Création des commandes de test...")
    
    # Récupérer l'utilisateur admin
    try:
        admin_user = User.objects.get(username='admin')
    except User.DoesNotExist:
        print("❌ Utilisateur admin non trouvé")
        return
    
    # Récupérer quelques tables
    tables = Table.objects.filter(is_active=True)[:3]
    if not tables:
        print("❌ Aucune table trouvée")
        return
    
    # Récupérer quelques produits
    products = Product.objects.filter(is_active=True)[:5]
    if not products:
        print("❌ Aucun produit trouvé")
        return
    
    # Créer des commandes
    orders_data = [
        {
            'table': tables[0],
            'status': 'pending',
            'priority': 'normal',
            'notes': 'Commande table 1'
        },
        {
            'table': tables[1],
            'status': 'preparing',
            'priority': 'high',
            'notes': 'Commande urgente'
        },
        {
            'table': tables[2] if len(tables) > 2 else tables[0],
            'status': 'ready',
            'priority': 'normal',
            'notes': 'Commande prête'
        },
    ]
    
    for i, order_data in enumerate(orders_data):
        # Créer la commande
        order = Order.objects.create(
            table=order_data['table'],
            server=admin_user,
            status=order_data['status'],
            priority=order_data['priority'],
            notes=order_data['notes']
        )
        
        # Ajouter des items à la commande
        total_amount = Decimal('0.00')
        for j, product in enumerate(products[:3]):  # 3 produits par commande
            quantity = j + 1  # 1, 2, 3
            unit_price = product.selling_price or Decimal('5000.00')
            item_total = unit_price * quantity
            
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                total_price=item_total
            )
            
            total_amount += item_total
        
        # Mettre à jour le total de la commande
        order.total_amount = total_amount
        order.save()
        
        print(f"✅ Commande {order.order_number} créée - Table {order.table.number} - {total_amount} BIF")
    
    print(f"✅ {len(orders_data)} commandes créées avec succès!")

if __name__ == '__main__':
    create_test_orders()
