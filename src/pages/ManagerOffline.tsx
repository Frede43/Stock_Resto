// Page dédiée pour les MANAGERS avec fonctionnalités offline complètes
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useOfflineManager } from "@/hooks/use-offline-manager";
import { useProducts } from "@/hooks/use-api";
import {
  BarChart3,
  Wifi,
  WifiOff,
  Clock,
  TrendingUp,
  Package,
  Users,
  AlertCircle,
  CheckCircle,
  FileText,
  RefreshCw,
} from "lucide-react";

export default function ManagerOffline() {
  const { toast } = useToast();
  const {
    isOnline,
    cachedReports,
    cachedProducts,
    cachedStaff,
    pendingInventoryAdjustments,
    getCachedReports,
    recordInventoryAdjustment,
    getStaffList,
    getProductsList,
    isDataFresh,
    updateProductsCache,
    unavailableOffline,
  } = useOfflineManager();

  const { data: productsData } = useProducts({});

  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  // Mettre à jour le cache quand les données API arrivent
  useEffect(() => {
    if (productsData?.results) {
      updateProductsCache(productsData.results);
    }
  }, [productsData, updateProductsCache]);

  const reports = getCachedReports();
  const products = getProductsList();
  const staff = getStaffList();
  const dataIsFresh = isDataFresh();

  const handleInventoryAdjustment = async () => {
    if (!selectedProduct || !adjustmentQuantity || !adjustmentReason) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    const result = await recordInventoryAdjustment({
      product_id: parseInt(selectedProduct),
      quantity_change: parseInt(adjustmentQuantity),
      reason: adjustmentReason,
      notes: adjustmentNotes,
    });

    if (result.success) {
      setSelectedProduct('');
      setAdjustmentQuantity('');
      setAdjustmentReason('');
      setAdjustmentNotes('');
    }

    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header avec indicateur de connexion */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord Manager</h1>
          <p className="text-muted-foreground">Rapports et gestion - Mode offline disponible</p>
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

      {/* Avertissement données en cache */}
      {!isOnline && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="h-5 w-5" />
              Données en cache
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              Vous consultez une version sauvegardée des données. Les informations peuvent ne pas être à jour.
              {reports && (
                <span className="block mt-1">
                  Dernière mise à jour: {new Date(reports.cached_at).toLocaleString()}
                  {dataIsFresh ? " (Données récentes ✅)" : " (Données anciennes ⚠️)"}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Ajustements d'inventaire en attente */}
      {pendingInventoryAdjustments.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Clock className="h-5 w-5" />
              Ajustements d'inventaire en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700">
              {pendingInventoryAdjustments.length} ajustement(s) seront synchronisés dès le retour d'internet
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistiques de vente */}
      {reports && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ventes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.sales_summary.total_sales}</div>
              <p className="text-xs text-muted-foreground">
                {reports.sales_summary.paid_sales} payées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reports.sales_summary.total_revenue.toLocaleString()} BIF
              </div>
              <p className="text-xs text-muted-foreground">
                Depuis le cache
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventes en attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.sales_summary.pending_sales}</div>
              <p className="text-xs text-muted-foreground">
                À encaisser
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits en stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">
                Références
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ajustement d'inventaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ajustement d'inventaire
            </CardTitle>
            <CardDescription>
              Enregistrer une livraison ou un ajustement de stock
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="product-select">Produit</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} (Stock actuel: {product.current_stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="adjustment-quantity">Quantité (+ ou -)</Label>
              <Input
                id="adjustment-quantity"
                type="number"
                placeholder="Ex: +50 ou -10"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="adjustment-reason">Raison</Label>
              <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner une raison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery">Livraison reçue</SelectItem>
                  <SelectItem value="return">Retour fournisseur</SelectItem>
                  <SelectItem value="damage">Produit endommagé</SelectItem>
                  <SelectItem value="theft">Vol/Perte</SelectItem>
                  <SelectItem value="correction">Correction d'inventaire</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="adjustment-notes">Notes (optionnel)</Label>
              <Textarea
                id="adjustment-notes"
                placeholder="Détails supplémentaires..."
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <Button
              onClick={handleInventoryAdjustment}
              disabled={processing || !selectedProduct || !adjustmentQuantity || !adjustmentReason}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {processing ? "Enregistrement..." : "Enregistrer l'ajustement"}
            </Button>

            {!isOnline && (
              <p className="text-sm text-orange-600 text-center">
                L'ajustement sera synchronisé automatiquement
              </p>
            )}
          </CardContent>
        </Card>

        {/* Liste du personnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Personnel
            </CardTitle>
            <CardDescription>
              {staff.length} membre(s) {!isOnline && "(depuis le cache)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {staff.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun membre du personnel en cache
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {staff.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{member.first_name} {member.last_name}</p>
                      <p className="text-sm text-muted-foreground">{member.username}</p>
                    </div>
                    <Badge variant={member.is_active ? "default" : "secondary"}>
                      {member.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Produits en stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventaire
          </CardTitle>
          <CardDescription>
            {products.length} produit(s) en stock {!isOnline && "(depuis le cache)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun produit en cache
            </p>
          ) : (
            <div className="space-y-2">
              {products.slice(0, 10).map((product: any) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.category_name || 'Sans catégorie'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{product.current_stock} unités</p>
                    <Badge variant={
                      product.current_stock <= 0 ? "destructive" :
                      product.current_stock <= (product.minimum_stock || 5) ? "secondary" :
                      "default"
                    }>
                      {product.current_stock <= 0 ? "Rupture" :
                       product.current_stock <= (product.minimum_stock || 5) ? "Faible" :
                       "OK"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fonctionnalités non disponibles hors ligne */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertCircle className="h-5 w-5" />
            Fonctionnalités nécessitant une connexion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-red-700">
            <li>❌ Statistiques de vente en temps réel</li>
            <li>❌ Modification des permissions utilisateur</li>
            <li>❌ Paramètres système critiques</li>
            <li>❌ Export de rapports PDF/Excel avec données actuelles</li>
            <li>❌ Gestion des fournisseurs (création/modification)</li>
          </ul>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => unavailableOffline("Cette fonctionnalité")}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tenter d'accéder (nécessite connexion)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
