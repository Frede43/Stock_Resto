import { useEffect } from 'react';
import { useNotificationHelpers } from './use-notifications';
import { useAlertsNew, useActiveAlertsCount } from './use-api';

/**
 * Hook pour intégrer les vraies alertes de la base de données
 * avec le système de notifications frontend
 */
export function useRealAlerts() {
  const { addNotification } = useNotificationHelpers();
  const { data: alertsData, isLoading } = useAlertsNew({ status: 'active' });
  const { data: alertsCount } = useActiveAlertsCount();

  useEffect(() => {
    if (!alertsData?.results || isLoading) return;

    const alerts = alertsData.results;
    
    // Traiter chaque alerte active
    alerts.forEach((alert: any) => {
      // Vérifier si cette alerte a déjà été notifiée
      const alertKey = `alert_${alert.id}`;
      const lastNotified = localStorage.getItem(alertKey);
      const now = Date.now();
      
      // Notifier seulement si l'alerte est récente (moins de 5 minutes) ou pas encore notifiée
      const shouldNotify = !lastNotified || (now - parseInt(lastNotified)) > 300000; // 5 minutes
      
      if (shouldNotify && alert.status === 'active') {
        // Déterminer le type et la priorité
        let notificationType: 'stock' | 'order' | 'system' | 'security' | 'maintenance' | 'sales' = 'system';
        let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
        
        // Mapping des types d'alertes
        switch (alert.type) {
          case 'stock':
            notificationType = 'stock';
            priority = alert.priority === 'critical' ? 'critical' : 
                     alert.priority === 'high' ? 'high' : 'medium';
            break;
          case 'sales':
            notificationType = 'sales';
            priority = alert.priority === 'critical' ? 'critical' : 'medium';
            break;
          case 'system':
            notificationType = 'system';
            priority = alert.priority === 'critical' ? 'critical' : 
                     alert.priority === 'high' ? 'high' : 'low';
            break;
          case 'security':
            notificationType = 'security';
            priority = 'critical';
            break;
          case 'maintenance':
            notificationType = 'maintenance';
            priority = 'medium';
            break;
        }
        
        // Créer la notification
        addNotification({
          type: notificationType,
          priority: priority,
          title: alert.title,
          message: alert.message,
          actionUrl: '/alerts',
          data: {
            alertId: alert.id,
            relatedProduct: alert.related_product,
            relatedSale: alert.related_sale
          }
        });
        
        // Marquer comme notifiée
        localStorage.setItem(alertKey, now.toString());
      }
    });
  }, [alertsData, isLoading, addNotification]);

  // Nettoyer les clés de notification des alertes résolues
  useEffect(() => {
    if (!alertsData?.results) return;
    
    const activeAlertIds = alertsData.results.map((alert: any) => alert.id);
    
    // Nettoyer les clés des alertes qui ne sont plus actives
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('alert_')) {
        const alertId = key.replace('alert_', '');
        if (!activeAlertIds.includes(parseInt(alertId))) {
          localStorage.removeItem(key);
        }
      }
    }
  }, [alertsData]);

  return {
    alerts: alertsData?.results || [],
    count: alertsCount?.total_active || 0,
    criticalCount: alertsCount?.critical_active || 0,
    isLoading
  };
}
