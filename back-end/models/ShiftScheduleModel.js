// // BELUM DIPAKE
// import { Sequelize } from "sequelize";
// import db from "../config/Database.js";
// import Users from "./UserModel.js";

// const { DataTypes } = Sequelize;

// // jadwal_shift
// const shiftSchedule = db.define(
//   "shiftSchedule",
//   {
//     name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     startTime: {
//       type: DataTypes.TIME,
//       allowNull: false,
//     },
//     endTime: {
//       type: DataTypes.TIME,
//       allowNull: false,
//     },
//     date: {
//       type: DataTypes.DATEONLY,
//       allowNull: false,
//     },
//     status: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     userId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: Users,
//         key: "id",
//       },
//     },
//   },
//   {
//     freezeTableName: true,
//   }
// );

// // Relasi: 1 user punya banyak shift
// Users.belongsTo(shiftSchedule, { foreignKey: "userId" });
// shiftSchedule.hasMany(Users, { foreignKey: "userId" });

// export default shiftSchedule;

// // Relasi: 1 shift bisa dipakai banyak user
// // Users.belongsTo(WorkShift, { foreignKey: "workShiftId" });
// // WorkShift.hasMany(Users, { foreignKey: "workShiftId" });
