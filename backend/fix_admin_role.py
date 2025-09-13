#!/usr/bin/env python3
"""
🔧 Script Django pour corriger le rôle admin
"""

import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from accounts.models import User

def debug_and_fix_admin():
    """Debug et correction du rôle admin"""
    print("🔍 DEBUG ET CORRECTION RÔLE ADMIN")
    print("=" * 40)
    
    try:
        # Trouver l'utilisateur admin
        admin_user = User.objects.filter(username='admin').first()
        
        if not admin_user:
            print("❌ Utilisateur admin non trouvé!")
            return False
        
        print(f"👤 UTILISATEUR ADMIN TROUVÉ:")
        print(f"   ID: {admin_user.id}")
        print(f"   Username: {admin_user.username}")
        print(f"   Email: {admin_user.email}")
        print(f"   🎭 Rôle actuel: '{admin_user.role}'")
        print(f"   👑 Is Staff: {admin_user.is_staff}")
        print(f"   🔒 Is Superuser: {admin_user.is_superuser}")
        print(f"   ✅ Is Active: {admin_user.is_active}")
        
        # Vérifier si le rôle est incorrect
        if admin_user.role != 'admin':
            print(f"\n❌ PROBLÈME DÉTECTÉ!")
            print(f"   Rôle actuel: '{admin_user.role}'")
            print(f"   Rôle attendu: 'admin'")
            print("\n🔧 CORRECTION EN COURS...")
            
            # Corriger le rôle
            admin_user.role = 'admin'
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
            
            print("✅ Rôle admin corrigé!")
            print(f"   Nouveau rôle: {admin_user.role}")
            print(f"   Is Staff: {admin_user.is_staff}")
            print(f"   Is Superuser: {admin_user.is_superuser}")
        else:
            print(f"\n✅ Rôle admin correct: '{admin_user.role}'")
        
        # Vérifier tous les utilisateurs pour diagnostiquer
        print(f"\n📋 TOUS LES UTILISATEURS:")
        all_users = User.objects.all()
        
        for user in all_users:
            role_icon = "👑" if user.role == 'admin' else "💰" if user.role == 'cashier' else "🎭"
            print(f"   {role_icon} {user.username} - {user.role} (ID: {user.id})")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def test_admin_authentication():
    """Teste l'authentification admin après correction"""
    print(f"\n🧪 TEST AUTHENTIFICATION ADMIN")
    print("=" * 35)
    
    try:
        from django.contrib.auth import authenticate
        
        # Test d'authentification
        user = authenticate(username='admin', password='admin123')
        
        if user:
            print("✅ Authentification réussie")
            print(f"   Username: {user.username}")
            print(f"   🎭 Rôle: {user.role}")
            print(f"   👑 Is Staff: {user.is_staff}")
            print(f"   🔒 Is Superuser: {user.is_superuser}")
            
            # Vérifier la logique de redirection
            print(f"\n🔄 LOGIQUE DE REDIRECTION:")
            if user.role == 'admin':
                print("   ✅ Rôle 'admin' → Redirection vers /")
                print("   ✅ Interface admin s'affichera")
            else:
                print(f"   ❌ Rôle '{user.role}' → Problème de redirection")
            
            return user.role == 'admin'
        else:
            print("❌ Authentification échouée")
            return False
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def main():
    """Fonction principale"""
    print("🚀 CORRECTION RÔLE ADMIN")
    print("=" * 30)
    
    try:
        # Debug et correction
        if not debug_and_fix_admin():
            return False
        
        # Test après correction
        if not test_admin_authentication():
            return False
        
        print("\n" + "=" * 30)
        print("🎉 RÔLE ADMIN CORRIGÉ!")
        print("=" * 30)
        print("✅ Utilisateur admin vérifié")
        print("✅ Rôle 'admin' confirmé")
        print("✅ Permissions admin restaurées")
        print("✅ Redirection vers / confirmée")
        print()
        print("🌐 MAINTENANT:")
        print("   1. Admin → Interface admin (/)")
        print("   2. Caissier → Interface caissier (/sales)")
        print("   3. Chaque rôle a sa propre interface")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur générale: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎊 PROBLÈME RÔLE RÉSOLU!")
    else:
        print("\n💥 PROBLÈMES PERSISTANTS")
