import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const User = db.define(
  "users",
  {
    titlePrefix: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    titleSuffix: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nip: {
      type: DataTypes.STRING,
      unique: true, //  unik per user
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    professionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "professions",
        key: "id",
      },
    },
    positionId: {
      // User → Position → Division → Department (NESTEED)
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "positions",
        key: "id",
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true, // sebelumnya false: tidak boleh kosong
      unique: true, // email sebaiknya unik
      validate: {
        // notEmpty: false, // sebelumnya true: tidak boleh kosong
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        isNumeric: true,
        len: [10, 15],
      },
    },
    joinDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    workShiftId: {
      type: DataTypes.INTEGER,
      allowNull: true, // karna setiap user non-shift punya jam kerja, tapi user shift ga bergantung ke work shift
      //   defaultValue: 1, // id shift pagi default untuk karyawan non-shift
      references: {
        model: "workShifts",
        key: "id",
      },
    },
    employmentType: {
      type: DataTypes.ENUM("Non-Medis", "Medis"),
      allowNull: false,
      defaultValue: "Non-Medis", // default: PNS/Polri
    },
    status: {
      type: DataTypes.ENUM("Aktif", "Nonaktif"), // jangan ada cuti, karena cuti masuknya ke logika presensi
      allowNull: false,
      defaultValue: "Aktif",
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "roles",
        key: "id",
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        // len: [8, 15], // antara 8 - 15 karakter
      },
    },
    leaveStatus: {
      // status cuti user jika sedang cuti dari pengajuan cuti yang disetujui
      type: DataTypes.ENUM("none", "on_leave"),
      defaultValue: "none",
    },
    profilePhoto: {
      // simpah foto profile user
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true, // JWT refresh token bisa kosong awalnya
    },
  },
  {
    freezeTableName: true,
  },
);

export default User;
