import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

interface InvoiceItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  product_code?: string;
}

interface InvoiceData {
  invoice_number: string;
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    tax_number: string;
  };
  customer: {
    name: string;
    table: string;
    datetime_full: string;
  };
  server: {
    name: string;
  };
  items: InvoiceItem[];
  summary: {
    total_items: number;
    total_quantity: number;
    subtotal: number;
    total_amount: number;
    amount_in_words: string;
  };
  payment: {
    method: string;
    currency_symbol: string;
  };
  footer_message: string;
}

interface PrintableInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: InvoiceData | null;
  onPrint: () => void;
}

export function PrintableInvoice({ isOpen, onClose, invoiceData, onPrint }: PrintableInvoiceProps) {
  if (!invoiceData) return null;

  const handlePrint = () => {
    window.print();
    onPrint();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-white">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span>Facture</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Imprimer
              </Button>
              <Button size="sm" variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 pt-0">
          {/* Style pour l'impression */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .printable-invoice, .printable-invoice * {
                visibility: visible;
              }
              .printable-invoice {
                position: absolute;
                left: 0;
                top: 0;
                width: 80mm;
                font-size: 12px;
                line-height: 1.2;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
          
          <div className="printable-invoice font-mono text-xs leading-tight">
            {/* En-tête entreprise */}
            <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
              <div className="font-bold text-sm">{invoiceData.company.name}</div>
              <div>{invoiceData.company.address}</div>
              <div>Tél: {invoiceData.company.phone}</div>
              <div>{invoiceData.company.tax_number}</div>
            </div>

            {/* Informations facture */}
            <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
              <div className="flex justify-between">
                <span>Facture N°:</span>
                <span className="font-bold">{invoiceData.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{invoiceData.customer.datetime_full}</span>
              </div>
              <div className="flex justify-between">
                <span>Client:</span>
                <span>{invoiceData.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Table:</span>
                <span>{invoiceData.customer.table}</span>
              </div>
              <div className="flex justify-between">
                <span>Serveur:</span>
                <span>{invoiceData.server.name}</span>
              </div>
            </div>

            {/* Articles */}
            <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
              <div className="font-bold mb-1">ARTICLES</div>
              {invoiceData.items.map((item, index) => (
                <div key={index} className="mb-1">
                  <div className="flex justify-between">
                    <span className="flex-1">{item.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>{item.quantity} x {item.unit_price.toLocaleString()} {invoiceData.payment.currency_symbol}</span>
                    <span className="font-bold">{item.total.toLocaleString()} {invoiceData.payment.currency_symbol}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totaux */}
            <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
              <div className="flex justify-between">
                <span>Sous-total:</span>
                <span>{invoiceData.summary.subtotal.toLocaleString()} {invoiceData.payment.currency_symbol}</span>
              </div>
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL:</span>
                <span>{invoiceData.summary.total_amount.toLocaleString()} {invoiceData.payment.currency_symbol}</span>
              </div>
              <div className="text-xs mt-1">
                <div>Payé par: {invoiceData.payment.method}</div>
                <div>Articles: {invoiceData.summary.total_items} ({invoiceData.summary.total_quantity} pcs)</div>
              </div>
            </div>

            {/* Pied de page */}
            <div className="text-center text-xs">
              <div className="mb-1">{invoiceData.footer_message}</div>
              <div>Merci de votre visite!</div>
              <div className="mt-2">
                ================================
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
