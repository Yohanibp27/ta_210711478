import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const WorkShift = db.define(
  "workShifts",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // untuk validasi presensi otomatis. sistem bisa tahu apakah timeIn sesuai jadwal atau terlambat. Contoh: shift pagi 07.00–15.00, kalau karyawan masuk jam 07.30 → status otomatis "Terlambat 30 menit"
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    tolerance: {
      type: DataTypes.INTEGER, // batas toleransi keterlambatan
      allowNull: true,
      defaultValue: 15,
    },
  },
  {
    freezeTableName: true,
    tableName: "workshifts",
  },
);

Users.belongsTo(WorkShift, {
  foreignKey: "workShiftId",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

WorkShift.hasMany(Users, {
  foreignKey: "workShiftId",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

export default WorkShift;
