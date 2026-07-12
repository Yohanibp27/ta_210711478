import 'dart:convert';
import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:intl/intl.dart';
import 'package:geolocator/geolocator.dart';
import 'package:presensi_app/services/auth_service.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
// import 'dart:ui' as ui;
// import 'dart:typed_data';
// import 'package:flutter/rendering.dart';
// import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
// import 'package:flutter/foundation.dart';

class FaceVerificationPage extends StatefulWidget {
  final bool isCheckIn;
  const FaceVerificationPage({super.key, required this.isCheckIn});

  @override
  State<FaceVerificationPage> createState() => _FaceVerificationPageState();
}

class _FaceVerificationPageState extends State<FaceVerificationPage> {
  final AuthService authService = AuthService();
  CameraController? _cameraController;

  bool isLoading = false;
  bool isCameraReady = false;
  bool showPreview = false;
  XFile? capturedImage;
  String currentAddress = "Mencari lokasi...";
  String? rawLocation;
  final TextEditingController _noteController = TextEditingController();
  String get currentTime => DateFormat('HH:mm').format(DateTime.now());

  // face recognation
  // bool isFaceDetected = false; // Status apakah wajah terdeteksi
  // bool isProcessingStream = false; // Mencegah pemrosesan tumpang tindih
  // final FaceDetector _faceDetector = FaceDetector(
  //   options: FaceDetectorOptions(performanceMode: FaceDetectorMode.fast),
  // );

