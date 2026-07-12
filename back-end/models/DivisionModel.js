import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Department from "./DepartmentModel.js";
const { DataTypes } = Sequelize;

const Division = db.define(
  "divisions",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "departments",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
  },
  {
    freezeTableName: true,
  }
);

Department.hasMany(Division, { foreignKey: "departmentId" });
Division.belongsTo(Department, { foreignKey: "departmentId" });

export default Division;
