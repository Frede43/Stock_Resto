"""
Signaux pour le système d'alertes automatiques des ingrédients
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone

from .models import Ingredient, IngredientMovement
from reports.models import StockAlert


@receiver(pre_save, sender=Ingredient)
def check_ingredient_stock_before_save(sender, instance, **kwargs):
    """
    Vérifie le stock avant sauvegarde pour détecter les changements
    """
    if instance.pk:  # Si l'ingrédient existe déjà
        try:
            old_instance = Ingredient.objects.get(pk=instance.pk)
            instance._old_quantite = old_instance.quantite_restante
            instance._was_low_stock = old_instance.is_low_stock
            instance._was_out_of_stock = old_instance.is_out_of_stock
        except Ingredient.DoesNotExist:
            instance._old_quantite = None
            instance._was_low_stock = False
            instance._was_out_of_stock = False
    else:
        instance._old_quantite = None
        instance._was_low_stock = False
        instance._was_out_of_stock = False


@receiver(post_save, sender=Ingredient)
def check_ingredient_stock_alerts(sender, instance, created, **kwargs):
    """
    Vérifie les alertes de stock après sauvegarde d'un ingrédient
    """
    if not instance.is_active:
        return
    
    # Vérifier si le statut a changé
    old_quantite = getattr(instance, '_old_quantite', None)
    was_low_stock = getattr(instance, '_was_low_stock', False)
    was_out_of_stock = getattr(instance, '_was_out_of_stock', False)
    
    current_is_low_stock = instance.is_low_stock
    current_is_out_of_stock = instance.is_out_of_stock
    
    # Créer des alertes si nécessaire
    alert_created = False
    
    # Alerte de rupture de stock
    if current_is_out_of_stock and not was_out_of_stock:
        create_stock_alert(
            ingredient=instance,
            alert_type='out_of_stock',
            message=f"RUPTURE DE STOCK: {instance.nom} (0 {instance.unite})"
        )
        alert_created = True
        print(f"🔴 ALERTE RUPTURE: {instance.nom}")
    
    # Alerte de stock faible
    elif current_is_low_stock and not was_low_stock and not current_is_out_of_stock:
        create_stock_alert(
            ingredient=instance,
            alert_type='low_stock',
            message=f"STOCK FAIBLE: {instance.nom} ({instance.quantite_restante} {instance.unite}, seuil: {instance.seuil_alerte})"
        )
        alert_created = True
        print(f"🟡 ALERTE STOCK FAIBLE: {instance.nom}")
    
    # Envoyer les notifications si une alerte a été créée
    if alert_created:
        send_stock_alert_notifications(instance)


def create_stock_alert(ingredient, alert_type, message):
    """
    Crée une alerte de stock dans la base de données
    """
    try:
        # Vérifier s'il n'y a pas déjà une alerte similaire récente
        recent_alert = StockAlert.objects.filter(
            ingredient_name=ingredient.nom,
            alert_type=alert_type,
            is_resolved=False,
            created_at__gte=timezone.now() - timezone.timedelta(hours=1)
        ).first()
        
        if not recent_alert:
            StockAlert.objects.create(
                ingredient_name=ingredient.nom,
                current_stock=float(ingredient.quantite_restante),
                minimum_stock=float(ingredient.seuil_alerte),
                unit=ingredient.unite,
                alert_type=alert_type,
                message=message,
                is_resolved=False
            )
    except Exception as e:
        print(f"Erreur lors de la création de l'alerte: {e}")


def send_stock_alert_notifications(ingredient):
    """
    Envoie les notifications d'alerte de stock
    """
    try:
        # Préparer le contexte pour les notifications
        context = {
            'ingredient': ingredient,
            'restaurant_name': getattr(settings, 'RESTAURANT_NAME', 'BarStockWise'),
            'timestamp': timezone.now(),
        }
        
        # Message pour SMS/Email
        if ingredient.is_out_of_stock:
            subject = f"🔴 RUPTURE DE STOCK - {ingredient.nom}"
            message = f"ALERTE RUPTURE: {ingredient.nom} est en rupture de stock (0 {ingredient.unite}). Réapprovisionnement urgent nécessaire."
        else:
            subject = f"🟡 STOCK FAIBLE - {ingredient.nom}"
            message = f"ALERTE STOCK: {ingredient.nom} est en dessous du seuil d'alerte ({ingredient.quantite_restante} {ingredient.unite}, seuil: {ingredient.seuil_alerte} {ingredient.unite})."
        
        context['subject'] = subject
        context['message'] = message
        
        # Envoyer email aux gestionnaires
        send_email_alert(context)
        
        # Envoyer SMS aux numéros configurés
        send_sms_alert(context)
        
        # Notification WebSocket en temps réel
        send_websocket_alert(context)
        
    except Exception as e:
        print(f"Erreur lors de l'envoi des notifications: {e}")


def send_email_alert(context):
    """
    Envoie une alerte par email
    """
    try:
        if not settings.EMAIL_HOST_USER:
            return
        
        # Liste des emails des gestionnaires (à configurer)
        manager_emails = [
            settings.EMAIL_HOST_USER,  # Email par défaut
            # Ajouter d'autres emails de gestionnaires ici
        ]
        
        # Rendu du template email
        html_message = render_to_string('emails/stock_alert.html', context)
        plain_message = context['message']
        
        send_mail(
            subject=context['subject'],
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=manager_emails,
            html_message=html_message,
            fail_silently=True
        )
        
        print(f"📧 Email d'alerte envoyé pour {context['ingredient'].nom}")
        
    except Exception as e:
        print(f"Erreur envoi email: {e}")


def send_sms_alert(context):
    """
    Envoie une alerte par SMS
    """
    try:
        # Importer le service de notifications
        from core.notifications import NotificationService
        
        # Numéros de téléphone du personnel (configurés dans settings)
        staff_numbers = getattr(settings, 'STAFF_PHONE_NUMBERS', [])
        
        if not staff_numbers:
            return
        
        sms_message = f"{settings.RESTAURANT_NAME}: {context['message']}"
        
        for phone_number in staff_numbers:
            try:
                result = NotificationService.send_sms(
                    phone_number=phone_number,
                    message=sms_message
                )
                if result.get('success'):
                    print(f"📱 SMS d'alerte envoyé à {phone_number}")
                else:
                    print(f"❌ Échec SMS à {phone_number}: {result.get('error')}")
            except Exception as e:
                print(f"Erreur SMS pour {phone_number}: {e}")
                
    except Exception as e:
        print(f"Erreur service SMS: {e}")


def send_websocket_alert(context):
    """
    Envoie une alerte en temps réel via WebSocket
    """
    try:
        # Channels désactivé pour Render (plan gratuit)
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
        except ImportError:
            return  # Channels non disponible
        
        if channel_layer:
            # Données à envoyer via WebSocket
            alert_data = {
                'type': 'stock_alert',
                'ingredient_name': context['ingredient'].nom,
                'current_stock': float(context['ingredient'].quantite_restante),
                'minimum_stock': float(context['ingredient'].seuil_alerte),
                'unit': context['ingredient'].unite,
                'alert_level': 'critical' if context['ingredient'].is_out_of_stock else 'warning',
                'message': context['message'],
                'timestamp': context['timestamp'].isoformat()
            }
            
            # Envoyer à tous les clients connectés au groupe 'kitchen_alerts'
            async_to_sync(channel_layer.group_send)(
                'kitchen_alerts',
                {
                    'type': 'send_alert',
                    'alert': alert_data
                }
            )
            
            print(f"🔔 Alerte WebSocket envoyée pour {context['ingredient'].nom}")
            
    except Exception as e:
        print(f"Erreur WebSocket: {e}")


@receiver(post_save, sender=IngredientMovement)
def log_ingredient_movement(sender, instance, created, **kwargs):
    """
    Log les mouvements d'ingrédients pour audit
    """
    if created:
        print(f"📋 Mouvement enregistré: {instance.ingredient.nom} - {instance.get_movement_type_display()} - {instance.quantity} {instance.ingredient.unite}")
        
        # Si c'est une sortie importante, vérifier les alertes
        if instance.movement_type == 'out' and instance.quantity >= instance.ingredient.seuil_alerte:
            print(f"⚠️ Sortie importante détectée pour {instance.ingredient.nom}")