  @override
  void initState() {
    super.initState();
    _loadInitialLocation();
    _initializeCamera();
    showPreview = false;

    // if (widget.isCheckIn) {
    //   _initializeCamera();
    //   showPreview = false;
    // } else {
    //   showPreview = true;
    // }
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      final frontCamera = cameras.firstWhere(
          (camera) => camera.lensDirection == CameraLensDirection.front);

      _cameraController =
          CameraController(frontCamera, ResolutionPreset.medium);
      // _cameraController = CameraController(frontCamera, ResolutionPreset.low);
      await _cameraController!.initialize();
      if (!mounted) return;
      setState(() => isCameraReady = true);

      // // Mulai stream untuk deteksi wajah
      // _cameraController!.startImageStream((CameraImage image) {
      //   if (!isProcessingStream) {
      //     isProcessingStream = true;
      //     _detectFaceFromStream(image);
      //   }
      // });
    } catch (e) {
      debugPrint("Error camera: $e");
    }
  }

  Future<void> _loadInitialLocation() async {
    setState(() => currentAddress = "Memperbarui lokasi...");
    try {
      Position position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high);

      rawLocation = "${position.latitude},${position.longitude}";

      List<Placemark> placemarks =
          await placemarkFromCoordinates(position.latitude, position.longitude);
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        setState(() {
          currentAddress =
              "${place.street}, ${place.locality}, ${place.subAdministrativeArea}";
        });
      }
    } catch (e) {
      setState(
          () => currentAddress = "Gagal mendapatkan lokasi: ${e.toString()}");
    }
  }

  Future<void> _takePicture() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      debugPrint("Kamera belum siap atau null!");
      return;
    }
    try {
      debugPrint("Sedang mengambil foto...");
      final image = await _cameraController!.takePicture();
      debugPrint("Foto berhasil diambil! Disimpan di: ${image.path}");
      setState(() {
        capturedImage = image;
        showPreview = true;
      });
    } catch (e) {
      print(e);
      debugPrint("Error saat mengambil foto: $e");
    }
  }

  Future<void> _finalSubmit() async {
    setState(() => isLoading = true);
    try {
      String? base64Image;

      // if (widget.isCheckIn && capturedImage != null) {
      //   File file = File(capturedImage!.path);
      //   base64Image =
      //       "data:image/jpeg;base64,${base64Encode(await file.readAsBytes())}";
      // }
      // if (widget.isCheckIn && capturedImage != null) {
      if (capturedImage != null) {
        final compressedFile = await FlutterImageCompress.compressWithFile(
          capturedImage!.path,
          minWidth: 800, // Ukuran cukup untuk validasi presensi
          quality: 70, // Kompresi kualitas
        );
        // base64Image = "data:image/jpeg;base64,${base64Encode(compressedFile!)}";
        if (compressedFile != null) {
          base64Image =
              "data:image/jpeg;base64,${base64Encode(compressedFile)}";
        }
      }

      final result = await authService.submitAttendance(
          location: rawLocation ?? "0.0,0.0",
          isOutside: true,
          isCheckIn: widget.isCheckIn,
          evidencePhoto: base64Image,
          notes: _noteController.text);

      if (mounted) {
        if (result['success'] == true) {
          _showSuccessOverlay();
        } else {
          _showErrorDialog(result['message'] ?? "Gagal melakukan presensi");
        }
      }
    } catch (e) {
      if (mounted) {
        _showErrorDialog("Terjadi kesalahan sistem: $e");
      }
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  // face recognation
  // Future<void> _detectFaceFromStream(CameraImage image) async {
  //   final WriteBuffer allBytes = WriteBuffer();
  //   for (final Plane plane in image.planes) {
  //     allBytes.putUint8List(plane.bytes);
  //   }

  //   // Konversi ke InputImage (memerlukan setup tambahan untuk rotation)
  //   final inputImage = InputImage.fromBytes(
  //     bytes: allBytes.done().buffer.asUint8List(),
  //     metadata: InputImageMetadata(
  //       size: Size(image.width.toDouble(), image.height.toDouble()),
  //       rotation:
  //           InputImageRotation.rotation270deg, // Sesuaikan dengan kamera depan
  //       format: InputImageFormat.nv21,
  //       bytesPerRow: image.planes[0].bytesPerRow,
  //     ),
  //   );

  //   final faces = await _faceDetector.processImage(inputImage);

  //   if (mounted) {
  //     setState(() {
  //       isFaceDetected = faces.isNotEmpty;
  //     });
  //     isProcessingStream = false;
  //   }
  // }

  @override
  void dispose() {
    // _cameraController?.stopImageStream(); // face recognation
    _cameraController?.dispose();
    // _faceDetector.close(); // face recognation
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    String title = "";
    if (widget.isCheckIn) {
      title = showPreview ? "Konfirmasi Presensi Masuk" : "Verifikasi Wajah";
    } else {
      title = "Konfirmasi Presensi Pulang";
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(title),
        backgroundColor: const Color(0xFF6F34FA),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (widget.isCheckIn && showPreview && capturedImage != null) {
              setState(() {
                showPreview = false;
                capturedImage = null;
              });
            } else {
              Navigator.pop(context);
            }
          },
        ),
      ),
      body: showPreview ? _buildDataConfirmation() : _buildCameraInterface(),
    );
  }

  Widget _buildCameraInterface() {
    final size = MediaQuery.of(context).size;
    return Stack(
      children: [
        if (isCameraReady && _cameraController != null)
          SizedBox(
            width: double.infinity,
            height: double.infinity,
            child: CameraPreview(_cameraController!),
          )
        else
          const Center(child: CircularProgressIndicator()),
        // Center(
        //   child: Container(
        //     width: size.width * 0.7,
        //     height: size.width * 0.9,
        //     decoration: BoxDecoration(
        //       border: Border.all(color: Colors.white, width: 2),
        //       borderRadius: BorderRadius.all(
        //           Radius.elliptical(size.width * 0.7, size.width * 0.9)),
        //     ),
        //   ),
        // ),

        // Cara Menyesuaikan Posisinya Lagi:
        // Perhatikan properti Alignment(0, -0.35). Angka kedua (-0.35) adalah pengatur posisi vertikal (atas-bawah):
        // Nilai 0.0 berarti pas di tengah-tengah layar.
        // Semakin mendekati -1.0 (misal: -0.4, -0.5, dst.), posisi lingkaran akan semakin naik ke atas.
        // Semakin mendekati 1.0 (misal: 0.2, 0.3, dst.), posisi lingkaran akan semakin turun ke bawah.
        Align(
          // 0 artinya di tengah horizontal, -0.35 artinya agak ke atas
          alignment: const Alignment(0, -0.30),
          child: Container(
            width: size.width * 0.7,
            height: size.width * 0.9,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.white, width: 2),
              borderRadius: BorderRadius.all(
                  Radius.elliptical(size.width * 0.7, size.width * 0.9)),
            ),
          ),
        ),
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildInstructionItem("Pastikan wajah terlihat jelas"),
                _buildInstructionItem("Posisikan wajah di tengah lingkaran"),
                _buildInstructionItem("Pastikan pencahayaan cukup terang"),
                _buildInstructionItem(
                    "Jangan gunakan masker atau kacamata gelap"),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6F34FA)),
                    onPressed: _takePicture,
                    child: const Text("Ambil Foto",
                        style: TextStyle(color: Colors.white)),
                  ),
                ),
                // SizedBox(
                //   width: double.infinity,
                //   height: 50,
                //   child: ElevatedButton(
                //     style: ElevatedButton.styleFrom(
                //       backgroundColor: isFaceDetected
                //           ? const Color(0xFF6F34FA)
                //           : Colors.grey,
                //     ),
                //     onPressed: isFaceDetected
                //         ? _takePicture
                //         : null, // Tombol tidak bisa diklik jika wajah tidak terdeteksi
                //     child: Text(
                //       isFaceDetected ? "Ambil Foto" : "Mencari Wajah...",
                //       style: const TextStyle(color: Colors.white),
                //     ),
                //   ),
                // ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInstructionItem(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          const Icon(Icons.check_circle, size: 16, color: Colors.green),
          const SizedBox(width: 8),
          Text(text,
              style: const TextStyle(fontSize: 13, color: Colors.black87)),
        ],
      ),
    );
  }

  Widget _buildDataConfirmation() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // if (widget.isCheckIn && capturedImage != null) ...[
          if (capturedImage != null) ...[
            const Text("Foto Wajah",
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundImage: FileImage(File(capturedImage!.path)),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Foto Valid",
                            style: TextStyle(
                                color: Colors.green,
                                fontWeight: FontWeight.bold)),
                        Text("Wajah terdeteksi dengan jelas",
                            style: TextStyle(fontSize: 12, color: Colors.grey)),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () => setState(() {
                      showPreview = false;
                      capturedImage = null;
                    }),
                    child: const Text("Ambil Ulang"),
                  )
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
          if (!widget.isCheckIn) ...[
            const Text("Waktu Pulang",
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.shade100),
              ),
              child: Text(
                currentTime,
                style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF6F34FA)),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 20),
          ],
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Lokasi Presensi",
                  style: TextStyle(fontWeight: FontWeight.bold)),
              TextButton(
                  onPressed: _loadInitialLocation,
                  child: const Text("Perbarui")),
            ],
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.location_on, color: Colors.red),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(currentAddress,
                              style:
                                  const TextStyle(fontWeight: FontWeight.w600)),
                          Text(rawLocation ?? "Koordinat tidak ditemukan",
                              style: const TextStyle(
                                  fontSize: 12, color: Colors.grey)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  height: 150,
                  width: double.infinity,
                  decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(8),
                      image: const DecorationImage(
                          image: NetworkImage(
                              "https://via.placeholder.com/600x300?text=Map+Preview"),
                          fit: BoxFit.cover)),
                  child: rawLocation == null
                      ? const Center(child: CircularProgressIndicator())
                      : null,
                )
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text("Keterangan Kegiatan",
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(
            controller: _noteController,
            maxLines: 4,
            maxLength: 500,
            decoration: InputDecoration(
              hintText: widget.isCheckIn
                  ? "Jelaskan rencana kegiatan dinas luar..."
                  : "Jelaskan laporan hasil kegiatan hari ini...",
              hintStyle: const TextStyle(fontSize: 13, color: Colors.grey),
              border:
                  OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              counterText: "${_noteController.text.length}/500",
              helperText: "Minimal 10 karakter",
            ),
            onChanged: (v) => setState(() {}),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6F34FA),
                disabledBackgroundColor: Colors.grey,
              ),
              onPressed:
                  (_noteController.text.length >= 10 && rawLocation != null)
                      ? () => _showConfirmationDialog(context)
                      : null,
              child: Text(isLoading ? "Memproses..." : "Lanjutkan",
                  style: const TextStyle(color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDialogRow(String label, String value,
      {bool isTruncated = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 14,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            maxLines: isTruncated ? 1 : 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.black87,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ),
      ],
    );
  }

  void _showConfirmationDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.help_outline,
                  color: Color(0xFF6F34FA), size: 48),
              const SizedBox(height: 16),
              Text(
                  widget.isCheckIn
                      ? "Konfirmasi Presensi Masuk"
                      : "Konfirmasi Presensi Pulang",
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 8),
              const Text("Apakah data yang dimasukkan sudah benar?",
                  textAlign: TextAlign.center),
              const SizedBox(height: 24),
              _buildDialogRow("Waktu:", currentTime),
              const SizedBox(height: 12),
              _buildDialogRow("Lokasi:", currentAddress),
              const SizedBox(height: 12),
              _buildDialogRow("Keterangan:", _noteController.text,
                  isTruncated: true),
              const SizedBox(height: 25),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text("Batal"),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6F34FA)),
                      onPressed: () {
                        Navigator.pop(ctx);
                        _finalSubmit();
                      },
                      child: const Text("Ya, Kirim",
                          style: TextStyle(color: Colors.white)),
                    ),
                  ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  void _showSuccessOverlay() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle, color: Colors.green, size: 80),
              const SizedBox(height: 16),
              Text(
                  widget.isCheckIn
                      ? "Presensi Masuk Berhasil!"
                      : "Presensi Pulang Berhasil!",
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 20)),
              const SizedBox(height: 8),
              Text(
                  widget.isCheckIn
                      ? "Data presensi Anda telah dikirim"
                      : "Terima kasih telah menyelesaikan dinas luar hari ini",
                  textAlign: TextAlign.center),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blueAccent),
                  onPressed: () {
                    Navigator.pop(ctx);
                    Navigator.pop(context, {'success': true});
                  },
                  child: const Text("Lihat Status Pengajuan",
                      style: TextStyle(color: Colors.white)),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 80),
              const SizedBox(height: 16),
              Text(
                widget.isCheckIn
                    ? "Presensi Masuk Gagal"
                    : "Presensi Pulang Gagal",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
              ),
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.black87),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text("Tutup",
                      style: TextStyle(color: Colors.white)),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}

