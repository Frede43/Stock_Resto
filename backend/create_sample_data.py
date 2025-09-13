#!/usr/bin/env python
"""
Script pour créer des données d'exemple
"""
import os
import sys
import django
from decimal import Decimal

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from products.models import Category, Product
from suppliers.models import Supplier

def create_categories():
    """Créer les catégories de base"""
    
    categories_data = [
        {'name': 'Bières', 'type': 'boissons', 'description': 'Bières locales et importées'},
        {'name': 'Sodas', 'type': 'boissons', 'description': 'Boissons gazeuses et jus'},
        {'name': 'Alcools', 'type': 'boissons', 'description': 'Spiritueux et vins'},
        {'name': 'Plats principaux', 'type': 'plats', 'description': 'Plats de résistance'},
        {'name': 'Entrées', 'type': 'plats', 'description': 'Hors-d\'œuvres et entrées'},
        {'name': 'Snacks', 'type': 'snacks', 'description': 'Collations et amuse-gueules'},
    ]
    
    created_categories = []
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            name=cat_data['name'],
            defaults=cat_data
        )
        if created:
            created_categories.append(category)
            print(f"Catégorie créée: {category.name}")
    
    return created_categories

def create_suppliers():
    """Créer des fournisseurs d'exemple"""
    
    suppliers_data = [
        {
            'name': 'Brasserie du Burundi',
            'contact_person': 'Pierre Nkurunziza',
            'phone': '+25722123456',
            'email': 'contact@brasserieburundi.bi',
            'address': 'Avenue de l\'Indépendance, Bujumbura',
            'city': 'Bujumbura'
        },
        {
            'name': 'Distributeur Coca-Cola',
            'contact_person': 'Marie Uwimana',
            'phone': '+25722654321',
            'email': 'marie@cocacola.bi',
            'address': 'Quartier Industriel, Bujumbura',
            'city': 'Bujumbura'
        },
        {
            'name': 'Ferme Locale Bio',
            'contact_person': 'Jean Baptiste',
            'phone': '+25779987654',
            'email': 'jean@fermelocale.bi',
            'address': 'Commune Mukike, Bujumbura Rural',
            'city': 'Bujumbura Rural'
        }
    ]
    
    created_suppliers = []
    for sup_data in suppliers_data:
        supplier, created = Supplier.objects.get_or_create(
            name=sup_data['name'],
            defaults=sup_data
        )
        if created:
            created_suppliers.append(supplier)
            print(f"Fournisseur créé: {supplier.name}")
    
    return created_suppliers

