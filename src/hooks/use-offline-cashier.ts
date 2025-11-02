// Hook spécifique pour les fonctionnalités offline du rôle CAISSIER
import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '@/services/offline-storage';
import { useToast } from '@/hooks/use-toast';
import { useOfflineSync } from '@/hooks/use-offline-sync';

export function useOfflineCashier() {
  const { toast } = useToast();
  const { isOnline, addToQueue } = useOfflineSync();
  const [cachedSales, setCachedSales] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  // Charger les ventes en cache
  useEffect(() => {
    const loadCachedSales = async () => {
      try {
        const sales = await offlineStorage.getAllSales();
        setCachedSales(sales);
      } catch (error) {
        console.error('Erreur chargement ventes en cache:', error);
      }
    };

    loadCachedSales();
    const interval = setInterval(loadCachedSales, 15000); // Refresh toutes les 15s

    return () => clearInterval(interval);
  }, []);

  // Charger les paiements en attente
  useEffect(() => {
    const loadPendingPayments = async () => {
      try {
        const payments = await offlineStorage.getUnsyncedPayments();
        setPendingPayments(payments);
      } catch (error) {
        console.error('Erreur chargement paiements en attente:', error);
      }
    };

    loadPendingPayments();
    const interval = setInterval(loadPendingPayments, 10000);

    return () => clearInterval(interval);
  }, []);

  // ✅ ENCAISSER UNE COMMANDE (avec nuances)
  const processOfflinePayment = useCallback(async (paymentData: {
    sale_id: string | number;
    amount: number;
    payment_method: 'cash' | 'check' | 'card' | 'mobile';
    notes?: string;
  }) => {
    try {
      // Vérifier si le paiement nécessite une connexion
      if (paymentData.payment_method === 'card' && !isOnline) {
        toast({
          title: "Connexion requise 🌐",
          description: "Le paiement par carte nécessite une connexion internet pour le terminal de paiement.",
          variant: "destructive",
          duration: 7000,
        });
        return { success: false, reason: 'card_requires_online' };
      }

      const paymentId = `offline-payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const offlinePaymentData = {
        id: paymentId,
        ...paymentData,
        status: 'completed',
        created_at: new Date().toISOString(),
        offline: true,
      };

      // Sauvegarder dans IndexedDB
      await offlineStorage.savePayment(offlinePaymentData, false);

      // Ajouter à la file de synchronisation
      await addToQueue('create', '/payments/', paymentData);

      // Mettre à jour le statut de la vente localement
      if (typeof paymentData.sale_id === 'string' && paymentData.sale_id.startsWith('offline-')) {
        await offlineStorage.updateSale(paymentData.sale_id, { status: 'paid' });
      }

      toast({
        title: isOnline ? "Paiement enregistré ✅" : "Paiement enregistré hors ligne 📱",
        description: isOnline 
          ? `Paiement de ${paymentData.amount.toLocaleString()} BIF enregistré`
          : "Le paiement sera synchronisé dès le retour d'internet.",
        duration: 5000,
      });

      return { success: true, paymentId };
    } catch (error) {
      console.error('Erreur traitement paiement offline:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le paiement",
        variant: "destructive",
      });
      return { success: false, error };
    }
  }, [isOnline, addToQueue, toast]);

  // ✅ CRÉER UNE VENTE RAPIDE (vente à emporter)
  const createQuickSale = useCallback(async (saleData: {
    customer_name: string;
    items: Array<{ product: number; quantity: number; notes?: string }>;
    payment_method: 'cash' | 'check';
    notes?: string;
  }) => {
    try {
      const saleId = `offline-sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculer le total
      const total = saleData.items.reduce((sum, item) => {
        // Récupérer le prix depuis le cache
        const cachedProducts = await offlineStorage.getAllProducts();
        const product = cachedProducts.find((p: any) => p.id === item.product);
        return sum + (product?.selling_price || 0) * item.quantity;
      }, 0);

      const offlineSaleData = {
        id: saleId,
        ...saleData,
        status: 'paid',
        total_amount: total,
        created_at: new Date().toISOString(),
        offline: true,
        quick_sale: true,
      };

      // Sauvegarder la vente
      await offlineStorage.saveSale(offlineSaleData, false);

      // Ajouter à la file de synchronisation
      await addToQueue('create', '/sales/', saleData);

      toast({
        title: isOnline ? "Vente rapide créée ✅" : "Vente rapide enregistrée 📱",
        description: `Total: ${total.toLocaleString()} BIF - ${saleData.payment_method === 'cash' ? 'Espèces' : 'Chèque'}`,
        duration: 5000,
      });

      return { success: true, saleId, total };
    } catch (error) {
      console.error('Erreur création vente rapide:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la vente rapide",
        variant: "destructive",
      });
      return { success: false, error };
    }
  }, [isOnline, addToQueue, toast]);

  // ✅ CONSULTER L'HISTORIQUE DES VENTES DE LA JOURNÉE
  const getTodaySales = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return cachedSales.filter((sale: any) => {
      const saleDate = new Date(sale.data?.created_at || sale.createdAt).toISOString().split('T')[0];
      return saleDate === today;
    });
  }, [cachedSales]);

  // Obtenir les paiements en attente de synchronisation
  const getPendingPayments = useCallback(() => {
    return pendingPayments;
  }, [pendingPayments]);

  // Obtenir une vente spécifique (pour encaissement)
  const getSale = useCallback(async (saleId: string | number) => {
    try {
      const sale = await offlineStorage.getSale(saleId.toString());
      return sale;
    } catch (error) {
      console.error('Erreur récupération vente:', error);
      return null;
    }
  }, []);

  // Mettre à jour le cache des ventes
  const updateSalesCache = useCallback(async (sales: any[]) => {
    try {
      for (const sale of sales) {
        await offlineStorage.saveSale(sale, true);
      }
      setCachedSales(sales);
    } catch (error) {
      console.error('Erreur mise à jour cache ventes:', error);
    }
  }, []);

  return {
    isOnline,
    cachedSales,
    pendingPayments,
    processOfflinePayment,
    createQuickSale,
    getTodaySales,
    getPendingPayments,
    getSale,
    updateSalesCache,
  };
}
