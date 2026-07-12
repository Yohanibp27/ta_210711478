import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  Map<String, dynamic>? _user;
  Map<String, dynamic>? get user => _user;

  bool _isLoggedIn = false;
  bool get isLoggedIn => _isLoggedIn;


  Future<void> login(String nip, String password) async {
    final result = await _authService.login(nip, password); // hasil Map

    if (result["success"] == true) {
      _user = result;
      _isLoggedIn = true;
    } else {
      _isLoggedIn = false;
    }

    notifyListeners();
  }
}
