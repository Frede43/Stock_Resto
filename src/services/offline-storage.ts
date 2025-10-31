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
    indexes: { 'by-timestamp': string };
  };
}

class OfflineStorage {
  private db: IDBPDatabase<any> | null = null;
  private dbName = 'barstock-offline';
  private version = 1;

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
    return await db.getAllFromIndex('sales', 'by-synced', false);
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
    data: any
  ) {
    const db = await this.init();
    const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db.put('syncQueue', {
      id,
      type,
      endpoint,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
    });

    return id;
  }

  async getSyncQueue() {
    const db = await this.init();
    return await db.getAllFromIndex('syncQueue', 'by-timestamp');
  }

  async removeSyncItem(id: string) {
    const db = await this.init();
    await db.delete('syncQueue', id);
  }

  async incrementRetries(id: string) {
    const db = await this.init();
    const item = await db.get('syncQueue', id);
    if (item) {
      item.retries++;
      await db.put('syncQueue', item);
    }
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
    return await db.getAllFromIndex('orders', 'by-synced', false);
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
    return await db.getAllFromIndex('payments', 'by-synced', false);
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
    return await db.getAllFromIndex('stockMovements', 'by-synced', false);
  }

  async markStockMovementAsSynced(id: string) {
    const db = await this.init();
    const movement = await db.get('stockMovements', id);
    if (movement) {
      movement.synced = true;
      await db.put('stockMovements', movement);
    }
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
  }

  async getStats() {
    const db = await this.init();
    const [sales, tables, products, orders, payments, stockMovements, syncQueue] = await Promise.all([
      db.count('sales'),
      db.count('tables'),
      db.count('products'),
      db.count('orders'),
      db.count('payments'),
      db.count('stockMovements'),
      db.count('syncQueue'),
    ]);

    return {
      sales,
      tables,
      products,
      orders,
      payments,
      stockMovements,
      syncQueue,
    };
  }
}

export const offlineStorage = new OfflineStorage();
