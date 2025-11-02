// Page dédiée pour les SERVEURS avec fonctionnalités offline complètes
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useOfflineServer } from "@/hooks/use-offline-server";
import { useTables, useProducts, useServers } from "@/hooks/use-api";
import {
  ShoppingCart,
  Plus,
  Minus,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Send,
  FileText,
} from "lucide-react";

interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export default function ServerOrders() {
  const { toast } = useToast();
  const {
    isOnline,
    cachedMenu,
    cachedTables,
    pendingOrders,
    createOfflineOrder,
    addNotesToOrder,
    updateMenuCache,
    updateTablesCache,
  } = useOfflineServer();

  // Récupérer les données depuis l'API (et mettre à jour le cache)
  const { data: tablesData } = useTables({});
  const { data: productsData } = useProducts({});
  const { data: serversData } = useServers({ is_active: true });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [itemNotes, setItemNotes] = useState<{ [key: number]: string }>({});
  const [processing, setProcessing] = useState(false);

  // Mettre à jour le cache quand les données API arrivent
  useEffect(() => {
    if (productsData?.results) {
      updateMenuCache(productsData.results);
    }
  }, [productsData, updateMenuCache]);

  useEffect(() => {
    if (tablesData?.results) {
      updateTablesCache(tablesData.results);
    }
  }, [tablesData, updateTablesCache]);

  // Utiliser les données en cache si disponibles, sinon les données API
  const menu = productsData?.results || cachedMenu;
  const tables = tablesData?.results || cachedTables;

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.product_id === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.selling_price || 0),
        quantity: 1,
      }]);
    }

    toast({
      title: "Ajouté au panier",
      description: `${product.name} ajouté`,
    });
  };

  const updateQuantity = (product_id: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.product_id !== product_id));
    } else {
      setCart(cart.map(item =>
        item.product_id === product_id
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const updateItemNotes = (product_id: number, notes: string) => {
    setItemNotes({ ...itemNotes, [product_id]: notes });
    setCart(cart.map(item =>
      item.product_id === product_id
        ? { ...item, notes }
        : item
    ));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Panier vide",
        description: "Ajoutez des articles avant de valider",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTable || !selectedServer) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner une table et un serveur",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    const orderData = {
      table: parseInt(selectedTable),
      server: parseInt(selectedServer),
      items: cart.map(item => ({
        product: item.product_id,
        quantity: item.quantity,
        notes: item.notes || '',
      })),
      notes: orderNotes,
    };

    const result = await createOfflineOrder(orderData);

    if (result.success) {
      // Réinitialiser le formulaire
      setCart([]);
      setSelectedTable('');
      setOrderNotes('');
      setItemNotes({});
    }

    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header avec indicateur de connexion */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prendre une commande</h1>
          <p className="text-muted-foreground">Interface serveur - Mode offline disponible</p>
        </div>
        <Badge variant={isOnline ? "default" : "destructive"} className="text-lg px-4 py-2">
          {isOnline ? (
            <>
              <Wifi className="h-5 w-5 mr-2" />
              En ligne
            </>
          ) : (
            <>
              <WifiOff className="h-5 w-5 mr-2" />
              Hors ligne
            </>
          )}
        </Badge>
      </div>

      {/* Commandes en attente de synchronisation */}
      {pendingOrders.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Clock className="h-5 w-5" />
              Commandes en attente de synchronisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              {pendingOrders.length} commande(s) seront envoyées dès le retour d'internet
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu - 2/3 de l'écran */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Menu disponible</CardTitle>
              <CardDescription>
                {menu.length} produits {!isOnline && "(depuis le cache)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menu.map((product: any) => (
                  <div
                    key={product.id}
                    className="p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant={product.current_stock > 0 ? "default" : "destructive"}>
                        {product.current_stock > 0 ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {product.current_stock > 0 ? product.current_stock : "Rupture"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {product.description || "Aucune description"}
                    </p>
                    <div className="text-lg font-bold">
                      {parseFloat(product.selling_price || 0).toLocaleString()} BIF
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panier - 1/3 de l'écran */}
        <div className="space-y-4">
          <Card className="sticky top-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Commande ({cart.length})
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
                      <div key={item.product_id} className="space-y-2">
                        <div className="flex items-center justify-between p-3 border rounded">
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
                              onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            
                            <span className="w-8 text-center">{item.quantity}</span>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateQuantity(item.product_id, 0)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Notes pour l'article */}
                        <div className="pl-3">
                          <Input
                            placeholder="Notes (ex: Cuisson à point, Sans oignons...)"
                            value={itemNotes[item.product_id] || ''}
                            onChange={(e) => updateItemNotes(item.product_id, e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    {/* Sélection table */}
                    <div>
                      <Label htmlFor="table-select">Table *</Label>
                      <Select value={selectedTable} onValueChange={setSelectedTable}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Sélectionner une table" />
                        </SelectTrigger>
                        <SelectContent>
                          {tables.map((table: any) => (
                            <SelectItem key={table.id} value={table.id.toString()}>
                              Table {table.number} ({table.location})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sélection serveur */}
                    <div>
                      <Label htmlFor="server-select">Serveur *</Label>
                      <Select value={selectedServer} onValueChange={setSelectedServer}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Sélectionner un serveur" />
                        </SelectTrigger>
                        <SelectContent>
                          {serversData?.map((server: any) => (
                            <SelectItem key={server.id} value={server.id.toString()}>
                              {server.first_name} {server.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notes générales */}
                    <div>
                      <Label htmlFor="order-notes">Notes de commande</Label>
                      <Textarea
                        id="order-notes"
                        placeholder="Notes générales pour la commande..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-xl font-bold">
                        {totalAmount.toLocaleString()} BIF
                      </span>
                    </div>
                    
                    <Button
                      onClick={handleSubmitOrder}
                      disabled={processing || cart.length === 0}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {processing ? "Envoi..." : isOnline ? "Envoyer la commande" : "Enregistrer hors ligne"}
                    </Button>

                    {!isOnline && (
                      <p className="text-sm text-orange-600 text-center">
                        La commande sera synchronisée automatiquement
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
