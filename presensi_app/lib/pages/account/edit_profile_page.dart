import 'dart:io';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/auth_service.dart';
import 'package:image_picker/image_picker.dart';
import 'package:presensi_app/utils/profile_helper.dart';

class EditableProfile {
  final int id;
  final String titlePrefix;
  final String fullName;
  final String titleSuffix;
  final String nip;
  final String position;
  final String profession;
  final String department;
  final String email;
  final String phone;
  final String joinDate;
  final String workShift;
  final String employmentType;
  final String? photoAsset;

  EditableProfile({
    required this.id,
    required this.titlePrefix,
    required this.fullName,
    required this.titleSuffix,
    required this.nip,
    required this.position,
    required this.profession,
    required this.department,
    required this.email,
    required this.phone,
    required this.joinDate,
    required this.workShift,
    required this.employmentType,
    this.photoAsset,
  });

  String get fullNameUser => [titlePrefix].where((s) => s.isNotEmpty).join(' ');

  String formatIndonesianDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('d MMMM yyyy', 'id_ID').format(date);
    } catch (e) {
      return dateString;
    }
  }
}

class EditProfilePage extends StatefulWidget {
  final EditableProfile profile;

  const EditProfilePage({super.key, required this.profile});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final AuthService authService = AuthService();
  late TextEditingController _titlePrefixController;
  late TextEditingController _fullNameController;
  late TextEditingController _titleSuffixController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _departmentController;
  late TextEditingController _positionController;
  late TextEditingController _professionController;
  late TextEditingController _joinDateController;
  late TextEditingController _passwordController;

  bool _isEditing = false;
  final _formKey = GlobalKey<FormState>();

  File? _imageFile;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _titlePrefixController =
        TextEditingController(text: widget.profile.titlePrefix);
    _fullNameController = TextEditingController(text: widget.profile.fullName);
    _titleSuffixController =
        TextEditingController(text: widget.profile.titleSuffix);