// class _FaceVerificationPageState extends State<FaceVerificationPage> {
//   final AuthService authService = AuthService();
//   CameraController? _cameraController;

//   bool isLoading = false;
//   bool isCameraReady = false;
//   bool showPreview = false;

//   XFile? capturedImage;
//   String currentAddress = "Mencari lokasi...";
//   String? rawLocation;
//   final TextEditingController _noteController = TextEditingController();

//   // Key untuk men-generate gambar yang sudah digabung dengan watermark
//   final GlobalKey _watermarkKey = GlobalKey();

//   String get currentTime => DateFormat('HH:mm').format(DateTime.now());
//   String get currentDate => DateFormat('dd MMM yyyy').format(DateTime.now());

//   @override
//   void initState() {
//     super.initState();
//     _loadInitialLocation();

//     if (widget.isCheckIn) {
//       _initializeCamera();
//       showPreview = false;
//     } else {
//       showPreview = true;
//     }
//   }

//   Future<void> _initializeCamera() async {
//     try {
//       final cameras = await availableCameras();
//       final frontCamera = cameras.firstWhere(
//           (camera) => camera.lensDirection == CameraLensDirection.front);

//       _cameraController = CameraController(
//         frontCamera,
//         ResolutionPreset.high, // Resolusi dinaikkan agar hasil foto jelas
//         enableAudio: false,
//       );

