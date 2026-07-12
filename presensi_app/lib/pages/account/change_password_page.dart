// belum dicoba karna reset password masih lewat desktop/react
import 'package:flutter/material.dart';
import '../../services/auth_service.dart';

class ChangePasswordPage extends StatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  State<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends State<ChangePasswordPage> {
  final AuthService authService = AuthService();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _isCurrentPasswordVisible = false;
  bool _isNewPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;

  void _changePassword() async {
    final currentPass = _currentPasswordController.text;
    final newPass = _newPasswordController.text;
    final confirmPass = _confirmPasswordController.text;

    if (currentPass.isEmpty || newPass.isEmpty || confirmPass.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Semua kolom wajib diisi!'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (newPass != confirmPass) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password baru dan konfirmasi tidak cocok!'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(color: Color(0xFF6F34FA)),
      ),
    );

    try {
      final profileData = await authService.getProfile();
      final userId = profileData?['data']?['id'] ?? 0;
      if (userId == 0) {
        throw 'User ID tidak valid';
      }
      final result = await authService.updateUser(
        userId: userId,
        currentPassword: currentPass,
        newPassword: newPass,
      );
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: result['success'] ? Colors.green : Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
      if (result['success']) {
        Navigator.pop(context);
      }
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Terjadi kesalahan: $e'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String labelText,
    required bool isVisible,
    required Function(bool) toggleVisibility,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: !isVisible,
      decoration: InputDecoration(
        labelText: labelText,
        border: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
          borderSide: BorderSide(color: Colors.grey),
        ),
        contentPadding:
            const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        suffixIcon: IconButton(
          icon: Icon(
            isVisible ? Icons.visibility : Icons.visibility_off,
            color: Colors.grey,
          ),
          onPressed: () => toggleVisibility(!isVisible),
        ),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Kolom ini wajib diisi';
        }
        if (labelText == 'Password Baru' && value.length < 8) {
          return 'Password minimal 8 karakter';
        }
        if (labelText == 'Konfirmasi Password Baru' &&
            value != _newPasswordController.text) {
          return 'Konfirmasi password tidak cocok';
        }
        return null;
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        backgroundColor: Colors.grey.shade100,
        appBar: AppBar(
          title: const Text('Ubah Password'),
          backgroundColor: Color(0xFF6F34FA),
        ),
        // body: Stack(
        //   children: [
        //     Container(
        //       height: 120,
        //       decoration: const BoxDecoration(color: Color(0xFF6F34FA)),
        //     ),
        //     SingleChildScrollView(
        //       padding: const EdgeInsets.all(20.0),
        //       child: Form(
        //         key: _formKey,
        //         child: Column(
        //           crossAxisAlignment: CrossAxisAlignment.start,
        //           children: [
        //             _buildSecurityTips(),
        //             const SizedBox(height: 24),
        //             Text(
        //               'Password Saat Ini',
        //               style: TextStyle(
        //                   fontSize: 16,
        //                   fontWeight: FontWeight.w600,
        //                   color: Colors.grey.shade700),
        //             ),
        //             const SizedBox(height: 8),
        //             _buildPasswordField(
        //               controller: _currentPasswordController,
        //               labelText: 'Masukkan password saat ini',
        //               isVisible: _isCurrentPasswordVisible,
        //               toggleVisibility: (bool value) {
        //                 setState(() => _isCurrentPasswordVisible = value);
        //               },
        //             ),
        //             const SizedBox(height: 24),
        //             Text(
        //               'Password Baru',
        //               style: TextStyle(
        //                   fontSize: 16,
        //                   fontWeight: FontWeight.w600,
        //                   color: Colors.grey.shade700),
        //             ),
        //             const SizedBox(height: 8),
        //             _buildPasswordField(
        //               controller: _newPasswordController,
        //               labelText: 'Masukkan password baru',
        //               isVisible: _isNewPasswordVisible,
        //               toggleVisibility: (bool value) {
        //                 setState(() => _isNewPasswordVisible = value);
        //               },
        //             ),
        //             const SizedBox(height: 24),
        //             Text(
        //               'Konfirmasi Password Baru',
        //               style: TextStyle(
        //                   fontSize: 16,
        //                   fontWeight: FontWeight.w600,
        //                   color: Colors.grey.shade700),
        //             ),
        //             const SizedBox(height: 8),
        //             _buildPasswordField(
        //               controller: _confirmPasswordController,
        //               labelText: 'Konfirmasi password baru',
        //               isVisible: _isConfirmPasswordVisible,
        //               toggleVisibility: (bool value) {
        //                 setState(() => _isConfirmPasswordVisible = value);
        //               },
        //             ),
        //             const SizedBox(height: 30),
        //             SizedBox(
        //               width: double.infinity,
        //               child: ElevatedButton(
        //                 onPressed: _changePassword,
        //                 style: ElevatedButton.styleFrom(
        //                   backgroundColor: const Color(0xFF6F34FA),
        //                   padding: const EdgeInsets.symmetric(vertical: 15),
        //                   shape: RoundedRectangleBorder(
        //                     borderRadius: BorderRadius.circular(10),
        //                   ),
        //                 ),
        //                 child: const Text(
        //                   'Ubah Password',
        //                   style: TextStyle(
        //                       fontSize: 16,
        //                       fontWeight: FontWeight.bold,
        //                       color: Colors.white),
        //                 ),
        //               ),
        //             ),
        //           ],
        //         ),
        //       ),
        //     ),
        //   ],
        // )

