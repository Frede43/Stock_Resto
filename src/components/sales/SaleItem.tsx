import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Eye,
  X,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  Printer
} from "lucide-react";
import { Sale, SaleStatus } from "@/types/sales";
import { StatusBadge } from "./StatusBadge";
import { PayButton } from "./PayButton";

interface SaleItemProps {
  sale: Sale;
  onApprove: (saleId: string) => void;
  onCancel: (saleId: string) => void;
  onMarkAsPaid: (saleId: string) => void;
  onAddItems?: (sale: Sale) => void;
  onPaySuccess?: () => void;
  onViewInvoice?: (sale: Sale) => void;
  isApprovePending?: boolean;
  isCancelPending?: boolean;
  isMarkAsPaidPending?: boolean;
}

const getStatusInfo = (status: SaleStatus) => {
  switch (status) {
    case "paid":
      return { variant: "success" as const, label: "Payée", icon: CheckCircle };
    case "pending":
      return { variant: "warning" as const, label: "En attente", icon: Clock };
    case "preparing":
      return { variant: "secondary" as const, label: "En préparation", icon: Clock };
    case "ready":
      return { variant: "default" as const, label: "Prête", icon: CheckCircle };
    case "served":
      return { variant: "default" as const, label: "Servie", icon: CheckCircle };
    case "cancelled":
      return { variant: "destructive" as const, label: "Annulée", icon: X };
    case "completed":
      return { variant: "success" as const, label: "Terminée", icon: CheckCircle };
    default:
      return { variant: "secondary" as const, label: "Inconnu", icon: AlertTriangle };
  }
};

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case "cash": return "Espèces";
    case "card": return "Carte";
    case "mobile": return "Mobile Money";
    default: return method;
  }
};

export const SaleItem = memo(function SaleItem({ 
  sale, 
  onApprove, 
  onCancel, 
  onMarkAsPaid,
  onAddItems,
  onPaySuccess,
  onViewInvoice,
  isApprovePending = false,
  isCancelPending = false,
  isMarkAsPaidPending = false
}: SaleItemProps) {
  const statusInfo = getStatusInfo(sale.status);
  const StatusIcon = statusInfo.icon;
  const canAddItems = sale.status !== 'paid' && sale.status !== 'cancelled' && sale.status !== 'completed';

  return (
    <div
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
          <FileText className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{sale.id}</h3>
            <StatusBadge status={sale.status} />
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {sale.date} à {sale.time}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {sale.server}
              </span>
            </div>
            <div>
              {sale.table} • {sale.items.length} article(s) • {getPaymentMethodLabel(sale.paymentMethod)}
              {sale.customer && ` • ${sale.customer}`}
            </div>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-xl font-bold mb-2">
          {sale.total.toLocaleString()} FBu
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Détails de la vente {sale.id}</DialogTitle>
                <DialogDescription>
                  Informations complètes de la transaction
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date et heure</p>
                    <p className="font-medium">{sale.date} à {sale.time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Serveur</p>
                    <p className="font-medium">{sale.server}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Table</p>
                    <p className="font-medium">{sale.table}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paiement</p>
                    <p className="font-medium">{getPaymentMethodLabel(sale.paymentMethod)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Articles vendus</h4>
                  <div className="space-y-2">
                    {sale.items.map((item, index) => (
                      <div key={index} className="flex justify-between p-2 bg-muted rounded">
                        <span>{item.name} x{item.quantity}</span>
                        <span className="font-medium">{item.total.toLocaleString()} FBu</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-1">
                    <span>Sous-total:</span>
                    <span>{sale.subtotal.toLocaleString()} FBu</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Taxes:</span>
                    <span>{sale.tax.toLocaleString()} FBu</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{sale.total.toLocaleString()} FBu</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bouton Facture */}
          {onViewInvoice && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewInvoice(sale)}
              className="gap-1"
              title="Voir et imprimer la facture"
            >
              <Printer className="h-4 w-4" />
              Facture
            </Button>
          )}

          {/* Bouton Ajouter des articles */}
          {canAddItems && onAddItems && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddItems(sale)}
              className="gap-1"
              title="Ajouter des articles"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          )}

          {/* Bouton Payer */}
          <PayButton 
            sale={sale} 
            onSuccess={onPaySuccess || (() => {})} 
            variant="default"
          />

          {/* Autres actions */}
          {sale.status === "pending" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApprove(sale.id)}
                className="gap-1"
                disabled={isApprovePending}
                title="Approuver (sans paiement)"
              >
                {isApprovePending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onCancel(sale.id)}
                className="gap-1"
                disabled={isCancelPending}
                title="Annuler la vente"
              >
                {isCancelPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
