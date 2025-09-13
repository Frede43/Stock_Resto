import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTables, useCreateSale, useProducts, useServers } from "@/hooks/use-api";
import { PrintableInvoice } from "@/components/PrintableInvoice";
import {
  ShoppingCart,
  Plus,
  Minus,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  User,
  MapPin
} from "lucide-react";

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  type: string;
  availability: {
    available_quantity: number;
    limiting_factors: string[];
  };
  margin_percentage: number;
  isOutOfStock?: boolean;
  isLowStock?: boolean;
}

interface CartItem {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
  available_quantity: number;
}

export default function Sales() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState<Record<string, MenuItem[]>>({});
  const [filteredMenu, setFilteredMenu] = useState<Record<string, MenuItem[]>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [showInvoice, setShowInvoice] = useState<boolean>(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  // Récupérer les tables disponibles, les produits et les serveurs
  const { data: tablesData, isLoading: tablesLoading } = useTables({ status: 'available' });
  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useProducts({});
  const { data: serversData, isLoading: serversLoading } = useServers({ is_active: true });
  const createSaleMutation = useCreateSale();

  // Récupérer les données de commande depuis l'URL
  const orderDataParam = searchParams.get('orderData');

  // Organiser les produits par catégorie quand les données sont chargées
  useEffect(() => {
    if (productsData?.results) {
      const products = productsData.results;
      const organizedMenu: Record<string, MenuItem[]> = {};

      products.forEach(product => {
        const category = product.category_name || 'Autres';

        if (!organizedMenu[category]) {
          organizedMenu[category] = [];
        }

        // Déterminer le statut du stock
        const isOutOfStock = product.current_stock <= 0;
        const isLowStock = product.current_stock <= (product.minimum_stock || 5) && product.current_stock > 0;

        // Ajouter des facteurs limitants selon le stock
        const limitingFactors = [];
        if (isOutOfStock) {
          limitingFactors.push('Rupture de stock');
        } else if (isLowStock) {
          limitingFactors.push(`Stock faible (${product.current_stock} restant)`);
        }

        organizedMenu[category].push({
          id: product.id,
          name: product.name,
          category: category,
          price: parseFloat(product.selling_price?.toString() || '0'),
          description: product.description || '',
          type: 'product',
          availability: {
            available_quantity: product.current_stock,
            limiting_factors: limitingFactors
          },
          margin_percentage: 0,
          isOutOfStock: isOutOfStock,
          isLowStock: isLowStock
        });
      });

      setMenu(organizedMenu);
      setLoading(false);
    }
  }, [productsData]);

  // Filtrer les produits selon la recherche et la catégorie
  useEffect(() => {
    if (!menu || Object.keys(menu).length === 0) {
      setFilteredMenu({});
      return;
    }

    let filtered: Record<string, MenuItem[]> = {};

    Object.entries(menu).forEach(([category, items]) => {
      // Filtrer par catégorie si sélectionnée
      if (selectedCategory !== 'all' && category !== selectedCategory) {
        return;
      }

      // Filtrer par recherche
      const filteredItems = items.filter(item => {
        if (!searchQuery.trim()) return true;

        const searchLower = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          category.toLowerCase().includes(searchLower)
        );
      });

      if (filteredItems.length > 0) {
        filtered[category] = filteredItems;
      }
    });

    setFilteredMenu(filtered);
  }, [menu, searchQuery, selectedCategory]);

  // Traiter les données de commande reçues
  useEffect(() => {
    if (orderDataParam) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(orderDataParam));
        setOrderData(decodedData);

        // Pré-remplir le panier avec les articles de la commande
        if (decodedData.items && Object.keys(menu).length > 0) {
          const preFilledCart: CartItem[] = [];

          decodedData.items.forEach((item: any) => {
            // Trouver l'article dans le menu
            Object.values(menu).forEach(categoryItems => {
              const menuItem = categoryItems.find(mi => mi.id === item.menu_item_id);
              if (menuItem) {
                preFilledCart.push({
                  menu_item_id: menuItem.id,
                  name: menuItem.name,
                  price: menuItem.price,
                  quantity: item.quantity,
                  available_quantity: menuItem.availability.available_quantity
                });
              }
            });
          });

          setCart(preFilledCart);

          toast({
            title: "Commande chargée",
            description: `Table ${decodedData.tableNumber} - ${decodedData.serverName}`,
            variant: "default",
          });
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de commande",
          variant: "destructive",
        });
      }
    }
  }, [orderDataParam, menu, toast]);

  // Traiter les données de commande reçues
  useEffect(() => {
    if (orderDataParam) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(orderDataParam));
        setOrderData(decodedData);

        // Pré-remplir le panier avec les articles de la commande
        if (decodedData.items && menu) {
          const preFilledCart: CartItem[] = [];

          decodedData.items.forEach((item: any) => {
            // Trouver l'article dans le menu
            Object.values(menu).forEach(categoryItems => {
              const menuItem = categoryItems.find(mi => mi.id === item.menu_item_id);
              if (menuItem) {
                preFilledCart.push({
                  menu_item_id: menuItem.id,
                  name: menuItem.name,
                  price: menuItem.price,
                  quantity: item.quantity,
                  available_quantity: menuItem.availability.available_quantity
                });
              }
            });
          });

          setCart(preFilledCart);

          toast({
            title: "Commande chargée",
            description: `Table ${decodedData.tableNumber} - ${decodedData.serverName}`,
            variant: "default",
          });
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de commande",
          variant: "destructive",
        });
      }
    }
  }, [orderDataParam, menu, toast]);

  // Fonction pour actualiser les produits
  const refreshProducts = () => {
    refetchProducts();
  };

  const addToCart = (item: MenuItem) => {
    // Empêcher l'ajout si le produit est en rupture de stock
    if (item.isOutOfStock || item.availability.available_quantity <= 0) {
      toast({
        title: "Produit indisponible",
        description: `${item.name} est en rupture de stock`,
        variant: "destructive",
      });
      return;
    }

    const existingItem = cart.find(cartItem => cartItem.menu_item_id === item.id);

    if (existingItem) {
      if (existingItem.quantity < item.availability.available_quantity) {
        setCart(cart.map(cartItem =>
          cartItem.menu_item_id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        ));

        // Avertir si stock faible après ajout
        if (item.isLowStock && existingItem.quantity + 1 >= item.availability.available_quantity * 0.8) {
          toast({
            title: "Stock faible",
            description: `Attention: ${item.name} a un stock faible (${item.availability.available_quantity} restant)`,
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Stock insuffisant",
          description: `Seulement ${item.availability.available_quantity} disponibles`,
          variant: "destructive",
        });
      }
    } else {
      setCart([...cart, {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        available_quantity: item.availability.available_quantity
      }]);

      // Avertir si stock faible
      if (item.isLowStock) {
        toast({
          title: "Stock faible",
          description: `Attention: ${item.name} a un stock faible (${item.availability.available_quantity} restant)`,
          variant: "default",
        });
      }
    }
  };

  const updateQuantity = (menu_item_id: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.menu_item_id !== menu_item_id));
    } else {
      setCart(cart.map(item =>
        item.menu_item_id === menu_item_id
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Panier vide",
        description: "Ajoutez des articles avant de valider",
        variant: "destructive",
      });
      return;
    }

    // Validation des champs obligatoires
    if (!customerName.trim()) {
      toast({
        title: "Client requis",
        description: "Veuillez saisir le nom du client",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTable) {
      toast({
        title: "Table requise",
        description: "Veuillez sélectionner une table",
        variant: "destructive",
      });
      return;
    }

    if (!selectedServer) {
      toast({
        title: "Serveur requis",
        description: "Veuillez sélectionner un serveur",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      // Récupérer les informations du serveur sélectionné
      const selectedServerData = serversData?.find((server: any) => server.id.toString() === selectedServer);
      const serverName = selectedServerData ? `${selectedServerData.first_name} ${selectedServerData.last_name}` : 'Serveur inconnu';

      // Utiliser l'API de ventes standard avec client, table et serveur
      const saleData = {
        table: parseInt(selectedTable),
        customer_name: customerName.trim(),
        server: parseInt(selectedServer),
        payment_method: 'cash' as const,
        notes: `Vente directe - ${cart.length} articles - Serveur: ${serverName}`,
        items: cart.map(item => ({
          product: item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.price,
          notes: `${item.name}`
        }))
      };

      // Utiliser le hook de création de vente
      createSaleMutation.mutate(saleData, {
        onSuccess: async (result) => {
          toast({
            title: "Vente réussie !",
            description: `Vente créée pour ${customerName} - Table ${selectedTable}`,
            variant: "default",
          });

          // Récupérer et afficher la facture imprimable
          if ((result as any)?.invoice_url) {
            try {
              const response = await fetch(`http://127.0.0.1:8000${(result as any).invoice_url}?format=json`);
              if (response.ok) {
                const invoiceData = await response.json();
                setInvoiceData(invoiceData.invoice);
                setShowInvoice(true);
              }
            } catch (error) {
              console.error('Erreur récupération facture:', error);
              // Fallback: ouvrir dans un nouvel onglet
              window.open(`http://127.0.0.1:8000${(result as any).invoice_url}?format=html`, '_blank');
            }
          }

          // Vider le panier et réinitialiser les champs
          setCart([]);
          setCustomerName('');
          setSelectedTable('');
          setSelectedServer('');
          setOrderData(null);
          refreshProducts();

          // Supprimer les paramètres de l'URL
          window.history.replaceState({}, '', '/sales');
        },
        onError: (error: any) => {
          toast({
            title: "Erreur de vente",
            description: error.message || "Erreur lors de la création de la vente",
            variant: "destructive",
          });
        }
      });

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement de la vente",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading || productsLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <Clock className="h-12 w-12 animate-spin mx-auto mb-4" />
              <p>Chargement du menu...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            
            {/* Menu - 2/3 de l'écran */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Menu de Vente</h1>
                  <p className="text-muted-foreground">Interface commerciale simplifiée</p>
                </div>
                <Button onClick={refreshProducts} variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>

              {/* Information commande */}
              {orderData && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-900">Commande à encaisser</h3>
                        <p className="text-green-700">
                          Table {orderData.tableNumber} • Serveur: {orderData.serverName}
                        </p>
                        <p className="text-sm text-green-600">
                          Commande #{orderData.orderId} • Total: {orderData.totalAmount?.toLocaleString()} BIF
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-800">
                          {orderData.totalAmount?.toLocaleString()} BIF
                        </div>
                        <p className="text-xs text-green-600">Montant à encaisser</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Barre de recherche et filtres */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Rechercher des produits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    {/* Barre de recherche */}
                    <div className="flex-1">
                      <Label htmlFor="search-products">Rechercher</Label>
                      <Input
                        id="search-products"
                        placeholder="Rechercher par nom, description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    {/* Filtre par catégorie */}
                    <div className="w-48">
                      <Label htmlFor="category-filter">Catégorie</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Toutes les catégories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les catégories</SelectItem>
                          {Object.keys(menu).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Résultats de recherche */}
                  {searchQuery && (
                    <div className="text-sm text-muted-foreground">
                      {Object.values(filteredMenu).flat().length} produit(s) trouvé(s) pour "{searchQuery}"
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Catégories du menu filtrées */}
              {Object.entries(filteredMenu).map(([category, items]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      {category}
                    </CardTitle>
                    <CardDescription>
                      {items.length} articles disponibles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 border rounded-lg transition-colors ${
                            item.isOutOfStock
                              ? 'opacity-50 cursor-not-allowed border-red-200 bg-red-50'
                              : item.isLowStock
                              ? 'hover:bg-orange-50 cursor-pointer border-orange-200 bg-orange-25'
                              : 'hover:bg-muted cursor-pointer'
                          }`}
                          onClick={() => !item.isOutOfStock && addToCart(item)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{item.name}</h3>
                            <Badge variant={
                              item.isOutOfStock ? "destructive" :
                              item.isLowStock ? "secondary" : "default"
                            }>
                              {item.isOutOfStock ? (
                                <AlertTriangle className="h-3 w-3 mr-1" />
                              ) : item.isLowStock ? (
                                <Clock className="h-3 w-3 mr-1" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              {item.isOutOfStock ? "Rupture" :
                               item.isLowStock ? `${item.availability.available_quantity} (Faible)` :
                               item.availability.available_quantity}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.description}
                          </p>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">
                              {item.price.toLocaleString()} BIF
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Marge: {item.margin_percentage.toFixed(1)}%
                            </span>
                          </div>
                          
                          {item.availability.limiting_factors.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-destructive">
                                {item.availability.limiting_factors.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Panier - 1/3 de l'écran */}
            <div className="space-y-4">
              <Card className="sticky top-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Panier ({cart.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Panier vide
                    </p>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.menu_item_id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex-1">
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {item.price.toLocaleString()} BIF
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              
                              <span className="w-8 text-center">{item.quantity}</span>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                                disabled={item.quantity >= item.available_quantity}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateQuantity(item.menu_item_id, 0)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-4 space-y-4">
                        {/* Informations client et table */}
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label htmlFor="customer-name" className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Nom du client *
                            </Label>
                            <Input
                              id="customer-name"
                              placeholder="Nom du client..."
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="table-select" className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Table *
                            </Label>
                            <div className="flex gap-2 mt-1">
                              <Select value={selectedTable} onValueChange={setSelectedTable}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner une table" />
                                </SelectTrigger>
                                <SelectContent>
                                  {tablesLoading ? (
                                    <SelectItem value="loading" disabled>Chargement...</SelectItem>
                                  ) : (
                                    tablesData?.results?.map((table: any) => (
                                      <SelectItem key={table.id} value={table.id.toString()}>
                                        Table {table.number} ({table.capacity} places - {table.location})
                                      </SelectItem>
                                    )) || []
                                  )}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                className="whitespace-nowrap"
                                onClick={() => navigate('/tables')}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Nouvelle table
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="server-select" className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Serveur *
                            </Label>
                            <Select value={selectedServer} onValueChange={setSelectedServer}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Sélectionner un serveur" />
                              </SelectTrigger>
                              <SelectContent>
                                {serversLoading ? (
                                  <SelectItem value="loading" disabled>Chargement...</SelectItem>
                                ) : (
                                  serversData?.map((server: any) => (
                                    <SelectItem key={server.id} value={server.id.toString()}>
                                      {server.first_name} {server.last_name} ({server.username})
                                    </SelectItem>
                                  )) || []
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Total:</span>
                          <span className="text-xl font-bold">
                            {totalAmount.toLocaleString()} BIF
                          </span>
                        </div>
                        
                        <Button
                          onClick={processSale}
                          disabled={processing}
                          className="w-full"
                          size="lg"
                        >
                          {processing ? (
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          {processing ? 'Traitement...' : 'Valider la vente'}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Facture imprimable */}
      <PrintableInvoice
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        invoiceData={invoiceData}
        onPrint={() => {
          toast({
            title: "Facture imprimée",
            description: "La facture a été envoyée à l'imprimante",
          });
        }}
      />
    </div>
  );
}
