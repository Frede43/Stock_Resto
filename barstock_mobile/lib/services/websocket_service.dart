import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;

class WebSocketService {
  WebSocketChannel? _channel;
  String? _userId;
  Timer? _pingTimer;
  
  // Callbacks pour les différents types de messages
  Function(Map<String, dynamic>)? onStockAlert;
  Function(Map<String, dynamic>)? onSaleNotification;
  Function(Map<String, dynamic>)? onSystemNotification;
  Function(Map<String, dynamic>)? onOrderUpdate;
  
  void connect(String userId) {
    _userId = userId;
    final wsUrl = 'ws://127.0.0.1:8000/ws/notifications/$userId/';
    
    try {
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      
      _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDisconnection,
      );
      
      // Envoyer un ping périodique
      _startPingTimer();
      
      print('✅ WebSocket connecté pour l\'utilisateur $userId');
      
    } catch (e) {
      print('❌ Erreur connexion WebSocket: $e');
    }
  }
  
  void _handleMessage(dynamic message) {
    try {
      final data = Map<String, dynamic>.from(json.decode(message));
      
      switch (data['type']) {
        case 'stock_alert':
          onStockAlert?.call(data['alert']);
          break;
        case 'sale_notification':
          onSaleNotification?.call(data['sale']);
          break;
        case 'system_notification':
          onSystemNotification?.call(data);
          break;
        case 'pong':
          // Réponse au ping
          break;
        default:
          print('📨 Message WebSocket reçu: $data');
      }
    } catch (e) {
      print('❌ Erreur parsing message WebSocket: $e');
    }
  }
  
  void _handleError(error) {
    print('❌ Erreur WebSocket: $error');
    // Tentative de reconnexion après 5 secondes
    Timer(const Duration(seconds: 5), () {
      if (_userId != null) {
        print('🔄 Tentative de reconnexion WebSocket...');
        connect(_userId!);
      }
    });
  }
  
  void _handleDisconnection() {
    print('🔌 WebSocket déconnecté');
    // Tentative de reconnexion
    Timer(const Duration(seconds: 5), () {
      if (_userId != null) {
        print('🔄 Tentative de reconnexion WebSocket...');
        connect(_userId!);
      }
    });
  }
  
  void _startPingTimer() {
    _pingTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      if (_channel != null) {
        _channel!.sink.add(json.encode({'type': 'ping'}));
      } else {
        timer.cancel();
      }
    });
  }
  
  void disconnect() {
    _pingTimer?.cancel();
    _channel?.sink.close(status.goingAway);
    _channel = null;
    print('🔌 WebSocket déconnecté manuellement');
  }
}
