// Indicateur de statut offline/online
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function OfflineIndicator() {
  const { isOnline, isSyncing, pendingCount, syncPendingData } = useOfflineSync();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Badge de statut */}
      <Badge 
        variant={isOnline ? 'default' : 'destructive'}
        className="flex items-center gap-2 px-3 py-2 shadow-lg"
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
          {isOnline && (
            <CardContent className="pt-0">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={syncPendingData}
                className="w-full"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Synchroniser maintenant
              </Button>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
