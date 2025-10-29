import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'manager' | 'server' | 'cashier';
  requiredPermission?: string;
}

const ProtectedRoute = ({ children, requiredRole, requiredPermission }: ProtectedRouteProps) => {
  const { user, isLoading, isAdmin } = useAuth();

  // Fonction hasPermission simplifiée pour éviter les erreurs
  const hasPermission = (permission: string) => {
    if (!user) return false;
    // Système simplifié - admin a toutes les permissions
    if (isAdmin()) return true;
    // Pour les autres rôles, on peut ajouter une logique spécifique si nécessaire
    return user.permissions?.includes(permission) || false;
  };

  // Afficher un écran de chargement pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!user || !user.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier le rôle requis
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h2>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          <p className="text-sm text-gray-500 mt-2">Rôle requis: {requiredRole}</p>
          <p className="text-sm text-gray-500">Votre rôle: {user.role}</p>
        </div>
      </div>
    );
  }

  // Vérifier la permission requise
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h2>
          <p className="text-gray-600">Vous n'avez pas la permission nécessaire pour accéder à cette page.</p>
          <p className="text-sm text-gray-500 mt-2">Permission requise: {requiredPermission}</p>
        </div>
      </div>
    );
  }

  // Afficher le contenu protégé si authentifié et autorisé
  return <>{children}</>;
};

export default ProtectedRoute;