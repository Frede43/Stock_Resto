// Composant avancé pour afficher le statut de synchronisation
import { useEffect, useState } from 'react';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { offlineStorage } from '@/services/offline-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  Database,
  Activity
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AdvancedSyncStatus() {
  const { 
    isOnline, 
    isSyncing, 
    pendingCount, 
    syncProgress,
    conflictsCount,
    lastSyncTime,
    syncPendingData,
    getSyncStatus,
    resolveConflict
  } = useOfflineSync();

  const [detailedStatus, setDetailedStatus] = useState<any>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  // Charger le statut détaillé
  useEffect(() => {
    const loadStatus = async () => {
      const status = await getSyncStatus();
      setDetailedStatus(status);
      
      const conflictsList = await offlineStorage.getConflicts();
      setConflicts(conflictsList);
    };

    loadStatus();
    const interval = setInterval(loadStatus, 5000);

    return () => clearInterval(interval);
  }, [getSyncStatus]);

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Jamais';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    
    return date.toLocaleDateString('fr-FR');
  };

  const handleResolveConflict = async (conflictId: string, resolution: 'local' | 'server') => {
    await resolveConflict(conflictId, resolution);
    const updatedConflicts = await offlineStorage.getConflicts();
    setConflicts(updatedConflicts);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {/* Badge de statut principal */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <CardTitle className="text-sm">
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </CardTitle>
            </div>
            
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Activity className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Statut de synchronisation détaillé</DialogTitle>
                  <DialogDescription>
                    Informations complètes sur la synchronisation offline
                  </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="h-[60vh] pr-4">
                  {detailedStatus && (
                    <div className="space-y-4">
                      {/* Statistiques générales */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Statistiques</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Total synchronisé:</span>
                            <Badge variant="success">{detailedStatus.stats.totalSynced}</Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total échoué:</span>
                            <Badge variant="destructive">{detailedStatus.stats.totalFailed}</Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Durée dernière sync:</span>
                            <span>{(detailedStatus.stats.lastSyncDuration / 1000).toFixed(1)}s</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Temps moyen:</span>
                            <span>{(detailedStatus.stats.averageSyncTime / 1000).toFixed(1)}s</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* File d'attente par priorité */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">File d'attente par priorité</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-red-500" />
                              Haute priorité:
                            </span>
                            <Badge variant="destructive">{detailedStatus.queue.byPriority.high}</Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-yellow-500" />
                              Moyenne priorité:
                            </span>
                            <Badge variant="warning">{detailedStatus.queue.byPriority.medium}</Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-blue-500" />
                              Basse priorité:
                            </span>
                            <Badge variant="secondary">{detailedStatus.queue.byPriority.low}</Badge>
                          </div>
                        </CardContent>
                      </Card>

                      {/* File d'attente par statut */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">File d'attente par statut</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              En attente:
                            </span>
                            <Badge variant="secondary">{detailedStatus.queue.byStatus.pending}</Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                              En cours:
                            </span>
                            <Badge variant="default">{detailedStatus.queue.byStatus.syncing}</Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              Échoué:
                            </span>
                            <Badge variant="destructive">{detailedStatus.queue.byStatus.failed}</Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              Réussi:
                            </span>
                            <Badge variant="success">{detailedStatus.queue.byStatus.success}</Badge>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Conflits */}
                      {conflicts.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              Conflits ({conflicts.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {conflicts.map((conflict) => (
                              <div key={conflict.id} className="border rounded p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <Badge variant={conflict.autoResolvable ? 'secondary' : 'destructive'}>
                                    {conflict.type}
                                  </Badge>
                                  {conflict.autoResolvable && (
                                    <Badge variant="success">Auto-résolvable</Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(conflict.timestamp).toLocaleString('fr-FR')}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleResolveConflict(conflict.id, 'local')}
                                  >
                                    Garder local
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleResolveConflict(conflict.id, 'server')}
                                  >
                                    Garder serveur
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          
          <CardDescription className="text-xs">
            Dernière sync: {formatLastSync(lastSyncTime)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Progression de synchronisation */}
          {isSyncing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Synchronisation en cours...</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
              <div className="text-xs text-muted-foreground text-right">
                {syncProgress}%
              </div>
            </div>
          )}

          {/* Compteurs */}
          <div className="grid grid-cols-2 gap-2">
            {/* Éléments en attente */}
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>{pendingCount} en attente</span>
              </div>
            )}

            {/* Conflits */}
            {conflictsCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>{conflictsCount} conflit(s)</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            {isOnline && pendingCount > 0 && !isSyncing && (
              <Button 
                size="sm" 
                variant="default" 
                onClick={syncPendingData}
                className="flex-1"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Synchroniser
              </Button>
            )}
            
            {pendingCount === 0 && conflictsCount === 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Tout est synchronisé</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

