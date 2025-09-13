#!/usr/bin/env python3
"""
Test des permissions caissier pour voir les serveurs
"""

import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from accounts.views import UserListCreateView

User = get_user_model()

def test_cashier_permissions():
    """Tester les permissions du caissier"""
    print("🧪 Test des permissions caissier...")
    
    # Récupérer le caissier
    try:
        cashier = User.objects.get(username='caissier1')
        print(f"✅ Caissier trouvé: {cashier.first_name} {cashier.last_name}")
    except User.DoesNotExist:
        print("❌ Caissier non trouvé")
        return False
    
    # Créer une requête factice
    factory = RequestFactory()
    request = factory.get('/api/accounts/users/?role=server')
    request.user = cashier
    
    # Tester la vue
    view = UserListCreateView()
    view.request = request
    
    try:
        # Tester les permissions
        view.check_permissions(request)
        print("✅ Permissions accordées pour voir les serveurs")
        
        # Tester le queryset
        queryset = view.get_queryset()
        servers = queryset.filter(role='server')
        print(f"✅ {servers.count()} serveur(s) trouvé(s)")
        
        for server in servers:
            print(f"  - {server.first_name} {server.last_name} ({server.username})")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur permissions: {e}")
        return False

def main():
    """Fonction principale"""
    print("🎯 Test des permissions caissier pour les serveurs")
    print("="*50)
    
    if test_cashier_permissions():
        print("\n🎉 Les caissiers peuvent maintenant voir les serveurs!")
        print("📱 Testez dans l'interface web:")
        print("1. Connectez-vous comme: caissier1 / caissier123")
        print("2. Allez sur: http://localhost:5173/sales")
        print("3. Le champ serveur devrait afficher les serveurs")
    else:
        print("\n❌ Problème avec les permissions")

if __name__ == "__main__":
    main()
