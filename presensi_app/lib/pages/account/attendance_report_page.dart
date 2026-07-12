import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../services/auth_service.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:pdf/widgets.dart' as pw;
import 'package:permission_handler/permission_handler.dart';

class AttendanceReportPage extends StatefulWidget {
  const AttendanceReportPage({super.key});

  @override
  State<AttendanceReportPage> createState() => _AttendanceReportPageState();
}

class _AttendanceReportPageState extends State<AttendanceReportPage> {
  bool isBulanan = true;
  DateTime selectedDate = DateTime.now();

  bool isLoading = true;
  List<dynamic> allAttendanceData = [];
  int totalHariKerja = 0;
  int hariHadir = 0;
  int hariTerlambat = 0;
  int hariTidakHadir = 0;
  double attendanceRate = 0.0;
  double totalJamKerja = 0;
  double totalLembur = 0;

  String employmentType = '';
  Map<String, dynamic>? workShift;
  List<dynamic> shiftAssignments = [];
  List<dynamic> filteredAttendanceData = [];

  @override
  void initState() {
    super.initState();
    _fetchAndFilterData();
  }

  Future<void> _fetchAndFilterData() async {
    setState(() => isLoading = true);
    final data = await AuthService().getMyAttendances();
    setState(() {
      allAttendanceData = data;
      _calculateSummary();
      isLoading = false;
    });
  }

