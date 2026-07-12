// LANJUT TA
import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./UserModel.js";
import Leavetype from "./LeaveTypeModel.js";
import LeaveSubtype from "./LeaveSubtypeModel.js";

const { DataTypes } = Sequelize;

// user mengajukan cuti/izin/dinas luar, kemudian manager akan menerima notifikasi pengajuan dari user, jika manager tidak menyetujui pengajuan tersebut maka pada verifikasi sdm akan sama tidak menyutujui. jika manager tidak ada respon baik menyetujui/tidak menyetujui maka yang memiliki hak untuk persetujuan pengajuan ada di sdm langsung dan langsung diverifikasi

// tabel pengajuan yang diajukan user
const LeaveRequest = db.define(
  "leaverequests",
  {
    userId: {
      // pengaju
      type: DataTypes.INTEGER,
      allowNull: false,
      //   references: {
      //     model: "users",
      //     key: "id",
      //   },
    },
    leaveTypeId: {
      // jenis pengajuan
      type: DataTypes.INTEGER,
      allowNull: false,
      //   references: {
      //     model: "leavetypes",
      //     key: "id",
      //   },
    },
    leaveSubTypeId: {
      // sub jenis pengajuan
      type: DataTypes.INTEGER,
      allowNull: false,
      //   references: {
      //     model: "leavesubtypes",
      //     key: "id",
      //   },
    },
    startDate: {
      // tanggal mulai
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      // tanggal akhir
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    note: {
      // keterangan
      type: DataTypes.TEXT,
      allowNull: true,
    },
    evidenceFile: {
      // lampiran dokumen/file/foto
      type: DataTypes.STRING,
      allowNull: true,
    },
    managerId: {
      // identitas dari manager
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    managerStatus: {
      // status konfirmasi dari manager
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    managerDecisionNote: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    managerDecisionAt: { type: DataTypes.DATE, allowNull: true },
    sdmId: {
      // identitas dari sdm
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sdmStatus: {
      // status konfirmasi dari sdm
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    sdmDecisionNote: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sdmDecisionAt: { type: DataTypes.DATE, allowNull: true },
    status: {
      // status pengajuan
      type: DataTypes.ENUM(
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "expired",
      ),
      defaultValue: "pending",
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
  },
);

User.hasMany(LeaveRequest, { foreignKey: "userId" }); // satu user bisa punya banyak pengajuan
LeaveRequest.belongsTo(User, { foreignKey: "userId", as: "user" }); // satu pengajuan hanya milik satu user
LeaveRequest.belongsTo(User, {
  foreignKey: "managerId",
  as: "manager",
}); // satu pengajuan hanya di konfirmasi satu manager
LeaveRequest.belongsTo(User, {
  foreignKey: "sdmId",
  as: "sdm",
}); // satu pengajuan hanya di konfirmasi satu sdm

Leavetype.hasMany(LeaveRequest, { foreignKey: "leaveTypeId" }); // satu jenis pengajuan bisa punya banyak pengajuan
LeaveRequest.belongsTo(Leavetype, {
  foreignKey: "leaveTypeId",
  as: "leavetype",
}); // satu pengajuan hanya milik satu jenis pengajuan

LeaveSubtype.hasMany(LeaveRequest, { foreignKey: "leaveSubTypeId" }); // satu sub jenis pengajuan bisa punya banyak pengajuan
LeaveRequest.belongsTo(LeaveSubtype, {
  foreignKey: "leaveSubTypeId",
  as: "leavesubtype",
}); // satu pengajuan hanya milik satu sub jenis pengajuan

export default LeaveRequest;
