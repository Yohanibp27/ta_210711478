// BELUM DIPAKE
import cron from "node-cron";
import ShiftExchange from "../models/ShiftExchange.js";
import ShiftAssignment from "../models/ShiftAssignment.js";
import UserActivity from "../models/UserActivity.js";
import { Op } from "sequelize";

export const autoRejectExpiredExchanges = () => {
  // jalan setiap 10 menit
  cron.schedule("*/10 * * * *", async () => {
    console.log("⏳ Cek permintaan pertukaran shift yang kedaluwarsa...");

    // ambil yang Pending dan sudah lewat shift date
    const expired = await ShiftExchange.findAll({
      where: {
        status: "pending",
        expiryDate: { [Op.lt]: new Date() }, // sudah lewat expiryDate
      },
    });

    if (expired.length === 0) return;

    for (const ex of expired) {
      ex.status = "rejected";
      ex.approvedBy = null; // tidak ada yang approve
      ex.reasonAdmin = "Permintaan sudah kedaluwarsa";
      await ex.save();

      // Aktivitas user
      await UserActivity.create({
        userId: ex.requesterId,
        type: "shift_rejected",
        description: `Pengajuan pertukaran shift ditolak otomatis karena kedaluwarsa`,
      });
    }

    console.log(`❌ ${expired.length} permintaan ditolak otomatis.`);
  });
};
