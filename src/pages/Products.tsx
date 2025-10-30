import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  DollarSign,
  BarChart3,
  Loader2,
  FolderPlus
} from "lucide-react";
import { useProducts, useCreateProduct, useUpdateProduct, useCategories, useCreateCategory } from "@/hooks/use-api";
import { Product } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

// Interface locale pour l'affichage (mapping depuis l'API)
interface ProductDisplay {
  id: number;
  name: string;
  category: string;
  categoryId: number; // Ajout de l'ID de catégorie
  categoryType: 'boissons' | 'plats' | 'snacks';
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  status: "ok" | "low" | "critical";
  unit: string;
}

// Fonction pour mapper les données de l'API vers l'affichage
const mapProductToDisplay = (product: Product): ProductDisplay => {
  const stock = product.current_stock;
  const minStock = product.minimum_stock;

  let status: "ok" | "low" | "critical" = "ok";
  if (stock === 0) {
    status = "critical";
  } else if (stock <= minStock) {
    status = "low";
  }

  return {
    id: product.id,
    name: product.name,
    category: product.category_name || "Non catégorisé",
    categoryId: product.category, // Stocker l'ID de catégorie
    categoryType: product.category_type || 'boissons',
    buyPrice: product.purchase_price,
    sellPrice: product.selling_price,
    stock: stock,
    minStock: minStock,
    status: status,
    unit: product.unit
  };
};

// Fonction pour formater l'affichage du stock selon le type de produit
const formatStockDisplay = (product: ProductDisplay): string => {
  if (product.categoryType === 'boissons') {
    // Pour les boissons, afficher le stock disponible avec l'unité
    const unitLabel = product.unit === 'bouteille' ? 'bouteilles' :
                     product.unit === 'piece' ? 'pièces' :
                     product.unit === 'litre' ? 'litres' :
                     product.unit === 'canette' ? 'canettes' : product.unit;
    return `Disponible : ${product.stock} ${unitLabel}`;
  } else {
    // Pour les plats, ne pas afficher les quantités d'ingrédients
    return "Plat disponible";
  }
};

