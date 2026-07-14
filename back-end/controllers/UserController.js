import bcrypt from "bcrypt";
import { Op } from "sequelize";
import User from "../models/UserModel.js";
import Role from "../models/RoleModel.js";
import Position from "../models/PositionModel.js";
import Department from "../models/DepartmentModel.js";
import WorkShift from "../models/WorkShiftModel.js";
import Division from "../models/DivisionModel.js";
import Profession from "../models/ProfessionModel.js";

const JWT_SECRET = process.env.JWT_SECRET;

const getBackendUrl = (req) => {
  return (
    process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`
  ).replace(/\/$/, "");
};

const addAvatarUrl = (user, req) => {
  const data =
    typeof user?.get === "function" ? user.get({ plain: true }) : { ...user };

  data.avatarUrl = data.profilePhoto
    ? `${getBackendUrl(req)}/uploads/profilePhotos/${encodeURIComponent(
        data.profilePhoto,
      )}`
    : null;

  return data;
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.userId },
      attributes: [
        "id",
        "titlePrefix",
        "fullName",
        "titleSuffix",
        "nip",
        "email",
        "positionId",
        "professionId",
        "roleId",
        "status",
        "employmentType",
        "workShiftId",
        "profilePhoto",
      ],
      include: [Position, Role, WorkShift, Profession],
    });

    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
    const userData = addAvatarUrl(user, req);

    res
      .status(200)
      .json({ message: "Berhasil mengambil profil", data: userData });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal mengambil profil", error: e.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const response = await User.findAll({
      attributes: [
        "id",
        "titlePrefix",
        "fullName",
        "titleSuffix",
        "nip",
        "email",
        "phone",
        "joinDate",
        "roleId",
        "status",
        "employmentType",
        "workShiftId",
        "profilePhoto",
      ],
      include: [
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
        {
          model: Profession,
          attributes: ["id", "name"],
        },
        {
          model: Role,
          attributes: ["id", "name"],
        },
        {
          model: WorkShift,
          attributes: ["id", "name", "startTime", "endTime"],
        },
      ],
    });

    if (!response) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // avatarUrl untuk user
    // const usersWithAvatar = response.map((user) => {
    //   //   const u = user.toJSON();
    //   const u = user.get({ plain: true });
    //   u.avatarUrl = u.profilePhoto
    //     ? `http://localhost:3000/uploads/profilePhotos/${u.profilePhoto}`
    //     : null;
    //   return u;
    // });
    const usersWithAvatar = response.map((user) => addAvatarUrl(user, req));

    res.status(200).json({
      message: "Berhasil menampilkan semua data user",
      data: usersWithAvatar,
    });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ message: "Gagal mengambil data user", error: e.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const response = await User.findOne({
      attributes: [
        "id",
        "titlePrefix",
        "fullName",
        "titleSuffix",
        "nip",
        "positionId",
        "professionId",
        "email",
        "phone",
        "joinDate",
        "workShiftId",
        "roleId",
        "status",
        "employmentType",
        "profilePhoto",
      ],
      where: {
        //   empId: req.params.id, // pake empId string
        id: req.params.id, // pake integer urutan dari database
      },
      include: [
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
        { model: Profession, attributes: ["id", "name"] },
        { model: Role, attributes: ["id", "name"] },
        {
          model: WorkShift,
          attributes: ["id", "name", "startTime", "endTime"],
        },
      ],
    });
    if (!response) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // const userData = response.toJSON();
    // userData.avatarUrl = userData.profilePhoto
    //   ? `http://localhost:3000/uploads/profilePhotos/${userData.profilePhoto}`
    //   : null;

    const userData = addAvatarUrl(response, req);

    if (!response)
      return res.status(404).json({ message: "User tidak ditemukan" });
    res.status(200).json({
      message: "Berhasil menampilkan data user",
      data: userData,
    });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ message: "Gagal mengambil data user", error: e.message });
  }
};