  void _calculateSummary() {
    filteredAttendanceData = allAttendanceData.where((item) {
      DateTime date = DateTime.parse(item['date']);
      if (isBulanan) {
        return date.month == selectedDate.month &&
            date.year == selectedDate.year;
      } else {
        return date.year == selectedDate.year;
      }
    }).toList();
    List<dynamic> filteredData = filteredAttendanceData;
    // List<dynamic> filteredData = allAttendanceData.where((item) {
    //   DateTime date = DateTime.parse(item['date']);
    //   if (isBulanan) {
    //     return date.month == selectedDate.month &&
    //         date.year == selectedDate.year;
    //   } else {
    //     return date.year == selectedDate.year;
    //   }
    // }).toList();
    totalHariKerja = _countWorkDays(selectedDate, isBulanan);
    String normalize(String? status) {
      return (status ?? '').toLowerCase().trim();
    }

    // hariHadir = filteredData.where((item) {
    //   final s = normalize(item['attendanceStatus']);
    //   return s == 'hadir' || s == 'terlambat' || s == 'dinas luar';
    // }).length;
    hariHadir = filteredData.where((item) {
      final s = normalize(item['attendanceStatus']);
      return s == 'hadir' || s == 'terlambat' || s == 'dinas luar';
    }).length;
    hariTerlambat = filteredData.where((item) {
      final s = normalize(item['attendanceStatus']);
      return s == 'terlambat';
    }).length;
    int cutiIzin = filteredData.where((item) {
      final s = normalize(item['attendanceStatus']);
      return s == 'cuti' || s == 'izin';
    }).length;
    int invalid = filteredData.where((item) {
      final s = normalize(item['attendanceStatus']);
      return s == 'tidak valid';
    }).length;
    // hariTidakHadir = filteredData.where((item) {
    //   final s = normalize(item['attendanceStatus']);
    //   return s == 'tidak hadir';
    // }).length;
    hariTidakHadir = filteredData.where((item) {
      final s = normalize(item['attendanceStatus']);
      return s == 'tidak hadir';
    }).length;
    int totalMinutes = 0;
    int overtimeMinutes = 0;

    for (var item in filteredData) {
      String? rawCheckIn = item['checkInTime'] ?? item['check_in'];
      String? rawCheckOut = item['checkOutTime'] ?? item['check_out'];
      if (rawCheckIn == null || rawCheckOut == null) {
        print("SKIP WAKTU: Check-In/Out kosong pada tanggal ${item['date']}");
        continue;
      }
      try {
        if (rawCheckIn.contains('T'))
          rawCheckIn = rawCheckIn.split('T')[1].split('.')[0];
        if (rawCheckOut.contains('T'))
          rawCheckOut = rawCheckOut.split('T')[1].split('.')[0];
        if (rawCheckIn.length <= 5) rawCheckIn += ":00";
        if (rawCheckOut.length <= 5) rawCheckOut += ":00";

        DateTime inTime = DateFormat('HH:mm:ss').parse(rawCheckIn);
        DateTime outTime = DateFormat('HH:mm:ss').parse(rawCheckOut);
        Map? shift;
        if (item['employmentType'] == 'Non-Shift') {
          shift = {"startTime": "07:00:00", "endTime": "15:00:00"};
        } else {
          if (item['workShift'] != null) {
            shift = item['workShift'];
          } else if (item['shiftAssignments'] != null &&
              item['shiftAssignments'].isNotEmpty) {
            shift = item['shiftAssignments'][0]['workShift'];
          }
        }

        if (shift == null) {
          print(
              "WARNING: Data shift kosong untuk ${item['date']}, pakai default 8 jam.");
          shift = {"startTime": "08:00:00", "endTime": "16:00:00"};
        }

        // Parse waktu shift (tambahkan :00 jika perlu)
        String sTime = shift['startTime'].toString();
        String eTime = shift['endTime'].toString();
        if (sTime.length <= 5) sTime += ":00";
        if (eTime.length <= 5) eTime += ":00";

        DateTime shiftStart = DateFormat('HH:mm:ss').parse(sTime);
        DateTime shiftEnd = DateFormat('HH:mm:ss').parse(eTime);

        // Handle jika shift malam (melewati tengah malam)
        if (shiftEnd.isBefore(shiftStart)) {
          shiftEnd = shiftEnd.add(const Duration(days: 1));
        }

        // Handle jika lembur sampai lewat tengah malam
        if (outTime.isBefore(inTime)) {
          outTime = outTime.add(const Duration(days: 1));
        }

        // 5. Kalkulasi Menit
        int normalMinutes = shiftEnd.difference(shiftStart).inMinutes;
        int actualMinutes = outTime.difference(inTime).inMinutes;

        if (actualMinutes > 0) {
          totalMinutes += actualMinutes;

          if (actualMinutes > normalMinutes) {
            overtimeMinutes += (actualMinutes - normalMinutes);
          }
        }
      } catch (e) {
        // Jangan diam-diam di-skip, print errornya agar terlihat di console!
        print("ERROR PARSING WAKTU TANGGAL ${item['date']}: $e");
        continue;
      }
    }

    int validPresence = hariHadir + hariTerlambat;
    attendanceRate =
        totalHariKerja > 0 ? (validPresence / totalHariKerja) * 100 : 0.0;
    print("TOTAL KERJA: $totalHariKerja");
    print("HADIR: $hariHadir");
    print("TELAT: $hariTerlambat");
    print("CUTI/IZIN: $cutiIzin");
    print("TIDAK HADIR: $hariTidakHadir");
    print("INVALID: $invalid");
    // print("TOTAL JAM: ${totalMinutes ~/ 60} jam");
    // print("LEMBUR: ${overtimeMinutes ~/ 60} jam");
    totalJamKerja = totalMinutes / 60;
    totalLembur = overtimeMinutes / 60;
    print("TOTAL JAM KERJA: ${totalJamKerja.toStringAsFixed(2)} jam");
    print("TOTAL LEMBUR: ${totalLembur.toStringAsFixed(2)} jam");
    for (var item in filteredData) {
      print("STATUS RAW: '${item['attendanceStatus']}'");
    }
  }

