#!/usr/bin/env python
"""
Script pour tester l'API du rapport journalier
"""
import requests
import json
from datetime import date

def test_api_endpoints():
    """Tester les endpoints de l'API"""
    base_url = 'http://127.0.0.1:8000/api'
    today = date.today().strftime('%Y-%m-%d')
    
    print("🔍 Test des endpoints API...")
    print(f"📅 Date testée: {today}")
    
    # Test 1: Dashboard stats
    print("\n1. Test dashboard stats:")
    try:
        response = requests.get(f'{base_url}/reports/dashboard/stats/')
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
    
    # Test 2: Daily detailed report
    print(f"\n2. Test daily detailed report ({today}):")
    try:
        response = requests.get(f'{base_url}/reports/daily-detailed/{today}/')
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Données reçues:")
            print(f"      Date: {data.get('date', 'N/A')}")
            print(f"      Summary total sales: {data.get('summary', {}).get('total_sales', 'N/A')}")
            print(f"      Summary total revenue: {data.get('summary', {}).get('total_revenue', 'N/A')}")
            print(f"      Categories: {len(data.get('categories', {}))}")
        else:
            print(f"   ❌ Erreur: {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")

if __name__ == '__main__':
    test_api_endpoints()
