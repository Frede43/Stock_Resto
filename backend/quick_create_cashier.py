#!/usr/bin/env python3
"""
🚀 Création rapide d'un caissier pour les tests
"""

import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from accounts.models import User, Permission, UserPermission
from django.db import transaction

def create_test_cashier():
    """Crée un caissier de test simple"""
    print("💰 CRÉATION CAISSIER TEST")
    print("=" * 30)
    
    try:
        # Supprimer s'il existe
        User.objects.filter(username='test_caissier').delete()
        
        with transaction.atomic():
            # Créer le caissier
            cashier = User.objects.create_user(
                username='test_caissier',
                email='test@restaurant.com',
                first_name='Test',
                last_name='Caissier',
                role='cashier',
                is_active=True
            )
            cashier.set_password('test123')
            cashier.save()
            
            print(f"✅ Caissier créé:")
            print(f"   Username: test_caissier")
            print(f"   Password: test123")
            print(f"   Rôle: {cashier.role}")
            
            # Permissions de base
            permissions = ['sales_view', 'products_view', 'tables_view', 'orders_view']
            
            for perm_code in permissions:
                try:
                    permission = Permission.objects.get(code=perm_code, is_active=True)
                    UserPermission.objects.get_or_create(
                        user=cashier,
                        permission=permission,
                        defaults={'is_active': True}
                    )
                    print(f"✅ Permission: {perm_code}")
                except:
                    print(f"⚠️ Permission manquante: {perm_code}")
            
            return True
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    if create_test_cashier():
        print("\n🎊 CAISSIER TEST CRÉÉ!")
        print("Connexion: test_caissier / test123")
    else:
        print("\n💥 ERREUR CRÉATION")
