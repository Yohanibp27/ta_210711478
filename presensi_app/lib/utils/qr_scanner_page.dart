// FITUR CAMERA SCANNER
import 'package:flutter/material.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:intl/intl.dart';
import 'package:geolocator/geolocator.dart';
import '../services/auth_service.dart';

class QrScannerPage extends StatefulWidget {
  // const QrScannerPage({Key? key}) : super(key: key);

  final bool isCheckIn;
  const QrScannerPage({Key? key, required this.isCheckIn}) : super(key: key);

  @override
  State<QrScannerPage> createState() => _QrScannerPageState();
}

class _QrScannerPageState extends State<QrScannerPage> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;
  bool scanned = false;
  bool isLoading = false;
  final storage = const FlutterSecureStorage();
  final authService = AuthService();

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }

  Future<String?> _getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Cek service GPS
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return null; // GPS mati
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return null; // izin ditolak
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return null; // izin ditolak permanen
    }

    Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high);
    return '${position.latitude},${position.longitude}';
  }

  // // panggil auth service
  // Future<void> _submitAttendance(String qrData) async {
  //   setState(() => isLoading = true);
  //   // Ambil lokasi real
  //   final location = await _getCurrentLocation() ?? "Lokasi tidak ditemukan";

  //   // Ambil data user untuk employmentType dan shiftAssignments
  //   final profileData = await authService.getProfile();
  //   String employmentType = "";
  //   List<dynamic> shiftAssignments = [];
  //   if (profileData != null && profileData['data'] != null) {
  //     final userData = profileData['data'];
  //     employmentType = userData['employmentType'] ?? "";
  //     shiftAssignments = userData['shiftAssignments'] ?? [];
  //   }

  //   final result = await authService.submitAttendance(
  //       qrData, location, employmentType, shiftAssignments);

  //   ScaffoldMessenger.of(context).showSnackBar(
  //     SnackBar(content: Text(result['message'] ?? '')),
  //   );

  //   setState(() => isLoading = false);
  //   await controller?.pauseCamera();
  //   controller?.dispose();
  //   // if (mounted) Navigator.pop(context, true);
  //   if (mounted) {
  //     Navigator.pop(context, {
  //       'success': result['success'] ?? true,
  //       'checkInTime': DateFormat('HH:mm').format(DateTime.now()),
  //       'checkOutTime': DateFormat('HH:mm').format(DateTime.now()),
  //     });
  //   }
  // }

  // MODIFIKASI SUBMIT ATTENDANCE UNTUK SCAN QR CODE
  Future<void> _submitAttendance(String qrData) async {
    setState(() => isLoading = true);
    // Ambil lokasi real
    // try {
    final location = await _getCurrentLocation() ?? "Lokasi tidak ditemukan";

    // 2. Panggil service dengan Named Parameters
    // Catatan: employmentType dan shiftAssignments dihapus karena method baru tidak membutuhkannya
    final result = await authService.submitAttendance(
      location: location,
      qrData: qrData,
      isOutside: false, // Karena ini scan QR, maka dianggap di lokasi (INSIDE)
      isCheckIn: widget.isCheckIn,
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(result['message'] ?? ''),
        backgroundColor: result['success'] == true ? Colors.green : Colors.red,
        duration: const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
      ));

      setState(() => isLoading = false);

      // if (result['success'] == true) {
      //   await controller?.pauseCamera();
      //   Navigator.pop(context, {
      //     'success': true,
      //     'checkInTime': DateFormat('HH:mm').format(DateTime.now()),
      //     'checkOutTime': DateFormat('HH:mm').format(DateTime.now()),
      //   });
      // } else {
      //   // Jika gagal, ijinkan scan ulang
      //   scanned = false;
      // }

      await controller?.pauseCamera();
      controller?.dispose();
      if (mounted) {
        Navigator.pop(context, {
          'success': result['success'] ?? true,
          'checkInTime': DateFormat('HH:mm').format(DateTime.now()),
          'checkOutTime': DateFormat('HH:mm').format(DateTime.now()),
        });
      }
    }
    // } catch (e) {
    //   if (!mounted) return;

    //   setState(() => isLoading = false);
    //   scanned = false;

    //   ScaffoldMessenger.of(context).showSnackBar(
    //     SnackBar(content: Text("Error: $e")),
    //   );
    // }
  }

  // KETIKA USER TIDAK MELAKUKAN PRESENSI DAN SUDAH MELEWATI JAM KERJA/SHIFTNYA MAKA TOMBOL PRESENSI DISABLE KARNA MENANDAKAN PRESENSI HARI INI SUDAH SELESAI WALAUPUN STATUSNYA TIDAK MELAKUKAN ATAU HADIR

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR Presensi'),
        backgroundColor: const Color(0xFF6F34FA),
      ),
      body: Stack(
        children: [
          QRView(
            key: qrKey,
            onQRViewCreated: (ctrl) {
              controller = ctrl;
              ctrl.scannedDataStream.listen((scanData) {
                if (!scanned) {
                  scanned = true; // hanya sekali scan
                  _submitAttendance(scanData.code ?? '');
                }
              });
            },
            overlay: QrScannerOverlayShape(
              borderColor: Colors.purple,
              borderRadius: 10,
              borderLength: 30,
              borderWidth: 10,
              cutOutSize: 250,
            ),
          ),
          if (isLoading)
            Container(
                color: Colors.black54,
                child: const Center(
                    //   child: CircularProgressIndicator(color: Colors.white),
                    // ),
                    child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(
                      color: Colors.white,
                    ),
                    SizedBox(
                      height: 16,
                    ),
                    Text(
                      "Memproses Presensi...",
                      style: TextStyle(
                          color: Colors.white, fontWeight: FontWeight.bold),
                    )
                  ],
                ))),
        ],
      ),
    );
  }
}
