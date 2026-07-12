import 'package:flutter/material.dart';

// --- Model Data (Reusable) ---
// Model data sederhana untuk shift karyawan
class EmployeeShift {
  final String name;
  final String department;
  final String imageUrl;
  final String shiftDay;
  final String shiftTime;
  final String shiftLocation;
  final String badgeText;
  final Color badgeColor;
  final Color badgeTextColor;

  EmployeeShift({
    required this.name,
    required this.department,
    required this.imageUrl,
    required this.shiftDay,
    required this.shiftTime,
    required this.shiftLocation,
    required this.badgeText,
    required this.badgeColor,
    required this.badgeTextColor,
  });
}

// --- Main Page (Stateful Widget) ---
class UbahJadwalPage extends StatefulWidget {
  const UbahJadwalPage({super.key});

  @override
  State<UbahJadwalPage> createState() => _UbahJadwalPageState();
}

class _UbahJadwalPageState extends State<UbahJadwalPage> {
  // 0: Ubah Tanggal, 1: Tukar Jadwal
  int _currentTab = 1; // Set default ke Tukar Jadwal sesuai permintaan
  String? _selectedEmployee;

  // Data dummy untuk daftar karyawan
  final List<EmployeeShift> _employeeShifts = [
    EmployeeShift(
      name: 'Sarah Wijaya',
      department: 'IT Development',
      imageUrl: 'assets/sarah.jpg', // Ganti dengan path gambar yang benar
      shiftDay: 'Selasa, 16 Januari',
      shiftTime: '08:00 - 17:00',
      shiftLocation: 'Kantor Pusat',
      badgeText: 'Pagi',
      badgeColor: const Color(0xFFE6FFF0),
      badgeTextColor: const Color(0xFF00BFA5),
    ),
    EmployeeShift(
      name: 'Ahmad Rahman',
      department: 'IT Development',
      imageUrl: 'assets/ahmad.jpg', // Ganti dengan path gambar yang benar
      shiftDay: 'Rabu, 17 Januari',
      shiftTime: '13:00 - 22:00',
      shiftLocation: 'Kantor Cabang A',
      badgeText: 'Siang',
      badgeColor: const Color(0xFFFFF7E0),
      badgeTextColor: const Color(0xFFFFCC00),
    ),
    EmployeeShift(
      name: 'Maya Sari',
      department: 'IT Development',
      imageUrl: 'assets/maya.jpg', // Ganti dengan path gambar yang benar
      shiftDay: 'Kamis, 18 Januari',
      shiftTime: '08:00 - 17:00',
      shiftLocation: 'Kantor Pusat',
      badgeText: 'Pagi',
      badgeColor: const Color(0xFFE6FFF0),
      badgeTextColor: const Color(0xFF00BFA5),
    ),
  ];

