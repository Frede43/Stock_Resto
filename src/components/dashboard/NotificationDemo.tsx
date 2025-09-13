import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications, useNotificationHelpers } from '@/hooks/use-notifications';
import {
  Bell,
  Package,
  Clock,
  AlertTriangle,
  Shield,
  DollarSign,
  Plus,
  Trash2
} from 'lucide-react';

export function NotificationDemo() {
  const { notifications, unreadCount, clearAll } = useNotifications();
  const {
    notifyStockAlert,
    notifyNewOrder,
    notifyOrderReady,
    notifySystemUpdate,
    notifySecurityAlert
  } = useNotificationHelpers();

  const [demoCounter, setDemoCounter] = useState(1);

  const demoNotifications = [
    {
      title: 'Démonstration Stock Critique',
      action: () => notifyStockAlert(`Produit Demo ${demoCounter}`, 3, 'low'),
      icon: Package,
      color: 'bg-orange-500'
    },
    {
      title: 'Démonstration Stock Épuisé',
      action: () => notifyStockAlert(`Produit Demo ${demoCounter}`, 0, 'out'),
      icon: Package,
      color: 'bg-red-500'
    },
    {
      title: 'Démonstration Nouvelle Commande',
      action: () => notifyNewOrder(Math.floor(Math.random() * 20) + 1, `ORD${demoCounter}`),
      icon: Clock,
      color: 'bg-blue-500'
    },
    {
      title: 'Démonstration Commande Prête',
      action: () => notifyOrderReady(Math.floor(Math.random() * 20) + 1, `ORD${demoCounter}`),
      icon: Clock,
      color: 'bg-green-500'
    },
    {
      title: 'Démonstration Mise à jour Système',
      action: () => notifySystemUpdate(`Mise à jour demo ${demoCounter} disponible`),
      icon: Bell,
      color: 'bg-purple-500'
    },
    {
      title: 'Démonstration Alerte Sécurité',
      action: () => notifySecurityAlert(`Tentative d'accès non autorisé détectée #${demoCounter}`),
      icon: Shield,
      color: 'bg-red-600'
    }
  ];

  const handleDemoNotification = (action: () => void) => {
    action();
    setDemoCounter(prev => prev + 1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Centre de Notifications - Démonstration
        </CardTitle>
        <CardDescription>
          Testez le système de notifications en temps réel
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Statistiques */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-medium">Total notifications:</span>
              <Badge variant="secondary">{notifications.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Non lues:</span>
              <Badge variant="destructive">{unreadCount}</Badge>
            </div>
          </div>
          
          {notifications.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAll}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Effacer tout
            </Button>
          )}
        </div>

        {/* Boutons de démonstration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {demoNotifications.map((demo, index) => {
            const Icon = demo.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 justify-start gap-3"
                onClick={() => handleDemoNotification(demo.action)}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${demo.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{demo.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Cliquez pour tester
                  </div>
                </div>
                <Plus className="h-4 w-4 ml-auto" />
              </Button>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Cliquez sur les boutons ci-dessus pour générer des notifications de test</li>
            <li>• Les notifications apparaîtront dans l'icône cloche du header</li>
            <li>• Les notifications critiques déclenchent des toasts automatiques</li>
            <li>• Le système simule aussi des notifications automatiques toutes les 30 secondes</li>
          </ul>
        </div>

        {/* Aperçu des notifications récentes */}
        {notifications.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Dernières notifications:</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {notifications.slice(0, 5).map((notification) => {
                const getIcon = () => {
                  switch (notification.type) {
                    case 'stock': return Package;
                    case 'order': return Clock;
                    case 'security': return Shield;
                    case 'sales': return DollarSign;
                    default: return Bell;
                  }
                };
                
                const Icon = getIcon();
                
                return (
                  <div key={notification.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className={`h-6 w-6 rounded flex items-center justify-center ${
                      notification.priority === 'critical' ? 'bg-red-500' :
                      notification.priority === 'high' ? 'bg-orange-500' :
                      notification.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{notification.title}</span>
                        <Badge variant="secondary" className="text-xs">
                          {notification.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
