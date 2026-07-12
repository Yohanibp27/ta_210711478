import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:presensi_app/services/auth_service.dart';
import 'package:presensi_app/models/user_activity.dart';
// import 'package:presensi_app/pages/activities/attendance_activity_page.dart';
import 'package:presensi_app/pages/attendances/attendance_detail_page.dart';
import 'package:presensi_app/pages/leaves/leave_detail_page.dart';
import 'package:presensi_app/pages/shifts/shift_exchange_detail_page.dart';
import 'package:presensi_app/pages/shifts/accept_shift_change_request_page.dart';
import 'package:presensi_app/utils/profile_helper.dart';
import 'package:shimmer/shimmer.dart';

class ActivityItem {
  final String title;
  final String description;
  final String date;
  final String time;
  final IconData icon;
  final Color iconColor;
  final Color iconBackgroundColor;
  final bool hasIndicator;
  final UserActivity originalData;

  ActivityItem({
    required this.title,
    required this.description,
    required this.date,
    required this.time,
    required this.icon,
    required this.iconColor,
    required this.iconBackgroundColor,
    this.hasIndicator = false,
    required this.originalData,
  });
}

ActivityItem convertActivityToActivities(UserActivity a) {
  IconData icon = Icons.info;
  Color color = Colors.grey;
  String title = "Aktivitas";

  if (a.category == "attendance") {
    title = "Presensi";
    if (a.action == "success") {
      icon = Icons.login;
      color = Colors.green;
      title = "Presensi Masuk";
    } else if (a.action == "late") {
      icon = Icons.access_time;
      color = Colors.orange;
      title = "Presensi Masuk Terlambat";
    } else if (a.action == "completed") {
      icon = Icons.logout;
      color = Colors.blue;
      title = "Presensi Pulang";
    } else if (a.action == "missed") {
      icon = Icons.error_outline;
      color = Colors.red;
      title = "Tidak Melakukan Presensi";
    } else if (a.action == "invalid") {
      icon = Icons.block;
      color = Colors.grey;
      title = "Presensi Tidak Valid";
    } else {
      icon = Icons.warning_amber;
      color = Colors.blueGrey;
      title = "Aktivitas Presensi";
    }
  } else if (a.category == "shift_exchange") {
    title = "Tukar Shift";
    if (a.action == "submitted") {
      icon = Icons.send;
      color = Colors.blue;
      title = "Tukar Shift Terkirim";
    } else if (a.action == "approved") {
      icon = Icons.swap_horizontal_circle_outlined;
      color = Colors.green;
      title = "Tukar Shift Disetujui";
    } else if (a.action == "rejected") {
      icon = Icons.cancel;
      color = Colors.red;
      title = "Tukar Shift Ditolak";
    } else if (a.action == "request_received") {
      icon = Icons.inbox;
      color = Colors.orange;
      title = "Permintaan Tukar Shift";
    } else if (a.action == "cancelled") {
      icon = Icons.cancel_outlined;
      color = Colors.redAccent;
      title = "Tukar Shift Dibatalkan";
    } else {
      icon = Icons.swap_horiz;
      color = Colors.grey;
      title = "Aktivitas Tukar Shift";
    }
  } else if (a.category == "leave") {
    title = "Pengajuan Izin / Cuti / Dinas Luar";
    if (a.action == "submitted") {
      color = Colors.purple;
      icon = Icons.description;
      title = "Pengajuan Terkirim";
    } else if (a.action == "approved") {
      icon = Icons.check_circle;
      color = Colors.green;
      title = "Pengajuan Disetujui";
    } else if (a.action == "rejected") {
      icon = Icons.cancel;
      color = Colors.red;
      title = "Pengajuan Ditolak";
    } else if (a.action == "cancelled") {
      icon = Icons.cancel_schedule_send;
      color = Colors.redAccent;
      title = "Pengajuan Dibatalkan";
    } else {
      icon = Icons.swap_horiz;
      color = Colors.grey;
      title = "Aktivitas Pengajuan Izin/Cuti/Dinas Luar";
    }
  }

  final dt = DateTime.parse(a.createdAt).toLocal();
  final String day = DateFormat('EEEE', 'id_ID').format(dt);
  final String formattedDate = DateFormat('dd MMMM yyyy', 'id_ID').format(dt);
  final String date = "$day, $formattedDate";
  final String time = DateFormat('HH:mm').format(dt);

  return ActivityItem(
    title: title,
    description: a.description,
    date: date,
    time: time,
    icon: icon,
    iconColor: color,
    iconBackgroundColor: color.withOpacity(0.1),
    hasIndicator: !a.isRead,
    originalData: a,
  );
}

