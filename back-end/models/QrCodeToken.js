// YANG DIPAKE INI
import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const QrCodeToken = db.define(
  "qrCodeTokens",
  {
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: true, // createdAt dan updatedAt otomatis
    tableName: "qrcodetokens",
  },
);

export default QrCodeToken;
