// Page de test pour les fonctionnalités offline
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { useOfflineKitchen } from '@/hooks/use-offline-kitchen';
import { useOfflinePayments } from '@/hooks/use-offline-payments';
import { useOfflineStocks } from '@/hooks/use-offline-stocks';
import { offlineStorage } from '@/services/offline-storage';
import { useToast } from '@/hooks/use-toast';
import { Wifi, WifiOff, ChefHat, CreditCard, Package, Database, RefreshCw } from 'lucide-react';

export default function OfflineTest() {
  const { isOnline, isSyncing, pendingCount, syncPendingData } = useOfflineSync();
  const { createOrder, markAsReady } = useOfflineKitchen();
  const { recordCashPayment, applyDiscount } = useOfflinePayments();
  const { recordSale, markAsOutOfStock } = useOfflineStocks();
  const { toast } = useToast();

  const [stats, setStats] = useState<any>(null);
  const [testOrderId, setTestOrderId] = useState('');
  const [testSaleId, setTestSaleId] = useState('');
  const [testProductId, setTestProductId] = useState('10');

  // Rafraîchir les statistiques
  const refreshStats = async () => {
    const dbStats = await offlineStorage.getStats();
    setStats(dbStats);
  };

  // Test 1: Créer une commande
  const testCreateOrder = async () => {
    try {
      const order = await createOrder({
        table_id: 5,
        items: [
          { product_id: 10, quantity: 2, name: 'Pizza Margherita' },
          { product_id: 15, quantity: 1, name: 'Coca-Cola' }
        ],
        notes: 'Test offline - Sans oignons',
        status: 'pending'
      });
      
      setTestOrderId(order.id);
      await refreshStats();
      
      toast({
        title: '✅ Commande créée',
        description: `ID: ${order.id}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  // Test 2: Marquer commande comme prête
  const testMarkReady = async () => {
    if (!testOrderId) {
      toast({
        title: '⚠️ Attention',
        description: 'Créez d\'abord une commande',
        variant: 'destructive',
      });
      return;
    }

    try {
      await markAsReady(testOrderId);
      await refreshStats();
      
      toast({
        title: '✅ Commande marquée prête',
        description: `ID: ${testOrderId}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  // Test 3: Enregistrer un paiement
  const testPayment = async () => {
    if (!testSaleId) {
      toast({
        title: '⚠️ Attention',
        description: 'Entrez un ID de vente',
        variant: 'destructive',
      });
      return;
    }

    try {
      await recordCashPayment(testSaleId, 57000);
      await refreshStats();
      
      toast({
        title: '✅ Paiement enregistré',
        description: `Vente ${testSaleId}: 57000 BIF`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  // Test 4: Appliquer une réduction
  const testDiscount = async () => {
    if (!testSaleId) {
      toast({
        title: '⚠️ Attention',
        description: 'Entrez un ID de vente',
        variant: 'destructive',
      });
      return;
    }

    try {
      await applyDiscount(testSaleId, 5000, 'Test offline - Client fidèle');
      await refreshStats();
      
      toast({
        title: '✅ Réduction appliquée',
        description: `Vente ${testSaleId}: -5000 BIF`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  // Test 5: Enregistrer sortie de stock
  const testStockSale = async () => {
    try {
      await recordSale(parseInt(testProductId), 5, testSaleId || 'test-sale');
      await refreshStats();
      
      toast({
        title: '✅ Sortie de stock enregistrée',
        description: `Produit ${testProductId}: -5 unités`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  // Test 6: Marquer rupture de stock
  const testOutOfStock = async () => {
    try {
      await markAsOutOfStock(parseInt(testProductId));
      await refreshStats();
      
      toast({
        title: '✅ Produit marqué en rupture',
        description: `Produit ${testProductId}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  // Vider le cache
  const clearCache = async () => {
    try {
      await offlineStorage.clearAll();
      await refreshStats();
      
      toast({
        title: '✅ Cache vidé',
        description: 'Toutes les données locales supprimées',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  return (
    <main className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Mode Offline</h1>
          <p className="text-muted-foreground">
            Testez toutes les fonctionnalités offline
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isOnline ? (
            <div className="flex items-center gap-2 text-green-600">
              <Wifi className="h-5 w-5" />
              <span className="font-semibold">En ligne</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <WifiOff className="h-5 w-5" />
              <span className="font-semibold">Hors ligne</span>
            </div>
          )}
          
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 text-orange-600">
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{pendingCount} en attente</span>
            </div>
          )}
          
          <Button onClick={syncPendingData} disabled={!isOnline || isSyncing}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Synchroniser
          </Button>
        </div>
      </div>

      {/* Statistiques IndexedDB */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Statistiques IndexedDB
          </CardTitle>
          <CardDescription>
            Données stockées localement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats?.sales || 0}</div>
              <div className="text-sm text-muted-foreground">Ventes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats?.orders || 0}</div>
              <div className="text-sm text-muted-foreground">Commandes</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats?.payments || 0}</div>
              <div className="text-sm text-muted-foreground">Paiements</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats?.stockMovements || 0}</div>
              <div className="text-sm text-muted-foreground">Stocks</div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button onClick={refreshStats} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={clearCache} variant="destructive" size="sm">
              Vider le cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tests Commandes Cuisine */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Test Commandes Cuisine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testCreateOrder}>
              Créer Commande
            </Button>
            <Button onClick={testMarkReady} disabled={!testOrderId}>
              Marquer Prête
            </Button>
          </div>
          
          {testOrderId && (
            <div className="p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">ID Commande: </span>
              <span className="text-sm text-muted-foreground">{testOrderId}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tests Paiements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Test Paiements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>ID Vente</Label>
            <Input
              placeholder="Ex: sale-123"
              value={testSaleId}
              onChange={(e) => setTestSaleId(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={testPayment}>
              Paiement Cash (57000 BIF)
            </Button>
            <Button onClick={testDiscount} variant="outline">
              Réduction (-5000 BIF)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tests Stocks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Test Mouvements de Stock
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>ID Produit</Label>
            <Input
              type="number"
              placeholder="Ex: 10"
              value={testProductId}
              onChange={(e) => setTestProductId(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={testStockSale}>
              Sortie Stock (-5)
            </Button>
            <Button onClick={testOutOfStock} variant="destructive">
              Marquer Rupture
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">📋 Instructions de Test</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p><strong>1. Test Offline :</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Coupez internet (Mode avion ou désactiver WiFi)</li>
            <li>Vérifiez le badge "Hors ligne"</li>
            <li>Créez une commande → Doit fonctionner</li>
            <li>Enregistrez un paiement → Doit fonctionner</li>
            <li>Vérifiez les statistiques → Données en cache</li>
          </ul>
          
          <p className="mt-4"><strong>2. Test Synchronisation :</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Rétablissez internet</li>
            <li>Vérifiez le badge "En ligne"</li>
            <li>Cliquez "Synchroniser" ou attendez 30s</li>
            <li>Vérifiez le toast "X éléments synchronisés"</li>
            <li>Vérifiez que le compteur "en attente" = 0</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
