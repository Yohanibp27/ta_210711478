import LeaveRequest from "../models/LeaveRequestModel.js";
import LeaveType from "../models/LeaveTypeModel.js";
import LeaveSubtype from "../models/LeaveSubtypeModel.js";
import { Op } from "sequelize";
import dayjs from "dayjs";

export const isUserOnLeave = async (userId, date) => {
  const formattedDate = dayjs(date).format("YYYY-MM-DD");

  const leave = await LeaveRequest.findOne({
    where: {
      userId,
      status: "approved",
      startDate: { [Op.lte]: formattedDate },
      endDate: { [Op.gte]: formattedDate },
    },
    include: [
      {
        model: LeaveType,
        as: "leavetype",
        attributes: ["id", "name"],
        include: [
          {
            model: LeaveSubtype,
            as: "leavesubtypes",
            attributes: ["id", "name"],
          },
        ],
      },
    ],
  });
  return leave || null;
};
