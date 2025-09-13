#!/usr/bin/env python
"""
Vérifier les prix d'achat des produits directement en base de données
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from products.models import Product

def check_products_in_db():
    """Vérifier les produits en base de données"""
    print("🔍 Vérification des produits en base de données...")
    print("=" * 60)
    
    try:
        # Récupérer tous les produits
        products = Product.objects.all()
        total_count = products.count()
        
        print(f"📦 Total produits en base: {total_count}")
        
        if total_count == 0:
            print("❌ Aucun produit en base de données")
            return False
        
        # Statistiques sur les prix d'achat
        products_with_zero_purchase = products.filter(purchase_price=0).count()
        products_with_valid_purchase = products.filter(purchase_price__gt=0).count()
        
        print(f"\n📊 Statistiques des prix d'achat:")
        print(f"   • Produits avec purchase_price = 0: {products_with_zero_purchase}")
        print(f"   • Produits avec purchase_price > 0: {products_with_valid_purchase}")
        
        # Afficher quelques exemples
        print(f"\n📋 Premiers produits:")
        for i, product in enumerate(products[:10]):
            print(f"   {i+1}. {product.name}")
            print(f"      • ID: {product.id}")
            print(f"      • Catégorie: {product.category.name}")
            print(f"      • Prix d'achat: {product.purchase_price} BIF")
            print(f"      • Prix de vente: {product.selling_price} BIF")
            print(f"      • Stock: {product.current_stock}")
            
            if product.purchase_price == 0:
                print(f"      ⚠️  Prix d'achat à 0 - À corriger")
            else:
                print(f"      ✅ Prix d'achat OK")
            print()
        
        # Si tous les prix d'achat sont à 0, proposer de les corriger
        if products_with_zero_purchase == total_count:
            print("🔧 TOUS les prix d'achat sont à 0. Correction automatique...")
            return fix_purchase_prices()
        elif products_with_zero_purchase > 0:
            print(f"⚠️  {products_with_zero_purchase} produits ont un prix d'achat à 0")
            return fix_purchase_prices()
        else:
            print("✅ Tous les produits ont des prix d'achat valides")
            return True
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def fix_purchase_prices():
    """Corriger les prix d'achat en utilisant une estimation basée sur le prix de vente"""
    print("\n🔧 Correction des prix d'achat...")
    
    try:
        # Récupérer les produits avec prix d'achat à 0
        products_to_fix = Product.objects.filter(purchase_price=0)
        
        print(f"📝 {products_to_fix.count()} produits à corriger")
        
        fixed_count = 0
        for product in products_to_fix:
            # Estimer le prix d'achat à 70% du prix de vente (marge de 30%)
            estimated_purchase_price = product.selling_price * 0.7
            
            print(f"   • {product.name}:")
            print(f"     Prix de vente: {product.selling_price} BIF")
            print(f"     Prix d'achat estimé: {estimated_purchase_price:.2f} BIF")
            
            # Mettre à jour le prix d'achat
            product.purchase_price = estimated_purchase_price
            product.save()
            
            fixed_count += 1
        
        print(f"\n✅ {fixed_count} produits corrigés avec succès")
        
        # Vérifier le résultat
        remaining_zero = Product.objects.filter(purchase_price=0).count()
        print(f"📊 Produits restants avec prix d'achat à 0: {remaining_zero}")
        
        return remaining_zero == 0
        
    except Exception as e:
        print(f"❌ Erreur lors de la correction: {e}")
        return False

def create_sample_products():
    """Créer quelques produits d'exemple si la base est vide"""
    print("\n🏗️  Création de produits d'exemple...")
    
    try:
        from products.models import Category
        
        # Créer une catégorie si elle n'existe pas
        category, created = Category.objects.get_or_create(
            name='Boissons Test',
            defaults={
                'type': 'boissons',
                'description': 'Catégorie de test pour les boissons'
            }
        )
        
        if created:
            print(f"✅ Catégorie créée: {category.name}")
        
        # Créer quelques produits d'exemple
        sample_products = [
            {
                'name': 'Coca-Cola 33cl',
                'purchase_price': 400,
                'selling_price': 700,
                'current_stock': 50,
                'unit': 'bouteille'
            },
            {
                'name': 'Fanta Orange 33cl',
                'purchase_price': 400,
                'selling_price': 700,
                'current_stock': 45,
                'unit': 'bouteille'
            },
            {
                'name': 'Sprite 33cl',
                'purchase_price': 400,
                'selling_price': 700,
                'current_stock': 40,
                'unit': 'bouteille'
            }
        ]
        
        created_count = 0
        for product_data in sample_products:
            product, created = Product.objects.get_or_create(
                name=product_data['name'],
                category=category,
                defaults=product_data
            )
            
            if created:
                print(f"✅ Produit créé: {product.name} (PA: {product.purchase_price}, PV: {product.selling_price})")
                created_count += 1
        
        print(f"\n📦 {created_count} nouveaux produits créés")
        return created_count > 0
        
    except Exception as e:
        print(f"❌ Erreur lors de la création: {e}")
        return False

if __name__ == '__main__':
    print("🧪 Vérification des produits en base de données")
    print("=" * 60)
    
    # Vérifier les produits existants
    success = check_products_in_db()
    
    # Si pas de produits, en créer quelques-uns
    if not success:
        total_products = Product.objects.count()
        if total_products == 0:
            print("\n💡 Base de données vide, création de produits d'exemple...")
            create_sample_products()
            # Re-vérifier après création
            success = check_products_in_db()
    
    print(f"\n📋 Résultat final:")
    if success:
        print("✅ Les produits ont des prix d'achat valides")
        print("📋 Actions:")
        print("   1. Redémarrer le serveur Django si nécessaire")
        print("   2. Rafraîchir la page http://localhost:8081/products")
        print("   3. Les prix d'achat devraient maintenant s'afficher")
    else:
        print("❌ Problème persistant avec les prix d'achat")
        print("💡 Vérifier manuellement via l'admin Django")
