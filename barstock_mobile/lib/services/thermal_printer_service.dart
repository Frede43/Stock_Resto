import 'package:esc_pos_bluetooth/esc_pos_bluetooth.dart';
import 'package:esc_pos_utils/esc_pos_utils.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../data/models/order_model.dart';

/// Service pour gérer l'impression thermique Bluetooth
class ThermalPrinterService {
  static final ThermalPrinterService _instance = ThermalPrinterService._internal();
  factory ThermalPrinterService() => _instance;
  ThermalPrinterService._internal();

  PrinterBluetoothManager _printerManager = PrinterBluetoothManager();
  PrinterBluetooth? _selectedPrinter;

  /// Obtenir la liste des imprimantes Bluetooth disponibles
  Stream<List<PrinterBluetooth>> get printersStream => _printerManager.scanResults;

  /// Démarrer la recherche d'imprimantes
  Future<void> startScan({Duration timeout = const Duration(seconds: 4)}) async {
    try {
      _printerManager.startScan(timeout);
      print('🔍 Recherche d\'imprimantes Bluetooth démarrée...');
    } catch (e) {
      print('❌ Erreur lors du scan Bluetooth: $e');
      rethrow;
    }
  }

  /// Arrêter la recherche d'imprimantes
  void stopScan() {
    _printerManager.stopScan();
    print('⏹️ Recherche d\'imprimantes arrêtée');
  }

  /// Sélectionner une imprimante
  void selectPrinter(PrinterBluetooth printer) {
    _selectedPrinter = printer;
    print('✅ Imprimante sélectionnée: ${printer.name}');
  }

  /// Obtenir l'imprimante sélectionnée
  PrinterBluetooth? get selectedPrinter => _selectedPrinter;

