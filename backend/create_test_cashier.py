#!/usr/bin/env python3
"""
🎯 Script Django pour créer un caissier de test avec toutes les permissions
Utilise directement les modèles Django pour éviter les problèmes d'API
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

def delete_existing_cashier():
    """Supprime le caissier de test s'il existe"""
    try:
        existing_user = User.objects.filter(username='marie_caissiere').first()
        if existing_user:
            existing_user.delete()
            print("🗑️ Caissier existant supprimé")
            return True
        return False
    except Exception as e:
        print(f"⚠️ Erreur suppression: {e}")
        return False

def create_cashier_with_permissions():
    """Crée un caissier avec toutes les permissions nécessaires"""
    print("👤 CRÉATION DU CAISSIER DE TEST")
    print("=" * 35)
    
    # Supprimer l'existant
    delete_existing_cashier()
    
    try:
        with transaction.atomic():
            # Créer l'utilisateur caissier
            cashier = User.objects.create_user(
                username='marie_caissiere',
                email='marie.dubois@restaurant.com',
                first_name='Marie',
                last_name='Dubois',
                phone='+25779123456',
                role='cashier',
                is_active=True
            )
            cashier.set_password('temp123456')
            cashier.save()
            
            print(f"✅ Caissier créé:")
            print(f"   ID: {cashier.id}")
            print(f"   Username: {cashier.username}")
            print(f"   Rôle: {cashier.role}")
            print(f"   Email: {cashier.email}")
            print(f"   Actif: {cashier.is_active}")
            
            # Permissions requises pour un caissier
            required_permissions = [
                'sales_manage', 'sales_history_view', 'sales_view', 'sales_create',
                'products_view',
                'tables_view', 'tables_manage',
                'orders_view', 'orders_create',
            ]
            
            # Assigner les permissions
            assigned_count = 0
            for perm_code in required_permissions:
                try:
                    permission = Permission.objects.get(code=perm_code, is_active=True)
                    user_permission, created = UserPermission.objects.get_or_create(
                        user=cashier,
                        permission=permission,
                        defaults={'is_active': True}
                    )
                    if created:
                        assigned_count += 1
                        print(f"✅ Permission assignée: {perm_code}")
                    else:
                        print(f"ℹ️ Permission déjà assignée: {perm_code}")
                except Permission.DoesNotExist:
                    print(f"❌ Permission non trouvée: {perm_code}")
                except Exception as e:
                    print(f"⚠️ Erreur assignation {perm_code}: {e}")
            
            print(f"\n📊 RÉSUMÉ PERMISSIONS:")
            print(f"   ✅ {assigned_count} nouvelles permissions assignées")
            print(f"   📋 {len(required_permissions)} permissions requises")
            
            return cashier
            
    except Exception as e:
        print(f"❌ Erreur création caissier: {e}")
        return None

def verify_cashier_permissions(cashier):
    """Vérifie les permissions du caissier"""
    print(f"\n🔍 VÉRIFICATION DES PERMISSIONS")
    print("=" * 35)
    
    try:
        # Récupérer les permissions du caissier
        user_permissions = cashier.get_permissions()
        
        print(f"👤 Utilisateur: {cashier.username}")
        print(f"🎭 Rôle: {cashier.role}")
        print(f"📋 Permissions totales: {user_permissions.count()}")
        
        if user_permissions.exists():
            print("\n✅ PERMISSIONS ASSIGNÉES:")
            for perm in user_permissions:
                print(f"   • {perm.code} - {perm.name}")
        else:
            print("\n❌ AUCUNE PERMISSION ASSIGNÉE")
            return False
        
        # Tester les méthodes de vérification
        print(f"\n🧪 TESTS DE MÉTHODES:")
        print(f"   can_make_sales(): {cashier.can_make_sales()}")
        print(f"   can_view_sales_history(): {cashier.can_view_sales_history()}")
        print(f"   is_cashier: {cashier.is_cashier}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur vérification: {e}")
        return False

def test_login_credentials():
    """Teste les identifiants de connexion"""
    print(f"\n🔐 TEST DES IDENTIFIANTS")
    print("=" * 30)
    
    try:
        # Vérifier que l'utilisateur existe et peut s'authentifier
        from django.contrib.auth import authenticate
        
        user = authenticate(username='marie_caissiere', password='temp123456')
        
        if user:
            print("✅ Authentification réussie")
            print(f"   Username: {user.username}")
            print(f"   Rôle: {user.role}")
            print(f"   Actif: {user.is_active}")
            return True
        else:
            print("❌ Authentification échouée")
            return False
            
    except Exception as e:
        print(f"❌ Erreur test authentification: {e}")
        return False

def main():
    """Fonction principale"""
    print("🚀 CRÉATION ET TEST COMPLET DU CAISSIER")
    print("=" * 50)
    
    try:
        # Étape 1: Créer le caissier avec permissions
        cashier = create_cashier_with_permissions()
        if not cashier:
            print("\n❌ ÉCHEC: Impossible de créer le caissier")
            return False
        
        # Étape 2: Vérifier les permissions
        if not verify_cashier_permissions(cashier):
            print("\n❌ ÉCHEC: Problème avec les permissions")
            return False
        
        # Étape 3: Tester l'authentification
        if not test_login_credentials():
            print("\n❌ ÉCHEC: Problème d'authentification")
            return False
        
        # Succès complet
        print("\n" + "=" * 50)
        print("🎉 SUCCÈS COMPLET!")
        print("=" * 50)
        print("✅ Caissier créé avec succès")
        print("✅ Permissions assignées")
        print("✅ Authentification validée")
        print()
        print("🎯 INFORMATIONS DE CONNEXION:")
        print("   Username: marie_caissiere")
        print("   Password: temp123456")
        print("   Rôle: cashier")
        print()
        print("🌐 ÉTAPES SUIVANTES:")
        print("1. Démarrez le frontend: npm run dev")
        print("2. Ouvrez http://localhost:5173/login")
        print("3. Connectez-vous avec marie_caissiere / temp123456")
        print("4. Vérifiez la redirection vers /sales")
        print("5. Testez l'accès aux fonctionnalités caissier")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Erreur générale: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎊 SYSTÈME CAISSIER ENTIÈREMENT FONCTIONNEL!")
    else:
        print("\n💥 ÉCHEC - Vérifiez les logs ci-dessus")
