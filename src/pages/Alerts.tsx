import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Archive, Search, Plus } from 'lucide-react';
import { useAlertsNew, useResolveAlertNew, useArchiveAlertNew, useCreateAlert } from '@/hooks/use-api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'stock': return 'bg-purple-100 text-purple-800';
    case 'sales': return 'bg-green-100 text-green-800';
    case 'system': return 'bg-blue-100 text-blue-800';
    case 'security': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function Alerts() {
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Hooks pour les données
  const { data: alertsData, isLoading } = useAlertsNew({
    status: activeTab === 'all' ? undefined : activeTab,
    type: filterType === 'all' ? undefined : filterType || undefined,
    priority: filterPriority === 'all' ? undefined : filterPriority || undefined,
    search: searchTerm || undefined,
  });

  const resolveAlert = useResolveAlertNew();
  const archiveAlert = useArchiveAlertNew();

  const alerts = Array.isArray(alertsData) ? alertsData : (alertsData as any)?.results || [];

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert.mutateAsync(alertId);
    } catch (error) {
      console.error('Erreur résolution alerte:', error);
    }
  };

  const handleArchiveAlert = async (alertId: string) => {
    try {
      await archiveAlert.mutateAsync(alertId);
    } catch (error) {
      console.error('Erreur archivage alerte:', error);
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

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Chargement des alertes...</p>
                </div>
              </div>
            </div>
          </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Alertes Système</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Gestion des alertes et notifications en temps réel
                </p>
              </div>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nouvelle alerte</span>
                <span className="sm:hidden">Nouveau</span>
              </Button>
            </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les alertes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type d'alerte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="sales">Ventes</SelectItem>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="security">Sécurité</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Actives</TabsTrigger>
          <TabsTrigger value="resolved">Résolues</TabsTrigger>
          <TabsTrigger value="archived">Archivées</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune alerte</h3>
                <p className="text-muted-foreground text-center">
                  {activeTab === 'active' 
                    ? 'Aucune alerte active pour le moment'
                    : `Aucune alerte ${activeTab} trouvée`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert: any) => (
                <Card key={alert.id} className="border-l-4" style={{
                  borderLeftColor: alert.priority === 'critical' ? '#ef4444' : 
                                  alert.priority === 'high' ? '#f97316' :
                                  alert.priority === 'medium' ? '#eab308' : '#3b82f6'
                }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge className={getPriorityColor(alert.priority)}>
                            {alert.priority}
                          </Badge>
                          <Badge className={getTypeColor(alert.type)}>
                            {alert.type}
                          </Badge>
                        </div>
                        <CardDescription>{alert.message}</CardDescription>
                        {(alert.related_product || alert.related_sale) && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Lié à:</span>
                            <Badge variant="outline">
                              {alert.related_product?.name || `Vente #${alert.related_sale?.id}`}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      {alert.status === 'active' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveAlert(alert.id)}
                            disabled={resolveAlert.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Résoudre
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleArchiveAlert(alert.id)}
                            disabled={archiveAlert.isPending}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archiver
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Créée {formatTimeAgo(alert.created_at)}</span>
                      {alert.resolved_at && (
                        <span>Résolue {formatTimeAgo(alert.resolved_at)}</span>
                      )}
                      {alert.created_by && (
                        <span>Par {alert.created_by.username}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
          </div>
        </main>
  );
}