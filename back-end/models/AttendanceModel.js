import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";
import ShiftAssignment from "./ShiftAssignmentModel.js";
import LeaveRequests from "./LeaveRequestModel.js";

const { DataTypes } = Sequelize;

const Attendances = db.define(
  "attendances",
  {
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    checkInTime: {
      type: DataTypes.DATE,
      allowNull: true, // jika karyawan tidak hadir
    },
    checkOutTime: {
      type: DataTypes.DATE,
      allowNull: true, // belum tentu karyawan pulang tepat waktu
    },
    // koordinat GPS
    checkInLocation: {
      type: DataTypes.STRING,
      allowNull: true, // belum tentu karyawan pulang tepat waktu
    },
    checkOutLocation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // jenis presensi di dalam (Qr + Geofencing) / di luar rumah sakit
    attendanceType: {
      type: DataTypes.ENUM("INSIDE", "OUTSIDE"),
      allowNull: false,
    },
    // // 1 bukti foto wajah untuk presensi dinas luar
    // evidencePhoto: {
    //   type: DataTypes.TEXT("long"),
    //   allowNull: true,
    // },
    // 2 bukti foto wajah untuk presensi dinas luar
    checkInEvidencePhoto: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    checkOutEvidencePhoto: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    attendanceStatus: {
      type: DataTypes.ENUM(
        "Hadir",
        "Terlambat",
        "Cuti",
        "Izin",
        "Dinas Luar", // agar membedakan mana yg ada diluar rs
        "Tidak Hadir", // oleh auto job presensi harian
        "Tidak Valid", // jika presensi tidak lengkap (masuk/pulang)
      ),
      allowNull: false,
      defaultValue: "Hadir",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Users,
        key: "id",
      },
    }, // manual: diinputkan oleh admin ketika terjadi kendala, presensi: aksi dari user sendiri, pengajuan: ketika ada pengajuan dalam melakukan aksi untuk presensi, sistem: ketika user tidak melakukan presensi
    source: {
      type: DataTypes.ENUM("Presensi", "Pengajuan", "System", "Manual"),
      allowNull: false,
    },
    workShiftId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "workShifts",
        key: "id",
      },
    },
    shiftAssignmentId: {
      type: DataTypes.INTEGER,
      allowNull: true, // null jika user non-shift
      references: {
        model: ShiftAssignment,
        key: "id",
      },
    },
    leaveRequestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: LeaveRequests,
        key: "id",
      },
    },
    // // siapa yang input/update data presensi
    // adminId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   references: {
    //     model: Users,
    //     key: "id",
    //   },
    // },
  },
  {
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        // fields: ["userId", "date"], // satu user, satu attendance per hari
        fields: ["userId", "date", "shiftAssignmentId"],
      },
    ],
  },
);

Users.hasMany(Attendances, { foreignKey: "userId", onDelete: "CASCADE" }); // kalo user dihapus maka data presensi ikut terhapus
Attendances.belongsTo(Users, { foreignKey: "userId" });

Attendances.belongsTo(LeaveRequests, { foreignKey: "leaveRequestId" });

// ADMIN yang input/update manual data presensi (audit trail)
// Attendances.belongsTo(Users, {foreignKey: "", as "validator"})
export default Attendances;

// // Relasi ke Karyawan yang memiliki data absen
// Users.hasMany(Attendances, { foreignKey: "userId", onDelete: "CASCADE" });
// Attendances.belongsTo(Users, { foreignKey: "userId", as: "karyawan" }); // Gunakan alias 'karyawan'

// // Relasi ke Admin yang menginput/mengubah data (Audit Trail)
// Attendances.belongsTo(Users, { foreignKey: "adminId", as: "validator" }); // Gunakan alias 'validator'
