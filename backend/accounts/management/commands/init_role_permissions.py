"""
Commande pour initialiser les permissions par défaut pour chaque rôle
"""
from django.core.management.base import BaseCommand
from accounts.models import User, Permission, UserPermission


class Command(BaseCommand):
    help = 'Initialise les permissions par défaut pour chaque rôle utilisateur'

    def handle(self, *args, **options):
        self.stdout.write('🚀 Initialisation des permissions par rôle...\n')

        # Définition des permissions par rôle (selon use-permissions.ts)
        ROLE_PERMISSIONS = {
            'cashier': [
                # Ventes
                'sales_manage', 'sales_history_view', 'sales_view', 'sales_create',
                # Produits
                'products_view',
                # Tables
                'tables_view', 'tables_manage',
                # Commandes
                'orders_view', 'orders_create',
                # Dépenses (consultation pour justifier les sorties de caisse)
                'expenses_view',
                # Crédits (gestion des comptes clients)
                'credits_view', 'credits_manage',
            ],
            'server': [
                # Ventes
                'sales_view', 'sales_create',
                # Produits (LECTURE SEULE - pas de création/modification/suppression)
                'products_view',
                # Tables
                'tables_view', 'tables_manage',
                # Commandes
                'orders_view', 'orders_create',
            ],
            'manager': [
                # Toutes les permissions cashier/server
                'sales_manage', 'sales_history_view', 'sales_view', 'sales_create',
                'products_view', 'products_manage',
                'tables_view', 'tables_manage',
                'orders_view', 'orders_create',
                # Plus permissions manager
                'stocks_view', 'inventory_manage',
                'kitchen_view',
                'reports_view', 'analytics_view',
                'suppliers_view', 'suppliers_manage',
                'expenses_view', 'expenses_manage',
                'credits_view', 'credits_manage',
            ],
        }

        # Créer les permissions si elles n'existent pas
        permissions_created = 0
        permissions_updated = 0

        for role, permission_codes in ROLE_PERMISSIONS.items():
            for code in permission_codes:
                # Déterminer la catégorie et le nom depuis le code
                parts = code.split('_')
                category = parts[0]
                action = '_'.join(parts[1:])
                
                # Mapping des actions vers des noms lisibles
                action_names = {
                    'view': 'Voir',
                    'create': 'Créer',
                    'manage': 'Gérer',
                    'edit': 'Modifier',
                    'delete': 'Supprimer',
                    'history_view': 'Voir l\'historique',
                }
                
                action_name = action_names.get(action, action.replace('_', ' ').title())
                name = f"{action_name} {category}"
                
                permission, created = Permission.objects.get_or_create(
                    code=code,
                    defaults={
                        'name': name,
                        'category': category,
                        'description': f'Permission pour {action_name.lower()} dans {category}',
                        'is_active': True,
                    }
                )
                
                if created:
                    permissions_created += 1
                    self.stdout.write(f'  ✅ Créée: {permission.name} ({code})')
                else:
                    permissions_updated += 1

        self.stdout.write(f'\n📊 Permissions: {permissions_created} créées, {permissions_updated} existantes\n')

        # Assigner les permissions aux utilisateurs existants selon leur rôle
        users_updated = 0
        
        for role in ['cashier', 'server', 'manager']:
            users = User.objects.filter(role=role)
            
            for user in users:
                # Supprimer les permissions existantes pour ce rôle
                UserPermission.objects.filter(user=user).delete()
                
                # Assigner les nouvelles permissions
                permission_codes = ROLE_PERMISSIONS.get(role, [])
                permissions = Permission.objects.filter(code__in=permission_codes, is_active=True)
                
                for permission in permissions:
                    UserPermission.objects.create(
                        user=user,
                        permission=permission,
                        is_active=True
                    )
                
                users_updated += 1
                self.stdout.write(f'  👤 {user.username} ({role}): {permissions.count()} permissions assignées')

        self.stdout.write(f'\n✨ Terminé! {users_updated} utilisateurs mis à jour.')
        self.stdout.write('\n💡 Note: Les admins ont automatiquement toutes les permissions.')
