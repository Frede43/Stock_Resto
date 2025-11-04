import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Clock,
  Mail,
  Loader2,
  Maximize2,
  Filter,
  RefreshCw,
  Eye,
  Printer,
  CreditCard,
  Receipt
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from "recharts";

import { useDailyReport, useDashboardStats, useSalesReport, useInventoryReport, useFinancialReport } from "@/hooks/use-api";
import { useExpensesReport, useCreditsReport } from "@/hooks/use-reports";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Types pour les données de rapports
interface SalesReportData {
  stats: {
    total_sales: number;
    total_revenue: number;
    paid_sales: number;
  };
  sales_by_hour: Array<{
    hour: string;
    sales: number;
    revenue: number;
  }>;
  top_products: Array<{
    product__name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
}

interface InventoryReportData {
  products: Array<{
    name: string;
    current_stock: number;
    stock_initial: number;
    entries: number;
    exits: number;
  }>;
}

interface FinancialReportData {
  summary: {
    total_sales: number;
    total_revenue: number;
    average_sale: number;
  };
}

// Fonction pour formater la date au format YYYY-MM-DD
const formatDateForAPI = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// Obtenir la date d'aujourd'hui au format YYYY-MM-DD
const today = formatDateForAPI(new Date());

export default function Reports() {
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState("week");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [showSalesDialog, setShowSalesDialog] = useState(false);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [showCustomersDialog, setShowCustomersDialog] = useState(false);
  const [showFinancialDialog, setShowFinancialDialog] = useState(false);
  const [showExpensesDialog, setShowExpensesDialog] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [expensesPeriod, setExpensesPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [creditsPeriod, setCreditsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const { toast } = useToast();
  
  // Hooks pour les nouveaux rapports
  const { data: expensesReport, isLoading: expensesLoading } = useExpensesReport({ 
    period: expensesPeriod,
    start_date: startDate,
    end_date: endDate
  });
  const { data: creditsReport, isLoading: creditsLoading } = useCreditsReport({ 
    period: creditsPeriod,
    start_date: startDate,
    end_date: endDate
  });

  // Calculer la date de fin en fonction de la plage de dates sélectionnée
  const getEndDate = () => {
    const start = new Date(startDate);
    let end = new Date(start);
    
    switch(dateRange) {
      case 'day':
        // Même jour
        break;
      case 'week':
        end.setDate(start.getDate() + 7);
        break;
      case 'month':
        end.setMonth(start.getMonth() + 1);
        break;
      case 'quarter':
        end.setMonth(start.getMonth() + 3);
        break;
      case 'year':
        end.setFullYear(start.getFullYear() + 1);
        break;
      default:
        break;
    }
    
    return formatDateForAPI(end);
  };
  
  // Options pour les plages de dates
  const dateRanges = [
    { value: "day", label: "Aujourd'hui" },
    { value: "week", label: "Cette semaine" },
    { value: "month", label: "Ce mois" },
    { value: "quarter", label: "Ce trimestre" },
    { value: "year", label: "Cette année" },
    { value: "custom", label: "Personnalisé" }
  ];
  
  // Options pour les formats d'export
  const exportFormats = [
    { value: "pdf", label: "PDF" },
    { value: "excel", label: "Excel" },
    { value: "csv", label: "CSV" }
  ];

  // Types de rapports
  const reportTypes = [
    { value: "sales", label: "Ventes", icon: DollarSign },
    { value: "inventory", label: "Inventaire", icon: Package },
    { value: "customers", label: "Clients", icon: Users },
    { value: "financial", label: "Financier", icon: BarChart3 }
  ];
  
  // Récupérer les données du tableau de bord
  const { 
    data: dashboardStats, 
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useDashboardStats();
  
  // Récupérer les données du rapport quotidien
  const {
    data: dailyReport,
    isLoading: reportLoading,
    error: reportError,
    refetch: refetchReport
  } = useDailyReport(startDate);

  // Récupérer les données selon le type de rapport sélectionné
  const {
    data: salesReport,
    isLoading: salesReportLoading,
    error: salesReportError
  } = useSalesReport({ 
    start_date: startDate, 
    end_date: getEndDate(),
    period: dateRange 
  }) as { data: SalesReportData | undefined, isLoading: boolean, error: any };

  const {
    data: inventoryReport,
    isLoading: inventoryReportLoading,
    error: inventoryReportError
  } = useInventoryReport({ date: startDate }) as { data: InventoryReportData | undefined, isLoading: boolean, error: any };

  const {
    data: financialReport,
    isLoading: financialReportLoading,
    error: financialReportError
  } = useFinancialReport({ 
    start_date: startDate, 
    end_date: getEndDate() 
  }) as { data: FinancialReportData | undefined, isLoading: boolean, error: any };
  
  // Préparer les données pour les graphiques selon le type de rapport
  const getReportData = () => {
    switch(reportType) {
      case 'sales':
        return salesReport?.stats || (dailyReport as any)?.stats || {};
      case 'inventory':
        return inventoryReport?.products || [];
      case 'financial':
        return financialReport?.summary || {};
      default:
        return dashboardStats || {};
    }
  };

  const reportData = getReportData();
  
  // Données pour les graphiques de ventes
  const salesChartData = salesReport?.sales_by_hour || (dailyReport as any)?.sales_by_hour || [];
  
  // Créer des données de catégories dynamiques
  const categoryData = reportType === 'sales' && salesReport?.top_products ? 
    salesReport.top_products.map((product: any) => ({
      name: product.product__name || 'Produit',
      value: product.total_revenue || 0,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    })) : 
    dashboardStats?.today?.products_sold?.reduce((acc: any[], product: any) => {
      const categoryName = product.product__category === 1 ? 'Bières' :
                          product.product__category === 2 ? 'Boissons' :
                          product.product__category === 3 ? 'Spiritueux' :
                          product.product__category === 4 ? 'Plats' :
                          product.product__category === 5 ? 'Accompagnements' :
                          product.product__category === 6 ? 'Snacks' : 'Autres';

      const existing = acc.find(item => item.name === categoryName);
      if (existing) {
        existing.value += product.revenue;
      } else {
        acc.push({
          name: categoryName,
          value: product.revenue,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`
        });
      }
      return acc;
    }, []) || [];

  const expenseData = (dashboardStats as any)?.expense_breakdown || [];

  const handleExport = () => {
    toast({
      title: "Export en cours",
      description: `Export du rapport ${reportType} en format ${selectedFormat}`,
      variant: "default",
    });
  };

  const handleScheduleReport = () => {
    toast({
      title: "Rapport programmé",
      description: "Le rapport sera envoyé automatiquement selon la planification",
      variant: "default",
    });
  };

  const isLoading = statsLoading || reportLoading;
  const hasError = statsError || reportError;

  return (
    <>
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-6">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Rapports</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Générez et analysez vos rapports d'activité
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button onClick={handleExport} className="gap-2 flex-1 sm:flex-none">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exporter</span>
                </Button>
                <Button onClick={handleScheduleReport} variant="outline" className="gap-2 flex-1 sm:flex-none">
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Programmer</span>
                </Button>
              </div>
            </div>

            {/* Filtres et contrôles */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration du rapport</CardTitle>
                <CardDescription>
                  Sélectionnez le type de rapport et la période d'analyse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Type de rapport</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Période</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dateRanges.map(range => (
                          <SelectItem key={range.value} value={range.value}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {dateRange === "custom" && (
                    <>
                      <div className="space-y-2">
                        <Label>Date début</Label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date fin</Label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Format d'export</Label>
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {exportFormats.map(format => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques principales */}
            {!isLoading && !hasError && dashboardStats && (
              <div className="grid gap-6 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ventes du jour</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardStats?.today?.daily_revenue?.toLocaleString() || 0} BIF
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +{dashboardStats?.today?.products_sold?.length || 0} produits vendus
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Commandes</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardStats?.today?.products_sold?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardStats?.today?.pending_sales || 0} en cours
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Produits actifs</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardStats?.quick_stats?.total_products || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      -{dashboardStats?.alerts?.low_stock || 0} alertes stock
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Alertes</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardStats?.alerts?.total_unresolved || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      à traiter
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Cartes Rapports Dépenses et Crédits */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Carte Rapport Dépenses */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                onClick={() => setShowExpensesDialog(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">Rapport Dépenses</CardTitle>
                  <Receipt className="h-5 w-5 text-orange-500" />
                </CardHeader>
                <CardContent>
                  {expensesLoading ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </div>
                  ) : expensesReport ? (
                    <>
                      <div className="text-3xl font-bold text-orange-600">
                        {expensesReport.summary.total_amount.toLocaleString()} FBu
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {expensesReport.summary.total_count} dépense(s) - {expensesReport.period === 'daily' ? 'Aujourd\'hui' : expensesReport.period === 'weekly' ? 'Cette semaine' : 'Ce mois'}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Badge variant="secondary" className="text-xs">
                          {expensesReport.summary.by_status.find((s: any) => s.status === 'approved')?.count || 0} approuvées
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {expensesReport.summary.by_status.find((s: any) => s.status === 'pending')?.count || 0} en attente
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" className="mt-4 w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir le rapport détaillé
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
                  )}
                </CardContent>
              </Card>

              {/* Carte Rapport Crédits */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                onClick={() => setShowCreditsDialog(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">Rapport Crédits</CardTitle>
                  <CreditCard className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  {creditsLoading ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </div>
                  ) : creditsReport ? (
                    <>
                      <div className="text-3xl font-bold text-blue-600">
                        {creditsReport.summary.accounts.total_debt.toLocaleString()} FBu
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Dette totale - {creditsReport.summary.accounts.accounts_with_debt} compte(s) avec dette
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Badge variant="secondary" className="text-xs">
                          {creditsReport.summary.accounts.total_accounts} comptes
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {creditsReport.summary.transactions.total_count} transactions
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" className="mt-4 w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir le rapport détaillé
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contenu des rapports */}
            {hasError && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-destructive mb-4">Erreur lors du chargement des données</p>
                    <Button onClick={() => { refetchStats(); refetchReport(); }} variant="outline">
                      Réessayer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Chargement des données...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isLoading && !hasError && (
              <Tabs value={reportType} onValueChange={setReportType}>
                <TabsList className="grid w-full grid-cols-4">
                  {reportTypes.map(type => (
                    <TabsTrigger key={type.value} value={type.value} className="gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="sales" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Évolution des ventes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={salesChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value} FBu`, "Ventes"]} />
                            <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Répartition par catégorie</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsPieChart>
                            <RechartsPieChart data={categoryData} cx="50%" cy="50%" outerRadius={80}>
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </RechartsPieChart>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="inventory" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>État des stocks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Rapport d'inventaire en cours de développement...</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="customers" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analyse clientèle</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Rapport clientèle en cours de développement...</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="financial" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rapport financier</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Rapport financier en cours de développement...</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>

        {/* Dialog Rapport Dépenses */}
        <Dialog open={showExpensesDialog} onOpenChange={setShowExpensesDialog}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rapport des Dépenses</DialogTitle>
              <DialogDescription>
                Période : {expensesReport?.start_date} au {expensesReport?.end_date}
              </DialogDescription>
            </DialogHeader>
            
            {expensesReport && (
              <div className="space-y-6">
                {/* Sélecteur de période */}
                <div className="flex gap-2">
                  <Button 
                    variant={expensesPeriod === 'daily' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExpensesPeriod('daily')}
                  >
                    Journalier
                  </Button>
                  <Button 
                    variant={expensesPeriod === 'weekly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExpensesPeriod('weekly')}
                  >
                    Hebdomadaire
                  </Button>
                  <Button 
                    variant={expensesPeriod === 'monthly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExpensesPeriod('monthly')}
                  >
                    Mensuel
                  </Button>
                </div>
                
                {/* Statistiques */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-orange-600">
                        {expensesReport.summary.total_amount.toLocaleString()} FBu
                      </div>
                      <p className="text-xs text-muted-foreground">Total dépenses</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {expensesReport.summary.total_count}
                      </div>
                      <p className="text-xs text-muted-foreground">Nombre de dépenses</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">
                        {expensesReport.summary.by_status.find((s: any) => s.status === 'approved')?.count || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Dépenses approuvées</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Graphique par catégorie */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dépenses par catégorie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={expensesReport.summary.by_category}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category__name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} FBu`, "Montant"]} />
                        <Bar dataKey="total" fill="#f97316" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                {/* Tableau détaillé */}
                <Card>
                  <CardHeader>
                    <CardTitle>Liste des dépenses ({expensesReport.expenses.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead>Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expensesReport.expenses.map((expense: any) => (
                            <TableRow key={expense.id}>
                              <TableCell className="text-sm">{expense.date}</TableCell>
                              <TableCell className="text-sm">{expense.category || '-'}</TableCell>
                              <TableCell className="text-sm">{expense.description}</TableCell>
                              <TableCell className="text-right font-medium">{expense.amount.toLocaleString()} FBu</TableCell>
                              <TableCell>
                                <Badge variant={
                                  expense.status === 'approved' ? 'default' : 
                                  expense.status === 'pending' ? 'secondary' : 
                                  'destructive'
                                }>
                                  {expense.status_display}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Rapport Crédits */}
        <Dialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rapport des Crédits</DialogTitle>
              <DialogDescription>
                Période : {creditsReport?.start_date} au {creditsReport?.end_date}
              </DialogDescription>
            </DialogHeader>
            
            {creditsReport && (
              <div className="space-y-6">
                {/* Sélecteur de période */}
                <div className="flex gap-2">
                  <Button 
                    variant={creditsPeriod === 'daily' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCreditsPeriod('daily')}
                  >
                    Journalier
                  </Button>
                  <Button 
                    variant={creditsPeriod === 'weekly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCreditsPeriod('weekly')}
                  >
                    Hebdomadaire
                  </Button>
                  <Button 
                    variant={creditsPeriod === 'monthly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCreditsPeriod('monthly')}
                  >
                    Mensuel
                  </Button>
                </div>
                
                {/* Statistiques */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {creditsReport.summary.accounts.total_accounts}
                      </div>
                      <p className="text-xs text-muted-foreground">Total comptes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-orange-600">
                        {creditsReport.summary.accounts.accounts_with_debt}
                      </div>
                      <p className="text-xs text-muted-foreground">Avec dette</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-red-600">
                        {creditsReport.summary.accounts.total_debt.toLocaleString()} FBu
                      </div>
                      <p className="text-xs text-muted-foreground">Dette totale</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600">
                        {creditsReport.summary.transactions.total_count}
                      </div>
                      <p className="text-xs text-muted-foreground">Transactions</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Top débiteurs */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Débiteurs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead className="text-right">Dette</TableHead>
                          <TableHead className="text-right">Limite</TableHead>
                          <TableHead className="text-right">Disponible</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditsReport.summary.top_debtors.map((debtor: any) => (
                          <TableRow key={debtor.id}>
                            <TableCell className="font-medium">{debtor.customer_name}</TableCell>
                            <TableCell className="text-sm">{debtor.phone || '-'}</TableCell>
                            <TableCell className="text-right font-bold text-orange-600">
                              {debtor.current_balance.toLocaleString()} FBu
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {debtor.credit_limit.toLocaleString()} FBu
                            </TableCell>
                            <TableCell className="text-right text-sm text-green-600">
                              {debtor.available_credit.toLocaleString()} FBu
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                {/* Graphique transactions par type */}
                <Card>
                  <CardHeader>
                    <CardTitle>Transactions par type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={creditsReport.summary.transactions.by_type}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="transaction_type" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} FBu`, "Montant"]} />
                        <Bar dataKey="total" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                {/* Liste des transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dernières transactions ({creditsReport.transactions.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead>Mode paiement</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {creditsReport.transactions.map((transaction: any) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="text-sm">{transaction.date}</TableCell>
                              <TableCell className="text-sm">{transaction.customer_name}</TableCell>
                              <TableCell>
                                <Badge variant={transaction.transaction_type === 'payment' ? 'default' : 'secondary'}>
                                  {transaction.transaction_type_display}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {transaction.amount.toLocaleString()} FBu
                              </TableCell>
                              <TableCell className="text-sm">{transaction.payment_method_display || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
    </>
  );
}
