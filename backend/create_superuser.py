#!/usr/bin/env python
"""
Script pour créer automatiquement un superutilisateur en production
Usage: python create_superuser.py
"""
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_superuser():
    """Crée un superutilisateur si il n'existe pas déjà"""
    username = 'admin'
    email = 'admin@barstockwise.com'
    password = 'admin123'
    
    # Vérifier si l'utilisateur existe déjà
    if User.objects.filter(username=username).exists():
        print(f"✅ Le superutilisateur '{username}' existe déjà.")
        user = User.objects.get(username=username)
        print(f"   Email: {user.email}")
        print(f"   Rôle: {user.role}")
        print(f"   Actif: {user.is_active}")
        print(f"   Staff: {user.is_staff}")
        print(f"   Superuser: {user.is_superuser}")
    else:
        # Créer le superutilisateur
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name='Admin',
            last_name='System',
            role='admin'
        )
        print(f"✅ Superutilisateur créé avec succès!")
        print(f"   Username: {username}")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   Rôle: {user.role}")
        print(f"\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion!")

if __name__ == '__main__':
    create_superuser()
