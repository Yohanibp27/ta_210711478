// 12 juni 2026
import 'package:flutter/material.dart';

class NavigationService {
  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  static void navigateToLogin() {
    print("🚨 NAVIGATE TO LOGIN DIPANGGIL");
    print("NAVIGATOR STATE = ${navigatorKey.currentState}");

    navigatorKey.currentState
        ?.pushNamedAndRemoveUntil('/login', (route) => false);
  }
}


// import 'package:flutter/material.dart';

// class NavigationService {
//   static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

//   static void navigateToLogin() {
//     navigatorKey.currentState?.pushNamedAndRemoveUntil('/login', (route) => false);
//   }
// }