// TAMPILAN AKUN
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:presensi_app/pages/account/attendance_report_page.dart';
import 'package:presensi_app/pages/account/notification_settings_page.dart';
import 'package:presensi_app/pages/auth/login_page.dart';
import 'edit_profile_page.dart';
import 'change_password_page.dart';
import '../../services/auth_service.dart';
import 'dart:io';
import 'package:shimmer/shimmer.dart';

class UserProfile {
  final int id;
  final String titlePrefix;
  final String fullName;
  final String titleSuffix;
  final String email;
  final String nip;
  final String phone;
  final String position;
  final String department;
  final String profession;
  final String joinDate;
  final String workShift;
  final String employmentType;
  final String? photoAsset;

  UserProfile({
    required this.id,
    required this.titlePrefix,
    required this.fullName,
    required this.titleSuffix,
    required this.email,
    required this.nip,
    required this.phone,
    required this.position,
    required this.department,
    required this.profession,
    required this.joinDate,
    required this.workShift,
    required this.employmentType,
    this.photoAsset = 'assets/default_profile.png',
  });

  String get fullNameUser {
    final prefix = titlePrefix.trim();
    final name = fullName.trim();
    if (prefix.isEmpty && name.isEmpty) return '-';
    final nameParts = name.split(' ').where((s) => s.isNotEmpty).toList();
    String firstWordOfName = nameParts.isNotEmpty ? nameParts.first : '';
    if (prefix.isNotEmpty) {
      return '$prefix $firstWordOfName'.trim();
    } else {
      return firstWordOfName;
    }
  }

  String formatIndonesianDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('d MMMM yyyy', 'id_ID').format(date);
    } catch (e) {
      return dateString;
    }
  }
}

class AccountPage extends StatefulWidget {
  final VoidCallback? onLogout;

  const AccountPage({super.key, this.onLogout});

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  final AuthService authService = AuthService();
  late Future<UserProfile?> _profileFuture;

  @override
  void initState() {
    super.initState();
    _profileFuture = _loadProfile();
  }

