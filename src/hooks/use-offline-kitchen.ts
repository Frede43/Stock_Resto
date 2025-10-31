// Hook pour gérer les commandes cuisine en mode offline
import { useCallback } from 'react';
import { offlineStorage } from '@/services/offline-storage';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://127.0.0.1:8000/api';

export function useOfflineKitchen() {
  const { isOnline, addToQueue } = useOfflineSync();
  const { toast } = useToast();

  // Créer une commande
  const createOrder = useCallback(async (orderData: any) => {
    if (!isOnline) {
      // Mode offline
      const offlineId = `offline-order-${Date.now()}`;
      const order = { ...orderData, id: offlineId };
      
      await offlineStorage.saveOrder(order, false);
      await addToQueue('create', '/sales/orders/', orderData);
      
      toast({
        title: '📡 Mode hors ligne',
        description: 'Commande enregistrée. Sera synchronisée quand internet reviendra.',
        duration: 3000,
      });
      
      return { id: offlineId, ...orderData };
    } else {
      // Mode online
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/sales/orders/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        });

        if (response.ok) {
          const order = await response.json();
          await offlineStorage.saveOrder(order, true);
          return order;
        } else {
          throw new Error('Erreur lors de la création de la commande');
        }
      } catch (error) {
        console.error('Erreur création commande:', error);
        
        // Fallback offline si erreur réseau
        const offlineId = `offline-order-${Date.now()}`;
        const order = { ...orderData, id: offlineId };
        
        await offlineStorage.saveOrder(order, false);
        await addToQueue('create', '/sales/orders/', orderData);
        
        toast({
          title: '⚠️ Erreur réseau',
          description: 'Commande sauvegardée localement. Sera synchronisée plus tard.',
          variant: 'destructive',
          duration: 5000,
        });
        
        return { id: offlineId, ...orderData };
      }
    }
  }, [isOnline, addToQueue, toast]);

  // Mettre à jour le statut d'une commande
  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    if (!isOnline) {
      // Mode offline
      await offlineStorage.updateOrder(orderId, { status });
      await addToQueue('update', `/sales/orders/${orderId}/`, { status });
      
      toast({
        title: '📡 Mode hors ligne',
        description: `Statut "${status}" enregistré. Sera synchronisé plus tard.`,
        duration: 2000,
      });
    } else {
      // Mode online
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/sales/orders/${orderId}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        });

        if (response.ok) {
          const order = await response.json();
          await offlineStorage.updateOrder(orderId, order);
        } else {
          throw new Error('Erreur lors de la mise à jour');
        }
      } catch (error) {
        console.error('Erreur mise à jour commande:', error);
        
        // Fallback offline
        await offlineStorage.updateOrder(orderId, { status });
        await addToQueue('update', `/sales/orders/${orderId}/`, { status });
        
        toast({
          title: '⚠️ Erreur réseau',
          description: 'Statut sauvegardé localement. Sera synchronisé plus tard.',
          variant: 'destructive',
          duration: 3000,
        });
      }
    }
  }, [isOnline, addToQueue, toast]);

  // Marquer un plat comme "en préparation"
  const markAsPreparing = useCallback(async (orderId: string) => {
    await updateOrderStatus(orderId, 'preparing');
  }, [updateOrderStatus]);

  // Marquer un plat comme "prêt"
  const markAsReady = useCallback(async (orderId: string) => {
    await updateOrderStatus(orderId, 'ready');
  }, [updateOrderStatus]);

  // Marquer un plat comme "servi"
  const markAsServed = useCallback(async (orderId: string) => {
    await updateOrderStatus(orderId, 'served');
  }, [updateOrderStatus]);

  // Ajouter un commentaire à une commande
  const addComment = useCallback(async (orderId: string, comment: string) => {
    if (!isOnline) {
      await offlineStorage.updateOrder(orderId, { chef_notes: comment });
      await addToQueue('update', `/sales/orders/${orderId}/`, { chef_notes: comment });
      
      toast({
        title: '📡 Mode hors ligne',
        description: 'Commentaire enregistré. Sera synchronisé plus tard.',
        duration: 2000,
      });
    } else {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/sales/orders/${orderId}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ chef_notes: comment }),
        });

        if (response.ok) {
          const order = await response.json();
          await offlineStorage.updateOrder(orderId, order);
        }
      } catch (error) {
        await offlineStorage.updateOrder(orderId, { chef_notes: comment });
        await addToQueue('update', `/sales/orders/${orderId}/`, { chef_notes: comment });
      }
    }
  }, [isOnline, addToQueue, toast]);

  // Récupérer toutes les commandes (depuis cache si offline)
  const getAllOrders = useCallback(async () => {
    if (!isOnline) {
      const orders = await offlineStorage.getAllOrders();
      return orders.map(o => o.data);
    } else {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/sales/orders/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const orders = data.results || data;
          
          // Mettre en cache
          for (const order of orders) {
            await offlineStorage.saveOrder(order, true);
          }
          
          return orders;
        }
      } catch (error) {
        // Fallback sur cache
        const orders = await offlineStorage.getAllOrders();
        return orders.map(o => o.data);
      }
    }
    
    return [];
  }, [isOnline]);

  return {
    createOrder,
    updateOrderStatus,
    markAsPreparing,
    markAsReady,
    markAsServed,
    addComment,
    getAllOrders,
  };
}
