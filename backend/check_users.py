#!/usr/bin/env python
"""
Script pour vérifier les utilisateurs dans la base de données
"""

import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from accounts.models import User

def check_users():
    """
    Vérifie tous les utilisateurs dans la base de données
    """
    
    print("👥 Utilisateurs dans la base de données:")
    print("=" * 50)
    
    users = User.objects.all()
    
    for user in users:
        print(f"ID: {user.id}")
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"Nom: {user.first_name} {user.last_name}")
        print(f"Rôle: {user.role}")
        print(f"Is Admin: {user.is_admin}")
        print(f"Is Staff: {user.is_staff}")
        print(f"Is Superuser: {user.is_superuser}")
        print(f"Is Active: {user.is_active}")
        print(f"Date création: {user.date_joined}")
        print("-" * 30)
    
    print(f"\nTotal: {users.count()} utilisateurs")
    
    # Corriger l'utilisateur admin si nécessaire
    admin_user = User.objects.filter(username='admin').first()
    if admin_user and admin_user.role != 'admin':
        print(f"\n⚠️  L'utilisateur admin a le rôle '{admin_user.role}' au lieu de 'admin'")
        print("🔧 Correction en cours...")
        admin_user.role = 'admin'
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        print("✅ Utilisateur admin corrigé!")

if __name__ == '__main__':
    check_users()
