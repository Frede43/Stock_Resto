import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import 'products_page.dart';
import 'sales_page.dart';
import 'sales_history_page.dart';
import 'stocks_page.dart';
import 'tables_page.dart';
import 'reports_page.dart';

class DashboardManagerPage extends StatefulWidget {
  const DashboardManagerPage({super.key});

  @override
  State<DashboardManagerPage> createState() => _DashboardManagerPageState();
}

class _DashboardManagerPageState extends State<DashboardManagerPage> {
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
                    _buildManagerHeader(),
                    const SizedBox(height: 24),
                    _buildStatsGrid(),
                    const SizedBox(height: 24),
                    _buildQuickActionsManager(),
                    const SizedBox(height: 24),
                    _buildPerformanceSection(),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildManagerHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFF9800), Color(0xFFF57C00)],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.business_center, color: Colors.white, size: 40),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Dashboard Manager',
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
    final stats = _dashboardData?['statistics'] ?? {};
    
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
          '${stats['daily_sales'] ?? 0} BIF',
          Icons.attach_money,
          Colors.green,
        ),
        _buildStatCard(
          'Commandes',
          '${stats['total_orders'] ?? 0}',
          Icons.receipt_long,
          Colors.blue,
        ),
        _buildStatCard(
          'Stock bas',
          '${stats['low_stock_count'] ?? 0}',
          Icons.warning,
          Colors.orange,
        ),
        _buildStatCard(
          'Tables occupées',
          '${stats['occupied_tables'] ?? 0}',
          Icons.table_restaurant,
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

  Widget _buildQuickActionsManager() {
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
              'Historique',
              Icons.history,
              Colors.indigo,
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SalesHistoryPage())),
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

  Widget _buildPerformanceSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Performance',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildPerformanceRow('CA Mensuel', '${_dashboardData?['monthly_revenue'] ?? 0} BIF'),
                const Divider(),
                _buildPerformanceRow('Objectif', '${_dashboardData?['monthly_target'] ?? 0} BIF'),
                const Divider(),
                _buildPerformanceRow('Progression', '${_dashboardData?['progress_percentage'] ?? 0}%'),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPerformanceRow(String label, String value) {
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
}
