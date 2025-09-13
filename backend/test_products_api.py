#!/usr/bin/env python
"""
Test de l'API des produits pour vérifier les prix d'achat
"""
import requests
import json

def test_products_api():
    """Tester l'API des produits"""
    base_url = 'http://127.0.0.1:8000/api'
    
    print(f"🔍 Test de l'API des produits...")
    print("=" * 50)
    
    try:
        # Test de l'API des produits
        response = requests.get(f'{base_url}/products/')
        
        print(f"📡 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            products = data.get('results', [])
            
            print(f"✅ {len(products)} produits récupérés")
            
            if products:
                print(f"\n📦 Premiers produits:")
                
                for i, product in enumerate(products[:5]):  # Afficher les 5 premiers
                    print(f"\n   {i+1}. {product.get('name', 'N/A')}")
                    print(f"      • ID: {product.get('id', 'N/A')}")
                    print(f"      • Catégorie: {product.get('category_name', 'N/A')}")
                    print(f"      • Prix d'achat: {product.get('purchase_price', 'MANQUANT')} BIF")
                    print(f"      • Prix de vente: {product.get('selling_price', 'N/A')} BIF")
                    print(f"      • Stock: {product.get('current_stock', 'N/A')}")
                    
                    # Vérifier si purchase_price est présent et non nul
                    purchase_price = product.get('purchase_price')
                    if purchase_price is None:
                        print(f"      ❌ purchase_price est NULL")
                    elif purchase_price == 0 or purchase_price == "0.00":
                        print(f"      ⚠️  purchase_price est 0")
                    else:
                        print(f"      ✅ purchase_price OK: {purchase_price}")
                
                # Statistiques
                total_products = len(products)
                products_with_purchase_price = len([p for p in products if p.get('purchase_price') is not None])
                products_with_zero_purchase = len([p for p in products if float(p.get('purchase_price', 0)) == 0])
                products_with_valid_purchase = len([p for p in products if float(p.get('purchase_price', 0)) > 0])
                
                print(f"\n📊 Statistiques:")
                print(f"   • Total produits: {total_products}")
                print(f"   • Avec purchase_price défini: {products_with_purchase_price}")
                print(f"   • Avec purchase_price = 0: {products_with_zero_purchase}")
                print(f"   • Avec purchase_price > 0: {products_with_valid_purchase}")
                
                # Sauvegarder pour inspection
                with open('products_api_test.json', 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"\n💾 Données sauvegardées dans 'products_api_test.json'")
                
                return products_with_valid_purchase > 0
            else:
                print(f"❌ Aucun produit trouvé")
                return False
                
        elif response.status_code == 401:
            print(f"❌ Erreur d'authentification (401)")
            print(f"   L'API nécessite une authentification")
            return False
        else:
            print(f"❌ Erreur API: {response.status_code}")
            print(f"   Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

if __name__ == '__main__':
    print("🧪 Test de l'API des produits - Prix d'achat")
    print("=" * 60)
    
    # Test de la liste des produits
    list_success = test_products_api()
    
    print(f"\n📋 Résultats:")
    if list_success:
        print(f"✅ L'API retourne maintenant les prix d'achat !")
        print(f"📋 Actions:")
        print(f"   1. Rafraîchir la page http://localhost:8081/products")
        print(f"   2. Vérifier que les prix d'achat s'affichent")
        print(f"   3. Si certains prix sont à 0, les mettre à jour dans l'admin Django")
    else:
        print(f"❌ Problème avec l'API des produits")
        print(f"💡 Vérifier l'authentification ou les données en base")
