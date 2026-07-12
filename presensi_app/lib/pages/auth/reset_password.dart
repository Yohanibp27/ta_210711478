// belum dicoba karna reset password masih lewat desktop/react
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class ResetPasswordPage extends StatefulWidget {
  final String token; // token dari link
  const ResetPasswordPage({super.key, required this.token});

  @override
  State<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends State<ResetPasswordPage> {
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmController = TextEditingController();
  bool _loading = false;

  final String baseUrl = "http://192.168.1.11:3000";

  Future<void> _handleResetPassword() async {
    final password = passwordController.text.trim();
    final confirm = confirmController.text.trim();

    if (password.isEmpty || confirm.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Password tidak boleh kosong!"),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (password != confirm) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Password tidak cocok!"),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _loading = true);

    try {
      final response = await http.post(
        Uri.parse("$baseUrl/reset-password/${widget.token}"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"password": password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data['message'] ?? "Password berhasil direset"),
            behavior: SnackBarBehavior.floating,
          ),
        );
        Future.delayed(const Duration(seconds: 2), () {
          Navigator.pop(context); // kembali ke login
        });
      } else {
        final data = jsonDecode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data['message'] ?? "Gagal reset password"),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Terjadi kesalahan: $e"),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1E3A8A),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Container(
            width: 400,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  // color: Colors.black.withOpacity(0.1),
                  color: Colors.black.withOpacity(
                      0.15), // Disesuaikan agar shadow card lebih smooth
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // const Icon(Icons.lock, size: 40, color: Color(0xFF1E3A8A)),
                // const SizedBox(height: 16),
                // --- BAGIAN ICON YANG DIPERBAIKI ---
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(
                        0xFFF0F4FF), // Latar belakang biru sangat muda
                    shape: BoxShape.circle,
                    border: Border.all(
                      color:
                          const Color(0xFFE0E7FF), // Border senada dengan tema
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF1E3A8A)
                            .withOpacity(0.08), // Shadow kebiruan
                        blurRadius: 15,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons
                        .lock_reset, // Diganti jadi lock_reset biar lebih relate dengan fungsi halamannya
                    size:
                        45, // Ukuran disesuaikan agar proporsional dalam lingkaran
                    color: Color(0xFF1E3A8A),
                  ),
                ),
                const SizedBox(height: 20),
                // --- END BAGIAN ICON ---
                const Text(
                  'Reset Password',
                  style: TextStyle(
                    fontSize: 24,
                    // fontWeight: FontWeight.bold,
                    fontWeight: FontWeight.w900, // Dibuat lebih tegas
                    color: Color(0xFF1E3A8A),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Masukkan password baru Anda',
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Password Baru',
                    prefixIcon: const Icon(Icons.lock_outline),
                    filled: true,
                    // fillColor: const Color(0xFFF3F4F6),
                    fillColor: const Color(0xFFF8F9FA), // Soft background input
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: confirmController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Konfirmasi Password',
                    prefixIcon: const Icon(Icons.lock),
                    filled: true,
                    fillColor: const Color(0xFFF3F4F6),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _loading ? null : _handleResetPassword,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1E88E5),
                      foregroundColor: Colors.white,
                      elevation: 4, // Efek shadow pada button
                      shadowColor: const Color(0xFF1E88E5).withOpacity(0.4),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    icon: const Icon(Icons.check_circle_outline),
                    label:
                        Text(_loading ? "Mengirim..." : "Atur Ulang Password"),
                  ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'Kembali ke Login',
                    style: TextStyle(color: Color(0xFF1E88E5)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
