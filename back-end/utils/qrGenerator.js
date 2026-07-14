import jwt from "jsonwebtoken";
// import QRCode from "qrcode";
import crypto from "crypto";

// PAKE CRYPTO
export const generateDailyQR = () => {
  // Buat token unik per hari
  const date = new Date().toISOString().split("T")[0];
  const random = crypto.randomBytes(8).toString("hex");
  const token = crypto
    .createHash("sha256")
    .update(date + random)
    .digest("hex");

  return token;
};

// BELUM DIPAKE SOALNYA INI BUAT REFRESH QR CODE PER 30 DETIK
// UDAH DIPAKE!!
import QrCodeToken from "../models/QrCodeToken.js";
import { Op } from "sequelize";

export const generateDynamicQR = async () => {
  // bersihkan token expired dulu
  await QrCodeToken.destroy({
    where: {
      expiresAt: { [Op.lt]: new Date() },
    },
  });

  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 1000); // berlaku 30 detik

  await QrCodeToken.create({ token, expiresAt, isUsed: false });

  return token; // nanti diubah jadi gambar QR di frontend
};

// export const generateDailyQR = async (req, res) => {
//   try {
//     const today = new Date().toISOString().split("T")[0];
//     const qrToken = jwt.sign({ date: today }, process.env.QR_SECRET, {
//       expiresIn: "24h",
//     });

//     res.json({ qrToken });
//   } catch (e) {
//     res.status(500).json({ msg: "Gagal generate QR", error: err.message });
//   }
// };

// export const generateDailyQR = async (data) => {
//   try {
//     const qrString = JSON.stringify(data); // pastikan data jadi string
//     const qrCodeDataUrl = await QRCode.toDataURL(qrString);
//     return qrCodeDataUrl;
//   } catch (err) {
//     console.error("❌ Error generate QR:", err);
//     throw new Error(err.message);
//   }
// };

// export const generateDailyQR = async (req, res) => {
//   try {
//     console.log("🔍 Memproses daily QR...");

//     // Ambil info user dari middleware
//     const userId = req.user?.id || req.userId;
//     const role = req.role || req.user?.role;

//     if (!userId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "User ID tidak ditemukan" });
//     }

//     // Buat token QR (misalnya berlaku 1 hari)
//     const qrPayload = { userId, role, date: new Date().toISOString() };
//     const qrToken = jwt.sign(qrPayload, process.env.JWT_SECRET, {
//       expiresIn: "1d",
//     });

//     // Convert token menjadi gambar QR
//     const qrImage = await QRCode.toDataURL(qrToken);

//     console.log("✅ QR berhasil dibuat untuk user:", userId);

//     // Kirim hasil ke frontend
//     return res.status(200).json({
//       success: true,
//       message: "QR Code harian berhasil dibuat",
//       qrToken,
//       qrImage,
//     });
//   } catch (err) {
//     console.error("❌ Error generate QR:", err);
//     return res
//       .status(500)
//       .json({
//         success: false,
//         message: "Gagal generate QR",
//         error: err.message,
//       });
//   }
// };

// export const generateDailyQR = (type = "IN") => {
//   const today = new Date().toISOString().split("T")[0];

//   // Token berlaku 1 hari (24 jam)
//   const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

//   const payload = {
//     date: today,
//     type, // IN atau OUT
//   };

//   const token = jwt.sign(payload, process.env.QR_SECRET, { expiresIn: "24h" });
//   return token;
// };
