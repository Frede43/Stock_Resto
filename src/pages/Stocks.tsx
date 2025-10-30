import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Edit,
  History,
  Plus,
  Minus,
  Search,
  Filter,
  ChefHat,
  DollarSign
} from "lucide-react";
import { useProducts, useStockSummary, useLowStock, useStockMovements, useIngredients } from "@/hooks/use-api";
import { Product } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

interface StockItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  lastMovement: {
    type: "in" | "out";
    quantity: number;
    date: string;
    reason: string;
  };
  status: "ok" | "low" | "critical" | "excess";
}

// Fonction pour mapper les produits de l'API vers l'affichage des stocks
const mapProductToStockItem = (product: Product): StockItem => {
  const getStockStatus = (current: number, min: number): StockItem["status"] => {
    if (current <= 0) return "critical";
    if (current <= min) return "low";
    if (current > min * 3) return "excess";
    return "ok";
  };

  return {
    id: product.id.toString(),
    name: product.name,
    category: product.category_name || "Non catégorisé",
    currentStock: product.current_stock,
    minStock: product.minimum_stock,
    maxStock: product.minimum_stock * 5, // Estimation basée sur le stock minimum
    lastMovement: {
      type: "out", // Par défaut, on assume une sortie
      quantity: 0,
      date: product.updated_at || product.created_at,
      reason: "Vente"
    },
    status: getStockStatus(product.current_stock, product.minimum_stock)
  };
};