  /// Imprimer un ticket de commande
  Future<bool> printOrderReceipt(OrderModel order) async {
    if (_selectedPrinter == null) {
      print('❌ Aucune imprimante sélectionnée');
      return false;
    }

    try {
      print('🖨️ Sélection de l\'imprimante ${_selectedPrinter!.name}...');
      
      // Sélectionner l'imprimante pour la connexion
      _printerManager.selectPrinter(_selectedPrinter!);
      
      print('✅ Imprimante sélectionnée');

      // Charger le profil de capacité de l'imprimante
      final profile = await CapabilityProfile.load();
      final generator = Generator(PaperSize.mm80, profile);
      List<int> bytes = [];
      
      // Attendre un peu pour la stabilité
      await Future.delayed(const Duration(milliseconds: 500));

      // === EN-TÊTE ===
      bytes += generator.text(
        'BAR STOCK WISE',
        styles: const PosStyles(
          align: PosAlign.center,
          height: PosTextSize.size2,
          width: PosTextSize.size2,
          bold: true,
        ),
      );
      
      bytes += generator.text(
        'Reçu de commande',
        styles: const PosStyles(
          align: PosAlign.center,
          bold: true,
        ),
      );
      
      bytes += generator.hr();
      bytes += generator.emptyLines(1);

      // === INFORMATIONS COMMANDE ===
      bytes += generator.row([
        PosColumn(
          text: 'Commande:',
          width: 6,
          styles: const PosStyles(bold: true),
        ),
        PosColumn(
          text: '#${order.id}',
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);

      bytes += generator.row([
        PosColumn(
          text: 'Table:',
          width: 6,
          styles: const PosStyles(bold: true),
        ),
        PosColumn(
          text: 'Table ${order.tableNumber}',
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);

      bytes += generator.row([
        PosColumn(
          text: 'Date:',
          width: 6,
          styles: const PosStyles(bold: true),
        ),
        PosColumn(
          text: _formatDateTime(order.createdAt),
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);

      bytes += generator.row([
        PosColumn(
          text: 'Statut:',
          width: 6,
          styles: const PosStyles(bold: true),
        ),
        PosColumn(
          text: _getStatusLabel(order.status),
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);

      bytes += generator.emptyLines(1);
      bytes += generator.hr();
      bytes += generator.emptyLines(1);

      // === ARTICLES ===
      bytes += generator.text(
        'Articles commandés:',
        styles: const PosStyles(bold: true),
      );
      bytes += generator.emptyLines(1);

      for (var item in order.items) {
        // Ligne article
        bytes += generator.row([
          PosColumn(
            text: '${item.quantity}x',
            width: 2,
            styles: const PosStyles(bold: true),
          ),
          PosColumn(
            text: item.productName,
            width: 7,
          ),
          PosColumn(
            text: '${_formatNumber(item.price)} BIF',
            width: 3,
            styles: const PosStyles(align: PosAlign.right, bold: true),
          ),
        ]);
      }

      bytes += generator.emptyLines(1);
      bytes += generator.hr();
      bytes += generator.emptyLines(1);

      // === TOTAL ===
      bytes += generator.row([
        PosColumn(
          text: 'TOTAL',
          width: 8,
          styles: const PosStyles(
            bold: true,
            height: PosTextSize.size2,
            width: PosTextSize.size2,
          ),
        ),
        PosColumn(
          text: '${_formatNumber(order.total)} BIF',
          width: 4,
          styles: const PosStyles(
            align: PosAlign.right,
            bold: true,
            height: PosTextSize.size2,
            width: PosTextSize.size2,
          ),
        ),
      ]);

      bytes += generator.emptyLines(2);

      // === PIED DE PAGE ===
      bytes += generator.text(
        'Merci de votre visite !',
        styles: const PosStyles(
          align: PosAlign.center,
          bold: true,
        ),
      );

      bytes += generator.emptyLines(1);
      bytes += generator.text(
        'Bon appétit !',
        styles: const PosStyles(align: PosAlign.center),
      );

      // === COUPE DU PAPIER ===
      bytes += generator.feed(2);
      bytes += generator.cut();

      // Envoyer à l'imprimante
      print('📄 Envoi des données à l\'imprimante...');
      _printerManager.writeBytes(bytes);
      
      // Attendre que l'impression soit terminée
      await Future.delayed(const Duration(seconds: 2));
      
      print('✅ Impression réussie');
      
      return true;
    } catch (e) {
      print('❌ Erreur d\'impression: $e');
      return false;
    }
  }

  /// Imprimer une facture complète
  Future<bool> printInvoice(Map<String, dynamic> invoiceData) async {
    if (_selectedPrinter == null) {
      print('❌ Aucune imprimante sélectionnée');
      return false;
    }

    try {
      print('🖨️ Impression de la facture ${invoiceData['reference']}...');
      
      // Sélectionner l'imprimante
      _printerManager.selectPrinter(_selectedPrinter!);
      await Future.delayed(const Duration(milliseconds: 500));

      final profile = await CapabilityProfile.load();
      final generator = Generator(PaperSize.mm80, profile);
      List<int> bytes = [];

      // === EN-TÊTE RESTAURANT ===
      bytes += generator.text(
        invoiceData['restaurant_name'] ?? 'HARRY\'S GRILL',
        styles: const PosStyles(
          align: PosAlign.center,
          height: PosTextSize.size2,
          width: PosTextSize.size2,
          bold: true,
        ),
      );
      
      bytes += generator.text(
        invoiceData['restaurant_phone'] ?? '+257 62 12 45 10',
        styles: const PosStyles(align: PosAlign.center),
      );
      
      bytes += generator.text(
        invoiceData['restaurant_address'] ?? 'Bujumbura, Burundi',
        styles: const PosStyles(align: PosAlign.center),
      );
      
      bytes += generator.emptyLines(1);
      bytes += generator.hr();
      bytes += generator.emptyLines(1);
      
      bytes += generator.text(
        'FACTURE',
        styles: const PosStyles(
          align: PosAlign.center,
          height: PosTextSize.size2,
          width: PosTextSize.size2,
          bold: true,
        ),
      );
      
      bytes += generator.emptyLines(1);
      bytes += generator.hr();
      bytes += generator.emptyLines(1);

      // === INFORMATIONS FACTURE ===
      bytes += generator.row([
        PosColumn(
          text: 'Référence:',
          width: 6,
          styles: const PosStyles(bold: true),
        ),
        PosColumn(
          text: invoiceData['reference'] ?? 'N/A',
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);

      final createdAt = DateTime.parse(invoiceData['created_at'] ?? DateTime.now().toIso8601String());
      bytes += generator.row([
        PosColumn(
          text: 'Date:',
          width: 6,
          styles: const PosStyles(bold: true),
        ),
        PosColumn(
          text: DateFormat('dd/MM/yyyy HH:mm').format(createdAt),
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);

      if (invoiceData['paid_at'] != null) {
        final paidAt = DateTime.parse(invoiceData['paid_at']);
        bytes += generator.row([
          PosColumn(
            text: 'Payée le:',
            width: 6,
            styles: const PosStyles(bold: true),
          ),
          PosColumn(
            text: DateFormat('dd/MM/yyyy HH:mm').format(paidAt),
            width: 6,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]);
      }

      bytes += generator.row([
        PosColumn(
          text: 'Client:',
          width: 6,
          styles: const PosStyles(bold: true),
        ),
        PosColumn(
          text: invoiceData['customer_name'] ?? 'Client anonyme',
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);

      bytes += generator.row([
        PosColumn(
          text: 'Table:',
          width: 6,
          styles: const PosStyles(bold: true),
        ),
        PosColumn(
          text: invoiceData['table_name'] ?? 'N/A',
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);

      bytes += generator.row([
        PosColumn(
          text: 'Serveur:',
          width: 6,
          styles: const PosStyles(bold: true),
        ),
        PosColumn(
          text: invoiceData['server_name'] ?? 'N/A',
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);

      bytes += generator.emptyLines(1);
      bytes += generator.hr();
      bytes += generator.emptyLines(1);

      // === ARTICLES ===
      bytes += generator.text(
        'ARTICLES',
        styles: const PosStyles(bold: true),
      );
      bytes += generator.emptyLines(1);

      final items = invoiceData['items'] ?? [];
      for (var item in items) {
        final quantity = item['quantity'] ?? 1;
        final productName = item['product_name'] ?? item['product']?['name'] ?? 'Produit';
        final unitPrice = _parseDouble(item['unit_price']);
        final totalPrice = _parseDouble(item['total_price']);

        // Ligne produit avec quantité
        bytes += generator.row([
          PosColumn(
            text: '${quantity}x',
            width: 2,
            styles: const PosStyles(bold: true),
          ),
          PosColumn(
            text: productName,
            width: 6,
          ),
          PosColumn(
            text: '${_formatNumber(totalPrice)}',
            width: 4,
            styles: const PosStyles(align: PosAlign.right, bold: true),
          ),
        ]);
        
        // Prix unitaire en dessous
        bytes += generator.row([
          PosColumn(text: '', width: 2),
          PosColumn(
            text: '@${_formatNumber(unitPrice)} BIF',
            width: 10,
            styles: const PosStyles(align: PosAlign.left),
          ),
        ]);
      }

      bytes += generator.emptyLines(1);
      bytes += generator.hr();
      bytes += generator.emptyLines(1);

      // === TOTAUX ===
      final subtotal = _parseDouble(invoiceData['subtotal'] ?? invoiceData['total_amount']);
      final taxAmount = _parseDouble(invoiceData['tax_amount'] ?? 0);
      final discountAmount = _parseDouble(invoiceData['discount_amount'] ?? 0);
      final finalAmount = _parseDouble(invoiceData['final_amount'] ?? invoiceData['total_amount']);

      bytes += generator.row([
        PosColumn(
          text: 'Sous-total',
          width: 8,
          styles: const PosStyles(bold: true),
        ),
        PosColumn(
          text: '${_formatNumber(subtotal)} BIF',
          width: 4,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);

      if (taxAmount > 0) {
        bytes += generator.row([
          PosColumn(
            text: 'TVA (18%)',
            width: 8,
            styles: const PosStyles(bold: true),
          ),
          PosColumn(
            text: '${_formatNumber(taxAmount)} BIF',
            width: 4,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]);
      }

      if (discountAmount > 0) {
        bytes += generator.row([
          PosColumn(
            text: 'Réduction',
            width: 8,
            styles: const PosStyles(bold: true),
          ),
          PosColumn(
            text: '-${_formatNumber(discountAmount)} BIF',
            width: 4,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]);
      }

      bytes += generator.emptyLines(1);
      bytes += generator.hr();
      bytes += generator.emptyLines(1);

      bytes += generator.row([
        PosColumn(
          text: 'TOTAL',
          width: 6,
          styles: const PosStyles(
            bold: true,
            height: PosTextSize.size2,
            width: PosTextSize.size2,
          ),
        ),
        PosColumn(
          text: '${_formatNumber(finalAmount)} BIF',
          width: 6,
          styles: const PosStyles(
            align: PosAlign.right,
            bold: true,
            height: PosTextSize.size2,
            width: PosTextSize.size2,
          ),
        ),
      ]);

      bytes += generator.emptyLines(1);
      bytes += generator.hr();
      bytes += generator.emptyLines(1);

      // === MÉTHODE DE PAIEMENT ===
      final paymentMethod = _getPaymentMethodLabel(invoiceData['payment_method'] ?? 'cash');
      bytes += generator.row([
        PosColumn(
          text: 'Paiement:',
          width: 6,
          styles: const PosStyles(bold: true),
        ),
        PosColumn(
          text: paymentMethod,
          width: 6,
          styles: const PosStyles(align: PosAlign.right, bold: true),
        ),
      ]);

      bytes += generator.emptyLines(2);

      // === PIED DE PAGE ===
      bytes += generator.text(
        'Merci de votre visite !',
        styles: const PosStyles(
          align: PosAlign.center,
          bold: true,
        ),
      );

      bytes += generator.emptyLines(1);
      
      bytes += generator.text(
        'À bientôt chez Harry\'s Grill',
        styles: const PosStyles(align: PosAlign.center),
      );

      if (invoiceData['notes'] != null && invoiceData['notes'].toString().isNotEmpty) {
        bytes += generator.emptyLines(1);
        bytes += generator.hr();
        bytes += generator.text(
          'Notes: ${invoiceData['notes']}',
          styles: const PosStyles(align: PosAlign.center),
        );
      }

      bytes += generator.feed(2);
      bytes += generator.cut();

      // Envoyer à l'imprimante
      print('📄 Envoi de la facture à l\'imprimante...');
      _printerManager.writeBytes(bytes);
      
      await Future.delayed(const Duration(seconds: 2));
      
      print('✅ Facture imprimée avec succès');
      return true;
    } catch (e) {
      print('❌ Erreur impression facture: $e');
      return false;
    }
  }

  /// Obtenir le label de méthode de paiement
  String _getPaymentMethodLabel(String method) {
    switch (method) {
      case 'cash':
        return 'Espèces';
      case 'card':
        return 'Carte bancaire';
      case 'mobile':
        return 'Mobile Money';
      case 'credit':
        return 'Crédit';
      default:
        return method;
    }
  }

  /// Parser un double de manière sécurisée
  double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0.0;
  }

  /// Imprimer un ticket de test
  Future<bool> printTestReceipt() async {
    if (_selectedPrinter == null) {
      print('❌ Aucune imprimante sélectionnée');
      return false;
    }

    try {
      print('🖨️ Impression de test...');
      
      // Sélectionner l'imprimante
      _printerManager.selectPrinter(_selectedPrinter!);
      
      print('✅ Imprimante sélectionnée pour le test');
      
      // Attendre un peu
      await Future.delayed(const Duration(milliseconds: 500));

      final profile = await CapabilityProfile.load();
      final generator = Generator(PaperSize.mm80, profile);
      List<int> bytes = [];

      bytes += generator.text(
        'BAR STOCK WISE',
        styles: const PosStyles(
          align: PosAlign.center,
          height: PosTextSize.size2,
          width: PosTextSize.size2,
          bold: true,
        ),
      );
      
      bytes += generator.emptyLines(1);
      bytes += generator.hr();
      bytes += generator.emptyLines(1);
      
      bytes += generator.text(
        'TEST D\'IMPRESSION',
        styles: const PosStyles(
          align: PosAlign.center,
          bold: true,
        ),
      );
      
      bytes += generator.emptyLines(1);
      
      bytes += generator.text(
        'Imprimante: ${_selectedPrinter!.name}',
        styles: const PosStyles(align: PosAlign.center),
      );
      
      bytes += generator.text(
        'Date: ${DateTime.now().toString().substring(0, 19)}',
        styles: const PosStyles(align: PosAlign.center),
      );
      
      bytes += generator.emptyLines(1);
      bytes += generator.hr();
      bytes += generator.emptyLines(1);
      
      bytes += generator.text(
        '✅ Configuration fonctionnelle',
        styles: const PosStyles(
          align: PosAlign.center,
          bold: true,
        ),
      );
      
      bytes += generator.emptyLines(1);
      
      bytes += generator.text(
        'Votre imprimante est prête !',
        styles: const PosStyles(align: PosAlign.center),
      );
      
      bytes += generator.feed(2);
      bytes += generator.cut();

      _printerManager.writeBytes(bytes);
      
      // Attendre que l'impression soit terminée
      await Future.delayed(const Duration(seconds: 2));
      
      print('✅ Test d\'impression réussi');
      return true;
    } catch (e) {
      print('❌ Erreur test impression: $e');
      return false;
    }
  }

  /// Formater un nombre avec séparateurs de milliers
  String _formatNumber(dynamic number) {
    if (number == null) return '0';
    
    try {
      final num value = number is String ? double.parse(number) : number;
      return value.toStringAsFixed(0).replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
        (Match m) => '${m[1]},',
      );
    } catch (e) {
      return '0';
    }
  }

  /// Formater une date
  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day.toString().padLeft(2, '0')}/'
        '${dateTime.month.toString().padLeft(2, '0')}/'
        '${dateTime.year} '
        '${dateTime.hour.toString().padLeft(2, '0')}:'
        '${dateTime.minute.toString().padLeft(2, '0')}';
  }

  /// Obtenir le label du statut
  String _getStatusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'preparing':
        return 'En préparation';
      case 'ready':
        return 'Prête';
      case 'completed':
        return 'Terminée';
      case 'cancelled':
        return 'Annulée';
      default:
        return 'Inconnue';
    }
  }

  /// Nettoyer les ressources
  void dispose() {
    _printerManager.stopScan();
    _selectedPrinter = null;
    print('🧹 Ressources nettoyées');
  }
}
