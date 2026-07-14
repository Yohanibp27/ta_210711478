import User from "../models/UserModel.js";
import bcrypt from "bcrypt";
import Role from "../models/RoleModel.js";
import Department from "../models/DepartmentModel.js";
import Position from "../models/PositionModel.js";
import Division from "../models/DivisionModel.js";
import WorkShift from "../models/WorkShiftModel.js";
import ShiftAssignment from "../models/ShiftAssignmentModel.js";
import Profession from "../models/ProfessionModel.js";
import sendEmail from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import LeaveRequest from "../models/LeaveRequestModel.js";
import LeaveType from "../models/LeaveTypeModel.js";
import { Op } from "sequelize";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Token tidak ditemukan!" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token valid, decoded:", decoded);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      status: decoded.status, // untuk cek status user yang cuti
    };
    next();
  } catch (e) {
    // return res
    //   .status(403)
    //   .json({ message: "Token tidak valid atau kedaluwarsa" });
    return res.status(401).json({
      message: "Token tidak valid atau kedaluwarsa!",
      code: "TOKEN_EXPIRED",
    });
  }
};

// login user dengan NIP
export const Login = async (req, res) => {
  try {
    const { nip, password, device } = req.body;
    // if (!nip || !password) {
    //   return res.status(400).json({ message: "NIP dan password wajib diisi!" });
    // }

    if (!nip && !password) {
      return res.status(400).json({ message: "NIP dan password wajib diisi!" });
    } else if (!nip) {
      return res.status(400).json({ message: "NIP wajib diisi!" });
    } else if (!password) {
      return res.status(400).json({ message: "password wajib diisi!" });
    }

    const user = await User.findOne({
      where: { nip },
      include: [
        { model: Role, attributes: ["id", "name"] },
        { model: Profession, attributes: ["id", "name"] },
        {
          model: WorkShift,
          attributes: ["id", "name", "startTime", "endTime", "tolerance"],
        },
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
    });
    if (!user)
      return res.status(404).json({ message: "Akun tidak ditemukan!" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Password Anda salah!" });

    const role = await Role.findOne({ where: { id: user.roleId } });
    if (!role)
      return res.status(404).json({ message: "Role tidak ditemukan!" });

    // role yang diizinkan login pada web/desktop
    const allowedRoles = ["Admin", "Super Admin", "Supervisor", "Manager"];
    // Jika device bukan mobile & role tidak termasuk allowedRoles → akses ditolak
    if (!allowedRoles.includes(role.name) && device !== "mobile") {
      return res.status(403).json({ message: "Akses ditolak!" });
    }

    // pengecekan cuti aktif
    const today = new Date();
    // Mengonversi ke format YYYY-MM-DD sesuai dengan zona waktu lokal
    const todayString = today.toLocaleDateString("en-CA");
    const activeLeave = await LeaveRequest.findOne({
      where: {
        userId: user.id,
        status: "approved",
        startDate: { [Op.lte]: todayString }, // startDate <= hari ini
        endDate: { [Op.gte]: todayString }, // endDate >= hari ini
      },
      include: [{ model: LeaveType, as: "leavetype" }],
    });
    // Tentukan status aktual user saat ini
    // const isCurrentlyOnLeave = activeLeave !== null;
    // const currentStatus = isCurrentlyOnLeave ? "Cuti" : user.status;

    let currentStatus = user.status;
    let isLimitedAccess = false;

    if (activeLeave) {
      const leaveTypeName = activeLeave.leavetype?.name?.toUpperCase() || "";
      if (leaveTypeName === "DINAS LUAR") {
        // Jika Dinas Luar, status tetap terbaca Aktif (atau Dinas Luar) dan akses TIDAK dibatasi
        currentStatus = user.status; // Biarkan tetap "Aktif" agar bisa buka menu presensi
        isLimitedAccess = false;
      } else {
        // Jika Cuti / Izin Sakit, akses dibatasi
        currentStatus = "Cuti";
        isLimitedAccess = true;
      }
    }

    const profession = await Profession.findOne({
      where: { id: user.professionId },
    });
    const workShift = await WorkShift.findOne({
      where: { id: user.workShiftId },
    });
    const position = await Position.findOne({ where: { id: user.positionId } });

    // payload token
    const payload = {
      id: user.id,
      nip: user.nip,
      titlePrefix: user.titlePrefix,
      fullName: user.fullName,
      titleSuffix: user.titleSuffix,
      profession: profession.name,
      position: user.position,
      email: user.email,
      phone: user.phone,
      joinDate: user.joinDate,
      workShift: user.workShift,
      role: role.name,
      //   status: user.status,
      status: currentStatus, // Gunakan status dinamis yang baru dicek
      profilePhoto: user.profilePhoto,
      avatarUrl: user.profilePhoto
        ? `${BACKEND_URL}/uploads/profilePhotos/${user.profilePhoto}`
        : null,
    };
    console.log("data user ketika login (backend)", payload);

    // buat access token & refresh token
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      //   expiresIn: "7d", // diperpanjang jadi 7 hari
      expiresIn: "15m", // ✅ diperpanjang jadi 15 menit
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      // expiresIn: "30d", // refresh token aktif 30 hari
      expiresIn: "7d", // ✅ refresh token aktif 7 hari
    });

    // simpan refresh token ke database
    await User.update(
      { refresh_token: refreshToken },
      { where: { id: user.id } },
    );

    // simpan cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      // secure: process.env.NODE_ENV === "production", // pastikan secure true kalau pakai HTTPS
      sameSite: "lax",
      //   maxAge: 24 * 60 * 60 * 1000, // 1 hari
      maxAge: 7 * 24 * 60 * 60 * 1000, // ✅ 7 hari
    });

    // CEK STATUS USER
    // if (user.status == "Nonaktif") {
    if (currentStatus == "Nonaktif") {
      return res
        .status(403)
        .json({ message: "Akun Anda tidak aktif. Hubungi admin." });
      // } else if (user.status == "Cuti") {
    } else if (currentStatus == "Cuti") {
      // izinkan login, tapi beri flag agar fitur presensi tidak aktif
      return res.status(200).json({
        message: "Login berhasil (sedang cuti, akses terbatas)",
        accessToken, // Frontend HANYA menyimpan access token ini di memory
        // user: {
        //   id: user.id,
        //   nip: user.nip,
        //   titlePrefix: user.titlePrefix,
        //   fullName: user.fullName,
        //   titleSuffix: user.titleSuffix,
        //   profession: profession.name,
        //   position: user.position,
        //   email: user.email,
        //   phone: user.phone,
        //   joinDate: user.joinDate,
        //   workShift: user.workShift,
        //   role: role.name,
        //   status: user.status,
        //   profilePhoto: user.profilePhoto,
        //   avatarUrl: user.profilePhoto
        //     ? `http://localhost:3000/uploads/profilePhotos/${user.profilePhoto}`
        //     : null,
        // },
        user: payload,
        limited: true,
      });
    }

    res.status(200).json({
      message: `Login Berhasil (${device || "web"})`,
      accessToken,
      //   user: {
      //     nip: user.nip,
      //     id: user.id,
      //     titlePrefix: user.titlePrefix,
      //     fullName: user.fullName,
      //     titleSuffix: user.titleSuffix,
      //     profession: profession.name,
      //     position: user.position,
      //     email: user.email,
      //     phone: user.phone,
      //     joinDate: user.joinDate,
      //     workShift: user.workShift,
      //     role: role.name,
      //     status: user.status,
      //     profilePhoto: user.profilePhoto,
      //     avatarUrl: user.profilePhoto
      //       ? `http://localhost:3000/uploads/profilePhotos/${user.profilePhoto}`
      //       : null,
      //   },
      user: payload,
      limited: false,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Gagal login", error: e.message });
  }
};

export const StayLoggedIn = async (req, res) => {
  try {
    console.log("Isi req.user:", req.user);

    if (!req.user?.id) {
      return res.status(401).json({ message: "Token tidak valid" });
    }

    console.log("Isi req.user:", req.user);
    const user = await User.findOne({
      where: { id: req.user.id },
      attributes: [
        "id",
        "titlePrefix",
        "fullName",
        "titleSuffix",
        "nip",
        "email",
        "phone",
        "joinDate",
        "status",
        "employmentType",
        "profilePhoto",
      ],
      include: [
        {
          model: Position,
          attributes: ["id", "name"],
          required: false,
          include: [
            {
              model: Division,
              attributes: ["id", "name"],
              required: false,
              include: [
                {
                  model: Department,
                  attributes: ["id", "name"],
                  required: false,
                },
              ],
            },
          ],
        },
        { model: Profession, attributes: ["id", "name"] },
        {
          model: WorkShift,
          attributes: ["id", "name", "startTime", "endTime"],
          required: false,
        },
        { model: Role, attributes: ["id", "name"], required: false },
        {
          model: ShiftAssignment,
          attributes: ["id", "userId", "workShiftId", "date"],
          required: false,
          include: [
            {
              model: WorkShift,
              attributes: ["id", "name", "startTime", "endTime"],
              required: false,
            },
          ],
        },
      ],
    });

    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    const userData = user.toJSON();
    userData.avatarUrl = userData.profilePhoto
      ? `${BACKEND_URL}/uploads/profilePhotos/${userData.profilePhoto}`
      : null;

    res.status(200).json({ message: "Sesi valid", data: userData });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Token tidak valid", error: e.message });
  }
};

// export const LogOut = async (req, res) => {
//   // JWT tidak punya state server → logout hanya hapus token di client
//   console.log("Hapus token di client side");
//   res.status(200).json({ message: "Logout berhasil!" });
// };

// 22 mei 2026
export const LogOut = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res
      .status(204)
      .json({ message: "No content / Anda sudah logout sebelumnya" });
  const user = await User.findOne({ where: { refresh_token: refreshToken } });
  if (user) {
    // Hapus token di database
    await User.update({ refresh_token: null }, { where: { id: user.id } });
  }
  // Hapus cookie
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logout berhasil!" });
  console.log({ message: `Berhasil hapus token user! ${user.id}` });
};