  int _countWorkDays(DateTime selected, bool isMonthly) {
    DateTime start;
    DateTime end;
    if (isMonthly) {
      start = DateTime(selected.year, selected.month, 1);
      end = DateTime(selected.year, selected.month + 1, 0);
    } else {
      start = DateTime(selected.year, 1, 1);
      end = DateTime(selected.year, 12, 31);
    }
    int workDays = 0;
    for (DateTime d = start;
        !d.isAfter(end);
        d = d.add(const Duration(days: 1))) {
      if (d.weekday != DateTime.saturday && d.weekday != DateTime.sunday) {
        workDays++;
      }
    }
    return workDays;
  }

  // Future<void> _selectDate(BuildContext context) async {
  //   final DateTime? picked = await showDatePicker(
  //     context: context,
  //     initialDate: selectedDate,
  //     firstDate: DateTime(2020),
  //     lastDate: DateTime.now(),
  //   );
  //   if (picked != null) {
  //     setState(() {
  //       selectedDate = picked;
  //       _calculateSummary();
  //     });
  //   }
  // }

  Future<void> _selectDate(BuildContext context) async {
    int tempYear = selectedDate.year;
    int tempMonth = selectedDate.month;

    await showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(isBulanan ? "Pilih Bulan & Tahun" : "Pilih Tahun"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButton<int>(
                value: tempYear,
                isExpanded: true,
                items: List.generate(10, (index) {
                  int year = DateTime.now().year - index;
                  return DropdownMenuItem(
                    value: year,
                    child: Text(year.toString()),
                  );
                }),
                onChanged: (val) {
                  tempYear = val!;
                },
              ),
              if (isBulanan) ...[
                const SizedBox(height: 12),
                DropdownButton<int>(
                  value: tempMonth,
                  isExpanded: true,
                  items: List.generate(12, (index) {
                    return DropdownMenuItem(
                      value: index + 1,
                      child: Text(_getMonthName(index + 1)),
                    );
                  }),
                  onChanged: (val) {
                    tempMonth = val!;
                  },
                ),
              ]
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Batal"),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  selectedDate = isBulanan
                      ? DateTime(tempYear, tempMonth)
                      : DateTime(tempYear);
                  _calculateSummary();
                });
                Navigator.pop(context);
              },
              child: const Text("Pilih"),
            ),
          ],
        );
      },
    );
  }

  // Future<void> requestPermission() async {
  //   await Permission.storage.request();
  // }

  // Future<bool> requestPermission() async {
  //   if (Platform.isAndroid) {
  //     // Minta izin storage standar
  //     var status = await Permission.storage.request();
  //     // Minta izin manage storage (untuk Android 11+)
  //     var manageStatus = await Permission.manageExternalStorage.request();

  //     return status.isGranted || manageStatus.isGranted;
  //   }
  //   return true;
  // }

  // Future<void> savePdfFile() async {
  //   bool hasPermission = await requestPermission();
  //   if (!hasPermission) {
  //     print("Izin ditolak oleh sistem");
  //     // Bisa tambahkan showDialog/SnackBar di sini untuk memberitahu user
  //     return;
  //   }

  //   final pdf = pw.Document();
  //   // ... [KODE BUILD PDF KAMU] ...

  //   try {
  //     final dir = Directory('/storage/emulated/0/Download');
  //     if (!await dir.exists()) {
  //       await dir.create(recursive: true);
  //     }
  //     final file = File("${dir.path}/laporan_presensi.pdf");
  //     await file.writeAsBytes(await pdf.save());
  //     print("PDF berhasil disave di: ${file.path}");
  //   } catch (e) {
  //     print("Gagal menyimpan PDF: $e");
  //   }
  // }

  Future<void> savePdfFile() async {
    final pdf = pw.Document();
    pdf.addPage(
      pw.Page(
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text("Laporan Presensi",
                  style: pw.TextStyle(
                      fontSize: 20, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 16),
              pw.Text("Total Hari Kerja: $totalHariKerja"),
              pw.Text("Hari Hadir: $hariHadir"),
              pw.Text("Hari Terlambat: $hariTerlambat"),
              pw.Text("Tidak Hadir: $hariTidakHadir"),
              pw.Text(
                  "Tingkat Kehadiran: ${attendanceRate.toStringAsFixed(1)}%"),
              pw.SizedBox(height: 16),
              pw.TableHelper.fromTextArray(
                headers: [
                  'Tanggal',
                  'Jam Masuk',
                  'Jam Keluar',
                  'Status',
                  'Keterangan'
                ],
                // data: allAttendanceData.map((item) {
                //   return [
                //     item['date'] ?? '',
                //     item['checkInTime'] ?? '--:--',
                //     item['checkOutTime'] ?? '--:--',
                //     item['attendanceStatus'] ?? '',
                //     item['is_late'] == true ? 'Terlambat' : 'Hadir'
                //   ];
                // }).toList(),
                data: filteredAttendanceData.map((item) {
                  String tgl = item['date'] ?? '-';
                  // Ambil status kehadiran, default '-' jika kosong
                  String status = item['attendanceStatus'] ?? '-';
                  // Ambil jam masuk dan keluar, bersihkan format 'T' jika ada
                  String checkIn =
                      item['checkInTime'] ?? item['check_in'] ?? '--:--';
                  String checkOut =
                      item['checkOutTime'] ?? item['check_out'] ?? '--:--';
                  if (checkIn.contains('T'))
                    checkIn = checkIn.split('T')[1].split('.')[0];
                  if (checkOut.contains('T'))
                    checkOut = checkOut.split('T')[1].split('.')[0];
                  return [
                    tgl,
                    status.toUpperCase(), // Dibuat kapital agar lebih formal
                    checkIn,
                    checkOut
                  ];
                }).toList(),
              ),
            ],
          );
        },
      ),
    );
    // final dir = await getApplicationDocumentsDirectory();
    // final dir = Directory('/storage/emulated/0/Download');
    // final file = File("${dir.path}/laporan_presensi.pdf");
    // await file.writeAsBytes(await pdf.save());
    // print("PDF saved di: ${file.path}");
    final bytes = await pdf.save();
    await Printing.sharePdf(
      bytes: bytes,
      filename: 'laporan_presensi.pdf',
    );
    print("PDF save di: ${bytes}");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('Laporan Presensi',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF6F34FA),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchAndFilterData,
        child: Stack(
          children: [
            Container(
                height: 120,
                decoration: const BoxDecoration(color: Color(0xFF6F34FA))),
            isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Colors.white))
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        _buildSelectorCard(),
                        const SizedBox(height: 16),
                        _buildRingkasan(),
                        const SizedBox(height: 16),
                        _buildLaporanTerbaru(),
                        const SizedBox(height: 12),
                        _buildDownloadButton(),
                      ],
                    ),
                  ),
          ],
        ),
      ),
    );
  }

  Widget _buildRingkasan() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(isBulanan ? 'Ringkasan Bulanan' : 'Ringkasan Tahunan',
              style:
                  const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          _buildStatusGrid(),
          const SizedBox(height: 12),
          _buildStatGrid(),
          const SizedBox(height: 16),
          _buildAttendanceRate()
        ],
      ),
    );
  }

  Widget _buildStatusGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 2,
      children: [
        _statusCard('Total Hari Kerja', '$totalHariKerja', Icons.calendar_month,
            Colors.blue),
        _statusCard(
            'Hari Hadir', '$hariHadir', Icons.check_circle, Colors.green),
        _statusCard('Hari Terlambat', '$hariTerlambat',
            Icons.access_time_filled, Colors.orange),
        _statusCard(
            'Hari Tidak Hadir', '$hariTidakHadir', Icons.cancel, Colors.red),
      ],
    );
  }

  Widget _buildStatGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _statCard('Jam Lembur', '${totalLembur.toStringAsFixed(1)} jam',
            Icons.query_builder, Colors.purple),
        _statCard('Total Jam Kerja', '${totalJamKerja.toStringAsFixed(1)} jam',
            Icons.history, Colors.indigo),
      ],
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
                color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(width: 10),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(label,
                    style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[800],
                        fontWeight: FontWeight.bold)),
                Text(value,
                    style: const TextStyle(
                        fontSize: 22, fontWeight: FontWeight.bold)),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildAttendanceRate() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Tingkat Kehadiran',
                style: TextStyle(fontWeight: FontWeight.bold)),
            Text('${attendanceRate.toStringAsFixed(1)}%',
                style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                    fontSize: 20)),
          ],
        ),
        const SizedBox(height: 12),
        LinearProgressIndicator(
          value: attendanceRate / 100,
          backgroundColor: Colors.grey[200],
          color: Colors.green,
          minHeight: 8,
          borderRadius: BorderRadius.circular(4),
        ),
      ],
    );
  }

  // Widget _buildLaporanTerbaru() {
  //   List<dynamic> recentData = allAttendanceData.take(3).toList();
  //   return Container(
  //     padding: const EdgeInsets.all(16),
  //     decoration: BoxDecoration(
  //         color: Colors.white, borderRadius: BorderRadius.circular(16)),
  //     child: Column(
  //       crossAxisAlignment: CrossAxisAlignment.start,
  //       children: [
  //         const Text('Riwayat Terkini',
  //             style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
  //         const SizedBox(height: 12),
  //         if (recentData.isEmpty) const Text("Belum ada data presensi"),
  //         ...recentData.map((item) {
  //           return _laporanItem(
  //               DateFormat('dd MMMM yyyy').format(DateTime.parse(item['date'])),
  //               item['status'] ?? 'Hadir',
  //               item['check_in'] ?? '--:--',
  //               item['is_late'] == true ? 'Terlambat' : 'Tepat Waktu');
  //         }),
  //       ],
  //     ),
  //   );
  // }

  Widget _buildLaporanTerbaru() {
    List<dynamic> recentData = allAttendanceData.take(3).toList();
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Riwayat Presensi Terbaru',
              // const Text('Laporan Terbaru',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          if (recentData.isEmpty) const Text("Belum ada data presensi"),
          ...recentData.map((item) {
            return _laporanItem(
              DateFormat('dd MMMM yyyy').format(DateTime.parse(item['date'])),
              item['attendanceStatus'] ?? '-',
              item['checkInTime'] ?? '--:--',
              // item['is_late'] == true ? 'Terlambat' : 'Hadir');
            );
          }),
          // _laporanItem('Desember 2023', 'Bulanan', '2024-01-05', '245 KB'),
          // _laporanItem('2023', 'Tahunan', '2024-01-02', '1.2 MB'),
          // _laporanItem('November 2023', 'Bulanan', '2023-12-05', '238 KB'),
        ],
      ),
    );
  }

  Widget _statusCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 8),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(label,
                    style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                Text(value,
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
          )
        ],
      ),
    );
  }

  // Widget _laporanItem(String title, String status, String time, String note) {
  Widget _laporanItem(String title, String status, String time) {
    // String formatTime(String rawTime) {
    //   try {
    //     // Jika formatnya adalah ISO 8601 (mengandung 'T' dan 'Z')
    //     if (rawTime.contains('T')) {
    //       DateTime parsedDate = DateTime.parse(rawTime);
    //       return DateFormat('HH:mm:ss').format(parsedDate);
    //     }
    //     // Jika sudah format HH:mm atau HH:mm:ss
    //     return rawTime;
    //   } catch (e) {
    //     return rawTime; // Kembalikan asli jika gagal parse
    //   }
    // }

    // String formatWaktuIndo(String rawTime) {
    //   try {
    //     // Mengubah string ISO ke DateTime
    //     DateTime dateTime = DateTime.parse(rawTime);

    //     // Menggunakan DateFormat dengan lokal Indonesia
    //     // Contoh hasil: 12 Juni 2026, 12:46
    //     // return DateFormat('dd MMMM yyyy, HH:mm', 'id_ID').format(dateTime);
    //     return DateFormat('HH:mm:ss', 'id_ID').format(dateTime);
    //   } catch (e) {
    //     return rawTime; // Fallback jika format tidak bisa diparsing
    //   }
    // }
    String formatToLocalTime(String rawTime) {
      try {
        if (rawTime.contains('T')) {
          // 1. Parse string ke DateTime
          DateTime utcDate = DateTime.parse(rawTime);

          // 2. Konversi ke waktu lokal perangkat (otomatis menyesuaikan WIB)
          DateTime localDate = utcDate.toLocal();

          // 3. Format ke HH:mm:ss
          return DateFormat('HH:mm:ss').format(localDate);
        }
        return rawTime; // Kembalikan asli jika bukan format ISO
      } catch (e) {
        return rawTime;
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: Colors.grey[50], borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          const Icon(Icons.history, color: Colors.blue),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                // Text('$status • Jam $time • $note',
                // Text('$status • Jam $time',
                //     style: const TextStyle(fontSize: 12, color: Colors.grey)),
                Text('$status • Jam ${formatToLocalTime(time)}',
                    style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Widget _laporanItem(String title, String type, String date, String size) {
  //   return Container(
  //     margin: const EdgeInsets.only(bottom: 12),
  //     padding: const EdgeInsets.all(12),
  //     decoration: BoxDecoration(
  //         color: Colors.grey[50], borderRadius: BorderRadius.circular(12)),
  //     child: Row(
  //       children: [
  //         Container(
  //           padding: const EdgeInsets.all(10),
  //           decoration: BoxDecoration(
  //               color: Colors.blue.withOpacity(0.1),
  //               borderRadius: BorderRadius.circular(50)),
  //           child: const Icon(Icons.description, color: Colors.blue),
  //         ),
  //         const SizedBox(width: 16),
  //         Expanded(
  //           child: Column(
  //             crossAxisAlignment: CrossAxisAlignment.start,
  //             children: [
  //               Text(title,
  //                   style: const TextStyle(fontWeight: FontWeight.bold)),
  //               const SizedBox(height: 4),
  //               Text('$type • $date • $size',
  //                   style: const TextStyle(fontSize: 12, color: Colors.grey)),
  //             ],
  //           ),
  //         ),
  //         const Icon(Icons.download_rounded, color: Colors.blue),
  //       ],
  //     ),
  //   );
  // }

  Widget _buildSelectorCard() {
    String formattedDate = isBulanan
        ? "${_getMonthName(selectedDate.month)} ${selectedDate.year}"
        : "${selectedDate.year}";
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                  child: _toggleButton('Bulanan', isBulanan, () {
                setState(() => isBulanan = true);
                _calculateSummary();
              })),
              const SizedBox(width: 12),
              Expanded(
                  child: _toggleButton('Tahunan', !isBulanan, () {
                setState(() => isBulanan = false);
                _calculateSummary();
              })),
            ],
          ),
          const SizedBox(height: 16),
          InkWell(
            onTap: () => _selectDate(context),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(8)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(formattedDate),
                  const Icon(Icons.calendar_today, size: 18),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _toggleButton(String text, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF2D62ED) : Colors.grey[100],
          borderRadius: BorderRadius.circular(8),
        ),
        alignment: Alignment.center,
        child: Text(text,
            style: TextStyle(
                color: active ? Colors.white : Colors.black54,
                fontWeight: FontWeight.bold)),
      ),
    );
  }

  String _getMonthName(int month) {
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember'
    ];
    return months[month - 1];
  }

  Widget _buildDownloadButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () async {
          // await requestPermission();
          await savePdfFile();
        },
        icon: const Icon(Icons.download),
        label: Text(isBulanan
            ? 'Download Laporan Bulanan'
            : 'Download Laporan Tahunan'),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF6F34FA),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }
}
