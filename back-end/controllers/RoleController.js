// HANYA ADMIN DAN SUPERVISOR
import Role from "../models/RoleModel.js";

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    if (roles.length === 0) {
      return res
        .status(404)
        .json({ message: "Role tidak ditemukan", data: [] });
    }
    res
      .status(200)
      .json({ message: "Berhasil menampilkan semua role", data: roles });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menampilkan role", error: e.message });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role)
      return res
        .status(404)
        .json({ message: `Role dengan id ${req.params.id} tidak ditemukan` });
    res.status(200).json({
      message: `Berhasil menampilkan role dengan id ${req.params.id}`,
      data: role,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menampilkan role", error: e.message });
  }
};

export const createRole = async (req, res) => {
  try {
    // if (!req.body || Object.keys(req.body).length === 0) {
    //   return res.status(400).json({ message: "Data role tidak boleh kosong!" });
    // }
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Nama role tidak boleh kosong!" });
    }
    const role = await Role.create(req.body);
    res.status(201).json({ message: "Berhasil membuat role", data: role });
  } catch (e) {
    res.status(500).json({ message: "Gagal membuat role", error: e.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const [updated] = await Role.update(req.body, {
      where: { id: req.params.id },
    });
    if (updated === 0)
      return res
        .status(404)
        .json({ message: `Role dengan id ${req.params.id} tidak ditemukan` });
    const updatedRole = await Role.findByPk(req.params.id);
    res.status(200).json({
      message: `Berhasil mengupdate role dengan id ${req.params.id}`,
      data: updatedRole,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal mengupdate role", error: e.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const deleted = await Role.destroy({ where: { id: req.params.id } });
    if (deleted === 0)
      return res
        .status(404)
        .json({ message: `Role dengan id ${req.params.id} tidak ditemukan` });
    res
      .status(200)
      .json({ message: `Berhasil menghapus role dengan id ${req.params.id}` });
  } catch (e) {
    res.status(500).json({ message: "Gagal menghapus role", error: e.message });
  }
};

// const allowedRoles = ["Admin", "Super Admin", "Supervisor", "Manager"];
// export const getRoles = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     try {
//       const response = await Role.findAll();
//       if (response.length === 0) {
//         return res
//           .status(404)
//           .json({ message: "Role tidak ditemukan", role: [] });
//       } else {
//         res.status(200).json({
//           message: "Berhasil menampilkan semua role",
//           role: response,
//         });
//       }
//     } catch (e) {
//       res
//         .status(500)
//         .json({ message: "Gagal menampilkan role", error: e.message });
//     }
//   } else {
//     // Jika bukan admin, kembalikan respons 403 Forbidden
//     res.status(403).json({ message: "Forbidden" });
//   }
// };

// export const getRoleById = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     try {
//       const response = await Role.findByPk(req.params.id);
//       if (!response) {
//         return res
//           .status(404)
//           .json({ message: `Role dengan id ${req.params.id} tidak ditemukan` });
//       } else {
//         res.status(200).json({
//           message: `Berhasil menampilkan role dengan id ${req.params.id}`,
//           response,
//         });
//       }
//     } catch (e) {
//       res
//         .status(500)
//         .json({ message: "Gagal menampilkan role", error: e.message });
//     }
//   } else {
//     // Jika bukan admin, kembalikan respons 403 Forbidden
//     res.status(403).json({ message: "Forbidden" });
//   }
// };

// export const createRole = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     try {
//       if (!req.body || Object.keys(req.body).length === 0) {
//         return res
//           .status(400)
//           .json({ message: "Data role tidak boleh kosong" });
//       }

//       const response = await Role.create(req.body);
//       res
//         .status(201)
//         .json({ message: "Berhasil membuat role", role: response });
//     } catch (e) {
//       res.status(500).json({ message: "Gagal membuat role", error: e.message });
//     }
//   } else {
//     // Jika bukan admin, kembalikan reponse 403 Forbidden
//     res.status(403).json({ message: "Forbidden" });
//   }
// };

// export const updateRole = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     try {
//       const [response] = await Role.update(req.body, {
//         where: {
//           id: req.params.id,
//         },
//       });
//       if (response === 0) {
//         return res
//           .status(400)
//           .json({ message: `Role dengan id ${req.params.id} tidak ditemukan` });
//       } else {
//         res.status(200).json({
//           message: `Berhasil mengupdate role dengan id ${req.params.id}`,
//           response,
//         });
//       }
//     } catch (e) {
//       res
//         .status(500)
//         .json({ message: "Gagal mengupdate role", error: e.message });
//     }
//   } else {
//     // Jika bukan admin, kembalikan reponse 403 Forbidden
//     res.status(403).json({ message: "Forbidden" });
//   }
// };

// export const deleteRole = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     try {
//       const response = await Role.destroy({
//         where: {
//           id: req.params.id,
//         },
//       });
//       if (response === 0) {
//         return res.status(404).json({
//           message: `Role dengan id ${req.params.id} tidak ditemukan`,
//         });
//       } else {
//         res.status(200).json({
//           message: `Berhasil menghapus role dengan id ${req.params.id}`,
//         });
//       }
//     } catch (e) {
//       res
//         .status(500)
//         .json({ message: "Gagal menghapus role", error: e.message });
//     }
//   } else {
//     // Jika bukan admin, kembalikan reponse 403 Forbidden
//     res.status(403).json({ message: "Forbidden" });
//   }
// };

// TANPA VALIDASI
// import Role from "../models/RoleModel.js";

// export const getRoles = async (req, res) => {
//   try {
//     const response = await Role.findAll();
//     if (response.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "Role tidak ditemukan", role: [] });
//     } else {
//       res
//         .status(200)
//         .json({ message: "Berhasil menampilkan semua role", role: response });
//     }
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menampilkan role", error: e.message });
//   }
// };

// export const getRoleById = async (req, res) => {
//   try {
//     const response = await Role.findByPk(req.params.id);
//     if (!response) {
//       return res
//         .status(404)
//         .json({ message: `Role dengan id ${req.params.id} tidak ditemukan` });
//     } else {
//       res.status(200).json({
//         message: `Berhasil menampilkan role dengan id ${req.params.id}`,
//         response,
//       });
//     }
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menampilkan role", error: e.message });
//   }
// };

// export const createRole = async (req, res) => {
//   try {
//     if (!req.body || Object.keys(req.body).length === 0) {
//       return res.status(400).json({ message: "Data role tidak boleh kosong" });
//     }

//     const response = await Role.create(req.body);
//     res.status(201).json({ message: "Berhasil membuat role", role: response });
//   } catch (e) {
//     res.status(500).json({ message: "Gagal membuat role", error: e.message });
//   }
// };

// export const updateRole = async (req, res) => {
//   try {
//     const [response] = await Role.update(req.body, {
//       where: {
//         id: req.params.id,
//       },
//     });
//     if (response === 0) {
//       return res
//         .status(400)
//         .json({ message: `Role dengan id ${req.params.id} tidak ditemukan` });
//     } else {
//       res.status(200).json({
//         message: `Berhasil mengupdate role dengan id ${req.params.id}`,
//         response,
//       });
//     }
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal mengupdate role", error: e.message });
//   }
// };

// export const deleteRole = async (req, res) => {
//   try {
//     const response = await Role.destroy({
//       where: {
//         id: req.params.id,
//       },
//     });
//     if (response === 0) {
//       return res
//         .status(404)
//         .json({ message: `Role dengan id ${req.params.id} tidak ditemukan` });
//     } else {
//       res.status(200).json({
//         message: `Berhasil menghapus role dengan id ${req.params.id}`,
//       });
//     }
//   } catch (e) {
//     res.status(500).json({ message: "Gagal menghapus role", error: e.message });
//   }
// };
