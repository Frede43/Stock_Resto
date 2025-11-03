from django.core.management.base import BaseCommand
from expenses.models import ExpenseCategory, BudgetSetting
from decimal import Decimal


class Command(BaseCommand):
    help = 'Initialise les catégories de dépenses et leurs budgets par défaut'

    def handle(self, *args, **kwargs):
        categories_data = [
            {
                'name': 'Achats',
                'description': 'Produits, ingrédients, boissons',
                'budget': Decimal('500000.00')
            },
            {
                'name': 'Salaires',
                'description': 'Paie du personnel',
                'budget': Decimal('800000.00')
            },
            {
                'name': 'Loyer',
                'description': 'Loyer du local',
                'budget': Decimal('300000.00')
            },
            {
                'name': 'Électricité',
                'description': 'Factures électricité',
                'budget': Decimal('50000.00')
            },
            {
                'name': 'Eau',
                'description': 'Factures eau',
                'budget': Decimal('20000.00')
            },
            {
                'name': 'Internet',
                'description': 'Abonnement internet',
                'budget': Decimal('30000.00')
            },
            {
                'name': 'Maintenance',
                'description': 'Réparations, entretien',
                'budget': Decimal('100000.00')
            },
            {
                'name': 'Marketing',
                'description': 'Publicité, promotion',
                'budget': Decimal('50000.00')
            },
            {
                'name': 'Transport',
                'description': 'Carburant, transport',
                'budget': Decimal('40000.00')
            },
            {
                'name': 'Administratif',
                'description': 'Fournitures bureau',
                'budget': Decimal('30000.00')
            },
            {
                'name': 'Nettoyage',
                'description': 'Produits d\'entretien',
                'budget': Decimal('25000.00')
            },
            {
                'name': 'Équipement',
                'description': 'Matériel cuisine/salle',
                'budget': Decimal('150000.00')
            },
            {
                'name': 'Téléphone',
                'description': 'Forfaits téléphoniques',
                'budget': Decimal('20000.00')
            },
            {
                'name': 'Taxes',
                'description': 'Impôts, taxes',
                'budget': Decimal('100000.00')
            },
            {
                'name': 'Assurance',
                'description': 'Assurances diverses',
                'budget': Decimal('50000.00')
            },
            {
                'name': 'Autres',
                'description': 'Dépenses diverses',
                'budget': Decimal('100000.00')
            },
        ]

        created_count = 0
        updated_count = 0
        budget_count = 0

        for cat_data in categories_data:
            category, created = ExpenseCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'is_active': True
                }
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Catégorie créée: {category.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'⚠ Catégorie existe déjà: {category.name}')
                )

            # Créer ou mettre à jour le budget
            budget, budget_created = BudgetSetting.objects.get_or_create(
                category=category,
                defaults={
                    'monthly_budget': cat_data['budget'],
                    'alert_threshold': 80,
                    'is_active': True
                }
            )

            if budget_created:
                budget_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  → Budget créé: {cat_data["budget"]} BIF/mois')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'  → Budget existe déjà: {budget.monthly_budget} BIF/mois')
                )

        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'\n✓ Résumé:'))
        self.stdout.write(f'  • Catégories créées: {created_count}')
        self.stdout.write(f'  • Catégories existantes: {updated_count}')
        self.stdout.write(f'  • Budgets créés: {budget_count}')
        self.stdout.write(f'  • Total catégories: {created_count + updated_count}')
        self.stdout.write('\n' + '='*60 + '\n')
