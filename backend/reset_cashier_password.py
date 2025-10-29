#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import django

# Fix encoding for Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from accounts.models import User

print("=" * 60)
print("REINITIALISATION MOT DE PASSE CAISSIER")
print("=" * 60)

try:
    caissier = User.objects.get(username='caissier')
    
    # Réinitialiser le mot de passe à 'temp123456'
    new_password = 'temp123456'
    caissier.set_password(new_password)
    caissier.save()
    
    print(f"OK Mot de passe reinitialise pour: {caissier.username}")
    print(f"   - Nouveau mot de passe: {new_password}")
    print()
    
    # Vérifier que le mot de passe fonctionne
    if caissier.check_password(new_password):
        print("VERIFICATION: Mot de passe VALIDE")
    else:
        print("ERREUR: Mot de passe INVALIDE apres reinitialisation")
    
    print()
    print("Informations utilisateur:")
    print(f"   - Username: {caissier.username}")
    print(f"   - Role: {caissier.role}")
    print(f"   - Actif: {caissier.is_active}")
    print(f"   - Email: {caissier.email}")
    
except User.DoesNotExist:
    print("ERREUR: Utilisateur 'caissier' non trouve")
except Exception as e:
    print(f"ERREUR: {e}")

print("=" * 60)
