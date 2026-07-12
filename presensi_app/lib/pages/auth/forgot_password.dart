import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:presensi_app/services/auth_service.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final AuthService authService = AuthService();
  final TextEditingController emailController = TextEditingController();
  bool _loading = false;

  // final String baseUrl = "http://192.168.1.11:3000";

  Future<void> _handleForgotPassword() async {
    final email = emailController.text.trim();

    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Email tidak boleh kosong!"),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    setState(() => _loading = true);

    try {
      // final response = await http.post(
      //   Uri.parse("$baseUrl/forgot-password"),
      //   headers: {"Content-Type": "application/json"},
      //   body: jsonEncode({"email": email}),
      // );

      // if (response.statusCode == 200) {
      //   final data = jsonDecode(response.body);
      //   ScaffoldMessenger.of(context).showSnackBar(
      //     SnackBar(
      //       content: Text(data['message'] ?? "Link reset telah dikirim"),
      //       backgroundColor: Colors.green,
      //     ),
      //   );
      // } else {
      //   final data = jsonDecode(response.body);
      //   ScaffoldMessenger.of(context).showSnackBar(
      //     SnackBar(
      //       content: Text(data['message'] ?? "Gagal mengirim email"),
      //       backgroundColor: Colors.red,
      //     ),
      //   );
      // }

      await authService.forgotPassword(email);

      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text("Link reset telah dikirim ke email Anda"),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ));
    } catch (e) {
      // ScaffoldMessenger.of(context).showSnackBar(
      //   SnackBar(
      //     content: Text("Terjadi kesalahan: $e"),
      //     backgroundColor: Colors.red,
      //   ),
      // );
      String errorMessage = e.toString().replaceAll('Exception: ', '');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  // Widget build(BuildContext context) {
  //   return Scaffold(
  //     // backgroundColor: const Color(0xFF1E3A8A),
  //     backgroundColor: const Color(0xFF8E5CFC),
  //     body: Stack(children: [
  //       Positioned.fill(
  //         child: Container(
  //           decoration: const BoxDecoration(
  //             gradient: LinearGradient(
  //                 colors: [Color(0XFF6F34FA), Color(0XFF8E5CFC)],
  //                 begin: Alignment.topCenter,
  //                 end: Alignment.bottomCenter),
  //           ),
  //         ),
  //       ),
  //       Center(
  //         child: SingleChildScrollView(
  //           padding: const EdgeInsets.all(24.0),
  //           child: Container(
  //             width: 400,
  //             padding: const EdgeInsets.all(32),
  //             decoration: BoxDecoration(
  //               color: Colors.white,
  //               borderRadius: BorderRadius.circular(24),
  //               boxShadow: [
  //                 BoxShadow(
  //                   // color: Colors.black.withOpacity(0.1),
  //                   color:
  //                       Colors.black.withOpacity(0.15), // Dibuat lebih smooth
  //                   blurRadius: 20,
  //                   offset: const Offset(0, 10),
  //                 ),
  //               ],
  //             ),
  //             child: Column(
  //               mainAxisSize: MainAxisSize.min,
  //               children: [
  //                 // const Icon(Icons.lock_reset, size: 40, color: Colors.black),
  //                 // const SizedBox(height: 16),
  //                 // --- BAGIAN ICON YANG DIPERBAIKI ---
  //                 Container(
  //                   padding: const EdgeInsets.all(16),
  //                   decoration: BoxDecoration(
  //                     color: const Color(0xFFF4EDFF),
  //                     shape: BoxShape.circle,
  //                     border: Border.all(
  //                       color: const Color(0xFFE3D4FF),
  //                       width: 2,
  //                     ),
  //                     boxShadow: [
  //                       BoxShadow(
  //                         color: const Color(0xFF6F34FA).withOpacity(0.1),
  //                         blurRadius: 15,
  //                         offset: const Offset(0, 8),
  //                       ),
  //                     ],
  //                   ),
  //                   child: const Icon(
  //                     Icons.lock_reset,
  //                     size: 45,
  //                     color: Color(0xFF6F34FA),
  //                   ),
  //                 ),
  //                 const SizedBox(height: 20),
  //                 // --- END BAGIAN ICON ---
  //                 const Text(
  //                   'Lupa Password?',
  //                   style: TextStyle(
  //                     fontSize: 24,
  //                     // fontWeight: FontWeight.bold,
  //                     // color: Colors.black,
  //                     fontWeight: FontWeight.w900, // Dibuat lebih tegas
  //                     color: Color(0xFF2D3142),
  //                   ),
  //                 ),
  //                 const SizedBox(height: 8),
  //                 const Text(
  //                   'Masukkan email Anda untuk menerima link reset password',
  //                   textAlign: TextAlign.center,
  //                   // style: TextStyle(color: Colors.grey),
  //                   style: TextStyle(
  //                     color: Colors.grey,
  //                     fontWeight: FontWeight.w500,
  //                     height: 1.4, // Spasi antar baris diperbaiki
  //                   ),
  //                 ),
  //                 // const SizedBox(height: 24),
  //                 const SizedBox(height: 32),
  //                 TextField(
  //                   controller: emailController,
  //                   decoration: InputDecoration(
  //                     labelText: 'Email',
  //                     prefixIcon: const Icon(Icons.email),
  //                     filled: true,
  //                     // fillColor: const Color(0xFFF3F4F6),
  //                     // border: OutlineInputBorder(
  //                     //   borderRadius: BorderRadius.circular(12),
  //                     //   borderSide: BorderSide.none,
  //                     // ),
  //                     fillColor:
  //                         const Color(0xFFF8F9FA), // Warna abu-abu sangat muda
  //                     border: OutlineInputBorder(
  //                       borderRadius: BorderRadius.circular(14),
  //                       borderSide: BorderSide.none,
  //                     ),
  //                     focusedBorder: OutlineInputBorder(
  //                       borderRadius: BorderRadius.circular(14),
  //                       // borderSide: const BorderSide(
  //                       //     color: Color(0xFF6F34FA),
  //                       //     width: 2), // Border ungu saat fokus
  //                       borderSide: const BorderSide(
  //                           color: Color(0xFF1E88E5), width: 2),
  //                     ),
  //                     contentPadding: const EdgeInsets.symmetric(
  //                         vertical: 18, horizontal: 16),
  //                   ),
  //                 ),
  //                 const SizedBox(height: 24),
  //                 SizedBox(
  //                   width: double.infinity,
  //                   child: ElevatedButton.icon(
  //                     onPressed: _loading ? null : _handleForgotPassword,
  //                     style: ElevatedButton.styleFrom(
  //                       // backgroundColor: const Color(0xFF1E88E5),
  //                       backgroundColor: const Color(0xFF6F34FA),
  //                       foregroundColor: Colors.white,
  //                       padding: const EdgeInsets.symmetric(vertical: 16),
  //                       shape: RoundedRectangleBorder(
  //                         borderRadius: BorderRadius.circular(12),
  //                       ),
  //                     ),
  //                     icon: const Icon(Icons.send),
  //                     label:
  //                         Text(_loading ? "Mengirim..." : "Kirim Link Reset"),
  //                   ),
  //                 ),
  //                 const SizedBox(height: 16),
  //                 TextButton(
  //                   onPressed: () => Navigator.pop(context),
  //                   child: const Text(
  //                     'Kembali ke Login',
  //                     style: TextStyle(color: Color(0xFF1E88E5)),
  //                   ),
  //                 ),
  //               ],
  //             ),
  //           ),
  //         ),
  //       ),
  //     ]),
  //   );
  // }
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF8E5CFC),
      body: Stack(children: [
        Positioned.fill(
          child: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                  colors: [Color(0XFF6F34FA), Color(0XFF8E5CFC)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter),
            ),
          ),
        ),
        Center(
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
                    color: Colors.black.withOpacity(0.15),
                    blurRadius: 25,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // --- ICON ---
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF4EDFF),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFFE3D4FF),
                        width: 2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF6F34FA).withOpacity(0.1),
                          blurRadius: 15,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.lock_reset,
                      size: 45,
                      color: Color(0xFF6F34FA),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // --- TEXT HEADER ---
                  const Text(
                    'Lupa Password?',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF2D3142),
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Masukkan email Anda untuk menerima link reset password',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.grey,
                      fontWeight: FontWeight.w500,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 32),

                  // --- INPUT EMAIL SEPERTI HALAMAN LOGIN ---
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Email',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: emailController,
                        style: const TextStyle(fontWeight: FontWeight.w500),
                        decoration: InputDecoration(
                          hintText: 'Masukkan email Anda',
                          // prefixIcon: const Icon(Icons.email_outlined,
                          //     color: Colors.grey),
                          filled: true,
                          fillColor: const Color(0xFFF3F4F6),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                                color: Color(0xFF6F34FA), width: 2),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                              vertical: 16, horizontal: 16),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // --- BUTTON KIRIM ---
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _loading ? null : _handleForgotPassword,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6F34FA),
                        foregroundColor: Colors.white,
                        elevation: 4,
                        shadowColor: const Color(0xFF6F34FA).withOpacity(0.4),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      icon: _loading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2.5))
                          : const Icon(Icons.send_rounded),
                      label: Text(
                        _loading ? "Mengirim..." : "Kirim Link Reset",
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // --- BACK BUTTON ---
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    style: TextButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Kembali ke Login',
                      style: TextStyle(
                        // color: Color(0xFF6F34FA),
                        color: Color(0xFF1E88E5),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ]),
    );
  }
}


