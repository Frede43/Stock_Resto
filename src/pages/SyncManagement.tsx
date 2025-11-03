// Page de gestion avancée de la synchronisation
import { useEffect, useState } from 'react';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { offlineStorage } from '@/services/offline-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Database,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SyncManagement() {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    syncProgress,
    conflictsCount,
    lastSyncTime,
    syncPendingData,
    getSyncStatus,
    resolveConflict,
  } = useOfflineSync();

  const { toast } = useToast();
  const [detailedStatus, setDetailedStatus] = useState<any>(null);
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [dbStats, setDbStats] = useState<any>(null);

  // Charger les données
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const status = await getSyncStatus();
    setDetailedStatus(status);

    const queue = await offlineStorage.getSyncQueue();
    setSyncQueue(queue);

    const conflictsList = await offlineStorage.getConflicts();
    setConflicts(conflictsList);

    const stats = await offlineStorage.getStats();
    setDbStats(stats);
  };

  const handleClearSyncedData = async () => {
    await offlineStorage.clearSyncedData();
    toast({
      title: '🧹 Nettoyage effectué',
      description: 'Les données synchronisées ont été supprimées',
      duration: 3000,
    });
    loadData();
  };

  const handleClearAll = async () => {
    if (confirm('⚠️ Êtes-vous sûr de vouloir tout effacer ? Cette action est irréversible.')) {
      await offlineStorage.clearAll();
      toast({
        title: '🗑️ Tout effacé',
        description: 'Toutes les données offline ont été supprimées',
        variant: 'destructive',
        duration: 3000,
      });
      loadData();
    }
  };

  const handleResolveConflict = async (conflictId: string, resolution: 'local' | 'server') => {
    await resolveConflict(conflictId, resolution);
    loadData();
  };

  const getPriorityBadge = (priority: number) => {
    if (priority === 1) return <Badge variant="destructive">Haute</Badge>;
    if (priority === 2) return <Badge variant="warning">Moyenne</Badge>;
    return <Badge variant="secondary">Basse</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success') return <Badge variant="success">Réussi</Badge>;
    if (status === 'pending') return <Badge variant="secondary">En attente</Badge>;
    if (status === 'syncing') return <Badge variant="default">En cours</Badge>;
    if (status === 'failed') return <Badge variant="destructive">Échoué</Badge>;
    return <Badge>{status}</Badge>;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion de la Synchronisation</h1>
          <p className="text-muted-foreground">
            Gérez la synchronisation offline et résolvez les conflits
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

      {/* Statistiques principales */}
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
            <p className="text-xs text-muted-foreground">Éléments à synchroniser</p>
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
            <p className="text-xs text-muted-foreground">À résoudre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Synchronisés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {detailedStatus?.stats.totalSynced || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total réussi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              Base locale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dbStats ? Object.values(dbStats).reduce((a: any, b: any) => {
                if (typeof b === 'object') return a + b.total;
                return a + b;
              }, 0) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Enregistrements</p>
          </CardContent>
        </Card>
      </div>

      {/* Progression de synchronisation */}
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

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            onClick={syncPendingData}
            disabled={!isOnline || isSyncing || pendingCount === 0}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Synchroniser maintenant
          </Button>
          
          <Button
            variant="outline"
            onClick={handleClearSyncedData}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Nettoyer données synchronisées
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleClearAll}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Tout effacer
          </Button>
        </CardContent>
      </Card>

      {/* File d'attente */}
      <Card>
        <CardHeader>
          <CardTitle>File d'attente de synchronisation</CardTitle>
          <CardDescription>
            {syncQueue.length} élément(s) dans la file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Tentatives</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncQueue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline">{item.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.endpoint}
                    </TableCell>
                    <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      {item.retries}/{item.maxRetries}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatTimestamp(item.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
                {syncQueue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Aucun élément dans la file
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Conflits */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Conflits à résoudre
            </CardTitle>
            <CardDescription>
              {conflicts.length} conflit(s) détecté(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {conflicts.map((conflict) => (
              <Card key={conflict.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      Conflit {conflict.type}
                    </CardTitle>
                    {conflict.autoResolvable && (
                      <Badge variant="success">Auto-résolvable</Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {formatTimestamp(conflict.timestamp)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Données locales</h4>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(conflict.localData, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Données serveur</h4>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(conflict.serverData, null, 2)}
                      </pre>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveConflict(conflict.id, 'local')}
                    >
                      Garder données locales
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveConflict(conflict.id, 'server')}
                    >
                      Garder données serveur
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

