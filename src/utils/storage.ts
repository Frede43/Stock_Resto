/**
 * Utilitaire pour la gestion sécurisée du localStorage
 * Résout les problèmes de compatibilité cross-browser
 */

interface StorageData {
  [key: string]: any;
}

class SafeStorage {
  private static instance: SafeStorage;
  private listeners: Map<string, ((value: any) => void)[]> = new Map();

  static getInstance(): SafeStorage {
    if (!SafeStorage.instance) {
      SafeStorage.instance = new SafeStorage();
    }
    return SafeStorage.instance;
  }

  /**
   * Sauvegarde sécurisée dans le localStorage avec retry pour Chrome
   */
  setItem(key: string, value: any): boolean {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      
      // CORRECTION CHROME: Forcer la synchronisation avec un double-write
      // Chrome peut parfois ne pas synchroniser immédiatement
      setTimeout(() => {
        try {
          localStorage.setItem(key, serializedValue);
        } catch (e) {
          console.warn(`Retry write failed for ${key}:`, e);
        }
      }, 10);
      
      // Notifier les listeners
      this.notifyListeners(key, value);
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${key}:`, error);
      return false;
    }
  }

  /**
   * Récupération sécurisée depuis le localStorage
   */
  getItem<T = any>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Erreur lors de la récupération de ${key}:`, error);
      // Nettoyer la valeur corrompue
      this.removeItem(key);
      return defaultValue;
    }
  }

  /**
   * Suppression sécurisée du localStorage
   */
  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      this.notifyListeners(key, null);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${key}:`, error);
      return false;
    }
  }

  /**
   * Vérifier si une clé existe
   */
  hasItem(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Nettoyer tout le localStorage
   */
  clear(): boolean {
    try {
      localStorage.clear();
      // Notifier tous les listeners
      this.listeners.forEach((listeners, key) => {
        this.notifyListeners(key, null);
      });
      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage du localStorage:', error);
      return false;
    }
  }

  /**
   * Ajouter un listener pour les changements d'une clé
   */
  addListener(key: string, callback: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    this.listeners.get(key)!.push(callback);
    
    // Retourner une fonction de nettoyage
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        const index = keyListeners.indexOf(callback);
        if (index > -1) {
          keyListeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notifier les listeners d'un changement
   */
  private notifyListeners(key: string, value: any): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Erreur dans le listener pour ${key}:`, error);
        }
      });
    }
  }

  /**
   * Vérifier la disponibilité du localStorage
   */
  isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtenir la taille utilisée du localStorage (approximative)
   */
  getUsedSpace(): number {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return total;
    } catch (error) {
      return 0;
    }
  }
}

// Instance singleton
export const safeStorage = SafeStorage.getInstance();

// Fonctions utilitaires pour l'authentification
export const authStorage = {
  /**
   * Sauvegarder les données utilisateur
   */
  setUser(userData: any): boolean {
    return safeStorage.setItem('user', {
      ...userData,
      timestamp: Date.now()
    });
  },

  /**
   * Récupérer les données utilisateur
   */
  getUser(): any | null {
    const userData = safeStorage.getItem('user');
    if (!userData) return null;

    // Vérifier la validité des données
    if (!userData.isLoggedIn || !userData.role) {
      safeStorage.removeItem('user');
      return null;
    }

    return userData;
  },

  /**
   * Supprimer les données utilisateur
   */
  clearUser(): boolean {
    return safeStorage.removeItem('user');
  },

  /**
   * Écouter les changements des données utilisateur
   */
  onUserChange(callback: (userData: any) => void): () => void {
    return safeStorage.addListener('user', callback);
  },

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    const userData = this.getUser();
    return userData?.isLoggedIn === true;
  },

  /**
   * Obtenir le rôle de l'utilisateur
   */
  getUserRole(): string | null {
    const userData = this.getUser();
    return userData?.role || null;
  }
};
