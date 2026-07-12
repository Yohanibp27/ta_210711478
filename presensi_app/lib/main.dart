import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
// import 'utils/mainNavigation_page.dart';
import 'package:presensi_app/pages/auth/login_page.dart';
import 'package:presensi_app/services/notification_service.dart';
import 'package:presensi_app/services/navigation_service.dart';

// void main() {
//   runApp(const MyApp());
// }

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Inisialisasi locale Bahasa Indonesia
  await initializeDateFormatting('id_ID', null);
  // Inisialisasi notifikasi saat aplikasi mulai
  await NotificationService().init();

  // runApp(const MyApp());

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey:
          NavigationService.navigatorKey, // <--- Tambahkan ini 12 ju 26
      debugShowCheckedModeBanner: false,
      // title: 'Presensi RSBI',
      title: 'SIGAPRES',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        fontFamily: 'Inter',
      ),
      // home: const LoginPage(),
      initialRoute: '/',
      routes: {
        '/': (context) => const LoginPage(), // Sesuaikan dengan logika awalmu
        '/login': (context) => const LoginPage(),
      },
    );
  }
}

// home: const MainNavigation(),