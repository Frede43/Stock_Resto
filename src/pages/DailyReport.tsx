import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  Save,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Package,
  DollarSign,
  FileOutput,
  RefreshCw,
  ChefHat,
  Receipt,
  CreditCard,
  Wallet,
  ShoppingCart,
  Clock,
  User,
  ExternalLink,
  Filter,
  Search,
  X,
  TrendingDown,
  History,
  Bell,
  Phone
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDailyReport, useDashboardStats, useDailyDetailedReport, useProducts, useOrders, useAlerts, useKitchenReport, useRecipes, useSales } from "@/hooks/use-api";
import { useExpensesReport, useCreditsReport } from "@/hooks/use-reports";
import { apiService } from "@/services/api";

interface ProductData {
  id: string;
  name: string;
  initialStock: number;
  incoming: number;
  outgoing: number;
  finalStock: number;
  price: number;
  costPrice: number;
  totalSales: number;
  revenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  category: string;
}

interface CategoryData {
  initialStock: number;
  incoming: number;
  outgoing: number;
  finalStock: number;
  sales: number;
  revenue: number;
  profit: number;
  cost: number;
  total_revenue?: number;
}

interface DailyReportData {
  date: string;
  products: ProductData[];
  categories: {
    [key: string]: CategoryData;
  };
  totalRevenue: number;
  totalProfit: number;
  totalCost: number;
  profitMargin: number;
  totalSales: number;
  alerts: {
    low_stock: any[];
    out_of_stock: any[];
    high_sales: any[];
  };
  recommendations: string[];
}

// Fonction pour générer des données de rapport par défaut
const getEmptyReportData = (date: string): DailyReportData => ({
  date,
  products: [],
  categories: {},
  totalRevenue: 0,
  totalProfit: 0,
  totalCost: 0,
  profitMargin: 0,
  totalSales: 0,
  alerts: { low_stock: [], out_of_stock: [], high_sales: [] },
  recommendations: []
});

