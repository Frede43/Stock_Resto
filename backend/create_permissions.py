#!/usr/bin/env python
"""
Script pour créer les permissions de base du système
"""

import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from accounts.models import Permission

def create_base_permissions():
    """
    Crée les permissions de base du système
    """
    
    permissions_data = [
        # VENTES
        {
            'code': 'sales.view',
            'name': 'Voir les ventes',
            'description': 'Accès à la page des ventes et consultation des ventes',
            'category': 'sales'
        },
        {
            'code': 'sales.create',
            'name': 'Créer des ventes',
            'description': 'Pouvoir effectuer des ventes (POS)',
            'category': 'sales'
        },
        {
            'code': 'sales.edit',
            'name': 'Modifier les ventes',
            'description': 'Modifier les ventes existantes',
            'category': 'sales'
        },
        {
            'code': 'sales.delete',
            'name': 'Supprimer les ventes',
            'description': 'Supprimer des ventes',
            'category': 'sales'
        },
        {
            'code': 'sales.history',
            'name': 'Historique des ventes',
            'description': 'Accès à l\'historique complet des ventes',
            'category': 'sales'
        },
        
        # PRODUITS
        {
            'code': 'products.view',
            'name': 'Voir les produits',
            'description': 'Consultation du catalogue produits',
            'category': 'products'
        },
        {
            'code': 'products.create',
            'name': 'Créer des produits',
            'description': 'Ajouter de nouveaux produits',
            'category': 'products'
        },
        {
            'code': 'products.edit',
            'name': 'Modifier les produits',
            'description': 'Modifier les produits existants',
            'category': 'products'
        },
        {
            'code': 'products.delete',
            'name': 'Supprimer les produits',
            'description': 'Supprimer des produits',
            'category': 'products'
        },
        
        # STOCKS
        {
            'code': 'stocks.view',
            'name': 'Voir les stocks',
            'description': 'Consultation des niveaux de stock',
            'category': 'stocks'
        },
        {
            'code': 'stocks.manage',
            'name': 'Gérer les stocks',
            'description': 'Ajuster les stocks, mouvements',
            'category': 'stocks'
        },
        {
            'code': 'stocks.alerts',
            'name': 'Alertes de stock',
            'description': 'Voir et gérer les alertes de stock',
            'category': 'stocks'
        },
        
        # TABLES
        {
            'code': 'tables.view',
            'name': 'Voir les tables',
            'description': 'Consultation de l\'état des tables',
            'category': 'tables'
        },
        {
            'code': 'tables.manage',
            'name': 'Gérer les tables',
            'description': 'Changer le statut des tables, réservations',
            'category': 'tables'
        },
        
        # COMMANDES
        {
            'code': 'orders.view',
            'name': 'Voir les commandes',
            'description': 'Consultation des commandes',
            'category': 'orders'
        },
        {
            'code': 'orders.manage',
            'name': 'Gérer les commandes',
            'description': 'Créer, modifier, traiter les commandes',
            'category': 'orders'
        },
        
        # CUISINE
        {
            'code': 'kitchen.view',
            'name': 'Accès cuisine',
            'description': 'Accès au module cuisine',
            'category': 'kitchen'
        },
        {
            'code': 'kitchen.ingredients',
            'name': 'Gérer les ingrédients',
            'description': 'Gestion des ingrédients et stocks cuisine',
            'category': 'kitchen'
        },
        {
            'code': 'kitchen.recipes',
            'name': 'Gérer les recettes',
            'description': 'Création et modification des recettes',
            'category': 'kitchen'
        },
        
        # RAPPORTS
        {
            'code': 'reports.view',
            'name': 'Voir les rapports',
            'description': 'Consultation des rapports de base',
            'category': 'reports'
        },
        {
            'code': 'reports.advanced',
            'name': 'Rapports avancés',
            'description': 'Accès aux rapports détaillés et analyses',
            'category': 'reports'
        },
        {
            'code': 'reports.export',
            'name': 'Exporter les rapports',
            'description': 'Export PDF/Excel des rapports',
            'category': 'reports'
        },
        
        # ANALYSES
        {
            'code': 'analytics.view',
            'name': 'Voir les analyses',
            'description': 'Accès aux tableaux de bord analytiques',
            'category': 'analytics'
        },
        
        # UTILISATEURS
        {
            'code': 'users.view',
            'name': 'Voir les utilisateurs',
            'description': 'Consultation de la liste des utilisateurs',
            'category': 'users'
        },
        {
            'code': 'users.create',
            'name': 'Créer des utilisateurs',
            'description': 'Ajouter de nouveaux utilisateurs',
            'category': 'users'
        },
        {
            'code': 'users.edit',
            'name': 'Modifier les utilisateurs',
            'description': 'Modifier les comptes utilisateurs',
            'category': 'users'
        },
        {
            'code': 'users.delete',
            'name': 'Supprimer les utilisateurs',
            'description': 'Supprimer des comptes utilisateurs',
            'category': 'users'
        },
        {
            'code': 'users.permissions',
            'name': 'Gérer les permissions',
            'description': 'Attribuer et modifier les permissions',
            'category': 'users'
        },
        
        # FOURNISSEURS
        {
            'code': 'suppliers.view',
            'name': 'Voir les fournisseurs',
            'description': 'Consultation des fournisseurs',
            'category': 'suppliers'
        },
        {
            'code': 'suppliers.manage',
            'name': 'Gérer les fournisseurs',
            'description': 'Créer, modifier, supprimer des fournisseurs',
            'category': 'suppliers'
        },
        
        # DÉPENSES
        {
            'code': 'expenses.view',
            'name': 'Voir les dépenses',
            'description': 'Consultation des dépenses',
            'category': 'expenses'
        },
        {
            'code': 'expenses.manage',
            'name': 'Gérer les dépenses',
            'description': 'Enregistrer et modifier les dépenses',
            'category': 'expenses'
        },
        
        # PARAMÈTRES
        {
            'code': 'settings.view',
            'name': 'Voir les paramètres',
            'description': 'Accès aux paramètres système',
            'category': 'settings'
        },
        {
            'code': 'settings.manage',
            'name': 'Gérer les paramètres',
            'description': 'Modifier les paramètres système',
            'category': 'settings'
        },
    ]
    
    created_count = 0
    updated_count = 0
    
    for perm_data in permissions_data:
        permission, created = Permission.objects.get_or_create(
            code=perm_data['code'],
            defaults={
                'name': perm_data['name'],
                'description': perm_data['description'],
                'category': perm_data['category'],
                'is_active': True
            }
        )
        
        if created:
            created_count += 1
            print(f"✅ Créé: {permission.name} ({permission.code})")
        else:
            # Mettre à jour si nécessaire
            updated = False
            if permission.name != perm_data['name']:
                permission.name = perm_data['name']
                updated = True
            if permission.description != perm_data['description']:
                permission.description = perm_data['description']
                updated = True
            if permission.category != perm_data['category']:
                permission.category = perm_data['category']
                updated = True
                
            if updated:
                permission.save()
                updated_count += 1
                print(f"🔄 Mis à jour: {permission.name} ({permission.code})")
    
    print(f"\n📊 Résumé:")
    print(f"   - {created_count} permissions créées")
    print(f"   - {updated_count} permissions mises à jour")
    print(f"   - {Permission.objects.count()} permissions au total")

if __name__ == '__main__':
    print("🚀 Création des permissions de base...")
    create_base_permissions()
    print("✅ Terminé!")
