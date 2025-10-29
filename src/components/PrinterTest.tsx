import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Printer, CheckCircle, XCircle, Settings, TestTube } from "lucide-react";

interface PrinterTestProps {
  className?: string;
}

export function PrinterTest({ className }: PrinterTestProps) {
  const [printerName, setPrinterName] = useState(localStorage.getItem('receipt_printer_name') || '');
  const [autoPrint, setAutoPrint] = useState(localStorage.getItem('auto_print_receipts') === 'true');
  const [isTestingPrinter, setIsTestingPrinter] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const { toast } = useToast();

  // Sauvegarder les paramètres
  const saveSettings = () => {
    localStorage.setItem('receipt_printer_name', printerName);
    localStorage.setItem('auto_print_receipts', autoPrint.toString());
    
    toast({
      title: "Paramètres sauvegardés",
      description: "Configuration d'impression mise à jour",
    });
  };

  // Test d'impression
  const testPrinter = async () => {
    setIsTestingPrinter(true);
    setPrinterStatus('unknown');

    try {
      console.log("🖨️ Test d'impression...");
      
      // Créer une page de test
      const testContent = `
        <html>
          <head>
            <title>Test d'impression</title>
            <style>
              @media print {
                body { 
                  font-family: monospace; 
                  font-size: 12px; 
                  width: 80mm; 
                  margin: 0; 
                  padding: 10px;
                }
              }
            </style>
          </head>
          <body>
            <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
              <h3>BAR STOCK WISE</h3>
              <p>Test d'impression</p>
            </div>
            
            <div style="margin-bottom: 10px;">
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Imprimante:</strong> ${printerName || 'Par défaut'}</p>
            </div>
            
            <div style="border-top: 1px dashed #000; padding-top: 10px; text-align: center;">
              <p>✅ Test d'impression réussi!</p>
              <p>Votre imprimante fonctionne correctement.</p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p>================================</p>
            </div>
          </body>
        </html>
      `;

      // Ouvrir une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(testContent);
        printWindow.document.close();
        
        // Attendre que le contenu soit chargé
        printWindow.onload = () => {
          printWindow.print();
          
          // Fermer la fenêtre après impression
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        };

        setPrinterStatus('connected');
        toast({
          title: "Test d'impression lancé",
          description: "Vérifiez que la page de test s'imprime correctement",
        });
      } else {
        throw new Error("Impossible d'ouvrir la fenêtre d'impression");
      }

    } catch (error) {
      console.error("❌ Erreur test d'impression:", error);
      setPrinterStatus('error');
      toast({
        title: "Erreur d'impression",
        description: "Impossible de tester l'imprimante. Vérifiez la connexion.",
        variant: "destructive",
      });
    } finally {
      setIsTestingPrinter(false);
    }
  };

  // Détecter les imprimantes disponibles (API moderne si supportée)
  const detectPrinters = async () => {
    try {
      // @ts-ignore - API expérimentale
      if ('navigator' in window && 'printing' in navigator) {
        // @ts-ignore
        const printers = await navigator.printing.getPrinters();
        console.log("🖨️ Imprimantes détectées:", printers);
        
        if (printers.length > 0) {
          toast({
            title: "Imprimantes détectées",
            description: `${printers.length} imprimante(s) trouvée(s)`,
          });
        }
      } else {
        toast({
          title: "Détection non supportée",
          description: "Votre navigateur ne supporte pas la détection automatique d'imprimantes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Erreur détection imprimantes:", error);
    }
  };

  const getStatusIcon = () => {
    switch (printerStatus) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Printer className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (printerStatus) {
      case 'connected':
        return 'Imprimante connectée';
      case 'error':
        return 'Erreur de connexion';
      default:
        return 'Statut inconnu';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Test d'Imprimante
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="printer-name">Nom de l'imprimante (optionnel)</Label>
            <Input
              id="printer-name"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              placeholder="Laissez vide pour l'imprimante par défaut"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Impression automatique</Label>
              <p className="text-sm text-muted-foreground">
                Imprimer automatiquement après confirmation de vente
              </p>
            </div>
            <Switch
              checked={autoPrint}
              onCheckedChange={setAutoPrint}
            />
          </div>
        </div>

        {/* Statut */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={saveSettings} variant="outline" className="flex-1">
            <Settings className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
          
          <Button 
            onClick={testPrinter} 
            disabled={isTestingPrinter}
            className="flex-1"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isTestingPrinter ? 'Test en cours...' : 'Tester'}
          </Button>
        </div>

        {/* Détection automatique */}
        <Button 
          onClick={detectPrinters} 
          variant="outline" 
          className="w-full"
          size="sm"
        >
          Détecter les imprimantes
        </Button>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Assurez-vous que votre imprimante est allumée et connectée</li>
            <li>Pour les imprimantes réseau, utilisez leur nom ou adresse IP</li>
            <li>Le test d'impression ouvrira une nouvelle fenêtre</li>
            <li>L'impression automatique se déclenche après confirmation de vente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
