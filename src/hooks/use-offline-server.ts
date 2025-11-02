// Hook spécifique pour les fonctionnalités offline du rôle SERVEUR
import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '@/services/offline-storage';
import { useToast } from '@/hooks/use-toast';
import { useOfflineSync } from '@/hooks/use-offline-sync';

export function useOfflineServer() {
  const { toast } = useToast();
  const { isOnline, addToQueue } = useOfflineSync();
  const [cachedMenu, setCachedMenu] = useState<any[]>([]);
  const [cachedTables, setCachedTables] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);

  // Charger le menu en cache
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const products = await offlineStorage.getAllProducts();
        const tables = await offlineStorage.getAllTables();
        setCachedMenu(products);
        setCachedTables(tables);
      } catch (error) {
        console.error('Erreur chargement cache:', error);
      }
    };

    loadCachedData();
    const interval = setInterval(loadCachedData, 30000); // Refresh toutes les 30s

    return () => clearInterval(interval);
  }, []);

  // Charger les commandes en attente
  useEffect(() => {
    const loadPendingOrders = async () => {
      try {
        const orders = await offlineStorage.getUnsyncedOrders();
        setPendingOrders(orders);
      } catch (error) {
        console.error('Erreur chargement commandes en attente:', error);
      }
    };

    loadPendingOrders();
    const interval = setInterval(loadPendingOrders, 10000); // Refresh toutes les 10s

    return () => clearInterval(interval);
  }, []);

  // ✅ PRENDRE UNE COMMANDE (Fonctionnalité N°1)
  const createOfflineOrder = useCallback(async (orderData: {
    table: number;
    server: number;
    items: Array<{ product: number; quantity: number; notes?: string }>;
    notes?: string;
  }) => {
    try {
      const orderId = `offline-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const offlineOrderData = {
        id: orderId,
        ...orderData,
        status: 'pending',
        created_at: new Date().toISOString(),
        offline: true,
      };

      // Sauvegarder dans IndexedDB
      await offlineStorage.saveOrder(offlineOrderData, false);

      // Ajouter à la file de synchronisation
      await addToQueue('create', '/orders/', orderData);

      toast({
        title: isOnline ? "Commande envoyée ✅" : "Commande enregistrée 📱",
        description: isOnline 
          ? "La commande a été envoyée à la cuisine"
          : "Commande sauvegardée. Elle sera envoyée dès le retour d'internet.",
        duration: 5000,
      });

      return { success: true, orderId };
    } catch (error) {
      console.error('Erreur création commande offline:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la commande",
        variant: "destructive",
      });
      return { success: false, error };
    }
  }, [isOnline, addToQueue, toast]);

  // ✅ AJOUTER DES NOTES À UNE COMMANDE
  const addNotesToOrder = useCallback(async (orderId: string, notes: string) => {
    try {
      await offlineStorage.updateOrder(orderId, { notes });

      // Ajouter à la file de synchronisation si la commande existe déjà en ligne
      if (!orderId.startsWith('offline-')) {
        await addToQueue('update', `/orders/${orderId}/`, { notes });
      }

      toast({
        title: "Notes ajoutées ✅",
        description: "Les notes ont été enregistrées",
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur ajout notes:', error);
      return { success: false, error };
    }
  }, [addToQueue, toast]);

  // ✅ CONSULTER LE MENU (avec cache)
  const getMenu = useCallback(() => {
    return cachedMenu;
  }, [cachedMenu]);

  // ✅ VOIR LE STATUT DES TABLES (avec cache)
  const getTables = useCallback(() => {
    return cachedTables;
  }, [cachedTables]);

  // Obtenir les commandes en attente de synchronisation
  const getPendingOrders = useCallback(() => {
    return pendingOrders;
  }, [pendingOrders]);

  // Mettre à jour le cache du menu
  const updateMenuCache = useCallback(async (products: any[]) => {
    try {
      for (const product of products) {
        await offlineStorage.saveProduct(product);
      }
      setCachedMenu(products);
    } catch (error) {
      console.error('Erreur mise à jour cache menu:', error);
    }
  }, []);

  // Mettre à jour le cache des tables
  const updateTablesCache = useCallback(async (tables: any[]) => {
    try {
      for (const table of tables) {
        await offlineStorage.saveTable(table);
      }
      setCachedTables(tables);
    } catch (error) {
      console.error('Erreur mise à jour cache tables:', error);
    }
  }, []);

  return {
    isOnline,
    cachedMenu,
    cachedTables,
    pendingOrders,
    createOfflineOrder,
    addNotesToOrder,
    getMenu,
    getTables,
    getPendingOrders,
    updateMenuCache,
    updateTablesCache,
  };
}
