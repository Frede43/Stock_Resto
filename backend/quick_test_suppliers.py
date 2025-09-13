#!/usr/bin/env python
"""
Test rapide de l'API suppliers après correction
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from suppliers.models import Supplier
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def main():
    print("🧪 Test rapide API Suppliers")
    print("=" * 30)
    
    try:
        # Créer un fournisseur de test
        supplier, created = Supplier.objects.get_or_create(
            name='Test Supplier',
            defaults={
                'contact_person': 'Test Contact',
                'phone': '+25712345678',
                'email': 'test@supplier.bi',
                'city': 'Bujumbura',
                'is_active': True
            }
        )
        
        status = "✅ Créé" if created else "ℹ️ Existe"
        print(f"Fournisseur: {status} - {supplier.name}")
        
        # Créer un utilisateur admin
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@test.com',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
        
        # Tester l'API
        client = APIClient()
        refresh = RefreshToken.for_user(admin_user)
        token = str(refresh.access_token)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = client.get('/api/suppliers/')
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and 'results' in data:
                count = len(data['results'])
            elif isinstance(data, list):
                count = len(data)
            else:
                count = 0
            
            print(f"✅ Succès! {count} fournisseur(s) récupéré(s)")
            return True
        else:
            print(f"❌ Erreur: {response.content.decode()}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    if success:
        print("\n🎉 L'API suppliers fonctionne!")
        print("Redémarrez le serveur Django et testez le frontend.")
    else:
        print("\n⚠️ Des problèmes persistent.")
