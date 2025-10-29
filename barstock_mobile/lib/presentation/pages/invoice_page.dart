import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/sales_service.dart';
import '../../services/thermal_printer_service.dart';
import 'package:esc_pos_bluetooth/esc_pos_bluetooth.dart';

/// Page d'affichage de la facture
/// 
/// Affiche tous les détails de la facture :
/// - Informations entreprise
/// - Informations client
/// - Liste des articles
/// - Totaux
/// - Bouton d'impression
class InvoicePage extends StatefulWidget {
  final int saleId;
  final String saleReference;
  
  const InvoicePage({
    super.key,
    required this.saleId,
    required this.saleReference,
  });
  
  @override
  State<InvoicePage> createState() => _InvoicePageState();
}

class _InvoicePageState extends State<InvoicePage> {
  final SalesService _salesService = SalesService();
  final ThermalPrinterService _printerService = ThermalPrinterService();
  
  Map<String, dynamic>? _invoiceData;
  bool _isLoading = false;
  String? _error;
  
  @override
  void initState() {
    super.initState();
    _loadInvoice();
  }
  
  /// Charger la facture
  Future<void> _loadInvoice() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    try {
      final result = await _salesService.getInvoice(widget.saleId);
      
      if (result['success']) {
        setState(() {
          _invoiceData = result['invoice'];
        });
      } else {
        setState(() {
          _error = result['error'];
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  /// Formater le prix
  String _formatPrice(dynamic price) {
    final value = price is num ? price : (double.tryParse(price.toString()) ?? 0);
    final formatter = NumberFormat('#,###', 'fr_FR');
    return formatter.format(value);
  }
  
  /// Imprimer la facture
  Future<void> _printInvoice() async {
    if (_invoiceData == null) return;

    // Vérifier si une imprimante est sélectionnée
    if (_printerService.selectedPrinter == null) {
      // Afficher le sélecteur d'imprimante
      await _showPrinterSelector();
      return;
    }

    // Imprimer
    try {
      final success = await _printerService.printInvoice(_invoiceData!);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              success 
                  ? '✅ Facture imprimée avec succès' 
                  : '❌ Erreur lors de l\'impression',
            ),
            backgroundColor: success ? Colors.green : Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Erreur: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  /// Afficher le sélecteur d'imprimante
  Future<void> _showPrinterSelector() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _PrinterSelectorSheet(
        printerService: _printerService,
        onPrinterSelected: () {
          Navigator.pop(context);
          _printInvoice(); // Réessayer l'impression
        },
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Facture ${widget.saleReference}'),
        actions: [
          if (_invoiceData != null)
            IconButton(
              onPressed: _printInvoice,
              icon: const Icon(Icons.print),
              tooltip: 'Imprimer',
            ),
        ],
      ),
      body: _buildBody(),
    );
  }
  
  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Chargement de la facture...'),
          ],
        ),
      );
    }
    
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Erreur: $_error'),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadInvoice,
              icon: const Icon(Icons.refresh),
              label: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }
    
    if (_invoiceData == null) {
      return const Center(
        child: Text('Aucune donnée de facture'),
      );
    }
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildCompanyHeader(),
          const SizedBox(height: 20),
          _buildInvoiceInfo(),
          const SizedBox(height: 20),
          _buildCustomerInfo(),
          const SizedBox(height: 20),
          _buildItemsList(),
          const SizedBox(height: 20),
          _buildTotals(),
          const SizedBox(height: 20),
          _buildPaymentInfo(),
          const SizedBox(height: 20),
          _buildFooter(),
        ],
      ),
    );
  }
  
  Widget _buildCompanyHeader() {
    final company = _invoiceData!['company'] ?? {};
    
    return Card(
      color: Colors.blue.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              company['name'] ?? 'Bar Stock Wise',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(company['address'] ?? ''),
            Text('☎️ ${company['phone'] ?? ''}'),
            Text('📧 ${company['email'] ?? ''}'),
            Text('🆔 ${company['tax_number'] ?? ''}'),
          ],
        ),
      ),
    );
  }
  
  Widget _buildInvoiceInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Facture N°',
                  style: TextStyle(color: Colors.grey),
                ),
                Text(
                  _invoiceData!['invoice_number'] ?? '',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Text(
                  'Date',
                  style: TextStyle(color: Colors.grey),
                ),
                Text(
                  _invoiceData!['customer']?['datetime_full'] ?? '',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildCustomerInfo() {
    final customer = _invoiceData!['customer'] ?? {};
    final server = _invoiceData!['server'] ?? {};
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Informations',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Divider(),
            _buildInfoRow('Client', customer['name'] ?? 'Client'),
            _buildInfoRow('Table', customer['table'] ?? 'N/A'),
            _buildInfoRow('Serveur', server['name'] ?? 'N/A'),
          ],
        ),
      ),
    );
  }
  
  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(color: Colors.grey),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildItemsList() {
    final items = _invoiceData!['items'] as List? ?? [];
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Articles',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Divider(),
            ...items.map((item) => _buildItemRow(item)),
          ],
        ),
      ),
    );
  }
  
  Widget _buildItemRow(Map<String, dynamic> item) {
    final quantity = item['quantity'] ?? 0;
    final unitPrice = item['unit_price'] ?? 0;
    final total = item['total'] ?? 0;
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  item['name'] ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
              ),
              Text(
                '${_formatPrice(total)} FBu',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '${_formatPrice(unitPrice)} FBu × $quantity',
            style: const TextStyle(color: Colors.grey, fontSize: 12),
          ),
          if (item['notes'] != null && item['notes'].toString().isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              'Note: ${item['notes']}',
              style: const TextStyle(
                color: Colors.orange,
                fontSize: 12,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ],
      ),
    );
  }
  
  Widget _buildTotals() {
    final summary = _invoiceData!['summary'] ?? {};
    
    return Card(
      color: Colors.green.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildTotalRow('Sous-total', summary['subtotal']),
            if ((summary['tax_amount'] ?? 0) > 0)
              _buildTotalRow('TVA (${summary['tax_rate'] ?? 0}%)', summary['tax_amount']),
            if ((summary['discount_amount'] ?? 0) > 0)
              _buildTotalRow('Remise', summary['discount_amount'], isNegative: true),
            const Divider(thickness: 2),
            _buildTotalRow(
              'TOTAL',
              summary['total_amount'],
              isTotal: true,
            ),
            if (summary['amount_in_words'] != null) ...[
              const SizedBox(height: 8),
              Text(
                summary['amount_in_words'],
                style: const TextStyle(
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  color: Colors.grey,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }
  
  Widget _buildTotalRow(String label, dynamic amount, {bool isTotal = false, bool isNegative = false}) {
    final value = amount is num ? amount : (double.tryParse(amount.toString()) ?? 0);
    final displayValue = isNegative ? -value : value;
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 18 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            '${_formatPrice(displayValue)} FBu',
            style: TextStyle(
              fontSize: isTotal ? 20 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              color: isTotal ? Colors.green.shade700 : null,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildPaymentInfo() {
    final payment = _invoiceData!['payment'] ?? {};
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Paiement',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Divider(),
            _buildInfoRow('Méthode', payment['method'] ?? 'Espèces'),
            _buildInfoRow('Status', payment['status'] ?? 'Payé'),
          ],
        ),
      ),
    );
  }
  
  Widget _buildFooter() {
    final footer = _invoiceData!['footer_message'] ?? 'Merci de votre visite !';
    
    return Card(
      color: Colors.grey.shade100,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              footer,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'À bientôt chez Bar Stock Wise',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

/// Widget pour sélectionner une imprimante Bluetooth
class _PrinterSelectorSheet extends StatefulWidget {
  final ThermalPrinterService printerService;
  final VoidCallback onPrinterSelected;

  const _PrinterSelectorSheet({
    required this.printerService,
    required this.onPrinterSelected,
  });

  @override
  State<_PrinterSelectorSheet> createState() => _PrinterSelectorSheetState();
}

class _PrinterSelectorSheetState extends State<_PrinterSelectorSheet> {
  bool _isScanning = false;
  List<PrinterBluetooth> _printers = [];

  @override
  void initState() {
    super.initState();
    _startScan();
  }

  Future<void> _startScan() async {
    setState(() => _isScanning = true);
    
    try {
      await widget.printerService.startScan();
      
      // Écouter les résultats du scan
      widget.printerService.printersStream.listen((printers) {
        if (mounted) {
          setState(() {
            _printers = printers;
          });
        }
      });
      
      // Arrêter le scan après 10 secondes
      Future.delayed(const Duration(seconds: 10), () {
        if (mounted) {
          widget.printerService.stopScan();
          setState(() => _isScanning = false);
        }
      });
    } catch (e) {
      print('❌ Erreur scan: $e');
      if (mounted) {
        setState(() => _isScanning = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    widget.printerService.stopScan();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Sélectionner une imprimante',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 20),
          
          if (_isScanning) ...[
            const Center(
              child: Column(
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Recherche d\'imprimantes Bluetooth...'),
                ],
              ),
            ),
          ] else if (_printers.isEmpty) ...[
            Center(
              child: Column(
                children: [
                  Icon(Icons.print_disabled, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  const Text(
                    'Aucune imprimante trouvée',
                    style: TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Assurez-vous que l\'imprimante est allumée\net que le Bluetooth est activé',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: _startScan,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Rechercher à nouveau'),
                  ),
                ],
              ),
            ),
          ] else ...[
            const Text(
              'Imprimantes disponibles :',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 10),
            ListView.builder(
              shrinkWrap: true,
              itemCount: _printers.length,
              itemBuilder: (context, index) {
                final printer = _printers[index];
                final isSelected = widget.printerService.selectedPrinter?.address == printer.address;
                
                return Card(
                  color: isSelected ? Colors.blue[50] : null,
                  child: ListTile(
                    leading: Icon(
                      Icons.print,
                      color: isSelected ? Colors.blue : Colors.grey,
                    ),
                    title: Text(
                      printer.name ?? 'Imprimante inconnue',
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    subtitle: Text(printer.address ?? 'Adresse inconnue'),
                    trailing: isSelected
                        ? const Icon(Icons.check_circle, color: Colors.blue)
                        : null,
                    onTap: () {
                      widget.printerService.selectPrinter(printer);
                      widget.onPrinterSelected();
                    },
                  ),
                );
              },
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _startScan,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Actualiser'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
