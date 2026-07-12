import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./UserModel.js";

const { DataTypes } = Sequelize;

const Profession = db.define(
  "professions",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
  }
);

Profession.hasMany(User, {
  foreignKey: "professionId",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});
User.belongsTo(Profession, {
  foreignKey: "professionId",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

export default Profession;
