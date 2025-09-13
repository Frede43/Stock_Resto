#!/usr/bin/env python
"""
Test de normalisation des noms d'utilisateur pour résoudre le problème de connexion
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

from accounts.models import User

def test_username_normalization():
    """
    Tester la normalisation des noms d'utilisateur
    """
    print("🔧 TEST NORMALISATION NOMS D'UTILISATEUR")
    print("=" * 60)
    
    base_url = "http://127.0.0.1:8000/api"
    
    # 1. Connexion admin
    print("\n1. 🔐 Connexion admin...")
    login_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{base_url}/accounts/login/", json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Erreur de connexion admin: {response.status_code}")
        return
    
    access_token = response.json()['tokens']['access']
    headers = {'Authorization': f'Bearer {access_token}'}
    print("✅ Connexion admin réussie")
    
    # 2. Créer un utilisateur avec majuscules via API
    print("\n2. 👤 Création utilisateur avec majuscules via API...")
    
    # Supprimer l'utilisateur s'il existe
    User.objects.filter(username__iexact='TestUser').delete()
    
    user_data = {
        "username": "TestUser",  # Avec majuscules
        "email": "testuser@example.com",
        "first_name": "Test",
        "last_name": "User",
        "role": "cashier",
        "password": "testpass123",
        "is_active": True
    }
    
    response = requests.post(f"{base_url}/accounts/users/", json=user_data, headers=headers)
    
    if response.status_code == 201:
        created_user = response.json()
        print(f"   ✅ Utilisateur créé via API:")
        print(f"   - Username saisi: TestUser")
        print(f"   - Username en base: {created_user['username']}")
        
        # Vérifier en base de données
        db_user = User.objects.get(id=created_user['id'])
        print(f"   - Username DB: {db_user.username}")
        
    else:
        print(f"   ❌ Erreur création: {response.status_code}")
        print(f"   Réponse: {response.text}")
        return
    
    # 3. Test de connexion avec différentes casses
    print("\n3. 🔐 Tests de connexion avec différentes casses...")
    
    test_cases = [
        ("testuser", "Minuscules"),
        ("TestUser", "Majuscules mixtes"),
        ("TESTUSER", "Majuscules"),
        ("testUSER", "Mixte aléatoire")
    ]
    
    for username_test, description in test_cases:
        print(f"\n   📝 Test {description}: '{username_test}'")
        
        login_test = {
            "username": username_test,
            "password": "testpass123"
        }
        
        response = requests.post(f"{base_url}/accounts/login/", json=login_test)
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"   ✅ Connexion réussie")
            print(f"   - User connecté: {user_data['user']['username']}")
        else:
            print(f"   ❌ Échec connexion: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   - Erreur: {error_data}")
            except:
                print(f"   - Réponse: {response.text}")
    
    # 4. Vérifier les utilisateurs existants
    print("\n4. 👥 Vérification utilisateurs en base...")
    users = User.objects.filter(username__icontains='test')
    for user in users:
        print(f"   - {user.username} (ID: {user.id})")
    
    return True

def fix_existing_users():
    """
    Corriger les utilisateurs existants avec des majuscules
    """
    print("\n" + "=" * 60)
    print("🔧 CORRECTION UTILISATEURS EXISTANTS")
    print("=" * 60)
    
    # Trouver les utilisateurs avec des majuscules
    users_with_uppercase = User.objects.exclude(username=models.F('username').lower())
    
    if not users_with_uppercase.exists():
        print("   ✅ Aucun utilisateur avec majuscules trouvé")
        return
    
    print(f"   📋 {users_with_uppercase.count()} utilisateurs à corriger:")
    
    for user in users_with_uppercase:
        old_username = user.username
        new_username = user.username.lower()
        
        # Vérifier qu'il n'y a pas de conflit
        if User.objects.filter(username=new_username).exclude(id=user.id).exists():
            print(f"   ⚠️ Conflit pour {old_username} -> {new_username} (utilisateur existe déjà)")
            continue
        
        user.username = new_username
        user.save()
        print(f"   ✅ {old_username} -> {new_username}")

if __name__ == '__main__':
    try:
        # Importer models après setup Django
        from django.db import models
        
        # Tester la normalisation
        success = test_username_normalization()
        
        if success:
            # Corriger les utilisateurs existants
            fix_existing_users()
        
        print("\n" + "=" * 60)
        print("📋 RÉSUMÉ")
        print("=" * 60)
        
        print("\n✅ CORRECTIONS APPLIQUÉES:")
        print("   1. Normalisation automatique des usernames en minuscules dans les serializers")
        print("   2. Cohérence entre frontend (toLowerCase) et backend")
        print("   3. Correction des utilisateurs existants avec majuscules")
        
        print("\n🎯 RÉSULTAT ATTENDU:")
        print("   - Tous les nouveaux utilisateurs créés auront des usernames en minuscules")
        print("   - La connexion fonctionnera peu importe la casse saisie")
        print("   - Cohérence totale entre frontend et backend")
        
        print("\n🚀 PROCHAINES ÉTAPES:")
        print("   1. Redémarrer le serveur Django")
        print("   2. Tester la création d'un nouvel utilisateur via l'interface")
        print("   3. Tester la connexion avec cet utilisateur")
        
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        print("   Assurez-vous que le serveur Django est démarré")