export default function Stocks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const { toast } = useToast();

  // Récupérer les données des produits depuis l'API
  const {
    data: productsData,
    isLoading,
    error,
    refetch
  } = useProducts();

  // Récupérer les données des ingrédients
  const {
    data: ingredientsData,
    isLoading: ingredientsLoading,
    refetch: refetchIngredients
  } = useIngredients();

  // Récupérer les statistiques
  const { data: stockSummary } = useStockSummary();
  const { data: lowStockItems = [] } = useLowStock();

  // Mapper les produits vers les éléments de stock
  const stockItems: StockItem[] = (productsData as any)?.results
    ? (productsData as any).results.map(mapProductToStockItem)
    : [];
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Obtenir les catégories dynamiquement depuis les données
  const categories = ["all", ...Array.from(new Set(stockItems.map(item => item.category)))];

  const getStatusInfo = (item: StockItem) => {
    if (item.currentStock === 0) {
      return { variant: "destructive" as const, label: "Rupture", color: "text-destructive" };
    } else if (item.currentStock <= item.minStock) {
      return { variant: "destructive" as const, label: "Critique", color: "text-destructive" };
    } else if (item.currentStock <= item.minStock * 1.5) {
      return { variant: "warning" as const, label: "Faible", color: "text-warning" };
    } else if (item.currentStock >= item.maxStock) {
      return { variant: "secondary" as const, label: "Excès", color: "text-secondary" };
    } else {
      return { variant: "success" as const, label: "OK", color: "text-success" };
    }
  };

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStockAdjustment = async () => {
    if (!selectedItem || !adjustmentQuantity || !adjustmentReason) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    try {
      // Récupérer le token depuis le localStorage ou le contexte d'auth
      const token = localStorage.getItem('access_token');

      if (!token) {
        alert('Vous devez être connecté pour effectuer cette action');
        return;
      }

      const response = await fetch('http://localhost:8000/api/inventory/supplies/adjust_stock/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product: selectedItem.id,
          quantity: parseInt(adjustmentQuantity),
          reason: adjustmentReason
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Stock ajusté avec succès: ${result.message}`);

        // Actualiser les données
        refetch();

        // Fermer le dialog
        setSelectedItem(null);
        setAdjustmentQuantity("");
        setAdjustmentReason("");
      } else {
        const error = await response.json();
        console.error('Erreur détaillée:', error);
        alert(`Erreur: ${error.error || 'Échec de l\'ajustement'}`);
      }
    } catch (error) {
      console.error('Erreur ajustement stock:', error);
      alert('Erreur lors de l\'ajustement du stock');
    }
  };

  return (
    <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Gestion des stocks
              </h1>
              <p className="text-muted-foreground">
                Surveillez et gérez vos inventaires en temps réel
              </p>
            </div>
          </div>

          {/* Stats Overview - Produits */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-success to-success/80 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-success-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Produits OK</p>
                    <p className="text-2xl font-bold text-success">
                      {stockItems.filter(item => getStatusInfo(item).label === "OK").length}
                    </p>
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
                    <p className="text-sm text-muted-foreground">Stock faible</p>
                    <p className="text-2xl font-bold text-warning">
                      {stockItems.filter(item => getStatusInfo(item).label === "Faible").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-destructive to-destructive/80 rounded-lg flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-destructive-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Critique</p>
                    <p className="text-2xl font-bold text-destructive">
                      {stockItems.filter(item => getStatusInfo(item).label === "Critique").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valeur Totale</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stockItems.reduce((total, item) => {
                        const product = (productsData as any)?.results?.find((p: any) => p.id.toString() === item.id);
                        return total + (product ? (product.current_stock * product.selling_price) : 0);
                      }, 0).toLocaleString()} BIF
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Ingrédients */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <ChefHat className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ingrédients OK</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(ingredientsData as any)?.results?.filter((ing: any) =>
                        parseFloat(ing.quantite_restante) > parseFloat(ing.seuil_alerte)
                      ).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ingrédients Faibles</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {(ingredientsData as any)?.results?.filter((ing: any) =>
                        parseFloat(ing.quantite_restante) <= parseFloat(ing.seuil_alerte) && parseFloat(ing.quantite_restante) > 0
                      ).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ruptures</p>
                    <p className="text-2xl font-bold text-red-600">
                      {(ingredientsData as any)?.results?.filter((ing: any) =>
                        parseFloat(ing.quantite_restante) <= 0
                      ).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valeur Ingrédients</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(ingredientsData as any)?.results?.reduce((total: number, ing: any) =>
                        total + (parseFloat(ing.quantite_restante) * parseFloat(ing.prix_unitaire)), 0
                      ).toLocaleString() || 0} BIF
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category)}
                      className="whitespace-nowrap"
                    >
                      {category === "all" ? "Toutes" : category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Onglets Produits et Ingrédients */}
          <Tabs defaultValue="produits" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="produits" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produits Finis
              </TabsTrigger>
              <TabsTrigger value="ingredients" className="flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                Ingrédients de Cuisine
              </TabsTrigger>
            </TabsList>

            {/* Onglet Produits */}
            <TabsContent value="produits">
              <Card>
                <CardHeader>
                  <CardTitle>Stock des Produits Finis</CardTitle>
                  <CardDescription>
                    {filteredItems.length} produit(s) trouvé(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="bg-muted border px-4 py-2 text-left">NOM DU PRODUIT</th>
                          <th className="bg-muted border px-4 py-2 text-center">QTÉ</th>
                          <th className="bg-muted border px-4 py-2 text-center">PRIX UNITAIRE</th>
                          <th className="bg-muted border px-4 py-2 text-center">PA (Prix Achat)</th>
                          <th className="bg-muted border px-4 py-2 text-center">PV (Prix Vente)</th>
                          <th className="bg-muted border px-4 py-2 text-center">STATUT</th>
                          <th className="bg-muted border px-4 py-2 text-center">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item) => {
                          const statusInfo = getStatusInfo(item);
                          // Récupérer le produit original pour avoir les prix
                          const originalProduct = (productsData as any)?.results?.find((p: any) => p.id.toString() === item.id);

                          return (
                            <tr key={item.id} className="hover:bg-muted/50">
                              <td className="border px-4 py-2 font-medium">{item.name}</td>
                              <td className="border px-4 py-2 text-center">{item.currentStock}</td>
                              <td className="border px-4 py-2 text-center">
                                {originalProduct?.selling_price?.toLocaleString() || 0} BIF
                              </td>
                              <td className="border px-4 py-2 text-center">
                                {originalProduct?.purchase_price?.toLocaleString() || 0} BIF
                              </td>
                              <td className="border px-4 py-2 text-center">
                                {originalProduct?.selling_price?.toLocaleString() || 0} BIF
                              </td>
                              <td className="border px-4 py-2 text-center">
                                <Badge variant={statusInfo.variant}>
                                  {statusInfo.label}
                                </Badge>
                              </td>
                              <td className="border px-4 py-2 text-center">
                                <div className="flex gap-2 justify-center">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Ajustement de stock</DialogTitle>
                                <DialogDescription>
                                  Modifier le stock pour {item.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Stock actuel: {item.currentStock} unités</Label>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="quantity">Quantité d'ajustement</Label>
                                  <Input
                                    id="quantity"
                                    type="number"
                                    placeholder="Ex: +10 ou -5"
                                    value={adjustmentQuantity}
                                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="reason">Raison de l'ajustement</Label>
                                  <Textarea
                                    id="reason"
                                    placeholder="Expliquez la raison de cet ajustement..."
                                    value={adjustmentReason}
                                    onChange={(e) => setAdjustmentReason(e.target.value)}
                                  />
                                </div>
                                <Button onClick={handleStockAdjustment} className="w-full">
                                  Confirmer l'ajustement
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="outline" size="sm">
                            <History className="h-4 w-4" />
                          </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Ingrédients */}
            <TabsContent value="ingredients">
              <Card>
                <CardHeader>
                  <CardTitle>Stock des Ingrédients de Cuisine</CardTitle>
                  <CardDescription>
                    {(ingredientsData as any)?.results?.length || 0} ingrédient(s) en stock
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ingredientsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Package className="h-6 w-6 animate-spin mr-2" />
                      Chargement des ingrédients...
                    </div>
                  ) : (ingredientsData as any)?.results ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="bg-muted border px-4 py-2 text-left">NOM INGRÉDIENT</th>
                            <th className="bg-muted border px-4 py-2 text-center">PU (Prix Unitaire)</th>
                            <th className="bg-muted border px-4 py-2 text-center">ENTRÉE</th>
                            <th className="bg-muted border px-4 py-2 text-center">SORTIE</th>
                            <th className="bg-muted border px-4 py-2 text-center">STOCK FINAL</th>
                            <th className="bg-muted border px-4 py-2 text-center">VALEUR STOCK</th>
                            <th className="bg-muted border px-4 py-2 text-center">STATUT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(ingredientsData as any)?.results?.map((ingredient: any) => (
                            <tr key={ingredient.id} className="hover:bg-muted/50">
                              <td className="border px-4 py-2 font-medium">{ingredient.nom}</td>
                              <td className="border px-4 py-2 text-center">
                                {ingredient.prix_unitaire.toLocaleString()} BIF/{ingredient.unite}
                              </td>
                              <td className="border px-4 py-2 text-center text-green-600">
                                +0 {ingredient.unite} {/* À remplacer par les vraies données d'entrée */}
                              </td>
                              <td className="border px-4 py-2 text-center text-red-600">
                                -0 {ingredient.unite} {/* À remplacer par les vraies données de sortie */}
                              </td>
                              <td className="border px-4 py-2 text-center font-medium">
                                {ingredient.quantite_restante} {ingredient.unite}
                              </td>
                              <td className="border px-4 py-2 text-center">
                                {(ingredient.quantite_restante * ingredient.prix_unitaire).toLocaleString()} BIF
                              </td>
                              <td className="border px-4 py-2 text-center">
                                <Badge
                                  variant={
                                    ingredient.quantite_restante <= 0 ? 'destructive' :
                                    ingredient.quantite_restante <= ingredient.seuil_alerte ? 'warning' :
                                    'success'
                                  }
                                >
                                  {ingredient.quantite_restante <= 0 ? 'Rupture' :
                                   ingredient.quantite_restante <= ingredient.seuil_alerte ? 'Stock faible' :
                                   'OK'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun ingrédient trouvé</p>
                      <p className="text-sm text-muted-foreground">Ajoutez des ingrédients dans la section Cuisine</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
  );
}
