import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Truck,
  Plus,
  Package,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Check,
  X,
  Trash2
} from "lucide-react";
import { useSupplies, useSuppliers, useProducts, useCreateSupply, useValidateSupply, useRejectSupply } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

interface Supply {
  id: string;
  supplierName: string;
  deliveryDate: string;
  status: "pending" | "received" | "validated" | "rejected";
  items: {
    productName: string;
    quantityOrdered: number;
    quantityReceived: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  notes?: string;
}

const mockSupplies: Supply[] = [
  {
    id: "1",
    supplierName: "Brarudi SA",
    deliveryDate: "2024-08-14",
    status: "validated",
    items: [
      { productName: "Bière Mutzig", quantityOrdered: 48, quantityReceived: 48, unitPrice: 800, totalPrice: 38400 },
      { productName: "Primus", quantityOrdered: 24, quantityReceived: 24, unitPrice: 750, totalPrice: 18000 }
    ],
    totalAmount: 56400,
    notes: "Livraison conforme, produits en bon état"
  },
  {
    id: "2",
    supplierName: "Distillerie Centrale",
    deliveryDate: "2024-08-15",
    status: "pending",
    items: [
      { productName: "Whisky JW Red", quantityOrdered: 12, quantityReceived: 0, unitPrice: 35000, totalPrice: 420000 },
      { productName: "Vodka Smirnoff", quantityOrdered: 6, quantityReceived: 0, unitPrice: 40000, totalPrice: 240000 }
    ],
    totalAmount: 660000
  }
];

const mockSuppliers = [
  { id: "1", name: "Brarudi SA", category: "Bières" },
  { id: "2", name: "Distillerie Centrale", category: "Liqueurs" },
  { id: "3", name: "Coca-Cola Burundi", category: "Boissons" }
];

export default function Supplies() {
  const { user, isAdmin, isManager } = useAuth();
  const [showNewSupplyDialog, setShowNewSupplyDialog] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [newSupply, setNewSupply] = useState({
    supplier: "",
    deliveryDate: "",
    notes: "",
    items: [{ product: "", quantityOrdered: 1, unitPrice: 0 }]
  });
  const { toast } = useToast();

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Vérification des permissions d'accès
  if (!user || !user.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Seuls les admins et managers peuvent accéder aux approvisionnements
  if (!isAdmin() && !isManager()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h2>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder aux approvisionnements.</p>
          <p className="text-sm text-gray-500 mt-2">Cette page est réservée aux administrateurs et gérants.</p>
        </div>
      </div>
    );
  }

  // Récupérer les données des approvisionnements depuis l'API
  const {
    data: suppliesData,
    isLoading: suppliesLoading,
    error: suppliesError,
    refetch: refetchSupplies
  } = useSupplies();

  // Récupérer les fournisseurs
  const {
    data: suppliersData,
    isLoading: suppliersLoading
  } = useSuppliers({ is_active: true });

  // Récupérer les produits
  const {
    data: productsData,
    isLoading: productsLoading
  } = useProducts();

  // Hooks pour les mutations
  const createSupplyMutation = useCreateSupply();
  const validateSupplyMutation = useValidateSupply();
  const rejectSupplyMutation = useRejectSupply();

  // Mapper les données de l'API avec formatage amélioré
  const supplies = (suppliesData as any)?.results?.map((supply: any) => {
    return {
      id: supply.id.toString(),
      supplierName: supply.supplier?.name || supply.supplier_name || "Fournisseur inconnu",
      deliveryDate: supply.delivery_date || supply.order_date,
      status: supply.status, // Garder le statut original
      totalAmount: supply.total_amount || 0,
      reference: supply.reference || `ACH-${supply.id}`,
      items: supply.items?.map((item: any) => ({
        productName: item.product?.name || item.product_name || 'Produit inconnu',
        quantityOrdered: item.quantity_ordered || 0,
        quantityReceived: item.quantity_received || 0,
        unitPrice: item.unit_price || 0,
        totalPrice: item.total_price || ((item.quantity_ordered || 0) * (item.unit_price || 0))
      })) || [],
      notes: supply.notes || ''
    };
  }) || [];

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return { variant: "warning" as const, label: "En attente", icon: Clock, color: "text-yellow-600" };
      case "received":
        return { variant: "secondary" as const, label: "Reçue", icon: Truck, color: "text-blue-600" };
      case "validated":
        return { variant: "success" as const, label: "Validée", icon: CheckCircle, color: "text-green-600" };
      case "cancelled":
        return { variant: "destructive" as const, label: "Annulée", icon: AlertTriangle, color: "text-red-600" };
      default:
        return { variant: "secondary" as const, label: "Inconnu", icon: Clock, color: "text-gray-600" };
    }
  };

  const validateDelivery = (supplyId: string) => {
    validateSupplyMutation.mutate(parseInt(supplyId), {
      onSuccess: () => {
        toast({
          title: "Succès",
          description: "Livraison validée et stock mis à jour automatiquement.",
        });
        refetchSupplies(); // Actualiser la liste
      },
      onError: (error: any) => {
        toast({
          title: "Erreur",
          description: error.message || "Erreur lors de la validation.",
          variant: "destructive"
        });
      }
    });
  };

  const rejectDelivery = (supplyId: string) => {
    rejectSupplyMutation.mutate(parseInt(supplyId), {
      onSuccess: () => {
        toast({
          title: "Livraison rejetée",
          description: "La livraison a été rejetée.",
        });
        refetchSupplies(); // Actualiser la liste
      },
      onError: (error: any) => {
        toast({
          title: "Erreur",
          description: error.message || "Erreur lors du rejet.",
          variant: "destructive"
        });
      }
    });
  };

  // Fonction pour marquer un approvisionnement comme reçu
  const markAsReceived = async (supplyId: string) => {
    try {
      // Récupérer les détails de l'approvisionnement
      const response = await fetch(`http://localhost:8000/api/inventory/supplies/${supplyId}/`);
      if (!response.ok) throw new Error('Erreur lors de la récupération');

      const supplyData = await response.json();

      // Marquer tous les items comme reçus avec la quantité commandée
      const updatedItems = supplyData.items.map((item: any) => ({
        ...item,
        quantity_received: item.quantity_ordered
      }));

      // Mettre à jour le statut
      const updateResponse = await fetch(`http://localhost:8000/api/inventory/supplies/${supplyId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...supplyData,
          status: 'received',
          items: updatedItems
        })
      });

      if (!updateResponse.ok) throw new Error('Erreur lors de la mise à jour');

      toast({
        title: "Succès",
        description: "Approvisionnement marqué comme reçu.",
      });
      refetchSupplies();

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du statut.",
        variant: "destructive"
      });
    }
  };

  // Fonctions de gestion du formulaire
  const addItem = () => {
    setNewSupply(prev => ({
      ...prev,
      items: [...prev.items, { product: "", quantityOrdered: 1, unitPrice: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setNewSupply(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setNewSupply(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotal = () => {
    return newSupply.items.reduce((total, item) => {
      return total + (item.quantityOrdered * item.unitPrice);
    }, 0);
  };

  const addNewSupply = () => {
    // Validation
    if (!newSupply.supplier || !newSupply.deliveryDate) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fournisseur et une date de livraison.",
        variant: "destructive"
      });
      return;
    }

    if (newSupply.items.some(item => !item.product || item.quantityOrdered <= 0 || item.unitPrice <= 0)) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs des articles avec des valeurs valides.",
        variant: "destructive"
      });
      return;
    }

    const supplyData = {
      supplier: parseInt(newSupply.supplier),
      delivery_date: newSupply.deliveryDate,
      notes: newSupply.notes,
      items: newSupply.items.map(item => ({
        product: parseInt(item.product),
        quantity_ordered: item.quantityOrdered,
        quantity_received: 0,
        unit_price: item.unitPrice
      }))
    };

    createSupplyMutation.mutate(supplyData, {
      onSuccess: () => {
        toast({
          title: "Succès",
          description: "Approvisionnement créé avec succès.",
        });
        setShowNewSupplyDialog(false);
        setNewSupply({
          supplier: "",
          deliveryDate: "",
          notes: "",
          items: [{ product: "", quantityOrdered: 1, unitPrice: 0 }]
        });
        refetchSupplies();
      },
      onError: (error: any) => {
        toast({
          title: "Erreur",
          description: error.message || "Erreur lors de la création de l'approvisionnement.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Approvisionnements
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Gérez vos livraisons et mettez à jour vos stocks
              </p>
            </div>
            <Dialog open={showNewSupplyDialog} onOpenChange={setShowNewSupplyDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nouvelle livraison</span>
                  <span className="sm:hidden">Nouveau</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nouvelle livraison</DialogTitle>
                  <DialogDescription>
                    Enregistrez une nouvelle livraison de marchandises
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fournisseur *</Label>
                      <Select value={newSupply.supplier} onValueChange={(value) => setNewSupply(prev => ({...prev, supplier: value}))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un fournisseur" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliersLoading ? (
                            <SelectItem value="loading" disabled>Chargement...</SelectItem>
                          ) : (
                            (suppliersData as any)?.results?.map((supplier: any) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name}
                              </SelectItem>
                            )) || []
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date de livraison *</Label>
                      <Input
                        type="date"
                        value={newSupply.deliveryDate}
                        onChange={(e) => setNewSupply(prev => ({...prev, deliveryDate: e.target.value}))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (optionnel)</Label>
                    <Input
                      placeholder="Notes sur l'approvisionnement..."
                      value={newSupply.notes}
                      onChange={(e) => setNewSupply(prev => ({...prev, notes: e.target.value}))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Produits *</Label>
                    {newSupply.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2 items-end">
                        <div>
                          <Select value={item.product} onValueChange={(value) => updateItem(index, 'product', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Produit" />
                            </SelectTrigger>
                            <SelectContent>
                              {productsLoading ? (
                                <SelectItem value="loading" disabled>Chargement...</SelectItem>
                              ) : (
                                (productsData as any)?.results?.map((product: any) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} - {product.selling_price} FBu
                                  </SelectItem>
                                )) || []
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Input
                            placeholder="Qté"
                            type="number"
                            min="1"
                            value={item.quantityOrdered}
                            onChange={(e) => updateItem(index, 'quantityOrdered', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="Prix unitaire (FBu)"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {(item.quantityOrdered * item.unitPrice).toLocaleString()} FBu
                          </span>
                          {newSupply.items.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        onClick={addItem}
                        className="flex-1 mr-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un produit
                      </Button>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Total</div>
                        <div className="text-lg font-bold">
                          {calculateTotal().toLocaleString()} FBu
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={addNewSupply} 
                    className="w-full"
                    disabled={createSupplyMutation.isPending}
                  >
                    {createSupplyMutation.isPending ? "Enregistrement..." : "Enregistrer la livraison"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Dialog de détails d'approvisionnement */}
          {selectedSupply && (
            <Dialog open={!!selectedSupply} onOpenChange={() => setSelectedSupply(null)}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Détails de l'approvisionnement - {selectedSupply.supplierName}
                  </DialogTitle>
                  <DialogDescription>
                    Informations complètes sur la livraison du {formatDate(selectedSupply.deliveryDate)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Informations générales */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Fournisseur</Label>
                      <p className="text-sm bg-muted p-2 rounded">{selectedSupply.supplierName}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Date de livraison</Label>
                      <p className="text-sm bg-muted p-2 rounded">{formatDate(selectedSupply.deliveryDate)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Statut</Label>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const statusInfo = getStatusInfo(selectedSupply.status);
                          const StatusIcon = statusInfo.icon;
                          return (
                            <Badge variant={statusInfo.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Montant total</Label>
                      <p className="text-sm bg-muted p-2 rounded font-bold">
                        {selectedSupply.totalAmount.toLocaleString()} FBu
                      </p>
                    </div>
                  </div>

                  {/* Liste détaillée des produits */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Produits commandés ({selectedSupply.items.length} article{selectedSupply.items.length > 1 ? 's' : ''})
                    </Label>
                    {selectedSupply.items.length === 0 ? (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        ⚠️ Aucun produit trouvé pour cet approvisionnement
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted px-4 py-2 grid grid-cols-5 gap-4 text-sm font-medium">
                          <span>Produit</span>
                          <span>Qté commandée</span>
                          <span>Qté reçue</span>
                          <span>Prix unitaire</span>
                          <span>Total</span>
                        </div>
                        {selectedSupply.items.map((item, index) => (
                          <div key={index} className="px-4 py-3 grid grid-cols-5 gap-4 text-sm border-t">
                            <span className="font-medium">{item.productName}</span>
                            <span>{item.quantityOrdered}</span>
                            <span className={item.quantityReceived !== item.quantityOrdered ? 'text-orange-600 font-medium' : 'text-green-600'}>
                              {item.quantityReceived}
                            </span>
                            <span>{item.unitPrice.toLocaleString()} FBu</span>
                            <span className="font-medium">{item.totalPrice.toLocaleString()} FBu</span>
                          </div>
                        ))}
                        {/* Total général */}
                        <div className="px-4 py-3 bg-gray-50 border-t font-medium text-sm">
                          <div className="grid grid-cols-5 gap-4">
                            <span className="col-span-4 text-right">Total général:</span>
                            <span className="text-lg font-bold text-green-600">
                              {selectedSupply.totalAmount.toLocaleString()} FBu
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {selectedSupply.notes && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Notes</Label>
                      <div className="p-3 bg-muted rounded text-sm">
                        {selectedSupply.notes}
                      </div>
                    </div>
                  )}

                  {/* Actions dans le dialog */}
                  <div className="flex gap-2 pt-4 border-t">
                    {/* Boutons selon le statut et les permissions */}
                    {selectedSupply.status === "pending" && (isAdmin || isManager) && (
                      <Button
                        onClick={() => {
                          markAsReceived(selectedSupply.id);
                          setSelectedSupply(null);
                        }}
                        className="gap-2 flex-1"
                        variant="outline"
                      >
                        <Truck className="h-4 w-4" />
                        Marquer comme reçu
                      </Button>
                    )}

                    {selectedSupply.status === "received" && (isAdmin || isManager) && (
                      <>
                        <Button
                          onClick={() => {
                            validateDelivery(selectedSupply.id);
                            setSelectedSupply(null);
                          }}
                          className="gap-2 flex-1"
                          disabled={validateSupplyMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                          {validateSupplyMutation.isPending ? "Validation..." : "Valider et mettre à jour le stock"}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            rejectDelivery(selectedSupply.id);
                            setSelectedSupply(null);
                          }}
                          className="gap-2 flex-1"
                          disabled={rejectSupplyMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                          {rejectSupplyMutation.isPending ? "Rejet..." : "Rejeter"}
                        </Button>
                      </>
                    )}

                    {/* Bouton fermer toujours disponible */}
                    <Button
                      variant="outline"
                      onClick={() => setSelectedSupply(null)}
                      className="gap-2"
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Supplies List */}
          <div className="space-y-4">
            {suppliesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chargement des approvisionnements...</p>
                </div>
              </div>
            ) : supplies.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun approvisionnement trouvé</p>
                  <p className="text-sm text-muted-foreground">Créez votre première livraison</p>
                </div>
              </div>
            ) : supplies.map((supply) => {
              const statusInfo = getStatusInfo(supply.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={supply.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Truck className="h-5 w-5" />
                          {supply.supplierName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Livraison: {formatDate(supply.deliveryDate)}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge variant={statusInfo.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                        <p className="text-lg font-bold mt-1">
                          {supply.totalAmount.toLocaleString()} FBu
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Items */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Produits commandés ({supply.items.length}):</h4>
                        {supply.items.length === 0 ? (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                            ⚠️ Aucun produit trouvé pour cet approvisionnement
                          </div>
                        ) : (
                          supply.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded border">
                              <div className="flex-1">
                                <span className="font-medium text-sm">{item.productName}</span>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Prix unitaire: {item.unitPrice.toLocaleString()} FBu
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-sm font-medium ${
                                  item.quantityReceived < item.quantityOrdered ? 'text-orange-600' : 'text-green-600'
                                }`}>
                                  {item.quantityReceived}/{item.quantityOrdered} unités
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Total: {item.totalPrice.toLocaleString()} FBu
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Notes */}
                      {supply.notes && (
                        <div className="p-3 bg-muted rounded">
                          <p className="text-sm">{supply.notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSupply(supply)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Détails
                          </Button>
                        </div>

                        {/* Boutons d'action selon le statut */}
                        {supply.status === "received" && (isAdmin || isManager) && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => validateDelivery(supply.id)}
                              className="gap-2"
                              disabled={validateSupplyMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                              {validateSupplyMutation.isPending ? "Validation..." : "Valider"}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => rejectDelivery(supply.id)}
                              className="gap-2"
                              disabled={rejectSupplyMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                              {rejectSupplyMutation.isPending ? "Rejet..." : "Rejeter"}
                            </Button>
                          </div>
                        )}

                        {/* Bouton pour changer le statut vers "reçu" si admin/manager */}
                        {supply.status === "pending" && (isAdmin || isManager) && (
                          <Button
                            variant="outline"
                            onClick={() => markAsReceived(supply.id)}
                            className="gap-2"
                          >
                            <Truck className="h-4 w-4" />
                            Marquer comme reçu
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
  );
}
