import { Op } from "sequelize";
import cron from "node-cron";
import LeaveRequest from "../models/LeaveRequestModel.js";
import dayjs from "dayjs";
import db from "../config/Database.js";
import UserLeaveQuota from "../models/UserLeaveQuotaModel.js";

// export const autoExpireLeave = async () => {
//   await LeaveRequest.update(
//     { status: "rejected" },
//     {
//       where: {
//         status: "pending",
//         expiryDate: { [Op.lt]: new Date() },
//       },
//     },
//   );
// };

// export const autoExpireLeave = async () => {
//   cron.schedule("*/10 * * * *", async () => {
//     // console.log("Running auto expire job...");
//     console.log("🆘 Auto expire pengajuan izin/cuti/dinas luar jalan...");
//     await autoExpireLeave();
//   });

//   try {
//     const [updatedRows] = await LeaveRequest.update(
//       { status: "expired" },
//       {
//         where: {
//           status: "pending",
//           expiryDate: { [Op.lt]: new Date() },
//         },
//       },
//     );
//     if (updatedRows > 0) {
//       console.log(`🛑 Auto expire jalan: ${updatedRows} data diupdate`);
//     } else {
//       console.log("✔️ Tidak ada pengajuan yang perlu di-expire");
//     }
//   } catch (e) {
//     console.error("Auto expire error:", e);
//   }
// };

// 26 April 2026
// export const autoExpireLeaveJob = () => {
//   cron.schedule("*/10 * * * *", async () => {
//     console.log(
//       "🆘 Menjalankan pengecekan expired pengajuan izin, cuti, dinas luar...",
//     );

//     try {
//       const [updatedRows] = await LeaveRequest.update(
//         { status: "expired" },
//         {
//           where: {
//             status: "pending",
//             expiryDate: { [Op.lt]: new Date() },
//           },
//         },
//       );

//       if (updatedRows > 0) {
//         console.log(`🛑 Auto expire: ${updatedRows} data diupdate`);
//       } else {
//         console.log("✔️ Tidak ada pengajuan yang perlu di-expire");
//       }
//     } catch (e) {
//       console.error("Auto expire pengajuan izin, cuti, dinas luar error:", e);
//     }
//   });
// };

// 20 Mei 2026
export const autoExpireLeaveJob = () => {
  cron.schedule("*/10 * * * *", async () => {
    console.log(
      "🆘 Menjalankan pengecekan expired pengajuan izin, cuti, dinas luar...",
    );

    // Gunakan transaction agar jika gagal di tengah jalan, data tidak berantakan
    const transaction = await db.transaction();

    try {
      // 1. Cari semua request yang masih pending dan sudah lewat batas waktu
      const expiredRequests = await LeaveRequest.findAll({
        where: {
          status: "pending",
          expiryDate: { [Op.lt]: new Date() },
        },
        transaction,
      });

      if (expiredRequests.length > 0) {
        for (const request of expiredRequests) {
          // 2. Hitung durasi hari yang sebelumnya sempat dipotong saat create
          const diffDays =
            dayjs(request.endDate).diff(dayjs(request.startDate), "day") + 1;
          const currentYear = dayjs(request.startDate).year();

          // 3. Cari data kuota user bersangkutan
          const userQuota = await UserLeaveQuota.findOne({
            where: {
              userId: request.userId,
              leaveSubTypeId: request.leaveSubTypeId,
              year: currentYear,
            },
            transaction,
          });

          // 4. Kembalikan (refund) kuota
          if (userQuota) {
            await userQuota.update(
              {
                usedQuota: userQuota.usedQuota - diffDays,
              },
              { transaction },
            );
          }

          // 5. Update status request menjadi expired
          await request.update({ status: "expired" }, { transaction });
        }

        await transaction.commit();
        console.log(
          `🛑 Auto expire: ${expiredRequests.length} data diupdate dan kuota berhasil dikembalikan`,
        );
      } else {
        await transaction.commit();
        console.log("✔️ Tidak ada pengajuan yang perlu di-expire");
      }
    } catch (e) {
      await transaction.rollback();
      console.error("❌ Auto expire pengajuan error:", e);
    }
  });
};

// RELASI YANG BENAR
// | Kondisi         | status    | managerStatus | sdmStatus |
// | --------------- | --------- | ------------- | --------- |
// | baru diajukan   | pending   | pending       | pending   |
// | manager approve | pending   | approved      | pending   |
// | sdm approve     | approved  | approved      | approved  |
// | user cancel     | cancelled | pending       | pending   |
// | expired         | expired   | pending       | pending   |

// // 1. Fungsi ini KHUSUS untuk mengeksekusi logika update ke database
// export const expiredLeaves = async () => {
//   try {
//     const [updatedRows] = await LeaveRequest.update(
//       { status: "expired" },
//       {
//         where: {
//           status: "pending",
//           expiryDate: { [Op.lt]: new Date() },
//         },
//       },
//     );
//     if (updatedRows > 0) {
//       console.log(`🛑 Auto expire jalan: ${updatedRows} data diupdate`);
//     } else {
//       console.log("✔️ Tidak ada pengajuan yang perlu di-expire");
//     }
//   } catch (e) {
//     console.error("Auto expire error:", e);
//   }
// };

// // 2. Fungsi ini KHUSUS untuk menjadwalkan cron job
// export const autoExpireLeave = () => {
//   // Cron akan berjalan setiap 10 menit
//   cron.schedule("*/10 * * * *", async () => {
//     console.log(
//       "⏳ Menjalankan pengecekan auto expire izin/cuti/dinas luar...",
//     );
//     // Panggil fungsi eksekusi database di sini, bukan memanggil fungsi cron lagi
//     await expiredLeaves();
//   });
//   console.log("🚀 Cron job untuk auto expire leave berhasil dijalankan");
// };
