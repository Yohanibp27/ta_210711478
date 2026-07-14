import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const MedicalAction = db.define(
  "medicalActions",
  {
    noRM: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: "action_unique_constraint",
    },
    dateOfAction: {
      type: DataTypes.DATE,
      allowNull: false,
      unique: "action_unique_constraint",
    },
    serviceUnit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    visitType: {
      type: DataTypes.ENUM(
        "Gawat Darurat",
        "Laboratorium",
        "Radiologi",
        "Rawat Inap",
        "Rawat Jalan",
      ),
      allowNull: false,
      defaultValue: "Rawat Inap",
    },
    doctorName: {
      // nama dokter dari data RS (opsional, untuk audit / display)
      type: DataTypes.STRING,
      allowNull: true,
    },
    // stafName: {
    //   // nama tenaga medis dari mekanisme acrichment/melengkapi untuk kelengkapan analisis aktivitas tenaga medis
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },
    actionName: {
      // nama tindakan yang dilakukan
      type: DataTypes.STRING,
      allowNull: false,
      unique: "action_unique_constraint",
    },
    rawFileId: {
      // tracking batch upload (import Excel / SIMRS)
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      // relasi ke user sistem (hasil mapping dokter -> user)
      // relasi ke tabel user (tidak menggunakan userId, karena userId digunakan sebagai FK pelaksana tindakan. tapi pada data SIMRS yang digunakan, informasi pelaksana belum konsisten dan sering tidak tersedia, sehingga diperlukan mekanisme enrichment/melengkapi untuk menjaga kelengkapan analisis aktivitas tenaga medis)
      type: DataTypes.INTEGER,
      allowNull: true, // bisa null jika belum berhasil mapping
      references: {
        model: Users,
        key: "id",
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // dataSource: {
    //   // membedakan data asli simrs dan enrichment
    //   type: DataTypes.ENUM("SIMRS", "ENRICHMENT", "MAPPING"),
    //   allowNull: false,
    //   defaultValue: "SIMRS",
    // },
  },
  {
    freezeTableName: true,
    tableName: "medicalactions",
    indexes: [
      {
        unique: true,
        fields: ["noRM", "dateOfAction", "actionName"], // Index Unik di level Database
      },
      {
        fields: ["dateOfAction"],
      },
      {
        fields: ["serviceUnit"],
      },
      {
        fields: ["userId"],
      },
      {
        fields: ["rawFileId"],
      },
    ],
  },
);

Users.hasMany(MedicalAction, {
  foreignKey: "userId",
  onDelete: "SET NULL", // jika data user dihapus, data tindakan tidak hilang
});

MedicalAction.belongsTo(Users, {
  foreignKey: "userId",
});

export default MedicalAction;
