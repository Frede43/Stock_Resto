import { useEffect } from 'react';
import { useNotificationHelpers } from './use-notifications';
import { useLowStock } from './use-api';

/**
 * Hook pour surveiller les stocks et générer des notifications automatiques
 */
export function useStockNotifications() {
  const { notifyStockAlert } = useNotificationHelpers();
  const { data: stocksData } = useLowStock();

  useEffect(() => {
    if (!stocksData || !Array.isArray(stocksData)) return;

    const stocks = stocksData;
    
    stocks.forEach((stock: any) => {
      // Vérifier si le stock est critique (moins de 5 unités ou en dessous du seuil minimum)
      const isLowStock = stock.current_stock <= Math.max(stock.minimum_stock, 5);
      const isOutOfStock = stock.current_stock === 0;

      if (isOutOfStock) {
        notifyStockAlert(stock.name, 0, 'out');
      } else if (isLowStock) {
        notifyStockAlert(stock.name, stock.current_stock, 'low');
      }
    });
  }, [stocksData, notifyStockAlert]);

  return null;
}
