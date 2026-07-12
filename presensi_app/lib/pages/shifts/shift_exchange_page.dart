// FORM PERTUKARAN SHIFT (TENAGA MEDIS)
import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:presensi_app/pages/attendances/calendar_page.dart';
import 'package:presensi_app/services/auth_service.dart';
import 'package:presensi_app/pages/activities/activity_page.dart';
import 'package:presensi_app/utils/main_navigation_page.dart';

// tambahkan pesan error
// I/flutter ( 4205): PARTNER SHIFT ID → 296
// I/flutter ( 4205):  REQUEST BODY:
// I/flutter ( 4205): {requesterId: 6, requesterShiftId: 297, partnerId: 17, partnerShiftId: 296, reason: test}
// I/flutter ( 4205): Error submitExchange: {"message":"Permintaan pertukaran shift sudah pernah diajukan dan dalam proses"}

class ChangeShiftPage extends StatefulWidget {
  final Calendar selectedShift;

  ChangeShiftPage({required this.selectedShift});
  @override
  _ChangeShiftPage createState() => _ChangeShiftPage();
}

class _ChangeShiftPage extends State<ChangeShiftPage> {
  final AuthService authService = AuthService();
  List<dynamic> employees = [];
  bool loading = true;
  bool submitting = false;
  bool isAlreadySubmitted = false;
  int? selectedIndex;
  // int? selectedPartnerShiftId;
  TextEditingController reasonController = TextEditingController();
  bool get isFormValid {
    return selectedIndex != null &&
        reasonController.text.trim().isNotEmpty &&
        !submitting &&
        !isAlreadySubmitted;
  }

  // @override
  // void initState() {
  //   super.initState();
  //   fetchEmployeesForExchange();
  // }

  @override
  void initState() {
    super.initState();
    fetchEmployeesForExchange();
    reasonController.addListener(() {
      setState(() {});
    });
  }

  @override
  void dispose() {
    reasonController.dispose();
    super.dispose();
  }

