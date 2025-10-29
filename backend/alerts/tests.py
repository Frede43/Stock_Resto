from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Alert
from .serializers import AlertSerializer

User = get_user_model()

class AlertModelTest(TestCase):
    """Tests pour le modèle Alert"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='admin'
        )
    
    def test_alert_creation(self):
        """Test de création d'une alerte"""
        alert = Alert.objects.create(
            type='stock',
            priority='high',
            title='Stock bas',
            message='Le produit X est en rupture de stock',
            created_by=self.user
        )
        
        self.assertEqual(alert.type, 'stock')
        self.assertEqual(alert.priority, 'high')
        self.assertEqual(alert.status, 'active')
        self.assertEqual(alert.title, 'Stock bas')
        self.assertIsNotNone(alert.created_at)
    
    def test_alert_resolve(self):
        """Test de résolution d'une alerte"""
        alert = Alert.objects.create(
            type='stock',
            priority='high',
            title='Stock bas',
            message='Le produit X est en rupture de stock',
            created_by=self.user
        )
        
        self.assertEqual(alert.status, 'active')
        self.assertIsNone(alert.resolved_at)
        self.assertIsNone(alert.resolved_by)
        
        # Résoudre l'alerte
        alert.resolve(user=self.user)
        
        self.assertEqual(alert.status, 'resolved')
        self.assertIsNotNone(alert.resolved_at)
        self.assertEqual(alert.resolved_by, self.user)
    
    def test_alert_str_representation(self):
        """Test de la représentation string de l'alerte"""
        alert = Alert.objects.create(
            type='stock',
            priority='high',
            title='Stock bas',
            message='Le produit X est en rupture de stock',
            created_by=self.user
        )
        
        expected = f"Élevé - Stock bas"
        self.assertEqual(str(alert), expected)

class AlertSerializerTest(TestCase):
    """Tests pour les sérializers d'alertes"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='admin'
        )
        self.alert = Alert.objects.create(
            type='stock',
            priority='high',
            title='Stock bas',
            message='Le produit X est en rupture de stock',
            created_by=self.user
        )
    
    def test_alert_serializer(self):
        """Test du sérializer principal"""
        serializer = AlertSerializer(self.alert)
        data = serializer.data
        
        self.assertEqual(data['type'], 'stock')
        self.assertEqual(data['priority'], 'high')
        self.assertEqual(data['title'], 'Stock bas')
        self.assertEqual(data['status'], 'active')
        self.assertIn('created_at', data)
        self.assertIn('created_by', data)
    
    def test_alert_create_serializer(self):
        """Test du sérializer de création"""
        from .serializers import AlertCreateSerializer
        
        data = {
            'type': 'system',
            'priority': 'medium',
            'title': 'Maintenance',
            'message': 'Maintenance programmée'
        }
        
        # Simuler le contexte de requête
        class MockRequest:
            user = self.user
        
        serializer = AlertCreateSerializer(data=data, context={'request': MockRequest()})
        self.assertTrue(serializer.is_valid())
        
        alert = serializer.save()
        
        self.assertEqual(alert.type, 'system')
        self.assertEqual(alert.priority, 'medium')
        self.assertEqual(alert.created_by, self.user)

