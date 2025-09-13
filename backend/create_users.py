#!/usr/bin/env python3
"""
Script pour créer des utilisateurs via Django shell
"""

import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Créer des serveurs
servers = [
    ('serveur1', 'Jean', 'Mukamana', 'serveur1@barstock.com'),
    ('serveur2', 'Marie', 'Nzeyimana', 'serveur2@barstock.com'),
    ('serveur3', 'Pierre', 'Hakizimana', 'serveur3@barstock.com'),
    ('serveur4', 'Agnès', 'Uwimana', 'serveur4@barstock.com'),
]

print("Création des serveurs...")
for username, first_name, last_name, email in servers:
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'role': 'server',
            'is_active': True,
            'is_staff': False
        }
    )
    
    if created:
        user.set_password('serveur123')
        user.save()
        print(f"✅ Serveur créé: {first_name} {last_name}")
    else:
        print(f"ℹ️ Serveur existe: {first_name} {last_name}")

# Créer un caissier
caissier, created = User.objects.get_or_create(
    username='caissier1',
    defaults={
        'email': 'caissier1@barstock.com',
        'first_name': 'Claude',
        'last_name': 'Ndayishimiye',
        'role': 'cashier',
        'is_active': True,
        'is_staff': False
    }
)

if created:
    caissier.set_password('caissier123')
    caissier.save()
    print(f"✅ Caissier créé: Claude Ndayishimiye")
else:
    print(f"ℹ️ Caissier existe: Claude Ndayishimiye")

# Vérifier
servers_count = User.objects.filter(role='server', is_active=True).count()
print(f"\n📊 Total serveurs actifs: {servers_count}")

print("\n🎯 COMPTES CRÉÉS:")
print("Caissier: caissier1 / caissier123")
print("Serveurs: serveur1-4 / serveur123")
