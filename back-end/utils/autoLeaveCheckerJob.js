import cron from "node-cron";
import User from "../models/UserModel.js";
import LeaveRequest from "../models/LeaveRequestModel.js";
import { Op } from "sequelize";

// export const endExpiredLeave = async () => {
//   const today = new Date();

//   const leaves = await LeaveRequest.findAll({
//     where: {
//       //   finalStatus: "approved",
//       status: "approved",
//       endDate: { [Op.lt]: today },
//     },
//   });

//   for (const leave of leaves) {
//     await User.update({ leaveStatus: "none" }, { where: { id: leave.userId } });
//     res.json({
//       message: `Cuti selesai, user aktif presensi kembali ${leave.userId}`,
//     });
//   }
// };

export const autoLeaveCheckerJob = () => {
  // Berjalan setiap hari pada jam 00:01 pagi
  //   cron.schedule("1 0 * * *", async () => {

  // Berjalan setiap hari pada jam 05:00 pagi
  cron.schedule("0 5 * * *", async () => {
    console.log("⚠️ Menjalankan pengecekan masa waktu cuti berakhir...");
    try {
      const today = new Date().toISOString().split("T")[0];
      const expiredLeaves = await LeaveRequest.findAll({
        where: {
          status: "approved",
          endDate: { [Op.lt]: today },
        },
      });

      if (expiredLeaves.length > 0) {
        const userIds = expiredLeaves.map((leave) => leave.userId);
        await User.update(
          { leaveStatus: "none" },
          {
            where: {
              id: userIds,
              leaveStatus: "on_leave",
            },
          },
        );
        console.log(
          `♻️
           ${userIds.length} user telah dikembalikan statusnya ke 'none'`,
        );
      }
    } catch (e) {
      console.error("Gagal menjalankan auto cron cuti", e);
    }
  });
};

// BELUM DIPAKE
/*
 * =========================
 * END OF APPROVAL LOGIC
 * =========================
 * - Jika cuti sudah lewat endDate, otomatis ubah leaveStatus user ke "none" (dalam utils/leaveAutoEndJob.js)
 * - Endpoint manual untuk mengakhiri cuti lebih awal (finishLeaveManually)
 */
export const finishLeaveManually = async (req, res) => {
  const leave = await LeaveRequest.findByPk(req.params.id);

  if (!leave || leave.finalStatus !== "approved") {
    return res.status(400).json({ message: "Cuti tidak valid" });
  }

  await User.update({ leaveStatus: "none" }, { where: { id: leave.userId } });

  res.json({ message: "Cuti selesai, user aktif presensi kembali" });
};
