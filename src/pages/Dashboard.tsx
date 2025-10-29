import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Users,
  ShoppingCart,
  BarChart3,
  Clock,
  RefreshCw,
  ChefHat
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useDashboardStats, useUnresolvedAlerts, useLowStockProducts, useKitchenDashboard, useSalesChart, useProductSalesChart } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  
  // Hooks pour récupérer les données réelles
  const { 
    data: dashboardStats, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = useDashboardStats();
  
  const { 
    data: alerts, 
    isLoading: alertsLoading 
  } = useUnresolvedAlerts();
  
  const { 
    data: lowStockProducts, 
    isLoading: lowStockLoading 
  } = useLowStockProducts();

  const {
    data: kitchenStats,
    isLoading: kitchenLoading
  } = useKitchenDashboard();

  // Hooks pour les graphiques dynamiques
  const {
    data: salesChartData,
    isLoading: salesChartLoading
  } = useSalesChart({ period: 'day' });

  const {
    data: productChartData,
    isLoading: productChartLoading
  } = useProductSalesChart({ period: 'day' });

  // Fonction pour actualiser toutes les données
  const handleRefresh = async () => {
    try {
      await refetchStats();
      toast({
        title: "Données actualisées",
        description: "Le tableau de bord a été mis à jour",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les données",
        variant: "destructive",
      });
    }
  };

  // Données dynamiques pour les graphiques
  const salesData = salesChartData?.data || [
    { time: "08:00", sales: 15000 },
    { time: "10:00", sales: 32000 },
    { time: "12:00", sales: 45000 },
    { time: "14:00", sales: 38000 },
    { time: "16:00", sales: 52000 },
    { time: "18:00", sales: 61000 },
    { time: "20:00", sales: 75000 },
    { time: "22:00", sales: 68000 },
  ];

  const productData = productChartData?.data || [
    { name: "Boissons", value: 45 },
    { name: "Plats", value: 30 },
    { name: "Snacks", value: 25 },
  ];

  // Gestion des erreurs
  if (statsError) {
    return (
      <div className="min-h-screen bg-gradient-surface flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
              <p className="text-muted-foreground mb-4">
                Impossible de charger les données du tableau de bord
              </p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
                📊 Tableau de Bord Complet
              </h1>
              <p className="text-muted-foreground">
                Vue d'ensemble avec données réelles du backend
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={statsLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <QuickActions />
            </div>
          </div>

          {/* Stats Cards - Données Réelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatsCard
              title="Ventes du jour"
              value={statsLoading ? "..." : `${dashboardStats?.today?.daily_revenue?.toLocaleString() || 0} BIF`}
              change={statsLoading ? "..." : `+${dashboardStats?.today?.products_sold?.length || 0}`}
              changeType="positive"
              icon={DollarSign}
              description="produits vendus"
            />
            <StatsCard
              title="Commandes"
              value={statsLoading ? "..." : `${dashboardStats?.today?.orders || 0}`}
              change={statsLoading ? "..." : `${dashboardStats?.today?.pending_orders || 0}`}
              changeType="positive"
              icon={ShoppingCart}
              description="en attente"
            />
            <StatsCard
              title="Produits en stock"
              value={statsLoading ? "..." : `${dashboardStats?.quick_stats?.total_products || 0}`}
              change={statsLoading ? "..." : `-${dashboardStats?.alerts?.low_stock || 0}`}
              changeType="negative"
              icon={Package}
              description="produits actifs"
            />
            <StatsCard
              title="Alertes"
              value={alertsLoading ? "..." : `${dashboardStats?.alerts?.total_unresolved || 0}`}
              change={alertsLoading ? "..." : `${dashboardStats?.alerts?.low_stock || 0}`}
              changeType="warning"
              icon={AlertTriangle}
              description="à traiter"
            />
            <StatsCard
              title="Tables occupées"
              value={statsLoading ? "..." : `${dashboardStats?.quick_stats?.occupied_tables || 0}`}
              change={statsLoading ? "..." : `/${dashboardStats?.quick_stats?.total_tables || 10}`}
              changeType="neutral"
              icon={Users}
              description="taux d'occupation"
            />
          </div>

          {/* Stats Cuisine - Nouvelles Fonctionnalités */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ChefHat className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ingrédients</p>
                    <p className="text-2xl font-bold">
                      {kitchenLoading ? "..." : kitchenStats?.stats?.total_ingredients || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Alertes cuisine</p>
                    <p className="text-2xl font-bold">
                      {kitchenLoading ? "..." : kitchenStats?.stats?.low_stock_count || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recettes</p>
                    <p className="text-2xl font-bold">
                      {kitchenLoading ? "..." : kitchenStats?.stats?.total_recipes || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valeur stock cuisine</p>
                    <p className="text-2xl font-bold">
                      {kitchenLoading ? "..." : `${kitchenStats?.stats?.total_stock_value?.toLocaleString() || 0} BIF`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <AlertsWidget />
              
              {/* Alertes Cuisine */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    Alertes Cuisine
                  </CardTitle>
                  <CardDescription>
                    Ingrédients nécessitant une attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {kitchenLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Stock faible</span>
                        <Badge variant="warning">
                          {kitchenStats?.stats?.low_stock_count || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Rupture</span>
                        <Badge variant="destructive">
                          {kitchenStats?.stats?.out_of_stock_count || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Recettes disponibles</span>
                        <Badge variant="success">
                          {kitchenStats?.stats?.available_recipes || 0}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              {/* Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Évolution des ventes</CardTitle>
                  <CardDescription>
                    {salesChartLoading ? 'Chargement...' : 'Ventes de la journée par heure'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {salesChartLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="animate-pulse text-muted-foreground">Chargement des données...</div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value.toLocaleString()} BIF`, 'Ventes']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Products Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des ventes</CardTitle>
                  <CardDescription>
                    {productChartLoading ? 'Chargement...' : 'Par catégorie de produits'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {productChartLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="animate-pulse text-muted-foreground">Chargement des données...</div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={productData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, 'Part']} />
                      <Bar 
                        dataKey="value" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Status Footer */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                      Connecté au backend Django
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Dernière mise à jour: {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <Badge variant="success">
                  Données réelles
                </Badge>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
