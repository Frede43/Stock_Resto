#!/usr/bin/env python
"""
Script pour diagnostiquer l'erreur 500 de l'API suppliers
"""

import os
import sys
import django
import traceback

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from suppliers.models import Supplier
from suppliers.serializers import SupplierSerializer
from suppliers.views import SupplierViewSet
from rest_framework.test import APIRequestFactory, APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.test import TestCase

User = get_user_model()

def check_suppliers_model():
    """Vérifier le modèle Supplier"""
    print("🔍 Vérification du modèle Supplier...")
    
    try:
        # Vérifier que le modèle peut être importé
        print(f"   ✅ Modèle importé: {Supplier}")
        
        # Vérifier les champs du modèle
        fields = [field.name for field in Supplier._meta.fields]
        print(f"   📋 Champs disponibles: {fields}")
        
        # Compter les fournisseurs
        count = Supplier.objects.count()
        print(f"   📊 Nombre de fournisseurs: {count}")
        
        # Tester une requête simple
        suppliers = Supplier.objects.all()[:3]
        print(f"   📋 Premiers fournisseurs:")
        for supplier in suppliers:
            print(f"      - {supplier.name} (ID: {supplier.id})")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Erreur modèle: {e}")
        traceback.print_exc()
        return False

def check_suppliers_serializer():
    """Vérifier le serializer Supplier"""
    print("\n🔍 Vérification du serializer Supplier...")
    
    try:
        # Tester le serializer avec des données existantes
        suppliers = Supplier.objects.all()[:1]
        
        if suppliers:
            supplier = suppliers[0]
            serializer = SupplierSerializer(supplier)
            data = serializer.data
            print(f"   ✅ Serializer fonctionne")
            print(f"   📋 Données sérialisées: {list(data.keys())}")
            print(f"   📄 Exemple: {data}")
        else:
            print("   ⚠️ Aucun fournisseur pour tester le serializer")
            
        return True
        
    except Exception as e:
        print(f"   ❌ Erreur serializer: {e}")
        traceback.print_exc()
        return False

def check_suppliers_view():
    """Vérifier la vue SupplierViewSet"""
    print("\n🔍 Vérification de la vue SupplierViewSet...")
    
    try:
        # Créer une requête factice
        factory = APIRequestFactory()
        request = factory.get('/api/suppliers/')
        
        # Créer un utilisateur admin pour le test
        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            admin_user = User.objects.filter(is_superuser=True).first()
        
        if not admin_user:
            print("   ❌ Aucun utilisateur admin trouvé")
            return False
        
        request.user = admin_user
        
        # Tester la vue
        view = SupplierViewSet()
        view.setup(request)
        
        # Tester get_queryset
        queryset = view.get_queryset()
        print(f"   ✅ get_queryset fonctionne: {queryset.count()} fournisseurs")
        
        # Tester list
        response = view.list(request)
        print(f"   ✅ list fonctionne: status {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Erreur vue: {e}")
        traceback.print_exc()
        return False

def check_suppliers_api_direct():
    """Tester l'API directement"""
    print("\n🔍 Test direct de l'API suppliers...")
    
    try:
        # Récupérer un utilisateur admin
        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            admin_user = User.objects.filter(is_superuser=True).first()
        
        if not admin_user:
            print("   ❌ Aucun utilisateur admin trouvé")
            return False
        
        print(f"   👤 Utilisateur de test: {admin_user.username}")
        
        # Créer le client API
        client = APIClient()
        
        # Authentification JWT
        refresh = RefreshToken.for_user(admin_user)
        token = str(refresh.access_token)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test GET /api/suppliers/
        print("   📡 Test GET /api/suppliers/")
        response = client.get('/api/suppliers/')
        
        print(f"   📥 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Succès!")
            print(f"   📋 Type de réponse: {type(data)}")
            
            if isinstance(data, dict) and 'results' in data:
                print(f"   📊 Réponse paginée: {len(data['results'])} résultats")
            elif isinstance(data, list):
                print(f"   📊 Liste directe: {len(data)} éléments")
            
            return True
        else:
            print(f"   ❌ Erreur HTTP: {response.status_code}")
            print(f"   📄 Contenu: {response.content.decode()}")
            return False
            
    except Exception as e:
        print(f"   ❌ Erreur API: {e}")
        traceback.print_exc()
        return False

