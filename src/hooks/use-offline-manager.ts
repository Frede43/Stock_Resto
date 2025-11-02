// Hook spécifique pour les fonctionnalités offline du rôle MANAGER/ADMINISTRATEUR
import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '@/services/offline-storage';
import { useToast } from '@/hooks/use-toast';
import { useOfflineSync } from '@/hooks/use-offline-sync';

interface CachedReport {
  sales_summary: {
    total_sales: number;
    total_revenue: number;
    paid_sales: number;
    pending_sales: number;
  };
  top_products: Array<{ name: string; quantity: number; revenue: number }>;
  cached_at: string;
}

export function useOfflineManager() {
  const { toast } = useToast();
  const { isOnline, addToQueue } = useOfflineSync();
  const [cachedReports, setCachedReports] = useState<CachedReport | null>(null);
  const [cachedProducts, setCachedProducts] = useState<any[]>([]);
  const [cachedStaff, setCachedStaff] = useState<any[]>([]);
  const [pendingInventoryAdjustments, setPendingInventoryAdjustments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les rapports en cache
  useEffect(() => {
    const loadCachedReports = async () => {
      try {
        const sales = await offlineStorage.getAllSales();
        
        // Calculer les statistiques depuis le cache
        const report: CachedReport = {
          sales_summary: {
            total_sales: sales?.length || 0,
            total_revenue: (sales || []).reduce((sum: number, sale: any) => 
              sum + (sale.data?.total_amount || 0), 0),
            paid_sales: (sales || []).filter((s: any) => s.data?.status === 'paid').length,
            pending_sales: (sales || []).filter((s: any) => s.data?.status === 'pending').length,
          },
          top_products: [], // Calculé depuis les ventes
          cached_at: new Date().toISOString(),
        };

        setCachedReports(report);
        console.log(`💾 Rapports chargés: ${sales?.length || 0} ventes`);
      } catch (error) {
        console.error('Erreur chargement rapports en cache:', error);
        setCachedReports(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadCachedReports();
    const interval = setInterval(loadCachedReports, 60000); // Refresh toutes les minutes

    return () => clearInterval(interval);
  }, []);

  // Charger les produits en cache
  useEffect(() => {
    const loadCachedProducts = async () => {
      try {
        const products = await offlineStorage.getAllProducts();
        setCachedProducts(products || []);
        console.log(`💾 ${products?.length || 0} produits en cache`);
      } catch (error) {
        console.error('Erreur chargement produits en cache:', error);
        setCachedProducts([]);
      }
    };

    loadCachedProducts();
  }, []);

  // Charger les ajustements d'inventaire en attente
  useEffect(() => {
    const loadPendingAdjustments = async () => {
      try {
        const movements = await offlineStorage.getUnsyncedStockMovements();
        setPendingInventoryAdjustments(movements || []);
        console.log(`📊 ${movements?.length || 0} ajustements en attente`);
      } catch (error) {
        console.error('Erreur chargement ajustements en attente:', error);
        setPendingInventoryAdjustments([]);
      }
    };

    loadPendingAdjustments();
    const interval = setInterval(loadPendingAdjustments, 15000);

    return () => clearInterval(interval);
  }, []);

  // ✅ CONSULTER LES RAPPORTS ET TABLEAUX DE BORD (cache)
  const getCachedReports = useCallback(() => {
    if (!cachedReports) {
      toast({
        title: "Rapports en cache 📊",
        description: "Affichage de la dernière version sauvegardée. Les données peuvent ne pas être à jour.",
        duration: 5000,
      });
    }
    return cachedReports;
  }, [cachedReports, toast]);

  // ✅ FAIRE UN INVENTAIRE SIMPLE
  const recordInventoryAdjustment = useCallback(async (adjustmentData: {
    product_id: number;
    quantity_change: number;
    reason: string;
    notes?: string;
  }) => {
    try {
      const movementId = `offline-stock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const offlineMovementData = {
        id: movementId,
        ...adjustmentData,
        movement_type: 'adjustment',
        created_at: new Date().toISOString(),
        offline: true,
      };

      // Sauvegarder dans IndexedDB
      await offlineStorage.saveStockMovement(offlineMovementData, false);

      // Mettre à jour le stock localement
      await offlineStorage.updateProduct(adjustmentData.product_id, {
        current_stock: (await offlineStorage.getProduct(adjustmentData.product_id))?.current_stock + adjustmentData.quantity_change
      });

      // Ajouter à la file de synchronisation
      await addToQueue('create', '/stock/movements/', adjustmentData);

      toast({
        title: isOnline ? "Ajustement enregistré ✅" : "Ajustement enregistré hors ligne 📱",
        description: isOnline 
          ? "L'ajustement d'inventaire a été enregistré"
          : "L'ajustement sera synchronisé dès le retour d'internet.",
        duration: 5000,
      });

      return { success: true, movementId };
    } catch (error) {
      console.error('Erreur enregistrement ajustement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'ajustement d'inventaire",
        variant: "destructive",
      });
      return { success: false, error };
    }
  }, [isOnline, addToQueue, toast]);

  // ✅ CONSULTER LA LISTE DU PERSONNEL (cache)
  const getStaffList = useCallback(() => {
    return cachedStaff;
  }, [cachedStaff]);

  // ✅ CONSULTER LA LISTE DES PRODUITS EN STOCK (cache)
  const getProductsList = useCallback(() => {
    return cachedProducts;
  }, [cachedProducts]);

  // Obtenir les ajustements en attente de synchronisation
  const getPendingAdjustments = useCallback(() => {
    return pendingInventoryAdjustments;
  }, [pendingInventoryAdjustments]);

  // Vérifier si les données sont fraîches
  const isDataFresh = useCallback(() => {
    if (!cachedReports) return false;
    
    const cachedTime = new Date(cachedReports.cached_at).getTime();
    const now = new Date().getTime();
    const ageInMinutes = (now - cachedTime) / (1000 * 60);
    
    return ageInMinutes < 30; // Données fraîches si < 30 minutes
  }, [cachedReports]);

  // Mettre à jour le cache du personnel
  const updateStaffCache = useCallback(async (staff: any[]) => {
    try {
      setCachedStaff(staff);
      // Sauvegarder dans localStorage comme backup
      localStorage.setItem('cached_staff', JSON.stringify({
        data: staff,
        cached_at: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Erreur mise à jour cache personnel:', error);
    }
  }, []);

  // Mettre à jour le cache des produits
  const updateProductsCache = useCallback(async (products: any[]) => {
    try {
      for (const product of products) {
        await offlineStorage.saveProduct(product);
      }
      setCachedProducts(products);
    } catch (error) {
      console.error('Erreur mise à jour cache produits:', error);
    }
  }, []);

  // ❌ Fonctionnalités NON disponibles hors ligne
  const unavailableOffline = useCallback((feature: string) => {
    toast({
      title: "Connexion requise 🌐",
      description: `${feature} nécessite une connexion internet pour accéder aux données en temps réel.`,
      variant: "destructive",
      duration: 7000,
    });
  }, [toast]);

  return {
    isOnline,
    isLoading,
    cachedReports,
    cachedProducts,
    cachedStaff,
    pendingInventoryAdjustments,
    getCachedReports,
    recordInventoryAdjustment,
    getStaffList,
    getProductsList,
    getPendingAdjustments,
    isDataFresh,
    updateStaffCache,
    updateProductsCache,
    unavailableOffline,
  };
}
