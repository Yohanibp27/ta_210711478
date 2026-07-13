import Activity from "../models/UserActivityModel.js";
import User from "../models/UserModel.js";
import Attendance from "../models/AttendanceModel.js";
import LeaveRequest from "../models/LeaveRequestModel.js";
import ShiftExchange from "../models/ShiftExchangeModel.js";
import Profession from "../models/ProfessionModel.js";
import Position from "../models/PositionModel.js";
import Division from "../models/DivisionModel.js";
import Department from "../models/DepartmentModel.js";
import LeaveType from "../models/LeaveTypeModel.js";
import LeaveSubType from "../models/LeaveSubTypeModel.js";
import { Sequelize } from "sequelize";
import ShiftAssignment from "../models/ShiftAssignmentModel.js";
import WorkShift from "../models/WorkShiftModel.js";

export const getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Berhasil menampilkan semua aktivitas",
      data: activities,
    });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "Gagal menampilkan semua aktivitas", error: e.message });
  }
};

// export const getMyActivities = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const activities = await Activity.findAll({
//       where: { userId },
//       order: [["createdAt", "DESC"]],
//     });

//     res.status(200).json({
//       message: "Berhasil menampilkan aktivitas user",
//       data: activities,
//     });
//   } catch (e) {
//     console.error(e);
//     res
//       .status(500)
//       .json({ message: "Gagal menampilkan aktivitas user", error: e.message });
//   }
// };