def check_database_tables():
    """Vérifier les tables de base de données"""
    print("\n🗄️ Vérification des tables de base de données...")
    
    try:
        from django.db import connection
        
        with connection.cursor() as cursor:
            # Vérifier que la table suppliers_supplier existe
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name LIKE '%supplier%';
            """)
            tables = cursor.fetchall()
            
            print(f"   📋 Tables suppliers trouvées: {[table[0] for table in tables]}")
            
            if tables:
                # Vérifier la structure de la table principale
                table_name = 'suppliers_supplier'
                cursor.execute(f"PRAGMA table_info({table_name});")
                columns = cursor.fetchall()
                
                print(f"   📋 Structure de {table_name}:")
                for col in columns:
                    col_name = col[1]
                    col_type = col[2]
                    not_null = "NOT NULL" if col[3] else "NULL"
                    print(f"      {col_name}: {col_type} {not_null}")
                
                # Compter les enregistrements
                cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
                count = cursor.fetchone()[0]
                print(f"   📊 Nombre d'enregistrements: {count}")
                
                return True
            else:
                print("   ❌ Aucune table supplier trouvée")
                return False
                
    except Exception as e:
        print(f"   ❌ Erreur base de données: {e}")
        traceback.print_exc()
        return False

def check_migrations():
    """Vérifier les migrations"""
    print("\n🔄 Vérification des migrations...")
    
    try:
        from django.db.migrations.executor import MigrationExecutor
        from django.db import connection
        
        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        
        if plan:
            print("   ⚠️ Migrations en attente:")
            for migration, backwards in plan:
                print(f"      - {migration}")
            return False
        else:
            print("   ✅ Toutes les migrations sont appliquées")
            return True
            
    except Exception as e:
        print(f"   ❌ Erreur migrations: {e}")
        traceback.print_exc()
        return False

def create_test_supplier():
    """Créer un fournisseur de test"""
    print("\n🏭 Création d'un fournisseur de test...")
    
    try:
        supplier_data = {
            'name': 'Test Supplier',
            'contact_person': 'Test Contact',
            'phone': '+257 11 11 11 11',
            'email': 'test@supplier.bi',
            'address': 'Test Address',
            'city': 'Bujumbura',
            'country': 'Burundi',
            'is_active': True
        }
        
        supplier, created = Supplier.objects.get_or_create(
            name='Test Supplier',
            defaults=supplier_data
        )
        
        status = "✅ Créé" if created else "ℹ️ Existe"
        print(f"   {status}: {supplier.name} (ID: {supplier.id})")
        
        return supplier
        
    except Exception as e:
        print(f"   ❌ Erreur création: {e}")
        traceback.print_exc()
        return None

def main():
    """Fonction principale"""
    print("🚀 Diagnostic Erreur 500 - API Suppliers")
    print("=" * 50)
    
    results = {}
    
    try:
        # Vérifications étape par étape
        results['migrations'] = check_migrations()
        results['database'] = check_database_tables()
        results['model'] = check_suppliers_model()
        results['serializer'] = check_suppliers_serializer()
        results['view'] = check_suppliers_view()
        results['api'] = check_suppliers_api_direct()
        
        # Créer un fournisseur de test si nécessaire
        if Supplier.objects.count() == 0:
            test_supplier = create_test_supplier()
            if test_supplier:
                # Re-tester l'API avec des données
                print("\n🔄 Re-test de l'API avec données...")
                results['api_with_data'] = check_suppliers_api_direct()
        
        print("\n" + "=" * 50)
        print("📊 Résumé du diagnostic:")
        for check, success in results.items():
            status = "✅ OK" if success else "❌ ERREUR"
            print(f"   {check.capitalize()}: {status}")
        
        # Recommandations
        print("\n💡 Recommandations:")
        if not results.get('migrations', True):
            print("   1. Appliquez les migrations: python manage.py migrate")
        if not results.get('database', True):
            print("   2. Vérifiez la configuration de la base de données")
        if not results.get('model', True):
            print("   3. Vérifiez le modèle Supplier")
        if not results.get('api', True):
            print("   4. Vérifiez les permissions et l'authentification")
        
        if all(results.values()):
            print("\n🎉 Tous les tests sont passés !")
            print("   L'erreur 500 pourrait être temporaire ou liée à l'environnement.")
        else:
            print("\n⚠️ Des problèmes ont été détectés.")
            print("   Corrigez les erreurs ci-dessus et relancez le diagnostic.")
        
    except Exception as e:
        print(f"❌ Erreur générale du diagnostic: {e}")
        traceback.print_exc()

if __name__ == '__main__':
    main()
