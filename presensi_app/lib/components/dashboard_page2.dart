// // GA DIPAKE!!!
// import 'package:flutter/material.dart';
// import 'package:intl/intl.dart';
// import 'package:provider/provider.dart';

// import '../services/auth_service.dart';
// import '../pages/auth/login_page.dart';
// import '../pages/text/attendanceScan_page.dart';

// // MODELS
// class AttendanceRecord {
//   final DateTime date;
//   final String checkIn;
//   final String checkOut;
//   final String status;

//   AttendanceRecord({
//     required this.date,
//     required this.checkIn,
//     required this.checkOut,
//     required this.status,
//   });
// }

// // PROVIDER USER / AUTH
// class AuthProvider extends ChangeNotifier {
//   Map<String, dynamic>? user;
//   bool isLoading = true;

//   final AuthService _authService = AuthService();

//   Future<void> loadProfile() async {
//     try {
//       final data = await _authService.getProfile();
//       user = data?['data'] ?? {};
//       isLoading = false;
//       notifyListeners();
//     } catch (e) {
//       user = {};
//       isLoading = false;
//       notifyListeners();
//     }
//   }

//   Future<void> logout(BuildContext context) async {
//     await _authService.logout();
//     Navigator.pushReplacement(
//       context,
//       MaterialPageRoute(builder: (_) => const LoginPage()),
//     );
//   }

//   String get displayName {
//     if (user == null) return "Pengguna";
//     final nameParts = [
//       user?['firstName'],
//       user?['middleName'],
//       user?['lastName']
//     ].where((e) => e != null && e.isNotEmpty).toList();
//     return nameParts.isNotEmpty ? nameParts.join(' ') : "Pengguna";
//   }

//   String get email {
//     return user?['email'] ?? "-";
//   }

//   String get id {
//     return user?['id'].toString() ?? "";
//   }

//   String get token {
//     return user?['token'] ?? "";
//   }
// }

// // PROVIDER PRESENSI
// class AttendanceProvider extends ChangeNotifier {
//   List<AttendanceRecord> history = [];

//   void setHistory(List<AttendanceRecord> newHistory) {
//     history = newHistory;
//     notifyListeners();
//   }

//   void addRecord(AttendanceRecord record) {
//     history.insert(0, record);
//     notifyListeners();
//   }
// }

// // DASHBOARD PAGE
// class DashboardPage extends StatefulWidget {
//   const DashboardPage({super.key});

//   @override
//   State<DashboardPage> createState() => _DashboardPageState();
// }

// class _DashboardPageState extends State<DashboardPage> {
//   int _selectedIndex = 0;

//   late final List<Widget> _widgetOptions;

//   @override
//   void initState() {
//     super.initState();

//     // final authProvider = context.read<AuthProvider>();
//     // authProvider.loadProfile();

//     _widgetOptions = <Widget>[
//       _buildHomePageContent(),
//       const DummyPage(
//           title: 'Jadwal', icon: Icons.schedule, color: Color(0xFF6F34FA)),
//       const DummyPage(
//           title: 'Riwayat/Notifikasi',
//           icon: Icons.history,
//           color: Color(0xFF6F34FA)),
//       const DummyPage(
//           title: 'Pengaturan/Akun',
//           icon: Icons.person_outline,
//           color: Color(0xFF6F34FA)),
//     ];
//   }

//   void _onItemTapped(int index) {
//     setState(() {
//       _selectedIndex = index;
//     });
//   }

//   // ======================================
//   Widget _buildHomePageContent() {
//     final now = DateTime.now();
//     final formattedDate = DateFormat('EEEE, dd MMMM yyyy', 'id_ID').format(now);
//     final formattedTime = DateFormat('HH:mm').format(now);

//     final authProvider = context.watch<AuthProvider>();
//     final attendanceProvider = context.watch<AttendanceProvider>();
//     // print('User email: ${authProvider.user?.email}');
//     print('User email: ${authProvider.user?['email']}');

//     // dummy history jika kosong
//     if (attendanceProvider.history.isEmpty) {
//       attendanceProvider.setHistory([
//         AttendanceRecord(
//             date: now.subtract(const Duration(days: 1)),
//             checkIn: "08:00",
//             checkOut: "17:00",
//             status: "hadir"),
//         AttendanceRecord(
//             date: now.subtract(const Duration(days: 2)),
//             checkIn: "08:15",
//             checkOut: "17:00",
//             status: "terlambat"),
//         AttendanceRecord(
//             date: now.subtract(const Duration(days: 3)),
//             checkIn: "08:00",
//             checkOut: "17:00",
//             status: "hadir"),
//       ]);
//     }

