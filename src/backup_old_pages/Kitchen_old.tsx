import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChefHat, 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useKitchenDashboard, useIngredients, useRecipes } from "@/hooks/use-api";
import { Ingredient, Recipe, KitchenDashboard } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export default function Kitchen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const { toast } = useToast();

  // Utiliser les hooks React Query pour charger les données
  const {
    data: dashboard,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useKitchenDashboard();

  // Charger les ingrédients
  const {
    data: ingredientsData,
    isLoading: ingredientsLoading,
    error: ingredientsError,
    refetch: refetchIngredients
  } = useIngredients();

  // Charger les recettes
  const {
    data: recipesData,
    isLoading: recipesLoading,
    error: recipesError,
    refetch: refetchRecipes
  } = useRecipes();

  // Mapper les données des ingrédients
  const ingredients: Ingredient[] = (ingredientsData as any)?.results || [];
  
  // Mapper les données des recettes
  const recipes: Recipe[] = (recipesData as any)?.results || [];
  
  const loading = dashboardLoading || ingredientsLoading || recipesLoading;

  // Fonction pour actualiser les données
  const handleRefresh = () => {
    refetchDashboard();
    refetchIngredients();
    refetchRecipes();
    toast({
      title: "Actualisation",
      description: "Données de la cuisine actualisées",
      variant: "default",
    });
  };

  // Afficher les erreurs si nécessaire
  useEffect(() => {
    if (dashboardError || ingredientsError || recipesError) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de la cuisine. Vérifiez votre connexion.",
        variant: "destructive",
      });
    }
  }, [dashboardError, ingredientsError, recipesError, toast]);

  const getIngredientStatusInfo = (ingredient: Ingredient) => {
    if (ingredient.is_out_of_stock) {
      return { variant: "destructive" as const, label: "Rupture", icon: "🔴" };
    } else if (ingredient.is_low_stock) {
      return { variant: "warning" as const, label: "Stock faible", icon: "🟡" };
    } else {
      return { variant: "success" as const, label: "OK", icon: "🟢" };
    }
  };

  const getRecipeStatusInfo = (recipe: Recipe) => {
    if (!recipe.is_active) {
      return { variant: "secondary" as const, label: "Inactive", icon: "⚫" };
    } else if (recipe.can_be_prepared) {
      return { variant: "success" as const, label: "Disponible", icon: "✅" };
    } else {
      return { variant: "destructive" as const, label: "Indisponible", icon: "❌" };
    }
  };

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRecipes = recipes.filter(recipe =>
    recipe.nom_recette.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.plat_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des données cuisine...</p>
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
                🍽️ Gestion de Cuisine
              </h1>
              <p className="text-muted-foreground">
                Ingrédients, recettes et préparations
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={handleRefresh} variant="outline" className="gap-2" disabled={loading}>
                <TrendingUp className="h-4 w-4" />
                {loading ? "Actualisation..." : "Actualiser"}
              </Button>
            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
              <TabsTrigger value="ingredients">Ingrédients</TabsTrigger>
              <TabsTrigger value="recipes">Recettes</TabsTrigger>
            </TabsList>

            {/* Tableau de bord */}
            <TabsContent value="dashboard" className="space-y-6">
              {dashboard && (
                <>
                  {/* Statistiques principales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Ingrédients</p>
                            <p className="text-2xl font-bold">{dashboard.stats.total_ingredients}</p>
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
                            <p className="text-sm text-muted-foreground">Alertes stock</p>
                            <p className="text-2xl font-bold">{dashboard.stats.low_stock_count}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
                            <ChefHat className="h-6 w-6 text-success" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Recettes</p>
                            <p className="text-2xl font-bold">{dashboard.stats.total_recipes}</p>
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
                            <p className="text-sm text-muted-foreground">Valeur stock</p>
                            <p className="text-2xl font-bold">{dashboard.stats.total_stock_value ? dashboard.stats.total_stock_value.toLocaleString() : '0'} BIF</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Mouvements récents */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Mouvements récents</CardTitle>
                      <CardDescription>
                        Dernières activités sur les ingrédients
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboard.recent_movements.map((movement) => (
                          <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                movement.movement_type === 'in' ? 'bg-success/20 text-success' :
                                movement.movement_type === 'out' ? 'bg-destructive/20 text-destructive' :
                                'bg-warning/20 text-warning'
                              }`}>
                                {movement.movement_type === 'in' ? '+' : movement.movement_type === 'out' ? '-' : '~'}
                              </div>
                              <div>
                                <p className="font-medium">{movement.ingredient_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {movement.reason_display} • {movement.user_name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {movement.movement_type === 'out' ? '-' : '+'}{movement.quantity}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(movement.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Ingrédients */}
            <TabsContent value="ingredients" className="space-y-6">
              {/* Barre de recherche */}
              <Card>
                <CardContent className="pt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un ingrédient..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Liste des ingrédients */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ingredientsLoading ? (
                  <div className="col-span-full text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Chargement des ingrédients...</p>
                  </div>
                ) : filteredIngredients.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? "Aucun ingrédient trouvé" : "Aucun ingrédient disponible"}
                    </p>
                  </div>
                ) : (
                  filteredIngredients.map((ingredient) => {
                  const statusInfo = getIngredientStatusInfo(ingredient);
                  return (
                    <Card key={ingredient.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{ingredient.nom}</h3>
                            <p className="text-sm text-muted-foreground">
                              {ingredient.fournisseur_name || 'Aucun fournisseur'}
                            </p>
                          </div>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.icon} {statusInfo.label}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Stock actuel:</span>
                            <span className="font-medium">
                              {ingredient.quantite_restante} {ingredient.unite}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Prix unitaire:</span>
                            <span className="text-sm text-muted-foreground">
                              {ingredient.prix_unitaire ? ingredient.prix_unitaire.toLocaleString() : '0'} BIF/{ingredient.unite}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Seuil d'alerte:</span>
                            <span className="text-sm text-muted-foreground">
                              {ingredient.seuil_alerte} {ingredient.unite}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Valeur stock:</span>
                            <span className="font-medium">
                              {ingredient.stock_value ? ingredient.stock_value.toLocaleString() : '0'} BIF
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                  })
                )}
              </div>
            </TabsContent>

            {/* Recettes */}
            <TabsContent value="recipes" className="space-y-6">
              {/* Barre de recherche */}
              <Card>
                <CardContent className="pt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une recette..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Liste des recettes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recipesLoading ? (
                  <div className="col-span-full text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Chargement des recettes...</p>
                  </div>
                ) : filteredRecipes.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? "Aucune recette trouvée" : "Aucune recette disponible"}
                    </p>
                  </div>
                ) : (
                  filteredRecipes.map((recipe) => {
                  const statusInfo = getRecipeStatusInfo(recipe);
                  return (
                    <Card key={recipe.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{recipe.nom_recette}</h3>
                            <p className="text-sm text-muted-foreground">
                              {recipe.plat_name}
                            </p>
                          </div>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.icon} {statusInfo.label}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between">
                            <span className="text-sm">Ingrédients:</span>
                            <span className="font-medium">{recipe.ingredients ? recipe.ingredients.length : 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Temps préparation:</span>
                            <span className="text-sm text-muted-foreground">
                              {recipe.temps_preparation ? `${recipe.temps_preparation} min` : 'Non défini'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Coût total:</span>
                            <span className="font-medium">
                              {recipe.total_cost ? recipe.total_cost.toLocaleString() : '0'} BIF
                            </span>
                          </div>
                        </div>

                        {recipe.missing_ingredients && recipe.missing_ingredients.length > 0 && (
                          <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                            <p className="text-sm font-medium text-destructive mb-2">
                              Ingrédients manquants:
                            </p>
                            <div className="space-y-1">
                              {recipe.missing_ingredients?.map((missing, index) => (
                                <p key={index} className="text-xs text-destructive">
                                  • {missing.ingredient}: {missing.shortage} {missing.unit}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
