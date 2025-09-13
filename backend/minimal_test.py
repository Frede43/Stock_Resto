#!/usr/bin/env python
"""
Test minimal pour identifier l'erreur
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

print("🧪 Test Minimal")
print("=" * 20)

try:
    from django.contrib.auth import get_user_model
    from products.models import Product
    from inventory.models import StockMovement
    from inventory.serializers import StockMovementSerializer
    
    User = get_user_model()
    
    # Récupérer les données
    admin_user = User.objects.get(id=5)
    product = Product.objects.first()
    
    print(f"👤 User: {admin_user.username}")
    print(f"📦 Product: {product.name}")
    
    # Test du serializer sans requête
    data = {
        'product': product,
        'movement_type': 'in',
        'reason': 'purchase',
        'quantity': 5,
        'unit_price': 1000.0,
        'reference': 'TEST-MIN',
        'notes': 'Test minimal',
        'user': admin_user,
        'stock_before': product.current_stock
    }
    
    print(f"📋 Data: {data}")
    
    # Créer directement le mouvement
    movement = StockMovement.objects.create(**data)
    print(f"✅ Mouvement créé: {movement.id}")
    
    # Mettre à jour le stock
    movement.stock_after = movement.stock_before + movement.quantity
    movement.save()
    
    product.current_stock = movement.stock_after
    product.save()
    
    print(f"📊 Stock mis à jour: {product.current_stock}")
    print("✅ Test minimal réussi!")
    
except Exception as e:
    print(f"❌ Erreur: {e}")
    import traceback
    traceback.print_exc()
