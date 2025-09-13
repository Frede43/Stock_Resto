#!/usr/bin/env python3
"""
Vérification des utilisateurs dans la base de données
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bar_stock_wise.settings')
sys.path.append('.')

try:
    django.setup()
    from django.contrib.auth.models import User
    from accounts.models import UserProfile
    
    print("🔍 VÉRIFICATION DES UTILISATEURS")
    print("=" * 40)
    
    # Lister tous les utilisateurs
    users = User.objects.all()
    print(f"📊 Total utilisateurs: {users.count()}")
    
    print("\n👥 LISTE DES UTILISATEURS:")
    for user in users:
        try:
            profile = UserProfile.objects.get(user=user)
            role = profile.role
        except UserProfile.DoesNotExist:
            role = "Pas de profil"
        
        print(f"   👤 {user.username} | {user.email} | Actif: {user.is_active} | Rôle: {role}")
    
    # Vérifier spécifiquement le caissier
    print("\n🎯 VÉRIFICATION CAISSIER:")
    try:
        caissier = User.objects.get(username='caissier')
        print(f"   ✅ Utilisateur trouvé: {caissier.username}")
        print(f"   📧 Email: {caissier.email}")
        print(f"   🔓 Actif: {caissier.is_active}")
        print(f"   🔑 Mot de passe défini: {bool(caissier.password)}")
        
        # Vérifier le profil
        try:
            profile = UserProfile.objects.get(user=caissier)
            print(f"   🎭 Rôle: {profile.role}")
            print(f"   👤 Prénom: {profile.first_name}")
            print(f"   👤 Nom: {profile.last_name}")
        except UserProfile.DoesNotExist:
            print("   ❌ Pas de profil UserProfile")
            
    except User.DoesNotExist:
        print("   ❌ Utilisateur 'caissier' non trouvé")
    
    # Test de vérification du mot de passe
    print("\n🔐 TEST MOT DE PASSE:")
    try:
        caissier = User.objects.get(username='caissier')
        if caissier.check_password('temp123456'):
            print("   ✅ Mot de passe 'temp123456' correct")
        else:
            print("   ❌ Mot de passe 'temp123456' incorrect")
            
        # Tester d'autres mots de passe possibles
        test_passwords = ['caissier', 'password', '123456', 'admin123']
        for pwd in test_passwords:
            if caissier.check_password(pwd):
                print(f"   ✅ Mot de passe '{pwd}' fonctionne")
                break
        else:
            print("   ⚠️ Aucun mot de passe testé ne fonctionne")
            
    except User.DoesNotExist:
        print("   ❌ Impossible de tester - utilisateur non trouvé")
    
except Exception as e:
    print(f"❌ ERREUR: {e}")
    print("\n🔧 SOLUTIONS POSSIBLES:")
    print("   1. Vérifiez que Django est démarré")
    print("   2. Vérifiez la base de données")
    print("   3. Exécutez les migrations")
    print("   4. Créez les utilisateurs manquants")
