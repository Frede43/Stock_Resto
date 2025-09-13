#!/usr/bin/env python
"""
Script pour créer un superutilisateur automatiquement
"""

import os
import sys
import django

# Configuration de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from accounts.models import User

def create_superuser():
    """Crée un superutilisateur par défaut"""
    
    # Vérifier si un superutilisateur existe déjà
    if User.objects.filter(is_superuser=True).exists():
        print("✅ Un superutilisateur existe déjà.")
        superuser = User.objects.filter(is_superuser=True).first()
        print(f"   Username: {superuser.username}")
        print(f"   Email: {superuser.email}")
        return
    
    # Créer un superutilisateur
    try:
        superuser = User.objects.create_superuser(
            username='admin',
            email='admin@barstockwise.com',
            password='admin123',  # À changer en production !
            first_name='Administrateur',
            last_name='BarStockWise',
            role='admin'
        )
        
        print("✅ Superutilisateur créé avec succès !")
        print(f"   Username: admin")
        print(f"   Email: admin@barstockwise.com")
        print(f"   Password: admin123")
        print("   ⚠️ CHANGEZ LE MOT DE PASSE EN PRODUCTION!")
        
    except Exception as e:
        print(f"❌ Erreur lors de la création du superutilisateur: {e}")

if __name__ == '__main__':
    create_superuser()
