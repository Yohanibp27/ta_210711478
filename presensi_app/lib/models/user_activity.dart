// class UserActivity {
//   final int id;
//   final String title;
//   final String description;
//   final String createdAt;

//   UserActivity({
//     required this.id,
//     required this.title,
//     required this.description,
//     required this.createdAt,
//   });

//   factory UserActivity.fromJson(Map<String, dynamic> json) {
//     return UserActivity(
//       id: json['id'],
//       title: json['title'],
//       description: json['description'],
//       createdAt: json['createdAt'], // atau json['created_at']
//     );
//   }
// }

// class UserActivity {
//   final int id;
//   final String type;
//   final int userId;
//   final String description;
//   final String createdAt;

//   UserActivity({
//     required this.id,
//     required this.type,
//     required this.userId,
//     required this.description,
//     required this.createdAt,
//   });

//   factory UserActivity.fromJson(Map<String, dynamic> json) {
//     return UserActivity(
//       id: json['id'],
//       userId: json['userId'],
//       type: json['type'],
//       description: json['description'],
//       createdAt: json['createdAt'],
//     );
//   }
// }

// 5 FEBRUARI 2026

// class UserActivity {
//   final int id;
//   final int userId;
//   final String category; // attendance, leave, shift_exchange
//   final String action;
//   final String description;
//   final bool isRead;
//   final String createdAt;

//   UserActivity({
//     required this.id,
//     required this.userId,
//     required this.category,
//     required this.action,
//     required this.description,
//     required this.isRead,
//     required this.createdAt,
//   });

//   factory UserActivity.fromJson(Map<String, dynamic> json) {
//     return UserActivity(
//       id: json['id'] ?? 0,
//       userId: json['userId'] ?? 0,
//       category: json['category'] ?? '',
//       action: json['action'] ?? '',
//       description: json['description'],
//       isRead: json['isRead'] ?? false,
//       createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
//     );
//   }
// }

// 15 April 2026

class UserActivity {
  final int id;
  final String category;
  final String action;
  final String description;
  final String createdAt;
  final bool isRead;
  final int referenceId;
  final Map<String, dynamic>? detail;
  final Map<String, dynamic>? user;

  UserActivity(
      {required this.id,
      required this.category,
      required this.action,
      required this.description,
      required this.createdAt,
      required this.isRead,
      required this.referenceId,
      this.detail,
      this.user});

  factory UserActivity.fromJson(Map<String, dynamic> json) {
    return UserActivity(
      // id: json['id'],
      // category: json['category'],
      // action: json['action'],
      // description: json['description'],
      // createdAt: json['createdAt'],
      // isRead: json['isRead'],
      // detail: json['detail'],
      id: json['id'] ?? 0,
      category: json['category'] ?? '',
      action: json['action'] ?? '',
      description: json['description'] ?? '',
      createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
      isRead: json['isRead'] ?? false,
      referenceId: json['referenceId'] ?? 0,
      detail: json['detail'],
      user: json['user'],
    );
  }
}
