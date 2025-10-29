import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../core/config/app_config.dart';
import 'dashboard_admin_page.dart';
import 'dashboard_manager_page.dart';
import 'dashboard_cashier_page.dart';
import 'dashboard_server_page.dart';
import 'orders_page.dart';
import 'sales_history_page.dart';
import 'profile_page.dart';
import 'notifications_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;
  String? _userRole;
  List<Widget> _pages = [];

  @override
  void initState() {
    super.initState();
    _loadUserRole();
  }

  Future<void> _loadUserRole() async {
    final authService = context.read<AuthService>();
    final userData = await authService.getCurrentUser();
    
    setState(() {
      _userRole = userData?['role'] ?? 'cashier';
      _pages = _buildPagesForRole(_userRole!);
    });
  }

  List<Widget> _buildPagesForRole(String role) {
    Widget dashboardPage;
    
    switch (role) {
      case 'admin':
        dashboardPage = const DashboardAdminPage();
        break;
      case 'manager':
        dashboardPage = const DashboardManagerPage();
        break;
      case 'server':
        dashboardPage = const DashboardServerPage();
        break;
      case 'cashier':
      default:
        dashboardPage = const DashboardCashierPage();
        break;
    }
    
    return [
      dashboardPage,
      const OrdersPage(),
      const SalesHistoryPage(),
      const ProfilePage(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    if (_userRole == null || _pages.isEmpty) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'BarStockWise Mobile${AppConfig.isDemoMode ? ' (Démo)' : ''} - ${_getRoleLabel(_userRole!)}',
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const NotificationsPage(),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      body: _pages[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        type: BottomNavigationBarType.fixed, // ✅ Affiche tous les onglets
        selectedFontSize: 12,
        unselectedFontSize: 10,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt),
            label: 'Commandes',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history),
            label: 'Historique',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profil',
          ),
        ],
      ),
    );
  }

  String _getRoleLabel(String role) {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      case 'server':
        return 'Serveur';
      case 'cashier':
        return 'Caissier';
      default:
        return '';
    }
  }

  Future<void> _logout() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    await authService.logout();
    Navigator.of(context).pushReplacementNamed('/login');
  }
}
