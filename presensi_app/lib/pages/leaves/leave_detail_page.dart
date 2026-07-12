// MENAMPILKAN SALAH 1 DETAIL PENGAJUAN CUTI, IZIN, DINAS LUAR
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
// import 'package:presensi_app/models/leave_activity.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:presensi_app/services/auth_service.dart';

class LeaveDetail {
  final int id;
  final String leaveType;
  final String leaveSubType;
  final String startDate;
  final String endDate;
  final String note;
  final String createdAt;
  final String status;
  final String? evidenceFile;

  final String fullName;
  final String nip;
  final String position;
  final String department;

  final String? managerName;
  final String? sdmName;
  final String? positionManager;
  final String? positionSdm;
  final String? managerAt;
  final String? sdmAt;
  final bool isApprovedByManager;
  final bool isApprovedBySdm;

  LeaveDetail({
    required this.id,
    required this.leaveType,
    required this.leaveSubType,
    required this.startDate,
    required this.endDate,
    required this.note,
    required this.createdAt,
    required this.status,
    this.evidenceFile,
    required this.fullName,
    required this.nip,
    required this.position,
    required this.department,
    this.managerName,
    this.sdmName,
    this.positionManager,
    this.positionSdm,
    this.managerAt,
    this.sdmAt,
    required this.isApprovedByManager,
    required this.isApprovedBySdm,
  });
}

class LeaveDetailPage extends StatefulWidget {
  final dynamic detail;
  const LeaveDetailPage({super.key, required this.detail});

  @override
  State<LeaveDetailPage> createState() => _LeaveDetailPageState();
}

class _LeaveDetailPageState extends State<LeaveDetailPage> {
  bool isLoadingCancel = false;
  String currentStatus = "";
  String? myNip;

  @override
  void initState() {
    super.initState();
    // currentStatus = widget.detail.finalStatus;
    currentStatus = widget.detail.status;
    // widget.detail['status']
    _checkCurrentUser();
  }

  Future<void> _checkCurrentUser() async {
    final token = await AuthService().getToken();
    if (token != null) {
      try {
        final userData = await AuthService().stayLoggedIn(token);
        setState(() {
          myNip = userData['data']['nip'];
        });
      } catch (e) {
        print("Gagal mengambil session: $e");
      }
    }
  }

  // late Future<LeaveDetail?> _leaveDetailFuture;
  // String _formatDate(String? dateStr, {bool includeTime = false}) {
  //   if (dateStr == null || dateStr.isEmpty) return "-";
  //   try {
  //     final date = DateTime.parse(dateStr).toLocal();
  //     return DateFormat(includeTime ? 'dd MMM yyyy, HH.mm' : 'dd MMMM yyyy')
  //         .format(date);
  //   } catch (e) {
  //     return dateStr;
  //   }
  // }

  String _formatDate(String? dateStr,
      {bool includeTime = false, bool shortMonth = false}) {
    if (dateStr == null || dateStr.isEmpty) return "-";
    try {
      final date = DateTime.parse(dateStr).toLocal();
      if (shortMonth) {
        return DateFormat('dd MMM, HH.mm').format(date);
      }
      return DateFormat(includeTime ? 'dd MMM yyyy, HH.mm' : 'dd MMMM yyyy')
          .format(date);
    } catch (e) {
      return dateStr;
    }
  }

