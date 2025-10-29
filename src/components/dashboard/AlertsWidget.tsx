import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, Clock, CheckCircle } from "lucide-react";

interface Alert {
  id: string;
  type: "stock" | "order" | "system";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  timestamp: string;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "stock",
    priority: "high",
    title: "Stock critique",
    description: "Bière Mutzig: 5 unités restantes",
    timestamp: "Il y a 5 min"
  },
  {
    id: "2",
    type: "order",
    priority: "medium",
    title: "Commande en attente",
    description: "Table 8: En attente depuis 15 min",
    timestamp: "Il y a 15 min"
  },
  {
    id: "3",
    type: "system",
    priority: "low",
    title: "Synchronisation",
    description: "Dernière synchro: 2h ago",
    timestamp: "Il y a 2h"
  }
];

export function AlertsWidget() {
  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "stock": return Package;
      case "order": return Clock;
      case "system": return CheckCircle;
      default: return AlertTriangle;
    }
  };

  const getPriorityVariant = (priority: Alert["priority"]) => {
    switch (priority) {
      case "high": return "destructive" as const;
      case "medium": return "warning" as const;
      case "low": return "secondary" as const;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Alertes récentes
        </CardTitle>
        <Badge variant="destructive" className="text-xs">
          {mockAlerts.filter(a => a.priority === "high").length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockAlerts.map((alert) => {
          const Icon = getAlertIcon(alert.type);
          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {alert.title}
                  </h4>
                  <Badge variant={getPriorityVariant(alert.priority)} className="text-xs">
                    {alert.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {alert.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {alert.timestamp}
                </p>
              </div>
            </div>
          );
        })}
        
        <Button variant="outline" className="w-full mt-4">
          Voir toutes les alertes
        </Button>
      </CardContent>
    </Card>
  );
}