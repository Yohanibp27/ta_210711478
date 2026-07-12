class ShiftExchangeDetail {
  final int id;
  final String status;
  final String reason;
  final String? decisionNote;
  final String expiryDate;
  final String createdAt;

  final String? requester;
  final String? partner;
  final String? requesterNip;
  final String? partnerNip;

  // final dynamic requesterShift;
  // final dynamic partnerShift;
  final Map<String, dynamic>? requesterShift;
  final Map<String, dynamic>? partnerShift;

  final String? managerName;
  final String? sdmName;

  final String? partnerDecisionAt;
  final String? managerDecisionAt;
  final String? sdmDecisionAt;

  final String partnerStatus;
  final String managerStatus;
  final String sdmStatus;

  ShiftExchangeDetail({
    required this.id,
    required this.status,
    required this.reason,
    this.decisionNote,
    required this.expiryDate,
    required this.createdAt,
    required this.requester,
    required this.partner,
    required this.requesterNip,
    required this.partnerNip,
    required this.requesterShift,
    required this.partnerShift,
    this.managerName,
    this.sdmName,
    this.partnerDecisionAt,
    this.managerDecisionAt,
    this.sdmDecisionAt,
    required this.partnerStatus,
    required this.managerStatus,
    required this.sdmStatus,
  });

  // TAMBAHKAN FACTORY INI
  factory ShiftExchangeDetail.fromJson(Map<String, dynamic> json) {
    final requesterObj = json['requester'];
    final partnerObj = json['partner'];
    final managerObj = json['manager'];
    final sdmObj = json['sdm'];

    return ShiftExchangeDetail(
      id: json["id"] ?? 0,
      status: json["status"] ?? "-",
      reason: json["reason"] ?? "-",
      decisionNote: json["decisionNote"],
      expiryDate: json["expiryDate"] ?? "-",
      createdAt: json["createdAt"] ?? "-",
      requester: requesterObj != null ? requesterObj['fullName'] : "-",
      partner: partnerObj != null ? partnerObj['fullName'] : "-",
      requesterNip: requesterObj != null ? requesterObj['nip'] : "-",
      partnerNip: partnerObj != null ? partnerObj['nip'] : "-",
      // Ambil utuh sebagai Map/Object untuk requesterShift & partnerShift
      requesterShift: json['requesterShift'],
      partnerShift: json['partnerShift'],
      managerName: managerObj != null ? managerObj['fullName'] : "-",
      sdmName: sdmObj != null ? sdmObj['fullName'] : "-",
      partnerDecisionAt: json["partnerDecisionAt"],
      managerDecisionAt: json["managerDecisionAt"],
      sdmDecisionAt: json["sdmDecisionAt"],
      partnerStatus: json["partnerStatus"] ?? "Pending",
      managerStatus: json["managerStatus"] ?? "-",
      sdmStatus: json["sdmStatus"] ?? "-",
    );
  }
}

class ShiftChangeRequestDetail {
  final int id;
  final String requesterName;
  final String requesterRole;
  final String requesterUnit;
  final String requesterEmployeeId;
  final String requesterAvatar;

  final ShiftInfo givenShift;
  final ShiftInfo receivedShift;

  final String reason;
  final DateTime createdAt;
  final String status;

  ShiftChangeRequestDetail({
    required this.id,
    required this.requesterName,
    required this.requesterRole,
    required this.requesterUnit,
    required this.requesterEmployeeId,
    required this.requesterAvatar,
    required this.givenShift,
    required this.receivedShift,
    required this.reason,
    required this.createdAt,
    required this.status,
  });

  factory ShiftChangeRequestDetail.fromJson(Map<String, dynamic> json) {
    final requester = json['requester'];
    final partner = json['partner'];
    final requesterShift = json['requesterShift'];
    final partnerShift = json['partnerShift'];

    return ShiftChangeRequestDetail(
      id: json['id'] ?? 0,
      requesterName: requester?['fullName'] ?? '-',
      requesterRole: requester?['profession']?['name'] ?? '-',
      requesterUnit: requester?['position']?['name'] ?? '-',
      requesterEmployeeId: requester?['nip'] ?? '-',
      requesterAvatar: requester?['profilePhoto'] ?? '',
      givenShift: ShiftInfo(
        day: requesterShift?['shiftDetail']?['name'] ?? '-',
        date: requesterShift?['date'] ?? '-',
        time:
            "${requesterShift?['shiftDetail']?['startTime'] ?? '-'} - ${requesterShift?['shiftDetail']?['endTime'] ?? '-'}",
        location: 'IGD', // kalau tidak ada di API
        type: requesterShift?['shiftDetail']?['name'] ?? '-',
      ),
      receivedShift: ShiftInfo(
        day: partnerShift?['shiftDetail']?['name'] ?? '-',
        date: partnerShift?['date'] ?? '-',
        time:
            "${partnerShift?['shiftDetail']?['startTime'] ?? '-'} - ${partnerShift?['shiftDetail']?['endTime'] ?? '-'}",
        location: 'IGD',
        type: partnerShift?['shiftDetail']?['name'] ?? '-',
      ),
      reason: json['reason'] ?? '-',
      createdAt: DateTime.parse(json['createdAt']),
      status: json['status'] ?? 'Pending',
    );
  }
}

