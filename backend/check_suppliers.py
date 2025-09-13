#!/usr/bin/env python
"""
Script pour vérifier et créer des fournisseurs de test
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from suppliers.models import Supplier
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def check_suppliers_in_db():
    """Vérifier les fournisseurs en base de données"""
    print("🔍 Vérification des fournisseurs en base...")
    
    suppliers = Supplier.objects.all()
    print(f"📊 Nombre de fournisseurs: {suppliers.count()}")
    
    if suppliers.exists():
        print("📋 Liste des fournisseurs:")
        for supplier in suppliers:
            status = "✅ Actif" if supplier.is_active else "❌ Inactif"
            print(f"   - {supplier.name} ({supplier.contact_person}) - {status}")
    else:
        print("⚠️ Aucun fournisseur trouvé en base de données")
    
    return suppliers

def create_test_suppliers():
    """Créer des fournisseurs de test"""
    print("\n🏭 Création des fournisseurs de test...")
    
    suppliers_data = [
        {
            'name': 'Brarudi SA',
            'contact_person': 'Jean Ndayishimiye',
            'phone': '+257 22 22 22 22',
            'email': 'contact@brarudi.bi',
            'address': 'Avenue de l\'Industrie, Bujumbura',
            'city': 'Bujumbura',
            'country': 'Burundi',
            'is_active': True
        },
        {
            'name': 'Distributeur Liqueurs BDI',
            'contact_person': 'Marie Nzeyimana',
            'phone': '+257 33 33 33 33',
            'email': 'marie@liqueurs.bi',
            'address': 'Quartier Rohero, Bujumbura',
            'city': 'Bujumbura',
            'country': 'Burundi',
            'is_active': True
        },
        {
            'name': 'Sodas & Boissons Co',
            'contact_person': 'Pierre Hakizimana',
            'phone': '+257 44 44 44 44',
            'email': 'pierre@sodas.bi',
            'address': 'Zone Industrielle, Bujumbura',
            'city': 'Bujumbura',
            'country': 'Burundi',
            'is_active': True
        },
        {
            'name': 'Fournisseur Alimentaire',
            'contact_person': 'Alice Uwimana',
            'phone': '+257 55 55 55 55',
            'email': 'alice@alimentaire.bi',
            'address': 'Marché Central, Bujumbura',
            'city': 'Bujumbura',
            'country': 'Burundi',
            'is_active': True
        }
    ]
    
    created_suppliers = []
    for supplier_data in suppliers_data:
        supplier, created = Supplier.objects.get_or_create(
            name=supplier_data['name'],
            defaults=supplier_data
        )
        created_suppliers.append(supplier)
        status = "✅ Créé" if created else "ℹ️ Existe"
        print(f"   {status}: {supplier.name}")
    
    return created_suppliers

def test_suppliers_api():
    """Tester l'API des fournisseurs"""
    print("\n🧪 Test de l'API fournisseurs...")
    
    try:
        # Récupérer un utilisateur admin
        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            admin_user = User.objects.filter(is_superuser=True).first()
        
        if not admin_user:
            print("❌ Aucun utilisateur admin trouvé")
            return False
        
        print(f"👤 Utilisateur de test: {admin_user.username}")
        
        # Préparer le client API
        client = APIClient()
        
        # Authentification
        refresh = RefreshToken.for_user(admin_user)
        token = str(refresh.access_token)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test GET /api/suppliers/
        print("📡 Test GET /api/suppliers/")
        response = client.get('/api/suppliers/')
        
        print(f"   📥 Statut: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Gérer les réponses paginées et non paginées
            if isinstance(data, dict) and 'results' in data:
                suppliers_count = len(data['results'])
                suppliers_list = data['results']
            elif isinstance(data, list):
                suppliers_count = len(data)
                suppliers_list = data
            else:
                suppliers_count = 0
                suppliers_list = []
            
            print(f"   ✅ Succès: {suppliers_count} fournisseur(s) récupéré(s)")
            
            if suppliers_list:
                print("   📋 Fournisseurs récupérés:")
                for supplier in suppliers_list[:3]:  # Afficher les 3 premiers
                    print(f"      - {supplier.get('name', 'N/A')} (ID: {supplier.get('id', 'N/A')})")
            
            return True
        else:
            print(f"   ❌ Erreur: {response.content.decode()}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test API: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_frontend_format():
    """Tester le format attendu par le frontend"""
    print("\n🎨 Test du format frontend...")
    
    try:
        admin_user = User.objects.filter(role='admin').first() or User.objects.filter(is_superuser=True).first()
        if not admin_user:
            print("❌ Aucun utilisateur admin trouvé")
            return
        
        client = APIClient()
        refresh = RefreshToken.for_user(admin_user)
        token = str(refresh.access_token)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = client.get('/api/suppliers/')
        
        if response.status_code == 200:
            data = response.json()
            print(f"📋 Format de réponse: {type(data)}")
            
            if isinstance(data, dict):
                print(f"   Clés disponibles: {list(data.keys())}")
                if 'results' in data:
                    print(f"   Nombre de résultats: {len(data['results'])}")
                    if data['results']:
                        first_supplier = data['results'][0]
                        print(f"   Champs du premier fournisseur: {list(first_supplier.keys())}")
            elif isinstance(data, list):
                print(f"   Liste directe avec {len(data)} éléments")
                if data:
                    first_supplier = data[0]
                    print(f"   Champs du premier fournisseur: {list(first_supplier.keys())}")
        
    except Exception as e:
        print(f"❌ Erreur lors du test format: {e}")

def main():
    """Fonction principale"""
    print("🔧 Vérification des Fournisseurs BarStockWise")
    print("=" * 50)
    
    try:
        # Vérifier les fournisseurs existants
        existing_suppliers = check_suppliers_in_db()
        
        # Créer des fournisseurs de test si nécessaire
        if not existing_suppliers.exists():
            created_suppliers = create_test_suppliers()
        else:
            print("\n✅ Des fournisseurs existent déjà")
        
        # Tester l'API
        api_success = test_suppliers_api()
        
        # Tester le format frontend
        test_frontend_format()
        
        print("\n" + "=" * 50)
        print("📊 Résumé de la vérification:")
        print(f"   Fournisseurs en base: ✅ {Supplier.objects.count()}")
        print(f"   API fonctionnelle: {'✅ OK' if api_success else '❌ ERREUR'}")
        
        if api_success:
            print("\n🎉 Les fournisseurs sont correctement configurés !")
            print("   Ils devraient maintenant apparaître dans le formulaire d'approvisionnement.")
        else:
            print("\n⚠️ Des problèmes ont été détectés avec l'API fournisseurs.")
            print("   Vérifiez les logs Django pour plus de détails.")
        
    except Exception as e:
        print(f"❌ Erreur générale: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
