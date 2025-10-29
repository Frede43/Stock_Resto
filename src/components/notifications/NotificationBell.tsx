import React from 'react';
import { Bell, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useActiveAlertsCount, useAlertsNew, useResolveAlertNew } from '@/hooks/use-api';
import { useRealAlerts } from '@/hooks/use-real-alerts';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Alert {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
  related_product?: any;
  related_sale?: any;
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'critical':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'high':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'medium':
      return <Info className="h-4 w-4 text-yellow-500" />;
    case 'low':
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 border-red-200 text-red-800';
    case 'high':
      return 'bg-orange-100 border-orange-200 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    case 'low':
      return 'bg-blue-100 border-blue-200 text-blue-800';
    default:
      return 'bg-gray-100 border-gray-200 text-gray-800';
  }
};

export function NotificationBell() {
  // Utiliser les vraies alertes de la base de données
  const { alerts, count: totalActive, criticalCount: criticalActive, isLoading: alertsLoading } = useRealAlerts();
  const resolveAlert = useResolveAlertNew();

  const handleResolveAlert = async (alertId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      await resolveAlert.mutateAsync(alertId);
    } catch (error) {
      console.error('Erreur lors de la résolution de l\'alerte:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr
      });
    } catch {
      return 'Il y a quelques instants';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {totalActive > 0 && (
            <Badge 
              variant={criticalActive > 0 ? "destructive" : "secondary"}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {totalActive > 99 ? '99+' : totalActive}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {totalActive > 0 && (
            <Badge variant="outline" className="ml-2">
              {totalActive} active{totalActive > 1 ? 's' : ''}
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {alertsLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Chargement des notifications...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            Aucune notification active
          </div>
        ) : (
          <ScrollArea className="h-96">
            {alerts.map((alert: Alert) => (
              <DropdownMenuItem
                key={alert.id}
                className={`p-3 cursor-pointer border-l-4 ${getPriorityColor(alert.priority)} mb-1`}
                onClick={() => {
                  // Optionnel: naviguer vers la page d'alertes
                  window.location.href = '/alerts';
                }}
              >
                <div className="flex items-start space-x-3 w-full">
                  <div className="flex-shrink-0 mt-0.5">
                    {getPriorityIcon(alert.priority)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {alert.title}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-green-100"
                        onClick={(e) => handleResolveAlert(alert.id, e)}
                        disabled={resolveAlert.isPending}
                      >
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="capitalize">
                        {alert.type}
                      </span>
                      <span>
                        {formatTimeAgo(alert.created_at)}
                      </span>
                    </div>

                    {(alert.related_product || alert.related_sale) && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          {alert.related_product?.name || `Vente #${alert.related_sale?.id}`}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
        
        {alerts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
              onClick={() => window.location.href = '/alerts'}
            >
              Voir toutes les alertes
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;
