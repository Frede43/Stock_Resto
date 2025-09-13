#!/usr/bin/env python
"""
Script pour vérifier les données dans la base de données
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from sales.models import Sale
from accounts.models import User

def main():
    print('=== VÉRIFICATION DES DONNÉES ===')
    print(f'Nombre de ventes: {Sale.objects.count()}')
    print(f'Nombre d\'utilisateurs: {User.objects.count()}')
    print(f'Nombre de serveurs: {User.objects.filter(role="server").count()}')

    print('\n=== DERNIÈRES VENTES ===')
    sales = Sale.objects.all()[:5]
    if sales:
        for sale in sales:
            print(f'- Vente {sale.id}: {sale.total_amount} FBu ({sale.status})')
    else:
        print('Aucune vente trouvée')

    print('\n=== SERVEURS ACTIFS ===')
    servers = User.objects.filter(role='server', is_active=True)
    if servers:
        for user in servers:
            name = f'{user.first_name} {user.last_name}'.strip()
            if not name:
                name = user.username
            print(f'- {name} ({user.username})')
    else:
        print('Aucun serveur trouvé')

    print('\n=== TOUS LES UTILISATEURS ===')
    users = User.objects.all()
    if users:
        for user in users:
            name = f'{user.first_name} {user.last_name}'.strip()
            if not name:
                name = user.username
            print(f'- {name} ({user.username}) - {user.role}')
    else:
        print('Aucun utilisateur trouvé')

if __name__ == '__main__':
    main()
