import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  Users,
  Calculator,
  Search,
  Loader2
} from "lucide-react";
import { useProducts, useCreateSale, useTables } from "@/hooks/use-api";
import { Product } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
  categoryType: 'boissons' | 'plats' | 'snacks';
  stock: number;
  unit: string;
}

// Interface pour l'affichage des produits dans Sales
interface ProductDisplay {
  id: number;
  name: string;
  price: number;
  category: string;
  categoryType: 'boissons' | 'plats' | 'snacks';
  stock: number;
  unit: string;
}

// Fonction pour mapper les produits de l'API vers l'affichage
const mapProductToDisplay = (product: Product): ProductDisplay => ({
  id: product.id,
  name: product.name,
  price: product.selling_price || 0,
  category: product.category_name || "Non catégorisé",
  categoryType: product.category_type || 'boissons',
  stock: product.current_stock || 0,
  unit: product.unit || 'unités'
});

// Fonction pour formater l'affichage du produit selon son type
const formatProductDisplay = (product: ProductDisplay): string => {
  if (product.categoryType === 'boissons') {
    // Pour les boissons, afficher le stock disponible
    const unitLabel = product.unit === 'bouteille' ? 'bouteilles' :
                     product.unit === 'piece' ? 'pièces' :
                     product.unit === 'litre' ? 'litres' : 
                     product.unit || 'unités';
    return `${product.name} (Disponible : ${product.stock || 0} ${unitLabel})`;
  } else {
    // Pour les plats/recettes, afficher seulement le nom (pas de stock visible)
    return product.name;
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

export default function Sales() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTable, setSelectedTable] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | ''>('');
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Utiliser l'API pour récupérer les produits
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError
  } = useProducts({
    search: searchQuery || undefined
  });

  // Hooks API
  const createSaleMutation = useCreateSale();
  const { data: tablesData, isLoading: tablesLoading, error: tablesError } = useTables();

  // Debug tables data
  console.log('Tables data:', tablesData);
  console.log('Tables loading:', tablesLoading);
  console.log('Tables error:', tablesError);

  // Mapper les produits de l'API
  const products: ProductDisplay[] = productsData?.results
    ? productsData.results.map(mapProductToDisplay)
    : [];

  // Extraire les catégories uniques
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];
  
  // Tables dynamiques depuis l'API ou fallback statique
  const tables = tablesData?.results?.length > 0 
    ? tablesData.results.map(table => `Table ${table.number}`)
    : Array.from({length: 24}, (_, i) => `Table ${i + 1}`);

  console.log('Final tables array:', tables);

  // Filtrer les produits selon la catégorie et la recherche
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: ProductDisplay) => {
    if (product.stock <= 0) {
      toast({
        title: "Stock insuffisant",
        description: `${product.name} n'est plus en stock`,
        variant: "destructive",
      });
      return;
    }

    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          toast({
            title: "Stock insuffisant",
            description: `Stock maximum atteint pour ${product.name}`,
            variant: "destructive",
          });
          return prev;
        }
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        category: product.category,
        categoryType: product.categoryType,
        stock: product.stock,
        unit: product.unit
      }];
    });
  };

  const updateQuantity = (id: number, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, Math.min(item.stock, item.quantity + change));
          return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Erreur",
        description: "Le panier est vide",
        variant: "destructive",
      });
      return;
    }
    if (!paymentMethod) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un mode de paiement",
        variant: "destructive",
      });
      return;
    }

    const saleData = {
      table_number: selectedTable ? parseInt(selectedTable.replace('Table ', '')) : undefined,
      payment_method: paymentMethod,
      items: cart.map(item => ({
        product: item.id,
        quantity: item.quantity,
        notes: customerName ? `Client: ${customerName}` : undefined
      })),
      notes: customerName ? `Client: ${customerName}` : undefined
    };

    createSaleMutation.mutate(saleData, {
      onSuccess: () => {
        // Reset form
        setCart([]);
        setSelectedTable("");
        setCustomerName("");
        setPaymentMethod("");
      },
      onError: (error) => {
        console.error('Erreur vente:', error);
      }
    });
  };

  // Plus besoin de useEffect car filteredProducts est calculé directement

  return (
    <div className="min-h-screen bg-gradient-surface flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-auto">
        <Header />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Products Section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Point de Vente</h1>
                <Badge variant="accent" className="gap-1">
                  <Users className="h-3 w-3" />
                  {selectedTable || "Aucune table"}
                </Badge>
              </div>

              {/* Search Bar */}
              <div className="relative w-full mb-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  type="text"
                  placeholder="Rechercher un produit..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Tabs */}
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="grid w-full grid-cols-4">
                  {categories.slice(0, 4).map(category => (
                    <TabsTrigger key={category} value={category} className="text-xs">
                      {category === "all" ? "Tous" : category}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categories.map(category => (
                  <TabsContent key={category} value={category} className="mt-4">
                    {productsLoading && (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Chargement des produits...</p>
                      </div>
                    )}

                    {productsError && (
                      <div className="text-center py-8">
                        <p className="text-destructive mb-4">Erreur lors du chargement des produits</p>
                      </div>
                    )}

                    {!productsLoading && !productsError && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredProducts.length === 0 ? (
                          <div className="col-span-full text-center py-8">
                            <p className="text-muted-foreground">Aucun produit trouvé</p>
                          </div>
                        ) : (
                          filteredProducts.map(product => (
                            <Card
                              key={product.id}
                              className={`cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 ${
                                product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              onClick={() => product.stock > 0 && addToCart(product)}
                            >
                              <CardContent className="p-4 text-center">
                                <div className="h-16 w-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center mx-auto mb-2">
                                  <span className="text-2xl">{getProductIcon(product.categoryType)}</span>
                                </div>
                                <h3 className="font-semibold text-sm mb-1 leading-tight">
                                  {formatProductDisplay(product)}
                                </h3>
                                <p className="text-lg font-bold text-primary">Prix : {product.price ? product.price.toLocaleString() : '0'} FBu</p>
                                {product.categoryType === 'boissons' && product.stock <= 0 && (
                                  <p className="text-xs text-destructive">Rupture de stock</p>
                                )}
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Cart Section */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Panier ({getTotalItems()})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Table Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Table</label>
                    <Select value={selectedTable} onValueChange={setSelectedTable}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une table" />
                      </SelectTrigger>
                      <SelectContent>
                        {tablesLoading ? (
                          <SelectItem value="loading" disabled>Chargement...</SelectItem>
                        ) : tablesError ? (
                          <SelectItem value="error" disabled>Erreur: {tablesError.message}</SelectItem>
                        ) : (
                          tables.map(table => (
                            <SelectItem key={table} value={table}>{table}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Customer Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client (optionnel)</label>
                    <Input
                      placeholder="Nom du client"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {cart.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Panier vide
                      </p>
                    ) : (
                      cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {item.categoryType === 'boissons' 
                                ? `${item.name} (Disponible : ${item.stock || 0} ${item.unit === 'bouteille' ? 'bouteilles' : 
                                   item.unit === 'piece' ? 'pièces' : 
                                   item.unit === 'litre' ? 'litres' : 
                                   item.unit || 'unités'})` 
                                : `${item.name} – Prix : ${item.price ? item.price.toLocaleString() : '0'} FBu`}
                            </p>
                            {item.categoryType === 'boissons' && (
                              <p className="text-xs text-muted-foreground">
                                Prix : {item.price ? item.price.toLocaleString() : '0'} FBu
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Total */}
                  {cart.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-primary">
                          {getTotalAmount().toLocaleString()} FBu
                        </span>
                      </div>

                      {/* Payment Method */}
                      <div className="space-y-2 mb-4">
                        <label className="text-sm font-medium">Mode de paiement</label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant={paymentMethod === "cash" ? "default" : "outline"}
                            onClick={() => setPaymentMethod("cash")}
                            className="gap-1 text-xs"
                          >
                            <Banknote className="h-3 w-3" />
                            Espèces
                          </Button>
                          <Button
                            variant={paymentMethod === "card" ? "default" : "outline"}
                            onClick={() => setPaymentMethod("card")}
                            className="gap-1 text-xs"
                          >
                            <CreditCard className="h-3 w-3" />
                            Carte
                          </Button>
                          <Button
                            variant={paymentMethod === "mobile" ? "default" : "outline"}
                            onClick={() => setPaymentMethod("mobile")}
                            className="gap-1 text-xs"
                          >
                            <Smartphone className="h-3 w-3" />
                            Mobile
                          </Button>
                        </div>
                      </div>

                      {/* Checkout Buttons */}
                      <div className="space-y-2">
                        <Button 
                          onClick={handleCheckout}
                          className="w-full gap-2"
                          disabled={cart.length === 0 || !selectedTable || !paymentMethod}
                        >
                          <Calculator className="h-4 w-4" />
                          Finaliser la vente
                        </Button>
                        <Button variant="outline" className="w-full gap-2">
                          <Printer className="h-4 w-4" />
                          Imprimer reçu
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