// Fonction pour obtenir l'icône selon le type de produit
const getProductIcon = (categoryType: 'boissons' | 'plats' | 'snacks'): string => {
  switch (categoryType) {
    case 'boissons': return '🍺';
    case 'plats': return '🍽️';
    case 'snacks': return '🍿';
    default: return '📦';
  }
};

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDisplay | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    purchase_price: "",
    selling_price: "",
    current_stock: "",
    minimum_stock: "",
    unit: "piece",
    description: ""
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    type: "boissons"
  });
  const { toast } = useToast();

  // Hooks API
  const {
    data: productsData,
    isLoading,
    error,
    refetch
  } = useProducts({
    search: searchTerm || undefined,
    category: selectedCategory !== "all" && !isNaN(parseInt(selectedCategory)) ? parseInt(selectedCategory) : undefined
  });

  // Récupérer les catégories depuis l'API
  const { data: categoriesData, refetch: refetchCategories } = useCategories();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const createCategoryMutation = useCreateCategory();

  // Mapper les données de l'API
  const products: ProductDisplay[] = productsData && typeof productsData === 'object' && productsData !== null && 'results' in productsData && Array.isArray(productsData.results)
    ? productsData.results.map(mapProductToDisplay)
    : [];

  // Extraire les catégories depuis l'API
  const categories = useMemo(() => {
    const apiCategories = categoriesData?.results?.map(cat => cat.name) || [];
    return ["all", ...apiCategories];
  }, [categoriesData]);

  const getStatusVariant = (status: ProductDisplay["status"]) => {
    switch (status) {
      case "ok": return "success" as const;
      case "low": return "warning" as const;
      case "critical": return "destructive" as const;
    }
  };

  const getStatusLabel = (status: ProductDisplay["status"]) => {
    switch (status) {
      case "ok": return "En stock";
      case "low": return "Stock faible";
      case "critical": return "Stock critique";
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const calculateMargin = (buyPrice: number, sellPrice: number) => {
    if (!buyPrice || buyPrice === 0) return 0;
    return Math.round(((sellPrice - buyPrice) / buyPrice) * 100);
  };

  const handleCreateProduct = () => {
    const productData = {
      name: newProduct.name,
      category: categoriesData?.results?.find(cat => cat.name === newProduct.category)?.id || 1,
      purchase_price: parseFloat(newProduct.purchase_price),
      selling_price: parseFloat(newProduct.selling_price),
      current_stock: parseFloat(newProduct.current_stock),
      minimum_stock: parseFloat(newProduct.minimum_stock),
      unit: newProduct.unit,
      description: newProduct.description
    };

    createProductMutation.mutate(productData, {
      onSuccess: () => {
        setShowNewProductDialog(false);
        setNewProduct({
          name: "",
          category: "",
          purchase_price: "",
          selling_price: "",
          current_stock: "",
          minimum_stock: "",
          unit: "piece",
          description: ""
        });
        refetch();
      }
    });
  };

  const handleEditProduct = (product: ProductDisplay) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      category: product.category,
      purchase_price: product.buyPrice.toString(),
      selling_price: product.sellPrice.toString(),
      current_stock: product.stock.toString(),
      minimum_stock: product.minStock.toString(),
      unit: product.unit,
      description: ""
    });
    setShowEditDialog(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    try {
      const productData = {
        name: newProduct.name,
        category: categoriesData?.results?.find(cat => cat.name === newProduct.category)?.id || editingProduct.categoryId,
        purchase_price: parseFloat(newProduct.purchase_price),
        selling_price: parseFloat(newProduct.selling_price),
        current_stock: parseFloat(newProduct.current_stock),
        minimum_stock: parseFloat(newProduct.minimum_stock),
        unit: newProduct.unit,
        description: newProduct.description
      };

      await updateProductMutation.mutateAsync({ id: editingProduct.id, data: productData });
      setShowEditDialog(false);
      setEditingProduct(null);
      refetch();
    } catch (error) {
      console.error('Erreur mise à jour produit:', error);
    }
  };

  const handleCreateCategory = async () => {
    try {
      await createCategoryMutation.mutateAsync({
        name: newCategory.name,
        description: newCategory.description,
        type: newCategory.type
      });
      
      // Reset form
      setNewCategory({
        name: "",
        description: "",
        type: "boissons"
      });
      
      setShowNewCategoryDialog(false);
      refetchCategories();
      
      toast({
        title: "Succès",
        description: "Catégorie créée avec succès",
        variant: "default",
      });
    } catch (error) {
      console.error('Erreur création catégorie:', error);
    }
  };

  return (
    <main className="flex-1 p-6 space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Gestion des produits
              </h1>
              <p className="text-muted-foreground">
                Gérez votre inventaire et vos prix de vente
              </p>
            </div>
            <Dialog open={showNewProductDialog} onOpenChange={setShowNewProductDialog}>
              <DialogTrigger asChild>
                <Button variant="accent" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau produit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nouveau produit</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouveau produit à votre inventaire
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom du produit</Label>
                      <Input
                        placeholder="Nom du produit"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(prev => ({...prev, name: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Catégorie</Label>
                        <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1">
                              <FolderPlus className="h-3 w-3" />
                              Nouvelle catégorie
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Nouvelle catégorie</DialogTitle>
                              <DialogDescription>
                                Créer une nouvelle catégorie de produit
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Nom de la catégorie</Label>
                                <Input
                                  placeholder="Ex: Boissons chaudes"
                                  value={newCategory.name}
                                  onChange={(e) => setNewCategory(prev => ({...prev, name: e.target.value}))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Type de catégorie</Label>
                                <Select value={newCategory.type} onValueChange={(value) => setNewCategory(prev => ({...prev, type: value}))}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="boissons">Boissons</SelectItem>
                                    <SelectItem value="plats">Plats</SelectItem>
                                    <SelectItem value="snacks">Snacks</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Description (optionnel)</Label>
                                <Textarea
                                  placeholder="Description de la catégorie..."
                                  value={newCategory.description}
                                  onChange={(e) => setNewCategory(prev => ({...prev, description: e.target.value}))}
                                />
                              </div>
                              <Button 
                                onClick={handleCreateCategory} 
                                className="w-full"
                                disabled={createCategoryMutation.isPending || !newCategory.name}
                              >
                                {createCategoryMutation.isPending ? "Création..." : "Créer la catégorie"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <Select value={newProduct.category} onValueChange={(value) => setNewProduct(prev => ({...prev, category: value}))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesData?.results?.map(category => (
                            <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                          )) || (
                            <SelectItem value="" disabled>Chargement des catégories...</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prix d'achat (FBu)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newProduct.purchase_price}
                        onChange={(e) => setNewProduct(prev => ({...prev, purchase_price: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prix de vente (FBu)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newProduct.selling_price}
                        onChange={(e) => setNewProduct(prev => ({...prev, selling_price: e.target.value}))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Stock actuel</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newProduct.current_stock}
                        onChange={(e) => setNewProduct(prev => ({...prev, current_stock: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock minimum</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newProduct.minimum_stock}
                        onChange={(e) => setNewProduct(prev => ({...prev, minimum_stock: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unité</Label>
                      <Select value={newProduct.unit} onValueChange={(value) => setNewProduct(prev => ({...prev, unit: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="piece">Pièce</SelectItem>
                          <SelectItem value="bouteille">Bouteille</SelectItem>
                          <SelectItem value="canette">Canette</SelectItem>
                          <SelectItem value="litre">Litre</SelectItem>
                          <SelectItem value="kg">Kilogramme</SelectItem>
                          <SelectItem value="portion">Portion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description (optionnel)</Label>
                    <Textarea
                      placeholder="Description du produit..."
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({...prev, description: e.target.value}))}
                    />
                  </div>

                  <Button 
                    onClick={handleCreateProduct} 
                    className="w-full"
                    disabled={createProductMutation.isPending}
                  >
                    {createProductMutation.isPending ? "Création..." : "Créer le produit"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total produits</p>
                    <p className="text-2xl font-bold">
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : products.length}
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
                    <p className="text-sm text-muted-foreground">En stock</p>
                    <p className="text-2xl font-bold text-success">
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : products.filter(p => p.status === "ok").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-warning to-warning/80 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-warning-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stock faible</p>
                    <p className="text-2xl font-bold text-warning">
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : products.filter(p => p.status === "low").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-destructive to-destructive/80 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-destructive-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Critique</p>
                    <p className="text-2xl font-bold text-destructive">
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : products.filter(p => p.status === "critical").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres et recherche</CardTitle>
            </CardHeader>
            <CardContent>
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
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category)}
                      className="whitespace-nowrap flex-shrink-0"
                      size="sm"
                    >
                      {category === "all" ? "Toutes" : category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products List */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des produits</CardTitle>
              <CardDescription>
                {filteredProducts.length} produit(s) trouvé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="text-center py-8">
                  <p className="text-destructive mb-4">Erreur lors du chargement des produits</p>
                  <Button onClick={() => refetch()} variant="outline">
                    Réessayer
                  </Button>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Chargement des produits...</p>
                </div>
              )}

              {!isLoading && !error && (
                <div className="space-y-4">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Aucun produit trouvé</p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                  >
                    {/* Section gauche : Icône et infos produit */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className="h-12 w-12 flex-shrink-0 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">{getProductIcon(product.categoryType)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant={getStatusVariant(product.status)} className="text-xs">
                            {getStatusLabel(product.status)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatStockDisplay(product)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section droite : Prix et actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                      {/* Prix */}
                      <div className="flex flex-col gap-1">
                        {product.categoryType === 'boissons' ? (
                          // Pour les boissons, afficher prix d'achat, vente et marge
                          <>
                            <div className="text-sm flex justify-between sm:justify-start gap-2">
                              <span className="text-muted-foreground">Achat:</span>
                              <span className="font-medium">{product.buyPrice ? product.buyPrice.toLocaleString() : '0'} FBu</span>
                            </div>
                            <div className="text-sm flex justify-between sm:justify-start gap-2">
                              <span className="text-muted-foreground">Vente:</span>
                              <span className="font-medium">{product.sellPrice ? product.sellPrice.toLocaleString() : '0'} FBu</span>
                            </div>
                            <div className="text-sm flex justify-between sm:justify-start gap-2">
                              <span className="text-muted-foreground">Marge:</span>
                              <span className="font-medium text-success">
                                {product.buyPrice && product.sellPrice ? calculateMargin(product.buyPrice, product.sellPrice) : 0}%
                              </span>
                            </div>
                          </>
                        ) : (
                          // Pour les plats, afficher seulement le prix de vente
                          <div className="text-sm flex justify-between sm:justify-start gap-2">
                            <span className="text-muted-foreground">Prix:</span>
                            <span className="font-medium text-lg">{product.sellPrice ? product.sellPrice.toLocaleString() : '0'} FBu</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 justify-end sm:justify-start">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Product Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Modifier le produit</DialogTitle>
                <DialogDescription>
                  Modifiez les informations du produit
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom du produit</Label>
                    <Input
                      placeholder="Nom du produit"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({...prev, name: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select value={newProduct.category} onValueChange={(value) => setNewProduct(prev => ({...prev, category: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesData?.results?.map(category => (
                          <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                        )) || (
                          <SelectItem value="" disabled>Chargement des catégories...</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prix d'achat (FBu)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newProduct.purchase_price}
                      onChange={(e) => setNewProduct(prev => ({...prev, purchase_price: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prix de vente (FBu)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newProduct.selling_price}
                      onChange={(e) => setNewProduct(prev => ({...prev, selling_price: e.target.value}))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Stock actuel</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newProduct.current_stock}
                      onChange={(e) => setNewProduct(prev => ({...prev, current_stock: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock minimum</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newProduct.minimum_stock}
                      onChange={(e) => setNewProduct(prev => ({...prev, minimum_stock: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unité</Label>
                    <Select value={newProduct.unit} onValueChange={(value) => setNewProduct(prev => ({...prev, unit: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="piece">Pièce</SelectItem>
                        <SelectItem value="bouteille">Bouteille</SelectItem>
                        <SelectItem value="canette">Canette</SelectItem>
                        <SelectItem value="litre">Litre</SelectItem>
                        <SelectItem value="kg">Kilogramme</SelectItem>
                        <SelectItem value="portion">Portion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description (optionnel)</Label>
                  <Textarea
                    placeholder="Description du produit..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({...prev, description: e.target.value}))}
                  />
                </div>

                <Button 
                  onClick={handleUpdateProduct} 
                  className="w-full"
                  disabled={updateProductMutation.isPending}
                >
                  {updateProductMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
  );
}