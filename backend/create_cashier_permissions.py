#!/usr/bin/env python3
"""
🛡️ Script pour créer les permissions nécessaires pour le système caissier
"""

import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from accounts.models import Permission

def create_permissions():
    """Crée toutes les permissions nécessaires"""
    print("🛡️ CRÉATION DES PERMISSIONS SYSTÈME")
    print("=" * 40)
    
    permissions_to_create = [
        # Permissions Ventes
        {'code': 'sales_manage', 'name': 'Gestion complète des ventes', 'category': 'sales'},
        {'code': 'sales_history_view', 'name': 'Consultation historique des ventes', 'category': 'sales'},
        {'code': 'sales_view', 'name': 'Visualisation des ventes', 'category': 'sales'},
        {'code': 'sales_create', 'name': 'Création de nouvelles ventes', 'category': 'sales'},
        
        # Permissions Produits
        {'code': 'products_view', 'name': 'Consultation des produits', 'category': 'products'},
        {'code': 'products_manage', 'name': 'Gestion des produits', 'category': 'products'},
        
        # Permissions Tables
        {'code': 'tables_view', 'name': 'Visualisation des tables', 'category': 'tables'},
        {'code': 'tables_manage', 'name': 'Gestion des tables et réservations', 'category': 'tables'},
        
        # Permissions Commandes
        {'code': 'orders_view', 'name': 'Consultation des commandes', 'category': 'orders'},
        {'code': 'orders_create', 'name': 'Création de commandes', 'category': 'orders'},
        {'code': 'orders_manage', 'name': 'Gestion des commandes', 'category': 'orders'},
        
        # Permissions Stocks
        {'code': 'stocks_view', 'name': 'Consultation des stocks', 'category': 'stocks'},
        {'code': 'inventory_manage', 'name': 'Gestion des inventaires', 'category': 'stocks'},
        
        # Permissions Rapports
        {'code': 'reports_view', 'name': 'Consultation des rapports', 'category': 'reports'},
        {'code': 'analytics_view', 'name': 'Consultation des analyses', 'category': 'analytics'},
        
        # Permissions Utilisateurs
        {'code': 'users_view', 'name': 'Consultation des utilisateurs', 'category': 'users'},
        {'code': 'users_manage', 'name': 'Gestion des utilisateurs', 'category': 'users'},
        
        # Permissions Fournisseurs
        {'code': 'suppliers_view', 'name': 'Consultation des fournisseurs', 'category': 'suppliers'},
        {'code': 'suppliers_manage', 'name': 'Gestion des fournisseurs', 'category': 'suppliers'},
        
        # Permissions Dépenses
        {'code': 'expenses_view', 'name': 'Consultation des dépenses', 'category': 'expenses'},
        {'code': 'expenses_manage', 'name': 'Gestion des dépenses', 'category': 'expenses'},
        
        # Permissions Paramètres
        {'code': 'settings_view', 'name': 'Consultation des paramètres', 'category': 'settings'},
        {'code': 'settings_manage', 'name': 'Gestion des paramètres', 'category': 'settings'},
    ]
    
    created_count = 0
    existing_count = 0
    
    for perm_data in permissions_to_create:
        permission, created = Permission.objects.get_or_create(
            code=perm_data['code'],
            defaults={
                'name': perm_data['name'],
                'category': perm_data['category'],
                'is_active': True
            }
        )
        
        if created:
            created_count += 1
            print(f"✅ Permission créée: {perm_data['code']} - {perm_data['name']}")
        else:
            existing_count += 1
            print(f"ℹ️ Permission existe: {perm_data['code']}")
    
    print(f"\n📊 RÉSUMÉ:")
    print(f"   ✅ {created_count} nouvelles permissions créées")
    print(f"   ℹ️ {existing_count} permissions existantes")
    print(f"   📋 {len(permissions_to_create)} permissions totales")
    
    return True

def verify_permissions():
    """Vérifie que toutes les permissions existent"""
    print("\n🔍 VÉRIFICATION DES PERMISSIONS")
    print("=" * 35)
    
    required_for_cashier = [
        'sales_manage', 'sales_history_view', 'sales_view', 'sales_create',
        'products_view',
        'tables_view', 'tables_manage',
        'orders_view', 'orders_create',
    ]
    
    missing_permissions = []
    
    for perm_code in required_for_cashier:
        try:
            permission = Permission.objects.get(code=perm_code, is_active=True)
            print(f"✅ {perm_code} - {permission.name}")
        except Permission.DoesNotExist:
            missing_permissions.append(perm_code)
            print(f"❌ {perm_code} - MANQUANTE")
    
    if missing_permissions:
        print(f"\n⚠️ {len(missing_permissions)} permissions manquantes pour les caissiers")
        return False
    else:
        print(f"\n✅ Toutes les permissions caissier sont disponibles")
        return True

def main():
    """Fonction principale"""
    print("🚀 INITIALISATION DU SYSTÈME DE PERMISSIONS")
    print("=" * 50)
    
    try:
        # Créer les permissions
        if create_permissions():
            print("\n✅ Permissions créées avec succès")
        else:
            print("\n❌ Erreur lors de la création des permissions")
            return False
        
        # Vérifier les permissions
        if verify_permissions():
            print("\n✅ Système de permissions opérationnel")
            return True
        else:
            print("\n❌ Système de permissions incomplet")
            return False
            
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 SYSTÈME DE PERMISSIONS PRÊT!")
        print("💡 Vous pouvez maintenant créer des caissiers avec permissions automatiques")
    else:
        print("\n💥 ÉCHEC - Vérifiez les erreurs ci-dessus")
