// Hook pour gérer les mouvements de stock en mode offline
import { useCallback } from 'react';
import { offlineStorage } from '@/services/offline-storage';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://127.0.0.1:8000/api';

export function useOfflineStocks() {
  const { isOnline, addToQueue } = useOfflineSync();
  const { toast } = useToast();

  // Enregistrer un mouvement de stock
  const recordStockMovement = useCallback(async (
    productId: number,
    quantity: number,
    type: 'sale' | 'purchase' | 'adjustment' | 'waste',
    reason?: string
  ) => {
    const movementData = {
      product_id: productId,
      quantity,
      type,
      reason,
      timestamp: new Date().toISOString(),
    };

    if (!isOnline) {
      // Mode offline
      const offlineId = `offline-stock-${Date.now()}`;
      const movement = { ...movementData, id: offlineId };
      
      await offlineStorage.saveStockMovement(movement, false);
      await addToQueue('create', '/stocks/movements/', movementData);
      
      toast({
        title: '📦 Mouvement de stock enregistré',
        description: 'Sera synchronisé quand internet reviendra.',
        duration: 2000,
      });
      
      return { id: offlineId, ...movement };
    } else {
      // Mode online
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/stocks/movements/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(movementData),
        });

        if (response.ok) {
          const movement = await response.json();
          await offlineStorage.saveStockMovement(movement, true);
          return movement;
        } else {
          throw new Error('Erreur lors de l\'enregistrement du mouvement');
        }
      } catch (error) {
        console.error('Erreur mouvement stock:', error);
        
        // Fallback offline
        const offlineId = `offline-stock-${Date.now()}`;
        const movement = { ...movementData, id: offlineId };
        
        await offlineStorage.saveStockMovement(movement, false);
        await addToQueue('create', '/stocks/movements/', movementData);
        
        toast({
          title: '⚠️ Erreur réseau',
          description: 'Mouvement sauvegardé localement. Sera synchronisé plus tard.',
          variant: 'destructive',
          duration: 3000,
        });
        
        return { id: offlineId, ...movement };
      }
    }
  }, [isOnline, addToQueue, toast]);

  // Enregistrer une sortie de stock (vente)
  const recordSale = useCallback(async (productId: number, quantity: number, saleId?: string) => {
    return await recordStockMovement(
      productId,
      -Math.abs(quantity), // Toujours négatif pour une sortie
      'sale',
      saleId ? `Vente ${saleId}` : 'Vente'
    );
  }, [recordStockMovement]);

  // Enregistrer une entrée de stock (achat/livraison)
  const recordPurchase = useCallback(async (productId: number, quantity: number, supplier?: string) => {
    return await recordStockMovement(
      productId,
      Math.abs(quantity), // Toujours positif pour une entrée
      'purchase',
      supplier ? `Livraison ${supplier}` : 'Livraison'
    );
  }, [recordStockMovement]);

  // Enregistrer un ajustement de stock
  const recordAdjustment = useCallback(async (productId: number, quantity: number, reason: string) => {
    return await recordStockMovement(productId, quantity, 'adjustment', reason);
  }, [recordStockMovement]);

  // Enregistrer une perte/gaspillage
  const recordWaste = useCallback(async (productId: number, quantity: number, reason: string) => {
    return await recordStockMovement(
      productId,
      -Math.abs(quantity), // Toujours négatif pour une perte
      'waste',
      reason
    );
  }, [recordStockMovement]);

  // Enregistrer les mouvements de stock pour une vente complète
  const recordSaleStockMovements = useCallback(async (saleItems: any[], saleId?: string) => {
    const movements = [];
    
    for (const item of saleItems) {
      if (item.product_id && item.quantity) {
        const movement = await recordSale(item.product_id, item.quantity, saleId);
        movements.push(movement);
      }
    }
    
    return movements;
  }, [recordSale]);

  // Récupérer les mouvements d'un produit
  const getStockMovementsByProduct = useCallback(async (productId: number) => {
    if (!isOnline) {
      const movements = await offlineStorage.getStockMovementsByProduct(productId);
      return movements.map(m => m.data);
    } else {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/stocks/movements/?product=${productId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const movements = data.results || data;
          
          // Mettre en cache
          for (const movement of movements) {
            await offlineStorage.saveStockMovement(movement, true);
          }
          
          return movements;
        }
      } catch (error) {
        // Fallback sur cache
        const movements = await offlineStorage.getStockMovementsByProduct(productId);
        return movements.map(m => m.data);
      }
    }
    
    return [];
  }, [isOnline]);

  // Calculer le stock actuel d'un produit (depuis cache si offline)
  const calculateCurrentStock = useCallback(async (productId: number, initialStock: number = 0) => {
    const movements = await getStockMovementsByProduct(productId);
    
    const totalMovement = movements.reduce((sum, movement) => {
      return sum + (movement.quantity || 0);
    }, 0);
    
    return initialStock + totalMovement;
  }, [getStockMovementsByProduct]);

  // Marquer un produit en rupture de stock
  const markAsOutOfStock = useCallback(async (productId: number) => {
    if (!isOnline) {
      await offlineStorage.updateProduct(productId, { out_of_stock: true });
      await addToQueue('update', `/products/${productId}/`, { out_of_stock: true });
      
      toast({
        title: '⚠️ Produit marqué en rupture',
        description: 'Sera synchronisé quand internet reviendra.',
        duration: 2000,
      });
    } else {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/products/${productId}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ out_of_stock: true }),
        });

        if (response.ok) {
          const product = await response.json();
          await offlineStorage.updateProduct(productId, product);
          
          toast({
            title: '✅ Produit en rupture',
            description: 'Statut mis à jour.',
            duration: 2000,
          });
        }
      } catch (error) {
        await offlineStorage.updateProduct(productId, { out_of_stock: true });
        await addToQueue('update', `/products/${productId}/`, { out_of_stock: true });
      }
    }
  }, [isOnline, addToQueue, toast]);

  return {
    recordStockMovement,
    recordSale,
    recordPurchase,
    recordAdjustment,
    recordWaste,
    recordSaleStockMovements,
    getStockMovementsByProduct,
    calculateCurrentStock,
    markAsOutOfStock,
  };
}
