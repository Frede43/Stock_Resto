// Hook pour gérer les paiements en mode offline
import { useCallback } from 'react';
import { offlineStorage } from '@/services/offline-storage';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://127.0.0.1:8000/api';

export function useOfflinePayments() {
  const { isOnline, addToQueue } = useOfflineSync();
  const { toast } = useToast();

  // Enregistrer un paiement
  const recordPayment = useCallback(async (saleId: string, paymentData: any) => {
    if (!isOnline) {
      // Mode offline
      const offlineId = `offline-payment-${Date.now()}`;
      const payment = {
        ...paymentData,
        id: offlineId,
        sale_id: saleId,
      };
      
      await offlineStorage.savePayment(payment, false);
      await addToQueue('create', `/sales/${saleId}/payments/`, paymentData);
      
      // Marquer la vente comme payée localement
      await offlineStorage.updateSale(saleId, { status: 'paid' });
      
      toast({
        title: '💰 Paiement enregistré',
        description: 'Sera synchronisé quand internet reviendra.',
        duration: 3000,
      });
      
      return { id: offlineId, ...payment };
    } else {
      // Mode online
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/sales/${saleId}/payments/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(paymentData),
        });

        if (response.ok) {
          const payment = await response.json();
          await offlineStorage.savePayment(payment, true);
          
          toast({
            title: '✅ Paiement enregistré',
            description: 'Paiement confirmé avec succès.',
            duration: 2000,
          });
          
          return payment;
        } else {
          throw new Error('Erreur lors de l\'enregistrement du paiement');
        }
      } catch (error) {
        console.error('Erreur paiement:', error);
        
        // Fallback offline
        const offlineId = `offline-payment-${Date.now()}`;
        const payment = {
          ...paymentData,
          id: offlineId,
          sale_id: saleId,
        };
        
        await offlineStorage.savePayment(payment, false);
        await addToQueue('create', `/sales/${saleId}/payments/`, paymentData);
        await offlineStorage.updateSale(saleId, { status: 'paid' });
        
        toast({
          title: '⚠️ Erreur réseau',
          description: 'Paiement sauvegardé localement. Sera synchronisé plus tard.',
          variant: 'destructive',
          duration: 5000,
        });
        
        return { id: offlineId, ...payment };
      }
    }
  }, [isOnline, addToQueue, toast]);

  // Enregistrer paiement cash
  const recordCashPayment = useCallback(async (saleId: string, amount: number) => {
    return await recordPayment(saleId, {
      amount,
      payment_method: 'cash',
      status: 'completed',
    });
  }, [recordPayment]);

  // Enregistrer paiement carte
  const recordCardPayment = useCallback(async (saleId: string, amount: number) => {
    return await recordPayment(saleId, {
      amount,
      payment_method: 'card',
      status: 'completed',
    });
  }, [recordPayment]);

  // Enregistrer paiement mobile money
  const recordMobilePayment = useCallback(async (saleId: string, amount: number, phoneNumber?: string) => {
    return await recordPayment(saleId, {
      amount,
      payment_method: 'mobile_money',
      phone_number: phoneNumber,
      status: 'completed',
    });
  }, [recordPayment]);

  // Appliquer une réduction
  const applyDiscount = useCallback(async (saleId: string, discountAmount: number, reason?: string) => {
    if (!isOnline) {
      await offlineStorage.updateSale(saleId, {
        discount: discountAmount,
        discount_reason: reason,
      });
      await addToQueue('update', `/sales/${saleId}/`, {
        discount: discountAmount,
        discount_reason: reason,
      });
      
      toast({
        title: '📡 Mode hors ligne',
        description: `Réduction de ${discountAmount} BIF appliquée localement.`,
        duration: 2000,
      });
    } else {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/sales/${saleId}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            discount: discountAmount,
            discount_reason: reason,
          }),
        });

        if (response.ok) {
          const sale = await response.json();
          await offlineStorage.updateSale(saleId, sale);
          
          toast({
            title: '✅ Réduction appliquée',
            description: `Réduction de ${discountAmount} BIF confirmée.`,
            duration: 2000,
          });
        }
      } catch (error) {
        await offlineStorage.updateSale(saleId, {
          discount: discountAmount,
          discount_reason: reason,
        });
        await addToQueue('update', `/sales/${saleId}/`, {
          discount: discountAmount,
          discount_reason: reason,
        });
      }
    }
  }, [isOnline, addToQueue, toast]);

  // Diviser l'addition
  const splitBill = useCallback(async (saleId: string, numberOfSplits: number) => {
    // Cette fonction divise l'addition en plusieurs paiements
    // Pour l'instant, on retourne juste le montant par personne
    const sale = await offlineStorage.getSale(saleId);
    if (sale && sale.data.total_amount) {
      const amountPerPerson = sale.data.total_amount / numberOfSplits;
      return {
        totalAmount: sale.data.total_amount,
        numberOfSplits,
        amountPerPerson,
      };
    }
    return null;
  }, []);

  // Récupérer les paiements d'une vente
  const getPaymentsBySale = useCallback(async (saleId: string) => {
    if (!isOnline) {
      const payments = await offlineStorage.getPaymentsBySale(saleId);
      return payments.map(p => p.data);
    } else {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/sales/${saleId}/payments/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const payments = await response.json();
          
          // Mettre en cache
          for (const payment of payments) {
            await offlineStorage.savePayment(payment, true);
          }
          
          return payments;
        }
      } catch (error) {
        // Fallback sur cache
        const payments = await offlineStorage.getPaymentsBySale(saleId);
        return payments.map(p => p.data);
      }
    }
    
    return [];
  }, [isOnline]);

  return {
    recordPayment,
    recordCashPayment,
    recordCardPayment,
    recordMobilePayment,
    applyDiscount,
    splitBill,
    getPaymentsBySale,
  };
}
