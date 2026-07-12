
  // factory LeaveDetail.fromJson(Map<String, dynamic> json) {
  //   final user = json['user'] ?? {};
  //   final pos = user['position'] ?? {};
  //   final div = pos['division'] ?? {};
  //   final dept = div['department'] ?? {};

  // return LeaveDetail(
  //   id: json['id'],
  //   leaveType: json['leavetype']?['name'] ?? "-",
  //   leaveSubType: json['leavesubtype']?['name'] ?? "-",
  //   startDate: json['startDate'] ?? "",
  //   endDate: json['endDate'] ?? "",
  //   note: json['note'] ?? "-",
  //   createdAt: json['createdAt'] ?? "",
  //   finalStatus: json['finalStatus'] ?? "pending",
  //   evidenceFileUrl: json['evidenceFileUrl'],
  //   fullName: user['fullName'] ?? "-",
  //   nip: user['nip'] ?? "-",
  //   position: pos['name'] ?? "-",
  //   department: dept['name'] ?? "-",
  //   // managerName: json['approvedByManager']?['fullName'],
  //   // sdmName: json['approvedBySdm']?['fullName'],
  //   isApprovedByManager: json['approvedByManager'] != null,
  //   isApprovedBySdm: json['approvedBySdm'] != null,
  //   managerName: json['approvedByManager'] != null
  //       ? json['approvedByManager']['fullName']
  //       : null,
  //   sdmName: json['approvedBySdm'] != null
  //       ? json['approvedBySdm']['fullName']
  //       : null,
  // );
  // }