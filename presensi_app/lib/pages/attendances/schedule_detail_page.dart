import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'calendar_page.dart';
import '../shifts/shift_exchange_page.dart';
import "../../services/auth_service.dart";
import '../leaves/leave_form_page.dart';

class ScheduleDetailPage extends StatefulWidget {
  final Calendar shift;
  const ScheduleDetailPage({super.key, required this.shift});

  @override
  State<ScheduleDetailPage> createState() => _ScheduleDetailPageState();
}

class _ScheduleDetailPageState extends State<ScheduleDetailPage> {
  late Calendar shift;
  String? partnerName;
  bool isLoadingDetail = true;
  bool hasAttendance = false;
  String? userType;
  String? leaveStatusMessage;
  Color noteColor = Colors.orange;

  @override
  void initState() {
    super.initState();
    shift = widget.shift;
    _loadShiftDetail();
    _checkAttendance();
  }

  Future<void> _loadShiftDetail() async {
    if (!mounted) return;
    setState(() => isLoadingDetail = true);
    try {
      final detail =
          await AuthService().getShiftDetail(shift.shiftAssignmentId);
      final leaveRequests = await AuthService().getMyLeaveRequests();
      final shiftDateStr = DateFormat('yyyy-MM-dd').format(shift.date);

      var currentLeave = leaveRequests.firstWhere(
        (leave) => (leave['startDate'] == shiftDateStr),
        orElse: () => null,
      );

      setState(() {
        if (detail != null) {
          partnerName = detail['partnerName'];
          shift.exchangePending = detail['exchange_pending'] ?? false;
        }
        if (currentLeave != null) {
          String type = currentLeave['leaveType']['name'];
          String subType = currentLeave['leaveSubType']['name'];
          String status = _translateStatus(
              currentLeave['status'] ?? currentLeave['status']);

          leaveStatusMessage = "PENGAJUAN $type ($subType): $status";

          if (status.contains("Ditolak")) {
            noteColor = Colors.red;
          } else if (status.contains("Disetujui")) {
            noteColor = Colors.green;
          } else {
            noteColor = Colors.orange;
          }
        }

        isLoadingDetail = false;
      });
    } catch (e) {
      print('Error loading shift detail: $e');
      setState(() {
        isLoadingDetail = false;
      });
    }
  }

  Future<void> _checkAttendance() async {
    try {
      final attendances = await AuthService().getMyAttendances();

      final shiftDate = DateFormat('yyyy-MM-dd').format(shift.date);

      hasAttendance = attendances.any((att) =>
          att['date'] == shiftDate &&
          (att['checkIn'] != null || att['checkOut'] != null));
    } catch (e) {
      debugPrint('Error checking attendance: $e');
    }

    if (mounted) {
      setState(() {});
    }
  }

  void updateExchangePending(bool value) {
    setState(() {
      shift.exchangePending = value;
    });
  }

  Map<String, Color> shiftColors = {
    'Pagi': Colors.green.shade100,
    'Siang': Colors.orange.shade100,
    'Malam': Colors.blue.shade100,
    'Non-Shift': Colors.blueGrey.shade100,
    'Cuti': Colors.red.shade100,
    'Libur': Colors.yellow.shade100,
  };

  Map<String, Color> shiftTextColors = {
    'Pagi': Colors.green.shade700,
    'Siang': Colors.orange.shade700,
    'Malam': Colors.blue.shade700,
    'Non-Shift': Colors.blueGrey.shade700,
    'Cuti': Colors.red.shade700,
    'Libur': Colors.yellow.shade700,
  };

