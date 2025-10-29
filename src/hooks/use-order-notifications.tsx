import { useEffect } from 'react';
import { useNotificationHelpers } from './use-notifications';
import { useOrders } from './use-api';

/**
 * Hook pour surveiller les commandes et générer des notifications automatiques
 */
export function useOrderNotifications() {
  const { notifyNewOrder, notifyOrderReady } = useNotificationHelpers();
  const { data: ordersData } = useOrders();

  useEffect(() => {
    if (!ordersData?.results) return;

    const orders = ordersData.results;
    
    orders.forEach((order: any) => {
      const orderTime = new Date(order.created_at);
      const now = new Date();
      const minutesElapsed = Math.floor((now.getTime() - orderTime.getTime()) / 60000);

      // Notifier les commandes en retard (plus de 20 minutes en préparation)
      if (order.status === 'preparing' && minutesElapsed > 20) {
        notifyNewOrder(order.table_number || order.table?.number, order.id);
      }

      // Notifier les commandes prêtes
      if (order.status === 'ready') {
        notifyOrderReady(order.table_number || order.table?.number, order.id);
      }
    });
  }, [ordersData, notifyNewOrder, notifyOrderReady]);

  return null;
}
