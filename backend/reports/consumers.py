import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    """Consumer pour les notifications personnalisées par utilisateur"""
    
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'notifications_{self.user_id}'
        
        # Rejoindre le groupe de notifications de l'utilisateur
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Envoyer un message de bienvenue
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connexion aux notifications établie',
            'timestamp': timezone.now().isoformat()
        }))
    
    async def disconnect(self, close_code):
        # Quitter le groupe
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Recevoir des messages du client"""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type', 'ping')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': timezone.now().isoformat()
                }))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Format JSON invalide'
            }))
    
    # Handlers pour différents types de notifications
    async def stock_alert(self, event):
        """Envoyer une alerte de stock"""
        await self.send(text_data=json.dumps({
            'type': 'stock_alert',
            'alert': event['alert'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def sale_notification(self, event):
        """Envoyer une notification de vente"""
        await self.send(text_data=json.dumps({
            'type': 'sale_notification',
            'sale': event['sale'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def system_notification(self, event):
        """Envoyer une notification système"""
        await self.send(text_data=json.dumps({
            'type': 'system_notification',
            'message': event['message'],
            'level': event.get('level', 'info'),
            'timestamp': timezone.now().isoformat()
        }))

class AlertConsumer(AsyncWebsocketConsumer):
    """Consumer pour les alertes globales (stock, système)"""
    
    async def connect(self):
        self.room_group_name = 'global_alerts'
        
        # Rejoindre le groupe d'alertes globales
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Envoyer les alertes actives au moment de la connexion
        await self.send_active_alerts()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    @database_sync_to_async
    def get_active_alerts(self):
        """Récupérer les alertes actives"""
        from .models import StockAlert
        from products.models import Product
        
        alerts = []
        
        # Alertes de stock
        stock_alerts = StockAlert.objects.filter(status='active').select_related('product')
        for alert in stock_alerts:
            alerts.append({
                'id': alert.id,
                'type': 'stock_alert',
                'product_name': alert.product.name,
                'current_stock': alert.product.current_stock,
                'minimum_stock': alert.product.minimum_stock,
                'alert_type': alert.alert_type,
                'created_at': alert.created_at.isoformat()
            })
        
        # Produits en rupture de stock
        out_of_stock = Product.objects.filter(current_stock=0, is_active=True)
        for product in out_of_stock:
            alerts.append({
                'type': 'out_of_stock',
                'product_name': product.name,
                'category': product.category.name,
                'current_stock': 0
            })
        
        return alerts
    
    async def send_active_alerts(self):
        """Envoyer les alertes actives"""
        alerts = await self.get_active_alerts()
        await self.send(text_data=json.dumps({
            'type': 'active_alerts',
            'alerts': alerts,
            'count': len(alerts),
            'timestamp': timezone.now().isoformat()
        }))
    
    # Handlers pour les alertes
    async def new_stock_alert(self, event):
        """Nouvelle alerte de stock"""
        await self.send(text_data=json.dumps({
            'type': 'new_stock_alert',
            'alert': event['alert'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def alert_resolved(self, event):
        """Alerte résolue"""
        await self.send(text_data=json.dumps({
            'type': 'alert_resolved',
            'alert_id': event['alert_id'],
            'timestamp': timezone.now().isoformat()
        }))

class DashboardConsumer(AsyncWebsocketConsumer):
    """Consumer pour les mises à jour du tableau de bord en temps réel"""
    
    async def connect(self):
        self.room_group_name = 'dashboard_updates'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Envoyer les statistiques actuelles
        await self.send_dashboard_stats()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    @database_sync_to_async
    def get_dashboard_stats(self):
        """Récupérer les statistiques du tableau de bord"""
        from .models import DailyReport
        from sales.models import Sale
        from products.models import Product
        
        today = timezone.now().date()
        
        # Statistiques du jour
        today_sales = Sale.objects.filter(created_at__date=today).count()
        today_revenue = Sale.objects.filter(
            created_at__date=today, 
            status='completed'
        ).aggregate(
            total=models.Sum('total_amount')
        )['total'] or 0
        
        # Alertes
        active_alerts = StockAlert.objects.filter(status='active').count()
        low_stock_products = Product.objects.filter(
            current_stock__lte=models.F('minimum_stock'),
            is_active=True
        ).count()
        
        return {
            'today_sales': today_sales,
            'today_revenue': float(today_revenue),
            'active_alerts': active_alerts,
            'low_stock_products': low_stock_products,
            'total_products': Product.objects.filter(is_active=True).count()
        }
    
    async def send_dashboard_stats(self):
        """Envoyer les statistiques du tableau de bord"""
        stats = await self.get_dashboard_stats()
        await self.send(text_data=json.dumps({
            'type': 'dashboard_stats',
            'stats': stats,
            'timestamp': timezone.now().isoformat()
        }))
    
    # Handlers pour les mises à jour
    async def stats_update(self, event):
        """Mise à jour des statistiques"""
        await self.send(text_data=json.dumps({
            'type': 'stats_update',
            'stats': event['stats'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def new_sale(self, event):
        """Nouvelle vente"""
        await self.send(text_data=json.dumps({
            'type': 'new_sale',
            'sale': event['sale'],
            'timestamp': timezone.now().isoformat()
        }))


class ReportConsumer(AsyncWebsocketConsumer):
    """
    Consumer WebSocket pour les mises à jour temps réel des rapports
    """

    async def connect(self):
        """Connexion WebSocket"""
        self.room_group_name = 'reports'

        # Rejoindre le groupe
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Envoyer les données initiales
        await self.send_initial_data()

    async def disconnect(self, close_code):
        """Déconnexion WebSocket"""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Recevoir des messages du client"""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')

            if message_type == 'get_daily_report':
                date = text_data_json.get('date', timezone.now().date().isoformat())
                await self.send_daily_report(date)
            elif message_type == 'get_alerts':
                await self.send_alerts()
            elif message_type == 'refresh_data':
                await self.send_initial_data()

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Format JSON invalide'
            }))

    async def send_initial_data(self):
        """Envoyer les données initiales"""
        today = timezone.now().date()
        await self.send_daily_report(today.isoformat())
        await self.send_alerts()

    async def send_daily_report(self, date_str):
        """Envoyer le rapport quotidien"""
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            report_data = await self.get_daily_report_data(date)

            await self.send(text_data=json.dumps({
                'type': 'daily_report',
                'data': report_data
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Erreur lors de la récupération du rapport: {str(e)}'
            }))

    async def send_alerts(self):
        """Envoyer les alertes de stock"""
        try:
            alerts_data = await self.get_alerts_data()

            await self.send(text_data=json.dumps({
                'type': 'alerts',
                'data': alerts_data
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Erreur lors de la récupération des alertes: {str(e)}'
            }))

    @database_sync_to_async
    def get_daily_report_data(self, date):
        """Récupérer les données du rapport quotidien"""
        try:
            from .models import DailyReport
            # Essayer de récupérer le rapport existant
            report = DailyReport.objects.filter(date=date).first()

            if report:
                return {
                    'date': date.isoformat(),
                    'total_sales': float(report.total_sales),
                    'total_revenue': float(report.total_revenue),
                    'total_profit': float(report.total_profit),
                    'total_expenses': float(report.total_expenses),
                    'net_result': float(report.net_result),
                    'products_sold': report.products_sold,
                    'cash_sales': report.cash_sales,
                    'mobile_sales': report.mobile_sales,
                    'pending_sales': report.pending_sales,
                    'low_stock_alerts': report.low_stock_alerts,
                    'out_of_stock_alerts': report.out_of_stock_alerts
                }
            else:
                # Générer un rapport vide pour la date
                return {
                    'date': date.isoformat(),
                    'total_sales': 0,
                    'total_revenue': 0,
                    'total_profit': 0,
                    'total_expenses': 0,
                    'net_result': 0,
                    'products_sold': 0,
                    'cash_sales': 0,
                    'mobile_sales': 0,
                    'pending_sales': 0,
                    'low_stock_alerts': 0,
                    'out_of_stock_alerts': 0
                }
        except Exception as e:
            return {
                'error': str(e),
                'date': date.isoformat()
            }

    @database_sync_to_async
    def get_alerts_data(self):
        """Récupérer les données des alertes"""
        try:
            from .models import StockAlert
            alerts = StockAlert.objects.filter(status='active').order_by('-created_at')[:10]

            alerts_list = []
            for alert in alerts:
                alerts_list.append({
                    'id': alert.id,
                    'type': alert.alert_type,
                    'product_name': alert.product.name if alert.product else 'Produit inconnu',
                    'message': alert.message,
                    'severity': alert.severity,
                    'created_at': alert.created_at.isoformat(),
                    'current_stock': alert.current_stock,
                    'threshold': alert.threshold
                })

            return {
                'alerts': alerts_list,
                'total_count': len(alerts_list)
            }
        except Exception as e:
            return {
                'error': str(e),
                'alerts': [],
                'total_count': 0
            }

    # Méthodes pour recevoir les messages du groupe
    async def report_update(self, event):
        """Recevoir une mise à jour de rapport"""
        await self.send(text_data=json.dumps({
            'type': 'report_update',
            'data': event['data']
        }))

    async def alert_update(self, event):
        """Recevoir une mise à jour d'alerte"""
        await self.send(text_data=json.dumps({
            'type': 'alert_update',
            'data': event['data']
        }))
