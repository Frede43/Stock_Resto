import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'api_service.dart';
import 'demo_service.dart';
import '../core/config/app_config.dart';
import '../core/constants/api_constants.dart';

class AuthService extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final DemoService _demoService = DemoService();
  bool _isLoggedIn = false;

  bool get isLoggedIn => _isLoggedIn;

  Future<Map<String, dynamic>?> login(String username, String password) async {
    try {
      // Mode démo activé
      if (AppConfig.isDemoMode) {
        print('🎭 Mode démo activé - Utilisation des données simulées');
        final result = await _demoService.login(username, password);
        if (result != null) {
          await _saveTokens(result['access'], result['refresh']);
          _isLoggedIn = true;
          notifyListeners();
        }
        return result;
      }

      // Mode production - API réelle
      final response = await _apiService.post(ApiConstants.loginEndpoint, data: {
        'username': username,
        'password': password,
      });

      if (response.statusCode == 200) {
        print('📦 Réponse backend: ${response.data}');
        
        // Le backend renvoie: { "tokens": { "access": "...", "refresh": "..." }, "user": {...} }
        final tokens = response.data['tokens'];
        final token = tokens['access'];
        final refreshToken = tokens['refresh'];
        final userData = response.data['user'];

        print('✅ Token reçu: ${token?.substring(0, 20)}...');
        print('✅ User data: $userData');

        // Sauvegarder les tokens
        await _saveTokens(token, refreshToken);

        // Décoder le token pour obtenir les infos utilisateur
        final userInfo = JwtDecoder.decode(token);

        _isLoggedIn = true;
        notifyListeners();

        // Sauvegarder les données utilisateur
        await _saveUserData(userData ?? userInfo);

        return {
          'token': token,
          'refresh': refreshToken,
          'user': userData ?? userInfo,
        };
      }
    } catch (e) {
      print('Erreur de connexion: $e');

      // Fallback en mode démo si l'API échoue
      if (!AppConfig.isDemoMode && AppConfig.enableOfflineMode) {
        print('🔄 Fallback en mode démo suite à l\'erreur API');
        final result = await _demoService.login(username, password);
        if (result != null) {
          await _saveTokens(result['access'], result['refresh']);
          _isLoggedIn = true;
          notifyListeners();
        }
        return result;
      }
    }
    return null;
  }

  Future<void> _saveTokens(String token, String refreshToken) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwt_token', token);
    await prefs.setString('refresh_token', refreshToken);
  }

  Future<void> _saveUserData(Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_role', userData['role'] ?? '');
    await prefs.setString('user_id', userData['id']?.toString() ?? '');
    await prefs.setString('username', userData['username'] ?? '');
  }

  Future<bool> checkLoginStatus() async {
    final token = await _getToken();
    if (token == null) return false;

    try {
      final expired = JwtDecoder.isExpired(token);
      _isLoggedIn = !expired;
      return !expired;
    } catch (e) {
      _isLoggedIn = false;
      return false;
    }
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('jwt_token');
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
    await prefs.remove('refresh_token');
    _isLoggedIn = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final role = prefs.getString('user_role');
    final userId = prefs.getString('user_id');
    final username = prefs.getString('username');

    if (role != null && userId != null) {
      return {
        'role': role,
        'user_id': int.tryParse(userId),
        'username': username,
      };
    }

    // Fallback: essayer de décoder le token
    final token = await _getToken();
    if (token == null) return null;

    try {
      return JwtDecoder.decode(token);
    } catch (e) {
      return null;
    }
  }
}
