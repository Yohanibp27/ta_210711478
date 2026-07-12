// import 'package:flutter_local_notifications/flutter_local_notifications.dart';
// import 'package:timezone/data/latest_all.dart' as tz;
// import 'package:timezone/timezone.dart' as tz;

// class NotificationService {
//   static final NotificationService _instance = NotificationService._internal();
//   factory NotificationService() => _instance;
//   NotificationService._internal();

//   final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
//       FlutterLocalNotificationsPlugin();

//   // 1. Inisialisasi (Panggil ini di main.dart)
//   Future<void> init() async {
//     tz.initializeTimeZones();
//     // Set lokasi waktu (WIB/Jakarta)
//     tz.setLocalLocation(tz.getLocation('Asia/Jakarta'));

//     const AndroidInitializationSettings initializationSettingsAndroid =
//         AndroidInitializationSettings(
//             '@mipmap/ic_launcher'); // Pastikan icon ada

//     const DarwinInitializationSettings initializationSettingsIOS =
//         DarwinInitializationSettings(
//       requestAlertPermission: true,
//       requestBadgePermission: true,
//       requestSoundPermission: true,
//     );

//     const InitializationSettings initializationSettings =
//         InitializationSettings(
//       android: initializationSettingsAndroid,
//       iOS: initializationSettingsIOS,
//     );

//     await flutterLocalNotificationsPlugin.initialize(initializationSettings);
//   }

//   // 2. Fungsi untuk Menjadwalkan Notifikasi (Daily)
//   Future<void> scheduleDailyNotification() async {
//     // ID notifikasi (unik per tipe notifikasi)
//     const int notificationId = 888;

//     await flutterLocalNotificationsPlugin.zonedSchedule(
//       notificationId,
//       'Waktunya Presensi!', // Judul
//       'Sudah jam 06:55, jangan lupa absen masuk sebelum terlambat.', // Isi
//       _nextInstanceOfSixFiftyFive(), // Fungsi penghitung waktu
//       const NotificationDetails(
//         android: AndroidNotificationDetails(
//           'channel_presensi_id',
//           'Reminder Presensi',
//           channelDescription: 'Notifikasi pengingat presensi harian',
//           importance: Importance.max,
//           priority: Priority.high,
//         ),
//         iOS: DarwinNotificationDetails(),
//       ),
//       androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
//       uiLocalNotificationDateInterpretation:
//           UILocalNotificationDateInterpretation.absoluteTime,
//       matchDateTimeComponents:
//           DateTimeComponents.time, // Agar berulang setiap hari di jam yg sama
//     );

//     print("Notifikasi dijadwalkan setiap jam 06:55");
//   }

//   // 3. Logic menghitung jam 06:55 berikutnya
//   tz.TZDateTime _nextInstanceOfSixFiftyFive() {
//     final tz.TZDateTime now = tz.TZDateTime.now(tz.local);

//     // Set target jam 06:55
//     tz.TZDateTime scheduledDate = tz.TZDateTime(
//       tz.local,
//       now.year,
//       now.month,
//       now.day,
//       6, // Jam
//       55, // Menit
//     );

//     // Jika waktu sekarang sudah lewat jam 06:55, jadwalkan buat besok
//     if (scheduledDate.isBefore(now)) {
//       scheduledDate = scheduledDate.add(const Duration(days: 1));
//     }

//     // Opsional: Jika hari Sabtu/Minggu libur, tambahkan logic skip hari disini
//     return scheduledDate;
//   }

//   // 4. Batalkan Notifikasi (Panggil ini saat User Logout atau Sudah Presensi)
//   Future<void> cancelNotification() async {
//     await flutterLocalNotificationsPlugin.cancel(888);
//     print("Notifikasi dibatalkan (User sudah presensi/logout)");
//   }
// }

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

class NotificationService {
  // Singleton pattern
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  // 1. Inisialisasi Service
  Future<void> init() async {
    tz.initializeTimeZones();
    // Set lokasi waktu ke WIB (Jakarta) agar jam 6.55 nya akurat
    // Pastikan string 'Asia/Jakarta' valid di database timezone
    try {
      tz.setLocalLocation(tz.getLocation('Asia/Jakarta'));
    } catch (e) {
      // Fallback jika device tidak support Asia/Jakarta, pakai local device
      tz.setLocalLocation(tz.local);
    }

    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings(
            '@mipmap/ic_launcher'); // Pastikan icon ada

    // Permission untuk iOS
    final DarwinInitializationSettings initializationSettingsDarwin =
        DarwinInitializationSettings(
      requestSoundPermission: true,
      requestBadgePermission: true,
      requestAlertPermission: true,
    );

    final InitializationSettings initializationSettings =
        InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsDarwin,
    );

    await flutterLocalNotificationsPlugin.initialize(initializationSettings);
  }

  // 2. Request Permission (Khusus Android 13+)
  Future<void> requestPermissions() async {
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
  }

  // 3. Pasang Jadwal Notifikasi Harian
  Future<void> scheduleDailyNotification() async {
    // Kita set ID 101 supaya nanti bisa dicancel pake ID ini
    const int notificationId = 101;

    await flutterLocalNotificationsPlugin.zonedSchedule(
      notificationId,
      'Jangan Lupa Presensi! ⏰', // Judul
      'Waktu sudah menunjukkan 06:55, ayo presensi masuk sekarang!', // Body
      _nextInstanceOfTime(6, 55), // Set jam 6:55
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'channel_presensi_wajib', // ID Channel
          'Pengingat Presensi', // Nama Channel
          channelDescription: 'Notifikasi harian untuk presensi pagi',
          importance: Importance.max,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: DarwinNotificationDetails(),
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents:
          DateTimeComponents.time, // Ulangi setiap hari di jam yang sama
    );
    print("✅ Notifikasi dijadwalkan setiap jam 06:55");
  }

  // 4. Batalkan Notifikasi (Panggil saat Logout)
  Future<void> cancelNotification() async {
    await flutterLocalNotificationsPlugin.cancel(101);
    print("❌ Notifikasi dibatalkan");
  }

  // Helper: Hitung waktu jam 6:55 berikutnya
  tz.TZDateTime _nextInstanceOfTime(int hour, int minute) {
    final tz.TZDateTime now = tz.TZDateTime.now(tz.local);
    tz.TZDateTime scheduledDate = tz.TZDateTime(
      tz.local,
      now.year,
      now.month,
      now.day,
      hour,
      minute,
    );

    // Jika waktu sekarang sudah lewat jam 6:55, jadwalkan buat BESOK
    if (scheduledDate.isBefore(now)) {
      scheduledDate = scheduledDate.add(const Duration(days: 1));
    }
    return scheduledDate;
  }
}
