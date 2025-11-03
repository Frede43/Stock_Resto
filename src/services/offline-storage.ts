// Service de stockage offline avec IndexedDB
import { openDB, IDBPDatabase } from 'idb';

// Types pour les valeurs stockées
interface SaleRecord {
  id: string;
  data: any;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrderRecord {
  id: string;
  data: any;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaymentRecord {
  id: string;
  sale_id: string;
  data: any;
  synced: boolean;
  createdAt: string;
}

interface StockMovementRecord {
  id: string;
  product_id: number;
  data: any;
  synced: boolean;
  createdAt: string;
}

interface SyncQueueRecord {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: string;
  retries: number;
  priority: number; // 1 = haute, 2 = moyenne, 3 = basse
  status: 'pending' | 'syncing' | 'failed' | 'success';
  lastError?: string;
  lastAttempt?: string;
  maxRetries: number;
  dependencies?: string[]; // IDs d'autres items dont celui-ci dépend
}

interface ConflictRecord {
  id: string;
  type: 'data' | 'version' | 'deletion';
  localData: any;
  serverData: any;
  timestamp: string;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merge';
  autoResolvable: boolean;
}

// Interface pour la base de données (sans extends DBSchema pour éviter les erreurs)
interface BarStockDB {
  sales: {
    key: string;
    value: SaleRecord;
    indexes: { 'by-synced': boolean };
  };
  tables: {
    key: number;
    value: any;
  };
  products: {
    key: number;
    value: any;
  };
  orders: {
    key: string;
    value: OrderRecord;
    indexes: { 'by-synced': boolean };
  };
  payments: {
    key: string;
    value: PaymentRecord;
    indexes: { 'by-synced': boolean; 'by-sale': string };
  };
  stockMovements: {
    key: string;
    value: StockMovementRecord;
    indexes: { 'by-synced': boolean; 'by-product': number };
  };
  syncQueue: {
    key: string;
    value: SyncQueueRecord;
    indexes: { 'by-timestamp': string; 'by-priority': number; 'by-status': string };
  };
  conflicts: {
    key: string;
    value: ConflictRecord;
    indexes: { 'by-resolved': boolean; 'by-timestamp': string };
  };
  syncMetadata: {
    key: string;
    value: any;
  };
}

class OfflineStorage {
  private db: IDBPDatabase<any> | null = null;
  private dbName = 'barstock-offline';
  private version = 2; // Incrémenté pour les nouvelles fonctionnalités

  async init() {
    if (this.db) return this.db;

    this.db = await openDB<any>(this.dbName, this.version, {
      upgrade(db) {
        // Store pour les ventes
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
          salesStore.createIndex('by-synced', 'synced');
        }

        // Store pour les tables
        if (!db.objectStoreNames.contains('tables')) {
          db.createObjectStore('tables', { keyPath: 'id' });
        }

        // Store pour les produits
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }

        // Store pour les commandes
        if (!db.objectStoreNames.contains('orders')) {
          const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
          ordersStore.createIndex('by-synced', 'synced');
        }

        // Store pour les paiements
        if (!db.objectStoreNames.contains('payments')) {
          const paymentsStore = db.createObjectStore('payments', { keyPath: 'id' });
          paymentsStore.createIndex('by-synced', 'synced');
          paymentsStore.createIndex('by-sale', 'sale_id');
        }

        // Store pour les mouvements de stock
        if (!db.objectStoreNames.contains('stockMovements')) {
          const stockStore = db.createObjectStore('stockMovements', { keyPath: 'id' });
          stockStore.createIndex('by-synced', 'synced');
          stockStore.createIndex('by-product', 'product_id');
        }

        // Store pour la file de synchronisation
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('by-timestamp', 'timestamp');
          syncStore.createIndex('by-priority', 'priority');
          syncStore.createIndex('by-status', 'status');
        }

        // Store pour les conflits
        if (!db.objectStoreNames.contains('conflicts')) {
          const conflictsStore = db.createObjectStore('conflicts', { keyPath: 'id' });
          conflictsStore.createIndex('by-resolved', 'resolved');
          conflictsStore.createIndex('by-timestamp', 'timestamp');
        }

        // Store pour les métadonnées de synchronisation
        if (!db.objectStoreNames.contains('syncMetadata')) {
          db.createObjectStore('syncMetadata', { keyPath: 'key' });
        }
      },
    });

