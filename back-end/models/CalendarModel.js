import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const CalendarDay = db.define(
  "calendarDays",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      // Hapus unique: true jika mengizinkan tanggal yang sama
      // untuk divisi yang berbeda di masa depan. Jika mutlak 1 hari 1 libur, biarkan
      unique: true,
      validate: {
        notEmpty: true,
        isDate: true, // Validasi Sequelize: Harus format tanggal
      },
    },
    isHoliday: {
      // status libur (jika true berarti libur)
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    holidayType: {
      // jenis libur
      type: DataTypes.ENUM("Nasional", "Cuti Bersama", "RS"),
      allowNull: true, // Boleh null jika hari kerja biasa
    },
    appliesTo: {
      // target pemberlakuan
      type: DataTypes.ENUM("Semua", "Non-Medis"),
      allowNull: true, // Boleh null jika hari kerja biasa
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true, // catatan tambahan
    },
    repeatYearly: {
      // ulangi setiap tahun
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    tableName: "calendardays",
  },
);

export default CalendarDay;
