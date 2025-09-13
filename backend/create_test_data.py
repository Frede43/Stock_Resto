#!/usr/bin/env python
"""
Script pour créer des données de test
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from sales.models import Table
from products.models import Product, Category
from django.contrib.auth.models import User

def create_test_data():
    print("🔄 Création des données de test...")
    
    # Créer des tables
    print("📋 Création des tables...")
    tables_data = [
        {'number': '1', 'capacity': 4, 'location': 'Terrasse'},
        {'number': '2', 'capacity': 2, 'location': 'Intérieur'},
        {'number': '3', 'capacity': 6, 'location': 'Salle principale'},
        {'number': '4', 'capacity': 4, 'location': 'VIP'},
        {'number': '5', 'capacity': 8, 'location': 'Salle principale'},
    ]
    
    for table_data in tables_data:
        table, created = Table.objects.get_or_create(
            number=table_data['number'],
            defaults=table_data
        )
        if created:
            print(f"✅ Table {table.number} créée")
        else:
            print(f"ℹ️ Table {table.number} existe déjà")
    
    # Créer des catégories de produits
    print("📦 Création des catégories...")
    categories_data = [
        {'name': 'Boissons', 'description': 'Boissons diverses'},
        {'name': 'Bières', 'description': 'Bières locales et importées'},
        {'name': 'Spiritueux', 'description': 'Alcools forts'},
        {'name': 'Snacks', 'description': 'Collations et amuse-gueules'},
    ]
    
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            name=cat_data['name'],
            defaults=cat_data
        )
        if created:
            print(f"✅ Catégorie {category.name} créée")
        else:
            print(f"ℹ️ Catégorie {category.name} existe déjà")
    
    # Créer des produits
    print("🍺 Création des produits...")
    boissons_cat = Category.objects.get(name='Boissons')
    bieres_cat = Category.objects.get(name='Bières')
    
    products_data = [
        {'name': 'Coca Cola', 'category': boissons_cat, 'selling_price': 1500, 'purchase_price': 1000},
        {'name': 'Fanta Orange', 'category': boissons_cat, 'selling_price': 1500, 'purchase_price': 1000},
        {'name': 'Sprite', 'category': boissons_cat, 'selling_price': 1500, 'purchase_price': 1000},
        {'name': 'Primus', 'category': bieres_cat, 'selling_price': 2000, 'purchase_price': 1500},
        {'name': 'Mutzig', 'category': bieres_cat, 'selling_price': 2000, 'purchase_price': 1500},
    ]
    
    for prod_data in products_data:
        product, created = Product.objects.get_or_create(
            name=prod_data['name'],
            defaults=prod_data
        )
        if created:
            print(f"✅ Produit {product.name} créé")
        else:
            print(f"ℹ️ Produit {product.name} existe déjà")
    
    # Créer un utilisateur admin si il n'existe pas
    print("👤 Vérification de l'utilisateur admin...")
    if not User.objects.filter(username='admin').exists():
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@barstockwise.com',
            password='admin123'
        )
        print("✅ Utilisateur admin créé (username: admin, password: admin123)")
    else:
        print("ℹ️ Utilisateur admin existe déjà")
    
    # Afficher les statistiques
    print("\n📊 Statistiques:")
    print(f"Tables: {Table.objects.count()}")
    print(f"Catégories: {Category.objects.count()}")
    print(f"Produits: {Product.objects.count()}")
    print(f"Utilisateurs: {User.objects.count()}")
    
    print("\n🎉 Données de test créées avec succès!")

if __name__ == '__main__':
    create_test_data()
