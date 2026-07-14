import QRCode from "qrcode";
import { generateDailyQR, generateDynamicQR } from "../utils/qrGenerator.js";

//
export const getDailyQRCode = async (req, res) => {
  try {
    const token = generateDailyQR();
    const qrImage = await QRCode.toDataURL(token);

    res.status(200).json({ qrImage, token });
  } catch (e) {
    console.error("Error generate QR:", e);
    res
      .status(500)
      .json({ message: "Gagal membuat QR Code", error: e.message });
  }
};

// PAKE YANG INI MULAI TANGGAL 18 JANUARI 2026
export const getDynamicQRCode = async (req, res) => {
  try {
    const token = await generateDynamicQR();
    // const qrImage = await QRCode.toDataURL(token);

    res.status(200).json({
      token,
      //   qrImage, // biar ga boros bandwitdh
      expiresIn: 30, // biar frontend tau refresh
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal membuat QR",
      error: e.message || error.original?.message,
    });
  }
};