  Future<void> fetchEmployeesForExchange() async {
    try {
      final result = await authService
          .getEmployeesForExchange(widget.selectedShift.shiftAssignmentId);
      print("HASIL API: $result");
      setState(() {
        employees = result;
        loading = false;
      });
    } catch (e) {
      print("Error fetchEmployeesForExchange: $e");
      setState(() {
        loading = false;
      });
      debugPrint("Error fetchEmployeesForExchange: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Gagal memuat daftar karyawan: $e"),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  int? _extractPartnerId(Map<String, dynamic> emp) {
    if (emp.containsKey('userId'))
      return emp['userId'] is int
          ? emp['userId']
          : int.tryParse('${emp['userId']}');
    if (emp.containsKey('user') &&
        emp['user'] is Map &&
        emp['user']['id'] != null) {
      return emp['user']['id'] is int
          ? emp['user']['id']
          : int.tryParse('${emp['user']['id']}');
    }
    if (emp.containsKey('partnerId'))
      return emp['partnerId'] is int
          ? emp['partnerId']
          : int.tryParse('${emp['partnerId']}');
    return null;
  }

  // int? _extractPartnerShiftId(Map<String, dynamic> emp) {
  //   // coba beberapa kunci umum: shiftId, workShiftId, workShift.id
  //   if (emp.containsKey('shiftId'))
  //     return emp['shiftId'] is int
  //         ? emp['shiftId']
  //         : int.tryParse('${emp['shiftId']}');
  //   if (emp.containsKey('workShiftId'))
  //     return emp['workShiftId'] is int
  //         ? emp['workShiftId']
  //         : int.tryParse('${emp['workShiftId']}');
  //   if (emp.containsKey('workShift') &&
  //       emp['workShift'] is Map &&
  //       emp['workShift']['id'] != null) {
  //     return emp['workShift']['id'] is int
  //         ? emp['workShift']['id']
  //         : int.tryParse('${emp['workShift']['id']}');
  //   }
  //   if (emp.containsKey('id'))
  //     return emp['id'] is int
  //         ? emp['id']
  //         : int.tryParse('${emp['id']}'); // fallback
  //   return null;
  // }

  int? _extractPartnerShiftId(Map<String, dynamic> emp) {
    // Ambil ID shift assignment (bukan workShift.id)
    if (emp.containsKey('shiftAssignmentId')) {
      return emp['shiftAssignmentId'] is int
          ? emp['shiftAssignmentId']
          : int.tryParse('${emp['shiftAssignmentId']}');
    }
    // Fallback ke emp['id'] jika shiftAssignmentId tidak ada (karena emp adalah shift assignment)
    return emp['id'] is int ? emp['id'] : int.tryParse('${emp['id']}');
  }

  String _displayEmpPosition(Map<String, dynamic> emp) {
    try {
      final positionName = emp['user']?['position']?['name']?.toString();
      if (positionName != null && positionName.isNotEmpty) return positionName;
    } catch (_) {}
    return 'Posisi tidak tersedia';
  }

  String _displayEmpSchedule(Map<String, dynamic> emp) {
    final date = emp['date'] ?? emp['shiftDate'] ?? emp['scheduledDate'];
    final timeStart =
        emp['time'] ?? emp['startTime'] ?? (emp['workShift']?['startTime']);
    final timeEnd =
        emp['endTime'] ?? emp['finishTime'] ?? (emp['workShift']?['endTime']);
    // Format tanggal
    final dateStr = date != null
        ? DateFormat('EEE, d MMM yyyy', 'id_ID')
            .format(DateTime.tryParse(date.toString()) ?? DateTime.now())
        : 'Tanggal tidak tersedia';
    // Format waktu: HH:mm
    String formatTime(String? time) {
      if (time == null) return '??:??';
      try {
        final parsed = DateTime.tryParse(time);
        if (parsed != null) {
          return DateFormat('HH:mm').format(parsed);
        } else {
          // jika string hanya HH:mm:ss
          final parts = time.split(':');
          if (parts.length >= 2) {
            return '${parts[0]}:${parts[1]}';
          }
        }
      } catch (_) {}
      return '??:??';
    }

    final start = formatTime(timeStart?.toString());
    final end = formatTime(timeEnd?.toString());
    return "$dateStr • $start - $end";
  }

  String _displayEmpName(Map<String, dynamic> emp) {
    try {
      if (emp['user'] is Map) {
        final u = emp['user'];
        final parts = [
          (u['titlePrefix'] ?? '').toString(),
          (u['fullName'] ?? '').toString(),
          // (u['titleSuffix'] ?? '').toString()
        ].where((s) => s.trim().isNotEmpty).toList();
        if (parts.isNotEmpty) return parts.join(' ');
      }
      return emp['name']?.toString() ??
          emp['fullName']?.toString() ??
          'Nama tidak diketahui';
    } catch (_) {
      return 'Nama tidak diketahui';
    }
  }

  Future<void> _onSubmitPressed() async {
    if (selectedIndex == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text("Pilih karyawan partner terlebih dahulu!"),
        behavior: SnackBarBehavior.floating,
      ));
      return;
    } else if (submitting || isAlreadySubmitted) return;
    final emp = employees[selectedIndex!];
    final partnerId = _extractPartnerId(emp);
    final partnerShiftId = _extractPartnerShiftId(emp);
    print("PARTNER SHIFT ID → $partnerShiftId");
    if (partnerId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text("Data partner tidak lengkap!"),
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }
    if (partnerShiftId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text(
            "Data shift partner tidak lengkap! Pastikan jadwal shift tersedia!"),
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }
    if (reasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text("Masukkan alasan pertukaran!"),
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }
    setState(() {
      submitting = true;
    });

    try {
      final result = await authService.submitExchangeRequest(
        requesterId: widget.selectedShift.userId,
        requestShiftId: widget.selectedShift.shiftAssignmentId,
        partnerId: partnerId,
        partnerShiftId: partnerShiftId,
        reason: reasonController.text.trim(),
      );

      // if (result) {
      //   if (mounted) {
      //     _showSuccessDialog();
      //     // ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
      //     //     content: Text("Permintaan tukar jadwal terkirim!"),
      //     //     backgroundColor: Colors.green));
      //     // Navigator.pop(context,
      //     //     true); // bisa return true supaya halaman sebelumnya refresh
      //   }
      // } else {
      //   if (mounted) {
      //     ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
      //       content: Text("Gagal mengirim permintaan. Cek kembali."),
      //       backgroundColor: Colors.red,
      //     ));
      //   }
      // }

      // if (result) {
      //   setState(() {
      //     isAlreadySubmitted = true;
      //   });
      //   _showSuccessDialog();
      // } else {
      //   _showErrorDialog("Gagal melakukan pertukaran jadwal");
      // }
      if (result["success"]) {
        setState(() {
          isAlreadySubmitted = true;
        });
        _showSuccessDialog();
      } else {
        _showErrorDialog(result["message"]);
      }
    } catch (e) {
      debugPrint("submitExchangeRequest error: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text("Terjadi kesalahan: $e"),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } finally {
      if (mounted) {
        setState(() {
          submitting = false;
        });
      }
    }
  }

  String _formatEmployeeTime(Map<String, dynamic> emp) {
    final timeStart =
        emp['time'] ?? emp['startTime'] ?? emp['workShift']?['startTime'];
    final timeEnd =
        emp['endTime'] ?? emp['finishTime'] ?? emp['workShift']?['endTime'];
    String formatTime(String? time) {
      if (time == null) return '??:??';
      try {
        final parsed = DateTime.tryParse(time);
        if (parsed != null) {
          return DateFormat('HH:mm').format(parsed);
        } else {
          final parts = time.split(':');
          if (parts.length >= 2) return '${parts[0]}:${parts[1]}';
        }
      } catch (_) {}
      return '??:??';
    }

    final start = formatTime(timeStart?.toString());
    final end = formatTime(timeEnd?.toString());
    return '$start - $end';
  }

  Color _getShiftColor(String? shiftName) {
    if (shiftName == null) return Colors.grey;
    switch (shiftName.toLowerCase()) {
      case 'pagi':
        return Colors.green;
      case 'siang':
        return Colors.orange;
      case 'malam':
        return Colors.deepPurple;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.selectedShift;
    final formattedDate =
        DateFormat('EEEE, d MMMM yyyy', 'id_ID').format(s.date);
    // return Scaffold(
    //   backgroundColor: Colors.grey[100],
    //   appBar: AppBar(
    //     title: Text('Tukar Jadwal'),
    //     backgroundColor: const Color(0xFF6F34FA),
    //     elevation: 0,
    //   ),
    //   body: SingleChildScrollView(
    //     child: Padding(
    //       padding: const EdgeInsets.all(16.0),
    //       child: Column(
    //         children: [
    //           _buildCurrentScheduleCard(),
    //           const SizedBox(height: 20),
    //           _buildTukarJadwalContent(),
    //         ],
    //       ),
    //     ),
    //   ),
    // );
    return WillPopScope(
      onWillPop: () async {
        // Jika sudah sukses, arahkan ke halaman lain dan cegah back manual
        if (isAlreadySubmitted) {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (context) => const ActivityPage()),
            (route) => route.isFirst,
          );
          return false;
        }
        return true;
      },
      child: Scaffold(
          // backgroundColor: Colors.grey[100],
          backgroundColor: Colors.white,
          appBar: AppBar(
            title: const Text('Tukar Jadwal',
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold)),
            backgroundColor: const Color(0xFF6F34FA),
          ),
          body: loading
              ? const Center(child: CircularProgressIndicator())
              // : SingleChildScrollView(
              //     padding: const EdgeInsets.all(16.0),
              //     child: Column(
              //       children: [
              //         _buildCurrentScheduleCard(),
              //         const SizedBox(height: 20),
              //         _buildTukarJadwalContent(),
              //       ],
              //     ),
              //   ),
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
                    SingleChildScrollView(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          _buildCurrentScheduleCard(),
                          const SizedBox(height: 20),
                          _buildTukarJadwalContent(),
                        ],
                      ),
                    ),
                  ],
                )),
    );
  }

  Widget _buildCurrentScheduleCard() {
    final dateString = DateFormat('EEEE, d MMMM yyyy', 'id_ID')
        .format(widget.selectedShift.date);
    String format24(TimeOfDay t) {
      final hour = t.hour.toString().padLeft(2, '0');
      final minute = t.minute.toString().padLeft(2, '0');
      return "$hour:$minute";
    }

    // final startTime = widget.selectedShift.startTime.format(context);
    // final endTime = widget.selectedShift.endTime.format(context);
    final startTime = format24(widget.selectedShift.startTime);
    final endTime = format24(widget.selectedShift.endTime);
    final shiftName = widget.selectedShift.shiftName;
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 5,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Jadwal Saat Ini',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.grey[700],
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: <Widget>[
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    dateString,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text('$startTime - $endTime',
                      style: TextStyle(color: Colors.grey[600])),
                ],
              ),
              _buildShiftTag(shiftName, _getShiftColor(shiftName)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTukarJadwalContent() {
    // int selectedEmployeeIndex =
    //     employees.indexWhere((e) => e['isSelected'] == true);
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 5,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Text(
          //   'Pilih Karyawan *',
          //   style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          // ),
          _buildLabelWithAsterisk('Pilih Karyawan *'),
          const SizedBox(height: 8),
          Text(
            'Pilih karyawan yang ingin Anda tukar jadwal. Jadwal Anda akan diberikan kepada karyawan tersebut, dan Anda akan mendapat jadwal mereka.',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[700],
            ),
          ),
          const SizedBox(height: 12),

          // // Daftar karyawan
          // ...employees.asMap().entries.map((entry) {
          //   int index = entry.key;
          //   Map<String, dynamic> emp = entry.value;
          //   // return _buildEmployeeCard(emp, inslectedEmployeeIndex);
          //   return _buildEmployeeCard(emp, index,
          //       isSelectedEmployee: index == selectedIndex);
          // }).toList(),

          ConstrainedBox(
            constraints: const BoxConstraints(
              maxHeight: 480, // Batasi tinggi agar kira-kira muat 3 kartu
            ),
            child: Scrollbar(
              // Menambahkan scrollbar visual
              thumbVisibility: true,
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: employees.length,
                padding: const EdgeInsets.only(right: 8),
                itemBuilder: (context, index) {
                  Map<String, dynamic> emp = employees[index];
                  return _buildEmployeeCard(
                    emp,
                    index,
                    isSelectedEmployee: index == selectedIndex,
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 4),
          // Text(
          //   'Alasan Pertukaran *',
          //   style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          // ),
          _buildLabelWithAsterisk('Alasan *'),
          const SizedBox(height: 8),
          TextField(
            controller: reasonController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Jelaskan alasan pertukaran...',
              hintStyle: TextStyle(fontSize: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              filled: true,
              fillColor: Colors.grey[100],
            ),
          ),
          const SizedBox(height: 16),
          if (selectedIndex != null) ...[
            _buildWarningBox(),
            const SizedBox(height: 16),
          ],
          _buildSaveButton('Ajukan Pertukaran'),
          // const SizedBox(height: 20),
          // if (selectedIndex != null) _buildWarningBox(),
        ],
      ),
    );
  }

  Widget _buildEmployeeCard(Map<String, dynamic> employee, int index,
      {required bool isSelectedEmployee}) {
    final shiftName =
        employee['workShift']?['name']?.toString() ?? 'Tidak diketahui';
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: InkWell(
        onTap: () {
          setState(() {
            for (var emp in employees) {
              emp['isSelected'] = false;
            }
            employees[index]['isSelected'] = true;
            selectedIndex = index;
            // selectedPartnerShiftId = employees[index]['shiftAssignmentId'];
          });
        },
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color:
                  isSelectedEmployee ? Colors.deepPurple : Colors.grey.shade300,
              width: isSelectedEmployee ? 2 : 1,
            ),
            boxShadow: isSelectedEmployee
                ? [
                    BoxShadow(
                      color: Colors.deepPurple.withOpacity(0.1),
                      blurRadius: 4,
                      offset: Offset(0, 2),
                    )
                  ]
                : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Row Nama + Foto + Radio
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: Colors.grey[200],
                        child: Icon(Icons.person, color: Colors.deepPurple),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_displayEmpName(employee),
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 16)),
                          Text(_displayEmpPosition(employee),
                              style: TextStyle(
                                  fontSize: 13, color: Colors.grey[600])),
                        ],
                      ),
                    ],
                  ),
                  Radio(
                    value: true,
                    groupValue: isSelectedEmployee,
                    onChanged: (_) {
                      setState(() {
                        for (var emp in employees) {
                          emp['isSelected'] = false;
                        }
                        employees[index]['isSelected'] = true;
                      });
                    },
                    activeColor: Colors.deepPurple,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text('Jadwal Karyawan:',
                  style: TextStyle(
                      fontWeight: FontWeight.bold, color: Colors.grey[700])),
              const SizedBox(height: 4),
              // Row(
              //   mainAxisAlignment: MainAxisAlignment.spaceBetween,
              //   children: [
              //     Column(
              //       crossAxisAlignment: CrossAxisAlignment.start,
              //       children: [
              //         Text(
              //           _displayEmpSchedule(employee),
              //           style: TextStyle(fontWeight: FontWeight.bold),
              //         ),
              //       ],
              //     ),
              //     _buildShiftTag(
              //       employee['workShift']?['name']?.toString() ??
              //           'Tidak diketahui',
              //       (employee['workShift'] == 'Pagi')
              //           ? Colors.green
              //           : (employee['workShift']?['name'] == 'Siang'
              //               ? Colors.orange
              //               : Colors.deepPurple),
              //     ),
              //   ],
              // ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Column untuk tanggal + jam kerja
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        DateFormat('EEE, d MMM yyyy', 'id_ID').format(
                            DateTime.tryParse(employee['date'] ??
                                    employee['shiftDate'] ??
                                    employee['scheduledDate'].toString()) ??
                                DateTime.now()),
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _formatEmployeeTime(employee),
                        style: const TextStyle(
                            fontWeight: FontWeight.normal, fontSize: 13),
                      ),
                    ],
                  ),
                  // Shift tag di kanan
                  // _buildShiftTag(
                  //   employee['workShift']?['name']?.toString() ??
                  //       'Tidak diketahui',
                  //   (employee['workShift']?['name'] == 'Pagi')
                  //       ? Colors.green
                  //       : (employee['workShift']?['name'] == 'Siang'
                  //           ? Colors.orange
                  //           : Colors.deepPurple),
                  // ),
                  _buildShiftTag(
                    shiftName,
                    _getShiftColor(shiftName), // Update di sini
                  ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWarningBox() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.yellow.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, color: Colors.orange, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Setelah disetujui, jadwal Anda akan ditukar dengan karyawan terpilih. Pastikan sudah berkomunikasi dengan mereka.',
              style: TextStyle(color: Colors.orange.shade700, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShiftTag(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style:
            TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13),
      ),
    );
  }

  Widget _buildSaveButton(String label) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: isFormValid ? () => _showConfirmDialog() : null,
        style: ElevatedButton.styleFrom(
          // backgroundColor: Colors.deepPurple.shade600,
          backgroundColor: const Color(0xFF6F34FA),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
        child: Text(label,
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.white)),
      ),
    );
  }

  Widget _buildLabelWithAsterisk(String label) {
    if (!label.contains('*')) {
      return Text(label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14));
    }
    return RichText(
      text: TextSpan(
        text: label.replaceFirst('*', ''),
        style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
            color: Colors.black,
            fontFamily: 'Roboto'),
        children: const [
          TextSpan(
            text: '*',
            style: TextStyle(color: Colors.red),
          ),
        ],
      ),
    );
  }

  void _showConfirmDialog() {
    if (selectedIndex == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Pilih karyawan partner terlebih dahulu!"),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    showDialog(
      context: context,
      barrierDismissible: false, // User tidak bisa tap di luar untuk menutup
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
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  color: Colors.yellow.shade100,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.help_outline,
                  color: Colors.orange,
                  size: 30,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                "Konfirmasi Pertukaran",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                "Apakah Anda yakin ingin mengajukan pertukaran jadwal dengan karyawan yang dipilih?",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.black54,
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
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        side: const BorderSide(color: Colors.grey),
                      ),
                      child: const Text(
                        "Batal",
                        style: TextStyle(color: Colors.black),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _onSubmitPressed();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF5E54F3),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text("Ya, Lanjutkan"),
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
                  const Icon(Icons.check, color: Colors.green, size: 80),
                  const SizedBox(height: 20),
                  const Text(
                    "Pengajuan Berhasil!",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    "Pengajuan pertukaran jadwal shift Anda\nakan diproses",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        Navigator.of(dialogContext).pop();
                        Navigator.of(context).pop(true);
                        // Future.delayed(const Duration(milliseconds: 100), () {
                        //   // mainNavKey.currentState?.setSelectedIndex(3);
                        //   MainNavigation.navKey.currentState
                        //       ?.setSelectedIndex(3);
                        // });
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
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        "Lihat Status Pengajuan",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: TextButton(
                      onPressed: () {
                        Navigator.of(dialogContext).pop();
                        Navigator.of(context).pop(true);
                      },
                      child: const Text(
                        "Tutup",
                        style: TextStyle(
                          color: Colors.grey,
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

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      barrierDismissible: false, // User tidak bisa tap di luar untuk menutup
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 80),
              const SizedBox(height: 16),
              const Text(
                "Pengajuan Gagal",
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

// JANGAN DIHAPUS
// return Dialog(
//   shape:
//       RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
//   child: Padding(
//     padding: const EdgeInsets.all(24.0),
//     child: Column(
//       mainAxisSize: MainAxisSize.min,
//       children: [
//         const Icon(Icons.check_circle, color: Colors.green, size: 80),
//         const SizedBox(height: 20),
//         const Text(
//           "Pertukaran Diajukan!",
//           style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
//         ),
//         const SizedBox(height: 12),
//         const Text(
//           "Permintaan pertukaran jadwal shift Anda telah berhasil dikirim dan menunggu persetujuan",
//           textAlign: TextAlign.center,
//           style: TextStyle(color: Colors.black54),
//         ),
//         const SizedBox(height: 24),
//         // Tombol Lihat Aktivitas
//         SizedBox(
//           width: double.infinity,
//           child: ElevatedButton(
//             onPressed: () {
//               Navigator.pop(context); // Tutup dialog
//               // Ganti 'ActivityPage' dengan route/page aktivitas Anda
//               // Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => ActivityPage()));
//               Navigator.pushReplacement(
//                 context,
//                 MaterialPageRoute(
//                     builder: (context) => const ActivityPage()),
//               );
//               print("Navigasi ke halaman aktivitas");
//             },
//             style: ElevatedButton.styleFrom(
//               backgroundColor: const Color(0xFF5E54F3),
//               shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(10)),
//             ),
//             child: const Text("Lihat Pengajuan",
//                 style: TextStyle(color: Colors.white)),
//           ),
//         ),
//         const SizedBox(height: 8),
//         // Tombol Kembali ke Jadwal
//         SizedBox(
//           width: double.infinity,
//           child: TextButton(
//             onPressed: () {
//               Navigator.pop(context); // Tutup dialog
//               Navigator.pop(context,
//                   true); // Kembali ke halaman sebelumnya (Kalender)
//             },
//             style: OutlinedButton.styleFrom(
//                 padding: const EdgeInsets.symmetric(vertical: 14),
//                 side: const BorderSide(color: Color(0xFF5E54F3)),
//                 shape: RoundedRectangleBorder(
//                     borderRadius: BorderRadius.circular(10))),
//             child: const Text("Tutup",
//                 style: TextStyle(color: Colors.grey)),
//           ),
//         ),
//       ],
//     ),
//   ),
// );
