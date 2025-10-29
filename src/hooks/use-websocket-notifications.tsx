import { useEffect, useRef } from 'react';
import { useNotificationHelpers } from './use-notifications';

interface WebSocketNotification {
  type: 'stock_alert' | 'sale_notification' | 'system_notification' | 'pong';
  alert?: any;
  sale?: any;
  message?: string;
  level?: string;
}

/**
 * Hook pour gérer les notifications WebSocket en temps réel
 */
export function useWebSocketNotifications() {
  const { addNotification } = useNotificationHelpers();
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // Récupérer l'utilisateur connecté
        const user = localStorage.getItem('user');
        const userId = user ? JSON.parse(user).id : '1';
        
        // URL WebSocket - Pointer vers le backend Django
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // ✅ CORRIGÉ: Utiliser le backend Django au lieu du serveur Vite
        const backendHost = import.meta.env.VITE_API_URL?.replace('http://', '').replace('https://', '') || 'localhost:8000';
        const wsUrl = `${wsProtocol}//${backendHost}/ws/notifications/${userId}/`;
        
        console.log('🔗 Connexion WebSocket:', wsUrl);
        
        websocketRef.current = new WebSocket(wsUrl);
        
        websocketRef.current.onopen = () => {
          console.log('✅ Connexion WebSocket notifications établie');
        };
        
        websocketRef.current.onmessage = (event) => {
          try {
            const data: WebSocketNotification = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (error) {
            console.error('❌ Erreur parsing message WebSocket:', error);
          }
        };
        
        websocketRef.current.onclose = () => {
          console.log('🔌 Connexion WebSocket fermée');
          scheduleReconnect();
        };
        
        websocketRef.current.onerror = (error) => {
          console.error('❌ Erreur WebSocket:', error);
        };
        
      } catch (error) {
        console.error('❌ Erreur connexion WebSocket:', error);
        scheduleReconnect();
      }
    };

    const handleWebSocketMessage = (data: WebSocketNotification) => {
      switch (data.type) {
        case 'stock_alert':
          if (data.alert) {
            addNotification({
              type: 'stock',
              priority: data.alert.alert_type === 'out_of_stock' ? 'critical' : 'high',
              title: data.alert.alert_type === 'out_of_stock' ? 'Stock épuisé' : 'Stock critique',
              message: data.alert.alert_type === 'out_of_stock' 
                ? `${data.alert.product_name} est en rupture de stock`
                : `${data.alert.product_name}: ${data.alert.current_stock} unités restantes`,
              actionUrl: '/stocks',
              data: { alert: data.alert }
            });
          }
          break;
          
        case 'sale_notification':
          if (data.sale) {
            addNotification({
              type: 'sales',
              priority: 'medium',
              title: 'Nouvelle vente',
              message: `Vente de ${data.sale.total_amount}€ - ${data.sale.customer_name || 'Client'}`,
              actionUrl: '/sales',
              data: { sale: data.sale }
            });
          }
          break;
          
        case 'system_notification':
          if (data.message) {
            const priority = data.level === 'error' ? 'critical' : 
                           data.level === 'warning' ? 'high' : 'medium';
            
            addNotification({
              type: 'system',
              priority,
              title: 'Notification système',
              message: data.message,
              actionUrl: '/settings'
            });
          }
          break;
          
        case 'pong':
          // Réponse au ping - connexion active
          break;
          
        default:
          console.log('📨 Notification WebSocket reçue:', data);
      }
    };

    const scheduleReconnect = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Tentative de reconnexion WebSocket...');
        connectWebSocket();
      }, 5000);
    };

    const sendPing = () => {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    };

    // Connexion initiale
    connectWebSocket();

    // Ping périodique pour maintenir la connexion
    const pingInterval = setInterval(sendPing, 30000);

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearInterval(pingInterval);
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [addNotification]);

  return {
    isConnected: websocketRef.current?.readyState === WebSocket.OPEN
  };
}