export const ForgotPassword = async (req, res) => {
  try {
    // const { email } = req.body;
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email wajib diisi!" });
    }

    if (!JWT_RESET_SECRET) {
      throw new Error("JWT_RESET_SECRET belum tersedia pada server.");
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email tidak ditemukan!" });
    }

    // Buat token reset password, berlaku 15 menit
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      JWT_RESET_SECRET,
      { expiresIn: "15m" }, // 15 menit
    );

    const frontendUrl = FRONTEND_URL.replace(/\/$/, "");

    // Link reset password
    // const resetLink = `${FRONTEND_URL}/reset-password/${resetToken}`;
    const resetLink =
      `${frontendUrl}/reset-password/` + encodeURIComponent(resetToken);

    // Kirim email
    await sendEmail(
      user.email,
      "Notifikasi Reset Password RSBI",
      `Klik link berikut untuk reset password Anda:\n\n${resetLink}\n\nLink berlaku 15 menit`,
    );

    res.status(200).json({
      message: "Link reset password telah dikirim ke email Anda",
    });
  } catch (error) {
    console.error("Gagal memproses permintaan reset password!", {
      name: error.name,
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });
    res.status(500).json({
      message: "Gagal mengirim link reset password!",
    });
  }
};

export const ResetPassword = async (req, res) => {
  const { password } = req.body;

  if (!password || password.trim() === "") {
    return res.status(400).json({
      message: "Password tidak boleh kosong!",
    });
  }

  //   const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
  //   const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, dan angka!",
    });
  }

  try {
    // cek token validitasnya
    const user = await User.findOne({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    // hash password baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // update password user
    user.password = hashedPassword;

    // token sesi lama tidak dapat digunakan lagi
    user.refresh_token = null;
    await user.save();

    res.json({ message: "Password berhasil direset!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// 22 mei 2026
export const RefreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    // Jika tidak ada cookie, berarti sesi benar-benar habis (harus login ulang)
    if (!refreshToken)
      return res
        .status(401)
        .json({ message: "Sesi Anda telah habis, silakan login kembali" });

    // Gunakan findOne, bukan findAll untuk mencari 1 user
    const user = await User.findOne({ where: { refresh_token: refreshToken } });
    if (!user)
      return res.status(403).json({ message: "Refresh token tidak valid!" });

    // Verifikasi Refresh Token
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err)
          return res
            .status(403)
            .json({ message: "Refresh token kedaluwarsa!" });

        // Jika valid, terbitkan ACCESS TOKEN BARU (15 Menit lagi)
        const accessToken = jwt.sign(
          {
            id: user.id,
            nip: user.nip,
            titlePrefix: user.titlePrefix,
            fullName: user.fullName,
            titleSuffix: user.titleSuffix,
            profession: user.profession,
            position: user.position,
            email: user.email,
            phone: user.phone,
            joinDate: user.joinDate,
            workShift: user.workShift,
            role: decoded.role,
            status: user.status,
            profilePhoto: user.profilePhoto,
            avatarUrl: user.profilePhoto
              ? `${BACKEND_URL}/uploads/profilePhotos/${user.profilePhoto}`
              : null,
          },
          process.env.JWT_SECRET,
          { expiresIn: "15m" },
        );
        res.status(200).json({ accessToken });
      },
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error saat memperbarui token" });
  }
};

// login user dengan email
// export const Login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({
//       where: { email },
//       include: [{ model: Role, attributes: ["id", "name"] }],
//     });
//     if (!user)
//       return res.status(404).json({ message: "Email atau password salah" });

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) return res.status(400).json({ message: "Password salah" });