//     return SingleChildScrollView(
//       child: Column(
//         children: [
//           // HEADER
//           Container(
//             width: double.infinity,
//             padding: const EdgeInsets.all(20),
//             decoration: const BoxDecoration(
//               gradient: LinearGradient(
//                 colors: [Color(0xFF6F34FA), Color(0xFF8E5CFC)],
//                 begin: Alignment.topLeft,
//                 end: Alignment.bottomRight,
//               ),
//               borderRadius: BorderRadius.vertical(bottom: Radius.circular(20)),
//             ),
//             child: Row(
//               crossAxisAlignment: CrossAxisAlignment.center,
//               children: [
//                 Expanded(
//                   child: Column(
//                     crossAxisAlignment: CrossAxisAlignment.start,
//                     children: [
//                       Text(
//                         'Halo, ${authProvider.displayName}',
//                         style: const TextStyle(
//                             fontSize: 20,
//                             fontWeight: FontWeight.bold,
//                             color: Colors.white),
//                       ),
//                       const SizedBox(height: 4),
//                       Text(
//                         authProvider.email,
//                         style: const TextStyle(
//                             color: Colors.white70, fontSize: 14),
//                       ),
//                     ],
//                   ),
//                 ),
//                 const CircleAvatar(
//                   radius: 25,
//                   backgroundImage: AssetImage('assets/new_profile.jpg'),
//                 ),
//               ],
//             ),
//           ),

//           const SizedBox(height: 16),

//           // CARD PRESENSI HARI INI
//           Padding(
//             padding: const EdgeInsets.symmetric(horizontal: 20),
//             child: Card(
//               shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(16)),
//               elevation: 2,
//               child: Padding(
//                 padding: const EdgeInsets.all(16),
//                 child: Column(
//                   children: [
//                     Row(
//                       mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                       children: [
//                         Text(formattedDate,
//                             style: const TextStyle(
//                                 fontSize: 14, color: Colors.grey)),
//                         Text(formattedTime,
//                             style: const TextStyle(
//                                 fontSize: 14, color: Colors.grey)),
//                       ],
//                     ),
//                     const SizedBox(height: 16),
//                     Row(
//                       mainAxisAlignment: MainAxisAlignment.spaceAround,
//                       children: [
//                         Column(
//                           children: const [
//                             Icon(Icons.check_circle,
//                                 color: Colors.orange, size: 24),
//                             SizedBox(height: 4),
//                             Text("Hadir",
//                                 style: TextStyle(color: Colors.black54)),
//                             Text("08:57",
//                                 style: TextStyle(
//                                     fontSize: 20, fontWeight: FontWeight.bold)),
//                           ],
//                         ),
//                         Container(
//                           width: 1,
//                           height: 40,
//                           color: Colors.grey.shade300,
//                         ),
//                         Column(
//                           children: const [
//                             Icon(Icons.exit_to_app,
//                                 color: Colors.grey, size: 24),
//                             SizedBox(height: 4),
//                             Text("Pulang",
//                                 style: TextStyle(color: Colors.black54)),
//                             Text("--:--",
//                                 style: TextStyle(
//                                     fontSize: 20, fontWeight: FontWeight.bold)),
//                           ],
//                         ),
//                       ],
//                     ),
//                     const SizedBox(height: 16),
//                     ElevatedButton(
//                       onPressed: () {
//                         Navigator.push(
//                           context,
//                           MaterialPageRoute(
//                             builder: (_) => AttendanceScanPage(
//                                 // userId: authProvider.id,
//                                 userId: int.parse(authProvider.id),
//                                 // userId: int.tryParse(authProvider.id ?? '0') ?? 0,
//                                 token: authProvider.token),
//                           ),
//                         );
//                       },
//                       style: ElevatedButton.styleFrom(
//                         backgroundColor: const Color(0xFF00BFA5),
//                         minimumSize: const Size(double.infinity, 45),
//                         shape: RoundedRectangleBorder(
//                             borderRadius: BorderRadius.circular(10)),
//                       ),
//                       child: const Text(
//                         "REKAM PRESENSI",
//                         style: TextStyle(
//                             fontWeight: FontWeight.bold, letterSpacing: 1),
//                       ),
//                     ),
//                   ],
//                 ),
//               ),
//             ),
//           ),

//           const SizedBox(height: 16),

//           // RIWAYAT PRESENSI
//           Padding(
//             padding: const EdgeInsets.symmetric(horizontal: 20),
//             child: Column(
//               crossAxisAlignment: CrossAxisAlignment.start,
//               children: [
//                 const Text(
//                   "Riwayat Presensi Terakhir",
//                   style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
//                 ),
//                 const SizedBox(height: 12),
//                 Column(
//                   children: attendanceProvider.history
//                       .take(3)
//                       .map((record) => AttendanceHistoryItem(record: record))
//                       .toList(),
//                 ),
//               ],
//             ),
//           ),
//         ],
//       ),
//     );
//   }

