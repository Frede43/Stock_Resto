// Service pour gérer le Background Sync API
// Permet la synchronisation en arrière-plan même quand l'app est fermée

class BackgroundSyncService {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.checkSupport();
  }

  // Vérifier si Background Sync est supporté
  private checkSupport() {
    this.isSupported = 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype;
    
    if (!this.isSupported) {
      console.warn('⚠️ Background Sync API non supporté par ce navigateur');
    } else {
      console.log('✅ Background Sync API supporté');
    }
  }

  // Enregistrer le Service Worker
  async registerServiceWorker(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Workers non supportés');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('✅ Service Worker enregistré:', this.registration.scope);

      // Écouter les mises à jour
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        console.log('🔄 Nouvelle version du Service Worker détectée');

        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('✅ Nouvelle version activée');
            // Recharger la page pour utiliser la nouvelle version
            if (confirm('Une nouvelle version est disponible. Recharger ?')) {
              window.location.reload();
            }
          }
        });
      });

      // Écouter les messages du Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

      return true;
    } catch (error) {
      console.error('❌ Erreur enregistrement Service Worker:', error);
      return false;
    }
  }

  // Gérer les messages du Service Worker
  private handleServiceWorkerMessage(event: MessageEvent) {
    const { type, success, failed } = event.data;

    if (type === 'SYNC_COMPLETE') {
      console.log(`✅ Background Sync terminé: ${success} réussis, ${failed} échoués`);
      
      // Déclencher un événement personnalisé
      window.dispatchEvent(new CustomEvent('background-sync-complete', {
        detail: { success, failed }
      }));
    }
  }

  // Enregistrer une synchronisation en arrière-plan
  async registerSync(tag: string): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('⚠️ Background Sync non supporté, synchronisation ignorée');
      return false;
    }

    try {
      // Attendre que le Service Worker soit prêt
      const registration = await navigator.serviceWorker.ready;

      // Enregistrer la synchronisation
      await registration.sync.register(tag);
      
      console.log(`✅ Background Sync enregistré: ${tag}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur enregistrement Background Sync:', error);
      return false;
    }
  }

  // Enregistrer une synchronisation de la file complète
  async syncOfflineQueue(): Promise<boolean> {
    return this.registerSync('sync-offline-queue');
  }

  // Enregistrer une synchronisation par priorité
  async syncByPriority(priority: 1 | 2 | 3): Promise<boolean> {
    return this.registerSync(`sync-priority-${priority}`);
  }

  // Vérifier si une synchronisation est en attente
  async getPendingSyncs(): Promise<string[]> {
    if (!this.isSupported) {
      return [];
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const tags = await registration.sync.getTags();
      return tags;
    } catch (error) {
      console.error('❌ Erreur récupération syncs en attente:', error);
      return [];
    }
  }

  // Envoyer un message au Service Worker
  async sendMessage(message: any): Promise<void> {
    if (!this.registration || !this.registration.active) {
      console.warn('⚠️ Service Worker non actif');
      return;
    }

    this.registration.active.postMessage(message);
  }

  // Pré-cacher les données selon le rôle
  async precacheRoleData(role: string, endpoints: string[]): Promise<void> {
    await this.sendMessage({
      type: 'PRECACHE_ROLE_DATA',
      role,
      endpoints,
    });
  }

  // Vérifier l'état du Service Worker
  async getServiceWorkerState(): Promise<string> {
    if (!this.registration) {
      return 'not-registered';
    }

    if (this.registration.installing) return 'installing';
    if (this.registration.waiting) return 'waiting';
    if (this.registration.active) return 'active';

    return 'unknown';
  }

  // Forcer la mise à jour du Service Worker
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      console.warn('⚠️ Service Worker non enregistré');
      return;
    }

    try {
      await this.registration.update();
      console.log('✅ Mise à jour du Service Worker demandée');
    } catch (error) {
      console.error('❌ Erreur mise à jour Service Worker:', error);
    }
  }

  // Désenregistrer le Service Worker
  async unregisterServiceWorker(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const success = await this.registration.unregister();
      console.log('✅ Service Worker désenregistré');
      return success;
    } catch (error) {
      console.error('❌ Erreur désenregistrement Service Worker:', error);
      return false;
    }
  }

  // Obtenir les informations du Service Worker
  getInfo() {
    return {
      isSupported: this.isSupported,
      isRegistered: !!this.registration,
      scope: this.registration?.scope,
      state: this.registration?.active?.state,
    };
  }
}

// Instance singleton
export const backgroundSync = new BackgroundSyncService();

// Hook pour utiliser le Background Sync dans React
export function useBackgroundSync() {
  const [isSupported, setIsSupported] = React.useState(false);
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [pendingSyncs, setPendingSyncs] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Initialiser le Service Worker
    const init = async () => {
      const registered = await backgroundSync.registerServiceWorker();
      setIsRegistered(registered);
      setIsSupported(backgroundSync.getInfo().isSupported);

      // Récupérer les syncs en attente
      const syncs = await backgroundSync.getPendingSyncs();
      setPendingSyncs(syncs);
    };

    init();

    // Écouter les événements de synchronisation
    const handleSyncComplete = (event: CustomEvent) => {
      console.log('🎉 Synchronisation terminée:', event.detail);
      // Rafraîchir les syncs en attente
      backgroundSync.getPendingSyncs().then(setPendingSyncs);
    };

    window.addEventListener('background-sync-complete', handleSyncComplete as EventListener);

    return () => {
      window.removeEventListener('background-sync-complete', handleSyncComplete as EventListener);
    };
  }, []);

  return {
    isSupported,
    isRegistered,
    pendingSyncs,
    syncOfflineQueue: () => backgroundSync.syncOfflineQueue(),
    syncByPriority: (priority: 1 | 2 | 3) => backgroundSync.syncByPriority(priority),
    getPendingSyncs: () => backgroundSync.getPendingSyncs().then(setPendingSyncs),
    getInfo: () => backgroundSync.getInfo(),
  };
}

// Import React pour le hook
import React from 'react';