  String _calculateDuration(String start, String end) {
    try {
      final startDate = DateTime.parse(start);
      final endDate = DateTime.parse(end);
      final difference = endDate.difference(startDate).inDays + 1;
      return '$difference hari';
    } catch (e) {
      return "-";
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = widget.detail;

    return Scaffold(
      // backgroundColor: const Color(0xFFF8F9FA),
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('Detail Pengajuan',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF6F34FA),
        // elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      bottomNavigationBar: _buildBottomAction(context),
      // body: FutureBuilder<LeaveDetail?>(
      // future: _leaveDetailFuture,
      // builder: (context, snapshot) {
      //   if (snapshot.connectionState == ConnectionState.waiting) {
      //     return const Center(child: CircularProgressIndicator());
      //   } else if (snapshot.hasError || snapshot.data == null) {
      //     return const Center(child: Text("Data tidak ditemukan"));
      //   }
      //   final data = snapshot.data!;
      // return
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
                // _buildStatusHeader(data.finalStatus),
                _buildStatusHeader(currentStatus),
                const SizedBox(height: 16),
                _buildSectionCard(
                  title: "Informasi Pengajuan",
                  content: [
                    _buildDetailRow("Jenis", data.leaveType),
                    _buildDetailRow("Sub Jenis", data.leaveSubType),
                    _buildDetailRow(
                        "Tanggal Mulai", _formatDate(data.startDate)),
                    _buildDetailRow(
                        "Tanggal Selesai", _formatDate(data.endDate)),
                    _buildDetailRow("Durasi",
                        _calculateDuration(data.startDate, data.endDate),
                        valueColor: Colors.indigo),
                    _buildDetailRow("Tanggal Pengajuan",
                        _formatDate(data.createdAt, includeTime: true)),
                  ],
                ),
                const SizedBox(height: 16),
                if (data.evidenceFile != null) ...[
                  _buildSectionCard(
                    title: "Lampiran",
                    content: [
                      ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          // child: Image.network(
                          //   data.evidenceFile!,
                          //   height: 200,
                          //   width: double.infinity,
                          //   fit: BoxFit.cover,
                          //   errorBuilder: (ctx, err, stack) => const Text(
                          //       "Gagal memuat gambar",
                          //       style: const TextStyle(color: Colors.black54)),
                          // ),
                          child: buildEvidence(data.evidenceFile!)),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],
                _buildSectionCard(
                  title: "Keterangan",
                  content: [
                    Text(
                      data.note,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildSectionCard(
                  title: "Riwayat Persetujuan",
                  content: [
                    _buildApprovalStatus(
                      title: data.positionManager ?? "Manager",
                      subtitle: data.managerName ?? "-",
                      date: data.managerAt,
                      // status: data.finalStatus == 'rejected'
                      //     ? "Ditolak"
                      //     : (data.isApprovedByManager
                      //         ? "Disetujui"
                      //         : "Menunggu"),
                      // status: data.finalStatus == 'rejected'
                      //     ? "Ditolak"
                      //     : data.finalStatus == 'cancelled'
                      //         ? "Dibatalkan"
                      //         : (data.isApprovedByManager
                      //             ? "Disetujui"
                      //             : "Menunggu"),
                      status: currentStatus == 'rejected'
                          ? "Ditolak"
                          : currentStatus == 'cancelled'
                              ? "Dibatalkan"
                              : (data.isApprovedByManager
                                  ? "Disetujui"
                                  : "Menunggu"),
                      // isDone: data.isApprovedByManager ||
                      //     data.finalStatus == 'approved',
                      // isDone: data.isApprovedByManager ||
                      //     data.finalStatus != 'pending',
                      isDone:
                          data.isApprovedByManager || data.status != 'pending',
                    ),
                    const Divider(height: 30),
                    _buildApprovalStatus(
                      title: data.positionSdm ?? "SDM",
                      subtitle: data.sdmName ?? "-",
                      date: data.sdmAt,
                      // status: data.finalStatus == 'rejected'
                      //     ? "Ditolak"
                      //     : (data.isApprovedByManager
                      //         ? "Disetujui"
                      //         : "Menunggu"),
                      // status: data.finalStatus == 'rejected'
                      //     ? "Ditolak"
                      //     : data.finalStatus == 'cancelled'
                      //         ? "Dibatalkan"
                      //         : (data.isApprovedBySdm
                      //             ? "Disetujui"
                      //             : "Menunggu"),
                      status: currentStatus == 'rejected'
                          ? "Ditolak"
                          : currentStatus == 'cancelled'
                              ? "Dibatalkan"
                              : (data.isApprovedBySdm
                                  ? "Disetujui"
                                  : "Menunggu"),
                      // isDone: data.isApprovedBySdm,
                      // isDone:
                      //     data.isApprovedBySdm || data.finalStatus != 'pending',
                      isDone: data.isApprovedBySdm || data.status != 'pending',
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildSectionCard(
                  title: "Informasi Karyawan",
                  content: [
                    _buildDetailRow("Nama", data.fullName),
                    _buildDetailRow("NIP", data.nip),
                    _buildDetailRow("Jabatan", data.position),
                    _buildDetailRow("Fungsi", data.department),
                  ],
                ),
                const SizedBox(height: 2),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusHeader(String status) {
    Color color = Colors.orange;
    IconData icon = Icons.access_time;
    String label = "Menunggu";

    // if (status == 'approved') {
    //   color = Colors.green;
    //   icon = Icons.check_circle;
    //   label = "Disetujui";
    // } else if (status == 'rejected') {
    //   color = Colors.red;
    //   icon = Icons.cancel;
    //   label = "Ditolak";
    // } else if (status == "cancelled") {
    //   color = Colors.grey;
    //   icon = Icons.remove_circle;
    //   label = "Dibatalkan";
    // } else if (status == "expired") {
    //   color = Colors.brown;
    //   icon = Icons.timer_off;
    //   label = "Kedaluwarsa";
    // } else {
    //   color = Colors.orange;
    //   icon = Icons.access_time_filled;
    //   label = "Menunggu";
    // }

    // Konversi ke lowercase untuk menghindari isu case-sensitive
    final statusLower = status.toLowerCase();

    if (statusLower == 'approved') {
      color = Colors.green;
      icon = Icons.check_circle;
      label = "Disetujui";
    } else if (statusLower == 'rejected') {
      color = Colors.red;
      icon = Icons.cancel;
      label = "Ditolak";
    } else if (statusLower == "cancelled") {
      color = Colors.grey;
      icon = Icons.remove_circle;
      label = "Dibatalkan";
    } else if (statusLower == "expired") {
      color = Colors.brown;
      icon = Icons.timer_off;
      label = "Kedaluwarsa";
    } else {
      color = Colors.orange;
      icon = Icons.access_time_filled;
      label = "Menunggu";
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 24),
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Column(children: [
        CircleAvatar(
            backgroundColor: color.withOpacity(0.1),
            child: Icon(icon, color: color)),
        const SizedBox(height: 12),
        Text(label,
            style: TextStyle(color: color, fontWeight: FontWeight.bold)),
      ]),
    );
  }

  Widget _buildSectionCard(
      {required String title, required List<Widget> content}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)
          ]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 10),
        ...content,
      ]),
    );
  }

  Widget buildEvidence(String url) {
    final lower = url.toLowerCase();

    final isImage = lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp");

    if (isImage) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(
          url,
          height: 200,
          width: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (ctx, err, stack) => const Text("Gagal memuat gambar"),
        ),
      );
    } else {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            const Icon(Icons.insert_drive_file, color: Colors.grey),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                url.split("/").last,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            IconButton(
              icon: const Icon(Icons.open_in_new),
              onPressed: () async {
                // nanti kita bisa pakai url_launcher
                final uri = Uri.parse(url);
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                }
                debugPrint("Open file: $url");
              },
            )
          ],
        ),
      );
    }
  }

  Widget _buildDetailRow(String label, String value,
      {Color valueColor = Colors.black}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: const TextStyle(color: Colors.black54)),
        Text(value,
            style: TextStyle(fontWeight: FontWeight.w600, color: valueColor)),
      ]),
    );
  }

  // Widget _buildApprovalStatus(
  //     {required String title,
  //     required String subtitle,
  //     required String status,
  //     required bool isDone,
  //     String? date}) {
  //   Color iconColor;
  //   IconData isIcon;
  //   String label;
  //   switch (status) {
  //     case 'approved':
  //       iconColor = Colors.green;
  //       isIcon = Icons.check_circle;
  //       label = "Disetujui";
  //       break;
  //     case 'rejected':
  //       iconColor = Colors.red;
  //       isIcon = Icons.cancel;
  //       label = "Ditolak";
  //       break;
  //     case 'cancelled':
  //       iconColor = Colors.grey;
  //       isIcon = Icons.remove_circle;
  //       label = "Dibatalkan";
  //       break;
  //     case 'expired':
  //       iconColor = Colors.brown;
  //       isIcon = Icons.timer_off;
  //       label = "Kedaluwarsa";
  //       break;
  //     default:
  //       iconColor = Colors.orange;
  //       isIcon = Icons.access_time_filled;
  //       label = "Menunggu";
  //   }
  //   return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
  //     Container(
  //       padding: EdgeInsets.all(6),
  //       decoration: BoxDecoration(
  //         color: iconColor.withOpacity(0.1),
  //         shape: BoxShape.circle,
  //       ),
  //       child: Icon(
  //         isIcon,
  //         color: iconColor,
  //       ),
  //     ),
  //     const SizedBox(width: 12),
  //     Expanded(
  //         child:
  //             Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
  //       Row(
  //         mainAxisAlignment: MainAxisAlignment.spaceBetween,
  //         children: [
  //           Text(title,
  //               style:
  //                   const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
  //           if (isDone && date != null)
  //             Text(
  //               _formatDate(date, includeTime: true, shortMonth: true),
  //               style: const TextStyle(fontSize: 12, color: Colors.black45),
  //             ),
  //         ],
  //       ),
  //       const SizedBox(height: 4),
  //       Text(subtitle,
  //           style: const TextStyle(fontSize: 13, color: Colors.black54)),
  //       const SizedBox(height: 4),
  //       Text(status,
  //           style: TextStyle(
  //               fontSize: 12, color: isDone ? Colors.green : Colors.orange)),
  //     ])),
  //   ]);
  // }

  Widget _buildApprovalStatus(
      {required String title,
      required String subtitle,
      required String status,
      required bool isDone,
      String? date}) {
    Color bgColor = Colors.orange.withOpacity(0.1);
    Color iconColor = Colors.orange;
    IconData isIcon = Icons.access_time_filled;
    Color textColor = Colors.orange;
    String statusLower = status.toLowerCase();

    if (statusLower == 'disetujui') {
      bgColor = Colors.green.withOpacity(0.1);
      iconColor = Colors.green;
      isIcon = Icons.check_circle;
      textColor = Colors.green;
    } else if (statusLower == 'ditolak') {
      bgColor = Colors.red.withOpacity(0.1);
      iconColor = Colors.red;
      isIcon = Icons.cancel;
      textColor = Colors.red;
    } else if (statusLower == 'dibatalkan') {
      bgColor = Colors.grey.withOpacity(0.1);
      iconColor = Colors.grey;
      // isIcon = Icons.block;
      isIcon = Icons.remove_circle;
      textColor = Colors.grey;
    } else if (statusLower == 'kedaluwarsa') {
      bgColor = Colors.grey.withOpacity(0.1);
      iconColor = Colors.grey;
      isIcon = Icons.history;
      textColor = Colors.grey;
    }

    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        padding: EdgeInsets.all(6),
        decoration: BoxDecoration(
          // color: iconColor.withOpacity(0.1),
          color: bgColor,
          shape: BoxShape.circle,
        ),
        child: Icon(
          isIcon,
          color: iconColor,
        ),
      ),
      const SizedBox(width: 12),
      Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title,
                style:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            if (isDone && date != null)
              Text(
                _formatDate(date, includeTime: true, shortMonth: true),
                style: const TextStyle(fontSize: 12, color: Colors.black45),
              ),
          ],
        ),
        const SizedBox(height: 4),
        Text(subtitle,
            style: const TextStyle(fontSize: 13, color: Colors.black54)),
        const SizedBox(height: 4),
        Text(status,
            style: TextStyle(
                // fontSize: 12, color: isDone ? Colors.green : Colors.orange)),
                fontSize: 12,
                color: textColor)),
      ])),
    ]);
  }

  // Widget _buildApprovalStatus(
  //     {required String title,
  //     required String subtitle,
  //     required String status,
  //     required bool isDone,
  //     String? date}) {
  //   Color bgColor = Colors.orange.withOpacity(0.1);
  //   Color iconColor = Colors.orange;
  //   IconData isIcon = Icons.access_time_filled;
  //   String label = "Menunggu";

  //   if (status == 'approved') {
  //     bgColor = Colors.green.withOpacity(0.1);
  //     iconColor = Colors.green;
  //     isIcon = Icons.check_circle;
  //     label = "Disetujui";
  //   } else if (status == 'rejected') {
  //     bgColor = Colors.red.withOpacity(0.1);
  //     iconColor = Colors.red;
  //     isIcon = Icons.radio_button_unchecked;
  //     label = "Ditolak";
  //   }
  //   return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
  //     // Icon(isDone ? Icons.check_circle : Icons.radio_button_unchecked,
  //     //     color: isDone ? Colors.green : Colors.grey),
  //     // Container(
  //     //   padding: EdgeInsets.all(6),
  //     //   decoration: BoxDecoration(
  //     //     color: isDone
  //     //         ? Colors.green.withOpacity(0.1)
  //     //         : Colors.grey.withOpacity(0.1),
  //     //     shape: BoxShape.circle,
  //     //   ),
  //     //   child: Icon(
  //     //     isDone ? Icons.check_circle : Icons.radio_button_unchecked,
  //     //     color: isDone ? Colors.green : Colors.grey,
  //     //   ),
  //     // ),
  //     Container(
  //       padding: EdgeInsets.all(6),
  //       decoration: BoxDecoration(
  //         color: bgColor.withOpacity(0.1),
  //         shape: BoxShape.circle,
  //       ),
  //       child: Icon(
  //         isIcon,
  //         color: iconColor,
  //       ),
  //     ),
  //     const SizedBox(width: 12),
  //     Expanded(
  //         child:
  //             Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
  //       // Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
  //       Row(
  //         mainAxisAlignment: MainAxisAlignment.spaceBetween,
  //         children: [
  //           Text(title,
  //               style:
  //                   const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
  //           if (isDone && date != null)
  //             Text(
  //               _formatDate(date, includeTime: true, shortMonth: true),
  //               style: const TextStyle(fontSize: 12, color: Colors.black45),
  //             ),
  //         ],
  //       ),
  //       const SizedBox(height: 4),
  //       Text(subtitle,
  //           style: const TextStyle(fontSize: 13, color: Colors.black54)),
  //       const SizedBox(height: 4),
  //       Text(status,
  //           style: TextStyle(
  //               fontSize: 12, color: isDone ? Colors.green : Colors.orange)),
  //     ])),
  //   ]);
  // }

  // @override
  // Widget build(BuildContext context) {
  //   return Scaffold(
  //       backgroundColor: const Color(0xFFF8F9FA),
  //       appBar: AppBar(
  //         title: const Text('Detail Pengajuan',
  //             style:
  //                 TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
  //         backgroundColor: Color(0xFF6F34FA),
  //       ),
  //       body: Stack(
  //         children: [
  //           Container(
  //             height: 120,
  //             decoration: const BoxDecoration(
  //               gradient: LinearGradient(
  //                   begin: Alignment.topCenter,
  //                   end: Alignment.bottomCenter,
  //                   colors: [Color(0xFF6F34FA), Color(0xFF8E5CFC)]),
  //             ),
  //           ),
  //           SingleChildScrollView(
  //             padding: const EdgeInsets.all(16.0),
  //             child: Column(
  //               children: [
  //                 _buildStatusHeader(data['finalStatus']),
  //                 const SizedBox(height: 16),
  //                 _buildSectionCard(
  //                   title: "Informasi Pengajuan",
  //                   content: [
  //                     _buildDetailRow(
  //                         "Jenis", data['leavetype']?['name'] ?? "-"),
  //                     _buildDetailRow(
  //                         "Sub Jenis", data['leavesubtype']?['name'] ?? "-"),
  //                     _buildDetailRow(
  //                         "Tanggal Mulai", _formatDate(data['startDate'])),
  //                     _buildDetailRow(
  //                         "Tanggal Selesai", _formatDate(data['endDate'])),
  //                     _buildDetailRow(
  //                         "Durasi",
  //                         _calculateDuration(
  //                             data['startDate'], data['endDate']),
  //                         valueColor: Colors.indigo),
  //                     _buildDetailRow("Tanggal Pengajuan",
  //                         _formatDate(data['createdAt'], includeTime: true)),
  //                   ],
  //                 ),
  //                 const SizedBox(height: 16),
  //                 _buildSectionCard(
  //                   title: "Keterangan",
  //                   content: [
  //                     Text(
  //                       data['note'] ?? "Tidak ada keterangan",
  //                       style: TextStyle(color: Colors.black54, height: 1.5),
  //                     ),
  //                   ],
  //                 ),
  //                 const SizedBox(height: 16),
  //                 _buildSectionCard(
  //                   title: "Riwayat Persetujuan",
  //                   content: [
  //                     _buildApprovalStatus(
  //                       title: "Manager",
  //                       subtitle: data['approvedByManager']?['fullName'] ??
  //                           "Menunggu proses Manager",
  //                       status: data['approvedByManager'] != null
  //                           ? "Disetujui"
  //                           : "Menunggu persetujuan",
  //                       // time: "21 Jan, 14.20",
  //                       // isDone: true,
  //                       time: "",
  //                       isDone: data['approvedByManager'] != null ||
  //                           data['finalStatus'] == 'approved',
  //                     ),
  //                     const Divider(height: 30),
  //                     _buildApprovalStatus(
  //                       title: "SDM",
  //                       subtitle: data['approvedBySdm']?['fullName'] ??
  //                           "Menunggu proses SDM",
  //                       status: data['approvedBySdm'] != null
  //                           ? "Disetujui"
  //                           : "Menunggu persetujuan",
  //                       time: "",
  //                       // isDone: false,
  //                       isDone: data['approvedBySdm'] != null ||
  //                           data['finalStatus'] == 'approved',
  //                     ),
  //                   ],
  //                 ),
  //                 const SizedBox(height: 16),
  //                 _buildSectionCard(
  //                   title: "Informasi Karyawan",
  //                   content: [
  //                     _buildDetailRow("Nama", user['fullName'] ?? "-"),
  //                     _buildDetailRow("NIP", user['nip'] ?? "-"),
  //                     _buildDetailRow("Jabatan", position['name'] ?? "-"),
  //                     _buildDetailRow("Fungsi", department['name'] ?? "-"),
  //                   ],
  //                 ),
  //                 const SizedBox(height: 30),
  //               ],
  //             ),
  //           ),
  //         ],
  //       ));
  // }
  // Widget _buildSectionCard(
  //     {required String title, required List<Widget> content}) {
  //   return Container(
  //     width: double.infinity,
  //     padding: const EdgeInsets.all(16),
  //     decoration: BoxDecoration(
  //       color: Colors.white,
  //       borderRadius: BorderRadius.circular(12),
  //       boxShadow: [
  //         BoxShadow(
  //             color: Colors.black.withOpacity(0.05),
  //             blurRadius: 10,
  //             offset: const Offset(0, 4)),
  //       ],
  //     ),
  //     child: Column(
  //       crossAxisAlignment: CrossAxisAlignment.start,
  //       children: [
  //         Text(
  //           title,
  //           style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
  //         ),
  //         const SizedBox(height: 16),
  //         ...content,
  //       ],
  //     ),
  //   );
  // }
  // Widget _buildDetailRow(String label, String value,
  //     {Color valueColor = Colors.black}) {
  //   return Padding(
  //     padding: const EdgeInsets.only(bottom: 12),
  //     child: Row(
  //       mainAxisAlignment: MainAxisAlignment.spaceBetween,
  //       children: [
  //         Text(label, style: const TextStyle(color: Colors.black54)),
  //         Text(value,
  //             style: TextStyle(fontWeight: FontWeight.w600, color: valueColor)),
  //       ],
  //     ),
  //   );
  // }
  // Widget _buildStatusHeader() {
  //   return Container(
  //     width: double.infinity,
  //     padding: const EdgeInsets.symmetric(vertical: 24),
  //     decoration: BoxDecoration(
  //       color: Colors.white,
  //       borderRadius: BorderRadius.circular(12),
  //     ),
  //     child: Column(
  //       children: [
  //         const CircleAvatar(
  //           backgroundColor: Color(0xFFE8EAF6),
  //           child: Icon(Icons.check, color: Colors.blue),
  //         ),
  //         const SizedBox(height: 12),
  //         Container(
  //           padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
  //           decoration: BoxDecoration(
  //             color: Colors.blue.shade50,
  //             borderRadius: BorderRadius.circular(20),
  //           ),
  //           child: const Text(
  //             "Disetujui Manager",
  //             style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold),
  //           ),
  //         ),
  //         const SizedBox(height: 8),
  //         const Text(
  //           "Permohonan telah disetujui manager,\nmenunggu persetujuan SDM",
  //           textAlign: TextAlign.center,
  //           style: TextStyle(color: Colors.black54, fontSize: 12),
  //         )
  //       ],
  //     ),
  //   );
  // }
  // Widget _buildApprovalStatus({
  //   required String title,
  //   required String subtitle,
  //   required String status,
  //   required String time,
  //   required bool isDone,
  // }) {
  //   return Row(
  //     children: [
  //       CircleAvatar(
  //         radius: 16,
  //         backgroundColor: isDone ? Colors.green.shade50 : Colors.grey.shade100,
  //         child: Icon(
  //           isDone ? Icons.check : Icons.access_time,
  //           size: 16,
  //           color: isDone ? Colors.green : Colors.grey,
  //         ),
  //       ),
  //       const SizedBox(width: 12),
  //       Expanded(
  //         child: Column(
  //           crossAxisAlignment: CrossAxisAlignment.start,
  //           children: [
  //             Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
  //             Text(subtitle,
  //                 style: const TextStyle(fontSize: 12, color: Colors.black54)),
  //             Text(status,
  //                 style: TextStyle(
  //                     fontSize: 12,
  //                     color: isDone ? Colors.green : Colors.orange)),
  //           ],
  //         ),
  //       ),
  //       Text(time, style: const TextStyle(fontSize: 11, color: Colors.grey)),
  //     ],
  //   );
  // }

  void _showCancelConfirm(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        // builder: (dialogContext) => Dialog(
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
                  Icons.info_outline,
                  color: Color(0xFFF04438),
                  size: 40,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                "Batalkan Permintaan?",
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
                  "Permintaan pengajuan ini akan dibatalkan",
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
                      // onPressed: () => Navigator.pop(dialogContext),
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
                      // onPressed: () async {
                      //   Navigator.pop(context);
                      //   final result = await AuthService().cancelLeaveRequests(
                      //     widget.detail.id,
                      //   );
                      //   if (result["success"]) {
                      //     ScaffoldMessenger.of(context).showSnackBar(
                      //       SnackBar(
                      //         content: Text(result["message"]),
                      //         backgroundColor: Colors.green,
                      //       ),
                      //     );
                      //     setState(() {
                      //       currentStatus = "cancelled";
                      //     });
                      //     Navigator.pop(context);
                      //   } else {
                      //     ScaffoldMessenger.of(context).showSnackBar(
                      //       SnackBar(
                      //         content: Text(result["message"]),
                      //         backgroundColor: Colors.red,
                      //       ),
                      //     );
                      //   }
                      // },
                      onPressed: () async {
                        // 1. Tutup dialog konfirmasi terlebih dahulu
                        Navigator.pop(context);
                        // Navigator.pop(dialogContext);

                        // Tampilkan loading indicator jika diperlukan
                        setState(() {
                          isLoadingCancel = true;
                        });

                        final result = await AuthService().cancelLeaveRequests(
                          widget.detail.id,
                        );

                        if (!mounted) return;
                        setState(() {
                          isLoadingCancel = false;
                        });

                        if (result["success"]) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(result["message"]),
                              backgroundColor: Colors.green,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );

                          // PERBAIKAN: Memperbarui state lokal agar UI melakukan re-render otomatis
                          setState(() {
                            currentStatus = "cancelled";
                          });

                          // PERBAIKAN: JANGAN panggil Navigator.pop(context) lagi di sini
                          // agar user tetap berada di halaman detail dan melihat perubahan tombol.
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
    final bool isRequester = widget.detail.nip == myNip;

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