//       await _cameraController!.initialize();
//       if (!mounted) return;

//       setState(() => isCameraReady = true);
//     } catch (e) {
//       debugPrint("Error camera: $e");
//     }
//   }

//   Future<void> _takePicture() async {
//     if (_cameraController == null || !_cameraController!.value.isInitialized) {
//       return;
//     }

//     if (rawLocation == null) {
//       _showErrorDialog(
//           "Tunggu hingga lokasi Anda ditemukan sebelum mengambil foto.");
//       return;
//     }

//     setState(() => isLoading = true);

//     try {
//       final image = await _cameraController!.takePicture();

//       if (!mounted) return;

//       setState(() {
//         capturedImage = image;
//         showPreview = true;
//       });
//     } catch (e) {
//       debugPrint("Error ambil foto: $e");
//       if (mounted) {
//         _showErrorDialog("Terjadi kesalahan sistem saat mengambil foto.");
//       }
//     } finally {
//       if (mounted) setState(() => isLoading = false);
//     }
//   }

//   Future<void> _loadInitialLocation() async {
//     setState(() => currentAddress = "Memperbarui lokasi...");
//     try {
//       Position position = await Geolocator.getCurrentPosition(
//           desiredAccuracy: LocationAccuracy.high);

//       rawLocation = "${position.latitude}, ${position.longitude}";