export const getMyActivities = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "titlePrefix",
        "fullName",
        "titleSuffix",
        "nip",
        "professionId",
        "positionId",
        "email",
        "phone",
        "profilePhoto",
      ],
      include: [
        {
          model: Profession,
          attributes: ["id", "name"],
        },
        {
          model: Position,
          attributes: ["id", "name"],
          include: [
            {
              model: Division,
              attributes: ["id", "name"],
              include: { model: Department, attributes: ["id", "name"] },
            },
          ],
        },
      ],
    });

    const activities = await Activity.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    const activitiesWithDetail = await Promise.all(
      activities.map(async (activity) => {
        const actJson = activity.toJSON();
        let detailData = null;

        if (actJson.category === "attendance" && actJson.referenceId) {
          const attendance = await Attendance.findByPk(actJson.referenceId, {
            include: [
              {
                model: User,
                as: "user",
                attributes: [
                  "id",
                  "titlePrefix",
                  "fullName",
                  "titleSuffix",
                  "nip",
                  "profilePhoto",
                ],
                include: [
                  {
                    model: Profession,
                    attributes: ["id", "name"],
                  },
                  {
                    model: Position,
                    attributes: ["id", "name"],
                    include: [
                      {
                        model: Division,
                        attributes: ["id", "name"],
                        include: {
                          model: Department,
                          attributes: ["id", "name"],
                        },
                      },
                    ],
                  },
                ],
              },
              {
                model: WorkShift,
                attributes: ["id", "name", "startTime", "endTime", "tolerance"],
              },
              {
                model: ShiftAssignment,
                attributes: ["id", "workShiftId", "date"],
                include: [
                  {
                    model: WorkShift,
                    attributes: [
                      "id",
                      "name",
                      "startTime",
                      "endTime",
                      "tolerance",
                    ],
                  },
                ],
              },
              {
                model: LeaveRequest,
                attributes: [
                  "id",
                  "leaveTypeId",
                  "leaveSubTypeId",
                  "startDate",
                  "endDate",
                  "note",
                  "evidenceFile",
                  "status",
                ],
                include: [
                  {
                    model: LeaveType,
                    as: "leavetype",
                    attributes: ["id", "name"],
                  },
                  {
                    model: LeaveSubType,
                    as: "leavesubtype",
                    attributes: [
                      "id",
                      "name",
                      "requireEvidence",
                      "allowSameDay",
                      "cutoffHour",
                    ],
                  },
                ],
              },
            ],
          });
          if (attendance) {
            detailData = attendance.toJSON();
            // let lateMinutes = 0;
            // const workShift =
            //   detailData.WorkShift ||
            //   (detailData.ShiftAssignment &&
            //     detailData.ShiftAssignment.WorkShift);
            // if (detailData.checkInTime && workShift && workShift.startTime) {
            //   const checkInDate = new Date(detailData.checkInTime);
            //   const checkInWIB = new Date(
            //     checkInDate.toLocaleString("en-US", {
            //       timeZone: "Asia/Jakarta",
            //     }),
            //   );
            //   const checkInTotalMins =
            //     checkInWIB.getHours() * 60 + checkInWIB.getMinutes();
            //   const [sHour, sMinute] = workShift.startTime.split(":");
            //   const shiftTotalMins = parseInt(sHour) * 60 + parseInt(sMinute);
            //   // Gunakan toleransi dari DB jika ada, jika tidak default 15 menit
            //   const toleranceValue =
            //     workShift.tolerance !== undefined ? workShift.tolerance : 15;
            //   const toleranceThreshold = shiftTotalMins + toleranceValue;
            //   if (checkInTotalMins > toleranceThreshold) {
            //     lateMinutes = checkInTotalMins - toleranceThreshold;
            //   }
            // }
            // detailData.lateTime = lateMinutes > 0 ? lateMinutes : null;

            let lateMinutes = 0;
            const workShift =
              detailData.workShift || detailData.shiftAssignment?.workShift;
            if (detailData.checkInTime && workShift?.startTime) {
              const checkIn = new Date(detailData.checkInTime);

              // ambil jam & menit langsung (tanpa timezone ribet)
              const checkInMinutes =
                checkIn.getHours() * 60 + checkIn.getMinutes();

              const [startHour, startMinute] = workShift.startTime.split(":");
              const shiftMinutes =
                parseInt(startHour) * 60 + parseInt(startMinute);

              const tolerance = workShift.tolerance ?? 15;
              const limit = shiftMinutes + tolerance;

              if (checkInMinutes > limit) {
                lateMinutes = checkInMinutes - limit;
              }
            }

            detailData.lateTime = lateMinutes > 0 ? lateMinutes : 0;
          }
          //   detailData = await Attendance.findByPk(actJson.referenceId, {
          //     include: [
          //       {
          //         model: User,
          //         as: "user",
          //         attributes: [
          //           "id",
          //           "titlePrefix",
          //           "fullName",
          //           "titleSuffix",
          //           "nip",
          //           "profilePhoto",
          //         ],
          //         include: [
          //           {
          //             model: Profession,
          //             attributes: ["id", "name"],
          //           },
          //           {
          //             model: Position,
          //             attributes: ["id", "name"],
          //             include: [
          //               {
          //                 model: Division,
          //                 attributes: ["id", "name"],
          //                 include: {
          //                   model: Department,
          //                   attributes: ["id", "name"],
          //                 },
          //               },
          //             ],
          //           },
          //         ],
          //       },
          //       {
          //         model: WorkShift,
          //         attributes: ["id", "name", "startTime", "endTime", "tolerance"],
          //       },
          //       {
          //         model: ShiftAssignment,
          //         attributes: ["id", "workShiftId", "date"],
          //         include: [
          //           {
          //             model: WorkShift,
          //             attributes: [
          //               "id",
          //               "name",
          //               "startTime",
          //               "endTime",
          //               "tolerance",
          //             ],
          //           },
          //         ],
          //       },
          //       {
          //         model: LeaveRequest,
          //         attributes: [
          //           "id",
          //           "leaveTypeId",
          //           "leaveSubTypeId",
          //           "startDate",
          //           "endDate",
          //           "note",
          //           "evidenceFile",
          //           "status",
          //         ],
          //         include: [
          //           {
          //             model: LeaveType,
          //             attributes: ["id", "name"],
          //           },
          //           {
          //             model: LeaveSubType,
          //             attributes: [
          //               "id",
          //               "name",
          //               "requireEvidence",
          //               "allowSameDay",
          //               "cutoffHour",
          //             ],
          //           },
          //         ],
          //       },
          //     ],
          //   });
        } else if (actJson.category === "leave" && actJson.referenceId) {
          detailData = await LeaveRequest.findByPk(actJson.referenceId, {
            include: [
              {
                model: User,
                as: "user",
                attributes: [
                  "id",
                  "titlePrefix",
                  "fullName",
                  "titleSuffix",
                  "nip",
                  "profilePhoto",
                ],
                include: [
                  {
                    model: Profession,
                    attributes: ["id", "name"],
                  },
                  {
                    model: Position,
                    attributes: ["id", "name"],
                    include: [
                      {
                        model: Division,
                        attributes: ["id", "name"],
                        include: {
                          model: Department,
                          attributes: ["id", "name"],
                        },
                      },
                    ],
                  },
                ],
              },
              {
                model: LeaveType,
                as: "leavetype",
                attributes: ["id", "name"],
              },
              {
                model: LeaveSubType,
                as: "leavesubtype",
                attributes: [
                  "id",
                  "name",
                  "requireEvidence",
                  "allowSameDay",
                  "cutoffHour",
                ],
              },
              {
                model: User,
                as: "manager",
                attributes: [
                  "id",
                  "titlePrefix",
                  "fullName",
                  "titleSuffix",
                  "nip",
                  "profilePhoto",
                ],
                include: [
                  {
                    model: Position,
                    attributes: ["id", "name"],
                  },
                ],
              },
              {
                model: User,
                as: "sdm",
                attributes: [
                  "id",
                  "titlePrefix",
                  "fullName",
                  "titleSuffix",
                  "nip",
                  "profilePhoto",
                ],
                include: [
                  {
                    model: Position,
                    attributes: ["id", "name"],
                  },
                ],
              },
            ],
          });
        } else if (
          actJson.category === "shift_exchange" &&
          actJson.action === "submitted" &&
          actJson.referenceId
        ) {
          detailData = await ShiftExchange.findByPk(actJson.referenceId, {
            include: [
              {
                model: User,
                as: "requester",
                attributes: [
                  "id",
                  "titlePrefix",
                  "fullName",
                  "titleSuffix",
                  "nip",
                  "profilePhoto",
                ],
                include: [
                  {
                    model: Profession,
                    attributes: ["id", "name"],
                  },
                  {
                    model: Position,
                    attributes: ["id", "name"],
                    include: [
                      {
                        model: Division,
                        attributes: ["id", "name"],
                        include: {
                          model: Department,
                          attributes: ["id", "name"],
                        },
                      },
                    ],
                  },
                ],
              },
              {
                model: ShiftAssignment,
                as: "requesterShift",
                attributes: ["id", "userId", "workShiftId", "date"],
                include: [
                  {
                    model: WorkShift,
                    as: "shiftDetail",
                    attributes: ["name", "startTime", "endTime"],
                  },
                ],
              },
              {
                model: User,
                as: "partner",
                attributes: [
                  "id",
                  "titlePrefix",
                  "fullName",
                  "titleSuffix",
                  "nip",
                  "profilePhoto",
                ],
                include: [
                  {
                    model: Profession,
                    attributes: ["id", "name"],
                  },
                  {
                    model: Position,
                    attributes: ["id", "name"],
                    include: [
                      {
                        model: Division,
                        attributes: ["id", "name"],
                        include: {
                          model: Department,
                          attributes: ["id", "name"],
                        },
                      },
                    ],
                  },
                ],
              },
              {
                model: ShiftAssignment,
                as: "partnerShift",
                attributes: ["id", "userId", "workShiftId", "date"],
                include: [
                  {
                    model: WorkShift,
                    as: "shiftDetail",
                    attributes: ["name", "startTime", "endTime"],
                  },
                ],
              },
              {
                model: User,
                as: "manager",
                attributes: [
                  "id",
                  "titlePrefix",
                  "fullName",
                  "titleSuffix",
                  "nip",
                  "profilePhoto",
                ],
                include: [
                  {
                    model: Profession,
                    attributes: ["id", "name"],
                  },
                  {
                    model: Position,
                    attributes: ["id", "name"],
                    include: [
                      {
                        model: Division,
                        attributes: ["id", "name"],
                        include: {
                          model: Department,
                          attributes: ["id", "name"],
                        },
                      },
                    ],
                  },
                ],
              },
              {
                model: User,
                as: "partner",
                attributes: [
                  "id",
                  "titlePrefix",
                  "fullName",
                  "titleSuffix",
                  "nip",
                  "profilePhoto",
                ],
                include: [
                  {
                    model: Profession,
                    attributes: ["id", "name"],
                  },
                  {
                    model: Position,
                    attributes: ["id", "name"],
                    include: [
                      {
                        model: Division,
                        attributes: ["id", "name"],
                        include: {
                          model: Department,
                          attributes: ["id", "name"],
                        },
                      },
                    ],
                  },
                ],
              },
              {
                model: User,
                as: "sdm",
                attributes: [
                  "id",
                  "titlePrefix",
                  "fullName",
                  "titleSuffix",
                  "nip",
                  "profilePhoto",
                ],
                include: [
                  {
                    model: Profession,
                    attributes: ["id", "name"],
                  },
                  {
                    model: Position,
                    attributes: ["id", "name"],
                    include: [
                      {
                        model: Division,
                        attributes: ["id", "name"],
                        include: {
                          model: Department,
                          attributes: ["id", "name"],
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          });
        } else if (
          actJson.category === "shift_exchange" &&
          actJson.action == "request_received" &&
          actJson.referenceId
        ) {
          detailData = await ShiftExchange.findByPk(actJson.referenceId, {
            include: [
              {
                model: User,
                as: "requester",
                attributes: [
                  "id",
                  "titlePrefix",
                  "fullName",
                  "titleSuffix",
                  "nip",
                  "profilePhoto",
                ],
                include: [
                  {
                    model: Profession,
                    attributes: ["id", "name"],
                  },
                  {
                    model: Position,
                    attributes: ["id", "name"],
                    include: [
                      {
                        model: Division,
                        attributes: ["id", "name"],
                        include: {
                          model: Department,
                          attributes: ["id", "name"],
                        },
                      },
                    ],
                  },
                ],
              },
              {
                model: ShiftAssignment,
                as: "requesterShift",
                attributes: ["id", "userId", "workShiftId", "date"],
                include: [
                  {
                    model: WorkShift,
                    as: "shiftDetail",
                    attributes: ["name", "startTime", "endTime"],
                  },
                ],
              },
              {
                model: User,
                as: "partner",
                attributes: [
                  "id",
                  "titlePrefix",
                  "fullName",
                  "titleSuffix",
                  "nip",
                  "profilePhoto",
                ],
                include: [
                  {
                    model: Profession,
                    attributes: ["id", "name"],
                  },
                  {
                    model: Position,
                    attributes: ["id", "name"],
                    include: [
                      {
                        model: Division,
                        attributes: ["id", "name"],
                        include: {
                          model: Department,
                          attributes: ["id", "name"],
                        },
                      },
                    ],
                  },
                ],
              },
              {
                model: ShiftAssignment,
                as: "partnerShift",
                attributes: ["id", "userId", "workShiftId", "date"],
                include: [
                  {
                    model: WorkShift,
                    as: "shiftDetail",
                    attributes: ["name", "startTime", "endTime"],
                  },
                ],
              },
              {
                model: User,
                as: "manager",
                attributes: [
                  "id",
                  "titlePrefix",
                  "fullName",
                  "titleSuffix",
                  "nip",
                  "profilePhoto",
                ],
                include: [
                  {
                    model: Profession,
                    attributes: ["id", "name"],
                  },
                  {
                    model: Position,
                    attributes: ["id", "name"],
                    include: [
                      {
                        model: Division,
                        attributes: ["id", "name"],
                        include: {
                          model: Department,
                          attributes: ["id", "name"],
                        },
                      },
                    ],
                  },
                ],
              },
              {
                model: User,
                as: "partner",
                attributes: [
                  "id",
                  "titlePrefix",
                  "fullName",
                  "titleSuffix",
                  "nip",
                  "profilePhoto",
                ],
                include: [
                  {
                    model: Profession,
                    attributes: ["id", "name"],
                  },
                  {
                    model: Position,
                    attributes: ["id", "name"],
                    include: [
                      {
                        model: Division,
                        attributes: ["id", "name"],
                        include: {
                          model: Department,
                          attributes: ["id", "name"],
                        },
                      },
                    ],
                  },
                ],
              },
              {
                model: User,
                as: "sdm",
                attributes: [
                  "id",
                  "titlePrefix",
                  "fullName",
                  "titleSuffix",
                  "nip",
                  "profilePhoto",
                ],
                include: [
                  {
                    model: Profession,
                    attributes: ["id", "name"],
                  },
                  {
                    model: Position,
                    attributes: ["id", "name"],
                    include: [
                      {
                        model: Division,
                        attributes: ["id", "name"],
                        include: {
                          model: Department,
                          attributes: ["id", "name"],
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          });
        }
        return {
          ...actJson,
          detail: detailData,
        };
      }),
    );

    res.status(200).json({
      message: "Berhasil menampilkan aktivitas user beserta detailnya",
      user,
      data: activitiesWithDetail,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Gagal menampilkan aktivitas user",
      error: e.message,
    });
  }
};

export const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findByPk(id);

    if (!activity) {
      return res.status(404).json({ message: "Aktivitas tidak ditemukan" });
    }

    res.status(200).json({
      message: `Berhasil menampilkan aktivitas berdasarkan id ${id}`,
      data: activity,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: `Gagal menampilkan aktivitas berdasarkan id {$id}`,
      error: e.message,
    });
  }
};

export const createActivity = async (req, res) => {
  try {
    const { userId, type, referenceId, description } = req.body;

    const activity = await Activity.create({
      userId,
      type,
      referenceId,
      description,
      isRead: false,
    });

    res
      .status(201)
      .json({ message: "Berhasil membuat aktivitas user", data: activity });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "Gagal membuat aktivitas user", error: e.message });
  }
};

export const markActivityAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: "Aktivitas tidak ditemukan" });
    }

    activity.isRead = true;
    await activity.save();

    res
      .status(200)
      .json({ message: "Berhasil membaca aktivitas user", data: activity });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "Gagal membaca aktivitas user", error: e.message });
  }
};

export const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Activity.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: "Aktivitas tidak ditemukan" });
    }

    res.status(200).json({ message: "Berhasil menghapus aktivitas user" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const getFilteredActivities = async (req, res) => {
  try {
    const userId = req.user.id;

    // Ambil data user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const roleId = user.roleId;

    // Ambil semua aktivitas miliknya
    let activities = await Activity.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    // ==============================
    // ROLE FILTER
    // ==============================

    const restrictedTypes = [
      "shift_submission",
      "shift_approved",
      "shift_rejected",
    ];

    // Jika admin / supervisor / manager → sembunyikan aktivitas shift
    if ([1, 2, 3].includes(roleId)) {
      activities = activities.filter((a) => !restrictedTypes.includes(a.type));
    }

    return res.status(200).json({
      message: "Berhasil menampilkan aktivitas user (filtered)",
      data: activities,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message: "Gagal menampilkan aktivitas user",
      error: e.message,
    });
  }
};

// export const getFilteredActivities = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const user = await User.findByPk(userId, {
//       attributes: [
//         "id",
//         "titlePrefix",
//         "fullName",
//         "titleSuffix",
//         "nip",
//         "email",
//         "phone",
//         "joinDate",
//         "profilePhoto",
//         "professionId",
//         "positionId",
//       ],
//       include: [
//         { model: Profession, attributes: ["id", "name"] },
//         {
//           model: Position,
//           attributes: ["id", "name"],
//           include: [
//             {
//               model: Division,
//               attributes: ["id", "name"],
//               include: { model: Department, attributes: ["id", "name"] },
//             },
//           ],
//         },
//       ],
//     });

//     if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

//     // Tambahkan Include untuk mengambil detail di setiap kategori
//     const activities = await Activity.findAll({
//       where: { userId },
//       order: [["createdAt", "DESC"]],
//       include: [
//         {
//           // Relasi ke detail Leave (Izin/Cuti)
//           model: LeaveRequest,
//           as: "detail", // Pastikan alias ini sesuai dengan definisi di model Activity
//           required: false,
//           where: Sequelize.literal('category = "leave"'), // Filter agar hanya join jika category 'leave'
//           include: [
//             { model: LeaveType, as: "leavetype", attributes: ["name"] },
//             { model: LeaveSubType, as: "leaveSubType", attributes: ["name"] },
//           ],
//         },
//         {
//           // Relasi ke detail Attendance
//           model: Attendance,
//           as: "attendanceDetail", // Sesuaikan aliasnya
//           required: false,
//         },
//         {
//           // Relasi ke detail Shift Exchange
//           model: ShiftExchange,
//           as: "exchangeDetail", // Sesuaikan aliasnya
//           required: false,
//         },
//       ],
//     });

//     // Transformasi data agar Flutter menerima key "detail" yang konsisten
//     const formattedData = activities.map((a) => {
//       const plainActivity = a.get({ plain: true });

//       // Standarisasi field detail untuk dikonsumsi Flutter
//       let finalDetail = null;
//       if (plainActivity.category === "leave")
//         finalDetail = plainActivity.detail;
//       if (plainActivity.category === "attendance")
//         finalDetail = plainActivity.attendanceDetail;
//       if (plainActivity.category === "shift_exchange")
//         finalDetail = plainActivity.exchangeDetail;

//       return {
//         ...plainActivity,
//         detail: finalDetail, // Flutter akan membaca key ini
//         user: user, // Sisipkan data user ke setiap activity item
//       };
//     });

//     return res.status(200).json({
//       message: "Berhasil menampilkan aktivitas user beserta detailnya",
//       user: user, // Kirim user di root agar bisa diakses ActivityPage
//       data: formattedData,
//     });
//   } catch (e) {
//     console.error(e);
//     return res
//       .status(500)
//       .json({ message: "Gagal menampilkan aktivitas", error: e.message });
//   }
// };
