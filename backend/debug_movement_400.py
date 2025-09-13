#!/usr/bin/env python
"""
Script pour déboguer l'erreur 400 lors de la création de mouvements de stock
"""

import os
import sys
import django
import json

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Product
from inventory.serializers import StockMovementSerializer
from rest_framework.test import APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_serializer_validation():
    """Tester la validation du serializer directement"""
    print("🔍 Test de validation du serializer...")
    
    try:
        # Récupérer les données nécessaires
        admin_user = User.objects.get(username='admin')
        product = Product.objects.first()
        
        if not product:
            print("❌ Aucun produit trouvé")
            return False
        
        print(f"📦 Produit: {product.name} (ID: {product.id})")
        print(f"👤 Utilisateur: {admin_user.username}")
        
        # Créer une fausse requête pour le contexte
        factory = APIRequestFactory()
        request = factory.post('/api/inventory/movements/')
        request.user = admin_user
        
        # Données exactement comme envoyées par le frontend
        data = {
            'product': product.id,  # ID entier
            'movement_type': 'in',
            'reason': 'purchase',
            'quantity': 10,
            'unit_price': 1500.00,
            'reference': 'TEST-001',
            'notes': 'Test de débogage'
        }
        
        print(f"📤 Données de test: {json.dumps(data, indent=2)}")
        
        # Tester le serializer
        serializer = StockMovementSerializer(data=data, context={'request': request})
        
        print(f"🔍 Validation: {serializer.is_valid()}")
        
        if not serializer.is_valid():
            print(f"❌ Erreurs de validation: {serializer.errors}")
            return False
        
        print("✅ Validation réussie")
        
        # Tenter de sauvegarder
        try:
            movement = serializer.save()
            print(f"✅ Mouvement créé: {movement.id}")
            
            # Vérifier le stock mis à jour
            product.refresh_from_db()
            print(f"📊 Nouveau stock: {product.current_stock}")
            
            return True
            
        except Exception as save_error:
            print(f"❌ Erreur lors de la sauvegarde: {save_error}")
            return False
        
    except Exception as e:
        print(f"❌ Erreur générale: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_field_validation():
    """Tester la validation de chaque champ individuellement"""
    print("\n🔍 Test de validation des champs...")
    
    try:
        admin_user = User.objects.get(username='admin')
        product = Product.objects.first()
        
        factory = APIRequestFactory()
        request = factory.post('/api/inventory/movements/')
        request.user = admin_user
        
        # Test des champs un par un
        test_cases = [
            # Cas valide
            {
                'name': 'Cas valide complet',
                'data': {
                    'product': product.id,
                    'movement_type': 'in',
                    'reason': 'purchase',
                    'quantity': 10,
                    'unit_price': 1500.00,
                    'reference': 'TEST-001',
                    'notes': 'Test'
                }
            },
            # Sans unit_price
            {
                'name': 'Sans prix unitaire',
                'data': {
                    'product': product.id,
                    'movement_type': 'in',
                    'reason': 'purchase',
                    'quantity': 10,
                    'reference': 'TEST-002',
                    'notes': 'Test sans prix'
                }
            },
            # Champs minimaux
            {
                'name': 'Champs minimaux',
                'data': {
                    'product': product.id,
                    'movement_type': 'in',
                    'reason': 'purchase',
                    'quantity': 5
                }
            }
        ]
        
        for test_case in test_cases:
            print(f"\n📋 Test: {test_case['name']}")
            print(f"   Données: {test_case['data']}")
            
            serializer = StockMovementSerializer(data=test_case['data'], context={'request': request})
            
            if serializer.is_valid():
                print("   ✅ Validation réussie")
            else:
                print(f"   ❌ Erreurs: {serializer.errors}")
        
    except Exception as e:
        print(f"❌ Erreur lors du test des champs: {e}")

def check_database_constraints():
    """Vérifier les contraintes de base de données"""
    print("\n🗄️ Vérification des contraintes de base de données...")
    
    from django.db import connection
    
    try:
        with connection.cursor() as cursor:
            # Vérifier la structure de la table
            cursor.execute("PRAGMA table_info(inventory_stockmovement);")
            columns = cursor.fetchall()
            
            print("📋 Structure de la table inventory_stockmovement:")
            for col in columns:
                col_name = col[1]
                col_type = col[2]
                not_null = "NOT NULL" if col[3] else "NULL"
                default = f"DEFAULT {col[4]}" if col[4] else ""
                print(f"   {col_name}: {col_type} {not_null} {default}")
                
    except Exception as e:
        print(f"❌ Erreur lors de la vérification DB: {e}")

def main():
    """Fonction principale"""
    print("🚀 Débogage erreur 400 - StockMovement")
    print("=" * 50)
    
    # Vérifier les contraintes DB
    check_database_constraints()
    
    # Tester la validation des champs
    test_field_validation()
    
    # Tester le serializer complet
    success = test_serializer_validation()
    
    print("\n" + "=" * 50)
    print("📊 Résumé du débogage:")
    print(f"   Serializer: {'✅ OK' if success else '❌ ERREUR'}")
    
    if not success:
        print("\n💡 Suggestions de correction:")
        print("   1. Vérifiez que tous les champs requis sont fournis")
        print("   2. Vérifiez les types de données (int vs string)")
        print("   3. Vérifiez les contraintes de validation")
        print("   4. Vérifiez l'authentification de l'utilisateur")

if __name__ == '__main__':
    main()