class ActivityPage extends StatefulWidget {
  const ActivityPage({super.key});

  @override
  _ActivityPageState createState() => _ActivityPageState();
}

class _ActivityPageState extends State<ActivityPage> {
  List<ActivityItem> notifications = [];
  List<ActivityItem> attendances = [];
  List<ActivityItem> leaves = [];
  // List<UserActivity> activities = [];
  List<dynamic> activities = []; // Sesuaikan tipe data dengan modelmu
  bool isLoading = true;
  bool isShiftUser = false;
  String selectedFilter = "Semua";
  Map<String, dynamic>? currentUserProfile;

  @override
  void initState() {
    super.initState();
    _loadActivities();
  }

  Future<void> _loadActivities() async {
    try {
      final fetchedData = await AuthService().fetchUserActivities();
      final userProfile = await AuthService().getProfile();
      if (mounted) {
        final profileData = userProfile?['data'];
        setState(() {
          activities = fetchedData;
          notifications =
              fetchedData.map((a) => convertActivityToActivities(a)).toList();
          currentUserProfile = userProfile;
          isShiftUser =
              (profileData?['employmentType']?.toString().toLowerCase() ==
                  'shift');
          print("EMPLOYMENT TYPE: ${profileData?['employmentType']}");
          print("IS SHIFT USER: $isShiftUser");

          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => isLoading = false);
    }
  }

  int _getCount(String type) {
    if (type == "Semua") return activities.length;
    if (type == "Presensi")
      return activities.where((a) => a.category == "attendance").length;
    if (type == "Tukar Shift")
      return activities.where((a) => a.category == "shift_exchange").length;
    if (type == "Izin & Cuti")
      return activities.where((a) => a.category == "leave").length;
    if (type == "Dinas Luar")
      return activities
          .where((a) =>
              a.category == "leave" &&
              a.description.toLowerCase().contains("dinas luar"))
          .length;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final filteredItems = notifications.where((item) {
      // if (selectedFilter == "Semua") return true;
      // if (selectedFilter == "Presensi") return item.title.contains("Presensi");
      // if (selectedFilter == "Tukar Shift") return item.title.contains("Shift");
      // if (selectedFilter == "Izin & Cuti")
      //   return item.title.contains("Izin") || item.title.contains("Cuti");
      // if (selectedFilter == "Dinas Luar") {
      //   return item.title.contains("Dinas Luar");
      // }

      final activity = item.originalData; // Patokannya pakai data mentah

      if (selectedFilter == "Semua") return true;
      if (selectedFilter == "Presensi") {
        return activity.category == "attendance";
      }
      if (selectedFilter == "Tukar Shift") {
        return activity.category == "shift_exchange";
      }
      if (selectedFilter == "Izin & Cuti") {
        return activity.category == "leave" &&
            !activity.description.toLowerCase().contains("dinas luar");
      }
      if (selectedFilter == "Dinas Luar") {
        return activity.category == "leave" &&
            activity.description.toLowerCase().contains("dinas luar");
      }

      return true;
    }).toList();

    List<String> availableFilters = [
      "Semua",
      "Presensi",
      "Izin & Cuti",
      "Dinas Luar"
    ];
    if (isShiftUser) {
      availableFilters.add("Tukar Shift");
    }
    // availableFilters.addAll(["Izin & Cuti", "Dinas Luar"]);

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
            const SizedBox(
              height: 10,
            ),
            isLoading
                ? _buildSummaryCardsSkeleton()
                : SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        _buildSummaryCard("Semua", _getCount("Semua"),
                            Color(0xFFF5E5E5), Colors.red, Icons.fingerprint),
                        _buildSummaryCard("Presensi", _getCount("Presensi"),
                            Color(0xFFE6FDE3), Colors.green, Icons.fingerprint),
                        if (isShiftUser)
                          _buildSummaryCard(
                              "Tukar Shift",
                              _getCount("Tukar Shift"),
                              const Color(0xFFF3E5F5),
                              Colors.purple,
                              Icons.calendar_today),
                        _buildSummaryCard(
                            "Izin & Cuti",
                            _getCount("Izin & Cuti"),
                            const Color(0xFFFFF3E0),
                            Colors.orange,
                            Icons.description),
                        _buildSummaryCard("Dinas Luar", _getCount("Dinas Luar"),
                            const Color(0xFFE3F2FD), Colors.blue, Icons.work),
                      ],
                    ),
                  ),
            const SizedBox(
              height: 2,
            ),
            isLoading
                ? _buildFilterChipsSkeleton()
                : SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: availableFilters.map((filter) {
                        bool isSelected = selectedFilter == filter;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(filter),
                            selected: isSelected,
                            onSelected: (val) =>
                                setState(() => selectedFilter = filter),
                            selectedColor: Colors.blueAccent,
                            labelStyle: TextStyle(
                                color:
                                    isSelected ? Colors.white : Colors.black87),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
            const SizedBox(height: 10),
            Expanded(
              child: isLoading
                  ? _buildTimelineListSkeleton()
                  : filteredItems.isEmpty
                      ? const Center(child: Text("Tidak ada aktivitas"))
                      : ListView.builder(
                          itemCount: filteredItems.length,
                          padding: const EdgeInsets.only(bottom: 20),
                          itemBuilder: (context, index) {
                            final item = filteredItems[index];
                            final activity = item.originalData;
                            return InkWell(
                              onTap: () async {
                                if (activity.category == "attendance") {
                                  final detailDb = activity.detail ?? {};
                                  final userObj = detailDb['user'];
                                  String formatDate(String dateStr) {
                                    try {
                                      final date =
                                          DateTime.parse(dateStr).toLocal();
                                      return DateFormat(
                                              'EEEE, dd MMMM yyyy', 'id_ID')
                                          .format(date);
                                    } catch (e) {
                                      return "Tanggal tidak valid";
                                    }
                                  }

                                  String formatTime(String? isoStr) {
                                    if (isoStr == null) return "--:--";
                                    try {
                                      return DateFormat('HH:mm').format(
                                          DateTime.parse(isoStr).toLocal());
                                    } catch (e) {
                                      return "--:--";
                                    }
                                  }

                                  String calculateDuration(
                                      String? start, String? end) {
                                    if (start == null || end == null)
                                      return "-";
                                    try {
                                      final startTime = DateTime.parse(start);
                                      final endTime = DateTime.parse(end);
                                      final duration =
                                          endTime.difference(startTime);
                                      final hours = duration.inHours;
                                      final minutes =
                                          duration.inMinutes.remainder(60);
                                      return "${hours}j ${minutes}m";
                                    } catch (e) {
                                      return "-";
                                    }
                                  }

                                  final attendanceDetail = AttendanceDetail(
                                      dateString: formatDate(detailDb['date'] ??
                                          activity.createdAt),
                                      locationName: "RS Bhayangkara",
                                      status: detailDb['attendanceStatus'] ??
                                          "Tidak diketahui",
                                      // evidencePhoto: detailDb['evidencePhoto'],
                                      checkInEvidencePhoto:
                                          detailDb['checkInEvidencePhoto'],
                                      checkOutEvidencePhoto:
                                          detailDb['checkOutEvidencePhoto'],
                                      checkInTime:
                                          formatTime(detailDb['checkInTime']),
                                      checkOutTime:
                                          formatTime(detailDb['checkOutTime']),
                                      totalDuration: calculateDuration(
                                          detailDb['checkInTime'],
                                          detailDb['checkOutTime']),
                                      userType:
                                          isShiftUser ? "Shift" : "Non-Shift",
                                      shiftName:
                                          isShiftUser ? "Shift" : "Non-Shift",
                                      workSchedule: detailDb['workShift'] !=
                                              null
                                          ? "${detailDb['workShift']['startTime']} - ${detailDb['workShift']['endTime']}"
                                          : "Non-Shift",
                                      lateDuration: detailDb['lateTime'],
                                      checkInLocationDetail:
                                          detailDb['checkInLocation'] ?? "-",
                                      checkOutLocationDetail:
                                          detailDb['checkOutLocation'] ?? "-",
                                      notes: detailDb['notes']);

                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          AttendanceDetailPage(
                                              detail: attendanceDetail),
                                    ),
                                  );
                                } else if (activity.category == "leave") {
                                  // bisa status submitted, approved, rejected, cancelled, atau expired
                                  final detailDb = activity.detail ?? {};
                                  final userObj = detailDb['user'] ?? {};
                                  final managerObj = detailDb['manager'];
                                  final sdmObj = detailDb['sdm'];
                                  bool isImageFile(String url) {
                                    final ext = url.toLowerCase();
                                    return ext.endsWith('.jpg') ||
                                        ext.endsWith('.jpeg') ||
                                        ext.endsWith('.png') ||
                                        ext.endsWith('.webp');
                                  }

                                  bool isPdfFile(String url) {
                                    return url.toLowerCase().endsWith('.pdf');
                                  }

                                  final rawFile = detailDb['evidenceFile'];
                                  const String imageBaseUrl =
                                      "http://192.168.100.199:3000/uploads/evidence/";
                                  final evidenceUrl = rawFile != null
                                      ? ProfileHelper.fixImageUrl(
                                          "$imageBaseUrl$rawFile")
                                      : null;

                                  final leaveDetailData = LeaveDetail(
                                    id: detailDb['id'] ?? 0,
                                    leaveType:
                                        detailDb['leavetype']?['name'] ?? "-",
                                    leaveSubType: detailDb['leavesubtype']
                                            ?['name'] ??
                                        "-",
                                    startDate: detailDb['startDate'] ??
                                        activity.createdAt,
                                    endDate: detailDb['endDate'] ??
                                        activity.createdAt,
                                    note: detailDb['note'] ?? "-",
                                    createdAt: activity.createdAt,
                                    status: detailDb['status'] ?? "pending",
                                    evidenceFile: detailDb['evidenceFile'] !=
                                            null
                                        ? "$imageBaseUrl${detailDb['evidenceFile']}"
                                        : null,
                                    fullName: userObj['fullName'] ?? "Karyawan",
                                    nip: userObj['nip'] ?? "-",
                                    position:
                                        userObj['position']?['name'] ?? "-",
                                    department: userObj['position']?['division']
                                            ?['department']?['name'] ??
                                        "-",
                                    positionManager:
                                        managerObj?['position']?['name'] ?? "-",
                                    positionSdm:
                                        sdmObj?['position']?['name'] ?? "-",
                                    managerName: managerObj != null
                                        ? (managerObj['titlePrefix']
                                                    ?.toString()
                                                    .isNotEmpty ==
                                                true
                                            ? "${managerObj['titlePrefix']}. ${managerObj['fullName']}"
                                            : managerObj['fullName'])
                                        : null,
                                    sdmName: sdmObj != null
                                        ? (sdmObj['titlePrefix']
                                                    ?.toString()
                                                    .isNotEmpty ==
                                                true
                                            ? "${sdmObj['titlePrefix']}. ${sdmObj['fullName']}"
                                            : sdmObj['fullName'])
                                        : null,
                                    managerAt: detailDb['managerDecisionAt'],
                                    sdmAt: detailDb['sdmDecisionAt'],
                                    isApprovedByManager:
                                        detailDb['managerDecisionAt'] != null ||
                                            detailDb['managerStatus'] ==
                                                'approved',
                                    isApprovedBySdm:
                                        detailDb['sdmDecisionAt'] != null ||
                                            detailDb['sdmStatus'] == 'approved',
                                  );
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => LeaveDetailPage(
                                          detail: leaveDetailData),
                                    ),
                                  );
                                } else if (activity.category ==
                                        "shift_exchange" &&
                                    activity.action == "submitted") {
                                  // bisa status submitted, approved, rejected, request received, cancelled, atau expired
                                  // DARI SISI PENGAJU PARTNER PENGAJUAN TUKAR SHIFT DITOLAK OLEH MANAGER/SDM BELUM ADA/BELUM BISA LIHAT DETAIL
                                  final detailDb = activity.detail ?? {};
                                  final userDb = activity.user ?? {};
                                  final requesterObj = detailDb['requester'];
                                  final partnerObj = detailDb['partner'];
                                  final managerObj = detailDb['manager'];
                                  final sdmObj = detailDb['sdm'];
                                  final reqShift = detailDb['requesterShift'];
                                  final partShift = detailDb['partnerShift'];
                                  const String imageBaseUrl =
                                      "http://192.168.100.199:3000/uploads/profile/";

                                  final ShiftExchangeData = ShiftExchangeDetail(
                                    id: detailDb["id"] ?? 0,
                                    status: detailDb["status"] ?? "-",
                                    reason: detailDb["reason"] ?? "-",
                                    partnerDecision:
                                        detailDb["partnerDecisionNote"],
                                    sdmDecision:
                                        detailDb["managerDecisionNote"],
                                    managerDecision:
                                        detailDb["sdmDecisionNote"],
                                    expiryDate: detailDb["expiryDate"] ?? "-",
                                    createdAt: detailDb["createdAt"] ?? "-",
                                    requesterName:
                                        requesterObj?['fullName'] ?? '-',
                                    requesterNip: requesterObj?['nip'] ?? '-',
                                    requestPosition: requesterObj?['position']
                                            ?['name'] ??
                                        "-",
                                    requesterPhoto: requesterObj?[
                                                'profilePhoto'] !=
                                            null
                                        ? "$imageBaseUrl${requesterObj['profilePhoto']}"
                                        : null,
                                    partnerName: partnerObj?['fullName'] ?? '-',
                                    partnerNip: partnerObj?['nip'] ?? '-',
                                    partnerPostion:
                                        partnerObj?['position']?['name'] ?? "-",
                                    partnerPhoto: partnerObj?['profilePhoto'] !=
                                            null
                                        ? "$imageBaseUrl${partnerObj['profilePhoto']}"
                                        : null,
                                    requesterShiftName: reqShift?['shiftDetail']
                                            ?['name'] ??
                                        '-',
                                    requesterShiftTime:
                                        "${reqShift?['shiftDetail']?['startTime'] ?? '-'} - ${reqShift?['shiftDetail']?['endTime'] ?? '-'}",
                                    requesterShiftDate:
                                        reqShift?['date'] ?? '-',
                                    partnerShiftName: partShift?['shiftDetail']
                                            ?['name'] ??
                                        '-',
                                    partnerShiftTime:
                                        "${partShift?['shiftDetail']?['startTime'] ?? '-'} - ${partShift?['shiftDetail']?['endTime'] ?? '-'}",
                                    partnerShiftDate: partShift?['date'] ?? '-',
                                    managerName: managerObj?['fullName'],
                                    sdmName: sdmObj?['fullName'],
                                    partnerDecisionAt:
                                        detailDb["partnerDecisionAt"],
                                    managerDecisionAt:
                                        detailDb["managerDecisionAt"],
                                    sdmDecisionAt: detailDb["sdmDecisionAt"],
                                    partnerStatus:
                                        detailDb["partnerStatus"] ?? "Pending",
                                    managerStatus:
                                        detailDb["managerStatus"] ?? "-",
                                    sdmStatus: detailDb["sdmStatus"] ?? "-",
                                  );

                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          ShiftExchangeDetailPage(
                                              detail: ShiftExchangeData),
                                    ),
                                  );
                                } else if (activity.category ==
                                        "shift_exchange" &&
                                    activity.action == "request_received") {
                                  final detailDb = activity.detail ?? {};
                                  final userDb = activity.user ?? {};
                                  final requesterObj = detailDb['requester'];
                                  final reqShift = detailDb['requesterShift'];
                                  final partShift = detailDb['partnerShift'];

                                  const String imageBaseUrl =
                                      "http://192.168.100.199:3000/uploads/profile/";

                                  String getDayName(String dateString) {
                                    try {
                                      final date = DateTime.parse(dateString);
                                      return DateFormat('EEEE', 'id_ID')
                                          .format(date);
                                    } catch (e) {
                                      return '-';
                                    }
                                  }

                                  final shiftRequestData =
                                      ShiftChangeRequestDetail(
                                    id: detailDb["id"] ?? 0,
                                    requesterName:
                                        requesterObj?['fullName'] ?? '-',
                                    requesterRole: requesterObj?['profession']
                                            ?['name'] ??
                                        '-',
                                    requesterUnit: requesterObj?['position']
                                            ?['name'] ??
                                        '-',
                                    requesterEmployeeId:
                                        requesterObj?['nip'] ?? '-',
                                    requesterAvatar: requesterObj?[
                                                'profilePhoto'] !=
                                            null
                                        ? "$imageBaseUrl${requesterObj['profilePhoto']}"
                                        : '',
                                    // givenShift: ShiftInfo(
                                    //   day: reqShift?['shiftDetail']
                                    //           ?['name'] ??
                                    //       '-',
                                    //   date: reqShift?['date'] ?? '-',
                                    //   time:
                                    //       "${reqShift?['shiftDetail']?['startTime'] ?? '-'} - ${reqShift?['shiftDetail']?['endTime'] ?? '-'}",
                                    //   location: "IGD",
                                    //   type: reqShift?['shiftDetail']
                                    //           ?['name'] ??
                                    //       '-',
                                    // ),
                                    givenShift: ShiftInfo(
                                      day: getDayName(reqShift?['date'] ?? ''),
                                      date: reqShift?['date'] ?? '-',
                                      time:
                                          "${reqShift?['shiftDetail']?['startTime'] ?? '-'} - ${reqShift?['shiftDetail']?['endTime'] ?? '-'}",
                                      location: "IGD",
                                      type: reqShift?['shiftDetail']?['name'] ??
                                          '-',
                                    ),
                                    receivedShift: ShiftInfo(
                                      day: getDayName(partShift?['date'] ?? ''),
                                      date: partShift?['date'] ?? '-',
                                      time:
                                          "${partShift?['shiftDetail']?['startTime'] ?? '-'} - ${partShift?['shiftDetail']?['endTime'] ?? '-'}",
                                      location: "IGD",
                                      type: partShift?['shiftDetail']
                                              ?['name'] ??
                                          '-',
                                    ),
                                    reason: detailDb["reason"] ?? '-',
                                    createdAt: DateTime.tryParse(
                                            detailDb["createdAt"] ?? '') ??
                                        DateTime.now(),
                                    expiryDate: DateTime.tryParse(
                                            detailDb["expiryDate"] ?? '') ??
                                        DateTime.now(),
                                    status: detailDb["status"] ?? "Pending",
                                  );

                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          AcceptShiftChangeRequestPage(
                                        detail: shiftRequestData,
                                      ),
                                    ),
                                  );
                                } else if (activity.category ==
                                        "shift_exchange" &&
                                    activity.action == "cancelled") {
                                  showDialog(
                                    context: context,
                                    barrierDismissible: false,
                                    builder: (context) => const Center(
                                        child: CircularProgressIndicator()),
                                  );
                                  try {
                                    final result = await AuthService()
                                        .getShiftExchangeById(
                                            activity.referenceId);
                                    Navigator.pop(context);
                                    if (result['success']) {
                                      final detailDb = result['data'];
                                      final requesterObj =
                                          detailDb['requester'];
                                      final partnerObj = detailDb['partner'];
                                      final managerObj = detailDb['manager'];
                                      final sdmObj = detailDb['sdm'];
                                      final reqShift =
                                          detailDb['requesterShift'];
                                      final partShift =
                                          detailDb['partnerShift'];
                                      const String imageBaseUrl =
                                          "http://192.168.100.199:3000/uploads/profile/";

                                      final shiftExchangeData =
                                          ShiftExchangeDetail(
                                        id: detailDb["id"] ?? 0,
                                        status: detailDb["status"] ?? "-",
                                        reason: detailDb["reason"] ?? "-",
                                        requesterName:
                                            requesterObj?['fullName'] ?? '-',
                                        requesterNip:
                                            requesterObj?['nip'] ?? '-',
                                        requestPosition:
                                            requesterObj?['position']
                                                    ?['name'] ??
                                                "-",
                                        requesterPhoto: requesterObj?[
                                                    'profilePhoto'] !=
                                                null
                                            ? "$imageBaseUrl${requesterObj['profilePhoto']}"
                                            : null,
                                        partnerName:
                                            partnerObj?['fullName'] ?? '-',
                                        partnerNip: partnerObj?['nip'] ?? '-',
                                        partnerPostion: partnerObj?['position']
                                                ?['name'] ??
                                            "-",
                                        partnerPhoto: partnerObj?[
                                                    'profilePhoto'] !=
                                                null
                                            ? "$imageBaseUrl${partnerObj['profilePhoto']}"
                                            : null,
                                        requesterShiftName:
                                            reqShift?['workShift']?['name'] ??
                                                '-',
                                        requesterShiftTime:
                                            "${reqShift?['workShift']?['startTime'] ?? '-'} - ${reqShift?['workShift']?['endTime'] ?? '-'}",
                                        requesterShiftDate:
                                            reqShift?['date'] ?? '-',
                                        partnerShiftName:
                                            partShift?['workShift']?['name'] ??
                                                '-',
                                        partnerShiftTime:
                                            "${partShift?['workShift']?['startTime'] ?? '-'} - ${partShift?['workShift']?['endTime'] ?? '-'}",
                                        partnerShiftDate:
                                            partShift?['date'] ?? '-',
                                        partnerStatus:
                                            detailDb["partnerStatus"] ??
                                                "pending",
                                        partnerDecision:
                                            detailDb["partnerDecisionNote"],
                                        partnerDecisionAt:
                                            detailDb["partnerDecisionAt"],
                                        managerName: managerObj?['fullName'],
                                        managerStatus:
                                            detailDb["managerStatus"] ??
                                                "pending",
                                        managerDecision:
                                            detailDb["managerDecisionNote"],
                                        managerDecisionAt:
                                            detailDb["managerDecisionAt"],
                                        sdmName: sdmObj?['fullName'],
                                        sdmStatus:
                                            detailDb["sdmStatus"] ?? "pending",
                                        sdmDecision:
                                            detailDb["sdmDecisionNote"],
                                        sdmDecisionAt:
                                            detailDb["sdmDecisionAt"],
                                        expiryDate: detailDb["expiryDate"],
                                        createdAt: detailDb["createdAt"],
                                      );

                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              ShiftExchangeDetailPage(
                                                  detail: shiftExchangeData),
                                        ),
                                      );
                                    } else {
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        SnackBar(
                                          content: Text(result['message']),
                                          behavior: SnackBarBehavior.floating,
                                        ),
                                      );
                                    }
                                  } catch (e) {
                                    Navigator.pop(context);
                                    print("Error fetching detail: $e");
                                  }
                                }
                              },
                              child: ActivityCard(
                                item: item,
                                isFirst: index == 0,
                                isLast: index == filteredItems.length - 1,
                              ),
                            );
                          },
                        ),
            ),
          ],
        )
      ],
    ));
  }

  Widget _buildSummaryCard(
      String title, int count, Color bgColor, Color textColor, IconData icon) {
    return Container(
      width: 86,
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Text(count.toString(),
              style: TextStyle(
                  fontSize: 20, fontWeight: FontWeight.bold, color: textColor)),
          Text(title,
              style: TextStyle(
                  fontSize: 12, color: textColor, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  // --- SKELETON WIDGETS ---
  Widget _buildSummaryCardsSkeleton() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: List.generate(
            4,
            (index) => Container(
                  width: 86,
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white, // Kartu tetap putih solid
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    children: [
                      skeletonLine(width: 25, height: 20),
                      const SizedBox(height: 8),
                      skeletonLine(width: 50, height: 12),
                    ],
                  ),
                )),
      ),
    );
  }

  Widget _buildFilterChipsSkeleton() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: List.generate(
            4,
            (index) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: skeletonLine(width: 80, height: 32, radius: 16),
                )),
      ),
    );
  }

  Widget _buildTimelineListSkeleton() {
    return ListView.builder(
      itemCount: 5, // Jumlah bayangan yang ditampilkan
      padding: const EdgeInsets.only(bottom: 20),
      itemBuilder: (context, index) {
        return _buildActivityCardSkeleton(
          isFirst: index == 0,
          isLast: index == 4,
        );
      },
    );
  }

  // Desain ini meniru struktur widget ActivityCard aslimu
  Widget _buildActivityCardSkeleton(
      {required bool isFirst, required bool isLast}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: IntrinsicHeight(
        child: Row(
          children: [
            Column(
              children: [
                Container(
                    width: 2,
                    height: 10,
                    color: isFirst ? Colors.transparent : Colors.grey.shade300),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: skeletonCircle(26), // Lingkaran icon
                ),
                Expanded(
                    child: Container(
                        width: 2,
                        color: isLast
                            ? Colors.transparent
                            : Colors.grey.shade300)),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Container(
                margin: const EdgeInsets.symmetric(vertical: 8),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade100),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        skeletonLine(width: 130, height: 14),
                        skeletonLine(width: 35, height: 11),
                      ],
                    ),
                    const SizedBox(height: 10),
                    skeletonLine(width: double.infinity, height: 12),
                    const SizedBox(height: 6),
                    skeletonLine(width: 200, height: 12),
                    const SizedBox(height: 12),
                    skeletonLine(width: 80, height: 10),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- HELPER SHIMMER ---
  Widget skeletonLine(
      {double width = double.infinity, double height = 12, double radius = 4}) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
    );
  }

  Widget skeletonCircle(double size) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: Container(
        width: size,
        height: size,
        decoration: const BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}

class ActivityCard extends StatelessWidget {
  final ActivityItem item;
  final bool isFirst;
  final bool isLast;

  const ActivityCard(
      {required this.item,
      required this.isFirst,
      required this.isLast,
      super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: IntrinsicHeight(
        child: Row(
          children: [
            Column(
              children: [
                Container(
                    width: 2,
                    height: 10,
                    color: isFirst ? Colors.transparent : Colors.grey.shade300),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: item.iconBackgroundColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: Icon(item.icon, color: item.iconColor, size: 18),
                ),
                Expanded(
                    child: Container(
                        width: 2,
                        color: isLast
                            ? Colors.transparent
                            : Colors.grey.shade300)),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Container(
                margin: const EdgeInsets.symmetric(vertical: 8),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade100),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(item.title,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 14)),
                        Text(item.time,
                            style: TextStyle(
                                color: Colors.grey.shade500, fontSize: 11)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(item.description,
                        style: TextStyle(
                            color: Colors.grey.shade700,
                            fontSize: 13,
                            height: 1.4)),
                    const SizedBox(height: 8),
                    Text(item.date,
                        style: TextStyle(
                            color: Color(0xFF6F34FA),
                            fontSize: 10,
                            fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterHeaderDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;
  _FilterHeaderDelegate({required this.child});
  @override
  double get minExtent => 70;
  @override
  double get maxExtent => 70;
  @override
  Widget build(
          BuildContext context, double shrinkOffset, bool overlapsContent) =>
      child;
  @override
  bool shouldRebuild(covariant SliverPersistentHeaderDelegate oldDelegate) =>
      false;
}
