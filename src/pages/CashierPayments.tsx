// Page dédiée pour les CAISSIERS avec fonctionnalités offline complètes
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
// Système offline désactivé
// import { useOfflineCashier } from "@/hooks/use-offline-cashier";
import { useProducts } from "@/hooks/use-api";
import {
  DollarSign,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
  CreditCard,
  Banknote,
  FileText,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
} from "lucide-react";

interface QuickSaleItem {
  product: number;
  name: string;
  price: number;
  quantity: number;
}

export default function CashierPayments() {
  const { toast } = useToast();
  // Système offline désactivé
  // const {
  //   isOnline,
  //   cachedSales,
  //   pendingPayments,
  //   processOfflinePayment,
  //   createQuickSale,
  //   getTodaySales,
  //   updateSalesCache,
  // } = useOfflineCashier();

  const { data: productsData } = useProducts({});

  const [selectedSale, setSelectedSale] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'check' | 'card' | 'mobile'>('cash');
  const [processing, setProcessing] = useState(false);

  // Vente rapide
  const [quickSaleCart, setQuickSaleCart] = useState<QuickSaleItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [quickSaleMethod, setQuickSaleMethod] = useState<'cash' | 'check'>('cash');

  const todaySales = getTodaySales();
  const products = productsData?.results || [];

  const handleProcessPayment = async () => {
    if (!selectedSale || !paymentAmount) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner une vente et saisir le montant",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    const result = await processOfflinePayment({
      sale_id: selectedSale,
      amount: parseFloat(paymentAmount),
      payment_method: paymentMethod,
    });

    if (result.success) {
      setSelectedSale('');
      setPaymentAmount('');
    }

    setProcessing(false);
  };

  const addToQuickSale = (product: any) => {
    const existingItem = quickSaleCart.find(item => item.product === product.id);

    if (existingItem) {
      setQuickSaleCart(quickSaleCart.map(item =>
        item.product === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setQuickSaleCart([...quickSaleCart, {
        product: product.id,
        name: product.name,
        price: parseFloat(product.selling_price || 0),
        quantity: 1,
      }]);
    }
  };

  const updateQuickSaleQuantity = (product_id: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setQuickSaleCart(quickSaleCart.filter(item => item.product !== product_id));
    } else {
      setQuickSaleCart(quickSaleCart.map(item =>
        item.product === product_id
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const quickSaleTotal = quickSaleCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleQuickSale = async () => {
    if (quickSaleCart.length === 0 || !customerName.trim()) {
      toast({
        title: "Informations manquantes",
        description: "Ajoutez des articles et saisissez le nom du client",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    const result = await createQuickSale({
      customer_name: customerName.trim(),
      items: quickSaleCart.map(item => ({
        product: item.product,
        quantity: item.quantity,
      })),
      payment_method: quickSaleMethod,
    });

    if (result.success) {
      setQuickSaleCart([]);
      setCustomerName('');
    }

    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header avec indicateur de connexion */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Caisse</h1>
          <p className="text-muted-foreground">Encaissements et ventes rapides - Mode offline disponible</p>
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

      {/* Paiements en attente de synchronisation */}
      {pendingPayments.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Clock className="h-5 w-5" />
              Paiements en attente de synchronisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              {pendingPayments.length} paiement(s) seront synchronisés dès le retour d'internet
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Encaisser une commande existante */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Encaisser une commande
            </CardTitle>
            <CardDescription>
              Encaisser une commande existante
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sale-select">Vente à encaisser</Label>
              <Select value={selectedSale} onValueChange={setSelectedSale}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner une vente" />
                </SelectTrigger>
                <SelectContent>
                  {todaySales.map((sale: any) => (
                    <SelectItem key={sale.id} value={sale.id}>
                      Vente #{sale.id} - {sale.data?.customer_name || 'Client'} - {sale.data?.total_amount?.toLocaleString()} BIF
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment-amount">Montant</Label>
              <Input
                id="payment-amount"
                type="number"
                placeholder="Montant en BIF"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="payment-method">Méthode de paiement</Label>
              <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Espèces
                    </div>
                  </SelectItem>
                  <SelectItem value="check">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Chèque
                    </div>
                  </SelectItem>
                  <SelectItem value="card" disabled={!isOnline}>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Carte {!isOnline && "(Nécessite connexion)"}
                    </div>
                  </SelectItem>
                  <SelectItem value="mobile" disabled={!isOnline}>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Mobile Money {!isOnline && "(Nécessite connexion)"}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleProcessPayment}
              disabled={processing || !selectedSale || !paymentAmount}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {processing ? "Traitement..." : "Encaisser"}
            </Button>

            {!isOnline && paymentMethod === 'card' && (
              <p className="text-sm text-orange-600 text-center">
                ⚠️ Le paiement par carte nécessite une connexion internet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Vente rapide (à emporter) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Vente rapide (à emporter)
            </CardTitle>
            <CardDescription>
              Créer et encaisser directement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customer-name">Nom du client</Label>
              <Input
                id="customer-name"
                placeholder="Nom du client..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Sélection produits */}
            <div>
              <Label>Produits</Label>
              <Select onValueChange={(value) => {
                const product = products.find((p: any) => p.id.toString() === value);
                if (product) addToQuickSale(product);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Ajouter un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} - {parseFloat(product.selling_price || 0).toLocaleString()} BIF
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Panier vente rapide */}
            {quickSaleCart.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                {quickSaleCart.map((item) => (
                  <div key={item.product} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.price.toLocaleString()} BIF</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuickSaleQuantity(item.product, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuickSaleQuantity(item.product, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateQuickSaleQuantity(item.product, 0)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center font-bold">
              <span>Total:</span>
              <span className="text-lg">{quickSaleTotal.toLocaleString()} BIF</span>
            </div>

            <div>
              <Label htmlFor="quick-sale-method">Paiement</Label>
              <Select value={quickSaleMethod} onValueChange={(value: any) => setQuickSaleMethod(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Espèces
                    </div>
                  </SelectItem>
                  <SelectItem value="check">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Chèque
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleQuickSale}
              disabled={processing || quickSaleCart.length === 0 || !customerName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {processing ? "Traitement..." : "Créer et encaisser"}
            </Button>

            {!isOnline && (
              <p className="text-sm text-orange-600 text-center">
                La vente sera synchronisée automatiquement
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historique du jour */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ventes du jour
          </CardTitle>
          <CardDescription>
            {todaySales.length} vente(s) aujourd'hui {!isOnline && "(depuis le cache)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaySales.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune vente aujourd'hui
            </p>
          ) : (
            <div className="space-y-2">
              {todaySales.slice(0, 10).map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{sale.data?.customer_name || 'Client'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.data?.created_at || sale.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{sale.data?.total_amount?.toLocaleString()} BIF</p>
                    <Badge variant={sale.data?.status === 'paid' ? 'default' : 'secondary'}>
                      {sale.data?.status === 'paid' ? 'Payée' : 'En attente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
