// LANJUT TA
import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

// jenis pengajuan: izin, cuti, dan dinas luar
const Leavetype = db.define(
  "leavetypes",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    active: { // buat on/off jenis izin tanpa hapus data
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    freezeTableName: true,
  }
);

export default Leavetype;
