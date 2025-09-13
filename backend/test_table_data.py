#!/usr/bin/env python
"""
Script pour créer des données de test pour les tables avec customer et server
"""
import os
import sys
import django

# Configuration Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apps.settings.development')
django.setup()

from sales.models import Table
from django.utils import timezone

def create_test_table_data():
    """Créer des données de test pour les tables"""
    
    # Vérifier les tables existantes
    tables = Table.objects.all()
    print(f"📋 {tables.count()} tables trouvées")
    
    if not tables.exists():
        print("❌ Aucune table trouvée. Créez d'abord des tables.")
        return
    
    # Mettre à jour quelques tables avec des données de test
    test_data = [
        {
            'status': 'occupied',
            'customer': 'Jean Dupont',
            'server': 'Marie Serveur',
        },
        {
            'status': 'occupied', 
            'customer': 'Alice Martin',
            'server': 'Pierre Garçon',
        },
        {
            'status': 'reserved',
            'customer': 'Bob Wilson',
            'server': None,
        }
    ]
    
    updated_count = 0
    for i, data in enumerate(test_data):
        if i < tables.count():
            table = tables[i]
            table.status = data['status']
            table.customer = data['customer']
            table.server = data['server']
            
            if data['status'] == 'occupied':
                table.occupied_since = timezone.now()
            
            table.save()
            updated_count += 1
            
            print(f"✅ Table {table.number}: {data['status']} - {data['customer']} - {data['server'] or 'Pas de serveur'}")
    
    print(f"\n🎉 {updated_count} tables mises à jour avec des données de test")
    
    # Afficher l'état final
    print("\n📊 État final des tables:")
    for table in Table.objects.all():
        print(f"   Table {table.number}: {table.status} | {table.customer or 'Pas de client'} | {table.server or 'Pas de serveur'}")

if __name__ == "__main__":
    create_test_table_data()
