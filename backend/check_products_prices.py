#!/usr/bin/env python
"""
Script pour vérifier les prix d'achat des produits
"""
import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from products.models import Product

print("=" * 60)
print("VÉRIFICATION DES PRIX DES PRODUITS")
print("=" * 60)

products = Product.objects.all()

print(f"\n📊 Total produits : {products.count()}\n")

# Produits SANS prix d'achat
no_purchase_price = products.filter(purchase_price__isnull=True) | products.filter(purchase_price=0)
print(f"❌ Produits SANS prix d'achat : {no_purchase_price.count()}")
if no_purchase_price.exists():
    for product in no_purchase_price[:10]:  # Afficher les 10 premiers
        print(f"   - {product.name}: Prix vente={product.selling_price} FBu, Prix achat=NULL/0")

# Produits AVEC prix d'achat
with_purchase_price = products.exclude(purchase_price__isnull=True).exclude(purchase_price=0)
print(f"\n✅ Produits AVEC prix d'achat : {with_purchase_price.count()}")
if with_purchase_price.exists():
    for product in with_purchase_price[:10]:  # Afficher les 10 premiers
        print(f"   - {product.name}: Prix vente={product.selling_price} FBu, Prix achat={product.purchase_price} FBu")

print("\n" + "=" * 60)
print("SOLUTION")
print("=" * 60)

if no_purchase_price.count() > 0:
    print("\n⚠️ PROBLÈME IDENTIFIÉ !")
    print("Vos produits n'ont pas de prix d'achat défini.")
    print("Le bénéfice ne peut pas être calculé sans prix d'achat.")
    print("\n🔧 SOLUTIONS :")
    print("1. Définir les prix d'achat manuellement dans /products")
    print("2. Ou exécuter le script de correction ci-dessous :")
    print("\n" + "-" * 60)
    print("# Définir automatiquement prix achat = 60% du prix vente")
    print("from products.models import Product")
    print("products = Product.objects.filter(purchase_price__isnull=True) | Product.objects.filter(purchase_price=0)")
    print("for p in products:")
    print("    p.purchase_price = p.selling_price * 0.6")
    print("    p.save()")
    print("print(f'✅ {products.count()} produits mis à jour')")
    print("-" * 60)
else:
    print("\n✅ Tous les produits ont un prix d'achat défini !")
    print("Le problème vient d'ailleurs. Vérifiez :")
    print("1. Que les ventes ont bien des items")
    print("2. Que la date sélectionnée est correcte")
    print("3. Les logs de la console du navigateur")
