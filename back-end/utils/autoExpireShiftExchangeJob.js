import { Op } from "sequelize";
import cron from "node-cron";
import ShiftExchange from "../models/ShiftExchangeModel.js";

export const autoExpireShiftExchangeJob = () => {
  cron.schedule("*/10 * * * *", async () => {
    console.log("💬 Menjalankan pengecekan expire tukar shift...");
    try {
      const [updateRows] = await ShiftExchange.update(
        { status: "expired" },
        {
          where: {
            status: "pending",
            expiryDate: { [Op.lt]: new Date() },
          },
        },
      );

      if (updateRows > 0) {
        console.log(`🔁 Auto expire tukar shift: ${updateRows} data diupdate`);
      } else {
        console.log("🆗 Tidak ada tukar shift yang perlu di-expire");
      }
    } catch (e) {
      console.error("Auto expire tukar shift error", e);
    }
  });
};