//   // ======================================
//   @override
//   Widget build(BuildContext context) {
//     final authProvider = context.watch<AuthProvider>();
//     if (authProvider.isLoading) {
//       return const Scaffold(
//         body: Center(child: CircularProgressIndicator()),
//       );
//     }

//     return Scaffold(
//       appBar: AppBar(
//         title: const Text("Dashboard"),
//         backgroundColor: const Color(0xFF6F34FA),
//         actions: [
//           IconButton(
//               icon: const Icon(Icons.logout),
//               onPressed: () => authProvider.logout(context))
//         ],
//       ),
//       body: SafeArea(child: _widgetOptions.elementAt(_selectedIndex)),
//       bottomNavigationBar: BottomNavigationBar(
//         items: const [
//           BottomNavigationBarItem(icon: Icon(Icons.home), label: "Home"),
//           BottomNavigationBarItem(icon: Icon(Icons.schedule), label: "Jadwal"),
//           BottomNavigationBarItem(icon: Icon(Icons.history), label: "Riwayat"),
//           BottomNavigationBarItem(
//               icon: Icon(Icons.person_outline), label: "Akun"),
//         ],
//         currentIndex: _selectedIndex,
//         selectedItemColor: const Color(0xFF6F34FA),
//         unselectedItemColor: Colors.grey,
//         onTap: _onItemTapped,
//         type: BottomNavigationBarType.fixed,
//       ),
//     );
//   }
// }

// // ======================================
// // WIDGET RIWAYAT PRESENSI
// // ======================================
// class AttendanceHistoryItem extends StatelessWidget {
//   final AttendanceRecord record;

//   const AttendanceHistoryItem({super.key, required this.record});

//   Color _getStatusColor(String status) {
//     switch (status.toLowerCase()) {
//       case 'hadir':
//         return const Color(0xFF00BFA5);
//       case 'terlambat':
//         return const Color(0xFFFF9800);
//       default:
//         return Colors.grey;
//     }
//   }

//   Color _getBackgroundColor(String status) {
//     switch (status.toLowerCase()) {
//       case 'hadir':
//         return const Color(0xFFE0F7FA);
//       case 'terlambat':
//         return const Color(0xFFFFECB3);
//       default:
//         return Colors.grey.shade200;
//     }
//   }

//   String _formatDate(DateTime date) {
//     return DateFormat('dd MMM', 'id_ID').format(date);
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Container(
//       margin: const EdgeInsets.only(bottom: 12),
//       padding: const EdgeInsets.all(16),
//       decoration: BoxDecoration(
//           color: Colors.white,
//           borderRadius: BorderRadius.circular(10),
//           boxShadow: [
//             BoxShadow(
//                 color: Colors.grey.withOpacity(0.1),
//                 spreadRadius: 1,
//                 blurRadius: 3)
//           ]),
//       child: Row(
//         children: [
//           Container(
//             padding: const EdgeInsets.all(8),
//             decoration: BoxDecoration(
//                 color: Colors.grey.shade200,
//                 borderRadius: BorderRadius.circular(8)),
//             child: const Icon(Icons.calendar_today,
//                 size: 20, color: Color(0xFF6F34FA)),
//           ),
//           const SizedBox(width: 16),
//           Expanded(
//             child: Column(
//               crossAxisAlignment: CrossAxisAlignment.start,
//               children: [
//                 Text(_formatDate(record.date),
//                     style: const TextStyle(
//                         fontSize: 16, fontWeight: FontWeight.bold)),
//                 const SizedBox(height: 4),
//                 Text('${record.checkIn} - ${record.checkOut}',
//                     style: const TextStyle(fontSize: 14, color: Colors.grey)),
//               ],
//             ),
//           ),
//           Container(
//             padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
//             decoration: BoxDecoration(
//                 color: _getBackgroundColor(record.status),
//                 borderRadius: BorderRadius.circular(15)),
//             child: Text(record.status.toUpperCase(),
//                 style: TextStyle(
//                     color: _getStatusColor(record.status),
//                     fontWeight: FontWeight.bold,
//                     fontSize: 12)),
//           ),
//         ],
//       ),
//     );
//   }
// }

// // ======================================
// // WIDGET DUMMY HALAMAN
// // ======================================
// class DummyPage extends StatelessWidget {
//   final String title;
//   final IconData icon;
//   final Color color;

//   const DummyPage(
//       {super.key,
//       required this.title,
//       required this.icon,
//       required this.color});

//   @override
//   Widget build(BuildContext context) {
//     return Center(
//       child: Column(
//         mainAxisAlignment: MainAxisAlignment.center,
//         children: [
//           Icon(icon, size: 80, color: color),
//           const SizedBox(height: 20),
//           Text('Halaman $title',
//               style: TextStyle(
//                   fontSize: 24, fontWeight: FontWeight.bold, color: color)),
//           const SizedBox(height: 8),
//           const Text('Konten akan dimuat di sini.')
//         ],
//       ),
//     );
//   }
// }
