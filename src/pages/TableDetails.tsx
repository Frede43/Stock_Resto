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
  XCircle
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
}

export default function TableDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [table, setTable] = useState<TableDetail | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(false);

  // Charger les détails de la table
  useEffect(() => {
    if (id) {
      fetchTableDetails();
      fetchTableSales();
    }
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

  const fetchTableSales = async () => {
    setSalesLoading(true);
    try {
      const response = await fetch(`${API_URL}/sales/?table=${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSales(data.results || []);
      }
    } catch (error) {
      console.error('Erreur chargement ventes:', error);
    } finally {
      setSalesLoading(false);
    }
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
      <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Chargement des détails...</p>
            </div>
          </main>
    );
  }

  if (!table) {
    return (
      <main className="flex-1 p-6 flex items-center justify-center">
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
    <main className="flex-1 p-6 space-y-6">
          {/* Header avec navigation */}
          <div className="flex items-center justify-between">
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

          {/* Historique des ventes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des ventes
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
              ) : sales.length > 0 ? (
                <div className="space-y-4">
                  {sales.slice(0, 5).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Vente #{sale.reference}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(sale.created_at)} • {sale.payment_method}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(sale.total_amount)}</div>
                        <Badge variant={sale.status === 'paid' ? 'default' : 'secondary'}>
                          {sale.status === 'paid' ? 'Payée' : sale.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {sales.length > 5 && (
                    <div className="text-center">
                      <Button variant="outline" size="sm">
                        Voir toutes les ventes ({sales.length})
                      </Button>
                    </div>
                  )}
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
