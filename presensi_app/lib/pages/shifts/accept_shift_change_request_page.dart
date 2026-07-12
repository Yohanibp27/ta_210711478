import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:presensi_app/models/shift_exchange_activity.dart';
import 'package:presensi_app/services/auth_service.dart';
import 'package:presensi_app/utils/main_navigation_page.dart';

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
  final DateTime expiryDate;
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
    required this.expiryDate,
    required this.status,
  });
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

class AcceptShiftChangeRequestPage extends StatefulWidget {
  final ShiftChangeRequestDetail detail;
  const AcceptShiftChangeRequestPage({super.key, required this.detail});

  @override
  State<AcceptShiftChangeRequestPage> createState() =>
      _ShiftChangeRequestPageState();
}

class _ShiftChangeRequestPageState extends State<AcceptShiftChangeRequestPage> {
  final AuthService _authService = AuthService();
  bool _isLoading = false;

  Future<void> _approveExchange() async {
    setState(() => _isLoading = true);
    final success = await _authService.approvePartnerShiftExchange(
      widget.detail.id,
    );

    setState(() => _isLoading = false);

    if (success) {
      _showSuccessDialog();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Gagal menyetujui pertukaran!"),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _rejectExchange(String reason) async {
    setState(() => _isLoading = true);

    final success = await _authService.rejectPartnerShiftExchange(
      exchangeId: widget.detail.id,
      reason: reason,
    );

    setState(() => _isLoading = false);

    if (success) {
      _showRejectedSuccessDialog();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Gagal menolak pertukaran!"),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  String formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('dd MMMM yyyy', 'id_ID').format(date);
    } catch (e) {
      return dateString;
    }
  }

  // DateTime createdAt;
  // DateFormat('dd MMM yyyy, HH:mm').format(widget.detail.createdAt)

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // backgroundColor: const Color(0xFFF8F9FA),
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text(
          "Permintaan Tukar Shift",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF6F34FA),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeader(widget.detail.requesterAvatar),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildShiftComparisonSection(),
                  const SizedBox(height: 16),
                  _buildImportantNoteSection(),
                  const SizedBox(height: 16),
                  _buildReasonSection(),
                  const SizedBox(height: 16),
                  _buildRequesterProfile(),
                  // const SizedBox(height: 16),
                  // _buildActionButtons(),
                  if (widget.detail.status.toLowerCase() == 'pending') ...[
                    const SizedBox(height: 16),
                    _buildActionButtons(),
                  ]
                  // const SizedBox(height: 16),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status, bool isExpired) {
    if (status == 'cancelled' || status == 'dibatalkan') {
      return _badgeItem(Icons.cancel, Colors.grey, "Dibatalkan");
    } else if (status == 'rejected' || status == 'ditolak') {
      return _badgeItem(Icons.block, Colors.red, "Ditolak");
    } else if (status == 'approved' || status == 'disetujui') {
      return _badgeItem(Icons.check_circle, Colors.blue, "Disetujui");
    } else if (isExpired) {
      return _badgeItem(Icons.alarm, Colors.red, "Kedaluwarsa");
    } else {
      return _badgeItem(Icons.schedule, Colors.green,
          "Berlaku s/d ${DateFormat('dd MMM HH:mm', 'id_ID').format(widget.detail.expiryDate)}");
    }
  }

