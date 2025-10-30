import { useState, useEffect, useMemo } from "react";
import { useStockNotifications } from "@/hooks/use-stock-notifications";
import { useOrderNotifications } from "@/hooks/use-order-notifications";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/stable-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { authStorage } from "@/utils/storage";
import CashierDashboard from "./CashierDashboard";
import AdminDashboard from "./AdminDashboard";
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
  Lock
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useDashboardStats, useUnresolvedAlerts, useLowStockProducts, useSalesStats, useActiveAlertsCount, useMonitoringDashboard } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { DashboardStats, SalesStats } from "@/types/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StatsCardSkeleton, ChartSkeleton } from "@/components/ui/loading-skeleton";

const Index = () => {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  // DEBUG: Logs pour diagnostiquer le problème de rôle
  console.log('🔍 DEBUG Index.tsx - User data:', user);
  console.log('🔍 DEBUG Index.tsx - User role:', user?.role);
  console.log('🔍 DEBUG Index.tsx - isLoading:', isLoading);
  
  // Synchroniser le rôle utilisateur avec localStorage pour éviter les problèmes de timing
  useEffect(() => {
    const updateUserRole = () => {
      if (user?.role) {
        setUserRole(user.role);
        console.log('🔄 Index.tsx - Rôle mis à jour depuis user:', user.role);
      } else {
        // Fallback: récupérer depuis localStorage si user n'est pas encore chargé
        const freshUserData = authStorage.getUser();
        if (freshUserData && freshUserData.role && freshUserData.isLoggedIn) {
          setUserRole(freshUserData.role);
          console.log('🔄 Index.tsx - Rôle récupéré depuis authStorage:', freshUserData.role);
        }
      }
    };

    updateUserRole();
    
    // Écouter les changements du localStorage pour la compatibilité cross-browser
    const cleanup = authStorage.onUserChange((userData) => {
      if (userData && userData.role && userData.isLoggedIn) {
        setUserRole(userData.role);
        console.log('🔄 Index.tsx - Rôle mis à jour via authStorage listener:', userData.role);
      } else {
        setUserRole(null);
        console.log('🔄 Index.tsx - Utilisateur déconnecté via authStorage listener');
      }
    });
    
    return cleanup;
  }, [user]);

  // Attendre que l'authentification soit terminée
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  // REDIRECTION BASÉE SUR LES RÔLES - utiliser userRole pour plus de fiabilité
  const effectiveRole = userRole || user?.role;
  
  if (effectiveRole === 'cashier') {
    console.log('💰 DEBUG: Affichage CashierDashboard pour role:', effectiveRole);
    return <CashierDashboard />;
  }

  if (effectiveRole === 'admin') {
    console.log('👑 DEBUG: Affichage AdminDashboard pour role:', effectiveRole);
    return <AdminDashboard />;
  }

  // Pour les autres rôles (manager, server), afficher l'interface par défaut
  if (effectiveRole === 'manager' || effectiveRole === 'server') {
    console.log('🎭 DEBUG: Interface par défaut pour role:', effectiveRole);
  }

  // Activer les notifications automatiques pour les autres rôles
  useStockNotifications();
  useOrderNotifications();
  
  // Hooks pour récupérer les données depuis l'API
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useDashboardStats();
  
  const {
    data: salesStats,
    isLoading: salesLoading
  } = useSalesStats();
  
  const {
    data: lowStockData,
    isLoading: stockLoading
  } = useLowStockProducts();
  
  const {
    data: alertsData,
    isLoading: alertsLoading
  } = useUnresolvedAlerts();

  const {
    data: alertsCount,
    isLoading: alertsCountLoading
  } = useActiveAlertsCount();

  const {
    data: monitoringData,
    isLoading: monitoringLoading
  } = useMonitoringDashboard();

  // Mémorisation des données de ventes pour éviter les re-rendus inutiles
  const formattedSalesData = useMemo(() => {
    if ((salesStats as SalesStats)?.hourly_sales) {
      return (salesStats as SalesStats).hourly_sales!.map((item) => ({
        time: `${item.hour}:00`,
        sales: item.total_amount || 0
      }));
    }
    return [];
  }, [salesStats]);

  // Mémorisation des données des produits les plus vendus
  const formattedTopProducts = useMemo(() => {
    if ((salesStats as SalesStats)?.top_products) {
      return (salesStats as SalesStats).top_products!.map((item) => ({
        name: item.product_name,
        sales: item.quantity_sold || item.sales || 0
      }));
    }
    return [];
  }, [salesStats]);

  // Mémorisation des valeurs pour éviter les re-rendus
  const statsValues = useMemo(() => {
    const stats = dashboardStats as DashboardStats;
    const monitoring = monitoringData as any;
    const alerts = alertsCount as any;

    return {
      todaySales: stats?.today_sales || stats?.today?.daily_revenue || 0,
      pendingOrders: stats?.pending_orders || stats?.today?.pending_sales || 0,
      totalProducts: stats?.quick_stats?.total_products || 0,
      lowStockAlerts: alerts?.total_active || stats?.alerts?.low_stock || 0,
      occupiedTables: stats?.occupied_tables || 0,
      totalTables: stats?.total_tables || 0,
      salesChange: stats?.sales_change || "0%",
      salesChangeType: stats?.sales_change_type || "neutral",
      ordersChange: stats?.orders_change || "0",
      ordersChangeType: stats?.orders_change_type || "neutral",
      occupancyRate: stats?.occupancy_rate || "0%",
      // Nouvelles métriques dynamiques
      criticalAlerts: alerts?.critical_active || 0,
      systemStatus: monitoring?.api?.status || 'unknown',
      activeSessions: monitoring?.active_sessions || 0,
      serverHealth: monitoring?.server?.cpu || 0
    };
  }, [dashboardStats, monitoringData, alertsCount]);

  // Fonction pour actualiser les données
  const handleRefresh = () => {
    refetchStats();
    toast({
      title: "Actualisation",
      description: "Données du tableau de bord actualisées"
    });
  };

  return (
    <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary to-primary-glow rounded-xl p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Bienvenue dans Harry's Grill Bar-Testaurant
                </h1>
                <p className="text-primary-foreground/90 text-lg">
                  Gérez votre établissement avec efficacité et simplicité
                </p>
              </div>
              <Button 
                variant="secondary" 
                onClick={handleRefresh}
                className="gap-2"
                disabled={statsLoading}
              >
                <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <ErrorBoundary>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsLoading ? (
                <>
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                </>
              ) : (
                <>
                  <StatsCard
                    title="Ventes du jour"
                    value={`${statsValues.todaySales.toLocaleString()} FBu`}
                    change={statsValues.salesChange}
                    changeType={statsValues.salesChangeType}
                    icon={DollarSign}
                    description="vs hier"
                  />
                  <StatsCard
                    title="Commandes"
                    value={statsValues.pendingOrders.toString()}
                    change={statsValues.ordersChange}
                    changeType={statsValues.ordersChangeType}
                    icon={ShoppingCart}
                    description="en cours"
                  />
                  <StatsCard
                    title="Alertes système"
                    value={statsValues.lowStockAlerts.toString()}
                    change={statsValues.criticalAlerts.toString()}
                    changeType={statsValues.criticalAlerts > 0 ? "negative" : "positive"}
                    icon={AlertTriangle}
                    description="critiques"
                  />
                  <StatsCard
                    title="Tables occupées"
                    value={`${statsValues.occupiedTables}/${statsValues.totalTables}`}
                    change={statsValues.occupancyRate}
                    changeType="neutral"
                    icon={Users}
                    description="taux d'occupation"
                  />
                </>
              )}
            </div>
          </ErrorBoundary>

          {/* Dashboard Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <ErrorBoundary>
                <QuickActions />
              </ErrorBoundary>
              <ErrorBoundary>
                <AlertsWidget />
              </ErrorBoundary>
            </div>
            <div className="lg:col-span-2 space-y-6">
              {/* Sales Chart */}
              <ErrorBoundary>
                <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Ventes du jour
                  </CardTitle>
                  <CardDescription>
                    Évolution des ventes en temps réel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {salesLoading ? (
                    <div className="h-[300px] w-full animate-pulse bg-muted rounded" />
                  ) : formattedSalesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={formattedSalesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} FBu`, "Ventes"]} />
                        <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune donnée de vente disponible</p>
                        <p className="text-sm">Les ventes apparaîtront ici une fois enregistrées</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              </ErrorBoundary>

              {/* Top Products */}
              <ErrorBoundary>
                <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Produits les plus vendus
                  </CardTitle>
                  <CardDescription>
                    Top des ventes aujourd'hui
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {salesLoading ? (
                    <div className="h-[250px] w-full animate-pulse bg-muted rounded" />
                  ) : formattedTopProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={formattedTopProducts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}`, "Ventes"]} />
                        <Bar dataKey="sales" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun produit vendu aujourd'hui</p>
                        <p className="text-sm">Les produits populaires apparaîtront ici</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              </ErrorBoundary>
            </div>
          </div>
    </div>
  );
};

export default Index;
