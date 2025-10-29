import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';

class TableDetailsPage extends StatefulWidget {
  final int tableId;
  final String tableName;
  
  const TableDetailsPage({
    super.key,
    required this.tableId,
    required this.tableName,
  });

  @override
  State<TableDetailsPage> createState() => _TableDetailsPageState();
}

class _TableDetailsPageState extends State<TableDetailsPage> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  
  late TabController _tabController;
  Map<String, dynamic>? _tableDetails;
  List<Map<String, dynamic>> _reservations = [];
  List<Map<String, dynamic>> _history = [];
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    try {
      await Future.wait([
        _loadTableDetails(),
        _loadReservations(),
        _loadHistory(),
      ]);
    } catch (e) {
      print('❌ Erreur chargement données: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadTableDetails() async {
    try {
      final response = await _apiService.get('/tables/${widget.tableId}/');
      if (response.statusCode == 200) {
        setState(() {
          _tableDetails = response.data;
        });
      }
    } catch (e) {
      print('❌ Erreur chargement détails table: $e');
    }
  }

  Future<void> _loadReservations() async {
    try {
      final response = await _apiService.get(
        '/tables/reservations/',
        params: {'table': widget.tableId.toString()},
      );
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? response.data ?? [];
        setState(() {
          _reservations = List<Map<String, dynamic>>.from(results);
        });
      }
    } catch (e) {
      print('❌ Erreur chargement réservations: $e');
    }
  }

  Future<void> _loadHistory() async {
    try {
      final response = await _apiService.get(
        '/sales/',
        params: {'table': widget.tableId.toString()},
      );
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? response.data ?? [];
        setState(() {
          _history = List<Map<String, dynamic>>.from(results);
        });
      }
    } catch (e) {
      print('❌ Erreur chargement historique: $e');
    }
  }

  Future<void> _showReservationDialog({Map<String, dynamic>? reservation}) async {
    final nameController = TextEditingController(text: reservation?['customer_name'] ?? '');
    final phoneController = TextEditingController(text: reservation?['phone'] ?? '');
    final guestsController = TextEditingController(
      text: reservation?['number_of_guests']?.toString() ?? '2',
    );
    final notesController = TextEditingController(text: reservation?['notes'] ?? '');
    
    DateTime selectedDate = reservation != null
        ? DateTime.parse(reservation['reservation_date'])
        : DateTime.now();
    TimeOfDay selectedTime = reservation != null
        ? TimeOfDay.fromDateTime(DateTime.parse(reservation['reservation_time']))
        : TimeOfDay.now();
    
    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(reservation == null ? 'Nouvelle Réservation' : 'Modifier Réservation'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Nom du client',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.person),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: phoneController,
                  decoration: const InputDecoration(
                    labelText: 'Téléphone',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.phone),
                  ),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: guestsController,
                  decoration: const InputDecoration(
                    labelText: 'Nombre de personnes',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.people),
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: const Icon(Icons.calendar_today),
                  title: Text(DateFormat('dd/MM/yyyy').format(selectedDate)),
                  trailing: const Icon(Icons.edit),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: selectedDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 90)),
                    );
                    if (date != null) {
                      setState(() => selectedDate = date);
                    }
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.access_time),
                  title: Text(selectedTime.format(context)),
                  trailing: const Icon(Icons.edit),
                  onTap: () async {
                    final time = await showTimePicker(
                      context: context,
                      initialTime: selectedTime,
                    );
                    if (time != null) {
                      setState(() => selectedTime = time);
                    }
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: notesController,
                  decoration: const InputDecoration(
                    labelText: 'Notes',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.note),
                  ),
                  maxLines: 3,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Annuler'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (nameController.text.isEmpty || phoneController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Veuillez remplir tous les champs obligatoires')),
                  );
                  return;
                }
                
                Navigator.pop(context);
                await _saveReservation(
                  reservation?['id'],
                  nameController.text,
                  phoneController.text,
                  int.parse(guestsController.text),
                  selectedDate,
                  selectedTime,
                  notesController.text,
                );
              },
              child: Text(reservation == null ? 'Créer' : 'Modifier'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _saveReservation(
    int? reservationId,
    String name,
    String phone,
    int guests,
    DateTime date,
    TimeOfDay time,
    String notes,
  ) async {
    try {
      final reservationData = {
        'table': widget.tableId,
        'customer_name': name,
        'phone': phone,
        'number_of_guests': guests,
        'reservation_date': DateFormat('yyyy-MM-dd').format(date),
        'reservation_time': '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}:00',
        'notes': notes,
        'status': 'pending',
      };
      
      final response = reservationId == null
          ? await _apiService.post('/tables/reservations/', data: reservationData)
          : await _apiService.put('/tables/reservations/$reservationId/', data: reservationData);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(reservationId == null ? 'Réservation créée' : 'Réservation modifiée'),
              backgroundColor: Colors.green,
            ),
          );
        }
        _loadReservations();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Table ${widget.tableName}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.info), text: 'Détails'),
            Tab(icon: Icon(Icons.event), text: 'Réservations'),
            Tab(icon: Icon(Icons.history), text: 'Historique'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDetailsTab(),
          _buildReservationsTab(),
          _buildHistoryTab(),
        ],
      ),
      floatingActionButton: _tabController.index == 1
          ? FloatingActionButton.extended(
              onPressed: () => _showReservationDialog(),
              icon: const Icon(Icons.add),
              label: const Text('Nouvelle Réservation'),
            )
          : null,
    );
  }

  Widget _buildDetailsTab() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    
    if (_tableDetails == null) {
      return const Center(child: Text('Aucune donnée disponible'));
    }
    
    final status = _tableDetails!['status'] ?? 'available';
    final capacity = _tableDetails!['capacity'] ?? 0;
    final currentSale = _tableDetails!['current_sale'];
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Statut de la table
          Card(
            color: status == 'occupied' ? Colors.red[50] : Colors.green[50],
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    status == 'occupied' ? Icons.person : Icons.check_circle,
                    size: 48,
                    color: status == 'occupied' ? Colors.red : Colors.green,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          status == 'occupied' ? 'Occupée' : 'Disponible',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: status == 'occupied' ? Colors.red : Colors.green,
                          ),
                        ),
                        Text(
                          'Capacité: $capacity personnes',
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Vente en cours
          if (currentSale != null) ...[
            const Text(
              'Vente en cours',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildInfoRow('Référence', currentSale['reference'] ?? 'N/A'),
                    _buildInfoRow('Client', currentSale['customer_name'] ?? 'Client anonyme'),
                    _buildInfoRow('Serveur', currentSale['server_name'] ?? 'Serveur'),
                    _buildInfoRow('Articles', currentSale['items']?.length.toString() ?? '0'),
                    _buildInfoRow(
                      'Montant',
                      '${NumberFormat('#,##0').format(currentSale['total_amount'] ?? 0)} BIF',
                    ),
                  ],
                ),
              ),
            ),
          ],
          
          const SizedBox(height: 24),
          
          // Statistiques
          const Text(
            'Statistiques',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Réservations',
                  _reservations.length.toString(),
                  Icons.event,
                  Colors.blue,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Ventes',
                  _history.length.toString(),
                  Icons.receipt,
                  Colors.green,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReservationsTab() {
    return _isLoading
        ? const Center(child: CircularProgressIndicator())
        : _reservations.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.event_busy, size: 64, color: Colors.grey[400]),
                    const SizedBox(height: 16),
                    Text(
                      'Aucune réservation',
                      style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                    ),
                  ],
                ),
              )
            : RefreshIndicator(
                onRefresh: _loadReservations,
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _reservations.length,
                  itemBuilder: (context, index) {
                    final reservation = _reservations[index];
                    final date = DateTime.parse(reservation['reservation_date']);
                    final status = reservation['status'] ?? 'pending';
                    
                    Color statusColor;
                    String statusLabel;
                    
                    switch (status) {
                      case 'confirmed':
                        statusColor = Colors.green;
                        statusLabel = 'Confirmée';
                        break;
                      case 'cancelled':
                        statusColor = Colors.red;
                        statusLabel = 'Annulée';
                        break;
                      default:
                        statusColor = Colors.orange;
                        statusLabel = 'En attente';
                    }
                    
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: statusColor.withOpacity(0.2),
                          child: Icon(Icons.event, color: statusColor),
                        ),
                        title: Text(
                          reservation['customer_name'] ?? 'Client',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text(DateFormat('dd/MM/yyyy HH:mm').format(date)),
                            Text('${reservation['number_of_guests']} personnes'),
                            Text(
                              statusLabel,
                              style: TextStyle(color: statusColor, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        trailing: PopupMenuButton(
                          itemBuilder: (context) => [
                            const PopupMenuItem(
                              value: 'edit',
                              child: Row(
                                children: [
                                  Icon(Icons.edit, size: 20),
                                  SizedBox(width: 8),
                                  Text('Modifier'),
                                ],
                              ),
                            ),
                            const PopupMenuItem(
                              value: 'cancel',
                              child: Row(
                                children: [
                                  Icon(Icons.cancel, size: 20, color: Colors.red),
                                  SizedBox(width: 8),
                                  Text('Annuler', style: TextStyle(color: Colors.red)),
                                ],
                              ),
                            ),
                          ],
                          onSelected: (value) {
                            if (value == 'edit') {
                              _showReservationDialog(reservation: reservation);
                            }
                          },
                        ),
                      ),
                    );
                  },
                ),
              );
  }

  Widget _buildHistoryTab() {
    return _isLoading
        ? const Center(child: CircularProgressIndicator())
        : _history.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.history, size: 64, color: Colors.grey[400]),
                    const SizedBox(height: 16),
                    Text(
                      'Aucun historique',
                      style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                    ),
                  ],
                ),
              )
            : RefreshIndicator(
                onRefresh: _loadHistory,
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _history.length,
                  itemBuilder: (context, index) {
                    final sale = _history[index];
                    final date = DateTime.parse(sale['created_at']);
                    
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: const CircleAvatar(
                          child: Icon(Icons.receipt),
                        ),
                        title: Text(sale['reference'] ?? 'N/A'),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text(DateFormat('dd/MM/yyyy HH:mm').format(date)),
                            Text(sale['customer_name'] ?? 'Client anonyme'),
                          ],
                        ),
                        trailing: Text(
                          '${NumberFormat('#,##0').format(sale['total_amount'] ?? 0)} BIF',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: Colors.green,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }
}
