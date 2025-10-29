import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'table_details_page.dart';

class TablesPage extends StatefulWidget {
  const TablesPage({super.key});

  @override
  _TablesPageState createState() => _TablesPageState();
}

class _TablesPageState extends State<TablesPage> {
  final ApiService _apiService = ApiService();
  
  List<Map<String, dynamic>> _tables = [];
  bool _isLoading = false;
  String _filterStatus = 'all'; // all, available, occupied, reserved

  @override
  void initState() {
    super.initState();
    _loadTables();
  }

  Future<void> _loadTables() async {
    setState(() => _isLoading = true);
    
    try {
      final response = await _apiService.get('/sales/tables/');
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? response.data ?? [];
        setState(() {
          _tables = List<Map<String, dynamic>>.from(results);
        });
      }
    } catch (e) {
      print('Erreur chargement tables: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  List<Map<String, dynamic>> get _filteredTables {
    if (_filterStatus == 'all') return _tables;
    return _tables.where((table) => table['status'] == _filterStatus).toList();
  }

  Future<void> _toggleTableStatus(Map<String, dynamic> table) async {
    final tableId = table['id'];
    final currentStatus = table['status'];
    final newStatus = currentStatus == 'available' ? 'occupied' : 'available';
    
    try {
      final endpoint = newStatus == 'occupied'
          ? '/sales/tables/$tableId/occupy/'
          : '/sales/tables/$tableId/free/';
      
      final response = await _apiService.post(endpoint);
      
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              newStatus == 'occupied'
                  ? 'Table ${table['number']} occupée'
                  : 'Table ${table['number']} libérée',
            ),
            backgroundColor: Colors.green,
          ),
        );
        _loadTables();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final availableCount = _tables.where((t) => t['status'] == 'available').length;
    final occupiedCount = _tables.where((t) => t['status'] == 'occupied').length;
    final reservedCount = _tables.where((t) => t['status'] == 'reserved').length;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestion des Tables'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadTables,
          ),
        ],
      ),
      body: Column(
        children: [
          // Statistiques
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatCard(
                  'Total',
                  _tables.length.toString(),
                  Icons.table_restaurant,
                  Colors.blue,
                ),
                _buildStatCard(
                  'Disponibles',
                  availableCount.toString(),
                  Icons.check_circle,
                  Colors.green,
                ),
                _buildStatCard(
                  'Occupées',
                  occupiedCount.toString(),
                  Icons.people,
                  Colors.orange,
                ),
                _buildStatCard(
                  'Réservées',
                  reservedCount.toString(),
                  Icons.bookmark,
                  Colors.purple,
                ),
              ],
            ),
          ),
          
          // Filtres
          Padding(
            padding: const EdgeInsets.all(16),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('Toutes', 'all', Icons.table_restaurant),
                  const SizedBox(width: 8),
                  _buildFilterChip('Disponibles', 'available', Icons.check_circle),
                  const SizedBox(width: 8),
                  _buildFilterChip('Occupées', 'occupied', Icons.people),
                  const SizedBox(width: 8),
                  _buildFilterChip('Réservées', 'reserved', Icons.bookmark),
                ],
              ),
            ),
          ),
          
          // Grille des tables
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredTables.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.table_restaurant,
                              size: 64,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Aucune table trouvée',
                              style: TextStyle(
                                fontSize: 18,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      )
                    : GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          childAspectRatio: 1.0,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                        ),
                        itemCount: _filteredTables.length,
                        itemBuilder: (context, index) {
                          return _buildTableCard(_filteredTables[index]);
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Ajouter une table
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(30),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 24),
              Text(
                value,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ],
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

  Widget _buildFilterChip(String label, String value, IconData icon) {
    final isSelected = _filterStatus == value;
    
    return FilterChip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16),
          const SizedBox(width: 4),
          Text(label),
        ],
      ),
      selected: isSelected,
      onSelected: (selected) {
        setState(() => _filterStatus = value);
      },
      selectedColor: Colors.blue.withValues(alpha: 0.2),
    );
  }

  Widget _buildTableCard(Map<String, dynamic> table) {
    final status = table['status'] ?? 'available';
    final number = table['number'] ?? 0;
    final capacity = table['capacity'] ?? 0;
    
    Color statusColor;
    IconData statusIcon;
    String statusText;
    
    switch (status) {
      case 'available':
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        statusText = 'Disponible';
        break;
      case 'occupied':
        statusColor = Colors.orange;
        statusIcon = Icons.people;
        statusText = 'Occupée';
        break;
      case 'reserved':
        statusColor = Colors.purple;
        statusIcon = Icons.bookmark;
        statusText = 'Réservée';
        break;
      default:
        statusColor = Colors.grey;
        statusIcon = Icons.help;
        statusText = 'Inconnu';
    }
    
    return Card(
      elevation: 4,
      child: InkWell(
        onTap: () => _showTableDetails(table),
        onLongPress: () => _toggleTableStatus(table),
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: statusColor, width: 2),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.table_restaurant,
                size: 48,
                color: statusColor,
              ),
              const SizedBox(height: 8),
              Text(
                'Table $number',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(statusIcon, size: 14, color: statusColor),
                    const SizedBox(width: 4),
                    Text(
                      statusText,
                      style: TextStyle(
                        fontSize: 12,
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '$capacity places',
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showTableDetails(Map<String, dynamic> table) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => TableDetailsPage(
          tableId: table['id'],
          tableName: table['number'].toString(),
        ),
      ),
    );
  }
}