//   Widget build(BuildContext context) {
//     return Scaffold(
//       backgroundColor: const Color(0xFF1E3A8A),
//       body: Stack(
//         children: [
//           // Latar belakang gradasi
//           Positioned.fill(
//             child: Container(
//               decoration: const BoxDecoration(
//                 gradient: LinearGradient(
//                   colors: [Color(0xFF1E3A8A), Color(0xFF0C2461)],
//                   begin: Alignment.topCenter,
//                   end: Alignment.bottomCenter,
//                 ),
//               ),
//             ),
//           ),

//           // Konten utama
//           Center(
//             child: SingleChildScrollView(
//               child: Padding(
//                 padding: const EdgeInsets.symmetric(horizontal: 24.0),
//                 child: Column(
//                   mainAxisAlignment: MainAxisAlignment.center,
//                   children: [
//                     Container(
//                       width: 400,
//                       decoration: BoxDecoration(
//                         color: Colors.white,
//                         borderRadius: BorderRadius.circular(24),
//                         boxShadow: [
//                           BoxShadow(
//                             color: Colors.black.withOpacity(0.1),
//                             blurRadius: 20,
//                             offset: const Offset(0, 10),
//                           ),
//                         ],
//                       ),
//                       child: Padding(
//                         padding: const EdgeInsets.all(32.0),
//                         child: Column(
//                           mainAxisSize: MainAxisSize.min,
//                           children: [
//                             // Icon
//                             Container(
//                               padding: const EdgeInsets.all(12),
//                               decoration: BoxDecoration(
//                                 color: const Color(0xFFF3F4F6),
//                                 borderRadius: BorderRadius.circular(16),
//                               ),
//                               child: const Icon(Icons.lock_reset,
//                                   size: 40, color: Color(0xFF1E3A8A)),
//                             ),
//                             const SizedBox(height: 16),

