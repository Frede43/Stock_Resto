import 'api_service.dart';

/// Service pour gérer les opérations liées aux ventes
class SalesService {
  final ApiService _apiService = ApiService();
  
  /// Marquer une vente comme payée
  /// 
  /// [saleId] : ID de la vente
  /// 
  /// Retourne un Map avec :
  /// - success: bool
  /// - data: données de la réponse (si succès)
  /// - error: message d'erreur (si échec)
  Future<Map<String, dynamic>> markAsPaid(int saleId) async {
    try {
      print('💳 Marquage vente $saleId comme payée...');
      
      final response = await _apiService.post('/sales/$saleId/mark-paid/');
      
      if (response.statusCode == 200) {
        print('✅ Vente $saleId marquée comme payée');
        return {
          'success': true,
          'data': response.data,
        };
      } else {
        print('❌ Erreur ${response.statusCode}: ${response.data}');
        return {
          'success': false,
          'error': response.data['error'] ?? 'Erreur lors du paiement',
        };
      }
    } catch (e) {
      print('❌ Exception lors du paiement: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
  
  /// Ajouter des articles à une vente existante
  /// 
  /// [saleId] : ID de la vente
  /// [items] : Liste des articles à ajouter
  ///   Chaque item doit contenir:
  ///   - product: ID du produit
  ///   - quantity: quantité
  ///   - notes: notes (optionnel)
  /// 
  /// Retourne un Map avec :
  /// - success: bool
  /// - data: données de la réponse (si succès)
  /// - error: message d'erreur (si échec)
  Future<Map<String, dynamic>> addItems(int saleId, List<Map<String, dynamic>> items) async {
    try {
      print('➕ Ajout de ${items.length} article(s) à la vente $saleId...');
      
      final response = await _apiService.post(
        '/sales/$saleId/add-items/',
        data: {'items': items},
      );
      
      if (response.statusCode == 200) {
        print('✅ Articles ajoutés à la vente $saleId');
        return {
          'success': true,
          'data': response.data,
        };
      } else {
        print('❌ Erreur ${response.statusCode}: ${response.data}');
        return {
          'success': false,
          'error': response.data['error'] ?? 'Erreur lors de l\'ajout',
        };
      }
    } catch (e) {
      print('❌ Exception lors de l\'ajout: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
  
  /// Récupérer la facture d'une vente
  /// 
  /// [saleId] : ID de la vente
  /// 
  /// Retourne un Map avec :
  /// - success: bool
  /// - invoice: données de la facture (si succès)
  /// - error: message d'erreur (si échec)
  Future<Map<String, dynamic>> getInvoice(int saleId) async {
    try {
      print('📄 Récupération facture pour vente $saleId...');
      
      final response = await _apiService.get('/sales/$saleId/invoice/?format=json');
      
      if (response.statusCode == 200) {
        print('✅ Facture récupérée pour vente $saleId');
        
        // Le backend retourne { success: true, invoice: {...} }
        final invoice = response.data['invoice'];
        
        return {
          'success': true,
          'invoice': invoice,
        };
      } else {
        print('❌ Erreur ${response.statusCode}: ${response.data}');
        return {
          'success': false,
          'error': response.data['error'] ?? 'Erreur lors de la récupération de la facture',
        };
      }
    } catch (e) {
      print('❌ Exception lors de la récupération: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
  
  /// Récupérer les détails d'une vente
  /// 
  /// [saleId] : ID de la vente
  /// 
  /// Retourne un Map avec :
  /// - success: bool
  /// - sale: données de la vente (si succès)
  /// - error: message d'erreur (si échec)
  Future<Map<String, dynamic>> getSaleDetails(int saleId) async {
    try {
      print('🔍 Récupération détails vente $saleId...');
      
      final response = await _apiService.get('/sales/$saleId/');
      
      if (response.statusCode == 200) {
        print('✅ Détails récupérés pour vente $saleId');
        return {
          'success': true,
          'sale': response.data,
        };
      } else {
        print('❌ Erreur ${response.statusCode}: ${response.data}');
        return {
          'success': false,
          'error': response.data['error'] ?? 'Erreur lors de la récupération',
        };
      }
    } catch (e) {
      print('❌ Exception lors de la récupération: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
}
