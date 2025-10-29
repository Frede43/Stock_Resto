
// Correction pour l'affichage des rôles utilisateur
import { useState, useEffect, createContext, useContext } from 'react';

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAdmin: () => boolean;
  hasRole: (role: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Fonction pour normaliser le rôle
  const normalizeRole = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': 'admin',
      'administrator': 'admin',
      'manager': 'manager',
      'gerant': 'manager',
      'gestionnaire': 'manager',
      'server': 'server',
      'serveur': 'server',
      'cashier': 'cashier',
      'caissier': 'cashier'
    };
    
    return roleMap[role?.toLowerCase()] || role;
  };

  // Fonction pour vérifier les rôles
  const hasRole = (requiredRole: string) => {
    if (!user) return false;
    
    const userRole = normalizeRole(user.role);
    const required = normalizeRole(requiredRole);
    
    // Hiérarchie des rôles
    const roleHierarchy: { [key: string]: number } = {
      'admin': 4,
      'manager': 3,
      'server': 2,
      'cashier': 1
    };
    
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[required] || 0;
    
    return userLevel >= requiredLevel;
  };

  const isAdmin = () => hasRole('admin');

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  };

  // Charger les données utilisateur depuis le localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({
          ...parsedUser,
          role: normalizeRole(parsedUser.role)
        });
      } catch (error) {
        console.error('Erreur parsing user data:', error);
        logout();
      }
    }
  }, []);

  const value = {
    user: user ? { ...user, role: normalizeRole(user.role) } : null,
    setUser: (newUser: User | null) => {
      if (newUser) {
        const normalizedUser = { ...newUser, role: normalizeRole(newUser.role) };
        setUser(normalizedUser);
        localStorage.setItem('user_data', JSON.stringify(normalizedUser));
      } else {
        setUser(null);
        localStorage.removeItem('user_data');
      }
    },
    isAdmin,
    hasRole,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