//                             // Judul
//                             const Text(
//                               'Reset Password',
//                               style: TextStyle(
//                                 fontSize: 24,
//                                 fontWeight: FontWeight.bold,
//                                 color: Color(0xFF1E3A8A),
//                               ),
//                             ),
//                             const SizedBox(height: 8),
//                             const Text(
//                               'Masukkan email terdaftar untuk mengatur ulang password Anda',
//                               textAlign: TextAlign.center,
//                               style: TextStyle(
//                                 fontSize: 14,
//                                 color: Colors.grey,
//                               ),
//                             ),
//                             const SizedBox(height: 24),

//                             // Input email
//                             TextField(
//                               decoration: InputDecoration(
//                                 labelText: 'Masukkan Email',
//                                 labelStyle: const TextStyle(color: Colors.grey),
//                                 prefixIcon:
//                                     const Icon(Icons.email, color: Colors.grey),
//                                 filled: true,
//                                 fillColor: const Color(0xFFF3F4F6),
//                                 border: OutlineInputBorder(
//                                   borderRadius: BorderRadius.circular(12),
//                                   borderSide: BorderSide.none,
//                                 ),
//                                 focusedBorder: OutlineInputBorder(
//                                   borderRadius: BorderRadius.circular(12),
//                                   borderSide: const BorderSide(
//                                       color: Color(0xFF1E88E5), width: 2),
//                                 ),
//                                 contentPadding: const EdgeInsets.symmetric(
//                                     vertical: 16, horizontal: 16),
//                               ),
//                             ),
//                             const SizedBox(height: 24),

//                             // Tombol Kirim
//                             SizedBox(
//                               width: double.infinity,
//                               child: ElevatedButton.icon(
//                                 onPressed: () {
//                                   // aksi reset password
//                                 },
//                                 style: ElevatedButton.styleFrom(
//                                   backgroundColor: const Color(0xFF1E88E5),
//                                   foregroundColor: Colors.white,
//                                   shape: RoundedRectangleBorder(
//                                     borderRadius: BorderRadius.circular(12),
//                                   ),
//                                   padding:
//                                       const EdgeInsets.symmetric(vertical: 16),
//                                 ),
//                                 icon: const Icon(Icons.send),
//                                 label: const Text(
//                                   'Kirim Link Reset',
//                                   style: TextStyle(
//                                       fontSize: 16,
//                                       fontWeight: FontWeight.bold),
//                                 ),
//                               ),
//                             ),
//                             const SizedBox(height: 16),

//                             // Kembali ke login
//                             TextButton(
//                               onPressed: () {
//                                 Navigator.pop(context);
//                               },
//                               child: const Text(
//                                 'Kembali ke Login',
//                                 style: TextStyle(color: Color(0xFF1E88E5)),
//                               ),
//                             ),
//                           ],
//                         ),
//                       ),
//                     ),
//                   ],
//                 ),
//               ),
//             ),
//           ),
//         ],
//       ),
//     );
//   }
// }