// RIWAYAT PRESENSI
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:presensi_app/pages/attendances/attendance_detail_page.dart';
import '../../services/auth_service.dart';
import 'package:shimmer/shimmer.dart';

String formatDuration(int totalMinutes) {
  if (totalMinutes <= 0) return "";
  int hours = totalMinutes ~/ 60;
  int minutes = totalMinutes % 60;
  if (hours > 0) {
    return "${hours}j ${minutes}m";
  } else {
    return "${minutes}m";
  }
}

class AttendanceRecord {
  final DateTime date;
  final String status;
  final String checkInTime;
  final String checkOutTime;
  final String duration;
  final bool isChecked;
  final String? notes;
  // final String? lateDuration;
  final int? lateDuration;
  final String workSchedule;
  final String shiftName;
  final String? checkInLocationDetail;
  final String? checkOutLocationDetail;
  // final String? evidencePhoto;
  final String? checkInEvidencePhoto;
  final String? checkOutEvidencePhoto;
  final String userType;

  AttendanceRecord({
    required this.date,
    required this.status,
    required this.checkInTime,
    required this.checkOutTime,
    required this.duration,
    required this.isChecked,
    this.lateDuration,
    this.notes,
    required this.workSchedule,
    required this.shiftName,
    this.checkInLocationDetail,
    this.checkOutLocationDetail,
    // this.evidencePhoto,
    this.checkInEvidencePhoto,
    this.checkOutEvidencePhoto,
    required this.userType,
  });
}

class AttendanceHistoryPage extends StatefulWidget {
  const AttendanceHistoryPage({super.key});

  @override
  State<AttendanceHistoryPage> createState() => _AttendanceHistoryPageState();
}

