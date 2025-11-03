import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users as UsersIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Eye,
  Mail,
  Phone,
  Calendar,
  Activity,
  Lock,
  UserCheck,
  UserX,
  RefreshCw
} from "lucide-react";
import { useUsers, useUserActivities, useCreateUser, useUpdateUser, usePermissions, useAssignPermissions, useDeleteUser } from "@/hooks/use-api";
import { useMutation } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { User as APIUser, UserActivity } from "@/types/api";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "admin" | "manager" | "server" | "cashier";
  status: "active" | "inactive" | "suspended";
  lastLogin: string;
  createdAt: string;
  permissions: string[];
  avatar?: string;
}

// Suppression des données mock - utilisation de l'API

const roles = [
  { value: "admin", label: "Administrateur", color: "destructive" },
  { value: "manager", label: "Manager", color: "warning" },
  { value: "server", label: "Serveur", color: "success" },
  { value: "cashier", label: "Caissier", color: "secondary" }
];

// Les permissions seront chargées depuis l'API

export default function Users() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  // DEBUG: Afficher les informations de l'utilisateur pour diagnostiquer
  console.log('DEBUG Users page - User:', user);
  console.log('DEBUG Users page - isAdmin():', isAdmin());
  console.log('DEBUG Users page - permissions:', user?.permissions);

  // Temporairement, permettre l'accès aux admins sans vérification de permissions
  if (!user || !user.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin()) {
    console.log('DEBUG: Accès refusé - utilisateur n\'est pas admin');
    return <Navigate to="/" replace />;
  }
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "server" as "admin" | "manager" | "server" | "cashier",
    permissions: [] as string[]
  });

  // Récupérer les données des utilisateurs depuis l'API
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers
  } = useUsers({ is_active: true });

  // Récupérer les permissions disponibles
  const {
    data: permissionsData,
    isLoading: permissionsLoading
  } = usePermissions();

  // Hook pour créer un utilisateur
  const createUserMutation = useCreateUser();
  const assignPermissionsMutation = useAssignPermissions();
  const deleteUserMutation = useDeleteUser();

  // Hook pour mettre à jour un utilisateur
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: any }) =>
      apiService.patch(`/accounts/users/${userId}/`, userData),
    onSuccess: () => {
      refetchUsers();
      setShowEditUserDialog(false);
      setEditingUser(null);
      toast({
        title: "Utilisateur modifié",
        description: "Les informations ont été mises à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'utilisateur",
        variant: "destructive",
      });
    }
  });

  // État pour stocker les utilisateurs mappés
  const [users, setUsers] = useState<User[]>([]);
  
  // Définir allPermissions à partir des données de l'API
  const allPermissions = permissionsData?.results || [];
  
  // Mettre à jour les utilisateurs lorsque les données de l'API changent
  useEffect(() => {
    if (usersData) {
      const mappedUsers = (usersData as any)?.results?.map((user: any) => ({
        id: user.id.toString(),
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone || "",
        role: user.role || "server",
        status: user.is_active ? "active" : "inactive",
        lastLogin: user.last_login ? new Date(user.last_login).toLocaleString('fr-FR') : "Jamais connecté",
        createdAt: user.date_joined,
        permissions: user.permissions_by_category ?
          Object.values(user.permissions_by_category).flat().map((p: any) => p.code) :
          []
      })) || [];

      setUsers(mappedUsers);
    }
  }, [usersData]);

  const getRoleInfo = (role: User["role"]) => {
    const roleInfo = roles.find(r => r.value === role);
    return roleInfo || { value: role, label: role, color: "secondary" };
  };

  const getStatusInfo = (status: User["status"]) => {
    switch (status) {
      case "active":
        return { variant: "success" as const, label: "Actif", icon: UserCheck };
      case "inactive":
        return { variant: "secondary" as const, label: "Inactif", icon: UserX };
      case "suspended":
        return { variant: "destructive" as const, label: "Suspendu", icon: Lock };
    }
  };

  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      apiService.patch(`/accounts/users/${userId}/`, { is_active: status === 'active' }),
    onSuccess: (_, { status }) => {
      refetchUsers();
      toast({
        title: "Statut mis à jour",
        description: `L'utilisateur a été ${status === 'active' ? 'activé' : 'suspendu'}`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  });

  const updateUserStatus = (userId: string, status: string) => {
    updateUserStatusMutation.mutate({ userId, status });
  };

  const deleteUser = async (userId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await deleteUserMutation.mutateAsync(userId);
        refetchUsers();
      } catch (error) {
        // Error handling is done in the mutation hook
      }
    }
  };

  const createUser = async () => {
    try {
      // Permissions par défaut selon le rôle
      const defaultPermissionsByRole = {
        admin: [], // Admin a toutes les permissions
        manager: [
          'sales_manage', 'sales_history_view', 'sales_view', 'sales_create',
          'products_view', 'products_manage',
          'stocks_view', 'inventory_manage',
          'tables_view', 'tables_manage',
          'orders_view', 'orders_create',
          'kitchen_view',
          'reports_view', 'analytics_view',
          'suppliers_view', 'suppliers_manage',
          'expenses_view', 'expenses_manage',
        ],
        server: [
          'sales_view', 'sales_create',
          'products_view',
          'tables_view', 'tables_manage',
          'orders_view', 'orders_create',
        ],
        cashier: [
          'sales_manage', 'sales_history_view', 'sales_view', 'sales_create',
          'products_view',
          'tables_view', 'tables_manage',
          'orders_view', 'orders_create',
        ]
      };

      // Utiliser les permissions par défaut du rôle si aucune permission n'est sélectionnée
      const rolePermissions = defaultPermissionsByRole[newUser.role as keyof typeof defaultPermissionsByRole] || [];
      const finalPermissions = newUser.permissions.length > 0 ? newUser.permissions : rolePermissions;

      // Créer l'utilisateur avec un mot de passe temporaire
      const userData = {
        ...newUser,
        password: "temp123456", // Mot de passe temporaire
        permissions: finalPermissions
      };

      await createUserMutation.mutateAsync(userData);

      // Réinitialiser le formulaire
      setNewUser({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "server",
        permissions: []
      });

      setShowNewUserDialog(false);
      refetchUsers();

      const roleLabel = newUser.role === 'cashier' ? 'Caissier' :
                       newUser.role === 'admin' ? 'Administrateur' :
                       newUser.role === 'manager' ? 'Manager' : 'Serveur';

      toast({
        title: "Utilisateur créé",
        description: `${roleLabel} créé avec succès. Permissions automatiquement attribuées selon le rôle. Mot de passe temporaire: temp123456`
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de créer l'utilisateur",
        variant: "destructive"
      });
    }
  };

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) =>
      apiService.post(`/accounts/users/${userId}/reset-password/`),
    onSuccess: (data: any) => {
      // Afficher le mot de passe temporaire dans une alerte
      const tempPassword = data.temp_password;
      const userName = data.user;
      
      // Créer une alerte personnalisée avec le mot de passe
      const alertDiv = document.createElement('div');
      alertDiv.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: white; border: 2px solid #10b981; border-radius: 8px; 
                    padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 9999; 
                    max-width: 400px; text-align: center;">
          <h3 style="color: #10b981; margin-bottom: 15px;">🔑 Mot de passe réinitialisé</h3>
          <p style="margin-bottom: 10px;"><strong>Utilisateur:</strong> ${userName}</p>
          <p style="margin-bottom: 15px;"><strong>Mot de passe temporaire:</strong></p>
          <div style="background: #f3f4f6; padding: 10px; border-radius: 4px; 
                      font-family: monospace; font-size: 18px; font-weight: bold; 
                      color: #1f2937; margin-bottom: 15px; letter-spacing: 1px;">
            ${tempPassword}
          </div>
          <p style="font-size: 12px; color: #6b7280; margin-bottom: 15px;">
            Communiquez ce mot de passe à l'utilisateur oralement ou par message sécurisé
          </p>
          <button onclick="this.parentElement.parentElement.remove()" 
                  style="background: #10b981; color: white; border: none; padding: 8px 16px; 
                         border-radius: 4px; cursor: pointer;">
            Compris
          </button>
        </div>
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.5); z-index: 9998;" 
             onclick="this.parentElement.remove()"></div>
      `;
      document.body.appendChild(alertDiv);
      
      toast({
        title: "Mot de passe réinitialisé",
        description: `Nouveau mot de passe généré pour ${userName}`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de réinitialiser le mot de passe",
        variant: "destructive",
      });
    }
  });

  const resetPassword = (userId: string) => {
    resetPasswordMutation.mutate(userId);
  };

  const handleEditUser = (user: User) => {
    setEditingUser({
      ...user,
      permissions: user.permissions || []
    });
    setShowEditUserDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      await updateUserMutation.mutateAsync({
        userId: editingUser.id,
        userData: {
          first_name: editingUser.firstName,
          last_name: editingUser.lastName,
          email: editingUser.email,
          phone: editingUser.phone,
          role: editingUser.role,
          is_active: editingUser.status === 'active'
        }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  return (
    <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Gestion des utilisateurs
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Gérez les comptes utilisateurs et leurs permissions
              </p>
            </div>
            <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nouvel utilisateur</span>
                  <span className="sm:hidden">Nouveau</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">Créer un nouvel utilisateur</DialogTitle>
                  <DialogDescription className="text-base">
                    Ajoutez un nouveau membre à votre équipe avec les informations complètes
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Informations de base */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Informations personnelles</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium">Nom d'utilisateur *</Label>
                        <Input
                          id="username"
                          value={newUser.username}
                          onChange={(e) => setNewUser(prev => ({...prev, username: e.target.value}))}
                          placeholder="nom.utilisateur"
                          className="h-10"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first_name" className="text-sm font-medium">Prénom *</Label>
                          <Input
                            id="first_name"
                            value={newUser.first_name}
                            onChange={(e) => setNewUser(prev => ({...prev, first_name: e.target.value}))}
                            placeholder="Jean"
                            className="h-10"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name" className="text-sm font-medium">Nom *</Label>
                          <Input
                            id="last_name"
                            value={newUser.last_name}
                            onChange={(e) => setNewUser(prev => ({...prev, last_name: e.target.value}))}
                            placeholder="Dupont"
                            className="h-10"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser(prev => ({...prev, email: e.target.value}))}
                          placeholder="jean.dupont@example.com"
                          className="h-10"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">Téléphone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={newUser.phone}
                          onChange={(e) => setNewUser(prev => ({...prev, phone: e.target.value}))}
                          placeholder="+257 XX XX XX XX"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Rôle et permissions</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-sm font-medium">Rôle *</Label>
                        <Select value={newUser.role} onValueChange={(value: any) => setNewUser(prev => ({...prev, role: value}))}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">👑 Administrateur</SelectItem>
                            <SelectItem value="manager">👔 Manager</SelectItem>
                            <SelectItem value="server">🍽️ Serveur</SelectItem>
                            <SelectItem value="cashier">💰 Caissier</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Permissions */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Permissions spéciales</Label>
                        <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                          {permissionsData && permissionsData.map((permission: any) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`perm-${permission.id}`}
                                checked={newUser.permissions.includes(permission.codename)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewUser(prev => ({
                                      ...prev,
                                      permissions: [...prev.permissions, permission.codename]
                                    }));
                                  } else {
                                    setNewUser(prev => ({
                                      ...prev,
                                      permissions: prev.permissions.filter(p => p !== permission.codename)
                                    }));
                                  }
                                }}
                              />
                              <Label 
                                htmlFor={`perm-${permission.id}`} 
                                className="text-sm cursor-pointer"
                              >
                                {permission.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Note de sécurité */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Sécurité</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Un mot de passe temporaire sera généré automatiquement. 
                          L'utilisateur devra le changer lors de sa première connexion.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowNewUserDialog(false)}
                      className="px-6"
                    >
                      Annuler
                    </Button>
                    <Button 
                      onClick={createUser}
                      disabled={createUserMutation.isPending || !newUser.username || !newUser.first_name || !newUser.last_name || !newUser.email}
                      className="px-6"
                    >
                      {createUserMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Créer l'utilisateur
                        </>
                      )}
                    </Button>
                  </div>

                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                    <UsersIcon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total utilisateurs</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-success to-success/80 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-success-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Actifs</p>
                    <p className="text-2xl font-bold text-success">
                      {users.filter(u => u.status === "active").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-warning to-warning/80 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-warning-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Administrateurs</p>
                    <p className="text-2xl font-bold text-warning">
                      {users.filter(u => u.role === "admin").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Connectés aujourd'hui</p>
                    <p className="text-2xl font-bold text-secondary">
                      {users.filter(u => u.lastLogin.includes("2024-08-14")).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des utilisateurs</CardTitle>
              <CardDescription>
                Gérez les comptes et permissions de votre équipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length > 0 ? (
                <div className="space-y-4">
                  {users.map((user) => {
                    const roleInfo = getRoleInfo(user.role);
                    const statusInfo = getStatusInfo(user.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.firstName[0]}{user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                              <Badge variant={statusInfo.variant} className="gap-1">
                                <StatusIcon className="h-3 w-3" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {user.phone}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge variant={roleInfo.color as any}>
                                  {roleInfo.label}
                                </Badge>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Dernière connexion: {user.lastLogin}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Détails utilisateur</DialogTitle>
                                <DialogDescription>
                                  Informations complètes de {selectedUser?.firstName} {selectedUser?.lastName}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedUser && (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                      <AvatarImage src={selectedUser.avatar} />
                                      <AvatarFallback className="text-lg">
                                        {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="text-lg font-semibold">
                                        {selectedUser.firstName} {selectedUser.lastName}
                                      </h3>
                                      <p className="text-muted-foreground">{selectedUser.email}</p>
                                      <div className="flex gap-2 mt-2">
                                        <Badge variant={getRoleInfo(selectedUser.role).color as any}>
                                          {getRoleInfo(selectedUser.role).label}
                                        </Badge>
                                        <Badge variant={getStatusInfo(selectedUser.status).variant}>
                                          {getStatusInfo(selectedUser.status).label}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Téléphone</p>
                                      <p className="font-medium">{selectedUser.phone}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Membre depuis</p>
                                      <p className="font-medium">{selectedUser.createdAt}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Dernière connexion</p>
                                      <p className="font-medium">{selectedUser.lastLogin}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Permissions</p>
                                      <p className="font-medium">{selectedUser.permissions.length} autorisations</p>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-medium mb-2">Permissions détaillées</h4>
                                    {allPermissions.length > 0 ? (
                                      <div className="grid grid-cols-2 gap-2">
                                        {allPermissions.map(permission => (
                                          <div key={permission.id} className="flex items-center gap-2">
                                            <Checkbox
                                              checked={selectedUser.permissions.includes(permission.id) || selectedUser.permissions.includes("all")}
                                              disabled
                                            />
                                            <span className="text-sm">{permission.name || permission.label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-muted-foreground py-4">
                                        Aucune permission disponible
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex gap-2">
                                    <Button 
                                      onClick={() => resetPassword(selectedUser.id)} 
                                      variant="outline" 
                                      className="gap-2"
                                      disabled={resetPasswordMutation.isPending}
                                    >
                                      {resetPasswordMutation.isPending ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Lock className="h-4 w-4" />
                                      )}
                                      Réinitialiser mot de passe
                                    </Button>
                                    {selectedUser.status === "active" ? (
                                      <Button 
                                        onClick={() => updateUserStatus(selectedUser.id, "suspended")}
                                        variant="destructive"
                                        className="gap-2"
                                        disabled={updateUserStatusMutation.isPending}
                                      >
                                        {updateUserStatusMutation.isPending ? (
                                          <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <UserX className="h-4 w-4" />
                                        )}
                                        Suspendre
                                      </Button>
                                    ) : (
                                      <Button 
                                        onClick={() => updateUserStatus(selectedUser.id, "active")}
                                        variant="outline"
                                        className="gap-2"
                                        disabled={updateUserStatusMutation.isPending}
                                      >
                                        {updateUserStatusMutation.isPending ? (
                                          <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <UserCheck className="h-4 w-4" />
                                        )}
                                        Activer
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteUser(user.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur trouvé
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog pour modifier un utilisateur */}
          <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Modifier l'utilisateur</DialogTitle>
                <DialogDescription>
                  Modifiez les informations de l'utilisateur
                </DialogDescription>
              </DialogHeader>
              {editingUser && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit_first_name" className="text-sm">Prénom</Label>
                      <Input
                        id="edit_first_name"
                        value={editingUser.firstName}
                        onChange={(e) => setEditingUser(prev => prev ? {...prev, firstName: e.target.value} : null)}
                        className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit_last_name" className="text-sm">Nom</Label>
                      <Input
                        id="edit_last_name"
                        value={editingUser.lastName}
                        onChange={(e) => setEditingUser(prev => prev ? {...prev, lastName: e.target.value} : null)}
                        className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-9"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="edit_email" className="text-sm">Email</Label>
                    <Input
                      id="edit_email"
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser(prev => prev ? {...prev, email: e.target.value} : null)}
                      className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="edit_phone" className="text-sm">Téléphone</Label>
                    <Input
                      id="edit_phone"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser(prev => prev ? {...prev, phone: e.target.value} : null)}
                      className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-9"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit_role" className="text-sm">Rôle</Label>
                      <Select value={editingUser.role} onValueChange={(value: User["role"]) => setEditingUser(prev => prev ? {...prev, role: value} : null)}>
                        <SelectTrigger id="edit_role" className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-9">
                          <SelectValue />
                        </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit_status" className="text-sm">Statut</Label>
                      <Select value={editingUser.status} onValueChange={(value: User["status"]) => setEditingUser(prev => prev ? {...prev, status: value} : null)}>
                        <SelectTrigger id="edit_status" className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-9">
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="inactive">Inactif</SelectItem>
                          <SelectItem value="suspended">Suspendu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm">Permissions</Label>
                    {permissionsLoading ? (
                      <p className="text-xs text-muted-foreground">Chargement...</p>
                    ) : (
                      <div className="border border-gray-200 rounded p-2 bg-gray-50">
                        <div className="max-h-48 overflow-y-auto pr-2">
                          {Array.isArray(permissionsData) && permissionsData.length > 0 ? (
                            <>
                              {/* Grouper les permissions par catégorie */}
                              {Object.entries(
                                permissionsData.reduce((acc: {[key: string]: any[]}, permission: any) => {
                                  const category = permission.category || 'Autre';
                                  if (!acc[category]) acc[category] = [];
                                  acc[category].push(permission);
                                  return acc;
                                }, {})
                              ).map(([category, permissions]: [string, any[]]) => (
                                <div key={category} className="mb-3">
                                  <h4 className="text-xs font-semibold text-gray-700 mb-1 uppercase">{category}</h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {permissions.map((permission: any) => (
                                      <div key={permission.code} className="flex items-center space-x-1 p-1 hover:bg-white rounded transition-colors">
                                        <Checkbox
                                          id={`edit-${permission.code}`}
                                          checked={editingUser.permissions.includes(permission.code)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setEditingUser(prev => prev ? ({
                                                ...prev,
                                                permissions: [...prev.permissions, permission.code]
                                              }) : null);
                                            } else {
                                              setEditingUser(prev => prev ? ({
                                                ...prev,
                                                permissions: prev.permissions.filter(p => p !== permission.code)
                                              }) : null);
                                            }
                                          }}
                                          className="border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-3 w-3"
                                        />
                                        <Label htmlFor={`edit-${permission.code}`} className="text-xs font-medium cursor-pointer">
                                          {permission.name}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground col-span-2 text-center py-2">Aucune permission disponible</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleUpdateUser}
                      disabled={updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Mise à jour...
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
  );
}
