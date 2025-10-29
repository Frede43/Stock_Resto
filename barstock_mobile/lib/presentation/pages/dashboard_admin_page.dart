import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../services/notification_service.dart';
import 'products_page.dart';
import 'sales_page.dart';
import 'sales_history_page.dart';
import 'invoices_list_page.dart';
import 'stocks_page.dart';
import 'tables_page.dart';
import 'reports_page.dart';
import 'employees_page.dart';

class DashboardAdminPage extends StatefulWidget {
  const DashboardAdminPage({super.key});

  @override
  State<DashboardAdminPage> createState() => _DashboardAdminPageState();
}

class _DashboardAdminPageState extends State<DashboardAdminPage> {
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
      final response = await _apiService.get('/reports/dashboard/stats/');
      if (!mounted) return;
      
      print('📊 Réponse dashboard admin: ${response.statusCode}');
      print('📦 Données reçues: ${response.data}');
      
      if (response.statusCode == 200) {
        setState(() {
          _dashboardData = response.data;
          _isLoading = false;
        });
        
        print('✅ Dashboard data loaded:');
        print('   - Ventes: ${_dashboardData?['today_sales']}');
        print('   - Commandes: ${_dashboardData?['pending_orders']}');
        print('   - Produits: ${_dashboardData?['total_products']}');
        print('   - Employés: ${_dashboardData?['total_employees']}');
        
        // Vérifier les alertes et afficher des notifications
        _checkAndShowNotifications();
      }
    } catch (e) {
      print('❌ Erreur chargement dashboard admin: $e');
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }
  
  void _checkAndShowNotifications() {
    if (_dashboardData == null) return;
    
    // Vérifier les alertes de stock bas
    final lowStockCount = _dashboardData?['low_stock_count'] ?? 0;
    if (lowStockCount > 0) {
      NotificationService.showLocalNotification(
        '⚠️ Alerte Stock',
        '$lowStockCount produit(s) en stock bas',
      );
      print('🔔 Notification stock bas envoyée: $lowStockCount produits');
    }
    
    // Vérifier les nouvelles commandes
    final pendingOrders = _dashboardData?['pending_orders'] ?? 0;
    if (pendingOrders > 0) {
      NotificationService.showLocalNotification(
        '📋 Commandes en attente',
        '$pendingOrders commande(s) à traiter',
      );
      print('🔔 Notification commandes envoyée: $pendingOrders commandes');
    }
    
    // Vérifier les alertes spécifiques
    final alertsData = _dashboardData?['alerts'];
    List<dynamic> alerts = [];
    
    if (alertsData is List) {
      alerts = alertsData;
    } else if (alertsData is Map && alertsData['results'] is List) {
      alerts = alertsData['results'];
    }
    
    // Afficher la première alerte non résolue
    if (alerts.isNotEmpty) {
      final firstAlert = alerts.first;
      NotificationService.showLocalNotification(
        firstAlert['title'] ?? 'Alerte',
        firstAlert['message'] ?? '',
      );
      print('🔔 Notification alerte envoyée: ${firstAlert['title']}');
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
                    // En-tête Admin
                    _buildAdminHeader(),
                    const SizedBox(height: 24),

                    // Statistiques principales
                    _buildStatsGrid(),
                    const SizedBox(height: 24),

                    // Actions rapides Admin
                    _buildQuickActionsAdmin(),
                    const SizedBox(height: 24),

                    // Graphiques et analyses
                    _buildAnalyticsSection(),
                    const SizedBox(height: 24),

                    // Alertes et notifications
                    _buildAlertsSection(),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildAdminHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1976D2), Color(0xFF1565C0)],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.admin_panel_settings, color: Colors.white, size: 40),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Dashboard Administrateur',
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

  Widget _buildStatsGrid() {
    // Utiliser les données au niveau racine
    final todaySales = _dashboardData?['today_sales'] ?? 0;
    final pendingOrders = _dashboardData?['pending_orders'] ?? 0;
    final totalProducts = _dashboardData?['total_products'] ?? 0;
    final lowStockAlerts = _dashboardData?['low_stock_alerts'] ?? 0;
    
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.3,
      children: [
        _buildStatCard(
          'Ventes du jour',
          '${_formatNumber(todaySales)} BIF',
          Icons.attach_money,
          Colors.green,
        ),
        _buildStatCard(
          'Commandes',
          '$pendingOrders',
          Icons.receipt_long,
          Colors.blue,
        ),
        _buildStatCard(
          'Produits',
          '$totalProducts',
          Icons.inventory,
          Colors.orange,
        ),
        _buildStatCard(
          'Employés',
          '${_dashboardData?['total_employees'] ?? 0}',
          Icons.people,
          Colors.purple,
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
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40, color: color),
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

  Widget _buildQuickActionsAdmin() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Actions rapides',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 3,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          children: [
            _buildActionButton(
              'Ventes',
              Icons.point_of_sale,
              Colors.green,
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SalesPage())),
            ),
            _buildActionButton(
              'Produits',
              Icons.inventory_2,
              Colors.blue,
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsPage())),
            ),
            _buildActionButton(
              'Stocks',
              Icons.warehouse,
              Colors.orange,
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StocksPage())),
            ),
            _buildActionButton(
              'Tables',
              Icons.table_restaurant,
              Colors.purple,
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TablesPage())),
            ),
            _buildActionButton(
              'Rapports',
              Icons.analytics,
              Colors.teal,
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportsPage())),
            ),
            _buildActionButton(
              'Employés',
              Icons.people,
              Colors.indigo,
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EmployeesPage())),
            ),
            _buildActionButton(
              'Factures',
              Icons.receipt_long,
              Colors.pink,
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InvoicesListPage())),
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
        elevation: 2,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
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
    );
  }

  Widget _buildAnalyticsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Analyses',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildAnalyticRow('Chiffre d\'affaires mensuel', '${_dashboardData?['monthly_revenue'] ?? 0} BIF'),
                const Divider(),
                _buildAnalyticRow('Produits en stock bas', '${_dashboardData?['low_stock_count'] ?? 0}'),
                const Divider(),
                _buildAnalyticRow('Tables occupées', '${_dashboardData?['occupied_tables'] ?? 0}'),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _formatNumber(dynamic value) {
    if (value == null) return '0';
    final number = value is num ? value : (double.tryParse(value.toString()) ?? 0);
    return NumberFormat('#,##0', 'fr_FR').format(number);
  }

  Widget _buildAnalyticRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 14)),
          Text(
            value,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildAlertsSection() {
    if (_dashboardData == null) {
      return const SizedBox.shrink();
    }
    
    // Gérer le cas où alerts peut être un objet ou une liste
    List<dynamic> alerts = [];
    final alertsData = _dashboardData?['alerts'];
    
    if (alertsData is List) {
      alerts = alertsData;
    } else if (alertsData is Map) {
      // Si c'est un objet avec une clé 'results' (pagination)
      if (alertsData['results'] is List) {
        alerts = alertsData['results'];
      }
    }
    
    if (alerts.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Alertes',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        ...alerts.take(3).map((alert) => Card(
          color: Colors.orange.shade50,
          child: ListTile(
            leading: const Icon(Icons.warning, color: Colors.orange),
            title: Text(alert['title'] ?? ''),
            subtitle: Text(alert['message'] ?? ''),
          ),
        )),
      ],
    );
  }
}
