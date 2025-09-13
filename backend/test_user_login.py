#!/usr/bin/env python
"""
Test de connexion pour diagnostiquer le problème des utilisateurs créés par l'admin
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

from django.contrib.auth import authenticate
from accounts.models import User

def test_user_authentication():
    """
    Tester l'authentification des utilisateurs créés
    """
    print("🔍 DIAGNOSTIC AUTHENTIFICATION UTILISATEURS")
    print("=" * 60)
    
    # 1. Créer un utilisateur de test directement en base
    print("\n1. 👤 Création utilisateur de test en base...")
    
    # Supprimer l'utilisateur s'il existe déjà
    User.objects.filter(username='testuser').delete()
    
    # Créer l'utilisateur avec la méthode Django
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        role='cashier'
    )
    print(f"   ✅ Utilisateur créé: {user.username}")
    print(f"   - ID: {user.id}")
    print(f"   - Email: {user.email}")
    print(f"   - Role: {user.role}")
    print(f"   - Is Active: {user.is_active}")
    print(f"   - Password Hash: {user.password[:20]}...")
    
    # 2. Tester l'authentification Django
    print("\n2. 🔐 Test authentification Django...")
    auth_user = authenticate(username='testuser', password='testpass123')
    if auth_user:
        print(f"   ✅ Authentification Django réussie: {auth_user.username}")
    else:
        print("   ❌ Échec authentification Django")
    
    # 3. Tester avec un mauvais mot de passe
    print("\n3. 🚫 Test avec mauvais mot de passe...")
    bad_auth = authenticate(username='testuser', password='wrongpass')
    if bad_auth:
        print("   ❌ PROBLÈME: Authentification réussie avec mauvais mot de passe!")
    else:
        print("   ✅ Authentification échouée comme attendu")
    
    # 4. Vérifier le hachage du mot de passe
    print("\n4. 🔒 Vérification hachage mot de passe...")
    print(f"   - check_password('testpass123'): {user.check_password('testpass123')}")
    print(f"   - check_password('wrongpass'): {user.check_password('wrongpass')}")
    
    # 5. Tester via l'API
    print("\n5. 🌐 Test connexion API...")
    
    # D'abord démarrer le serveur si nécessaire
    base_url = "http://127.0.0.1:8000/api"
    
    try:
        # Test de connexion via API
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        response = requests.post(f"{base_url}/accounts/login/", json=login_data, timeout=5)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Connexion API réussie")
            print(f"   - User: {data.get('user', {}).get('username')}")
            print(f"   - Token: {data.get('tokens', {}).get('access', '')[:20]}...")
        else:
            print("   ❌ Échec connexion API")
            try:
                error_data = response.json()
                print(f"   Erreur: {json.dumps(error_data, indent=2)}")
            except:
                print(f"   Réponse brute: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("   ⚠️ Serveur Django non démarré - impossible de tester l'API")
    except Exception as e:
        print(f"   ❌ Erreur API: {e}")
    
    return user

def test_admin_user_creation():
    """
    Tester la création d'utilisateur via l'admin
    """
    print("\n" + "=" * 60)
    print("🔧 TEST CRÉATION VIA ADMIN")
    print("=" * 60)
    
    # Créer un admin si nécessaire
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@example.com',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print("   ✅ Utilisateur admin créé")
    else:
        print("   ℹ️ Utilisateur admin existe déjà")
    
    # Tester l'authentification admin
    auth_admin = authenticate(username='admin', password='admin123')
    if auth_admin:
        print("   ✅ Authentification admin réussie")
    else:
        print("   ❌ Échec authentification admin")
        # Réinitialiser le mot de passe admin
        admin_user.set_password('admin123')
        admin_user.save()
        print("   🔄 Mot de passe admin réinitialisé")

def analyze_serializer_issue():
    """
    Analyser les problèmes potentiels dans le serializer
    """
    print("\n" + "=" * 60)
    print("🔍 ANALYSE SERIALIZER")
    print("=" * 60)
    
    from accounts.serializers import CreateUserSerializer
    
    # Données de test
    test_data = {
        'username': 'serializer_test',
        'email': 'serializer@test.com',
        'password': 'testpass123',
        'first_name': 'Serializer',
        'last_name': 'Test',
        'role': 'cashier',
        'permissions': []
    }
    
    print("   📝 Test du serializer CreateUserSerializer...")
    
    # Supprimer l'utilisateur s'il existe
    User.objects.filter(username='serializer_test').delete()
    
    # Tester le serializer
    serializer = CreateUserSerializer(data=test_data)
    
    if serializer.is_valid():
        print("   ✅ Données valides")
        
        # Créer l'utilisateur via le serializer
        user = serializer.save()
        print(f"   ✅ Utilisateur créé via serializer: {user.username}")
        
        # Tester l'authentification
        auth_test = authenticate(username='serializer_test', password='testpass123')
        if auth_test:
            print("   ✅ Authentification post-création réussie")
        else:
            print("   ❌ Échec authentification post-création")
            print(f"   - Password hash: {user.password}")
            print(f"   - check_password: {user.check_password('testpass123')}")
            
    else:
        print("   ❌ Erreurs de validation:")
        for field, errors in serializer.errors.items():
            print(f"   - {field}: {errors}")

if __name__ == '__main__':
    # Tests complets
    test_user = test_user_authentication()
    test_admin_user_creation()
    analyze_serializer_issue()
    
    print("\n" + "=" * 60)
    print("📋 RÉSUMÉ DU DIAGNOSTIC")
    print("=" * 60)
    
    print("\n🎯 POINTS À VÉRIFIER:")
    print("   1. Les utilisateurs sont-ils créés avec is_active=True ?")
    print("   2. Le mot de passe est-il correctement haché ?")
    print("   3. Le serializer appelle-t-il set_password() ?")
    print("   4. Y a-t-il des middlewares qui interfèrent ?")
    
    print("\n🔧 SOLUTIONS POSSIBLES:")
    print("   1. Vérifier que set_password() est appelé dans le serializer")
    print("   2. S'assurer que is_active=True par défaut")
    print("   3. Vérifier les validations côté frontend")
    print("   4. Tester avec des mots de passe plus complexes")
    
    print("\n✅ PROCHAINES ÉTAPES:")
    print("   1. Démarrer le serveur Django: python manage.py runserver 8000")
    print("   2. Tester la création via l'interface web")
    print("   3. Vérifier les logs Django pour les erreurs")
