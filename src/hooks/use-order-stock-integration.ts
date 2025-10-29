/**
 * 🔄 Hook pour l'intégration dynamique Commande-Vente-Stock
 * Gère automatiquement les mises à jour de stock lors des commandes et ventes
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';

interface OrderItem {
  product: number;
  quantity: number;
  unit_price: number;
  notes?: string;
}

interface OrderData {
  table: number;
  priority: string;
  notes?: string;
  items: OrderItem[];
}

interface SaleData {
  table: number;
  customer_name?: string;
  payment_method: string;
  items: OrderItem[];
}

export function useOrderWithStockUpdate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderData: OrderData) => {
      console.log('🔄 Création commande avec mise à jour stock:', orderData);
      
      // 1. Vérifier la disponibilité des stocks avant création
      for (const item of orderData.items) {
        const stockResponse = await apiService.get(`/products/${item.product}/`);
        const product = stockResponse;
        
        if (product.stock_quantity < item.quantity) {
          throw new Error(`Stock insuffisant pour ${product.name}. Disponible: ${product.stock_quantity}, Demandé: ${item.quantity}`);
        }
      }
      
      // 2. Créer la commande
      const orderResponse = await apiService.post('/orders/orders/', orderData);
      
      // 3. Réserver le stock (optionnel - selon la logique métier)
      // Cette étape peut être gérée automatiquement par le backend
      
      return orderResponse;
    },
    onSuccess: (data) => {
      // Invalider les caches pour mise à jour UI
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
      toast({
        title: "Succès",
        description: `Commande #${data.order_number || data.id} créée avec succès`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Erreur création commande:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la commande",
        variant: "destructive",
      });
    },
  });
}

export function useSaleWithStockUpdate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (saleData: SaleData) => {
      console.log('💰 Création vente avec mise à jour stock:', saleData);
      
      // 1. Vérifier la disponibilité des stocks
      for (const item of saleData.items) {
        const stockResponse = await apiService.get(`/products/${item.product}/`);
        const product = stockResponse;
        
        if (product.stock_quantity < item.quantity) {
          throw new Error(`Stock insuffisant pour ${product.name}. Disponible: ${product.stock_quantity}, Demandé: ${item.quantity}`);
        }
      }
      
      // 2. Créer la vente (le backend devrait automatiquement décrémenter le stock)
      const saleResponse = await apiService.post('/sales/', saleData);
      
      return saleResponse;
    },
    onSuccess: (data) => {
      // Invalider les caches pour mise à jour UI
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast({
        title: "Vente enregistrée",
        description: `Vente de ${data.total_amount} BIF enregistrée avec succès`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Erreur création vente:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'enregistrement de la vente",
        variant: "destructive",
      });
    },
  });
}

export function useOrderToSaleConversion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ orderId, paymentMethod }: { orderId: number; paymentMethod: string }) => {
      console.log('🔄 Conversion commande vers vente:', { orderId, paymentMethod });
      
      // 1. Récupérer les détails de la commande
      const orderResponse = await apiService.get(`/orders/orders/${orderId}/`);
      const order = orderResponse;
      
      // 2. Créer la vente basée sur la commande
      const saleData = {
        table: order.table.id,
        customer_name: order.customer_name,
        payment_method: paymentMethod,
        items: order.items.map((item: any) => ({
          product: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          notes: item.notes
        }))
      };
      
      // 3. Créer la vente
      const saleResponse = await apiService.post('/sales/', saleData);
      
      // 4. Marquer la commande comme servie
      await apiService.post(`/orders/orders/${orderId}/serve/`);
      
      return { sale: saleResponse, order: order };
    },
    onSuccess: (data) => {
      // Invalider tous les caches pertinents
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast({
        title: "Conversion réussie",
        description: `Commande convertie en vente de ${data.sale.total_amount} BIF`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Erreur conversion commande:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la conversion",
        variant: "destructive",
      });
    },
  });
}

export function useStockAlert() {
  const { toast } = useToast();

  const checkStockLevels = async (items: OrderItem[]) => {
    const lowStockItems = [];
    
    for (const item of items) {
      try {
        const product = await apiService.get(`/products/${item.product}/`);
        
        if (product.stock_quantity <= 5) {
          lowStockItems.push({
            name: product.name,
            current: product.stock_quantity,
            requested: item.quantity
          });
        }
      } catch (error) {
        console.error(`Erreur vérification stock produit ${item.product}:`, error);
      }
    }
    
    if (lowStockItems.length > 0) {
      toast({
        title: "⚠️ Alerte Stock",
        description: `${lowStockItems.length} produit(s) en stock faible`,
        variant: "destructive",
      });
    }
    
    return lowStockItems;
  };

  return { checkStockLevels };
}
