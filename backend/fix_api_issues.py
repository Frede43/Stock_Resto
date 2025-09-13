#!/usr/bin/env python
"""
Script pour corriger les problèmes d'API et créer des données de test
"""

import os
import sys
import django
from decimal import Decimal

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Category, Product
from suppliers.models import Supplier
from sales.models import Table

User = get_user_model()

def create_categories():
    """Créer les catégories de base"""
    print("📂 Création des catégories...")
    
    categories_data = [
        {'name': 'Bières Brarudi', 'type': 'boissons', 'description': 'Bières locales Brarudi'},
        {'name': 'Liqueurs', 'type': 'boissons', 'description': 'Spiritueux et liqueurs'},
        {'name': 'Autres Boissons', 'type': 'boissons', 'description': 'Sodas et autres boissons'},
        {'name': 'Plats', 'type': 'plats', 'description': 'Plats principaux'},
        {'name': 'Snacks', 'type': 'snacks', 'description': 'Collations et amuse-gueules'},
    ]
    
    created_categories = []
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            name=cat_data['name'],
            defaults=cat_data
        )
        created_categories.append(category)
        status = "✅ Créé" if created else "ℹ️ Existe"
        print(f"   {status}: {category.name}")
    
    return created_categories

def create_products():
    """Créer des produits de test"""
    print("🍺 Création des produits...")
    
    # Récupérer les catégories
    try:
        bieres = Category.objects.get(name='Bières Brarudi')
        liqueurs = Category.objects.get(name='Liqueurs')
        autres = Category.objects.get(name='Autres Boissons')
    except Category.DoesNotExist:
        print("❌ Erreur: Catégories manquantes")
        return []
    
    products_data = [
        # Bières Brarudi
        {
            'name': 'FANTA',
            'category': bieres,
            'purchase_price': Decimal('1350.00'),
            'selling_price': Decimal('3000.00'),
            'current_stock': 39,
            'minimum_stock': 10,
            'unit': 'bouteille'
        },
        {
            'name': 'PRIMUS',
            'category': bieres,
            'purchase_price': Decimal('2217.00'),
            'selling_price': Decimal('5000.00'),
            'current_stock': 32,
            'minimum_stock': 15,
            'unit': 'bouteille'
        },
        {
            'name': 'AMSTEL',
            'category': bieres,
            'purchase_price': Decimal('3046.00'),
            'selling_price': Decimal('6000.00'),
            'current_stock': 3,
            'minimum_stock': 10,
            'unit': 'bouteille'
        },
        # Liqueurs
        {
            'name': 'CHIVAS',
            'category': liqueurs,
            'purchase_price': Decimal('13333.00'),
            'selling_price': Decimal('20000.00'),
            'current_stock': 18,
            'minimum_stock': 5,
            'unit': 'bouteille'
        },
        {
            'name': 'JOHNNIE WALKER',
            'category': liqueurs,
            'purchase_price': Decimal('10000.00'),
            'selling_price': Decimal('15000.00'),
            'current_stock': 8,
            'minimum_stock': 3,
            'unit': 'bouteille'
        },
        # Autres boissons
        {
            'name': 'COCA-COLA',
            'category': autres,
            'purchase_price': Decimal('1350.00'),
            'selling_price': Decimal('2500.00'),
            'current_stock': 50,
            'minimum_stock': 20,
            'unit': 'bouteille'
        },
        {
            'name': 'EAU MINÉRALE',
            'category': autres,
            'purchase_price': Decimal('750.00'),
            'selling_price': Decimal('1500.00'),
            'current_stock': 100,
            'minimum_stock': 30,
            'unit': 'bouteille'
        },
    ]
    
    created_products = []
    for prod_data in products_data:
        product, created = Product.objects.get_or_create(
            name=prod_data['name'],
            category=prod_data['category'],
            defaults=prod_data
        )
        created_products.append(product)
        status = "✅ Créé" if created else "ℹ️ Existe"
        print(f"   {status}: {product.name} - {product.category.name}")
    
    return created_products