//       List<Placemark> placemarks =
//           await placemarkFromCoordinates(position.latitude, position.longitude);
//       if (placemarks.isNotEmpty) {
//         Placemark place = placemarks[0];
//         setState(() {
//           currentAddress =
//               "${place.street}, ${place.locality}, ${place.subAdministrativeArea}";
//         });
//       }
//     } catch (e) {
//       setState(
//           () => currentAddress = "Gagal mendapatkan lokasi: ${e.toString()}");
//     }
//   }

//   @override
//   void dispose() {
//     _cameraController?.dispose();
//     _noteController.dispose();
//     super.dispose();
//   }

//   @override
//   Widget build(BuildContext context) {
//     String title = "";
//     if (widget.isCheckIn) {
//       title = showPreview ? "Konfirmasi Presensi Masuk" : "Ambil Foto Presensi";
//     } else {
//       title = "Konfirmasi Presensi Pulang";
//     }

//     return Scaffold(
//       backgroundColor: Colors.white,
//       appBar: AppBar(
//         title: Text(title,
//             style: const TextStyle(color: Colors.white, fontSize: 18)),
//         backgroundColor: const Color(0xFF6F34FA),
//         iconTheme: const IconThemeData(color: Colors.white),
//         leading: IconButton(
//           icon: const Icon(Icons.arrow_back),
//           onPressed: () {
//             if (widget.isCheckIn && showPreview && capturedImage != null) {
//               setState(() {
//                 showPreview = false;
//                 capturedImage = null;
//               });
//             } else {
//               Navigator.pop(context);
//             }
//           },
//         ),
//       ),
//       body: showPreview ? _buildDataConfirmation() : _buildCameraInterface(),
//     );
//   }

//   Widget _buildCameraInterface() {
//     return Stack(
//       children: [
//         if (isCameraReady && _cameraController != null)
//           SizedBox(
//             width: double.infinity,
//             height: double.infinity,
//             child: CameraPreview(_cameraController!),
//           )
//         else
//           const Center(child: CircularProgressIndicator()),

//         // Tampilan Watermark Sementara di UI Kamera
//         Positioned(
//           top: 40,
//           left: 16,
//           right: 16,
//           child: _buildWatermarkOverlay(),
//         ),

//         // Panel Bawah
//         Positioned(
//           bottom: 0,
//           left: 0,
//           right: 0,
//           child: Container(
//             padding: const EdgeInsets.all(24),
//             decoration: const BoxDecoration(
//               color: Colors.white,
//               borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
//             ),
//             child: Column(
//               mainAxisSize: MainAxisSize.min,
//               children: [
//                 const Text("Pastikan wajah dan lingkungan terlihat jelas",
//                     style: TextStyle(color: Colors.grey, fontSize: 14)),
//                 const SizedBox(height: 20),
//                 SizedBox(
//                   width: double.infinity,
//                   height: 50,
//                   child: ElevatedButton(
//                     style: ElevatedButton.styleFrom(
//                         backgroundColor: const Color(0xFF6F34FA)),
//                     onPressed: isLoading ? null : _takePicture,
//                     child: isLoading
//                         ? const SizedBox(
//                             width: 24,
//                             height: 24,
//                             child: CircularProgressIndicator(
//                                 color: Colors.white, strokeWidth: 2.5),
//                           )
//                         : const Text("Ambil Foto",
//                             style:
//                                 TextStyle(color: Colors.white, fontSize: 16)),
//                   ),
//                 ),
//               ],
//             ),
//           ),
//         ),
//       ],
//     );
//   }

//   // Desain teks watermark
//   Widget _buildWatermarkOverlay() {
//     return Container(
//       padding: const EdgeInsets.all(8),
//       decoration: BoxDecoration(
//         color: Colors.black.withOpacity(0.5),
//         borderRadius: BorderRadius.circular(8),
//       ),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Text("$currentDate - $currentTime",
//               style: const TextStyle(
//                   color: Colors.white,
//                   fontWeight: FontWeight.bold,
//                   fontSize: 14)),
//           const SizedBox(height: 4),
//           Text(currentAddress,
//               style: const TextStyle(color: Colors.white, fontSize: 12)),
//           Text("Lat/Long: ${rawLocation ?? 'Mencari...'}",
//               style: const TextStyle(color: Colors.white, fontSize: 12)),
//         ],
//       ),
//     );
//   }

//   Widget _buildDataConfirmation() {
//     return SingleChildScrollView(
//       padding: const EdgeInsets.all(16),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           if (widget.isCheckIn && capturedImage != null) ...[
//             const Text("Foto Presensi",
//                 style: TextStyle(fontWeight: FontWeight.bold)),
//             const SizedBox(height: 8),

