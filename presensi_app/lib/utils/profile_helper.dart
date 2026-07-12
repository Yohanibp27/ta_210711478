import 'dart:io';

class ProfileHelper {
  static String fixImageUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    if (url.contains('localhost')) {
      if (Platform.isAndroid) {
        // Emulator Android
        bool isEmulator = !Platform.environment.containsKey('ANDROID_STORAGE');

        if (isEmulator) {
          return url.replaceAll('localhost', '10.0.2.2');
        } else {
          return url.replaceAll('localhost', '192.168.1.10'); // HP fisik
        }
      }
    }

    return url;
  }
}
