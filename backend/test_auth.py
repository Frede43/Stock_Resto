#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import authenticate
from accounts.models import User

print("=== Test d'authentification ===")

# Test 1: Vérifier les utilisateurs
print("\n1. Utilisateurs existants:")
users = User.objects.all()
for user in users:
    print(f"   - {user.username} (role: {user.role}, active: {user.is_active})")

# Test 2: Test d'authentification
print("\n2. Tests d'authentification:")

# Test admin
user_admin = authenticate(username='admin', password='Lumenge4242')
print(f"   Admin auth: {user_admin}")

# Test caissier
user_caissier = authenticate(username='caissier', password='temp123456')
print(f"   Caissier auth: {user_caissier}")

# Test 3: Vérifier les mots de passe directement
print("\n3. Vérification des mots de passe:")
admin_user = User.objects.get(username='admin')
print(f"   Admin check_password: {admin_user.check_password('Lumenge4242')}")

caissier_user = User.objects.get(username='caissier')
print(f"   Caissier check_password: {caissier_user.check_password('temp123456')}")

# Test 4: Test du serializer
print("\n4. Test du serializer de login:")
from accounts.serializers import UserLoginSerializer

data = {'username': 'admin', 'password': 'Lumenge4242'}
serializer = UserLoginSerializer(data=data)
print(f"   Serializer valid: {serializer.is_valid()}")
if not serializer.is_valid():
    print(f"   Erreurs: {serializer.errors}")
else:
    print(f"   User validé: {serializer.validated_data.get('user')}")
