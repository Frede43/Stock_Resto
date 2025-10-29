/**
 * Provider React Query pour la gestion globale du cache et des requêtes
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Temps avant qu'une requête soit considérée comme obsolète
            staleTime: 5 * 60 * 1000, // 5 minutes
            // Temps avant qu'une requête soit supprimée du cache
            gcTime: 10 * 60 * 1000, // 10 minutes
            // Retry automatique en cas d'erreur
            retry: (failureCount, error: any) => {
              // Ne pas retry pour les erreurs 4xx (client)
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              // Retry jusqu'à 3 fois pour les autres erreurs
              return failureCount < 3;
            },
            // Délai entre les retries (exponentiel)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch automatique quand la fenêtre reprend le focus
            refetchOnWindowFocus: false,
            // Refetch automatique à la reconnexion
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry pour les mutations en cas d'erreur réseau
            retry: (failureCount, error: any) => {
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools uniquement en développement */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