    _emailController = TextEditingController(text: widget.profile.email);
    _phoneController = TextEditingController(text: widget.profile.phone);
    _departmentController =
        TextEditingController(text: widget.profile.department);
    _positionController = TextEditingController(text: widget.profile.position);
    _professionController =
        TextEditingController(text: widget.profile.profession);
    _joinDateController = TextEditingController(text: widget.profile.joinDate);
    _passwordController = TextEditingController();
  }

  @override
  void dispose() {
    // _fullNameController.dispose();
    _titlePrefixController.dispose();
    _fullNameController.dispose();
    _titleSuffixController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _departmentController.dispose();
    _positionController.dispose();
    _professionController.dispose();
    _joinDateController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _toggleEditMode() {
    if (_isEditing) {
      if (_formKey.currentState?.validate() ?? false) {
        _saveChanges();
      }
    } else {
      setState(() => _isEditing = true);
    }
  }

  void _cancelEdit() {
    setState(() {
      _isEditing = false;
      // Reset controller ke nilai awal dari profile
      _fullNameController.text = widget.profile.fullName;
      _emailController.text = widget.profile.email;
      _phoneController.text = widget.profile.phone;
      _imageFile = null; // Reset foto jika ada perubahan yang belum disimpan
    });
  }

  Future<void> _pickImage() async {
    if (!_isEditing) return;

    final XFile? selectedImage =
        await _picker.pickImage(source: ImageSource.gallery);
    if (selectedImage != null) {
      setState(() {
        _imageFile = File(selectedImage.path);
      });
    }
  }

  Future<void> _saveChanges() async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    final success = await authService.updateUser(
      userId: widget.profile.id, // ✔ pakai id numerik dari backend
      titlePrefix: _titlePrefixController.text.trim(),
      fullName: _fullNameController.text.trim(),
      titleSuffix: _titleSuffixController.text.trim(),
      email: _emailController.text,
      phone: _phoneController.text,
      // newPassword:
      //     _passwordController.text.isNotEmpty ? _passwordController.text : null,
    );

    Navigator.pop(context);

    if (success['success']) {
      setState(() => _isEditing = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Profil berhasil diperbarui!'),
        behavior: SnackBarBehavior.floating,
      ));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Gagal memperbarui profil!'),
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text('Edit Profil'),
        backgroundColor: const Color(0xFF6F34FA),
      ),
      body: Stack(
        children: [
          Container(
            height: 100,
            decoration: const BoxDecoration(
              color: Color(0xFF6F34FA),
            ),
          ),
          SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  _buildCardWrapper(
                    child: Column(
                      children: [
                        _buildPhotoSection(),
                        const SizedBox(height: 15),
                        const Text(
                          "Tap untuk mengubah foto profil",
                          style: TextStyle(color: Colors.grey, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  _buildCardWrapper(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              "Informasi Pribadi",
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1A237E),
                              ),
                            ),
                            // if (_isEditing) ...[
                            //   InkWell(
                            //     onTap: _cancelEdit,
                            //     child: const Padding(
                            //       padding: EdgeInsets.symmetric(
                            //           horizontal: 8, vertical: 4),
                            //       child: Text(
                            //         'Batal',
                            //         style: TextStyle(
                            //           color: Colors.grey,
                            //           fontWeight: FontWeight.w600,
                            //           fontSize: 14,
                            //         ),
                            //       ),
                            //     ),
                            //   ),
                            // ],
                            // InkWell(
                            //   onTap: _toggleEditMode,
                            //   borderRadius: BorderRadius.circular(8),
                            //   child: Container(
                            //     padding: const EdgeInsets.symmetric(
                            //         horizontal: 12, vertical: 6),
                            //     decoration: BoxDecoration(
                            //       color: _isEditing
                            //           ? Colors.green.withOpacity(0.1)
                            //           : Colors.blue.withOpacity(0.1),
                            //       borderRadius: BorderRadius.circular(8),
                            //     ),
                            //     child: Row(
                            //       children: [
                            //         Text(
                            //           _isEditing ? 'Simpan' : 'Edit',
                            //           style: TextStyle(
                            //             color: _isEditing
                            //                 ? Colors.green
                            //                 : Colors.blue,
                            //             fontWeight: FontWeight.bold,
                            //             fontSize: 14,
                            //           ),
                            //         ),
                            //       ],
                            //     ),
                            //   ),
                            // ),
                            if (_isEditing) ...[
                              Row(
                                children: [
                                  InkWell(
                                    onTap: _cancelEdit,
                                    child: const Padding(
                                      padding: EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 4),
                                      child: Text(
                                        'Batal',
                                        style: TextStyle(
                                          color: Colors.grey,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  InkWell(
                                    onTap: _toggleEditMode,
                                    borderRadius: BorderRadius.circular(8),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: Colors.green.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Text(
                                        'Simpan',
                                        style: TextStyle(
                                          color: Colors.green,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ] else ...[
                              InkWell(
                                onTap: _toggleEditMode,
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text(
                                    'Edit',
                                    style: TextStyle(
                                      color: Colors.blue,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 20),
                        _buildField('Nama Lengkap', _fullNameController,
                            enabled: _isEditing),
                        const SizedBox(height: 15),
                        _buildField('Email', _emailController,
                            enabled: _isEditing),
                        const SizedBox(height: 15),
                        _buildField('Nomor Telepon', _phoneController,
                            enabled: _isEditing, isNumeric: true),
                        const SizedBox(height: 15),
                        _buildField('Departemen', _departmentController,
                            enabled: false),
                        const SizedBox(height: 15),
                        _buildField('Jabatan', _positionController,
                            enabled: false),
                        const SizedBox(height: 15),
                        _buildField('Profesi', _professionController,
                            enabled: false),
                        const SizedBox(height: 15),
                        _buildField(
                          "Bergabung Sejak",
                          TextEditingController(
                            text: widget.profile
                                .formatIndonesianDate(widget.profile.joinDate),
                          ),
                          enabled: false,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhotoSection() {
    ImageProvider profileImage;

    if (_imageFile != null) {
      profileImage = FileImage(_imageFile!);
      // } else if (widget.profile.photoAsset != null &&
      //     widget.profile.photoAsset!.trim().isNotEmpty) {
      //   String url = widget.profile.photoAsset!;
      //   url = url.replaceAll('localhost', '10.0.2.2');
      //   final encodedUrl = Uri.encodeFull(url);
      //   profileImage = NetworkImage(encodedUrl);
    } else if (widget.profile.photoAsset != null &&
        widget.profile.photoAsset!.trim().isNotEmpty) {
      final fixedUrl = ProfileHelper.fixImageUrl(widget.profile.photoAsset);
      profileImage = NetworkImage(fixedUrl);
    } else {
      profileImage = const AssetImage('assets/default_profile.png');
    }

    return Center(
      child: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.grey, width: 2),
            ),
            child: CircleAvatar(
              radius: 50,
              backgroundColor: Colors.grey,
              backgroundImage: profileImage,
              onBackgroundImageError: (exception, stackTrace) {
                print("Gagal memuat gambar: $exception");
              },
            ),
          ),
          if (_isEditing)
            Positioned(
              bottom: 0,
              right: 0,
              child: GestureDetector(
                onTap: _pickImage,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Color(0xFF6F34FA),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: const Icon(Icons.camera_alt,
                      color: Colors.white, size: 18),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCardWrapper({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _buildField(String label, TextEditingController controller,
      {bool enabled = false, bool isNumeric = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade600)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          enabled: enabled,
          keyboardType: isNumeric ? TextInputType.phone : TextInputType.text,
          style: const TextStyle(fontSize: 15, color: Colors.black87),
          decoration: InputDecoration(
            filled: true,
            fillColor: enabled ? Colors.white : Colors.grey.shade50,
            contentPadding:
                const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide:
                  const BorderSide(color: Color(0xFF6F34FA), width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
