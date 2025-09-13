#!/usr/bin/env python
"""
Script pour créer un utilisateur admin de test
"""

import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from accounts.models import User, Permission, UserPermission

def create_test_admin():
    """
    Crée un utilisateur admin de test
    """
    
    # Créer l'admin
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@barstockwise.com',
            'first_name': 'Admin',
            'last_name': 'System',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True,
            'is_active': True,
        }
    )
    
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"✅ Utilisateur admin créé: {admin_user.username}")
    else:
        print(f"ℹ️  Utilisateur admin existe déjà: {admin_user.username}")
    
    # Créer un manager de test
    manager_user, created = User.objects.get_or_create(
        username='manager',
        defaults={
            'email': 'manager@barstockwise.com',
            'first_name': 'Manager',
            'last_name': 'Test',
            'role': 'manager',
            'is_staff': False,
            'is_superuser': False,
            'is_active': True,
        }
    )
    
    if created:
        manager_user.set_password('manager123')
        manager_user.save()
        print(f"✅ Utilisateur manager créé: {manager_user.username}")
        
        # Attribuer des permissions au manager
        manager_permissions = [
            'sales.view', 'sales.create', 'sales.edit',
            'products.view', 'products.create', 'products.edit',
            'stocks.view', 'stocks.manage',
            'tables.view', 'tables.manage',
            'orders.view', 'orders.manage',
            'reports.view', 'reports.advanced',
        ]
        
        permissions = Permission.objects.filter(code__in=manager_permissions)
        for permission in permissions:
            UserPermission.objects.get_or_create(
                user=manager_user,
                permission=permission,
                defaults={'granted_by': admin_user}
            )
        
        print(f"✅ {permissions.count()} permissions attribuées au manager")
    else:
        print(f"ℹ️  Utilisateur manager existe déjà: {manager_user.username}")
    
    # Créer un serveur de test
    server_user, created = User.objects.get_or_create(
        username='serveur',
        defaults={
            'email': 'serveur@barstockwise.com',
            'first_name': 'Serveur',
            'last_name': 'Test',
            'role': 'server',
            'is_staff': False,
            'is_superuser': False,
            'is_active': True,
        }
    )
    
    if created:
        server_user.set_password('serveur123')
        server_user.save()
        print(f"✅ Utilisateur serveur créé: {server_user.username}")
        
        # Attribuer des permissions au serveur
        server_permissions = [
            'sales.view', 'sales.create',
            'products.view',
            'tables.view', 'tables.manage',
            'orders.view', 'orders.manage',
        ]
        
        permissions = Permission.objects.filter(code__in=server_permissions)
        for permission in permissions:
            UserPermission.objects.get_or_create(
                user=server_user,
                permission=permission,
                defaults={'granted_by': admin_user}
            )
        
        print(f"✅ {permissions.count()} permissions attribuées au serveur")
    else:
        print(f"ℹ️  Utilisateur serveur existe déjà: {server_user.username}")
    
    # Créer un caissier de test
    cashier_user, created = User.objects.get_or_create(
        username='caissier',
        defaults={
            'email': 'caissier@barstockwise.com',
            'first_name': 'Caissier',
            'last_name': 'Test',
            'role': 'cashier',
            'is_staff': False,
            'is_superuser': False,
            'is_active': True,
        }
    )
    
    if created:
        cashier_user.set_password('caissier123')
        cashier_user.save()
        print(f"✅ Utilisateur caissier créé: {cashier_user.username}")
        
        # Attribuer des permissions au caissier
        cashier_permissions = [
            'sales.view', 'sales.create',
            'products.view',
            'tables.view',
        ]
        
        permissions = Permission.objects.filter(code__in=cashier_permissions)
        for permission in permissions:
            UserPermission.objects.get_or_create(
                user=cashier_user,
                permission=permission,
                defaults={'granted_by': admin_user}
            )
        
        print(f"✅ {permissions.count()} permissions attribuées au caissier")
    else:
        print(f"ℹ️  Utilisateur caissier existe déjà: {cashier_user.username}")
    
    print(f"\n📊 Résumé des comptes de test:")
    print(f"   - Admin: admin / admin123 (toutes permissions)")
    print(f"   - Manager: manager / manager123 (permissions étendues)")
    print(f"   - Serveur: serveur / serveur123 (permissions limitées)")
    print(f"   - Caissier: caissier / caissier123 (permissions minimales)")

if __name__ == '__main__':
    print("🚀 Création des utilisateurs de test...")
    create_test_admin()
    print("✅ Terminé!")
