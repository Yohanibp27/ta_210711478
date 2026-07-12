import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../pages/auth/login_page.dart';
import '../pages/dashboard_page.dart';
import '../pages/attendances/attendance_history_page.dart';
import '../pages/attendances/calendar_page.dart';
import '../pages/activities/activity_page.dart';
import '../pages/account/account_page.dart';

class DummyPage extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  const DummyPage({
    super.key,
    required this.title,
    required this.icon,
    required this.color,
  });
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 80, color: color),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}

// final GlobalKey<_MainNavigationState> mainNavKey =
//     GlobalKey<_MainNavigationState>();

class MainNavigation extends StatefulWidget {
  static final GlobalKey<_MainNavigationState> navKey =
      GlobalKey<_MainNavigationState>();

  // // SEKARANG: Ubah jadi static biasa tanpa 'final' agar bisa di-reset
  // static GlobalKey<_MainNavigationState> navKey =
  //     GlobalKey<_MainNavigationState>();

  // static void resetKey() {
  //   navKey = GlobalKey<_MainNavigationState>();
  // }

  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

// class MainNavigation extends StatefulWidget {
//   // 1. Tambahkan variabel ini
//   final int initialIndex;
//   // 2. Modifikasi constructor-nya
//   const MainNavigation({super.key, this.initialIndex = 0});

//   @override
//   State<MainNavigation> createState() => _MainNavigationState();
// }

class _MainNavigationState extends State<MainNavigation> {
  final AuthService authService = AuthService();
  int _selectedIndex = 0;
  // late int _selectedIndex; // 3. Ubah jadi late
  bool isLoading = false;
  late List<Widget> _widgetOptions;

  @override
  void initState() {
    super.initState();

    // 4. Set _selectedIndex dari parameter widget
    // _selectedIndex = widget.initialIndex;

    // Daftar halaman utama
    _widgetOptions = <Widget>[
      const DashboardPage(),
      const CalendarPage(),
      const AttendanceHistoryPage(),
      const ActivityPage(),
      const AccountPage(),
    ];

    _loadProfile();
    _loadAttendanceHistory();
  }

  void setSelectedIndex(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  // void _loadProfile() async {
  //   // misalnya load data user
  //   setState(() => isLoading = true);
  //   await Future.delayed(const Duration(seconds: 1));
  //   setState(() => isLoading = false);
  // }

  void _loadProfile() async {
    if (!mounted) return; // Pastikan widget masih aktif
    setState(() => isLoading = true);

    await Future.delayed(const Duration(seconds: 1));

    if (!mounted) return; // Cek lagi sebelum setState kedua
    setState(() => isLoading = false);
  }

  // void _loadAttendanceHistory() async {
  //   // misalnya ambil data presensi
  //   await Future.delayed(const Duration(milliseconds: 500));
  // }

  void _loadAttendanceHistory() async {
    await Future.delayed(const Duration(milliseconds: 500));

    if (!mounted) return;
    // bisa tambahkan logika fetch data riwayat di sini nanti
  }

  void _logout() async {
    await authService.logout();
    if (mounted) {
      // Navigator.pushReplacement(
      //   context,
      //   MaterialPageRoute(builder: (context) => const LoginPage()),
      // );
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const LoginPage()),
        (route) => false, // Menghapus semua halaman sebelumnya
      );
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Logout berhasil!'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Widget _buildHomePageContent() {
    return const DashboardPage(); // panggil dashboard utama
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  // BUILD METHOD
  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    // 1. Tentukan apakah halaman yang dipilih adalah halaman penuh (punya Scaffold/AppBar sendiri)
    final isFullPage =
        _widgetOptions[_selectedIndex] is AttendanceHistoryPage ||
            _widgetOptions[_selectedIndex] is AccountPage;

    // Tentukan judul AppBar dinamis
    // String appBarTitle;

    // 1. Tentukan Judul dan style AppBar (tetap sama)
    String appBarTitle = 'App';
    IconData? appBarActionIcon;
    VoidCallback? appBarAction;
    Color appBarColor = const Color(0xFF6F34FA);
    if (_selectedIndex == 0) {
      appBarTitle = "Beranda";
    } else if (_selectedIndex == 1) {
      appBarTitle = "Jadwal";
    } else if (_selectedIndex == 2) {
      appBarTitle = "Riwayat Presensi";
    } else if (_selectedIndex == 3) {
      appBarTitle = "Aktivitas";
    } else if (_selectedIndex == 4) {
      appBarTitle = "Akun";
      // appBarActionIcon = Icons.logout;
      // appBarAction = _logout;
    } else if (_widgetOptions[_selectedIndex] is DummyPage) {
      appBarTitle = (_widgetOptions[_selectedIndex] as DummyPage).title;
    } else {
      appBarTitle = "App";
    }

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: Text(
          appBarTitle,
          style: TextStyle(
              color: appBarColor == Colors.white ? Colors.black : Colors.white),
        ),
        backgroundColor: appBarColor,
        foregroundColor:
            appBarColor == Colors.white ? Colors.black : Colors.white,
        elevation: appBarColor == Colors.white ? 0.5 : 4,
        actions: [
          if (appBarActionIcon != null)
            IconButton(
              icon: Icon(appBarActionIcon),
              onPressed: appBarAction,
              color: appBarColor == Colors.white
                  ? (appBarActionIcon == Icons.logout
                      ? Colors.red
                      : Colors.black)
                  : Colors.white,
            ),
        ],
      ),
      body: SafeArea(
        child: _widgetOptions.elementAt(_selectedIndex),
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _selectedIndex,
        selectedItemColor: const Color(0xFF6F34FA),
        unselectedItemColor: Colors.grey,
        onTap: _onItemTapped,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Beranda', // penggantinya home
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.schedule),
            label: 'Jadwal',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history),
            label: 'Riwayat',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications),
            label: 'Aktivitas',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            label: 'Akun',
          ),
        ],
      ),
    );
  }
}
