#!/usr/bin/env python
"""
Script pour créer un utilisateur admin par défaut
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from accounts.models import User

def create_admin_user():
    """Créer un utilisateur admin par défaut"""
    
    # Vérifier si un admin existe déjà
    if User.objects.filter(role='admin').exists():
        print("Un utilisateur admin existe déjà.")
        return
    
    # Créer l'utilisateur admin
    admin_user = User.objects.create_user(
        username='admin',
        email='admin@barstock.com',
        password='admin123',
        first_name='Admin',
        last_name='BarStock',
        role='admin',
        is_staff=True,
        is_superuser=True
    )
    
    print(f"Utilisateur admin créé avec succès:")
    print(f"Username: {admin_user.username}")
    print(f"Email: {admin_user.email}")
    print(f"Role: {admin_user.role}")
    print("Mot de passe: admin123")

def create_sample_users():
    """Créer des utilisateurs d'exemple"""
    
    # Gérant
    if not User.objects.filter(username='gerant').exists():
        gerant = User.objects.create_user(
            username='gerant',
            email='gerant@barstock.com',
            password='gerant123',
            first_name='Jean',
            last_name='Dupont',
            role='gerant',
            phone='+25779123456'
        )
        print(f"Gérant créé: {gerant.username}")
    
    # Serveur
    if not User.objects.filter(username='serveur').exists():
        serveur = User.objects.create_user(
            username='serveur',
            email='serveur@barstock.com',
            password='serveur123',
            first_name='Marie',
            last_name='Martin',
            role='serveur',
            phone='+25779654321'
        )
        print(f"Serveur créé: {serveur.username}")

if __name__ == '__main__':
    print("Création des utilisateurs par défaut...")
    create_admin_user()
    create_sample_users()
    print("Terminé!")
