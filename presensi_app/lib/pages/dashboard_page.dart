import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:presensi_app/services/auth_service.dart';
import 'package:presensi_app/utils/qr_scanner_page.dart';
import 'package:presensi_app/utils/main_navigation_page.dart';
import 'package:collection/collection.dart';
import 'package:presensi_app/utils/face_verification_page.dart';
import 'dart:io';
import 'package:presensi_app/utils/profile_helper.dart';

class AttendanceRecord {
  final DateTime date;
  final String checkInTime;
  final String checkOutTime;
  final String status;
  final String? checkInLocation;
  final String? checkOutLocation;
  final String? notes;

  AttendanceRecord({
    required this.date,
    required this.checkInTime,
    required this.checkOutTime,
    required this.status,
    this.checkInLocation,
    this.checkOutLocation,
    this.notes,
  });
}

DateTime parseTimeOnDate(DateTime date, String timeStr) {
  final parts = timeStr.split(':');
  return DateTime(date.year, date.month, date.day, int.parse(parts[0]),
      int.parse(parts[1]));
}

DateTime _parseDateTime(String dateStr, String timeStr) {
  final date = DateTime.parse(dateStr);
  final parts = timeStr.split(':');
  return DateTime(date.year, date.month, date.day, int.parse(parts[0]),
      int.parse(parts[1]));
}

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final AuthService authService = AuthService();

  List<AttendanceRecord> attendanceHistory = [];
  List<Map<String, dynamic>> workSchedules = [];
  List<dynamic> rawAttendances = [];
  List<String> completedShiftIdsToday = [];
  List<Map<String, dynamic>>? workShiftData;
  List<Map<String, dynamic>>? shiftAssignmentsData;
  Map<String, dynamic>? workShift;

  String userName = "-";
  String userEmail = "-";
  String currentGpsLocation = "Mencari lokasi...";
  bool isLoading = true;
  bool hasCheckedIn = false;
  bool hasCheckedOut = false;
  bool isAfterShift = false;
  bool isDinasLuar = false;
  bool get isOnLeave => false;
  String? checkInTime;
  String? checkOutTime;
  String? userStatus;
  String? employmentType;
  String? activeAttendanceDate;
  String? todayLeaveType;
  String? activeShiftId;
  String? activeAttendanceType;
  String? profilePhotoUrl;
  int? activeLeaveRequestId;

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('id_ID', null);

    // _loadProfile();
    _loadUserStatus();
    _initData();
  }

  // Future<void> _initData() async {
  //   await _checkDinasLuarStatus();
  //   await _loadWorkSchedules();
  //   await _loadAttendanceHistory();
  // }

  Future<void> _initData() async {
    try {
      // Tambahkan <void> untuk memberi tahu Dart bahwa kita menunggu sekumpulan Future void
      await Future.wait<void>([
        _loadProfile(),
        _checkDinasLuarStatus(),
        _loadAttendanceHistory(),
        _loadWorkSchedules(),
      ]);

      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    } catch (e) {
      print("Error initializing data: $e");
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }

    // // 13 JUN 26
    // try {
    //   // 1. Load data yang aman berjalan berbarengan
    //   await Future.wait<void>([
    //     _loadProfile(),
    //     _loadAttendanceHistory(),
    //     _loadWorkSchedules(),
    //   ]);

    //   if (mounted) {
    //     setState(() {
    //       isLoading = false;
    //     });
    //   }
    // } catch (e) {
    //   print("Error initializing data: $e");
    //   if (mounted) {
    //     setState(() {
    //       isLoading = false;
    //     });
    //   }
    // }
  }

  // CATATAN PERBAIKAN: PADA BUTTON PRESENSI DINAS LUAR, KETIKA USER MEMILIKI DINAS LUAR YG DISETUJUI PADA JAM 00.00 BUTTON PRESENSI MASUK DINAS LUAR WARNA ABU-ABU ENABLE, HARUSNYA MASIH DISABLE KARNA KETIKA DILAKUKAN PRESENSI MASUK KIRIM FOTO WAJAH PESAN DARI BACKEND "TIDAK ADA JADWAL AKTIF UNTUK PRESENSI SAAT INI, ATAU JAM KERJA TELAH BERAKHIR!"
  // CATATAN: USER SHIFT MEMILIKI 2 SHIFT MISAL SESI PAGI DAN SESI SIANG, SESI SIANG DAN SESI MALAM, SESI MALAM DAN SESI PAGI ATAU DLL. KETIKA SESI PAGI SUDAH SELESAI DAN AKAN MELAKUKAN PRESENSI MASUK SESI SIANG BUTTON DSABLE "SELESAI", PADAHAL USER SHIFT BISA MEMILIKI SHIFT LEBIH DARI 1 BISA SAJA DALAM 1 HARI MEMILIKI 2 SHIFT ATAU 3 SHIFT

  // BISA PRESENSI PULANG TAPI BUTTON JADINYA DISABLE REKAM HADIR BUKAN SELESAI
  Map<String, dynamic>? _getActiveShift() {
    final now = DateTime.now();
    final todayStr = DateFormat('yyyy-MM-dd').format(now);
    final yesterdayStr =
        DateFormat('yyyy-MM-dd').format(now.subtract(const Duration(days: 1)));
    List<Map<String, dynamic>> schedules = [];

    if (employmentType == "Shift" && workShiftData != null) {
      schedules = workShiftData!
          .where((s) => s['date'] == todayStr || s['date'] == yesterdayStr)
          .toList();
    } else {
      // Logika Non-Shift: Selalu ada jadwal 07:00 - 15:00 untuk kemarin dan hari ini
      schedules = [
        {'date': yesterdayStr, 'time': '07:00 - 15:00'},
        {'date': todayStr, 'time': '07:00 - 15:00'},
      ];
    }

    // // PRIORITAS 1: Jika sudah Check-In tapi belum Check-Out (Gunakan tanggal saat Check-In)
    // if (hasCheckedIn && !hasCheckedOut && activeAttendanceDate != null) {
    //   final s = schedules
    //       .firstWhereOrNull((sh) => sh['date'] == activeAttendanceDate);
    //   if (s != null) {
    //     DateTime start = _parseDateTime(s['date'], s['time'].split(' - ')[0]);
    //     DateTime end = _parseDateTime(s['date'], s['time'].split(' - ')[1]);
    //     if (end.isBefore(start)) end = end.add(const Duration(days: 1));
    //     // Sesuai Backend: Toleransi pulang adalah 14 jam setelah shift berakhir
    //     DateTime maxCheckOut = end.add(const Duration(hours: 14));
    //     if (now.isBefore(maxCheckOut)) {
    //       return {...s, 'start': start, 'end': end, 'maxCheckOut': maxCheckOut};
    //     }
    //   }
    // }

    // --- PERBAIKAN BUG DOSEN PEMBIMBING MULAI DARI SINI ---
    // PRIORITAS 1: Jika sudah Check-In tapi belum Check-Out
    if (hasCheckedIn && !hasCheckedOut) {
      // Cari data presensi yang statusnya masih gantung (belum checkout)
      final activeAtt = rawAttendances.firstWhereOrNull(
          (att) => att['checkInTime'] != null && att['checkOutTime'] == null);

      if (activeAtt != null) {
        String dateStr = activeAtt['date'];
        // Ambil jam masuk dan pulang langsung dari relasi workShift data presensi tersebut
        String startStr = activeAtt['workShift']?['startTime'] ?? "07:00:00";
        String endStr = activeAtt['workShift']?['endTime'] ?? "15:00:00";

        DateTime start = _parseDateTime(dateStr, startStr);
        DateTime end = _parseDateTime(dateStr, endStr);

        // Jika shift melintasi hari (misal shift malam 23:00 - 07:00)
        if (end.isBefore(start)) end = end.add(const Duration(days: 1));

        // Sesuai Backend: Toleransi pulang adalah 14 jam setelah shift berakhir
        DateTime maxCheckOut = end.add(const Duration(hours: 14));

        if (now.isBefore(maxCheckOut)) {
          return {
            'date': dateStr,
            'time': '$startStr - $endStr',
            'start': start,
            'end': end,
            'maxCheckOut': maxCheckOut,
            'id': activeAtt['workShift']?['id']
          };
        }
      }
    }

    // --- PERBAIKAN BERAKHIR DI SINI ---
    // PRIORITAS 2: Logika mencari shift yang belum dilakukan (Biarkan seperti aslinya)
    for (var s in schedules) {
      DateTime start = _parseDateTime(s['date'], s['time'].split(' - ')[0]);
      DateTime end = _parseDateTime(s['date'], s['time'].split(' - ')[1]);
      if (end.isBefore(start)) end = end.add(const Duration(days: 1));
      DateTime minCheckIn = start.subtract(const Duration(hours: 1));

      // Cek apakah shift ini sudah pernah dilakukan (sudah ada di history hari ini)
      bool isAlreadyDone = rawAttendances.any((att) {
        if (employmentType == 'Shift') {
          return att['shiftAssignment']?['id'] == s['id'] &&
              att['checkOutTime'] != null;
        } else {
          return att['date'] == s['date'] && att['checkOutTime'] != null;
        }
      });

      // JIKA BELUM SELESAI, dan sekarang masuk dalam range waktu absen
      if (!isAlreadyDone && now.isAfter(minCheckIn) && now.isBefore(end)) {
        return {
          ...s,
          'start': start,
          'end': end,
          'maxCheckOut': end.add(const Duration(hours: 14))
        };
      }
    }
    return null;
  }

  bool get isButtonDisabled {
    if (userStatus == "Nonaktif" ||
        userStatus == "Cuti" ||
        userStatus == "Izin") return true;
    if (hasCheckedIn && hasCheckedOut) return true;
    final now = DateTime.now();

    // Aturan Libur Akhir Pekan Karyawan Non-Shift (Hanya blokir Check-In)
    if (employmentType != "Shift" && !hasCheckedIn) {
      if (now.weekday == DateTime.saturday || now.weekday == DateTime.sunday)
        return true;
    }

    final shift = _getActiveShift();
    if (shift == null) return true; // Di luar jadwal aktif

    DateTime start = shift['start'];
    DateTime end = shift['end'];
    DateTime maxCheckOut = shift['maxCheckOut'];

    if (hasCheckedIn && !hasCheckedOut) {
      // Validasi proses Check-Out
      // Sesuai validasi backend: "Belum waktunya pulang! Tunggu hingga jam kerja berakhir."
      if (now.isBefore(end))
        return true; // Tombol mati sampai jam shift selesai
      if (now.isAfter(maxCheckOut))
        return true; // Kedaluwarsa (> 14 jam lembur)
      return false;
    } else {
      // Validasi proses Check-In
      DateTime minCheckIn = start.subtract(const Duration(hours: 1));
      if (now.isBefore(minCheckIn) || now.isAfter(end)) return true;
      return false;
    }
  }

  bool get isAfterShiftPadding {
    final now = DateTime.now();
    DateTime shiftEnd;
    final todayStr = DateFormat('yyyy-MM-dd').format(now);

    // hitung shiftEnd persis seperti di isButtonDisabled
    if (workShiftData != null && workShiftData!.isNotEmpty) {
      final todayShift = workShiftData!.firstWhereOrNull(
        (s) => s['date'] == todayStr,
      );
      if (todayShift != null) {
        final e = (todayShift['time'] as String).split(' - ')[1].split(':');
        shiftEnd = DateTime(
            now.year, now.month, now.day, int.parse(e[0]), int.parse(e[1]));
        if (shiftEnd.isBefore(now))
          shiftEnd = shiftEnd.add(const Duration(days: 1));
      } else {
        return false;
      }
    } else {
      return false;
    }

    return now.isAfter(shiftEnd) && hasCheckedIn && hasCheckedOut;
  }

  String _getButtonText() {
    if (userStatus == "Nonaktif") return "AKUN NONAKTIF";
    if (isOnLeave) return "ANDA SEDANG CUTI/IZIN";
    if (hasCheckedIn && hasCheckedOut) return "SELESAI";
    if (!hasCheckedIn) {
      return isDinasLuar ? "REKAM HADIR DINAS LUAR" : "REKAM HADIR";
    } else {
      return isDinasLuar ? "REKAM PULANG DINAS LUAR" : "REKAM PULANG";
    }
  }

  // String get buttonText {
  //   if (userStatus == "Nonaktif") return "Akun Nonaktif";
  //   if (userStatus == "Cuti" || userStatus == "Izin")
  //     return "Sedang Cuti / Izin";
  //   if (hasCheckedIn && hasCheckedOut) return "Presensi Selesai";
  //   final now = DateTime.now();
  //   // Teks khusus untuk Non-Shift di hari Sabtu/Minggu
  //   if (employmentType != "Shift" && !hasCheckedIn) {
  //     if (now.weekday == DateTime.saturday || now.weekday == DateTime.sunday)
  //       return "Hari Libur";
  //   }
  //   final shift = _getActiveShift();
  //   if (shift == null) {
  //     if (hasCheckedIn && !hasCheckedOut) return "Batas Absen Habis";
  //     return "Di Luar Jadwal";
  //   }
  //   DateTime start = shift['start'];
  //   DateTime end = shift['end'];
  //   DateTime maxCheckOut = shift['maxCheckOut'];
  //   if (hasCheckedIn && !hasCheckedOut) {
  //     if (now.isBefore(end)) return "Menunggu Jam Pulang";
  //     if (now.isAfter(maxCheckOut)) return "Batas Waktu Habis";
  //     return isDinasLuar ? "Pulang Dinas Luar" : "Rekam Pulang";
  //   } else {
  //     DateTime minCheckIn = start.subtract(const Duration(hours: 1));
  //     if (now.isBefore(minCheckIn)) return "Belum Waktunya";
  //     if (now.isAfter(end)) return "Terlambat / Jadwal Lewat";
  //     return isDinasLuar ? "Hadir Dinas Luar" : "Rekam Hadir";
  //   }
  // }

  String formatTimeToDisplay(String? timeStr) {
    if (timeStr == null || timeStr == '--:--' || timeStr.isEmpty)
      return "--:--";
    try {
      DateTime dateTime = DateTime.parse(timeStr).toLocal();
      return DateFormat('HH:mm').format(dateTime);
    } catch (e) {
      return timeStr;
    }
  }

  final int currentMonth = DateTime.now().month;
  final int currentYear = DateTime.now().year;
  int get totalPresent => attendanceHistory
      .where((e) =>
          ['hadir', 'dinas luar', 'terlambat']
              .contains(e.status.toLowerCase()) &&
          e.date.month == currentMonth &&
          e.date.year == currentYear)
      .length;
  int get totalAbsent => attendanceHistory
      .where((e) =>
          e.status.toLowerCase() == 'tidak hadir' &&
          e.date.month == currentMonth &&
          e.date.year == currentYear)
      .length;
  int get totalLate => attendanceHistory
      .where((e) =>
          e.status.toLowerCase() == 'terlambat' &&
          e.date.month == currentMonth &&
          e.date.year == currentYear)
      .length;
  int get totalSickOrPermission => attendanceHistory
      .where((e) =>
          (e.status.toLowerCase() == 'izin') &&
          e.date.month == currentMonth &&
          e.date.year == currentYear)
      .length;

  // void _loadProfile() async {
  Future<void> _loadProfile() async {
    try {
      final data = await authService.getProfile();
      if (!mounted) return;
      final userData = data?['data'] ?? data ?? {};
      print("Response profile: $data");
      print("User Data: $userData");

      setState(() {
        // String? rawUrl = userData['avatarUrl'];
        // // if (rawUrl != null && rawUrl.contains('localhost')) {
        // //   rawUrl = rawUrl.replaceAll('localhost', '10.0.2.2');
        // // }
        // // const String BASE_URL = "http://192.168.1.10:3000";
        // // if (rawUrl != null && rawUrl.contains('localhost')) {
        // //   rawUrl = rawUrl.replaceAll(
        // //       'localhost', BASE_URL.replaceAll('http://', ''));
        // // }

        // //manual
        // if (rawUrl != null && rawUrl.contains('localhost')) {
        //   String host;

        //   if (Platform.isAndroid) {
        //     // Cek emulator vs real device
        //     host = "10.0.2.2"; // default emulator
        //   } else {
        //     host = "localhost";
        //   }

        //   // Override kalau device asli (bukan emulator)
        //   if (Platform.isAndroid &&
        //       !const bool.fromEnvironment('dart.vm.product')) {
        //     // optional tweak kalau mau manual
        //   }

        //   // Cara aman: pakai IP untuk real device
        //   if (!Platform.isAndroid) {
        //     host = "192.168.1.10";
        //   }

        //   rawUrl = rawUrl.replaceAll('localhost', host);
        // }
        // profilePhotoUrl = rawUrl;
        String? rawUrl = userData['avatarUrl'];
        profilePhotoUrl = ProfileHelper.fixImageUrl(rawUrl);

        final nameParts = <String>[];
        final titlePrefix = userData['titlePrefix'] as String?;
        final fullName = userData['fullName'] as String?;

        if (titlePrefix?.isNotEmpty == true) {
          nameParts.add(titlePrefix!);
        }
        if (fullName?.isNotEmpty == true) {
          String firstName = fullName!.trim().split(' ')[0];
          nameParts.add(firstName);
        }

        String combinedName = nameParts.join(' ');
        userName = (combinedName.isNotEmpty) ? combinedName : "Pengguna";
        userEmail = userData['email'] ?? "-";
        // isLoading = false;
      });
    } catch (e) {
      print("Error loading profile: $e");
      // if (!mounted) return;
      // setState(() {
      //   userName = "Pengguna";
      //   userEmail = "-";
      // isLoading = false;
      // });
    }
  }

  Future<void> _loadAttendanceHistory() async {
    try {
      final attendanceList = await authService.getMyAttendances();
      rawAttendances = attendanceList;
      final now = DateTime.now();
      // Ambil data hari ini dan kemarin untuk dicek lintas hari
      final todayStr = DateFormat('yyyy-MM-dd').format(now);
      final yesterdayStr = DateFormat('yyyy-MM-dd')
          .format(now.subtract(const Duration(days: 1)));
      final List<AttendanceRecord> mappedHistory =
          attendanceList.map<AttendanceRecord>((att) {
        return AttendanceRecord(
          date: DateTime.parse(att['date']),
          checkInTime: att['checkInTime'] ?? '--:--',
          checkOutTime: att['checkOutTime'] ?? '--:--',
          status: att['attendanceStatus'] ?? '-',
        );
      }).toList()
            ..sort((a, b) => b.date.compareTo(a.date));

      // CARI ATTENDANCE YANG AKTIF (Sudah Check-In tapi belum Check-Out)
      // Cek di data hari ini atau kemarin
      var currentActive = attendanceList.firstWhereOrNull((att) {
        bool isRecent = att['date'] == todayStr || att['date'] == yesterdayStr;
        bool isPending =
            att['checkInTime'] != null && att['checkOutTime'] == null;

        if (isRecent && isPending) {
          // Cek apakah masih dalam batas 14 jam dari jam pulang (15:00 untuk non-shift)
          String endTimeStr = att['workShift']?['endTime'] ?? "15:00:00";
          DateTime shiftEnd = _parseDateTime(att['date'], endTimeStr);
          if (shiftEnd.isBefore(_parseDateTime(
              att['date'], att['workShift']?['startTime'] ?? "07:00:00"))) {
            shiftEnd = shiftEnd.add(const Duration(days: 1));
          }
          return now.isBefore(shiftEnd.add(const Duration(hours: 14)));
        }
        return false;
      });
      if (!mounted) return;

      // Variabel sementara untuk menampung status dinas luar dari riwayat
      bool isCurrentlyOutside = false;

      setState(() {
        attendanceHistory = mappedHistory;
        if (currentActive != null) {
          checkInTime = formatTimeToDisplay(currentActive['checkInTime']);
          checkOutTime = null;
          activeAttendanceDate = currentActive['date'];
          hasCheckedIn = true;
          hasCheckedOut = false;
          // PERBAIKAN BUG 2 FRONTEND: Kunci status Dinas Luar dari backend (bukan tebak tanggal)
          // isDinasLuar = currentActive['attendanceType'] == 'OUTSIDE';

          // // SOURCE OF TRUTH: Ambil dari tipe presensi aktif
          // isCurrentlyOutside = (currentActive['attendanceType'] == 'OUTSIDE');
          // isDinasLuar = isCurrentlyOutside;

          // SOURCE OF TRUTH: Cek langsung dari kondisi/status presensinya
          // Kita ubah ke lowercase agar aman dari perbedaan huruf besar/kecil dari Backend
          String statusPresensi =
              currentActive['attendanceStatus']?.toString().toLowerCase() ?? '';

          // Jika statusnya mengandung kata 'dinas luar', maka true
          isCurrentlyOutside = statusPresensi.contains('dinas luar');
          isDinasLuar = isCurrentlyOutside;
        } else {
          // KONDISI 2: TIDAK ADA SHIFT GANTUNG (SIAP UNTUK SHIFT BARU/KOSONG)
          // Kosongkan status agar siap menerima shift berikutnya (Menyelesaikan BUG 3)
          checkInTime = null;
          checkOutTime = null;
          hasCheckedIn = false;
          hasCheckedOut = false;
          // Kita kembalikan pengecekan Dinas Luar normal berdasar tabel Cuti
          _checkDinasLuarStatus();
        }
        // isLoading = false;
      });

      // Panggil fungsi async DI LUAR setState, dan HANYA jika belum check-in
      // Jika sudah check-in, kita tidak butuh ngecek pengajuan cuti lagi.
      if (currentActive == null) {
        await _checkDinasLuarStatus();
      } else {
        print(
            "🏢 Status Dinas Luar (Berdasarkan API History): $isCurrentlyOutside");
      }

      print("CHECK IN TIME: $checkInTime");
      print("CHECK OUT TIME: $checkOutTime");
      print("HAS CHECKED IN: $hasCheckedIn");
      print("HAS CHECKED OUT: $hasCheckedOut");
    } catch (e) {
      print("Error load history: $e");
      // if (!mounted) return;
      // setState(() => isLoading = false);
    }
  }

  Future<void> _checkDinasLuarStatus() async {
    try {
      // Karena getMyLeaveRequests() mengembalikan Future<List<dynamic>>
      // Kita langsung tampung ke dalam List.
      final List<dynamic> requests = await authService.getMyLeaveRequests();
      final now = DateTime.now();
      // Gunakan DateTime tanpa jam untuk perbandingan presisi tanggal
      final today = DateTime(now.year, now.month, now.day);
      final todayRequest = requests.firstWhereOrNull((req) {
        // 1. Ambil Tanggal dari JSON
        final startDateStr = req['startDate'];
        final endDateStr = req['endDate'];
        // 2. Ambil Status (Key: finalStatus sesuai JSON API Anda)
        final status = req['status']?.toString().toLowerCase();
        // 3. Ambil Leave Type (Key: leavetype sesuai JSON API Anda)
        final leaveTypeData = req['leavetype'];
        final String leaveTypeName = leaveTypeData != null
            ? leaveTypeData['name']?.toString().toUpperCase() ?? ""
            : "";

        bool isWithinRange = false;
        if (startDateStr != null && endDateStr != null) {
          final start = DateTime.parse(startDateStr);
          final end = DateTime.parse(endDateStr);

          // Normalisasi ke jam 00:00 agar perbandingan akurat
          final startDateOnly = DateTime(start.year, start.month, start.day);
          final endDateOnly = DateTime(end.year, end.month, end.day);

          // Cek apakah hari ini berada di antara start dan end (inclusive)
          isWithinRange = (today.isAtSameMomentAs(startDateOnly) ||
                  today.isAfter(startDateOnly)) &&
              (today.isAtSameMomentAs(endDateOnly) ||
                  today.isBefore(endDateOnly));
        }

        // 4. Validasi 3 Syarat Utama: Rentang Tanggal, Nama Tipe, dan Status Approved
        return isWithinRange &&
            leaveTypeName == 'DINAS LUAR' &&
            status == 'approved';
      });
      if (!mounted) return;
      setState(() {
        isDinasLuar = todayRequest != null;
      });
      print("🏢 Status Dinas Luar: $isDinasLuar");
    } catch (e) {
      print("❌ Error pada _checkDinasLuarStatus: $e");
      if (!mounted) return;
      setState(() {
        isDinasLuar = false;
      });
    }
  }

  Future<void> _loadUserStatus() async {
    final status = await authService.storage.read(key: "status");
    setState(() {
      userStatus = status;
    });
  }

  Future<void> _loadWorkSchedules() async {
    try {
      final profileData = await authService.getProfile();
      if (profileData == null) return;
      employmentType = profileData['data']['employmentType'] ?? "Non-Shift";
      final shiftAssignments = profileData['data']['shiftAssignments'];
      final mappedShifts = (shiftAssignments as List?)?.map((s) {
        final workShift = s['workShift'];
        final startTime = workShift?['startTime'] ?? '--:--';
        final endTime = workShift?['endTime'] ?? '--:--';
        final name = workShift?['name'] ?? '-';
        return {
          'id': workShift?['id'],
          'name': name,
          'time': '$startTime - $endTime',
          'date': s['date'] ?? ''
        };
      }).toList();

      // Untuk Non-Shift User, set default shift harian (Senin-Jumat)
      List<Map<String, dynamic>> defaultShifts = [];
      if (employmentType != "Shift") {
        final now = DateTime.now();
        final dayOfWeek = now.weekday; // 1=Monday, 7=Sunday
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          // Senin-Jumat
          final todayStr = DateFormat('yyyy-MM-dd').format(now);
          defaultShifts = [
            {
              'time': '07:00 - 15:00',
              'date': todayStr,
            }
          ];
        }
      }
      if (!mounted) return;

      setState(() {
        workShiftData =
            employmentType == "Shift" ? mappedShifts : defaultShifts;
        workShift = profileData['data']['workShift'];
      });
      print("Mapped workSchedules: $workShiftData");
      print("Default workShift: $workShift");
    } catch (e) {
      print("Error loading work schedules: $e");
    }
  }

  Color get checkInIconColor {
    if (isButtonDisabled) return Colors.grey;
    if (!hasCheckedIn) {
      return Colors.green;
    }
    return Colors.grey;
  }

  Color get checkOutIconColor {
    if (isButtonDisabled) return Colors.grey;
    if (hasCheckedIn && !hasCheckedOut) {
      return Colors.orange;
    }
    return Colors.grey;
  }

  @override
  Widget _buildHomePageContent() {
    final now = DateTime.now();
    String formattedDate;
    try {
      formattedDate = DateFormat('EEEE, dd MMMM yyyy', 'id_ID').format(now);
    } catch (e) {
      formattedDate = DateFormat('EEEE, dd MMMM yyyy').format(now);
    }
    final formattedTime = DateFormat('HH:mm').format(now);

    ImageProvider profileImage;
    if (profilePhotoUrl != null && profilePhotoUrl!.isNotEmpty) {
      profileImage = NetworkImage(Uri.encodeFull(profilePhotoUrl!));
    } else {
      profileImage = const AssetImage('assets/default_profile.png');
    }
    // final fixedUrl = ProfileHelper.fixImageUrl(profilePhotoUrl);
    // if (fixedUrl.isNotEmpty) {
    //   profileImage = NetworkImage(fixedUrl);
    // } else {
    //   profileImage = const AssetImage('assets/default_profile.png');
    // }
    return SingleChildScrollView(
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF6F34FA), Color(0xFF8E5CFC)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.vertical(
                bottom: Radius.circular(20),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Halo, $userName',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        userEmail,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white24, width: 2)),
                  child: CircleAvatar(
                    radius: 30,
                    backgroundColor: Colors.white24,
                    backgroundImage: profileImage,
                    onBackgroundImageError: (exception, StackTrace) {
                      debugPrint("Gagal memuat foto profil: $exception");
                    },
                  ),
                )
              ],
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          formattedDate,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                        Text(
                          formattedTime,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Menampilkan jam masuk dan jam pulang dari state
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        Column(
                          children: [
                            // Icon(Icons.login,
                            //     color:
                            //         hasCheckedIn ? Colors.green : Colors.grey,
                            //     size: 24),
                            Icon(
                              Icons.login,
                              color: checkInIconColor,
                              size: 24,
                            ),
                            SizedBox(height: 4),
                            Text("Masuk",
                                style: TextStyle(color: Colors.black54)),
                            Text(
                              checkInTime ?? "--:--",
                              style: TextStyle(
                                  fontSize: 20, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        Container(
                          width: 1,
                          height: 40,
                          color: Colors.grey.shade300,
                        ),
                        Column(
                          children: [
                            // Icon(Icons.logout,
                            //     color: hasCheckedOut
                            //         ? Colors.red
                            //         : (hasCheckedIn
                            //             ? Colors.orange
                            //             : Colors.grey),
                            //     size: 24),
                            Icon(
                              Icons.logout,
                              color: checkOutIconColor,
                              size: 24,
                            ),
                            SizedBox(height: 4),
                            Text("Keluar",
                                style: TextStyle(color: Colors.black54)),
                            Text(
                              checkOutTime ?? "--:--",
                              style: TextStyle(
                                  fontSize: 20, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: isButtonDisabled && !isDinasLuar
                          ? null
                          : () async {
                              if (userStatus == "Nonaktif") {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                        "Akun Anda tidak aktif. Hubungi tim IT."),
                                    backgroundColor: Colors.red,
                                    behavior: SnackBarBehavior.floating,
                                  ),
                                );
                                return;
                              } else if (userStatus == "Cuti") {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                        "Akun Anda sedang cuti, presensi tidak dapat dilakukan"),
                                    backgroundColor: Colors.orange,
                                    behavior: SnackBarBehavior.floating,
                                  ),
                                );
                                return;
                              } else if (hasCheckedIn && hasCheckedOut) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                        "Anda sudah menyelesaikan presensi hari ini!"),
                                    backgroundColor: Colors.purple,
                                    behavior: SnackBarBehavior.floating,
                                  ),
                                );
                                return;
                              }
                              dynamic result;
                              if (isDinasLuar) {
                                print(
                                    "Navigasi ke Verifikasi Wajah (Dinas Luar)");
                                result = await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (context) =>
                                          FaceVerificationPage(
                                              isCheckIn: !hasCheckedIn)),
                                );
                              } else {
                                print("Navigasi ke QR Scanner (Dalam RS)");
                                result = await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (context) => QrScannerPage(
                                          isCheckIn: !hasCheckedIn)),
                                );
                              }
                              if (result != null && result['success'] == true) {
                                print("Hasil scan: $result");
                                print("Presensi Berhasil: $result");
                                ScaffoldMessenger.of(context)
                                    .showSnackBar(SnackBar(
                                  content: Text(
                                      "QR Code berhasil dipindai pada beranda (FLUTTER): $result"),
                                  duration: const Duration(seconds: 2),
                                  behavior: SnackBarBehavior.floating,
                                ));
                                if (!hasCheckedIn) {
                                  print("Melakukan presensi MASUK...");
                                } else {
                                  print("Melakukan presensi PULANG...");
                                }
                                await _loadAttendanceHistory();
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isButtonDisabled
                            ? Colors.grey
                            : (isDinasLuar
                                ? Colors.orange.shade700
                                : (!hasCheckedIn
                                    ? Colors.deepPurple
                                    // : (!hasCheckedOut
                                    // ? Color(0XFFAE75DA)
                                    // : Colors.grey))),
                                    : const Color(0XFFAE75DA))),
                        minimumSize: const Size(double.infinity, 45),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      // CATATAN: KETIKA USER TIDAK MELAKUKAN PRESENSI DAN SUDAH MELEWATI JAM KERJA/SHIFTNYA MAKA TOMBOL PRESENSI DISABLE KARNA MENANDAKAN PRESENSI HARI INI SUDAH SELESAI WALAUPUN STATUSNYA TIDAK MELAKUKAN ATAU HADIR
                      child: Text(
                        _getButtonText(),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    if (isButtonDisabled && isAfterShiftPadding)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          "Presensi Anda telah berakhir, jam kerja pukul ${workShiftData}",
                          style:
                              const TextStyle(color: Colors.grey, fontSize: 12),
                          textAlign: TextAlign.center,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16), // tadinya 20
            // child: Column(
            //   crossAxisAlignment: CrossAxisAlignment.start,
            //   children: [
            //     const Text(
            //       "Rekap Kehadiran Anda",
            //       style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            //     ),
            //     const SizedBox(height: 4),
            //     const Text(
            //       "Bulan Ini",
            //       style: TextStyle(color: Colors.grey),
            //     ),
            //     const SizedBox(height: 12),
            //     Row(
            //       mainAxisAlignment: MainAxisAlignment.spaceBetween,
            //       children: [
            //         _buildStatCard(
            //             "Hadir", totalPresent.toString(), Icons.person),
            //         _buildStatCard(
            //             "Terlambat", totalLate.toString(), Icons.timer),
            //         _buildStatCard(
            //             "Tidak Hadir", totalAbsent.toString(), Icons.close),
            //         _buildStatCard("Izin", totalSickOrPermission.toString(),
            //             Icons.medical_services),
            //       ],
            //     ),
            //   ],
            // ),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(
                  16), // Padding dalam kontainer untuk memberi ruang teks & item statistik
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Rekap Kehadiran Anda",
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    "Bulan Ini",
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(
                      height:
                          16), // Jarak disesuaikan agar lebih proporsional di dalam card
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildStatCard(
                          "Hadir", totalPresent.toString(), Icons.person),
                      _buildStatCard(
                          "Terlambat", totalLate.toString(), Icons.timer),
                      _buildStatCard(
                          "Tidak Hadir", totalAbsent.toString(), Icons.close),
                      _buildStatCard("Izin", totalSickOrPermission.toString(),
                          Icons.medical_services),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Padding(
          //   padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          //   child: Row(
          //     mainAxisAlignment: MainAxisAlignment.spaceBetween,
          //     children: [
          //       const Text(
          //         "Riwayat Presensi",
          //         style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          //       ),
          //       GestureDetector(
          //         onTap: () {
          //           // mainNavKey.currentState?.setSelectedIndex(2);
          //           MainNavigation.navKey.currentState?.setSelectedIndex(2);
          //         },
          //         child: const Text(
          //           "Lihat Semua",
          //           style: TextStyle(
          //             color: Color(0xFF6F34FA),
          //             fontWeight: FontWeight.w600,
          //           ),
          //         ),
          //       ),
          //     ],
          //   ),
          // ),
          // // Riwayat Presensi List
          // Padding(
          //   padding: const EdgeInsets.symmetric(horizontal: 20),
          //   child: AttendanceHistoryList(history: attendanceHistory),
          // ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          "Riwayat Presensi",
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        GestureDetector(
                          onTap: () {
                            MainNavigation.navKey.currentState
                                ?.setSelectedIndex(2);
                          },
                          child: const Text(
                            "Lihat Semua",
                            style: TextStyle(
                              color: Color(0xFF6F34FA),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  ClipRRect(
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(16),
                      bottomRight: Radius.circular(16),
                    ),
                    child: AttendanceHistoryList(history: attendanceHistory),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
        ],
      ),
    );
  }

  // @override
  // Widget build(BuildContext context) {
  //   if (isLoading) {
  //     return const Center(child: CircularProgressIndicator());
  //   }
  //   return _buildHomePageContent();
  // }

  @override
  Widget build(BuildContext context) {
    return isLoading ? _buildSkeleton() : _buildHomePageContent();
  }

  Widget _buildStatCard(String title, String value, IconData icon) {
    return Column(
      children: [
        CircleAvatar(
          radius: 20,
          backgroundColor: Colors.purple.shade100,
          child: Icon(icon, color: Colors.purple),
        ),
        const SizedBox(height: 6),
        Text(value,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        Text(title,
            style: const TextStyle(color: Colors.black54, fontSize: 12)),
      ],
    );
  }

  // // Card jam kerja
  // Widget _buildWorkCard(String time, String day) {
  //   return Container(
  //     padding: const EdgeInsets.all(12),
  //     decoration: BoxDecoration(
  //       color: Colors.purple.shade50,
  //       borderRadius: BorderRadius.circular(10),
  //     ),
  //     child: Column(
  //       children: [
  //         const Icon(Icons.work, color: Colors.purple),
  //         const SizedBox(height: 6),
  //         Text(
  //           time,
  //           style: const TextStyle(
  //               fontSize: 14,
  //               fontWeight: FontWeight.bold,
  //               color: Colors.black87),
  //         ),
  //         const SizedBox(height: 4),
  //         Text(day, style: const TextStyle(color: Colors.grey, fontSize: 12)),
  //       ],
  //     ),
  //   );
  // }

  // --- Widget Skeloten ---
  // Widget _skeletonBox({
  //   double width = double.infinity,
  //   double height = 16,
  //   double radius = 8,
  // }) {
  //   return Container(
  //     width: width,
  //     height: height,
  //     decoration: BoxDecoration(
  //       color: Colors.grey.shade300,
  //       borderRadius: BorderRadius.circular(radius),
  //     ),
  //   );
  // }

  // Widget _buildSkeleton() {
  //   Widget skeleton(
  //       {double width = double.infinity,
  //       double height = 16,
  //       double radius = 8}) {
  //     return Container(
  //       width: width,
  //       height: height,
  //       decoration: BoxDecoration(
  //           color: Colors.grey.shade300,
  //           borderRadius: BorderRadius.circular(radius)),
  //     );
  //   }

  //   return SingleChildScrollView(
  //     child: Column(
  //       children: [
  //         Container(
  //           width: double.infinity,
  //           padding: const EdgeInsets.all(20),
  //           decoration: const BoxDecoration(
  //             gradient: LinearGradient(
  //               colors: [Color(0xFF6F34FA), Color(0xFF8E5CFC)],
  //             ),
  //             borderRadius: BorderRadius.vertical(
  //               bottom: Radius.circular(20),
  //             ),
  //           ),
  //           child: Row(
  //             crossAxisAlignment: CrossAxisAlignment.center,
  //             children: [
  //               Expanded(
  //                 child: Column(
  //                   crossAxisAlignment: CrossAxisAlignment.start,
  //                   // children: [
  //                   //   _skeletonBox(width: 120, height: 16),
  //                   //   const SizedBox(height: 8),
  //                   //   _skeletonBox(width: 180, height: 14),
  //                   // ],
  //                   children: [
  //                     skeleton(width: 140, height: 20),
  //                     const SizedBox(height: 6),
  //                     skeleton(width: 180, height: 14),
  //                   ],
  //                 ),
  //               ),
  //               const CircleAvatar(
  //                 radius: 30,
  //                 backgroundColor: Colors.white24,
  //               ),
  //             ],
  //           ),
  //         ),
  //         const SizedBox(height: 16),
  //         Padding(
  //           padding: const EdgeInsets.symmetric(horizontal: 20),
  //           child: Card(
  //             shape: RoundedRectangleBorder(
  //               borderRadius: BorderRadius.circular(16),
  //             ),
  //             child: Padding(
  //               padding: const EdgeInsets.all(16),
  //               // child: Column(
  //               //   children: [
  //               //     _skeletonBox(width: double.infinity, height: 14),
  //               //     const SizedBox(height: 16),
  //               //     Row(
  //               //       mainAxisAlignment: MainAxisAlignment.spaceAround,
  //               //       children: [
  //               //         _skeletonBox(width: 60, height: 40),
  //               //         _skeletonBox(width: 1, height: 40),
  //               //         _skeletonBox(width: 60, height: 40),
  //               //       ],
  //               //     ),
  //               //     const SizedBox(height: 16),
  //               //     _skeletonBox(height: 45, radius: 10),
  //               //   ],
  //               // ),
  //               child: Column(
  //                 crossAxisAlignment: CrossAxisAlignment.start,
  //                 children: [
  //                   Row(
  //                     mainAxisAlignment: MainAxisAlignment.spaceBetween,
  //                     children: [
  //                       skeleton(width: 100, height: 14),
  //                       skeleton(width: 50, height: 14)
  //                     ],
  //                   ),
  //                   const SizedBox(height: 16),
  //                   Row(
  //                     mainAxisAlignment: MainAxisAlignment.spaceAround,
  //                     children: [
  //                       skeleton(width: 70, height: 50),
  //                       Container(
  //                           width: 1, height: 40, color: Colors.grey.shade300),
  //                       skeleton(width: 70, height: 50),
  //                     ],
  //                   ),
  //                   const SizedBox(height: 16),
  //                   skeleton(width: double.infinity, height: 45, radius: 10),
  //                 ],
  //               ),
  //             ),
  //           ),
  //         ),
  //         const SizedBox(height: 16),
  //         Padding(
  //           padding: const EdgeInsets.symmetric(horizontal: 20),
  //           child: Column(
  //             crossAxisAlignment: CrossAxisAlignment.start,
  //             children: [
  //               skeleton(
  //                   width: 160, height: 18), // Pengganti "Rekap Kehadiran Anda"
  //               const SizedBox(height: 6),
  //               skeleton(width: 80, height: 12), // Pengganti "Bulan ini"
  //             ],
  //           ),
  //         ),
  //         const SizedBox(height: 16),
  //         Padding(
  //           padding: const EdgeInsets.symmetric(horizontal: 20),
  //           child: Row(
  //             mainAxisAlignment: MainAxisAlignment.spaceBetween,
  //             children: List.generate(
  //               4,
  //               (_) => Column(
  //                 // children: [
  //                 //   const CircleAvatar(
  //                 //       radius: 20, backgroundColor: Colors.grey),
  //                 //   const SizedBox(height: 6),
  //                 //   _skeletonBox(width: 20),
  //                 //   const SizedBox(height: 4),
  //                 //   _skeletonBox(width: 40),
  //                 // ],
  //                 children: [
  //                   const CircleAvatar(
  //                       radius: 20, backgroundColor: Colors.grey),
  //                   const SizedBox(height: 8),
  //                   skeleton(width: 30, height: 16),
  //                   const SizedBox(height: 4),
  //                   skeleton(width: 50, height: 12),
  //                 ],
  //               ),
  //             ),
  //           ),
  //         ),
  //         const SizedBox(height: 16),
  //         // Padding(
  //         //   padding: const EdgeInsets.all(16),
  //         //   child: Column(
  //         //     children: List.generate(
  //         //       3,
  //         //       (_) => Padding(
  //         //         padding: const EdgeInsets.only(bottom: 12),
  //         //         child: _skeletonBox(height: 70, radius: 16),
  //         //       ),
  //         //     ),
  //         //   ),
  //         // ),
  //         Padding(
  //           padding: const EdgeInsets.symmetric(horizontal: 16),
  //           // child: Column(
  //           //   children: List.generate(
  //           //       3,
  //           //       (index) => Padding(
  //           //             padding: const EdgeInsets.only(bottom: 12),
  //           //             child: Container(
  //           //               padding: const EdgeInsets.all(12),
  //           //               decoration: BoxDecoration(
  //           //                   color: Colors.grey.shade200,
  //           //                   borderRadius: BorderRadius.circular(16)),
  //           //               child: Row(
  //           //                 children: [
  //           //                   Container(
  //           //                       width: 40,
  //           //                       height: 40,
  //           //                       decoration: BoxDecoration(
  //           //                           color: Colors.grey.shade300,
  //           //                           borderRadius: BorderRadius.circular(8))),
  //           //                   const SizedBox(width: 16),
  //           //                   Expanded(
  //           //                     child: Column(
  //           //                       crossAxisAlignment: CrossAxisAlignment.start,
  //           //                       children: [
  //           //                         skeleton(width: 120),
  //           //                         const SizedBox(height: 8),
  //           //                         skeleton(width: 80)
  //           //                       ],
  //           //                     ),
  //           //                   ),
  //           //                   skeleton(width: 60, height: 24, radius: 15),
  //           //                 ],
  //           //               ),
  //           //             ),
  //           //           )),
  //           // ),
  //           child: Container(
  //             width: double.infinity,
  //             decoration: BoxDecoration(
  //               color: Colors.white,
  //               borderRadius: BorderRadius.circular(16),
  //               boxShadow: [
  //                 BoxShadow(
  //                   color: Colors.black.withOpacity(0.05),
  //                   blurRadius: 10,
  //                   offset: const Offset(0, 4),
  //                 ),
  //               ],
  //             ),
  //             child: Column(
  //               crossAxisAlignment: CrossAxisAlignment.start,
  //               children: [
  //                 Row(
  //                   mainAxisAlignment: MainAxisAlignment.spaceBetween,
  //                   children: [
  //                     skeleton(
  //                         width: 130,
  //                         height: 18), // Pengganti "Riwayat Presensi"
  //                     skeleton(
  //                         width: 70, height: 14), // Pengganti "Lihat Semua"
  //                   ],
  //                 ),
  //                 const SizedBox(height: 16),
  //                 Column(
  //                   children: List.generate(
  //                       3,
  //                       (index) => Padding(
  //                             // padding: const EdgeInsets.only(bottom: 12),
  //                             padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
  //                             child: Container(
  //                               padding: const EdgeInsets.all(12),
  //                               decoration: BoxDecoration(
  //                                   color: Colors.grey.shade200,
  //                                   borderRadius: BorderRadius.circular(16)),
  //                               child: Row(
  //                                 children: [
  //                                   Container(
  //                                       width: 40,
  //                                       height: 40,
  //                                       decoration: BoxDecoration(
  //                                           color: Colors.grey.shade300,
  //                                           borderRadius:
  //                                               BorderRadius.circular(8))),
  //                                   const SizedBox(width: 16),
  //                                   Expanded(
  //                                     child: Column(
  //                                       crossAxisAlignment:
  //                                           CrossAxisAlignment.start,
  //                                       children: [
  //                                         skeleton(width: 120),
  //                                         const SizedBox(height: 8),
  //                                         skeleton(width: 80)
  //                                       ],
  //                                     ),
  //                                   ),
  //                                   skeleton(width: 60, height: 24, radius: 15),
  //                                 ],
  //                               ),
  //                             ),
  //                           )),
  //                 )
  //               ],
  //             ),
  //           ),
  //         ),
  //       ],
  //     ),
  //   );
  // }

  Widget _buildSkeleton() {
    // Helper untuk membuat box skeleton dengan lebih bersih
    Widget skeleton(
        {double width = double.infinity,
        double height = 16,
        double radius = 8}) {
      return Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
            color: Colors.grey.shade300,
            borderRadius: BorderRadius.circular(radius)),
      );
    }

    return SingleChildScrollView(
      child: Column(
        children: [
          // 1. Header (Meniru AppBar/Profile Section)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                  colors: [Color(0xFF6F34FA), Color(0xFF8E5CFC)]),
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(20)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      skeleton(width: 140, height: 20),
                      const SizedBox(height: 8),
                      skeleton(width: 180, height: 14),
                    ],
                  ),
                ),
                const CircleAvatar(radius: 30, backgroundColor: Colors.white24),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 2. Card Kehadiran (Meniru Card waktu & tombol presensi)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Card(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        skeleton(width: 100, height: 14),
                        skeleton(width: 50, height: 14)
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        skeleton(width: 70, height: 50),
                        Container(
                            width: 1, height: 40, color: Colors.grey.shade300),
                        skeleton(width: 70, height: 50),
                      ],
                    ),
                    const SizedBox(height: 16),
                    skeleton(width: double.infinity, height: 45, radius: 10),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // 3. Stat Cards (Meniru _buildStatCard)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(
                  4,
                  (_) => Column(
                        children: [
                          const CircleAvatar(
                              radius: 20, backgroundColor: Colors.grey),
                          const SizedBox(height: 8),
                          skeleton(width: 30, height: 16),
                          const SizedBox(height: 4),
                          skeleton(width: 50, height: 12),
                        ],
                      )),
            ),
          ),
          const SizedBox(height: 16),
          // 4. Riwayat Presensi (Meniru AttendanceHistoryItem)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: List.generate(
                  3,
                  (index) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                              color: Colors.grey.shade200,
                              borderRadius: BorderRadius.circular(16)),
                          child: Row(
                            children: [
                              Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                      color: Colors.grey.shade300,
                                      borderRadius: BorderRadius.circular(8))),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    skeleton(width: 120),
                                    const SizedBox(height: 8),
                                    skeleton(width: 80)
                                  ],
                                ),
                              ),
                              skeleton(width: 60, height: 24, radius: 15),
                            ],
                          ),
                        ),
                      )),
            ),
          ),
        ],
      ),
    );
  }
}

