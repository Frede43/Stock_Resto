import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings as SettingsIcon, Save, RotateCcw, Bell,
  Printer, Shield, Database, Palette, CheckCircle, AlertCircle,
  Wifi, Monitor, HardDrive, Users, Clock, Globe, TestTube
} from 'lucide-react';
import { useSystemSettingsNew, useUpdateSystemSettingsNew } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/use-auth';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    version: '2.1.0',
    uptime: '2 jours, 14 heures',
    lastBackup: new Date().toLocaleDateString(),
    activeUsers: 3
  });
  const { toast } = useToast();

  const { data: systemSettings, isLoading, refetch } = useSystemSettingsNew();
  const updateSettings = useUpdateSystemSettingsNew();
  const [isTestingPrinter, setIsTestingPrinter] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (systemSettings) {
      // Cast systemSettings pour éviter les erreurs TypeScript 
      const settings = systemSettings as any; 
      
      // Initialiser avec les paramètres système et localStorage
      const printingSettings = {
        receipt_printer: localStorage.getItem('receipt_printer_name') || settings.printing?.receipt_printer || '',
        report_printer: localStorage.getItem('report_printer_name') || settings.printing?.report_printer || '',
        auto_print_receipts: localStorage.getItem('auto_print_receipts') === 'true' || settings.printing?.auto_print_receipts === true,
        auto_print_daily_reports: settings.printing?.auto_print_daily_reports === true,
        thermal_format: settings.printing?.thermal_format === true,
        copies: settings.printing?.copies || 1
      };

      setLocalSettings({
        ...settings,
        printing: printingSettings
      });
    }
  }, [systemSettings]);

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
    
    // Sauvegarder aussi dans localStorage pour les paramètres d'impression
    if (key === 'printing') {
      if (value.receipt_printer !== undefined) {
        localStorage.setItem('receipt_printer_name', value.receipt_printer || '');
      }
      if (value.report_printer !== undefined) {
        localStorage.setItem('report_printer_name', value.report_printer || '');
      }
      if (value.auto_print_receipts !== undefined) {
        localStorage.setItem('auto_print_receipts', value.auto_print_receipts.toString());
      }
      if (value.auto_print_daily_reports !== undefined) {
        localStorage.setItem('auto_print_daily_reports', value.auto_print_daily_reports.toString());
      }
      if (value.thermal_format !== undefined) {
        localStorage.setItem('thermal_format', value.thermal_format.toString());
      }
      if (value.copies !== undefined) {
        localStorage.setItem('print_copies', value.copies.toString());
      }
    }
  };

  const handleSaveSettings = async () => {
    try {
      console.log('🔧 Sauvegarde des paramètres:', localSettings);
      console.log('🔍 Utilisateur connecté:', user);
      console.log('🔍 Token dans localStorage:', localStorage.getItem('access_token'));
      
      await updateSettings.mutateAsync(localSettings);
      setHasUnsavedChanges(false);
      toast({
        title: "Paramètres sauvegardés",
        description: "Tous les paramètres ont été mis à jour avec succès",
      });
      
      // Rafraîchir les données
      refetch();
    } catch (error) {
      console.error('❌ Erreur sauvegarde paramètres:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    }
  };

  const handleResetSettings = () => {
    if (systemSettings) {
      setLocalSettings(systemSettings);
      setHasUnsavedChanges(false);
      toast({
        title: "Paramètres réinitialisés",
        description: "Les modifications ont été annulées",
      });
    }
  };

  // Fonction pour exporter la configuration
  const exportSettings = () => {
    const dataStr = JSON.stringify(localSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bar-stock-wise-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Configuration exportée",
      description: "Le fichier de configuration a été téléchargé",
    });
  };

  // Fonction pour importer la configuration
  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setLocalSettings(importedSettings);
          setHasUnsavedChanges(true);
          toast({
            title: "Configuration importée",
            description: "Les paramètres ont été chargés. N'oubliez pas de sauvegarder.",
          });
        } catch (error) {
          toast({
            title: "Erreur d'importation",
            description: "Le fichier de configuration est invalide",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  // Fonction de test d'impression
  const testPrinter = async () => {
    setIsTestingPrinter(true);

    try {
      console.log("🖨️ Test d'impression...");
      
      const printerName = localSettings.printing?.receipt_printer || 'Imprimante par défaut';
      
      // Créer une page de test
      const testContent = `
        <html>
          <head>
            <title>Test d'impression - Harry's Grill Bar-Resto</title>
            <style>
              @media print {
                body { 
                  font-family: monospace; 
                  font-size: 12px; 
                  width: ${localSettings.printing?.thermal_format ? '80mm' : 'auto'}; 
                  margin: 0; 
                  padding: 10px;
                }
              }
            </style>
          </head>
          <body>
            <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
              <h3>Harry's Grill Bar-Resto</h3>
              <p>Test d'impression</p>
            </div>
            
            <div style="margin-bottom: 10px;">
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Imprimante:</strong> ${printerName}</p>
              <p><strong>Format:</strong> ${localSettings.printing?.thermal_format ? 'Thermique 80mm' : 'Standard'}</p>
              <p><strong>Copies:</strong> ${localSettings.printing?.copies || 1}</p>
            </div>
            
            <div style="border-top: 1px dashed #000; padding-top: 10px; text-align: center;">
              <p>✅ Test d'impression réussi!</p>
              <p>Configuration fonctionnelle.</p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p>================================</p>
            </div>
          </body>
        </html>
      `;

      // Ouvrir une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(testContent);
        printWindow.document.close();
        
        // Attendre que le contenu soit chargé
        printWindow.onload = () => {
          printWindow.print();
          
          // Fermer la fenêtre après impression
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        };

        toast({
          title: "Test d'impression lancé",
          description: `Test envoyé vers: ${printerName}`,
        });
      } else {
        throw new Error("Impossible d'ouvrir la fenêtre d'impression");
      }

    } catch (error) {
      console.error("❌ Erreur test d'impression:", error);
      toast({
        title: "Erreur d'impression",
        description: "Impossible de tester l'imprimante. Vérifiez la connexion.",
        variant: "destructive",
      });
    } finally {
      setIsTestingPrinter(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des paramètres...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 p-6 space-y-6">
          {/* Debug Panel */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-sm text-yellow-800">🔍 Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-yellow-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Utilisateur:</strong> {user?.username || 'Non connecté'}
                </div>
                <div>
                  <strong>Rôle:</strong> {user?.role || 'N/A'}
                </div>
                <div>
                  <strong>Is Superuser:</strong> {user?.is_superuser ? 'Oui' : 'Non'}
                </div>
                <div>
                  <strong>Token présent:</strong> {localStorage.getItem('access_token') ? 'Oui' : 'Non'}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <SettingsIcon className="h-8 w-8" />
                Paramètres Système
                {hasUnsavedChanges && (
                  <Badge variant="destructive" className="ml-2">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Non sauvegardé
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground mt-2">
                Configuration et personnalisation de l'application Bar Stock Wise
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                v{systemInfo.version}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {systemInfo.activeUsers} utilisateurs
              </Badge>
            </div>
          </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="printing">Impression</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Paramètres Généraux
              </CardTitle>
              <CardDescription>
                Configuration de base de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="restaurant_name">Nom du restaurant</Label>
                  <Input
                    id="restaurant_name"
                    value={localSettings.restaurant?.name || 'BarStockWise'}
                    onChange={(e) => handleSettingChange('restaurant', { ...localSettings.restaurant, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurant_phone">Téléphone</Label>
                  <Input
                    id="restaurant_phone"
                    value={localSettings.restaurant?.phone || ''}
                    onChange={(e) => handleSettingChange('restaurant', { ...localSettings.restaurant, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurant_email">Email</Label>
                  <Input
                    id="restaurant_email"
                    type="email"
                    value={localSettings.restaurant?.email || ''}
                    onChange={(e) => handleSettingChange('restaurant', { ...localSettings.restaurant, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select
                    value={localSettings.restaurant?.currency || 'BIF'}
                    onValueChange={(value) => handleSettingChange('restaurant', { ...localSettings.restaurant, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BIF">Franc Burundais (BIF)</SelectItem>
                      <SelectItem value="USD">Dollar US (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select
                    value={localSettings.system?.timezone || 'Africa/Bujumbura'}
                    onValueChange={(value) => handleSettingChange('system', { ...localSettings.system, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Bujumbura">Bujumbura</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurant_address">Adresse du restaurant</Label>
                <Textarea
                  id="restaurant_address"
                  value={localSettings.restaurant?.address || ''}
                  onChange={(e) => handleSettingChange('restaurant', { ...localSettings.restaurant, address: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Paramètres de Notifications
              </CardTitle>
              <CardDescription>
                Configuration des alertes et notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications de stock</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des alertes quand le stock est bas
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.notifications?.low_stock_alerts !== false}
                    onCheckedChange={(checked) => handleSettingChange('notifications', { ...localSettings.notifications, low_stock_alerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications de ventes</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications pour les nouvelles ventes
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.notifications?.email_enabled !== false}
                    onCheckedChange={(checked) => handleSettingChange('notifications', { ...localSettings.notifications, email_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications système</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des alertes système importantes
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.notifications?.daily_reports !== false}
                    onCheckedChange={(checked) => handleSettingChange('notifications', { ...localSettings.notifications, daily_reports: checked })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification_email">Email pour notifications</Label>
                <Input
                  id="notification_email"
                  type="email"
                  value={localSettings.restaurant?.email || ''}
                  onChange={(e) => handleSettingChange('restaurant', { ...localSettings.restaurant, email: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printing" className="space-y-6">
          {/* Paramètres d'impression avancés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Configuration d'Impression Avancée
              </CardTitle>
              <CardDescription>
                Paramètres système pour l'impression des factures et rapports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="receipt_printer_system">Imprimante reçus (système)</Label>
                  <Input
                    id="receipt_printer_system"
                    value={localSettings.printing?.receipt_printer || ''}
                    onChange={(e) => handleSettingChange('printing', { ...localSettings.printing, receipt_printer: e.target.value })}
                    placeholder="Nom de l'imprimante pour les reçus"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report_printer_system">Imprimante rapports (système)</Label>
                  <Input
                    id="report_printer_system"
                    value={localSettings.printing?.report_printer || ''}
                    onChange={(e) => handleSettingChange('printing', { ...localSettings.printing, report_printer: e.target.value })}
                    placeholder="Nom de l'imprimante pour les rapports"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Impression automatique des reçus</Label>
                    <p className="text-sm text-muted-foreground">
                      Imprimer automatiquement après chaque vente confirmée
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.printing?.auto_print_receipts === true}
                    onCheckedChange={(checked) => handleSettingChange('printing', { ...localSettings.printing, auto_print_receipts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Impression des rapports quotidiens</Label>
                    <p className="text-sm text-muted-foreground">
                      Imprimer automatiquement le rapport de fin de journée
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.printing?.auto_print_daily_reports === true}
                    onCheckedChange={(checked) => handleSettingChange('printing', { ...localSettings.printing, auto_print_daily_reports: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Format de papier thermique</Label>
                    <p className="text-sm text-muted-foreground">
                      Optimiser pour imprimantes thermiques 80mm
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.printing?.thermal_format === true}
                    onCheckedChange={(checked) => handleSettingChange('printing', { ...localSettings.printing, thermal_format: checked })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="print_copies">Nombre de copies</Label>
                <Select
                  value={localSettings.printing?.copies?.toString() || '1'}
                  onValueChange={(value) => handleSettingChange('printing', { ...localSettings.printing, copies: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 copie</SelectItem>
                    <SelectItem value="2">2 copies</SelectItem>
                    <SelectItem value="3">3 copies</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Test d'impression */}
              <div className="flex justify-center">
                <Button 
                  onClick={testPrinter} 
                  disabled={isTestingPrinter}
                  className="w-full max-w-md"
                  variant="outline"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {isTestingPrinter ? 'Test en cours...' : 'Tester l\'impression'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Paramètres de Sécurité
              </CardTitle>
              <CardDescription>
                Configuration de la sécurité et des accès
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Authentification à deux facteurs</Label>
                    <p className="text-sm text-muted-foreground">
                      Activer la 2FA pour plus de sécurité
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.system?.two_factor_auth === true}
                    onCheckedChange={(checked) => handleSettingChange('system', { ...localSettings.system, two_factor_auth: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Déconnexion automatique</Label>
                    <p className="text-sm text-muted-foreground">
                      Déconnecter après une période d'inactivité
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.system?.auto_logout !== false}
                    onCheckedChange={(checked) => handleSettingChange('system', { ...localSettings.system, auto_logout: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Logs d'audit</Label>
                    <p className="text-sm text-muted-foreground">
                      Enregistrer toutes les actions utilisateur
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.system?.audit_logs !== false}
                    onCheckedChange={(checked) => handleSettingChange('system', { ...localSettings.system, audit_logs: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Délai de session (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    min="5"
                    max="480"
                    value={localSettings.system?.session_timeout || 30}
                    onChange={(e) => handleSettingChange('system', { ...localSettings.system, session_timeout: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_login_attempts">Tentatives de connexion max</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    min="3"
                    max="10"
                    value={localSettings.system?.max_login_attempts || 5}
                    onChange={(e) => handleSettingChange('system', { ...localSettings.system, max_login_attempts: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations système */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Informations Système
              </CardTitle>
              <CardDescription>
                État et statistiques du système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Version</p>
                    <p className="text-xs text-muted-foreground">{systemInfo.version}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Uptime</p>
                    <p className="text-xs text-muted-foreground">{systemInfo.uptime}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <HardDrive className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Dernière sauvegarde</p>
                    <p className="text-xs text-muted-foreground">{systemInfo.lastBackup}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Utilisateurs actifs</p>
                    <p className="text-xs text-muted-foreground">{systemInfo.activeUsers}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

          {/* Boutons de sauvegarde globaux */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportSettings}>
                <Database className="h-4 w-4 mr-2" />
                Exporter la configuration
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Importer la configuration
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleResetSettings}
                disabled={!hasUnsavedChanges}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Annuler les modifications
              </Button>
              
              <Button 
                onClick={handleSaveSettings} 
                disabled={updateSettings.isPending || !hasUnsavedChanges}
                className={hasUnsavedChanges ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateSettings.isPending ? 'Sauvegarde...' : 'Sauvegarder tous les paramètres'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}