    return this.db;
  }

  // ===== VENTES =====

  async saveSale(sale: any, synced: boolean = false) {
    const db = await this.init();
    await db.put('sales', {
      id: sale.id || `offline-${Date.now()}`,
      data: sale,
      synced,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async getSale(id: string) {
    const db = await this.init();
    return await db.get('sales', id);
  }

  async getAllSales() {
    const db = await this.init();
    return await db.getAll('sales');
  }

  async getUnsyncedSales() {
    const db = await this.init();
    try {
      const range = IDBKeyRange.only(false);
      return await db.getAllFromIndex('sales', 'by-synced', range);
    } catch (error) {
      console.warn('Erreur lors de la récupération des ventes non synchronisées, utilisation du fallback:', error);
      const allSales = await db.getAll('sales');
      return allSales.filter(s => s.synced === false);
    }
  }

  async markSaleAsSynced(id: string) {
    const db = await this.init();
    const sale = await db.get('sales', id);
    if (sale) {
      sale.synced = true;
      sale.updatedAt = new Date().toISOString();
      await db.put('sales', sale);
    }
  }

  async updateSale(id: string, updates: any) {
    const db = await this.init();
    const sale = await db.get('sales', id);
    if (sale) {
      sale.data = { ...sale.data, ...updates };
      sale.updatedAt = new Date().toISOString();
      await db.put('sales', sale);
    }
  }

  async deleteSale(id: string) {
    const db = await this.init();
    await db.delete('sales', id);
  }

  // ===== TABLES =====

  async saveTable(table: any) {
    const db = await this.init();
    await db.put('tables', table);
  }

  async getTable(id: number) {
    const db = await this.init();
    return await db.get('tables', id);
  }

  async getAllTables() {
    const db = await this.init();
    return await db.getAll('tables');
  }

  async deleteTable(id: number) {
    const db = await this.init();
    await db.delete('tables', id);
  }

  // ===== PRODUITS =====

  async saveProduct(product: any) {
    const db = await this.init();
    await db.put('products', product);
  }

  async getProduct(id: number) {
    const db = await this.init();
    return await db.get('products', id);
  }

  async getAllProducts() {
    const db = await this.init();
    return await db.getAll('products');
  }

  async updateProduct(id: number, updates: any) {
    const db = await this.init();
    const product = await db.get('products', id);
    if (product) {
      const updatedProduct = { ...product, ...updates };
      await db.put('products', updatedProduct);
    }
  }

  async deleteProduct(id: number) {
    const db = await this.init();
    await db.delete('products', id);
  }

  // ===== FILE DE SYNCHRONISATION =====

  async addToSyncQueue(
    type: 'create' | 'update' | 'delete',
    endpoint: string,
    data: any,
    priority: number = 2, // Par défaut: priorité moyenne
    dependencies?: string[]
  ) {
    const db = await this.init();
    const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Déterminer le nombre max de tentatives selon la priorité
    const maxRetries = priority === 1 ? 10 : priority === 2 ? 5 : 3;

    await db.put('syncQueue', {
      id,
      type,
      endpoint,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
      priority,
      status: 'pending',
      maxRetries,
      dependencies,
    });

    console.log(`📝 Ajouté à la file: ${endpoint} (priorité: ${priority})`);
    return id;
  }

  async getSyncQueue() {
    const db = await this.init();
    // Récupérer tous les items en attente ou échoués, triés par priorité puis timestamp
    const allItems = await db.getAll('syncQueue');
    return allItems
      .filter(item => item.status === 'pending' || item.status === 'failed')
      .sort((a, b) => {
        // Trier par priorité d'abord (1 = haute priorité)
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        // Puis par timestamp (plus ancien d'abord)
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
  }

  async getSyncQueueByPriority(priority: number) {
    const db = await this.init();
    return await db.getAllFromIndex('syncQueue', 'by-priority', priority);
  }

  async getSyncQueueByStatus(status: string) {
    const db = await this.init();
    return await db.getAllFromIndex('syncQueue', 'by-status', status);
  }

  async removeSyncItem(id: string) {
    const db = await this.init();
    await db.delete('syncQueue', id);
  }

  async updateSyncItemStatus(id: string, status: 'pending' | 'syncing' | 'failed' | 'success', error?: string) {
    const db = await this.init();
    const item = await db.get('syncQueue', id);
    if (item) {
      item.status = status;
      item.lastAttempt = new Date().toISOString();
      if (error) {
        item.lastError = error;
      }
      await db.put('syncQueue', item);
    }
  }

  async incrementRetries(id: string) {
    const db = await this.init();
    const item = await db.get('syncQueue', id);
    if (item) {
      item.retries++;
      item.lastAttempt = new Date().toISOString();

      // Si max tentatives atteint, marquer comme échoué définitivement
      if (item.retries >= item.maxRetries) {
        item.status = 'failed';
        console.error(`❌ Item ${id} a atteint le max de tentatives (${item.maxRetries})`);
      }

      await db.put('syncQueue', item);
    }
  }

  async canSyncItem(id: string): Promise<boolean> {
    const db = await this.init();
    const item = await db.get('syncQueue', id);

    if (!item) return false;
    if (item.status === 'success') return false;
    if (item.retries >= item.maxRetries) return false;

    // Vérifier les dépendances
    if (item.dependencies && item.dependencies.length > 0) {
      for (const depId of item.dependencies) {
        const dep = await db.get('syncQueue', depId);
        if (!dep || dep.status !== 'success') {
          console.log(`⏸️ Item ${id} en attente de dépendance ${depId}`);
          return false;
        }
      }
    }

    return true;
  }

  // ===== COMMANDES =====

  async saveOrder(order: any, synced: boolean = false) {
    const db = await this.init();
    await db.put('orders', {
      id: order.id || `offline-order-${Date.now()}`,
      data: order,
      synced,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async getOrder(id: string) {
    const db = await this.init();
    return await db.get('orders', id);
  }

  async getAllOrders() {
    const db = await this.init();
    return await db.getAll('orders');
  }

  async getUnsyncedOrders() {
    const db = await this.init();
    try {
      const range = IDBKeyRange.only(false);
      return await db.getAllFromIndex('orders', 'by-synced', range);
    } catch (error) {
      console.warn('Erreur lors de la récupération des commandes non synchronisées, utilisation du fallback:', error);
      const allOrders = await db.getAll('orders');
      return allOrders.filter(o => o.synced === false);
    }
  }

  async markOrderAsSynced(id: string) {
    const db = await this.init();
    const order = await db.get('orders', id);
    if (order) {
      order.synced = true;
      order.updatedAt = new Date().toISOString();
      await db.put('orders', order);
    }
  }

  async updateOrder(id: string, updates: any) {
    const db = await this.init();
    const order = await db.get('orders', id);
    if (order) {
      order.data = { ...order.data, ...updates };
      order.updatedAt = new Date().toISOString();
      await db.put('orders', order);
    }
  }

  async deleteOrder(id: string) {
    const db = await this.init();
    await db.delete('orders', id);
  }

  // ===== PAIEMENTS =====

  async savePayment(payment: any, synced: boolean = false) {
    const db = await this.init();
    await db.put('payments', {
      id: payment.id || `offline-payment-${Date.now()}`,
      sale_id: payment.sale_id,
      data: payment,
      synced,
      createdAt: new Date().toISOString(),
    });
  }

  async getPayment(id: string) {
    const db = await this.init();
    return await db.get('payments', id);
  }

  async getPaymentsBySale(saleId: string) {
    const db = await this.init();
    return await db.getAllFromIndex('payments', 'by-sale', saleId);
  }

  async getUnsyncedPayments() {
    const db = await this.init();
    try {
      const range = IDBKeyRange.only(false);
      return await db.getAllFromIndex('payments', 'by-synced', range);
    } catch (error) {
      console.warn('Erreur lors de la récupération des paiements non synchronisés, utilisation du fallback:', error);
      const allPayments = await db.getAll('payments');
      return allPayments.filter(p => p.synced === false);
    }
  }

  async markPaymentAsSynced(id: string) {
    const db = await this.init();
    const payment = await db.get('payments', id);
    if (payment) {
      payment.synced = true;
      await db.put('payments', payment);
    }
  }

  // ===== MOUVEMENTS DE STOCK =====

  async saveStockMovement(movement: any, synced: boolean = false) {
    const db = await this.init();
    await db.put('stockMovements', {
      id: movement.id || `offline-stock-${Date.now()}`,
      product_id: movement.product_id,
      data: movement,
      synced,
      createdAt: new Date().toISOString(),
    });
  }

  async getStockMovement(id: string) {
    const db = await this.init();
    return await db.get('stockMovements', id);
  }

  async getStockMovementsByProduct(productId: number) {
    const db = await this.init();
    return await db.getAllFromIndex('stockMovements', 'by-product', productId);
  }

  async getUnsyncedStockMovements() {
    const db = await this.init();
    try {
      const range = IDBKeyRange.only(false);
      return await db.getAllFromIndex('stockMovements', 'by-synced', range);
    } catch (error) {
      console.warn('Erreur lors de la récupération des mouvements de stock non synchronisés, utilisation du fallback:', error);
      const allMovements = await db.getAll('stockMovements');
      return allMovements.filter(m => m.synced === false);
    }
  }

  async markStockMovementAsSynced(id: string) {
    const db = await this.init();
    const movement = await db.get('stockMovements', id);
    if (movement) {
      movement.synced = true;
      await db.put('stockMovements', movement);
    }
  }

  // ===== CONFLITS =====

  async addConflict(
    type: 'data' | 'version' | 'deletion',
    localData: any,
    serverData: any,
    autoResolvable: boolean = false
  ) {
    const db = await this.init();
    const id = `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await db.put('conflicts', {
      id,
      type,
      localData,
      serverData,
      timestamp: new Date().toISOString(),
      resolved: false,
      autoResolvable,
    });

    console.log(`⚠️ Conflit détecté: ${type}`);
    return id;
  }

  async getConflicts() {
    const db = await this.init();
    try {
      // Utiliser IDBKeyRange pour les valeurs booléennes
      const range = IDBKeyRange.only(false);
      return await db.getAllFromIndex('conflicts', 'by-resolved', range);
    } catch (error) {
      // Fallback: récupérer tous et filtrer manuellement
      console.warn('Erreur lors de la récupération des conflits, utilisation du fallback:', error);
      const allConflicts = await db.getAll('conflicts');
      return allConflicts.filter(c => c.resolved === false);
    }
  }

  async resolveConflict(id: string, resolution: 'local' | 'server' | 'merge', mergedData?: any) {
    const db = await this.init();
    const conflict = await db.get('conflicts', id);

    if (conflict) {
      conflict.resolved = true;
      conflict.resolution = resolution;

      // Si merge, stocker les données fusionnées
      if (resolution === 'merge' && mergedData) {
        conflict.localData = mergedData;
      }

      await db.put('conflicts', conflict);
      console.log(`✅ Conflit ${id} résolu: ${resolution}`);
    }
  }

  async autoResolveConflicts() {
    const db = await this.init();
    const conflicts = await this.getConflicts();
    const autoResolvable = conflicts.filter(c => c.autoResolvable);

    for (const conflict of autoResolvable) {
      // Stratégie: privilégier les données serveur pour les auto-résolvables
      await this.resolveConflict(conflict.id, 'server');
    }

    console.log(`🤖 ${autoResolvable.length} conflits auto-résolus`);
    return autoResolvable.length;
  }

  // ===== MÉTADONNÉES DE SYNCHRONISATION =====

  async setLastSyncTime(key: string = 'global') {
    const db = await this.init();
    await db.put('syncMetadata', {
      key: `lastSync_${key}`,
      value: new Date().toISOString(),
    });
  }

  async getLastSyncTime(key: string = 'global'): Promise<string | null> {
    const db = await this.init();
    const metadata = await db.get('syncMetadata', `lastSync_${key}`);
    return metadata?.value || null;
  }

  async setSyncStats(stats: any) {
    const db = await this.init();
    await db.put('syncMetadata', {
      key: 'syncStats',
      value: {
        ...stats,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  async getSyncStats() {
    const db = await this.init();
    const metadata = await db.get('syncMetadata', 'syncStats');
    return metadata?.value || {
      totalSynced: 0,
      totalFailed: 0,
      lastSyncDuration: 0,
      averageSyncTime: 0,
    };
  }

  // ===== UTILITAIRES =====

  async clearAll() {
    const db = await this.init();
    await db.clear('sales');
    await db.clear('tables');
    await db.clear('products');
    await db.clear('orders');
    await db.clear('payments');
    await db.clear('stockMovements');
    await db.clear('syncQueue');
    await db.clear('conflicts');
    await db.clear('syncMetadata');
  }

  async clearSyncedData() {
    const db = await this.init();

    // Supprimer uniquement les items synchronisés avec succès
    const syncQueue = await db.getAll('syncQueue');
    const successItems = syncQueue.filter(item => item.status === 'success');

    for (const item of successItems) {
      await db.delete('syncQueue', item.id);
    }

    console.log(`🧹 ${successItems.length} items synchronisés supprimés`);
  }

  async getStats() {
    const db = await this.init();
    const [sales, tables, products, orders, payments, stockMovements, syncQueue, conflicts] = await Promise.all([
      db.count('sales'),
      db.count('tables'),
      db.count('products'),
      db.count('orders'),
      db.count('payments'),
      db.count('stockMovements'),
      db.count('syncQueue'),
      db.count('conflicts'),
    ]);

    // Compter les items par statut
    const allSyncItems = await db.getAll('syncQueue');
    const pending = allSyncItems.filter(i => i.status === 'pending').length;
    const syncing = allSyncItems.filter(i => i.status === 'syncing').length;
    const failed = allSyncItems.filter(i => i.status === 'failed').length;
    const success = allSyncItems.filter(i => i.status === 'success').length;

    return {
      sales,
      tables,
      products,
      orders,
      payments,
      stockMovements,
      syncQueue: {
        total: syncQueue,
        pending,
        syncing,
        failed,
        success,
      },
      conflicts,
    };
  }

  async getDetailedSyncStatus() {
    const db = await this.init();
    const queue = await db.getAll('syncQueue');
    const conflicts = await this.getConflicts();
    const stats = await this.getSyncStats();
    const lastSync = await this.getLastSyncTime();

    return {
      queue: {
        total: queue.length,
        byPriority: {
          high: queue.filter(i => i.priority === 1).length,
          medium: queue.filter(i => i.priority === 2).length,
          low: queue.filter(i => i.priority === 3).length,
        },
        byStatus: {
          pending: queue.filter(i => i.status === 'pending').length,
          syncing: queue.filter(i => i.status === 'syncing').length,
          failed: queue.filter(i => i.status === 'failed').length,
          success: queue.filter(i => i.status === 'success').length,
        },
      },
      conflicts: {
        total: conflicts.length,
        autoResolvable: conflicts.filter(c => c.autoResolvable).length,
      },
      stats,
      lastSync,
    };
  }
}

export const offlineStorage = new OfflineStorage();
