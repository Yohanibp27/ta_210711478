// PERTUKARAN JADWAL SHIFT TENAGA MEDIS
import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./UserModel.js";
import ShiftAssignment from "./ShiftAssignmentModel.js";

const { DataTypes } = Sequelize;

const ShiftExchange = db.define(
  "shiftExchanges",
  {
    requesterId: {
      // tenaga medis yang meminta tukar
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: "id" },
    },
    partnerId: {
      // tenaga medis yang ditukar
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: "id" },
    },
    requesterShiftId: {
      // shift asli si requester
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: ShiftAssignment, key: "id" },
    },
    partnerShiftId: {
      // shift asli si partner
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: ShiftAssignment, key: "id" },
    },
    reason: {
      // alasan pengaju melakukan pertukaran shift
      type: DataTypes.STRING,
      allowNull: true,
    },
    // approvedBy: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true, // misal supervisor atau admin
    //   references: { model: User, key: "id" },
    // },
    // decisionNote: {
    //   // alasan disetujui/ditolak, wajib ada alasan ditolak
    //   type: DataTypes.STRING,
    //   allowNull: true, // boleh kosong jika pengajuan disetujui
    //   comment: "Catatan persetujuan atau penolakan dari admin/supervisor",
    // },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    managerId: {
      // identitas dari manager
      type: DataTypes.INTEGER,
      references: { model: User, key: "id" },
    },
    sdmId: {
      // identitas dari sdm
      type: DataTypes.INTEGER,
      references: { model: User, key: "id" },
    },
    partnerStatus: {
      // status konfirmasi pertukaran shift dari partner
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    partnerDecisionNote: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Alasan persetujuan/penolakan dari partner",
    },
    managerStatus: {
      // status konfirmasi dari manager
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    managerDecisionNote: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Alasan persetujuan/penolakan dari manager (kepala ruangan)",
    },
    sdmStatus: {
      // status konfirmasi dari sdm
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    sdmDecisionNote: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Alasan persetujuan/penolakan dari SDM",
    },
    partnerDecisionAt: { type: DataTypes.DATE },
    managerDecisionAt: { type: DataTypes.DATE },
    sdmDecisionAt: { type: DataTypes.DATE },
    status: {
      // status akhir pengajuan
      type: DataTypes.ENUM(
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "expired",
      ),
      defaultValue: "pending",
    },
  },
  { freezeTableName: true },
);

User.hasMany(ShiftExchange, {
  foreignKey: "requesterId",
  as: "requestedExchanges",
});
User.hasMany(ShiftExchange, {
  foreignKey: "partnerId",
  as: "receivedExchanges",
});
ShiftExchange.belongsTo(User, { foreignKey: "requesterId", as: "requester" });
ShiftExchange.belongsTo(User, { foreignKey: "partnerId", as: "partner" });

ShiftExchange.belongsTo(ShiftAssignment, {
  foreignKey: "requesterShiftId",
  as: "requesterShift",
});
// belum dipake 9 juni 26
ShiftAssignment.hasMany(ShiftExchange, {
  foreignKey: "requesterShiftId",
  as: "requesterExchanges",
});

ShiftExchange.belongsTo(ShiftAssignment, {
  foreignKey: "partnerShiftId",
  as: "partnerShift",
});
// belum dipake 9 juni 26
ShiftAssignment.hasMany(ShiftExchange, {
  foreignKey: "partnerShiftId",
  as: "partnerExchanges",
});

ShiftExchange.belongsTo(User, { foreignKey: "managerId", as: "manager" });
ShiftExchange.belongsTo(User, { foreignKey: "sdmId", as: "sdm" });

User.hasMany(ShiftExchange, {
  foreignKey: "managerId",
  as: "managerApprovals",
});
User.hasMany(ShiftExchange, { foreignKey: "sdmId", as: "sdmApprovals" });

export default ShiftExchange;
