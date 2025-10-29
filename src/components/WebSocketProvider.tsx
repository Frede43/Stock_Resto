import { useEffect } from 'react';
import { useWebSocketNotifications } from '@/hooks/use-websocket-notifications';
import { useRealAlerts } from '@/hooks/use-real-alerts';

/**
 * Composant pour initialiser les services de notifications WebSocket
 * et les alertes réelles de la base de données
 */
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  // Initialiser les notifications WebSocket
  const { isConnected } = useWebSocketNotifications();
  
  // Initialiser les alertes réelles
  useRealAlerts();

  useEffect(() => {
    if (isConnected) {
      console.log('🚀 Services de notifications initialisés avec succès');
    }
  }, [isConnected]);

  return <>{children}</>;
}
