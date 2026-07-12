// KALENDER JADWAL KERJA MINGGUAN
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:presensi_app/services/auth_service.dart';
import 'schedule_detail_page.dart';

class Calendar {
  final int shiftAssignmentId;
  final int workShiftId;
  final int userId;
  final String shiftName;
  final TimeOfDay startTime;
  final TimeOfDay endTime;
  final DateTime date;
  final String? note;
  bool exchangePending;

  Calendar({
    required this.shiftAssignmentId,
    required this.workShiftId,
    required this.userId,
    required this.shiftName,
    required this.startTime,
    required this.endTime,
    required this.date,
    this.note,
    required this.exchangePending,
  });
}

class CalendarPage extends StatefulWidget {
  const CalendarPage({super.key});

  @override
  State<CalendarPage> createState() => _CalendarPageState();
}

class _CalendarPageState extends State<CalendarPage> {
  final AuthService authService = AuthService();
  List<Calendar> shifts = [];
  bool isLoading = true;
  DateTime _selectedDate = DateTime.now();
  DateTime _startOfWeek = DateTime.now();
  List<dynamic> calendarEvents = [];

  @override
  void initState() {
    super.initState();
    _startOfWeek = _getStartOfWeek(_selectedDate);
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => isLoading = true);
    // await Future.wait([
    //   _loadCalendarEvents(),
    //   _loadAttendanceShift(),
    // ]);
    // setState(() => isLoading = false);

