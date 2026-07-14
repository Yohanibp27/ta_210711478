import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET; // link reset password

// Middleware: Verifikasi Token JWT
export const verifyUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Silakan masuk untuk mengakses halaman ini" });
  }
  const token = authHeader.split(" ")[1];
  //   console.log("token yg diterima (backend):", authHeader);
  if (!token) {
    return res.status(401).json({ message: "Token tidak ditemukan!" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.role = decoded.role;
    req.user = decoded; // Simpan payload token ke req.user
    next();
  } catch (e) {
    console.error(e);
    // kalo 500 Internal Server Error hanya digunakan kalo server error bukan auth error
    // res.status(401).json({ message: "Token tidak valid", error: e.message });
    if (e.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired!",
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(401).json({
      message: "Token tidak valid!",
      code: "INVALID_TOKEN",
    });
  }
};

export const verifyTokenForReset = (req, res, next) => {
  const { token } = req.params;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Token reset password tidak ditemukan!" });
  }

  if (!process.env.JWT_RESET_SECRET) {
    console.error("JWT_RESET_SECRET belum tersedia!");

    return res.status(500).json({
      message: "Konfigurasi reset password belum tersedia!",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_RESET_SECRET);
    req.userId = decoded.id; // simpan id user ke req
    req.resetEmail = decoded.email;
    next();
  } catch (e) {
    console.error("Token reset password tidak valid!", e.message);
    return res
      .status(401)
      .json({ message: "Token reset password tidak valid atau kedaluwarsa!" });
  }
};

export const alloweRoles = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.role) {
        return res.status(403).json({ message: "Role user tidak dikenali!" });
      }

      if (req.role === "Admin" || roles.includes(req.role)) {
        return next();
      }

      //   return res.status(403).json({ message: "Access denied!" });
      return res
        .status(403)
        .json({ message: "Anda tidak memiliki hak akses ke resource ini!" });
    } catch (e) {
      console.error("alloweRoles error:", e);
      return res
        .status(500)
        .json({ message: "Gagal memverifikasi role", error: e.message });
    }
  };
};

// untuk membatasi akses jika akun user sedang cuti
export const requireActiveStatus = (req, res, next) => {
  // Jika metode request BUKAN 'GET' (berarti POST, PUT, DELETE)
  // DAN status user adalah "Cuti", maka blokir!
  if (req.method !== "GET" && req.user.status === "Cuti") {
    return res.status(403).json({
      message: "Akses ditolak! Anda sedang dalam masa cuti (Akses Read-Only).",
    });
  }
  next(); // Jika aman, lanjutkan ke controller
};

// sama aja kaya verifyUser
// export const authMiddleware = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res
//       .status(401)
//       .json({ message: "Silakan masuk untuk mengakses halaman ini" });
//   }
//   const token = authHeader.split(" ")[1];
//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     if (!decoded.id) {
//       return res
//         .status(401)
//         .json({ message: "Token tidak valid: id tidak ditemukan" });
//     }

//     req.userId = decoded.id;
//     req.role = decoded.role || null;
//     next();
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Token tidak valid", error: e.message });
//   }
// };

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token tidak ditemukan" });
  }
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token tidak valid atau expired" });
  }
};

// Middleware sliding token
export const refreshTokenIfNeeded = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

  const token = authHeader.split(" ")[1];
  if (!token) return next();

  try {
    // decode token tanpa memvalidasi expired
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });

    const now = Date.now();
    const exp = decoded.exp * 1000; // convert ke ms
    const remaining = exp - now;

    // Jika token kurang dari 5 menit sisa, buat token baru
    if (remaining < 5 * 60 * 1000) {
      const newToken = jwt.sign(
        {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          titlePrefix: decoded.titlePrefix,
          fullName: decoded.fullName,
          titleSuffix: decoded.titleSuffix,
        },
        JWT_SECRET,
        { expiresIn: "15m" }, // sliding window 15 menit
      );
      // kirim token baru di header, frontend bisa baca
      res.setHeader("x-new-token", newToken);
    }

    req.user = decoded; // tetap simpan user di request
    next();
  } catch (err) {
    console.error("Sliding session error:", err);
    next(); // jangan hentikan request, biar token expired tetap bisa ditangani
  }
};
