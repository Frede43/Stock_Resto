#!/usr/bin/env python
"""
Test final avec création directe
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Product
from inventory.models import StockMovement

User = get_user_model()

def main():
    print("🧪 Test Final - Création Directe")
    print("=" * 35)
    
    try:
        # Récupérer les données
        admin_user = User.objects.get(id=5)
        product = Product.objects.first()
        
        print(f"👤 User: {admin_user.username}")
        print(f"📦 Product: {product.name}")
        print(f"📊 Stock avant: {product.current_stock}")
        
        # Créer le mouvement directement
        movement = StockMovement.objects.create(
            product=product,
            movement_type='in',
            reason='purchase',
            quantity=3,
            unit_price=800.0,
            stock_before=product.current_stock,
            stock_after=product.current_stock + 3,
            user=admin_user,
            reference='FINAL-TEST',
            notes='Test final direct'
        )
        
        print(f"✅ Mouvement créé: ID {movement.id}")
        print(f"📋 Référence: {movement.reference}")
        print(f"📊 Stock après: {movement.stock_after}")
        
        # Mettre à jour le stock du produit
        product.current_stock = movement.stock_after
        product.save()
        
        print(f"✅ Stock produit mis à jour: {product.current_stock}")
        print("🎉 Test final réussi!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    if success:
        print("\n✅ La création de mouvement fonctionne!")
        print("Le problème est dans le serializer ou l'API.")
    else:
        print("\n❌ Problème avec le modèle ou la base de données.")
