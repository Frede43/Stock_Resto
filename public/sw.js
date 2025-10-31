// Service Worker pour mode offline
const CACHE_NAME = 'barstock-v1';
const API_CACHE = 'barstock-api-v1';

// Fichiers à mettre en cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

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
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
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
    event.respondWith(networkFirstStrategy(request));
  } 
  // Stratégie pour les fichiers statiques
  else {
    event.respondWith(cacheFirstStrategy(request));
  }
});

// Stratégie: Network First (API)
async function networkFirstStrategy(request) {
  try {
    // Essayer le réseau d'abord
    const networkResponse = await fetch(request);
    
    // Si succès, mettre en cache
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Si échec réseau, utiliser le cache
    console.log('📡 Offline: Utilisation du cache pour', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si pas de cache, retourner erreur offline
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'Vous êtes hors ligne. Cette requête sera synchronisée quand internet reviendra.'
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

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync:', event.tag);
  
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncSales());
  }
});

// Fonction de synchronisation des ventes
async function syncSales() {
  console.log('🔄 Synchronisation des ventes...');
  
  // Récupérer les ventes en attente depuis IndexedDB
  // (sera implémenté dans le code React)
  
  return Promise.resolve();
}