  String formatTime24(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  String _getNoteText() {
    List<String> notes = [];
    // 1. Cek Pengajuan Izin/Cuti/Dinas
    if (leaveStatusMessage != null) {
      notes.add("ℹ️ $leaveStatusMessage");
    }
    // 2. Cek Pengajuan Tukar Shift
    if (shift.exchangePending) {
      String partner = (partnerName != null && partnerName!.isNotEmpty)
          ? " dengan $partnerName"
          : "";
      notes.add("⚠️ TUKAR SHIFT: Sedang menunggu persetujuan$partner");
    }
    // 3. Cek Catatan Manual dari Database
    if (shift.note != null && shift.note!.isNotEmpty) {
      notes.add("${shift.note}");
    }
    // Jika tidak ada apa-apa
    if (notes.isEmpty) return 'Tidak ada catatan';
    return notes
        .join("\n\n"); // Gabungkan dengan baris baru jika ada banyak status
  }

  String _translateStatus(String status) {
    switch (status.toLowerCase()) {
      case 'pending_manager':
      case 'pending_sdm':
      case 'pending':
        return 'Sedang Diproses';
      case 'approved':
        return 'Disetujui';
      case 'rejected':
        return 'Ditolak';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateString = DateFormat('EEEE', 'id_ID').format(shift.date);
    final dateFull = DateFormat('d MMM yyyy', 'id_ID').format(shift.date);

    bool isHoliday =
        ['Libur', 'Cuti', 'Cuti Bersama', 'Nasional'].contains(shift.shiftName);
    bool showExchangeButton = shift.shiftName != 'Non-Shift' && !isHoliday;

    return Scaffold(
      // backgroundColor: Colors.grey[100],
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text("Detail Jadwal",
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF6F34FA),
      ),
      body: Stack(
        children: [
          Container(
            height: 120,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                // colors: [Color(0xFF6F34FA), Color(0xFF5C6BC0)],
                colors: [Color(0xFF6F34FA), Color(0xFF8E5CFC)],
              ),
            ),
          ),
          SingleChildScrollView(
            child: Column(
              children: [
                const SizedBox(height: 20),
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(25),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
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
                              Text(dateString,
                                  style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold)),
                              Text(dateFull,
                                  style: TextStyle(
                                      fontSize: 16,
                                      color: Colors.grey.shade600)),
                            ],
                          ),
                          if (isHoliday) ...[
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.red.shade100,
                                borderRadius: BorderRadius.circular(15),
                              ),
                              child: const Icon(Icons.calendar_today_outlined,
                                  color: Colors.red),
                            )
                          ] else ...[
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFE8EAF6),
                                borderRadius: BorderRadius.circular(15),
                              ),
                              child: const Icon(Icons.calendar_today_outlined,
                                  color: Color(0xFF6F34FA)),
                            )
                          ]
                        ],
                      ),
                      const SizedBox(height: 30),
                      if (isHoliday) ...[
                        _buildInfoRow(Icons.celebration, "Hari Libur",
                            shift.shiftName, Colors.red.shade50, Colors.red,
                            textColor: Colors.red),
                        const SizedBox(height: 20),
                        _buildInfoRow(
                            Icons.note_alt_outlined,
                            "Keterangan",
                            _getNoteText(),
                            Colors.orange.shade50,
                            Colors.orange),
                      ] else ...[
                        _buildInfoRow(
                            Icons.wb_sunny_outlined,
                            "Shift",
                            shift.shiftName,
                            Colors.purple.shade50,
                            Colors.purple),
                        const SizedBox(height: 20),
                        if (!isHoliday)
                          _buildInfoRow(
                            Icons.access_time,
                            "Jam Kerja",
                            "${DateFormat('HH:mm').format(DateTime(2024, 1, 1, shift.startTime.hour, shift.startTime.minute))} - ${DateFormat('HH:mm').format(DateTime(2024, 1, 1, shift.endTime.hour, shift.endTime.minute))}",
                            Colors.blue.shade50,
                            Colors.blue,
                          ),
                        const SizedBox(height: 20),
                        _buildInfoRow(Icons.location_on_outlined, "Lokasi", "-",
                            Colors.green.shade50, Colors.green),
                        const SizedBox(height: 20),
                        _buildInfoRow(
                          Icons.note_alt_outlined,
                          "Keterangan",
                          _getNoteText(),
                          // Colors.orange.shade50,
                          // Colors.orange,
                          noteColor.withOpacity(0.1),
                          noteColor,
                          textColor: noteColor,
                        ),
                      ]
                    ],
                  ),
                ),
                const SizedBox(height: 25),
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F4FF),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: Color(0xFF3F51B5)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          "Pastikan untuk mengajukan perubahan jadwal atau pengajuan cuti/izin maksimal 1 hari sebelumnya",
                          style: TextStyle(
                              fontSize: 13, color: Colors.blue.shade900),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 120),
              ],
            ),
          ),
        ],
      ),
      // bottomSheet: _buildBottomButtons(isShiftUser),
      bottomSheet: _buildBottomButtons(showExchangeButton),
    );
  }

  Widget _buildInfoRow(
    IconData icon,
    String label,
    String value,
    Color bgIcon,
    Color iconColor, {
    Color? textColor,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
              color: bgIcon, borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: iconColor, size: 20),
        ),
        const SizedBox(width: 15),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(color: Colors.grey, fontSize: 13)),
            Text(value,
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: textColor ?? Colors.black)),
          ],
        )
      ],
    );
  }

  Widget _buildBottomButtons(bool showExchangeButton) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final shiftDateOnly =
        DateTime(shift.date.year, shift.date.month, shift.date.day);
    bool isDateActive = !shiftDateOnly.isBefore(today);
    bool isTooLate = shiftDateOnly.difference(today).inDays < 2;
    bool isDatePast = shiftDateOnly.isBefore(today);
    bool disableExchange =
        isDatePast || isTooLate || shift.exchangePending || hasAttendance;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black12,
              blurRadius: 10,
              offset: const Offset(0, -2))
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: !isDateActive
                  // onPressed: !(isDateActive ?? false)
                  ? null
                  : () => Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => const LeaveFormPage())),
              style: ElevatedButton.styleFrom(
                backgroundColor: isDateActive
                    ? const Color(0xFF6F34FA)
                    : Colors.grey.shade300,
                foregroundColor:
                    isDateActive ? Colors.white : Colors.grey.shade300,
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15)),
                elevation: isDateActive ? 2 : 0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add_box_outlined,
                      size: 20,
                      color:
                          isDateActive ? Colors.white : Colors.grey.shade600),
                  SizedBox(width: 8),
                  Text("Ajukan Pengajuan",
                      style: TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
          // if (isShiftUser) ...[
          if (showExchangeButton && shift.shiftName != 'Non-Shift') ...[
            // if ((showExchangeButton ?? false) &&
            //     shift.shiftName != 'Non-Shift') ...[
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton(
                onPressed: disableExchange
                    ? null
                    : () async {
                        final result = await Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (context) =>
                                    ChangeShiftPage(selectedShift: shift)));
                        if (result == true) _loadShiftDetail();
                      },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  side: BorderSide(
                      color: disableExchange
                          ? Colors.grey.shade300
                          : const Color(0xFF6F34FA)),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15)),
                ),
                child: Text(
                  shift.exchangePending ? "Pending..." : "Tukar Jadwal",
                  style: TextStyle(
                      color: disableExchange
                          ? Colors.grey.shade400
                          : const Color(0xFF6F34FA),
                      fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ]
        ],
      ),
    );
  }
}
