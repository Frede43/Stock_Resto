#!/usr/bin/env python
"""
Script pour corriger l'API purchases et créer les données de test
"""

import os
import sys
import django
from decimal import Decimal

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Category, Product
from suppliers.models import Supplier
from inventory.models import Purchase, PurchaseItem, StockMovement

User = get_user_model()

def create_test_purchases():
    """Créer des achats de test"""
    print("🛒 Création des achats de test...")
    
    # Récupérer les données existantes
    try:
        admin_user = User.objects.get(username='admin')
        supplier = Supplier.objects.first()
        products = Product.objects.all()[:3]  # Prendre les 3 premiers produits
        
        if not supplier:
            print("❌ Aucun fournisseur trouvé. Créez d'abord des fournisseurs.")
            return
            
        if not products:
            print("❌ Aucun produit trouvé. Créez d'abord des produits.")
            return
            
    except User.DoesNotExist:
        print("❌ Utilisateur admin non trouvé. Créez d'abord un utilisateur admin.")
        return
    
    # Créer un achat de test
    purchase_data = {
        'supplier': supplier,
        'purchase_date': '2024-01-15',
        'reference': 'ACH-001',
        'status': 'received',
        'notes': 'Achat de test pour validation API',
        'user': admin_user
    }
    
    purchase, created = Purchase.objects.get_or_create(
        reference='ACH-001',
        defaults=purchase_data
    )
    
    status = "✅ Créé" if created else "ℹ️ Existe"
    print(f"   {status}: Achat {purchase.reference}")
    
    # Créer les articles de l'achat
    total_amount = Decimal('0.00')
    
    for i, product in enumerate(products):
        quantity = 10 + (i * 5)  # 10, 15, 20
        unit_cost = product.purchase_price or Decimal('1000.00')
        
        item_data = {
            'purchase': purchase,
            'product': product,
            'quantity': quantity,
            'unit_cost': unit_cost
        }
        
        item, created = PurchaseItem.objects.get_or_create(
            purchase=purchase,
            product=product,
            defaults=item_data
        )
        
        total_amount += item.total_cost
        
        status = "✅ Créé" if created else "ℹ️ Existe"
        print(f"     {status}: {product.name} - {quantity} unités à {unit_cost} BIF")
    
    # Mettre à jour le montant total
    purchase.total_amount = total_amount
    purchase.save()
    
    print(f"   💰 Total de l'achat: {total_amount} BIF")
    
    return purchase

def create_stock_movements_from_purchases():
    """Créer des mouvements de stock à partir des achats"""
    print("📦 Création des mouvements de stock...")
    
    purchases = Purchase.objects.filter(status='received')
    
    for purchase in purchases:
        for item in purchase.items.all():
            # Vérifier si un mouvement existe déjà
            existing_movement = StockMovement.objects.filter(
                product=item.product,
                reference__contains=purchase.reference
            ).first()
            
            if not existing_movement:
                movement = StockMovement.objects.create(
                    product=item.product,
                    movement_type='in',
                    reason='purchase',
                    quantity=item.quantity,
                    unit_price=item.unit_cost,
                    stock_before=item.product.current_stock,
                    stock_after=item.product.current_stock + item.quantity,
                    reference=f"Achat #{purchase.reference}",
                    notes=f"Réception achat du {purchase.purchase_date}",
                    user=purchase.user
                )
                
                # Mettre à jour le stock du produit
                item.product.current_stock += item.quantity
                item.product.save()
                
                print(f"   ✅ Mouvement créé: {item.product.name} +{item.quantity}")
            else:
                print(f"   ℹ️ Mouvement existe: {item.product.name}")

def test_purchases_api():
    """Tester l'API purchases"""
    print("🧪 Test de l'API purchases...")
    
    from django.test import Client
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken
    
    try:
        admin_user = User.objects.get(username='admin')
        client = APIClient()
        
        # Authentification
        refresh = RefreshToken.for_user(admin_user)
        token = str(refresh.access_token)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test GET /api/inventory/purchases/
        response = client.get('/api/inventory/purchases/')
        
        print(f"   📡 GET /api/inventory/purchases/")
        print(f"   📥 Statut: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            count = len(data.get('results', data)) if isinstance(data, dict) else len(data)
            print(f"   ✅ Succès: {count} achat(s) trouvé(s)")
            return True
        else:
            print(f"   ❌ Erreur: {response.content.decode()}")
            return False
            
    except Exception as e:
        print(f"   ❌ Erreur lors du test: {e}")
        return False

def main():
    """Fonction principale"""
    print("🔧 Correction de l'API purchases")
    print("=" * 50)
    
    try:
        # Créer des achats de test
        purchase = create_test_purchases()
        
        # Créer des mouvements de stock
        create_stock_movements_from_purchases()
        
        # Tester l'API
        api_success = test_purchases_api()
        
        print("\n" + "=" * 50)
        print("📊 Résumé des corrections:")
        print(f"   Achats: {'✅ OK' if purchase else '❌ ERREUR'}")
        print(f"   API: {'✅ OK' if api_success else '❌ ERREUR'}")
        
        if api_success:
            print("\n🎉 L'API purchases fonctionne correctement !")
            print("   Vous pouvez maintenant utiliser la page Approvisionnements.")
        else:
            print("\n⚠️ L'API purchases a encore des problèmes.")
            print("   Vérifiez les logs Django pour plus de détails.")
        
    except Exception as e:
        print(f"❌ Erreur générale: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
