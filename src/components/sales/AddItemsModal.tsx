import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { useProducts } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { salesService } from "@/services/api";

interface AddItemsModalProps {
  sale: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemToAdd {
  product: number;
  productName: string;
  quantity: number;
  notes: string;
  price: number;
}

export function AddItemsModal({ sale, open, onClose, onSuccess }: AddItemsModalProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<ItemToAdd[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récupérer les produits disponibles
  const { data: productsData, isLoading: productsLoading } = useProducts({ is_active: true });
  const products = productsData?.results || [];

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un produit",
        variant: "destructive"
      });
      return;
    }

    const product = products.find((p: any) => p.id.toString() === selectedProduct);
    if (!product) return;

    const newItem: ItemToAdd = {
      product: product.id,
      productName: product.name,
      quantity: quantity,
      notes: notes,
      price: typeof product.selling_price === 'string' 
        ? parseFloat(product.selling_price) 
        : product.selling_price
    };

    setItems([...items, newItem]);
    
    // Réinitialiser
    setSelectedProduct("");
    setQuantity(1);
    setNotes("");

    toast({
      title: "Article ajouté",
      description: `${newItem.quantity}x ${newItem.productName} ajouté à la liste`
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un article",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const itemsToSend = items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        notes: item.notes
      }));

      await salesService.addItemsToSale(Number(sale.id), itemsToSend);

      toast({
        title: "✅ Articles ajoutés",
        description: `${items.length} article(s) ajouté(s) avec succès à la vente #${sale.id}`,
      });

      // Réinitialiser et fermer
      setItems([]);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur ajout articles:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de l'ajout des articles",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Ajouter des articles à la vente #{sale?.id}
          </DialogTitle>
          <DialogDescription>
            Ajoutez des articles supplémentaires à cette vente avant le paiement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulaire d'ajout */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sélection du produit */}
              <div className="space-y-2">
                <Label htmlFor="product">Produit</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsLoading ? (
                      <SelectItem value="loading" disabled>Chargement...</SelectItem>
                    ) : (
                      products.map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - {parseFloat(product.selling_price).toLocaleString()} BIF
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantité */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Input
                id="notes"
                placeholder="Ex: Sans oignons, bien cuit..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button onClick={handleAddItem} className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter à la liste
            </Button>
          </div>

          {/* Liste des articles à ajouter */}
          {items.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Articles à ajouter ({items.length})</h3>
              <div className="border rounded-lg divide-y">
                {items.map((item, index) => (
                  <div key={index} className="p-3 flex items-center justify-between hover:bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium">{item.quantity}x {item.productName}</p>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground">📝 {item.notes}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {item.price.toLocaleString()} BIF × {item.quantity} = {(item.price * item.quantity).toLocaleString()} BIF
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Résumé */}
              <div className="bg-primary/10 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total articles:</span>
                  <span className="font-semibold">{totalItems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Montant à ajouter:</span>
                  <span className="font-semibold">{totalPrice.toLocaleString()} BIF</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Nouveau total:</span>
                  <span className="text-primary">
                    {(parseFloat(sale?.total_amount || 0) + totalPrice).toLocaleString()} BIF
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={items.length === 0 || isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? "Ajout en cours..." : `Valider (${items.length} article${items.length > 1 ? 's' : ''})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
