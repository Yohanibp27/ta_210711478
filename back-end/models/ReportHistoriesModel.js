import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./UserModel.js";

const { DataTypes } = Sequelize;

const ReportHistory = db.define(
  "reportHistory",
  {
    userId: {
      // user yang melakukan export
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    reportName: {
      // nama laporan
      type: DataTypes.STRING,
      allowNull: false,
    },
    period: {
      // Janurari 2024
      type: DataTypes.STRING,
      allowNull: false,
    },
    reportType: {
      // PDF atau Excel
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileUrl: {
      // path/url akses laporan
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Selesai", "Proses", "Gagal"),
      defaultValue: "Selesai",
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    tableName: "reporthistory",
  },
);

export default ReportHistory;