        body: Stack(
          children: [
            Container(
              height: 120,
              decoration: const BoxDecoration(color: Color(0xFF6F34FA)),
            ),
            SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSecurityTips(),
                    const SizedBox(
                      height: 20,
                    ),
                    Card(
                      elevation: 3,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Password Saat Ini',
                              style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey.shade700),
                            ),
                            const SizedBox(height: 8),
                            _buildPasswordField(
                              controller: _currentPasswordController,
                              labelText: 'Masukkan password saat ini',
                              isVisible: _isCurrentPasswordVisible,
                              toggleVisibility: (bool value) {
                                setState(
                                    () => _isCurrentPasswordVisible = value);
                              },
                            ),
                            const SizedBox(height: 24),
                            Text(
                              'Password Baru',
                              style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey.shade700),
                            ),
                            const SizedBox(height: 8),
                            _buildPasswordField(
                              controller: _newPasswordController,
                              labelText: 'Masukkan password baru',
                              isVisible: _isNewPasswordVisible,
                              toggleVisibility: (bool value) {
                                setState(() => _isNewPasswordVisible = value);
                              },
                            ),
                            const SizedBox(height: 24),
                            Text(
                              'Konfirmasi Password Baru',
                              style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey.shade700),
                            ),
                            const SizedBox(height: 8),
                            _buildPasswordField(
                              controller: _confirmPasswordController,
                              labelText: 'Konfirmasi password baru',
                              isVisible: _isConfirmPasswordVisible,
                              toggleVisibility: (bool value) {
                                setState(
                                    () => _isConfirmPasswordVisible = value);
                              },
                            ),
                            const SizedBox(height: 30),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _changePassword,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF6F34FA),
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 15),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                                child: const Text(
                                  'Ubah Password',
                                  style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  ],
                ),
              ),
            ),
          ],
        ));
  }

  Widget _buildSecurityTips() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE3F2FD),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.security, color: Color(0xFF1E6CFF)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Tips Keamanan',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const SizedBox(height: 8),
                _buildTipItem('Gunakan minimal 8 karakter'),
                _buildTipItem('Kombinasi huruf besar, kecil, dan angka'),
                _buildTipItem('Jangan gunakan informasi pribadi'),
                _buildTipItem('Ubah password secara berkala'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTipItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 4.0),
            child: Icon(Icons.circle, size: 6, color: Colors.blue),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(color: Colors.grey.shade800, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}
