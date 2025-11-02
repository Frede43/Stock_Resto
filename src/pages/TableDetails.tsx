import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Users, 
  MapPin, 
  Clock, 
  Calendar,
  DollarSign,
  History,
  Settings,
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Configuration API dynamique
const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://127.0.0.1:8000/api';

interface TableDetail {
  id: number;
  number: string;
  capacity: number;
  status: string;
  location: string;
  notes: string;
  is_active: boolean;
  occupied_since: string | null;
  last_cleaned: string | null;
  current_sale: any;
  created_at: string;
  updated_at: string;
}

interface Sale {
  id: number;
  reference: string;
  total_amount: number;
  status: string;
  created_at: string;
  payment_method: string;
  items: any[];
  customer_name?: string;
  server?: string;
  items_count?: number;
}

interface DailyReport {
  date: string;
  sales_count: number;
  paid_count: number;
  total_revenue: number;
  sales: Sale[];
  is_today: boolean;
}

export default function TableDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [table, setTable] = useState<TableDetail | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set([new Date().toISOString().split('T')[0]]));
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(false);

  // Charger les détails de la table
  useEffect(() => {
    if (id) {
      fetchTableDetails();
      fetchTableSalesByDay();
    }
  }, [id]);
  
  // Actualiser automatiquement à minuit
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timer = setTimeout(() => {
      // Actualiser les données à minuit
      if (id) {
        fetchTableSalesByDay();
      }
      
      // Afficher notification
      toast({
        title: "📊 Nouveau jour",
        description: "Les rapports ont été mis à jour pour aujourd'hui",
        duration: 5000,
      });
    }, timeUntilMidnight);
    
    return () => clearTimeout(timer);
  }, [id]);

  const fetchTableDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/sales/tables/${id}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTable(data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails de la table",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTableSalesByDay = async () => {
    setSalesLoading(true);
    try {
      const response = await fetch(`${API_URL}/sales/tables/${id}/sales-by-day/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDailyReports(data.daily_reports || []);
        
        // Extraire toutes les ventes pour compatibilité
        const allSales = data.daily_reports.flatMap((report: DailyReport) => report.sales);
        setSales(allSales);
      }
    } catch (error) {
      console.error('Erreur chargement ventes:', error);
    } finally {
      setSalesLoading(false);
    }
  };
  
  const toggleDayExpansion = (date: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const changeTableStatus = async (newStatus: string) => {
    if (!table) return;

    try {
      const response = await fetch(`${API_URL}/sales/tables/${table.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedTable = await response.json();
        setTable(updatedTable);
        toast({
          title: "Succès",
          description: `Statut de la table changé en ${newStatus}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de changer le statut",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'occupied':
        return <Badge variant="destructive">Occupée</Badge>;
      case 'reserved':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Réservée</Badge>;
      case 'cleaning':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Nettoyage</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} BIF`;
  };

  if (loading) {
    return (
      <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Chargement des détails...</p>
            </div>
          </main>
    );
  }

  if (!table) {
    return (
      <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Table non trouvée</h2>
              <p className="text-muted-foreground mb-4">La table demandée n'existe pas ou a été supprimée.</p>
              <Button onClick={() => navigate('/tables')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux tables
              </Button>
            </div>
          </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header avec navigation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/tables')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Table {table.number}
                </h1>
                <p className="text-muted-foreground">
                  Détails et historique de la table
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {getStatusBadge(table.status)}
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>

          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Capacité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{table.capacity} personnes</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Emplacement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg">{table.location || 'Non spécifié'}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Statut
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getStatusBadge(table.status)}
                  {table.occupied_since && (
                    <p className="text-sm text-muted-foreground">
                      Occupée depuis: {formatDate(table.occupied_since)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>
                Changer le statut de la table
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant={table.status === 'available' ? 'default' : 'outline'}
                  onClick={() => changeTableStatus('available')}
                  disabled={table.status === 'available'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Disponible
                </Button>
                <Button 
                  variant={table.status === 'occupied' ? 'default' : 'outline'}
                  onClick={() => changeTableStatus('occupied')}
                  disabled={table.status === 'occupied'}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Occupée
                </Button>
                <Button 
                  variant={table.status === 'reserved' ? 'default' : 'outline'}
                  onClick={() => changeTableStatus('reserved')}
                  disabled={table.status === 'reserved'}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Réservée
                </Button>
                <Button 
                  variant={table.status === 'cleaning' ? 'default' : 'outline'}
                  onClick={() => changeTableStatus('cleaning')}
                  disabled={table.status === 'cleaning'}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Nettoyage
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Historique des ventes groupé par jour */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des ventes par jour
              </CardTitle>
              <CardDescription>
                {sales.length} vente(s) enregistrée(s) pour cette table
              </CardDescription>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p>Chargement des ventes...</p>
                </div>
              ) : dailyReports.length > 0 ? (
                <div className="space-y-4">
                  {dailyReports.map((report) => (
                    <div key={report.date} className="border rounded-lg overflow-hidden">
                      {/* En-tête du jour */}
                      <div 
                        className={`p-4 cursor-pointer transition-colors ${
                          report.is_today 
                            ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => toggleDayExpansion(report.date)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {expandedDays.has(report.date) ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="font-semibold">
                                  {new Date(report.date).toLocaleDateString('fr-FR', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </span>
                                {report.is_today && (
                                  <Badge variant="default" className="bg-blue-500">Aujourd'hui</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {report.sales_count} vente(s) • {report.paid_count} payée(s)
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-lg font-bold text-green-600">
                              <TrendingUp className="h-5 w-5" />
                              {formatCurrency(report.total_revenue)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Revenu total
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Liste des ventes du jour */}
                      {expandedDays.has(report.date) && (
                        <div className="p-4 space-y-3 bg-white">
                          {report.sales.map((sale) => (
                            <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">#{sale.reference}</span>
                                  <Badge variant={
                                    sale.status === 'paid' ? 'default' :
                                    sale.status === 'cancelled' ? 'destructive' :
                                    'secondary'
                                  }>
                                    {sale.status === 'paid' ? 'Payée' :
                                     sale.status === 'cancelled' ? 'Annulée' :
                                     sale.status === 'pending' ? 'En attente' :
                                     sale.status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {sale.customer_name && `${sale.customer_name} • `}
                                  {new Date(sale.created_at).toLocaleTimeString('fr-FR')}
                                  {sale.server && ` • Serveur: ${sale.server}`}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {sale.items_count} article(s) • {sale.payment_method}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{formatCurrency(sale.total_amount)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune vente enregistrée pour cette table</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations techniques */}
          <Card>
            <CardHeader>
              <CardTitle>Informations techniques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ID:</span> {table.id}
                </div>
                <div>
                  <span className="font-medium">Active:</span> {table.is_active ? 'Oui' : 'Non'}
                </div>
                <div>
                  <span className="font-medium">Créée le:</span> {formatDate(table.created_at)}
                </div>
                <div>
                  <span className="font-medium">Modifiée le:</span> {formatDate(table.updated_at)}
                </div>
                {table.last_cleaned && (
                  <div>
                    <span className="font-medium">Dernier nettoyage:</span> {formatDate(table.last_cleaned)}
                  </div>
                )}
                {table.notes && (
                  <div className="md:col-span-2">
                    <span className="font-medium">Notes:</span> {table.notes}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
  );
}
