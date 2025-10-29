#!/usr/bin/env python
"""
Test très simple pour identifier le problème
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')

try:
    django.setup()
    print("✅ Django setup réussi")
except Exception as e:
    print(f"❌ Erreur Django setup: {e}")
    sys.exit(1)

try:
    from django.contrib.auth import get_user_model
    print("✅ Import User model réussi")
    
    User = get_user_model()
    user_count = User.objects.count()
    print(f"📊 Nombre d'utilisateurs: {user_count}")
    
    if user_count == 0:
        print("⚠️ Aucun utilisateur trouvé")
    else:
        users = User.objects.all()[:3]
        for user in users:
            print(f"   👤 {user.username} (ID: {user.id}, Role: {getattr(user, 'role', 'N/A')})")
    
except Exception as e:
    print(f"❌ Erreur User: {e}")

try:
    from products.models import Product
    print("✅ Import Product model réussi")
    
    product_count = Product.objects.count()
    print(f"📦 Nombre de produits: {product_count}")
    
    if product_count == 0:
        print("⚠️ Aucun produit trouvé")
    else:
        products = Product.objects.all()[:3]
        for product in products:
            print(f"   📦 {product.name} (ID: {product.id}, Stock: {product.current_stock})")
    
except Exception as e:
    print(f"❌ Erreur Product: {e}")

try:
    from inventory.models import StockMovement
    print("✅ Import StockMovement model réussi")
    
    movement_count = StockMovement.objects.count()
    print(f"📋 Nombre de mouvements: {movement_count}")
    
except Exception as e:
    print(f"❌ Erreur StockMovement: {e}")

try:
    from inventory.serializers import StockMovementSerializer
    print("✅ Import StockMovementSerializer réussi")
    
except Exception as e:
    print(f"❌ Erreur StockMovementSerializer: {e}")

print("\n🧪 Test de création d'utilisateur admin...")
try:
    User = get_user_model()
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@test.com',
            'is_staff': True,
            'is_superuser': True,
            'is_active': True
        }
    )
    
    # Ajouter le rôle si le modèle l'a
    if hasattr(admin_user, 'role') and not admin_user.role:
        admin_user.role = 'admin'
        admin_user.save()
    
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"✅ Utilisateur admin créé: {admin_user.username}")
    else:
        print(f"ℹ️ Utilisateur admin existe: {admin_user.username}")
    
    print(f"   ID: {admin_user.id}")
    print(f"   Email: {admin_user.email}")
    print(f"   Active: {admin_user.is_active}")
    print(f"   Staff: {admin_user.is_staff}")
    print(f"   Superuser: {admin_user.is_superuser}")
    print(f"   Role: {getattr(admin_user, 'role', 'N/A')}")
    
except Exception as e:
    print(f"❌ Erreur création admin: {e}")
    import traceback
    traceback.print_exc()

print("\n🧪 Test de création de produit...")
try:
    from products.models import Product, Category
    
    # Créer une catégorie si nécessaire
    category, created = Category.objects.get_or_create(
        name='Test Category',
        defaults={'description': 'Catégorie de test'}
    )
    
    # Créer un produit de test
    product, created = Product.objects.get_or_create(
        name='Test Product',
        defaults={
            'category': category,
            'description': 'Produit de test',
            'unit': 'pièce',
            'purchase_price': 1000.0,
            'selling_price': 1500.0,
            'current_stock': 10,
            'minimum_stock': 5
        }
    )
    
    if created:
        print(f"✅ Produit créé: {product.name}")
    else:
        print(f"ℹ️ Produit existe: {product.name}")
    
    print(f"   ID: {product.id}")
    print(f"   Stock: {product.current_stock}")
    print(f"   Prix achat: {product.purchase_price}")
    
except Exception as e:
    print(f"❌ Erreur création produit: {e}")
    import traceback
    traceback.print_exc()

print("\n✅ Test simple terminé!")
