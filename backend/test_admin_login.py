#!/usr/bin/env python
"""
Script de test pour vérifier les problèmes de connexion admin
"""

import os
import sys
import django

# Configuration de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.hashers import check_password

User = get_user_model()

def test_admin_login():
    """Test de connexion admin"""
    
    print("🔍 Test de connexion administrateur...")
    
    try:
        # Vérifier si l'utilisateur admin existe
        print("\n1. Vérification de l'existence de l'utilisateur admin...")
        
        try:
            admin_user = User.objects.get(username='admin')
            print(f"✅ Utilisateur admin trouvé: {admin_user}")
            print(f"   - ID: {admin_user.id}")
            print(f"   - Email: {admin_user.email}")
            print(f"   - Is active: {admin_user.is_active}")
            print(f"   - Is staff: {admin_user.is_staff}")
            print(f"   - Is superuser: {admin_user.is_superuser}")
            print(f"   - Role: {admin_user.role}")
            print(f"   - Date joined: {admin_user.date_joined}")
            print(f"   - Last login: {admin_user.last_login}")
            
        except User.DoesNotExist:
            print("❌ Utilisateur admin non trouvé!")
            print("   Création d'un nouvel utilisateur admin...")
            
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@barstock.bi',
                password='admin123',
                role='admin'
            )
            print(f"✅ Nouvel utilisateur admin créé: {admin_user}")
        
        # Test d'authentification
        print("\n2. Test d'authentification...")
        
        # Test avec le mot de passe par défaut
        test_passwords = ['admin123', 'admin', 'password', '123456']
        
        authenticated = False
        for password in test_passwords:
            print(f"   Tentative avec mot de passe: {password}")
            user = authenticate(username='admin', password=password)
            if user:
                print(f"✅ Authentification réussie avec le mot de passe: {password}")
                authenticated = True
                break
            else:
                print(f"❌ Échec d'authentification avec: {password}")
        
        if not authenticated:
            print("\n⚠️  Aucun mot de passe ne fonctionne. Réinitialisation...")
            admin_user.set_password('admin123')
            admin_user.save()
            print("✅ Mot de passe réinitialisé à 'admin123'")
            
            # Test après réinitialisation
            user = authenticate(username='admin', password='admin123')
            if user:
                print("✅ Authentification réussie après réinitialisation")
            else:
                print("❌ Échec d'authentification même après réinitialisation")
        
        # Vérifier les permissions admin
        print("\n3. Vérification des permissions...")
        if admin_user.is_superuser:
            print("✅ L'utilisateur a les permissions de superutilisateur")
        else:
            print("⚠️  L'utilisateur n'a pas les permissions de superutilisateur")
            admin_user.is_superuser = True
            admin_user.is_staff = True
            admin_user.save()
            print("✅ Permissions de superutilisateur accordées")
        
        # Vérifier l'état actif
        print("\n4. Vérification de l'état actif...")
        if admin_user.is_active:
            print("✅ L'utilisateur est actif")
        else:
            print("⚠️  L'utilisateur n'est pas actif")
            admin_user.is_active = True
            admin_user.save()
            print("✅ Utilisateur activé")
        
        print("\n🎉 Test terminé avec succès!")
        print(f"📋 Informations de connexion:")
        print(f"   - URL: http://127.0.0.1:8000/admin/")
        print(f"   - Nom d'utilisateur: admin")
        print(f"   - Mot de passe: admin123")
        
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_admin_login()