class AttendanceHistoryList extends StatelessWidget {
  final List<AttendanceRecord> history;
  final int? month;
  final int? year;

  const AttendanceHistoryList({
    super.key,
    required this.history,
    this.month,
    this.year,
  });

  @override
  Widget build(BuildContext context) {
    final int filterMonth = month ?? DateTime.now().month;
    final int filterYear = year ?? DateTime.now().year;
    final filteredHistory = history
        .where((record) =>
            record.date.month == filterMonth && record.date.year == filterYear)
        .toList();
    // final limitedHistory = history.take(3).toList();
    final limitedHistory = filteredHistory.take(3).toList();
    return Column(
      children: limitedHistory
          .map((record) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AttendanceHistoryItem(record: record),
              ))
          .toList(),
    );
  }
}

class AttendanceHistoryItem extends StatelessWidget {
  final AttendanceRecord record;
  String _capitalizeEachWord(String text) {
    if (text.isEmpty) return text;
    return text
        .split(' ')
        .map((word) => word.isNotEmpty
            ? word[0].toUpperCase() + word.substring(1).toLowerCase()
            : '')
        .join(' ');
  }

  String _formatTimeDisplay(String timeStr) {
    if (timeStr == '--:--' || timeStr.isEmpty) return '--:--';
    try {
      if (timeStr.contains('T')) {
        DateTime dt = DateTime.parse(timeStr).toLocal();
        return DateFormat('HH:mm').format(dt);
      }
      return timeStr;
    } catch (e) {
      return timeStr;
    }
  }

