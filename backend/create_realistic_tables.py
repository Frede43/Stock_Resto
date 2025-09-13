#!/usr/bin/env python3
"""
Script pour créer des tables réalistes dans la base de données
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from sales.models import Table

User = get_user_model()

def create_realistic_tables():
    """Créer des tables réalistes pour le restaurant"""
    
    print("🪑 Création de tables réalistes...")
    
    # Supprimer toutes les tables existantes pour repartir à zéro
    Table.objects.all().delete()
    print("🗑️ Tables existantes supprimées")
    
    # Définir les tables avec des données réalistes
    tables_data = [
        # Zone Intérieur
        {
            'number': '1',
            'capacity': 4,
            'location': 'intérieur',
            'status': 'occupied',
            'server': 'Marie Uwimana',
            'customer': 'Famille Nkurunziza',
            'occupied_since': datetime.now() - timedelta(minutes=45)
        },
        {
            'number': '2',
            'capacity': 2,
            'location': 'intérieur', 
            'status': 'available',
            'server': None,
            'customer': None,
            'occupied_since': None
        },
        {
            'number': '3',
            'capacity': 6,
            'location': 'intérieur',
            'status': 'occupied',
            'server': 'Jean Nkurunziza',
            'customer': 'Groupe d\'amis',
            'occupied_since': datetime.now() - timedelta(minutes=20)
        },
        {
            'number': '4',
            'capacity': 4,
            'location': 'intérieur',
            'status': 'available',
            'server': None,
            'customer': None,
            'occupied_since': None
        },
        
        # Zone Terrasse
        {
            'number': '5',
            'capacity': 2,
            'location': 'terrasse',
            'status': 'occupied',
            'server': 'Alice Ndayisenga',
            'customer': 'Couple romantique',
            'occupied_since': datetime.now() - timedelta(minutes=30)
        },
        {
            'number': '6',
            'capacity': 4,
            'location': 'terrasse',
            'status': 'available',
            'server': None,
            'customer': None,
            'occupied_since': None
        },
        {
            'number': '7',
            'capacity': 8,
            'location': 'terrasse',
            'status': 'cleaning',
            'server': None,
            'customer': None,
            'occupied_since': None
        },
        
        # Zone VIP
        {
            'number': '8',
            'capacity': 6,
            'location': 'vip',
            'status': 'reserved',
            'server': 'Paul Hakizimana',
            'customer': 'Réservation 19h - M. Bizimana',
            'occupied_since': None
        },
        {
            'number': '9',
            'capacity': 4,
            'location': 'vip',
            'status': 'available',
            'server': None,
            'customer': None,
            'occupied_since': None
        },
        {
            'number': '10',
            'capacity': 8,
            'location': 'vip',
            'status': 'occupied',
            'server': 'Marie Uwimana',
            'customer': 'Réunion d\'affaires',
            'occupied_since': datetime.now() - timedelta(minutes=60)
        }
    ]
    
    # Créer les tables
    created_tables = []
    for table_data in tables_data:
        table = Table.objects.create(
            number=table_data['number'],
            capacity=table_data['capacity'],
            location=table_data['location'],
            status=table_data['status'],
            server=table_data['server'],
            customer=table_data['customer'],
            occupied_since=table_data['occupied_since'],
            is_active=True
        )
        created_tables.append(table)
        
        # Affichage avec couleurs selon le statut
        status_emoji = {
            'available': '🟢',
            'occupied': '🔴', 
            'reserved': '🟡',
            'cleaning': '🟠'
        }
        
        print(f"{status_emoji.get(table.status, '⚪')} Table {table.number} ({table.location}): {table.status}")
        if table.server:
            print(f"   👤 Serveur: {table.server}")
        if table.customer:
            print(f"   👥 Client: {table.customer}")
        if table.occupied_since:
            minutes_ago = int((datetime.now() - table.occupied_since.replace(tzinfo=None)).total_seconds() / 60)
            print(f"   ⏰ Occupée depuis: {minutes_ago} min")
    
    print(f"\n✅ {len(created_tables)} tables créées avec succès !")
    
    # Statistiques
    stats = {
        'total': len(created_tables),
        'available': len([t for t in created_tables if t.status == 'available']),
        'occupied': len([t for t in created_tables if t.status == 'occupied']),
        'reserved': len([t for t in created_tables if t.status == 'reserved']),
        'cleaning': len([t for t in created_tables if t.status == 'cleaning']),
    }
    
    print(f"\n📊 STATISTIQUES:")
    print(f"   • Total: {stats['total']} tables")
    print(f"   • Disponibles: {stats['available']} 🟢")
    print(f"   • Occupées: {stats['occupied']} 🔴")
    print(f"   • Réservées: {stats['reserved']} 🟡")
    print(f"   • En nettoyage: {stats['cleaning']} 🟠")
    
    # Répartition par zone
    zones = {}
    for table in created_tables:
        if table.location not in zones:
            zones[table.location] = 0
        zones[table.location] += 1
    
    print(f"\n🏢 RÉPARTITION PAR ZONE:")
    for zone, count in zones.items():
        print(f"   • {zone.title()}: {count} tables")
    
    print(f"\n🎯 PRÊT POUR L'INTERFACE TABLES !")
    print("Allez sur http://localhost:8081/tables pour voir le résultat")

if __name__ == '__main__':
    create_realistic_tables()
