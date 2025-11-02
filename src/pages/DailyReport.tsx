import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  ChefHat
} from "lucide-react";
import { useDailyReport, useDashboardStats, useDailyDetailedReport, useProducts, useOrders, useAlerts, useKitchenReport, useRecipes } from "@/hooks/use-api";

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
      doc.text('Rapport Journalier Boissons', 14, 22);
      
      // Ajouter la date
      doc.setFontSize(12);
      doc.text(`Date: ${new Date(reportData.date).toLocaleDateString('fr-FR')}`, 14, 30);
      
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
      (autoTable as any)(doc, {
        head: [['Produit', 'Stock Initial', 'Entrées', 'Sorties', 'Consommation', 'Stock Final', 'Ventes', 'CA (FBu)', 'Bénéfice (FBu)']],
        body: tableData,
        startY: 40,
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

          {/* Rapport Journalier Unique */}
          <div className="w-full">

            {/* Rapport Journalier Unique */}
            <div className="rapport-journalier">
              <Card>
                <CardHeader>
                  <CardTitle className="rapport-title">Rapport Journalier Boissons et Cuisine</CardTitle>
                  <CardDescription className="rapport-description">
                    Rapport détaillé des mouvements de stock et ventes par produit du {new Date(reportData.date).toLocaleDateString('fr-FR')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                                <TableCell colSpan={12} className="bg-primary/10 font-bold border px-4 py-2">
                                  {category}
                                </TableCell>
                              </TableRow>
                              
                              {/* Produits de la catégorie */}
                              {categoryProducts.map((product) => (
                                <TableRow key={product.id} className="hover:bg-muted/30">
                                  <TableCell className="font-medium border px-4 py-2">{product.name}</TableCell>
                                  <TableCell className="text-center border px-4 py-2">
                                    {product.price > 0 ? `${product.price.toLocaleString()} FBu` : 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-center border px-4 py-2">{product.initialStock || 0}</TableCell>
                                  <TableCell className="text-center border px-4 py-2">{product.incoming || 0}</TableCell>
                                  <TableCell className="text-center border px-4 py-2">{(product.initialStock || 0) + (product.incoming || 0)}</TableCell>
                                  <TableCell className="text-center border px-4 py-2">{product.outgoing || 0}</TableCell>
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
                                  <TableCell className="text-center border px-4 py-2">
                                    {product.profit > 0 ? `${product.profit.toLocaleString()} FBu` : '0 FBu'}
                                  </TableCell>
                                </TableRow>
                              ))}
                              
                              {/* Sous-total de la catégorie */}
                              <TableRow>
                                <TableCell className="font-medium bg-muted/50 border px-4 py-2">Sous-total</TableCell>
                                <TableCell className="text-center bg-muted/50 border px-4 py-2">-</TableCell>
                                <TableCell className="text-center font-medium bg-muted/50 border px-4 py-2">{categoryTotals.initialStock || 0}</TableCell>
                                <TableCell className="text-center font-medium bg-muted/50 border px-4 py-2">{categoryTotals.incoming || 0}</TableCell>
                                <TableCell className="text-center font-medium bg-muted/50 border px-4 py-2">{(categoryTotals.initialStock || 0) + (categoryTotals.incoming || 0)}</TableCell>
                                <TableCell className="text-center font-medium bg-muted/50 border px-4 py-2">{categoryTotals.outgoing || 0}</TableCell>
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
                                <TableCell className="text-center font-medium bg-muted/50 border px-4 py-2">{(categoryTotals.profit || 0).toLocaleString()} FBu</TableCell>
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
          </div>
      </div>
    </>
  );
}