//             // RepaintBoundary digunakan untuk "membakar" UI Watermark ke dalam Foto
//             ClipRRect(
//               borderRadius: BorderRadius.circular(12),
//               child: RepaintBoundary(
//                 key: _watermarkKey,
//                 child: Stack(
//                   children: [
//                     Image.file(
//                       File(capturedImage!.path),
//                       width: double.infinity,
//                       height: 300,
//                       fit: BoxFit.cover,
//                     ),
//                     Positioned(
//                       bottom: 10,
//                       left: 10,
//                       right: 10,
//                       child: _buildWatermarkOverlay(),
//                     ),
//                   ],
//                 ),
//               ),
//             ),
//             const SizedBox(height: 8),
//             Center(
//               child: TextButton.icon(
//                 icon: const Icon(Icons.refresh),
//                 label: const Text("Ambil Ulang Foto"),
//                 onPressed: () => setState(() {
//                   showPreview = false;
//                   capturedImage = null;
//                 }),
//               ),
//             ),
//             const SizedBox(height: 20),
//           ],
//           if (!widget.isCheckIn) ...[
//             const Text("Waktu Pulang",
//                 style: TextStyle(fontWeight: FontWeight.bold)),
//             const SizedBox(height: 8),
//             Container(
//               width: double.infinity,
//               padding: const EdgeInsets.all(16),
//               decoration: BoxDecoration(
//                 color: Colors.blue.shade50,
//                 borderRadius: BorderRadius.circular(12),
//                 border: Border.all(color: Colors.blue.shade100),
//               ),
//               child: Text(
//                 currentTime,
//                 style: const TextStyle(
//                     fontSize: 24,
//                     fontWeight: FontWeight.bold,
//                     color: Color(0xFF6F34FA)),
//                 textAlign: TextAlign.center,
//               ),
//             ),
//             const SizedBox(height: 20),
//           ],
//           Row(
//             mainAxisAlignment: MainAxisAlignment.spaceBetween,
//             children: [
//               const Text("Lokasi Presensi",
//                   style: TextStyle(fontWeight: FontWeight.bold)),
//               TextButton(
//                   onPressed: _loadInitialLocation,
//                   child: const Text("Perbarui")),
//             ],
//           ),
//           Container(
//             padding: const EdgeInsets.all(12),
//             decoration: BoxDecoration(
//               color: Colors.white,
//               borderRadius: BorderRadius.circular(12),
//               border: Border.all(color: Colors.grey.shade200),
//             ),
//             child: Column(
//               children: [
//                 Row(
//                   children: [
//                     const Icon(Icons.location_on, color: Colors.red),
//                     const SizedBox(width: 8),
//                     Expanded(
//                       child: Column(
//                         crossAxisAlignment: CrossAxisAlignment.start,
//                         children: [
//                           Text(currentAddress,
//                               style:
//                                   const TextStyle(fontWeight: FontWeight.w600)),
//                           Text(rawLocation ?? "Koordinat tidak ditemukan",
//                               style: const TextStyle(
//                                   fontSize: 12, color: Colors.grey)),
//                         ],
//                       ),
//                     ),
//                   ],
//                 ),
//               ],
//             ),
//           ),
//           const SizedBox(height: 20),
//           const Text("Keterangan Kegiatan",
//               style: TextStyle(fontWeight: FontWeight.bold)),
//           const SizedBox(height: 8),
//           TextField(
//             controller: _noteController,
//             maxLines: 4,
//             maxLength: 500,
//             decoration: InputDecoration(
//               hintText: widget.isCheckIn
//                   ? "Jelaskan rencana kegiatan dinas luar..."
//                   : "Jelaskan laporan hasil kegiatan hari ini...",
//               hintStyle: const TextStyle(fontSize: 13, color: Colors.grey),
//               border:
//                   OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
//               counterText: "${_noteController.text.length}/500",
//               helperText: "Minimal 10 karakter",
//             ),
//             onChanged: (v) => setState(() {}),
//           ),
//           const SizedBox(height: 24),
//           SizedBox(
//             width: double.infinity,
//             height: 50,
//             child: ElevatedButton(
//               style: ElevatedButton.styleFrom(
//                 backgroundColor: const Color(0xFF6F34FA),
//                 disabledBackgroundColor: Colors.grey,
//               ),
//               onPressed:
//                   (_noteController.text.length >= 10 && rawLocation != null)
//                       ? () => _showConfirmationDialog(context)
//                       : null,
//               child: Text(isLoading ? "Memproses..." : "Lanjutkan",
//                   style: const TextStyle(color: Colors.white)),
//             ),
//           ),
//         ],
//       ),
//     );
//   }

