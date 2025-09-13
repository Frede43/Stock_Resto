import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface UserPermissions {
  role: string;
  permissions: {
    [key: string]: boolean;
  };
}

/**
 * Hook pour récupérer et vérifier les permissions de l'utilisateur connecté
 */
export function useUserPermissions() {
  return useQuery<UserPermissions>({
    queryKey: ['user-permissions'],
    queryFn: () => apiService.get('/accounts/check-permissions/'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour vérifier si l'utilisateur a une permission spécifique
 */
export function useHasPermission(permissionCode: string) {
  const { data: permissions } = useUserPermissions();
  
  // Les admins ont toutes les permissions
  if (permissions?.role === 'admin') {
    return true;
  }
  
  // Vérifier la permission spécifique
  return permissions?.permissions?.[permissionCode] || false;
}

/**
 * Hook pour vérifier plusieurs permissions
 */
export function useHasAnyPermission(permissionCodes: string[]) {
  const { data: permissions } = useUserPermissions();
  
  // Les admins ont toutes les permissions
  if (permissions?.role === 'admin') {
    return true;
  }
  
  // Vérifier si l'utilisateur a au moins une des permissions
  return permissionCodes.some(code => permissions?.permissions?.[code]);
}

/**
 * Configuration des menus avec leurs permissions requises
 * Mapping exact avec les permissions du backend
 */
export const MENU_PERMISSIONS = {
  // Dashboard - accessible à tous les utilisateurs connectés
  dashboard: [],

  // Ventes - permissions selon le backend
  sales: ['sales_manage', 'sales_create', 'sales_view'],
  'sales-history': ['sales_history_view'],

  // Produits - permissions selon le backend
  products: ['products_view'],
  'products-create': ['products_create', 'products_manage'],
  'products-edit': ['products_edit', 'products_manage'],
  'products-delete': ['products_delete', 'products_manage'],

  // Stocks - permissions selon le backend (ADMIN/MANAGER SEULEMENT)
  stocks: ['stocks_view', 'inventory_view', 'stocks_manage'],
  'stock-sync': ['stocks_manage', 'inventory_manage'],
  supplies: ['suppliers_view', 'suppliers_manage'],

  // Tables - permissions selon le backend
  tables: ['tables_view', 'tables_manage'],

  // Commandes - permissions selon le backend
  orders: ['orders_view', 'sales_view'],
  'orders-create': ['orders_create', 'sales_create'],
  
  // Cuisine - permissions selon le backend (ADMIN/MANAGER SEULEMENT)
  kitchen: ['kitchen_view', 'kitchen_manage'],

  // Rapports et analyses - permissions selon le backend (ADMIN/MANAGER SEULEMENT)
  'daily-report': ['reports_view', 'reports_manage'],
  reports: ['reports_view', 'reports_manage'],
  analytics: ['analytics_view', 'analytics_manage'],

  // Administration - permissions selon le backend (ADMIN SEULEMENT)
  users: ['users_manage', 'users_view'],
  suppliers: ['suppliers_view', 'suppliers_manage'],
  expenses: ['expenses_view', 'expenses_manage'],
  
  // Système - permissions selon le backend (ADMIN SEULEMENT)
  settings: ['settings_manage'],
  alerts: ['alerts_view'], // Restreint aux admins/managers
  monitoring: ['monitoring_view', 'monitoring_manage'],
  help: [], // Accessible à tous

  // Profil - accessible à tous
  profile: [],
} as const;

/**
 * Hook pour vérifier si un menu est accessible
 */
export function useCanAccessMenu(menuKey: keyof typeof MENU_PERMISSIONS) {
  const requiredPermissions = MENU_PERMISSIONS[menuKey];
  
  // Si aucune permission requise, accessible à tous
  if (requiredPermissions.length === 0) {
    return true;
  }
  
  return useHasAnyPermission([...requiredPermissions]);
}

/**
 * Hook pour filtrer les menus accessibles
 */
export function useAccessibleMenus() {
  const { data: permissions, isLoading } = useUserPermissions();
  
  const getAccessibleMenus = () => {
    if (isLoading || !permissions) return [];
    
    return Object.keys(MENU_PERMISSIONS).filter(menuKey => {
      const requiredPermissions = MENU_PERMISSIONS[menuKey as keyof typeof MENU_PERMISSIONS];
      
      // Si aucune permission requise, accessible à tous
      if (requiredPermissions.length === 0) {
        return true;
      }
      
      // Les admins ont accès à tout
      if (permissions.role === 'admin') {
        return true;
      }
      
      // Vérifier si l'utilisateur a au moins une des permissions requises
      return requiredPermissions.some(code => permissions.permissions?.[code]);
    });
  };
  
  return {
    accessibleMenus: getAccessibleMenus(),
    isLoading,
    userRole: permissions?.role
  };
}

/**
 * Définition des rôles par défaut avec leurs permissions (selon le backend)
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  admin: [], // Toutes les permissions
  manager: [
    'sales_manage', 'sales_history_view', 'sales_view', 'sales_create',
    'products_view', 'products_manage',
    'stocks_view', 'inventory_manage',
    'tables_view', 'tables_manage',
    'orders_view', 'orders_create',
    'kitchen_view',
    'reports_view', 'analytics_view',
    'suppliers_view', 'suppliers_manage',
    'expenses_view', 'expenses_manage',
  ],
  server: [
    'sales_view', 'sales_create',
    'products_view',
    'tables_view', 'tables_manage',
    'orders_view', 'orders_create',
  ],
  cashier: [
    'sales_manage', 'sales_history_view', 'sales_view', 'sales_create',
    'products_view',
    'tables_view', 'tables_manage',
    'orders_view', 'orders_create',
  ]
} as const;
