import User from "../models/UserModel.js";
import WorkShift from "../models/WorkShiftModel.js";
import ShiftAssignment from "../models/ShiftAssignmentModel.js";
import Position from "../models/PositionModel.js";
import Division from "../models/DivisionModel.js";
import Department from "../models/DepartmentModel.js";
import Profession from "../models/ProfessionModel.js";
import { Op } from "sequelize";
import dayjs from "dayjs";

export const getAllShifts = async (req, res) => {
  try {
    const response = await ShiftAssignment.findAll({
      include: [
        {
          model: User,
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "nip",
            "email",
            "status",
            "profilePhoto",
          ],
          include: [
            {
              model: Position,
              attributes: ["id", "name"],
              include: [
                {
                  model: Division,
                  attributes: ["id", "name"],
                  include: [
                    {
                      model: Department,
                      attributes: ["id", "name"],
                    },
                  ],
                },
              ],
            },
            {
              model: Profession,
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: WorkShift,
          attributes: ["id", "name", "startTime", "endTime"],
        },
      ],
    });

    // if (!response) {
    //   return res
    //     .status(400)
    //     .json({ message: "Shift user tenaga medis tidak ditemukan!" });
    // }

    //   const usersWithAvatar = response.map((user) => {
    //     const u = user.toJSON();
    //     u.avatarUrl = u.profilePhoto
    //       ? `http://localhost:3000/uploads/profilePhotos/${u.profilePhoto}`
    //       : null;
    //     return u;
    //   });

    if (response.length === 0) {
      return res.status(200).json({
        message: "Belum ada shift user tenaga medis",
        data: [],
      });
    }

    const backendUrl = (
      process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`
    ).replace(/\/$/, "");
    const buildAvatarUrl = (profilePhoto) => {
      if (!profilePhoto) return null;
      const photoValue = String(profilePhoto).trim();
      if (
        /^https?:\/\//i.test(photoValue) &&
        !photoValue.includes("localhost") &&
        !photoValue.includes("127.0.0.1")
      ) {
        return photoValue;
      }
      const fileName = photoValue.split("/").pop();
      return `${backendUrl}/uploads/profilePhotos/${encodeURIComponent(
        fileName,
      )}`;
    };

    const shiftsWithAvatar = response.map((assignment) => {
      const item = assignment.toJSON();
      if (item.user) {
        item.user.avatarUrl = buildAvatarUrl(item.user.profilePhoto);
      }
      return item;
    });

    res.status(200).json({
      message: "Berhasil menampilkan shift user tenaga medis",
      data: shiftsWithAvatar,
    });
  } catch (e) {
    console.error("Get All Shift Error:", e);
    return res.status(500).json({
      message: "Gagal menampilkan shift user tenaga medis",
      error: e.message,
    });
  }
};

export const getShiftById = async (req, res) => {
  const { id } = req.params;
  const response = await ShiftAssignment.findAll({
    where: { id },
    include: [
      {
        model: User,
        attributes: [
          "id",
          "titlePrefix",
          "fullName",
          "titlePrefix",
          "nip",
          "email",
        ],
        include: [
          {
            model: Position,
            attributes: ["id", "name"],
            include: [
              {
                model: Division,
                attributes: ["id", "name"],
                include: [
                  {
                    model: Department,
                    attributes: ["id", "name"],
                  },
                ],
              },
            ],
          },
        ],
      },
      { model: WorkShift, attributes: ["id", "name", "startTime", "endTime"] },
    ],
  });
  res.status(200).json({
    message: `Berhasil menampilkan shift dengan id ${id}`,
    data: response,
  });
};

export const getShiftByUser = async (req, res) => {
  const { id: userId } = req.params;
  const response = await ShiftAssignment.findAll({
    where: { userId },
    include: [
      {
        model: User,
        attributes: [
          "id",
          "titlePrefix",
          "fullName",
          "titleSuffix",
          "nip",
          "email",
          "status",
        ],
        include: [
          {
            model: Position,
            attributes: ["id", "name"],
            include: [
              {
                model: Division,
                attributes: ["id", "name"],
                include: [
                  {
                    model: Department,
                    attributes: ["id", "name"],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        model: WorkShift,
        attributes: ["id", "name", "startTime", "endTime"],
      },
    ],
  });
  res.status(200).json({
    message: `Berhasil menampilkan shift user dengan id ${userId}`,
    data: response,
  });
};

export const createShift = async (req, res) => {
  try {
    console.log("req.body:", req.body);
    const { userId, workShiftId, date } = req.body;

    if (!userId || !workShiftId || !date) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // jenis user adalah NON SHIFT maka hanya boleh memiliki 1 shift dengan workshift id 1
    if (user.employmentType === "Non-Shift") {
      return res.status(400).json({
        message: `User non-shift tidak perlu shift`,
      });
    } else if (user.employmentType === "Shift") {
      // jenis user adalah SHIFT maka shift boleh lebih dari 1 shift dengan workshift berbeda di tanggal yang sama
      const existingShift = await ShiftAssignment.findOne({
        where: { userId, workShiftId, date },
      });

      // user shift: ga boleh punya 2 shift di tanggal sama
      if (existingShift) {
        return res.status(400).json({
          message: `User sudah memiliki shift ${workShiftId} pada tanggal ${date}`,
        });
      }
    }

    const response = await ShiftAssignment.create({
      userId,
      workShiftId,
      date,
    });
    res
      .status(201)
      .json({ message: "Berhasil menambahkan shift user", data: response });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Gagal menambahkan shift user", error: error.message });
  }
};

export const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, workShiftId, date } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    const shift = await ShiftAssignment.findByPk(id);
    if (!shift) {
      return res.status(404).json({ message: "Shift tidak ditemukan" });
    }

    if (user.employmentType === "Non-Shift") {
      // user non shift ga perlu buat shift karna cukup pake workshift
      return res.status(400).json({
        message: `User non-shift tidak perlu shift`,
      });
    } else if (user.employmentType === "Shift") {
      const sameWorkShift = await ShiftAssignment.findOne({
        where: {
          userId,
          workShiftId,
          date,
          id: { [Op.ne]: id },
        },
      });
      if (sameWorkShift) {
        return res.status(400).json({
          message: `User sudah memiliki shift ${workShiftId} pada tanggal ${date}`,
        });
      }
    }

    await ShiftAssignment.update(
      {
        userId,
        workShiftId,
        date,
      },
      { where: { id: id } },
    );
    const updateShift = await ShiftAssignment.findOne({
      where: { id: id },
      include: [
        {
          model: User,
          attributes: ["titlePrefix", "fullName", "titleSuffix", "nip"],
        },
        {
          model: WorkShift,
          attributes: ["name", "startTime", "endTime"],
        },
      ],
    });
    res.status(200).json({
      message: `Shift dengan userId ${userId} berhasil diperbarui`,
      data: updateShift,
    });
  } catch (error) {
    res.status(400).json({
      message: "Gagal memperbarui shift",
    });
  }
};

export const deleteShift = async (req, res) => {
  const { id } = req.params;
  const shift = await ShiftAssignment.findByPk(id);
  if (!shift) return res.status(404).json({ message: "Shift tidak ditemukan" });
  await shift.destroy();
  res.json({ message: "Shift berhasil dihapus" });
};

// berdasarkan id shift assignmet (SEMUA ROLE BISA)
export const getExchangeOptions = async (req, res) => {
  try {
    const { shiftId } = req.query;

    const selectedShift = await ShiftAssignment.findByPk(shiftId, {
      include: [
        {
          model: User,
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "status",
          ],
          include: [
            {
              model: Position,
              attributes: ["id", "name"],
            },
          ],
        },
        { model: WorkShift, attributes: ["id", "name"] },
      ],
    });

    if (!selectedShift) {
      return res.status(404).json({ message: "Shift tidak ditemukan" });
    }

    // Tentukan rentang 7 hari ke depan dari tanggal shift terpilih
    const startDate = selectedShift.date;
    const endDate = new Date(selectedShift.date);
    endDate.setDate(endDate.getDate() + 14); // +14 hari

    // Dapatkan nama posisi user shift yang dipilih
    const selectedPositionId = selectedShift.user.position.id;

    const availableShifts = await ShiftAssignment.findAll({
      where: {
        date: { [Op.between]: [startDate, endDate] },
        userId: { [Op.ne]: selectedShift.userId }, // bukan user yg sama
      },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "titlePrefix",
            "fullName",
            "titleSuffix",
            "status",
          ],
          where: { status: "Aktif" }, // hanya user aktif
          include: [
            {
              model: Position,
              attributes: ["id", "name"],
              where: { id: selectedPositionId }, // posisi sama dengan user shift yg dipilih
              include: [
                {
                  model: Division,
                  attributes: ["name"],
                  include: [{ model: Department, attributes: ["name"] }],
                },
              ],
            },
          ],
        },
        {
          model: WorkShift,
          attributes: ["id", "name", "startTime", "endTime"],
        },
      ],
    });

    return res.status(200).json({
      message: "Berhasil menampilkan opsi tukar shift",
      data: availableShifts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mendapatkan opsi tukar shift" });
  }
};

// berdasarkan TOKEN DAN JABATAN (HANYA USER SHIFT)
// export const getMyExchangeShiftOptions = async (req, res) => {
//   try {
//     const userId = req.userId;
//     /** 0. VALIDASI: hanya user SHIFT */
//     const loggedUser = await User.findByPk(userId, {
//       attributes: ["id", "employmentType"],
//     });

//     if (!loggedUser) {
//       return res.status(404).json({
//         message: "User tidak ditemukan!",
//       });
//     } else if (loggedUser.employmentType !== "Shift") {
//       return res.status(403).json({
//         message: "User non-shift tidak memiliki jadwal shift!",
//       });
//     }

//     /** 1. Ambil shift user login yang AKAN DATANG */
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const myShifts = await ShiftAssignment.findAll({
//       where: {
//         userId,
//         date: { [Op.gt]: today },
//       },
//       include: [
//         {
//           model: User,
//           attributes: ["id"],
//           include: [
//             {
//               model: Position,
//               attributes: ["id", "name"],
//             },
//           ],
//         },
//       ],
//     });

//     if (!myShifts.length) {
//       return res.status(404).json({
//         message: "Tidak ada shift mendatang untuk ditukar!",
//       });
//     }

//     /** 2. Ambil posisi user login */
//     const positionId = myShifts[0].user.position.id;

//     /** 3. Cari shift user LAIN dengan posisi sama */
//     const exchangeOptions = await ShiftAssignment.findAll({
//       where: {
//         userId: { [Op.ne]: userId },
//         date: { [Op.gt]: today },
//       },
//       include: [
//         {
//           model: User,
//           attributes: ["id", "titlePrefix", "fullName", "titleSuffix"],
//           where: { status: "Aktif" },
//           include: [
//             {
//               model: Position,
//               attributes: ["id", "name"],
//               where: { id: positionId },
//               include: [
//                 {
//                   model: Division,
//                   attributes: ["name"],
//                   include: [
//                     {
//                       model: Department,
//                       attributes: ["name"],
//                     },
//                   ],
//                 },
//               ],
//             },
//           ],
//         },
//         {
//           model: WorkShift,
//           attributes: ["id", "name", "startTime", "endTime"],
//         },
//       ],
//       order: [["date", "ASC"]],
//     });

//     return res.status(200).json({
//       message: "Opsi tukar shift berhasil ditampilkan",
//       data: exchangeOptions,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Gagal menampilkan opsi tukar shift",
//     });
//   }
// };
export const getMyExchangeShiftOptions = async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Ambil info user & posisi secara langsung (lebih akurat daripada ambil dari array shift)
    const loggedUser = await User.findByPk(userId, {
      attributes: ["id", "employmentType", "positionId"], // Ambil positionId langsung dari tabel User
    });

    if (!loggedUser || loggedUser.employmentType !== "Shift") {
      return res.status(403).json({ message: "Hanya untuk user Shift!" });
    }

    const positionId = loggedUser.positionId;

    // 2. Gunakan Op.gte (Greater Than or Equal) agar shift hari ini juga masuk hitungan
    const exchangeOptions = await ShiftAssignment.findAll({
      where: {
        userId: { [Op.ne]: userId },
        date: { [Op.gte]: today }, // Gunakan gte agar lebih fleksibel
      },
      include: [
        {
          model: User,
          attributes: ["id", "titlePrefix", "fullName", "titleSuffix"],
          where: {
            status: "Aktif",
            positionId: positionId, // Filter posisi langsung di level User
          },
          include: [
            {
              model: Position,
              attributes: ["id", "name"],
              include: [
                {
                  model: Division,
                  attributes: ["name"],
                  include: [{ model: Department, attributes: ["name"] }],
                },
              ],
            },
          ],
        },
        {
          model: WorkShift,
          attributes: ["id", "name", "startTime", "endTime"],
        },
      ],
      order: [["date", "ASC"]],
    });

    if (!exchangeOptions.length) {
      return res
        .status(404)
        .json({ message: "Tidak ada opsi tukar shift yang tersedia!" });
    }

    return res.status(200).json({
      message: "Opsi tukar shift berhasil ditampilkan",
      data: exchangeOptions,
    });
  } catch (error) {
    // ... error handling
  }
};

export const getMyShifts = async (req, res) => {
  try {
    const userId = req.userId;
    const loggedUser = await User.findByPk(userId, {
      attributes: ["id", "employmentType"],
    });

    if (!loggedUser) {
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    if (loggedUser.employmentType !== "Shift") {
      return res
        .status(403)
        .json({ message: "User NON-SHIFT tidak memiliki jadwal shift!" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const myShifts = await ShiftAssignment.findAll({
      where: {
        userId: userId,
        date: { [Op.gte]: today },
      },
      include: [
        {
          model: WorkShift,
          attributes: ["id", "name", "startTime", "endTime"],
        },
        {
          model: User,
          attributes: ["id", "titlePrefix", "fullName"],
          include: [
            {
              model: Position,
              attributes: ["name"],
              include: [
                {
                  model: Division,
                  attributes: ["name"],
                },
              ],
            },
          ],
        },
      ],
      order: [["date", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Jadwal shift Anda berhasil diambil",
      count: myShifts.length,
      data: myShifts,
    });
  } catch (error) {
    console.error("Error getMyShifts:", error);
    res.status(500).json({
      message: "Gagal menampilkan jadwal shift",
      error: error.message,
    });
  }
};

import * as XLSX from "xlsx";
// export const importShifts = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "File tidak ditemukan" });
//     }

//     let shifts = [];

//     // ==============================
//     // 1. PARSE CSV
//     // ==============================
//     if (req.file.mimetype === "text/csv") {
//       const text = req.file.buffer.toString("utf8");
//       const rows = text.split("\n");

//       const header = rows[0].replace(/\r/g, "").split(",");

//       for (let i = 1; i < rows.length; i++) {
//         if (!rows[i].trim()) continue;

//         const cols = rows[i].replace(/\r/g, "").split(",");

//         shifts.push({
//           userId: cols[0],
//           workShiftId: cols[1],
//           date: cols[2],
//         });
//       }
//     }

//     // ==============================
//     // 2. PARSE EXCEL (XLSX)
//     // ==============================
//     if (
//       req.file.mimetype ===
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
//       req.file.mimetype === "application/vnd.ms-excel"
//     ) {
//       const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       const json = XLSX.utils.sheet_to_json(sheet);

//       shifts = json.map((row) => ({
//         userId: row.userId,
//         workShiftId: row.workShiftId,
//         date: row.date,
//       }));
//     }

//     // Kalau shifts kosong:
//     if (!shifts.length) {
//       return res.status(400).json({ message: "Format file tidak valid" });
//     }

//     // ==============================
//     // 3. PROSES IMPORT SHIFT
//     // ==============================
//     const results = [];

//     for (const item of shifts) {
//       const { userId, workShiftId, date } = item;

//       const user = await User.findByPk(userId);
//       if (!user) {
//         results.push({
//           ...item,
//           status: "Gagal",
//           reason: "User tidak ditemukan",
//         });
//         continue;
//       }

//       // Nama otomatis (handle middleName kosong)
//       const fullNameUser =
//         [user.titlePrefix, user.fullName].filter(Boolean).join(" ") || "-";

//       if (user.employmentType === "Non-Shift") {
//         results.push({
//           ...item,
//           fullNameUser,
//           status: "Gagal",
//           reason: "User non-shift tidak perlu shift",
//         });
//         continue;
//       }

//       const existingShift = await ShiftAssignment.findOne({
//         where: { userId, date },
//       });
//       if (existingShift) {
//         results.push({
//           ...item,
//           fullName,
//           status: "Gagal",
//           reason: "Shift bentrok",
//         });
//         continue;
//       }

//       const createdShift = await ShiftAssignment.create({
//         userId,
//         workShiftId,
//         date,
//       });

//       results.push({
//         ...item,
//         fullName,
//         status: "Berhasil",
//         shiftId: createdShift.id,
//       });
//     }

//     res.status(200).json({
//       message: "Import selesai",
//       data: results,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Gagal import shift",
//       error: error.message,
//     });
//   }
// };

import ShiftExchange from "../models/ShiftExchangeModel.js";

export const importShifts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File tidak ditemukan" });
    }

    let shifts = [];

    // ==============================
    // 1. PARSE CSV & EXCEL
    // ==============================
    // if (req.file.mimetype === "text/csv") {
    //   const text = req.file.buffer.toString("utf8");
    //   const rows = text.split("\n");
    //   for (let i = 1; i < rows.length; i++) {
    //     if (!rows[i].trim()) continue;
    //     const cols = rows[i].replace(/\r/g, "").split(",");
    //     shifts.push({
    //       userId: cols[0],
    //       workShiftId: cols[1],
    //       date: cols[2],
    //     });
    //   }
    // }
    if (
      req.file.mimetype.includes("spreadsheetml") ||
      req.file.mimetype.includes("excel")
    ) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      // Baca mulai dari baris header tabel (misal baris ke-8)
      const range = XLSX.utils.decode_range(sheet["!ref"]);
      range.s.r = 7; // Mulai dari baris ke-8 (index 7) tempat header NO, userId, dst.

      const json = XLSX.utils.sheet_to_json(sheet, { range });

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1; // Sesuaikan dengan periode yang diinput

      json.forEach((row) => {
        const userId = row.userId;
        if (!userId) return;

        // Loop tanggal 1 sampai 31
        for (let day = 1; day <= 31; day++) {
          const shiftName = row[day.toString()]; // Ambil isi kolom "1", "2", dst.

          if (shiftName && shiftName !== "-") {
            // Konversi angka tanggal jadi format YYYY-MM-DD
            const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

            // Mapping nama shift ke ID (Ini harus disesuaikan dengan DB kamu)
            let workShiftId;
            if (shiftName === "Pagi") workShiftId = 1;
            else if (shiftName === "Siang") workShiftId = 2;
            else if (shiftName === "Malam") workShiftId = 3;

            if (workShiftId) {
              shifts.push({ userId, workShiftId, date: formattedDate });
            }
          }
        }
      });
    } else if (
      req.file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      req.file.mimetype === "application/vnd.ms-excel"
    ) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      shifts = json.map((row) => ({
        userId: row.userId,
        workShiftId: row.workShiftId,
        date: row.date,
      }));
    }

    if (!shifts.length) {
      return res
        .status(400)
        .json({ message: "Format file tidak valid atau data kosong!" });
    }

    // ==============================
    // 2. PROSES IMPORT & VALIDASI SHIFT EXCHANGE
    // ==============================
    const results = [];

    for (const item of shifts) {
      const { userId, workShiftId, date } = item;

      // Cari User
      const user = await User.findByPk(userId);
      let fullNameUser = "-";

      if (!user) {
        results.push({
          ...item,
          fullNameUser,
          status: "Gagal",
          reason: "User tidak ditemukan",
        });
        continue;
      }

      fullNameUser =
        [user.titlePrefix, user.fullName].filter(Boolean).join(" ") || "-";

      // Validasi Non-Shift
      if (user.employmentType === "Non-Shift") {
        results.push({
          ...item,
          fullNameUser,
          status: "Gagal",
          reason: "User non-shift tidak perlu jadwal shift",
        });
        continue;
      }

      // Cek apakah jadwal di tanggal tersebut sudah ada
      const existingShift = await ShiftAssignment.findOne({
        where: { userId, date },
      });

      if (existingShift) {
        // LOGIKA BARU: Cek apakah shift ini sedang/sudah ditukar di ShiftExchange
        const isExchanged = await ShiftExchange.findOne({
          where: {
            status: "Disetujui", // Hanya cek yang sudah disetujui
            [Op.or]: [
              { requesterShiftId: existingShift.id },
              { partnerShiftId: existingShift.id },
            ],
          },
        });

        if (isExchanged) {
          // Jika ada di ShiftExchange, kita UPDATE shift yang ada dengan workShiftId yang baru
          await existingShift.update({ workShiftId });
          results.push({
            ...item,
            fullNameUser,
            status: "Berhasil Diupdate",
            reason:
              "Jadwal diperbarui (Mendeteksi riwayat pertukaran/Shift Exchange)",
            shiftId: existingShift.id,
          });
        } else {
          // Jika sudah ada tapi TIDAK ada di ShiftExchange -> Bentrok
          results.push({
            ...item,
            fullNameUser,
            status: "Gagal",
            reason:
              "Shift bentrok (Jadwal sudah ada dan tidak ada riwayat pertukaran)",
          });
        }
      } else {
        // Jika tidak ada jadwal sama sekali, BUAT BARU
        const createdShift = await ShiftAssignment.create({
          userId,
          workShiftId,
          date,
        });

        results.push({
          ...item,
          fullNameUser,
          status: "Berhasil Dibuat",
          reason: "Jadwal shift baru berhasil ditambahkan!",
          shiftId: createdShift.id,
        });
      }
    }

    res.status(200).json({
      message: "Proses import file jadwal shift berhasil!",
      data: results,
    });
  } catch (error) {
    console.error("Error import shift:", error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server saat import shift",
      error: error.message,
    });
  }
};
