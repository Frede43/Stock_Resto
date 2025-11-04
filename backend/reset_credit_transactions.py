"""
Script pour réinitialiser les transactions de crédit en double
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from credits.models import CreditAccount, CreditTransaction

print("🔧 Réinitialisation des transactions de crédit...")

# Supprimer toutes les transactions
transactions_count = CreditTransaction.objects.count()
CreditTransaction.objects.all().delete()
print(f"✅ {transactions_count} transaction(s) supprimée(s)")

# Remettre tous les soldes à 0
accounts = CreditAccount.objects.all()
for account in accounts:
    account.current_balance = 0
    account.save()
    print(f"✅ Solde de {account.customer_name} remis à 0")

print(f"\n✅ Réinitialisation terminée !")
print(f"   Total comptes : {accounts.count()}")
print(f"   Transactions restantes : {CreditTransaction.objects.count()}")
