import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:esc_pos_bluetooth/esc_pos_bluetooth.dart';
import '../../services/orders_service.dart';
import '../../services/thermal_printer_service.dart';
import '../../core/config/app_config.dart';
import '../../data/models/order_model.dart';

class OrdersPage extends StatefulWidget {
  const OrdersPage({super.key});

  @override
  _OrdersPageState createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersPage> with TickerProviderStateMixin {
  late TabController _tabController;
  String _selectedStatus = 'all';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdersService>().loadOrders();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Consumer<OrdersService>(
          builder: (context, ordersService, child) {
            return Text('Commandes (${ordersService.orders.length})');
          },
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              print('🔄 Rechargement manuel des commandes...');
              context.read<OrdersService>().loadOrders();
            },
            tooltip: 'Actualiser',
          ),
          IconButton(
            icon: const Icon(Icons.bug_report),
            onPressed: () {
              final ordersService = context.read<OrdersService>();
              print('🐛 DEBUG INFO:');
              print('   isDemoMode: ${AppConfig.isDemoMode}');
              print('   enableOfflineMode: ${AppConfig.enableOfflineMode}');
              print('   Nombre de commandes: ${ordersService.orders.length}');
              for (var order in ordersService.orders) {
                print('   - Commande #${order.id}: ${order.status} - Table ${order.tableNumber}');
              }
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('${ordersService.orders.length} commandes - Voir console'),
                  duration: const Duration(seconds: 2),
                ),
              );
            },
            tooltip: 'Debug',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          onTap: (index) {
            setState(() {
              switch (index) {
                case 0:
                  _selectedStatus = 'all';
                  break;
                case 1:
                  _selectedStatus = 'pending';
                  break;
                case 2:
                  _selectedStatus = 'preparing';
                  break;
                case 3:
                  _selectedStatus = 'ready';
                  break;
              }
            });
            _loadOrdersForStatus(_selectedStatus);
          },
          tabs: const [
            Tab(text: 'Toutes'),
            Tab(text: 'En attente'),
            Tab(text: 'En préparation'),
            Tab(text: 'Prêtes'),
          ],
        ),
      ),
      body: Consumer<OrdersService>(
        builder: (context, ordersService, child) {
          if (ordersService.isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          List<OrderModel> filteredOrders = _filterOrders(ordersService.orders);

          return Column(
            children: [
              // En-tête avec mode démo
              if (AppConfig.isDemoMode)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.orange.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border:
                        Border.all(color: Colors.orange.withValues(alpha: 0.3)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.receipt_long, color: Colors.orange),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Commandes en mode démo - Données simulées',
                          style: TextStyle(
                            color: Colors.orange,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              // Statistiques rapides
              Container(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildQuickStat(
                      'Total',
                      ordersService.orders.length.toString(),
                      Colors.blue,
                    ),
                    _buildQuickStat(
                      'En attente',
                      ordersService.orders
                          .where((o) => o.status == 'pending')
                          .length
                          .toString(),
                      Colors.orange,
                    ),
                    _buildQuickStat(
                      'En préparation',
                      ordersService.orders
                          .where((o) => o.status == 'preparing')
                          .length
                          .toString(),
                      Colors.purple,
                    ),
                    _buildQuickStat(
                      'Prêtes',
                      ordersService.orders
                          .where((o) => o.status == 'ready')
                          .length
                          .toString(),
                      Colors.green,
                    ),
                  ],
                ),
              ),

              // Liste des commandes
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () => ordersService.loadOrders(),
                  child: filteredOrders.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.receipt_long,
                                size: 64,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                _selectedStatus == 'all'
                                    ? 'Aucune commande'
                                    : 'Aucune commande ${_getStatusLabel(_selectedStatus)}',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filteredOrders.length,
                          itemBuilder: (context, index) {
                            final order = filteredOrders[index];
                            return _buildOrderCard(order);
                          },
                        ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildQuickStat(String label, String value, Color color) {
    return Column(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Center(
            child: Text(
              value,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildOrderCard(OrderModel order) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        leading: CircleAvatar(
          backgroundColor: _getStatusColor(order.status),
          child: Icon(
            _getStatusIcon(order.status),
            color: Colors.white,
            size: 20,
          ),
        ),
        title: Text('Commande #${order.id}'),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Table ${order.tableNumber}'),
            Text(
              '${order.items.length} article(s) • ${_formatNumber(order.total)} BIF',
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _getStatusColor(order.status).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _getStatusLabel(order.status),
                style: TextStyle(
                  color: _getStatusColor(order.status),
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Text(
              '${DateTime.now().difference(order.createdAt).inMinutes} min',
              style: const TextStyle(fontSize: 10, color: Colors.grey),
            ),
          ],
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Détails des articles
                Text(
                  'Articles commandés:',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                ...order.items.map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${item.quantity}x ${item.productName}',
                            style: const TextStyle(fontSize: 14),
                          ),
                          Text(
                            '${_formatNumber(item.price)} BIF',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    )),

                const SizedBox(height: 16),

                // Actions
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  alignment: WrapAlignment.center,
                  children: [
                    if (order.status == 'pending')
                      ElevatedButton.icon(
                        onPressed: () => _updateOrderStatus(order, 'preparing'),
                        icon: const Icon(Icons.play_arrow),
                        label: const Text('Commencer'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    if (order.status == 'preparing')
                      ElevatedButton.icon(
                        onPressed: () => _updateOrderStatus(order, 'ready'),
                        icon: const Icon(Icons.check),
                        label: const Text('Terminer'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    if (order.status == 'ready')
                      ElevatedButton.icon(
                        onPressed: () => _updateOrderStatus(order, 'completed'),
                        icon: const Icon(Icons.delivery_dining),
                        label: const Text('Servir'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.purple,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    // Bouton Imprimer - disponible pour toutes les commandes
                    ElevatedButton.icon(
                      onPressed: () => _printOrderReceipt(order),
                      icon: const Icon(Icons.print),
                      label: const Text('Imprimer'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.teal,
                        foregroundColor: Colors.white,
                      ),
                    ),
                    if (order.status != 'completed' &&
                        order.status != 'cancelled')
                      OutlinedButton.icon(
                        onPressed: () => _cancelOrder(order),
                        icon: const Icon(Icons.cancel),
                        label: const Text('Annuler'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                          side: const BorderSide(color: Colors.red),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<OrderModel> _filterOrders(List<OrderModel> orders) {
    if (_selectedStatus == 'all') {
      return orders;
    }
    return orders.where((order) => order.status == _selectedStatus).toList();
  }

  void _loadOrdersForStatus(String status) {
    context.read<OrdersService>().setFilterStatus(status);
    context.read<OrdersService>().loadOrders();
  }

  void _updateOrderStatus(OrderModel order, String newStatus) async {
    final success = await context
        .read<OrdersService>()
        .updateOrderStatus(order.id, newStatus);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Commande #${order.id} mise à jour'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Erreur lors de la mise à jour'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _cancelOrder(OrderModel order) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Annuler la commande'),
        content:
            Text('Êtes-vous sûr de vouloir annuler la commande #${order.id} ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Non'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Oui'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      _updateOrderStatus(order, 'cancelled');
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'preparing':
        return Colors.blue;
      case 'ready':
        return Colors.green;
      case 'completed':
        return Colors.purple;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'pending':
        return Icons.access_time;
      case 'preparing':
        return Icons.restaurant;
      case 'ready':
        return Icons.check_circle;
      case 'completed':
        return Icons.done_all;
      case 'cancelled':
        return Icons.cancel;
      default:
        return Icons.help;
    }
  }

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

  // ========================================
  // FONCTIONNALITÉ D'IMPRESSION
  // ========================================

  /// Imprimer le reçu de la commande
  Future<void> _printOrderReceipt(OrderModel order) async {
    try {
      // Afficher le dialog de prévisualisation avec options d'impression
      await showDialog(
        context: context,
        builder: (context) => _PrintReceiptDialog(order: order),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur d\'impression: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

// ========================================
// DIALOG DE PRÉVISUALISATION ET IMPRESSION
// ========================================

class _PrintReceiptDialog extends StatefulWidget {
  final OrderModel order;

  const _PrintReceiptDialog({required this.order});

  @override
  State<_PrintReceiptDialog> createState() => _PrintReceiptDialogState();
}

class _PrintReceiptDialogState extends State<_PrintReceiptDialog> {
  bool _isPrinting = false;
  bool _isScanning = false;
  String _printerName = 'Aucune imprimante sélectionnée';
  bool _thermalFormat = true; // Format thermique 80mm par défaut
  final ThermalPrinterService _printerService = ThermalPrinterService();
  List<PrinterBluetooth> _availablePrinters = [];
  
  @override
  void initState() {
    super.initState();
    _checkSelectedPrinter();
  }
  
  void _checkSelectedPrinter() {
    final selectedPrinter = _printerService.selectedPrinter;
    if (selectedPrinter != null) {
      setState(() {
        _printerName = selectedPrinter.name ?? 'Imprimante Bluetooth';
      });
    }
  }
  
  @override
  void dispose() {
    _printerService.stopScan();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        constraints: const BoxConstraints(maxHeight: 600),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // En-tête
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.teal,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(4),
                  topRight: Radius.circular(4),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.receipt_long, color: Colors.white),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Imprimer la commande',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            // Prévisualisation du reçu
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: _buildReceiptPreview(),
              ),
            ),

            // Options d'impression
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                border: Border(
                  top: BorderSide(color: Colors.grey[300]!),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Options d\'impression',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  // Format thermique
                  SwitchListTile(
                    title: const Text('Format thermique 80mm'),
                    subtitle: const Text('Optimisé pour imprimantes thermiques'),
                    value: _thermalFormat,
                    onChanged: (value) {
                      setState(() => _thermalFormat = value);
                    },
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Info imprimante
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.blue[200]!),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.print, color: Colors.blue[700]),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Imprimante',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey,
                                ),
                              ),
                              Text(
                                _printerName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                        TextButton(
                          onPressed: _selectPrinter,
                          child: const Text('Changer'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Boutons d'action
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Annuler'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: _isPrinting ? null : _handlePrint,
                      icon: _isPrinting
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.print),
                      label: Text(_isPrinting ? 'Impression...' : 'Imprimer'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.teal,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReceiptPreview() {
    final order = widget.order;
    final now = DateTime.now();
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
        color: Colors.white,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Logo / Nom du restaurant
          const Text(
            'BAR STOCK WISE',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Reçu de commande',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          const Divider(height: 24),

          // Informations commande
          _buildInfoRow('Commande', '#${order.id}'),
          _buildInfoRow('Table', 'Table ${order.tableNumber}'),
          _buildInfoRow('Date', dateFormat.format(now)),
          _buildInfoRow('Statut', _getStatusLabel(order.status)),
          const Divider(height: 24),

          // Articles
          const Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Articles commandés:',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
          const SizedBox(height: 8),
          ...order.items.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${item.quantity}x',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        item.productName,
                        style: const TextStyle(fontSize: 13),
                      ),
                    ),
                    Text(
                      '${_formatNumber(item.price)} BIF',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              )),
          const Divider(height: 24),

          // Total
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'TOTAL',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${_formatNumber(order.total)} BIF',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Message de pied de page
          Text(
            'Merci de votre visite !',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '$label:',
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[600],
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

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

  void _selectPrinter() {
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.bluetooth),
              const SizedBox(width: 8),
              const Expanded(child: Text('Imprimantes Bluetooth')),
              if (_isScanning)
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
            ],
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Bouton de scan
                ElevatedButton.icon(
                  onPressed: _isScanning ? null : () async {
                    setDialogState(() => _isScanning = true);
                    
                    // Écouter les résultats du scan
                    _printerService.printersStream.listen((printers) {
                      if (mounted) {
                        setDialogState(() {
                          _availablePrinters = printers;
                        });
                      }
                    });
                    
                    // Démarrer le scan
                    await _printerService.startScan();
                    
                    await Future.delayed(const Duration(seconds: 4));
                    
                    if (mounted) {
                      setDialogState(() => _isScanning = false);
                    }
                  },
                  icon: Icon(_isScanning ? Icons.bluetooth_searching : Icons.bluetooth),
                  label: Text(_isScanning ? 'Recherche...' : 'Rechercher'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Liste des imprimantes
                if (_availablePrinters.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        Icon(Icons.bluetooth_disabled, size: 48, color: Colors.grey),
                        SizedBox(height: 8),
                        Text(
                          'Aucune imprimante trouvée',
                          style: TextStyle(color: Colors.grey),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Assurez-vous que votre imprimante est allumée et en mode appairage',
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  )
                else
                  Flexible(
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: _availablePrinters.length,
                      itemBuilder: (context, index) {
                        final printer = _availablePrinters[index];
                        final isSelected = _printerService.selectedPrinter?.address == printer.address;
                        
                        return ListTile(
                          leading: Icon(
                            Icons.print,
                            color: isSelected ? Colors.green : Colors.grey,
                          ),
                          title: Text(
                            printer.name ?? 'Imprimante Bluetooth',
                            style: TextStyle(
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                          subtitle: Text(
                            printer.address ?? '',
                            style: const TextStyle(fontSize: 12),
                          ),
                          trailing: isSelected
                              ? const Icon(Icons.check_circle, color: Colors.green)
                              : null,
                          onTap: () {
                            _printerService.selectPrinter(printer);
                            setState(() {
                              _printerName = printer.name ?? 'Imprimante Bluetooth';
                            });
                            Navigator.pop(context);
                          },
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Fermer'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handlePrint() async {
    // Vérifier qu'une imprimante est sélectionnée
    if (_printerService.selectedPrinter == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner une imprimante'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isPrinting = true);

    try {
      // Impression thermique Bluetooth réelle
      print('🖨️ Début impression commande #${widget.order.id}');
      
      final success = await _printerService.printOrderReceipt(widget.order);

      if (mounted) {
        Navigator.pop(context);
        
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.white),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Impression réussie',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'Commande #${widget.order.id} imprimée sur $_printerName',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Échec de l\'impression. Vérifiez la connexion Bluetooth.'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 4),
            ),
          );
        }
      }
    } catch (e) {
      print('❌ Erreur impression: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur d\'impression: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isPrinting = false);
      }
    }
  }
}
