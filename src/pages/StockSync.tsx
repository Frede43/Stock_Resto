import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  FileText,
  Package
} from "lucide-react";
import { useProducts, useStockMovements } from "@/hooks/use-api";
import { Product } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

interface SyncConflict {
  id: string;
  productName: string;
  productStock: number;
  inventoryStock: number;
  lastSale: string;
  lastInventoryUpdate: string;
  severity: "low" | "medium" | "high";
  autoResolvable: boolean;
}

const mockConflicts: SyncConflict[] = [
  {
    id: "1",
    productName: "Bière Mutzig",
    productStock: 8,
    inventoryStock: 5,
    lastSale: "2024-08-14 14:30",
    lastInventoryUpdate: "2024-08-14 09:00",
    severity: "high",
    autoResolvable: false
  },
  {
    id: "2",
    productName: "Primus",
    productStock: 47,
    inventoryStock: 45,
    lastSale: "2024-08-14 15:15",
    lastInventoryUpdate: "2024-08-14 09:00",
    severity: "low",
    autoResolvable: true
  },
  {
    id: "3",
    productName: "Coca-Cola",
    productStock: 65,
    inventoryStock: 67,
    lastSale: "2024-08-14 13:45",
    lastInventoryUpdate: "2024-08-14 10:30",
    severity: "medium",
    autoResolvable: true
  }
];

export default function StockSync() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastSyncDate, setLastSyncDate] = useState(new Date().toISOString());
  const { toast } = useToast();

  // Récupérer les données des produits pour la synchronisation
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useProducts();

  // Récupérer les mouvements de stock récents
  const {
    data: movementsData,
    isLoading: movementsLoading
  } = useStockMovements();

  // État pour gérer les conflits
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  
  // Mettre à jour les conflits lorsque les données des produits changent
  useEffect(() => {
    if (productsData) {
      const newConflicts = (productsData as any)?.results?.filter((product: any) =>
        product.current_stock !== product.expected_stock
      ).map((product: any) => ({
        id: product.id.toString(),
        productName: product.name,
        productStock: product.current_stock,
        inventoryStock: product.expected_stock || product.current_stock,
        difference: Math.abs(product.current_stock - (product.expected_stock || product.current_stock)),
        lastInventoryUpdate: product.updated_at,
        severity: Math.abs(product.current_stock - (product.expected_stock || product.current_stock)) > 10 ? "high" : "medium",
        autoResolvable: Math.abs(product.current_stock - (product.expected_stock || product.current_stock)) <= 5
      })) || [];
      
      setConflicts(newConflicts);
    }
  }, [productsData]);

  const startSync = async () => {
    setIsScanning(true);
    setScanProgress(0);

    // Simulate scanning process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setScanProgress(i);
    }

    setIsScanning(false);
    setLastSyncDate(new Date().toLocaleString());
  };

  const resolveConflict = (conflictId: string, useProductStock: boolean) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
    // TODO: Implement conflict resolution logic
    console.log(`Conflict ${conflictId} resolved using ${useProductStock ? 'product' : 'inventory'} stock`);
  };

  const autoResolveAll = () => {
    const autoResolvableConflicts = conflicts.filter(c => c.autoResolvable);
    setConflicts(prev => prev.filter(c => !c.autoResolvable));
    // TODO: Implement auto-resolution logic
    console.log(`Auto-resolved ${autoResolvableConflicts.length} conflicts`);
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case "low": return "secondary" as const;
      case "medium": return "warning" as const;
      case "high": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "low": return "Faible";
      case "medium": return "Moyen";
      case "high": return "Élevé";
      default: return "Inconnu";
    }
  };

  return (
    <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Synchronisation des stocks
              </h1>
              <p className="text-muted-foreground">
                Résolvez les conflits entre les données produits et inventaire
              </p>
            </div>
            <Button onClick={startSync} disabled={isScanning} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Analyse...' : 'Analyser'}
            </Button>
          </div>

          {/* Sync Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dernière sync</p>
                    <p className="text-sm font-medium">{lastSyncDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-warning to-warning/80 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-warning-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conflits détectés</p>
                    <p className="text-2xl font-bold text-warning">{conflicts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-success to-success/80 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-success-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Auto-résolvables</p>
                    <p className="text-2xl font-bold text-success">
                      {conflicts.filter(c => c.autoResolvable).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scanning Progress */}
          {isScanning && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span className="font-medium">Analyse en cours...</span>
                  </div>
                  <Progress value={scanProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    Comparaison des données produits et inventaire ({scanProgress}%)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Auto-resolve option */}
          {conflicts.filter(c => c.autoResolvable).length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {conflicts.filter(c => c.autoResolvable).length} conflit(s) peuvent être résolus automatiquement
                </span>
                <Button onClick={autoResolveAll} size="sm" variant="outline">
                  Résoudre automatiquement
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Conflicts List */}
          {conflicts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Conflits détectés</CardTitle>
                <CardDescription>
                  Résolvez les incohérences entre les données
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conflicts.map((conflict) => (
                    <div key={conflict.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{conflict.productName}</h3>
                          <Badge variant={getSeverityVariant(conflict.severity)}>
                            Sévérité: {getSeverityLabel(conflict.severity)}
                          </Badge>
                        </div>
                        {conflict.autoResolvable && (
                          <Badge variant="success">Auto-résolvable</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              Données Produits
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold text-primary">{conflict.productStock}</p>
                            <p className="text-xs text-muted-foreground">
                              Dernière vente: {conflict.lastSale}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Données Inventaire
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold text-secondary">{conflict.inventoryStock}</p>
                            <p className="text-xs text-muted-foreground">
                              Dernière MAJ: {conflict.lastInventoryUpdate}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => resolveConflict(conflict.id, true)}
                          variant="outline"
                          className="flex-1"
                        >
                          Utiliser stock Produits ({conflict.productStock})
                        </Button>
                        <Button 
                          onClick={() => resolveConflict(conflict.id, false)}
                          variant="outline"
                          className="flex-1"
                        >
                          Utiliser stock Inventaire ({conflict.inventoryStock})
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun conflit détecté</h3>
                  <p className="text-muted-foreground">
                    Toutes les données sont synchronisées
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
  );
}
