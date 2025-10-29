python manage.py shell << EOF
from sales.models import Sale
from datetime import date

print("=" * 70)
print("VÉRIFICATION BASE DE DONNÉES")
print("=" * 70)

# 1. Toutes les ventes
all_sales = Sale.objects.all()
print(f"\n1. TOTAL VENTES: {all_sales.count()}")

# 2. Par statut
print("\n2. PAR STATUT:")
for status in ['pending', 'preparing', 'ready', 'served', 'paid']:
    count = Sale.objects.filter(status=status).count()
    print(f"   {status}: {count}")

# 3. Manager orders
print(f"\n3. Sale.orders.all(): {Sale.orders.count()}")

# 4. Dernières ventes
print("\n4. DERNIÈRES VENTES:")
for sale in Sale.objects.order_by('-created_at')[:5]:
    print(f"   #{sale.id}: {sale.reference} - {sale.status}")

EOF
