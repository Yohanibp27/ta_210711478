import 'package:flutter/material.dart';
import 'activity_page.dart';

class ActivityDetailPage extends StatelessWidget {
  final ActivityItem notification;

  const ActivityDetailPage({required this.notification, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Detail #{Pengajuan/Presensi}'),
        backgroundColor: const Color(0xFF6F34FA),
        elevation: 1,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: CircleAvatar(
                radius: 35,
                backgroundColor: notification.iconBackgroundColor,
                child: Icon(
                  notification.icon,
                  color: notification.iconColor,
                  size: 35,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              notification.title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
            const SizedBox(height: 12),
            // Text(
            //   notification.description,
            //   style: const TextStyle(
            //     fontSize: 14,
            //     color: Colors.black87,
            //     height: 1.5,
            //   ),
            // ),
            // const SizedBox(height: 20),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                const SizedBox(width: 6),
                Text(
                  notification.date,
                  style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
                ),
                const SizedBox(width: 16),
                const Icon(Icons.access_time, size: 16, color: Colors.grey),
                const SizedBox(width: 6),
                Text(
                  notification.time,
                  style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
                ),
              ],
            ),
            const Spacer(),
            Center(
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                },
                icon: const Icon(Icons.arrow_back),
                label: const Text('Kembali'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6F34FA),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
