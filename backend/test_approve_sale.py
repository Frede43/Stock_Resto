#!/usr/bin/env python
"""
Script de test pour l'approbation de vente (pending vers completed)
"""

import os
import sys
import django

# Configuration Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from sales.models import Sale
from sales.serializers import SaleUpdateStatusSerializer
from django.test import Client
import json

def test_approve_sale():
    """Tester l'approbation d'une vente"""
    print("🧪 Test d'approbation de la vente 14...")
    
    try:
        # Vérifier que la vente existe
        sale = Sale.objects.get(id=14)
        print(f"✅ Vente trouvée: {sale.id} - Status: {sale.status}")
        
        # Test du serializer directement
        print("\n🔧 Test du serializer SaleUpdateStatusSerializer...")
        data = {'status': 'completed'}
        serializer = SaleUpdateStatusSerializer(sale, data=data, partial=True)
        
        if serializer.is_valid():
            print("✅ Serializer validation OK")
            updated_sale = serializer.save()
            print(f"✅ Vente mise à jour: Status = {updated_sale.status}")
        else:
            print(f"❌ Erreurs de validation du serializer: {serializer.errors}")
            return
        
        # Test de l'endpoint API
        print("\n🌐 Test de l'endpoint PATCH /api/sales/14/...")
        client = Client()
        
        response = client.patch(
            '/api/sales/14/',
            data=json.dumps({'status': 'completed'}),
            content_type='application/json'
        )
        
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Endpoint PATCH fonctionne")
            try:
                response_data = response.json()
                print(f"Réponse: {response_data}")
            except:
                print(f"Contenu brut: {response.content}")
        else:
            print(f"❌ Erreur endpoint: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Erreur: {error_data}")
            except:
                print(f"Contenu brut: {response.content}")
        
    except Sale.DoesNotExist:
        print("❌ Vente 14 n'existe pas")
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_approve_sale()
