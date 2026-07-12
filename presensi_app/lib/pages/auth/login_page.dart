import 'package:flutter/material.dart';
import 'forgot_password.dart';
import 'package:presensi_app/services/auth_service.dart';
import 'package:presensi_app/utils/main_navigation_page.dart';
import 'package:presensi_app/services/notification_service.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController nipController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final AuthService authService = AuthService();

  bool _obscurePassword = true;
  bool isLoading = false;

  void _handleLogin() async {
    if (isLoading) return;
    setState(() {
      isLoading = true;
    });

    try {
      final result = await authService.login(
        nipController.text.trim(),
        passwordController.text.trim(),
      );

      await Future.delayed(const Duration(seconds: 2));
      if (result["success"] == true) {
        final status = result["status"];
        if (status == "Nonaktif") {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Akun Anda nonaktif. Hubungi admin!"),
              backgroundColor: Colors.red,
            ),
          );
          return;
        } else if (status == "Cuti") {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Akun Anda sedang cuti. Akses terbatas!"),
              backgroundColor: Colors.orange,
            ),
          );
        }

        // MainNavigation.resetKey();
        // ✅ lanjut ke dashboard kalau berhasil
        Navigator.pushReplacement(
          context,
          // MaterialPageRoute(builder: (context) => const MainNavigation()),
          MaterialPageRoute(
            // builder: (context) => MainNavigation(key: mainNavKey),
            builder: (context) => MainNavigation(key: MainNavigation.navKey),
          ),
        );

        // ✅ TAMBAHAN: Pasang Jadwal Notifikasi di sini
        // Begitu user masuk, HP diperintahkan untuk bunyi tiap 06:55
        // meskipun aplikasi ditutup.
        try {
          final notifService = NotificationService();
          await notifService.init(); // Pastikan init dulu
          await notifService
              .requestPermissions(); // Minta izin notif (Android 13+)
          await notifService.scheduleDailyNotification(); // PASANG JADWAL
        } catch (e) {
          print(
              "Gagal set notifikasi: $e"); // Jangan sampai error notif bikin gagal login
        }

        // ✅ lanjut ke dashboard kalau berhasil
        if (mounted) {
          // MainNavigation.resetKey();
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              // builder: (context) => MainNavigation(key: mainNavKey),
              builder: (context) => MainNavigation(key: MainNavigation.navKey),
            ),
          );
        }
      } else {
        // tangani semua pesan error dari backend
        // ScaffoldMessenger.of(context).showSnackBar(
        //   SnackBar(
        //     content: Text(result["message"]),
        //     backgroundColor: Colors.red,
        //   ),
        // );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result["message"]),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Terjadi kesalahan: $e"),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      // pastikan loading dimatikan setelah proses selesai
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF8E5CFC),
      body: Stack(
        children: [
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF6F34FA), Color(0xFF8E5CFC)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),
          Center(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 400,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // // const Icon(Icons.medication,
                            // //     size: 40, color: Color(0xFF8E5CFC)),
                            // Image.asset(
                            //   'assets/bhayangkara.png',
                            //   width: 60,
                            //   height: 60,
                            //   fit: BoxFit.contain,
                            // ),
                            // const Text(
                            //   'RSBI',
                            //   style: TextStyle(
                            //     fontSize: 24,
                            //     fontWeight: FontWeight.bold,
                            //     color: Colors.black,
                            //   ),
                            // ),
                            // const SizedBox(height: 8),
                            // const Text(
                            //   'Masuk ke Sistem Presensi',
                            //   style: TextStyle(
                            //     fontSize: 16,
                            //     color: Colors.grey,
                            //   ),
                            // ),
                            // const SizedBox(height: 24),

                            // --- BAGIAN ICON YANG DIPERBAIKI ---
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: const Color(0xFFF3F4F6),
                                  width: 2,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.08),
                                    blurRadius: 15,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                              ),
                              child: Image.asset(
                                'assets/bhayangkara.png',
                                width: 60,
                                height: 60,
                                fit: BoxFit.contain,
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'RSBI',
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight:
                                    FontWeight.w900, // Dibuat lebih tebal
                                color: Color(
                                    0xFF2D3142), // Warna teks lebih premium
                                letterSpacing: 1.5, // Spasi antar huruf
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Masuk ke Sistem Presensi',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 32),
                            // --- END BAGIAN ICON ---
                            _buildTextField(
                                title: 'NIP',
                                label: 'Masukkan NIP',
                                // icon: Icons.badge,
                                controller: nipController),
                            const SizedBox(height: 16),
                            _buildTextField(
                              title: 'Password',
                              label: 'Masukkan password',
                              // icon: Icons.lock,
                              controller: passwordController,
                              obscureText: _obscurePassword,
                              onToggleVisibility: () {
                                setState(() {
                                  _obscurePassword = !_obscurePassword;
                                });
                              },
                            ),
                            const SizedBox(height: 8),

                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton(
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                        builder: (context) =>
                                            const ForgotPasswordPage()),
                                  );
                                },
                                child: const Text(
                                  'Lupa Password?',
                                  style: TextStyle(color: Color(0xFF1E88E5)),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            // SizedBox(
                            //   width: double.infinity,
                            //   child: ElevatedButton.icon(
                            //     // onPressed: _handleLogin,
                            //     style: ElevatedButton.styleFrom(
                            //       backgroundColor: const Color(0xFF6F34FA),
                            //       foregroundColor: Colors.white,
                            //       shape: RoundedRectangleBorder(
                            //         borderRadius: BorderRadius.circular(12),
                            //       ),
                            //       padding:
                            //           const EdgeInsets.symmetric(vertical: 16),
                            //     ),
                            //     icon: const Icon(Icons.login),
                            //     label: const Text(
                            //       'Login',
                            //       style: TextStyle(
                            //           fontSize: 16,
                            //           fontWeight: FontWeight.bold),
                            //     ),
                            //   ),
                            // ),

                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: isLoading ? null : _handleLogin,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF6F34FA),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 16),
                                ),
                                child: isLoading
                                    ? const SizedBox(
                                        width: 24,
                                        height: 24,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2.5,
                                        ),
                                      )
                                    : const Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          // Icon(Icons.login),
                                          SizedBox(width: 8),
                                          Text(
                                            'Login',
                                            style: TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                              ),
                            ),
                            // const SizedBox(height: 24),
                            // const Text(
                            //   'Kredensial Demo:',
                            //   style: TextStyle(
                            //     fontWeight: FontWeight.bold,
                            //     color: Color(0xFF4A4A4A),
                            //   ),
                            // ),
                            // const SizedBox(height: 8),
                            // const Text(
                            //   'NIP: 1234567890\nPassword: yohani',
                            //   style: TextStyle(color: Colors.black54),
                            //   textAlign: TextAlign.center,
                            // ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required String title,
    required String label,
    // required IconData icon,
    TextEditingController? controller,
    bool obscureText = false,
    VoidCallback? onToggleVisibility,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.grey,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: obscureText,
          decoration: InputDecoration(
            hintText: label,
            // prefixIcon: Icon(icon, color: Colors.grey),
            suffixIcon: onToggleVisibility != null
                ? IconButton(
                    icon: Icon(
                      obscureText
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: Colors.grey,
                    ),
                    onPressed: onToggleVisibility,
                  )
                : null,
            filled: true,
            fillColor: const Color(0xFFF3F4F6),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              // borderSide: const BorderSide(color: Color(0xFF1E88E5), width: 2),
              borderSide: const BorderSide(color: Color(0xFF6F34FA), width: 2),
            ),
            contentPadding:
                const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
          ),
        ),
      ],
    );
  }
}
