#!/usr/bin/env python3
"""
Script pour créer/corriger l'utilisateur caissier
"""

import os
import django
import sys

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from accounts.models import User

def fix_cashier_user():
    print("🔧 CORRECTION UTILISATEUR CAISSIER")
    print("=" * 40)
    
    try:
        # Vérifier si le caissier existe
        try:
            caissier = User.objects.get(username='caissier')
            print(f"✅ Utilisateur 'caissier' trouvé")
            print(f"   📧 Email: {caissier.email}")
            print(f"   🔓 Actif: {caissier.is_active}")
            
            # Vérifier le mot de passe
            if caissier.check_password('temp123456'):
                print("   ✅ Mot de passe 'temp123456' correct")
            else:
                print("   ❌ Mot de passe incorrect - Correction...")
                caissier.set_password('temp123456')
                caissier.save()
                print("   ✅ Mot de passe corrigé")
            
            # Vérifier que l'utilisateur est actif
            if not caissier.is_active:
                print("   ⚠️ Utilisateur inactif - Activation...")
                caissier.is_active = True
                caissier.save()
                print("   ✅ Utilisateur activé")
                
        except User.DoesNotExist:
            print("❌ Utilisateur 'caissier' non trouvé - Création...")
            caissier = User.objects.create_user(
                username='caissier',
                email='caissier@restaurant.com',
                password='temp123456',
                first_name='Caissier',
                last_name='Restaurant',
                role='cashier',
                is_active=True
            )
            print("✅ Utilisateur 'caissier' créé")

        # Vérifier le rôle
        print(f"✅ Rôle actuel: {caissier.role}")

        if caissier.role != 'cashier':
            print("   ⚠️ Rôle incorrect - Correction...")
            caissier.role = 'cashier'
            caissier.save()
            print("   ✅ Rôle corrigé en 'cashier'")
        
        # Test final de connexion
        print("\n🔐 TEST FINAL:")
        if caissier.check_password('temp123456'):
            print("✅ Authentification fonctionnelle")
            print(f"👤 Username: caissier")
            print(f"🔑 Password: temp123456")
            print(f"🎭 Role: {caissier.role}")
            return True
        else:
            print("❌ Problème d'authentification persistant")
            return False
            
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        return False

def create_admin_if_missing():
    """Créer un admin si manquant"""
    try:
        admin = User.objects.get(username='admin')
        print(f"✅ Admin existe: {admin.username}")
    except User.DoesNotExist:
        print("⚠️ Admin manquant - Création...")
        admin = User.objects.create_user(
            username='admin',
            email='admin@restaurant.com',
            password='admin123',
            first_name='Admin',
            last_name='Restaurant',
            role='admin',
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
        print("✅ Admin créé")

if __name__ == "__main__":
    print("🚀 CORRECTION UTILISATEUR CAISSIER")
    
    # Créer admin si nécessaire
    create_admin_if_missing()
    
    # Corriger le caissier
    success = fix_cashier_user()
    
    print("\n" + "=" * 40)
    if success:
        print("🎉 UTILISATEUR CAISSIER CORRIGÉ!")
        print("✅ Username: caissier")
        print("✅ Password: temp123456")
        print("✅ Role: cashier")
        print("✅ Actif: True")
        
        print("\n🎯 TESTEZ MAINTENANT:")
        print("   1. Redémarrez Django si nécessaire")
        print("   2. Testez la connexion frontend")
        print("   3. URL: http://localhost:5173/")
    else:
        print("❌ PROBLÈME PERSISTANT")
        print("🔧 Vérifiez les logs Django")
