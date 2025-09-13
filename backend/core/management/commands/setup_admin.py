"""
Commande Django pour configurer l'interface d'administration
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from accounts.models import User


class Command(BaseCommand):
    help = 'Configure l\'interface d\'administration BarStockWise'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-superuser',
            action='store_true',
            help='Créer un superutilisateur par défaut',
        )
        parser.add_argument(
            '--setup-groups',
            action='store_true',
            help='Configurer les groupes d\'utilisateurs',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Exécuter toutes les configurations',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🚀 Configuration de l\'administration BarStockWise...')
        )

        if options['all'] or options['setup_groups']:
            self.setup_user_groups()

        if options['all'] or options['create_superuser']:
            self.create_default_superuser()

        self.stdout.write(
            self.style.SUCCESS('✅ Configuration terminée avec succès!')
        )

    def setup_user_groups(self):
        """Configure les groupes d'utilisateurs et leurs permissions"""
        self.stdout.write('📋 Configuration des groupes d\'utilisateurs...')

        # Groupe Administrateurs
        admin_group, created = Group.objects.get_or_create(name='Administrateurs')
        if created:
            self.stdout.write(
                self.style.SUCCESS('  ✓ Groupe "Administrateurs" créé')
            )
            # Les administrateurs ont toutes les permissions
            admin_group.permissions.set(Permission.objects.all())
        else:
            self.stdout.write('  ℹ️ Groupe "Administrateurs" existe déjà')

        # Groupe Gérants
        gerant_group, created = Group.objects.get_or_create(name='Gérants')
        if created:
            self.stdout.write(
                self.style.SUCCESS('  ✓ Groupe "Gérants" créé')
            )
            # Permissions pour les gérants
            gerant_permissions = Permission.objects.exclude(
                codename__in=[
                    'delete_user', 'add_user', 'change_user',  # Pas de gestion des utilisateurs
                    'delete_group', 'add_group', 'change_group',  # Pas de gestion des groupes
                ]
            )
            gerant_group.permissions.set(gerant_permissions)
        else:
            self.stdout.write('  ℹ️ Groupe "Gérants" existe déjà')

        # Groupe Serveurs
        serveur_group, created = Group.objects.get_or_create(name='Serveurs')
        if created:
            self.stdout.write(
                self.style.SUCCESS('  ✓ Groupe "Serveurs" créé')
            )
            # Permissions limitées pour les serveurs
            serveur_permissions = []
            
            # Permissions pour les ventes
            try:
                sale_ct = ContentType.objects.get(app_label='sales', model='sale')
                saleitem_ct = ContentType.objects.get(app_label='sales', model='saleitem')
                table_ct = ContentType.objects.get(app_label='sales', model='table')
                
                serveur_permissions.extend(Permission.objects.filter(
                    content_type__in=[sale_ct, saleitem_ct, table_ct],
                    codename__in=['view_sale', 'add_sale', 'change_sale', 'view_saleitem', 
                                'add_saleitem', 'view_table', 'change_table']
                ))
            except ContentType.DoesNotExist:
                pass

            # Permissions pour voir les produits
            try:
                product_ct = ContentType.objects.get(app_label='products', model='product')
                serveur_permissions.extend(Permission.objects.filter(
                    content_type=product_ct,
                    codename__in=['view_product']
                ))
            except ContentType.DoesNotExist:
                pass

            serveur_group.permissions.set(serveur_permissions)
        else:
            self.stdout.write('  ℹ️ Groupe "Serveurs" existe déjà')

        # Groupe Comptables
        comptable_group, created = Group.objects.get_or_create(name='Comptables')
        if created:
            self.stdout.write(
                self.style.SUCCESS('  ✓ Groupe "Comptables" créé')
            )
            # Permissions pour les comptables (rapports, dépenses, ventes en lecture)
            comptable_permissions = []
            
            try:
                # Permissions pour les rapports
                report_models = ['dailyreport', 'weeklyreport', 'monthlyreport']
                for model in report_models:
                    try:
                        ct = ContentType.objects.get(app_label='reports', model=model)
                        comptable_permissions.extend(Permission.objects.filter(content_type=ct))
                    except ContentType.DoesNotExist:
                        pass

                # Permissions pour les dépenses
                expense_ct = ContentType.objects.get(app_label='expenses', model='expense')
                comptable_permissions.extend(Permission.objects.filter(content_type=expense_ct))

                # Lecture seule pour les ventes
                sale_ct = ContentType.objects.get(app_label='sales', model='sale')
                comptable_permissions.extend(Permission.objects.filter(
                    content_type=sale_ct,
                    codename__startswith='view_'
                ))

            except ContentType.DoesNotExist:
                pass

            comptable_group.permissions.set(comptable_permissions)
        else:
            self.stdout.write('  ℹ️ Groupe "Comptables" existe déjà')

    def create_default_superuser(self):
        """Crée un superutilisateur par défaut si aucun n'existe"""
        self.stdout.write('👤 Vérification du superutilisateur...')

        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write('  ℹ️ Un superutilisateur existe déjà')
            return

        # Créer un superutilisateur par défaut
        try:
            superuser = User.objects.create_superuser(
                username='admin',
                email='admin@barstockwise.com',
                password='admin123',  # À changer en production !
                first_name='Administrateur',
                last_name='BarStockWise',
                role='admin'
            )
            
            self.stdout.write(
                self.style.SUCCESS('  ✓ Superutilisateur créé:')
            )
            self.stdout.write(f'    Username: admin')
            self.stdout.write(f'    Email: admin@barstockwise.com')
            self.stdout.write(f'    Password: admin123')
            self.stdout.write(
                self.style.WARNING('    ⚠️ CHANGEZ LE MOT DE PASSE EN PRODUCTION!')
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'  ❌ Erreur lors de la création du superutilisateur: {e}')
            )

    def create_sample_data(self):
        """Crée des données d'exemple pour tester l'admin"""
        self.stdout.write('📊 Création de données d\'exemple...')

        # Créer des catégories de produits
        from products.models import Category, Product
        
        categories_data = [
            {'name': 'Bières', 'type': 'boissons', 'description': 'Bières locales et importées'},
            {'name': 'Sodas', 'type': 'boissons', 'description': 'Boissons gazeuses'},
            {'name': 'Plats principaux', 'type': 'plats', 'description': 'Plats de résistance'},
            {'name': 'Snacks', 'type': 'snacks', 'description': 'Collations et amuse-gueules'},
        ]

        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            if created:
                self.stdout.write(f'  ✓ Catégorie "{category.name}" créée')

        # Créer quelques produits d'exemple
        products_data = [
            {
                'name': 'Primus',
                'category': 'Bières',
                'purchase_price': 1500,
                'selling_price': 3000,
                'current_stock': 50,
                'minimum_stock': 10,
                'unit': 'bouteille'
            },
            {
                'name': 'Coca-Cola',
                'category': 'Sodas',
                'purchase_price': 800,
                'selling_price': 1500,
                'current_stock': 30,
                'minimum_stock': 5,
                'unit': 'bouteille'
            },
        ]

        for prod_data in products_data:
            try:
                category = Category.objects.get(name=prod_data['category'])
                product, created = Product.objects.get_or_create(
                    name=prod_data['name'],
                    category=category,
                    defaults={
                        'purchase_price': prod_data['purchase_price'],
                        'selling_price': prod_data['selling_price'],
                        'current_stock': prod_data['current_stock'],
                        'minimum_stock': prod_data['minimum_stock'],
                        'unit': prod_data['unit'],
                    }
                )
                if created:
                    self.stdout.write(f'  ✓ Produit "{product.name}" créé')
            except Category.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'  ⚠️ Catégorie "{prod_data["category"]}" non trouvée')
                )

        self.stdout.write(
            self.style.SUCCESS('  ✅ Données d\'exemple créées')
        )
