import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  type: 'stock' | 'order' | 'system' | 'security' | 'maintenance' | 'sales';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  getNotificationsByType: (type: Notification['type']) => Notification[];
  getUnreadNotifications: () => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  // Générer un ID unique
  const generateId = () => `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Ajouter une notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Afficher un toast pour les notifications importantes
    if (notification.priority === 'high' || notification.priority === 'critical') {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.priority === 'critical' ? 'destructive' : 'default',
      });
    }
  }, [toast]);

  // Marquer comme lu
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Supprimer une notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Vider toutes les notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Obtenir les notifications par type
  const getNotificationsByType = useCallback((type: Notification['type']) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  // Obtenir les notifications non lues
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.read);
  }, [notifications]);

  // Calculer le nombre de notifications non lues
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Simuler des notifications temps réel (WebSocket simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulation d'alertes de stock aléatoires
      if (Math.random() < 0.1) { // 10% de chance toutes les 30 secondes
        const stockAlerts = [
          { title: 'Stock critique', message: 'Bière Mutzig: 3 unités restantes', type: 'stock' as const, priority: 'high' as const },
          { title: 'Stock épuisé', message: 'Coca-Cola en rupture de stock', type: 'stock' as const, priority: 'critical' as const },
          { title: 'Seuil d\'alerte', message: 'Riz: Stock en dessous du seuil minimum', type: 'stock' as const, priority: 'medium' as const },
        ];
        
        const randomAlert = stockAlerts[Math.floor(Math.random() * stockAlerts.length)];
        addNotification({
          ...randomAlert,
          actionUrl: '/stocks'
        });
      }

      // Simulation d'alertes de commandes
      if (Math.random() < 0.05) { // 5% de chance
        const orderAlerts = [
          { title: 'Commande en retard', message: 'Table 5: Commande en préparation depuis 25 min', type: 'order' as const, priority: 'high' as const },
          { title: 'Nouvelle commande', message: 'Table 8: Nouvelle commande reçue', type: 'order' as const, priority: 'medium' as const },
        ];
        
        const randomAlert = orderAlerts[Math.floor(Math.random() * orderAlerts.length)];
        addNotification({
          ...randomAlert,
          actionUrl: '/orders'
        });
      }
    }, 30000); // Vérifier toutes les 30 secondes

    return () => clearInterval(interval);
  }, [addNotification]);

  // Nettoyer les anciennes notifications (plus de 24h)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      setNotifications(prev => 
        prev.filter(notification => notification.timestamp > oneDayAgo)
      );
    }, 60 * 60 * 1000); // Nettoyer toutes les heures

    return () => clearInterval(cleanupInterval);
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    getNotificationsByType,
    getUnreadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Hook pour créer des notifications spécifiques
export function useNotificationHelpers() {
  const { addNotification } = useNotifications();

  const notifyStockAlert = useCallback((productName: string, quantity: number, type: 'low' | 'out') => {
    addNotification({
      type: 'stock',
      priority: type === 'out' ? 'critical' : 'high',
      title: type === 'out' ? 'Stock épuisé' : 'Stock critique',
      message: type === 'out' 
        ? `${productName} est en rupture de stock`
        : `${productName}: ${quantity} unités restantes`,
      actionUrl: '/stocks'
    });
  }, [addNotification]);

  const notifyNewOrder = useCallback((tableNumber: number, orderId: string) => {
    addNotification({
      type: 'order',
      priority: 'medium',
      title: 'Nouvelle commande',
      message: `Table ${tableNumber}: Commande #${orderId} reçue`,
      actionUrl: `/orders?table=${tableNumber}`,
      data: { tableNumber, orderId }
    });
  }, [addNotification]);

  const notifyOrderReady = useCallback((tableNumber: number, orderId: string) => {
    addNotification({
      type: 'order',
      priority: 'high',
      title: 'Commande prête',
      message: `Table ${tableNumber}: Commande #${orderId} prête à servir`,
      actionUrl: `/orders?table=${tableNumber}`,
      data: { tableNumber, orderId }
    });
  }, [addNotification]);

  const notifySystemUpdate = useCallback((message: string) => {
    addNotification({
      type: 'system',
      priority: 'low',
      title: 'Mise à jour système',
      message,
      actionUrl: '/settings'
    });
  }, [addNotification]);

  const notifySecurityAlert = useCallback((message: string) => {
    addNotification({
      type: 'security',
      priority: 'critical',
      title: 'Alerte sécurité',
      message,
      actionUrl: '/settings'
    });
  }, [addNotification]);

  return {
    notifyStockAlert,
    notifyNewOrder,
    notifyOrderReady,
    notifySystemUpdate,
    notifySecurityAlert,
  };
}
