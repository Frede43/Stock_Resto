import { useState, useEffect, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/stable-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  X,
  Calendar,
  User,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { useSales, useApproveSale, useCancelSale, useMarkSaleAsPaid, useServers } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { Sale as APISale } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SaleItem } from "@/components/sales/SaleItem";
import { Sale, SaleStatus, PaymentMethod, SaleFilters, SaleStats } from "@/types/sales";

// Données mockées supprimées - utilisation uniquement des données API

export default function SalesHistory() {
  const { toast } = useToast();
  const { user, isAdmin, isManager } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [serverFilter, setServerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Récupérer les données depuis l'API
  const {
    data: salesData,
    isLoading: salesLoading,
    error: salesError,
    refetch: refetchSales
  } = useSales({
    date_from: dateFilter || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    server: serverFilter !== "all" ? serverFilter : undefined
  });

  // Récupérer la liste des serveurs dynamiquement
  const {
    data: serversData,
    isLoading: serversLoading
  } = useServers({ is_active: true });

  // const {
  //   data: statsData,
  //   isLoading: statsLoading
  // } = useSalesStats();

  // Mapper les données API vers le format local avec mémorisation
  const mappedSales = useMemo(() => {
    if (!salesData?.results) {
      return [];
    }

    return salesData.results.map((apiSale: any) => {
      // Calculer les totaux des items
      const items = apiSale.items?.map((item: any) => ({
        name: item.product_name || item.name || 'Produit inconnu',
        quantity: item.quantity || 0,
        unitPrice: parseFloat(item.unit_price || item.price) || 0,
        total: parseFloat(item.total_price || item.total) || 0
      })) || [];

      // Utiliser les totaux de l'API directement
      const subtotal = parseFloat(apiSale.total_amount || apiSale.subtotal) || 0;
      const tax = parseFloat(apiSale.tax_amount || apiSale.tax) || 0;
      const total = parseFloat(apiSale.total_amount || apiSale.total) || subtotal + tax;

      // Mapper les statuts API vers les statuts locaux
      const statusMapping: { [key: string]: Sale["status"] } = {
        'paid': 'completed',
        'pending': 'pending',
        'preparing': 'preparing',
        'ready': 'ready',
        'served': 'completed',
        'cancelled': 'cancelled',
        'completed': 'completed'
      };
      const mappedStatus = statusMapping[apiSale.status] || 'pending';

      // Mapper les méthodes de paiement
      const paymentMapping: { [key: string]: Sale["paymentMethod"] } = {
        'cash': 'cash',
        'card': 'card',
        'mobile': 'mobile',
        'mobile_money': 'mobile'
      };
      const paymentMethod = paymentMapping[apiSale.payment_method] || 'cash';

      return {
        id: apiSale.id?.toString() || `SALE-${Date.now()}`,
        date: apiSale.created_at ? new Date(apiSale.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: apiSale.created_at ? new Date(apiSale.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '00:00',
        table: apiSale.table_number ? `Table ${apiSale.table_number}` : apiSale.table_name || 'Table inconnue',
        server: apiSale.server_name || apiSale.user_name || 'Serveur inconnu',
        customer: apiSale.customer_name || apiSale.customer || undefined,
        items,
        subtotal,
        tax,
        total,
        paymentMethod,
        status: mappedStatus
      } as Sale;
    });
  }, [salesData]);

  // Mettre à jour l'état local avec les données mappées
  useEffect(() => {
    setSales(mappedSales);
  }, [mappedSales]);

  // Générer la liste des serveurs dynamiquement
  const servers = useMemo(() => {
    const serverList = [{ id: "all", name: "Tous les serveurs" }];
    if (serversData && Array.isArray(serversData)) {
      const serverOptions = serversData.map((server: any) => ({
        id: server.id.toString(),
        name: `${server.first_name} ${server.last_name}`.trim() || server.username
      }));
      serverList.push(...serverOptions);
    }
    return serverList;
  }, [serversData]);

  const statuses = ["all", "paid", "pending", "preparing", "ready", "served", "cancelled"];

  // Mémorisation du filtrage pour éviter les re-calculs
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch =
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.server.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !dateFilter || sale.date === dateFilter;
      // Pour admin/manager, le filtre serveur est géré côté API
      // Pour caissier/serveur, pas besoin de filtre local (déjà filtré côté API)
      const matchesServer = (isAdmin() || isManager()) ? true : serverFilter === "all" || sale.server === serverFilter;
      const matchesStatus = statusFilter === "all" || sale.status === statusFilter;

      return matchesSearch && matchesDate && matchesServer && matchesStatus;
    });
  }, [sales, searchTerm, dateFilter, serverFilter, statusFilter, isAdmin, isManager]);

  // Hooks pour les mutations API
  const approveSaleMutation = useApproveSale();
  const cancelSaleMutation = useCancelSale();
  const markAsPaidMutation = useMarkSaleAsPaid();

  // Mémorisation des fonctions pour éviter les re-rendus
  const approveSale = useCallback((saleId: string) => {
    const numericId = parseInt(saleId.replace(/\D/g, ''), 10);
    if (!isNaN(numericId)) {
      approveSaleMutation.mutate(numericId);
    } else {
      toast({
        title: "Erreur",
        description: "ID de vente invalide",
        variant: "destructive"
      });
    }
  }, [approveSaleMutation, toast]);

  const cancelSale = useCallback((saleId: string) => {
    const numericId = parseInt(saleId.replace(/\D/g, ''), 10);
    if (!isNaN(numericId)) {
      cancelSaleMutation.mutate({
        id: numericId,
        reason: "Annulation depuis l'historique des ventes"
      });
    } else {
      toast({
        title: "Erreur",
        description: "ID de vente invalide",
        variant: "destructive"
      });
    }
  }, [cancelSaleMutation, toast]);

  const markSaleAsPaid = useCallback((saleId: string) => {
    const numericId = parseInt(saleId.replace(/\D/g, ''), 10);
    if (!isNaN(numericId)) {
      markAsPaidMutation.mutate(numericId);
    } else {
      toast({
        title: "Erreur",
        description: "ID de vente invalide",
        variant: "destructive"
      });
    }
  }, [markAsPaidMutation, toast]);

  const exportSales = (format: string) => {
    // TODO: Implement export logic
    console.log(`Exporting sales in ${format} format`);
  };

  // Mémorisation des calculs
  const salesStats = useMemo(() => {
    // CORRECTION: Exclure les ventes annulées du calcul du total
    const totalSales = filteredSales
      .filter(sale => sale.status !== "cancelled") // Exclure les ventes annulées
      .reduce((sum, sale) => {
        const saleTotal = Number(sale.total) || 0;
        return sum + saleTotal;
      }, 0);
    const completedSales = filteredSales.filter(sale => sale.status === "completed");
    const pendingSales = filteredSales.filter(sale => sale.status === "pending");

    return {
      totalSales,
      completedSales,
      pendingSales,
      completedCount: completedSales.length,
      pendingCount: pendingSales.length
    };
  }, [filteredSales]);

  const handleRefresh = useCallback(() => {
    refetchSales();
    toast({
      title: "Actualisation",
      description: "Données des ventes actualisées"
    });
  }, [refetchSales, toast]);

  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setDateFilter("");
    setServerFilter("all");
    setStatusFilter("all");
    toast({
      title: "Filtres réinitialisés",
      description: "Tous les filtres ont été remis à zéro"
    });
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-surface flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Historique des ventes
              </h1>
              <p className="text-muted-foreground">
                {isAdmin() || isManager() 
                  ? "Consultez et gérez l'historique de toutes les ventes" 
                  : "Consultez l'historique de vos ventes"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </Button>
              {(isAdmin() || isManager()) && (
                <>
                  <Button variant="outline" onClick={() => exportSales("pdf")} className="gap-2">
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button variant="outline" onClick={() => exportSales("excel")} className="gap-2">
                    <Download className="h-4 w-4" />
                    Excel
                  </Button>
                  <Button variant="outline" onClick={() => exportSales("csv")} className="gap-2">
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <ErrorBoundary>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total ventes</p>
                    <p className="text-xl font-bold">
                      {salesLoading ? "Chargement..." : `${salesStats.totalSales.toLocaleString()} FBu`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-success to-success/80 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-success-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Terminées</p>
                    <p className="text-xl font-bold text-success">{salesStats.completedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-warning to-warning/80 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-warning-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">En attente</p>
                    <p className="text-xl font-bold text-warning">
                      {salesStats.pendingCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total ventes</p>
                    <p className="text-xl font-bold">{filteredSales.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </ErrorBoundary>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres avancés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin() || isManager() ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ID, client, table..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>

                {(isAdmin() || isManager()) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Serveur</label>
                    <Select value={serverFilter} onValueChange={setServerFilter} disabled={serversLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={serversLoading ? "Chargement..." : "Sélectionner un serveur"} />
                      </SelectTrigger>
                      <SelectContent>
                        {servers.map(server => (
                          <SelectItem key={server.id} value={server.id}>
                            {server.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status === "all" ? "Tous les statuts" : 
                           status === "completed" ? "Terminées" :
                           status === "pending" ? "En attente" :
                           status === "cancelled" ? "Annulées" :
                           status === "refunded" ? "Remboursées" : status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" className="w-full gap-2" onClick={handleResetFilters}>
                    <Filter className="h-4 w-4" />
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales List */}
          <ErrorBoundary>
            <Card>
            <CardHeader>
              <CardTitle>
                {isAdmin() || isManager() 
                  ? `Toutes les ventes (${filteredSales.length})` 
                  : `Mes ventes (${filteredSales.length})`}
              </CardTitle>
              <CardDescription>
                Total affiché: {salesStats.totalSales.toLocaleString()} FBu
              </CardDescription>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Chargement des ventes...
                </div>
              ) : salesError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <p className="text-destructive mb-4">Erreur lors du chargement des ventes</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Vérifiez votre connexion internet et réessayez
                  </p>
                  <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSales.map((sale) => (
                    <SaleItem
                      key={sale.id}
                      sale={sale}
                      onApprove={approveSale}
                      onCancel={cancelSale}
                      onMarkAsPaid={markSaleAsPaid}
                      isApprovePending={approveSaleMutation.isPending}
                      isCancelPending={cancelSaleMutation.isPending}
                      isMarkAsPaidPending={markAsPaidMutation.isPending}
                    />
                  ))}
                {filteredSales.length === 0 && !salesLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      {sales.length === 0 ? "Aucune vente enregistrée" : "Aucune vente trouvée"}
                    </p>
                    <p className="text-sm">
                      {sales.length === 0
                        ? "Les ventes apparaîtront ici une fois qu'elles seront enregistrées"
                        : "Essayez de modifier vos critères de recherche"
                      }
                    </p>
                    {sales.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={handleResetFilters}
                      >
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </div>
                )}
              </div>
              )}
            </CardContent>
          </Card>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
