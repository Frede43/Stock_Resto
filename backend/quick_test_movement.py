#!/usr/bin/env python
"""
Test rapide pour identifier le problème de l'erreur 400
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Product
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def main():
    print("🧪 Test Rapide - Mouvement de Stock")
    print("=" * 40)
    
    try:
        # Récupérer ou créer un utilisateur admin
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@test.com',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True
            }
        )
        
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
        
        print(f"👤 Utilisateur: {admin_user.username} (ID: {admin_user.id})")
        print(f"   Authentifié: {admin_user.is_authenticated}")
        print(f"   Actif: {admin_user.is_active}")
        
        # Récupérer un produit
        product = Product.objects.first()
        if not product:
            print("❌ Aucun produit trouvé")
            return False
        
        print(f"📦 Produit: {product.name} (ID: {product.id})")
        print(f"   Stock actuel: {product.current_stock}")
        
        # Créer le client API
        client = APIClient()
        
        # Authentification JWT
        refresh = RefreshToken.for_user(admin_user)
        token = str(refresh.access_token)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        print(f"🔑 Token: {token[:30]}...")
        
        # Données de test (exactement comme le frontend)
        data = {
            'product': product.id,
            'movement_type': 'in',
            'reason': 'purchase',
            'quantity': 5,
            'unit_price': 1000.0,
            'reference': 'TEST-QUICK',
            'notes': 'Test rapide'
        }
        
        print(f"📤 Données: {data}")
        
        # Test de la requête
        response = client.post('/api/inventory/movements/', data, format='json')
        
        print(f"📥 Status: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ Succès! Mouvement créé")
            response_data = response.json()
            print(f"   ID: {response_data.get('id')}")
            print(f"   Stock après: {response_data.get('stock_after')}")
            return True
        else:
            print("❌ Erreur!")
            print(f"   Contenu: {response.content.decode()}")
            
            try:
                error_data = response.json()
                print(f"   Détails: {error_data}")
            except:
                pass
            
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    if success:
        print("\n🎉 Le test fonctionne!")
        print("Le problème pourrait être côté frontend.")
    else:
        print("\n⚠️ Le test échoue.")
        print("Vérifiez les logs Django pour plus de détails.")