//     const role = await Role.findOne({ where: { id: user.roleId } });
//     if (!role) return res.status(404).json({ message: "Role tidak ditemukan" });

//     const allowedRoles = ["Admin", "Super Admin", "Supervisor", "Manager"];
//     if (!allowedRoles.includes(role.name))
//       return res.status(403).json({ message: "Akses ditolak" });

//     const payload = {
//       id: user.id,
//       email: user.email,
//       role: role.name,
//     };

//     const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
//       expiresIn: "8h",
//     });

//     const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
//       expiresIn: "7d",
//     });

//     await User.update(
//       { refresh_token: refreshToken },
//       { where: { id: user.id } }
//     );

//     res.cookie("refreshToken", refreshToken, {
//       httpOnly: true,
//       secure: false,
//       sameSite: "lax",
//       maxAge: 24 * 60 * 60 * 1000,
//     });

//     res.status(200).json({
//       message: "Login Berhasil",
//       accessToken,
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Gagal login", error: e.message });
//   }
// };

// tanpa refreh token
// export const Login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({
//       where: { email },
//       include: [{ model: Role, attributes: ["id", "name"] }],
//     });
//     if (!user)
//       return res.status(404).json({ message: "Email atau password salah" });

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) return res.status(400).json({ message: "Password salah" });

//     const role = await Role.findOne({ where: { id: user.roleId } });
//     if (!role) return res.status(404).json({ message: "Role tidak ditemukan" });

//     const allowedRoles = ["Admin", "Super Admin", "Supervisor", "Manager"];
//     if (!allowedRoles.includes(role.name))
//       return res.status(403).json({ message: "Akses ditolak" });

//     const token = jwt.sign(
//       {
//         id: user.id,
//         email: user.email,
//         role: user.role.name,
//       },
//       JWT_SECRET,
//       { expiresIn: "8h" }
//     );

//     res.status(200).json({
//       message: "Login Berhasil",
//       token,
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Gagal login", error: e.message });
//   }
// };
