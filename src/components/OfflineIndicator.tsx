// Indicateur de statut offline/online (version simple)
// Pour la version avancée, utilisez AdvancedSyncStatus
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

export function OfflineIndicator() {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    syncProgress,
    conflictsCount,
    syncPendingData
  } = useOfflineSync();

  return (
    <div className="fixed bottom-4 right-2 sm:right-4 z-50 max-w-[calc(100vw-1rem)]">
      {/* Badge de statut */}
      <Badge
        variant={isOnline ? 'default' : 'destructive'}
        className="flex items-center gap-2 px-2 sm:px-3 py-2 shadow-lg text-xs sm:text-sm"
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>En ligne</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Hors ligne</span>
          </>
        )}
      </Badge>

      {/* Indicateur de synchronisation */}
      {isSyncing && (
        <Card className="mt-2 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Synchronisation...
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress value={syncProgress} className="h-2" />
            <div className="text-xs text-muted-foreground text-right mt-1">
              {syncProgress}%
            </div>
          </CardContent>
        </Card>
      )}

      {/* Éléments en attente */}
      {pendingCount > 0 && !isSyncing && (
        <Card className="mt-2 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {pendingCount} en attente
            </CardTitle>
            <CardDescription className="text-xs">
              {isOnline
                ? 'Synchronisation en cours...'
                : 'Sera synchronisé quand internet reviendra'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={syncPendingData}
                className="w-full"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Synchroniser maintenant
              </Button>
            )}
            <Link to="/sync-management">
              <Button
                size="sm"
                variant="ghost"
                className="w-full"
              >
                Gérer la synchronisation
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Conflits */}
      {conflictsCount > 0 && (
        <Card className="mt-2 shadow-lg border-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              {conflictsCount} conflit(s)
            </CardTitle>
            <CardDescription className="text-xs">
              Action requise
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link to="/sync-management">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
              >
                Résoudre les conflits
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
