# Désactivé pour Render (plan gratuit) - Channels non disponible
try:
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    channel_layer = get_channel_layer()
    CHANNELS_AVAILABLE = True
except ImportError:
    channel_layer = None
    CHANNELS_AVAILABLE = False

from django.utils import timezone
from django.db.models import F
import json

class NotificationService:
    """Service pour envoyer des notifications en temps réel"""
    
    @staticmethod
    def send_stock_alert(product, alert_type='low_stock'):
        """Envoyer une alerte de stock"""
        alert_data = {
            'product_id': product.id,
            'product_name': product.name,
            'category': product.category.name,
            'current_stock': product.current_stock,
            'minimum_stock': product.minimum_stock,
            'alert_type': alert_type,
            'timestamp': timezone.now().isoformat()
        }
        
        # Envoyer à tous les utilisateurs connectés aux alertes (si channels disponible)
        if not CHANNELS_AVAILABLE or not channel_layer:
            # Channels non disponible, skip les notifications temps réel
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Alerte de stock pour {alert_data['product_name']} (Channels désactivé)")
            return
            
        try:
            async_to_sync(channel_layer.group_send)(
                'global_alerts',
                {
                    'type': 'new_stock_alert',
                    'alert': alert_data
                }
            )
        except Exception as e:
            # Log l'erreur mais ne pas faire échouer l'opération
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Erreur lors de l'envoi de notification système: {str(e)}")
            print(f"Erreur lors de l'envoi de notification système: {str(e)}")
        
        # Envoyer aux admins et gérants
        from accounts.models import User
        admin_users = User.objects.filter(role__in=['admin', 'gerant'])
        
        for user in admin_users:
            try:
                async_to_sync(channel_layer.group_send)(
                    f'notifications_{user.id}',
                    {
                        'type': 'stock_alert',
                        'alert': alert_data
                    }
                )
            except Exception as e:
                # Log l'erreur mais continuer pour les autres utilisateurs
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Erreur lors de l'envoi de notification à l'utilisateur {user.id}: {str(e)}")
                continue
    
    @staticmethod
    def send_sale_notification(sale):
        """Envoyer une notification de nouvelle vente"""
        if not CHANNELS_AVAILABLE or not channel_layer:
            return
            
        try:
            
            sale_data = {
                'sale_id': sale.id,
                'table_name': sale.table.number if sale.table else 'Emporter',
                'total_amount': float(sale.total_amount),
                'items_count': sale.items.count(),
                'server': sale.server.get_full_name(),
                'timestamp': sale.created_at.isoformat()
            }
            
            # Envoyer aux mises à jour du tableau de bord
            async_to_sync(channel_layer.group_send)(
                'dashboard_updates',
                {
                    'type': 'new_sale',
                    'sale': sale_data
                }
            )
            
            # Notifier les gérants et admins
            from accounts.models import User
            managers = User.objects.filter(role__in=['admin', 'gerant'])
            
            for user in managers:
                async_to_sync(channel_layer.group_send)(
                    f'notifications_{user.id}',
                    {
                        'type': 'sale_notification',
                        'sale': sale_data
                    }
                )
        except Exception as e:
            # Log l'erreur mais ne pas faire échouer la création de vente
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Erreur lors de l'envoi de notification de vente: {str(e)}")
            # Ne pas lever l'exception pour éviter d'interrompre la création de vente
    
    @staticmethod
    def send_system_notification(message, level='info', target_roles=None):
        """Envoyer une notification système"""
        if not CHANNELS_AVAILABLE or not channel_layer:
            return
            
        try:
            
            if target_roles is None:
                target_roles = ['admin', 'gerant', 'serveur']
            
            from accounts.models import User
            target_users = User.objects.filter(role__in=target_roles)
            
            notification_data = {
                'message': message,
                'level': level,
                'timestamp': timezone.now().isoformat()
            }
            
            for user in target_users:
                async_to_sync(channel_layer.group_send)(
                    f'notifications_{user.id}',
                    {
                        'type': 'system_notification',
                        'message': message,
                        'level': level
                    }
                )
        except Exception as e:
            # Log l'erreur mais ne pas faire échouer l'opération
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Erreur lors de l'envoi de notification système: {str(e)}")
    
    @staticmethod
    def update_dashboard_stats():
        """Mettre à jour les statistiques du tableau de bord"""
        if not CHANNELS_AVAILABLE or not channel_layer:
            return
            
        try:
            
            from .models import DailyReport
            from sales.models import Sale
            from products.models import Product
            from django.db.models import Sum
            
            today = timezone.now().date()
            
            # Calculer les statistiques
            today_sales = Sale.objects.filter(created_at__date=today).count()
            today_revenue = Sale.objects.filter(
                created_at__date=today, 
                status='completed'
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            active_alerts = StockAlert.objects.filter(status='active').count()
            low_stock_products = Product.objects.filter(
                current_stock__lte=F('minimum_stock'),
                is_active=True
            ).count()
            
            stats = {
                'today_sales': today_sales,
                'today_revenue': float(today_revenue),
                'active_alerts': active_alerts,
                'low_stock_products': low_stock_products,
                'total_products': Product.objects.filter(is_active=True).count()
            }
            
            # Envoyer les mises à jour
            async_to_sync(channel_layer.group_send)(
                'dashboard_updates',
                {
                    'type': 'stats_update',
                    'stats': stats
                }
            )
        except Exception as e:
            # Log l'erreur mais ne pas faire échouer l'opération
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Erreur lors de la mise à jour des statistiques: {str(e)}")
    
    @staticmethod
    def check_and_send_stock_alerts():
        """Vérifier et envoyer les alertes de stock automatiquement"""
        from products.models import Product
        from .models import StockAlert
        
        # Produits avec stock faible
        low_stock_products = Product.objects.filter(
            current_stock__lte=F('minimum_stock'),
            current_stock__gt=0,
            is_active=True
        )
        
        for product in low_stock_products:
            # Vérifier si une alerte existe déjà
            existing_alert = StockAlert.objects.filter(
                product=product,
                alert_type='low_stock',
                status='active'
            ).first()
            
            if not existing_alert:
                # Créer une nouvelle alerte
                alert = StockAlert.objects.create(
                    product=product,
                    alert_type='low_stock',
                    message=f"Stock faible pour {product.name}: {product.current_stock} unités restantes"
                )
                
                # Envoyer la notification
                NotificationService.send_stock_alert(product, 'low_stock')
        
        # Produits en rupture de stock
        out_of_stock_products = Product.objects.filter(
            current_stock=0,
            is_active=True
        )
        
        for product in out_of_stock_products:
            existing_alert = StockAlert.objects.filter(
                product=product,
                alert_type='out_of_stock',
                status='active'
            ).first()
            
            if not existing_alert:
                alert = StockAlert.objects.create(
                    product=product,
                    alert_type='out_of_stock',
                    message=f"Rupture de stock pour {product.name}"
                )
                
                NotificationService.send_stock_alert(product, 'out_of_stock')

# Import nécessaire pour éviter les erreurs circulaires
from .models import StockAlert
