from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from .notifications import NotificationService

User = get_user_model()

class NotificationServiceTest(TestCase):
    """Tests pour le service de notifications"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='admin'
        )
        
        self.manager = User.objects.create_user(
            username='manager',
            email='manager@example.com',
            password='testpass123',
            role='manager'
        )
    
    @patch('reports.notifications.async_to_sync')
    @patch('reports.notifications.channel_layer')
    def test_send_stock_alert_success(self, mock_channel_layer, mock_async_to_sync):
        """Test d'envoi d'alerte de stock avec succès"""
        # Mock du channel layer
        mock_channel_layer.group_send = MagicMock()
        mock_async_to_sync.return_value = MagicMock()
        
        # Mock du produit
        mock_product = MagicMock()
        mock_product.id = 1
        mock_product.name = 'Test Product'
        mock_product.category.name = 'Test Category'
        mock_product.current_stock = 5
        mock_product.minimum_stock = 10
        
        # Envoyer l'alerte
        NotificationService.send_stock_alert(mock_product, 'low_stock')
        
        # Vérifier que async_to_sync a été appelé
        mock_async_to_sync.assert_called()
    
    @patch('reports.notifications.channel_layer')
    def test_send_stock_alert_failure(self, mock_channel_layer):
        """Test d'envoi d'alerte de stock avec échec"""
        # Mock du channel layer pour lever une exception
        mock_channel_layer.group_send.side_effect = Exception("Channel error")
        
        # Mock du produit
        mock_product = MagicMock()
        mock_product.id = 1
        mock_product.name = 'Test Product'
        mock_product.category.name = 'Test Category'
        mock_product.current_stock = 5
        mock_product.minimum_stock = 10
        
        # L'envoi ne doit pas lever d'exception
        try:
            NotificationService.send_stock_alert(mock_product, 'low_stock')
        except Exception as e:
            self.fail(f"send_stock_alert() a levé une exception: {e}")
    
    @patch('reports.notifications.async_to_sync')
    @patch('reports.notifications.channel_layer')
    def test_send_sale_notification(self, mock_channel_layer, mock_async_to_sync):
        """Test d'envoi de notification de vente"""
        # Mock du channel layer
        mock_channel_layer.group_send = MagicMock()
        mock_async_to_sync.return_value = MagicMock()
        
        # Mock de la vente
        mock_sale = MagicMock()
        mock_sale.id = 1
        mock_sale.total_amount = 50.0
        mock_sale.customer_name = 'Test Customer'
        
        # Envoyer la notification
        NotificationService.send_sale_notification(mock_sale)
        
        # Vérifier que async_to_sync a été appelé
        mock_async_to_sync.assert_called()
    
    @patch('reports.notifications.async_to_sync')
    @patch('reports.notifications.channel_layer')
    def test_send_system_notification(self, mock_channel_layer, mock_async_to_sync):
        """Test d'envoi de notification système"""
        # Mock du channel layer
        mock_channel_layer.group_send = MagicMock()
        mock_async_to_sync.return_value = MagicMock()
        
        # Envoyer la notification
        NotificationService.send_system_notification(
            "Test system message", 
            level='info', 
            target_roles=['admin', 'manager']
        )
        
        # Vérifier que async_to_sync a été appelé
        mock_async_to_sync.assert_called()
    
    @patch('reports.notifications.async_to_sync')
    def test_send_system_notification_default_roles(self, mock_async_to_sync):
        """Test d'envoi de notification système avec rôles par défaut"""
        mock_async_to_sync.return_value = MagicMock()
        
        with patch('reports.notifications.channel_layer') as mock_channel_layer:
            mock_channel_layer.group_send = MagicMock()
            
            # Envoyer sans spécifier de rôles
            NotificationService.send_system_notification("Test message")
            
            # Vérifier que async_to_sync a été appelé
            mock_async_to_sync.assert_called()
    
    @patch('reports.notifications.channel_layer')
    def test_system_notification_failure(self, mock_channel_layer):
        """Test d'envoi de notification système avec échec"""
        # Mock du channel layer pour lever une exception
        mock_channel_layer.group_send.side_effect = Exception("Channel error")
        
        # L'envoi ne doit pas lever d'exception
        try:
            NotificationService.send_system_notification("Test message")
        except Exception as e:
            self.fail(f"send_system_notification() a levé une exception: {e}")
