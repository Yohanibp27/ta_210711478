import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:presensi_app/models/shift_exchange_activity.dart';
import 'package:presensi_app/services/auth_service.dart';

class ShiftExchangeDetail {
  final int id;
  final String status;
  final String reason;
  final String? partnerDecision;
  final String? managerDecision;
  final String? sdmDecision;
  // final String expiryDate;
  // final String createdAt;
  final String? expiryDate;
  final String? createdAt;

  final String requesterName;
  final String requesterNip;
  final String requestPosition;
  final String? requesterPhoto;

  final String partnerName;
  final String partnerNip;
  final String partnerPostion;
  final String? partnerPhoto;

  final String requesterShiftName;
  final String requesterShiftTime;
  final String requesterShiftDate;

  final String partnerShiftName;
  final String partnerShiftTime;
  final String partnerShiftDate;

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
    required this.partnerDecision,
    required this.managerDecision,
    required this.sdmDecision,
    required this.expiryDate,
    required this.createdAt,
    required this.requesterName,
    required this.requesterNip,
    required this.requestPosition,
    required this.requesterPhoto,
    required this.partnerName,
    required this.partnerNip,
    required this.partnerPostion,
    required this.partnerPhoto,
    required this.requesterShiftName,
    required this.requesterShiftTime,
    required this.requesterShiftDate,
    required this.partnerShiftName,
    required this.partnerShiftTime,
    required this.partnerShiftDate,
    this.managerName,
    this.sdmName,
    this.partnerDecisionAt,
    this.managerDecisionAt,
    this.sdmDecisionAt,
    required this.partnerStatus,
    required this.managerStatus,
    required this.sdmStatus,
  });
}

class ShiftExchangeDetailPage extends StatefulWidget {
  final ShiftExchangeDetail detail;
  const ShiftExchangeDetailPage({super.key, required this.detail});

  @override
  State<ShiftExchangeDetailPage> createState() =>
      _ShiftExchangeDetailPageState();
}

class _ShiftExchangeDetailPageState extends State<ShiftExchangeDetailPage> {
  bool isLoadingCancel = false;
  String currentStatus = "";
  String? myNip;

  @override
  void initState() {
    super.initState();
    currentStatus = widget.detail.status;

    // print("REQUESTER SHIFT DATE: ${widget.detail.requesterShiftDate}");
    // print("PARTNER SHIFT DATE: ${widget.detail.partnerShiftDate}");
    // print("CREATED AT: ${widget.detail.createdAt}");
    _checkCurrentUser();
  }

  Future<void> _checkCurrentUser() async {
    final token = await AuthService().getToken();
    if (token != null) {
      try {
        final userData = await AuthService().stayLoggedIn(token);
        setState(() {
          // Ambil NIP dari hasil response stayLoggedIn
          // Sesuaikan dengan struktur JSON response kamu, misal: userData['data']['nip']
          myNip = userData['data']['nip'];
        });
      } catch (e) {
        print("Gagal mengambil session: $e");
      }
    }
  }

  // String formatDate(String? dateStr) {
  //   if (dateStr == null) return "-";
  //   DateTime date = DateTime.parse(dateStr);
  //   return DateFormat('dd MMM yyyy, HH.mm').format(date);
  // }

  String formatDate(String? dateStr) {
    if (dateStr == null || dateStr.trim().isEmpty || dateStr == "-") {
      return "-";
    }
    try {
      DateTime date = DateTime.parse(dateStr);
      return DateFormat('dd MMM yyyy, HH.mm').format(date);
    } catch (e) {
      return "-";
    }
  }