export default function DailyReport() {
  const { toast } = useToast();
  // Utiliser la date d'aujourd'hui par défaut
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format YYYY-MM-DD
  });

  // État pour forcer la mise à jour
  const [refreshKey, setRefreshKey] = useState(0);

  // Récupérer les données du rapport quotidien depuis l'API
  interface ApiReportData {
    top_products?: Array<{
      product_name: string;
      quantity_sold: number;
      revenue: number;
    }>;
    total_sales?: number;
    date?: string;
    products?: Array<{
      name: string;
      initial_stock: number;
      incoming: number;
      outgoing: number;
      final_stock: number;
      price: number;
      total_sales: number;
      revenue: number;
      profit: number;
      category: string;
    }>;
  }
  
  // Endpoint /reports/daily/ désactivé - utilisation uniquement de l'endpoint détaillé
  // const {
  //   data: apiReportData,
  //   isLoading: reportLoading,
  //   error: reportError,
  //   refetch: refetchReport
  // } = useDailyReport(selectedDate);

  // Récupérer le rapport détaillé avec vraies données
  const {
    data: detailedReportData,
    isLoading: detailedLoading,
    error: detailedError,
    refetch: refetchDetailed
  } = useDailyDetailedReport(selectedDate);

  // Récupérer les statistiques du tableau de bord
  const {
    data: dashboardStats,
    isLoading: statsLoading
  } = useDashboardStats();

  // Récupérer les produits réels
  const { data: productsData } = useProducts();
  
  // Récupérer les commandes du jour
  const { data: ordersData, refetch: refetchOrders } = useOrders({ date: selectedDate });

  // Récupérer les alertes
  const { data: alertsData } = useAlerts();

  // Effet pour recharger les données quand la date change
  useEffect(() => {
    console.log('DEBUG: Date changed to:', selectedDate);
    refetchOrders();
    refetchDetailed();
    setRefreshKey(prev => prev + 1); // Forcer la mise à jour du useMemo
  }, [selectedDate, refetchOrders, refetchDetailed]);

  // Récupérer les données de cuisine
  const { data: kitchenReportData, isLoading: kitchenLoading } = useKitchenReport(selectedDate);

  // Récupérer les recettes avec leurs coûts
  const { data: recipesData } = useRecipes();

  // Récupérer les rapports de dépenses et crédits pour la date sélectionnée
  const { data: expensesReport, refetch: refetchExpenses } = useExpensesReport({ 
    period: 'daily',
    start_date: selectedDate,
    end_date: selectedDate
  });
  
  const { data: creditsReport, refetch: refetchCredits } = useCreditsReport({ 
    period: 'daily',
    start_date: selectedDate,
    end_date: selectedDate
  });

  // Effet pour recharger les rapports de dépenses et crédits quand la date change
  useEffect(() => {
    console.log('DEBUG: Refetching expenses and credits for date:', selectedDate);
    refetchExpenses();
    refetchCredits();
  }, [selectedDate, refetchExpenses, refetchCredits]);

  // Récupérer TOUTES les ventes du jour (pour calculer cash vs crédit)
  const { data: allSalesData, refetch: refetchAllSales } = useSales({ 
    date_from: selectedDate,
    date_to: selectedDate
  });

  // Récupérer les ventes à crédit du jour (pour l'onglet dédié)
  const { data: creditSalesData, refetch: refetchCreditSales } = useSales({ 
    payment_method: 'credit',
    date_from: selectedDate,
    date_to: selectedDate
  });

  // Effet pour recharger les ventes quand la date change
  useEffect(() => {
    console.log('DEBUG: Refetching all sales and credit sales for date:', selectedDate);
    refetchAllSales();
    refetchCreditSales();
  }, [selectedDate, refetchAllSales, refetchCreditSales]);

  // États pour les filtres des ventes à crédit
  const [creditSearchQuery, setCreditSearchQuery] = useState('');
  const [creditAccountFilter, setCreditAccountFilter] = useState('all');
  const [creditStatusFilter, setCreditStatusFilter] = useState('all');
  
  // États pour le dialog de paiement - SUPPRIMÉS (paiement géré sur /credits)
  // const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  // const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<any>(null);
  // const [paymentAmount, setPaymentAmount] = useState('');
  // const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'bank_transfer'>('cash');
  // const [paymentNotes, setPaymentNotes] = useState('');

  // Filtrer les ventes à crédit
  const filteredCreditSales = useMemo(() => {
    if (!creditSalesData?.results) return [];
    
    return creditSalesData.results.filter((sale: any) => {
      // ✅ CORRECTION: Filtrer uniquement les ventes à crédit
      const isCreditSale = sale.payment_method === 'credit';
      if (!isCreditSale) return false;
      
      const matchesSearch = 
        sale.customer_name?.toLowerCase().includes(creditSearchQuery.toLowerCase()) ||
        sale.reference?.toLowerCase().includes(creditSearchQuery.toLowerCase()) ||
        sale.credit_account?.account_number?.toLowerCase().includes(creditSearchQuery.toLowerCase());
      
      const matchesAccount = creditAccountFilter === 'all' || 
        sale.credit_account?.id?.toString() === creditAccountFilter;
      
      const matchesStatus = creditStatusFilter === 'all' || 
        (creditStatusFilter === 'paid' && sale.status === 'paid') ||
        (creditStatusFilter === 'unpaid' && sale.status !== 'paid');
      
      return matchesSearch && matchesAccount && matchesStatus;
    });
  }, [creditSalesData, creditSearchQuery, creditAccountFilter, creditStatusFilter]);

  // Extraire les comptes crédit uniques pour le filtre
  const uniqueCreditAccounts = useMemo(() => {
    if (!creditSalesData?.results) return [];
    
    const accounts = new Map();
    creditSalesData.results.forEach((sale: any) => {
      if (sale.credit_account) {
        accounts.set(sale.credit_account.id, {
          id: sale.credit_account.id,
          number: sale.credit_account.account_number || `ACC-${sale.credit_account.id}`,
          customer: sale.credit_account.customer_name || sale.customer_name
        });
      }
    });
    
    return Array.from(accounts.values());
  }, [creditSalesData]);

  // Calculer les statistiques cash vs crédit par produit
  const salesByPaymentMethod = useMemo(() => {
    console.log('🔍 DEBUG salesByPaymentMethod:', {
      allSalesData: allSalesData?.results?.length || 0,
      productsData: productsData?.results?.length || 0,
      selectedDate
    });
    
    if (!allSalesData?.results || !productsData?.results) {
      console.log('⚠️ Données manquantes pour salesByPaymentMethod');
      return {
        cashStats: { totalRevenue: 0, totalProfit: 0, totalCost: 0 },
        creditStats: { totalRevenue: 0, totalProfit: 0, totalCost: 0 },
        totalStats: { totalRevenue: 0, totalProfit: 0, totalCost: 0 },
        productStats: new Map()
      };
    }

    const productStats = new Map<string, any>();

    // Initialiser les stats pour chaque produit
    productsData.results.forEach((product: any) => {
      productStats.set(product.id, {
        id: product.id,
        name: product.name,
        price: product.selling_price || 0,
        costPrice: product.purchase_price || 0,
        category: product.category?.name || 'Autres',
        
        // Stats cash
        cashSales: 0,
        cashRevenue: 0,
        cashCost: 0,
        cashProfit: 0,
        
        // Stats crédit
        creditSales: 0,
        creditRevenue: 0,
        creditCost: 0,
        creditProfit: 0,
        
        // Stats totales
        totalSales: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0
      });
    });

    // Calculer à partir des ventes
    allSalesData.results.forEach((sale: any, saleIndex: number) => {
      const isCreditSale = sale.payment_method === 'credit';
      
      console.log(`📦 Vente ${saleIndex + 1}:`, {
        reference: sale.reference,
        payment_method: sale.payment_method,
        items_count: sale.items?.length || 0,
        total_amount: sale.total_amount
      });
      
      if (!sale.items || sale.items.length === 0) {
        console.warn(`⚠️ Vente ${sale.reference} n'a pas d'items !`);
      }
      
      sale.items?.forEach((item: any, itemIndex: number) => {
        // Essayer plusieurs façons de récupérer le product_id
        const productId = item.product?.id || item.product_id || item.product;
        const stats = productStats.get(productId);
        
        console.log(`  📌 Item ${itemIndex + 1}:`, {
          'item.product': item.product,
          'item.product?.id': item.product?.id,
          'item.product_id': item.product_id,
          'productId final': productId,
          product_name: item.product?.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          statsFound: !!stats,
          costPrice: stats?.costPrice
        });
        
        if (stats) {
          const quantity = item.quantity || 0;
          const revenue = quantity * (item.unit_price || stats.price);
          const cost = quantity * stats.costPrice;
          const profit = revenue - cost;
          
          console.log(`    💰 Calcul:`, {
            quantity,
            unit_price: item.unit_price || stats.price,
            costPrice: stats.costPrice,
            revenue,
            cost,
            profit
          });
          
          if (isCreditSale) {
            // ✅ CORRECTION: Compter le bénéfice crédit pour toutes les ventes approuvées (non annulées)
            // Le bénéfice crédit représente l'argent À RECEVOIR (crédit accordé)
            const isApproved = sale.status !== 'cancelled';
            
            if (isApproved) {
              // Vente à crédit APPROUVÉE -> Compte comme bénéfice crédit (à recevoir)
              stats.creditSales += quantity;
              stats.creditRevenue += revenue;
              stats.creditCost += cost;
              stats.creditProfit += profit;
            }
            // Si annulée, on ne compte rien
          } else {
            // Vente payée (cash, card, mobile)
            stats.cashSales += quantity;
            stats.cashRevenue += revenue;
            stats.cashCost += cost;
            stats.cashProfit += profit;
          }
          
          // Totaux
          stats.totalSales = stats.cashSales + stats.creditSales;
          stats.totalRevenue = stats.cashRevenue + stats.creditRevenue;
          stats.totalCost = stats.cashCost + stats.creditCost;
          stats.totalProfit = stats.cashProfit + stats.creditProfit;
        } else {
          console.error(`❌ Produit ${productId} non trouvé dans productStats !`);
        }
      });
    });

    // Calculer les totaux globaux
    let cashTotalRevenue = 0, cashTotalProfit = 0, cashTotalCost = 0;
    let creditTotalRevenue = 0, creditTotalProfit = 0, creditTotalCost = 0;
    
    productStats.forEach((stats) => {
      cashTotalRevenue += stats.cashRevenue;
      cashTotalProfit += stats.cashProfit;
      cashTotalCost += stats.cashCost;
      
      creditTotalRevenue += stats.creditRevenue;
      creditTotalProfit += stats.creditProfit;
      creditTotalCost += stats.creditCost;
    });

    const result = {
      cashStats: {
        totalRevenue: cashTotalRevenue,
        totalProfit: cashTotalProfit,
        totalCost: cashTotalCost
      },
      creditStats: {
        totalRevenue: creditTotalRevenue,
        totalProfit: creditTotalProfit,
        totalCost: creditTotalCost
      },
      totalStats: {
        totalRevenue: cashTotalRevenue + creditTotalRevenue,
        totalProfit: cashTotalProfit + creditTotalProfit,
        totalCost: cashTotalCost + creditTotalCost
      },
      productStats
    };
    
    console.log('✅ Résultat salesByPaymentMethod:', {
      cashProfit: result.cashStats.totalProfit,
      creditProfit: result.creditStats.totalProfit,
      totalProfit: result.totalStats.totalProfit
    });
    
    return result;
  }, [allSalesData, productsData, selectedDate]);

  // Seuil d'alerte pour les crédits (configurable)
  const CREDIT_ALERT_THRESHOLD = 1500; // FBu

  // Calculer les données des 7 derniers jours pour le graphique
  const last7DaysData = useMemo(() => {
    const days = [];
    const today = new Date(selectedDate);
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        fullDate: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      });
    }
    
    return days;
  }, [selectedDate]);

  // Récupérer les ventes des 7 derniers jours
  const { data: last7DaysSalesData } = useSales({
    date_from: last7DaysData[0]?.date,
    date_to: last7DaysData[6]?.date
  });

  // Calculer les stats par jour pour le graphique
  const chartData = useMemo(() => {
    console.log('📊 DEBUG chartData:', {
      last7DaysSalesData: last7DaysSalesData?.results?.length || 0,
      productsData: productsData?.results?.length || 0,
      dateRange: `${last7DaysData[0]?.date} → ${last7DaysData[6]?.date}`
    });
    
    if (!last7DaysSalesData?.results || !productsData?.results) {
      console.log('⚠️ Données manquantes pour chartData');
      return last7DaysData.map(day => ({
        date: day.fullDate,
        day: day.dayName,
        cash: 0,
        credit: 0,
        total: 0
      }));
    }

    return last7DaysData.map(day => {
      const daySales = last7DaysSalesData.results.filter((sale: any) => {
        const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
        return saleDate === day.date;
      });

      let cashProfit = 0;
      let creditProfit = 0;

      daySales.forEach((sale: any) => {
        const isCreditSale = sale.payment_method === 'credit';
        
        sale.items?.forEach((item: any) => {
          const product = productsData.results.find((p: any) => p.id === (item.product?.id || item.product_id));
          if (product) {
            const quantity = item.quantity || 0;
            const revenue = quantity * (item.unit_price || product.selling_price);
            const cost = quantity * (product.purchase_price || 0);
            const profit = revenue - cost;

            if (isCreditSale) {
              creditProfit += profit;
            } else {
              cashProfit += profit;
            }
          }
        });
      });

      return {
        date: day.fullDate,
        day: day.dayName,
        cash: Math.round(cashProfit),
        credit: Math.round(creditProfit),
        total: Math.round(cashProfit + creditProfit)
      };
    });
  }, [last7DaysSalesData, productsData, last7DaysData]);
  
  // Log final du chartData
  console.log('📈 ChartData final:', chartData);

  // Debug: Afficher les données reçues de l'API
  console.log('DEBUG: detailedReportData:', detailedReportData);
  console.log('DEBUG: detailedLoading:', detailedLoading);
  console.log('DEBUG: detailedError:', detailedError);

  // Debug supplémentaire pour comprendre le problème
  if (detailedReportData) {
    console.log('DEBUG: summary:', (detailedReportData as any).summary);
    console.log('DEBUG: total_sales:', (detailedReportData as any).summary?.total_sales);
    console.log('DEBUG: categories:', Object.keys((detailedReportData as any).categories || {}));
    console.log('DEBUG: condition check:', (detailedReportData as any).summary?.total_sales > 0);
  }

  // Générer les données de rapport à partir des vraies données
  const reportData: DailyReportData = React.useMemo(() => {
    // PRIORITÉ 1: Si on a des données détaillées de l'API, les utiliser
    if (detailedReportData && (detailedReportData as any).summary && (detailedReportData as any).categories) {
      console.log('DEBUG: Using API data with total_sales:', (detailedReportData as any).summary?.total_sales);
      return {
        date: (detailedReportData as any).date || selectedDate,
        products: Object.entries((detailedReportData as any).categories || {}).flatMap(([categoryName, category]: [string, any]) =>
          category.products?.map((p: any) => ({
            id: p.name || 'unknown',
            name: p.name || 'Produit inconnu',
            initialStock: p.stock_initial || 0,
            incoming: p.stock_entree || 0,
            outgoing: p.stock_vendu || 0,
            finalStock: p.stock_restant || 0,
            price: p.prix_unitaire || 0,
            costPrice: p.prix_achat || 0,
            totalSales: p.stock_vendu || 0,
            revenue: p.revenue || ((p.stock_vendu || 0) * (p.prix_vente || 0)),
            totalCost: (p.stock_vendu || 0) * (p.prix_achat || 0),
            profit: p.benefice_total || 0,
            profitMargin: p.marge_unitaire || 0,
            category: categoryName
          })) || []
        ) || [],
        categories: (detailedReportData as any).categories || {},
        totalRevenue: (detailedReportData as any).summary?.total_revenue || 0,
        totalProfit: (detailedReportData as any).summary?.total_profit || 0,
        totalCost: (detailedReportData as any).summary?.total_cost || 0,
        profitMargin: (detailedReportData as any).summary?.profit_margin || 0,
        totalSales: (detailedReportData as any).summary?.total_sales || 0,
        alerts: {
          low_stock: alertsData?.results?.filter((alert: any) => alert.type === 'low_stock') || [],
          out_of_stock: alertsData?.results?.filter((alert: any) => alert.type === 'out_of_stock') || [],
          high_sales: alertsData?.results?.filter((alert: any) => alert.type === 'high_sales') || []
        },
        recommendations: []
      };
    }

    // PRIORITÉ 2: Générer à partir des commandes du jour (données réelles de ventes)
    if (ordersData?.results && ordersData.results.length > 0) {
      console.log('DEBUG: Using orders data with', ordersData.results.length, 'orders');
      console.log('DEBUG: Orders data:', ordersData.results);
      const orders = ordersData.results;
      const products = productsData?.results || [];
      console.log('DEBUG: Products data:', products);

      // Calculer les données par produit à partir des vraies ventes
      const productStats = new Map<string, any>();

      // Initialiser avec les produits existants
      products.forEach((product: any) => {
        const currentStock = product.current_stock || 0;
        productStats.set(product.id.toString(), {
          id: product.id,
          name: product.name,
          initialStock: currentStock + 0, // Stock avant ventes (approximation)
          incoming: 0,
          outgoing: 0, // Sera calculé à partir des ventes
          finalStock: currentStock,
          price: parseFloat(product.selling_price || 0),
          costPrice: parseFloat(product.purchase_price || 0),
          totalSales: 0,
          revenue: 0,
          totalCost: 0,
          profit: 0,
          profitMargin: 0,
          category: product.category?.name || 'Autres'
        });
      });

      // Calculer les ventes réelles à partir des commandes
      let totalRevenue = 0;
      let totalCost = 0;
      let totalSales = 0;

      orders.forEach((order: any) => {
        if (order.status === 'paid' && order.items && order.items.length > 0) { // Seulement les commandes payées avec items
          order.items.forEach((item: any) => {
            const productId = item.product || item.product_id; // item.product est l'ID
            const stats = productStats.get(productId.toString());
            if (stats) {
              const quantity = item.quantity || 0;
              const sellingPrice = stats.price; // Utiliser le prix du produit
              const purchasePrice = stats.costPrice; // Utiliser le prix d'achat du produit

              const itemRevenue = quantity * sellingPrice;
              const itemCost = quantity * purchasePrice;
              const itemProfit = itemRevenue - itemCost;

              stats.outgoing += quantity;
              stats.totalSales += quantity;
              stats.revenue += itemRevenue;
              stats.totalCost += itemCost;
              stats.profit += itemProfit;
              stats.profitMargin = stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0;
              stats.initialStock = stats.finalStock + stats.outgoing; // Recalculer le stock initial

              totalRevenue += itemRevenue;
              totalCost += itemCost;
              totalSales += quantity;
            }
          });
        }
      });

      const productList = Array.from(productStats.values()).filter(p => p.totalSales > 0); // Seulement les produits vendus
      const totalProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      console.log('DEBUG: Final calculations:', {
        totalRevenue,
        totalCost,
        totalProfit,
        totalSales,
        productList: productList.map(p => ({
          name: p.name,
          totalSales: p.totalSales,
          revenue: p.revenue,
          profit: p.profit
        }))
      });

      return {
        date: selectedDate,
        products: productList,
        categories: {},
        totalRevenue,
        totalProfit,
        totalCost,
        profitMargin,
        totalSales,
        alerts: {
          low_stock: alertsData?.results?.filter((alert: any) => alert.type === 'low_stock') || [],
          out_of_stock: alertsData?.results?.filter((alert: any) => alert.type === 'out_of_stock') || [],
          high_sales: alertsData?.results?.filter((alert: any) => alert.type === 'high_sales') || []
        },
        recommendations: []
      };
    }

    // PRIORITÉ 2: Générer à partir des données de produits (même sans commandes)
    if (productsData?.results) {
      console.log('DEBUG: Using products data fallback with', productsData.results.length, 'products');
      const products = productsData.results;
      const orders = ordersData?.results || []; // Utiliser un tableau vide si pas de commandes

      // Calculer les données par produit
      const productStats = new Map<string, any>();

      // Initialiser avec les produits existants
      products.forEach((product: any) => {
        const costPrice = product.purchase_price || (product.selling_price * 0.7) || 0;
        const currentStock = product.current_stock || product.stock || 0;

        productStats.set(product.id, {
          id: product.id,
          name: product.name,
          initialStock: currentStock,
          incoming: 0,
          outgoing: 0,
          finalStock: currentStock,
          price: product.selling_price || 0,
          costPrice: product.purchase_price || 0,
          totalSales: 0,
          revenue: 0,
          totalCost: 0,
          profit: 0,
          profitMargin: 0,
          category: product.category?.name || 'Autres'
        });
      });
      
      // Calculer les ventes à partir des commandes (si disponibles)
      if (orders.length > 0) {
        orders.forEach((order: any) => {
        order.items?.forEach((item: any) => {
          const productId = item.product?.id || item.product_id;
          const stats = productStats.get(productId);
          if (stats) {
            const quantity = item.quantity || 0;
            const itemRevenue = quantity * (item.product?.price || 0);
            const itemCost = quantity * stats.costPrice;
            
            stats.outgoing += quantity;
            stats.totalSales += quantity;
            stats.revenue += itemRevenue;
            stats.totalCost += itemCost;
            stats.profit = stats.revenue - stats.totalCost;
            stats.profitMargin = stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0;
            stats.finalStock = Math.max(0, stats.initialStock - stats.outgoing);
          }
        });
        });
      }
      
      const productList = Array.from(productStats.values());
      
      // Calculer les totaux par catégorie
      const categories = productList.reduce((acc: any, product: any) => {
        if (!acc[product.category]) {
          acc[product.category] = {
            initialStock: 0,
            incoming: 0,
            outgoing: 0,
            finalStock: 0,
            sales: 0,
            revenue: 0,
            profit: 0,
            cost: 0
          };
        }
        
        const cat = acc[product.category];
        cat.initialStock += product.initialStock;
        cat.incoming += product.incoming;
        cat.outgoing += product.outgoing;
        cat.finalStock += product.finalStock;
        cat.sales += product.totalSales;
        cat.revenue += product.revenue;
        cat.profit += product.profit;
        cat.cost += product.totalCost;
        
        return acc;
      }, {});
      
      // Calculer les totaux généraux
      const totalRevenue = productList.reduce((sum, p) => sum + p.revenue, 0);
      const totalProfit = productList.reduce((sum, p) => sum + p.profit, 0);
      const totalCost = productList.reduce((sum, p) => sum + p.totalCost, 0);
      const totalSales = productList.reduce((sum, p) => sum + p.totalSales, 0);
      
      return {
        date: selectedDate,
        products: productList,
        categories,
        totalRevenue,
        totalProfit,
        totalCost,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        totalSales,
        alerts: {
          low_stock: alertsData?.results?.filter((alert: any) => alert.type === 'low_stock') || [],
          out_of_stock: alertsData?.results?.filter((alert: any) => alert.type === 'out_of_stock') || [],
          high_sales: alertsData?.results?.filter((alert: any) => alert.type === 'high_sales') || []
        },
        recommendations: []
      };
    }
    
    // PRIORITÉ 3: Données de test si rien d'autre ne fonctionne
    console.log('DEBUG: Using test data fallback');
    return {
      date: selectedDate,
      products: [
        {
          id: 'test-1',
          name: 'Produit Test 1',
          initialStock: 10,
          incoming: 0,
          outgoing: 2,
          finalStock: 8,
          price: 1000,
          costPrice: 600,
          totalSales: 2,
          revenue: 2000,
          totalCost: 1200,
          profit: 800,
          profitMargin: 40,
          category: 'Test'
        }
      ],
      categories: {
        'Test': {
          initialStock: 10,
          incoming: 0,
          outgoing: 2,
          finalStock: 8,
          totalRevenue: 2000,
          totalProfit: 800,
          totalCost: 1200
        }
      },
      totalRevenue: 2000,
      totalProfit: 800,
      totalCost: 1200,
      profitMargin: 40,
      totalSales: 2,
      alerts: { low_stock: [], out_of_stock: [], high_sales: [] },
      recommendations: []
    };
  }, [detailedReportData, productsData, ordersData, alertsData, selectedDate, refreshKey]);

  // Debug: Afficher le reportData final
  console.log('DEBUG: Final reportData:', reportData);
  console.log('DEBUG: reportData.products.length:', reportData.products.length);

  // Mapper les données des catégories pour l'interface éditable
  const [editableData, setEditableData] = useState<{[key: string]: CategoryData}>(() => {
    const mapped: {[key: string]: CategoryData} = {};
    Object.entries(reportData.categories || {}).forEach(([categoryName, categoryData]: [string, any]) => {
      mapped[categoryName] = {
        initialStock: categoryData.total_initial_stock || categoryData.initialStock || 0,
        incoming: categoryData.incoming || 0,
        outgoing: categoryData.outgoing || categoryData.total_quantity || 0,
        finalStock: categoryData.total_final_stock || categoryData.finalStock || 0,
        revenue: categoryData.total_revenue || categoryData.revenue || 0,
        total_revenue: categoryData.total_revenue || categoryData.revenue || 0,
        sales: categoryData.total_quantity || categoryData.sales || 0,
        profit: categoryData.total_profit || categoryData.profit || 0,
        cost: categoryData.total_cost || categoryData.cost || 0
      };
    });
    return mapped;
  });

  // Mettre à jour editableData quand reportData change
  React.useEffect(() => {
    const mapped: {[key: string]: CategoryData} = {};
    Object.entries(reportData.categories || {}).forEach(([categoryName, categoryData]: [string, any]) => {
      mapped[categoryName] = {
        initialStock: categoryData.total_initial_stock || categoryData.initialStock || 0,
        incoming: categoryData.incoming || 0,
        outgoing: categoryData.outgoing || categoryData.total_quantity || 0,
        finalStock: categoryData.total_final_stock || categoryData.finalStock || 0,
        revenue: categoryData.total_revenue || categoryData.revenue || 0,
        total_revenue: categoryData.total_revenue || categoryData.revenue || 0,
        sales: categoryData.total_quantity || categoryData.sales || 0,
        profit: categoryData.total_profit || categoryData.profit || 0,
        cost: categoryData.total_cost || categoryData.cost || 0
      };
    });
    setEditableData(mapped);
  }, [reportData]);

  const updateCategoryData = (category: string, field: keyof CategoryData, value: number) => {
    setEditableData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  // Gestionnaire de changement de date
  const handleDateChange = (newDate: string) => {
    console.log('DEBUG: Changing date from', selectedDate, 'to', newDate);
    setSelectedDate(newDate);
    // Forcer immédiatement la mise à jour
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 100);
  };

  const saveReport = () => {
    // TODO: Implement save logic
    console.log("Saving daily report:", { date: selectedDate, data: editableData });
  };

  const exportToPDF = () => {
    // Préparer l'impression
    window.print();
  };

  const generatePDF = async () => {
    try {
      // Dynamiquement importer jsPDF pour éviter les problèmes de SSR
      const jsPDFModule = await import('jspdf');
      const doc = new jsPDFModule.default();
      const autoTable = (await import('jspdf-autotable')).default;
      
      // Créer un nouveau document PDF
      
      // Ajouter le titre
      doc.setFontSize(18);
      doc.text('Rapport Journalier Boissons & Cuisine', 14, 22);
      
      // Ajouter la date
      doc.setFontSize(12);
      doc.text(`Date: ${new Date(reportData.date).toLocaleDateString('fr-FR')}`, 14, 30);
      
      // Ajouter le résumé financier Cash vs Crédit
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Résumé Financier', 14, 42);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      // Bénéfice Cash
      doc.setTextColor(16, 185, 129); // Vert
      doc.text(`Bénéfice Réel (Cash): ${salesByPaymentMethod.cashStats.totalProfit.toLocaleString()} FBu`, 14, 50);
      doc.setTextColor(0, 0, 0);
      doc.text(`  Revenu: ${salesByPaymentMethod.cashStats.totalRevenue.toLocaleString()} FBu`, 14, 55);
      doc.text(`  Coût: ${salesByPaymentMethod.cashStats.totalCost.toLocaleString()} FBu`, 14, 60);
      
      // Bénéfice Crédit
      doc.setTextColor(59, 130, 246); // Bleu
      doc.text(`Bénéfice Crédit (À recevoir): ${salesByPaymentMethod.creditStats.totalProfit.toLocaleString()} FBu`, 14, 68);
      doc.setTextColor(0, 0, 0);
      doc.text(`  Revenu: ${salesByPaymentMethod.creditStats.totalRevenue.toLocaleString()} FBu`, 14, 73);
      doc.text(`  Coût: ${salesByPaymentMethod.creditStats.totalCost.toLocaleString()} FBu`, 14, 78);
      
      // Bénéfice Total
      doc.setTextColor(168, 85, 247); // Violet
      doc.text(`Bénéfice Total (Théorique): ${salesByPaymentMethod.totalStats.totalProfit.toLocaleString()} FBu`, 14, 86);
      doc.setTextColor(0, 0, 0);
      
      // Alerte si crédit élevé
      if (salesByPaymentMethod.creditStats.totalProfit > CREDIT_ALERT_THRESHOLD) {
        doc.setTextColor(220, 38, 38); // Rouge
        doc.setFont(undefined, 'bold');
        doc.text(`⚠️ ALERTE: Crédit élevé (> ${CREDIT_ALERT_THRESHOLD.toLocaleString()} FBu)`, 14, 94);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
      }
      
      // Préparer les données pour le tableau
      const tableData = [];
      let currentCategory = '';
      
      reportData.products.forEach(product => {
        if (product.category !== currentCategory) {
          // Ajouter une ligne de catégorie
          tableData.push([{
            content: `Catégorie: ${product.category}`,
            colSpan: 9,
            styles: { fontStyle: 'bold', fillColor: [240, 240, 240] }
          }]);
          currentCategory = product.category;
        }
        
        // Ajouter les données du produit
        tableData.push([
          product.name,
          product.initialStock,
          product.incoming,
          product.outgoing,
          product.totalSales,
          product.finalStock,
          product.totalSales,
          `${product.revenue.toLocaleString()} FBu`,
          `${product.profit.toLocaleString()} FBu`
        ]);
      });
      
      // Ajouter le total général
      const totalRevenue = reportData.products.reduce((sum, product) => sum + product.revenue, 0);
      const totalProfit = reportData.products.reduce((sum, product) => sum + product.profit, 0);
      
      tableData.push([{
        content: 'TOTAL GÉNÉRAL',
        colSpan: 7,
        styles: { fontStyle: 'bold', fillColor: [220, 220, 220] }
      }, 
      `${totalRevenue.toLocaleString()} FBu`, 
      `${totalProfit.toLocaleString()} FBu`]);
      
      // Générer le tableau
      const startY = salesByPaymentMethod.creditStats.totalProfit > CREDIT_ALERT_THRESHOLD ? 100 : 92;
      (autoTable as any)(doc, {
        head: [['Produit', 'Stock Initial', 'Entrées', 'Sorties', 'Consommation', 'Stock Final', 'Ventes', 'CA (FBu)', 'Bénéfice (FBu)']],
        body: tableData,
        startY: startY,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        margin: { top: 40 }
      });
      
      // La section "Rapport Cuisine" a été supprimée
      
      // Ajouter les informations de pied de page
      // Utiliser la méthode appropriée pour obtenir le nombre de pages
      const pageCount = doc.internal.pages ? doc.internal.pages.length - 1 : 0;
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} sur ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
        doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 14, doc.internal.pageSize.height - 10);
      }
      
      // Sauvegarder le PDF
      doc.save(`Rapport_Journalier_${new Date(reportData.date).toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`);
      
      toast({
        title: "PDF généré avec succès",
        description: "Le rapport a été téléchargé",
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive"
      });
    }
  };
  
  const exportToExcel = () => {
    // Simuler l'exportation vers Excel
    alert("Fonctionnalité d'exportation vers Excel sera implémentée prochainement");
    console.log("Exporting daily report to Excel");
  };

  // Exporter les ventes à crédit en PDF
  const exportCreditSalesToPDF = async () => {
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      const doc = new jsPDF();
      
      // Titre
      doc.setFontSize(18);
      doc.text('Ventes à Crédit', 14, 20);
      doc.setFontSize(12);
      doc.text(`Date: ${new Date(selectedDate).toLocaleDateString('fr-FR')}`, 14, 30);
      
      // Statistiques
      const totalSales = filteredCreditSales.length;
      const totalAmount = filteredCreditSales.reduce((sum: number, sale: any) => sum + (parseFloat(sale.total_amount) || 0), 0);
      const unpaid = filteredCreditSales.filter((sale: any) => sale.status !== 'paid').length;
      
      doc.text(`Total ventes: ${totalSales}`, 14, 40);
      doc.text(`Montant total: ${totalAmount.toLocaleString()} FBu`, 14, 47);
      doc.text(`Non payées: ${unpaid}`, 14, 54);
      
      // Tableau
      let y = 65;
      filteredCreditSales.forEach((sale: any, index: number) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${sale.customer_name || 'N/A'} - ${parseFloat(sale.total_amount || 0).toLocaleString()} FBu`, 14, y);
        doc.text(`   Réf: ${sale.reference || `#${sale.id}`} | Statut: ${sale.status === 'paid' ? 'Payée' : 'Non payée'}`, 14, y + 5);
        y += 12;
      });
      
      doc.save(`ventes-credit-${selectedDate}.pdf`);
      
      toast({
        title: "PDF généré",
        description: "Le fichier PDF a été téléchargé avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
      });
    }
  };

  // Exporter les ventes à crédit en Excel
  const exportCreditSalesToExcel = () => {
    try {
      // Créer le contenu CSV
      const headers = ['Heure', 'Référence', 'Client', 'Compte', 'Table', 'Serveur', 'Montant', 'Articles', 'Statut'];
      const rows = filteredCreditSales.map((sale: any) => [
        new Date(sale.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        sale.reference || `#${sale.id}`,
        sale.customer_name || 'N/A',
        sale.credit_account?.account_number || 'N/A',
        sale.table_number ? `Table ${sale.table_number}` : 'N/A',
        sale.server_name || 'N/A',
        parseFloat(sale.total_amount || 0).toLocaleString(),
        sale.items?.length || 0,
        sale.status === 'paid' ? 'Payée' : 'Non payée'
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ventes-credit-${selectedDate}.csv`;
      link.click();
      
      toast({
        title: "Excel généré",
        description: "Le fichier CSV a été téléchargé avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de l\'exportation Excel:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter en Excel",
        variant: "destructive",
      });
    }
  };

  // ✅ SUPPRIMÉ : Le paiement se fait maintenant uniquement sur /credits
  // La synchronisation automatique met à jour la vente via le backend
  // Voir: backend/credits/views.py - add_payment()

  // Générer les catégories de menu à partir des vraies données
  const menuCategories = React.useMemo(() => {
    if (!productsData?.results) return [];
    
    const categoriesMap = new Map<string, { id: number; name: string; examples: string }>();
    let categoryId = 1;
    
    productsData.results.forEach((product: any) => {
      const categoryName = product.category?.name || 'Autres';
      if (!categoriesMap.has(categoryName)) {
        const examples = productsData.results
          .filter((p: any) => (p.category?.name || 'Autres') === categoryName)
          .slice(0, 3)
          .map((p: any) => p.name)
          .join(', ');
          
        categoriesMap.set(categoryName, {
          id: categoryId++,
          name: categoryName,
          examples
        });
      }
    });
    
    return Array.from(categoriesMap.values());
  }, [productsData]);
  
  // Interface pour les produits de cuisine
  interface CuisineProductData {
    id: string;
    name: string;
    unitPrice: number;
    consumption: number;
    purchasePrice: number; // P.A
    sellingPrice: number; // P.V
    margin: number; // MAR
    profit: number; // BENEF
    category: string;
  }

  // Générer les données de cuisine à partir des vraies données de commandes
  const cuisineProducts: CuisineProductData[] = React.useMemo(() => {
    if (!ordersData?.results || !productsData?.results) return [];
    
    const productSales = new Map<string, { quantity: number; revenue: number; product: any }>();
    
    // Calculer les ventes par produit à partir des commandes
    ordersData.results.forEach((order: any) => {
      order.items?.forEach((item: any) => {
        const productId = item.product?.id || item.product_id;
        const existing = productSales.get(productId) || { quantity: 0, revenue: 0, product: item.product };
        existing.quantity += item.quantity || 0;
        existing.revenue += (item.quantity || 0) * (item.product?.price || 0);
        productSales.set(productId, existing);
      });
    });
    
    // Convertir en format CuisineProductData
    return Array.from(productSales.entries()).map(([productId, sales]) => {
      const product = sales.product;
      const costPrice = product?.cost_price || product?.price * 0.7; // Estimation si pas de coût
      const profit = sales.revenue - (sales.quantity * costPrice);
      
      return {
        id: productId,
        name: product?.name || 'Produit inconnu',
        unitPrice: product?.price || 0,
        consumption: sales.quantity,
        purchasePrice: costPrice,
        sellingPrice: product?.price || 0,
        margin: (product?.price || 0) - costPrice,
        profit: profit,
        category: product?.category?.name || 'Autres'
      };
    });
  }, [ordersData, productsData]);
  
  // Calculer les totaux par catégorie pour la cuisine
  const cuisineData = cuisineProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = { sales: 0, revenue: 0 };
    }
    acc[product.category].sales += product.consumption;
    acc[product.category].revenue += product.sellingPrice * product.consumption;
    return acc;
  }, {} as Record<string, { sales: number, revenue: number }>);
  
  const generateRecommendations = () => {
    // TODO: Implement AI recommendations
    console.log("Generating AI recommendations");
  };

  const handleRefresh = () => {
    // refetchReport(); // Désactivé
    refetchDetailed();
    toast({
      title: "Données actualisées",
      description: "Le rapport a été rechargé avec succès.",
    });
  };

  return (
    <>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Rapport quotidien
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Rapport détaillé des activités et stocks du jour
              </p>
            </div>
            <div className="flex flex-wrap gap-2 no-print w-full sm:w-auto">
              <Button variant="outline" onClick={handleRefresh} className="gap-2 flex-1 sm:flex-none">
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
              <Button variant="outline" onClick={exportToPDF} className="gap-2 flex-1 sm:flex-none hidden md:flex">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Imprimer</span>
              </Button>
              <Button variant="outline" onClick={generatePDF} className="gap-2 flex-1 sm:flex-none hidden lg:flex">
                <FileOutput className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button variant="outline" onClick={exportToExcel} className="gap-2 flex-1 sm:flex-none hidden lg:flex">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <Button onClick={saveReport} className="gap-2 flex-1 sm:flex-none">
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Sauvegarder</span>
              </Button>
            </div>
          </div>

          {/* Date Selection */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <label className="font-medium">Date du rapport:</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-auto"
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
                    <p className="text-2xl font-bold">
                      {statsLoading || detailedLoading ? "Chargement..." : `${(reportData.totalRevenue || 0).toLocaleString()} FBu`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-success to-success/80 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bénéfice total</p>
                    <p className="text-2xl font-bold text-success">
                      {statsLoading || detailedLoading ? "Chargement..." : `${(reportData.totalProfit || 0).toLocaleString()} FBu`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Marge: {(reportData.profitMargin || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-success to-success/80 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-success-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total ventes</p>
                    <p className="text-2xl font-bold text-success">{reportData.totalSales || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-warning to-warning/80 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-warning-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Alertes</p>
                    <p className="text-2xl font-bold text-warning">{(reportData.alerts.low_stock?.length || 0) + (reportData.alerts.out_of_stock?.length || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 💰 RÉSUMÉ FINANCIER */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                RÉSUMÉ FINANCIER DU JOUR
              </CardTitle>
              <CardDescription>
                {new Date(selectedDate).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Ventes */}
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Ventes Totales</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    {reportData.totalRevenue?.toLocaleString() || 0} FBu
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reportData.totalSales || 0} transaction(s)
                  </p>
                </div>

                {/* Dépenses */}
                <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">Dépenses</h3>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">
                    -{expensesReport?.summary?.total_amount?.toLocaleString() || 0} FBu
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {expensesReport?.summary?.total_count || 0} dépense(s)
                  </p>
                </div>

                {/* Crédits */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Crédits Net</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {creditsReport?.summary?.transactions?.net_amount?.toLocaleString() || 0} FBu
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {creditsReport?.summary?.transactions?.total_count || 0} transaction(s)
                  </p>
                </div>

                {/* Net */}
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">Net</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">
                    {(
                      (reportData.totalRevenue || 0) - 
                      (expensesReport?.summary?.total_amount || 0) - 
                      Math.abs(creditsReport?.summary?.transactions?.net_amount || 0)
                    ).toLocaleString()} FBu
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Marge: {reportData.profitMargin?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 📊 DÉTAILS VENTES & 💸 DÉPENSES & 💳 CRÉDITS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Dépenses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-orange-500" />
                  Dépenses du Jour
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expensesReport && expensesReport.summary?.total_count > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="font-semibold">Total</span>
                      <span className="text-lg font-bold text-orange-600">
                        {(expensesReport.summary.total_amount || 0).toLocaleString()} FBu
                      </span>
                    </div>
                    <div className="space-y-2">
                      {expensesReport.summary.by_status?.map((status: any) => (
                        <div key={status.status} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground capitalize">
                            {status.status === 'approved' ? '✓ Approuvées' : 
                             status.status === 'pending' ? '⏳ En attente' : 
                             status.status === 'rejected' ? '✗ Rejetées' : status.status}
                          </span>
                          <span className="font-medium">
                            {status.count || 0} ({(status.total || 0).toLocaleString()} FBu)
                          </span>
                        </div>
                      )) || []}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">Aucune dépense</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Crédits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  Crédits du Jour
                </CardTitle>
              </CardHeader>
              <CardContent>
                {creditsReport && creditsReport.summary?.transactions?.total_count > 0 ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {creditsReport.summary.transactions.by_type?.map((type: any) => (
                        <div key={type.transaction_type} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground capitalize">
                            {type.transaction_type === 'debt' ? '📈 Nouvelles dettes' : 
                             type.transaction_type === 'payment' ? '📉 Paiements reçus' : 
                             type.transaction_type}
                          </span>
                          <span className="font-medium">
                            {type.transaction_type === 'debt' ? '+' : '-'}
                            {type.total?.toLocaleString() || 0} FBu
                          </span>
                        </div>
                      )) || []}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="font-semibold">Net</span>
                      <span className="text-lg font-bold text-blue-600">
                        {(creditsReport.summary.transactions.net_amount || 0).toLocaleString()} FBu
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <div className="flex justify-between">
                        <span>Dette totale:</span>
                        <span>{(creditsReport.summary.total_debt || 0).toLocaleString()} FBu</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Comptes actifs:</span>
                        <span>{creditsReport.summary.active_accounts || 0}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">Aucune transaction</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ventes par Mode de Paiement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-500" />
                  Modes de Paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Calculer les montants par méthode de paiement */}
                  {(() => {
                    // Récupérer toutes les ventes du jour
                    const sales = allSalesData?.results || [];
                    
                    // Calculer les montants par méthode
                    const cashAmount = sales
                      .filter(s => s.payment_method === 'cash')
                      .reduce((sum, s) => sum + (s.total_amount || 0), 0);
                    
                    const cardAmount = sales
                      .filter(s => s.payment_method === 'card')
                      .reduce((sum, s) => sum + (s.total_amount || 0), 0);
                    
                    const mobileAmount = sales
                      .filter(s => s.payment_method === 'mobile')
                      .reduce((sum, s) => sum + (s.total_amount || 0), 0);
                    
                    // Note: bank_transfer n'existe pas dans les types actuels
                    // On le garde pour compatibilité future
                    const bankTransferAmount = 0;
                    
                    const creditAmount = sales
                      .filter(s => s.payment_method === 'credit' && s.status !== 'cancelled')
                      .reduce((sum, s) => sum + (s.total_amount || 0), 0);
                    
                    const totalCashMethods = cashAmount + cardAmount + mobileAmount + bankTransferAmount;
                    
                    return (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">💵 Espèces</span>
                          <span className="font-medium text-green-700 dark:text-green-400">
                            {Math.round(cashAmount).toLocaleString()} FBu
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">💳 Carte</span>
                          <span className="font-medium text-green-700 dark:text-green-400">
                            {Math.round(cardAmount).toLocaleString()} FBu
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">📱 Mobile Money</span>
                          <span className="font-medium text-green-700 dark:text-green-400">
                            {Math.round(mobileAmount).toLocaleString()} FBu
                          </span>
                        </div>
                        {bankTransferAmount > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">🏦 Virement</span>
                            <span className="font-medium text-green-700 dark:text-green-400">
                              {Math.round(bankTransferAmount).toLocaleString()} FBu
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm border-t pt-2">
                          <span className="text-muted-foreground font-medium">💰 Total Cash</span>
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {Math.round(totalCashMethods).toLocaleString()} FBu
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">🏦 Crédit (en attente)</span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {Math.round(creditAmount).toLocaleString()} FBu
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-semibold">Total</span>
                          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {Math.round(totalCashMethods + creditAmount).toLocaleString()} FBu
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {(reportData.alerts.low_stock.length > 0 || reportData.alerts.out_of_stock.length > 0 || reportData.alerts.high_sales.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {reportData.alerts.low_stock.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{reportData.alerts.low_stock.length} produit(s)</strong> en stock faible
                  </AlertDescription>
                </Alert>
              )}
              
              {reportData.alerts.out_of_stock.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{reportData.alerts.out_of_stock.length} produit(s)</strong> en rupture de stock
                  </AlertDescription>
                </Alert>
              )}
              
              {reportData.alerts.high_sales.length > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{reportData.alerts.high_sales.length} produit(s)</strong> avec ventes exceptionnelles
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Rapport Journalier avec Onglets */}
          <div className="w-full">
            <Tabs defaultValue="boissons-cuisine" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="boissons-cuisine" className="gap-2">
                  <Package className="h-4 w-4" />
                  Boissons & Cuisine
                </TabsTrigger>
                <TabsTrigger value="ventes-credit" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Ventes à Crédit
                </TabsTrigger>
              </TabsList>

              {/* Onglet Boissons & Cuisine */}
              <TabsContent value="boissons-cuisine">
                <div className="rapport-journalier">
                  <Card>
                    <CardHeader>
                      <CardTitle className="rapport-title">Rapport Journalier Boissons et Cuisine</CardTitle>
                      <CardDescription className="rapport-description">
                        Rapport détaillé des mouvements de stock et ventes par produit du {new Date(reportData.date).toLocaleDateString('fr-FR')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Résumé Financier Cash vs Crédit */}
                      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Bénéfice Réel (Cash) */}
                        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border-2 border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                              <DollarSign className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-green-900 dark:text-green-100">
                                Bénéfice Réel (Cash)
                              </div>
                              <div className="text-xs text-green-700 dark:text-green-300">
                                Argent en caisse
                              </div>
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {salesByPaymentMethod.cashStats.totalProfit.toLocaleString()} FBu
                          </div>
                          <div className="mt-2 text-xs text-green-700 dark:text-green-300 space-y-1">
                            <div className="flex justify-between">
                              <span>Revenu:</span>
                              <span className="font-medium">{salesByPaymentMethod.cashStats.totalRevenue.toLocaleString()} FBu</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Coût:</span>
                              <span className="font-medium">{salesByPaymentMethod.cashStats.totalCost.toLocaleString()} FBu</span>
                            </div>
                          </div>
                        </div>

                        {/* Bénéfice Crédit (À recevoir) */}
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <Clock className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Bénéfice Crédit (À recevoir)
                              </div>
                              <div className="text-xs text-blue-700 dark:text-blue-300">
                                En attente de paiement
                              </div>
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {salesByPaymentMethod.creditStats.totalProfit.toLocaleString()} FBu
                          </div>
                          <div className="mt-2 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                            <div className="flex justify-between">
                              <span>Revenu:</span>
                              <span className="font-medium">{salesByPaymentMethod.creditStats.totalRevenue.toLocaleString()} FBu</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Coût:</span>
                              <span className="font-medium">{salesByPaymentMethod.creditStats.totalCost.toLocaleString()} FBu</span>
                            </div>
                          </div>
                          
                          {/* Alerte si crédit > seuil */}
                          {salesByPaymentMethod.creditStats.totalProfit > CREDIT_ALERT_THRESHOLD && (
                            <div className="mt-3 p-2 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded flex items-start gap-2">
                              <Bell className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-red-800 dark:text-red-200">
                                <p className="font-semibold">⚠️ Crédit élevé</p>
                                <p className="mt-0.5">Dépasse le seuil de {CREDIT_ALERT_THRESHOLD.toLocaleString()} FBu</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bénéfice Total (Théorique) */}
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-10 w-10 bg-purple-500 rounded-full flex items-center justify-center">
                              <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                Bénéfice Total (Théorique)
                              </div>
                              <div className="text-xs text-purple-700 dark:text-purple-300">
                                Cash + Crédit
                              </div>
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {salesByPaymentMethod.totalStats.totalProfit.toLocaleString()} FBu
                          </div>
                          <div className="mt-2 text-xs text-purple-700 dark:text-purple-300 space-y-1">
                            <div className="flex justify-between">
                              <span>Revenu:</span>
                              <span className="font-medium">{salesByPaymentMethod.totalStats.totalRevenue.toLocaleString()} FBu</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Coût:</span>
                              <span className="font-medium">{salesByPaymentMethod.totalStats.totalCost.toLocaleString()} FBu</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Note explicative */}
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-blue-900 dark:text-blue-100">
                            <p className="font-semibold mb-1">💡 Comprendre les bénéfices :</p>
                            <ul className="space-y-1 text-xs">
                              <li>• <strong className="text-green-700 dark:text-green-400">Bénéfice Réel (Cash)</strong> : Argent effectivement reçu en caisse (espèces, carte, mobile money)</li>
                              <li>• <strong className="text-blue-700 dark:text-blue-400">Bénéfice Crédit</strong> : Montant à recevoir des clients ayant acheté à crédit</li>
                              <li>• <strong className="text-purple-700 dark:text-purple-400">Bénéfice Total</strong> : Somme théorique si tous les crédits sont payés</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                  <div className="overflow-x-auto">
                    <Table className="border-collapse w-full">
                      <TableCaption>Rapport du {new Date(reportData.date).toLocaleDateString('fr-FR')}</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead rowSpan={2} className="bg-muted border px-4 py-2">PRODUIT</TableHead>
                          <TableHead rowSpan={2} className="text-center bg-muted border px-4 py-2">Prix Unitaire</TableHead>
                          <TableHead rowSpan={2} className="text-center bg-muted border px-4 py-2">Stock Initial</TableHead>
                          <TableHead rowSpan={2} className="text-center bg-muted border px-4 py-2">Entrée Stock</TableHead>
                          <TableHead rowSpan={2} className="text-center bg-muted border px-4 py-2">Stock Total</TableHead>
                          <TableHead rowSpan={2} className="text-center bg-muted border px-4 py-2">Consommation</TableHead>
                          <TableHead rowSpan={2} className="text-center bg-green-50 dark:bg-green-950 border px-4 py-2">Conso. Cash</TableHead>
                          <TableHead rowSpan={2} className="text-center bg-blue-50 dark:bg-blue-950 border px-4 py-2">Conso. Crédit</TableHead>
                          <TableHead rowSpan={2} className="text-center bg-muted border px-4 py-2">Stock Restant</TableHead>
                          <TableHead rowSpan={2} className="text-center bg-muted border px-4 py-2">P.A.</TableHead>
                          <TableHead rowSpan={2} className="text-center bg-muted border px-4 py-2">P.V.</TableHead>
                          <TableHead rowSpan={2} className="text-center bg-muted border px-4 py-2">Stock Vendu</TableHead>
                          <TableHead rowSpan={2} className="text-center bg-muted border px-4 py-2">MAR</TableHead>
                          <TableHead rowSpan={2} className="text-center bg-muted border px-4 py-2">BENEF</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Grouper les produits par catégorie */}
                        {(() => {
                          // Debug: Afficher les IDs disponibles dans salesByPaymentMethod
                          console.log('🔍 DEBUG salesByPaymentMethod.productStats:');
                          console.log('  - Nombre de produits:', salesByPaymentMethod.productStats.size);
                          console.log('  - IDs disponibles:', Array.from(salesByPaymentMethod.productStats.keys()));
                          console.log('  - Produits avec stats:', Array.from(salesByPaymentMethod.productStats.values()).map(s => ({
                            id: s.id,
                            name: s.name,
                            cashSales: s.cashSales,
                            creditSales: s.creditSales
                          })));
                          
                          console.log('🔍 DEBUG reportData.products:');
                          console.log('  - Nombre de produits:', reportData.products.length);
                          console.log('  - IDs des produits:', reportData.products.map(p => ({ id: p.id, name: p.name })));
                          
                          return null;
                        })()}
                        {Array.from(new Set(reportData.products.map(p => p.category))).map(category => {
                          const categoryProducts = reportData.products.filter(p => p.category === category);
                          const categoryTotals = categoryProducts.reduce(
                            (acc, product) => {
                              return {
                                initialStock: acc.initialStock + product.initialStock,
                                incoming: acc.incoming + product.incoming,
                                outgoing: acc.outgoing + product.outgoing,
                                finalStock: acc.finalStock + product.finalStock,
                                totalSales: acc.totalSales + product.totalSales,
                                revenue: acc.revenue + product.revenue,
                                profit: acc.profit + product.profit
                              };
                            },
                            { initialStock: 0, incoming: 0, outgoing: 0, finalStock: 0, totalSales: 0, revenue: 0, profit: 0 }
                          );
                          
                          return (
                            <React.Fragment key={category}>
                              {/* Titre de la catégorie */}
                              <TableRow>
                                <TableCell colSpan={14} className="bg-primary/10 font-bold border px-4 py-2">
                                  {category}
                                </TableCell>
                              </TableRow>
                              
                              {/* Produits de la catégorie */}
                              {categoryProducts.map((product) => {
                                // Récupérer les stats cash/crédit pour ce produit
                                // Chercher par ID ou par nom
                                let productPaymentStats = salesByPaymentMethod.productStats.get(product.id);
                                
                                // Si pas trouvé par ID, chercher par nom
                                if (!productPaymentStats) {
                                  for (const [key, stats] of salesByPaymentMethod.productStats.entries()) {
                                    if (stats.name === product.name) {
                                      productPaymentStats = stats;
                                      break;
                                    }
                                  }
                                }
                                
                                console.log(`🔍 Produit "${product.name}" (ID: ${product.id}):`, {
                                  foundStats: !!productPaymentStats,
                                  cashSales: productPaymentStats?.cashSales || 0,
                                  creditSales: productPaymentStats?.creditSales || 0
                                });
                                
                                const cashSales = productPaymentStats?.cashSales || 0;
                                const creditSales = productPaymentStats?.creditSales || 0;
                                const cashProfit = productPaymentStats?.cashProfit || 0;
                                const creditProfit = productPaymentStats?.creditProfit || 0;
                                const totalProfit = cashProfit + creditProfit;
                                
                                return (
                                  <TableRow key={product.id} className="hover:bg-muted/30">
                                    <TableCell className="font-medium border px-4 py-2">{product.name}</TableCell>
                                    <TableCell className="text-center border px-4 py-2">
                                      {product.price > 0 ? `${product.price.toLocaleString()} FBu` : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-center border px-4 py-2">{product.initialStock || 0}</TableCell>
                                    <TableCell className="text-center border px-4 py-2">{product.incoming || 0}</TableCell>
                                    <TableCell className="text-center border px-4 py-2">{(product.initialStock || 0) + (product.incoming || 0)}</TableCell>
                                    <TableCell className="text-center border px-4 py-2">{product.outgoing || 0}</TableCell>
                                    
                                    {/* Consommation Cash */}
                                    <TableCell className="text-center bg-green-50 dark:bg-green-950/30 border px-4 py-2">
                                      <span className="font-medium text-green-700 dark:text-green-400">
                                        {cashSales || 0}
                                      </span>
                                    </TableCell>
                                    
                                    {/* Consommation Crédit */}
                                    <TableCell className="text-center bg-blue-50 dark:bg-blue-950/30 border px-4 py-2">
                                      <span className="font-medium text-blue-700 dark:text-blue-400">
                                        {creditSales || 0}
                                      </span>
                                    </TableCell>
                                    
                                    <TableCell className="text-center border px-4 py-2">{product.finalStock || 0}</TableCell>
                                    <TableCell className="text-center border px-4 py-2">
                                      {product.costPrice > 0 ? `${product.costPrice.toLocaleString()} FBu` : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-center border px-4 py-2">
                                      {product.price > 0 ? `${product.price.toLocaleString()} FBu` : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-center border px-4 py-2">{product.totalSales || 0}</TableCell>
                                    <TableCell className="text-center border px-4 py-2">
                                      {product.revenue > 0 ? `${product.revenue.toLocaleString()} FBu` : '0 FBu'}
                                    </TableCell>
                                    
                                    {/* Bénéfice */}
                                    <TableCell className="text-center border px-4 py-2">
                                      {totalProfit > 0 ? `${totalProfit.toLocaleString()} FBu` : '0 FBu'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                              
                              {/* Sous-total de la catégorie */}
                              <TableRow>
                                <TableCell className="font-medium bg-muted/50 border px-4 py-2">Sous-total</TableCell>
                                <TableCell className="text-center bg-muted/50 border px-4 py-2">-</TableCell>
                                <TableCell className="text-center font-medium bg-muted/50 border px-4 py-2">{categoryTotals.initialStock || 0}</TableCell>
                                <TableCell className="text-center font-medium bg-muted/50 border px-4 py-2">{categoryTotals.incoming || 0}</TableCell>
                                <TableCell className="text-center font-medium bg-muted/50 border px-4 py-2">{(categoryTotals.initialStock || 0) + (categoryTotals.incoming || 0)}</TableCell>
                                <TableCell className="text-center font-medium bg-muted/50 border px-4 py-2">{categoryTotals.outgoing || 0}</TableCell>
                                
                                {/* Sous-total Cash */}
                                <TableCell className="text-center font-medium bg-green-50 dark:bg-green-950/30 border px-4 py-2">
                                  <span className="text-green-700 dark:text-green-400">
                                    {categoryProducts.reduce((sum, p) => {
                                      const stats = salesByPaymentMethod.productStats.get(p.id);
                                      return sum + (stats?.cashSales || 0);
                                    }, 0)}
                                  </span>
                                </TableCell>
                                
                                {/* Sous-total Crédit */}
                                <TableCell className="text-center font-medium bg-blue-50 dark:bg-blue-950/30 border px-4 py-2">
                                  <span className="text-blue-700 dark:text-blue-400">
                                    {categoryProducts.reduce((sum, p) => {
                                      const stats = salesByPaymentMethod.productStats.get(p.id);
                                      return sum + (stats?.creditSales || 0);
                                    }, 0)}
                                  </span>
                                </TableCell>
                                
                                <TableCell className="text-center font-medium bg-muted/50 border px-4 py-2">{categoryTotals.finalStock || 0}</TableCell>
                                <TableCell className="text-center bg-muted/50 border px-4 py-2">
                                  {categoryProducts.length > 0 && categoryProducts.some(p => p.costPrice > 0) ?
                                    `${Math.round(categoryProducts.reduce((sum, p) => sum + (p.costPrice || 0), 0) / categoryProducts.length).toLocaleString()} FBu` :
                                    'N/A'
                                  }
                                </TableCell>
                                <TableCell className="text-center bg-muted/50 border px-4 py-2">
                                  {categoryProducts.length > 0 && categoryProducts.some(p => p.price > 0) ?
                                    `${Math.round(categoryProducts.reduce((sum, p) => sum + (p.price || 0), 0) / categoryProducts.length).toLocaleString()} FBu` :
                                    'N/A'
                                  }
                                </TableCell>
                                <TableCell className="text-center font-medium bg-muted/50 border px-4 py-2">{categoryTotals.totalSales || 0}</TableCell>
                                <TableCell className="text-center font-medium bg-muted/50 border px-4 py-2">{(categoryTotals.revenue || 0).toLocaleString()} FBu</TableCell>
                                
                                {/* Sous-total Bénéfice */}
                                <TableCell className="text-center font-medium bg-muted/50 border px-4 py-2">
                                  {(categoryTotals.profit || 0).toLocaleString()} FBu
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })}
                        
                        {/* Total général */}
                        <TableRow>
                          <TableCell className="font-bold bg-primary/20 border px-4 py-2">TOTAL GÉNÉRAL BOISSONS</TableCell>
                          <TableCell className="text-center bg-primary/20 border px-4 py-2">-</TableCell>
                          <TableCell className="text-center font-bold bg-primary/20 border px-4 py-2">
                            {reportData.products.reduce((sum, p) => sum + (p.initialStock || 0), 0)}
                          </TableCell>
                          <TableCell className="text-center font-bold bg-primary/20 border px-4 py-2">
                            {reportData.products.reduce((sum, p) => sum + (p.incoming || 0), 0)}
                          </TableCell>
                          <TableCell className="text-center font-bold bg-primary/20 border px-4 py-2">
                            {reportData.products.reduce((sum, p) => sum + (p.initialStock || 0) + (p.incoming || 0), 0)}
                          </TableCell>
                          <TableCell className="text-center font-bold bg-primary/20 border px-4 py-2">
                            {reportData.products.reduce((sum, p) => sum + (p.outgoing || 0), 0)}
                          </TableCell>
                          
                          {/* Total Cash */}
                          <TableCell className="text-center font-bold bg-green-50 dark:bg-green-950/30 border px-4 py-2">
                            <span className="text-green-700 dark:text-green-400">
                              {Array.from(salesByPaymentMethod.productStats.values()).reduce((sum, stats) => sum + stats.cashSales, 0)}
                            </span>
                          </TableCell>
                          
                          {/* Total Crédit */}
                          <TableCell className="text-center font-bold bg-blue-50 dark:bg-blue-950/30 border px-4 py-2">
                            <span className="text-blue-700 dark:text-blue-400">
                              {Array.from(salesByPaymentMethod.productStats.values()).reduce((sum, stats) => sum + stats.creditSales, 0)}
                            </span>
                          </TableCell>
                          
                          <TableCell className="text-center font-bold bg-primary/20 border px-4 py-2">
                            {reportData.products.reduce((sum, p) => sum + (p.finalStock || 0), 0)}
                          </TableCell>
                          <TableCell className="text-center bg-primary/20 border px-4 py-2">
                            {reportData.products.length > 0 && reportData.products.some(p => p.costPrice > 0) ?
                              `${Math.round(reportData.products.reduce((sum, p) => sum + (p.costPrice || 0), 0) / reportData.products.length).toLocaleString()} FBu` :
                              'N/A'
                            }
                          </TableCell>
                          <TableCell className="text-center bg-primary/20 border px-4 py-2">
                            {reportData.products.length > 0 && reportData.products.some(p => p.price > 0) ?
                              `${Math.round(reportData.products.reduce((sum, p) => sum + (p.price || 0), 0) / reportData.products.length).toLocaleString()} FBu` :
                              'N/A'
                            }
                          </TableCell>
                          <TableCell className="text-center font-bold bg-primary/20 border px-4 py-2">
                            {reportData.products.reduce((sum, p) => sum + (p.totalSales || 0), 0)}
                          </TableCell>
                          <TableCell className="text-center font-bold bg-primary/20 border px-4 py-2">
                            {reportData.products.reduce((sum, p) => sum + (p.revenue || 0), 0).toLocaleString()} FBu
                          </TableCell>
                          
                          {/* Total Bénéfice */}
                          <TableCell className="text-center font-bold bg-primary/20 border px-4 py-2">
                            {reportData.products.reduce((sum, p) => sum + (p.profit || 0), 0).toLocaleString()} FBu
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* La section "Rapport Recettes de Cuisine" a été supprimée */}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Ventes à Crédit */}
          <TabsContent value="ventes-credit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  Détail des Ventes à Crédit
                </CardTitle>
                <CardDescription>
                  Liste complète des ventes à crédit du {new Date(selectedDate).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filtres et Export */}
                <div className="mb-6 space-y-4">
                  {/* Barre de recherche et filtres */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par client, référence ou compte..."
                        value={creditSearchQuery}
                        onChange={(e) => setCreditSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                      {creditSearchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => setCreditSearchQuery('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <Select value={creditAccountFilter} onValueChange={setCreditAccountFilter}>
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Compte crédit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les comptes</SelectItem>
                        {uniqueCreditAccounts.map((account: any) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.number} - {account.customer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={creditStatusFilter} onValueChange={setCreditStatusFilter}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="paid">✅ Payées</SelectItem>
                        <SelectItem value="unpaid">🔴 Non payées</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Boutons d'export */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportCreditSalesToPDF}
                      className="gap-2"
                      disabled={filteredCreditSales.length === 0}
                    >
                      <FileOutput className="h-4 w-4" />
                      Export PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportCreditSalesToExcel}
                      className="gap-2"
                      disabled={filteredCreditSales.length === 0}
                    >
                      <FileText className="h-4 w-4" />
                      Export Excel
                    </Button>
                    <div className="flex-1" />
                    <Badge variant="secondary" className="text-sm">
                      {filteredCreditSales.length} / {creditSalesData?.results?.length || 0} vente(s)
                    </Badge>
                  </div>
                </div>

                {creditSalesData && creditSalesData.results && creditSalesData.results.length > 0 ? (
                  <div className="space-y-4">
                    {/* Statistiques */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ShoppingCart className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-blue-900 dark:text-blue-100">Total Ventes</h3>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">
                          {filteredCreditSales.length}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          transaction(s) à crédit
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <h3 className="font-semibold text-green-900 dark:text-green-100">Montant Total</h3>
                        </div>
                        <p className="text-3xl font-bold text-green-600">
                          {filteredCreditSales.reduce((sum: number, sale: any) => sum + (parseFloat(sale.total_amount) || 0), 0).toLocaleString()} FBu
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          crédit accordé
                        </p>
                      </div>

                      <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-5 w-5 text-orange-600" />
                          <h3 className="font-semibold text-orange-900 dark:text-orange-100">Non Payées</h3>
                        </div>
                        <p className="text-3xl font-bold text-orange-600">
                          {filteredCreditSales.filter((sale: any) => sale.status !== 'paid').length}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          en attente de paiement
                        </p>
                      </div>
                    </div>

                    {/* Tableau des ventes */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Heure</TableHead>
                            <TableHead>Référence</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Compte Crédit</TableHead>
                            <TableHead>Table</TableHead>
                            <TableHead>Serveur</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead className="text-center">Articles</TableHead>
                            <TableHead className="text-center">Statut</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCreditSales.map((sale: any) => (
                            <TableRow key={sale.id} className="hover:bg-muted/50">
                              <TableCell className="font-medium">
                                {new Date(sale.created_at).toLocaleTimeString('fr-FR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {sale.reference || `#${sale.id}`}
                                </code>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  {sale.customer_name || 'Client inconnu'}
                                </div>
                              </TableCell>
                              <TableCell>
                                {sale.credit_account ? (
                                  <Badge variant="outline" className="gap-1">
                                    <CreditCard className="h-3 w-3" />
                                    {sale.credit_account.account_number || `ACC-${sale.credit_account.id}`}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">N/A</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {sale.table_number ? `Table ${sale.table_number}` : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {sale.server_name || 'N/A'}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {parseFloat(sale.total_amount || 0).toLocaleString()} FBu
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">
                                  {sale.items?.length || 0} article(s)
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {sale.status === 'paid' ? (
                                  <Badge variant="default" className="bg-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Payée
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Non payée
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {/* ✅ Bouton "Enregistrer paiement" supprimé */}
                                  {/* Le paiement se fait sur /credits avec synchronisation automatique */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => window.location.href = `/sales-history?sale=${sale.id}`}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Voir
                                  </Button>
                                  {sale.status !== 'paid' && sale.credit_account && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1"
                                      onClick={() => window.location.href = `/credits`}
                                    >
                                      <CreditCard className="h-4 w-4" />
                                      Aller à Crédits
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Aucune vente à crédit</h3>
                    <p className="text-sm text-muted-foreground">
                      Il n'y a pas de ventes à crédit enregistrées pour le {new Date(selectedDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    
    {/* ✅ Dialog de Paiement SUPPRIMÉ */}
    {/* Le paiement se fait maintenant uniquement sur /credits */}
    {/* La synchronisation automatique met à jour la vente via le backend */}
  </>
);
}
