#!/usr/bin/env python
"""
Script de débogage détaillé pour l'erreur 400 des mouvements de stock
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
from inventory.models import StockMovement
from inventory.serializers import StockMovementSerializer
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def check_user_authentication():
    """Vérifier l'authentification utilisateur"""
    print("👤 Vérification de l'authentification utilisateur...")
    
    try:
        # Récupérer un utilisateur admin
        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            admin_user = User.objects.filter(is_superuser=True).first()
        
        if not admin_user:
            print("   ❌ Aucun utilisateur admin trouvé")
            return None
        
        print(f"   ✅ Utilisateur trouvé: {admin_user.username} (ID: {admin_user.id})")
        print(f"   📋 Rôle: {getattr(admin_user, 'role', 'N/A')}")
        print(f"   📋 Actif: {admin_user.is_active}")
        print(f"   📋 Staff: {admin_user.is_staff}")
        
        # Tester la génération de token JWT
        refresh = RefreshToken.for_user(admin_user)
        token = str(refresh.access_token)
        print(f"   ✅ Token JWT généré: {token[:50]}...")
        
        return admin_user
        
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        return None

def test_serializer_direct():
    """Tester le serializer directement"""
    print("\n🔍 Test direct du serializer...")
    
    try:
        # Récupérer les données nécessaires
        admin_user = User.objects.filter(role='admin').first() or User.objects.filter(is_superuser=True).first()
        product = Product.objects.first()
        
        if not admin_user:
            print("   ❌ Aucun utilisateur admin")
            return False
        
        if not product:
            print("   ❌ Aucun produit")
            return False
        
        print(f"   👤 Utilisateur: {admin_user.username}")
        print(f"   📦 Produit: {product.name} (Stock: {product.current_stock})")
        
        # Créer une fausse requête
        factory = APIRequestFactory()
        request = factory.post('/api/inventory/movements/')
        request.user = admin_user
        
        # Données de test
        data = {
            'product': product.id,
            'movement_type': 'in',
            'reason': 'purchase',
            'quantity': 10,
            'unit_price': 1500.00,
            'reference': 'TEST-001',
            'notes': 'Test direct serializer'
        }
        
        print(f"   📤 Données: {json.dumps(data, indent=2)}")
        
        # Tester le serializer
        serializer = StockMovementSerializer(data=data, context={'request': request})
        
        print(f"   🔍 is_valid(): {serializer.is_valid()}")
        
        if not serializer.is_valid():
            print(f"   ❌ Erreurs de validation: {serializer.errors}")
            return False
        
        # Tenter de sauvegarder
        movement = serializer.save()
        print(f"   ✅ Mouvement créé: ID {movement.id}")
        print(f"   📊 Stock après: {movement.stock_after}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_endpoint():
    """Tester l'endpoint API complet"""
    print("\n🌐 Test de l'endpoint API...")
    
    try:
        # Récupérer un utilisateur admin
        admin_user = User.objects.filter(role='admin').first() or User.objects.filter(is_superuser=True).first()
        product = Product.objects.first()
        
        if not admin_user or not product:
            print("   ❌ Données manquantes")
            return False
        
        # Créer le client API
        client = APIClient()
        
        # Authentification JWT
        refresh = RefreshToken.for_user(admin_user)
        token = str(refresh.access_token)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Données exactement comme envoyées par le frontend
        data = {
            'product': product.id,
            'movement_type': 'in',
            'reason': 'purchase',
            'quantity': 10,
            'unit_price': 1500.00,
            'reference': f'TEST-API-{product.id}',
            'notes': 'Test API endpoint'
        }
        
        print(f"   📤 POST /api/inventory/movements/")
        print(f"   📋 Authorization: Bearer {token[:30]}...")
        print(f"   📋 Data: {json.dumps(data, indent=2)}")
        
        # Requête POST
        response = client.post('/api/inventory/movements/', data, format='json')
        
        print(f"   📥 Status: {response.status_code}")
        print(f"   📥 Content: {response.content.decode()}")
        
        if response.status_code == 201:
            print("   ✅ Mouvement créé avec succès!")
            return True
        else:
            print("   ❌ Erreur lors de la création")
            try:
                error_data = response.json()
                print(f"   📄 Détails erreur: {json.dumps(error_data, indent=2)}")
            except:
                pass
            return False
            
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_model_constraints():
    """Vérifier les contraintes du modèle"""
    print("\n📋 Vérification des contraintes du modèle...")
    
    try:
        # Afficher les champs du modèle
        fields = StockMovement._meta.fields
        
        print("   📋 Champs du modèle StockMovement:")
        for field in fields:
            field_info = f"      {field.name}: {field.__class__.__name__}"
            
            if hasattr(field, 'null'):
                field_info += f" (null={field.null})"
            if hasattr(field, 'blank'):
                field_info += f" (blank={field.blank})"
            if hasattr(field, 'choices') and field.choices:
                field_info += f" (choices={len(field.choices)})"
            
            print(field_info)
        
        # Vérifier spécifiquement le champ user
        user_field = StockMovement._meta.get_field('user')
        print(f"\n   👤 Champ user:")
        print(f"      Type: {user_field.__class__.__name__}")
        print(f"      Null: {user_field.null}")
        print(f"      Blank: {user_field.blank}")
        print(f"      Related model: {user_field.related_model}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        return False

def create_test_data():
    """Créer des données de test si nécessaire"""
    print("\n🏭 Création des données de test...")
    
    try:
        # Créer un utilisateur admin si nécessaire
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@test.com',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True
            }
        )
        
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            print(f"   ✅ Utilisateur admin créé: {admin_user.username}")
        else:
            print(f"   ℹ️ Utilisateur admin existe: {admin_user.username}")
        
        # Vérifier qu'il y a des produits
        product_count = Product.objects.count()
        print(f"   📦 Produits disponibles: {product_count}")
        
        if product_count == 0:
            print("   ⚠️ Aucun produit trouvé - créez des produits d'abord")
        
        return admin_user
        
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        return None

def main():
    """Fonction principale"""
    print("🚀 Débogage Détaillé - Erreur 400 StockMovement")
    print("=" * 60)
    
    try:
        # Créer les données de test
        admin_user = create_test_data()
        
        # Vérifier les contraintes du modèle
        check_model_constraints()
        
        # Vérifier l'authentification
        auth_user = check_user_authentication()
        
        # Tester le serializer directement
        serializer_success = test_serializer_direct()
        
        # Tester l'endpoint API
        api_success = test_api_endpoint()
        
        print("\n" + "=" * 60)
        print("📊 Résumé du débogage:")
        print(f"   Authentification: {'✅ OK' if auth_user else '❌ ERREUR'}")
        print(f"   Serializer direct: {'✅ OK' if serializer_success else '❌ ERREUR'}")
        print(f"   API endpoint: {'✅ OK' if api_success else '❌ ERREUR'}")
        
        if api_success:
            print("\n🎉 L'API fonctionne correctement!")
            print("   Le problème pourrait être côté frontend ou authentification.")
        else:
            print("\n⚠️ Des problèmes ont été détectés.")
            print("   Vérifiez les logs ci-dessus pour identifier la cause.")
        
    except Exception as e:
        print(f"❌ Erreur générale: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
