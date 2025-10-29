"""
Service de notifications SMS et Email pour BarStockWise
"""

import logging
from typing import Dict, List, Optional
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import requests
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class NotificationService:
    """Service principal pour les notifications"""
    
    @staticmethod
    def send_reservation_confirmation(reservation) -> Dict:
        """Envoie une confirmation de réservation par email et SMS"""
        results = {
            'email_sent': False,
            'sms_sent': False,
            'errors': []
        }
        
        # Email de confirmation
        if reservation.customer_email:
            try:
                email_result = EmailService.send_reservation_confirmation(reservation)
                results['email_sent'] = email_result['success']
                if not email_result['success']:
                    results['errors'].append(f"Email: {email_result['error']}")
            except Exception as e:
                results['errors'].append(f"Email: {str(e)}")
        
        # SMS de confirmation
        if reservation.customer_phone:
            try:
                sms_result = SMSService.send_reservation_confirmation(reservation)
                results['sms_sent'] = sms_result['success']
                if not sms_result['success']:
                    results['errors'].append(f"SMS: {sms_result['error']}")
            except Exception as e:
                results['errors'].append(f"SMS: {str(e)}")
        
        return results
    
    @staticmethod
    def send_reservation_reminder(reservation) -> Dict:
        """Envoie un rappel de réservation"""
        results = {
            'email_sent': False,
            'sms_sent': False,
            'errors': []
        }
        
        # Email de rappel
        if reservation.customer_email:
            try:
                email_result = EmailService.send_reservation_reminder(reservation)
                results['email_sent'] = email_result['success']
                if not email_result['success']:
                    results['errors'].append(f"Email: {email_result['error']}")
            except Exception as e:
                results['errors'].append(f"Email: {str(e)}")
        
        # SMS de rappel
        if reservation.customer_phone:
            try:
                sms_result = SMSService.send_reservation_reminder(reservation)
                results['sms_sent'] = sms_result['success']
                if not sms_result['success']:
                    results['errors'].append(f"SMS: {sms_result['error']}")
            except Exception as e:
                results['errors'].append(f"SMS: {str(e)}")
        
        return results
    
    @staticmethod
    def send_staff_notification(message: str, staff_phones: List[str] = None) -> Dict:
        """Envoie une notification au personnel"""
        if not staff_phones:
            # Récupérer les numéros du personnel depuis les settings ou la DB
            staff_phones = getattr(settings, 'STAFF_PHONE_NUMBERS', [])
        
        results = {
            'sms_sent': 0,
            'errors': []
        }
        
        for phone in staff_phones:
            try:
                sms_result = SMSService.send_staff_notification(phone, message)
                if sms_result['success']:
                    results['sms_sent'] += 1
                else:
                    results['errors'].append(f"SMS {phone}: {sms_result['error']}")
            except Exception as e:
                results['errors'].append(f"SMS {phone}: {str(e)}")
        
        return results


