// BELUM DIPAKE
import { DataTypes } from "sequelize";
import db from "../config/Database.js";

const DailyQR = db.define(
  "DailyQR",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("IN", "OUT"),
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER, // id admin yang generate QR
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
  }
);

export default DailyQR;
