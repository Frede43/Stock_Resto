#!/usr/bin/env python
"""
Test direct de l'API StockMovement
"""

import os
import sys
import django
import json

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Product
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_api_stockmovement():
    print("🧪 Test Direct API StockMovement")
    print("=" * 40)
    
    try:
        # Récupérer l'utilisateur admin
        admin_user = User.objects.get(id=5)  # On sait qu'il existe
        print(f"👤 Utilisateur: {admin_user.username} (ID: {admin_user.id})")
        
        # Récupérer un produit
        product = Product.objects.first()
        print(f"📦 Produit: {product.name} (ID: {product.id})")
        print(f"   Stock avant: {product.current_stock}")
        
        # Créer le client API
        client = APIClient()
        
        # Authentification JWT
        refresh = RefreshToken.for_user(admin_user)
        token = str(refresh.access_token)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        print(f"🔑 Token généré: {token[:30]}...")
        
        # Données exactement comme le frontend
        data = {
            'product': product.id,
            'movement_type': 'in',
            'reason': 'purchase',
            'quantity': 5,
            'unit_price': 1200.0,
            'reference': 'TEST-API-001',
            'notes': 'Test direct API'
        }
        
        print(f"📤 Données envoyées:")
        print(json.dumps(data, indent=2))
        
        # Requête POST
        print("\n📡 Envoi de la requête POST...")
        response = client.post('/api/inventory/movements/', data, format='json')
        
        print(f"📥 Status Code: {response.status_code}")
        print(f"📥 Headers: {dict(response.items())}")
        
        if response.status_code == 201:
            print("✅ SUCCÈS! Mouvement créé")
            response_data = response.json()
            print(f"📋 Réponse:")
            print(json.dumps(response_data, indent=2))
            
            # Vérifier le stock mis à jour
            product.refresh_from_db()
            print(f"📊 Stock après: {product.current_stock}")
            
            return True
        else:
            print("❌ ÉCHEC!")
            print(f"📄 Contenu brut: {response.content.decode()}")
            
            try:
                error_data = response.json()
                print(f"📋 Erreur JSON:")
                print(json.dumps(error_data, indent=2))
            except:
                print("⚠️ Impossible de parser la réponse en JSON")
            
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_api_stockmovement()
    
    print("\n" + "=" * 40)
    if success:
        print("🎉 L'API fonctionne parfaitement!")
        print("Le problème est probablement côté frontend.")
    else:
        print("⚠️ L'API a des problèmes.")
        print("Il faut corriger le backend.")
