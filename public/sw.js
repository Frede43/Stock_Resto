// Service Worker pour mode offline - Version améliorée
const CACHE_NAME = 'barstock-v2';
const API_CACHE = 'barstock-api-v2';
const MENU_CACHE = 'barstock-menu-v1';
const TABLES_CACHE = 'barstock-tables-v1';
const REPORTS_CACHE = 'barstock-reports-v1';

// Fichiers à mettre en cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Endpoints prioritaires pour le cache (par rôle)
const PRIORITY_ENDPOINTS = {
  server: [
    '/api/products/',
    '/api/menu/',
    '/api/tables/',
    '/api/categories/',
  ],
  cashier: [
    '/api/sales/',
    '/api/orders/',
    '/api/products/',
    '/api/payments/',
  ],
  manager: [
    '/api/reports/',
    '/api/dashboard/',
    '/api/products/',
    '/api/users/',
    '/api/suppliers/',
  ],
};

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installation');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Cache ouvert');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activation');
  
  const validCaches = [CACHE_NAME, API_CACHE, MENU_CACHE, TABLES_CACHE, REPORTS_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!validCaches.includes(cacheName)) {
            console.log('🗑️ Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Stratégie pour les requêtes API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(smartApiStrategy(request, url));
  } 
  // Stratégie pour les fichiers statiques
  else {
    event.respondWith(cacheFirstStrategy(request));
  }
});

// Stratégie intelligente pour les API (selon le type d'endpoint)
async function smartApiStrategy(request, url) {
  const pathname = url.pathname;
  
  // Déterminer le cache approprié
  let cacheName = API_CACHE;
  if (pathname.includes('/products/') || pathname.includes('/menu/')) {
    cacheName = MENU_CACHE;
  } else if (pathname.includes('/tables/')) {
    cacheName = TABLES_CACHE;
  } else if (pathname.includes('/reports/') || pathname.includes('/dashboard/')) {
    cacheName = REPORTS_CACHE;
  }
  
  // Pour les requêtes GET, utiliser Network First
  if (request.method === 'GET') {
    return networkFirstStrategy(request, cacheName);
  }
  
  // Pour POST/PUT/PATCH/DELETE, toujours essayer le réseau
  // Si offline, retourner une erreur pour que l'app gère la file d'attente
  try {
    return await fetch(request);
  } catch (error) {
    console.log('📡 Offline: Requête', request.method, 'mise en file d\'attente');
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'Requête mise en file d\'attente pour synchronisation',
        queued: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stratégie: Network First (API) avec cache spécifique
async function networkFirstStrategy(request, cacheName = API_CACHE) {
  try {
    // Essayer le réseau d'abord
    const networkResponse = await fetch(request);
    
    // Si succès, mettre en cache
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Si échec réseau, utiliser le cache
    console.log('📡 Offline: Utilisation du cache pour', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Ajouter un header pour indiquer que c'est du cache
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');
      headers.set('X-Cache-Date', new Date().toISOString());
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // Si pas de cache, retourner erreur offline
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'Vous êtes hors ligne et aucune donnée en cache n\'est disponible.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stratégie: Cache First (fichiers statiques)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('❌ Erreur réseau:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// Synchronisation en arrière-plan (Background Sync API)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync Event:', event.tag);

  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(syncOfflineQueue());
  } else if (event.tag.startsWith('sync-priority-')) {
    const priority = event.tag.replace('sync-priority-', '');
    event.waitUntil(syncByPriority(parseInt(priority)));
  }
});

// Synchronisation de la file d'attente complète
async function syncOfflineQueue() {
  console.log('🔄 Background Sync: Synchronisation de la file complète...');

  try {
    // Ouvrir IndexedDB
    const db = await openIndexedDB();

    // Récupérer la file de synchronisation
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const queue = await store.getAll();

    console.log(`📊 ${queue.length} items à synchroniser`);

    // Trier par priorité
    queue.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    let successCount = 0;
    let failCount = 0;

    // Synchroniser chaque item
    for (const item of queue) {
      // Vérifier si l'item peut être synchronisé
      if (item.status === 'syncing' || item.status === 'success') {
        continue;
      }

      // Vérifier les tentatives
      if (item.retries >= item.maxRetries) {
        console.log(`⏭️ Item ${item.id} ignoré (max retries atteint)`);
        continue;
      }

      try {
        // Marquer comme en cours
        await updateSyncItemStatus(db, item.id, 'syncing');

        // Envoyer la requête
        const response = await fetch(item.endpoint, {
          method: item.type === 'create' ? 'POST' :
                  item.type === 'update' ? 'PUT' :
                  item.type === 'delete' ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item.data),
        });

        if (response.ok) {
          // Succès
          await updateSyncItemStatus(db, item.id, 'success');
          await removeSyncItem(db, item.id);
          successCount++;
          console.log(`✅ Item ${item.id} synchronisé`);
        } else {
          // Échec
          await updateSyncItemStatus(db, item.id, 'failed', `HTTP ${response.status}`);
          failCount++;
          console.log(`❌ Item ${item.id} échoué: ${response.status}`);
        }
      } catch (error) {
        // Erreur réseau
        await updateSyncItemStatus(db, item.id, 'failed', error.message);
        failCount++;
        console.log(`❌ Item ${item.id} erreur:`, error.message);
      }
    }

    console.log(`✅ Background Sync terminé: ${successCount} réussis, ${failCount} échoués`);

    // Notifier l'application
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        success: successCount,
        failed: failCount,
      });
    });

    return Promise.resolve();
  } catch (error) {
    console.error('❌ Erreur Background Sync:', error);
    return Promise.reject(error);
  }
}

// Synchronisation par priorité
async function syncByPriority(priority) {
  console.log(`🔄 Background Sync: Priorité ${priority}`);

  try {
    const db = await openIndexedDB();
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const index = store.index('by-priority');
    const queue = await index.getAll(priority);

    console.log(`📊 ${queue.length} items priorité ${priority}`);

    for (const item of queue) {
      if (item.status === 'pending' && item.retries < item.maxRetries) {
        // Synchroniser l'item
        // (logique similaire à syncOfflineQueue)
      }
    }

    return Promise.resolve();
  } catch (error) {
    console.error('❌ Erreur sync priorité:', error);
    return Promise.reject(error);
  }
}

// Ouvrir IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BarStockOfflineDB', 2);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Mettre à jour le statut d'un item
async function updateSyncItemStatus(db, id, status, error = null) {
  const tx = db.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');
  const item = await store.get(id);

  if (item) {
    item.status = status;
    item.lastAttempt = new Date().toISOString();
    if (error) item.lastError = error;
    if (status === 'failed') item.retries += 1;

    await store.put(item);
  }
}

// Supprimer un item de la file
async function removeSyncItem(db, id) {
  const tx = db.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');
  await store.delete(id);
}

// Pré-cache des endpoints prioritaires au premier chargement
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRECACHE_ROLE_DATA') {
    const { role, endpoints } = event.data;
    console.log(`📦 Pré-cache des données pour le rôle: ${role}`);
    
    event.waitUntil(
      Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint);
            if (response.ok) {
              const cache = await caches.open(API_CACHE);
              await cache.put(endpoint, response);
              console.log(`✅ Pré-caché: ${endpoint}`);
            }
          } catch (error) {
            console.log(`❌ Échec pré-cache: ${endpoint}`);
          }
        })
      )
    );
  }
});
