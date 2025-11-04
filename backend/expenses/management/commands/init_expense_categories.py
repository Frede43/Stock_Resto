from django.core.management.base import BaseCommand
from expenses.models import ExpenseCategory
from decimal import Decimal


class Command(BaseCommand):
    help = 'Initialise les catégories de dépenses par défaut'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Initialisation des catégories de dépenses...'))
        
        categories = [
            {
                'name': 'Loyer et charges',
                'category_type': 'utilities',
                'description': 'Loyer du local, charges locatives',
                'budget_monthly': Decimal('1200000'),
                'requires_approval': True,
                'approval_threshold': Decimal('500000'),
            },
            {
                'name': 'Électricité et eau',
                'category_type': 'utilities',
                'description': 'Factures d\'électricité et d\'eau',
                'budget_monthly': Decimal('300000'),
                'requires_approval': True,
                'approval_threshold': Decimal('150000'),
            },
            {
                'name': 'Internet et téléphone',
                'category_type': 'utilities',
                'description': 'Abonnements internet, téléphone fixe et mobile',
                'budget_monthly': Decimal('100000'),
                'requires_approval': False,
            },
            {
                'name': 'Achats de boissons',
                'category_type': 'inventory',
                'description': 'Achat de boissons auprès des fournisseurs',
                'budget_monthly': Decimal('800000'),
                'requires_approval': True,
                'approval_threshold': Decimal('300000'),
            },
            {
                'name': 'Achats de nourriture',
                'category_type': 'inventory',
                'description': 'Achat d\'ingrédients et produits alimentaires',
                'budget_monthly': Decimal('600000'),
                'requires_approval': True,
                'approval_threshold': Decimal('200000'),
            },
            {
                'name': 'Fournitures et consommables',
                'category_type': 'operational',
                'description': 'Serviettes, papier toilette, sacs, etc.',
                'budget_monthly': Decimal('150000'),
                'requires_approval': False,
            },
            {
                'name': 'Produits d\'entretien',
                'category_type': 'operational',
                'description': 'Produits de nettoyage et d\'hygiène',
                'budget_monthly': Decimal('100000'),
                'requires_approval': False,
            },
            {
                'name': 'Salaires et charges sociales',
                'category_type': 'staff',
                'description': 'Salaires du personnel et cotisations',
                'budget_monthly': Decimal('2000000'),
                'requires_approval': True,
                'approval_threshold': Decimal('1000000'),
            },
            {
                'name': 'Primes et bonus',
                'category_type': 'staff',
                'description': 'Primes de performance et bonus',
                'budget_monthly': Decimal('200000'),
                'requires_approval': True,
                'approval_threshold': Decimal('50000'),
            },
            {
                'name': 'Marketing et publicité',
                'category_type': 'marketing',
                'description': 'Campagnes publicitaires, flyers, réseaux sociaux',
                'budget_monthly': Decimal('150000'),
                'requires_approval': True,
                'approval_threshold': Decimal('50000'),
            },
            {
                'name': 'Maintenance équipements',
                'category_type': 'maintenance',
                'description': 'Réparation et entretien des équipements',
                'budget_monthly': Decimal('200000'),
                'requires_approval': True,
                'approval_threshold': Decimal('100000'),
            },
            {
                'name': 'Licences et permis',
                'category_type': 'operational',
                'description': 'Licences d\'exploitation, permis divers',
                'budget_monthly': Decimal('50000'),
                'requires_approval': True,
                'approval_threshold': Decimal('25000'),
            },
            {
                'name': 'Assurances',
                'category_type': 'operational',
                'description': 'Assurances locaux, responsabilité civile',
                'budget_monthly': Decimal('100000'),
                'requires_approval': True,
                'approval_threshold': Decimal('50000'),
            },
            {
                'name': 'Transport et livraison',
                'category_type': 'operational',
                'description': 'Frais de transport et de livraison',
                'budget_monthly': Decimal('80000'),
                'requires_approval': False,
            },
            {
                'name': 'Frais bancaires',
                'category_type': 'operational',
                'description': 'Frais de gestion de compte, commissions',
                'budget_monthly': Decimal('30000'),
                'requires_approval': False,
            },
            {
                'name': 'Autres dépenses',
                'category_type': 'other',
                'description': 'Dépenses diverses non catégorisées',
                'budget_monthly': Decimal('100000'),
                'requires_approval': True,
                'approval_threshold': Decimal('50000'),
            },
        ]
        
        created_count = 0
        updated_count = 0
        
        for cat_data in categories:
            category, created = ExpenseCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Créée: {category.name}')
                )
            else:
                # Mettre à jour si nécessaire
                for key, value in cat_data.items():
                    if key != 'name':
                        setattr(category, key, value)
                category.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'  ℹ️  Mise à jour: {category.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✨ Terminé! {created_count} catégories créées, {updated_count} mises à jour.'
            )
        )
        
        # Afficher le total des budgets
        total_budget = sum(cat['budget_monthly'] for cat in categories)
        self.stdout.write(
            self.style.SUCCESS(
                f'💰 Budget mensuel total: {total_budget:,.0f} BIF'
            )
        )
