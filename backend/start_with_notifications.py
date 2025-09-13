#!/usr/bin/env python
"""
Script de démarrage pour tester le système complet avec notifications
"""
import os
import sys
import django
import subprocess
import time
from threading import Thread

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

def check_redis():
    """Vérifier si Redis est disponible"""
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        print("✅ Redis est disponible")
        return True
    except Exception as e:
        print(f"❌ Redis n'est pas disponible: {e}")
        print("   Démarrez Redis avec: redis-server")
        return False

def create_sample_notifications():
    """Créer des données d'exemple pour tester les notifications"""
    from django.contrib.auth import get_user_model
    from products.models import Product, Category
    from reports.notifications import NotificationService
    from reports.models import StockAlert
    
    User = get_user_model()
    
    print("📝 Création de données d'exemple pour les notifications...")
    
    # Créer des produits avec stock faible pour tester les alertes
    category, _ = Category.objects.get_or_create(
        name='Test Notifications',
        defaults={'description': 'Catégorie pour tester les notifications'}
    )
    
    # Produit avec stock faible
    low_stock_product, created = Product.objects.get_or_create(
        name='Produit Stock Faible',
        defaults={
            'category': category,
            'purchase_price': 1000,
            'selling_price': 1500,
            'current_stock': 2,
            'minimum_stock': 10,
            'is_active': True
        }
    )
    
    if created:
        print(f"✅ Produit créé: {low_stock_product.name} (stock: {low_stock_product.current_stock})")
    
    # Produit en rupture de stock
    out_of_stock_product, created = Product.objects.get_or_create(
        name='Produit Rupture Stock',
        defaults={
            'category': category,
            'purchase_price': 800,
            'selling_price': 1200,
            'current_stock': 0,
            'minimum_stock': 5,
            'is_active': True
        }
    )
    
    if created:
        print(f"✅ Produit créé: {out_of_stock_product.name} (stock: {out_of_stock_product.current_stock})")
    
    # Déclencher les vérifications d'alertes
    print("🔔 Déclenchement des alertes de stock...")
    NotificationService.check_and_send_stock_alerts()
    
    # Envoyer une notification de test
    print("📨 Envoi d'une notification de test...")
    NotificationService.send_system_notification(
        message="Système de notifications activé avec succès!",
        level="success",
        target_roles=['admin', 'gerant']
    )
    
    print("✅ Données d'exemple créées")

def test_websocket_connection():
    """Tester la connexion WebSocket"""
    print("\n🔌 Test de connexion WebSocket...")
    
    try:
        import asyncio
        import websockets
        import json
        
        async def test_connection():
            uri = "ws://localhost:8000/ws/alerts/"
            try:
                async with websockets.connect(uri) as websocket:
                    print("✅ Connexion WebSocket réussie")
                    
                    # Écouter un message
                    message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    data = json.loads(message)
                    print(f"📨 Message reçu: {data.get('type', 'unknown')}")
                    
            except asyncio.TimeoutError:
                print("⏰ Timeout - pas de message reçu (normal)")
            except Exception as e:
                print(f"❌ Erreur WebSocket: {e}")
        
        # Attendre un peu que le serveur démarre
        time.sleep(2)
        asyncio.run(test_connection())
        
    except ImportError:
        print("⚠️  websockets non installé - test WebSocket ignoré")
    except Exception as e:
        print(f"❌ Erreur lors du test WebSocket: {e}")

def main():
    """Fonction principale"""
    print("🚀 Démarrage du système BarStock avec notifications")
    print("=" * 60)
    
    # Vérifier Redis
    if not check_redis():
        print("\n⚠️  Redis est requis pour les notifications en temps réel")
        print("   Vous pouvez continuer sans Redis, mais les WebSockets ne fonctionneront pas")
        response = input("   Continuer quand même? (o/N): ")
        if response.lower() != 'o':
            return
    
    # Créer des données d'exemple
    create_sample_notifications()
    
    print("\n" + "=" * 60)
    print("🎯 Instructions pour tester les notifications:")
    print()
    print("1. Démarrez le serveur Django:")
    print("   python manage.py runserver")
    print()
    print("2. Dans un autre terminal, testez les WebSockets:")
    print("   python test_websockets.py")
    print()
    print("3. Testez les APIs de notification:")
    print("   GET  /api/reports/notifications/status/")
    print("   POST /api/reports/notifications/trigger-stock-check/")
    print("   POST /api/reports/notifications/test/")
    print()
    print("4. URLs WebSocket disponibles:")
    print("   ws://localhost:8000/ws/notifications/{user_id}/")
    print("   ws://localhost:8000/ws/alerts/")
    print("   ws://localhost:8000/ws/dashboard/")
    print()
    print("🔔 Fonctionnalités de notification implémentées:")
    print("   ✅ Alertes de stock faible en temps réel")
    print("   ✅ Notifications de nouvelles ventes")
    print("   ✅ Mises à jour du tableau de bord")
    print("   ✅ Notifications système personnalisées")
    print("   ✅ WebSockets avec authentification")
    print("   ✅ APIs de gestion des notifications")
    print()
    
    # Proposer de démarrer le serveur
    response = input("Démarrer le serveur Django maintenant? (o/N): ")
    if response.lower() == 'o':
        print("\n🚀 Démarrage du serveur Django...")
        try:
            subprocess.run(['python', 'manage.py', 'runserver'], check=True)
        except KeyboardInterrupt:
            print("\n⏹️  Serveur arrêté")
        except subprocess.CalledProcessError as e:
            print(f"❌ Erreur lors du démarrage: {e}")

if __name__ == '__main__':
    main()
