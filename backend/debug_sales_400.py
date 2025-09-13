#!/usr/bin/env python
"""
Script de débogage pour l'erreur 400 sur /api/sales/14/
"""

import os
import sys
import django

# Configuration Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from sales.models import Sale, SaleItem
from accounts.models import User
from products.models import Product
from django.db import connection
from django.core.exceptions import ValidationError

def check_sale_14():
    """Vérifier l'existence et l'état de la vente 14"""
    print("🔍 Vérification de la vente 14...")
    
    try:
        sale = Sale.objects.get(id=14)
        print(f"✅ Vente 14 trouvée:")
        print(f"   - ID: {sale.id}")
        print(f"   - Référence: {sale.reference}")
        print(f"   - Status: {sale.status}")
        print(f"   - Serveur: {sale.server}")
        print(f"   - Table: {sale.table}")
        print(f"   - Total: {sale.total_amount} BIF")
        print(f"   - Créée le: {sale.created_at}")
        
        # Vérifier les items
        items = sale.items.all()
        print(f"   - Nombre d'items: {items.count()}")
        for item in items:
            print(f"     * {item.product.name} x{item.quantity} = {item.total_price} BIF")
        
        return sale
        
    except Sale.DoesNotExist:
        print("❌ Vente 14 n'existe pas dans la base de données")
        return None

def check_database_constraints():
    """Vérifier les contraintes de la base de données"""
    print("\n📋 Vérification des contraintes de la base...")
    
    with connection.cursor() as cursor:
        # Structure de la table sales_sale
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='sales_sale'")
        result = cursor.fetchone()
        if result:
            print("Structure table sales_sale:")
            print(result[0])
        
        # Vérifier les index
        cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='sales_sale'")
        indexes = cursor.fetchall()
        if indexes:
            print("\nIndex sur sales_sale:")
            for name, sql in indexes:
                print(f"  - {name}: {sql}")

def test_api_endpoint():
    """Tester l'endpoint API directement"""
    print("\n🌐 Test de l'endpoint API...")
    
    from django.test import Client
    from django.contrib.auth import get_user_model
    
    client = Client()
    
    # Test sans authentification
    response = client.get('/api/sales/14/')
    print(f"GET /api/sales/14/ (sans auth): {response.status_code}")
    if response.status_code == 400:
        try:
            print(f"Contenu de la réponse: {response.json()}")
        except:
            print(f"Contenu brut: {response.content}")
    
    # Test avec authentification si possible
    User = get_user_model()
    users = User.objects.all()[:1]
    if users:
        user = users[0]
        client.force_login(user)
        response = client.get('/api/sales/14/')
        print(f"GET /api/sales/14/ (avec auth {user.username}): {response.status_code}")
        if response.status_code == 400:
            try:
                print(f"Contenu de la réponse: {response.json()}")
            except:
                print(f"Contenu brut: {response.content}")

def check_serializer_validation():
    """Vérifier les validations du serializer"""
    print("\n🔧 Vérification des serializers...")
    
    from sales.serializers import SaleSerializer, SaleUpdateStatusSerializer
    
    sale = check_sale_14()
    if sale:
        # Test du serializer principal
        try:
            serializer = SaleSerializer(sale)
            data = serializer.data
            print("✅ SaleSerializer fonctionne correctement")
        except Exception as e:
            print(f"❌ Erreur SaleSerializer: {e}")
        
        # Test du serializer de mise à jour de statut
        try:
            update_data = {'status': 'served'}
            serializer = SaleUpdateStatusSerializer(sale, data=update_data, partial=True)
            if serializer.is_valid():
                print("✅ SaleUpdateStatusSerializer validation OK")
            else:
                print(f"❌ Erreurs de validation: {serializer.errors}")
        except Exception as e:
            print(f"❌ Erreur SaleUpdateStatusSerializer: {e}")

def main():
    """Fonction principale"""
    print("🚀 Débogage erreur 400 - /api/sales/14/")
    print("=" * 50)
    
    try:
        check_sale_14()
        check_database_constraints()
        test_api_endpoint()
        check_serializer_validation()
        
        print("\n✅ Débogage terminé")
        
    except Exception as e:
        print(f"\n❌ Erreur lors du débogage: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
