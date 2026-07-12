import nodemailer from "nodemailer";

const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true untuk port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Rumah Sakit Bhayangkara Tk III Indramayu" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
};

export default sendEmail;
