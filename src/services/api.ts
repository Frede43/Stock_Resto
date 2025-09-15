/**
 * Service API pour la communication avec le backend Django
 * Configuration centralisée pour tous les appels API
 */

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Types pour l'authentification
interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthTokens {
  access: string;
  refresh: string;
}

interface AuthResponse {
  tokens: AuthTokens;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    last_login?: string;
    date_joined: string;
    role: string;
  };
}

// Classe principale du service API
class ApiService {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadTokensFromStorage();
  }

  // Gestion des tokens
  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private saveTokensToStorage(tokens: AuthTokens) {
    this.accessToken = tokens.access;
    this.refreshToken = tokens.refresh;
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  private clearTokensFromStorage() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  // Méthode générique pour les requêtes HTTP avec support cross-browser
  private async request<T>(
    endpoint: string,
    options: RequestInit & { params?: any } = {}
  ): Promise<T> {
    let url = `${this.baseURL}${endpoint}`;
    
    // Ajouter les paramètres de requête si fournis
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.keys(options.params).forEach(key => {
        if (options.params[key] !== undefined && options.params[key] !== null) {
          searchParams.append(key, options.params[key].toString());
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
      // Supprimer params des options pour éviter de les passer à fetch
      const { params, ...fetchOptions } = options;
      options = fetchOptions;
    }
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    // Ajouter le token d'authentification si disponible
    if (this.accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.accessToken}`,
      };
    }

    try {
      const response = await fetch(url, config);

      // Gestion de l'expiration du token
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry la requête avec le nouveau token
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${this.accessToken}`,
          };
          const retryResponse = await fetch(url, config);
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Méthode pour gérer les erreurs de réponse
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: any = {};

      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = { message: await response.text() };
        }
      } catch (e) {
        errorData = { message: `HTTP Error: ${response.status}` };
      }

      // Si erreur 401 (Non autorisé), forcer la déconnexion
      if (response.status === 401) {
        this.handleAuthError();
      }

      throw new Error(errorData.message || errorData.error || `HTTP Error: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  // Gérer les erreurs d'authentification
  private handleAuthError() {
    // Nettoyer le localStorage
    localStorage.removeItem('user');
    
    // Rediriger vers la page de connexion
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // Méthode pour définir les tokens
  setTokens(accessToken: string, refreshToken: string) {
    this.saveTokensToStorage({ access: accessToken, refresh: refreshToken });
  }

  // Authentification
  async login(credentials: { username: string; password: string }): Promise<AuthResponse> {
    try {
      console.log('🔐 Tentative de connexion:', { 
        username: credentials.username, 
        api_url: API_BASE_URL,
        full_url: `${API_BASE_URL}/accounts/login/`,
        userAgent: navigator.userAgent
      });

      // DEBUG: Log des données envoyées
      console.log('📤 Données envoyées:', credentials);

      // Approche alternative pour Chrome - requête directe avec fetch
      const url = `${API_BASE_URL}/accounts/login/`;
      const fetchResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('📡 Réponse fetch directe:', {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: Object.fromEntries(fetchResponse.headers.entries())
      });

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        console.error('❌ Erreur fetch:', errorText);
        throw new Error(`HTTP ${fetchResponse.status}: ${errorText}`);
      }

      const response = await fetchResponse.json() as AuthResponse;

      console.log('✅ Réponse de connexion reçue:', {
        user: response.user?.username,
        role: response.user?.role,
        hasTokens: !!response.tokens
      });

      if (response.tokens) {
        this.setTokens(response.tokens.access, response.tokens.refresh);
      }

      // Système simplifié - pas de gestion de permissions
      console.log('✅ Connexion réussie - Système simplifié:', {
        user: response.user?.username,
        role: response.user?.role,
        message: 'Redirection basée uniquement sur le rôle'
      });

      return response;
    } catch (error: any) {
      console.error('❌ Erreur de connexion complète:', {
        message: error.message,
        stack: error.stack,
        url: `${API_BASE_URL}/accounts/login/`,
        credentials: { username: credentials.username, password: '***' }
      });

      // Améliorer le message d'erreur
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez que le backend Django est démarré sur http://127.0.0.1:8000');
      }

      // Si erreur 401, c'est un problème d'authentification
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
      }

      throw error;
    }
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      try {
        await this.request('/accounts/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh: this.refreshToken }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    this.clearTokensFromStorage();
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/accounts/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access;
        localStorage.setItem('access_token', data.access);
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }

    this.clearTokensFromStorage();
    return false;
  }

  // Méthodes HTTP génériques
  async get<T>(endpoint: string, options?: { params?: any }): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Vérifier si l'utilisateur est authentifié
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Obtenir les informations utilisateur
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

// Instance singleton du service API
export const apiService = new ApiService();

// Services spécialisés pour chaque domaine métier
export class ProductService {
  constructor(private api: ApiService) {}

  // Récupérer tous les produits
  async getProducts(params?: {
    search?: string;
    category?: number;
    status?: 'ok' | 'low' | 'critical';
    page?: number;
  }) {
    return this.api.get('/products/', { params });
  }

  // Récupérer un produit par son ID
  async getProduct(id: number) {
    return this.api.get<any>(`/products/${id}/`);
  }

  // Créer un produit
  async createProduct(data: any) {
    return this.api.post('/products/', data);
  }

  // Mettre à jour un produit
  async updateProduct(id: number, data: any) {
    return this.api.put(`/products/${id}/`, data);
  }

  // Supprimer un produit
  async deleteProduct(id: number) {
    return this.api.delete(`/products/${id}/`);
  }

  // Mettre à jour le stock
  async updateStock(id: number, data: {
    movement_type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reason: string;
    notes?: string;
  }) {
    return this.api.post(`/products/${id}/update-stock/`, data);
  }

  // Produits en stock faible
  async getLowStockProducts() {
    return this.api.get<any>('/products/low-stock/');
  }

  // Produits en rupture
  async getOutOfStockProducts() {
    return this.api.get<any>('/products/out-of-stock/');
  }
}

export class SalesService {
  constructor(private api: ApiService) {}

  // Récupérer les ventes
  async getReports(params?: {
    date_from?: string;
    date_to?: string;
    type?: 'daily' | 'weekly' | 'monthly';
    page?: number;
  }) {
    return this.api.get('/reports/', { params });
  }

  // Créer une vente
  async createSale(data: {
    table_number?: number;
    payment_method: 'cash' | 'card' | 'mobile';
    items: Array<{
      product: number;
      quantity: number;
      notes?: string;
    }>;
    notes?: string;
  }) {
    return this.api.post('/sales/', data);
  }

  // Mettre à jour une vente
  async updateSale(id: number, data: any) {
    return this.api.put(`/sales/${id}/`, data);
  }

  // Annuler une vente
  async cancelSale(id: number, reason: string) {
    return this.api.post(`/sales/${id}/cancel/`, { reason });
  }

  // Approuver une vente (changer le statut à completed)
  async approveSale(id: number) {
    return this.api.patch(`/sales/${id}/`, { status: 'completed' });
  }

  // Marquer une vente comme payée
  async markAsPaid(id: number) {
    return this.api.post(`/sales/${id}/mark-paid/`);
  }

  // Supprimer une vente
  async deleteSale(id: number) {
    return this.api.delete(`/sales/${id}/`);
  }

  // Statistiques des ventes
  async getSalesStats(period?: 'today' | 'week' | 'month') {
    return this.api.get(`/sales/stats/${period ? `?period=${period}` : ''}`);
  }
}

// ...

export class SupplierService {
  constructor(private api: ApiService) {}

  // Récupérer les fournisseurs
  async getSuppliers(params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
  }) {
    return this.api.get('/suppliers/', { params });
  }

  // Créer un fournisseur
  async createSupplier(data: any) {
    return this.api.post('/suppliers/', data);
  }

  // Mettre à jour un fournisseur
  async updateSupplier(id: number, data: any) {
    return this.api.put(`/suppliers/${id}/`, data);
  }

  // Supprimer un fournisseur
  async deleteSupplier(id: number) {
    return this.api.delete(`/suppliers/${id}/`);
  }
}

export class ReportsService {
  constructor(private api: ApiService) {}

  // Dashboard  // Rapports
  async getDashboardStats() {
    return this.api.get('/reports/dashboard/stats/');
  }

  async getDailyReport(date?: string) {
    const params = date ? `?date=${date}` : '';
    return this.api.get(`/reports/daily/${params}`);
  }

  async getDailyDetailedReport(date: string) {
    return this.api.get(`/reports/daily-detailed/${date}/`);
  }

  // Statistiques de ventes
  async getSalesReport(params?: {
    date_from?: string;
    date_to?: string;
    group_by?: 'day' | 'week' | 'month';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.group_by) queryParams.append('group_by', params.group_by);

    const query = queryParams.toString();
    return this.api.get(`/reports/sales/${query ? `?${query}` : ''}`);
  }

  // Rapport de stock
  async getStockReport() {
    return this.api.get('/reports/stock/');
  }

  // Alertes non résolues
  async getUnresolvedAlerts() {
    return this.api.get('/reports/alerts/unresolved/');
  }
}

// Instances des services
export const productService = new ProductService(apiService);
export const salesService = new SalesService(apiService);
export const supplierService = new SupplierService(apiService);
export const reportsService = new ReportsService(apiService);

// Export des types pour utilisation dans les composants
export type { LoginCredentials, AuthResponse, AuthTokens };
