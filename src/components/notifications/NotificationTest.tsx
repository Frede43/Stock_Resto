import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications, useNotificationHelpers } from '@/hooks/use-notifications';
import { useWebSocketNotifications } from '@/hooks/use-websocket-notifications';
import { useRealAlerts } from '@/hooks/use-real-alerts';
import {
  Bell,
  Package,
  Clock,
  AlertTriangle,
  Shield,
  DollarSign,
  Plus,
  Trash2,
  Wifi,
  WifiOff
} from 'lucide-react';

export function NotificationTest() {
  const { notifications, unreadCount, clearAll } = useNotifications();
  const { notifyStockAlert, notifyNewOrder, notifyOrderReady, notifySystemUpdate, notifySecurityAlert } = useNotificationHelpers();
  const { isConnected } = useWebSocketNotifications();
  const { alerts, count: activeAlerts, isLoading } = useRealAlerts();

  const [demoCounter, setDemoCounter] = useState(1);

  const handleDemoNotification = (action: () => void) => {
    action();
    setDemoCounter(prev => prev + 1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Test des Notifications Dynamiques
        </CardTitle>
        <CardDescription>
          Testez le système de notifications en temps réel connecté à la base de données
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Statut de connexion */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-sm font-medium">WebSocket:</span>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? 'Connecté' : 'Déconnecté'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-medium">Notifications:</span>
              <Badge variant="secondary">{notifications.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Non lues:</span>
              <Badge variant="destructive">{unreadCount}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Alertes DB:</span>
              <Badge variant="outline">{activeAlerts}</Badge>
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

        {/* Boutons de test avec données dynamiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto p-4 justify-start gap-3"
            onClick={() => handleDemoNotification(() => 
              notifyStockAlert(`Produit Dynamique ${demoCounter}`, 3, 'low')
            )}
          >
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-orange-500">
              <Package className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">Test Stock Critique</div>
              <div className="text-xs text-muted-foreground">
                Génère une notification de stock dynamique
              </div>
            </div>
            <Plus className="h-4 w-4 ml-auto" />
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 justify-start gap-3"
            onClick={() => handleDemoNotification(() => 
              notifyNewOrder(Math.floor(Math.random() * 20) + 1, `ORD${demoCounter}`)
            )}
          >
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-blue-500">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">Test Nouvelle Commande</div>
              <div className="text-xs text-muted-foreground">
                Génère une notification de commande
              </div>
            </div>
            <Plus className="h-4 w-4 ml-auto" />
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 justify-start gap-3"
            onClick={() => handleDemoNotification(() => 
              notifySystemUpdate(`Mise à jour système dynamique #${demoCounter}`)
            )}
          >
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-purple-500">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">Test Notification Système</div>
              <div className="text-xs text-muted-foreground">
                Génère une notification système
              </div>
            </div>
            <Plus className="h-4 w-4 ml-auto" />
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 justify-start gap-3"
            onClick={() => handleDemoNotification(() => 
              notifySecurityAlert(`Alerte sécurité dynamique #${demoCounter}`)
            )}
          >
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-red-600">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">Test Alerte Sécurité</div>
              <div className="text-xs text-muted-foreground">
                Génère une alerte de sécurité
              </div>
            </div>
            <Plus className="h-4 w-4 ml-auto" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>WebSocket:</strong> Connecté en temps réel au backend Django</li>
            <li>• <strong>Alertes DB:</strong> Affichage des vraies alertes de la base de données</li>
            <li>• <strong>Notifications:</strong> Système hybride (local + WebSocket)</li>
            <li>• <strong>Test:</strong> Cliquez sur les boutons pour générer des notifications</li>
          </ul>
        </div>

        {/* Aperçu des alertes de la base de données */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Alertes actives de la base de données:</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {alerts.slice(0, 3).map((alert: any) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className={`h-6 w-6 rounded flex items-center justify-center ${
                    alert.priority === 'critical' ? 'bg-red-500' :
                    alert.priority === 'high' ? 'bg-orange-500' :
                    alert.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}>
                    <AlertTriangle className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{alert.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {alert.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
