#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Product, Category
from suppliers.models import Supplier
from expenses.models import ExpenseCategory, Expense
from inventory.models import StockMovement, Purchase
from reports.models import DailyReport, StockAlert

User = get_user_model()

def test_models():
    """Test rapide des modèles"""
    print("🧪 Test rapide des modèles Django...")
    
    # Test utilisateurs
    users_count = User.objects.count()
    print(f"✅ Utilisateurs: {users_count}")
    
    # Test produits
    products_count = Product.objects.count()
    categories_count = Category.objects.count()
    print(f"✅ Produits: {products_count}, Catégories: {categories_count}")
    
    # Test fournisseurs
    suppliers_count = Supplier.objects.count()
    print(f"✅ Fournisseurs: {suppliers_count}")
    
    # Test dépenses
    expense_categories_count = ExpenseCategory.objects.count()
    expenses_count = Expense.objects.count()
    print(f"✅ Catégories de dépenses: {expense_categories_count}, Dépenses: {expenses_count}")
    
    # Test inventaire
    movements_count = StockMovement.objects.count()
    purchases_count = Purchase.objects.count()
    print(f"✅ Mouvements de stock: {movements_count}, Achats: {purchases_count}")
    
    # Test rapports
    reports_count = DailyReport.objects.count()
    alerts_count = StockAlert.objects.count()
    print(f"✅ Rapports quotidiens: {reports_count}, Alertes: {alerts_count}")
    
    print("\n🎉 Tous les modèles fonctionnent correctement!")

def create_sample_data():
    """Créer des données d'exemple pour les nouveaux modules"""
    print("\n📝 Création de données d'exemple...")
    
    # Créer des catégories de dépenses
    expense_categories = [
        {'name': 'Électricité', 'description': 'Factures d\'électricité'},
        {'name': 'Eau', 'description': 'Factures d\'eau'},
        {'name': 'Maintenance', 'description': 'Réparations et maintenance'},
        {'name': 'Marketing', 'description': 'Publicité et promotion'},
        {'name': 'Transport', 'description': 'Frais de transport et livraison'}
    ]
    
    for cat_data in expense_categories:
        category, created = ExpenseCategory.objects.get_or_create(
            name=cat_data['name'],
            defaults={'description': cat_data['description']}
        )
        if created:
            print(f"✅ Catégorie de dépense créée: {category.name}")
    
    # Créer des fournisseurs
    suppliers_data = [
        {
            'name': 'Brarudi SA',
            'contact_person': 'Jean Ntahomvukiye',
            'phone': '+257 22 25 56 00',
            'email': 'contact@brarudi.bi',
            'address': 'Avenue du Commerce, Bujumbura'
        },
        {
            'name': 'Coca-Cola Burundi',
            'contact_person': 'Marie Nzeyimana',
            'phone': '+257 22 24 15 30',
            'email': 'info@coca-cola.bi',
            'address': 'Boulevard de l\'Indépendance, Bujumbura'
        },
        {
            'name': 'Distillerie du Burundi',
            'contact_person': 'Pierre Ndikumana',
            'phone': '+257 22 23 45 67',
            'email': 'ventes@distillerie.bi',
            'address': 'Quartier Industriel, Bujumbura'
        }
    ]
    
    for supplier_data in suppliers_data:
        supplier, created = Supplier.objects.get_or_create(
            name=supplier_data['name'],
            defaults=supplier_data
        )
        if created:
            print(f"✅ Fournisseur créé: {supplier.name}")
    
    print("✅ Données d'exemple créées avec succès!")

if __name__ == '__main__':
    test_models()
    create_sample_data()
    print("\n🚀 Le backend Django est prêt!")
    print("Vous pouvez maintenant démarrer le serveur avec: python manage.py runserver")
