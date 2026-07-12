// MENAMPILKAN SALAH 1 RIWAYAT PRESENSI
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geocoding/geocoding.dart' as geo;

class AttendanceDetail {
  final String dateString;
  final String locationName;
  final String status;
  final String checkInTime;
  final String checkOutTime;
  final String totalDuration;
  final String workSchedule;
  final String shiftName;
  final String checkInLocationDetail;
  final String checkOutLocationDetail;
  final String? notes;
  // final String? lateDuration;
  final int? lateDuration;
  // final String? evidencePhoto;
  final String? checkInEvidencePhoto;
  final String? checkOutEvidencePhoto;
  final String userType;

  AttendanceDetail({
    required this.dateString,
    required this.locationName,
    required this.status,
    required this.checkInTime,
    required this.checkOutTime,
    required this.totalDuration,
    required this.workSchedule,
    required this.shiftName,
    required this.checkInLocationDetail,
    required this.checkOutLocationDetail,
    this.notes,
    this.lateDuration,
    // this.evidencePhoto,
    this.checkInEvidencePhoto,
    this.checkOutEvidencePhoto,
    required this.userType,
  });
}

class AttendanceDetailPage extends StatefulWidget {
  final AttendanceDetail detail;
  const AttendanceDetailPage({super.key, required this.detail});

  @override
  State<AttendanceDetailPage> createState() => _AttendanceDetailPageState();
}

class _AttendanceDetailPageState extends State<AttendanceDetailPage> {
  String _addressIn = "Memuat alamat...";
  String _addressOut = "Memuat alamat...";

  @override
  void initState() {
    super.initState();
    _getAddress();
  }

  // Future<void> _getAddress() async {
  //   try {
  //     LatLng posIn = _parseLatLng(widget.detail.checkInLocationDetail);
  //     List<geo.Placemark> placemarksIn =
  //         await geo.placemarkFromCoordinates(posIn.latitude, posIn.longitude);

  //     LatLng posOut = _parseLatLng(widget.detail.checkOutLocationDetail);
  //     List<geo.Placemark> placemarksOut =
  //         await geo.placemarkFromCoordinates(posOut.latitude, posOut.longitude);

  //     if (mounted) {
  //       setState(() {
  //         _addressIn = _formatPlacemark(placemarksIn.first);
  //         _addressOut = _formatPlacemark(placemarksOut.first);
  //       });
  //     }
  //   } catch (e) {
  //     setState(() {
  //       _addressIn = "Alamat tidak ditemukan";
  //       _addressOut = "Alamat tidak ditemukan";
  //     });
  //   }
  // }
  Future<void> _getAddress() async {
    try {
      LatLng? posIn = _parseLatLng(widget.detail.checkInLocationDetail);
      LatLng? posOut = _parseLatLng(widget.detail.checkOutLocationDetail);

      if (posIn != null) {
        List<geo.Placemark> placemarksIn =
            await geo.placemarkFromCoordinates(posIn.latitude, posIn.longitude);
        _addressIn = _formatPlacemark(placemarksIn.first);
      } else {
        _addressIn = "Lokasi tidak tersedia";
      }

      if (posOut != null) {
        List<geo.Placemark> placemarksOut = await geo.placemarkFromCoordinates(
            posOut.latitude, posOut.longitude);
        _addressOut = _formatPlacemark(placemarksOut.first);
      } else {
        _addressOut = "Lokasi tidak tersedia";
      }

      if (mounted) setState(() {});
    } catch (e) {
      setState(() {
        _addressIn = "Alamat tidak ditemukan";
        _addressOut = "Alamat tidak ditemukan";
      });
    }
  }

