#!/usr/bin/env python
"""
Script pour tester l'API depuis le navigateur
"""
import requests
import json
from datetime import date

def test_browser_endpoints():
    """Tester les endpoints comme le ferait le navigateur"""
    base_url = 'http://127.0.0.1:8000/api'
    today = date.today().strftime('%Y-%m-%d')
    
    print("🌐 Test des endpoints depuis le navigateur...")
    print(f"📅 Date testée: {today}")
    
    # Headers comme un navigateur
    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    # Test 1: Daily detailed report
    print(f"\n1. Test daily detailed report ({today}):")
    try:
        response = requests.get(f'{base_url}/reports/daily-detailed/{today}/', headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Données reçues:")
            print(f"      Date: {data.get('date', 'N/A')}")
            print(f"      Total ventes: {data.get('summary', {}).get('total_sales', 'N/A')}")
            print(f"      Chiffre d'affaires: {data.get('summary', {}).get('total_revenue', 'N/A')} BIF")
            print(f"      Catégories: {len(data.get('categories', {}))}")
            
            # Afficher quelques catégories
            categories = data.get('categories', {})
            for i, (cat_name, cat_data) in enumerate(categories.items()):
                if i < 3:  # Afficher seulement les 3 premières
                    print(f"        • {cat_name}: {cat_data.get('total_revenue', 0)} BIF ({cat_data.get('total_quantity', 0)} articles)")
            
            # Sauvegarder pour inspection
            with open('browser_test_result.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"      💾 Données sauvegardées dans 'browser_test_result.json'")
            
        else:
            print(f"   ❌ Erreur: {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")
    
    # Test 2: Dashboard stats
    print(f"\n2. Test dashboard stats:")
    try:
        response = requests.get(f'{base_url}/reports/dashboard/stats/', headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Données reçues:")
            print(f"      Total sales: {data.get('total_sales', 'N/A')}")
            print(f"      Total revenue: {data.get('total_revenue', 'N/A')}")
            print(f"      Total profit: {data.get('total_profit', 'N/A')}")
        else:
            print(f"   ❌ Erreur: {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")

if __name__ == '__main__':
    test_browser_endpoints()
