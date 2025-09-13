#!/usr/bin/env python
"""
Script de test pour les WebSockets et notifications en temps réel
"""
import asyncio
import websockets
import json
import requests
from datetime import datetime

# Configuration
BASE_URL = 'http://localhost:8000/api'
WS_BASE_URL = 'ws://localhost:8000/ws'

def get_auth_token():
    """Obtenir un token d'authentification"""
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
    if response.status_code == 200:
        return response.json()['access']
    else:
        print(f"❌ Erreur d'authentification: {response.status_code}")
        return None

async def test_notification_websocket(user_id):
    """Tester la connexion WebSocket pour les notifications"""
    uri = f"{WS_BASE_URL}/notifications/{user_id}/"
    
    try:
        print(f"🔌 Connexion à {uri}...")
        async with websockets.connect(uri) as websocket:
            print("✅ Connexion WebSocket établie")
            
            # Envoyer un ping
            await websocket.send(json.dumps({
                'type': 'ping',
                'timestamp': datetime.now().isoformat()
            }))
            
            # Écouter les messages pendant 30 secondes
            timeout = 30
            print(f"👂 Écoute des notifications pendant {timeout} secondes...")
            
            try:
                while timeout > 0:
                    message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    data = json.loads(message)
                    
                    print(f"📨 Message reçu: {data['type']}")
                    if data['type'] == 'pong':
                        print("   ↳ Pong reçu - connexion active")
                    elif data['type'] == 'stock_alert':
                        alert = data['alert']
                        print(f"   ↳ Alerte stock: {alert['product_name']} ({alert['alert_type']})")
                    elif data['type'] == 'sale_notification':
                        sale = data['sale']
                        print(f"   ↳ Nouvelle vente: {sale['total_amount']} BIF sur {sale['table_name']}")
                    elif data['type'] == 'system_notification':
                        print(f"   ↳ Notification système: {data['message']} ({data['level']})")
                    
                    timeout -= 1
                    
            except asyncio.TimeoutError:
                timeout -= 1
                if timeout % 10 == 0:
                    print(f"⏰ {timeout} secondes restantes...")
                    
    except Exception as e:
        print(f"❌ Erreur WebSocket: {e}")

async def test_alerts_websocket():
    """Tester la connexion WebSocket pour les alertes globales"""
    uri = f"{WS_BASE_URL}/alerts/"
    
    try:
        print(f"🔌 Connexion aux alertes globales...")
        async with websockets.connect(uri) as websocket:
            print("✅ Connexion aux alertes établie")
            
            # Écouter les messages
            timeout = 20
            print(f"👂 Écoute des alertes pendant {timeout} secondes...")
            
            try:
                while timeout > 0:
                    message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    data = json.loads(message)
                    
                    print(f"🚨 Alerte reçue: {data['type']}")
                    if data['type'] == 'active_alerts':
                        alerts = data['alerts']
                        print(f"   ↳ {data['count']} alertes actives")
                        for alert in alerts[:3]:  # Afficher les 3 premières
                            print(f"      • {alert.get('product_name', 'N/A')}: {alert.get('type', 'N/A')}")
                    elif data['type'] == 'new_stock_alert':
                        alert = data['alert']
                        print(f"   ↳ Nouvelle alerte: {alert['product_name']} - {alert['alert_type']}")
                    
                    timeout -= 1
                    
            except asyncio.TimeoutError:
                timeout -= 1
                
    except Exception as e:
        print(f"❌ Erreur WebSocket alertes: {e}")

async def test_dashboard_websocket():
    """Tester la connexion WebSocket pour le tableau de bord"""
    uri = f"{WS_BASE_URL}/dashboard/"
    
    try:
        print(f"🔌 Connexion au tableau de bord...")
        async with websockets.connect(uri) as websocket:
            print("✅ Connexion tableau de bord établie")
            
            # Écouter les mises à jour
            timeout = 15
            print(f"📊 Écoute des mises à jour pendant {timeout} secondes...")
            
            try:
                while timeout > 0:
                    message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    data = json.loads(message)
                    
                    print(f"📊 Mise à jour: {data['type']}")
                    if data['type'] == 'dashboard_stats':
                        stats = data['stats']
                        print(f"   ↳ Ventes aujourd'hui: {stats.get('today_sales', 0)}")
                        print(f"   ↳ Revenus: {stats.get('today_revenue', 0)} BIF")
                        print(f"   ↳ Alertes actives: {stats.get('active_alerts', 0)}")
                    elif data['type'] == 'new_sale':
                        sale = data['sale']
                        print(f"   ↳ Nouvelle vente: {sale['total_amount']} BIF")
                    
                    timeout -= 1
                    
            except asyncio.TimeoutError:
                timeout -= 1
                
    except Exception as e:
        print(f"❌ Erreur WebSocket dashboard: {e}")

def test_notification_apis():
    """Tester les APIs de notification"""
    print("\n🧪 Test des APIs de notification...")
    
    token = get_auth_token()
    if not token:
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test du statut des notifications
    response = requests.get(f'{BASE_URL}/reports/notifications/status/', headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Statut notifications:")
        print(f"   ↳ Utilisateur: {data['user_id']} ({data['role']})")
        print(f"   ↳ Alertes non lues: {data['unread_alerts']}")
        print(f"   ↳ WebSocket URL: {data['websocket_url']}")
    else:
        print(f"❌ Erreur statut: {response.status_code}")
    
    # Test de vérification des stocks
    response = requests.post(f'{BASE_URL}/reports/notifications/trigger-stock-check/', headers=headers)
    if response.status_code == 200:
        print("✅ Vérification des stocks déclenchée")
    else:
        print(f"❌ Erreur vérification stocks: {response.status_code}")
    
    # Test de notification de test
    test_data = {
        'message': 'Test de notification WebSocket',
        'level': 'info',
        'target_roles': ['admin', 'gerant']
    }
    
    response = requests.post(f'{BASE_URL}/reports/notifications/test/', json=test_data, headers=headers)
    if response.status_code == 200:
        print("✅ Notification de test envoyée")
    else:
        print(f"❌ Erreur notification test: {response.status_code}")

async def main():
    """Fonction principale de test"""
    print("🚀 Test des WebSockets et Notifications BarStock")
    print("=" * 50)
    
    # Tester les APIs d'abord
    test_notification_apis()
    
    print("\n" + "=" * 50)
    print("🔌 Test des connexions WebSocket")
    
    # Obtenir l'ID utilisateur pour les tests
    token = get_auth_token()
    if token:
        # Décoder le token pour obtenir l'ID utilisateur (simplifié)
        user_id = 1  # Supposons que l'admin a l'ID 1
        
        # Lancer les tests WebSocket en parallèle
        await asyncio.gather(
            test_notification_websocket(user_id),
            test_alerts_websocket(),
            test_dashboard_websocket()
        )
    
    print("\n🎉 Tests WebSocket terminés!")

if __name__ == '__main__':
    print("⚠️  Assurez-vous que le serveur Django et Redis sont démarrés")
    print("   Django: python manage.py runserver")
    print("   Redis: redis-server (ou service redis)")
    print()
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrompus par l'utilisateur")
    except Exception as e:
        print(f"\n❌ Erreur lors des tests: {e}")
