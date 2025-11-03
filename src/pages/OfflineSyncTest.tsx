// Page de test complète pour la synchronisation offline avancée
import { useState, useEffect } from 'react';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { offlineStorage } from '@/services/offline-storage';
import { backgroundSync } from '@/services/background-sync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  Zap,
  TestTube,
  Play,
  Settings,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OfflineSyncTest() {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    syncProgress,
    conflictsCount,
    lastSyncTime,
    syncPendingData,
    addToQueue,
    getSyncStatus,
  } = useOfflineSync();

  const { toast } = useToast();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [bgSyncInfo, setBgSyncInfo] = useState<any>(null);
  const [detailedStatus, setDetailedStatus] = useState<any>(null);

  // Charger les infos au montage
  useEffect(() => {
    loadInfo();
    const interval = setInterval(loadInfo, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadInfo = async () => {
    const info = backgroundSync.getInfo();
    setBgSyncInfo(info);

    const status = await getSyncStatus();
    setDetailedStatus(status);
  };

  // Ajouter un résultat de test
  const addTestResult = (name: string, success: boolean, message: string) => {
    setTestResults(prev => [...prev, {
      name,
      success,
      message,
      timestamp: new Date().toISOString(),
    }]);
  };

  // Test 1 : Ajouter des items avec différentes priorités
  const testPriorities = async () => {
    try {
      console.log('🧪 Test 1 : Priorités');
      
      // Haute priorité
      await addToQueue('create', '/api/sales/', { test: 'high' }, 1);
      addTestResult('Priorité Haute', true, 'Item ajouté avec priorité 1');
      
      // Moyenne priorité
      await addToQueue('create', '/api/orders/', { test: 'medium' }, 2);
      addTestResult('Priorité Moyenne', true, 'Item ajouté avec priorité 2');
      
      // Basse priorité
      await addToQueue('update', '/api/products/1/', { test: 'low' }, 3);
      addTestResult('Priorité Basse', true, 'Item ajouté avec priorité 3');
      
      toast({
        title: '✅ Test Priorités',
        description: '3 items ajoutés avec différentes priorités',
        duration: 3000,
      });
    } catch (error: any) {
      addTestResult('Priorités', false, error.message);
    }
  };

  // Test 2 : Dépendances
  const testDependencies = async () => {
    try {
      console.log('🧪 Test 2 : Dépendances');
      
      // Créer une vente
      const saleId = await addToQueue('create', '/api/sales/', { total: 10000 }, 1);
      addTestResult('Vente créée', true, `ID: ${saleId}`);
      
      // Créer un paiement qui dépend de la vente
      await addToQueue('create', '/api/payments/', { amount: 10000 }, 1, [saleId]);
      addTestResult('Paiement avec dépendance', true, `Dépend de ${saleId}`);
      
      toast({
        title: '✅ Test Dépendances',
        description: 'Vente et paiement liés créés',
        duration: 3000,
      });
    } catch (error: any) {
      addTestResult('Dépendances', false, error.message);
    }
  };

  // Test 3 : Créer un conflit artificiel
  const testConflict = async () => {
    try {
      console.log('🧪 Test 3 : Conflit');
      
      const localData = { name: 'Produit Local', price: 5000 };
      const serverData = { name: 'Produit Serveur', price: 5500 };
      
      await offlineStorage.addConflict('data', localData, serverData, false);
      addTestResult('Conflit créé', true, 'Conflit de données ajouté');
      
      toast({
        title: '✅ Test Conflit',
        description: 'Conflit artificiel créé',
        duration: 3000,
      });
    } catch (error: any) {
      addTestResult('Conflit', false, error.message);
    }
  };

  // Test 4 : Background Sync
  const testBackgroundSync = async () => {
    try {
      console.log('🧪 Test 4 : Background Sync');
      
      if (!bgSyncInfo?.isSupported) {
        addTestResult('Background Sync', false, 'Non supporté par le navigateur');
        toast({
          title: '⚠️ Background Sync',
          description: 'Non supporté par ce navigateur',
          variant: 'destructive',
          duration: 3000,
        });
        return;
      }
      
      const success = await backgroundSync.syncOfflineQueue();
      
      if (success) {
        addTestResult('Background Sync', true, 'Synchronisation enregistrée');
        toast({
          title: '✅ Background Sync',
          description: 'Synchronisation en arrière-plan enregistrée',
          duration: 3000,
        });
      } else {
        addTestResult('Background Sync', false, 'Échec enregistrement');
      }
    } catch (error: any) {
      addTestResult('Background Sync', false, error.message);
    }
  };

  // Test 5 : Statistiques
  const testStatistics = async () => {
    try {
      console.log('🧪 Test 5 : Statistiques');
      
      const stats = await offlineStorage.getSyncStats();
      const dbStats = await offlineStorage.getStats();
      
      addTestResult('Statistiques Sync', true, JSON.stringify(stats));
      addTestResult('Statistiques DB', true, JSON.stringify(dbStats));
      
      toast({
        title: '✅ Test Statistiques',
        description: 'Statistiques récupérées',
        duration: 3000,
      });
    } catch (error: any) {
      addTestResult('Statistiques', false, error.message);
    }
  };

  // Test 6 : Synchronisation complète
  const testFullSync = async () => {
    try {
      console.log('🧪 Test 6 : Synchronisation complète');
      
      if (!isOnline) {
        addTestResult('Sync complète', false, 'Hors ligne');
        toast({
          title: '⚠️ Hors ligne',
          description: 'Impossible de synchroniser',
          variant: 'destructive',
          duration: 3000,
        });
        return;
      }
      
      await syncPendingData();
      addTestResult('Sync complète', true, 'Synchronisation lancée');
      
      toast({
        title: '✅ Test Sync',
        description: 'Synchronisation complète lancée',
        duration: 3000,
      });
    } catch (error: any) {
      addTestResult('Sync complète', false, error.message);
    }
  };

  // Exécuter tous les tests
  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    try {
      await testPriorities();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testDependencies();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testConflict();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testBackgroundSync();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testStatistics();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Ne pas lancer la sync complète automatiquement
      // await testFullSync();
      
      toast({
        title: '🎉 Tests terminés',
        description: `${testResults.filter(r => r.success).length} réussis`,
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        title: '❌ Erreur tests',
        description: error.message,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  // Nettoyer tout
  const clearAll = async () => {
    if (confirm('⚠️ Supprimer toutes les données de test ?')) {
      await offlineStorage.clearAll();
      setTestResults([]);
      toast({
        title: '🗑️ Nettoyage',
        description: 'Toutes les données supprimées',
        duration: 3000,
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TestTube className="h-8 w-8" />
            Test Synchronisation Offline
          </h1>
          <p className="text-muted-foreground">
            Testez toutes les fonctionnalités de synchronisation avancée
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Badge variant="success" className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              En ligne
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              Hors ligne
            </Badge>
          )}
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Conflits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conflictsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Background Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {bgSyncInfo?.isSupported ? (
                <Badge variant="success">Supporté</Badge>
              ) : (
                <Badge variant="destructive">Non supporté</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-green-500" />
              Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testResults.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progression */}
      {isSyncing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Synchronisation en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={syncProgress} className="h-3" />
            <div className="mt-2 text-sm text-muted-foreground text-right">
              {syncProgress}% complété
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="results">Résultats</TabsTrigger>
          <TabsTrigger value="info">Informations</TabsTrigger>
        </TabsList>

        {/* Onglet Tests */}
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tests unitaires</CardTitle>
              <CardDescription>
                Testez chaque fonctionnalité individuellement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={testPriorities} disabled={isRunningTests}>
                  <Play className="h-4 w-4 mr-2" />
                  Test Priorités
                </Button>
                
                <Button onClick={testDependencies} disabled={isRunningTests}>
                  <Play className="h-4 w-4 mr-2" />
                  Test Dépendances
                </Button>
                
                <Button onClick={testConflict} disabled={isRunningTests}>
                  <Play className="h-4 w-4 mr-2" />
                  Test Conflit
                </Button>
                
                <Button onClick={testBackgroundSync} disabled={isRunningTests}>
                  <Play className="h-4 w-4 mr-2" />
                  Test Background Sync
                </Button>
                
                <Button onClick={testStatistics} disabled={isRunningTests}>
                  <Play className="h-4 w-4 mr-2" />
                  Test Statistiques
                </Button>
                
                <Button onClick={testFullSync} disabled={isRunningTests || !isOnline}>
                  <Play className="h-4 w-4 mr-2" />
                  Test Sync Complète
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex gap-3">
                <Button 
                  onClick={runAllTests} 
                  disabled={isRunningTests}
                  className="flex-1"
                >
                  {isRunningTests ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Exécuter tous les tests
                </Button>
                
                <Button 
                  variant="destructive" 
                  onClick={clearAll}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Nettoyer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Résultats */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Résultats des tests</CardTitle>
              <CardDescription>
                {testResults.length} test(s) exécuté(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{result.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.message}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(result.timestamp).toLocaleTimeString('fr-FR')}
                      </div>
                    </div>
                  </div>
                ))}
                
                {testResults.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    Aucun test exécuté
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Informations */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations système</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Background Sync</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                  {JSON.stringify(bgSyncInfo, null, 2)}
                </pre>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Statut détaillé</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                  {JSON.stringify(detailedStatus, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

