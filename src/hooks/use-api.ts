/**
 * Hooks React Query pour la gestion des données API
 * Centralise toutes les requêtes avec cache et gestion d'erreurs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import {
  productService,
  salesService,
  supplierService,
  reportsService,
  apiService
} from '@/services/api';
import type {
  DashboardStats,
  KitchenDashboard,
  PaginatedResponse,
  Product,
  Category,
  Sale,
  Supplier,
  Supply,
  Table,
  Order,
  User,
  StockMovement,
  Purchase,
  PurchaseItem,
  UserActivity,
  DailyReport,
  StockAlert,
  Alert
} from '@/types/api';

// Types pour les paramètres de requête
interface UseProductsParams {
  search?: string;
  category?: number;
  status?: 'ok' | 'low' | 'critical';
  page?: number;
  is_active?: boolean;
}

interface UseSalesParams {
  date_from?: string;
  date_to?: string;
  server?: string;
  status?: string;
  page?: number;
}

interface UseIngredientsParams {
  search?: string;
  status?: 'ok' | 'alerte' | 'rupture';
  unite?: string;
}

interface UseRecipesParams {
  search?: string;
  status?: 'available' | 'unavailable' | 'inactive';
}

// ==================== HOOKS CATÉGORIES ====================

export function useCategories() {
  return useQuery<PaginatedResponse<Category>, Error, PaginatedResponse<Category>>({
    queryKey: ['categories'],
    queryFn: () => apiService.get('/products/categories/'),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (categoryData: { name: string; description?: string; type: string }) => 
      apiService.post('/products/categories/', categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// ==================== HOOKS PRODUITS ====================

export function useProducts(params?: UseProductsParams) {
  return useQuery<PaginatedResponse<Product>, Error, PaginatedResponse<Product>>({
    queryKey: ['products', params],
    queryFn: () => productService.getProducts(params) as Promise<PaginatedResponse<Product>>,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useProduct(id: number) {
  return useQuery<Product, Error, Product>({
    queryKey: ['products', id],
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Succès",
        description: "Produit créé avec succès",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du produit",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      productService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Succès",
        description: "Produit mis à jour avec succès",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProductStock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      productService.updateStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: "Succès",
        description: "Stock mis à jour avec succès",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du stock",
        variant: "destructive",
      });
    },
  });
}


// ==================== HOOKS VENTES ====================

export function useSales(params?: UseSalesParams) {
  return useQuery<PaginatedResponse<Sale>, Error, PaginatedResponse<Sale>>({
    queryKey: ['sales', params],
    queryFn: () => apiService.get('/sales/', { params }) as Promise<PaginatedResponse<Sale>>,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      table_number?: number;
      payment_method: 'cash' | 'card' | 'mobile';
      items: Array<{
        product: number;
        quantity: number;
        notes?: string;
      }>;
      notes?: string;
    }) => salesService.createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen'] });
      toast({
        title: "Succès",
        description: "Vente enregistrée avec succès",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error('❌ Erreur détaillée de création de vente:', error);
      
      let errorMessage = "Erreur lors de l'enregistrement de la vente";
      
      if (error.response?.data) {
        // Erreur de validation Django
        if (typeof error.response.data === 'object') {
          const errors = Object.entries(error.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          errorMessage = errors;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur de la vente",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

export function useSalesStats(period?: 'today' | 'week' | 'month') {
  return useQuery({
    queryKey: ['sales', 'stats', period],
    queryFn: () => salesService.getSalesStats(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Éviter les refetch lors du focus
  });
}

// Hook pour approuver une vente
export function useApproveSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => salesService.approveSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: "Succès",
        description: "Vente approuvée avec succès"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'approbation de la vente",
        variant: "destructive"
      });
    }
  });
}

// Hook pour annuler une vente
export function useCancelSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => 
      salesService.cancelSale(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: "Succès",
        description: "Vente annulée avec succès"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'annulation de la vente",
        variant: "destructive"
      });
    }
  });
}

// Hook pour marquer une vente comme payée
export function useMarkSaleAsPaid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => salesService.markAsPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Actualiser les stocks
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: "Succès",
        description: "Vente marquée comme payée et stock mis à jour"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du marquage comme payé",
        variant: "destructive"
      });
    }
  });
}

// Hook pour supprimer une vente
export function useDeleteSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => salesService.deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: "Succès",
        description: "Vente supprimée avec succès"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression de la vente",
        variant: "destructive"
      });
    }
  });
}

// ==================== HOOKS FOURNISSEURS ====================

export function useSuppliers(params?: {
  search?: string;
  is_active?: boolean;
}) {
  return useQuery<PaginatedResponse<Supplier>, Error, PaginatedResponse<Supplier>>({
    queryKey: ['suppliers', params],
    queryFn: () => supplierService.getSuppliers(params) as Promise<PaginatedResponse<Supplier>>,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: supplierService.createSupplier.bind(supplierService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Succès",
        description: "Fournisseur créé avec succès"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du fournisseur",
        variant: "destructive"
      });
    }
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      supplierService.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Succès",
        description: "Fournisseur mis à jour avec succès"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du fournisseur",
        variant: "destructive"
      });
    }
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => supplierService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Succès",
        description: "Fournisseur supprimé avec succès"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression du fournisseur",
        variant: "destructive"
      });
    }
  });
}

// ==================== HOOKS CUISINE ====================

export function useKitchenDashboard() {
  return useQuery<KitchenDashboard, Error, KitchenDashboard>({
    queryKey: ['kitchen', 'dashboard'],
    queryFn: () => apiService.get('/kitchen/dashboard/'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useIngredients(params?: UseIngredientsParams) {
  return useQuery({
    queryKey: ['kitchen', 'ingredients', params],
    queryFn: () => apiService.get('/kitchen/ingredients/', { params }),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useRecipes(params?: UseRecipesParams) {
  return useQuery({
    queryKey: ['kitchen', 'recipes', params],
    queryFn: () => apiService.get('/kitchen/recipes/', { params }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => apiService.post('/kitchen/ingredients/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen', 'ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen', 'dashboard'] });
      toast({
        title: "Succès",
        description: "Ingrédient créé avec succès",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de l'ingrédient",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateIngredientStock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiService.patch(`/kitchen/ingredients/${id}/stock/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: "Succès",
        description: "Stock d'ingrédient mis à jour",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du stock",
        variant: "destructive",
      });
    },
  });
}

export function useIngredientsAlerts() {
  return useQuery({
    queryKey: ['kitchen', 'alerts'],
    queryFn: () => apiService.get('/kitchen/ingredients/alerts/'),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch toutes les 2 minutes
  });
}

// Hook pour les données de cuisine dans les rapports
export function useKitchenReport(date?: string) {
  return useQuery({
    queryKey: ['kitchen', 'report', date],
    queryFn: () => apiService.get('/kitchen/dashboard/', { params: { date } }), // ✅ CORRIGÉ: Utilise /kitchen/dashboard/ au lieu de /kitchen/reports/
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}



// Hook pour mettre à jour un ingrédient
export function useUpdateIngredient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiService.put(`/kitchen/ingredients/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen', 'ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen', 'alerts'] });
      toast({
        title: "Succès",
        description: "Ingrédient mis à jour avec succès"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour de l'ingrédient",
        variant: "destructive"
      });
    }
  });
}

export function useCheckRecipeAvailability() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) => 
      apiService.post(`/kitchen/recipes/${id}/check-availability/`, { quantity }),
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la vérification de la recette",
        variant: "destructive",
      });
    },
  });
}

// ==================== HOOKS TABLES ====================

export function useTables(params?: {
  status?: string;
  capacity?: number;
}) {
  return useQuery<PaginatedResponse<Table>, Error, PaginatedResponse<Table>>({
    queryKey: ['tables', params],
    queryFn: () => apiService.get('/sales/tables/', { params }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUpdateTableStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ tableId, status }: { tableId: number; status: string }) =>
      apiService.patch(`/apps/tables/${tableId}/`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la table a été mis à jour."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de mettre à jour le statut de la table.",
        variant: "destructive"
      });
    }
  });
}

export function useOccupyTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ tableId, customerName, partySize }: {
      tableId: number;
      customerName: string;
      partySize: number
    }) =>
      apiService.post(`/sales/tables/${tableId}/occupy/`, {
        customer_name: customerName,
        party_size: partySize
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast({
        title: "Succès",
        description: "Table occupée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'occupation de la table",
        variant: "destructive",
      });
    },
  });
}

export function useFreeTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (tableId: number) =>
      apiService.post(`/sales/tables/${tableId}/free/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast({
        title: "Succès",
        description: "Table libérée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la libération de la table",
        variant: "destructive",
      });
    },
  });
}

// ==================== HOOKS FOURNISSEURS ET APPROVISIONNEMENTS ====================

export function useSupplies(params?: {
  supplier?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery<PaginatedResponse<Supply>, Error, PaginatedResponse<Supply>>({
    queryKey: ['supplies', params],
    queryFn: () => apiService.get('/inventory/supplies/', { params }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateSupply() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: any) => apiService.post('/inventory/supplies/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      toast({
        title: "Approvisionnement créé",
        description: "Le nouvel approvisionnement a été enregistré avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de créer l'approvisionnement.",
        variant: "destructive"
      });
    }
  });
}

export function useUpdateSupply() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiService.patch(`/inventory/supplies/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      toast({
        title: "Approvisionnement mis à jour",
        description: "Les modifications ont été enregistrées avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de mettre à jour l'approvisionnement.",
        variant: "destructive"
      });
    }
  });
}

export function useValidateSupply() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (supplyId: number) => 
      apiService.post(`/inventory/supplies/${supplyId}/validate/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: "Livraison validée",
        description: "Le stock a été mis à jour avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de validation",
        description: error?.response?.data?.message || "Impossible de valider la livraison.",
        variant: "destructive"
      });
    }
  });
}

export function useRejectSupply() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (supplyId: number) => 
      apiService.post(`/inventory/supplies/${supplyId}/reject/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      toast({
        title: "Livraison rejetée",
        description: "La livraison a été marquée comme rejetée.",
        variant: "destructive"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de rejeter la livraison.",
        variant: "destructive"
      });
    }
  });
}

// ==================== HOOKS ALERTES ====================

export function useAlerts(params?: {
  type?: string;
  priority?: string;
  status?: string;
}) {
  return useQuery<PaginatedResponse<Alert>, Error, PaginatedResponse<Alert>>({
    queryKey: ['alerts', params],
    queryFn: () => apiService.get('/alerts/alerts/', { params }),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useMenuItems(params?: {
  category?: number;
  is_available?: boolean;
}) {
  return useQuery<PaginatedResponse<any>, Error, PaginatedResponse<any>>({
    queryKey: ['menu-items', params],
    queryFn: () => apiService.get('/menu/items/', { params }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (orderData: any) => {
      console.log('🔄 Création commande:', orderData);
      return apiService.post('/sales/', orderData); // ✅ CORRIGÉ: Utilise /sales/ pour créer une vente
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-queue'] });
      toast({
        title: "Commande créée",
        description: "La nouvelle commande a été créée avec succès.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la commande.",
        variant: "destructive",
      });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (alertId: number) => 
      apiService.post(`/alerts/alerts/${alertId}/resolve/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({
        title: "Alerte résolue",
        description: "L'alerte a été marquée comme résolue."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: "Impossible de résoudre l'alerte.",
        variant: "destructive"
      });
    }
  });
}

export function useArchiveAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (alertId: number) => 
      apiService.post(`/alerts/alerts/${alertId}/archive/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({
        title: "Alerte archivée",
        description: "L'alerte a été archivée avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible d'archiver l'alerte.",
        variant: "destructive"
      });
    }
  });
}

export function useUnresolvedAlerts() {
  return useQuery<Alert[], Error, Alert[]>({
    queryKey: ['alerts', 'unresolved'],
    queryFn: () => apiService.get('/reports/alerts/unresolved/'),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch toutes les 2 minutes
  });
}

// ==================== HOOKS COMMANDES ====================

export function useOrders(params?: {
  status?: string;
  priority?: string;
  table?: number;
  date?: string;
}) {
  return useQuery<PaginatedResponse<Order>, Error, PaginatedResponse<Order>>({
    queryKey: ['orders', params],
    queryFn: () => apiService.get('/sales/orders/', { params }), // ✅ CORRIGÉ: Utilise le nouveau endpoint
    staleTime: 30 * 1000, // 30 secondes pour les commandes
    refetchInterval: 60 * 1000, // Refetch toutes les minutes
  });
}


export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ orderId, action }: { orderId: number; action: string }) =>
      apiService.patch(`/sales/orders/${orderId}/${action}/`), // ✅ CORRIGÉ: Utilise PATCH et le bon endpoint
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      const actionMessages = {
        confirm: "Commande confirmée",
        start_preparing: "Préparation commencée",
        mark_ready: "Commande prête",
        serve: "Commande servie",
        cancel: "Commande annulée"
      };
      toast({
        title: actionMessages[action as keyof typeof actionMessages] || "Statut mis à jour",
        description: "Le statut de la commande a été mis à jour."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de mettre à jour le statut.",
        variant: "destructive"
      });
    }
  });
}

// Alias for useUpdateOrderStatus to match import in Orders.tsx
export const useUpdateOrderAction = useUpdateOrderStatus;

// ==================== HOOKS AIDE ET SUPPORT ====================

// Types pour les données d'aide
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  views: number;
  created_at: string;
  updated_at: string;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  videoUrl?: string;
  views: number;
  created_at: string;
  updated_at: string;
}

interface SupportRequest {
  id?: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  message: string;
  status?: "open" | "in_progress" | "resolved" | "closed";
  created_at?: string;
  updated_at?: string;
}

interface HelpStats {
  total_faqs: number;
  total_tutorials: number;
  total_support_requests: number;
  avg_resolution_time: string;
  popular_categories: Array<{
    category: string;
    count: number;
  }>;
}

// Hook pour récupérer les FAQ
export function useFAQs(params?: {
  search?: string;
  category?: string;
}) {
  return useQuery<PaginatedResponse<FAQItem>, Error, PaginatedResponse<FAQItem>>({
    queryKey: ['help', 'faqs', params],
    queryFn: () => apiService.get('/help/faqs/', { params }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook pour récupérer les tutoriels
export function useTutorials(params?: {
  search?: string;
  category?: string;
  difficulty?: string;
}) {
  return useQuery<PaginatedResponse<Tutorial>, Error, PaginatedResponse<Tutorial>>({
    queryKey: ['help', 'tutorials', params],
    queryFn: () => apiService.get('/help/tutorials/', { params }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook pour marquer une FAQ comme utile
export function useMarkFAQHelpful() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (faqId: string) => 
      apiService.post(`/help/faqs/${faqId}/helpful/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help', 'faqs'] });
      toast({
        title: "Merci !",
        description: "Votre retour a été enregistré",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer votre retour",
        variant: "destructive",
      });
    },
  });
}

// Hook pour créer une demande de support
export function useCreateSupportRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: SupportRequest) => 
      apiService.post('/help/support-requests/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help', 'support-requests'] });
      toast({
        title: "Demande envoyée",
        description: "Votre demande de support a été envoyée avec succès",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer la demande",
        variant: "destructive",
      });
    },
  });
}

// Hook pour récupérer les statistiques d'aide
export function useHelpStats() {
  return useQuery<HelpStats, Error, HelpStats>({
    queryKey: ['help', 'stats'],
    queryFn: () => apiService.get('/help/stats/'),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook pour récupérer les catégories d'aide
export function useHelpCategories() {
  return useQuery<string[], Error, string[]>({
    queryKey: ['help', 'categories'],
    queryFn: () => apiService.get('/help/categories/'),
    staleTime: 60 * 60 * 1000, // 1 heure
  });
}

// Hook pour incrémenter les vues d'une FAQ
export function useIncrementFAQViews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (faqId: string) => 
      apiService.post(`/help/faqs/${faqId}/view/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help', 'faqs'] });
    },
    // Pas de toast pour cette action silencieuse
  });
}

// Hook pour incrémenter les vues d'un tutoriel
export function useIncrementTutorialViews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tutorialId: string) => 
      apiService.post(`/help/tutorials/${tutorialId}/view/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help', 'tutorials'] });
    },
    // Pas de toast pour cette action silencieuse
  });
}

export function useKitchenQueue() {
  return useQuery({
    queryKey: ['orders', 'kitchen-queue'],
    queryFn: () => apiService.get('/orders/orders/kitchen_queue/'),
    staleTime: 15 * 1000, // 15 secondes
    refetchInterval: 30 * 1000, // Refetch toutes les 30 secondes
  });
}

// ==================== HOOKS MONITORING ====================

export function useSystemStats() {
  return useQuery({
    queryKey: ['monitoring', 'stats'],
    queryFn: () => apiService.get('/monitoring/stats/'),
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 60 * 1000, // Refetch toutes les minutes
  });
}

export function useSystemMetrics(params?: {
  metric_type?: string;
}) {
  return useQuery({
    queryKey: ['monitoring', 'metrics', params],
    queryFn: () => apiService.get('/monitoring/metrics/', { params }),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useSystemAlerts(params?: {
  severity?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['monitoring', 'alerts', params],
    queryFn: () => apiService.get('/monitoring/alerts/', { params }),
    staleTime: 30 * 1000, // 30 secondes
  });
}

export function useAcknowledgeSystemAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (alertId: number) => 
      apiService.post(`/monitoring/alerts/${alertId}/acknowledge/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring', 'alerts'] });
      toast({
        title: "Alerte acquittée",
        description: "L'alerte système a été acquittée."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible d'acquitter l'alerte.",
        variant: "destructive"
      });
    }
  });
}

export function usePerformanceLogs(params?: {
  endpoint?: string;
  method?: string;
}) {
  return useQuery({
    queryKey: ['monitoring', 'performance', params],
    queryFn: () => apiService.get('/monitoring/performance/', { params }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
export function useDashboardStats() {
  return useQuery<DashboardStats, Error, DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => reportsService.getDashboardStats() as Promise<DashboardStats>,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch toutes les 10 minutes
    refetchOnWindowFocus: false, // Éviter les refetch lors du focus
  });
}

export const useDailyReport = (date?: string) => {
  return useQuery({
    queryKey: ['dailyReport', date],
    queryFn: () => reportsService.getDailyReport(date),
    enabled: !!date
  });
};

export const useDailyDetailedReport = (date: string) => {
  return useQuery({
    queryKey: ['dailyDetailedReport', date],
    queryFn: () => reportsService.getDailyDetailedReport(date),
    enabled: !!date
  });
};

export const useLowStockProducts = () => {
  return useQuery({
    queryKey: ['lowStockProducts'],
    queryFn: () => productService.getLowStockProducts(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch toutes les 5 minutes
  });
};

// ==================== HOOKS UTILISATEURS ====================

export function useUsers(params?: {
  search?: string;
  role?: string;
  is_active?: boolean;
}) {
  return useQuery<PaginatedResponse<User>, Error, PaginatedResponse<User>>({
    queryKey: ['users', params],
    queryFn: () => apiService.get('/accounts/users/', { params }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserActivities(userId?: number) {
  return useQuery({
    queryKey: ['users', userId, 'activities'],
    queryFn: () => apiService.get(`/accounts/users/${userId}/activities/`),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function usePermissions(params?: { category?: string }) {
  return useQuery({
    queryKey: ['permissions', params],
    queryFn: async () => {
      const response = await apiService.get('/accounts/permissions/list/', { params }) as any;
      // Si la réponse est paginée, retourner seulement les résultats
      return response.results || response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAssignPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, permissions }: { userId: number; permissions: string[] }) =>
      apiService.post(`/accounts/users/${userId}/assign-permissions/`, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

// Hook pour récupérer les serveurs (utilisateurs avec rôle server)
export function useServers(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: ['servers', params],
    queryFn: async () => {
      // Utiliser l'endpoint des utilisateurs avec filtre sur le rôle server
      const queryParams = new URLSearchParams({
        role: 'server',
        is_active: (params?.is_active ?? true).toString()
      });
      const response = await apiService.get(`/accounts/users/?${queryParams}`) as any;
      return response.results || response;
    }
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: any) => apiService.patch('/accounts/profile/', data),
    onSuccess: (updatedUser) => {
      // Invalider les requêtes de profil
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Mettre à jour les données utilisateur dans le localStorage et le contexte auth
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser && currentUser.isLoggedIn) {
        const updatedUserData = {
          ...currentUser,
          ...(updatedUser && typeof updatedUser === 'object' ? updatedUser : {}),
          // Préserver les données d'authentification
          isLoggedIn: currentUser.isLoggedIn,
          sessionExpiry: currentUser.sessionExpiry,
          lastActivity: currentUser.lastActivity
        };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        
        // Déclencher un événement pour notifier les autres composants
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'user',
          newValue: JSON.stringify(updatedUserData),
          oldValue: JSON.stringify(currentUser)
        }));
      }
      
      toast({
        title: "Profil mis à jour",
        description: "Votre profil a été mis à jour avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de mettre à jour le profil.",
        variant: "destructive"
      });
    }
  });
}

export function useChangePassword() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: any) => apiService.post('/accounts/change-password/', data),
    onSuccess: () => {
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été modifié avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de modifier le mot de passe.",
        variant: "destructive"
      });
    }
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: any) => apiService.patch('/settings/preferences/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast({
        title: "Préférences mises à jour",
        description: "Vos préférences ont été sauvegardées."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de sauvegarder les préférences.",
        variant: "destructive"
      });
    }
  });
}

// ==================== HOOKS ANALYTICS ====================

export function useAnalytics(params?: { period?: string }) {
  return useQuery({
    queryKey: ['analytics', params],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (params?.period) {
        queryParams.append('period', params.period);
      }
      const url = queryParams.toString() ? `/analytics/analytics/?${queryParams}` : '/analytics/analytics/';
      return apiService.get(url);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour les rapports de ventes avec période
export function useSalesReport(params?: { 
  start_date?: string; 
  end_date?: string; 
  period?: string;
}) {
  return useQuery({
    queryKey: ['reports', 'sales', params],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);
      if (params?.period) queryParams.append('period', params.period);
      
      const url = queryParams.toString() ? `/sales/daily-report/?${queryParams}` : '/sales/daily-report/';
      return apiService.get(url);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook pour les rapports d'inventaire
export function useInventoryReport(params?: { date?: string }) {
  return useQuery({
    queryKey: ['reports', 'inventory', params],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.append('date', params.date);
      
      const url = queryParams.toString() ? `/reports/daily-detailed-report/${params?.date || 'today'}/?${queryParams}` : '/reports/daily-detailed-report/today/';
      return apiService.get(url);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour les statistiques financières
export function useFinancialReport(params?: { 
  start_date?: string; 
  end_date?: string;
}) {
  return useQuery({
    queryKey: ['reports', 'financial', params],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);
      
      const url = queryParams.toString() ? `/analytics/analytics/?${queryParams}` : '/analytics/analytics/';
      return apiService.get(url);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ==================== HOOKS STOCKS ET INVENTAIRE ====================

export function useStockMovements(params?: {
  product?: number;
  movement_type?: string;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery<PaginatedResponse<StockMovement>, Error, PaginatedResponse<StockMovement>>({
    queryKey: ['inventory', 'movements', params],
    queryFn: () => apiService.get('/inventory/movements/', { params }),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useStockSummary() {
  return useQuery({
    queryKey: ['inventory', 'stock-summary'],
    queryFn: () => apiService.get('/inventory/stock-summary/'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => apiService.get('/inventory/low-stock/'),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function usePurchases(params?: {
  supplier?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery<PaginatedResponse<Purchase>, Error, PaginatedResponse<Purchase>>({
    queryKey: ['inventory', 'purchases', params],
    queryFn: () => apiService.get('/inventory/purchases/', { params }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<StockMovement, 'id' | 'created_at' | 'updated_at'>) =>
      apiService.post('/inventory/movements/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Succès",
        description: "Mouvement de stock enregistré",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'enregistrement du mouvement",
        variant: "destructive",
      });
    },
  });
}

// ==================== HOOKS GRAPHIQUES ET ANALYTICS ====================

export function useSalesChart(params?: {
  date?: string;
  period?: 'day' | 'week' | 'month';
}) {
  return useQuery<any, Error, any>({
    queryKey: ['analytics', 'sales-chart', params],
    queryFn: () => apiService.get('/analytics/sales-chart/', { params }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProductSalesChart(params: {
  date?: string;
  period?: 'day' | 'week' | 'month';
} = {}) {
  return useQuery<any, Error, any>({
    queryKey: ['analytics', 'product-sales', params],
    queryFn: () => apiService.get('/analytics/product-sales/', { params }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ==================== HOOKS RAPPORTS AVANCÉS ====================

export function useStockAlerts(params?: {
  alert_type?: string;
  is_resolved?: boolean;
}) {
  return useQuery<PaginatedResponse<StockAlert>, Error, PaginatedResponse<StockAlert>>({
    queryKey: ['reports', 'alerts', params],
    queryFn: () => apiService.get('/reports/alerts/', { params }),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useReportsSummary() {
  return useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: () => apiService.get('/reports/summary/'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useExportReport() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ type, format, params }: {
      type: 'daily' | 'stock' | 'sales';
      format: 'pdf' | 'excel';
      params?: any
    }) => {
      const endpoint = `/reports/export/${type}-report/${format}/`;
      return apiService.get(endpoint, { params });
    },
    onSuccess: (data: any, variables) => {
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${variables.type}-report.${variables.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Succès",
        description: "Rapport exporté avec succès",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'export",
        variant: "destructive",
      });
    },
  });
}

// ==================== HOOKS SETTINGS ====================

export function useSystemSettings() {
  return useQuery<any, Error>({
    queryKey: ['system-settings'],
    queryFn: () => apiService.get('/settings/system/'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: any) => apiService.patch('/settings/system/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres système ont été mis à jour avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de sauvegarder les paramètres.",
        variant: "destructive"
      });
    }
  });
}

export function useResetSystemSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: () => apiService.post('/settings/reset/'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({
        title: "Paramètres réinitialisés",
        description: "Tous les paramètres ont été restaurés aux valeurs par défaut."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de réinitialiser les paramètres.",
        variant: "destructive"
      });
    }
  });
}

export function useCreateBackup() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: () => apiService.post('/settings/backup/create/'),
    onSuccess: (data: any) => {
      toast({
        title: "Sauvegarde créée",
        description: `Sauvegarde créée avec succès: ${data.filename || 'backup.sql'}`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de créer la sauvegarde.",
        variant: "destructive"
      });
    }
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (userId: string) => apiService.delete(`/accounts/users/${userId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de supprimer l'utilisateur.",
        variant: "destructive"
      });
    }
  });
}

export function useSystemInfo() {
  return useQuery<any, Error>({
    queryKey: ['system-info'],
    queryFn: () => apiService.get('/settings/system-info/'),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}


// Hooks pour les réservations
export const useReservations = (params?: {
  date?: string;
  status?: string;
  table?: number;
}) => {
  return useQuery({
    queryKey: ['reservations', params],
    queryFn: () => apiService.get('/sales/reservations/', { params }),
    staleTime: 30000,
  });
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      table: number;
      customer_name: string;
      customer_phone?: string;
      customer_email?: string;
      party_size: number;
      reservation_date: string;
      reservation_time: string;
      duration_minutes?: number;
      special_requests?: string;
    }) => apiService.post('/sales/reservations/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast({
        title: "Succès",
        description: "Réservation créée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la réservation",
        variant: "destructive",
      });
    },
  });
};

export const useConfirmReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (reservationId: number) =>
      apiService.post(`/sales/reservations/${reservationId}/confirm/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({
        title: "Succès",
        description: "Réservation confirmée",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la confirmation",
        variant: "destructive",
      });
    },
  });
};

export const useConvertOrderToSale = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orderId, data }: {
      orderId: number;
      data: { payment_method: string; notes?: string }
    }) => apiService.post(`/orders/${orderId}/convert-to-sale/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast({
        title: "Succès",
        description: "Commande convertie en vente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la conversion",
        variant: "destructive",
      });
    },
  });
};

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, userData }: {
      userId: string;
      userData: any
    }) => apiService.patch(`/accounts/users/${userId}/`, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Succès",
        description: "Utilisateur mis à jour avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiService.patch(`/sales/${id}/`, data), // ✅ CORRIGÉ: Utilise /sales/ au lieu de /orders/
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Succès",
        description: "Commande mise à jour",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    },
  });
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiService.get('/accounts/profile/'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserActivity() {
  return useQuery({
    queryKey: ['profile', 'activity'],
    queryFn: () => apiService.get('/accounts/profile/activity/'),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch toutes les 5 minutes
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userData: {
      username: string;
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
      password: string;
      role: string;
      permissions?: string[];
      is_active?: boolean;
    }) => {
      // Nettoyer les données avant envoi
      const cleanData = {
        username: userData.username.trim(),
        first_name: userData.first_name.trim(),
        last_name: userData.last_name.trim(),
        email: userData.email.trim().toLowerCase(),
        phone: userData.phone?.trim() || "",
        password: userData.password,
        role: userData.role,
        is_active: userData.is_active !== false,
        // Envoyer les permissions séparément si nécessaire
        user_permissions: userData.permissions || []
      };

      console.log("Données envoyées:", cleanData);
      return apiService.post('/accounts/users/', cleanData);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Succès",
        description: `Utilisateur ${data.username} créé avec succès`,
      });
    },
    onError: (error: any) => {
      console.error("Erreur création utilisateur:", error);
      let errorMessage = "Erreur lors de la création de l'utilisateur";

      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          // Extraire les messages d'erreur spécifiques
          const errors = [];
          for (const [field, messages] of Object.entries(errorData)) {
            if (Array.isArray(messages)) {
              errors.push(`${field}: ${messages.join(', ')}`);
            } else {
              errors.push(`${field}: ${messages}`);
            }
          }
          errorMessage = errors.join('; ');
        } else {
          errorMessage = errorData.toString();
        }
      }

      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

// ==================== HOOKS ALERTES DYNAMIQUES ====================

export function useAlertsNew(params?: {
  type?: string;
  priority?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['alerts-new', params],
    queryFn: () => apiService.get('/alerts/alerts/', { params }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useActiveAlertsCount() {
  return useQuery({
    queryKey: ['alerts-count'],
    queryFn: async () => {
      const response: any[] = await apiService.get('/alerts/alerts/active/');
      return {
        total_active: response.length,
        critical_active: response.filter((alert: any) => alert.priority === 'critical').length,
        high_active: response.filter((alert: any) => alert.priority === 'high').length,
        has_critical: response.some((alert: any) => alert.priority === 'critical')
      };
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Rafraîchir toutes les 30 secondes
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (alertData: {
      type: string;
      priority: string;
      title: string;
      message: string;
      related_product?: number;
      related_sale?: number;
    }) => apiService.post('/alerts/alerts/', alertData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-new'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-count'] });
      toast({
        title: "Succès",
        description: "Alerte créée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de l'alerte",
        variant: "destructive",
      });
    },
  });
}

export function useResolveAlertNew() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (alertId: string) => apiService.post(`/alerts/alerts/${alertId}/resolve/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-new'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-count'] });
      toast({
        title: "Succès",
        description: "Alerte résolue",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la résolution",
        variant: "destructive",
      });
    },
  });
}

export function useArchiveAlertNew() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (alertId: string) => apiService.post(`/alerts/alerts/${alertId}/archive/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-new'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-count'] });
      toast({
        title: "Succès",
        description: "Alerte archivée",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'archivage",
        variant: "destructive",
      });
    },
  });
}

// ==================== HOOKS MONITORING ====================

export function useMonitoringDashboard() {
  return useQuery({
    queryKey: ['monitoring-dashboard'],
    queryFn: () => apiService.get('/monitoring/stats/'),
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 60 * 1000, // Rafraîchir chaque minute
  });
}

export function useSystemInfoNew() {
  return useQuery({
    queryKey: ['system-info-new'],
    queryFn: () => apiService.get('/settings/system-info/'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ==================== HOOKS SETTINGS ====================

export function useSystemSettingsNew() {
  return useQuery({
    queryKey: ['system-settings-new'],
    queryFn: () => apiService.get('/settings/'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateSystemSettingsNew() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (settings: Record<string, any>) =>
      apiService.patch('/settings/system/', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings-new'] });
      toast({
        title: "Succès",
        description: "Paramètres mis à jour",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    },
  });
}

