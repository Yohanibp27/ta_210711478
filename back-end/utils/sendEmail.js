import nodemailer from "nodemailer";

const sendEmail = async (to, subject, text) => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    MAIL_FROM_ADDRESS,
    MAIL_FROM_NAME,
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "Konfigurasi SMTP belum lengkap. Periksa SMTP_HOST, SMTP_PORT, SMTP_USER, dan SMTP_PASS.",
    );
  }

  const port = Number(SMTP_PORT);
  if (Number.isNaN(port)) {
    throw new Error("SMTP_PORT harus berupa angka.");
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    // secure: false, // true untuk port 465
    secure: port === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transporter.verify();

  const result = await transporter.sendMail({
    from: `"${MAIL_FROM_NAME || "Rumah Sakit Bhayangkara Tk III Indramayu"}" <${MAIL_FROM_ADDRESS || SMTP_USER}>`,
    to,
    subject,
    text,
  });
  console.log("Email reset password berhasil dikirim:", result.messageId);
};

export default sendEmail;
