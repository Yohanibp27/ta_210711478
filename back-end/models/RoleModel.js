import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./UserModel.js";

const { DataTypes } = Sequelize;

const Role = db.define(
  "roles",
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

Role.hasMany(User, {
  foreignKey: "roleId",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});
User.belongsTo(Role, {
  foreignKey: "roleId",
  onDelete: "RESTRICT", // role tidak boleh dihapus kalau masih ada user yang pakai
  onUpdate: "CASCADE",
});

export default Role;
