import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Camera, 
  Globe, 
  Clock,
  Activity,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Bell,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserActivities, useUpdateProfile, useChangePassword, useUpdatePreferences, useUserProfile, useUserActivity } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // États pour les formulaires
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: ""
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  
  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "Africa/Bujumbura",
    notifications: true,
    theme: "light"
  });
  
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // État pour la gestion de la photo de profil
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Hooks API
  const { data: userProfileData, isLoading: profileLoading } = useUserProfile();
  const { data: activitiesData, isLoading: activitiesLoading } = useUserActivity();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const updatePreferencesMutation = useUpdatePreferences();
  
  // Charger les données utilisateur
  useEffect(() => {
    if (userProfileData) {
      const userData = userProfileData as any;
      setProfileData({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || ""
      });
    }
  }, [userProfileData]);
  
  // Fonctions de mise à jour
  const handleUpdateProfile = () => {
    if (!profileData.first_name || !profileData.last_name || !profileData.email) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }
    
    updateProfileMutation.mutate(profileData);
  };
  
  const handleChangePassword = () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive"
      });
      return;
    }

    // Adapter les données pour correspondre au serializer backend
    const passwordChangeData = {
      old_password: passwordData.current_password,
      new_password: passwordData.new_password,
      confirm_password: passwordData.confirm_password
    };

    console.log('🔐 Changement mot de passe:', passwordChangeData);

    changePasswordMutation.mutate(passwordChangeData, {
      onSuccess: () => {
        toast({
          title: "Succès",
          description: "Mot de passe modifié avec succès",
          variant: "default"
        });
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: ""
        });
      },
      onError: (error: any) => {
        console.error('❌ Erreur changement mot de passe:', error);
        toast({
          title: "Erreur",
          description: error?.response?.data?.message || error?.message || "Erreur lors du changement de mot de passe",
          variant: "destructive"
        });
      }
    });
  };
  
  const handleUpdatePreferences = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  // Fonction pour gérer le changement de photo de profil
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un fichier image valide",
          variant: "destructive"
        });
        return;
      }

      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "La taille du fichier ne doit pas dépasser 5MB",
          variant: "destructive"
        });
        return;
      }

      setAvatarFile(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonction pour uploader la photo de profil
  const handleUploadAvatar = async () => {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      const API_URL = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/api`
        : 'http://127.0.0.1:8000/api';

      const token = localStorage.getItem('access_token');
      
      if (!token) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour modifier votre photo",
          variant: "destructive"
        });
        setUploadingAvatar(false);
        return;
      }

      console.log('📤 Upload avatar vers:', `${API_URL}/accounts/profile/`);

      const response = await fetch(`${API_URL}/accounts/profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Ne pas définir Content-Type, le navigateur le fera automatiquement avec boundary
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erreur serveur:', errorData);
        throw new Error(errorData.message || errorData.error || 'Erreur lors de la mise à jour');
      }

      const updatedUser = await response.json();
      console.log('✅ Avatar mis à jour:', updatedUser);
      
      // Mettre à jour le localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser && currentUser.isLoggedIn) {
        const updatedUserData = {
          ...currentUser,
          ...updatedUser,
          isLoggedIn: currentUser.isLoggedIn,
          sessionExpiry: currentUser.sessionExpiry,
          lastActivity: currentUser.lastActivity
        };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        
        // Déclencher un événement pour notifier les autres composants
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'user',
          newValue: JSON.stringify(updatedUserData),
          oldValue: JSON.stringify(currentUser)
        }));
      }

      toast({
        title: "Succès",
        description: "Photo de profil mise à jour avec succès",
        variant: "default"
      });
      
      setAvatarFile(null);
      setAvatarPreview(null);
      
      // Recharger la page pour afficher la nouvelle photo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Erreur upload avatar:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Erreur lors de la mise à jour de la photo",
        variant: "destructive"
      });
      setUploadingAvatar(false);
    }
  };

  // Fonction pour annuler la sélection d'avatar
  const handleCancelAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };
  
  const getRoleDisplay = (role: string) => {
    const roleMap = {
      admin: { label: "Administrateur", icon: "👑", color: "bg-red-100 text-red-800" },
      manager: { label: "Manager", icon: "👔", color: "bg-blue-100 text-blue-800" },
      server: { label: "Serveur", icon: "🍽️", color: "bg-green-100 text-green-800" },
      cashier: { label: "Caissier", icon: "💰", color: "bg-yellow-100 text-yellow-800" }
    };
    
    return roleMap[role as keyof typeof roleMap] || { 
      label: role, 
      icon: "👤", 
      color: "bg-gray-100 text-gray-800" 
    };
  };
  
  const roleInfo = getRoleDisplay(user?.role || "");
  
  if (profileLoading) {
    return (
    <>
      <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p>Chargement du profil...</p>
            </div>
          </main>
    </>
  );
  }
  
  return (
    <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-x-hidden">
          {/* Header avec informations utilisateur */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarImage src={avatarPreview || user?.avatar} />
                <AvatarFallback className="text-xl sm:text-2xl">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              {avatarPreview && (
                <div className="absolute -top-2 -right-2">
                  <Button
                    size="sm"
                    onClick={handleUploadAvatar}
                    className="h-8 w-8 rounded-full p-0"
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {user?.first_name} {user?.last_name}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                {user?.email}
              </p>
              <Badge variant="secondary" className="mt-2">
                {user?.role}
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                id="avatar-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('avatar-upload')?.click()}
                className="gap-2 w-full sm:w-auto"
              >
                <Camera className="h-4 w-4" />
                Changer la photo
              </Button>
              {avatarPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelAvatar}
                  className="gap-2 w-full sm:w-auto"
                >
                  <X className="h-4 w-4" />
                  Annuler
                </Button>
              )}
            </div>
          </div>
          
          {/* Onglets */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="profile" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Profil</span>
                <span className="sm:hidden">Info</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Sécurité</span>
                <span className="sm:hidden">Sécu</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Préférences</span>
                <span className="sm:hidden">Prefs</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Activité</span>
                <span className="sm:hidden">Log</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Onglet Profil */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>
                    Modifiez vos informations personnelles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Prénom *</Label>
                      <Input
                        id="first_name"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData(prev => ({...prev, first_name: e.target.value}))}
                        placeholder="Votre prénom"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Nom *</Label>
                      <Input
                        id="last_name"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData(prev => ({...prev, last_name: e.target.value}))}
                        placeholder="Votre nom"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({...prev, email: e.target.value}))}
                        placeholder="votre.email@example.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({...prev, phone: e.target.value}))}
                        placeholder="+257 XX XX XX XX"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData(prev => ({...prev, address: e.target.value}))}
                        placeholder="Votre adresse"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleUpdateProfile}
                      disabled={updateProfileMutation.isPending}
                      className="gap-2 w-full sm:w-auto"
                    >
                      {updateProfileMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Sauvegarder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Onglet Sécurité */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Changer le mot de passe</CardTitle>
                  <CardDescription>
                    Modifiez votre mot de passe pour sécuriser votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Mot de passe actuel *</Label>
                      <div className="relative">
                        <Input
                          id="current_password"
                          type={showPassword.current ? "text" : "password"}
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData(prev => ({...prev, current_password: e.target.value}))}
                          placeholder="Votre mot de passe actuel"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(prev => ({...prev, current: !prev.current}))}
                        >
                          {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new_password">Nouveau mot de passe *</Label>
                      <div className="relative">
                        <Input
                          id="new_password"
                          type={showPassword.new ? "text" : "password"}
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData(prev => ({...prev, new_password: e.target.value}))}
                          placeholder="Nouveau mot de passe (min. 8 caractères)"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(prev => ({...prev, new: !prev.new}))}
                        >
                          {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirmer le mot de passe *</Label>
                      <div className="relative">
                        <Input
                          id="confirm_password"
                          type={showPassword.confirm ? "text" : "password"}
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData(prev => ({...prev, confirm_password: e.target.value}))}
                          placeholder="Confirmez le nouveau mot de passe"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(prev => ({...prev, confirm: !prev.confirm}))}
                        >
                          {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Lock className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-900">Conseils de sécurité</h4>
                        <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                          <li>• Utilisez au moins 8 caractères</li>
                          <li>• Mélangez lettres, chiffres et symboles</li>
                          <li>• Évitez les mots de passe trop simples</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleChangePassword}
                      disabled={changePasswordMutation.isPending}
                      className="gap-2"
                    >
                      {changePasswordMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      Changer le mot de passe
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Onglet Préférences */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Préférences</CardTitle>
                  <CardDescription>
                    Personnalisez votre expérience utilisateur
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="language">Langue</Label>
                      <Select 
                        value={preferences.language} 
                        onValueChange={(value) => setPreferences(prev => ({...prev, language: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">🇫🇷 Français</SelectItem>
                          <SelectItem value="en">🇺🇸 English</SelectItem>
                          <SelectItem value="rn">🇧🇮 Kirundi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuseau horaire</Label>
                      <Select 
                        value={preferences.timezone} 
                        onValueChange={(value) => setPreferences(prev => ({...prev, timezone: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Bujumbura">🇧🇮 Bujumbura (CAT)</SelectItem>
                          <SelectItem value="Africa/Kigali">🇷🇼 Kigali (CAT)</SelectItem>
                          <SelectItem value="Africa/Nairobi">🇰🇪 Nairobi (EAT)</SelectItem>
                          <SelectItem value="UTC">🌍 UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="theme">Thème</Label>
                      <Select 
                        value={preferences.theme} 
                        onValueChange={(value) => setPreferences(prev => ({...prev, theme: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">☀️ Clair</SelectItem>
                          <SelectItem value="dark">🌙 Sombre</SelectItem>
                          <SelectItem value="auto">🔄 Automatique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notifications">Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Recevoir des notifications push
                        </p>
                      </div>
                      <Switch
                        id="notifications"
                        checked={preferences.notifications}
                        onCheckedChange={(checked) => setPreferences(prev => ({...prev, notifications: checked}))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleUpdatePreferences}
                      disabled={updatePreferencesMutation.isPending}
                      className="gap-2"
                    >
                      {updatePreferencesMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Settings className="h-4 w-4" />
                      )}
                      Sauvegarder les préférences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Onglet Activité */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Activité récente</CardTitle>
                  <CardDescription>
                    Historique de vos actions dans l'application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                      <p>Chargement de l'activité...</p>
                    </div>
                  ) : (activitiesData as any)?.results && (activitiesData as any).results.length > 0 ? (
                    <div className="space-y-4">
                      {(activitiesData as any).results.slice(0, 10).map((activity: any, index: number) => (
                        <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                          <div className="flex-shrink-0">
                            <div className={`p-2 rounded-full ${
                              activity.type === 'auth' ? 'bg-green-100 text-green-600' :
                              activity.type === 'admin' ? 'bg-blue-100 text-blue-600' :
                              activity.type === 'sales' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              <Activity className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.action || "Action inconnue"}</p>
                            <p className="text-sm text-muted-foreground">
                              {activity.description || "Aucune description"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.timestamp ? new Date(activity.timestamp).toLocaleString('fr-FR') : "Date inconnue"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune activité</h3>
                      <p className="text-gray-500">Votre activité récente apparaîtra ici</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
  );
}