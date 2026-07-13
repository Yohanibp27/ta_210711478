// lanjut ta
import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import LeaveType from "./LeaveTypeModel.js";

const { DataTypes } = Sequelize;

// sub dari jenis pengajuan
// semua daftar: izin, cuti, dinas luar
const LeaveSubType = db.define(
  "leavesubtypes",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    leaveTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "leavetypes",
        key: "id",
      },
    },
    // Perlu bukti atau tidak (perlu buat yang izin sakit)
    requireEvidence: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    maxDays: {
      // maksimal hari izin per pengajuan
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // onlyOneDay: {
    //   // khusus sakit tanpa surat izin hanya boleh 1 hari
    //   type: DataTypes.BOOLEAN,
    //   defaultValue: false,
    // },
    // Boleh izin di hari yang sama atau tidak
    allowSameDay: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Batas jam pengajuan hari yang sama, batas izin sakit/pribadi jam 10 pagi
    // Batas waktu maksimal pengajuan izin di hari yang sama
    // Disimpan dalam format jam 24 (WIB)
    // Contoh: 10 = 10.00 WIB
    cutoffHour: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 10,
    },
    // Apakah pengajuan ini mempengaruhi kehadiran atau tidak
    // misal: izin sakit/personal akan mempengaruhi kehadiran, tapi cuti tidak
    // karena cuti sudah otomatis dianggap tidak hadir
    isAffectAttendance: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    freezeTableName: true,
  },
);

LeaveType.hasMany(LeaveSubType, {
  foreignKey: "leaveTypeId",
  //   onUpdate: "CASCADE",
  //   onDelete: "RESTRICT",
  as: "leavesubtypes",
}); // satu jenis pengajuan bisa punya banyak sub
LeaveSubType.belongsTo(LeaveType, {
  foreignKey: "leaveTypeId",
  as: "leavetype",
}); // satu sub hanya milik satu jenis pengajuan

export default LeaveSubType;

// Atribut requireEvidence, allowSameDay, dan cutoffHour digunakan untuk merepresentasikan kebijakan pengajuan izin yang berbeda pada setiap jenis izin, sehingga aturan sistem dapat dikelola secara dinamis tanpa perubahan kode aplikasi.
