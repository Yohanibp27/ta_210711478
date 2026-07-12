import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Division from "./DivisionModel.js";
import User from "./UserModel.js";

const { DataTypes } = Sequelize;

const Position = db.define(
  "positions",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    divisionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "divisions",
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

Division.hasMany(Position, { foreignKey: "divisionId" });
Position.belongsTo(Division, { foreignKey: "divisionId" });

Position.hasMany(User, { foreignKey: "positionId" });
User.belongsTo(Position, { foreignKey: "positionId" });

export default Position;
