#!/usr/bin/env python
"""
Script de test pour l'API des paramètres avec authentification
"""

import requests
import json

def test_settings_with_auth():
    """Test de l'API des paramètres avec authentification JWT"""
    
    print("🔍 Test de l'API des paramètres avec authentification...")
    
    # 1. Se connecter pour obtenir un token
    print("\n1. Connexion pour obtenir un token...")
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post('http://127.0.0.1:8000/api/accounts/login/', json=login_data)
        print(f"   Login status: {response.status_code}")
        
        if response.status_code == 200:
            auth_data = response.json()
            access_token = auth_data['tokens']['access']
            user_info = auth_data['user']
            print(f"✅ Connexion réussie - User: {user_info['username']}, Role: {user_info['role']}")
            print(f"   Token: {access_token[:50]}...")
        else:
            print(f"❌ Échec de connexion: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        return False
    
    # 2. Test GET avec authentification
    print("\n2. Test GET avec authentification...")
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get('http://127.0.0.1:8000/api/settings/', headers=headers)
        print(f"   GET status: {response.status_code}")
        if response.status_code == 200:
            print("✅ GET avec auth réussi")
        else:
            print(f"❌ GET avec auth échoué: {response.text}")
    except Exception as e:
        print(f"❌ Erreur GET: {e}")
    
    # 3. Test PATCH avec authentification
    print("\n3. Test PATCH avec authentification...")
    test_data = {
        "restaurant": {
            "name": "Test Restaurant Auth Updated"
        },
        "notifications": {
            "email_enabled": True
        }
    }
    
    try:
        response = requests.patch(
            'http://127.0.0.1:8000/api/settings/system/',
            json=test_data,
            headers=headers
        )
        print(f"   PATCH status: {response.status_code}")
        if response.status_code == 200:
            print("✅ PATCH avec auth réussi")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ PATCH avec auth échoué: {response.text}")
    except Exception as e:
        print(f"❌ Erreur PATCH: {e}")
    
    return True

if __name__ == '__main__':
    test_settings_with_auth()
