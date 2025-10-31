import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ChefHat,
  AlertTriangle,
  Package,
  DollarSign,
  Clock,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  Utensils,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from "lucide-react";
import { useKitchenDashboard, useIngredients, useCreateIngredient, useSuppliers, useRecipes, useProducts } from "@/hooks/use-api";

// Configuration API dynamique
const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://127.0.0.1:8000/api';
import { formatNumber, formatQuantity, formatUnitPrice } from "@/utils/formatters";
import type { PaginatedResponse } from "@/types/api";

interface StockAlert {
  ingredient: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  severity: 'critical' | 'warning';
}

interface ProductionForecast {
  recipe: string;
  max_portions: number;
  limiting_ingredient: string;
  cost_per_portion: number;
  prep_time: number;
}

interface KitchenData {
  stock_alerts: StockAlert[];
  production_forecast: ProductionForecast[];
  shopping_list: any[];
  profitability_analysis: any[];
  stock_value: {
    total_stock_value: number;
    items: any[];
  };
  summary: {
    critical_alerts: number;
    warning_alerts: number;
    total_stock_value: number;
    items_to_buy: number;
  };
}

export default function Kitchen() {
  const { toast } = useToast();
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    nom: "",
    quantite_restante: "",
    unite: "kg",
    seuil_alerte: "",
    prix_unitaire: "",
    description: "",
    fournisseur: ""
  });
  const [newRecipe, setNewRecipe] = useState({
    plat: "",
    nom_recette: "",
    description: "",
    instructions: "",
    temps_preparation: "",
    portions: "1",
    ingredients: []
  });
  const [showAddIngredientToRecipe, setShowAddIngredientToRecipe] = useState(false);
  const [newRecipeIngredient, setNewRecipeIngredient] = useState({
    ingredient: "",
    quantite_utilisee_par_plat: "",
    unite: "g"
  });

  // États pour la modification des recettes
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showEditRecipe, setShowEditRecipe] = useState(false);
  const [editRecipeData, setEditRecipeData] = useState({
    nom_recette: "",
    description: "",
    instructions: "",
    temps_preparation: "",
    portions: "1",
    ingredients: []
  });
  const [showAddIngredientToEditRecipe, setShowAddIngredientToEditRecipe] = useState(false);
  const [newEditRecipeIngredient, setNewEditRecipeIngredient] = useState({
    ingredient: "",
    quantite_utilisee_par_plat: "",
    unite: "g"
  });

  // Hooks API
  const { data: kitchenData, isLoading: loading, refetch: refetchKitchen } = useKitchenDashboard();
  const { data: ingredientsData, refetch: refetchIngredients } = useIngredients() as { data: PaginatedResponse<any> | any[], refetch: () => void };
  const { data: recipesData, refetch: refetchRecipes } = useRecipes() as { data: PaginatedResponse<any> | any[], refetch: () => void };
  const { data: productsData } = useProducts() as { data: PaginatedResponse<any> | any[] };
  const { data: suppliersData } = useSuppliers() as { data: PaginatedResponse<any> | any[] };
  const createIngredientMutation = useCreateIngredient();

  // Fonction pour ajouter un ingrédient à la recette
  const addIngredientToRecipe = () => {
    if (!newRecipeIngredient.ingredient || !newRecipeIngredient.quantite_utilisee_par_plat) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un ingrédient et saisir une quantité",
        variant: "destructive"
      });
      return;
    }

    const ingredients = Array.isArray(ingredientsData) ? ingredientsData : ingredientsData?.results || [];
    const ingredient = ingredients.find(ing => ing.id.toString() === newRecipeIngredient.ingredient);
    if (!ingredient) return;

    const newIngredient = {
      ingredient: parseInt(newRecipeIngredient.ingredient),
      ingredient_name: ingredient.nom,
      quantite_utilisee_par_plat: parseFloat(newRecipeIngredient.quantite_utilisee_par_plat),
      unite: newRecipeIngredient.unite,
      ingredient_stock: ingredient.quantite_restante,
      ingredient_unit: ingredient.unite
    };

    setNewRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));

    // Reset form
    setNewRecipeIngredient({
      ingredient: "",
      quantite_utilisee_par_plat: "",
      unite: "g"
    });
    setShowAddIngredientToRecipe(false);

    toast({
      title: "Ingrédient ajouté",
      description: `${ingredient.nom} ajouté à la recette`
    });
  };

  // Fonction pour supprimer un ingrédient de la recette
  const removeIngredientFromRecipe = (index) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  // Calculer les statistiques réelles à partir des ingrédients
  const realStats = React.useMemo(() => {
    const ingredients = Array.isArray(ingredientsData) ? ingredientsData : ingredientsData?.results || [];

    if (!ingredients || ingredients.length === 0) {
      return {
        critical_alerts: 0,
        warning_alerts: 0,
        total_stock_value: 0,
        items_to_buy: 0,
        stock_alerts: [],
        shopping_list: []
      };
    }
    let critical_alerts = 0;
    let warning_alerts = 0;
    let total_stock_value = 0;
    let items_to_buy = 0;
    const stock_alerts: any[] = [];
    const shopping_list: any[] = [];

    ingredients.forEach((ingredient: any) => {
      const quantity = parseFloat(ingredient.quantite_restante);
      const threshold = parseFloat(ingredient.seuil_alerte);
      const price = parseFloat(ingredient.prix_unitaire);

      // Calculer la valeur du stock
      total_stock_value += quantity * price;

      // Vérifier les alertes
      if (quantity <= 0) {
        critical_alerts++;
        stock_alerts.push({
          type: 'critical',
          ingredient: ingredient.nom,
          current_stock: quantity,
          threshold: threshold,
          unit: ingredient.unite,
          message: `Rupture de stock: ${ingredient.nom}`
        });
        shopping_list.push({
          ingredient: ingredient.nom,
          needed_quantity: threshold * 2, // Recommander 2x le seuil
          unit: ingredient.unite,
          estimated_cost: threshold * 2 * price,
          priority: 'high'
        });
        items_to_buy++;
      } else if (quantity <= threshold) {
        warning_alerts++;
        stock_alerts.push({
          type: 'warning',
          ingredient: ingredient.nom,
          current_stock: quantity,
          threshold: threshold,
          unit: ingredient.unite,
          message: `Stock faible: ${ingredient.nom} (${quantity} ${ingredient.unite})`
        });
        shopping_list.push({
          ingredient: ingredient.nom,
          needed_quantity: threshold - quantity + threshold, // Compléter + réserve
          unit: ingredient.unite,
          estimated_cost: (threshold - quantity + threshold) * price,
          priority: 'medium'
        });
        items_to_buy++;
      }
    });

    return {
      critical_alerts,
      warning_alerts,
      total_stock_value,
      items_to_buy,
      stock_alerts,
      shopping_list
    };
  }, [ingredientsData]);

  // Fonction pour recalculer automatiquement les prix d'achat
  const handleRecalculatePrices = async () => {
    try {
      const response = await fetch(`${API_URL}/kitchen/recalculate-purchase-prices/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Recalcul réussi !",
          description: `${result.summary.products_updated} produits mis à jour avec les coûts réels des ingrédients`,
          variant: "default",
        });

        // Actualiser les données
        refetchKitchen();
        refetchIngredients();
      } else {
        throw new Error('Erreur lors du recalcul');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de recalculer les prix automatiquement",
        variant: "destructive",
      });
    }
  };

  // Fonctions de gestion du formulaire
  const handleCreateIngredient = async () => {
    try {
      await createIngredientMutation.mutateAsync({
        nom: newIngredient.nom,
        quantite_restante: parseFloat(newIngredient.quantite_restante) || 0,
        unite: newIngredient.unite,
        seuil_alerte: parseFloat(newIngredient.seuil_alerte) || 1,
        prix_unitaire: parseFloat(newIngredient.prix_unitaire) || 0,
        description: newIngredient.description,
        fournisseur: newIngredient.fournisseur ? parseInt(newIngredient.fournisseur) : null
      });

      // Réinitialiser le formulaire
      setNewIngredient({
        nom: "",
        quantite_restante: "",
        unite: "kg",
        seuil_alerte: "",
        prix_unitaire: "",
        description: "",
        fournisseur: ""
      });
      setShowAddIngredient(false);
    } catch (error) {
      console.error('Erreur création ingrédient:', error);
    }
  };

  const refreshData = () => {
    refetchKitchen();
    refetchIngredients();
  };

  // Fonctions pour la modification des recettes
  const startEditingRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setEditRecipeData({
      nom_recette: recipe.nom_recette || "",
      description: recipe.description || "",
      instructions: recipe.instructions || "",
      temps_preparation: recipe.temps_preparation?.toString() || "",
      portions: recipe.portions?.toString() || "1",
      ingredients: recipe.ingredients || []
    });
    setShowEditRecipe(true);
  };

  const addIngredientToEditRecipe = () => {
    if (!newEditRecipeIngredient.ingredient || !newEditRecipeIngredient.quantite_utilisee_par_plat) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un ingrédient et saisir une quantité",
        variant: "destructive"
      });
      return;
    }

    const ingredients = Array.isArray(ingredientsData) ? ingredientsData : ingredientsData?.results || [];
    const selectedIngredient = ingredients.find(
      ing => ing.id === parseInt(newEditRecipeIngredient.ingredient)
    );

    if (!selectedIngredient) {
      toast({
        title: "Erreur",
        description: "Ingrédient non trouvé",
        variant: "destructive"
      });
      return;
    }

    const newIngredient = {
      ingredient: selectedIngredient.id,
      ingredient_name: selectedIngredient.nom,
      quantite_utilisee_par_plat: parseFloat(newEditRecipeIngredient.quantite_utilisee_par_plat),
      unite: selectedIngredient.unite
    };

    setEditRecipeData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));

    setNewEditRecipeIngredient({
      ingredient: "",
      quantite_utilisee_par_plat: "",
      unite: "g"
    });
    setShowAddIngredientToEditRecipe(false);
  };

  const removeIngredientFromEditRecipe = (index) => {
    setEditRecipeData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateRecipe = async () => {
    try {
      // Validation des données avant envoi
      if (!editRecipeData.nom_recette?.trim()) {
        toast({
          title: "Erreur de validation",
          description: "Le nom de la recette est obligatoire",
          variant: "destructive",
        });
        return;
      }

      if (!editRecipeData.ingredients || editRecipeData.ingredients.length === 0) {
        toast({
          title: "Erreur de validation", 
          description: "Au moins un ingrédient est requis",
          variant: "destructive",
        });
        return;
      }

      // Validation des ingrédients
      for (let i = 0; i < editRecipeData.ingredients.length; i++) {
        const ing = editRecipeData.ingredients[i];
        if (!ing.ingredient) {
          toast({
            title: "Erreur de validation",
            description: `Ingrédient ${i + 1}: Sélectionnez un ingrédient`,
            variant: "destructive",
          });
          return;
        }
        if (!ing.quantite_utilisee_par_plat || parseFloat(ing.quantite_utilisee_par_plat) <= 0) {
          toast({
            title: "Erreur de validation",
            description: `Ingrédient ${i + 1}: Quantité invalide`,
            variant: "destructive",
          });
          return;
        }
        if (!ing.unite) {
          toast({
            title: "Erreur de validation",
            description: `Ingrédient ${i + 1}: Unité manquante`,
            variant: "destructive",
          });
          return;
        }
      }

      const updateData = {
        nom_recette: editRecipeData.nom_recette.trim(),
        description: editRecipeData.description || "",
        instructions: editRecipeData.instructions || "",
        temps_preparation: parseInt(editRecipeData.temps_preparation) || 0,
        portions: parseInt(editRecipeData.portions) || 1,
        ingredients: editRecipeData.ingredients.map(ing => ({
          ingredient: parseInt(ing.ingredient),
          quantite_utilisee_par_plat: parseFloat(ing.quantite_utilisee_par_plat),
          unite: ing.unite,
          is_optional: false,
          notes: ""
        }))
      };

      console.log("🔧 UPDATE RECIPE - Données envoyées:", JSON.stringify(updateData, null, 2));

      const response = await fetch(`${API_URL}/kitchen/recipes/${editingRecipe.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Recette modifiée avec succès",
          variant: "default",
        });
        setShowEditRecipe(false);
        setEditingRecipe(null);
        refetchRecipes();
        refetchKitchen();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ UPDATE RECIPE - Error response:", {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("❌ UPDATE RECIPE - Exception:", error);
      toast({
        title: "Erreur",
        description: `Erreur lors de la modification de la recette: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Chargement des données de cuisine...</p>
        </div>
      </div>
    );
  }

  if (!kitchenData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p>Erreur de chargement des données</p>
          <Button onClick={() => {
            refetchKitchen();
            refetchIngredients();
          }} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
            
            {/* En-tête */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <ChefHat className="h-8 w-8" />
                  Gestion de Cuisine
                </h1>
                <p className="text-muted-foreground">Interface technique complète</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={refreshData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
                <Button onClick={handleRecalculatePrices} variant="outline" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Recalculer Prix
                </Button>
                <Dialog open={showAddIngredient} onOpenChange={setShowAddIngredient}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter Ingrédient
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Nouvel Ingrédient</DialogTitle>
                      <DialogDescription>
                        Ajouter un nouvel ingrédient au stock cuisine
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nom">Nom de l'ingrédient *</Label>
                        <Input
                          id="nom"
                          value={newIngredient.nom}
                          onChange={(e) => setNewIngredient(prev => ({...prev, nom: e.target.value}))}
                          placeholder="Ex: Tomates, Oignons..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quantite">Quantité initiale *</Label>
                          <Input
                            id="quantite"
                            type="number"
                            step="0.001"
                            value={newIngredient.quantite_restante}
                            onChange={(e) => setNewIngredient(prev => ({...prev, quantite_restante: e.target.value}))}
                            placeholder="0.000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unite">Unité *</Label>
                          <Select value={newIngredient.unite} onValueChange={(value) => setNewIngredient(prev => ({...prev, unite: value}))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">Kilogramme</SelectItem>
                              <SelectItem value="g">Gramme</SelectItem>
                              <SelectItem value="L">Litre</SelectItem>
                              <SelectItem value="ml">Millilitre</SelectItem>
                              <SelectItem value="piece">Pièce</SelectItem>
                              <SelectItem value="portion">Portion</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="seuil">Seuil d'alerte</Label>
                          <Input
                            id="seuil"
                            type="number"
                            step="0.001"
                            value={newIngredient.seuil_alerte}
                            onChange={(e) => setNewIngredient(prev => ({...prev, seuil_alerte: e.target.value}))}
                            placeholder="1.000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="prix">Prix unitaire (BIF)</Label>
                          <Input
                            id="prix"
                            type="number"
                            step="0.01"
                            value={newIngredient.prix_unitaire}
                            onChange={(e) => setNewIngredient(prev => ({...prev, prix_unitaire: e.target.value}))}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fournisseur">Fournisseur</Label>
                        <Select value={newIngredient.fournisseur} onValueChange={(value) => setNewIngredient(prev => ({...prev, fournisseur: value}))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un fournisseur" />
                          </SelectTrigger>
                          <SelectContent>
                            {(Array.isArray(suppliersData) ? suppliersData : suppliersData?.results || []).map((supplier: any) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newIngredient.description}
                          onChange={(e) => setNewIngredient(prev => ({...prev, description: e.target.value}))}
                          placeholder="Description optionnelle..."
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddIngredient(false)}>
                          Annuler
                        </Button>
                        <Button
                          onClick={handleCreateIngredient}
                          disabled={!newIngredient.nom || createIngredientMutation.isPending}
                        >
                          {createIngredientMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          Créer
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Alertes Critiques</p>
                      <p className="text-2xl font-bold text-destructive">
                        {realStats.critical_alerts}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Alertes Stock</p>
                      <p className="text-2xl font-bold text-orange-500">
                        {realStats.warning_alerts}
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Valeur Stock</p>
                      <p className="text-2xl font-bold text-green-600">
                        {realStats.total_stock_value.toLocaleString()} BIF
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">À Acheter</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {realStats.items_to_buy}
                      </p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Onglets principaux */}
            <Tabs defaultValue="ingredients" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="ingredients" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Ingrédients
                </TabsTrigger>
                <TabsTrigger value="recipes" className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4" />
                  Recettes
                </TabsTrigger>
                <TabsTrigger value="alerts" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alertes Stock
                </TabsTrigger>
                <TabsTrigger value="production" className="flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  Production
                </TabsTrigger>
                <TabsTrigger value="profitability" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Rentabilité
                </TabsTrigger>
                <TabsTrigger value="shopping" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Achats
                </TabsTrigger>
              </TabsList>

              {/* Onglet Alertes Stock */}

              {/* Onglet Ingrédients */}
              <TabsContent value="ingredients" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Stock des Ingrédients
                    </CardTitle>
                    <CardDescription>
                      Gérez votre stock d'ingrédients de cuisine
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(Array.isArray(ingredientsData) ? ingredientsData : ingredientsData?.results || []).length > 0 ? (
                      <div className="space-y-4">
                        {(Array.isArray(ingredientsData) ? ingredientsData : ingredientsData?.results || []).map((ingredient: any) => (
                          <div key={ingredient.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                <Package className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{ingredient.nom}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>Stock: {formatQuantity(ingredient.quantite_restante, ingredient.unite)}</span>
                                  <span>Seuil: {formatQuantity(ingredient.seuil_alerte, ingredient.unite)}</span>
                                  <span>Prix: {formatUnitPrice(ingredient.prix_unitaire, ingredient.unite)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  ingredient.quantite_restante <= 0 ? "destructive" :
                                  ingredient.quantite_restante <= ingredient.seuil_alerte ? "warning" :
                                  "success"
                                }
                              >
                                {ingredient.quantite_restante <= 0 ? "Rupture" :
                                 ingredient.quantite_restante <= ingredient.seuil_alerte ? "Stock faible" :
                                 "OK"}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {(Array.isArray(ingredientsData) ? ingredientsData : ingredientsData?.results || []).length === 0 && (
                          <div className="text-center py-8">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Aucun ingrédient trouvé</p>
                            <p className="text-sm text-muted-foreground">Commencez par ajouter des ingrédients à votre stock</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                        Chargement des ingrédients...
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Recettes */}
              <TabsContent value="recipes" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Gestion des Recettes</h3>
                    <p className="text-muted-foreground">Créer et gérer les recettes des plats</p>
                  </div>
                  <Dialog open={showAddRecipe} onOpenChange={setShowAddRecipe}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle Recette
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Créer une Nouvelle Recette</DialogTitle>
                        <DialogDescription>
                          Associez un plat à ses ingrédients avec les quantités nécessaires
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="plat">Plat associé *</Label>
                            <Select value={newRecipe.plat} onValueChange={(value) => setNewRecipe(prev => ({...prev, plat: value}))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un plat" />
                              </SelectTrigger>
                              <SelectContent>
                                {(Array.isArray(productsData) ? productsData : productsData?.results || []).map((product: any) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="nom_recette">Nom de la recette *</Label>
                            <Input
                              id="nom_recette"
                              value={newRecipe.nom_recette}
                              onChange={(e) => setNewRecipe(prev => ({...prev, nom_recette: e.target.value}))}
                              placeholder="Ex: Riz au Poulet"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newRecipe.description}
                            onChange={(e) => setNewRecipe(prev => ({...prev, description: e.target.value}))}
                            placeholder="Plat traditionnel burundais..."
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="instructions">Instructions de préparation</Label>
                          <Textarea
                            id="instructions"
                            value={newRecipe.instructions}
                            onChange={(e) => setNewRecipe(prev => ({...prev, instructions: e.target.value}))}
                            placeholder="1. Cuire le riz, 2. Préparer le poulet..."
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="temps_preparation">Temps de préparation (min)</Label>
                            <Input
                              id="temps_preparation"
                              type="number"
                              value={newRecipe.temps_preparation}
                              onChange={(e) => setNewRecipe(prev => ({...prev, temps_preparation: e.target.value}))}
                              placeholder="45"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="portions">Nombre de portions</Label>
                            <Input
                              id="portions"
                              type="number"
                              value={newRecipe.portions}
                              onChange={(e) => setNewRecipe(prev => ({...prev, portions: e.target.value}))}
                              placeholder="1"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Ingrédients requis</Label>
                          <div className="text-sm text-muted-foreground mb-2">
                            Ajoutez les ingrédients nécessaires pour cette recette
                          </div>

                          {/* Liste des ingrédients ajoutés */}
                          {newRecipe.ingredients.length > 0 && (
                            <div className="space-y-2 mb-3">
                              {newRecipe.ingredients.map((ingredient, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                  <div className="flex-1">
                                    <span className="font-medium">{ingredient.ingredient_name}</span>
                                    <div className="text-sm text-muted-foreground">
                                      {ingredient.quantite_utilisee_par_plat} {ingredient.unite}
                                      {ingredient.ingredient_stock && (
                                        <span className="ml-2">
                                          (Stock: {ingredient.ingredient_stock} {ingredient.ingredient_unit})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeIngredientFromRecipe(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          <Dialog open={showAddIngredientToRecipe} onOpenChange={setShowAddIngredientToRecipe}>
                            <DialogTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Ajouter Ingrédient
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Ajouter un Ingrédient</DialogTitle>
                                <DialogDescription>
                                  Sélectionnez un ingrédient et définissez la quantité nécessaire
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="ingredient">Ingrédient *</Label>
                                  <Select
                                    value={newRecipeIngredient.ingredient}
                                    onValueChange={(value) => setNewRecipeIngredient(prev => ({...prev, ingredient: value}))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionner un ingrédient" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(Array.isArray(ingredientsData) ? ingredientsData : ingredientsData?.results || []).map((ingredient: any) => (
                                        <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                                          {ingredient.nom} ({ingredient.quantite_restante} {ingredient.unite})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-2">
                                    <Label htmlFor="quantite">Quantité *</Label>
                                    <Input
                                      id="quantite"
                                      type="number"
                                      step="0.1"
                                      value={newRecipeIngredient.quantite_utilisee_par_plat}
                                      onChange={(e) => setNewRecipeIngredient(prev => ({...prev, quantite_utilisee_par_plat: e.target.value}))}
                                      placeholder="300"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="unite">Unité</Label>
                                    <Select
                                      value={newRecipeIngredient.unite}
                                      onValueChange={(value) => setNewRecipeIngredient(prev => ({...prev, unite: value}))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="g">g (grammes)</SelectItem>
                                        <SelectItem value="kg">kg (kilogrammes)</SelectItem>
                                        <SelectItem value="ml">ml (millilitres)</SelectItem>
                                        <SelectItem value="l">l (litres)</SelectItem>
                                        <SelectItem value="piece">pièce(s)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setShowAddIngredientToRecipe(false)}>
                                    Annuler
                                  </Button>
                                  <Button onClick={addIngredientToRecipe}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Ajouter
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setShowAddRecipe(false)}>
                            Annuler
                          </Button>
                          <Button
                            onClick={async () => {
                              try {
                                // Validation
                                if (!newRecipe.plat || !newRecipe.nom_recette) {
                                  toast({
                                    title: "Erreur",
                                    description: "Veuillez remplir les champs obligatoires",
                                    variant: "destructive"
                                  });
                                  return;
                                }

                                if (newRecipe.ingredients.length === 0) {
                                  toast({
                                    title: "Erreur",
                                    description: "Veuillez ajouter au moins un ingrédient",
                                    variant: "destructive"
                                  });
                                  return;
                                }

                                // Préparer les données pour l'API
                                const recipeData = {
                                  plat: parseInt(newRecipe.plat),
                                  nom_recette: newRecipe.nom_recette,
                                  description: newRecipe.description || "",
                                  instructions: newRecipe.instructions || "",
                                  temps_preparation: parseInt(newRecipe.temps_preparation) || 30,
                                  portions: parseInt(newRecipe.portions) || 1,
                                  consume_ingredients: true, // ✅ Consommer les ingrédients lors de la création
                                  ingredients: newRecipe.ingredients.map(ing => ({
                                    ingredient: ing.ingredient,
                                    quantite_utilisee_par_plat: parseFloat(ing.quantite_utilisee_par_plat),
                                    unite: ing.unite,
                                    is_optional: false,
                                    notes: ""
                                  }))
                                };

                                // Appel API pour créer la recette
                                console.log("Données envoyées:", JSON.stringify(recipeData, null, 2));
                                const response = await fetch(`${API_URL}/kitchen/recipes/`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                                  },
                                  body: JSON.stringify(recipeData)
                                });

                                if (response.ok) {
                                  const createdRecipe = await response.json();

                                  toast({
                                    title: "Recette créée",
                                    description: `${createdRecipe.nom_recette} a été créée avec succès`
                                  });

                                  // Reset form
                                  setNewRecipe({
                                    plat: "",
                                    nom_recette: "",
                                    description: "",
                                    instructions: "",
                                    temps_preparation: "",
                                    portions: "1",
                                    ingredients: []
                                  });
                                  setShowAddRecipe(false);

                                  // Refresh data - recettes ET ingrédients
                                  refetchRecipes();
                                  refetchIngredients(); // Rafraîchir aussi les ingrédients

                                } else {
                                  const errorData = await response.json().catch(() => ({}));
                                  
                                  // Logs forcés avec alert pour debug
                                  const debugInfo = {
                                    status: response.status,
                                    errorData: errorData,
                                    sentData: recipeData
                                  };
                                  
                                  console.log("🚨 DEBUG RECIPE ERROR 🚨");
                                  console.log("ErrorData:", errorData);
                                  console.log("SentData:", recipeData);
                                  
                                  // Alert pour forcer l'affichage
                                  alert(`ERREUR 400: ${JSON.stringify(errorData, null, 2)}`);
                                  
                                  // Afficher des messages d'erreur plus détaillés
                                  let errorMessage = "Erreur lors de la création de la recette";
                                  
                                  if (errorData.detail) {
                                    errorMessage = errorData.detail;
                                  } else if (errorData.message) {
                                    errorMessage = errorData.message;
                                  } else if (typeof errorData === 'object') {
                                    // Parcourir les erreurs de validation
                                    const errors = Object.entries(errorData)
                                      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                                      .join('; ');
                                    
                                    if (errors) {
                                      errorMessage = errors;
                                    }
                                  }
                                  
                                  toast({
                                    title: "Erreur",
                                    description: errorMessage,
                                    variant: "destructive"
                                  });
                                }
                              } catch (error) {
                                toast({
                                  title: "Erreur",
                                  description: "Erreur de connexion lors de la création",
                                  variant: "destructive"
                                });
                              }
                            }}
                            disabled={!newRecipe.plat || !newRecipe.nom_recette || newRecipe.ingredients.length === 0}
                          >
                            <ChefHat className="h-4 w-4 mr-2" />
                            Créer Recette
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Liste des recettes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5" />
                      Recettes Disponibles
                    </CardTitle>
                    <CardDescription>
                      Gérez les recettes et leurs coûts de production
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!recipesData ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Chargement des recettes...</p>
                      </div>
                    ) : (Array.isArray(recipesData) ? recipesData : recipesData?.results || []).length === 0 ? (
                      <div className="text-center py-8">
                        <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-semibold text-muted-foreground">Aucune recette disponible</p>
                        <p className="text-muted-foreground">Créez votre première recette pour commencer</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(Array.isArray(recipesData) ? recipesData : recipesData?.results || []).map((recipe: any) => (
                          <Card key={recipe.id} className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-lg">{recipe.nom_recette}</h4>
                                  <p className="text-sm text-muted-foreground">{recipe.plat_name}</p>
                                </div>
                                <Badge variant={recipe.can_be_prepared ? "default" : "destructive"}>
                                  {recipe.can_be_prepared ? "Disponible" : "Indisponible"}
                                </Badge>
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Temps de préparation:</span>
                                  <span>{recipe.temps_preparation || 'N/A'} min</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Portions:</span>
                                  <span>{recipe.portions}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Coût total:</span>
                                  <span className="font-medium">{recipe.total_cost?.toLocaleString() || '0'} BIF</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Ingrédients:</span>
                                  <span>{recipe.ingredients?.length || 0}</span>
                                </div>
                              </div>

                              {recipe.description && (
                                <p className="text-sm text-muted-foreground mt-3 italic">
                                  {recipe.description}
                                </p>
                              )}

                              <div className="flex gap-2 mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEditingRecipe(recipe)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Modifier
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Alertes de Stock</CardTitle>
                    <CardDescription>
                      Ingrédients nécessitant un réapprovisionnement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {realStats.stock_alerts.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-green-600">Tous les stocks sont OK !</p>
                        <p className="text-muted-foreground">Aucune alerte de stock actuellement</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {realStats.stock_alerts.map((alert, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                alert.type === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                              }`} />
                              <div>
                                <h4 className="font-medium">{alert.ingredient}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Stock: {formatQuantity(alert.current_stock, alert.unit)} / Seuil: {formatQuantity(alert.threshold, alert.unit)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'}>
                                {alert.type === 'critical' ? 'Critique' : 'Attention'}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Seuil: {formatQuantity(alert.threshold, alert.unit)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Production */}
              <TabsContent value="production" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Prévisions de Production</CardTitle>
                    <CardDescription>
                      Capacité de production basée sur les stocks actuels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {((kitchenData as any)?.production_forecast || []).map((forecast: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-lg">{forecast.recipe}</h4>
                            <Badge variant="outline">
                              {forecast.max_portions} portions possibles
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Coût par portion</p>
                              <p className="font-medium">{forecast.cost_per_portion.toLocaleString()} BIF</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Temps de préparation</p>
                              <p className="font-medium">{forecast.prep_time} minutes</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Ingrédient limitant</p>
                              <p className="font-medium text-orange-600">{forecast.limiting_ingredient}</p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Capacité de production</span>
                              <span>{forecast.max_portions} / 50 portions</span>
                            </div>
                            <Progress value={(forecast.max_portions / 50) * 100} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Rentabilité */}
              <TabsContent value="profitability" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Analyse de Rentabilité</CardTitle>
                    <CardDescription>
                      Marges et rentabilité des articles du menu
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {((kitchenData as any)?.profitability_analysis || []).slice(0, 10).map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{item.item}</h4>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Prix de vente</p>
                                <p className="font-medium">{item.selling_price.toLocaleString()} BIF</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Coût</p>
                                <p className="font-medium">{item.cost_price.toLocaleString()} BIF</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Marge</p>
                                <Badge variant={item.margin_percentage > 50 ? 'default' : 'secondary'}>
                                  {item.margin_percentage.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Liste d'Achats */}
              <TabsContent value="shopping" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Liste de Courses</CardTitle>
                    <CardDescription>
                      Ingrédients à commander pour maintenir les stocks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {realStats.shopping_list.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-green-600">Aucun achat nécessaire !</p>
                        <p className="text-muted-foreground">Tous les stocks sont suffisants</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {realStats.shopping_list.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{item.ingredient}</h4>
                              <p className="text-sm text-muted-foreground">
                                Priorité: {item.priority === 'high' ? 'Haute' : item.priority === 'medium' ? 'Moyenne' : 'Basse'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatQuantity(item.needed_quantity, item.unit)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ~{formatNumber(item.estimated_cost).toLocaleString()} BIF
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

        {/* Dialog de modification de recette */}
        <Dialog open={showEditRecipe} onOpenChange={setShowEditRecipe}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la Recette</DialogTitle>
            <DialogDescription>
              Modifiez les détails de la recette "{editingRecipe?.nom_recette}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nom-recette">Nom de la recette</Label>
                <Input
                  id="edit-nom-recette"
                  value={editRecipeData.nom_recette}
                  onChange={(e) => setEditRecipeData(prev => ({ ...prev, nom_recette: e.target.value }))}
                  placeholder="Nom de la recette"
                />
              </div>
              <div>
                <Label htmlFor="edit-temps-preparation">Temps de préparation (minutes)</Label>
                <Input
                  id="edit-temps-preparation"
                  type="number"
                  value={editRecipeData.temps_preparation}
                  onChange={(e) => setEditRecipeData(prev => ({ ...prev, temps_preparation: e.target.value }))}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-portions">Nombre de portions</Label>
                <Input
                  id="edit-portions"
                  type="number"
                  value={editRecipeData.portions}
                  onChange={(e) => setEditRecipeData(prev => ({ ...prev, portions: e.target.value }))}
                  placeholder="1"
                />
              </div>
              <div>
                <Label>Plat associé</Label>
                <div className="p-2 bg-muted rounded-md">
                  {editingRecipe?.plat_name || 'N/A'}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editRecipeData.description}
                onChange={(e) => setEditRecipeData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de la recette"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-instructions">Instructions</Label>
              <Textarea
                id="edit-instructions"
                value={editRecipeData.instructions}
                onChange={(e) => setEditRecipeData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="1. Étape 1&#10;2. Étape 2&#10;3. Étape 3"
                rows={4}
              />
            </div>

            {/* Gestion des ingrédients */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Ingrédients de la recette</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddIngredientToEditRecipe(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Ingrédient
                </Button>
              </div>

              {/* Liste des ingrédients */}
              {editRecipeData.ingredients.length > 0 ? (
                <div className="space-y-2">
                  {editRecipeData.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{ingredient.ingredient_name}</span>
                        <span className="text-muted-foreground ml-2">
                          {ingredient.quantite_utilisee_par_plat} {ingredient.unite}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIngredientFromEditRecipe(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Aucun ingrédient ajouté</p>
                </div>
              )}

              {/* Dialog d'ajout d'ingrédient */}
              <Dialog open={showAddIngredientToEditRecipe} onOpenChange={setShowAddIngredientToEditRecipe}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un Ingrédient</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Ingrédient</Label>
                      <Select
                        value={newEditRecipeIngredient.ingredient}
                        onValueChange={(value) => {
                          const ingredients = Array.isArray(ingredientsData) ? ingredientsData : ingredientsData?.results || [];
                          const selectedIng = ingredients.find(ing => ing.id === parseInt(value));
                          setNewEditRecipeIngredient(prev => ({
                            ...prev,
                            ingredient: value,
                            unite: selectedIng?.unite || "g"
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un ingrédient" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Array.isArray(ingredientsData) ? ingredientsData : ingredientsData?.results || []).map((ingredient) => (
                            <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                              {ingredient.nom} ({ingredient.quantite_restante} {ingredient.unite})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Quantité</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={newEditRecipeIngredient.quantite_utilisee_par_plat}
                          onChange={(e) => setNewEditRecipeIngredient(prev => ({ ...prev, quantite_utilisee_par_plat: e.target.value }))}
                          placeholder="250"
                        />
                      </div>
                      <div>
                        <Label>Unité</Label>
                        <div className="p-2 bg-muted rounded-md">
                          {newEditRecipeIngredient.unite}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddIngredientToEditRecipe(false)}>
                        Annuler
                      </Button>
                      <Button onClick={addIngredientToEditRecipe}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditRecipe(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateRecipe}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
