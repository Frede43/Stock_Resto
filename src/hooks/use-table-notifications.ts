import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

interface TableNotification {
  type: 'table_freed';
  table_id: number;
  table_number: string;
  table_location: string;
  freed_at: string;
  sale_reference: string;
  customer_name: string;
  total_amount: number;
  message: string;
}

interface UseTableNotificationsOptions {
  enabled?: boolean;
  pollInterval?: number; // en millisecondes
  onTableFreed?: (notification: TableNotification) => void;
}

export function useTableNotifications(options: UseTableNotificationsOptions = {}) {
  const {
    enabled = true,
    pollInterval = 10000, // 10 secondes par défaut
    onTableFreed
  } = options;

  const { toast } = useToast();
  const [notifications, setNotifications] = useState<TableNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCheckRef = useRef<Date>(new Date());
  const seenNotificationsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/api`
        : 'http://127.0.0.1:8000/api';

      const response = await fetch(`${API_URL}/sales/notifications/tables/?recent_only=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newNotifications = data.notifications || [];

        // Filtrer les nouvelles notifications (non vues)
        const unseenNotifications = newNotifications.filter((notif: TableNotification) => {
          const notifKey = `${notif.table_id}_${notif.freed_at}`;
          return !seenNotificationsRef.current.has(notifKey);
        });

        // Afficher les toasts pour les nouvelles notifications
        unseenNotifications.forEach((notif: TableNotification) => {
          const notifKey = `${notif.table_id}_${notif.freed_at}`;
          seenNotificationsRef.current.add(notifKey);

          // Toast de notification
          toast({
            title: "🎉 Table libérée !",
            description: `Table ${notif.table_number} ${notif.table_location ? `(${notif.table_location})` : ''} est maintenant disponible`,
            duration: 8000,
          });

          // Callback personnalisé
          if (onTableFreed) {
            onTableFreed(notif);
          }
        });

        setNotifications(newNotifications);
        setUnreadCount(unseenNotifications.length);
        lastCheckRef.current = new Date();
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    }
  }, [enabled, toast, onTableFreed]);

  // Polling automatique
  useEffect(() => {
    if (!enabled) return;

    // Première récupération immédiate
    fetchNotifications();

    // Puis polling régulier
    const intervalId = setInterval(fetchNotifications, pollInterval);

    return () => clearInterval(intervalId);
  }, [enabled, pollInterval, fetchNotifications]);

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    seenNotificationsRef.current.clear();
  }, []);

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    clearNotifications,
    refresh: fetchNotifications,
  };
}