class _AttendanceHistoryPageState extends State<AttendanceHistoryPage> {
  final AuthService authService = AuthService();
  List<AttendanceRecord> attendanceHistory = [];
  List<AttendanceRecord> filteredHistory = [];
  List<String> availableMonths = [];
  List<String> availableStatuses = [];
  String? selectedMonth;
  String? selectedStatus;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAttendanceHistory();
  }

  int get totalPresent =>
      attendanceHistory.where((e) => e.status.toLowerCase() == 'hadir').length;
  int get totalAbsent => attendanceHistory
      .where((e) => e.status.toLowerCase() == 'tidak hadir')
      .length;
  int get totalLate => attendanceHistory
      .where((e) => e.status.toLowerCase() == 'terlambat')
      .length;
  int get totalSickOrPermission => attendanceHistory
      .where((e) =>
          e.status.toLowerCase() == 'izin' || e.status.toLowerCase() == 'sakit')
      .length;

  Future<void> _loadAttendanceHistory() async {
    try {
      final response = await authService.getMyAttendances();
      if (!mounted) return;
      if (response.isEmpty) {
        setState(() => isLoading = false);
        return;
      }
      final List<AttendanceRecord> records =
          response.map<AttendanceRecord>((item) {
        final parsedDate =
            DateTime.tryParse(item['date'] ?? '') ?? DateTime.now();

        String formatTime(String? timeStr) {
          if (timeStr == null || timeStr.isEmpty || timeStr == '--:--')
            return '--:--';
          try {
            DateTime dt = DateTime.parse(timeStr).toLocal();
            return DateFormat('HH:mm').format(dt);
          } catch (e) {
            return timeStr;
          }
        }

        String checkInDisp = formatTime(item['checkInTime']);
        String checkOutDisp = formatTime(item['checkOutTime']);
        String durationDisp = '-';
        if (item['checkInTime'] != null && item['checkOutTime'] != null) {
          try {
            DateTime inTime = DateTime.parse(item['checkInTime']);
            DateTime outTime = DateTime.parse(item['checkOutTime']);
            Duration diff = outTime.difference(inTime);
            if (diff.inMinutes > 0) {
              int hours = diff.inHours;
              int minutes = diff.inMinutes.remainder(60);
              durationDisp = '${hours}j ${minutes}m';
            }
          } catch (_) {
            durationDisp = '-';
          }
        }

        final shift =
            item['workShift'] ?? item['shiftAssignment']?['workShift'];
        String schedule = "07:00 - 15:00"; // Default non-shift
        String sName = "Reguler";

        if (shift != null) {
          schedule = "${shift['startTime']} - ${shift['endTime']}";
          sName = shift['name'] ?? "Shift";
        }

        return AttendanceRecord(
          date: parsedDate,
          status: item['attendanceStatus'] ?? 'Tidak Diketahui',
          checkInTime: checkInDisp,
          checkOutTime: checkOutDisp,
          duration: durationDisp,
          isChecked: ['hadir', 'terlambat', 'dinas luar']
              .contains(item['attendanceStatus']?.toString().toLowerCase()),
          // lateDuration: item['lateTime'] != null
          //     ? formatDuration(item['lateTime'] is int
          //         ? item['lateTime']
          //         : int.parse(item['lateTime'].toString()))
          //     : null,
          lateDuration: item['lateTime'] != null
              ? (item['lateTime'] is int
                  ? item['lateTime']
                  : int.tryParse(item['lateTime'].toString()))
              : null,
          checkInLocationDetail: item['checkInLocation'] ?? "-",
          checkOutLocationDetail: item['checkOutLocation'] ?? "-",
          workSchedule: schedule,
          shiftName: sName,
          notes: item['notes'],
          // evidencePhoto: item['evidencePhoto']?.toString(),

          checkInEvidencePhoto: item['checkInEvidencePhoto']?.toString(),
          checkOutEvidencePhoto: item['checkOutEvidencePhoto']?.toString(),
          userType: (item['workShift'] != null) ? 'Shift' : 'Non-Shift',
        );
      }).toList()
            ..sort((a, b) => b.date.compareTo(a.date));

      // setState(() {
      //   attendanceHistory = records;
      //   availableMonths = records
      //       .map((r) => DateFormat('MMMM yyyy', 'id_ID').format(r.date))
      //       .toSet()
      //       .toList();
      //   availableStatuses = ['Semua', ...records.map((r) => r.status).toSet()];
      //   selectedStatus = 'Semua';
      //   filteredHistory = _applyFilters();
      //   isLoading = false;
      // });

      if (!mounted) return;
      setState(() {
        attendanceHistory = records;
        availableMonths = records
            .map((r) => DateFormat('MMMM yyyy', 'id_ID').format(r.date))
            .toSet()
            .toList();
        String currentMonthStr =
            DateFormat('MMMM yyyy', 'id_ID').format(DateTime.now());
        if (availableMonths.contains(currentMonthStr)) {
          selectedMonth = currentMonthStr;
        } else if (availableMonths.isNotEmpty) {
          selectedMonth = availableMonths.first;
        }
        availableStatuses = ['Semua', ...records.map((r) => r.status).toSet()];
        selectedStatus = 'Semua';
        filteredHistory = _applyFilters();
        isLoading = false;
      });
    } catch (e) {
      debugPrint("Error load attendance: $e");
      // setState(() => isLoading = false);
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  List<AttendanceRecord> _applyFilters() {
    return attendanceHistory.where((record) {
      final month = DateFormat('MMMM yyyy', 'id_ID').format(record.date);
      final matchesMonth = selectedMonth == null ||
          record.date.month ==
              DateFormat('MMMM', 'id_ID')
                  .parse(selectedMonth!.split(' ')[0])
                  .month;
      final matchesStatus =
          selectedStatus == 'Semua' || record.status == selectedStatus;
      return (selectedMonth == null || month == selectedMonth) && matchesStatus;
    }).toList();
  }

  void _onFilterChanged() {
    setState(() {
      filteredHistory = _applyFilters();
    });
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

  // @override
  // Widget build(BuildContext context) {
  //   return Scaffold(
  //       body: isLoading
  //           ? const Center(child: CircularProgressIndicator())
  //           : Stack(
  //               children: [
  //                 Container(
  //                   height: 120,
  //                   decoration: const BoxDecoration(
  //                       gradient: LinearGradient(
  //                     begin: Alignment.topCenter,
  //                     end: Alignment.bottomCenter,
  //                     colors: [Color(0xFF6F34FA), Color(0xFF8E5CFC)],
  //                   )),
  //                 ),
  //                 ListView(
  //                   padding: const EdgeInsets.all(16.0),
  //                   children: [
  //                     _buildFilters(),
  //                     const SizedBox(height: 8),
  //                     _buildStatusCards(),
  //                     const SizedBox(height: 8),
  //                     Text(
  //                       "Riwayat Harian",
  //                       style: TextStyle(
  //                         fontSize: 16,
  //                         fontWeight: FontWeight.bold,
  //                       ),
  //                     ),
  //                     const SizedBox(height: 10),
  //                     if (filteredHistory.isEmpty)
  //                       const Center(
  //                           child: Padding(
  //                         padding: EdgeInsets.only(top: 50),
  //                         child: Text("Belum ada data presensi.",
  //                             style:
  //                                 TextStyle(color: Colors.grey, fontSize: 16)),
  //                       ))
  //                     else
  //                       ...filteredHistory
  //                           .map((record) => _buildAttendanceItem(record))
  //                           .toList(),
  //                   ],
  //                 ),
  //               ],
  //             ));
  // }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        // body: isLoading
        //     ? const Center(child: CircularProgressIndicator())
        //     : Stack(
        body: Stack(
      children: [
        Container(
          height: 120,
          decoration: const BoxDecoration(
              gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF6F34FA), Color(0xFF8E5CFC)],
          )),
        ),
        Column(
          children: [
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _buildFilters(),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              // child: _buildStatusCards(),
              child:
                  isLoading ? _buildStatusCardsSkeleton() : _buildStatusCards(),
            ),
            const SizedBox(height: 8),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "Riwayat Harian",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(
              height: 10,
            ),
            Expanded(
              child: isLoading
                  ? _buildListSkeleton()
                  : filteredHistory.isEmpty
                      ? const Center(
                          child: Text(
                            "Belum ada data presensi",
                            style: TextStyle(color: Colors.grey),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: filteredHistory.length,
                          itemBuilder: (context, index) {
                            final record = filteredHistory[index];
                            return _buildAttendanceItem(record);
                          },
                        ),
            ),
          ],
        )
      ],
    ));
  }

  Widget _buildFilters() {
    return Row(
      children: [
        Expanded(
          child: _buildDropdown(
              value: selectedMonth,
              items: availableMonths,
              label: 'Bulan',
              onChanged: (val) {
                setState(() => selectedMonth = val);
                _onFilterChanged();
              }),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildDropdown(
              value: selectedStatus,
              items: availableStatuses,
              label: 'Status',
              onChanged: (val) {
                setState(() => selectedStatus = val);
                _onFilterChanged();
              }),
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required String? value,
    required List<String> items,
    required String label,
    required void Function(String?) onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          isExpanded: true,
          value: value,
          menuMaxHeight: 250,
          hint: Text(
            label,
            style: TextStyle(color: Colors.grey.shade600),
          ),
          icon: const Icon(Icons.keyboard_arrow_down),
          items: items.map((item) {
            return DropdownMenuItem(
              value: item,
              child: Text(
                item,
                style: const TextStyle(fontSize: 14),
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildStatusCards() {
    return GridView.count(
      crossAxisCount: 5,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 8,
      childAspectRatio: 0.68,
      children: [
        _statusCard('${filteredHistory.length}', 'Total', Colors.blueGrey),
        _statusCard(
            '${filteredHistory.where((r) => r.status == 'Hadir' || r.status == 'Dinas Luar' || r.status == 'Terlambat').length}',
            'Hadir',
            Colors.green),
        _statusCard(
            '${filteredHistory.where((r) => r.status == 'Terlambat').length}',
            'Terlambat',
            Colors.orange),
        _statusCard(
            '${filteredHistory.where((r) => r.status == 'Izin').length}',
            'Izin',
            Colors.blue),
        _statusCard(
            '${filteredHistory.where((r) => r.status == 'Tidak Hadir').length}',
            'Tidak Hadir',
            Colors.red),
      ],
    );
  }

  Widget _statusCard(String count, String label, Color color) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      // margin: EdgeInsets.zero,
      margin: const EdgeInsets.symmetric(horizontal: 1, vertical: 10),
      child: Padding(
        padding: const EdgeInsets.all(5),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              count,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
            ),
          ],
        ),
      ),
    );
  }

  // Widget _buildAttendanceItem(AttendanceRecord record) {
  //   return Padding(
  //     padding: const EdgeInsets.only(bottom: 12.0),
  //     child: Card(
  //       elevation: 0.5,
  //       shape: RoundedRectangleBorder(
  //         borderRadius: BorderRadius.circular(10),
  //         side: BorderSide(color: Colors.grey.shade200),
  //       ),
  //       margin: EdgeInsets.zero,
  //       child: Padding(
  //         padding: const EdgeInsets.all(16.0),
  //         child: Column(
  //           crossAxisAlignment: CrossAxisAlignment.start,
  //           children: [
  //             Row(
  //               crossAxisAlignment: CrossAxisAlignment.center,
  //               children: [
  //                 Icon(
  //                   record.isChecked ? Icons.check_circle : Icons.warning,
  //                   color: record.isChecked ? Colors.green : Colors.red,
  //                   size: 18,
  //                 ),
  //                 const SizedBox(width: 8),
  //                 Expanded(
  //                   child: Column(
  //                     crossAxisAlignment: CrossAxisAlignment.start,
  //                     children: [
  //                       Text(
  //                         DateFormat('EEEE, dd MMMM', 'id_ID')
  //                             .format(record.date),
  //                         style: const TextStyle(
  //                             fontWeight: FontWeight.bold, fontSize: 16),
  //                       ),
  //                       // Text(record.location,
  //                       //     style: TextStyle(
  //                       //         fontSize: 13, color: Colors.grey[600])),
  //                     ],
  //                   ),
  //                 ),
  //                 Container(
  //                   padding:
  //                       const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
  //                   decoration: BoxDecoration(
  //                     color: _getStatusColor(record.status).withOpacity(0.1),
  //                     borderRadius: BorderRadius.circular(6),
  //                   ),
  //                   child: Text(
  //                     record.status,
  //                     style: TextStyle(
  //                       color: _getStatusColor(record.status),
  //                       fontWeight: FontWeight.bold,
  //                       fontSize: 12,
  //                     ),
  //                   ),
  //                 ),
  //               ],
  //             ),
  //             const Divider(height: 25, color: Color(0xFFEEEEEE)),
  //             Row(
  //               mainAxisAlignment: MainAxisAlignment.spaceBetween,
  //               children: [
  //                 _detailColumn('Mulai', record.checkInTime),
  //                 _detailColumn('Selesai', record.checkOutTime),
  //                 _detailColumn('Durasi', record.duration, isDuration: true),
  //               ],
  //             ),
  //             if (record.notes != null && record.notes!.isNotEmpty)
  //               Padding(
  //                 padding: const EdgeInsets.only(top: 8.0),
  //                 child: Text("Catatan: ${record.notes!}",
  //                     style:
  //                         const TextStyle(fontSize: 13, color: Colors.black54)),
  //               ),
  //           ],
  //         ),
  //       ),
  //     ),
  //   );
  // }

  // Widget _detailColumn(String label, String value, {bool isDuration = false}) {
  //   return Column(
  //     crossAxisAlignment: CrossAxisAlignment.start,
  //     children: [
  //       Text(label, style: TextStyle(fontSize: 13, color: Colors.grey[600])),
  //       const SizedBox(height: 4),
  //       Text(
  //         value,
  //         style: TextStyle(
  //           fontSize: 16,
  //           fontWeight: isDuration ? FontWeight.bold : FontWeight.w600,
  //           color: isDuration ? Colors.blueAccent : Colors.black87,
  //         ),
  //       ),
  //     ],
  //   );
  // }

  Widget _buildAttendanceItem(AttendanceRecord record) {
    return InkWell(
      onTap: () {
        Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => AttendanceDetailPage(
                  detail: AttendanceDetail(
                dateString: DateFormat('EEEE, dd MMMM yyyy', 'id_ID')
                    .format(record.date),
                locationName: "RS Bhayangkara",
                status: record.status,
                checkInTime: record.checkInTime,
                checkOutTime: record.checkOutTime,
                totalDuration: record.duration,
                workSchedule: record.workSchedule,
                shiftName: record.shiftName,
                checkInLocationDetail: record.checkInLocationDetail ?? "-",
                checkOutLocationDetail: record.checkOutLocationDetail ?? "-",
                notes: record.notes,
                // lateDuration: record.lateDuration,
                lateDuration: record.lateDuration,
                // evidencePhoto: record.evidencePhoto,
                checkInEvidencePhoto: record.checkInEvidencePhoto,
                checkOutEvidencePhoto: record.checkOutEvidencePhoto,
                userType: record.userType,
              )),
            ));
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      DateFormat('dd MMMM yyyy', 'id_ID').format(record.date),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      DateFormat('EEEE', 'id_ID').format(record.date),
                      style: TextStyle(color: Colors.black87, fontSize: 14),
                    ),
                  ],
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getStatusColor(record.status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _getStatusIcon(record.status),
                        size: 14,
                        color: _getStatusColor(record.status),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        record.status,
                        style: TextStyle(
                          color: _getStatusColor(record.status),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildTimeDetail(
                  icon: Icons.login_rounded,
                  colorIcon: Colors.green,
                  label: 'Masuk',
                  time: record.checkInTime,
                ),
                const SizedBox(width: 120),
                _buildTimeDetail(
                  icon: Icons.logout_rounded,
                  colorIcon: Colors.red,
                  label: 'Keluar',
                  time: record.checkOutTime,
                ),
              ],
            ),
            // Row(
            //   children: [
            //     Expanded(
            //       // Menggunakan Expanded agar kolom kiri mengambil 50% lebar
            //       child: _buildTimeDetail(
            //         icon: Icons.login_rounded,
            //         label: 'Check In',
            //         time: record.checkInTime,
            //       ),
            //     ),
            //     Expanded(
            //       child: _buildTimeDetail(
            //         icon: Icons.logout_rounded,
            //         label: 'Check Out',
            //         time: record.checkOutTime,
            //       ),
            //     ),
            //   ],
            // ),
            // const SizedBox(height: 16),
            const Divider(height: 25, thickness: 0.8, color: Color(0xFFD9D9D9)),
            Row(
              children: [
                Icon(Icons.history_toggle_off_rounded,
                    size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 6),
                Text(
                  "Durasi: ${record.duration}",
                  style: TextStyle(
                    color: Colors.black87,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            if (record.status.toLowerCase() == 'terlambat')
              Padding(
                padding: const EdgeInsets.only(top: 6.0),
                child: Row(
                  children: [
                    Icon(Icons.info_outline,
                        size: 16, color: Colors.grey.shade600),
                    const SizedBox(width: 6),
                    Text(
                      "Terlambat ${record.lateDuration}",
                      style: TextStyle(fontSize: 13, color: Colors.black54),
                    ),
                  ],
                ),
              ),
            if (record.notes != null && record.notes!.isNotEmpty)
              Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Row(
                    children: [
                      Icon(Icons.note_outlined,
                          size: 16, color: Colors.grey.shade600),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Keterangan: ${record.notes!}",
                          style: const TextStyle(
                            fontSize: 13,
                            color: Colors.black54,
                          ),
                        ),
                      ),
                    ],
                  )),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeDetail(
      {required IconData icon,
      required String label,
      required String time,
      Color? colorIcon}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: colorIcon ?? Colors.grey.shade600),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Padding(
          padding: const EdgeInsets.only(left: 22),
          child: Text(
            time,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
        ),
      ],
    );
  }

  // --- SKELETON WIDGETS ---
  Widget _buildListSkeleton() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: 5, // Tampilkan 5 baris skeleton
      itemBuilder: (context, index) => _buildAttendanceItemSkeleton(),
    );
  }

  Widget _buildAttendanceItemSkeleton() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  skeletonLine(width: 120, height: 16),
                  const SizedBox(height: 6),
                  skeletonLine(width: 80, height: 14),
                ],
              ),
              skeletonLine(width: 70, height: 24), // Status badge skeleton
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: skeletonLine(height: 35)),
              const SizedBox(width: 20),
              Expanded(child: skeletonLine(height: 35)),
            ],
          ),
          const Divider(height: 30, thickness: 0.8),
          skeletonLine(width: 150, height: 14),
        ],
      ),
    );
  }

  Widget _buildStatusCardsSkeleton() {
    return GridView.count(
      crossAxisCount: 5,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 8,
      childAspectRatio: 0.68,
      children: List.generate(
          5,
          (index) => Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    skeletonLine(width: 25, height: 20),
                    const SizedBox(height: 8),
                    skeletonLine(width: 35, height: 10),
                  ],
                ),
              )),
    );
  }

  Widget skeletonLine({double width = double.infinity, double height = 12}) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(4),
        ),
      ),
    );
  }
}
