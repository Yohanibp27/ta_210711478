import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../../services/auth_service.dart';
import 'package:presensi_app/utils/main_navigation_page.dart';
import 'package:presensi_app/pages/leaves/leave_detail_page.dart';

class LeaveFormPage extends StatefulWidget {
  const LeaveFormPage({super.key});

  @override
  State<LeaveFormPage> createState() => _LeaveFormPageState();
}

class _LeaveFormPageState extends State<LeaveFormPage> {
  final AuthService authService = AuthService();
  List<dynamic> _listTypes = [];
  List<dynamic> _listSubTypes = [];
  Map<String, dynamic>? selectedTypeObj;
  Map<String, dynamic>? selectedSubTypeObj;

  bool isLoading = true;
  DateTime? tanggalMulai;
  DateTime? tanggalSelesai;
  TextEditingController keteranganController = TextEditingController();
  String? fileName;
  String? filePath;
  bool? isApproved;

  bool isSelectError = false;
  bool isDateError = false;
  bool isFileError = false;
  bool isKeteranganError = false;

  // Di dalam class _LeaveFormPageState extends State<LeaveFormPage>
  List<dynamic> _userQuotas = []; // Menyimpan data dari /api/my-leavequota
  int?
      _selectedSubQuotaRemaining; // Menyimpan sisa kuota sub jenis yang dipilih
  bool _isQuotaExceeded = false; // Flag jika pengajuan melebihi sisa kuota

  final Map<String, List<String>> ketentuanSubJenis = {
    'Sakit Tanpa Surat Dokter': [
      'Dapat diajukan di hari yang sama (sebelum pukul 10.00 WIB)',
    ],
    'Sakit Dengan Surat Dokter': [
      'Wajib melampirkan bukti pendukung',
      'Dapat mengajukan izin lebih dari 1 hari',
      'Dapat diajukan di hari yang sama (sebelum pukul 10.00 WIB)',
    ],
    'Izin Keperluan Keluarga': [
      'Dapat diajukan di hari yang sama (sebelum pukul 10.00 WIB)',
    ],
    'Izin Keperluan Pribadi': [
      'Dapat diajukan di hari yang sama (sebelum pukul 10.00 WIB)',
    ],
    'Izin Mengurus Dokumen': [
      'Wajib melampirkan bukti pendukung',
      'Dapat diajukan di hari yang sama (sebelum pukul 10.00 WIB)',
    ],
    'Izin Lainnya': [
      'Wajib melampirkan bukti pendukung',
      'Dapat diajukan di hari yang sama (sebelum pukul 10.00 WIB)',
    ],
    'Cuti Tahunan': [
      'Tidak dapat diajukan di hari yang sama',
    ],
    'Cuti Melahirkan': [
      'Wajib melampirkan bukti pendukung',
      'Dapat mengajukan cuti lebih dari 3 hari',
      'Tidak dapat diajukan di hari yang sama',
    ],
    'Cuti Menikah': [
      'Tidak dapat diajukan di hari yang sama',
    ],
    'Cuti Khitanan/Baptis Anak': [
      'Tidak dapat diajukan di hari yang sama',
    ],
    'Cuti Kematian Keluarga': [
      'Dapat diajukan di hari yang sama (sebelum pukul 10.00 WIB)',
    ],
    'Cuti Haji/Umroh': [
      'Wajib melampirkan bukti pendukung',
      'Dapat mengajukan cuti lebih dari 3 hari',
      'Tidak dapat diajukan di hari yang sama',
    ],
    'Training/Seminar/Pelatihan': [
      'Wajib melampirkan bukti pendukung',
      'Dapat mengajukan izin lebih dari 3 hari',
      'Dapat diajukan di hari yang sama (sebelum pukul 10.00 WIB)',
    ],
    'Audit/Inspeksi': [
      'Wajib melampirkan bukti pendukung',
      'Dapat mengajukan izin lebih dari 3 hari',
      'Dapat diajukan di hari yang sama (sebelum pukul 10.00 WIB)',
    ],
    'Kunjungan Kerja': [
      'Wajib melampirkan bukti pendukung',
      'Dapat mengajukan izin lebih dari 3 hari',
      'Dapat diajukan di hari yang sama (sebelum pukul 10.00 WIB)',
    ],
    'Pengerjaan Proyek': [
      'Wajib melampirkan bukti pendukung',
      'Dapat mengajukan izin lebih dari 3 hari',
      'Dapat diajukan di hari yang sama (sebelum pukul 10.00 WIB)',
    ],
    'Dinas Luar Lainnya': [
      'Wajib melampirkan bukti pendukung',
      'Dapat mengajukan izin lebih dari 3 hari',
      'Dapat diajukan di hari yang sama (sebelum pukul 10.00 WIB)',
    ],
  };

