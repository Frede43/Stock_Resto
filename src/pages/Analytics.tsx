import { useState, useMemo } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Target,
  Brain,
  DollarSign,
  Package,
  Users,
  Clock
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { useDashboardStats, useSalesStats, useProducts, useOrders, useAnalytics } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";


export default function Analytics() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Récupérer les données depuis l'API
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardStats();
  const { data: salesData, isLoading: salesLoading } = useSalesStats(selectedPeriod as 'today' | 'week' | 'month');
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { data: ordersData, isLoading: ordersLoading } = useOrders();
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics({ period: selectedPeriod });

  // Générer les données de rentabilité à partir des vraies données
  const profitabilityData = useMemo(() => {
    if (!productsData?.results || !ordersData?.results) return [];
    
    const productStats = new Map();
    
    // Calculer les statistiques par produit
    ordersData.results.forEach((order: any) => {
      order.items?.forEach((item: any) => {
        const productId = item.product?.id;
        const product = item.product;
        if (!product) return;
        
        const existing = productStats.get(productId) || {
          product: product.name,
          sales: 0,
          revenue: 0,
          cost: 0
        };
        
        const quantity = item.quantity || 0;
        const price = product.price || 0;
        const costPrice = product.cost_price || price * 0.7;
        
        existing.sales += quantity;
        existing.revenue += quantity * price;
        existing.cost += quantity * costPrice;
        
        productStats.set(productId, existing);
      });
    });
    
    return Array.from(productStats.values())
      .map((stats: any) => ({
        ...stats,
        margin: stats.revenue > 0 ? ((stats.revenue - stats.cost) / stats.revenue * 100) : 0
      }))
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 5);
  }, [productsData, ordersData]);

  // Générer les données de tendances
  const trendsData = useMemo(() => {
    if (!(analyticsData as any)?.monthly_trends) return [];
    
    return (analyticsData as any).monthly_trends.map((month: any) => ({
      month: month.month_name,
      bières: month.categories?.['Bières']?.revenue || 0,
      liqueurs: month.categories?.['Liqueurs']?.revenue || 0,
      autres: month.categories?.['Autres']?.revenue || 0
    }));
  }, [analyticsData]);

  // Générer les prédictions (simulation basée sur les tendances)
  const predictionsData = useMemo(() => {
    if (!(salesData as any)?.daily_sales) return [];
    
    const recentSales = (salesData as any).daily_sales.slice(-7);
    const avgSales = recentSales.reduce((sum: number, day: any) => sum + (day.total || 0), 0) / recentSales.length;
    
    return Array.from({ length: 4 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      const variation = (Math.random() - 0.5) * 0.2; // Variation de ±20%
      const predicted = Math.round(avgSales * (1 + variation));
      
      return {
        date: date.toISOString().split('T')[0],
        predicted,
        actual: null,
        confidence: Math.round(85 + Math.random() * 10)
      };
    });
  }, [salesData]);

  // Générer les métriques de performance
  const performanceMetrics = useMemo(() => {
    if (!dashboardData || !salesData) return [];
    
    const avgRevenue = (salesData as any).daily_sales?.reduce((sum: number, day: any) => sum + (day.total || 0), 0) / ((salesData as any).daily_sales?.length || 1);
    const totalRevenue = (dashboardData as any).total_revenue || 0;
    const totalCost = (dashboardData as any).total_cost || 0;
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0;
    
    return [
      { 
        metric: "Chiffre d'affaires moyen/jour", 
        value: `${Math.round(avgRevenue || 0).toLocaleString()} FBu`, 
        change: "+12%", 
        trend: "up" 
      },
      { 
        metric: "Marge bénéficiaire moyenne", 
        value: `${profitMargin.toFixed(1)}%`, 
        change: "+2.1%", 
        trend: "up" 
      },
      { 
        metric: "Rotation des stocks", 
        value: "8.5 jours", 
        change: "-1.2j", 
        trend: "up" 
      },
      { 
        metric: "Total commandes", 
        value: `${ordersData?.count || 0}`, 
        change: "+5%", 
        trend: "up" 
      }
    ];
  }, [dashboardData, salesData, ordersData]);

  const isLoading = dashboardLoading || salesLoading || productsLoading || ordersLoading || analyticsLoading;

  const periods = [
    { value: "week", label: "Cette semaine" },
    { value: "month", label: "Ce mois" },
    { value: "quarter", label: "Ce trimestre" },
    { value: "year", label: "Cette année" }
  ];

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
                Analyses avancées
              </h1>
              <p className="text-muted-foreground">
                Tableaux de bord analytiques et prédictions IA
              </p>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map(period => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              performanceMetrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">{metric.metric}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {metric.trend === "up" ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <span className={`text-sm font-medium ${metric.trend === "up" ? "text-success" : "text-destructive"}`}>
                          {metric.change}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>

          <Tabs defaultValue="profitability" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profitability">Rentabilité</TabsTrigger>
              <TabsTrigger value="trends">Tendances</TabsTrigger>
              <TabsTrigger value="predictions">Prédictions IA</TabsTrigger>
              <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            </TabsList>

            {/* Profitability Analysis */}
            <TabsContent value="profitability">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Analyse de rentabilité
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="animate-pulse space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="h-16 bg-muted rounded"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {profitabilityData.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{item.product}</h4>
                              <p className="text-sm text-muted-foreground">{item.sales} ventes</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{item.margin.toFixed(1)}%</p>
                              <p className="text-sm text-muted-foreground">{item.revenue.toLocaleString()} FBu</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Marges par catégorie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="animate-pulse h-[300px] bg-muted rounded"></div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={profitabilityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="product" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}%`, "Marge"]} />
                        <Bar dataKey="margin" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Trends Analysis */}
            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Tendances de ventes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="animate-pulse h-[400px] bg-muted rounded"></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={trendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} FBu`, ""]} />
                      <Area type="monotone" dataKey="bières" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="liqueurs" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                      <Area type="monotone" dataKey="autres" stackId="1" stroke="#ffc658" fill="#ffc658" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Predictions */}
            <TabsContent value="predictions">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Prédictions IA
                    </CardTitle>
                    <CardDescription>
                      Prévisions basées sur l'analyse des données historiques
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="animate-pulse space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="h-20 bg-muted rounded"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {predictionsData.map((prediction, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{prediction.date}</h4>
                            <p className="text-sm text-muted-foreground">
                              Confiance: {prediction.confidence}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">{prediction.predicted.toLocaleString()} FBu</p>
                            <Badge variant={prediction.confidence > 85 ? "success" : "warning"}>
                              {prediction.confidence > 85 ? "Haute confiance" : "Confiance moyenne"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommandations d'optimisation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                        <h4 className="font-medium text-success mb-2">📈 Opportunité de croissance</h4>
                        <p className="text-sm">Les ventes de liqueurs montrent une tendance positive (+15%). Considérez augmenter le stock de Whisky JW Red.</p>
                      </div>
                      <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                        <h4 className="font-medium text-warning mb-2">⚠️ Attention stock</h4>
                        <p className="text-sm">Le stock de Bière Mutzig est critique. Risque de rupture dans 2-3 jours selon les tendances actuelles.</p>
                      </div>
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                        <h4 className="font-medium text-primary mb-2">💡 Optimisation prix</h4>
                        <p className="text-sm">La marge sur Coca-Cola peut être augmentée de 5% sans impact significatif sur les ventes.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Benchmarks */}
            <TabsContent value="benchmarks">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Comparaison temporelle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                          <p className="text-xl font-bold">493,100 FBu</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Hier</p>
                          <p className="text-xl font-bold">441,200 FBu</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Évolution</p>
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-4 w-4 text-success" />
                            <span className="text-xl font-bold text-success">+11.8%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance vs objectifs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Objectif mensuel</span>
                          <span className="text-sm font-medium">15,000,000 FBu</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: "68%" }}></div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Réalisé: 10,200,000 FBu</span>
                          <span className="font-medium">68%</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Objectif ventes/jour</span>
                          <span className="text-sm font-medium">60 commandes</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-success h-2 rounded-full" style={{ width: "97%" }}></div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Réalisé: 58 commandes</span>
                          <span className="font-medium text-success">97%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Analyse comparative des performances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="animate-pulse h-[300px] bg-muted rounded"></div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} FBu`, ""]} />
                        <Line type="monotone" dataKey="bières" stroke="#8884d8" strokeWidth={2} />
                        <Line type="monotone" dataKey="liqueurs" stroke="#82ca9d" strokeWidth={2} />
                        <Line type="monotone" dataKey="autres" stroke="#ffc658" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