class ShiftInfo {
  final String day;
  final String date;
  final String time;
  final String location;
  final String type;

  ShiftInfo({
    required this.day,
    required this.date,
    required this.time,
    required this.location,
    required this.type,
  });
}

  // void _showRejectDialog() {
  //   if (selectedIndex == null) {
  //     ScaffoldMessenger.of(context).showSnackBar(
  //       const SnackBar(
  //           content: Text("Pilih karyawan partner terlebih dahulu!")),
  //     );
  //     return;
  //   }
  //   showDialog(
  //     context: context,
  //     barrierDismissible: false, // User tidak bisa tap di luar untuk menutup
  //     builder: (context) => Dialog(
  //       shape: RoundedRectangleBorder(
  //         borderRadius: BorderRadius.circular(20),
  //       ),
  //       child: Padding(
  //         padding: const EdgeInsets.all(24.0),
  //         child: Column(
  //           mainAxisSize: MainAxisSize.min,
  //           children: [
  //             Container(
  //               width: 70,
  //               height: 70,
  //               decoration: BoxDecoration(
  //                 color: Colors.yellow.shade100,
  //                 shape: BoxShape.circle,
  //               ),
  //               child: const Icon(
  //                 // Icons.help_outline,
  //                 Icons.check_outlined,
  //                 color: Colors.green,
  //                 size: 30,
  //               ),
  //             ),
  //             const SizedBox(height: 16),
  //             const Text(
  //               "Tolak Permintaan?",
  //               textAlign: TextAlign.center,
  //               style: TextStyle(
  //                 fontWeight: FontWeight.bold,
  //                 fontSize: 18,
  //               ),
  //             ),
  //             const SizedBox(height: 12),
  //             const Text(
  //               "Berikan alasan penolakan agar pemohon dapat memahami keputusan Anda",
  //               textAlign: TextAlign.center,
  //               style: TextStyle(
  //                 fontSize: 14,
  //                 color: Colors.black54,
  //               ),
  //             ),
  //             const SizedBox(height: 12),
  //             // Title Alasan Penolakan *
  //             const Text(
  //               "Contoh: Saya tidak bisa bertukara karena sudah ada keperluan lain...",
  //               textAlign: TextAlign.center,
  //               style: TextStyle(
  //                 fontSize: 14,
  //                 color: Colors.black54,
  //               ),
  //             ),
  //             // 0/200
  //             const SizedBox(height: 24),
  //             Row(
  //               children: [
  //                 Expanded(
  //                   child: OutlinedButton(
  //                     onPressed: () {
  //                       Navigator.pop(context);
  //                     },
  //                     style: OutlinedButton.styleFrom(
  //                       padding: const EdgeInsets.symmetric(vertical: 14),
  //                       shape: RoundedRectangleBorder(
  //                         borderRadius: BorderRadius.circular(10),
  //                       ),
  //                       side: const BorderSide(color: Colors.grey),
  //                     ),
  //                     child: const Text(
  //                       "Batal",
  //                       style: TextStyle(color: Colors.black),
  //                     ),
  //                   ),
  //                 ),
  //                 const SizedBox(width: 12),
  //                 Expanded(
  //                   child: ElevatedButton(
  //                     onPressed: () {
  //                       Navigator.pop(context);
  //                       _onSubmitPressed();
  //                     },
  //                     style: ElevatedButton.styleFrom(
  //                       backgroundColor: Colors.red,
  //                       foregroundColor: Colors.white,
  //                       padding: const EdgeInsets.symmetric(vertical: 14),
  //                       shape: RoundedRectangleBorder(
  //                         borderRadius: BorderRadius.circular(10),
  //                       ),
  //                     ),
  //                     child: const Text("Tolak"),
  //                   ),
  //                 ),
  //               ],
  //             ),
  //           ],
  //         ),
  //       ),
  //     ),
  //   );
  // }

  // void _showConfirmDialog() {
  //   if (selectedIndex == null) {
  //     ScaffoldMessenger.of(context).showSnackBar(
  //       const SnackBar(
  //           content: Text("Pilih karyawan partner terlebih dahulu!")),
  //     );
  //     return;
  //   }
  //   showDialog(
  //     context: context,
  //     barrierDismissible: false, // User tidak bisa tap di luar untuk menutup
  //     builder: (context) => Dialog(
  //       shape: RoundedRectangleBorder(
  //         borderRadius: BorderRadius.circular(20),
  //       ),
  //       child: Padding(
  //         padding: const EdgeInsets.all(24.0),
  //         child: Column(
  //           mainAxisSize: MainAxisSize.min,
  //           children: [
  //             Container(
  //               width: 70,
  //               height: 70,
  //               decoration: BoxDecoration(
  //                 color: Colors.yellow.shade100,
  //                 shape: BoxShape.circle,
  //               ),
  //               child: const Icon(
  //                 // Icons.help_outline,
  //                 Icons.check_outlined,
  //                 color: Colors.green,
  //                 size: 30,
  //               ),
  //             ),
  //             const SizedBox(height: 16),
  //             const Text(
  //               "Setujui Pertukaran",
  //               textAlign: TextAlign.center,
  //               style: TextStyle(
  //                 fontWeight: FontWeight.bold,
  //                 fontSize: 18,
  //               ),
  //             ),
  //             const SizedBox(height: 12),
  //             const Text(
  //               "Anda akan menyerahkan Shift Pagi Sabtu kepada Ahmad Rizki, dan mendapatkan Shift Malam Senin sebagai gantinya",
  //               textAlign: TextAlign.center,
  //               style: TextStyle(
  //                 fontSize: 14,
  //                 color: Colors.black54,
  //               ),
  //             ),
  //             const SizedBox(height: 12),
  //             const Text(
  //               "Setelah disetujui, permintaan akan diterukan ke Kepala Ruangan",
  //               textAlign: TextAlign.center,
  //               style: TextStyle(
  //                 fontSize: 14,
  //                 color: Colors.black54,
  //               ),
  //             ),
  //             const SizedBox(height: 24),
  //             Row(
  //               children: [
  //                 Expanded(
  //                   child: OutlinedButton(
  //                     onPressed: () {
  //                       Navigator.pop(context);
  //                     },
  //                     style: OutlinedButton.styleFrom(
  //                       padding: const EdgeInsets.symmetric(vertical: 14),
  //                       shape: RoundedRectangleBorder(
  //                         borderRadius: BorderRadius.circular(10),
  //                       ),
  //                       side: const BorderSide(color: Colors.grey),
  //                     ),
  //                     child: const Text(
  //                       "Batal",
  //                       style: TextStyle(color: Colors.black),
  //                     ),
  //                   ),
  //                 ),
  //                 const SizedBox(width: 12),
  //                 Expanded(
  //                   child: ElevatedButton(
  //                     onPressed: () {
  //                       Navigator.pop(context);
  //                       _onSubmitPressed();
  //                     },
  //                     style: ElevatedButton.styleFrom(
  //                       backgroundColor: const Color(0xFF5E54F3),
  //                       foregroundColor: Colors.white,
  //                       padding: const EdgeInsets.symmetric(vertical: 14),
  //                       shape: RoundedRectangleBorder(
  //                         borderRadius: BorderRadius.circular(10),
  //                       ),
  //                     ),
  //                     child: const Text("Ya, Lanjutkan"),
  //                   ),
  //                 ),
  //               ],
  //             ),
  //           ],
  //         ),
  //       ),
  //     ),
  //   );
  // }

  // void _showSuccessDialog() {
  //   showDialog(
  //     context: context,
  //     barrierDismissible: false,
  //     builder: (BuildContext dialogContext) {
  //       return WillPopScope(
  //         onWillPop: () async => false,
  //         child: Dialog(
  //           shape: RoundedRectangleBorder(
  //             borderRadius: BorderRadius.circular(20),
  //           ),
  //           child: Padding(
  //             padding: const EdgeInsets.all(24.0),
  //             child: Column(
  //               mainAxisSize: MainAxisSize.min,
  //               children: [
  //                 // 1. Icon Check bertumpuk (Soft Green)
  //                 Container(
  //                   width: 80,
  //                   height: 80,
  //                   decoration: const BoxDecoration(
  //                     color: Color(0xFFE7F8F0), // Hijau sangat muda
  //                     shape: BoxShape.circle,
  //                   ),
  //                   child: const Icon(
  //                     Icons.done_all_rounded,
  //                     color: Color(0xFF0F973D), // Hijau gelap
  //                     size: 40,
  //                   ),
  //                 ),
  //                 const SizedBox(height: 24),
  //                 // 2. Judul
  //                 const Text(
  //                   "Pertukaran Disetujui!",
  //                   textAlign: TextAlign.center,
  //                   style: TextStyle(
  //                     fontSize: 20,
  //                     fontWeight: FontWeight.bold,
  //                     color: Color(0xFF1D2939),
  //                   ),
  //                 ),
  //                 const SizedBox(height: 12),
  //                 // 3. Deskripsi dengan Bold Nama
  //                 const RichText(
  //                   textAlign: TextAlign.center,
  //                   text: TextSpan(
  //                     style: TextStyle(
  //                       fontSize: 14,
  //                       color: Color(0xFF667085),
  //                       height: 1.5,
  //                     ),
  //                     children: [
  //                       TextSpan(
  //                           text:
  //                               "Anda telah menyetujui pertukaran shift dengan "),
  //                       TextSpan(
  //                         text: "Ahmad Rizki",
  //                         style: TextStyle(
  //                             fontWeight: FontWeight.bold, color: Colors.black),
  //                       ),
  //                       TextSpan(text: ".\n"),
  //                       TextSpan(
  //                         text:
  //                             "Permintaan akan diteruskan ke Kepala Ruangan untuk persetujuan selanjutnya.",
  //                         style: TextStyle(fontSize: 13),
  //                       ),
  //                     ],
  //                   ),
  //                 ),
  //                 const SizedBox(height: 24),
  //                 // 4. Ringkasan Pertukaran (Card Abu-abu Muda)
  //                 Container(
  //                   padding: const EdgeInsets.all(16),
  //                   decoration: BoxDecoration(
  //                     color: const Color(0xFFF9FAFB),
  //                     borderRadius: BorderRadius.circular(12),
  //                     border: Border.all(color: const Color(0xFFEAECF0)),
  //                   ),
  //                   child: Column(
  //                     children: [
  //                       const Text(
  //                         "RINGKASAN PERTUKARAN",
  //                         style: TextStyle(
  //                           fontSize: 11,
  //                           fontWeight: FontWeight.bold,
  //                           color: Color(0xFF667085),
  //                           letterSpacing: 0.5,
  //                         ),
  //                       ),
  //                       const SizedBox(height: 12),
  //                       Row(
  //                         mainAxisAlignment: MainAxisAlignment.spaceBetween,
  //                         children: [
  //                           const Text("Shift Anda",
  //                               style: TextStyle(color: Color(0xFF667085))),
  //                           const Text(
  //                             "Sabtu, Shift Pagi",
  //                             style: TextStyle(
  //                                 fontWeight: FontWeight.bold,
  //                                 color: Color(0xFF1D2939)),
  //                           ),
  //                         ],
  //                       ),
  //                       const Padding(
  //                         padding: EdgeInsets.symmetric(vertical: 4),
  //                         child: Icon(Icons.swap_vert_rounded,
  //                             color: Color(0xFF98A2B3), size: 20),
  //                       ),
  //                       Row(
  //                         mainAxisAlignment: MainAxisAlignment.spaceBetween,
  //                         children: [
  //                           const Text("Shift Didapat",
  //                               style: TextStyle(color: Color(0xFF667085))),
  //                           const Text(
  //                             "Senin, Shift Malam",
  //                             style: TextStyle(
  //                                 fontWeight: FontWeight.bold,
  //                                 color: Color(0xFF1D2939)),
  //                           ),
  //                         ],
  //                       ),
  //                     ],
  //                   ),
  //                 ),
  //                 const SizedBox(height: 24),
  //                 // 5. Tombol Utama
  //                 SizedBox(
  //                   width: double.infinity,
  //                   height: 50,
  //                   child: ElevatedButton(
  //                     onPressed: () {
  //                       Navigator.of(dialogContext).pop();
  //                       Navigator.of(context).pop(true);
  //                     },
  //                     style: ElevatedButton.styleFrom(
  //                       backgroundColor: const Color(0xFF5E54F3),
  //                       foregroundColor: Colors.white,
  //                       elevation: 0,
  //                       shape: RoundedRectangleBorder(
  //                         borderRadius: BorderRadius.circular(12),
  //                       ),
  //                     ),
  //                     child: const Text(
  //                       "Kembali ke Aktivitas",
  //                       style: TextStyle(
  //                           fontSize: 16, fontWeight: FontWeight.bold),
  //                     ),
  //                   ),
  //                 ),
  //               ],
  //             ),
  //           ),
  //         ),
  //       );
  //     },
  //   );
  // }

  // void _showRejectedSuccessDialog() {
  //   showDialog(
  //     context: context,
  //     // Barrier tidak bisa ditap agar user terfokus pada tombol aksi
  //     barrierDismissible: false,
  //     builder: (context) => Dialog(
  //       shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
  //       child: Padding(
  //         padding: const EdgeInsets.all(24),
  //         child: Column(
  //           mainAxisSize: MainAxisSize.min,
  //           children: [
  //             // 1. Icon Silang Merah dengan Background Lingkaran (Sesuai Gambar)
  //             Container(
  //               width: 80,
  //               height: 80,
  //               decoration: const BoxDecoration(
  //                 color:
  //                     Color(0xFFFEEBED), // Warna background merah sangat muda
  //                 shape: BoxShape.circle,
  //               ),
  //               child: const Icon(
  //                 Icons.close_rounded, // Icon silang
  //                 color: Color(0xFFF04438), // Warna merah terang
  //                 size: 40,
  //               ),
  //             ),
  //             const SizedBox(height: 24),
  //             // 2. Judul "Permintaan Ditola" (Sesuai Gambar)
  //             const Text(
  //               "Permintaan Ditolak",
  //               textAlign: TextAlign.center,
  //               style: TextStyle(
  //                 fontWeight: FontWeight.bold,
  //                 fontSize: 20,
  //                 color: Color(0xFF1D2939),
  //               ),
  //             ),
  //             const SizedBox(height: 12),
  //             // 3. Deskripsi menggunakan RichText untuk menebalkan nama (Sesuai Gambar)
  //             const RichText(
  //               textAlign: TextAlign.center,
  //               text: TextSpan(
  //                 style: TextStyle(
  //                   fontSize: 15,
  //                   color: Color(0xFF667085),
  //                   height: 1.5, // Mengatur jarak antar baris
  //                 ),
  //                 children: [
  //                   TextSpan(
  //                       text:
  //                           "Anda telah menolak permintaan pertukaran shift dari "),
  //                   TextSpan(
  //                     text: "Ahmad Rizki",
  //                     style: TextStyle(
  //                       fontWeight: FontWeight.bold,
  //                       color: Color(0xFF1D2939),
  //                     ),
  //                   ),
  //                   TextSpan(
  //                       text:
  //                           ". Mereka akan mendapat notifikasi mengenai keputusan ini."),
  //                 ],
  //               ),
  //             ),
  //             const SizedBox(height: 32),
  //             // 4. Tombol Ungu "Kembali ke Aktivitas" (Sesuai Gambar)
  //             SizedBox(
  //               width: double.infinity,
  //               height: 50, // Menambah tinggi tombol
  //               child: ElevatedButton(
  //                 style: ElevatedButton.styleFrom(
  //                   // Warna ungu sesuai gambar
  //                   backgroundColor: const Color(0xFF5E54F3),
  //                   foregroundColor: Colors.white,
  //                   elevation: 0, // Matikan shadow
  //                   shape: RoundedRectangleBorder(
  //                       borderRadius: BorderRadius.circular(12)), // Radius 12
  //                 ),
  //                 onPressed: () {
  //                   // Aksi kembali, misal pop dialog dan pop halaman detail
  //                   Navigator.pop(context); // Tutup Dialog
  //                   // Navigator.pop(context); // Contoh: Kembali ke list aktivitas
  //                 },
  //                 child: const Text(
  //                   "Kembali ke Aktivitas",
  //                   style: TextStyle(
  //                     fontWeight: FontWeight.bold,
  //                     fontSize: 16,
  //                   ),
  //                 ),
  //               ),
  //             )
  //           ],
  //         ),
  //       ),
  //     ),
  //   );
  // }
