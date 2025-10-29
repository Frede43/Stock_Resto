import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DollarSign, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { salesService } from "@/services/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PayButtonProps {
  sale: any;
  onSuccess: () => void;
  variant?: "default" | "large";
}

export function PayButton({ sale, onSuccess, variant = "default" }: PayButtonProps) {
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Vérifier si le paiement est possible
  const canPay = sale.status !== 'paid' && sale.status !== 'cancelled' && sale.status !== 'completed';

  const handlePay = async () => {
    setIsProcessing(true);

    try {
      // Extraire l'ID numérique
      const numericId = typeof sale.id === 'string' 
        ? parseInt(sale.id.replace(/\D/g, ''), 10)
        : sale.id;

      if (isNaN(numericId)) {
        throw new Error("ID de vente invalide");
      }

      await salesService.markAsPaid(numericId);

      toast({
        title: "✅ Paiement enregistré",
        description: `La vente #${sale.id} a été payée avec succès. Le stock a été mis à jour.`,
        duration: 5000,
      });

      setShowConfirm(false);
      onSuccess();
    } catch (error: any) {
      console.error('Erreur paiement:', error);
      
      const errorMessage = error.response?.data?.error || error.message || "Erreur lors du paiement";
      
      toast({
        title: "❌ Erreur de paiement",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!canPay) {
    return null;
  }

  const totalAmount = parseFloat(sale.total_amount || sale.total || 0);

  if (variant === "large") {
    return (
      <>
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-6 w-6 mr-3 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>
              <DollarSign className="h-6 w-6 mr-3" />
              PAYER - {totalAmount.toLocaleString()} BIF
            </>
          )}
        </Button>

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer le paiement</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Êtes-vous sûr de vouloir enregistrer le paiement de cette vente ?</p>
                <div className="bg-muted p-4 rounded-lg space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Vente:</span>
                    <span>#{sale.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Table:</span>
                    <span>{sale.table_number || sale.table || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                    <span>Montant:</span>
                    <span className="text-primary">{totalAmount.toLocaleString()} BIF</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  ⚠️ Cette action mettra à jour le stock et ne pourra pas être annulée.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePay}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Confirmer le paiement
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Variant normal (petit bouton)
  return (
    <>
      <Button
        onClick={() => setShowConfirm(true)}
        disabled={isProcessing}
        variant="default"
        size="sm"
        className="bg-green-600 hover:bg-green-700"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <DollarSign className="h-4 w-4 mr-2" />
        )}
        Payer
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le paiement</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmer le paiement de {totalAmount.toLocaleString()} BIF pour la vente #{sale.id} ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePay}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Traitement..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
