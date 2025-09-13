#!/usr/bin/env python
"""
Déboguer et corriger la création d'utilisateurs
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

def debug_user_creation():
    """
    Déboguer la création d'utilisateurs
    """
    base_url = "http://127.0.0.1:8000/api"
    
    print("🔧 DÉBOGAGE CRÉATION UTILISATEURS")
    print("=" * 50)
    
    # 1. Connexion admin
    print("\n1. 🔐 Connexion admin...")
    login_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{base_url}/accounts/login/", json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Erreur de connexion: {response.status_code}")
        print(f"Réponse: {response.text}")
        return
    
    access_token = response.json()['tokens']['access']
    headers = {'Authorization': f'Bearer {access_token}'}
    print("✅ Connexion admin réussie")
    
    # 2. Vérifier les permissions disponibles
    print("\n2. 📋 Permissions disponibles:")
    permissions_response = requests.get(f"{base_url}/accounts/permissions/", headers=headers)
    if permissions_response.status_code == 200:
        permissions = permissions_response.json().get('results', [])
        print(f"   ✅ {len(permissions)} permissions trouvées:")
        for perm in permissions[:5]:  # Afficher les 5 premières
            print(f"   - {perm['code']}: {perm['name']}")
    else:
        print(f"   ❌ Erreur permissions: {permissions_response.status_code}")
    
    # 3. Tester la création d'un utilisateur
    print("\n3. 👤 Test création utilisateur...")
    
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "first_name": "Test",
        "last_name": "User",
        "role": "cashier",
        "phone": "123456789",
        "address": "Test Address",
        "is_active": True,
        "password": "testpass123",
        "permissions": ["view_products", "create_sales"]  # Permissions de base
    }
    
    print(f"   📤 Données envoyées:")
    print(f"   {json.dumps(user_data, indent=2)}")
    
    response = requests.post(f"{base_url}/accounts/users/", json=user_data, headers=headers)
    
    print(f"\n   📥 Réponse serveur:")
    print(f"   Status: {response.status_code}")
    print(f"   Headers: {dict(response.headers)}")
    
    if response.status_code == 201:
        user = response.json()
        print(f"   ✅ Utilisateur créé avec succès:")
        print(f"   - ID: {user['id']}")
        print(f"   - Username: {user['username']}")
        print(f"   - Role: {user['role']}")
    else:
        print(f"   ❌ Erreur création utilisateur:")
        try:
            error_data = response.json()
            print(f"   Erreurs: {json.dumps(error_data, indent=2)}")
        except:
            print(f"   Réponse brute: {response.text}")
    
    # 4. Vérifier l'utilisateur admin actuel
    print("\n4. 👑 Vérification utilisateur admin:")
    profile_response = requests.get(f"{base_url}/accounts/profile/", headers=headers)
    if profile_response.status_code == 200:
        profile = profile_response.json()
        print(f"   ✅ Utilisateur connecté:")
        print(f"   - Username: {profile['username']}")
        print(f"   - Role: {profile['role']}")
        print(f"   - Is Admin: {profile.get('is_admin', False)}")
        print(f"   - Is Manager: {profile.get('is_manager', False)}")
    else:
        print(f"   ❌ Erreur profil: {profile_response.status_code}")
    
    # 5. Lister les utilisateurs existants
    print("\n5. 👥 Utilisateurs existants:")
    users_response = requests.get(f"{base_url}/accounts/users/", headers=headers)
    if users_response.status_code == 200:
        users = users_response.json().get('results', [])
        print(f"   ✅ {len(users)} utilisateurs trouvés:")
        for user in users:
            print(f"   - {user['username']} ({user['role']}) - Actif: {user['is_active']}")
    else:
        print(f"   ❌ Erreur liste utilisateurs: {users_response.status_code}")

def create_test_permissions():
    """
    Créer des permissions de test si elles n'existent pas
    """
    from accounts.models import Permission
    
    print("\n📋 Création permissions de test...")
    
    test_permissions = [
        {"code": "view_products", "name": "Voir les produits", "description": "Permission de voir les produits"},
        {"code": "create_sales", "name": "Créer des ventes", "description": "Permission de créer des ventes"},
        {"code": "view_reports", "name": "Voir les rapports", "description": "Permission de voir les rapports"},
        {"code": "manage_kitchen", "name": "Gérer la cuisine", "description": "Permission de gérer la cuisine"},
    ]
    
    created_count = 0
    for perm_data in test_permissions:
        permission, created = Permission.objects.get_or_create(
            code=perm_data["code"],
            defaults={
                "name": perm_data["name"],
                "description": perm_data["description"],
                "is_active": True
            }
        )
        if created:
            created_count += 1
            print(f"   ✅ Permission créée: {permission.code}")
        else:
            print(f"   ℹ️ Permission existe: {permission.code}")
    
    print(f"   🎯 {created_count} nouvelles permissions créées")

if __name__ == '__main__':
    # Créer les permissions de test d'abord
    create_test_permissions()
    
    # Puis tester la création d'utilisateur
    debug_user_creation()
    
    print("\n" + "="*50)
    print("🎯 SOLUTIONS POSSIBLES")
    print("="*50)
    
    print("\n✅ SI L'ERREUR PERSISTE:")
    print("   1. Vérifiez que l'utilisateur admin est bien connecté")
    print("   2. Vérifiez que les permissions existent dans la base")
    print("   3. Vérifiez les champs requis dans le formulaire")
    print("   4. Vérifiez les validations du serializer")
    
    print("\n🔧 CHAMPS REQUIS POUR CRÉER UN UTILISATEUR:")
    print("   - username (obligatoire, unique)")
    print("   - email (obligatoire, unique)")
    print("   - password (obligatoire, min 8 caractères)")
    print("   - first_name (optionnel)")
    print("   - last_name (optionnel)")
    print("   - role (obligatoire: admin, manager, cashier, waiter)")
    print("   - permissions (optionnel: liste de codes de permissions)")
    
    print("\n🚀 TESTEZ MAINTENANT:")
    print("   Interface: http://localhost:8081/users")
    print("   Avec les données de test ci-dessus")
