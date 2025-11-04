from django.db.models.signals import post_save
from django.dispatch import receiver
from sales.models import Sale
from .models import CreditTransaction


@receiver(post_save, sender=Sale)
def create_credit_transaction_on_sale(sender, instance, created, **kwargs):
    """
    Créer automatiquement une transaction de crédit quand une vente à crédit est créée
    """
    print(f"🔔 Signal déclenché pour vente #{instance.id}")
    print(f"   - created: {created}")
    print(f"   - payment_method: {instance.payment_method}")
    print(f"   - has credit_account: {hasattr(instance, 'credit_account')}")
    print(f"   - credit_account value: {instance.credit_account if hasattr(instance, 'credit_account') else 'N/A'}")
    
    # Vérifier si c'est une nouvelle vente à crédit
    if created and instance.payment_method == 'credit' and hasattr(instance, 'credit_account') and instance.credit_account:
        print(f"✅ Création de la transaction...")
        # Créer la transaction de dette
        CreditTransaction.objects.create(
            credit_account=instance.credit_account,
            transaction_type='debt',
            amount=instance.total_amount,
            sale=instance,
            notes=f"Vente #{instance.id} - {instance.customer_name}",
            created_by=instance.created_by if hasattr(instance, 'created_by') else None
        )
        
        print(f"✅ Transaction crédit créée pour vente #{instance.id} - {instance.total_amount} FBu")
    else:
        print(f"❌ Conditions non remplies pour créer la transaction")
