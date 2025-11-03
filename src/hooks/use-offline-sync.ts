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
  const [syncProgress, setSyncProgress] = useState(0);
  const [conflictsCount, setConflictsCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const { toast } = useToast();

  // Synchroniser les données en attente avec logique avancée
  const syncPendingData = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    setSyncProgress(0);
    const startTime = Date.now();
    console.log('🔄 Début de la synchronisation avancée...');

    try {
      // Auto-résoudre les conflits simples
      const autoResolved = await offlineStorage.autoResolveConflicts();
      if (autoResolved > 0) {
        console.log(`🤖 ${autoResolved} conflits auto-résolus`);
      }

      const queue = await offlineStorage.getSyncQueue();
      console.log(`📊 ${queue.length} éléments à synchroniser`);

      if (queue.length === 0) {
        setIsSyncing(false);
        setSyncProgress(100);
        await offlineStorage.setLastSyncTime();
        setLastSyncTime(new Date().toISOString());
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      let conflictCount = 0;
      const totalItems = queue.length;

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];

        // Mettre à jour la progression
        setSyncProgress(Math.round(((i + 1) / totalItems) * 100));

        try {
          // Vérifier si l'item peut être synchronisé (dépendances)
          const canSync = await offlineStorage.canSyncItem(item.id);
          if (!canSync) {
            console.log(`⏸️ Item ${item.id} ignoré (dépendances non satisfaites)`);
            continue;
          }

          const token = localStorage.getItem('access_token');

          if (!token) {
            console.warn('⚠️ Pas de token d\'authentification');
            await offlineStorage.updateSyncItemStatus(item.id, 'failed', 'No auth token');
            errorCount++;
            continue;
          }

          // Marquer comme en cours de synchronisation
          await offlineStorage.updateSyncItemStatus(item.id, 'syncing');

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
            // Succès
            await offlineStorage.updateSyncItemStatus(item.id, 'success');
            await offlineStorage.removeSyncItem(item.id);
            successCount++;
            console.log(`✅ Synchronisé [${item.priority === 1 ? 'HAUTE' : item.priority === 2 ? 'MOYENNE' : 'BASSE'}]: ${item.endpoint}`);

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
            await offlineStorage.updateSyncItemStatus(item.id, 'failed', 'Token expired');
            toast({
              title: '🔐 Session expirée',
              description: 'Veuillez vous reconnecter pour synchroniser les données',
              variant: 'destructive',
              duration: 7000,
            });
            break; // Arrêter la synchronisation
          } else if (response.status === 409) {
            // Conflit de données
            const serverData = await response.json();
            await offlineStorage.addConflict('data', item.data, serverData, false);
            await offlineStorage.updateSyncItemStatus(item.id, 'failed', 'Data conflict');
            conflictCount++;
            console.warn(`⚠️ Conflit détecté: ${item.endpoint}`);
          } else {
            // Échec : incrémenter les tentatives
            const errorText = await response.text();
            await offlineStorage.incrementRetries(item.id);
            await offlineStorage.updateSyncItemStatus(item.id, 'failed', `HTTP ${response.status}: ${errorText}`);
            errorCount++;
            console.error(`❌ Échec sync: ${item.endpoint}`, response.status);
          }
        } catch (error) {
          // Erreur réseau : incrémenter les tentatives
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await offlineStorage.incrementRetries(item.id);
          await offlineStorage.updateSyncItemStatus(item.id, 'failed', errorMessage);
          errorCount++;
          console.error(`❌ Erreur sync: ${item.endpoint}`, error);
        }
      }

      // Enregistrer les statistiques
      const duration = Date.now() - startTime;
      const stats = await offlineStorage.getSyncStats();
      await offlineStorage.setSyncStats({
        totalSynced: stats.totalSynced + successCount,
        totalFailed: stats.totalFailed + errorCount,
        lastSyncDuration: duration,
        averageSyncTime: stats.averageSyncTime
          ? (stats.averageSyncTime + duration) / 2
          : duration,
      });

      // Mettre à jour le temps de dernière sync
      await offlineStorage.setLastSyncTime();
      setLastSyncTime(new Date().toISOString());

      // Notification de résultat
      if (successCount > 0 && errorCount === 0 && conflictCount === 0) {
        toast({
          title: '✅ Synchronisation réussie',
          description: `${successCount} élément(s) synchronisé(s) en ${(duration / 1000).toFixed(1)}s`,
          duration: 3000,
        });
      } else if (successCount > 0) {
        toast({
          title: '⚠️ Synchronisation partielle',
          description: `✅ ${successCount} réussi(s) | ❌ ${errorCount} échec(s) | ⚠️ ${conflictCount} conflit(s)`,
          variant: 'default',
          duration: 5000,
        });
      } else if (errorCount > 0) {
        toast({
          title: '❌ Échec de synchronisation',
          description: `${errorCount} élément(s) en échec. Nouvelle tentative plus tard.`,
          variant: 'destructive',
          duration: 5000,
        });
      }

      // Mettre à jour les compteurs
      const remainingQueue = await offlineStorage.getSyncQueue();
      setPendingCount(remainingQueue.length);

      const conflicts = await offlineStorage.getConflicts();
      setConflictsCount(conflicts.length);

      // Nettoyer les items synchronisés avec succès (optionnel)
      await offlineStorage.clearSyncedData();

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
      setSyncProgress(100);
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

  // Compter les éléments en attente et conflits
  useEffect(() => {
    const updateCounts = async () => {
      const queue = await offlineStorage.getSyncQueue();
      setPendingCount(queue.length);

      const conflicts = await offlineStorage.getConflicts();
      setConflictsCount(conflicts.length);

      const lastSync = await offlineStorage.getLastSyncTime();
      setLastSyncTime(lastSync);
    };

    updateCounts();
    const interval = setInterval(updateCounts, 5000);

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

  // Ajouter une action à la file de synchronisation avec priorité
  const addToQueue = useCallback(async (
    type: 'create' | 'update' | 'delete',
    endpoint: string,
    data: any,
    priority: number = 2, // Par défaut: priorité moyenne
    dependencies?: string[]
  ) => {
    const id = await offlineStorage.addToSyncQueue(type, endpoint, data, priority, dependencies);
    setPendingCount(prev => prev + 1);

    // Si en ligne, synchroniser immédiatement
    if (navigator.onLine) {
      setTimeout(() => syncPendingData(), 1000);
    }

    return id;
  }, [syncPendingData]);

  // Résoudre un conflit manuellement
  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: any
  ) => {
    await offlineStorage.resolveConflict(conflictId, resolution, mergedData);
    setConflictsCount(prev => prev - 1);

    toast({
      title: '✅ Conflit résolu',
      description: `Résolution: ${resolution === 'local' ? 'Données locales' : resolution === 'server' ? 'Données serveur' : 'Fusion'}`,
      duration: 3000,
    });
  }, [toast]);

  // Obtenir le statut détaillé de la synchronisation
  const getSyncStatus = useCallback(async () => {
    return await offlineStorage.getDetailedSyncStatus();
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncProgress,
    conflictsCount,
    lastSyncTime,
    syncPendingData,
    addToQueue,
    resolveConflict,
    getSyncStatus,
  };
}