  const AttendanceHistoryItem({super.key, required this.record});
  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'hadir':
        // return const Color(0xFF00BFA5); // Hijau untuk Hadir
        return Colors.green;
      case 'terlambat':
        // return const Color(0xFFFF9800); // Orange untuk
        return Colors.yellow;
      case 'tidak hadir':
        return Colors.red;
      case 'dinas luar':
        return Colors.blue;
      case 'izin':
        return Colors.purple;
      case 'cuti':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  Color _getBackgroundColor(String status) {
    switch (status.toLowerCase()) {
      case 'hadir':
        // return const Color(0xFFE0F7FA); // Light Cyan
        return Colors.green.shade100;
      case 'terlambat':
        // return const Color(0xFFFFECB3); // Light Yellow/Orange
        return Colors.yellow.shade100;
      case 'tidak hadir':
        return Colors.red.shade100;
      case 'dinas luar':
        return Colors.blue.shade100;
      case 'izin':
        return Colors.purple.shade100;
      case 'cuti':
        return Colors.orange.shade100;
      default:
        return Colors.grey.shade200;
    }
  }

  String _formatDate(DateTime date) {
    return DateFormat('EEEE, d MMMM', 'id_ID').format(date);
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(record.status);
    final bgColor = _getBackgroundColor(record.status);
    // return Container(
    //   padding: const EdgeInsets.all(12),
    //   decoration: BoxDecoration(
    //     color: Colors.grey[100],
    //     borderRadius: BorderRadius.circular(10),
    //     boxShadow: [
    //       BoxShadow(
    //         color: Colors.grey.withOpacity(0.1),
    //         spreadRadius: 1,
    //         blurRadius: 3,
    //         offset: const Offset(0, 1),
    //       ),
    //     ],
    //   ),
    //   child: Row(
    //     crossAxisAlignment: CrossAxisAlignment.center,
    //     children: [
    //       // Ikon Kalender
    //       Container(
    //         padding: const EdgeInsets.all(8),
    //         decoration: BoxDecoration(
    //           color: Colors.grey.shade200,
    //           borderRadius: BorderRadius.circular(8),
    //         ),
    //         child: const Icon(Icons.calendar_today,
    //             size: 20, color: Color(0xFF6F34FA)),
    //       ),
    //       const SizedBox(width: 16),
    //       // Informasi Tanggal dan Waktu
    //       Expanded(
    //         child: Column(
    //           crossAxisAlignment: CrossAxisAlignment.start,
    //           children: [
    //             Text(
    //               _formatDate(record.date),
    //               style: const TextStyle(
    //                 fontSize: 16,
    //                 fontWeight: FontWeight.bold,
    //                 color: Colors.black87,
    //               ),
    //             ),
    //             const SizedBox(height: 4),
    //             Text(
    //               // '${record.checkInTime} - ${record.checkOutTime}',
    //               '${_formatTimeDisplay(record.checkInTime)} - ${_formatTimeDisplay(record.checkOutTime)}',
    //               style: const TextStyle(
    //                 fontSize: 14,
    //                 color: Colors.grey,
    //               ),
    //             ),
    //           ],
    //         ),
    //       ),
    //       // Status Tag
    //       Container(
    //         padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
    //         decoration: BoxDecoration(
    //           color: bgColor,
    //           borderRadius: BorderRadius.circular(15),
    //         ),
    //         child: Text(
    //           _capitalizeEachWord(record.status),
    //           style: TextStyle(
    //             color: statusColor,
    //             fontWeight: FontWeight.bold,
    //             fontSize: 12,
    //           ),
    //         ),
    //       ),
    //     ],
    //   ),
    // );

    return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade100),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                spreadRadius: 1,
                blurRadius: 3,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.deepPurple.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.calendar_today,
                    size: 20, color: Color(0xFF6F34FA)),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _formatDate(record.date),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_formatTimeDisplay(record.checkInTime)} - ${_formatTimeDisplay(record.checkOutTime)}',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.black38,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Text(
                  _capitalizeEachWord(record.status),
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ));
  }
}
