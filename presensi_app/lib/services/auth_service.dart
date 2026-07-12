import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
// import 'package:intl/intl.dart';
import '../models/user_activity.dart';
// import 'dart:async'; // Tambahkan ini untuk TimeoutException

import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:path_provider/path_provider.dart';
import 'package:presensi_app/services/navigation_service.dart';

// final dio = Dio();

class AuthService {
  final storage = const FlutterSecureStorage();
  final String localIp = "http://192.168.1.8:3000"; // ip laptop
  final String emulatorIp = "http://10.0.2.2:3000"; // ip emulators
  // untuk emulator Android ganti localhost
  final String baseUrl = "http://192.168.100.199:3000";

  late Dio _dio;
  late CookieJar _cookieJar;

  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;

  AuthService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      // Penting: Agar status >= 400 tidak melempar Exception, menyesuaikan logika kodemu sebelumnya
      validateStatus: (status) => true,
    ));
    _setupInterceptors();
  }

  Future<void> _setupInterceptors() async {
    // 1. Setup Cookie Manager (Untuk menangkap refreshToken via Cookie dari Node.js)
    final appDocDir = await getApplicationDocumentsDirectory();
    _cookieJar = PersistCookieJar(
      ignoreExpires: true,
      storage: FileStorage("${appDocDir.path}/.cookies/"),
    );
    _dio.interceptors.add(CookieManager(_cookieJar));

    // 2. Setup Authentication Interceptor (Pengganti Axios Interceptor)
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Jangan pasang token saat login atau saat mencoba refresh token
        if (!options.path.contains('/login') &&
            !options.path.contains('/token')) {
          final token = await getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
            print(
                "🔐 TOKEN YANG DIPAKAI: $token"); // Mempertahankan log debug-mu
          }
        }
        print("📡 REQUEST KE: ${options.baseUrl}${options.path}");
        return handler.next(options);
      },
      onResponse: (response, handler) async {
        // Jika token mati (401), otomatis refresh!
        if (response.statusCode == 401) {
          print("⚠️ Token Expired! Mencoba meminta token baru...");
          bool isRefreshed = await _attemptRefresh();

          if (isRefreshed) {
            print("✅ Refresh sukses! Mengulang request asal...");
            final newToken = await getToken();
            final retryRequest = response.requestOptions;
            retryRequest.headers['Authorization'] = 'Bearer $newToken';

            // Ulangi request
            final retryResponse = await _dio.fetch(retryRequest);
            return handler.resolve(retryResponse);
          } else {
            print("❌ Refresh token gagal/mati. Memaksa logout...");
            await logout();
            // TODO: Gunakan navigasi global (NavigatorKey / GetX) untuk pindah ke halaman Login

            // Panggil navigasi global
            NavigationService.navigateToLogin();
            return handler.next(response);
          }
        }
        return handler.next(response);
      },
    ));
  }

  // Fungsi internal memanggil API Node.js untuk refresh token
  Future<bool> _attemptRefresh() async {
    try {
      final refreshDio = Dio();
      refreshDio.interceptors
          .add(CookieManager(_cookieJar)); // Bawa cookie refreshToken

      final response = await refreshDio.get('$baseUrl/token');
      if (response.statusCode == 200 && response.data['accessToken'] != null) {
        final newAccessToken = response.data['accessToken'];
        await storage.write(key: "token", value: newAccessToken);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // ===========================================================================
  // SEMUA METHOD API DI BAWAH SUDAH DIREFACTOR MENGGUNAKAN DIO
  // Lebih bersih, tanpa perlu set header Authorization manual di setiap method!
  // ===========================================================================

  // AMBIL TOKEN
  Future<String?> getToken() async => await storage.read(key: "token");
  Future<String?> getStoredNip() async => await storage.read(key: 'nip');

  Future<String?> getUserRole() async {
    String? user = await storage.read(key: 'user');
    if (user == null) return null;

    // final data = jsonDecode(user);
    // return data['roleId'];
    // return user['roleId'];
    try {
      // 1. Ubah teks murni menjadi Map (Objek)
      final Map<String, dynamic> userMap = jsonDecode(user);
      // 2. Sekarang kamu bisa memanggilnya dengan key String
      return userMap['roleId']?.toString();
    } catch (e) {
      print("Error parsing user data: $e");
      return null;
    }
  }

  Future<int?> getUserId() async {
    String? user = await storage.read(key: 'user');
    if (user == null) return null;

    // final data = jsonDecode(user);
    // return data['id'];
    // return int.tryParse(user['id'].toString());

    try {
      // 1. Ubah teks murni menjadi Map
      final Map<String, dynamic> userMap = jsonDecode(user);

      // 2. Ambil ID dan pastikan formatnya integer
      if (userMap['id'] != null) {
        return int.tryParse(userMap['id'].toString());
      }
      return null;
    } catch (e) {
      print("Error parsing user ID: $e");
      return null;
    }
  }

  // LOGIN
  Future<Map<String, dynamic>> login(String nip, String password) async {
    try {
      final response = await _dio.post(
        "/login",
        data: {"nip": nip, "password": password, "device": "mobile"},
      );
      print("STATUS: ${response.statusCode}");
      print("BODY: ${response.data}");
      print("BASE URL: $baseUrl");

      final data = response.data; // Dio otomatis memparsing JSON

      if (response.statusCode == 200) {
        await storage.write(key: "token", value: data["accessToken"]);
        await storage.write(key: "status", value: data["user"]["status"]);
        await storage.write(key: "limited", value: data["limited"].toString());
        await storage.write(key: "nip", value: data["user"]["nip"]);

        // Simpan sisa data user jika dibutuhkan
        // await storage.write(key: "user", value: jsonEncode(data["user"]));

        return {
          "success": true,
          "status": data["user"]["status"],
          "limited": data["limited"],
          "message": data["message"]
        };
      } else {
        return {"success": false, "message": data["message"] ?? "Login gagal"};
      }
    } catch (e) {
      return {"success": false, "message": "Terjadi kesalahan jaringan: $e"};
    }
  }

  // STAY LOGGED IN
  Future<Map<String, dynamic>> stayLoggedIn(String token) async {
    final response = await _dio.get("/stay");
    print("TOKEN YANG DIPAKAI: $token");
    print("BASE URL: $baseUrl");

    if (response.statusCode == 200) {
      return response.data;
    } else {
      throw Exception("Sesi tidak valid: ${response.data}");
    }
  }

  // GET PROFILE (endpoint pakai middleware verifyToken)
  Future<Map<String, dynamic>?> getProfile() async {
    final response = await _dio.get("/stay");
    print("PROFILE RESPONSE STATUS: ${response.statusCode}");
    if (response.statusCode != 200) {
      print("PROFILE FAIL BODY: ${response.data}");
    }
    print("BASE URL: $baseUrl");

    if (response.statusCode == 200) {
      return response.data;
    } else {
      print('Error fetching get profile: ${response.data}');
      return null;
    }
  }

  // FORGOT PASSWORD (KIRIM LINK KE EMAIL)
  Future<void> forgotPassword(String email) async {
    final response =
        await _dio.post("/forgot-password", data: {'email': email});
    if (response.statusCode != 200) {
      throw Exception(response.data['message'] ??
          'Gagal mengirim email link reset password');
    }
  }

  // RESET PASSWORD (KIRIM LINK KE EMAIL)
  Future<void> resetPassword(String token, String newPassword) async {
    final response = await _dio.post(
      "/reset-password",
      data: {'token': token, 'password': newPassword},
    );
    print("TOKEN YANG DIPAKAI: $token");
    print("BASE URL: $baseUrl");
    if (response.statusCode != 200) {
      throw Exception(response.data['message'] ?? 'Gagal reset password');
    }
  }

  // LOGOUT
  Future<void> logout() async {
    await storage.delete(key: "token");
    await _cookieJar.deleteAll(); // Bersihkan toples cookie saat logout
  }

  // SCAN QR CODE PRESENSI DENGAN PENYESUAIAN DINAS LUAR
  Future<Map<String, dynamic>> submitAttendance(
      {required String location,
      String? qrData, // optional karena Dinas Luar tidak scan QR
      required bool isCheckIn, // Parameter baru
      required bool isOutside,
      String? evidencePhoto,
      String? notes}) async {
    print("🔹 QR scanned: $qrData");
    print("📍 Location: $location");
    print("🏢 Type: ${isOutside ? 'DINAS LUAR' : 'INSIDE'}");

    if (isOutside && (evidencePhoto == null || evidencePhoto.isEmpty)) {
      return {
        "success": false,
        "message": "Dinas Luar wajib melampirkan foto bukti!"
      };
    }
    if (!isOutside && (qrData == null || qrData.isEmpty)) {
      return {
        "success": false,
        "message":
            "QR Code wajib di-scan untuk presensi di dalam lokasi rumah sakit!"
      };
    }

    // final Map<String, dynamic> body = {
    //   "checkInLocation": location,
    //   "checkOutLocation": location,
    //   "attendanceType": isOutside ? "OUTSIDE" : "INSIDE",
    // };
    // if (isOutside) {
    //   // Jika Dinas Luar, kirim foto dan abaikan QR
    //   body["evidencePhoto"] = evidencePhoto;
    //   body["notes"] = notes;
    // } else {
    //   // Jika Normal, kirim QR Token
    //   body["qrToken"] = qrData;
    // }

    final Map<String, dynamic> body = {
      "attendanceType": isOutside ? "OUTSIDE" : "INSIDE", // WAJIB DIKIRIM
      "notes": notes, // PERBAIKAN: ubah dari 'note' menjadi 'notes'
    };
    if (isCheckIn) {
      body["checkInLocation"] = location;
    } else {
      body["checkOutLocation"] = location;
    }
    if (isOutside) {
      if (isCheckIn) {
        body["checkInEvidencePhoto"] = evidencePhoto;
      } else {
        body["checkOutEvidencePhoto"] = evidencePhoto;
      }
    } else {
      body["qrToken"] = qrData;
    }

    final response = await _dio.post("/attendances", data: body);
    print("📡 STATUS: ${response.statusCode}");
    print("📦 RESPONSE: ${response.data}");
    print("📦 BODY TERKIRIM: $body");
    // print("TOKEN YANG DIPAKAI: $token");
    print("BASE URL: $baseUrl");

    final responseData = response.data;
    if (response.statusCode == 200 || response.statusCode == 201) {
      return {
        "success": true,
        "message": responseData['message'] ?? 'Presensi berhasil!',
        "data": responseData['data'] // Mengembalikan data attendance jika perlu
      };
    } else {
      return {
        "success": false,
        "message": responseData['message'] ?? 'Gagal melakukan presensi!',
      };
    }
  }

  // LIST PRESENSI MY ATTENDANCES
  Future<List<dynamic>> getMyAttendances() async {
    final response = await _dio.get("/attendances/me");
    print("ATTENDANCE RESPONSE STATUS: ${response.statusCode}");
    print("ATTENDANCE RESPONSE BODY: ${response.data}");
    print("ATTENDANCE DATA TYPE: ${response.data.runtimeType}");
    print("BASE URL: $baseUrl");

    // if (response.statusCode == 200) return response.data['data'] ?? [];
    // return [];
    if (response.statusCode == 200) {
      // final Map<String, dynamic> result = response.data;
      // return result['data'] ?? [];

      // Pastikan response.data adalah Map sebelum mengakses key ['data']
      if (response.data is Map) {
        final Map<String, dynamic> result = response.data;
        final List<dynamic> attendanceList = result['data'] ?? [];

        // Melacak tipe data dari isi list presensi
        print("ATTENDANCE LIST TYPE: ${attendanceList.runtimeType}");
        print("JUMLAH DATA PRESENSI: ${attendanceList.length}");
        print("==================================================");

        return attendanceList;
      } else {
        print("Format response tidak sesuai, bukan sebuah Map.");
        return [];
      }
    } else {
      print("Failed to fetch attendance: ${response.data}");
      return [];
    }
  }

  //  AMBIL WORK SHIFT
  Future<List<dynamic>> getWorkSchedules() async {
    final response = await _dio.get("/workshifts");
    print("BASE URL: $baseUrl");

    // if (response.statusCode == 200) return response.data['data'] ?? [];
    // return [];

    if (response.statusCode == 200) {
      final jsonData = response.data;
      return jsonData['data'];
    } else {
      print('Error fetching work schedules: ${response.statusCode}');
      return [];
    }
  }

  // AMBIL SHIFT ASSIGMENT (user dengan type user = shift)
  Future<List<dynamic>> getShiftAssigments(int userId) async {
    final response = await _dio.get('/shifts/user/$userId');
    print("BASE URL: $baseUrl");
    // if (response.statusCode == 200) return response.data['data'] ?? [];
    // return [];

    if (response.statusCode == 200) {
      final jsonData = response.data;
      return jsonData['data'];
    } else {
      print("Error fetching shift assignments: ${response.statusCode}");
      return [];
    }
  }

  // AMBIL DETAIL SHIFT ASSIGMENT
  Future<Map<String, dynamic>?> getShiftDetail(int shiftAssignmentId) async {
    final response = await _dio.get('/shifts/user/$shiftAssignmentId');
    print("BASE URL: $baseUrl");

    // if (response.statusCode == 200) return response.data['data'];
    // return null;
    if (response.statusCode == 200) {
      final jsonData = response.data;
      return jsonData['data'];
    } else {
      print('Error getShiftDetail: ${response.statusCode}');
      return null;
    }
  }

  // AMBIL SHIFT ASSIGNMENTS BERDASARKAN TOKEN (HANYA UNTUK USER SHIFT)
  Future<List<dynamic>> getMyShiftAssigments() async {
    final response = await _dio.get('/my-shifts');
    print("📡 STATUS CODE: ${response.statusCode}");
    print("📦 RAW RESPONSE BODY: ${response.data}");
    print("BASE URL: $baseUrl");

    // if (response.statusCode == 200) return response.data['data'] ?? [];
    // return [];

    if (response.statusCode == 200) {
      final jsonData = response.data;
      print("✅ PARSED JSON:");
      print(jsonData);

      print("📊 JUMLAH DATA SHIFT:");
      print(jsonData['count']);

      print("📅 DATA SHIFT LIST:");
      print(jsonData['data']);
      return jsonData['data'] ?? [];
    } else if (response.statusCode == 403) {
      print("⚠️ User NON-SHIFT tidak memiliki jadwal shift");
      return [];
    } else {
      print("Error fetching shift assignments: ${response.statusCode}");
      print(response.data);
      return [];
    }
  }

  // UBAH PROFIL & PASSWORD USER
  Future<Map<String, dynamic>> updateUser({
    required int userId,
    String? titlePrefix,
    String? fullName,
    String? titleSuffix,
    String? phone,
    String? email,
    String? newPassword,
    String? currentPassword,
  }) async {
    final response = await _dio.put(
      '/users/me/$userId',
      data: jsonEncode({
        'titlePrefix': titlePrefix,
        'fullName': fullName,
        'titleSuffix': titleSuffix,
        if (email != null) 'email': email,
        if (phone != null) 'phone': phone,
        if (newPassword != null) 'password': newPassword,
        if (currentPassword != null) 'currentPassword': currentPassword,
      }),
    );

    print('UPDATE PROFILE RESPONSE: ${response.statusCode}');
    print('BODY: ${response.data}');
    print("BASE URL: $baseUrl");

    if (response.statusCode == 200) {
      return {'success': true, 'message': 'Profil berhasil diupdate'};
    } else {
      return {
        'success': false,
        'message': response.data['message'] ?? 'Gagal memperbarui profil'
      };
    }
  }

  // AMBIL DAFTAR SHIFT KARYAWAN LAIN DAN SHIFT DIRINYA YANG AKAN DITUKAR
  Future<List<dynamic>> getEmployeesForExchange(int shiftId) async {
    // Catatan: Jika shiftId ingin dikirim sebagai query parameter ke Node.js,
    // kamu bisa tambahkan: queryParameters: {'shiftId': shiftId}
    final response = await _dio.get("/my-shifts/exchange-options");

    print("EXCHANGE OPTIONS STATUS: ${response.statusCode}");
    print("EXCHANGE OPTIONS BODY: ${response.data}");
    print("BASE URL: $baseUrl");

    if (response.statusCode == 200) {
      final jsonData = response.data;
      return jsonData["data"] ?? [];
    } else {
      return [];
    }
  }

  // SUBMIT PERMINTAAN TUKAR SHIFT
  Future<Map<String, dynamic>> submitExchangeRequest({
    required int requesterId,
    required int requestShiftId,
    required int partnerId,
    required int partnerShiftId,
    required String reason,
  }) async {
    final response = await _dio.post(
      "$baseUrl/shift-exchanges/request",
      data: {
        "requesterId": requesterId,
        "requesterShiftId": requestShiftId,
        "partnerId": partnerId,
        "partnerShiftId": partnerShiftId,
        "reason": reason,
      },
    );
    final data = response.data;
    print("RESPONSE BODY: ${response.data}");
    print("BASE URL: $baseUrl");

    if (response.statusCode == 200 || response.statusCode == 201) {
      return {
        "success": true,
        "message": data["message"] ?? "Berhasil",
      };
    } else {
      print("Error submitExchange: ${response.data}");
      return {
        "success": false,
        "message": data["message"] ?? "Terjadi kesalahan",
      };
    }
  }

  // BATALKAN PERMINTAAN TUKAR SHIFT (OLEH PENGAJU)
  Future<Map<String, dynamic>> cancelShiftExchange(int exchangeId) async {
    final response = await _dio.put("/shift-exchanges/$exchangeId/cancel");

    final data = response.data;
    print("CANCEL STATUS: ${response.statusCode}");
    print("CANCEL BODY: ${response.data}");

    if (response.statusCode == 200) {
      return {
        "success": true,
        "message": data["message"] ?? "Berhasil membatalkan permintaan",
      };
    } else {
      return {
        "success": false,
        "message": data["message"] ?? "Gagal membatalkan permintaan",
      };
    }
  }

  // TERIMA PERTUKARAN SHIFT OLEH PARTNER
  Future<bool> approvePartnerShiftExchange(int exchangeId) async {
    final response = await _dio.put("/shift-exchange/$exchangeId/approve");

    print("APPROVE STATUS: ${response.statusCode}");
    print("APPROVE BODY: ${response.data}");
    print("BASE URL: $baseUrl");

    if (response.statusCode == 200) {
      return true;
    } else {
      print("Approve failed: ${response.data}");
      return false;
    }
  }

  // TOLAK PERTUKARAN SHIFT OLEH PARTNER
  Future<bool> rejectPartnerShiftExchange({
    required int exchangeId,
    required String reason,
  }) async {
    if (reason.trim().isEmpty) {
      print("Reason wajib diisi");
      return false;
    }

    final response = await _dio
        .put("/shift-exchange/$exchangeId/reject", data: {"reason": reason});

    print("REJECT STATUS: ${response.statusCode}");
    print("REJECT BODY: ${response.data}");
    print("BASE URL: $baseUrl");

    if (response.statusCode == 200) {
      return true;
    } else {
      print("Reject failed: ${response.data}");
      return false;
    }
  }

  // AMBIL PERTUKARAN SHIFT BERDASARKAN ID
  Future<Map<String, dynamic>> getShiftExchangeById(int id) async {
    final response = await _dio.get("/shift-exchanges/$id");

    print("GET DETAIL STATUS: ${response.statusCode}");
    print("GET DETAIL BODY: ${response.data}");

    final data = response.data;
    if (response.statusCode == 200) {
      return {
        "success": true,
        "data": data,
      };
    } else {
      return {
        "success": false,
        "message": data["message"] ?? "Gagal ambil data",
      };
    }
  }

  // AMBIL AKTIFITAS USER
  Future<List<UserActivity>> fetchUserActivities() async {
    String? token = await storage.read(key: 'token');
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/activities/me'),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json"
      },
    );
    print("STATUS CODE: ${response.statusCode}");
    print("RAW RESPONSE ACTIVITIES: ${response.body}");
    print("TOKEN YANG DIPAKAI: $token");
    print("BASE URL: $baseUrl");

    if (response.statusCode == 200) {
      final jsonMap = jsonDecode(response.body) as Map<String, dynamic>;
      final List<dynamic> jsonList = jsonMap['data'] ?? [];

      print("JSON DECODED: $jsonMap");
      print("DATA LIST USER ACTIVITIES: ${jsonMap['data']}");

      return jsonList.map((j) => UserActivity.fromJson(j)).toList();
    }
    return [];
  }

  // BATALKAN PERMINTAAN PENGAJUAN (OLEH PENGAJU)
  Future<Map<String, dynamic>> cancelLeaveRequests(int leaveId) async {
    final response = await _dio.put('/leave-requests/$leaveId/cancel');
    final data = response.data;
    print("CANCEL STATUS: ${response.statusCode}");
    print("CANCEL BODY: ${response.data}");

    if (response.statusCode == 200) {
      return {
        "success": true,
        "message": data["message"] ?? "Berhasil membatalkan permintaan",
      };
    } else {
      return {
        "success": false,
        "message": data["message"] ?? "Gagal membatalkan permintaan",
      };
    }
  }

  // AMBIL LIST PENGAJUAN
  Future<List<dynamic>> getMyLeaveRequests() async {
    final response = await _dio.get('/my-leave-requests');
    print("STATUS CODE: ${response.statusCode}");
    print("RAW RESPONSE: ${response.data}");
    print("BASE URL: $baseUrl");

    if (response.statusCode == 200) {
      final jsonData = response.data;
      print("JSON DECODED: $jsonData");
      print("DATA LIST: ${jsonData['data']}");
      return jsonData['data'];
    } else {
      print('Error fetching leave types: ${response.statusCode}');
      return [];
    }
  }

  // AMBIL JENIS PENGAJUAN
  Future<List<dynamic>> getLeaveTypes() async {
    final response = await _dio.get('$baseUrl/leavetypes');
    print("BASE URL: $baseUrl");

    if (response.statusCode == 200) {
      final jsonData = response.data;
      return jsonData['data'];
    } else {
      print('Error fetching leave types: ${response.statusCode}');
      return [];
    }
  }

  // AMBIL JENIS SUB PENGAJUAN
  Future<List<dynamic>> getLeaveSubTypes(int typeId) async {
    final response =
        await _dio.get('/leavesubtypes', queryParameters: {'typeId': typeId});
    if (response.statusCode == 200) {
      final jsonData = response.data;
      return jsonData['data'];
    } else {
      print('Error fetching sub leave types: ${response.statusCode}');
      return [];
    }
  }

  // PENGAJUAN IZIN, CUTI, DINAS LUAR (BERKAITAN DENGAN PRESENSI)
  // Future<bool> submitLeaveRequest(
  // Future<dynamic> submitLeaveRequest(
  Future<Map<String, dynamic>?> submitLeaveRequest(
      {required int leaveTypeId,
      required int leaveSubTypeId,
      required String startDate,
      required String endDate,
      String? note,
      String? evidenceFile}) async {
    try {
      final Map<String, dynamic> mapData = {
        'leaveTypeId': leaveTypeId.toString(),
        'leaveSubTypeId': leaveSubTypeId.toString(),
        'startDate': startDate,
        'endDate': endDate,
        'note': note ?? "",
      };

      if (evidenceFile != null && evidenceFile.isNotEmpty) {
        mapData['evidenceFile'] = await MultipartFile.fromFile(evidenceFile);
      }

      final formData = FormData.fromMap(mapData);
      final response = await _dio.post("/leave-requests", data: formData);

      print("RESPONSE STATUS: ${response.statusCode}");
      print("RESPONSE BODY: ${response.data}");
      print("BASE URL: $baseUrl");

      // if (response.statusCode == 200 || response.statusCode == 201) {
      // return true;
      // } else {
      // final errorData = response.data;
      // print("SERVER ERROR MESSAGE: ${errorData['message']}");
      // return false;
      // }

      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data['data'];
      }
      return null;
    } catch (e) {
      print("Error fetching leaves: $e");
      // return false;
      // return null;
      throw Exception("Terjadi kesalahan tidak terduga");
    }
  }

  // AMBIL KALENDER (HARI LIBUR, JADWAL SHIFT, DLL) TAHUN BERJALAN
  Future<List<dynamic>> getCalendarDays() async {
    final int currentYear = DateTime.now().year;
    final response = await _dio.get('/calendars?year=$currentYear');
    print("📅 CALENDAR STATUS: ${response.statusCode}");
    print("BASE URL: $baseUrl");

    if (response.statusCode == 200) {
      final jsonData = response.data;
      return jsonData['data'] ?? [];
    } else {
      print('Error fetching calendars: ${response.data}');
      return [];
    }
  }

  // AMBIL KUOTA PENGAJUAN DIRI SENDIRI
  Future<List<dynamic>> getMyLeaveQuota() async {
    final response = await _dio.get('/my-leavequota');
    print("📊 LEAVE QUOTA STATUS: ${response.statusCode}");
    print("BASE URL: $baseUrl");

    if (response.statusCode == 200) {
      final jsonData = response.data;
      return jsonData['data'] ?? [];
    } else {
      print('Error fetching leave quota: ${response.data}');
      return [];
    }
  }
}
