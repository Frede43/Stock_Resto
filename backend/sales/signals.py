"""
Signaux pour la synchronisation automatique des tables et ventes
+ Déduction automatique des ingrédients après paiement
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from decimal import Decimal
from .models import Sale, Table


@receiver(pre_save, sender=Sale)
def update_table_status_on_sale_change(sender, instance, **kwargs):
    """
    Met à jour le statut de la table quand une vente change de statut
    """
    # Si c'est une nouvelle vente (pas d'ID encore)
    if not instance.pk:
        return
    
    # Récupérer l'ancienne instance pour comparer
    try:
        old_instance = Sale.objects.get(pk=instance.pk)
    except Sale.DoesNotExist:
        return
    
    # Si le statut a changé et qu'il y a une table associée
    if old_instance.status != instance.status and instance.table:
        table = instance.table
        
        # Si la vente passe à "paid" ou "cancelled", libérer la table
        if instance.status in ['paid', 'cancelled']:
            table.status = 'available'
            table.occupied_since = None
            table.customer = None
            table.server = None
            table.save()
            
            # Créer une notification de libération
            create_table_freed_notification(table, instance)


@receiver(post_save, sender=Sale)
def occupy_table_on_sale_creation(sender, instance, created, **kwargs):
    """
    Occupe automatiquement la table quand une vente est créée
    """
    if created and instance.table and instance.status == 'pending':
        table = instance.table
        
        # Marquer la table comme occupée
        table.status = 'occupied'
        table.occupied_since = timezone.now()
        table.customer = instance.customer_name
        
        # Récupérer le nom du serveur si disponible
        if instance.server:
            server_name = f"{instance.server.first_name} {instance.server.last_name}"
            table.server = server_name
        
        table.save()


@receiver(post_save, sender=Sale)
def deduct_ingredients_on_payment(sender, instance, created, **kwargs):
    """
    Déduit automatiquement les ingrédients du stock quand une vente est payée
    
    C'est le CŒUR du système cuisine-ventes :
    - Récupère les items de la vente
    - Pour chaque produit, vérifie s'il a une recette
    - Déduit les ingrédients utilisés du stock
    - Génère des alertes si stock faible
    """
    # Ne déduire que si la vente vient d'être payée
    if not created and instance.status == 'paid':
        # Vérifier si c'est un changement de statut vers 'paid'
        try:
            old_instance = Sale.objects.get(pk=instance.pk)
            if old_instance.status == 'paid':
                # Déjà payé, ne rien faire
                return
        except Sale.DoesNotExist:
            return
        
        # Importer ici pour éviter les imports circulaires
        from kitchen.models import Ingredient
        
        # Parcourir tous les items de la vente
        for item in instance.items.all():
            product = item.product
            quantity_sold = item.quantity
            
            # Vérifier si le produit a une recette
            if hasattr(product, 'recipe') and product.recipe:
                recipe = product.recipe
                
                # Parcourir tous les ingrédients de la recette
                for recipe_ingredient in recipe.ingredients.all():
                    ingredient = recipe_ingredient.ingredient
                    
                    # Calculer la quantité à déduire
                    # quantite_utilisee_par_plat est en grammes
                    # quantite_restante de l'ingrédient est dans son unité (kg, L, etc.)
                    quantity_per_dish = recipe_ingredient.quantite_utilisee_par_plat
                    total_quantity_used = quantity_per_dish * quantity_sold
                    
                    # Convertir en unité de l'ingrédient
                    if recipe_ingredient.unite == 'g' and ingredient.unite == 'kg':
                        # Convertir grammes en kilogrammes
                        quantity_to_deduct = Decimal(total_quantity_used) / Decimal('1000')
                    elif recipe_ingredient.unite == 'ml' and ingredient.unite == 'L':
                        # Convertir millilitres en litres
                        quantity_to_deduct = Decimal(total_quantity_used) / Decimal('1000')
                    elif recipe_ingredient.unite == ingredient.unite:
                        # Même unité, pas de conversion
                        quantity_to_deduct = Decimal(total_quantity_used)
                    else:
                        # Unités incompatibles, utiliser la quantité telle quelle
                        quantity_to_deduct = Decimal(total_quantity_used)
                    
                    # Déduire du stock
                    ingredient.quantite_restante -= quantity_to_deduct
                    
                    # Sauvegarder l'ingrédient
                    ingredient.save()
                    
                    # Log pour debug
                    print(f"✅ Déduit {quantity_to_deduct} {ingredient.unite} de {ingredient.nom} (Vente #{instance.id})")
                    
                    # Vérifier si alerte nécessaire
                    if ingredient.quantite_restante <= 0:
                        print(f"🚨 RUPTURE: {ingredient.nom} épuisé!")
                    elif ingredient.quantite_restante <= ingredient.seuil_alerte:
                        print(f"⚠️ ALERTE: {ingredient.nom} stock faible ({ingredient.quantite_restante} {ingredient.unite})")


def create_table_freed_notification(table, sale):
    """
    Crée une notification quand une table est libérée
    
    Cette fonction pourrait être étendue pour envoyer des notifications
    via WebSocket, email, SMS, etc.
    """
    from django.core.cache import cache
    
    # Stocker la notification dans le cache pour 5 minutes
    notification_key = f"table_freed_{table.id}_{timezone.now().timestamp()}"
    notification_data = {
        'type': 'table_freed',
        'table_id': table.id,
        'table_number': table.number,
        'table_location': table.location or 'Non spécifié',
        'freed_at': timezone.now().isoformat(),
        'sale_reference': sale.reference,
        'customer_name': sale.customer_name,
        'total_amount': float(sale.total_amount) if sale.total_amount else 0,
        'message': f"La table {table.number} a été libérée"
    }
    
    # Stocker dans le cache avec une durée de 5 minutes
    cache.set(notification_key, notification_data, 300)
    
    # Ajouter à la liste des notifications récentes
    recent_notifications = cache.get('recent_table_notifications', [])
    recent_notifications.insert(0, notification_data)
    # Garder seulement les 20 dernières notifications
    recent_notifications = recent_notifications[:20]
    cache.set('recent_table_notifications', recent_notifications, 3600)  # 1 heure
