#!/usr/bin/env python3
"""
🎯 Création d'un nouveau caissier pour tester la séparation des interfaces
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

def create_fresh_cashier():
    """Crée un nouveau caissier pour les tests"""
    print("👤 CRÉATION NOUVEAU CAISSIER")
    print("=" * 35)
    
    cashier_username = "alex_caissier"
    
    try:
        # Supprimer s'il existe
        existing = User.objects.filter(username=cashier_username).first()
        if existing:
            existing.delete()
            print(f"🗑️ Caissier existant supprimé: {cashier_username}")
        
        with transaction.atomic():
            # Créer le caissier
            cashier = User.objects.create_user(
                username=cashier_username,
                email='alex.caissier@restaurant.com',
                first_name='Alex',
                last_name='Caissier',
                phone='+25779111222',
                role='cashier',
                is_active=True
            )
            cashier.set_password('caisse123')
            cashier.save()
            
            print(f"✅ Caissier créé:")
            print(f"   ID: {cashier.id}")
            print(f"   Username: {cashier.username}")
            print(f"   🎭 Rôle: {cashier.role}")
            print(f"   📧 Email: {cashier.email}")
            print(f"   🔑 Password: caisse123")
            
            # Permissions caissier
            cashier_permissions = [
                'sales_manage', 'sales_history_view', 'sales_view', 'sales_create',
                'products_view',
                'tables_view', 'tables_manage',
                'orders_view', 'orders_create',
            ]
            
            # Assigner les permissions
            assigned_count = 0
            for perm_code in cashier_permissions:
                try:
                    permission = Permission.objects.get(code=perm_code, is_active=True)
                    UserPermission.objects.get_or_create(
                        user=cashier,
                        permission=permission,
                        defaults={'is_active': True}
                    )
                    assigned_count += 1
                    print(f"✅ Permission: {perm_code}")
                except Permission.DoesNotExist:
                    print(f"❌ Permission manquante: {perm_code}")
                except Exception as e:
                    print(f"⚠️ Erreur {perm_code}: {e}")
            
            print(f"\n📊 {assigned_count}/{len(cashier_permissions)} permissions assignées")
            
            return cashier
            
    except Exception as e:
        print(f"❌ Erreur création: {e}")
        return None

def verify_admin_role():
    """Vérifie et corrige le rôle admin si nécessaire"""
    print("\n👑 VÉRIFICATION RÔLE ADMIN")
    print("=" * 30)
    
    try:
        admin = User.objects.filter(username='admin').first()
        
        if not admin:
            print("❌ Admin non trouvé!")
            return False
        
        print(f"✅ Admin trouvé:")
        print(f"   Username: {admin.username}")
        print(f"   🎭 Rôle: {admin.role}")
        print(f"   👑 Is Staff: {admin.is_staff}")
        print(f"   🔒 Is Superuser: {admin.is_superuser}")
        
        # Corriger si nécessaire
        if admin.role != 'admin':
            print(f"🔧 Correction rôle: {admin.role} → admin")
            admin.role = 'admin'
            admin.is_staff = True
            admin.is_superuser = True
            admin.save()
            print("✅ Rôle admin corrigé")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def test_authentication():
    """Teste l'authentification des deux rôles"""
    print("\n🔐 TEST AUTHENTIFICATION")
    print("=" * 25)
    
    from django.contrib.auth import authenticate
    
    # Test admin
    admin_user = authenticate(username='admin', password='admin123')
    if admin_user:
        print(f"✅ Admin auth: {admin_user.username} - {admin_user.role}")
    else:
        print("❌ Admin auth échouée")
        return False
    
    # Test caissier
    cashier_user = authenticate(username='alex_caissier', password='caisse123')
    if cashier_user:
        print(f"✅ Caissier auth: {cashier_user.username} - {cashier_user.role}")
    else:
        print("❌ Caissier auth échouée")
        return False
    
    return True

def main():
    """Fonction principale"""
    print("🚀 PRÉPARATION TEST SÉPARATION INTERFACES")
    print("=" * 50)
    
    try:
        # Vérifier et corriger l'admin
        if not verify_admin_role():
            return False
        
        # Créer un nouveau caissier
        cashier = create_fresh_cashier()
        if not cashier:
            return False
        
        # Tester l'authentification
        if not test_authentication():
            return False
        
        print("\n" + "=" * 50)
        print("🎉 PRÉPARATION TERMINÉE!")
        print("=" * 50)
        print("✅ Admin: Rôle vérifié et corrigé")
        print("✅ Caissier: Créé avec permissions")
        print("✅ Authentification: Validée")
        print()
        print("🎯 COMPTES DE TEST:")
        print("   👑 Admin: admin / admin123")
        print("   💰 Caissier: alex_caissier / caisse123")
        print()
        print("🌐 ÉTAPES SUIVANTES:")
        print("   1. Nettoyer cache navigateur")
        print("   2. Tester admin → Interface admin")
        print("   3. Tester caissier → Interface caissier")
        print("   4. Vérifier séparation des menus")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎊 COMPTES PRÊTS POUR TEST!")
    else:
        print("\n💥 ERREURS DANS LA PRÉPARATION")