class EmailService:
    """Service pour les notifications email"""
    
    @staticmethod
    def send_reservation_confirmation(reservation) -> Dict:
        """Envoie un email de confirmation de réservation"""
        try:
            subject = f'Confirmation de réservation - {settings.RESTAURANT_NAME}'
            
            # Contexte pour le template
            context = {
                'reservation': reservation,
                'restaurant_name': getattr(settings, 'RESTAURANT_NAME', 'BarStockWise'),
                'restaurant_phone': getattr(settings, 'RESTAURANT_PHONE', ''),
                'restaurant_address': getattr(settings, 'RESTAURANT_ADDRESS', ''),
            }
            
            # Rendu du template HTML
            html_message = render_to_string('emails/reservation_confirmation.html', context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[reservation.customer_email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Email de confirmation envoyé à {reservation.customer_email}")
            return {'success': True}
            
        except Exception as e:
            logger.error(f"Erreur envoi email confirmation: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def send_reservation_reminder(reservation) -> Dict:
        """Envoie un email de rappel de réservation"""
        try:
            subject = f'Rappel de réservation - {settings.RESTAURANT_NAME}'
            
            context = {
                'reservation': reservation,
                'restaurant_name': getattr(settings, 'RESTAURANT_NAME', 'BarStockWise'),
                'restaurant_phone': getattr(settings, 'RESTAURANT_PHONE', ''),
            }
            
            html_message = render_to_string('emails/reservation_reminder.html', context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[reservation.customer_email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Email de rappel envoyé à {reservation.customer_email}")
            return {'success': True}
            
        except Exception as e:
            logger.error(f"Erreur envoi email rappel: {str(e)}")
            return {'success': False, 'error': str(e)}


class SMSService:
    """Service pour les notifications SMS"""
    
    @staticmethod
    def send_sms(phone: str, message: str) -> Dict:
        """Envoie un SMS via l'API configurée"""
        
        # Configuration pour différents providers SMS
        sms_provider = getattr(settings, 'SMS_PROVIDER', 'twilio')
        
        if sms_provider == 'twilio':
            return SMSService._send_twilio_sms(phone, message)
        elif sms_provider == 'africastalking':
            return SMSService._send_africastalking_sms(phone, message)
        elif sms_provider == 'custom':
            return SMSService._send_custom_sms(phone, message)
        else:
            return {'success': False, 'error': 'Provider SMS non configuré'}
    
    @staticmethod
    def _send_twilio_sms(phone: str, message: str) -> Dict:
        """Envoie SMS via Twilio"""
        try:
            from twilio.rest import Client
            
            account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
            auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
            from_phone = getattr(settings, 'TWILIO_PHONE_NUMBER', '')
            
            if not all([account_sid, auth_token, from_phone]):
                return {'success': False, 'error': 'Configuration Twilio incomplète'}
            
            client = Client(account_sid, auth_token)
            
            message = client.messages.create(
                body=message,
                from_=from_phone,
                to=phone
            )
            
            logger.info(f"SMS Twilio envoyé à {phone}: {message.sid}")
            return {'success': True, 'message_id': message.sid}
            
        except Exception as e:
            logger.error(f"Erreur SMS Twilio: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def _send_africastalking_sms(phone: str, message: str) -> Dict:
        """Envoie SMS via Africa's Talking (populaire en Afrique)"""
        try:
            import africastalking
            
            username = getattr(settings, 'AFRICASTALKING_USERNAME', '')
            api_key = getattr(settings, 'AFRICASTALKING_API_KEY', '')
            
            if not all([username, api_key]):
                return {'success': False, 'error': 'Configuration Africa\'s Talking incomplète'}
            
            africastalking.initialize(username, api_key)
            sms = africastalking.SMS
            
            response = sms.send(message, [phone])
            
            logger.info(f"SMS Africa's Talking envoyé à {phone}")
            return {'success': True, 'response': response}
            
        except Exception as e:
            logger.error(f"Erreur SMS Africa's Talking: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def _send_custom_sms(phone: str, message: str) -> Dict:
        """Envoie SMS via API personnalisée (à adapter selon votre provider local)"""
        try:
            api_url = getattr(settings, 'CUSTOM_SMS_API_URL', '')
            api_key = getattr(settings, 'CUSTOM_SMS_API_KEY', '')
            
            if not all([api_url, api_key]):
                return {'success': False, 'error': 'Configuration SMS personnalisée incomplète'}
            
            payload = {
                'phone': phone,
                'message': message,
                'api_key': api_key
            }
            
            response = requests.post(api_url, json=payload, timeout=10)
            response.raise_for_status()
            
            logger.info(f"SMS personnalisé envoyé à {phone}")
            return {'success': True, 'response': response.json()}
            
        except Exception as e:
            logger.error(f"Erreur SMS personnalisé: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def send_reservation_confirmation(reservation) -> Dict:
        """Envoie SMS de confirmation de réservation"""
        message = (
            f"Bonjour {reservation.customer_name}, "
            f"votre réservation pour {reservation.party_size} personne(s) "
            f"le {reservation.reservation_date.strftime('%d/%m/%Y')} "
            f"à {reservation.reservation_time.strftime('%H:%M')} "
            f"(Table {reservation.table.number}) est confirmée. "
            f"Merci ! - {getattr(settings, 'RESTAURANT_NAME', 'BarStockWise')}"
        )
        
        return SMSService.send_sms(reservation.customer_phone, message)
    
    @staticmethod
    def send_reservation_reminder(reservation) -> Dict:
        """Envoie SMS de rappel de réservation"""
        message = (
            f"Rappel: Votre réservation chez {getattr(settings, 'RESTAURANT_NAME', 'BarStockWise')} "
            f"est dans 1 heure ({reservation.reservation_time.strftime('%H:%M')}) "
            f"pour {reservation.party_size} personne(s), Table {reservation.table.number}. "
            f"À bientôt !"
        )
        
        return SMSService.send_sms(reservation.customer_phone, message)
    
    @staticmethod
    def send_staff_notification(phone: str, message: str) -> Dict:
        """Envoie notification au personnel"""
        from django.utils import timezone
        staff_message = f"[STAFF] {message} - {timezone.now().strftime('%H:%M')}"
        return SMSService.send_sms(phone, staff_message)


# Tâches automatiques pour les rappels
from django.utils import timezone
from celery import shared_task

@shared_task
def send_reservation_reminders():
    """Tâche Celery pour envoyer les rappels de réservation"""
    from sales.models import TableReservation
    
    # Réservations dans 1 heure
    one_hour_later = timezone.now() + timedelta(hours=1)
    upcoming_reservations = TableReservation.objects.filter(
        reservation_date=one_hour_later.date(),
        reservation_time__hour=one_hour_later.hour,
        status='confirmed'
    )
    
    sent_count = 0
    for reservation in upcoming_reservations:
        try:
            result = NotificationService.send_reservation_reminder(reservation)
            if result['email_sent'] or result['sms_sent']:
                sent_count += 1
                logger.info(f"Rappel envoyé pour réservation {reservation.id}")
        except Exception as e:
            logger.error(f"Erreur rappel réservation {reservation.id}: {str(e)}")
    
    return f"Rappels envoyés: {sent_count}"

@shared_task
def check_overdue_reservations():
    """Vérifie les réservations en retard et notifie le personnel"""
    from sales.models import TableReservation
    
    now = timezone.now()
    overdue_reservations = TableReservation.objects.filter(
        reservation_date=now.date(),
        reservation_time__lt=now.time(),
        status='confirmed'
    )
    
    if overdue_reservations.exists():
        message = f"Attention: {overdue_reservations.count()} réservation(s) en retard"
        NotificationService.send_staff_notification(message)
        
        # Marquer comme no-show après 30 minutes
        very_overdue = overdue_reservations.filter(
            reservation_time__lt=(now - timedelta(minutes=30)).time()
        )
        very_overdue.update(status='no_show')
        
        return f"Réservations en retard: {overdue_reservations.count()}, No-show: {very_overdue.count()}"
    
    return "Aucune réservation en retard"