  String _getMainStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return "Menunggu Persetujuan";
      case 'rejected':
        return "DITOLAK";
      case 'cancelled':
        return "DIBATALKAN";
      case 'accepted':
        return "DISETUJUI";
      default:
        return status;
    }
  }

  String _getTimelineStatusText(String role, String status, String? reason) {
    final s = status.toLowerCase();
    if (s == 'pending') return "Menunggu persetujuan";
    if (s == 'rejected')
      return reason ?? "Ditolak"; // Tampilkan alasan jika ada

    if (s == 'accepted') {
      if (role == 'PARTNER') return "Bersedia bertukar shift";
      if (role == 'MANAGER') return "Disetujui, tidak ada konflik jadwal";
      if (role == 'SDM') return "Disetujui dan telah diperbarui di sistem";
    }
    return status;
  }

  @override
  Widget build(BuildContext context) {
    // final status = widget.detail.status ?? "pending";
    final status = currentStatus;
    final isDitolak = status == 'rejected';
    final bool canCancel = status.toLowerCase() == 'pending';
    final displayStatus = _getMainStatusText(currentStatus);
    return Scaffold(
        backgroundColor: Colors.grey[100],
        appBar: AppBar(
          title: const Text('Detail Pertukaran Shift',
              style:
                  TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          backgroundColor: Color(0xFF6F34FA),
        ),
        // bottomNavigationBar: canCancel ? _buildBottomAction(context) : null,
        bottomNavigationBar: _buildBottomAction(context),
        body: Stack(
          children: [
            Container(
              height: 120,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0xFF6F34FA), Color(0xFF8E5CFC)]),
              ),
            ),
            SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  // _buildStatusHeader(status),
                  _buildStatusHeader(displayStatus),
                  const SizedBox(height: 16),
                  _buildExchangeDetails(),
                  const SizedBox(height: 16),
                  _buildInvolvedParties(),
                  const SizedBox(height: 16),
                  _buildReasonSection(),
                  const SizedBox(height: 16),
                  _buildApprovalHistory(),
                ],
              ),
            ),
          ],
        ));
  }

  // Widget _buildStatusHeader(String status) {
  //   bool isApproved = status == 'approved';
  //   bool isRejected = status == 'rejected';
  //   bool isPending = status == 'pending';
  //   bool isCancelled = status == "cancelled";
  //   Color bgColor;
  //   Color circleColor;
  //   Color textColor;
  //   IconData icon;
  //   if (isCancelled) {
  //     bgColor = const Color(0xFFF8F9FA);
  //     circleColor = const Color(0xFFE4E7EC);
  //     textColor = const Color(0xFF667085);
  //     icon = Icons.cancel_outlined;
  //   } else if (isRejected) {
  //     bgColor = const Color(0xFFFFF5F5);
  //     circleColor = const Color(0xFFFED7D7);
  //     textColor = const Color(0xFFE53E3E);
  //     icon = Icons.close;
  //   } else if (isApproved) {
  //     bgColor = const Color(0xFFF0FFF4);
  //     circleColor = const Color(0xFFC6F6D5);
  //     textColor = const Color(0xFF38A169);
  //     icon = Icons.check;
  //   } else {
  //     bgColor = const Color(0xFFFFFAF0);
  //     circleColor = const Color(0xFFFEEBC8);
  //     textColor = const Color(0xFFD69E2E);
  //     icon = Icons.access_time;
  //   }
  //   return Container(
  //     width: double.infinity,
  //     padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
  //     decoration: BoxDecoration(
  //       color: bgColor,
  //       borderRadius: BorderRadius.circular(16),
  //     ),
  //     child: Column(
  //       children: [
  //         CircleAvatar(
  //           backgroundColor: circleColor,
  //           child: Icon(icon, color: textColor),
  //         ),
  //         const SizedBox(height: 12),
  //         Container(
  //           padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
  //           decoration: BoxDecoration(
  //             color: circleColor,
  //             borderRadius: BorderRadius.circular(20),
  //           ),
  //           child: Text(
  //             status,
  //             style: TextStyle(
  //               color: textColor,
  //               fontWeight: FontWeight.bold,
  //             ),
  //           ),
  //         ),
  //         const SizedBox(height: 12),
  //         Text(
  //           isCancelled
  //               ? 'Permintaan pertukaran shift telah dibatalkan oleh pengaju'
  //               : isRejected
  //                   ? 'Permintaan pertukaran shift tidak dapat disetujui'
  //                   : (isApproved
  //                       ? 'Pertukaran shift telah disetujui dan jadwal telah diperbarui'
  //                       : 'Permintaan pertukaran shift sedang dalam proses persetujuan'),
  //           textAlign: TextAlign.center,
  //           style: const TextStyle(
  //               color: Color(0xFF2D3748), fontWeight: FontWeight.w500),
  //         ),
  //         const SizedBox(height: 8),
  //         Text(
  //           'Diajukan: ${formatDate(widget.detail.createdAt)}',
  //           style: const TextStyle(color: Colors.grey, fontSize: 12),
  //         ),
  //       ],
  //     ),
  //   );
  // }

  Widget _buildStatusHeader(String displayLabel) {
    // displayLabel adalah "DIBATALKAN"
    // Gunakan currentStatus (data asli dari backend) untuk logika warna
    final statusRaw = currentStatus.toLowerCase();

    bool isApproved = statusRaw == 'approved';
    bool isRejected = statusRaw == 'rejected';
    bool isCancelled = statusRaw == 'cancelled';

    Color bgColor;
    Color circleColor;
    Color textColor;
    IconData icon;

    if (isCancelled) {
      bgColor = const Color(0xFFF8F9FA);
      circleColor = const Color(0xFFE4E7EC);
      textColor = const Color(0xFF667085);
      icon = Icons.cancel_outlined;
    } else if (isRejected) {
      bgColor = const Color(0xFFFFF5F5);
      circleColor = const Color(0xFFFED7D7);
      textColor = const Color(0xFFE53E3E);
      icon = Icons.close;
    } else if (isApproved) {
      bgColor = const Color(0xFFF0FFF4);
      circleColor = const Color(0xFFC6F6D5);
      textColor = const Color(0xFF38A169);
      icon = Icons.check;
    } else {
      bgColor = const Color(0xFFFFFAF0);
      circleColor = const Color(0xFFFEEBC8);
      textColor = const Color(0xFFD69E2E);
      icon = Icons.access_time;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          CircleAvatar(
            backgroundColor: circleColor,
            child: Icon(icon, color: textColor),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: circleColor,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              displayLabel,
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            isCancelled
                ? 'Permintaan pertukaran shift telah dibatalkan oleh pengaju'
                : isRejected
                    ? 'Permintaan pertukaran shift tidak dapat disetujui'
                    : (isApproved
                        ? 'Pertukaran shift telah disetujui dan jadwal telah diperbarui'
                        : 'Permintaan pertukaran shift sedang dalam proses persetujuan'),
            textAlign: TextAlign.center,
            style: const TextStyle(
                color: Color(0xFF2D3748), fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          Text(
            'Diajukan: ${formatDate(widget.detail.createdAt)}',
            style: const TextStyle(color: Colors.grey, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildExchangeDetails() {
    return _buildCard(
      title: 'Detail Pertukaran',
      child: Column(
        children: [
          _buildShiftBox(
            label: 'SHIFT ANDA (DIBERIKAN KE REKAN)',
            date: formatDate(widget.detail.requesterShiftDate),
            time: widget.detail.requesterShiftTime,
            // location: 'IGD Lantai 1',
            typeLabel: widget.detail.requesterShiftName,
            typeColor: const Color(0xFFEBF4FF),
            textColor: const Color(0xFF3182CE),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8.0),
            child: Icon(Icons.swap_vert, color: Color(0xFF667EEA)),
          ),
          _buildShiftBox(
            label: 'SHIFT REKAN (ANDA DAPATKAN)',
            date: formatDate(widget.detail.partnerShiftDate),
            time: widget.detail.partnerShiftTime,
            // location: 'IGD Lantai 1',
            typeLabel: widget.detail.partnerShiftName,
            typeColor: const Color(0xFFE6FFFA),
            textColor: const Color(0xFF38A169),
          ),
        ],
      ),
    );
  }

  Widget _buildInvolvedParties() {
    return _buildCard(
      title: 'Pihak yang Terlibat',
      child: Column(
        children: [
          _buildPersonTile(
            widget.detail.requesterName,
            widget.detail.requestPosition,
            'NIP: ${widget.detail.requesterNip}',
            'Pengaju',
            const Color(0xFFEBF4FF),
            const Color(0xFF3182CE),
            widget.detail.requesterPhoto,
          ),
          const SizedBox(height: 12),
          _buildPersonTile(
            widget.detail.partnerName,
            widget.detail.partnerPostion,
            'NIP: ${widget.detail.partnerNip}',
            'Rekan Tukar',
            const Color(0xFFFAF5FF),
            const Color(0xFF805AD5),
            widget.detail.partnerPhoto,
          ),
        ],
      ),
    );
  }

  Widget _buildReasonSection() {
    return _buildCard(
      title: 'Alasan Pertukaran',
      child: Text(
        widget.detail.reason,
        style: TextStyle(color: Colors.black54, height: 1.5),
      ),
    );
  }

  Widget _buildApprovalHistory() {
    return _buildCard(
      title: 'Riwayat Persetujuan',
      child: Column(
        children: [
          _buildTimelineItem(
            'Persetujuan Rekan',
            widget.detail.partnerName ?? "Belum diproses",
            // widget.detail.partnerStatus,
            _getTimelineStatusText('PARTNER', widget.detail.partnerStatus,
                widget.detail.partnerDecision),
            // formatDate(widget.detail.partnerDecisionAt),
            formatDate(widget.detail.partnerDecisionAt),
            true,
            note: widget.detail.partnerDecision,
          ),
          _buildTimelineItem(
              'Kepala Ruangan',
              widget.detail.managerName ?? 'Belum diproses',
              // widget.detail.managerStatus,
              _getTimelineStatusText('MANAGER', widget.detail.managerStatus,
                  widget.detail.managerDecision),
              formatDate(widget.detail.managerDecisionAt),
              note: widget.detail.managerDecision,
              true),
          _buildTimelineItem(
            'SDM',
            widget.detail.sdmName ?? 'Belum diproses',
            // widget.detail.sdmStatus,
            _getTimelineStatusText(
                'SDM', widget.detail.sdmStatus, widget.detail.sdmDecision),
            formatDate(widget.detail.sdmDecisionAt),
            false,
            note: widget.detail.sdmDecision,
          )
        ],
      ),
    );
  }

  Widget _buildTimelineItem(
      String title, String name, String status, String time, bool showLine,
      {String? note}) {
    Color statusColor = status == 'approved'
        ? const Color(0xFF38A169)
        : (status == 'rejected'
            ? Colors.red
            : status == 'pending'
                ? Colors.orange
                : Colors.grey);
    IconData statusIcon = status == 'approved'
        ? Icons.check_circle
        : (status == 'rejected' ? Icons.cancel : Icons.history);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Icon(statusIcon, color: statusColor.withOpacity(0.5), size: 24),
            if (showLine)
              Container(width: 2, height: 60, color: Colors.grey[200]),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(title,
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text(time == "-" ? "" : time,
                      style: const TextStyle(color: Colors.grey, fontSize: 11)),
                ],
              ),
              const SizedBox(height: 2),
              Text(name,
                  style: const TextStyle(color: Colors.grey, fontSize: 13)),
              const SizedBox(height: 2),
              Text(status,
                  style: TextStyle(
                      color: statusColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w500)),
              if (status == 'rejected' && note != null)
                Container(
                  margin: const EdgeInsets.only(top: 8),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                      color: Colors.red[50],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red[100]!)),
                  child: Text(
                    "Alasan Ditolak: $note",
                    style: const TextStyle(
                        color: Colors.red,
                        fontSize: 12,
                        fontStyle: FontStyle.italic),
                  ),
                )
              // else if (note != null && note.isNotEmpty)
              //   Padding(
              //     padding: const EdgeInsets.only(top: 4),
              //     child: Text("Catatan: $note",
              //         style:
              //             const TextStyle(color: Colors.black54, fontSize: 12)),
              //   ),
              // const SizedBox(height: 16),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildShiftBox({
    required String label,
    required String date,
    required String time,
    // required String location,
    required String typeLabel,
    required Color typeColor,
    required Color textColor,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: typeColor.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: typeColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey)),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(date,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 15)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                    color: typeColor, borderRadius: BorderRadius.circular(12)),
                child: Text(typeLabel,
                    style: TextStyle(
                        color: textColor,
                        fontSize: 12,
                        fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.access_time, size: 16, color: Color(0xFF667EEA)),
              const SizedBox(width: 4),
              Text(time, style: const TextStyle(color: Colors.black54)),
              // const SizedBox(width: 16),
              // const Icon(Icons.location_on_outlined,
              //     size: 16, color: Color(0xFF667EEA)),
              // const SizedBox(width: 4),
              // Text(location, style: const TextStyle(color: Colors.black54)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPersonTile(
    String name,
    String role,
    String id,
    String badge,
    Color badgeColor,
    Color badgeTextColor,
    String? photoUrl,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: badgeColor.withOpacity(0.2),
          borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(1),
            decoration: const BoxDecoration(
              color: Colors.black12,
              shape: BoxShape.circle,
            ),
            child: CircleAvatar(
              radius: 20,
              backgroundColor: Colors.grey[200],
              backgroundImage: (photoUrl != null && photoUrl.isNotEmpty)
                  ? NetworkImage(photoUrl)
                  : const AssetImage('assets/default_profile.png')
                      as ImageProvider,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Text(role,
                    style: const TextStyle(color: Colors.grey, fontSize: 12)),
                const SizedBox(height: 2),
                Text(id,
                    style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
                color: badgeColor, borderRadius: BorderRadius.circular(8)),
            child: Text(badge,
                style: TextStyle(
                    color: badgeTextColor,
                    fontSize: 12,
                    fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildCard({required String title, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style:
                  const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  // void _showCancelConfirm(BuildContext context) {
  //   showDialog(
  //     context: context,
  //     builder: (BuildContext context) {
  //       return AlertDialog(
  //         shape:
  //             RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
  //         title: const Text("Batalkan Permintaan?"),
  //         content: const Text(
  //           "Apakah Anda yakin ingin membatalkan permintaan pertukaran shift ini? Tindakan ini tidak dapat dibatalkan.",
  //           style: TextStyle(color: Colors.black54),
  //         ),
  //         actions: [
  //           TextButton(
  //             onPressed: () => Navigator.pop(context),
  //             child:
  //                 const Text("Kembali", style: TextStyle(color: Colors.grey)),
  //           ),
  //           ElevatedButton(
  //             onPressed: () {
  //               // Implementasikan logic API pembatalan di sini
  //               Navigator.pop(context); // Tutup dialog
  //               // Navigator.pop(context); // Kembali ke halaman sebelumnya jika perlu
  //               ScaffoldMessenger.of(context).showSnackBar(
  //                 const SnackBar(
  //                     content: Text("Permintaan berhasil dibatalkan")),
  //               );
  //             },
  //             style: ElevatedButton.styleFrom(
  //               backgroundColor: Colors.redAccent,
  //               shape: RoundedRectangleBorder(
  //                   borderRadius: BorderRadius.circular(8)),
  //             ),
  //             child: const Text("Ya, Batalkan",
  //                 style: TextStyle(color: Colors.white)),
  //           ),
  //         ],
  //       );
  //     },
  //   );
  // }

  // Widget _buildBottomAction(BuildContext context) {
  // return Container(
  //   padding: const EdgeInsets.all(16),
  //   decoration: BoxDecoration(
  //     color: Colors.white,
  //     boxShadow: [
  //       BoxShadow(
  //         color: Colors.black.withOpacity(0.05),
  //         offset: const Offset(0, -4),
  //         blurRadius: 10,
  //       ),
  //     ],
  //   ),
  //   child: SafeArea(
  //     child: SizedBox(
  //       width: double.infinity,
  //       height: 50,
  //       child: ElevatedButton.icon(
  //         onPressed: () => _showCancelConfirm(context),
  //         icon: const Icon(Icons.cancel_outlined, color: Colors.white),
  //         label: const Text(
  //           "Batalkan Permintaan",
  //           style: TextStyle(
  //             color: Colors.white,
  //             fontWeight: FontWeight.bold,
  //             letterSpacing: 1.1,
  //           ),
  //         ),
  //         style: ElevatedButton.styleFrom(
  //           // backgroundColor: Colors.redAccent,
  //           backgroundColor: const Color(0xFFF04438),
  //           shape: RoundedRectangleBorder(
  //             borderRadius: BorderRadius.circular(12),
  //           ),
  //           elevation: 0,
  //         ),
  //       ),
  //     ),
  //   ),
  // );
  // }

  void _showCancelConfirm(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: const BoxDecoration(
                  color: Color(0xFFFEEBED),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  // Icons.dangerous,
                  Icons.info_outline,
                  color: Color(0xFFF04438),
                  size: 40,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                "Batalkan Permintaan??",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                  color: Color(0xFF333333),
                ),
              ),
              const SizedBox(height: 16),
              const Center(
                child: Text(
                  "Permintaan pertukaran shift ini akan dibatalkan",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15,
                    color: Color(0xFF667085),
                    height: 1.4,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  "Tindakan ini tidak dapat diurungkan",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        side: BorderSide(color: Colors.grey.shade300),
                      ),
                      child: const Text(
                        "Tidak",
                        style: TextStyle(
                          color: Color(0xFF4B4B4B),
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () async {
                        Navigator.pop(context);
                        final result = await AuthService().cancelShiftExchange(
                          widget.detail.id,
                        );
                        if (result["success"]) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(result["message"]),
                              backgroundColor: Colors.green,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                          setState(() {
                            currentStatus = "cancelled";
                          });
                          Navigator.pop(context);
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(result["message"]),
                              backgroundColor: Colors.red,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF04438),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        "Ya, Batalkan",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomAction(BuildContext context) {
    // 1. Cek apakah user yang login adalah pengaju asli
    final bool isRequester = widget.detail.requesterNip == myNip;

    // 2. Jika BUKAN pengaju, jangan tampilkan apa-apa di bawah (SizedBox.shrink)
    // Ini akan menghilangkan button "Dibatalkan" di layar Partner
    if (!isRequester) return const SizedBox.shrink();

    final bool isCancelled = currentStatus.toLowerCase() == 'cancelled';
    final bool isPending = currentStatus.toLowerCase() == 'pending';
    // Jika status sudah diproses (misal approved/rejected) dan bukan pending/cancelled,
    // mungkin kamu ingin return SizedBox.shrink() agar tidak muncul bar bawah sama sekali.
    if (!isPending && !isCancelled) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, -4),
            blurRadius: 10,
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          height: 50,
          child: isCancelled
              ? _buildCancelledLabel() // Muncul hanya di layar Pengaju jika sudah batal
              : _buildCancelButton(
                  context), // Muncul hanya di layar Pengaju jika masih pending
        ),
      ),
    );
  }

  Widget _buildCancelledLabel() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFEEBED),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Center(
        child: Text(
          // _getMainStatusText("cancelled"),
          "Permintaan ini telah dibatalkan",
          style: TextStyle(
            color: const Color(0xFFF04438),
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
      ),
    );
  }

  Widget _buildCancelButton(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: () => _showCancelConfirm(context),
      icon: const Icon(Icons.cancel_outlined, color: Colors.white),
      label: const Text(
        "Batalkan Permintaan",
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.1,
        ),
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFF04438),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        elevation: 0,
      ),
    );
  }
}
