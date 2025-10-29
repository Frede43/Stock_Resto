import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'api_service.dart';
import 'demo_service.dart';
import '../core/config/app_config.dart';
import '../core/constants/api_constants.dart';

class ProfileService extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final DemoService _demoService = DemoService();

  Map<String, dynamic> _profile = {};
  bool _isLoading = false;
  final bool _isUpdating = false;

  Map<String, dynamic> get profile => _profile;
  bool get isLoading => _isLoading;
  bool get isUpdating => _isUpdating;

  // Charger le profil utilisateur
  Future<void> loadProfile() async {
    _isLoading = true;
    notifyListeners();

    try {
      if (AppConfig.isDemoMode) {
        final demoProfile = await _demoService.getUserProfile();
        _profile = demoProfile as Map<String, dynamic>;
      } else {
        final response = await _apiService.get('/accounts/profile/');
        if (response.statusCode == 200) {
          _profile = {
            'id': response.data['id'],
            'username': response.data['username'],
            'email': response.data['email'],
            'first_name': response.data['first_name'] ?? '',
            'last_name': response.data['last_name'] ?? '',
            'phone': response.data['phone'] ?? '',
            'address': response.data['address'] ?? '',
            'role': response.data['role'] ?? 'server',
            'avatar': response.data['avatar'],
            'is_active': response.data['is_active'] ?? true,
            'last_activity': response.data['last_activity'],
          };
          print(' Profil chargé: ${_profile['username']}');
        }
      }
    } catch (e) {
      print(' Erreur lors du chargement du profil: $e');

      // Fallback en mode démo
      if (!AppConfig.isDemoMode && AppConfig.enableOfflineMode) {
        print('🔄 Fallback en mode démo pour le profil');
        final demoProfile = await _demoService.getUserProfile();
        _profile = demoProfile as Map<String, dynamic>;
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Mettre à jour le profil utilisateur
  Future<bool> updateProfile(Map<String, dynamic> data) async {
    try {
      if (AppConfig.isDemoMode) {
        // Simuler la mise à jour
        _profile = {..._profile, ...data};
        notifyListeners();
        return true;
      } else {
        final response = await _apiService.patch('/accounts/profile/', data: data);
        if (response.statusCode == 200) {
          await loadProfile();
          return true;
        }
      }
    } catch (e) {
      print(' Erreur lors de la mise à jour du profil: $e');
    }
    return false;
  }

  // Changer le mot de passe
  Future<bool> changePassword(String currentPassword, String newPassword) async {
    try {
      if (AppConfig.isDemoMode) {
        // Simuler le changement de mot de passe
        await Future.delayed(const Duration(seconds: 1));
        return true;
      } else {
        final response =
            await _apiService.post('/accounts/profile/change-password/', data: {
          'current_password': currentPassword,
          'new_password': newPassword,
        });
        return response.statusCode == 200;
      }
    } catch (e) {
      print(' Erreur lors du changement de mot de passe: $e');
    }
    return false;
  }

  // Mettre à jour la photo de profil
  Future<bool> updateAvatar(File imageFile) async {
    try {
      if (AppConfig.isDemoMode) {
        // Simuler la mise à jour
        _profile['avatar'] = imageFile.path;
        notifyListeners();
        return true;
      } else {
        String fileName = imageFile.path.split('/').last;
        FormData formData = FormData.fromMap({
          'avatar': await MultipartFile.fromFile(imageFile.path, filename: fileName),
        });

        final response = await _apiService.patch('/accounts/profile/', data: formData);
        if (response.statusCode == 200) {
          await loadProfile();
          print(' Photo de profil mise à jour');
          return true;
        }
      }
    } catch (e) {
      print(' Erreur lors de la mise à jour de la photo: $e');
    }
    return false;
  }

  // Déconnexion
  Future<void> logout() async {
    try {
      if (!AppConfig.isDemoMode) {
        await _apiService.post('/accounts/logout/');
      }
    } catch (e) {
      print('Erreur lors de la déconnexion: $e');
    } finally {
      _profile = {};
      notifyListeners();
    }
  }
}
