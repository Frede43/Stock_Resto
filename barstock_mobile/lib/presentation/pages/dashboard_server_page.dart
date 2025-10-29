import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import 'sales_page.dart';
import 'tables_page.dart';
import 'orders_page.dart';

class DashboardServerPage extends StatefulWidget {
  const DashboardServerPage({super.key});

  @override
  State<DashboardServerPage> createState() => _DashboardServerPageState();
}

class _DashboardServerPageState extends State<DashboardServerPage> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _dashboardData;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    
    try {
      final response = await _apiService.get('/dashboard/stats/');
      if (!mounted) return;
      
      if (response.statusCode == 200) {
        setState(() {
          _dashboardData = response.data;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Erreur chargement dashboard: $e');
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildServerHeader(),
                    const SizedBox(height: 24),
                    _buildMyStats(),
                    const SizedBox(height: 24),
                    _buildQuickActionsServer(),
                    const SizedBox(height: 24),
                    _buildMyTables(),
                    const SizedBox(height: 24),
                    _buildMyOrders(),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildServerHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF9C27B0), Color(0xFF7B1FA2)],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.restaurant_menu, color: Colors.white, size: 40),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Espace Serveur',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  DateFormat('EEEE d MMMM yyyy', 'fr_FR').format(DateTime.now()),
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMyStats() {
    final stats = _dashboardData?['statistics'] ?? {};
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Mes statistiques',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Mes commandes',
                '${stats['my_orders'] ?? 0}',
                Icons.receipt,
                Colors.purple,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildStatCard(
                'Tables actives',
                '${stats['my_active_tables'] ?? 0}',
                Icons.table_restaurant,
                Colors.blue,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, size: 36, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionsServer() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Actions rapides',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildActionButton(
                'Nouvelle Commande',
                Icons.add_shopping_cart,
                Colors.green,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SalesPage()),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionButton(
                'Tables',
                Icons.table_restaurant,
                Colors.purple,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const TablesPage()),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionButton(
                'Commandes',
                Icons.receipt_long,
                Colors.blue,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const OrdersPage()),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButton(String label, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Card(
        elevation: 3,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Icon(icon, size: 32, color: color),
              const SizedBox(height: 8),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMyTables() {
    if (_dashboardData == null) {
      return const SizedBox.shrink();
    }
    
    // Gérer le cas où my_tables peut être un objet ou une liste
    List<dynamic> myTables = [];
    final tablesData = _dashboardData?['my_tables'];
    
    if (tablesData is List) {
      myTables = tablesData;
    } else if (tablesData is Map && tablesData['results'] is List) {
      myTables = tablesData['results'];
    }
    
    if (myTables.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Mes tables',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        ...myTables.take(3).map((table) => Card(
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: table['status'] == 'occupied' ? Colors.red : Colors.green,
              child: Text(
                '${table['number']}',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
            title: Text('Table ${table['number']}'),
            subtitle: Text(table['status'] == 'occupied' ? 'Occupée' : 'Disponible'),
            trailing: Icon(
              table['status'] == 'occupied' ? Icons.people : Icons.check_circle,
              color: table['status'] == 'occupied' ? Colors.red : Colors.green,
            ),
          ),
        )),
      ],
    );
  }

  Widget _buildMyOrders() {
    if (_dashboardData == null) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Column(
              children: [
                Icon(Icons.receipt_long, size: 48, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text(
                  'Aucune commande en cours',
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ],
            ),
          ),
        ),
      );
    }
    
    // Gérer le cas où my_orders peut être un objet ou une liste
    List<dynamic> myOrders = [];
    final ordersData = _dashboardData?['my_orders'];
    
    if (ordersData is List) {
      myOrders = ordersData;
    } else if (ordersData is Map && ordersData['results'] is List) {
      myOrders = ordersData['results'];
    }
    
    if (myOrders.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Column(
              children: [
                Icon(Icons.receipt_long, size: 48, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text(
                  'Aucune commande en cours',
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Mes commandes',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        ...myOrders.take(5).map((order) => Card(
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: _getOrderStatusColor(order['status']),
              child: Icon(
                _getOrderStatusIcon(order['status']),
                color: Colors.white,
              ),
            ),
            title: Text('Commande #${order['id']}'),
            subtitle: Text('Table ${order['table_number']} - ${order['status']}'),
            trailing: Text(
              '${order['total_amount']} BIF',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        )),
      ],
    );
  }

  Color _getOrderStatusColor(String? status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'preparing':
        return Colors.blue;
      case 'ready':
        return Colors.green;
      case 'delivered':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  IconData _getOrderStatusIcon(String? status) {
    switch (status) {
      case 'pending':
        return Icons.hourglass_empty;
      case 'preparing':
        return Icons.restaurant;
      case 'ready':
        return Icons.check_circle;
      case 'delivered':
        return Icons.done_all;
      default:
        return Icons.receipt;
    }
  }
}
