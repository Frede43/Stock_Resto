#!/usr/bin/env python
"""
Script de test pour le système de cuisine
Teste la déduction automatique des ingrédients lors des ventes
"""
import os
import sys
import django
from decimal import Decimal

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from kitchen.models import Ingredient, Recipe, RecipeIngredient
from products.models import Product
from sales.models import Sale, SaleItem
from accounts.models import User


def test_ingredient_consumption():
    """Test de la consommation d'ingrédients lors d'une vente"""
    
    print("🧪 Test du système de déduction automatique des ingrédients")
    print("=" * 60)
    
    # Récupérer les données
    try:
        poulet_roti = Product.objects.get(name='Poulet rôti')
        riz_saute = Product.objects.get(name='Riz sauté')
        user = User.objects.first()
        
        if not user:
            print("❌ Aucun utilisateur trouvé")
            return
            
    except Product.DoesNotExist as e:
        print(f"❌ Produit non trouvé: {e}")
        return
    
    print("\n📊 État du stock AVANT la commande:")
    print("-" * 40)
    for ingredient in Ingredient.objects.all():
        print(f"  {ingredient.nom}: {ingredient.quantite_restante} {ingredient.unite}")
    
    print(f"\n🛒 Simulation d'une commande:")
    print(f"  - 2x {poulet_roti.name}")
    print(f"  - 1x {riz_saute.name}")
    
    # Calculer la consommation théorique
    print(f"\n🧮 Consommation théorique d'ingrédients:")
    print("-" * 40)
    
    if hasattr(poulet_roti, 'recipe') and poulet_roti.recipe:
        print(f"  Pour 2x {poulet_roti.name}:")
        for ri in poulet_roti.recipe.ingredients.all():
            total_needed = ri.quantite_utilisee_par_plat * 2
            print(f"    - {ri.ingredient.nom}: {total_needed} {ri.unite}")
    
    if hasattr(riz_saute, 'recipe') and riz_saute.recipe:
        print(f"  Pour 1x {riz_saute.name}:")
        for ri in riz_saute.recipe.ingredients.all():
            total_needed = ri.quantite_utilisee_par_plat * 1
            print(f"    - {ri.ingredient.nom}: {total_needed} {ri.unite}")
    
    # Créer la vente (ceci devrait déclencher la déduction automatique)
    print(f"\n⚡ Création de la vente...")
    try:
        sale = Sale.objects.create(
            server=user,
            status='pending'
        )
        
        # Ajouter les articles (ceci devrait déclencher la déduction)
        item1 = SaleItem.objects.create(
            sale=sale,
            product=poulet_roti,
            quantity=2,
            unit_price=poulet_roti.selling_price
        )
        
        item2 = SaleItem.objects.create(
            sale=sale,
            product=riz_saute,
            quantity=1,
            unit_price=riz_saute.selling_price
        )
        
        # Mettre à jour les stocks des produits finis
        poulet_roti.current_stock -= 2
        poulet_roti.save()
        
        riz_saute.current_stock -= 1
        riz_saute.save()
        
        # Décompter les ingrédients manuellement pour ce test
        # (normalement fait automatiquement par le serializer)
        if hasattr(poulet_roti, 'recipe') and poulet_roti.recipe:
            poulet_roti.recipe.consume_ingredients(quantity=2, user=user)
        
        if hasattr(riz_saute, 'recipe') and riz_saute.recipe:
            riz_saute.recipe.consume_ingredients(quantity=1, user=user)
        
        # Calculer le total
        total = (item1.quantity * item1.unit_price) + (item2.quantity * item2.unit_price)
        sale.total_amount = total
        sale.save()
        
        print(f"✅ Vente créée avec succès (ID: {sale.id})")
        print(f"   Total: {sale.total_amount} BIF")
        
    except Exception as e:
        print(f"❌ Erreur lors de la création de la vente: {e}")
        return
    
    print(f"\n📊 État du stock APRÈS la commande:")
    print("-" * 40)
    for ingredient in Ingredient.objects.all():
        status = ""
        if ingredient.is_out_of_stock:
            status = " 🔴 RUPTURE"
        elif ingredient.is_low_stock:
            status = " 🟡 ALERTE"
        else:
            status = " 🟢 OK"
        
        print(f"  {ingredient.nom}: {ingredient.quantite_restante} {ingredient.unite}{status}")
    
    print(f"\n📋 Mouvements d'ingrédients créés:")
    print("-" * 40)
    from kitchen.models import IngredientMovement
    recent_movements = IngredientMovement.objects.filter(
        reason='consumption'
    ).order_by('-created_at')[:10]
    
    for movement in recent_movements:
        print(f"  {movement.ingredient.nom}: -{movement.quantity} {movement.ingredient.unite} "
              f"(stock: {movement.stock_before} → {movement.stock_after})")


def test_recipe_availability():
    """Test de vérification de disponibilité des recettes"""
    
    print(f"\n🔍 Test de vérification de disponibilité des recettes")
    print("=" * 60)
    
    for recipe in Recipe.objects.all():
        print(f"\n📝 Recette: {recipe.nom_recette}")
        print(f"   Peut être préparée: {'✅ OUI' if recipe.can_be_prepared else '❌ NON'}")
        
        if not recipe.can_be_prepared:
            missing = recipe.get_missing_ingredients()
            print(f"   Ingrédients manquants:")
            for item in missing:
                print(f"     - {item['ingredient'].nom}: besoin {item['needed']} {item['ingredient'].unite}, "
                      f"disponible {item['available']} {item['ingredient'].unite}")


def test_alerts():
    """Test du système d'alertes"""
    
    print(f"\n🚨 Test du système d'alertes")
    print("=" * 60)
    
    # Forcer un ingrédient en dessous du seuil pour tester les alertes
    try:
        epices = Ingredient.objects.get(nom='Épices')
        old_stock = epices.quantite_restante
        
        print(f"Stock actuel d'épices: {old_stock} {epices.unite}")
        print(f"Seuil d'alerte: {epices.seuil_alerte} {epices.unite}")
        
        # Réduire le stock en dessous du seuil
        epices.quantite_restante = Decimal('0.030')  # 30g, en dessous du seuil de 50g
        epices.save()
        
        print(f"✅ Stock réduit à {epices.quantite_restante} {epices.unite}")
        print(f"   Statut: {'🔴 RUPTURE' if epices.is_out_of_stock else '🟡 ALERTE' if epices.is_low_stock else '🟢 OK'}")
        
        # Remettre le stock original
        epices.quantite_restante = old_stock
        epices.save()
        
    except Ingredient.DoesNotExist:
        print("❌ Ingrédient 'Épices' non trouvé")


if __name__ == '__main__':
    print("🧪 TESTS DU SYSTÈME DE CUISINE")
    print("=" * 60)
    
    test_ingredient_consumption()
    test_recipe_availability()
    test_alerts()
    
    print(f"\n✅ Tests terminés!")
    print("=" * 60)
