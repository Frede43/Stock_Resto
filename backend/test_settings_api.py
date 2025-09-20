#!/usr/bin/env python
"""
Script de test pour l'API des paramètres système
"""

import os
import sys
import django
import requests
import json

# Configuration de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from settings.models import SystemSettings, UserPreferences, SystemInfo

def test_settings_api():
    """Test de l'API des paramètres"""
    
    print("🔍 Test de l'API des paramètres système...")
    
    try:
        # 1. Test du modèle SystemSettings
        print("\n1. Test du modèle SystemSettings...")
        settings = SystemSettings.get_settings()
        print(f"✅ Paramètres système récupérés: {settings}")
        print(f"   - Restaurant: {settings.restaurant_name}")
        print(f"   - Email notifications: {settings.email_notifications_enabled}")
        print(f"   - Auto print: {settings.auto_print_receipts}")
        
        # 2. Test de l'API GET
        print("\n2. Test de l'API GET /api/settings/...")
        try:
            response = requests.get('http://127.0.0.1:8000/api/settings/')
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Données reçues: {json.dumps(data, indent=2)}")
            else:
                print(f"❌ Erreur: {response.text}")
        except requests.exceptions.ConnectionError:
            print("❌ Impossible de se connecter au serveur Django")
            return False
        
        # 3. Test de l'API PATCH
        print("\n3. Test de l'API PATCH /api/settings/system/...")
        test_data = {
            "restaurant": {
                "name": "Test Restaurant Updated"
            },
            "notifications": {
                "email_enabled": True
            }
        }
        
        try:
            response = requests.patch(
                'http://127.0.0.1:8000/api/settings/system/',
                json=test_data,
                headers={'Content-Type': 'application/json'}
            )
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
        except Exception as e:
            print(f"❌ Erreur lors du PATCH: {e}")
        
        # 4. Vérifier les données dans la base
        print("\n4. Vérification des données en base...")
        settings.refresh_from_db()
        print(f"   Restaurant name: {settings.restaurant_name}")
        print(f"   Email enabled: {settings.email_notifications_enabled}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_frontend_connection():
    """Test de la connexion frontend"""
    print("\n🌐 Test de la connexion frontend...")
    
    # Test CORS
    try:
        response = requests.options('http://127.0.0.1:8000/api/settings/')
        print(f"OPTIONS request status: {response.status_code}")
        print(f"CORS headers: {dict(response.headers)}")
    except Exception as e:
        print(f"❌ Erreur CORS: {e}")

if __name__ == '__main__':
    success = test_settings_api()
    test_frontend_connection()
    
    if success:
        print("\n🎉 Tests terminés avec succès!")
    else:
        print("\n❌ Des erreurs ont été détectées.")