//   Widget _buildDialogRow(String label, String value,
//       {bool isTruncated = false}) {
//     return Row(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       mainAxisAlignment: MainAxisAlignment.spaceBetween,
//       children: [
//         Text(
//           label,
//           style: TextStyle(
//             color: Colors.grey[600],
//             fontSize: 14,
//           ),
//         ),
//         const SizedBox(width: 16),
//         Expanded(
//           child: Text(
//             value,
//             textAlign: TextAlign.right,
//             maxLines: isTruncated ? 1 : 2,
//             overflow: TextOverflow.ellipsis,
//             style: const TextStyle(
//               color: Colors.black87,
//               fontWeight: FontWeight.w600,
//               fontSize: 14,
//             ),
//           ),
//         ),
//       ],
//     );
//   }

//   void _showConfirmationDialog(BuildContext context) {
//     showDialog(
//       context: context,
//       builder: (ctx) => Dialog(
//         shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
//         child: Padding(
//           padding: const EdgeInsets.all(20),
//           child: Column(
//             mainAxisSize: MainAxisSize.min,
//             children: [
//               const Icon(Icons.help_outline,
//                   color: Color(0xFF6F34FA), size: 48),
//               const SizedBox(height: 16),
//               Text(widget.isCheckIn ? "Konfirmasi Masuk" : "Konfirmasi Pulang",
//                   style: const TextStyle(
//                       fontWeight: FontWeight.bold, fontSize: 18)),
//               const SizedBox(height: 8),
//               const Text("Apakah data yang dimasukkan sudah benar?",
//                   textAlign: TextAlign.center),
//               const SizedBox(height: 24),
//               _buildDialogRow("Waktu:", currentTime),
//               const SizedBox(height: 12),
//               _buildDialogRow("Lokasi:", currentAddress),
//               const SizedBox(height: 12),
//               _buildDialogRow("Keterangan:", _noteController.text,
//                   isTruncated: true),
//               const SizedBox(height: 25),
//               Row(
//                 children: [
//                   Expanded(
//                     child: OutlinedButton(
//                       onPressed: () => Navigator.pop(ctx),
//                       child: const Text("Batal"),
//                     ),
//                   ),
//                   const SizedBox(width: 12),
//                   Expanded(
//                     child: ElevatedButton(
//                       style: ElevatedButton.styleFrom(
//                           backgroundColor: const Color(0xFF6F34FA)),
//                       onPressed: () {
//                         Navigator.pop(ctx);
//                         _finalSubmit();
//                       },
//                       child: const Text("Ya, Kirim",
//                           style: TextStyle(color: Colors.white)),
//                     ),
//                   ),
//                 ],
//               )
//             ],
//           ),
//         ),
//       ),
//     );
//   }

//   // // Fungsi untuk menggabungkan foto dan text watermark menjadi satu base64
//   // Future<String?> _captureWatermarkedImage() async {
//   //   try {
//   //     RenderRepaintBoundary boundary = _watermarkKey.currentContext!
//   //         .findRenderObject() as RenderRepaintBoundary;
//   //     // Pixel ratio dinaikkan agar hasil gambar tidak blur
//   //     ui.Image image = await boundary.toImage(pixelRatio: 2.0);
//   //     ByteData? byteData =
//   //         await image.toByteData(format: ui.ImageByteFormat.png);
//   //     Uint8List pngBytes = byteData!.buffer.asUint8List();
//   //     return "data:image/png;base64,${base64Encode(pngBytes)}";
//   //   } catch (e) {
//   //     debugPrint("Gagal meng-capture watermark: $e");
//   //     return null;
//   //   }
//   // }

//   Future<String?> _captureWatermarkedImage() async {
//     try {
//       // Pastikan frame sudah dirender sepenuhnya
//       final renderObject = _watermarkKey.currentContext?.findRenderObject();
//       if (renderObject == null) return null;

//       final boundary = renderObject as RenderRepaintBoundary;

