"""
Script pour corriger les problèmes d'admin des dépenses en production
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from expenses.models import Expense, ExpenseCategory

def fix_expenses():
    """Corriger les dépenses sans created_by"""
    print("🔍 Vérification des dépenses...")
    
    # Compter les dépenses sans created_by
    expenses_without_creator = Expense.objects.filter(created_by__isnull=True).count()
    
    if expenses_without_creator > 0:
        print(f"⚠️  {expenses_without_creator} dépense(s) sans créateur trouvée(s)")
        
        # Option: Assigner un utilisateur par défaut (admin)
        from accounts.models import User
        admin_user = User.objects.filter(is_superuser=True).first()
        
        if admin_user:
            print(f"✅ Attribution au super-utilisateur: {admin_user.username}")
            Expense.objects.filter(created_by__isnull=True).update(created_by=admin_user)
            print(f"✅ {expenses_without_creator} dépense(s) corrigée(s)")
        else:
            print("❌ Aucun super-utilisateur trouvé pour l'attribution")
    else:
        print("✅ Toutes les dépenses ont un créateur")
    
    # Vérifier les catégories
    print("\n🔍 Vérification des catégories...")
    categories_count = ExpenseCategory.objects.count()
    print(f"✅ {categories_count} catégorie(s) de dépenses trouvée(s)")
    
    # Vérifier les dépenses
    print("\n🔍 Vérification des dépenses...")
    expenses_count = Expense.objects.count()
    print(f"✅ {expenses_count} dépense(s) trouvée(s)")
    
    # Statistiques par statut
    print("\n📊 Statistiques par statut:")
    for status, label in Expense.STATUS_CHOICES:
        count = Expense.objects.filter(status=status).count()
        print(f"  - {label}: {count}")

if __name__ == '__main__':
    print("=" * 60)
    print("🔧 CORRECTION DES DÉPENSES - ADMIN")
    print("=" * 60)
    fix_expenses()
    print("\n" + "=" * 60)
    print("✅ TERMINÉ")
    print("=" * 60)
