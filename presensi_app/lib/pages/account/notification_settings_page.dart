import 'package:flutter/material.dart';

class NotificationSettingsPage extends StatefulWidget {
  const NotificationSettingsPage({super.key});

  @override
  State<NotificationSettingsPage> createState() =>
      _NotificationSettingsPageState();
}

class _NotificationSettingsPageState extends State<NotificationSettingsPage> {
  // State untuk switch - Notifikasi Umum
  bool pushNotify = true;
  bool emailNotify = false;
  bool smsNotify = false;

  // State untuk switch - Notifikasi Presensi
  bool pengingatPresensi = true;
  bool peringatanTerlambat = true;
  bool alertLembur = false;
  bool perubahanJadwal = true;

  // State untuk switch - Laporan
  bool laporanMingguan = true;
  bool laporanBulanan = false;

  // State untuk switch - Sistem
  bool updateSistem = false;
  bool emailMarketing = false;

  // State untuk switch - Suara & Getaran
  bool suaraNotif = true;
  bool getaran = true;

  // State untuk switch - Jam Tenang
  bool jamTenang = false;
  String jamMulai = "22.00";
  String jamSelesai = "07.00";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // backgroundColor: const Color(0xFFF8F9FA),
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        elevation: 0,
        title: const Text('Pengaturan Notifikasi',
            style: TextStyle(
              color: Colors.white,
            )),
        backgroundColor: const Color(0xFF6F34FA),
        actions: [
          TextButton(
            onPressed: () {
              // Aksi simpan
            },
            child: const Text(
              'Simpan',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          children: [
            _buildSection(
              'Notifikasi Umum',
              [
                _buildSwitchTile(
                    'Push Notifications',
                    'Terima notifikasi di perangkat',
                    pushNotify,
                    (v) => setState(() => pushNotify = v)),
                _buildSwitchTile(
                    'Email Notifications',
                    'Terima notifikasi via email',
                    emailNotify,
                    (v) => setState(() => emailNotify = v)),
                _buildSwitchTile(
                    'SMS Notifications',
                    'Terima notifikasi via SMS',
                    smsNotify,
                    (v) => setState(() => smsNotify = v)),
              ],
            ),
            _buildSection(
              'Notifikasi Presensi',
              [
                _buildSwitchTile(
                    'Pengingat Presensi',
                    'Ingatkan untuk check in/out',
                    pengingatPresensi,
                    (v) => setState(() => pengingatPresensi = v)),
                _buildSwitchTile(
                    'Peringatan Terlambat',
                    'Notifikasi jika terlambat',
                    peringatanTerlambat,
                    (v) => setState(() => peringatanTerlambat = v)),
                _buildSwitchTile('Alert Lembur', 'Notifikasi waktu lembur',
                    alertLembur, (v) => setState(() => alertLembur = v)),
                _buildSwitchTile(
                    'Perubahan Jadwal',
                    'Info perubahan jadwal kerja',
                    perubahanJadwal,
                    (v) => setState(() => perubahanJadwal = v)),
              ],
            ),
            _buildSection(
              'Laporan',
              [
                _buildSwitchTile(
                    'Laporan Mingguan',
                    'Ringkasan presensi mingguan',
                    laporanMingguan,
                    (v) => setState(() => laporanMingguan = v)),
                _buildSwitchTile(
                    'Laporan Bulanan',
                    'Ringkasan presensi bulanan',
                    laporanBulanan,
                    (v) => setState(() => laporanBulanan = v)),
              ],
            ),
            _buildSection(
              'Sistem',
              [
                _buildSwitchTile('Update Sistem', 'Info pembaruan aplikasi',
                    updateSistem, (v) => setState(() => updateSistem = v)),
                _buildSwitchTile('Email Marketing', 'Promosi dan penawaran',
                    emailMarketing, (v) => setState(() => emailMarketing = v)),
              ],
            ),
            _buildSection(
              'Suara & Getaran',
              [
                _buildSwitchTile(
                    'Suara Notifikasi',
                    'Aktifkan suara notifikasi',
                    suaraNotif,
                    (v) => setState(() => suaraNotif = v)),
                _buildSwitchTile('Getaran', 'Aktifkan getaran notifikasi',
                    getaran, (v) => setState(() => getaran = v)),
              ],
            ),
            _buildJamTenangSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
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
          Text(
            title,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1A1A),
            ),
          ),
          const SizedBox(height: 6),
          ...children,
        ],
      ),
    );
  }

  Widget _buildSwitchTile(
      String title, String subtitle, bool value, Function(bool) onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1A1A1A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),
          Transform.scale(
            scale: 1,
            child: Switch(
              value: value,
              onChanged: onChanged,
              activeColor: Colors.white,
              activeTrackColor: const Color(0xFF4A69FF),
              inactiveThumbColor: Colors.white,
              inactiveTrackColor: Colors.grey[300],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJamTenangSection() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
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
          const Text(
            'Jam Tenang',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1A1A),
            ),
          ),
          const SizedBox(height: 6),
          _buildSwitchTile(
            'Aktifkan Jam Tenang',
            'Nonaktifkan notifikasi pada jam tertentu',
            jamTenang,
            (v) => setState(() => jamTenang = v),
          ),
          if (jamTenang) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                Expanded(
                  child: _buildTimeInput('Mulai', jamMulai),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildTimeInput('Selesai', jamSelesai),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTimeInput(String label, String time) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1A1A1A),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey[200]!),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                time,
                style: const TextStyle(fontSize: 14, color: Colors.black87),
              ),
              const Icon(
                Icons.access_time,
                size: 18,
                color: Colors.black54,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
