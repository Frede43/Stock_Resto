
// Correction pour l'affichage des rôles utilisateur
export const useAuth = () => {
  const [user, setUser] = useState(null);
  
  // Fonction pour obtenir le rôle correct
  const getUserRole = (userData) => {
    // Vérifier plusieurs sources possibles pour le rôle
    const role = userData?.role || 
                 userData?.user_role || 
                 userData?.groups?.[0]?.name || 
                 'user';
    
    // Normaliser le rôle
    const roleMap = {
      'admin': 'admin',
      'administrator': 'admin',
      'manager': 'manager',
      'gerant': 'manager',
      'server': 'server',
      'serveur': 'server',
      'cashier': 'cashier',
      'caissier': 'cashier'
    };
    
    return roleMap[role.toLowerCase()] || role;
  };
  
  // Fonction pour vérifier les permissions
  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    const userRole = getUserRole(user);
    
    // Hiérarchie des rôles
    const roleHierarchy = {
      'admin': 4,
      'manager': 3,
      'server': 2,
      'cashier': 1
    };
    
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  };
  
  const isAdmin = () => hasRole('admin');
  const isManager = () => hasRole('manager');
  
  return {
    user: user ? { ...user, role: getUserRole(user) } : null,
    setUser,
    hasRole,
    isAdmin,
    isManager,
    getUserRole
  };
};
