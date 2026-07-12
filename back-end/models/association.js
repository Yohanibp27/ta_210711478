import User from "./UserModel.js";
import Role from "./RoleModel.js";
import WorkShift from "./WorkShiftModel.js";
import Department from "./DepartmentModel.js";
import Division from "./DivisionModel.js";
import Position from "./PositionModel.js";
import ShiftAssignment from "./ShiftAssignmentModel.js";
import Attendance from "./AttendanceModel.js";
import Profession from "./ProfessionModel.js";
import ShiftExchange from "./ShiftExchangeModel.js";
import LeaveType from "./LeaveTypeModel.js";
import LeaveSubType from "./LeaveSubtypeModel.js";
import LeaveRequest from "./LeaveRequestModel.js";
import UserActivity from "./UserActivityModel.js";

// Role ↔ User
Role.hasMany(User, {
  foreignKey: "roleId",
  onUpdate: "CASCADE",
  onDelete: "RESTRICT",
});
User.belongsTo(Role, {
  foreignKey: "roleId",
  onUpdate: "CASCADE",
  onDelete: "RESTRICT",
});

// Work shift ↔ User
WorkShift.hasMany(User, { foreignKey: "workShiftId" });
User.belongsTo(WorkShift, { foreignKey: "workShiftId" });

// Work Shift ↔  Shift Assignment
WorkShift.hasMany(ShiftAssignment, { foreignKey: "workShiftId" });
ShiftAssignment.belongsTo(WorkShift, {
  foreignKey: "workShiftId",
});

// Department ↔ Division
Department.hasMany(Division, { foreignKey: "departmentId" });
Division.belongsTo(Department, { foreignKey: "departmentId" });

// Division ↔ Position
Division.hasMany(Position, { foreignKey: "divisionId" });
Position.belongsTo(Division, { foreignKey: "divisionId" });

// Position ↔ User
Position.hasMany(User, { foreignKey: "positionId" });
User.belongsTo(Position, { foreignKey: "positionId" });
// User → Position → Division → Department (NESTEED)

// Shift Assigment ↔ User
User.hasMany(ShiftAssignment, { foreignKey: "userId" });
ShiftAssignment.belongsTo(User, { foreignKey: "userId" });

// Attendance ↔ User
User.hasMany(Attendance, { foreignKey: "userId", onDelete: "CASCADE" }); // user dihapus, data presensi ikut terhapus
Attendance.belongsTo(User, { foreignKey: "userId" });

// // Attendance ↔ Shift Assignment GA DIPAKE!!!
// ShiftAssignment.hasMany(Attendance, { foreignKey: "shiftAssignmentId" });
// Attendance.belongsTo(ShiftAssignment, { foreignKey: "shiftAssignmentId" });

// Profession ↔ User
Profession.hasMany(User, {
  foreignKey: "professionId",
  onUpdate: "CASCADE",
  onDelete: "RESTRICT",
});
User.belongsTo(Profession, {
  foreignKey: "professionId",
  onUpdate: "CASCADE",
  onDelete: "RESTRICT",
});

// Shift Exchange ↔ User
User.hasMany(ShiftExchange, {
  foreignKey: "requesterId",
});
User.hasMany(ShiftExchange, {
  foreignKey: "partnerId",
});
ShiftExchange.belongsTo(User, { foreignKey: "requesterId" });
ShiftExchange.belongsTo(User, { foreignKey: "partnerId" });

// Shift Exchange ↔ Shift Assigment
ShiftExchange.belongsTo(ShiftAssignment, {
  foreignKey: "requesterShiftId",
});
ShiftExchange.belongsTo(ShiftAssignment, {
  foreignKey: "partnerShiftId",
});

// Leave Type ↔ Leave Sub Type
LeaveType.hasMany(LeaveSubType, {
  foreignKey: "leaveTypeId",
  onUpdate: "CASCADE",
  onDelete: "RESTRICT",
});
LeaveSubType.belongsTo(LeaveType, { foreignKey: "leaveTypeId" });

// Leave Type ↔ Leave Request
LeaveType.hasMany(LeaveRequest, { foreignKey: "leaveTypeId" });
LeaveRequest.belongsTo(LeaveType, { foreignKey: "leaveTypeId" });

// Leave Sub Type ↔ Leave Request
LeaveSubType.hasMany(LeaveRequest, { foreignKey: "leaveSubTypeId" });
LeaveRequest.belongsTo(LeaveSubType, { foreignKey: "leaveSubTypeId" });

// Leave Request ↔ User
User.hasMany(LeaveRequest, { foreignKey: "userId" });
LeaveRequest.belongsTo(User, { foreignKey: "userId" });

// Leave Request ↔ Attendance
LeaveRequest.hasMany(Attendance, { foreignKey: "leaveRequestId" });
Attendance.belongsTo(LeaveRequest, { foreignKey: "leaveRequestId" });

// User Activity ↔ User
User.hasMany(UserActivity, { foreignKey: "userId" });
UserActivity.belongsTo(User, { foreignKey: "userId" });

// Shift Assignment ↔ Attendance
// Relasi tambahan untuk mendukung pencarian jadwal
ShiftAssignment.hasMany(Attendance, { foreignKey: "shiftAssignmentId" });
Attendance.belongsTo(ShiftAssignment, { foreignKey: "shiftAssignmentId" });

// Work shift ↔ Attendance
// Penting: Agar bisa include WorkShift dari Attendances lewat jembatan ShiftAssignment
WorkShift.hasMany(Attendance, { foreignKey: "workShiftId" });
Attendance.belongsTo(WorkShift, { foreignKey: "workShiftId" });

// // Relasi Activity ↔ LeaveRequest
// UserActivity.belongsTo(LeaveRequest, {
//   foreignKey: "referenceId", 
//   as: "detail",
// });

// // Relasi Activity ↔ Attendance
// UserActivity.hasOne(Attendance, {
//   foreignKey: "activityId",
//   as: "attendanceDetail",
// });

// // Relasi Activity ↔ ShiftExchange
// UserActivity.hasOne(ShiftExchange, {
//   foreignKey: "activityId",
//   as: "exchangeDetail",
// });

// X ↔ X

export {
  User,
  Role,
  WorkShift,
  Department,
  Division,
  Position,
  ShiftAssignment,
  Attendance,
  Profession,
  ShiftExchange,
  LeaveType,
  LeaveSubType,
  LeaveRequest,
  UserActivity,
};

// // Division ↔ User (kalau ada divisionId di User)
// Division.hasMany(User, { foreignKey: "divisionId" });
// User.belongsTo(Division, { foreignKey: "divisionId" });

// // Department ↔ User (kalau ada departmentId di User)
// Department.hasMany(User, { foreignKey: "departmentId" });
// User.belongsTo(Department, { foreignKey: "departmentId" });

// Di file asosiasi (misal models/index.js)
