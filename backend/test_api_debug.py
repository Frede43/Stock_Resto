#!/usr/bin/env python
"""
Script de test et débogage des APIs BarStockWise
"""

import os
import sys
import django
import json
from decimal import Decimal

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from products.models import Category, Product
from inventory.models import StockMovement
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def create_test_data():
    """Créer des données de test"""
    print("🔧 Création des données de test...")
    
    # Créer un utilisateur admin
    admin_user, created = User.objects.get_or_create(
        username='admin_test',
        defaults={
            'email': 'admin@test.com',
            'role': 'admin',
            'first_name': 'Admin',
            'last_name': 'Test'
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
    
    # Créer une catégorie
    category, created = Category.objects.get_or_create(
        name='Bières Test',
        defaults={
            'type': 'boissons',
            'description': 'Catégorie de test pour les bières'
        }
    )
    
    print(f"✅ Utilisateur admin: {admin_user.username}")
    print(f"✅ Catégorie: {category.name} (ID: {category.id})")
    
    return admin_user, category

def get_auth_token(user):
    """Obtenir un token JWT pour l'utilisateur"""
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

def test_product_creation():
    """Tester la création de produit"""
    print("\n🧪 Test de création de produit...")
    
    admin_user, category = create_test_data()
    client = APIClient()
    
    # Authentification
    token = get_auth_token(admin_user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Données du produit
    product_data = {
        'name': 'Primus Test',
        'category': category.id,
        'purchase_price': '2217.00',
        'selling_price': '5000.00',
        'current_stock': 10,
        'minimum_stock': 5,
        'unit': 'bouteille',
        'description': 'Bière Primus pour test'
    }
    
    print(f"📤 Données envoyées: {json.dumps(product_data, indent=2)}")
    
    # Requête POST
    response = client.post('/api/products/', product_data, format='json')
    
    print(f"📥 Statut de réponse: {response.status_code}")
    print(f"📥 Contenu de réponse: {response.content.decode()}")
    
    if response.status_code == 201:
        print("✅ Produit créé avec succès!")
        return response.data
    else:
        print("❌ Erreur lors de la création du produit")
        if hasattr(response, 'data'):
            print(f"Détails de l'erreur: {response.data}")
        return None

def test_stock_movement_creation():
    """Tester la création de mouvement de stock"""
    print("\n🧪 Test de création de mouvement de stock...")
    
    admin_user, category = create_test_data()
    client = APIClient()
    
    # Authentification
    token = get_auth_token(admin_user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Créer un produit d'abord
    product = Product.objects.create(
        name='Test Product Stock',
        category=category,
        purchase_price=Decimal('1000.00'),
        selling_price=Decimal('2000.00'),
        current_stock=5,
        minimum_stock=2,
        unit='piece'
    )
    
    # Données du mouvement
    movement_data = {
        'product': product.id,
        'movement_type': 'in',
        'reason': 'purchase',
        'quantity': 10,
        'unit_price': '1000.00',
        'reference': 'TEST-001',
        'notes': 'Test d\'approvisionnement'
    }
    
    print(f"📤 Données envoyées: {json.dumps(movement_data, indent=2)}")
    
    # Requête POST
    response = client.post('/api/inventory/movements/', movement_data, format='json')
    
    print(f"📥 Statut de réponse: {response.status_code}")
    print(f"📥 Contenu de réponse: {response.content.decode()}")
    
    if response.status_code == 201:
        print("✅ Mouvement de stock créé avec succès!")
        
        # Vérifier que le stock a été mis à jour
        product.refresh_from_db()
        print(f"📊 Stock mis à jour: {product.current_stock}")
        return response.data
    else:
        print("❌ Erreur lors de la création du mouvement")
        if hasattr(response, 'data'):
            print(f"Détails de l'erreur: {response.data}")
        return None

def test_api_endpoints():
    """Tester les endpoints principaux"""
    print("\n🧪 Test des endpoints API...")
    
    admin_user, category = create_test_data()
    client = APIClient()
    
    # Authentification
    token = get_auth_token(admin_user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    endpoints = [
        '/api/products/',
        '/api/inventory/movements/',
        '/api/sales/',
        '/api/suppliers/',
    ]
    
    for endpoint in endpoints:
        print(f"\n📡 Test GET {endpoint}")
        response = client.get(endpoint)
        print(f"   Statut: {response.status_code}")
        if response.status_code != 200:
            print(f"   Erreur: {response.content.decode()}")
        else:
            print("   ✅ OK")

def main():
    """Fonction principale"""
    print("🚀 Démarrage des tests API BarStockWise")
    print("=" * 50)
    
    try:
        # Test des endpoints
        test_api_endpoints()
        
        # Test création produit
        product_result = test_product_creation()
        
        # Test création mouvement stock
        movement_result = test_stock_movement_creation()
        
        print("\n" + "=" * 50)
        print("📊 Résumé des tests:")
        print(f"   Produit: {'✅ OK' if product_result else '❌ ERREUR'}")
        print(f"   Mouvement: {'✅ OK' if movement_result else '❌ ERREUR'}")
        
    except Exception as e:
        print(f"❌ Erreur générale: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
