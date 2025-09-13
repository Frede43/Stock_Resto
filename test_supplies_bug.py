#!/usr/bin/env python3
"""
Script de test pour vérifier le bug de duplication des approvisionnements
"""

import os
import sys
import django
import requests
import json
from datetime import datetime, timedelta

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.barstock_api.settings')
sys.path.append('backend')

try:
    django.setup()
    from products.models import Product
    from inventory.models import Purchase, PurchaseItem, StockMovement
    from suppliers.models import Supplier
    from django.contrib.auth import get_user_model
    from django.db import transaction
    print("✅ Django configuré avec succès")
except Exception as e:
    print(f"❌ Erreur configuration Django: {e}")
    sys.exit(1)

class SupplyBugTester:
    def __init__(self):
        self.base_url = "http://localhost:8000/api"
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Enregistrer le résultat d'un test"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {message}")
        if details:
            for key, value in details.items():
                print(f"   {key}: {value}")
        print()

    def setup_test_data(self):
        """Créer les données de test nécessaires"""
        print("🔧 Configuration des données de test...")
        
        try:
            # Créer un utilisateur de test
            User = get_user_model()
            user, created = User.objects.get_or_create(
                username='test_supplies',
                defaults={
                    'email': 'test@supplies.com',
                    'first_name': 'Test',
                    'last_name': 'Supplies',
                    'role': 'admin'
                }
            )
            
            # Créer un fournisseur de test
            supplier, created = Supplier.objects.get_or_create(
                name='Fournisseur Test',
                defaults={
                    'contact_person': 'Contact Test',
                    'phone': '123456789',
                    'email': 'supplier@test.com'
                }
            )
            
            # Créer un produit de test avec stock initial à 0
            from products.models import Category
            category, created = Category.objects.get_or_create(
                name='Test Category',
                defaults={'description': 'Catégorie de test'}
            )
            
            product, created = Product.objects.get_or_create(
                name='Produit Test Bug',
                defaults={
                    'category': category,
                    'purchase_price': 10.00,
                    'selling_price': 15.00,
                    'current_stock': 0,  # Stock initial à 0 pour reproduire le bug
                    'minimum_stock': 5,
                    'unit': 'pièce'
                }
            )
            
            # Réinitialiser le stock à 0 si le produit existait déjà
            if not created:
                product.current_stock = 0
                product.save()
            
            self.test_user = user
            self.test_supplier = supplier
            self.test_product = product
            
            self.log_test(
                "Setup données de test",
                True,
                "Données de test créées avec succès",
                {
                    'user_id': user.id,
                    'supplier_id': supplier.id,
                    'product_id': product.id,
                    'stock_initial': product.current_stock
                }
            )
            
        except Exception as e:
            self.log_test("Setup données de test", False, f"Erreur: {str(e)}")
            return False
            
        return True

    def test_supply_creation_via_api(self):
        """Tester la création d'approvisionnement via l'API"""
        print("🧪 Test création approvisionnement via API...")
        
        # Données de l'approvisionnement
        supply_data = {
            "supplier": self.test_supplier.id,
            "delivery_date": (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
            "notes": "Test approvisionnement pour bug duplication",
            "items": [
                {
                    "product": self.test_product.id,
                    "quantity_ordered": 10,
                    "unit_price": 12.50
                }
            ]
        }
        
        try:
            # Enregistrer l'état initial
            initial_stock = self.test_product.current_stock
            initial_purchases_count = Purchase.objects.count()
            initial_movements_count = StockMovement.objects.count()
            
            # Faire l'appel API
            response = requests.post(
                f"{self.base_url}/inventory/supplies/",
                json=supply_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 201:
                # Vérifier l'état après création
                self.test_product.refresh_from_db()
                final_stock = self.test_product.current_stock
                final_purchases_count = Purchase.objects.count()
                final_movements_count = StockMovement.objects.count()
                
                # Récupérer l'approvisionnement créé
                created_supply = Purchase.objects.latest('created_at')
                
                self.log_test(
                    "Création approvisionnement API",
                    True,
                    "Approvisionnement créé avec succès",
                    {
                        'supply_id': created_supply.id,
                        'status': created_supply.status,
                        'stock_initial': initial_stock,
                        'stock_final': final_stock,
                        'stock_change': final_stock - initial_stock,
                        'purchases_created': final_purchases_count - initial_purchases_count,
                        'movements_created': final_movements_count - initial_movements_count
                    }
                )
                
                return created_supply
                
            else:
                self.log_test(
                    "Création approvisionnement API",
                    False,
                    f"Erreur API: {response.status_code}",
                    {'response': response.text}
                )
                return None
                
        except Exception as e:
            self.log_test("Création approvisionnement API", False, f"Erreur: {str(e)}")
            return None

    def test_supply_workflow(self, supply):
        """Tester le workflow complet d'un approvisionnement"""
        if not supply:
            return
            
        print("🔄 Test workflow approvisionnement...")
        
        try:
            # État initial
            initial_stock = self.test_product.current_stock
            
            # 1. Marquer comme reçu (si nécessaire)
            if supply.status == 'pending':
                supply.status = 'received'
                # Mettre à jour les quantités reçues
                for item in supply.items.all():
                    item.quantity_received = item.quantity_ordered
                    item.save()
                supply.save()
                
                self.log_test(
                    "Marquage comme reçu",
                    True,
                    "Approvisionnement marqué comme reçu",
                    {'supply_status': supply.status}
                )
            
            # 2. Valider l'approvisionnement via API
            response = requests.post(f"{self.base_url}/inventory/supplies/{supply.id}/validate/")
            
            if response.status_code == 200:
                # Vérifier l'état après validation
                supply.refresh_from_db()
                self.test_product.refresh_from_db()
                final_stock = self.test_product.current_stock
                
                # Compter les mouvements de stock pour ce produit
                movements = StockMovement.objects.filter(product=self.test_product)
                movements_count = movements.count()
                
                # Vérifier s'il y a duplication
                expected_stock_increase = 10  # quantité commandée
                actual_stock_increase = final_stock - initial_stock
                
                is_duplicated = actual_stock_increase > expected_stock_increase
                
                self.log_test(
                    "Validation approvisionnement",
                    not is_duplicated,
                    "Duplication détectée!" if is_duplicated else "Pas de duplication détectée",
                    {
                        'supply_status': supply.status,
                        'stock_initial': initial_stock,
                        'stock_final': final_stock,
                        'augmentation_attendue': expected_stock_increase,
                        'augmentation_réelle': actual_stock_increase,
                        'mouvements_stock': movements_count,
                        'duplication': is_duplicated
                    }
                )
                
                # Analyser les mouvements de stock
                self.analyze_stock_movements()
                
            else:
                self.log_test(
                    "Validation approvisionnement",
                    False,
                    f"Erreur validation: {response.status_code}",
                    {'response': response.text}
                )
                
        except Exception as e:
            self.log_test("Workflow approvisionnement", False, f"Erreur: {str(e)}")

    def analyze_stock_movements(self):
        """Analyser les mouvements de stock pour détecter les doublons"""
        print("🔍 Analyse des mouvements de stock...")
        
        movements = StockMovement.objects.filter(
            product=self.test_product
        ).order_by('created_at')
        
        movement_details = []
        for movement in movements:
            movement_details.append({
                'id': movement.id,
                'type': movement.movement_type,
                'quantity': movement.quantity,
                'stock_before': movement.stock_before,
                'stock_after': movement.stock_after,
                'reason': movement.reason,
                'created_at': movement.created_at.isoformat()
            })
        
        # Détecter les doublons potentiels
        duplicates = []
        for i, mov1 in enumerate(movement_details):
            for j, mov2 in enumerate(movement_details[i+1:], i+1):
                if (mov1['type'] == mov2['type'] and 
                    mov1['quantity'] == mov2['quantity'] and
                    mov1['reason'] == mov2['reason']):
                    duplicates.append((i, j))
        
        self.log_test(
            "Analyse mouvements stock",
            len(duplicates) == 0,
            f"Mouvements dupliqués détectés: {len(duplicates)}" if duplicates else "Aucun doublon détecté",
            {
                'total_mouvements': len(movement_details),
                'doublons_detectes': len(duplicates),
                'mouvements': movement_details
            }
        )

    def cleanup_test_data(self):
        """Nettoyer les données de test"""
        print("🧹 Nettoyage des données de test...")
        
        try:
            # Supprimer les mouvements de stock
            StockMovement.objects.filter(product=self.test_product).delete()
            
            # Supprimer les approvisionnements
            Purchase.objects.filter(supplier=self.test_supplier).delete()
            
            # Remettre le stock à 0
            self.test_product.current_stock = 0
            self.test_product.save()
            
            self.log_test("Nettoyage", True, "Données de test nettoyées")
            
        except Exception as e:
            self.log_test("Nettoyage", False, f"Erreur nettoyage: {str(e)}")

    def generate_report(self):
        """Générer un rapport de test"""
        print("\n" + "="*60)
        print("📊 RAPPORT DE TEST - BUG DUPLICATION APPROVISIONNEMENTS")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total des tests: {total_tests}")
        print(f"Tests réussis: {passed_tests}")
        print(f"Tests échoués: {failed_tests}")
        print(f"Taux de réussite: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\n📋 Détail des tests:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        # Sauvegarder le rapport
        report_file = f"supplies_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.test_results, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Rapport détaillé sauvegardé: {report_file}")
        
        return failed_tests == 0

    def run_all_tests(self):
        """Exécuter tous les tests"""
        print("🚀 Démarrage des tests de duplication des approvisionnements")
        print("="*60)
        
        # Setup
        if not self.setup_test_data():
            return False
        
        try:
            # Test création approvisionnement
            supply = self.test_supply_creation_via_api()
            
            # Test workflow complet
            self.test_supply_workflow(supply)
            
        finally:
            # Nettoyage
            self.cleanup_test_data()
        
        # Générer le rapport
        return self.generate_report()

def main():
    """Fonction principale"""
    tester = SupplyBugTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 Tous les tests sont passés - Bug corrigé!")
        sys.exit(0)
    else:
        print("\n⚠️  Certains tests ont échoué - Bug toujours présent")
        sys.exit(1)

if __name__ == "__main__":
    main()
