// JADWAL SHIFT TENAGA MEDIS
import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";
import WorkShift from "./WorkShiftModel.js";

const { DataTypes } = Sequelize;

const ShiftAssignment = db.define(
  "shiftAssignments",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Users,
        key: "id",
      },
    },
    workShiftId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: WorkShift,
        key: "id",
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "date", "workShiftId"], // satu shift assignment per hari, 1 user shift bisa punya lebih dari 1 shift dalam 1 hari karena bisa jadi ada pertukaran shift dengan temannya
      },
    ],
  }
);

Users.hasMany(ShiftAssignment, { foreignKey: "userId" });
ShiftAssignment.belongsTo(Users, { foreignKey: "userId" });

WorkShift.hasMany(ShiftAssignment, { foreignKey: "workShiftId" });
ShiftAssignment.belongsTo(WorkShift, {
  foreignKey: "workShiftId",
  as: "shiftDetail",
});

export default ShiftAssignment;