    await _loadCalendarEvents(); // Tarik data hari libur dulu
    await _loadAttendanceShift(); // Baru generate jadwal berdasarkan hari libur
    setState(() => isLoading = false);
  }

  Future<void> _loadCalendarEvents() async {
    try {
      final events = await authService.getCalendarDays();
      if (!mounted) return;
      setState(() {
        calendarEvents = events;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => isLoading = false);
    }
  }

  DateTime _getStartOfWeek(DateTime date) {
    return date.subtract(Duration(days: date.weekday - 1));
  }

  void _changeWeek(int offset) {
    setState(() {
      _startOfWeek = _startOfWeek.add(Duration(days: offset * 7));
    });
    _loadAttendanceShift();
  }

  Future<void> _loadAttendanceShift() async {
    try {
      await Future.delayed(const Duration(seconds: 1));
      final user = await authService.getProfile();
      if (user == null) {
        throw Exception("Profile user tidak ditemukan!");
      }

      final employmentType = user['data']?['employmentType'] ?? 'Shift';
      final data = user['data']?['shiftAssignments'] ?? [];

      List<Calendar> loadedShifts = [];

      if (employmentType == 'Non-Shift') {
        final userId = user['data']?['id'];
        DateTime startOfWeek = _startOfWeek;

        for (int i = 0; i < 7; i++) {
          final date = startOfWeek.add(Duration(days: i));
          final day = date.weekday;

          // // Hanya Senin–Jumat (hari kerja)
          // if (day >= 1 && day <= 5) {
          //   loadedShifts.add(Calendar(
          //       workShiftId: 1,
          //       shiftAssignmentId: 0,
          //       userId: userId,
          //       shiftName: "Non-Shift",
          //       startTime: const TimeOfDay(hour: 7, minute: 0),
          //       endTime: const TimeOfDay(hour: 15, minute: 0),
          //       date: date,
          //       note: null,
          //       exchangePending: false));
          // }

          // PERBAIKAN 2: Cek apakah tanggal saat ini ada di calendarEvents
          final String dateString = DateFormat('yyyy-MM-dd').format(date);
          final bool isHoliday =
              calendarEvents.any((e) => e['date'] == dateString);

          // PERBAIKAN 3: Hanya generate jadwal Non-Shift jika Senin-Jumat DAN bukan hari libur

          if (day >= 1 && day <= 5 && !isHoliday) {
            loadedShifts.add(Calendar(
                workShiftId: 1,
                shiftAssignmentId: 0,
                userId: userId,
                shiftName: "Non-Shift",
                startTime: const TimeOfDay(hour: 7, minute: 0),
                endTime: const TimeOfDay(hour: 15, minute: 0),
                date: date,
                note: null,
                exchangePending: false));
          }
        }
      } else {
        // === USER SHIFT: ambil data dari backend ===
        if (data.isEmpty) {
          print("Tidak ada shift assignments untuk user ini");
        }

        loadedShifts = data.map<Calendar>((shift) {
          final workShift = shift['workShift'];
          final dateStr = shift['date'];
          final date = DateTime.parse(dateStr);
          final startParts = (workShift['startTime'] ?? '07:00').split(':');
          final endParts = (workShift['endTime'] ?? '15:00').split(':');

          DateTime startDateTime = DateTime(
            date.year,
            date.month,
            date.day,
            int.parse(startParts[0]),
            int.parse(startParts[1]),
          );
          DateTime endDateTime;
          if (int.parse(endParts[0]) < int.parse(startParts[0])) {
            // shift lintas malam
            endDateTime = DateTime(
              date.year,
              date.month,
              date.day + 1,
              int.parse(endParts[0]),
              int.parse(endParts[1]),
            );
          } else {
            endDateTime = DateTime(
              date.year,
              date.month,
              date.day,
              int.parse(endParts[0]),
              int.parse(endParts[1]),
            );
          }
          final hasPending = shift['exchangeStatus'] == 'Pending' ||
              shift['exchangeStatus'] == 'Requested';
          return Calendar(
            workShiftId: workShift['id'],
            shiftAssignmentId: shift['id'],
            userId: shift['userId'],
            shiftName: workShift['name'] ?? 'Shift',
            startTime: TimeOfDay.fromDateTime(startDateTime),
            endTime: TimeOfDay.fromDateTime(endDateTime),
            date: date,
            note: shift['note'],
            exchangePending: hasPending,
          );
        }).toList();
      }
      setState(() {
        shifts = loadedShifts;
        isLoading = false;
      });
      for (var s in shifts) {
        print(
            "Shift: ${s.shiftName} Date: ${s.date} In week: ${_getShiftsForCurrentWeek().contains(s)}");
      }
      print("EmploymentType: $employmentType");
      print("Shifts loaded: ${shifts.length}");
      for (var shift in shifts) {
        print(
          "Detail shift: ${shift.shiftName}, "
          "${shift.startTime.format(context)} - ${shift.endTime.format(context)}"
          "Date: ${shift.date.toLocal().toIso8601String().split('T').first}, "
          "Note: ${shift.note ?? 'Tidak ada'}",
        );
      }
    } catch (e) {
      print("Error:$e");
      setState(() {
        isLoading = false;
      });
    }
  }

  List<Calendar> _getShiftsForCurrentWeek() {
    final start =
        DateTime(_startOfWeek.year, _startOfWeek.month, _startOfWeek.day);
    final end =
        DateTime(_startOfWeek.year, _startOfWeek.month, _startOfWeek.day)
            .add(Duration(days: 6));
    final weekShifts = shifts.where((s) {
      final shiftDate = DateTime(s.date.year, s.date.month, s.date.day);
      final inRange = !shiftDate.isBefore(start) && !shiftDate.isAfter(end);
      return inRange;
    }).toList();
    return weekShifts;
  }

  int _getWorkDaysCount() {
    final shiftsThisWeek = _getShiftsForCurrentWeek();
    final uniqueDays = <String>{};
    for (var s in shiftsThisWeek) {
      uniqueDays.add("${s.date.year}-${s.date.month}-${s.date.day}");
    }
    return uniqueDays.length;
  }

  double _getWeeklyHours() {
    double totalHours = 0;
    for (var s in _getShiftsForCurrentWeek()) {
      DateTime start = DateTime(s.date.year, s.date.month, s.date.day,
          s.startTime.hour, s.startTime.minute);
      DateTime end = DateTime(s.date.year, s.date.month, s.date.day,
          s.endTime.hour, s.endTime.minute);
      // Kalau endTime < startTime → shift melewati tengah malam
      if (end.isBefore(start)) {
        end = end.add(const Duration(days: 1));
      }
      totalHours += end.difference(start).inHours;
    }
    return totalHours;
  }

  int _getDayOffCount() {
    return 7 - _getWorkDaysCount();
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

  @override
  Widget build(BuildContext context) {
    Intl.defaultLocale = 'id_ID';
    final weekDates =
        List.generate(7, (i) => _startOfWeek.add(Duration(days: i)));
    final weekCards = <Widget>[];

    for (var date in weekDates) {
      final String dateString = DateFormat('yyyy-MM-dd').format(date);
      final eventForDate = calendarEvents.firstWhere(
        (e) => e['date'] == dateString,
        orElse: () => null,
      );
      final shiftForDate = _getShiftsForCurrentWeek().where((s) =>
          s.date.year == date.year &&
          s.date.month == date.month &&
          s.date.day == date.day);

      // // Kalau ADA event (hari libur)
      // // ➜ langsung masuk if
      // // ➜ SHIFT TIDAK DIPROSES SAMA SEKALI
      // if (eventForDate != null) {
      //   weekCards.add(_buildCalendarEventCard(date, eventForDate));
      // } else if (shiftForDate.isNotEmpty) {
      //   for (var shift in shiftForDate) {
      //     weekCards.add(_buildShiftCard(shift));
      //   }
      // }

      // 1. JIKA ADA HARI BESAR / LIBUR NASIONAL
      // Tetap tampilkan kartu peringatan hari rayanya di atas
      if (eventForDate != null) {
        weekCards.add(_buildCalendarEventCard(date, eventForDate));
      }
      // 2. JIKA USER MEMILIKI JADWAL SHIFT (Kondisi dibuat mandiri/bukan else if)
      // Kartu shift milik user (Andin) akan tetap muncul tepat di bawah kartu hari raya
      if (shiftForDate.isNotEmpty) {
        for (var shift in shiftForDate) {
          weekCards.add(_buildShiftCard(shift));
        }
      }
      // 3. JIKA TIDAK ADA SHIFT DAN TIDAK ADA HARI RAYA
      // Baru buat kartu keterangan Day Off/Libur reguler agar list tidak kosong
      if (shiftForDate.isEmpty && eventForDate == null) {
        weekCards.add(_buildDayOffCard(date));
      }
    }
    return Scaffold(
        body: isLoading
            // ? const Center(child: CircularProgressIndicator())
            ? _buildSkeletonLoading()
            : Stack(
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
                      _buildWeeklyHeader(),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: Row(
                          children: [
                            _buildSummaryCard(
                              Icons.calendar_today,
                              'Hari Kerja',
                              _getWorkDaysCount().toString(),
                              const Color(0xFF6B7FF5),
                            ),
                            const SizedBox(width: 8),
                            _buildSummaryCard(
                              Icons.access_time_filled,
                              'Jam Kerja',
                              _getWeeklyHours().toStringAsFixed(0),
                              const Color(0xFF4CAF50),
                            ),
                            const SizedBox(width: 8),
                            _buildSummaryCard(
                              Icons.calendar_month,
                              'Hari Libur',
                              _getDayOffCount().toString(),
                              const Color(0xFFF44336),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Expanded(
                        child: ListView(
                          children: weekCards,
                        ),
                      ),
                    ],
                  ),
                ],
              ));
  }

  Widget _buildSummaryCard(
      IconData icon, String title, String value, Color iconColor) {
    return Expanded(
      child: Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(height: 8),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                title,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey.shade600,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWeeklyHeader() {
    final start = _startOfWeek;
    final end = start.add(const Duration(days: 6));
    final dateRange =
        "${DateFormat('d MMM', 'id_ID').format(start)} - ${DateFormat('d MMM yyyy', 'id_ID').format(end)}";
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                InkWell(
                  onTap: () => _changeWeek(-1),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.chevron_left, size: 22),
                  ),
                ),
                Text(
                  dateRange,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                InkWell(
                  onTap: () => _changeWeek(1),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.chevron_right, size: 22),
                  ),
                )
              ],
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(7, (index) {
                final date = start.add(Duration(days: index));
                final dayName = DateFormat('E', 'id_ID').format(date);
                final isToday = DateUtils.isSameDay(date, DateTime.now());
                return Column(
                  children: [
                    Text(dayName.substring(0, 3),
                        style: TextStyle(
                          fontSize: 13,
                          color: isToday ? Colors.black : Colors.grey,
                          fontWeight:
                              isToday ? FontWeight.bold : FontWeight.normal,
                        )),
                    const SizedBox(height: 6),
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: isToday
                            ? const Color(0xFF6B7FF5)
                            : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: isToday
                            ? [
                                BoxShadow(
                                  color: Colors.blue.shade100,
                                  blurRadius: 6,
                                  spreadRadius: 1,
                                )
                              ]
                            : null,
                      ),
                      alignment: Alignment.center,
                      child: Text("${date.day}",
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: isToday ? Colors.white : Colors.black87,
                          )),
                    ),
                  ],
                );
              }),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShiftCard(Calendar shift) {
    final shiftLabel = shift.shiftName;
    final bgColor = shiftColors[shiftLabel] ?? Colors.grey.shade200;
    final textColor = shiftTextColors[shiftLabel] ?? Colors.black87;
    final dateString = DateFormat('EEEE, d MMMM', 'id_ID').format(shift.date);
    final dayNumber = DateFormat('d').format(shift.date);
    final dayShort =
        DateFormat('E', 'id_ID').format(shift.date).substring(0, 3);
    final hasNote = shift.note != null && shift.note!.isNotEmpty;
    final noteText = hasNote ? shift.note! : 'Tidak ada catatan';
    return GestureDetector(
        onTap: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ScheduleDetailPage(shift: shift),
            ),
          );
          if (result == true) {
            await _loadAttendanceShift();
          }
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 2.0),
          child: Card(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE0E5FF),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              dayShort,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF6B7FF5),
                              ),
                            ),
                            Text(
                              dayNumber,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF6B7FF5),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  dateString,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                // Container(
                                //   padding: const EdgeInsets.symmetric(
                                //       horizontal: 6, vertical: 3),
                                //   decoration: BoxDecoration(
                                //     color: bgColor,
                                //     borderRadius: BorderRadius.circular(12),
                                //   ),
                                //   child: Text(
                                //     shiftLabel,
                                //     style: TextStyle(
                                //       fontSize: 11,
                                //       fontWeight: FontWeight.bold,
                                //       color: textColor,
                                //     ),
                                //   ),
                                // ),
                                if (shiftLabel != "Non-Shift") ...[
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 6, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: bgColor,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      shiftLabel,
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: textColor,
                                      ),
                                    ),
                                  ),
                                ]
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Mulai',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey,
                                      ),
                                    ),
                                    Text(
                                      formatTime24(shift.startTime),
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    const Text(
                                      'Selesai',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey,
                                      ),
                                    ),
                                    Text(
                                      formatTime24(shift.endTime),
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (hasNote) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.yellow.shade100,
                        borderRadius: BorderRadius.circular(8),
                        border: Border(
                            left: BorderSide(
                                color: Colors.amber.shade700, width: 4)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info_outline,
                              color: Colors.amber.shade700, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              noteText,
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.amber.shade900,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ));
  }

  // Widget _buildDayOffCard(DateTime date) {
  //   final dayNumber = DateFormat('d').format(date);
  //   final dayShort = DateFormat('E', 'id_ID').format(date).substring(0, 3);
  //   return Padding(
  //     padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 2.0),
  //     child: Card(
  //       shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  //       elevation: 2,
  //       child: Padding(
  //         padding: const EdgeInsets.all(16.0),
  //         child: Row(
  //           crossAxisAlignment: CrossAxisAlignment.start,
  //           children: [
  //             Container(
  //               width: 50,
  //               height: 50,
  //               alignment: Alignment.center,
  //               decoration: BoxDecoration(
  //                 color: const Color(0xFFE0E5FF),
  //                 borderRadius: BorderRadius.circular(8),
  //               ),
  //               child: Column(
  //                 mainAxisAlignment: MainAxisAlignment.center,
  //                 children: [
  //                   Text(
  //                     dayShort,
  //                     style: TextStyle(
  //                       fontSize: 12,
  //                       fontWeight: FontWeight.w600,
  //                       color: Color(0xFF6B7FF5),
  //                     ),
  //                   ),
  //                   Text(
  //                     dayNumber,
  //                     style: TextStyle(
  //                       fontSize: 18,
  //                       fontWeight: FontWeight.bold,
  //                       color: Color(0xFF6B7FF5),
  //                     ),
  //                   ),
  //                 ],
  //               ),
  //             ),
  //             const SizedBox(width: 16),
  //             Expanded(
  //               child: Column(
  //                 crossAxisAlignment: CrossAxisAlignment.start,
  //                 children: [
  //                   Text(
  //                     DateFormat('EEEE, d MMMM', 'id_ID').format(date),
  //                     style: const TextStyle(
  //                       fontSize: 16,
  //                       fontWeight: FontWeight.bold,
  //                     ),
  //                   ),
  //                   const SizedBox(height: 6),
  //                   Container(
  //                     padding: const EdgeInsets.symmetric(
  //                         horizontal: 6, vertical: 4),
  //                     decoration: BoxDecoration(
  //                       color: Colors.red.shade50,
  //                       borderRadius: BorderRadius.circular(8),
  //                     ),
  //                     child: const Text(
  //                       "HARI LIBUR",
  //                       style: TextStyle(
  //                         fontSize: 12,
  //                         fontWeight: FontWeight.bold,
  //                         color: Colors.red,
  //                       ),
  //                     ),
  //                   ),
  //                 ],
  //               ),
  //             ),
  //           ],
  //         ),
  //       ),
  //     ),
  //   );
  // }

  Widget _buildDayOffCard(DateTime date) {
    final dayNumber = DateFormat('d').format(date);
    final dayShort = DateFormat('E', 'id_ID').format(date).substring(0, 3);
    return GestureDetector(
      onTap: () async {
        Calendar dayOffCalendar = Calendar(
          shiftAssignmentId: 0,
          workShiftId: 0,
          userId: 0,
          shiftName: 'Libur',
          startTime: const TimeOfDay(hour: 0, minute: 0),
          endTime: const TimeOfDay(hour: 0, minute: 0),
          date: date,
          note: 'Hari Libur',
          exchangePending: false,
        );
        final result = await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ScheduleDetailPage(shift: dayOffCalendar),
          ),
        );
        if (result == true) {
          await _loadAttendanceShift();
        }
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 2.0),
        child: Card(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 50,
                  height: 50,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE0E5FF),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        dayShort,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF6B7FF5),
                        ),
                      ),
                      Text(
                        dayNumber,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF6B7FF5),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        DateFormat('EEEE, d MMMM', 'id_ID').format(date),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          "HARI LIBUR",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.red,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCalendarEventCard(DateTime date, dynamic event) {
    final dayNumber = DateFormat('d').format(date);
    final dayShort = DateFormat('E', 'id_ID').format(date).substring(0, 3);
    final holidayCategory = event['holidayType'] ?? 'Libur';
    final holidayDescription = event['description'] ?? 'Hari Libur';
    final isNasional = holidayCategory == 'Nasional';
    return GestureDetector(
      onTap: () async {
        Calendar holidayCalendar = Calendar(
          shiftAssignmentId: 0,
          workShiftId: 0,
          userId: 0,
          shiftName: holidayCategory,
          startTime: const TimeOfDay(hour: 0, minute: 0),
          endTime: const TimeOfDay(hour: 0, minute: 0),
          date: date,
          note: holidayDescription,
          exchangePending: false,
        );
        await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ScheduleDetailPage(
              shift: holidayCalendar,
            ),
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 2.0),
        child: Card(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(dayShort,
                            style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.red)),
                        Text(dayNumber,
                            style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.red)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          DateFormat('EEEE, d MMMM', 'id_ID').format(date),
                          style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.red),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          holidayDescription,
                          style: const TextStyle(
                            fontSize: 13,
                            color: Colors.red,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          holidayCategory,
                          style: TextStyle(
                              fontSize: 11, color: Colors.red.shade300),
                        ),
                      ],
                    ),
                  ),
                  Icon(isNasional ? Icons.celebration : Icons.event_note,
                      color: Colors.red.shade300)
                ],
              ),
            )),
      ),
    );
  }

  // --- Widget Skeleton ---
  Widget _buildSkeletonBox(double width, double height,
      {double borderRadius = 8}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey.shade300,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }

  Widget _buildSkeletonLoading() {
    return Stack(
      children: [
        // 1. Background Gradient (Tetap dipertahankan agar menyatu dengan skeleton)
        Container(
          height: 120,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFF6F34FA), Color(0xFF8E5CFC)],
            ),
          ),
        ),
        Column(
          children: [
            // 2. Skeleton Header Mingguan
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildSkeletonBox(38, 38,
                            borderRadius: 10), // Icon arrow kiri
                        _buildSkeletonBox(150, 20), // Teks tanggal
                        _buildSkeletonBox(38, 38,
                            borderRadius: 10), // Icon arrow kanan
                      ],
                    ),
                    const SizedBox(height: 18),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: List.generate(7, (index) {
                        return Column(
                          children: [
                            _buildSkeletonBox(24, 12), // Nama hari
                            const SizedBox(height: 6),
                            _buildSkeletonBox(34, 34,
                                borderRadius: 10), // Angka tanggal
                          ],
                        );
                      }),
                    ),
                  ],
                ),
              ),
            ),
            // 3. Skeleton Summary Cards (Hari Kerja, Jam Kerja, Hari Libur)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                children: [
                  Expanded(child: _buildSkeletonSummaryCard()),
                  const SizedBox(width: 8),
                  Expanded(child: _buildSkeletonSummaryCard()),
                  const SizedBox(width: 8),
                  Expanded(child: _buildSkeletonSummaryCard()),
                ],
              ),
            ),
            const SizedBox(height: 8),
            // 4. Skeleton List View untuk Shift/Event (Menampilkan 3 item contoh)
            Expanded(
              child: ListView.builder(
                physics:
                    const NeverScrollableScrollPhysics(), // Disable scroll saat loading
                // itemCount: 3,
                itemCount: 4,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16.0, vertical: 4.0),
                    child: Card(
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      elevation: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildSkeletonBox(50, 50,
                                borderRadius: 8), // Kotak tanggal kiri
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      _buildSkeletonBox(
                                          120, 16), // Tanggal lengkap
                                      _buildSkeletonBox(50, 20,
                                          borderRadius: 12), // Label Shift
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          _buildSkeletonBox(
                                              40, 10), // Teks "Mulai"
                                          const SizedBox(height: 4),
                                          _buildSkeletonBox(
                                              50, 16), // Jam Mulai
                                        ],
                                      ),
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.end,
                                        children: [
                                          _buildSkeletonBox(
                                              40, 10), // Teks "Selesai"
                                          const SizedBox(height: 4),
                                          _buildSkeletonBox(
                                              50, 16), // Jam Selesai
                                        ],
                                      ),
                                    ],
                                  )
                                ],
                              ),
                            )
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSkeletonSummaryCard() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildSkeletonBox(32, 32, borderRadius: 10), // Icon mock
            const SizedBox(height: 8),
            _buildSkeletonBox(24, 18), // Angka value mock
            const SizedBox(height: 4),
            _buildSkeletonBox(60, 10), // Teks title mock
          ],
        ),
      ),
    );
  }
}