  @override
  void initState() {
    super.initState();
    _fetchInitialData();
  }

  // Future<void> _fetchInitialData() async {
  //   try {
  //     final data = await authService.getLeaveTypes();
  //     setState(() {
  //       _listTypes = data;
  //       isLoading = false;
  //     });
  //   } catch (e) {
  //     setState(() => isLoading = false);
  //     debugPrint("Error load types: $e");
  //   }
  // }

  Future<void> _fetchInitialData() async {
    try {
      // 1. Ambil Jenis Pengajuan
      final typesData = await authService.getLeaveTypes();
      // 2. Ambil Kuota Pengajuan Aktif dari Database
      // Pastikan authService memiliki fungsi getMyLeaveQuota() yang memanggil endpoint GET /my-leavequota
      final quotaData = await authService.getMyLeaveQuota();

      setState(() {
        _listTypes = typesData;
        _userQuotas = quotaData ?? [];
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      debugPrint("Error load initial data: $e");
    }
  }

  Future<void> _fetchSubTypes(int typeId) async {
    try {
      final data = await authService.getLeaveSubTypes(typeId);
      setState(() {
        _listSubTypes =
            data.where((item) => item['leaveTypeId'] == typeId).toList();
      });
    } catch (e) {
      setState(() => isLoading = false);
      debugPrint("Error load sub types: $e");
    }
  }

  int get durasi {
    if (tanggalMulai != null && tanggalSelesai != null) {
      return tanggalSelesai!.difference(tanggalMulai!).inDays + 1;
    }
    return 0;
  }

  bool get wajibLampiran {
    return selectedSubTypeObj?['requireEvidence'] ?? false;
  }

  // bool get wajibLampiran {
  //   return selectedSubTypeObj != null &&
  //       selectedSubTypeObj!['requireEvidence'] == true;
  // }

  // void _validateForm() {
  //   setState(() {
  //     isSelectError = selectedTypeObj == null || selectedSubTypeObj == null;

  //     final now = DateTime.now();
  //     isDateError = false;

  //     if (tanggalMulai == null || tanggalSelesai == null) {
  //       isDateError = true;
  //     } else if (tanggalSelesai!.isBefore(tanggalMulai!)) {
  //       isDateError = true;
  //     } else {
  //       // Cek Cutoff Hour dari Database (LeaveSubtype)
  //       int cutoff = selectedSubTypeObj?['cutoffHour'] ?? 10;
  //       bool isHariIni = DateFormat('yyyy-MM-dd').format(tanggalMulai!) ==
  //           DateFormat('yyyy-MM-dd').format(now);
  //       bool allowsSameDay = selectedSubTypeObj?['allowSameDay'] ?? true;

  //       if (isHariIni) {
  //         if (!allowsSameDay || now.hour >= cutoff) {
  //           isDateError = true;
  //         }
  //       }
  //     }
  //     isKeteranganError = keteranganController.text.trim().isEmpty;
  //     isFileError = wajibLampiran && fileName == null;
  //   });
  // }
  void _validateForm() {
    setState(() {
      isSelectError = selectedTypeObj == null || selectedSubTypeObj == null;

      final now = DateTime.now();
      isDateError = false;
      _isQuotaExceeded = false;

      if (tanggalMulai == null || tanggalSelesai == null) {
        isDateError = true;
      } else if (tanggalSelesai!.isBefore(tanggalMulai!)) {
        isDateError = true;
      } else {
        int cutoff = selectedSubTypeObj?['cutoffHour'] ?? 10;
        bool isHariIni = DateFormat('yyyy-MM-dd').format(tanggalMulai!) ==
            DateFormat('yyyy-MM-dd').format(now);
        bool allowsSameDay = selectedSubTypeObj?['allowSameDay'] ?? true;

        if (isHariIni) {
          if (!allowsSameDay || now.hour >= cutoff) {
            isDateError = true;
          }
        }

        // VALIDASI SISA KUOTA DARI DATABASE
        if (_selectedSubQuotaRemaining != null &&
            durasi > _selectedSubQuotaRemaining!) {
          _isQuotaExceeded = true;
        }
      }
      isKeteranganError = keteranganController.text.trim().isEmpty;
      isFileError = wajibLampiran && fileName == null;
    });
  }

  Future<void> _selectDate(BuildContext context, bool isStart) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          tanggalMulai = picked;
          // // Simulasi validasi jam 10:00 jika pilih hari ini
          // if (picked.day == DateTime.now().day && DateTime.now().hour >= 10) {
          //   isDateError = true;
          // } else {
          //   isDateError = false;
          // }
          if (tanggalSelesai != null && tanggalSelesai!.isBefore(picked)) {
            // Auto adjust jika tgl selesai jadi gak valid
            tanggalSelesai = picked;
          }
        } else {
          tanggalSelesai = picked;
        }
        isDateError = false;
      });
    }
  }

  // void _handleOnSubmit() {
  //   _validateForm();
  //   if (!isSelectError && !isDateError && !isKeteranganError && !isFileError) {
  //     _showConfirmDialog();
  //   }
  // }
  void _handleOnSubmit() {
    _validateForm();

    if (_isQuotaExceeded) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'Gagal: Durasi pengajuan melebihi sisa kuota database Anda!'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (!isSelectError && !isDateError && !isKeteranganError && !isFileError) {
      _showConfirmDialog();
    }
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf', 'docx'],
      withData: false,
    );

    if (result != null && result.files.isNotEmpty) {
      setState(() {
        fileName = result.files.single.name;
        filePath = result.files.single.path;
        isFileError = false;
      });
    }
  }

  void _showConfirmDialog() {
    if (tanggalMulai == null || tanggalSelesai == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Pilih tanggal mulai atau terakhir terlebih dahulu!"),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    showDialog(
      context: context,
      barrierDismissible: false,
      // builder: (context) {
      //   return AlertDialog(
      //     shape: RoundedRectangleBorder(
      //       borderRadius: BorderRadius.circular(16),
      //     ),
      //     title: const Text(
      //       'Konfirmasi Pengajuan',
      //       style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
      //     ),
      //     content: Column(
      //       mainAxisSize: MainAxisSize.min,
      //       crossAxisAlignment: CrossAxisAlignment.start,
      //       children: [
      //         _confirmRow('Jenis', selectedTypeObj?['name'] ?? '-'),
      //         _confirmRow('Sub Jenis', selectedSubTypeObj?['name'] ?? '-'),
      //         _confirmRow('Durasi', '$durasi Hari'),
      //         const SizedBox(height: 4),
      //         const Text('Tanggal:',
      //             style: TextStyle(fontWeight: FontWeight.w600)),
      //         Text(
      //           '${DateFormat('dd/MM/yyyy').format(tanggalMulai!)} - ${DateFormat('dd/MM/yyyy').format(tanggalSelesai!)}',
      //           style: const TextStyle(fontSize: 15),
      //         ),
      //         const SizedBox(height: 16),
      //         const Divider(),
      //         const SizedBox(height: 8),
      //         const Text(
      //           'Apakah data pengajuan sudah sesuai?',
      //           style: TextStyle(fontWeight: FontWeight.w500),
      //         ),
      //       ],
      //     ),
      //     actions: [
      //       TextButton(
      //         onPressed: () => Navigator.pop(context),
      //         child: const Text('Periksa Lagi',
      //             style: TextStyle(color: Colors.grey)),
      //       ),
      //       ElevatedButton(
      //         onPressed: () {
      //           Navigator.pop(context);
      //           _submitToApi();
      //         },
      //         style: ElevatedButton.styleFrom(
      //           backgroundColor: const Color(0xFF5C59E8),
      //           shape: RoundedRectangleBorder(
      //               borderRadius: BorderRadius.circular(8)),
      //         ),
      //         child: const Text('Ya, Ajukan',
      //             style: TextStyle(color: Colors.white)),
      //       ),
      //     ],
      //   );
      // },
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
                "Konfirmasi Pengajuan",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
              const SizedBox(height: 12),
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _confirmRow(
                      'Jenis           ', selectedTypeObj?['name'] ?? '-'),
                  _confirmRow(
                      'Sub Jenis   ', selectedSubTypeObj?['name'] ?? '-'),
                  _confirmRow('Durasi         ', '$durasi Hari'),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(
                        width: 65,
                        child: Text(
                          'Tanggal',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                      const Text('   : ',
                          style: TextStyle(fontWeight: FontWeight.w600)),
                      Expanded(
                        child: Text(
                          '${DateFormat('dd/MM/yyyy').format(tanggalMulai!)} - ${DateFormat('dd/MM/yyyy').format(tanggalSelesai!)}',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  _confirmRow('Keterangan', '$durasi Hari'),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                "Apakah data pengajuan sudah sesuai?",
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
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
                        "Periksa Lagi",
                        style: TextStyle(color: Colors.black),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _submitToApi();
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

  void _showSuccessDialog(dynamic dataDetail) {
    showDialog(
      context: context,
      barrierDismissible: false, // User tidak bisa tap di luar untuk menutup
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          elevation: 0,
          backgroundColor: Colors.white,
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 10),
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F5E9),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.green,
                          width: 2.5,
                        ),
                      ),
                      child: const Icon(
                        Icons.check,
                        color: Colors.green,
                        size: 28,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Pengajuan Berhasil!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Pengajuan Anda telah dikirim dan akan diproses',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () {
                      // Navigator.of(context).pop();
                      // Future.delayed(const Duration(milliseconds: 100), () {
                      //   // mainNavKey.currentState?.setSelectedIndex(3);
                      //   MainNavigation.navKey.currentState?.setSelectedIndex(3);
                      // });

                      Navigator.of(context).pop();
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(
                          builder: (context) => const MainNavigation(),
                        ),
                        (route) => false,
                      );

                      // WidgetsBinding.instance.addPostFrameCallback((_) {
                      //   MainNavigation.navKey.currentState?.setSelectedIndex(3);
                      //   Navigator.push(
                      //     MainNavigation.navKey.currentContext!,
                      //     MaterialPageRoute(
                      //       builder: (context) =>
                      //           LeaveDetailPage(detail: dataDetail),
                      //     ),
                      //   );
                      // });
                      Future.delayed(const Duration(milliseconds: 300), () {
                        final navState = MainNavigation.navKey.currentState;
                        final navContext = MainNavigation.navKey.currentContext;
                        if (navState != null && navContext != null) {
                          navState.setSelectedIndex(3);
                          Navigator.push(
                            navContext,
                            MaterialPageRoute(
                              builder: (context) =>
                                  LeaveDetailPage(detail: dataDetail),
                            ),
                          );
                        } else {
                          debugPrint("NavKey Context belum siap");
                        }
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF5E54F3),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    // masuk ke halaman detaik pengajuan pada aktivitas user
                    child: const Text(
                      'Lihat Status Pengajuan',
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
                      Navigator.of(context).pop();
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
        );
      },
    );
  }

  Future<void> _submitToApi() async {
    if (wajibLampiran && (filePath == null || filePath!.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Harap lampirkan bukti dokumen!'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    showDialog(
        context: context,
        barrierDismissible: false,
        builder: (c) => const Center(child: CircularProgressIndicator()));
    try {
      final result = await authService.submitLeaveRequest(
        leaveTypeId: selectedTypeObj!['id'],
        leaveSubTypeId: selectedSubTypeObj!['id'],
        startDate: DateFormat('yyyy-MM-dd').format(tanggalMulai!),
        endDate: DateFormat('yyyy-MM-dd').format(tanggalSelesai!),
        note: keteranganController.text,
        evidenceFile: filePath,
      );
      print("response leave request: ${result}");

      if (!mounted) return;
      Navigator.pop(context);

      if (result != null) {
        _showSuccessDialog(result);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Gagal mengirim pengajuan, silakan coba lagi'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
      print("Error untuk pengajuan: $e");
      String errorMessage = e.toString().replaceAll('Exception: ', '');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(
              seconds: 4), // Tahan sedikit lebih lama agar terbaca
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // colors: [Color(0xFF6F34FA), Color(0xFF8E5CFC)],
    return Scaffold(
        backgroundColor: Colors.grey[100],
        appBar: AppBar(
          title: const Text('Pengajuan Izin/Cuti',
              style:
                  TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          backgroundColor: const Color(0xFF6F34FA),
          // elevation: 0,
        ),
        body: isLoading
            ? const Center(child: CircularProgressIndicator())
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
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildInfoBanner(),
                        const SizedBox(height: 20),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                  color: Colors.black.withOpacity(0.05),
                                  blurRadius: 10)
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildFieldLabel('Jenis Pengajuan *'),
                              _buildDropdown(
                                hint: 'Pilih Jenis Pengajuan',
                                items: _listTypes
                                    .map((e) => e['name'].toString())
                                    .toList(),
                                value: selectedTypeObj?['name'],
                                onChanged: (val) {
                                  final found = _listTypes
                                      .firstWhere((e) => e['name'] == val);
                                  setState(() {
                                    selectedTypeObj = found;
                                    selectedSubTypeObj = null;
                                    _listSubTypes = [];
                                    isSelectError = false;
                                  });
                                  _fetchSubTypes(found['id']);
                                },
                              ),
                              if (isSelectError && selectedTypeObj == null)
                                _buildErrorText('Jenis pengajuan wajib diisi!'),
                              const SizedBox(height: 16),
                              if (selectedTypeObj != null) ...[
                                _buildFieldLabel('Sub Jenis Pengajuan *'),
                                _buildDropdown(
                                  hint: 'Pilih Sub Jenis Pengajuan',
                                  items: _listSubTypes
                                      .map((e) => e['name'].toString())
                                      .toList(),
                                  value: selectedSubTypeObj?['name'],
                                  // onChanged: (val) {
                                  //   setState(() {
                                  //     selectedSubTypeObj = _listSubTypes
                                  //         .firstWhere((e) => e['name'] == val);
                                  //     isSelectError = false;
                                  //   });
                                  // },
                                  onChanged: (val) {
                                    setState(() {
                                      selectedSubTypeObj = _listSubTypes
                                          .firstWhere((e) => e['name'] == val);
                                      isSelectError = false;
                                      // Cari kuota di database yang sesuai dengan leaveSubTypeId yang dipilih
                                      final matchingQuota =
                                          _userQuotas.firstWhere(
                                        (q) =>
                                            q['leaveSubTypeId'] ==
                                            selectedSubTypeObj!['id'],
                                        orElse: () => null,
                                      );
                                      if (matchingQuota != null) {
                                        _selectedSubQuotaRemaining =
                                            matchingQuota['remaining'];
                                      } else {
                                        // Jika tipe ini tidak memiliki batasan kuota terdaftar di DB (misal izin sakit biasa)
                                        _selectedSubQuotaRemaining = null;
                                      }
                                    });
                                    _validateForm(); // Jalankan validasi ulang setelah sub jenis berubah
                                  },
                                ),
                                if (isSelectError && selectedSubTypeObj == null)
                                  _buildErrorText('Pilih sub jenis'),
                                const SizedBox(height: 16),
                                if (selectedSubTypeObj != null) ...[
                                  _buildKetentuanCard(selectedSubTypeObj!),
                                  const SizedBox(height: 16),
                                ],
                              ],
                              Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        _buildFieldLabel('Tanggal Mulai *'),
                                        _buildDateSelector(tanggalMulai,
                                            () => _selectDate(context, true),
                                            isError: isDateError &&
                                                tanggalMulai == null),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        _buildFieldLabel('Tanggal Selesai *'),
                                        _buildDateSelector(tanggalSelesai,
                                            () => _selectDate(context, false),
                                            isError: isDateError &&
                                                (tanggalSelesai == null ||
                                                    (tanggalMulai != null &&
                                                        tanggalSelesai!.isBefore(
                                                            tanggalMulai!)))),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              _buildDateValidationMessages(),
                              const SizedBox(height: 16),
                              _buildFieldLabel('Keterangan *'),
                              _buildTextField(),
                              if (isKeteranganError &&
                                  keteranganController.text.isEmpty)
                                _buildErrorText('Keterangan wajib diisi!'),
                              const SizedBox(height: 4),
                              if (wajibLampiran) ...[
                                _buildFieldLabel('Lampiran Bukti *'),
                                _buildUploadArea(),
                                if (isFileError)
                                  _buildErrorText('Bukti wajib dilampirkan'),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        _buildSubmitButton(),
                      ],
                    ),
                  ),
                ],
              ));
  }

  // Widget _buildInfoBanner() {
  //   return Container(
  //     width: double.infinity,
  //     padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
  //     decoration: BoxDecoration(
  //       color: const Color(0xFFF1F7FF),
  //       borderRadius: BorderRadius.circular(10),
  //     ),
  //     child: Row(
  //       crossAxisAlignment: CrossAxisAlignment.start,
  //       children: [
  //         Container(
  //           padding: const EdgeInsets.all(6),
  //           decoration: const BoxDecoration(
  //             color: Color(0xFFE3EEFF),
  //             shape: BoxShape.circle,
  //           ),
  //           child: const Icon(
  //             Icons.info_outline,
  //             color: Color(0xFF3F51B5),
  //             size: 18,
  //           ),
  //         ),
  //         const SizedBox(width: 12),
  //         Expanded(
  //           child: Column(
  //             crossAxisAlignment: CrossAxisAlignment.start,
  //             children: [
  //               const Text(
  //                 "Sisa Kuota Cuti: 9 hari",
  //                 style: TextStyle(
  //                   fontSize: 14,
  //                   fontWeight: FontWeight.w600,
  //                   color: Color(0xFF1A1C1E),
  //                 ),
  //               ),
  //               const SizedBox(height: 4),
  //               Text(
  //                 "Pengajuan akan diproses maksimal 2x24 jam kerja",
  //                 style: TextStyle(
  //                   fontSize: 12,
  //                   color: Colors.blueGrey.shade600,
  //                 ),
  //               ),
  //             ],
  //           ),
  //         ),
  //       ],
  //     ),
  //   );
  // }

  Widget _buildInfoBanner() {
    String quotaText = "Pilih sub jenis pengajuan dahulu";
    Color bannerColor = const Color(0xFFF1F7FF);
    Color iconColor = const Color(0xFF3F51B5);
    Color textColor = const Color(0xFF1A1C1E);
    Color subTextColor = Colors.blueGrey.shade600;

    if (selectedSubTypeObj != null) {
      if (_selectedSubQuotaRemaining != null) {
        quotaText =
            "Sisa Kuota ${selectedSubTypeObj!['name']}: $_selectedSubQuotaRemaining hari";

        // Jika kuota tidak cukup, ubah tema warna banner menjadi merah peringatan
        if (_isQuotaExceeded) {
          quotaText += " (Kuota Tidak Mencukupi! Pengajuan: $durasi hari)";
          bannerColor = Colors.red.shade50;
          iconColor = Colors.red.shade700;
          textColor = Colors.red.shade900;
          subTextColor = Colors.red.shade700;
        }
      } else {
        quotaText = "Jenis pengajuan tidak dibatasi jatah kuota tahunan";
      }
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: bannerColor, // Menggunakan warna dinamis sesuai kondisi kuota
        borderRadius: BorderRadius.circular(10),
        border:
            _isQuotaExceeded ? Border.all(color: Colors.red.shade200) : null,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: _isQuotaExceeded
                  ? Colors.red.shade100
                  : const Color(0xFFE3EEFF),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _isQuotaExceeded
                  ? Icons.warning_amber_rounded
                  : Icons.info_outline,
              color: iconColor, // Menggunakan warna icon dinamis
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  quotaText,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: textColor, // Menggunakan warna teks utama dinamis
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "Pengajuan akan diproses maksimal 2x24 jam kerja",
                  style: TextStyle(
                    fontSize: 12,
                    color: subTextColor, // Menggunakan warna sub-teks dinamis
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFieldLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: _buildLabelWithAsterisk(label),
    );
  }

  Widget _buildDateSelector(DateTime? date, VoidCallback onTap,
      {bool isError = false}) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: isError ? Colors.red : Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              date == null
                  ? 'dd/mm/yyyy'
                  : DateFormat('dd/MM/yyyy').format(date),
              style: TextStyle(
                  fontSize: 13,
                  color: date == null ? Colors.grey : Colors.black),
            ),
            const Icon(Icons.calendar_today_outlined,
                size: 16, color: Colors.black54),
          ],
        ),
      ),
    );
  }

  Widget _buildDateValidationMessages() {
    if (isDateError) {
      if (tanggalMulai == null) return _buildErrorText('Pilih tanggal mulai!');
      if (tanggalSelesai == null)
        return _buildErrorText('Pilih tanggal selesai!');
      if (tanggalSelesai!.isBefore(tanggalMulai!))
        return _buildErrorText('Tanggal selesai tidak valid!');
    }
    if (durasi > 0) return _buildDurasiBox();
    return const SizedBox.shrink();
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
          fontFamily: 'Roboto',
        ),
        children: const [
          TextSpan(
            text: '*',
            style: TextStyle(color: Colors.red),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdown({
    required String hint,
    required List<String> items,
    required String? value,
    required Function(String?) onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          hint: Text(hint),
          value: value,
          isExpanded: true,
          items: items
              .map((e) => DropdownMenuItem(value: e, child: Text(e)))
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildKetentuanCard(Map<String, dynamic> subType) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFE3F2FD),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, color: Color(0xFF1976D2), size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ketentuan:',
                  style: TextStyle(
                      fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
                ),
                const SizedBox(height: 4),
                Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                        '• Batas maksimal: ${subType['maxDays'] ?? '-'} hari',
                        style: const TextStyle(
                            fontSize: 13, color: Color(0xFF1976D2)))),
                Text('• Jam Cutoff: ${subType['cutoffHour'] ?? 10}:00 WIB',
                    style: const TextStyle(
                        fontSize: 13, color: Color(0xFF1976D2))),
                if (subType['requireEvidence'] == true)
                  const Text('• Wajib melampirkan file bukti',
                      style: TextStyle(
                          fontSize: 13,
                          color: Colors.red,
                          fontWeight: FontWeight.w500)),
                if (subType['allowSameDay'] == false)
                  const Text('• Tidak bisa diajukan di hari yang sama',
                      style: TextStyle(fontSize: 13, color: Colors.orange)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDurasiBox() {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      width: double.infinity,
      decoration: BoxDecoration(
          color: const Color(0xFFE8EAF6),
          borderRadius: BorderRadius.circular(8)),
      child: Text('Durasi: $durasi hari',
          style: const TextStyle(
              color: Color(0xFF1A237E), fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildUploadArea() {
    return InkWell(
      onTap: wajibLampiran || selectedSubTypeObj != null ? _pickFile : null,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          border: Border.all(
            color: isFileError ? Colors.red : Colors.grey[300]!,
          ),
          borderRadius: BorderRadius.circular(8),
          color: const Color(0xFFFAFAFA),
        ),
        child: Column(
          children: [
            Icon(
              Icons.cloud_upload_outlined,
              size: 40,
              color: wajibLampiran ? Colors.blue : Colors.grey,
            ),
            const SizedBox(height: 8),
            Text(
              fileName ?? 'Pilih file',
              style: TextStyle(
                fontWeight: FontWeight.w500,
                color: fileName != null ? Colors.black : Colors.grey,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Format: JPG, PNG, PDF (Max 5MB)',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField() {
    return TextField(
      controller: keteranganController,
      maxLines: 3,
      maxLength: 500,
      onChanged: (val) {
        if (isKeteranganError && val.isNotEmpty) {
          setState(() {
            isKeteranganError = false;
          });
        }
      },
      decoration: InputDecoration(
        hintText: 'Jelaskan keterangan pengajuan...',
        hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(
                color: isKeteranganError ? Colors.red : Colors.grey[300]!)),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(
                color: isKeteranganError ? Colors.red : Colors.grey[300]!)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(
            color: isKeteranganError ? Colors.red : const Color(0xFF5C59E8),
          ),
        ),
      ),
    );
  }

  Widget _buildErrorText(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Align(
          alignment: Alignment.centerLeft,
          child: Text(text,
              style: const TextStyle(color: Colors.red, fontSize: 11))),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: _handleOnSubmit,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF6F34FA),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: const Text('Ajukan Permohonan',
            style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.white)),
      ),
    );
  }

  Widget _confirmRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label :',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            child: Text(' $value',
                style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