//       // Pixel ratio 3.0 disarankan untuk hasil yang tajam pada layar high-res
//       ui.Image image = await boundary.toImage(pixelRatio: 3.0);
//       ByteData? byteData =
//           await image.toByteData(format: ui.ImageByteFormat.png);

//       if (byteData == null) return null;

//       Uint8List pngBytes = byteData.buffer.asUint8List();
//       return "data:image/png;base64,${base64Encode(pngBytes)}";
//     } catch (e) {
//       debugPrint("Gagal meng-capture watermark: $e");
//       return null;
//     }
//   }

//   Future<void> _finalSubmit() async {
//     setState(() => isLoading = true);
//     try {
//       String? base64Image;

//       if (widget.isCheckIn && capturedImage != null) {
//         // Panggil fungsi capture UI menjadi Base64
//         base64Image = await _captureWatermarkedImage();

//         // Fallback jika proses capture UI gagal, kirim foto original
//         if (base64Image == null) {
//           File file = File(capturedImage!.path);
//           base64Image =
//               "data:image/jpeg;base64,${base64Encode(await file.readAsBytes())}";
//         }
//       }

//       final result = await authService.submitAttendance(
//           location: rawLocation ?? "0.0,0.0",
//           isOutside: true,
//           evidencePhoto: base64Image,
//           note: _noteController.text);

//       if (mounted) {
//         if (result['success'] == true) {
//           _showSuccessOverlay();
//         } else {
//           _showErrorDialog(result['message'] ?? "Gagal melakukan presensi");
//         }
//       }
//     } catch (e) {
//       if (mounted) {
//         _showErrorDialog("Terjadi kesalahan sistem: $e");
//       }
//     } finally {
//       if (mounted) setState(() => isLoading = false);
//     }
//   }

//   void _showSuccessOverlay() {
//     showDialog(
//       context: context,
//       barrierDismissible: false,
//       builder: (ctx) => Dialog(
//         shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
//         child: Padding(
//           padding: const EdgeInsets.all(24),
//           child: Column(
//             mainAxisSize: MainAxisSize.min,
//             children: [
//               const Icon(Icons.check_circle, color: Colors.green, size: 80),
//               const SizedBox(height: 16),
//               Text(
//                   widget.isCheckIn
//                       ? "Presensi Masuk Berhasil!"
//                       : "Presensi Pulang Berhasil!",
//                   style: const TextStyle(
//                       fontWeight: FontWeight.bold, fontSize: 20)),
//               const SizedBox(height: 8),
//               Text(
//                   widget.isCheckIn
//                       ? "Data presensi Anda telah dikirim"
//                       : "Terima kasih telah menyelesaikan dinas luar hari ini",
//                   textAlign: TextAlign.center),
//               const SizedBox(height: 24),
//               SizedBox(
//                 width: double.infinity,
//                 child: ElevatedButton(
//                   style: ElevatedButton.styleFrom(
//                       backgroundColor: Colors.blueAccent),
//                   onPressed: () {
//                     Navigator.pop(ctx);
//                     Navigator.pop(context, {'success': true});
//                   },
//                   child: const Text("Tutup",
//                       style: TextStyle(color: Colors.white)),
//                 ),
//               )
//             ],
//           ),
//         ),
//       ),
//     );
//   }

//   void _showErrorDialog(String message) {
//     showDialog(
//       context: context,
//       builder: (ctx) => Dialog(
//         shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
//         child: Padding(
//           padding: const EdgeInsets.all(24),
//           child: Column(
//             mainAxisSize: MainAxisSize.min,
//             children: [
//               const Icon(Icons.error_outline, color: Colors.red, size: 80),
//               const SizedBox(height: 16),
//               const Text(
//                 "Presensi Gagal",
//                 style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
//               ),
//               const SizedBox(height: 8),
//               Text(
//                 message,
//                 textAlign: TextAlign.center,
//                 style: const TextStyle(color: Colors.black87),
//               ),
//               const SizedBox(height: 24),
//               SizedBox(
//                 width: double.infinity,
//                 child: ElevatedButton(
//                   style: ElevatedButton.styleFrom(
//                     backgroundColor: Colors.red,
//                     shape: RoundedRectangleBorder(
//                         borderRadius: BorderRadius.circular(10)),
//                   ),
//                   onPressed: () => Navigator.pop(ctx),
//                   child: const Text("Tutup",
//                       style: TextStyle(color: Colors.white)),
//                 ),
//               )
//             ],
//           ),
//         ),
//       ),
//     );
//   }
// }
