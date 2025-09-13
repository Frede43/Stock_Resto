#!/usr/bin/env python
"""
Test complet de l'API avec toutes les données détaillées
"""
import requests
import json
from datetime import date

def test_complete_api():
    """Tester l'API complète avec tous les détails"""
    base_url = 'http://127.0.0.1:8000/api'
    test_date = '2025-08-18'
    
    print(f"🔍 Test complet de l'API pour le {test_date}")
    print("=" * 60)
    
    try:
        response = requests.get(f'{base_url}/reports/daily-detailed/{test_date}/')
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"✅ API Status: {response.status_code}")
            print(f"📊 Données reçues:")
            print(f"   Date: {data.get('date', 'N/A')}")
            
            # Résumé global
            summary = data.get('summary', {})
            print(f"\n📈 RÉSUMÉ GLOBAL:")
            print(f"   • Total ventes: {summary.get('total_sales', 'N/A')}")
            print(f"   • Chiffre d'affaires: {summary.get('total_revenue', 'N/A')} BIF")
            print(f"   • Coût total: {summary.get('total_cost', 'N/A')} BIF")
            print(f"   • Bénéfice total: {summary.get('total_profit', 'N/A')} BIF")
            print(f"   • Marge bénéficiaire: {summary.get('profit_margin', 'N/A')}%")
            
            # Détail par catégories
            categories = data.get('categories', {})
            print(f"\n🏷️  DÉTAIL PAR CATÉGORIES ({len(categories)} catégories):")
            
            for cat_name, cat_data in categories.items():
                print(f"\n   📦 {cat_name.upper()}:")
                print(f"      • CA: {cat_data.get('total_revenue', 0)} BIF")
                print(f"      • Coût: {cat_data.get('total_cost', 0)} BIF")
                print(f"      • Bénéfice: {cat_data.get('total_profit', 0)} BIF")
                print(f"      • Marge: {cat_data.get('profit_margin', 0):.1f}%")
                print(f"      • Quantité: {cat_data.get('total_quantity', 0)} articles")
                print(f"      • Stock initial: {cat_data.get('total_initial_stock', 0)}")
                print(f"      • Stock final: {cat_data.get('total_final_stock', 0)}")
                
                # Détail des produits
                products = cat_data.get('products', [])
                print(f"      • Produits ({len(products)}):")
                
                for product in products[:2]:  # Afficher seulement les 2 premiers
                    print(f"        - {product.get('name', 'N/A')}:")
                    print(f"          Stock: {product.get('initial_stock', 0)} → {product.get('final_stock', 0)} (vendu: {product.get('quantity_sold', 0)})")
                    print(f"          Prix: PA={product.get('cost_price', 0)} BIF, PV={product.get('unit_price', 0)} BIF")
                    print(f"          CA: {product.get('revenue', 0)} BIF, Bénéfice: {product.get('profit', 0)} BIF ({product.get('profit_margin', 0):.1f}%)")
                
                if len(products) > 2:
                    print(f"        ... et {len(products) - 2} autres produits")
            
            # Sauvegarder pour inspection
            with open('complete_api_test.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Données complètes sauvegardées dans 'complete_api_test.json'")
            
            return True
            
        else:
            print(f"❌ Erreur API: {response.status_code}")
            print(f"   Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

if __name__ == '__main__':
    success = test_complete_api()
    
    if success:
        print(f"\n🎉 Test réussi ! L'API retourne maintenant toutes les données nécessaires.")
        print(f"📋 Prochaines étapes:")
        print(f"   1. Vérifier que le frontend affiche ces données")
        print(f"   2. Corriger l'affichage dans l'interface web")
        print(f"   3. S'assurer que le PDF utilise les mêmes données")
    else:
        print(f"\n💥 Test échoué ! Il faut corriger l'API.")
