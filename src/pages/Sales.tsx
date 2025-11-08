import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTables, useCreateSale, useProducts, useServers } from "@/hooks/use-api";
import { useCreditAccounts } from "@/hooks/use-credits";
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
  MapPin,
  CreditCard,
  Wallet,
  Info,
  ExternalLink
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Configuration API dynamique
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

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
  const [processing, setProcessing] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [selectedCreditAccount, setSelectedCreditAccount] = useState<string>('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOccupiedTableDialog, setShowOccupiedTableDialog] = useState(false);
  const [attemptedTable, setAttemptedTable] = useState<any>(null);
  const { toast } = useToast();
  // const { isOnline, addToQueue } = useOfflineSync(); // Système offline désactivé
  const isOnline = true; // Application en ligne uniquement

  // Fonction pour gérer la sélection d'une table
  const handleTableSelection = (tableId: string) => {
    const table = tablesData?.results?.find((t: any) => t.id.toString() === tableId);
    
    if (!table) {
      setSelectedTable(tableId);
      return;
    }

    // Vérifier si la table est occupée
    if (table.status === 'occupied') {
      setAttemptedTable(table);
      setShowOccupiedTableDialog(true);
      return;
    }

    // Si la table est disponible, la sélectionner normalement
    setSelectedTable(tableId);
    toast({
      title: "Table sélectionnée",
      description: `Table ${table.number} - ${table.status === 'available' ? 'Disponible' : table.status}`,
      variant: "default",
    });
  };

  // Fonction pour forcer la sélection d'une table occupée
  const handleForceSelectOccupiedTable = () => {
    if (attemptedTable) {
      setSelectedTable(attemptedTable.id.toString());
      setShowOccupiedTableDialog(false);
      toast({
        title: "⚠️ Attention",
        description: `Table ${attemptedTable.number} sélectionnée malgré son occupation`,
        variant: "destructive",
      });
    }
  };

  // Fonction pour voir les détails de la table occupée
  const handleViewTableDetails = () => {
    if (attemptedTable) {
      navigate(`/tables/${attemptedTable.id}`);
    }
  };

  // Récupérer TOUTES les tables (pas seulement les disponibles) pour afficher leur statut
  const { data: tablesData, isLoading: tablesLoading } = useTables({});
  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useProducts({});
  const { data: serversData, isLoading: serversLoading } = useServers({ is_active: true }) as { data: any; isLoading: boolean };
  const { data: creditAccountsData } = useCreditAccounts({ status: 'active' }) as { data: any };
  const createSaleMutation = useCreateSale();

  // Calculer le montant total du panier
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Récupérer les données de commande depuis l'URL
  const orderDataParam = searchParams.get('orderData');

  // Organiser les produits par catégorie quand les données sont chargées
  useEffect(() => {
    // Attendre que productsLoading soit terminé
    if (!productsLoading) {
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
      }
    }
  }, [productsData, productsLoading]);

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

    // Validation du compte crédit si mode crédit
    if (paymentMethod === 'credit' && !selectedCreditAccount) {
      toast({
        title: "Compte crédit requis",
        description: "Veuillez sélectionner un compte crédit",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      // Récupérer les informations du serveur sélectionné
      const selectedServerData = serversData?.results?.find((server: any) => server.id.toString() === selectedServer) || serversData?.find((server: any) => server.id.toString() === selectedServer);
      const serverName = selectedServerData ? `${selectedServerData.first_name} ${selectedServerData.last_name}` : 'Serveur inconnu';

      // Validation des données avant envoi
      if (!selectedTable || !customerName.trim() || !selectedServer || cart.length === 0) {
        toast({
          title: "Erreur de validation",
          description: "Veuillez remplir tous les champs requis et ajouter au moins un article",
          variant: "destructive",
        });
        return;
      }

      // Préparer les données de vente
      const saleData: any = {
        table: parseInt(selectedTable),
        customer_name: customerName.trim(),
        server: parseInt(selectedServer),
        payment_method: paymentMethod as 'cash' | 'card' | 'mobile' | 'credit',
        notes: `Vente directe - ${cart.length} articles - Serveur: ${serverName} - Paiement: ${paymentMethod}`,
        items: cart.map(item => ({
          product: item.menu_item_id,
          quantity: item.quantity,
          notes: `${item.name}`
        }))
      };

      // Ajouter le compte crédit si mode crédit
      if (paymentMethod === 'credit' && selectedCreditAccount) {
        saleData.credit_account = parseInt(selectedCreditAccount);
      }

      console.log('🔍 Données de vente à envoyer:', saleData);

      // Vérifier si on est en ligne
      if (isOnline) {
        // Mode ONLINE : utiliser l'API standard
        createSaleMutation.mutate(saleData, {
          onSuccess: async (result) => {
            setShowConfirmation(false);
            
            toast({
              title: "Vente réussie !",
              description: `Vente créée pour ${customerName} - Table ${selectedTable}`,
              variant: "default",
            });

            // Récupérer et afficher la facture
            await handleInvoiceGeneration(result);

            // Réinitialiser le formulaire
            resetForm();
          },
          onError: (error) => {
            console.error('Erreur lors de la création de la vente:', error);
            setShowConfirmation(false);
            setProcessing(false);
          }
        });
      } //else {
        // Mode OFFLINE : sauvegarder localement
        //await handleOfflineSale(saleData, serverName);
      //}

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement de la vente",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  // Fonction pour gérer la génération de facture
  const handleInvoiceGeneration = async (result: any) => {
    if (isOnline && (result as any)?.invoice_url) {
      // Mode online : récupérer depuis l'API
      try {
        const response = await fetch(`${API_BASE_URL}${(result as any).invoice_url}?format=json`);
        if (response.ok) {
          const invoiceData = await response.json();
          setInvoiceData(invoiceData.invoice);
          setShowInvoice(true);
        } else {
          // Fallback sur génération locale
          throw new Error('Erreur API');
        }
      } catch (error) {
        console.error('Erreur lors de la génération de la facture:', error);
        toast({
          title: "Erreur",
          description: "Impossible de générer la facture. Vérifiez votre connexion.",
          variant: "destructive",
        });
      }
    }
  };

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setCart([]);
    setCustomerName('');
    setSelectedTable('');
    setSelectedServer('');
    setPaymentMethod('cash');
    setSelectedCreditAccount('');
    setProcessing(false);
    // Actualiser les produits pour mettre à jour les stocks (même en offline)
    refreshProducts();
  };

  if (productsLoading) {
    return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Clock className="h-12 w-12 animate-spin mx-auto mb-4" />
        <p>Chargement du menu...</p>
      </div>
    </div>
  );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 h-full p-4 md:p-6">
            
            {/* Menu - 2/3 de l'écran */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Menu de Vente</h1>
                  <p className="text-sm md:text-base text-muted-foreground">Interface commerciale simplifiée</p>
                </div>
                <Button onClick={refreshProducts} variant="outline" className="w-full sm:w-auto">
                  <Package className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Actualiser</span>
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
                  <div className="flex flex-col sm:flex-row gap-4">
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
                    <div className="w-full sm:w-48">
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

              {/* Message si aucun produit */}
              {Object.keys(filteredMenu).length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucun produit disponible</h3>
                    <p className="text-muted-foreground mb-4">
                      Aucun produit n'a été trouvé dans le système.
                    </p>
                    <Button onClick={refreshProducts} variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                  </CardContent>
                </Card>
              )}

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item) => (
                        <Card
                          key={item.id}
                          className={`group overflow-hidden transition-all duration-300 ${
                            item.isOutOfStock
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:shadow-lg cursor-pointer'
                          }`}
                          onClick={() => !item.isOutOfStock && addToCart(item)}
                        >
                          {/* Image/Icône du produit */}
                          <div className={`relative h-40 flex items-center justify-center overflow-hidden ${
                            item.isOutOfStock
                              ? 'bg-gradient-to-br from-red-100 to-red-50'
                              : item.isLowStock
                              ? 'bg-gradient-to-br from-orange-100 to-orange-50'
                              : 'bg-gradient-to-br from-secondary/20 to-secondary/5'
                          }`}>
                            <div className="absolute top-2 right-2 z-10">
                              <Badge variant={
                                item.isOutOfStock ? "destructive" :
                                item.isLowStock ? "secondary" : "default"
                              }>
                                {item.isOutOfStock ? (
                                  <><AlertTriangle className="h-3 w-3 mr-1" />Rupture</>
                                ) : item.isLowStock ? (
                                  <><Clock className="h-3 w-3 mr-1" />{item.availability.available_quantity}</>
                                ) : (
                                  <><CheckCircle className="h-3 w-3 mr-1" />{item.availability.available_quantity}</>
                                )}
                              </Badge>
                            </div>
                            <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
                              {category.includes('Boisson') ? '🍺' : 
                               category.includes('Plat') ? '🍽️' : 
                               category.includes('Snack') ? '🍿' : '🍴'}
                            </div>
                          </div>

                          {/* Contenu de la carte */}
                          <CardContent className="p-4 space-y-2">
                            <div>
                              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                {item.name}
                              </h3>
                              {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="text-xl font-bold text-primary">
                                {item.price.toLocaleString()} FBu
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Marge: {item.margin_percentage.toFixed(1)}%
                              </span>
                            </div>
                            
                            {item.availability.limiting_factors.length > 0 && (
                              <div className="pt-2">
                                <p className="text-xs text-destructive">
                                  {item.availability.limiting_factors.join(', ')}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Panier - 1/3 de l'écran */}
            <div className="space-y-4">
              <Card className="sticky top-20 lg:top-0">
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
                      <div className="space-y-3 max-h-[50vh] lg:max-h-96 overflow-y-auto">
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
                              <Select value={selectedTable} onValueChange={handleTableSelection}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner une table" />
                                </SelectTrigger>
                                <SelectContent>
                                  {tablesLoading ? (
                                    <SelectItem value="loading" disabled>Chargement...</SelectItem>
                                  ) : (
                                    tablesData?.results?.map((table: any) => {
                                      const isOccupied = table.status === 'occupied';
                                      const isReserved = table.status === 'reserved';
                                      const isCleaning = table.status === 'cleaning';
                                      
                                      return (
                                        <SelectItem 
                                          key={table.id} 
                                          value={table.id.toString()}
                                          className={isOccupied ? 'text-red-600' : isReserved ? 'text-orange-600' : ''}
                                        >
                                          Table {table.number} ({table.capacity} places - {table.location})
                                          {isOccupied && ' 🔴 OCCUPÉE'}
                                          {isReserved && ' 🟠 RÉSERVÉE'}
                                          {isCleaning && ' 🟡 EN NETTOYAGE'}
                                        </SelectItem>
                                      );
                                    }) || []
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
                                  (serversData?.results || serversData)?.map((server: any) => (
                                    <SelectItem key={server.id} value={server.id.toString()}>
                                      {server.first_name} {server.last_name} ({server.username})
                                    </SelectItem>
                                  )) || []
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="payment-method" className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Mode de paiement *
                            </Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">
                                  <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    <span>Espèces</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="card">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    <span>Carte bancaire</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="mobile">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    <span>Mobile Money</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="credit">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Crédit (à payer plus tard)</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Sélecteur de compte crédit (visible uniquement si mode crédit) */}
                          {paymentMethod === 'credit' && (
                            <div>
                              <Label htmlFor="credit-account" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Compte crédit *
                              </Label>
                              <Select value={selectedCreditAccount} onValueChange={setSelectedCreditAccount}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Sélectionner un compte" />
                                </SelectTrigger>
                                <SelectContent>
                                  {creditAccountsData?.results?.map((account: any) => (
                                    <SelectItem key={account.id} value={account.id.toString()}>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{account.customer_name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          Disponible: {account.available_credit.toLocaleString()} FBu
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {selectedCreditAccount && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  💡 La dette sera ajoutée automatiquement au compte
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Total:</span>
                          <span className="text-xl font-bold">
                            {totalAmount.toLocaleString()} BIF
                          </span>
                        </div>
                        
                        <Button
                          onClick={() => setShowConfirmation(true)}
                          disabled={processing || cart.length === 0}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Finaliser la commande ({totalAmount.toLocaleString()} BIF)
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
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

        {/* Dialog d'avertissement pour table occupée */}
        <Dialog open={showOccupiedTableDialog} onOpenChange={setShowOccupiedTableDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Table Occupée
              </DialogTitle>
              <DialogDescription>
                La table que vous essayez de sélectionner est actuellement occupée.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {attemptedTable && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Table:</span>
                      <span className="text-red-700 font-bold">#{attemptedTable.number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Capacité:</span>
                      <span>{attemptedTable.capacity} places</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Emplacement:</span>
                      <span>{attemptedTable.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Statut:</span>
                      <Badge variant="destructive">🔴 OCCUPÉE</Badge>
                    </div>
                    {attemptedTable.customer && (
                      <div className="flex justify-between">
                        <span className="font-medium">Client:</span>
                        <span>{attemptedTable.customer}</span>
                      </div>
                    )}
                    {attemptedTable.server_name && (
                      <div className="flex justify-between">
                        <span className="font-medium">Serveur:</span>
                        <span>{attemptedTable.server_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Que souhaitez-vous faire ?</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Voir les détails de la table et les commandes en cours</li>
                      <li>Choisir une autre table disponible</li>
                      <li>Ajouter une commande à cette table (déconseillé)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowOccupiedTableDialog(false)}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button
                variant="secondary"
                onClick={handleViewTableDetails}
                className="w-full sm:w-auto gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Voir les détails
              </Button>
              <Button
                variant="destructive"
                onClick={handleForceSelectOccupiedTable}
                className="w-full sm:w-auto"
              >
                Sélectionner quand même
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de confirmation de vente */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Confirmer la vente</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Client:</span>
                  <span className="font-medium">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Table:</span>
                  <span className="font-medium">
                    {tablesData?.results?.find((t: any) => t.id.toString() === selectedTable)?.number || selectedTable}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Serveur:</span>
                  <span className="font-medium">
                    {(serversData?.results || serversData)?.find((s: any) => s.id.toString() === selectedServer)?.first_name} {(serversData?.results || serversData)?.find((s: any) => s.id.toString() === selectedServer)?.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mode de paiement:</span>
                  <span className="font-medium">
                    {paymentMethod === 'cash' && '💵 Espèces'}
                    {paymentMethod === 'card' && '💳 Carte bancaire'}
                    {paymentMethod === 'mobile' && '📱 Mobile Money'}
                    {paymentMethod === 'credit' && '⏰ Crédit'}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span>Articles:</span>
                    <span className="font-medium">{cart.length}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{totalAmount.toLocaleString()} BIF</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1"
                  disabled={processing}
                >
                  Annuler
                </Button>
                <Button
                  onClick={processSale}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processing ? "Traitement..." : "Confirmer la vente"}
                </Button>
              </div>
            </div>
          </div>
        )}
    </>
  );
 }

