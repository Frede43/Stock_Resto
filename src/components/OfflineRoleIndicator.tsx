// Indicateur visuel amélioré avec informations spécifiques par rôle
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { Wifi, WifiOff, RefreshCw, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface OfflineRoleIndicatorProps {
  role?: 'server' | 'cashier' | 'manager' | 'admin';
  compact?: boolean;
}

export function OfflineRoleIndicator({ role = 'server', compact = false }: OfflineRoleIndicatorProps) {
  const { isOnline, isSyncing, pendingCount, syncPendingData } = useOfflineSync();
  const [showDetails, setShowDetails] = useState(false);

  // Messages spécifiques par rôle
  const roleMessages = {
    server: {
      online: "Toutes les commandes sont envoyées en temps réel",
      offline: "Les commandes sont sauvegardées localement et seront envoyées automatiquement",
      capabilities: [
        "✅ Prendre des commandes",
        "✅ Consulter le menu",
        "✅ Voir les tables",
        "✅ Ajouter des notes",
      ]
    },
    cashier: {
      online: "Tous les paiements sont traités normalement",
      offline: "Paiements espèces/chèque disponibles. Carte nécessite connexion.",
      capabilities: [
        "✅ Encaisser (espèces/chèque)",
        "✅ Ventes rapides",
        "✅ Historique du jour",
        "❌ Paiements par carte",
      ]
    },
    manager: {
      online: "Accès complet à toutes les données en temps réel",
      offline: "Consultation des données en cache. Modifications limitées.",
      capabilities: [
        "✅ Rapports en cache",
        "✅ Ajustements d'inventaire",
        "✅ Liste du personnel",
        "❌ Statistiques temps réel",
      ]
    },
    admin: {
      online: "Accès administrateur complet",
      offline: "Fonctionnalités d'administration limitées",
      capabilities: [
        "✅ Consultation des données",
        "❌ Gestion des permissions",
        "❌ Configuration système",
        "❌ Exports de rapports",
      ]
    }
  };

  const currentRole = roleMessages[role];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant={isOnline ? "default" : "destructive"}
          className="cursor-pointer"
          onClick={() => setShowDetails(!showDetails)}
        >
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3 mr-1" />
              En ligne
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 mr-1" />
              Hors ligne
            </>
          )}
        </Badge>
        
        {pendingCount > 0 && (
          <Badge variant="secondary" className="animate-pulse">
            <Clock className="h-3 w-3 mr-1" />
            {pendingCount} en attente
          </Badge>
        )}

        {isSyncing && (
          <Badge variant="outline" className="animate-pulse">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Sync...
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Indicateur principal */}
      <Card className={isOnline ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="h-5 w-5 text-green-600" />
                  <span className="text-green-900">Connexion active</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-orange-600" />
                  <span className="text-orange-900">Mode hors ligne</span>
                </>
              )}
            </div>
            
            {!isOnline && pendingCount > 0 && (
              <Badge variant="secondary" className="animate-pulse">
                <Clock className="h-4 w-4 mr-1" />
                {pendingCount} en attente
              </Badge>
            )}
          </CardTitle>
          <CardDescription className={isOnline ? "text-green-700" : "text-orange-700"}>
            {isOnline ? currentRole.online : currentRole.offline}
          </CardDescription>
        </CardHeader>
        
        {!isOnline && (
          <CardContent className="space-y-4">
            {/* Capacités disponibles */}
            <div>
              <h4 className="font-semibold text-sm mb-2 text-orange-900">
                Fonctionnalités disponibles :
              </h4>
              <div className="space-y-1">
                {currentRole.capabilities.map((capability, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {capability.startsWith('✅') ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={capability.startsWith('✅') ? "text-green-700" : "text-red-700"}>
                      {capability.substring(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton de synchronisation manuelle */}
            {pendingCount > 0 && (
              <Button
                onClick={() => syncPendingData()}
                disabled={isSyncing}
                variant="outline"
                className="w-full"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Synchronisation en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Synchroniser maintenant ({pendingCount})
                  </>
                )}
              </Button>
            )}

            {/* Message d'information */}
            <div className="text-xs text-orange-600 bg-orange-100 p-3 rounded">
              💡 <strong>Astuce :</strong> Toutes vos actions sont sauvegardées localement et seront 
              automatiquement synchronisées dès le retour de la connexion internet.
            </div>
          </CardContent>
        )}
      </Card>

      {/* Statut de synchronisation */}
      {isSyncing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-semibold text-blue-900">Synchronisation en cours...</p>
                <p className="text-sm text-blue-700">
                  Envoi des données vers le serveur
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
