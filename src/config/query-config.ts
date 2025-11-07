/**
 * Configuration centralisée pour React Query
 * Définit les temps de cache et les stratégies de rafraîchissement
 */

export const QUERY_STALE_TIMES = {
  // Données critiques (rafraîchissement fréquent)
  REAL_TIME: 15 * 1000,        // 15 secondes - Pour les commandes en cours, alertes
  VERY_SHORT: 30 * 1000,       // 30 secondes - Pour les ventes, stock
  SHORT: 1 * 60 * 1000,        // 1 minute - Pour les produits, tables
  MEDIUM: 2 * 60 * 1000,       // 2 minutes - Pour les rapports, statistiques
  LONG: 5 * 60 * 1000,         // 5 minutes - Pour les catégories, fournisseurs
  VERY_LONG: 10 * 60 * 1000,   // 10 minutes - Pour les données statiques
};

export const QUERY_GC_TIMES = {
  SHORT: 5 * 60 * 1000,        // 5 minutes
  MEDIUM: 10 * 60 * 1000,      // 10 minutes
  LONG: 30 * 60 * 1000,        // 30 minutes
};

export const REFETCH_INTERVALS = {
  REAL_TIME: 30 * 1000,        // 30 secondes
  SHORT: 1 * 60 * 1000,        // 1 minute
  MEDIUM: 2 * 60 * 1000,       // 2 minutes
  LONG: 5 * 60 * 1000,         // 5 minutes
};

/**
 * Liste des query keys à invalider lors de mutations critiques
 */
export const QUERY_INVALIDATION_GROUPS = {
  // Groupe Produits
  PRODUCTS: [
    'products',
    'product',
    'categories',
    'stock-alerts',
    'dashboard',
  ],
  
  // Groupe Ventes
  SALES: [
    'sales',
    'orders',
    'tables',
    'dashboard',
    'reports',
    'credit-accounts',
    'credit-transactions',
  ],
  
  // Groupe Stock
  STOCK: [
    'products',
    'supplies',
    'stock-movements',
    'stock-alerts',
    'dashboard',
  ],
  
  // Groupe Cuisine
  KITCHEN: [
    'kitchen',
    'recipes',
    'ingredients',
    'orders',
  ],
  
  // Groupe Crédit
  CREDIT: [
    'credit-accounts',
    'credit-transactions',
    'credit-statistics',
    'credit-reminders',
    'sales',
    'dashboard',
  ],
  
  // Groupe Rapports
  REPORTS: [
    'reports',
    'dashboard',
    'sales',
    'products',
    'credit-statistics',
  ],
};

/**
 * Helper pour invalider un groupe de queries
 */
export function getInvalidationKeys(group: keyof typeof QUERY_INVALIDATION_GROUPS): string[] {
  return QUERY_INVALIDATION_GROUPS[group];
}
