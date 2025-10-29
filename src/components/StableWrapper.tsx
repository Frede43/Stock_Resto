import React, { useRef, useEffect, useState } from 'react';

interface StableWrapperProps {
  children: React.ReactNode;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Wrapper qui force la stabilité du DOM en utilisant une clé stable
 * et en gérant les erreurs de manipulation DOM
 */
export function StableWrapper({ children, className, fallback }: StableWrapperProps) {
  const [key, setKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset l'erreur après un délai
  useEffect(() => {
    if (hasError) {
      const timer = setTimeout(() => {
        setHasError(false);
        setKey(prev => prev + 1); // Force un re-render complet
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasError]);

  // Gestionnaire d'erreur global pour les erreurs DOM
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('removeChild') || 
          event.error?.message?.includes('insertBefore')) {
        event.preventDefault();
        setHasError(true);
        console.warn('DOM manipulation error caught and handled:', event.error);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className={className} ref={containerRef}>
        {fallback || (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Rechargement en cours...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div key={key} className={className} ref={containerRef}>
      {children}
    </div>
  );
}

/**
 * Hook pour forcer un re-render stable
 */
export function useStableRender() {
  const [renderKey, setRenderKey] = useState(0);
  
  const forceStableRender = () => {
    setRenderKey(prev => prev + 1);
  };

  return { renderKey, forceStableRender };
}

/**
 * Version mémorisée du wrapper pour éviter les re-renders inutiles
 */
export const MemoizedStableWrapper = React.memo(StableWrapper);