  @override
  void initState() {
    super.initState();
    // Inisialisasi karyawan yang dipilih (misalnya Maya Sari, sesuai gambar)
    _selectedEmployee = 'Maya Sari';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text(
          'Ubah Jadwal',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0.5,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  // 1. Jadwal Saat Ini (Header Card)
                  _buildCurrentScheduleCard(),

                  const SizedBox(height: 20),

                  // 2. Tombol Tab (Ubah Tanggal dan Tukar Jadwal)
                  _buildTabButtons(),

                  const SizedBox(height: 20),

                  // 3. Konten Tukar Jadwal (Sesuai _currentTab)
                  if (_currentTab == 1) _buildSwapScheduleContent(),
                  // Jika _currentTab == 0, akan menampilkan konten Ubah Tanggal sebelumnya
                ],
              ),
            ),
          ),

          // 4. Tombol Ajukan Pertukaran Jadwal (Fixed di bawah)
          if (_currentTab == 1) _buildSubmitButton(),
        ],
      ),
    );
  }

  // Helper Widget untuk Kartu Jadwal Saat Ini (Sama dengan sebelumnya)
  Widget _buildCurrentScheduleCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text(
                'Senin, 15 Januari',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 4),
              Text('Kantor Pusat', style: TextStyle(color: Colors.grey)),
              Text('08:00 - 17:00', style: TextStyle(color: Colors.grey)),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFE6FFF0),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              'Shift Pagi',
              style: TextStyle(
                color: Color(0xFF00BFA5),
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Helper Widget untuk Tombol Tab
  Widget _buildTabButtons() {
    Color activeColor = const Color(0xFF5E49F0);
    Color inactiveBgColor = Colors.white;
    Color inactiveFgColor = Colors.black54;

    return Row(
      children: [
        Expanded(
          child: ElevatedButton(
            onPressed: () {
              setState(() => _currentTab = 0);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _currentTab == 0 ? activeColor : inactiveBgColor,
              foregroundColor:
                  _currentTab == 0 ? Colors.white : inactiveFgColor,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: _currentTab == 0
                    ? BorderSide.none
                    : BorderSide(color: Colors.grey.shade300),
              ),
              minimumSize: const Size(double.infinity, 45),
            ),
            child: const Text(
              'Ubah Tanggal',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: ElevatedButton(
            onPressed: () {
              setState(() => _currentTab = 1);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _currentTab == 1 ? activeColor : inactiveBgColor,
              foregroundColor:
                  _currentTab == 1 ? Colors.white : inactiveFgColor,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: _currentTab == 1
                    ? BorderSide.none
                    : BorderSide(color: Colors.grey.shade300),
              ),
              minimumSize: const Size(double.infinity, 45),
            ),
            child: const Text(
              'Tukar Jadwal',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ],
    );
  }

  // Helper Widget untuk Konten Tukar Jadwal
  Widget _buildSwapScheduleContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Pilih Karyawan untuk Pertukaran',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),

        // Deskripsi
        const Text(
          'Pilih karyawan yang ingin Anda tukar jadwal. Jadwal Anda akan diberikan kepada karyawan tersebut, dan Anda akan mendapat jadwal mereka.',
          style: TextStyle(fontSize: 14, color: Colors.grey),
        ),
        const SizedBox(height: 20),

        // List Karyawan
        ..._employeeShifts
            .map((employee) => _buildEmployeeCard(employee))
            .toList(),

        const SizedBox(height: 20),

        // Perhatian! (Note Box)
        _buildNoteBox(),
      ],
    );
  }

  // Helper Widget untuk Kartu Karyawan Pertukaran
  Widget _buildEmployeeCard(EmployeeShift employee) {
    bool isSelected = _selectedEmployee == employee.name;
    Color activeColor = const Color(0xFF5E49F0);

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedEmployee = employee.name;
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 15),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(
            color: isSelected ? activeColor : Colors.grey.shade200,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? activeColor.withOpacity(0.1)
                  : Colors.grey.withOpacity(0.1),
              spreadRadius: 1,
              blurRadius: 5,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Gambar Profil (Dummy)
                CircleAvatar(
                  radius: 25,
                  backgroundImage: AssetImage(employee.imageUrl.replaceAll(
                      'assets/',
                      'lib/assets/')), // Ganti path sesuai struktur project Anda
                  // Fallback jika tidak ada gambar (misalnya, jika `assets/` tidak ada)
                  child: employee.imageUrl.contains('assets/')
                      ? null
                      : const Icon(Icons.person, color: Colors.white),
                  backgroundColor: isSelected
                      ? activeColor.withOpacity(0.5)
                      : Colors.grey.shade300,
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        employee.name,
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        employee.department,
                        style:
                            const TextStyle(fontSize: 14, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                // Radio Button
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected ? activeColor : Colors.grey,
                      width: 2,
                    ),
                    color: isSelected ? activeColor : Colors.white,
                  ),
                  child: isSelected
                      ? const Icon(Icons.circle, size: 10, color: Colors.white)
                      : null,
                ),
              ],
            ),
            const SizedBox(height: 15),

            // Detail Jadwal Karyawan
            const Text(
              'Jadwal Karyawan:',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 5),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(employee.shiftDay,
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    Text('${employee.shiftTime}\n${employee.shiftLocation}',
                        style: const TextStyle(color: Colors.grey)),
                  ],
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: employee.badgeColor,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    employee.badgeText,
                    style: TextStyle(
                      color: employee.badgeTextColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Helper Widget untuk Kotak Perhatian!
  Widget _buildNoteBox() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBE6), // Warna kuning muda
        borderRadius: BorderRadius.circular(10),
        border: const Border(
          left: BorderSide(
            color: Color(0xFFFFCC00), // Garis kuning tebal di kiri
            width: 4,
          ),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Icon(Icons.info_outline, color: Color(0xFFFFCC00)),
          SizedBox(width: 8),
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: 'Perhatian!\n',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Colors.black,
                    ),
                  ),
                  TextSpan(
                    text:
                        'Setelah pertukaran disetujui, jadwal Anda akan diberikan kepada karyawan yang dipilih, dan Anda akan mendapat jadwal mereka. Pastikan Anda sudah berkomunikasi dengan karyawan tersebut.',
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Helper Widget untuk Tombol Ajukan Pertukaran Jadwal
  Widget _buildSubmitButton() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 10,
            offset: Offset(0, -5),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: _selectedEmployee != null
            ? () {
                // Aksi untuk Ajukan Pertukaran Jadwal
                print('Mengajukan pertukaran dengan $_selectedEmployee');
              }
            : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF5E49F0), // Warna ungu solid
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 50),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          elevation: 0,
        ),
        child: const Text(
          'Ajukan Pertukaran Jadwal',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}

// Catatan: Jika Anda ingin menjalankan kode ini, Anda perlu memastikan
// bahwa Anda memiliki file gambar dummy di folder 'assets/' 
// (misalnya 'assets/sarah.jpg', 'assets/ahmad.jpg', 'assets/maya.jpg')
// dan mendeklarasikan folder assets di file pubspec.yaml.