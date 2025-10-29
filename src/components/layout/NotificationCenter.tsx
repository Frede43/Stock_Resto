import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  Package,
  Clock,
  Settings,
  AlertTriangle,
  Shield,
  DollarSign,
  Check,
  X,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'stock': return Package;
      case 'order': return Clock;
      case 'system': return Settings;
      case 'security': return Shield;
      case 'maintenance': return Settings;
      case 'sales': return DollarSign;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityBadgeVariant = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical': return 'destructive' as const;
      case 'high': return 'destructive' as const;
      case 'medium': return 'warning' as const;
      case 'low': return 'secondary' as const;
      default: return 'secondary' as const;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `Il y a ${days}j`;
    if (hours > 0) return `Il y a ${hours}h`;
    if (minutes > 0) return `Il y a ${minutes}min`;
    return 'À l\'instant';
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <DropdownMenuLabel className="p-0 font-semibold">
              Notifications
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} non lues
              </Badge>
            )}
          </div>
          
          {notifications.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Marquer toutes comme lues
                </DropdownMenuItem>
                <DropdownMenuItem onClick={clearAll} className="text-destructive">
                  <X className="h-4 w-4 mr-2" />
                  Effacer toutes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {recentNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                Aucune notification
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Les notifications apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="py-2">
              {recentNotifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                const isLast = index === recentNotifications.length - 1;
                
                return (
                  <div key={notification.id}>
                    <div
                      className={cn(
                        "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                        !notification.read && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        notification.priority === 'critical' ? "bg-destructive" :
                        notification.priority === 'high' ? "bg-orange-500" :
                        notification.priority === 'medium' ? "bg-yellow-500" :
                        "bg-primary"
                      )}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={cn(
                            "text-sm font-medium truncate",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </h4>
                          <Badge 
                            variant={getPriorityBadgeVariant(notification.priority)}
                            className="text-xs flex-shrink-0"
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.timestamp)}
                          </p>
                          
                          <div className="flex items-center gap-1">
                            {notification.actionUrl && (
                              <Link 
                                to={notification.actionUrl}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 px-2 text-xs"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Voir
                                </Button>
                              </Link>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {!isLast && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 10 && (
          <>
            <Separator />
            <div className="p-2">
              <Link to="/alerts" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-center text-sm">
                  Voir toutes les notifications ({notifications.length})
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