export const createUser = async (req, res) => {
  console.log("Data yang diterima backend:", req.body);
  try {
    const {
      nip,
      titlePrefix,
      fullName,
      titleSuffix,
      positionId,
      professionId,
      email,
      phone,
      joinDate,
      workShiftId,
      employmentType,
      status,
      roleId,
      password,
    } = req.body;

    if (!nip) {
      return res.status(400).json({ message: "NIP wajib diisi!" });
    } else if (!fullName) {
      return res.status(400).json({ message: "Nama Lengkap wajib diisi!" });
    } else if (!email) {
      return res.status(400).json({ message: "Email wajib diisi!" });
    } else if (!positionId) {
      return res.status(400).json({ message: "Posisi wajib diisi!" });
    } else if (!professionId) {
      return res.status(400).json({ message: "Profesi wajib diisi!" });
    } else if (!roleId) {
      return res.status(400).json({ message: "Role wajib diisi!" });
    } else if (!password) {
      return res.status(400).json({ message: "Password wajib diisi!" });
    }

    if (!["Aktif", "Cuti", "Nonaktif"].includes(status)) {
      return res.status(400).json({ message: "Status Akun tidak valid!" });
    }
    if (!["Shift", "Non-Shift"].includes(employmentType)) {
      return res.status(400).json({ message: "Tipe Karyawan tidak valid!" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password minimal 8 karakter!" });
    } else if (password.length > 15) {
      return res
        .status(400)
        .json({ message: "Password maksimal 15 karakter!" });
    } else if (!password) {
      return res.status(400).json({ message: "Password tidak boleh kosong!" });
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message: "Password harus mengandung huruf besar, kecil, dan angka!",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profilePhotoPath = req.file ? req.file.filename : null;

    const newUser = await User.create({
      nip,
      titlePrefix,
      fullName,
      titleSuffix,
      positionId,
      professionId,
      email,
      phone,
      joinDate,
      workShiftId,
      employmentType,
      profilePhoto: profilePhotoPath,
      status,
      roleId,
      password: hashedPassword,
    });

    // const userData = newUser.toJSON();
    // userData.avatarUrl = profilePhotoPath
    //   ? `http://localhost:3000/uploads/profilePhotos/${profilePhotoPath}`
    //   : null;
    const userData = addAvatarUrl(newUser, req);

    res.status(201).json({
      message: "Berhasil menambahkan user",
      //   data: newUser,
      data: userData,
    });
  } catch (e) {
    console.error("Create user error:", e);
    if (e.name === "SequelizeUniqueConstraintError") {
      const field = e.errors[0].path;
      if (field === "nip") {
        return res
          .status(400)
          .json({ message: "NIP sudah digunakan oleh user lain!" });
      } else if (field === "email") {
        return res
          .status(400)
          .json({ message: "Email sudah digunakan oleh user lain!" });
      }
    }
    res
      .status(500)
      .json({ message: "Gagal menambahkan user", error: e.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const {
      nip,
      titlePrefix,
      fullName,
      titleSuffix,
      positionId,
      professionId,
      email,
      phone,
      joinDate,
      workShiftId,
      employmentType,
      status,
      roleId,
      password, // Password baru
    } = req.body;

    // 1. Cari User
    const user = await User.findByPk(req.params.id);
    if (!user)
      return res.status(404).json({ message: "User tidak ditemukan!" });

    // 2. Logika Update Password (Versi Admin)
    let hashedPassword = user.password;
    if (password && password.trim() !== "") {
      // Validasi Kompleksitas Password
      if (password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password minimal 8 karakter!" });
      } else if (password.length > 15) {
        return res
          .status(400)
          .json({ message: "Password maksimal 15 karakter!" });
      }
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            "Password harus mengandung huruf besar, huruf kecil, dan angka",
        });
      }

      // Admin tidak perlu currentPassword, langsung hash password baru
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // 3. Logika Foto Profil
    const profilePhoto = req.file ? req.file.filename : user.profilePhoto;

    // 4. Proses Update
    await User.update(
      {
        nip,
        titlePrefix,
        fullName: fullName || user.fullName,
        titleSuffix,
        positionId: positionId ? parseInt(positionId) : user.positionId,
        professionId: professionId ? parseInt(professionId) : user.professionId,
        email,
        phone,
        joinDate,
        workShiftId: workShiftId ? parseInt(workShiftId) : user.workShiftId,
        employmentType,
        profilePhoto,
        status,
        roleId: roleId ? parseInt(roleId) : user.roleId,
        password: hashedPassword,
      },
      {
        where: { id: req.params.id },
      },
    );

    // 5. Ambil data terbaru untuk dikembalikan ke Frontend
    const updatedData = await User.findOne({
      where: { id: req.params.id },
      attributes: { exclude: ["password"] }, // Jangan kirim hash password ke front-end
      include: [
        {
          model: Position,
          include: [{ model: Division, include: [Department] }],
        },
      ],
    });
    const userData = addAvatarUrl(updatedData, req);

    res.status(200).json({
      message: "Berhasil mengubah data user",
      // data: updatedData,
      data: userData,
    });
  } catch (e) {
    console.error(e);
    if (e.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Email sudah digunakan oleh user lain!" });
    }
    res
      .status(500)
      .json({ message: "Gagal mengupdate user", error: e.message });
  }
};

export const updateUserByMobile = async (req, res) => {
  try {
    const {
      nip,
      titlePrefix,
      fullName,
      titleSuffix,
      positionId,
      professionId,
      email,
      phone,
      joinDate,
      workShiftId,
      employmentType,
      status,
      roleId,
      password,
      currentPassword,
      departmentId,
      divisionId,
    } = req.body;

    console.log("REQ BODY:", req.body); // debug
    console.log("currentPassword:", currentPassword);
    console.log("password:", password);
    const response = await User.findOne({
      where: {
        id: req.params.id,
      },
    });
    if (!response)
      return res.status(404).json({ message: "User tidak ditemukan" });

    let hashedPassword = response.password;
    if (password) {
      // Jika user ingin mengganti password
      if (!currentPassword) {
        return res.status(400).json({
          message: "Password lama wajib diisi untuk mengganti password!",
        });
      }

      // Cek password lama
      const isMatch = await bcrypt.compare(currentPassword, response.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Password lama tidak sesuai!" });
      }

      if (password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password minimal 8 karakter!" });
      } else if (password.length > 15) {
        return res
          .status(400)
          .json({ message: "Password maksimal 15 karakter!" });
      } else {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        if (!passwordRegex.test(password)) {
          return res.status(400).json({
            message: "Password harus mengandung huruf besar, kecil, dan angka!",
          });
        }
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const profilePhoto = req.file ? req.file.filename : response.profilePhoto;
    const middleNameValue =
      req.body.fullName && req.body.fullName.trim() !== ""
        ? req.body.fullName
        : response.fullName; // pakai value lama kalau kosong

    await User.update(
      {
        nip,
        titlePrefix,
        fullName: middleNameValue,
        titleSuffix,
        positionId,
        professionId,
        email,
        phone,
        joinDate,
        workShiftId,
        employmentType,
        profilePhoto,
        status,
        roleId,
        currentPassword,
        password: hashedPassword,
      },
      {
        where: {
          id: req.params.id,
        },
      },
    );

    const updatedUser = await User.findOne({
      where: {
        id: req.params.id,
      },
      attributes: [
        "id",
        "nip",
        "titlePrefix",
        "fullName",
        "titleSuffix",
        "positionId",
        "professionId",
        "email",
        "phone",
        "joinDate",
        "workShiftId",
        "employmentType",
        "profilePhoto",
        "status",
        "roleId",
      ],
      include: [
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

    // const updatedUser = await User.findByPk(req.params.id);
    // const userData = updatedUser.toJSON();
    // userData.avatarUrl = userData.profilePhoto
    //   ? `http://localhost:3000/uploads/profilePhotos/${userData.profilePhoto}`
    //   : null;
    const userData = addAvatarUrl(updatedUser, req);

    res.status(200).json({
      message: "Berhasil mengubah data user",
      //   data: updatedUser,
      data: userData,
    });
  } catch (e) {
    console.error(e);
    if (e.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Email sudah digunakan oleh user lain" });
    }
    res
      .status(500)
      .json({ message: "Gagal mengupdate user", error: e.message });
  }
};

export const updateUserByNip = async (req, res) => {
  try {
    const {
      nip,
      titlePrefix,
      fullName,
      titleSuffix,
      positionId,
      professionId,
      email,
      phone,
      joinDate,
      workShiftId,
      employmentType,
      profilePhoto,
      status,
      roleId,
      password,
    } = req.body;

    const response = await User.findOne({
      where: {
        nip: req.params.id,
      },
    });
    if (!response)
      return res.status(404).json({ message: "User tidak ditemukan!" });

    let hashedPassword = response.password;
    if (password) {
      if (password.length < 8) {
        return res
          .status(404)
          .json({ message: "Password minimal 8 karakter!" });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }
    await User.update(
      {
        nip,
        titlePrefix,
        fullName,
        titleSuffix,
        positionId,
        professionId,
        email,
        phone,
        joinDate,
        workShiftId,
        employmentType,
        profilePhoto,
        status,
        roleId,
        password: hashedPassword,
      },
      {
        where: {
          nip: req.params.id,
        },
      },
    );
    const updatedUser = await User.findOne({
      where: {
        nip: req.params.id,
      },
      attributes: [
        "id",
        "nip",
        "titlePrefix",
        "fullName",
        "titleSuffix",
        "professionId",
        "positionId",
        "email",
        "phone",
        "joinDate",
        "workShiftId",
        "employmentType",
        "profilePhoto",
        "status",
        "roleId",
      ],
      include: [
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
    res.status(200).json({
      message: "Berhasil mengubah data user",
      data: updatedUser,
    });
  } catch (e) {
    console.log(e);
    if (e.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Email sudah digunakan oleh user lain" });
    }
    res
      .status(500)
      .json({ message: "Gagal mengambil data user", error: e.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const param = req.params.id;
    const whereClause = isNaN(param) ? { nip: param } : { id: param };
    const response = await User.findOne({ where: whereClause });
    if (!response) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    await User.destroy({ where: whereClause });
    res.status(200).json({ message: "Berhasil menghapus user" });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ message: "Gagal mengambil data user", error: e.message });
  }
};

export const searchUsers = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res
      .status(400)
      .json({ message: "Field pencarian tidak boleh kosong" });
  }

  try {
    const users = await User.findAll({
      attributes: [
        "id",
        "titlePrefix",
        "fullName",
        "titleSuffix",
        "nip",
        "email",
        "roleId",
        "status",
        "employmentType",
        "profilePhoto",
        "workShift",
      ],
      include: [
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
        { model: Role, attributes: ["id", "name"] },
        {
          model: WorkShift,
          attributes: ["id", "name", "startTime", "endTime"],
        },
        { model: Profession, attributes: ["id", "name"] },
      ],
      where: {
        [Op.or]: [
          { nip: { [Op.like]: `%${q}%` } },
          { titlePrefix: { [Op.like]: `%${q}%` } },
          { fullName: { [Op.like]: `%${q}%` } },
          { titleSuffix: { [Op.like]: `%${q}%` } },
        ],
      },
    });

    if (users.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.status(200).json(users);
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "Gagal mencari data user", error: e.message });
  }
};

//  generate password random
// function generatePassword(length = 8) {
//   const chars =
//     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
//   let password = "";
//   for (let i = 0; i < length; i++) {
//     password += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   return password;
// }

// LAMA DENGAN VALIDASI
// export const getUsers = async (req, res) => {
//   try {
//     let response;
//     if (
//       req.role === "Admin" ||
//       req.role === "Super Admin" ||
//       req.role === "Supervisor" ||
//       req.role === "Manager"
//     ) {
//       response = await User.findAll({
//         attributes: [
//           "id",
//           "name",
//           "empId",
//           //   "departmentId",
//           // "positionId",
//           "email",
//           "phone",
//           "joinDate",
//           // "workShiftId",
//           "roleId",
//           "status",
//         ],
//         include: [
//           {
//             model: Position,
//             attributes: ["id", "name"],
//             include: [
//               {
//                 model: Department,
//                 attributes: ["id", "name"],
//               },
//             ],
//           },
//           {
//             model: Role,
//             attributes: ["id", "name"],
//           },
//           {
//             model: WorkShift,
//             attributes: ["id", "name", "startTime", "endTime"],
//           },
//         ],
//       });
//     } else {
//       // selain admin dan super admin, akses ditolak
//       return res.status(403).json({
//         message: "Akses Ditolak. Anda tidak berhak melihat data user.",
//       });
//     }
//     res
//       .status(200)
//       .json({ message: "Berhasil menampilkan data absensi", data: response });
//   } catch (e) {
//     console.log(e);
//     res
//       .status(500)
//       .json({ message: "Gagal mengambil data user", error: e.message });
//   }
// };

// export const getUserById = async (req, res) => {
//   try {
//     let response;
//     if (
//       req.role === "Admin" ||
//       req.role === "Super Admin" ||
//       req.role === "Supervisor" ||
//       req.role === "Manager"
//     ) {
//       response = await User.findOne({
//         attributes: ["id", "name", "empId", "email", "roleId", "status"],
//         where: {
//           //   empId: req.params.id, // pake empId string
//           id: req.params.id, // pake integer urutan dari database
//         },
//         include: [{ model: Position }, { model: Role }, { model: WorkShift }],
//       });
//     } else {
//       // selain admin dan super admin, akses ditolak
//       return res.status(403).json({
//         message: "Akses Ditolak. Anda tidak berhak melihat data user.",
//       });
//     }
//     if (!response)
//       return res.status(404).json({ message: "User tidak ditemukan" });
//     res
//       .status(200)
//       .json({ message: "Berhasil menampilkan data user", data: response });
//   } catch (e) {
//     console.log(e);
//     res
//       .status(500)
//       .json({ message: "Gagal mengambil data user", error: e.message });
//   }
// };

// export const createUser = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     const {
//       name,
//       empId,
//       //   departmentId,
//       positionId,
//       email,
//       phone,
//       joinDate,
//       workShiftId,
//       status,
//       roleId,
//       password,
//     } = req.body;

//     if (
//       !name ||
//       !empId ||
//       //   !departmentId ||
//       !positionId ||
//       !email ||
//       !phone ||
//       !joinDate ||
//       !workShiftId ||
//       !status ||
//       !roleId ||
//       !password
//     ) {
//       return res.status(400).json({ message: "Semua field harus diisi" });
//     } else if (password.length < 8) {
//       return res.status(400).json({ message: "Password minimal 8 karakter" });
//     }

//     try {
//       const hashedPassword = await bcrypt.hash(password, 10);
//       await User.create({
//         name,
//         empId,
//         // departmentId,
//         positionId,
//         email,
//         phone,
//         joinDate,
//         workShiftId,
//         status,
//         roleId,
//         password: hashedPassword,
//       });

//       res
//         .status(201)
//         .json({ message: "Berhasil menambahkan user", data: req.body });
//     } catch (e) {
//       console.error(e);

//       if (e.name === "SequelizeUniqueConstraintError") {
//         const field = e.errors[0].path;
//         if (field === "empId") {
//           return res
//             .status(400)
//             .json({ message: "ID karyawan sudah digunakan" });
//         } else if (field === "email") {
//           return res
//             .status(400)
//             .json({ message: "Email sudah digunakan oleh user lain" });
//         }
//       }
//       res
//         .status(500)
//         .json({ message: "Gagal menambahkan user", error: e.message });
//     }
//   } else {
//     // selain admin dan super admin, akses ditolak
//     return res.status(403).json({
//       message: "Akses Ditolak. Anda tidak berhak melihat data user.",
//     });
//   }
// };

// export const updateUser = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     try {
//       //   const { id } = req.params;
//       const {
//         name,
//         empId,
//         // departmentId,
//         positionId,
//         email,
//         phone,
//         joinDate,
//         workShiftId,
//         status,
//         roleId,
//         password,
//       } = req.body;

//       const response = await User.findOne({
//         where: {
//           empId: req.params.id,
//         },
//       });
//       if (!response)
//         return res.status(404).json({ message: "User tidak ditemukan" });

//       let hashedPassword = response.password;
//       if (password) {
//         if (password.length < 8) {
//           return res
//             .status(404)
//             .json({ message: "Password minimal 8 karakter" });
//         }
//         hashedPassword = await bcrypt.hash(password, 10);
//       }
//       await User.update(
//         {
//           name,
//           // empId, // empId tidak bisa diubah
//           //   departmentId,
//           positionId,
//           email,
//           phone,
//           joinDate,
//           workShiftId,
//           status,
//           roleId,
//           password: hashedPassword,
//         },
//         {
//           where: {
//             empId: req.params.id,
//           },
//         }
//       );
//       // Ambil data yang sudah diperbarui dan kirim ke respons
//       const updatedUser = await User.findOne({
//         where: {
//           empId: req.params.id,
//         },
//         attributes: [
//           "id",
//           "name",
//           "empId",
//           //   "departmentId",
//           "positionId",
//           "email",
//           "phone",
//           "joinDate",
//           "workShiftId",
//           "roleId",
//           "status",
//         ],
//       });
//       res
//         .status(200)
//         .json({ message: "Berhasil mengubah data user", data: updatedUser });
//     } catch (e) {
//       console.log(e);
//       if (e.name === "SequelizeUniqueConstraintError") {
//         return res
//           .status(400)
//           .json({ message: "Email sudah digunakan oleh user lain" });
//       }
//       res
//         .status(500)
//         .json({ message: "Gagal mengambil data user", error: e.message });
//     }
//   } else {
//     // selain admin dan super admin, akses ditolak
//     return res.status(403).json({
//       message: "Akses Ditolak. Anda tidak berhak melihat data user.",
//     });
//   }
// };

// export const updateUserById = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     try {
//       const {
//         name,
//         empId,
//         positionId,
//         email,
//         phone,
//         joinDate,
//         workShiftId,
//         status,
//         roleId,
//         password,
//       } = req.body;

//       const response = await User.findOne({
//         where: {
//           id: req.params.id,
//         },
//       });

//       if (!response)
//         return res.status(404).json({ message: "User tidak ditemukan" });

//       let hashedPassword = response.password;
//       if (password) {
//         if (password.length < 8) {
//           return res
//             .status(400)
//             .json({ message: "Password minimal 8 karakter" });
//         }
//         hashedPassword = await bcrypt.hash(password, 10);
//       }

//       await User.update(
//         {
//           name,
//           empId, // kalau mau bisa diubah
//           positionId,
//           email,
//           phone,
//           joinDate,
//           workShiftId,
//           status,
//           roleId,
//           password: hashedPassword,
//         },
//         {
//           where: {
//             id: req.params.id,
//           },
//         }
//       );

//       const updatedUser = await User.findOne({
//         where: {
//           id: req.params.id,
//         },
//         attributes: [
//           "id",
//           "name",
//           "empId",
//           "positionId",
//           "email",
//           "phone",
//           "joinDate",
//           "workShiftId",
//           "roleId",
//           "status",
//         ],
//       });

//       res
//         .status(200)
//         .json({ message: "Berhasil mengubah data user", data: updatedUser });
//     } catch (e) {
//       console.error(e);
//       if (e.name === "SequelizeUniqueConstraintError") {
//         return res
//           .status(400)
//           .json({ message: "Email sudah digunakan oleh user lain" });
//       }
//       res
//         .status(500)
//         .json({ message: "Gagal mengupdate user", error: e.message });
//     }
//   } else {
//     return res.status(403).json({
//       message: "Akses Ditolak. Anda tidak berhak mengubah data user.",
//     });
//   }
// };

// export const deleteUser = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     try {
//       //   const response = await User.findOne({
//       //     where: {
//       //       empId: req.params.id,
//       //     },
//       //   });
//       //  if (!response)
//       //    return res.status(404).json({ message: "User tidak ditemukan" });
//       //   await User.destroy({
//       //     where: {
//       //       empId: req.params.id,
//       //       id: req.params.id,
//       //     },
//       //   });

//       const param = req.params.id;
//       const whereClause = isNaN(param) ? { empId: param } : { id: param };
//       const response = await User.findOne({ where: whereClause });
//       if (!response) {
//         return res.status(404).json({ message: "User tidak ditemukan" });
//       }

//       await User.destroy({ where: whereClause });
//       res.status(200).json({ message: "Berhasil menghapus user" });
//     } catch (e) {
//       console.log(e);
//       res
//         .status(500)
//         .json({ message: "Gagal mengambil data user", error: e.message });
//     }
//   } else {
//     // selain admin dan super admin, akses ditolak
//     return res.status(403).json({
//       message: "Akses Ditolak. Anda tidak berhak melihat data user.",
//     });
//   }
// };

// export const searchUsers = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     const { q } = req.query;

//     if (!q) {
//       return res
//         .status(400)
//         .json({ message: "Field pencarian tidak boleh kosong" });
//     }

//     try {
//       const users = await User.findAll({
//         attributes: ["name", "empId", "email", "roleId", "status"],
//         where: {
//           [Op.or]: [
//             { empId: { [Op.like]: `%${q}%` } },
//             { name: { [Op.like]: `%${q}%` } },
//           ],
//         },
//       });

//       if (users.length === 0) {
//         return res.status(404).json({ message: "User tidak ditemukan" });
//       }

//       res.status(200).json(users);
//     } catch (e) {
//       console.error(e);
//       res
//         .status(500)
//         .json({ message: "Gagal mencari data user", error: e.message });
//     }
//   } else {
//     // selain admin dan super admin, akses ditolak
//     return res.status(403).json({
//       message: "Akses Ditolak. Anda tidak berhak melihat data user.",
//     });
//   }
// };

// LAMA TANPA VALIDASI

// export const getUsers = async (req, res) => {
//   try {
//     const response = await User.findAll();
//     res
//       .status(200)
//       .json({ message: "Berhasil menampilkan semua user", user: response });
//   } catch (e) {
//     console.log(e.message);
//   }
// };

// export const getUserById = async (req, res) => {
//   try {
//     const response = await User.findOne({
//       where: {
//         id: req.params.id,
//       },
//     });
//     res.status(200).json({
//       message: `Berhasil menampilkan user dengan id ${req.params.id}`,
//       user: response,
//     });
//   } catch (e) {
//     console.log(e.message);
//   }
// };

// export const createUser = async (req, res) => {
//   try {
//     if (!req.body.password) {
//       return res.status(400).json({ message: "Password wajib diisi" });
//     }
//     await User.create(req.body);
//     res
//       .status(201)
//       .json({ message: "Berhasil menambahkan user", user: req.body });
//   } catch (e) {
//     res.status(500).json({ message: e.message });
//   }
// };

// export const updateUser = async (req, res) => {
//   try {
//     await User.update(req.body, {
//       where: {
//         id: req.params.id,
//       },
//     });
//     res.status(200).json({
//       message: `Berhasil mengupdate user dengan id ${req.params.id}`,
//     });
//   } catch (e) {
//     console.log(e.message);
//   }
// };

// export const deleteUser = async (req, res) => {
//   try {
//     await User.destroy({
//       where: {
//         id: req.params.id,
//       },
//     });
//     res
//       .status(200)
//       .json({ message: `Berhasil menghapus user dengan id ${req.params.id}` });
//   } catch (e) {
//     console.log(e.message);
//   }
// };