  Widget _badgeItem(IconData icon, Color color, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(width: 4),
        Text(
          text,
          style: TextStyle(
            color: color,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildHeader(
    String? photoUrl,
  ) {
    final formattedDate =
        DateFormat('dd MMM yyyy, HH.mm').format(widget.detail.createdAt);
    bool isExpired = DateTime.now().isAfter(widget.detail.expiryDate);
    String status = widget.detail.status.toLowerCase();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF6F34FA), Color(0xFF8E5CFC)]),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
      ),
      child: Column(
        children: [
          ListTile(
            leading: CircleAvatar(
              radius: 30,
              backgroundImage: (photoUrl != null && photoUrl.isNotEmpty)
                  ? NetworkImage(photoUrl)
                  : const AssetImage('assets/default_profile.png')
                      as ImageProvider,
            ),
            title: Text(
              widget.detail.requesterName,
              style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18),
            ),
            subtitle: Text(
              "${widget.detail.requesterRole}\n${widget.detail.requesterUnit} · ${widget.detail.requesterEmployeeId}",
              style: TextStyle(color: Colors.white70),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(15),
            ),
            // child: Row(
            //   children: [
            //     const Icon(Icons.access_time, color: Colors.white, size: 20),
            //     const SizedBox(width: 8),
            //     Expanded(
            //       child: Text(
            //         "Diajukan $formattedDate",
            //         style: TextStyle(color: Colors.white),
            //       ),
            //     ),
            //     Container(
            //       padding:
            //           const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            //       decoration: BoxDecoration(
            //         color: Colors.white,
            //         borderRadius: BorderRadius.circular(20),
            //       ),
            // child: isExpired
            //     ? const Row(
            //         children: [
            //           Icon(Icons.alarm, color: Colors.red, size: 16),
            //           SizedBox(width: 4),
            //           Text("Kedaluwarsa",
            //               style: TextStyle(
            //                   color: Colors.red,
            //                   fontSize: 12,
            //                   fontWeight: FontWeight.bold)),
            //         ],
            //       )
            //     : Row(
            //         mainAxisSize: MainAxisSize.min,
            //         children: [
            //           const Icon(Icons.schedule,
            //               color: Colors.green, size: 16),
            //           const SizedBox(width: 4),
            //           Text(
            //             "Berlaku sampai ${DateFormat('dd MMM HH:mm', 'id_ID').format(widget.detail.expiryDate)}",
            //             style: const TextStyle(
            //               color: Colors.green,
            //               fontSize: 12,
            //               fontWeight: FontWeight.bold,
            //             ),
            //           ),
            //         ],
            //       ),
            //     )
            //   ],
            // ),
            child: Row(
              children: [
                const Icon(Icons.access_time, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "Diajukan $formattedDate",
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: _buildStatusBadge(status, isExpired),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildShiftComparisonSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Detail Pertukaran Shift",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          _buildShiftCard(
            label: "SHIFT ANDA — DIBERIKAN KE PEMOHON",
            day: widget.detail.givenShift.day,
            date: formatDate(widget.detail.givenShift.date),
            time: widget.detail.givenShift.time,
            location: widget.detail.givenShift.location,
            type: widget.detail.givenShift.type,
            isGiving: true,
          ),
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Column(
                children: [
                  Icon(Icons.swap_vert, color: Color(0xFF7367F0), size: 30),
                  Text("Ditukar",
                      style: TextStyle(color: Color(0xFF7367F0), fontSize: 12)),
                ],
              ),
            ),
          ),
          _buildShiftCard(
            label: "SHIFT PEMOHON — ANDA DAPATKAN",
            day: widget.detail.receivedShift.day,
            date: formatDate(widget.detail.receivedShift.date),
            time: widget.detail.receivedShift.time,
            location: widget.detail.receivedShift.location,
            type: widget.detail.receivedShift.type,
            isGiving: false,
          ),
        ],
      ),
    );
  }

  Widget _buildShiftCard(
      {required String label,
      required String day,
      required String date,
      required String time,
      required String location,
      required String type,
      required bool isGiving}) {
    Color themeColor =
        isGiving ? const Color(0xFFE8F9F1) : const Color(0xFFE8EAF6);
    Color textColor =
        isGiving ? const Color(0xFF28C76F) : const Color(0xFF7367F0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(isGiving ? Icons.call_made : Icons.call_received,
                size: 14, color: isGiving ? Colors.orange : Colors.green),
            const SizedBox(width: 4),
            Text(label,
                style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey)),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: themeColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: textColor.withOpacity(0.1)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(day,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 16)),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                        color: isGiving
                            ? const Color(0xFFDAF4E8)
                            : const Color(0xFFD8D6FA),
                        borderRadius: BorderRadius.circular(8)),
                    child: Text(type,
                        style: TextStyle(
                            color: textColor,
                            fontSize: 12,
                            fontWeight: FontWeight.bold)),
                  )
                ],
              ),
              Text(date,
                  style: const TextStyle(color: Colors.grey, fontSize: 13)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.access_time, size: 16, color: textColor),
                  const SizedBox(width: 4),
                  Text(time, style: const TextStyle(fontSize: 13)),
                  const SizedBox(width: 12),
                  Icon(Icons.location_on_outlined, size: 16, color: textColor),
                  const SizedBox(width: 4),
                  Text(location, style: const TextStyle(fontSize: 13)),
                ],
              )
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildImportantNoteSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: const Color(0xFFE9F2FF),
          borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, color: Color(0xFF007BFF)),
              SizedBox(width: 8),
              Text("Yang Perlu Diperhatikan",
                  style: TextStyle(
                      fontWeight: FontWeight.bold, color: Color(0xFF0056B3))),
            ],
          ),
          SizedBox(height: 8),
          Text(
              "• Shift Anda pada ${widget.detail.givenShift.day} Shift ${widget.detail.givenShift.type} akan berpindah ke ${widget.detail.requesterName}",
              style: TextStyle(fontSize: 13)),
          SizedBox(height: 4),
          Text(
              "• Anda akan bertugas pada ${widget.detail.receivedShift.day}, Shift ${widget.detail.receivedShift.type} sebagai gantinya",
              style: TextStyle(fontSize: 13)),
          SizedBox(height: 4),
          Text("• Pertukaran masih memerlukan persetujuan Kepala Ruangan & SDM",
              style: TextStyle(fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildReasonSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.chat_bubble_outline, color: Colors.indigo, size: 20),
              SizedBox(width: 8),
              Text("Alasan Pemohon",
                  style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          SizedBox(height: 12),
          Text(
            "\"${widget.detail.reason}\"",
            style:
                TextStyle(fontStyle: FontStyle.italic, color: Colors.black87),
          ),
        ],
      ),
    );
  }

  Widget _buildRequesterProfile() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Profil Pemohon",
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Row(
            children: [
              CircleAvatar(
                radius: 25,
                // backgroundImage: widget.detail.requesterAvatar.isNotEmpty
                //     ? NetworkImage(widget.detail.requesterAvatar)
                //     : const NetworkImage('assets/default_profile.png'),
                backgroundImage: widget.detail.requesterAvatar.isNotEmpty
                    ? NetworkImage(widget.detail.requesterAvatar)
                    : const AssetImage('assets/default_profile.png')
                        as ImageProvider,
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.detail.requesterName,
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  SizedBox(height: 2),
                  Text(widget.detail.requesterRole,
                      style: TextStyle(color: Colors.grey, fontSize: 13)),
                  SizedBox(height: 2),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                            color: Colors.indigo.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4)),
                        child: Text(widget.detail.requesterUnit,
                            style: TextStyle(
                                color: Colors.indigo,
                                fontSize: 10,
                                fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 8),
                      Text(widget.detail.requesterEmployeeId,
                          style: TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  )
                ],
              )
            ],
          )
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    // 1. Cek apakah sudah expired
    bool isExpired = DateTime.now().isAfter(widget.detail.expiryDate);
    // 2. Cek apakah status masih 'pending'
    // Pastikan status dari database adalah 'pending' (case sensitive sesuai backend)
    bool isPending = widget.detail.status.toLowerCase() == 'pending' &&
        widget.detail.status.toLowerCase() == 'pending';
    // ❌ Jika status BUKAN pending (misal: approved, rejected, cancelled)
    // atau sudah expired, jangan tampilkan tombol sama sekali.
    if (!isPending || isExpired) {
      return const SizedBox.shrink(); // Mengembalikan widget kosong
    }
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            // onPressed: isExpired
            //     ? null
            //     : () {
            //         _showConfirmDialog();
            //       },
            onPressed: _isLoading ? null : () => _showConfirmDialog(),
            style: ElevatedButton.styleFrom(
              backgroundColor:
                  isExpired ? Colors.grey : const Color(0xFF7367F0),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.check, color: Colors.white),
                SizedBox(width: 8),
                Text("Setujui Pertukaran",
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: OutlinedButton(
            // onPressed: isExpired
            //     ? null
            //     : () {
            //         _showRejectDialog();
            //       },
            onPressed: _isLoading ? null : () => _showRejectDialog(),
            style: OutlinedButton.styleFrom(
              side:
                  BorderSide(color: isExpired ? Colors.grey : Colors.redAccent),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.close, color: Colors.redAccent),
                SizedBox(width: 8),
                Text("Tolak Pertukaran",
                    style: TextStyle(
                        color: Colors.redAccent, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showConfirmDialog() {
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
                  color: Color(0xFFE8F9F1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.done_all_rounded,
                  color: Color(0xFF28C76F),
                  size: 40,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                "Setujui Pertukaran?",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                  color: Color(0xFF333333),
                ),
              ),
              const SizedBox(height: 16),
              RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style:
                      TextStyle(fontSize: 15, color: Colors.grey, height: 1.5),
                  children: [
                    TextSpan(text: "Anda akan menyerahkan Shift "),
                    TextSpan(
                      text:
                          "${widget.detail.givenShift.day} ${widget.detail.givenShift.type}",
                      style: TextStyle(
                          fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    TextSpan(text: " kepada "),
                    TextSpan(
                      text: widget.detail.requesterName,
                      style: TextStyle(
                          fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    TextSpan(text: ", dan mendapatkan Shift "),
                    TextSpan(
                      text:
                          "${widget.detail.receivedShift.day} ${widget.detail.receivedShift.type}",
                      style: TextStyle(
                          fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    TextSpan(text: " sebagai gantinya."),
                  ],
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
                  "Setelah disetujui, permintaan akan diteruskan ke Kepala Ruangan",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
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
                        "Batal",
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
                      onPressed: () {
                        // Navigator.pop(context);
                        _approveExchange();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF28C76F),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        "Ya, Setujui",
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

  void _showRejectDialog() {
    final TextEditingController reasonController = TextEditingController();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: const BoxDecoration(
                          color: Color(0xFFFEEBED),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close_rounded,
                          color: Color(0xFFF04438),
                          size: 40,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Center(
                      child: Text(
                        "Tolak Permintaan?",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 20,
                          color: Color(0xFF1D2939),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Center(
                      child: Text(
                        "Berikan alasan penolakan agar pemohon dapat memahami keputusan Anda",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 15,
                          color: Color(0xFF667085),
                          height: 1.4,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    RichText(
                      text: const TextSpan(
                        text: "Alasan Penolakan",
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                          color: Color(0xFF344054),
                        ),
                        children: [
                          TextSpan(
                            text: " *",
                            style: TextStyle(
                                color: Colors.red, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFEAECF0)),
                      ),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 4),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          TextField(
                            controller: reasonController,
                            maxLines: 4,
                            maxLength: 200,
                            onChanged: (value) {
                              setState(() {});
                            },
                            style: const TextStyle(fontSize: 14),
                            decoration: const InputDecoration(
                              hintText:
                                  "Contoh: Saya tidak bisa bertukar karena sudah ada keperluan lain...",
                              hintStyle: TextStyle(
                                  color: Color(0xFF98A2B3),
                                  fontStyle: FontStyle.normal),
                              border: InputBorder.none,
                              counterText: "",
                              isDense: true,
                              contentPadding:
                                  EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8.0),
                            child: Text(
                              "${reasonController.text.length}/200",
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF98A2B3),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              Navigator.pop(context);
                            },
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              side: BorderSide(color: Colors.grey.shade300),
                            ),
                            child: const Text(
                              "Batal",
                              style: TextStyle(
                                color: Color(0xFF344054),
                                fontWeight: FontWeight.w600,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              if (reasonController.text.trim().isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content:
                                        Text("Alasan penolakan wajib diisi!"),
                                    behavior: SnackBarBehavior.floating,
                                  ),
                                );
                                return;
                              }
                              Navigator.pop(context);
                              _rejectExchange(reasonController.text);
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
                              "Tolak",
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
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
            );
          },
        );
      },
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
        return WillPopScope(
          onWillPop: () async => false,
          child: Dialog(
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
                      color: Color(0xFFE7F8F0),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.done_all_rounded,
                      color: Color(0xFF0F973D),
                      size: 40,
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    "Pertukaran Disetujui!",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1D2939),
                    ),
                  ),
                  const SizedBox(height: 12),
                  RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF667085),
                        height: 1.5,
                      ),
                      children: [
                        TextSpan(
                          text:
                              "Anda telah menyetujui pertukaran shift dengan ",
                        ),
                        TextSpan(
                          text: widget.detail.requesterName,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.black,
                          ),
                        ),
                        TextSpan(text: ".\n"),
                        TextSpan(
                          text:
                              "Permintaan akan diteruskan ke Kepala Ruangan untuk persetujuan selanjutnya.",
                          style: TextStyle(fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9FAFB),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFEAECF0)),
                    ),
                    child: const Column(
                      children: [
                        Text(
                          "RINGKASAN PERTUKARAN",
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF667085),
                            letterSpacing: 0.5,
                          ),
                        ),
                        SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text("Shift Anda",
                                style: TextStyle(color: Color(0xFF667085))),
                            Text(
                              "Sabtu, Shift Pagi",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1D2939),
                              ),
                            ),
                          ],
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(vertical: 4),
                          child: Icon(Icons.swap_vert_rounded,
                              color: Color(0xFF98A2B3), size: 20),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text("Shift Didapat",
                                style: TextStyle(color: Color(0xFF667085))),
                            Text(
                              "Senin, Shift Malam",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1D2939),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        // Navigator.of(dialogContext).pop();
                        // Navigator.of(context).pushAndRemoveUntil(
                        //   MaterialPageRoute(
                        //       builder: (context) => const ActivityPage()),
                        //   (route) => false,
                        // );
                        Navigator.of(context).pushAndRemoveUntil(
                          MaterialPageRoute(
                            builder: (context) => const MainNavigation(),
                          ),
                          (route) => false,
                        );
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          MainNavigation.navKey.currentState
                              ?.setSelectedIndex(3);
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF5E54F3),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        "Kembali ke Aktivitas",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _showRejectedSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
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
                  Icons.close_rounded,
                  color: Color(0xFFF04438),
                  size: 40,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                "Permintaan Ditolak",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                  color: Color(0xFF1D2939),
                ),
              ),
              const SizedBox(height: 12),
              RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: TextStyle(
                    fontSize: 15,
                    color: Color(0xFF667085),
                    height: 1.5,
                  ),
                  children: [
                    TextSpan(
                      text:
                          "Anda telah menolak permintaan pertukaran shift dari ",
                    ),
                    TextSpan(
                      text: widget.detail.requesterName,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1D2939),
                      ),
                    ),
                    TextSpan(
                      text:
                          ". Mereka akan mendapat notifikasi mengenai keputusan ini.",
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF5E54F3),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () {
                    // Navigator.pop(context);
                    // Navigator.of(context).pushAndRemoveUntil(
                    //   MaterialPageRoute(
                    //       builder: (context) => const ActivityPage()),
                    //   (route) => false,
                    // );
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(
                          builder: (context) => const MainNavigation()),
                      (route) => false,
                    );
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      MainNavigation.navKey.currentState?.setSelectedIndex(3);
                    });
                  },
                  child: const Text(
                    "Kembali ke Aktivitas",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
