/**
 * Configuration des variables d'environnement
 * Centralise toutes les variables d'environnement utilisées dans l'application
 */

export const env = {
  // URL de l'API Backend
  apiUrl: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  
  // Mode de développement
  isDev: import.meta.env.DEV,
  
  // Mode de production
  isProd: import.meta.env.PROD,
  
  // URL de base
  baseUrl: import.meta.env.BASE_URL || '/',
} as const;

// Log de la configuration en développement
if (env.isDev) {
  console.log('🔧 Configuration environnement:', {
    apiUrl: env.apiUrl,
    mode: env.isDev ? 'Développement' : 'Production',
  });
}
