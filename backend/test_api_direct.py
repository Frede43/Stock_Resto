#!/usr/bin/env python
import requests
import json

# Test direct de l'API de connexion
url = "http://127.0.0.1:8000/api/accounts/login/"
data = {
    "username": "admin",
    "password": "Lumenge4242"
}

print(f"=== Test API Direct ===")
print(f"URL: {url}")
print(f"Data: {data}")

try:
    response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ Connexion réussie via API directe")
    else:
        print("❌ Échec de connexion via API directe")
        
except Exception as e:
    print(f"❌ Erreur de requête: {e}")

# Test avec caissier aussi
print(f"\n=== Test Caissier ===")
data2 = {
    "username": "caissier", 
    "password": "temp123456"
}

try:
    response2 = requests.post(url, json=data2, headers={'Content-Type': 'application/json'})
    print(f"Status Code: {response2.status_code}")
    print(f"Response: {response2.text}")
except Exception as e:
    print(f"❌ Erreur: {e}")
