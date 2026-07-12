// Helper untuk parsing waktu "HH:mm" ke DateTime hari ini
DateTime parseTimeOnDate(DateTime date, String timeStr) {
  final parts = timeStr.split(':');
  return DateTime(date.year, date.month, date.day, int.parse(parts[0]),
      int.parse(parts[1]));
}
