// Hook pour gérer la synchronisation offline
import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '@/services/offline-storage';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://127.0.0.1:8000/api';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { toast } = useToast();

  // Synchroniser les données en attente
  const syncPendingData = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    console.log('🔄 Début de la synchronisation...');

    try {
      const queue = await offlineStorage.getSyncQueue();
      console.log(`📊 ${queue.length} éléments à synchroniser`);

      if (queue.length === 0) {
        setIsSyncing(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const item of queue) {
        try {
          const token = localStorage.getItem('access_token');
          
          if (!token) {
            console.warn('⚠️ Pas de token d\'authentification');
            errorCount++;
            continue;
          }

          const response = await fetch(`${API_URL}${item.endpoint}`, {
            method: item.type === 'create' ? 'POST' : 
                    item.type === 'update' ? 'PATCH' : 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: item.type !== 'delete' ? JSON.stringify(item.data) : undefined,
          });

          if (response.ok) {
            // Succès : supprimer de la file
            await offlineStorage.removeSyncItem(item.id);
            successCount++;
            console.log(`✅ Synchronisé: ${item.endpoint}`);
            
            // Marquer l'élément comme synchronisé dans IndexedDB
            if (item.type === 'create' && item.endpoint.includes('/orders/')) {
              const orderId = item.data.id || `offline-order-${item.id}`;
              await offlineStorage.markOrderAsSynced(orderId);
            } else if (item.type === 'create' && item.endpoint.includes('/sales/')) {
              const saleId = item.data.id || `offline-sale-${item.id}`;
              await offlineStorage.markSaleAsSynced(saleId);
            } else if (item.type === 'create' && item.endpoint.includes('/payments/')) {
              const paymentId = item.data.id || `offline-payment-${item.id}`;
              await offlineStorage.markPaymentAsSynced(paymentId);
            } else if (item.type === 'create' && item.endpoint.includes('/stock/')) {
              const movementId = item.data.id || `offline-stock-${item.id}`;
              await offlineStorage.markStockMovementAsSynced(movementId);
            }
          } else if (response.status === 401) {
            // Token expiré
            console.error('❌ Token expiré - Reconnexion nécessaire');
            toast({
              title: '🔐 Session expirée',
              description: 'Veuillez vous reconnecter pour synchroniser les données',
              variant: 'destructive',
              duration: 7000,
            });
            break; // Arrêter la synchronisation
          } else {
            // Échec : incrémenter les tentatives
            await offlineStorage.incrementRetries(item.id);
            errorCount++;
            console.error(`❌ Échec sync: ${item.endpoint}`, response.status);
          }
        } catch (error) {
          // Erreur réseau : incrémenter les tentatives
          await offlineStorage.incrementRetries(item.id);
          errorCount++;
          console.error(`❌ Erreur sync: ${item.endpoint}`, error);
        }
      }

      // Notification de résultat
      if (successCount > 0) {
        toast({
          title: '✅ Synchronisation réussie',
          description: `${successCount} élément(s) synchronisé(s)`,
          duration: 3000,
        });
      }

      if (errorCount > 0) {
        toast({
          title: '⚠️ Synchronisation partielle',
          description: `${errorCount} élément(s) en échec. Nouvelle tentative plus tard.`,
          variant: 'destructive',
          duration: 5000,
        });
      }

      // Mettre à jour le compteur
      const remainingQueue = await offlineStorage.getSyncQueue();
      setPendingCount(remainingQueue.length);

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      toast({
        title: '❌ Erreur de synchronisation',
        description: 'Une erreur est survenue. Réessayez plus tard.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSyncing(false);
      console.log('🏁 Fin de la synchronisation');
    }
  }, [isSyncing, toast]);

  // Détecter les changements de connexion
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connexion internet rétablie');
      setIsOnline(true);
      toast({
        title: '🌐 Connexion rétablie',
        description: 'Synchronisation des données en cours...',
        duration: 3000,
      });
      // Synchroniser après un délai pour laisser la connexion se stabiliser
      setTimeout(() => syncPendingData(), 2000);
    };

    const handleOffline = () => {
      console.log('📡 Connexion internet perdue');
      setIsOnline(false);
      toast({
        title: '📡 Mode hors ligne',
        description: 'Les modifications seront synchronisées quand internet reviendra',
        variant: 'destructive',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingData, toast]);

  // Compter les éléments en attente
  useEffect(() => {
    const updatePendingCount = async () => {
      const queue = await offlineStorage.getSyncQueue();
      setPendingCount(queue.length);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    return () => clearInterval(interval);
  }, []);


  // Synchronisation automatique toutes les 30 secondes si en ligne
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      syncPendingData();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [isOnline, syncPendingData]);

  // Ajouter une action à la file de synchronisation
  const addToQueue = useCallback(async (
    type: 'create' | 'update' | 'delete',
    endpoint: string,
    data: any
  ) => {
    await offlineStorage.addToSyncQueue(type, endpoint, data);
    setPendingCount(prev => prev + 1);
    
    // Si en ligne, synchroniser immédiatement
    if (navigator.onLine) {
      setTimeout(() => syncPendingData(), 1000);
    }
  }, [syncPendingData]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncPendingData,
    addToQueue,
  };
}
