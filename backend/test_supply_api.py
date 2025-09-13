#!/usr/bin/env python3
"""
Test direct de l'API d'approvisionnement
"""

import os
import django
from datetime import datetime, timedelta

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from inventory.views import SupplyViewSet
from inventory.serializers import PurchaseCreateSerializer
from suppliers.models import Supplier
from products.models import Product
import json

User = get_user_model()

def test_supply_creation_direct():
    """Test direct de création d'approvisionnement"""
    print("🧪 Test direct de création d'approvisionnement")
    print("="*50)
    
    try:
        # 1. Récupérer les objets nécessaires
        print("📦 Récupération des données...")
        
        supplier = Supplier.objects.first()
        product = Product.objects.first()
        user = User.objects.filter(role='admin').first()
        
        if not all([supplier, product, user]):
            print("❌ Données manquantes:")
            print(f"   Fournisseur: {'✅' if supplier else '❌'}")
            print(f"   Produit: {'✅' if product else '❌'}")
            print(f"   Utilisateur: {'✅' if user else '❌'}")
            return False
        
        print(f"✅ Fournisseur: {supplier.name}")
        print(f"✅ Produit: {product.name}")
        print(f"✅ Utilisateur: {user.username}")
        
        # 2. Tester le serializer directement
        print("\n📝 Test du serializer...")
        
        supply_data = {
            "supplier": supplier.id,
            "delivery_date": (datetime.now() + timedelta(days=2)).isoformat(),
            "notes": "Test direct via serializer",
            "items": [
                {
                    "product": product.id,
                    "quantity_ordered": 12,
                    "quantity_received": 0,
                    "unit_price": 750
                }
            ]
        }
        
        serializer = PurchaseCreateSerializer(data=supply_data)
        
        if serializer.is_valid():
            print("✅ Données valides")
            
            # Créer l'approvisionnement
            purchase = serializer.save()
            print(f"✅ Approvisionnement créé: {purchase.reference}")
            print(f"   ID: {purchase.id}")
            print(f"   Statut: {purchase.status}")
            print(f"   Total: {purchase.total_amount} FBu")
            print(f"   Articles: {purchase.items.count()}")
            
            return True
        else:
            print("❌ Erreurs de validation:")
            for field, errors in serializer.errors.items():
                print(f"   {field}: {errors}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_supply_viewset():
    """Test du ViewSet"""
    print("\n🔧 Test du ViewSet...")
    
    try:
        # Créer une requête factice
        factory = RequestFactory()
        
        supply_data = {
            "supplier": Supplier.objects.first().id,
            "delivery_date": (datetime.now() + timedelta(days=1)).isoformat(),
            "notes": "Test via ViewSet",
            "items": [
                {
                    "product": Product.objects.first().id,
                    "quantity_ordered": 6,
                    "quantity_received": 0,
                    "unit_price": 900
                }
            ]
        }
        
        request = factory.post('/api/inventory/supplies/', 
                              data=json.dumps(supply_data),
                              content_type='application/json')
        request.user = User.objects.filter(role='admin').first()
        
        # Tester le ViewSet
        viewset = SupplyViewSet()
        viewset.action = 'create'
        viewset.request = request
        
        # Vérifier le serializer utilisé
        serializer_class = viewset.get_serializer_class()
        print(f"✅ Serializer utilisé: {serializer_class.__name__}")
        
        if serializer_class.__name__ == 'PurchaseCreateSerializer':
            print("✅ Bon serializer pour la création")
            return True
        else:
            print("❌ Mauvais serializer pour la création")
            return False
            
    except Exception as e:
        print(f"❌ Erreur ViewSet: {e}")
        return False

def show_current_supplies():
    """Afficher les approvisionnements actuels"""
    print("\n📋 Approvisionnements actuels:")
    
    from inventory.models import Purchase
    
    purchases = Purchase.objects.all().order_by('-created_at')[:5]
    
    for purchase in purchases:
        print(f"  📦 {purchase.reference}")
        print(f"     Fournisseur: {purchase.supplier.name if purchase.supplier else 'N/A'}")
        print(f"     Statut: {purchase.status}")
        print(f"     Total: {purchase.total_amount} FBu")
        print(f"     Articles: {purchase.items.count()}")
        print()

def main():
    """Fonction principale"""
    print("🎯 Test de l'API d'approvisionnement")
    print("="*50)
    
    # Afficher l'état actuel
    show_current_supplies()
    
    # Test du serializer
    serializer_success = test_supply_creation_direct()
    
    # Test du ViewSet
    viewset_success = test_supply_viewset()
    
    print("\n" + "="*50)
    print("📊 RÉSULTATS:")
    print(f"  Serializer: {'✅' if serializer_success else '❌'}")
    print(f"  ViewSet: {'✅' if viewset_success else '❌'}")
    
    if serializer_success and viewset_success:
        print("\n🎉 API d'approvisionnement fonctionnelle!")
        print("📱 Vous pouvez maintenant tester dans l'interface:")
        print("   http://localhost:5173/supplies")
    else:
        print("\n❌ Problèmes détectés dans l'API")
        print("💡 Redémarrez le serveur Django après les corrections")

if __name__ == "__main__":
    main()