def create_products():
    """Créer des produits d'exemple"""
    
    # Récupérer les catégories
    biere_cat = Category.objects.get(name='Bières')
    soda_cat = Category.objects.get(name='Sodas')
    alcool_cat = Category.objects.get(name='Alcools')
    plat_cat = Category.objects.get(name='Plats principaux')
    entree_cat = Category.objects.get(name='Entrées')
    snack_cat = Category.objects.get(name='Snacks')
    
    products_data = [
        # Bières
        {'name': 'Primus 65cl', 'category': biere_cat, 'unit': 'bouteille', 'purchase_price': Decimal('800'), 'selling_price': Decimal('1200'), 'current_stock': 48, 'minimum_stock': 12, 'units_per_case': 12, 'case_price': Decimal('9600')},
        {'name': 'Mutzig 65cl', 'category': biere_cat, 'unit': 'bouteille', 'purchase_price': Decimal('900'), 'selling_price': Decimal('1300'), 'current_stock': 36, 'minimum_stock': 12, 'units_per_case': 12, 'case_price': Decimal('10800')},
        {'name': 'Amstel 33cl', 'category': biere_cat, 'unit': 'bouteille', 'purchase_price': Decimal('600'), 'selling_price': Decimal('1000'), 'current_stock': 24, 'minimum_stock': 24, 'units_per_case': 24, 'case_price': Decimal('14400')},
        
        # Sodas
        {'name': 'Coca-Cola 33cl', 'category': soda_cat, 'unit': 'bouteille', 'purchase_price': Decimal('400'), 'selling_price': Decimal('700'), 'current_stock': 60, 'minimum_stock': 24, 'units_per_case': 24, 'case_price': Decimal('9600')},
        {'name': 'Fanta Orange 33cl', 'category': soda_cat, 'unit': 'bouteille', 'purchase_price': Decimal('400'), 'selling_price': Decimal('700'), 'current_stock': 48, 'minimum_stock': 24, 'units_per_case': 24, 'case_price': Decimal('9600')},
        {'name': 'Sprite 33cl', 'category': soda_cat, 'unit': 'bouteille', 'purchase_price': Decimal('400'), 'selling_price': Decimal('700'), 'current_stock': 36, 'minimum_stock': 24, 'units_per_case': 24, 'case_price': Decimal('9600')},
        {'name': 'Eau minérale 50cl', 'category': soda_cat, 'unit': 'bouteille', 'purchase_price': Decimal('200'), 'selling_price': Decimal('400'), 'current_stock': 72, 'minimum_stock': 48, 'units_per_case': 24, 'case_price': Decimal('4800')},
        
        # Alcools
        {'name': 'Whisky Johnnie Walker', 'category': alcool_cat, 'unit': 'bouteille', 'purchase_price': Decimal('25000'), 'selling_price': Decimal('35000'), 'current_stock': 6, 'minimum_stock': 3},
        {'name': 'Vodka Smirnoff', 'category': alcool_cat, 'unit': 'bouteille', 'purchase_price': Decimal('18000'), 'selling_price': Decimal('25000'), 'current_stock': 8, 'minimum_stock': 4},
        {'name': 'Vin rouge Bordeaux', 'category': alcool_cat, 'unit': 'bouteille', 'purchase_price': Decimal('12000'), 'selling_price': Decimal('18000'), 'current_stock': 12, 'minimum_stock': 6},
        
        # Plats
        {'name': 'Brochettes de bœuf', 'category': plat_cat, 'unit': 'portion', 'purchase_price': Decimal('2500'), 'selling_price': Decimal('4000'), 'current_stock': 20, 'minimum_stock': 10},
        {'name': 'Poisson grillé', 'category': plat_cat, 'unit': 'portion', 'purchase_price': Decimal('3000'), 'selling_price': Decimal('4500'), 'current_stock': 15, 'minimum_stock': 8},
        {'name': 'Riz pilaf', 'category': plat_cat, 'unit': 'portion', 'purchase_price': Decimal('1000'), 'selling_price': Decimal('1800'), 'current_stock': 30, 'minimum_stock': 15},
        
        # Entrées
        {'name': 'Salade mixte', 'category': entree_cat, 'unit': 'portion', 'purchase_price': Decimal('800'), 'selling_price': Decimal('1500'), 'current_stock': 25, 'minimum_stock': 10},
        {'name': 'Soupe du jour', 'category': entree_cat, 'unit': 'portion', 'purchase_price': Decimal('600'), 'selling_price': Decimal('1200'), 'current_stock': 20, 'minimum_stock': 10},
        
        # Snacks
        {'name': 'Cacahuètes grillées', 'category': snack_cat, 'unit': 'portion', 'purchase_price': Decimal('300'), 'selling_price': Decimal('600'), 'current_stock': 40, 'minimum_stock': 20},
        {'name': 'Chips de banane', 'category': snack_cat, 'unit': 'portion', 'purchase_price': Decimal('250'), 'selling_price': Decimal('500'), 'current_stock': 35, 'minimum_stock': 15},
    ]
    
    created_products = []
    for prod_data in products_data:
        product, created = Product.objects.get_or_create(
            name=prod_data['name'],
            category=prod_data['category'],
            defaults=prod_data
        )
        if created:
            created_products.append(product)
            print(f"Produit créé: {product.name} - {product.selling_price} BIF")
    
    return created_products

if __name__ == '__main__':
    print("Création des données d'exemple...")
    
    print("\n1. Création des catégories...")
    create_categories()
    
    print("\n2. Création des fournisseurs...")
    create_suppliers()
    
    print("\n3. Création des produits...")
    create_products()
    
    print("\nDonnées d'exemple créées avec succès!")
    print(f"Catégories: {Category.objects.count()}")
    print(f"Fournisseurs: {Supplier.objects.count()}")
    print(f"Produits: {Product.objects.count()}")
