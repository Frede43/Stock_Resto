import { useState, useEffect, useMemo, useCallback } from "react";
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
  RefreshCw,
  Plus
} from "lucide-react";
import { useSales, useApproveSale, useCancelSale, useMarkSaleAsPaid, useServers } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { Sale as APISale } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SaleItem } from "@/components/sales/SaleItem";
import { Sale, SaleStatus, PaymentMethod, SaleFilters, SaleStats } from "@/types/sales";
import { StatusBadge } from "@/components/sales/StatusBadge";
import { PayButton } from "@/components/sales/PayButton";
import { AddItemsModal } from "@/components/sales/AddItemsModal";
import { PrintableInvoice } from "@/components/PrintableInvoice";
import { salesService } from "@/services/api";

// Données mockées supprimées - utilisation uniquement des données API

export default function SalesHistory() {
  const { toast } = useToast();
  const { user, isAdmin, isManager } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [serverFilter, setServerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSaleForAddItems, setSelectedSaleForAddItems] = useState<any>(null);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

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
        'paid': 'paid',           // ✅ Payé (stock mis à jour)
        'pending': 'pending',     // 🟠 En attente
        'preparing': 'preparing', // 🔵 En préparation
        'ready': 'ready',         // 🟣 Prêt
        'completed': 'completed', // ✅ Terminée (vente à crédit approuvée)
        'served': 'served',       // 🍽️ Servie
        'cancelled': 'cancelled'  // ❌ Annulée
      };
      const mappedStatus = statusMapping[apiSale.status] || 'pending';

      // Mapper les méthodes de paiement
      const paymentMapping: { [key: string]: Sale["paymentMethod"] } = {
        'cash': 'cash',
        'card': 'card',
        'mobile': 'mobile',
        'mobile_money': 'mobile',
        'credit': 'credit'  
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

  const handleOpenAddItemsModal = useCallback((sale: any) => {
    setSelectedSaleForAddItems(sale);
    setShowAddItemsModal(true);
  }, []);

  const handleCloseAddItemsModal = useCallback(() => {
    setShowAddItemsModal(false);
    setSelectedSaleForAddItems(null);
  }, []);

  const handleAddItemsSuccess = useCallback(() => {
    refetchSales();
    toast({
      title: "✅ Articles ajoutés",
      description: "Les articles ont été ajoutés avec succès à la vente"
    });
  }, [refetchSales, toast]);

  const handleViewInvoice = useCallback(async (sale: any) => {
    setIsLoadingInvoice(true);
    setSelectedSaleForInvoice(sale);

    try {
      // Extraire l'ID numérique
      const numericId = typeof sale.id === 'string' 
        ? parseInt(sale.id.replace(/\D/g, ''), 10)
        : sale.id;

      if (isNaN(numericId)) {
        throw new Error("ID de vente invalide");
      }

      // Récupérer les données de la facture
      const response: any = await salesService.getInvoice(numericId, 'json');
      
      console.log('📄 Réponse API facture:', response);
      
      // Le backend retourne { success: true, invoice: {...} }
      // L'API service retourne directement l'objet JSON (pas de .data)
      if (response && response.invoice) {
        console.log('✅ Données facture trouvées:', response.invoice);
        setInvoiceData(response.invoice);
        setShowInvoiceModal(true);
      } else {
        console.error('❌ Structure de réponse inattendue:', response);
        throw new Error("Données de facture invalides");
      }
    } catch (error: any) {
      console.error('Erreur chargement facture:', error);
      toast({
        title: "❌ Erreur",
        description: error.message || "Impossible de charger la facture",
        variant: "destructive"
      });
    } finally {
      setIsLoadingInvoice(false);
    }
  }, [toast]);

  const handleCloseInvoice = useCallback(() => {
    setShowInvoiceModal(false);
    setInvoiceData(null);
    setSelectedSaleForInvoice(null);
  }, []);

  const handlePrintInvoice = useCallback(() => {
    window.print();
  }, []);

  return (
    <>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Historique des ventes
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                {isAdmin() || isManager() 
                  ? "Consultez et gérez l'historique de toutes les ventes" 
                  : "Consultez l'historique de vos ventes"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleRefresh} className="gap-2 flex-1 sm:flex-none">
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
              {(isAdmin() || isManager()) && (
                <>
                  <Button variant="outline" onClick={() => exportSales("pdf")} className="gap-2 flex-1 sm:flex-none">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </Button>
                  <Button variant="outline" onClick={() => exportSales("excel")} className="gap-2 flex-1 sm:flex-none hidden md:flex">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Excel</span>
                  </Button>
                  <Button variant="outline" onClick={() => exportSales("csv")} className="gap-2 flex-1 sm:flex-none hidden lg:flex">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">CSV</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <ErrorBoundary>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground">Total ventes</p>
                    <p className="text-base md:text-xl font-bold truncate">
                      {salesLoading ? "Chargement..." : `${salesStats.totalSales.toLocaleString()} FBu`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 bg-gradient-to-br from-success to-success/80 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-success-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground">Terminées</p>
                    <p className="text-base md:text-xl font-bold text-success">{salesStats.completedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 bg-gradient-to-br from-warning to-warning/80 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 md:h-6 md:w-6 text-warning-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground">En attente</p>
                    <p className="text-base md:text-xl font-bold text-warning">
                      {salesStats.pendingCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 md:h-6 md:w-6 text-secondary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground">Total ventes</p>
                    <p className="text-base md:text-xl font-bold">{filteredSales.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </ErrorBoundary>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Filter className="h-4 w-4 md:h-5 md:w-5" />
                Filtres avancés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin() || isManager() ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3 md:gap-4`}>
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-xs md:text-sm font-medium">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 md:left-3 top-2.5 md:top-3 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                    <Input
                      placeholder="ID, client, table..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 md:pl-10 text-sm md:text-base h-9 md:h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-xs md:text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="text-sm md:text-base h-9 md:h-10"
                  />
                </div>

                {(isAdmin() || isManager()) && (
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-xs md:text-sm font-medium">Serveur</label>
                    <Select value={serverFilter} onValueChange={setServerFilter} disabled={serversLoading}>
                      <SelectTrigger className="text-sm md:text-base h-9 md:h-10">
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

                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-xs md:text-sm font-medium">Statut</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="text-sm md:text-base h-9 md:h-10">
                      <SelectValue placeholder="Tous les statuts" />
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

                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <Button variant="outline" className="w-full gap-2 h-9 md:h-10 text-sm md:text-base" onClick={handleResetFilters}>
                    <Filter className="h-3.5 w-3.5 md:h-4 md:w-4" />
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
                      onAddItems={handleOpenAddItemsModal}
                      onPaySuccess={refetchSales}
                      onViewInvoice={handleViewInvoice}
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

        {/* Modal d'ajout d'articles */}
        {selectedSaleForAddItems && (
          <AddItemsModal
            sale={selectedSaleForAddItems}
            open={showAddItemsModal}
            onClose={handleCloseAddItemsModal}
            onSuccess={handleAddItemsSuccess}
          />
        )}

        {/* Modal de facture */}
        <PrintableInvoice
          isOpen={showInvoiceModal}
          onClose={handleCloseInvoice}
          invoiceData={invoiceData}
          onPrint={handlePrintInvoice}
        />
      </div>
    </>
  );
}