  Future<UserProfile?> _loadProfile() async {
    final data = await authService.getProfile();
    print("PROFILE DATA: $data");

    if (data == null) return null;

    final profileData = data['data'] ?? data;

    final position = profileData['position'] ?? {};
    final division = position['division'] ?? {};
    final department = division['department'] ?? {};
    final profession = profileData['profession'] ?? {};
    final workShift = profileData['workShift'] ?? {};
    final employmentType = profileData['employmentType'];
    print("PROFESSION: $profession");
    // final String? photoUrl = profileData['photo'] != null
    //     ? 'https://api.presensi.kemnaker.go.id${profileData['photo']}'
    //     : null;

    String? rawPhotoUrl = profileData['avatarUrl'];
    // if (rawPhotoUrl != null && rawPhotoUrl.contains('localhost')) {
    //   rawPhotoUrl = rawPhotoUrl.replaceAll('localhost', '10.0.2.2');
    // }
    String getBaseHost() {
      if (Platform.isAndroid) {
        return "10.0.2.2";
      }
      return "192.168.1.10";
    }

    if (rawPhotoUrl != null && rawPhotoUrl.contains('localhost')) {
      rawPhotoUrl = rawPhotoUrl.replaceAll('localhost', getBaseHost());
    }
    // final rawPhotoUrl = profileData['avatarUrl'];
    // final fixedPhotoUrl = ProfileHelper.fixImageUrl(rawPhotoUrl);
    print("FINAL PHOTO URL: $rawPhotoUrl");

    return UserProfile(
      id: profileData['id'] != null ? profileData['id'] : 0,
      titlePrefix: profileData['titlePrefix'] ?? '',
      fullName: profileData['fullName'] ?? '',
      titleSuffix: profileData['titleSuffix'] ?? '',
      email: profileData['email'] ?? '-',
      nip: profileData['nip'] ?? '-',
      phone: profileData['phone'] ?? '-',
      position: position['name'] ?? '-',
      department: department['name'] ?? '-',
      profession: profession['name'] ?? '-',
      workShift: workShift['name'] ?? '-',
      employmentType: (employmentType is Map)
          ? (employmentType['name'] ?? '-')
          : (employmentType ?? '-'),
      joinDate: profileData['joinDate'] ?? '-',
      // photoAsset: photoUrl,
      photoAsset: rawPhotoUrl,
      // photoAsset: fixedPhotoUrl,
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<UserProfile?>(
      future: _profileFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          // return const Center(child: CircularProgressIndicator());
          return _buildSkeleton();
        } else if (!snapshot.hasData) {
          return const Center(child: Text("Gagal memuat profil"));
        }

        final profile = snapshot.data!;
        return SingleChildScrollView(
          child: Column(
            children: [
              _buildProfileHeader(profile),
              _buildEmployeeDetails(profile),
              const SizedBox(height: 16),
              _buildSettingsMenu(context, profile),
              const SizedBox(height: 30),
            ],
          ),
        );
      },
    );
  }

  Widget _buildProfileHeader(UserProfile profile) {
    // ImageProvider getProfileImage(String? url) {
    //   final fixedUrl = ProfileHelper.fixImageUrl(url);
    //   if (fixedUrl.isEmpty) {
    //     return const AssetImage('assets/default_profile.png');
    //   }
    //   return NetworkImage(Uri.encodeFull(fixedUrl));
    // }

    return Container(
      padding: const EdgeInsets.all(20),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: Colors.grey,
                backgroundImage: (profile.photoAsset != null &&
                        profile.photoAsset!.startsWith('http'))
                    ? NetworkImage(profile.photoAsset!)
                    : const AssetImage('assets/default_profile.png')
                        as ImageProvider,
                // backgroundImage: getProfileImage(profile.photoAsset),
                // onBackgroundImageError: (_, __) {
                //   debugPrint("Gagal load image profile");
                // },
                // child:
                //     (profile.photoAsset == null || profile.photoAsset!.isEmpty)
                //         ? const Icon(
                //             Icons.person,
                //             size: 45,
                //             color: Colors.white,
                //           )
                //         : null,
              ),
              const SizedBox(width: 20),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    profile.fullNameUser,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    profile.position,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    profile.email,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmployeeDetails(UserProfile profile) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
      color: Colors.white,
      child: Column(
        children: [
          _buildDetailRow("NIP", profile.nip),
          const SizedBox(height: 15),
          _buildDetailRow("Departemen", profile.department),
          const SizedBox(height: 15),
          _buildDetailRow("Profesi", profile.profession),
          const SizedBox(height: 15),
          // _buildDetailRow("Bergabung Sejak", profile.joinDate,
          //     isHighlighted: true),
          // _buildDetailRow(
          //   "Bergabung Sejak",
          //   profile.formatIndonesianDate(profile.joinDate),
          //   isHighlighted: true,
          // ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value,
      {bool isHighlighted = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey.shade700,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isHighlighted ? FontWeight.bold : FontWeight.normal,
            color: isHighlighted ? Colors.black : Colors.black,
          ),
        ),
      ],
    );
  }

  Widget _buildSettingsMenu(BuildContext context, UserProfile profile) {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildMenuItem(
            context,
            Icons.person_outline,
            "Edit Profil",
            "Lihat informasi pribadi",
            profile: profile,
          ),
          _buildDivider(),
          _buildMenuItem(
              context, Icons.lock_outline, "Ubah Password", "Keamanan akun"),
          _buildDivider(),
          // _buildMenuItem(context, Icons.notifications_none,
          //     "Pengaturan Notifikasi", "Atur preferensi notifikasi"),
          _buildDivider(),
          _buildMenuItem(context, Icons.description_outlined,
              "Laporan Presensi", "Download laporan bulanan"),
          _buildDivider(),
          // _buildMenuItem(
          //     context, Icons.help_outline, "Bantuan & FAQ", "Pusat bantuan"),
          _buildMenuItem(
            context,
            Icons.logout,
            "Logout",
            "Keluar dari akun",
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(
      BuildContext context, IconData icon, String title, String subtitle,
      {UserProfile? profile}) {
    VoidCallback? onTapAction;

    if (title == "Edit Profil") {
      onTapAction = () {
        if (profile != null) {
          final editableProfile = EditableProfile(
            id: profile.id,
            titlePrefix: profile.titlePrefix,
            fullName: profile.fullName,
            titleSuffix: profile.titleSuffix,
            email: profile.email,
            nip: profile.nip,
            phone: profile.phone,
            position: profile.position,
            department: profile.department,
            profession: profile.profession,
            workShift: profile.workShift,
            employmentType: profile.employmentType,
            joinDate: profile.joinDate,
            photoAsset: profile.photoAsset,
          );
          print('Klik menu Lihat Profil, id: ${profile.id}');
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => EditProfilePage(profile: editableProfile),
            ),
          );
          print(
              'Navigasi ke EditProfilePage dengan profile: ${profile.fullName}');
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profil tidak tersedia!'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }

        if (profile == 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profil tidak memiliki ID valid!'),
              behavior: SnackBarBehavior.floating,
            ),
          );
          return;
        }
      };
    } else if (title == "Ubah Password") {
      onTapAction = () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const ChangePasswordPage(),
          ),
        );
      };
      // } else if (title == "Logout") {
      //   onTapAction = () {
      //     Navigator.push(
      //       context,
      //       MaterialPageRoute(
      //         builder: (context) => const LoginPage(),
      //       ),
      //     );
      //     ScaffoldMessenger.of(context).showSnackBar(
      //       SnackBar(content: Text('Berhasil Logout!')),
      //     );
      //   };
    } else if (title == "Laporan Presensi") {
      onTapAction = () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const AttendanceReportPage(),
          ),
        );
      };
    } else if (title == "Pengaturan Notifikasi") {
      onTapAction = () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const NotificationSettingsPage(),
          ),
        );
      };
    } else if (title == "Logout") {
      onTapAction = () async {
        try {
          await authService.logout();
          if (mounted) {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (context) => const LoginPage()),
              (route) => false,
            );
          }
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Logout berhasil!'),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
            ),
          );
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Gagal logout: $e'),
                backgroundColor: Colors.red,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        }
      };
    } else {
      onTapAction = () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Anda mengklik $title'),
            backgroundColor: Colors.blue,
            behavior: SnackBarBehavior.floating,
          ),
        );
      };
    }

    return ListTile(
      leading: Icon(icon, color: Colors.black87),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle, style: TextStyle(color: Colors.grey.shade600)),
      trailing: const Icon(Icons.chevron_right, color: Colors.grey),
      onTap: onTapAction,
    );
  }

  Widget _buildDivider() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Divider(height: 0, color: Colors.grey.shade200),
    );
  }

  Widget _buildSkeleton() {
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildProfileHeaderSkeleton(),
          _buildEmployeeDetailsSkeleton(),
          const SizedBox(height: 16),
          _buildSettingsMenuSkeleton(),
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _buildProfileHeaderSkeleton() {
    return Container(
      padding: const EdgeInsets.all(20),
      color: Colors.white, // Background tetap putih, tidak tertimpa Shimmer
      child: Row(
        children: [
          skeletonCircle(80),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                skeletonLine(width: 160, height: 16),
                const SizedBox(height: 8),
                skeletonLine(width: 120, height: 14),
                const SizedBox(height: 8),
                skeletonLine(width: 200, height: 14),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmployeeDetailsSkeleton() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
      color: Colors.white,
      child: Column(
        children: List.generate(3, (index) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 15),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                skeletonLine(width: 80, height: 14),
                skeletonLine(width: 140, height: 14),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildSettingsMenuSkeleton() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        // Tambahkan shadow persis seperti UI aslinya
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: List.generate(4, (index) {
          return Column(
            children: [
              ListTile(
                leading: skeletonCircle(24),
                title: skeletonLine(width: 140, height: 14),
                subtitle: Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: skeletonLine(width: 200, height: 12),
                ),
                trailing: skeletonLine(width: 16, height: 16),
              ),
              if (index != 3) Divider(height: 0, color: Colors.grey.shade200),
            ],
          );
        }),
      ),
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
          color: Colors
              .white, // Harus putih solid agar Shimmer terbentuk di area ini
          borderRadius: BorderRadius.circular(6),
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
