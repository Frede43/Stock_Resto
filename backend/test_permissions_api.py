#!/usr/bin/env python
"""
Test rapide de l'API des permissions
"""

import os
import sys
import django
import requests
import json

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

def test_api():
    """
    Test des endpoints de l'API
    """
    base_url = "http://127.0.0.1:8000/api"
    
    print("🧪 Test de l'API des permissions...")
    
    # 1. Test de connexion admin
    print("\n1. Test de connexion admin...")
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    response = requests.post(f"{base_url}/accounts/login/", json=login_data)
    if response.status_code == 200:
        print("✅ Connexion admin réussie")
        data = response.json()
        access_token = data['tokens']['access']
        headers = {'Authorization': f'Bearer {access_token}'}
    else:
        print(f"❌ Erreur de connexion: {response.status_code}")
        print(response.text)
        return
    
    # 2. Test de récupération des utilisateurs
    print("\n2. Test de récupération des utilisateurs...")
    response = requests.get(f"{base_url}/accounts/users/", headers=headers)
    if response.status_code == 200:
        print("✅ Récupération des utilisateurs réussie")
        users = response.json()
        print(f"   Nombre d'utilisateurs: {users.get('count', 0)}")
    else:
        print(f"❌ Erreur récupération utilisateurs: {response.status_code}")
        print(response.text)
    
    # 3. Test de récupération des permissions
    print("\n3. Test de récupération des permissions...")
    response = requests.get(f"{base_url}/accounts/permissions/list/", headers=headers)
    if response.status_code == 200:
        print("✅ Récupération des permissions réussie")
        permissions = response.json()
        print(f"   Structure de la réponse: {type(permissions)}")
        print(f"   Contenu: {permissions}")
        if isinstance(permissions, list) and permissions:
            print(f"   Nombre de permissions: {len(permissions)}")
            print(f"   Première permission: {permissions[0]['name']}")
        elif isinstance(permissions, dict):
            print(f"   Réponse est un dictionnaire avec clés: {list(permissions.keys())}")
        else:
            print("   Aucune permission trouvée")
    else:
        print(f"❌ Erreur récupération permissions: {response.status_code}")
        print(response.text)
    
    # 4. Test de vérification des permissions utilisateur
    print("\n4. Test de vérification des permissions utilisateur...")
    response = requests.get(f"{base_url}/accounts/permissions/", headers=headers)
    if response.status_code == 200:
        print("✅ Vérification des permissions réussie")
        user_permissions = response.json()
        print(f"   Rôle: {user_permissions.get('role')}")
        print(f"   Nombre de permissions: {len(user_permissions.get('permissions', {}))}")
    else:
        print(f"❌ Erreur vérification permissions: {response.status_code}")
        print(response.text)
    
    # 5. Test de création d'utilisateur admin
    print("\n5. Test de création d'utilisateur admin...")
    new_user_data = {
        "username": "test_admin_user",
        "email": "testadmin@api.com",
        "first_name": "Test",
        "last_name": "Admin",
        "role": "admin",
        "password": "testpass123",
        "permissions": []  # Admin n'a pas besoin de permissions spécifiques
    }
    
    response = requests.post(f"{base_url}/accounts/users/", json=new_user_data, headers=headers)
    if response.status_code == 201:
        print("✅ Création d'utilisateur réussie")
        new_user = response.json()
        print(f"   Utilisateur créé: {new_user.get('username')}")
        user_id = new_user.get('id')
        
        # Test de connexion avec le nouvel utilisateur admin
        print("\n6. Test de connexion avec le nouvel utilisateur admin...")
        login_data_new = {
            "username": "test_admin_user",
            "password": "testpass123"
        }
        
        response = requests.post(f"{base_url}/accounts/login/", json=login_data_new)
        if response.status_code == 200:
            print("✅ Connexion nouvel utilisateur réussie")
            data = response.json()
            new_access_token = data['tokens']['access']
            new_headers = {'Authorization': f'Bearer {new_access_token}'}
            
            # Test des permissions du nouvel utilisateur
            response = requests.get(f"{base_url}/accounts/permissions/", headers=new_headers)
            if response.status_code == 200:
                print("✅ Vérification permissions nouvel utilisateur réussie")
                permissions = response.json()
                print(f"   Rôle: {permissions.get('role')}")
            else:
                print(f"❌ Erreur permissions nouvel utilisateur: {response.status_code}")
        else:
            print(f"❌ Erreur connexion nouvel utilisateur: {response.status_code}")
            
    else:
        print(f"❌ Erreur création utilisateur: {response.status_code}")
        print(response.text)
    
    print("\n🎉 Tests terminés!")

if __name__ == '__main__':
    test_api()
