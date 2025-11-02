// Utilitaire pour pré-charger les données dans le cache au démarrage
import { offlineStorage } from '@/services/offline-storage';

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://127.0.0.1:8000/api';

export async function initializeCache() {
  console.log('🔄 Initialisation du cache...');
  
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.log('⚠️ Pas de token - Cache non initialisé');
      return;
    }

    // Vérifier si en ligne
    if (!navigator.onLine) {
      console.log('📡 Hors ligne - Utilisation du cache existant');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Charger les produits
    try {
      const productsResponse = await fetch(`${API_URL}/products/`, { headers });
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        const products = productsData.results || productsData;
        
        for (const product of products) {
          await offlineStorage.saveProduct(product);
        }
        console.log(`✅ ${products.length} produits mis en cache`);
      }
    } catch (error) {
      console.error('❌ Erreur chargement produits:', error);
    }

    // Charger les tables
    try {
      const tablesResponse = await fetch(`${API_URL}/tables/`, { headers });
      if (tablesResponse.ok) {
        const tablesData = await tablesResponse.json();
        const tables = tablesData.results || tablesData;
        
        for (const table of tables) {
          await offlineStorage.saveTable(table);
        }
        console.log(`✅ ${tables.length} tables mises en cache`);
      }
    } catch (error) {
      console.error('❌ Erreur chargement tables:', error);
    }

    // Charger les ventes récentes (dernières 100)
    try {
      const salesResponse = await fetch(`${API_URL}/sales/?limit=100`, { headers });
      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        const sales = salesData.results || salesData;
        
        for (const sale of sales) {
          await offlineStorage.saveSale(sale, true); // Marquées comme synchronisées
        }
        console.log(`✅ ${sales.length} ventes mises en cache`);
      }
    } catch (error) {
      console.error('❌ Erreur chargement ventes:', error);
    }

    console.log('✅ Cache initialisé avec succès');
  } catch (error) {
    console.error('❌ Erreur initialisation cache:', error);
  }
}

// Fonction pour rafraîchir le cache périodiquement
export function startCacheRefresh(intervalMinutes: number = 5) {
  // Rafraîchir immédiatement
  initializeCache();
  
  // Puis toutes les X minutes
  const intervalMs = intervalMinutes * 60 * 1000;
  const intervalId = setInterval(() => {
    if (navigator.onLine) {
      console.log('🔄 Rafraîchissement automatique du cache...');
      initializeCache();
    }
  }, intervalMs);

  return () => clearInterval(intervalId);
}
