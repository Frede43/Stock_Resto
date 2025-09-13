#!/usr/bin/env python
"""
Créer des ventes pour AUJOURD'HUI (2025-08-17) pour le dashboard
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
from django.utils import timezone

User = get_user_model()

def create_today_sales():
    """Créer des ventes pour aujourd'hui (2025-08-17)"""
    print("🧪 Création de ventes pour AUJOURD'HUI (2025-08-17)...")
    print("=" * 60)
    
    # Forcer la date à aujourd'hui
    today = date(2025, 8, 17)  # Forcer à aujourd'hui
    print(f"📅 Date cible: {today}")
    
    # Vérifier s'il y a déjà des ventes aujourd'hui
    existing_sales = Sale.objects.filter(created_at__date=today)
    if existing_sales.exists():
        print(f"⚠️  {existing_sales.count()} ventes existantes pour {today}")
        response = input("Voulez-vous les supprimer et recréer ? (y/N): ")
        if response.lower() == 'y':
            existing_sales.delete()
            print("🗑️  Ventes existantes supprimées")
        else:
            print("❌ Opération annulée")
            return False
    
    # Récupérer des produits
    products = list(Product.objects.filter(is_active=True)[:10])
    if not products:
        print("❌ Aucun produit trouvé")
        return False
    
    print(f"📦 {len(products)} produits disponibles")
    
    # Récupérer ou créer un utilisateur
    try:
        user = User.objects.first()
        if not user:
            user = User.objects.create_user(
                username='admin',
                email='admin@example.com',
                password='admin123'
            )
        print(f"👤 Utilisateur: {user.username}")
    except Exception as e:
        print(f"⚠️  Erreur utilisateur: {e}")
        user = None
    
    # Récupérer ou créer des tables
    tables = []
    for i in range(1, 6):
        table, created = Table.objects.get_or_create(
            number=i,
            defaults={'capacity': 4, 'is_active': True}
        )
        tables.append(table)
        if created:
            print(f"🪑 Table {i} créée")
    
    # Créer 8 ventes pour aujourd'hui
    total_revenue = Decimal('0.00')
    total_sales_count = 0
    
    sales_data = [
        {'table': 1, 'products': [('Primus 65cl', 3), ('Coca-Cola 33cl', 2)]},
        {'table': 2, 'products': [('Mutzig 65cl', 2), ('Brochettes de bœuf', 1)]},
        {'table': 3, 'products': [('Amstel 33cl', 4), ('Fanta Orange 33cl', 1)]},
        {'table': 4, 'products': [('Poisson grillé', 1), ('Riz pilaf', 1)]},
        {'table': 5, 'products': [('Whisky Johnnie Walker', 1)]},
        {'table': 1, 'products': [('Sprite 33cl', 3), ('Cacahuètes grillées', 2)]},
        {'table': 3, 'products': [('Soupe du jour', 2), ('Salade mixte', 1)]},
        {'table': 2, 'products': [('Primus 65cl', 2), ('Poisson grillé', 1)]}
    ]
    
    for i, sale_info in enumerate(sales_data, 1):
        print(f"\n📋 Création de la vente #{i} (Table {sale_info['table']})...")
        
        # Créer la vente
        sale = Sale.objects.create(
            table=tables[sale_info['table'] - 1],
            server=user,
            payment_method='cash',
            status='completed',
            notes=f'Vente de test #{i} pour {today}'
        )
        
        # Forcer la date de création à aujourd'hui
        sale.created_at = timezone.make_aware(
            datetime.combine(today, datetime.min.time())
        )
        
        sale_total = Decimal('0.00')
        
        # Ajouter les produits
        for product_name, quantity in sale_info['products']:
            try:
                product = Product.objects.filter(name__icontains=product_name).first()
                if product:
                    item_total = product.selling_price * quantity
                    
                    SaleItem.objects.create(
                        sale=sale,
                        product=product,
                        quantity=quantity,
                        unit_price=product.selling_price,
                        total_price=item_total
                    )
                    
                    sale_total += item_total
                    print(f"  ✅ {product.name}: {quantity} × {product.selling_price} BIF = {item_total} BIF")
                    
                    # Réduire le stock
                    if product.current_stock >= quantity:
                        product.current_stock -= quantity
                        product.save()
                else:
                    print(f"  ❌ Produit non trouvé: {product_name}")
            except Exception as e:
                print(f"  ❌ Erreur produit {product_name}: {e}")
        
        # Mettre à jour le total de la vente
        sale.total_amount = sale_total
        sale.save()
        
        total_revenue += sale_total
        total_sales_count += 1
        
        print(f"  💰 Total vente: {sale_total} BIF")
    
    print(f"\n🎉 Ventes créées avec succès!")
    print(f"📊 Résumé:")
    print(f"  • Nombre de ventes: {total_sales_count}")
    print(f"  • Chiffre d'affaires total: {total_revenue} BIF")
    print(f"  • Date: {today}")
    
    return True

def verify_today_sales():
    """Vérifier les ventes d'aujourd'hui"""
    print(f"\n🔍 Vérification des ventes d'aujourd'hui...")
    
    today = date(2025, 8, 17)
    sales_today = Sale.objects.filter(created_at__date=today)
    
    print(f"📊 Ventes trouvées pour {today}: {sales_today.count()}")
    
    if sales_today.exists():
        completed_sales = sales_today.filter(status='completed')
        total_revenue = sum(sale.total_amount for sale in completed_sales)
        
        print(f"  • Ventes complétées: {completed_sales.count()}")
        print(f"  • Revenus totaux: {total_revenue} BIF")
        
        for sale in sales_today[:3]:
            print(f"  • Vente #{sale.id}: {sale.total_amount} BIF (Table {sale.table.number if sale.table else 'N/A'})")
        
        return True
    else:
        print("❌ Aucune vente trouvée")
        return False

if __name__ == '__main__':
    print("🧪 Création de ventes pour le dashboard - AUJOURD'HUI")
    print("=" * 60)
    
    success = create_today_sales()
    
    if success:
        if verify_today_sales():
            print(f"\n🎉 Données créées avec succès !")
            print(f"📋 Actions suivantes:")
            print(f"   1. Rafraîchir la page http://localhost:8081/")
            print(f"   2. Les valeurs du dashboard devraient maintenant s'afficher")
            print(f"   3. Tester les boutons d'action rapide")
        else:
            print(f"\n❌ Problème lors de la vérification")
    else:
        print(f"\n❌ Échec de la création des ventes")