  String _formatPlacemark(geo.Placemark place) {
    return "${place.street}, ${place.subLocality}, ${place.locality}, ${place.subAdministrativeArea}";
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'hadir':
        return Colors.green;
      case 'terlambat':
        return Colors.orange;
      case 'tidak hadir':
        return Colors.red;
      case 'izin':
        return Colors.purple;
      case 'dinas luar':
        return Colors.blue;
      case 'tidak valid':
        return Colors.blueGrey;
      default:
        return Colors.grey;
    }
  }

  // LatLng _parseLatLng(String locationDetail) {
  //   try {
  //     final parts = locationDetail.split(',');
  //     if (parts.length < 2) {
  //       return const LatLng(-6.395421610846996,
  //           108.15667690137026); // dafult titik koordinat rs bhayangkara
  //     }
  //     return LatLng(
  //       double.parse(parts[0]),
  //       double.parse(parts[1]),
  //     );
  //   } catch (e) {
  //     return const LatLng(-6.395421610846996, 108.15667690137026);
  //   }
  // }
  LatLng? _parseLatLng(String? locationDetail) {
    try {
      if (locationDetail == null || locationDetail.isEmpty) return null;

      final parts = locationDetail.split(',');
      if (parts.length < 2) return null;

      return LatLng(
        double.parse(parts[0]),
        double.parse(parts[1]),
      );
    } catch (e) {
      return null;
    }
  }

  // String _cleanBase64(String base64String) {
  //   String cleaned = base64String;
  //   if (cleaned.contains(',')) {
  //     cleaned = cleaned.substring(cleaned.indexOf(',') + 1);
  //   }
  //   cleaned = cleaned.replaceAll(RegExp(r'\s+'), '');
  //   int padding = cleaned.length % 4;
  //   if (padding != 0) {
  //     cleaned += '=' * (4 - padding);
  //   }
  //   return cleaned;
  // }

  // setelah tambah package perbaiki fungsi _cleanBase64
  String _cleanBase64(String base64String) {
    // Hapus header data URI jika ada (contoh: data:image/jpeg;base64,...)
    String cleaned = base64String.split(',').last;

    // Hapus semua whitespace dan newline yang sering muncul saat transfer data
    cleaned = cleaned.replaceAll(RegExp(r'\s+'), '');

    // Perbaiki padding base64 jika rusak
    int padding = cleaned.length % 4;
    if (padding != 0) {
      cleaned += '=' * (4 - padding);
    }
    return cleaned;
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'hadir':
        return Icons.check_circle;
      case 'terlambat':
        return Icons.access_time_filled;
      case 'tidak hadir':
        return Icons.cancel;
      case 'izin':
        return Icons.assignment_ind;
      case 'dinas luar':
        return Icons.location_on;
      case 'tidak valid':
        return Icons.report_problem;
      default:
        return Icons.help_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    final detail = widget.detail;
    return Scaffold(
        backgroundColor: Colors.grey[100],
        appBar: AppBar(
          title: const Text('Detail Presensi',
              style:
                  TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          backgroundColor: Color(0xFF6F34FA),
          // elevation: 0,
          // actions: [
          //   IconButton(
          //     icon: const Icon(Icons.share_outlined, color: Colors.black),
          //     onPressed: () {
          //       // TODO: Aksi share
          //     },
          //   ),
          // ],
        ),
        body: Stack(
          children: [
            Container(
              height: 120,
              decoration: const BoxDecoration(
                  gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Color(0xFF6F34FA), Color(0xFF8E5CFC)])),
            ),
            SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  _buildSummaryCard(context, detail),
                  const SizedBox(height: 14),
                  _buildWorkScheduleCard(detail),
                  const SizedBox(height: 14),
                  if (detail.status.toLowerCase() == 'dinas luar') ...[
                    _buildPhotoCard(detail),
                    const SizedBox(height: 14),
                  ],
                  if (detail.status.toLowerCase() == 'hadir' ||
                      detail.status.toLowerCase() == 'terlambat' ||
                      detail.status.toLowerCase() == 'dinas luar') ...[
                    if (detail.checkInLocationDetail != "-" &&
                        detail.checkInLocationDetail.isNotEmpty) ...[
                      _buildLocationCard(
                        context,
                        title: "Lokasi Masuk",
                        time: detail.checkInTime,
                        location: detail.checkInLocationDetail,
                        address: _addressIn,
                        icon: Icons.refresh,
                        iconColor: Colors.green,
                      ),
                      const SizedBox(height: 14),
                    ],
                    if (detail.checkOutLocationDetail != "-" &&
                        detail.checkOutLocationDetail.isNotEmpty) ...[
                      _buildLocationCard(
                        context,
                        title: "Lokasi Keluar",
                        time: detail.checkOutTime,
                        location: detail.checkOutLocationDetail,
                        address: _addressOut,
                        icon: Icons.undo,
                        iconColor: Colors.red,
                      ),
                      const SizedBox(height: 14),
                    ]
                  ] else if (detail.status.toLowerCase() == 'tidak valid') ...[
                    _buildLocationCard(
                      context,
                      title: "Lokasi Masuk",
                      time: detail.checkInTime,
                      location: detail.checkInLocationDetail,
                      address: _addressIn,
                      icon: Icons.refresh,
                      iconColor: Colors.green,
                    ),
                    const SizedBox(height: 14),
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                      child: const Padding(
                        padding: EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Icon(Icons.info_outline, color: Colors.grey),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                "Tidak ada presensi keluar",
                                style: TextStyle(color: Colors.grey),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                  ] else ...[
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                      child: const Padding(
                        padding: EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Icon(Icons.info_outline, color: Colors.grey),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                "Lokasi tidak tersedia karena tidak melakukan presensi",
                                style: TextStyle(color: Colors.grey),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                  ],
                  _buildNotesCard(detail),
                  // const SizedBox(height: 16),
                  // _buildBottomSummarySection(detail),
                ],
              ),
            ),
          ],
        ));
  }

  Widget _buildSummaryCard(BuildContext context, AttendanceDetail detail) {
    Color statusColor = _getStatusColor(detail.status);
    return Card(
      elevation: 2,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(18.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        detail.dateString,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        detail.locationName,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _getStatusIcon(detail.status),
                        size: 14,
                        color: _getStatusColor(detail.status),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        detail.status,
                        style: TextStyle(
                          color: _getStatusColor(detail.status),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildTimeDetail("Masuk", detail.checkInTime),
                _buildTimeDetail("Keluar", detail.checkOutTime),
                _buildTimeDetail("Total Durasi", detail.totalDuration,
                    isDuration: true),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeDetail(String label, String value,
      {bool isDuration = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: isDuration ? FontWeight.bold : FontWeight.w600,
            color: isDuration ? Colors.blueAccent : Colors.black,
          ),
        ),
      ],
    );
  }

  // Widget _buildPhotoCard(AttendanceDetail detail) {
  //   String? rawBase64 = detail.evidencePhoto;
  //   bool hasPhoto =
  //       rawBase64 != null && rawBase64.isNotEmpty && rawBase64.length > 50;
  //   return Card(
  //     elevation: 2,
  //     shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
  //     child: Column(
  //       crossAxisAlignment: CrossAxisAlignment.start,
  //       children: [
  //         const ListTile(
  //           leading: Icon(Icons.camera_alt, color: Colors.blueAccent),
  //           title: Text("Bukti Swafoto (Dinas Luar)",
  //               style: TextStyle(fontWeight: FontWeight.w600)),
  //         ),
  //         Padding(
  //           padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
  //           child: ClipRRect(
  //             borderRadius: BorderRadius.circular(10),
  //             child: hasPhoto
  //                 ? Image.memory(
  //                     base64Decode(_cleanBase64(rawBase64)),
  //                     height: 250,
  //                     width: double.infinity,
  //                     fit: BoxFit.cover,
  //                     errorBuilder: (context, error, stackTrace) {
  //                       print("Error Decode: $error");
  //                       return _buildErrorImage(message: "Format foto rusak");
  //                     },
  //                   )
  //                 : _buildErrorImage(message: "Foto tidak tersedia"),
  //           ),
  //         ),
  //       ],
  //     ),
  //   );
  // }

  Widget _buildPhotoCard(AttendanceDetail detail) {
    Widget buildPhotoItem(String title, String? base64Data) {
      bool hasPhoto = base64Data != null && base64Data.length > 100;

      return Card(
        elevation: 2,
        margin: const EdgeInsets.only(bottom: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ListTile(
              leading:
                  Icon(Icons.camera_alt, color: Colors.blueAccent.shade400),
              title: Text(title,
                  style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
            Padding(
              padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: hasPhoto
                    ? Image.memory(
                        base64Decode(_cleanBase64(base64Data)),
                        height: 200,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          debugPrint("Error decode $title: $error");
                          return _buildErrorImage(message: "Gagal memuat foto");
                        },
                      )
                    : _buildErrorImage(message: "Foto tidak tersedia"),
              ),
            ),
          ],
        ),
      );
    }

    // Menampilkan kedua card foto jika data tersedia
    return Column(
      children: [
        if (detail.checkInEvidencePhoto != null)
          buildPhotoItem("Bukti Swafoto Masuk", detail.checkInEvidencePhoto),

        if (detail.checkOutEvidencePhoto != null)
          buildPhotoItem("Bukti Swafoto Keluar", detail.checkOutEvidencePhoto),

        // Jika kedua foto null/kosong
        if (detail.checkInEvidencePhoto == null &&
            detail.checkOutEvidencePhoto == null)
          _buildErrorImage(message: "Tidak ada bukti foto tersedia"),
      ],
    );
  }

  Widget _buildErrorImage({String message = "Gagal memuat foto"}) {
    return Container(
      height: 200,
      width: double.infinity,
      color: Colors.grey[200],
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.broken_image, color: Colors.grey, size: 50),
          Text(message, style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  // Widget _buildWorkScheduleCard(AttendanceDetail detail) {
  //   // return Card(
  //   //   elevation: 2,
  //   //   margin: EdgeInsets.zero,
  //   //   shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
  //   //   child: Column(
  //   //     children: [
  //   //       ListTile(
  //   //         leading: Icon(Icons.access_time_filled,
  //   //             color: Colors.blueAccent.shade400),
  //   //         title: Text("Shift ${detail.shiftName}",
  //   //             style: const TextStyle(fontWeight: FontWeight.w600)),
  //   //         trailing: Text(detail.workSchedule,
  //   //             style: TextStyle(
  //   //                 color: Colors.grey.shade700,
  //   //                 fontWeight: FontWeight.bold,
  //   //                 fontSize: 14)),
  //   //       ),
  //   //       if (detail.lateDuration != null && detail.lateDuration!.isNotEmpty)
  //   //         Padding(
  //   //           padding: const EdgeInsets.only(bottom: 12, left: 16, right: 16),
  //   //           child: Row(
  //   //             children: [
  //   //               const SizedBox(width: 35),
  //   //               Container(
  //   //                 padding:
  //   //                     const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
  //   //                 decoration: BoxDecoration(
  //   //                   color: Colors.orange.shade50,
  //   //                   borderRadius: BorderRadius.circular(6),
  //   //                 ),
  //   //                 child: Text(
  //   //                   "Terlambat: ${detail.lateDuration}",
  //   //                   style: TextStyle(
  //   //                     color: Colors.orange.shade900,
  //   //                     fontWeight: FontWeight.bold,
  //   //                     fontSize: 13,
  //   //                   ),
  //   //                 ),
  //   //               ),
  //   //             ],
  //   //           ),
  //   //         ),
  //   //     ],
  //   //   ),
  //   // );
  //   return Card(
  //     elevation: 2,
  //     margin: EdgeInsets.zero,
  //     shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
  //     child: Padding(
  //       padding: const EdgeInsets.all(16.0),
  //       child: Column(
  //         crossAxisAlignment: CrossAxisAlignment.start,
  //         children: [
  //           Row(
  //             children: [
  //               Icon(Icons.access_time_filled,
  //                   color: Colors.blueAccent.shade400, size: 24),
  //               const SizedBox(width: 12),
  //               Text(
  //                 detail.userType == 'shift'
  //                     ? "Shift ${detail.shiftName}"
  //                     : "Jam Kerja",
  //                 style: const TextStyle(
  //                     fontWeight: FontWeight.w600, fontSize: 15),
  //               ),
  //               const Spacer(),
  //               Container(
  //                 padding:
  //                     const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
  //                 decoration: BoxDecoration(
  //                   color: Colors.grey.shade100,
  //                   borderRadius: BorderRadius.circular(4),
  //                 ),
  //                 child: Text(
  //                   detail.workSchedule,
  //                   style: TextStyle(
  //                       color: Colors.grey.shade700,
  //                       fontWeight: FontWeight.bold,
  //                       fontSize: 13),
  //                 ),
  //               ),
  //             ],
  //           ),
  //           if (detail.lateDuration != null &&
  //               detail.lateDuration!.isNotEmpty) ...[
  //             const SizedBox(height: 4),
  //             Row(
  //               children: [
  //                 const SizedBox(width: 30),
  //                 Container(
  //                   padding:
  //                       const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
  //                   decoration: BoxDecoration(
  //                     color: Colors.orange.shade50,
  //                     borderRadius: BorderRadius.circular(6),
  //                   ),
  //                   child: Text(
  //                     "Terlambat: ${detail.lateDuration}",
  //                     style: TextStyle(
  //                       color: Colors.orange.shade900,
  //                       fontWeight: FontWeight.bold,
  //                       fontSize: 13,
  //                     ),
  //                   ),
  //                 ),
  //               ],
  //             ),
  //           ],
  //         ],
  //       ),
  //     ),
  //   );
  // }

  Widget _buildWorkScheduleCard(AttendanceDetail detail) {
    String formatLateDuration(int minutes) {
      final hours = minutes ~/ 60;
      final mins = minutes % 60;

      if (hours > 0 && mins > 0) {
        return "${hours}j ${mins}m";
      } else if (hours > 0) {
        return "${hours}j";
      } else {
        return "${mins}m";
      }
    }

    return Card(
      elevation: 2,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.access_time_filled,
                    color: Colors.blueAccent.shade400, size: 24),
                const SizedBox(width: 12),
                Text(
                  detail.userType == 'shift'
                      ? "Shift ${detail.shiftName}"
                      : "Jam Kerja",
                  style: const TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 15),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    detail.workSchedule,
                    style: TextStyle(
                        color: Colors.grey.shade700,
                        fontWeight: FontWeight.bold,
                        fontSize: 13),
                  ),
                ),
              ],
            ),
            // if (detail.lateDuration != null &&
            //     detail.lateDuration!.isNotEmpty) ...[
            if (detail.lateDuration != null && detail.lateDuration! > 0) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  const SizedBox(width: 30),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade50,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      // "Terlambat: ${detail.lateDuration}",
                      "Terlambat: ${formatLateDuration(detail.lateDuration!)}",
                      style: TextStyle(
                        color: Colors.orange.shade900,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  // Widget _buildLocationCard(
  //   BuildContext context, {
  //   required String title,
  //   required String time,
  //   required String location,
  //   required String address,
  //   required IconData icon,
  //   required Color iconColor,
  // }) {
  //   LatLng position = _parseLatLng(location);
  //   return Card(
  //     elevation: 2,
  //     shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  //     child: Column(
  //       crossAxisAlignment: CrossAxisAlignment.start,
  //       children: [
  //         Padding(
  //           padding: const EdgeInsets.all(12.0),
  //           child: Text(title,
  //               style:
  //                   const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
  //         ),
  //         SizedBox(
  //           height: 180,
  //           child: ClipRRect(
  //             child: FlutterMap(
  //               options: MapOptions(
  //                 initialCenter: position,
  //                 initialZoom: 16.0,
  //                 interactionOptions:
  //                     const InteractionOptions(flags: InteractiveFlag.none),
  //               ),
  //               children: [
  //                 TileLayer(
  //                   urlTemplate:
  //                       'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  //                   userAgentPackageName: 'com.example.presensi_app',
  //                 ),
  //                 MarkerLayer(
  //                   markers: [
  //                     Marker(
  //                       point: position,
  //                       width: 45,
  //                       height: 45,
  //                       child:
  //                           Icon(Icons.location_on, color: iconColor, size: 40),
  //                     ),
  //                   ],
  //                 ),
  //               ],
  //             ),
  //           ),
  //         ),
  //         Padding(
  //           padding: const EdgeInsets.all(12.0),
  //           child: Row(
  //             crossAxisAlignment: CrossAxisAlignment.start,
  //             children: [
  //               Icon(Icons.map_outlined, size: 20, color: iconColor),
  //               const SizedBox(width: 10),
  //               Expanded(
  //                 child: Column(
  //                   crossAxisAlignment: CrossAxisAlignment.start,
  //                   children: [
  //                     Text(
  //                       address,
  //                       style: const TextStyle(
  //                           fontWeight: FontWeight.w500, fontSize: 13),
  //                     ),
  //                     const SizedBox(height: 4),
  //                     Text(
  //                       "Koordinat: ${position.latitude}, ${position.longitude}",
  //                       style: TextStyle(
  //                           color: Colors.grey.shade500, fontSize: 11),
  //                     ),
  //                     Text(
  //                       "Waktu: $time",
  //                       style: TextStyle(
  //                           color: Colors.grey.shade600,
  //                           fontSize: 12,
  //                           fontWeight: FontWeight.bold),
  //                     ),
  //                   ],
  //                 ),
  //               ),
  //             ],
  //           ),
  //         ),
  //       ],
  //     ),
  //   );
  // }
  Widget _buildLocationCard(
    BuildContext context, {
    required String title,
    required String time,
    required String location,
    required String address,
    required IconData icon,
    required Color iconColor,
  }) {
    LatLng? position = _parseLatLng(location);
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Text(title,
                style:
                    const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          ),
          if (position != null)
            SizedBox(
              height: 180,
              child: ClipRRect(
                child: FlutterMap(
                  options: MapOptions(
                    initialCenter: position,
                    initialZoom: 16.0,
                    interactionOptions:
                        const InteractionOptions(flags: InteractiveFlag.none),
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.example.presensi_app',
                    ),
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: position,
                          width: 45,
                          height: 45,
                          child: Icon(Icons.location_on,
                              color: iconColor, size: 40),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            )
          // else
          //   const Padding(
          //     padding: EdgeInsets.all(12.0),
          //     child: Text(
          //       "Lokasi tidak tersedia",
          //       style: TextStyle(color: Colors.grey),
          //     ),
          //   ),
          else
            SizedBox(
              height: 180,
              child: const Center(
                child: Text(
                  "Lokasi tidak tersedia",
                  style: TextStyle(color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.map_outlined, size: 20, color: iconColor),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        address,
                        style: const TextStyle(
                            fontWeight: FontWeight.w500, fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      if (position != null)
                        Text(
                          "Koordinat: ${position.latitude}, ${position.longitude}",
                          style: TextStyle(
                              color: Colors.grey.shade500, fontSize: 11),
                        ),
                      Text(
                        "Waktu: $time",
                        style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 12,
                            fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotesCard(AttendanceDetail detail) {
    String displayNote = (detail.notes == null || detail.notes!.isEmpty)
        ? "Tidak ada catatan"
        : detail.notes!;
    return Card(
      elevation: 2,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.notes, color: Colors.blueAccent.shade400),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Keterangan",
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    displayNote,
                    style: TextStyle(
                      color: (detail.notes == null || detail.notes!.isEmpty)
                          ? Colors.grey.shade500
                          : Colors.black87,
                      fontStyle: (detail.notes == null || detail.notes!.isEmpty)
                          ? FontStyle.italic
                          : FontStyle.normal,
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget _buildBottomSummarySection(AttendanceDetail detail) {
  //   return Column(
  //     crossAxisAlignment: CrossAxisAlignment.start,
  //     children: [
  //       const Text(
  //         "Ringkasan",
  //         style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
  //       ),
  //       const SizedBox(height: 12),
  //       Row(
  //         children: [
  //           Expanded(
  //             child: _buildSummaryItem("Status", detail.status,
  //                 Icons.check_circle_outline, _getStatusColor(detail.status)),
  //           ),
  //           const SizedBox(width: 16),
  //           Expanded(
  //             child: _buildSummaryItem("Durasi Kerja", detail.totalDuration,
  //                 Icons.timer_outlined, Colors.green),
  //           ),
  //         ],
  //       ),
  //     ],
  //   );
  // }

  // Widget _buildSummaryItem(
  //     String label, String value, IconData icon, Color color) {
  //   return Card(
  //     elevation: 1,
  //     shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
  //     child: Padding(
  //       padding: const EdgeInsets.all(16.0),
  //       child: Column(
  //         crossAxisAlignment: CrossAxisAlignment.start,
  //         children: [
  //           Icon(icon, color: color, size: 28),
  //           const SizedBox(height: 8),
  //           Text(value,
  //               style:
  //                   const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
  //           Text(label, style: TextStyle(color: Colors.grey.shade600)),
  //         ],
  //       ),
  //     ),
  //   );
  // }
}