def create_suppliers():
    """Créer des fournisseurs de test"""
    print("🚚 Création des fournisseurs...")
    
    suppliers_data = [
        {
            'name': 'Brarudi SA',
            'contact_person': 'Jean Ndayishimiye',
            'phone': '+257 22 22 22 22',
            'email': 'contact@brarudi.bi',
            'address': 'Avenue de l\'Industrie, Bujumbura'
        },
        {
            'name': 'Distributeur Liqueurs',
            'contact_person': 'Marie Nzeyimana',
            'phone': '+257 33 33 33 33',
            'email': 'marie@liqueurs.bi',
            'address': 'Quartier Rohero, Bujumbura'
        },
        {
            'name': 'Sodas & Co',
            'contact_person': 'Pierre Hakizimana',
            'phone': '+257 44 44 44 44',
            'email': 'pierre@sodas.bi',
            'address': 'Zone Industrielle, Bujumbura'
        }
    ]
    
    created_suppliers = []
    for supp_data in suppliers_data:
        supplier, created = Supplier.objects.get_or_create(
            name=supp_data['name'],
            defaults=supp_data
        )
        created_suppliers.append(supplier)
        status = "✅ Créé" if created else "ℹ️ Existe"
        print(f"   {status}: {supplier.name}")
    
    return created_suppliers

def create_tables():
    """Créer des tables de test"""
    print("🪑 Création des tables...")
    
    tables_data = [
        {'number': '1', 'capacity': 4, 'location': 'Terrasse'},
        {'number': '2', 'capacity': 2, 'location': 'Intérieur'},
        {'number': '3', 'capacity': 6, 'location': 'Terrasse'},
        {'number': '4', 'capacity': 4, 'location': 'Intérieur'},
        {'number': '5', 'capacity': 8, 'location': 'Salle privée'},
    ]
    
    created_tables = []
    for table_data in tables_data:
        table, created = Table.objects.get_or_create(
            number=table_data['number'],
            defaults=table_data
        )
        created_tables.append(table)
        status = "✅ Créé" if created else "ℹ️ Existe"
        print(f"   {status}: Table {table.number} ({table.capacity} places)")
    
    return created_tables

def create_users():
    """Créer des utilisateurs de test"""
    print("👥 Création des utilisateurs...")
    
    users_data = [
        {
            'username': 'admin',
            'email': 'admin@barstockwise.com',
            'first_name': 'Admin',
            'last_name': 'System',
            'role': 'admin',
            'password': 'admin123'
        },
        {
            'username': 'gerant',
            'email': 'gerant@barstockwise.com',
            'first_name': 'Jean',
            'last_name': 'Gérant',
            'role': 'gerant',
            'password': 'gerant123'
        },
        {
            'username': 'serveur1',
            'email': 'serveur1@barstockwise.com',
            'first_name': 'Marie',
            'last_name': 'Serveur',
            'role': 'serveur',
            'password': 'serveur123'
        }
    ]
    
    created_users = []
    for user_data in users_data:
        password = user_data.pop('password')
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults=user_data
        )
        if created:
            user.set_password(password)
            user.save()
        created_users.append(user)
        status = "✅ Créé" if created else "ℹ️ Existe"
        print(f"   {status}: {user.username} ({user.get_role_display()})")
    
    return created_users

def main():
    """Fonction principale"""
    print("🔧 Correction des problèmes API et création des données de test")
    print("=" * 60)
    
    try:
        # Créer les données de base
        users = create_users()
        categories = create_categories()
        products = create_products()
        suppliers = create_suppliers()
        tables = create_tables()
        
        print("\n" + "=" * 60)
        print("✅ Données de test créées avec succès!")
        print(f"   👥 Utilisateurs: {len(users)}")
        print(f"   📂 Catégories: {len(categories)}")
        print(f"   🍺 Produits: {len(products)}")
        print(f"   🚚 Fournisseurs: {len(suppliers)}")
        print(f"   🪑 Tables: {len(tables)}")
        
        print("\n🔑 Comptes de connexion:")
        print("   Admin: admin / admin123")
        print("   Gérant: gerant / gerant123")
        print("   Serveur: serveur1 / serveur123")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
