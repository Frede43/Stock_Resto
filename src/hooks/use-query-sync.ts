/**
 * Hook utilitaire pour la synchronisation automatique des queries
 */

import { useQueryClient } from '@tanstack/react-query';
import { getInvalidationKeys, QUERY_INVALIDATION_GROUPS } from '@/config/query-config';

export function useQuerySync() {
  const queryClient = useQueryClient();

  /**
   * Invalide un groupe de queries
   */
  const invalidateGroup = (group: keyof typeof QUERY_INVALIDATION_GROUPS) => {
    const keys = getInvalidationKeys(group);
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };

  /**
   * Invalide plusieurs groupes de queries
   */
  const invalidateGroups = (...groups: (keyof typeof QUERY_INVALIDATION_GROUPS)[]) => {
    groups.forEach(group => invalidateGroup(group));
  };

  /**
   * Force le refetch de toutes les queries actives
   */
  const refetchAll = () => {
    queryClient.refetchQueries({ type: 'active' });
  };

  /**
   * Invalide toutes les queries liées aux ventes et au stock
   */
  const syncAfterSale = () => {
    invalidateGroups('SALES', 'STOCK', 'REPORTS', 'CREDIT');
  };

  /**
   * Invalide toutes les queries liées au stock
   */
  const syncAfterStockUpdate = () => {
    invalidateGroups('STOCK', 'PRODUCTS', 'REPORTS');
  };

  /**
   * Invalide toutes les queries liées aux crédits
   */
  const syncAfterCreditUpdate = () => {
    invalidateGroups('CREDIT', 'SALES', 'REPORTS');
  };

  /**
   * Invalide toutes les queries liées aux produits
   */
  const syncAfterProductUpdate = () => {
    invalidateGroups('PRODUCTS', 'STOCK', 'REPORTS');
  };

  return {
    invalidateGroup,
    invalidateGroups,
    refetchAll,
    syncAfterSale,
    syncAfterStockUpdate,
    syncAfterCreditUpdate,
    syncAfterProductUpdate,
  };
}
