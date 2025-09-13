#!/usr/bin/env python
"""
Démonstration pratique du cas d'utilisation complet
Restaurant "Le Burundi Gourmand" - Service du midi
"""
import os
import sys
import django
import requests
import json
from datetime import datetime
from decimal import Decimal

# Configuration Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apps.settings.development')
django.setup()

from kitchen.models import Ingredient, Recipe, RecipeIngredient, IngredientMovement
from products.models import Product, Category
from sales.models import Table, Sale, SaleItem
from accounts.models import User
from django.utils import timezone
from django.db import transaction

def demo_cas_utilisation_complet():
    """Démonstration complète du workflow cuisine"""
    
    print("🍽️ DÉMONSTRATION - Restaurant Le Burundi Gourmand")
    print("=" * 60)
    print("📅 Service du midi - Commande Riz au Poulet")
    print("🕐 12h30 - Rush du déjeuner\n")
    
    base_url = "http://localhost:8000/api"
    
    # 1. CONFIGURATION INITIALE
    print("1. 🏗️ Configuration initiale...")
    
    # Créer utilisateurs
    try:
        chef = User.objects.get(username='marie_chef')
    except User.DoesNotExist:
        chef = User.objects.create_user(
            username='marie_chef',
            password='chef123',
            first_name='Marie',
            last_name='Uwimana',
            email='marie@burundi-gourmand.bi'
        )
    
    try:
        serveur = User.objects.get(username='jean_serveur')
    except User.DoesNotExist:
        serveur = User.objects.create_user(
            username='jean_serveur', 
            password='serveur123',
            first_name='Jean-Baptiste',
            last_name='Niyongabo',
            email='jean@burundi-gourmand.bi'
        )
    
    print(f"   👨‍🍳 Chef: {chef.get_full_name()}")
    print(f"   🧑‍💼 Serveur: {serveur.get_full_name()}")
    
    # 2. ÉTAT INITIAL DU STOCK
    print("\n2. 📦 État initial du stock...")
    
    # Créer les ingrédients avec stock initial
    ingredients_data = [
        {'nom': 'Poulet (morceaux)', 'quantite': 5.2, 'unite': 'kg', 'seuil': 2.0, 'prix': 4000},
        {'nom': 'Riz basmati', 'quantite': 8.5, 'unite': 'kg', 'seuil': 3.0, 'prix': 1500},
        {'nom': 'Oignons', 'quantite': 2.1, 'unite': 'kg', 'seuil': 1.0, 'prix': 800},
        {'nom': 'Carottes', 'quantite': 1.8, 'unite': 'kg', 'seuil': 1.5, 'prix': 600},
        {'nom': 'Ail', 'quantite': 0.3, 'unite': 'kg', 'seuil': 0.2, 'prix': 3000},
        {'nom': 'Piment rouge', 'quantite': 0.8, 'unite': 'kg', 'seuil': 0.5, 'prix': 2000},
        {'nom': 'Huile de palme', 'quantite': 2.5, 'unite': 'L', 'seuil': 1.0, 'prix': 1200},
        {'nom': 'Sel', 'quantite': 5.0, 'unite': 'kg', 'seuil': 2.0, 'prix': 300},
    ]
    
    ingredients = {}
    for ing_data in ingredients_data:
        ingredient, created = Ingredient.objects.get_or_create(
            nom=ing_data['nom'],
            defaults={
                'quantite_restante': Decimal(str(ing_data['quantite'])),
                'unite': ing_data['unite'],
                'seuil_alerte': Decimal(str(ing_data['seuil'])),
                'prix_unitaire': Decimal(str(ing_data['prix'])),
                'description': f"Ingrédient pour cuisine - {ing_data['nom']}",
                'is_active': True
            }
        )
        if not created:
            ingredient.quantite_restante = Decimal(str(ing_data['quantite']))
            ingredient.save()
        
        ingredients[ing_data['nom']] = ingredient
        
        # Afficher le statut
        status = "✅ OK"
        if ingredient.is_low_stock:
            status = "⚠️ FAIBLE"
        elif ingredient.is_out_of_stock:
            status = "❌ RUPTURE"
            
        print(f"   {ing_data['nom']:20} : {ingredient.quantite_restante} {ingredient.unite:6} (seuil: {ingredient.seuil_alerte}) {status}")
    
    # 3. CRÉATION DE LA RECETTE
    print("\n3. 📋 Création de la recette 'Riz au Poulet'...")
    
    # Créer catégorie et produit
    category, _ = Category.objects.get_or_create(
        name="Plats Principaux",
        defaults={'type': 'plats', 'description': 'Plats principaux du restaurant'}
    )
    
    product, created = Product.objects.get_or_create(
        name="Riz au Poulet",
        defaults={
            'category': category,
            'unit': 'portion',
            'purchase_price': Decimal('2500'),
            'selling_price': Decimal('5000'),
            'current_stock': 50,
            'minimum_stock': 10,
            'description': 'Délicieux riz parfumé avec poulet grillé aux épices'
        }
    )
    
    # Créer la recette
    recipe, created = Recipe.objects.get_or_create(
        plat=product,
        defaults={
            'nom_recette': 'Riz au Poulet Traditionnel',
            'description': 'Recette traditionnelle burundaise',
            'instructions': '1. Faire revenir le poulet\n2. Ajouter les légumes\n3. Incorporer le riz\n4. Laisser mijoter 20 min',
            'temps_preparation': 25,
            'portions': 1,
            'is_active': True,
            'created_by': chef
        }
    )
    
    # Ajouter les ingrédients à la recette (pour 1 portion)
    recipe_ingredients = [
        {'ingredient': 'Poulet (morceaux)', 'quantite': 0.2, 'unite': 'kg'},
        {'ingredient': 'Riz basmati', 'quantite': 0.15, 'unite': 'kg'},
        {'ingredient': 'Oignons', 'quantite': 0.05, 'unite': 'kg'},
        {'ingredient': 'Carottes', 'quantite': 0.03, 'unite': 'kg'},
        {'ingredient': 'Ail', 'quantite': 0.005, 'unite': 'kg'},
        {'ingredient': 'Piment rouge', 'quantite': 0.002, 'unite': 'kg'},
        {'ingredient': 'Huile de palme', 'quantite': 0.02, 'unite': 'L'},
        {'ingredient': 'Sel', 'quantite': 0.003, 'unite': 'kg'},
    ]
    
    # Supprimer les anciens ingrédients de recette
    recipe.ingredients.all().delete()
    
    for rec_ing in recipe_ingredients:
        ingredient = ingredients[rec_ing['ingredient']]
        RecipeIngredient.objects.create(
            recipe=recipe,
            ingredient=ingredient,
            quantite_utilisee_par_plat=Decimal(str(rec_ing['quantite'])),
            unite=rec_ing['unite'],
            is_optional=False
        )
    
    print(f"   📝 Recette créée: {recipe.nom_recette}")
    print(f"   💰 Coût par portion: {recipe.total_cost} BIF")
    print(f"   ⏱️ Temps de préparation: {recipe.temps_preparation} minutes")
    print(f"   ✅ Peut être préparée: {'Oui' if recipe.can_be_prepared else 'Non'}")
    
    # 4. CRÉATION DE LA TABLE
    print("\n4. 🪑 Préparation Table 5...")
    
    table, created = Table.objects.get_or_create(
        number="5",
        defaults={
            'capacity': 4,
            'status': 'available',
            'location': 'Zone principale',
            'is_active': True
        }
    )
    print(f"   Table {table.number} ({table.capacity} places) - {table.get_status_display()}")
    
    # 5. SIMULATION DE LA COMMANDE
    print("\n5. 🛎️ Prise de commande - Famille Nzeyimana...")
    
    # Occuper la table
    table.status = 'occupied'
    table.customer = 'Famille Nzeyimana'
    table.server = serveur.get_full_name()
    table.occupied_since = timezone.now()
    table.save()
    
    print(f"   👥 Client: {table.customer}")
    print(f"   🧑‍💼 Serveur: {table.server}")
    print(f"   🕐 Heure: {table.occupied_since.strftime('%H:%M')}")
    
    # 6. VALIDATION DES STOCKS POUR 4 PORTIONS
    print("\n6. 🔍 Validation des stocks pour 4 portions...")
    
    portions_demandees = 4
    validation = recipe.validate_ingredients_availability(portions_demandees)
    
    print(f"   📊 Ingrédients requis pour {portions_demandees} portions:")
    
    total_cost = Decimal('0')
    for ing_recipe in recipe.ingredients.all():
        quantite_totale = ing_recipe.quantite_utilisee_par_plat * portions_demandees
        cost = quantite_totale * ing_recipe.ingredient.prix_unitaire
        total_cost += cost
        
        print(f"   ├── {ing_recipe.ingredient.nom}: {quantite_totale} {ing_recipe.unite} "
              f"(coût: {cost} BIF)")
    
    print(f"\n   💰 CALCUL FINANCIER:")
    print(f"   ├── Coût total: {total_cost} BIF")
    print(f"   ├── Prix de vente: {product.selling_price * portions_demandees} BIF")
    marge = (product.selling_price * portions_demandees) - total_cost
    marge_pct = (marge / (product.selling_price * portions_demandees)) * 100
    print(f"   └── Marge brute: {marge} BIF ({marge_pct:.1f}%)")
    
    if validation['can_prepare']:
        print(f"   ✅ VALIDATION RÉUSSIE - Tous ingrédients disponibles")
    else:
        print(f"   ❌ VALIDATION ÉCHOUÉE - Ingrédients manquants")
        return
    
    # 7. CRÉATION DE LA VENTE
    print("\n7. 💳 Création de la vente...")
    
    sale = Sale.objects.create(
        server=serveur,
        table=table,
        customer_name=table.customer,
        payment_method='mobile',
        status='pending',
        notes='Commande famille - Service du midi'
    )
    
    sale_item = SaleItem.objects.create(
        sale=sale,
        product=product,
        quantity=portions_demandees,
        unit_price=product.selling_price,
        notes='Bien cuit, peu épicé'
    )
    
    # Calculer le total
    sale.total_amount = sale_item.quantity * sale_item.unit_price
    sale.save()
    
    print(f"   📋 Vente #{sale.id} créée")
    print(f"   🍽️ {sale_item.quantity}x {product.name}")
    print(f"   💰 Total: {sale.total_amount} BIF")
    
    # 8. PRÉPARATION EN CUISINE
    print("\n8. 👨‍🍳 Préparation en cuisine...")
    
    # Changer le statut
    sale.status = 'preparing'
    sale.save()
    print(f"   📱 Statut: {sale.get_status_display()}")
    
    # Décompte des ingrédients (transaction atomique)
    print(f"   🔄 Décompte automatique des stocks...")
    
    try:
        with transaction.atomic():
            consumed = recipe.consume_ingredients(
                quantity=portions_demandees,
                user=chef
            )
            
            print(f"   ✅ Décompte réussi - {len(consumed)} ingrédients traités")
            
            # Afficher les nouveaux stocks
            for item in consumed:
                ingredient = item['ingredient']
                print(f"   ├── {ingredient.nom}: {item['stock_before']} → {item['stock_after']} {ingredient.unite}")
                
                # Vérifier les alertes
                if ingredient.is_low_stock:
                    print(f"   ⚠️ ALERTE: {ingredient.nom} en dessous du seuil!")
    
    except Exception as e:
        print(f"   ❌ Erreur lors du décompte: {e}")
        return
    
    # 9. GÉNÉRATION D'ALERTES
    print("\n9. 🚨 Vérification des alertes...")
    
    alertes_generees = 0
    for ingredient in ingredients.values():
        ingredient.refresh_from_db()  # Recharger depuis la DB
        if ingredient.is_low_stock:
            alertes_generees += 1
            print(f"   ⚠️ ALERTE: {ingredient.nom} - {ingredient.quantite_restante} {ingredient.unite} "
                  f"(seuil: {ingredient.seuil_alerte})")
    
    if alertes_generees == 0:
        print(f"   ✅ Aucune alerte générée")
    else:
        print(f"   📊 {alertes_generees} alerte(s) générée(s)")
    
    # 10. FINALISATION
    print("\n10. 🍽️ Service et finalisation...")
    
    # Plat prêt
    sale.status = 'ready'
    sale.save()
    print(f"   ⏰ 12h48 - Plat prêt (18 minutes)")
    
    # Service
    sale.status = 'served'
    sale.save()
    print(f"   🧑‍💼 12h50 - Servi par {serveur.get_full_name()}")
    
    # Paiement
    sale.status = 'paid'
    sale.save()
    
    # Libérer la table
    table.status = 'available'
    table.customer = None
    table.server = None
    table.occupied_since = None
    table.save()
    
    print(f"   💳 12h52 - Payé ({sale.get_payment_method_display()})")
    print(f"   🪑 Table 5 libérée")
    
    # 11. ANALYTICS FINAUX
    print("\n11. 📊 Analytics et résultats...")
    
    # Calculer les métriques
    temps_service = 22  # minutes simulées
    satisfaction = "Excellente"
    
    print(f"   ⏱️ Temps total de service: {temps_service} minutes")
    print(f"   😊 Satisfaction client: {satisfaction}")
    print(f"   💰 Chiffre d'affaires: {sale.total_amount} BIF")
    print(f"   📈 Marge réalisée: {marge} BIF ({marge_pct:.1f}%)")
    
    # Prévisions avec nouveau stock
    print(f"\n   🔮 PRÉVISIONS AVEC STOCK ACTUEL:")
    portions_restantes = float('inf')
    ingredient_limitant = None
    
    for ing_recipe in recipe.ingredients.all():
        ingredient = ing_recipe.ingredient
        ingredient.refresh_from_db()
        portions_possibles = int(ingredient.quantite_restante / ing_recipe.quantite_utilisee_par_plat)
        
        if portions_possibles < portions_restantes:
            portions_restantes = portions_possibles
            ingredient_limitant = ingredient.nom
    
    print(f"   ├── Portions encore possibles: {portions_restantes}")
    print(f"   └── Ingrédient limitant: {ingredient_limitant}")
    
    # 12. RECOMMANDATIONS
    print(f"\n12. 💡 Recommandations système...")
    
    # Liste de courses
    ingredients_a_commander = []
    for ingredient in ingredients.values():
        ingredient.refresh_from_db()
        if ingredient.is_low_stock:
            ingredients_a_commander.append(ingredient)
    
    if ingredients_a_commander:
        print(f"   🛒 LISTE DE COURSES URGENTE:")
        for ing in ingredients_a_commander:
            quantite_recommandee = float(ing.seuil_alerte) * 3  # 3x le seuil
            cout_estime = quantite_recommandee * float(ing.prix_unitaire)
            print(f"   ├── {ing.nom}: {quantite_recommandee} {ing.unite} "
                  f"(~{cout_estime:,.0f} BIF)")
    
    print(f"\n   🎯 OPTIMISATIONS SUGGÉRÉES:")
    print(f"   ├── Promouvoir 'Riz au Poulet' (marge excellente: {marge_pct:.1f}%)")
    print(f"   ├── Surveiller stock carottes (ingrédient critique)")
    print(f"   └── Prévoir réappro avant service du soir")
    
    print("\n" + "=" * 60)
    print("🎉 DÉMONSTRATION TERMINÉE AVEC SUCCÈS!")
    print("✅ Workflow complet validé - De la commande au paiement")
    print("✅ Gestion automatique des stocks et alertes")
    print("✅ Traçabilité complète et analytics en temps réel")
    print("=" * 60)

if __name__ == "__main__":
    demo_cas_utilisation_complet()
