import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("🔧 Réinitialisation du caissier...")
print()

try:
    cashier = User.objects.get(username='caissier')
    
    # Mettre à jour le mot de passe
    cashier.set_password('cashier123')
    cashier.is_active = True
    cashier.role = 'cashier'
    cashier.save()
    
    print("✅ Caissier réinitialisé avec succès !")
    print()
    print("📋 Informations :")
    print(f"   Username: {cashier.username}")
    print(f"   Email: {cashier.email}")
    print(f"   Rôle: {cashier.role}")
    print(f"   Actif: {'✅' if cashier.is_active else '❌'}")
    print(f"   Mot de passe: cashier123")
    print()
    print("🔐 Utilisez ces identifiants pour vous connecter :")
    print("   Username: caissier")
    print("   Password: cashier123")
    
except User.DoesNotExist:
    print("❌ Utilisateur 'caissier' introuvable !")
    print()
    print("Création d'un nouveau caissier...")
    
    cashier = User.objects.create_user(
        username='caissier',
        email='job@gmail.com',
        password='cashier123',
        first_name='Job',
        last_name='Jupon',
        role='cashier',
        is_active=True,
        is_staff=False,
        is_superuser=False
    )
    
    print("✅ Nouveau caissier créé !")
    print()
    print("📋 Informations :")
    print(f"   Username: {cashier.username}")
    print(f"   Email: {cashier.email}")
    print(f"   Rôle: {cashier.role}")
    print(f"   Mot de passe: cashier123")
