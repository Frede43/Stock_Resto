from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F
from products.models import Product
from sales.models import Sale
from inventory.models import StockMovement
from .models import StockAlert
from .notifications import NotificationService

@receiver(post_save, sender=Product)
def check_stock_level(sender, instance, created, **kwargs):
    """Vérifier le niveau de stock après modification d'un produit"""
    if not created:  # Seulement pour les mises à jour
        # Vérifier si le stock est faible
        if instance.current_stock <= instance.minimum_stock and instance.current_stock > 0:
            # Vérifier si une alerte existe déjà
            existing_alert = StockAlert.objects.filter(
                product=instance,
                alert_type='low_stock',
                status='active'
            ).first()
            
            if not existing_alert:
                # Créer une nouvelle alerte
                StockAlert.objects.create(
                    product=instance,
                    alert_type='low_stock',
                    current_stock=instance.current_stock,
                    threshold=instance.minimum_stock,  # Utiliser le stock minimum comme seuil
                    message=f"Stock faible pour {instance.name}: {instance.current_stock} unités restantes"
                )
                
                # Envoyer la notification
                NotificationService.send_stock_alert(instance, 'low_stock')
        
        # Vérifier si le produit est en rupture de stock
        elif instance.current_stock == 0:
            existing_alert = StockAlert.objects.filter(
                product=instance,
                alert_type='out_of_stock',
                status='active'
            ).first()
            
            if not existing_alert:
                StockAlert.objects.create(
                    product=instance,
                    alert_type='out_of_stock',
                    current_stock=instance.current_stock,
                    threshold=instance.minimum_stock,  # Utiliser le stock minimum comme seuil
                    message=f"Rupture de stock pour {instance.name}"
                )
                
                NotificationService.send_stock_alert(instance, 'out_of_stock')
        
        # Si le stock est redevenu normal, résoudre les alertes
        elif instance.current_stock > instance.minimum_stock:
            # Résoudre les alertes actives pour ce produit
            active_alerts = StockAlert.objects.filter(
                product=instance,
                status='active'
            )
            
            for alert in active_alerts:
                alert.status = 'resolved'
                alert.save()
                
                # Notifier que l'alerte est résolue
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync
                
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    'global_alerts',
                    {
                        'type': 'alert_resolved',
                        'alert_id': alert.id
                    }
                )

@receiver(post_save, sender=Sale)
def handle_new_sale(sender, instance, created, **kwargs):
    """Gérer les nouvelles ventes"""
    if created:
        # Envoyer une notification de nouvelle vente
        NotificationService.send_sale_notification(instance)
        
        # Mettre à jour les statistiques du tableau de bord
        NotificationService.update_dashboard_stats()

@receiver(post_save, sender=StockMovement)
def handle_stock_movement(sender, instance, created, **kwargs):
    """Gérer les mouvements de stock"""
    if created:
        # NOTE: La mise à jour du stock est maintenant gérée dans StockMovementSerializer
        # pour éviter le doublement de quantité. Ce signal ne gère plus que les notifications.
        
        # Mettre à jour les statistiques du tableau de bord
        NotificationService.update_dashboard_stats()

@receiver(post_save, sender=StockAlert)
def handle_stock_alert_creation(sender, instance, created, **kwargs):
    """Gérer la création d'alertes de stock"""
    if created and instance.status == 'active':
        # Envoyer une notification système aux admins et gérants
        message = f"Nouvelle alerte: {instance.message}"
        NotificationService.send_system_notification(
            message=message,
            level='warning',
            target_roles=['admin', 'gerant']
        )
