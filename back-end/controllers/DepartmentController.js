// HANYA ADMIN DAN SUPERVISOR
import Department from "../models/DepartmentModel.js";
import Division from "../models/DivisionModel.js";

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll();
    if (departments.length === 0)
      return res.status(404).json({
        message: "Department tidak ditemukan",
        data: [],
      });
    res.status(200).json({
      message: "Berhasil menampilkan semua department",
      data: departments,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal menampilkan department",
      error: e.message,
    });
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department)
      return res.status(404).json({
        message: `Department dengan id ${req.params.id} tidak ditemukan`,
      });
    res.status(200).json({
      message: `Berhasil menampilkan department dengan id ${req.params.id}`,
      data: department,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal menampilkan department",
      error: e.message,
    });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({
        message: "Nama departemen tidak boleh kosong!",
      });
    }
    const department = await Department.create(req.body);
    res.status(201).json({
      message: "Berhasil menambahkan department",
      data: department,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal menambahkan department",
      error: e.message,
    });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        message: "Nama department harus diisi",
      });
    }

    const [updated] = await Department.update(
      { name },
      {
        where: { id: req.params.id },
      }
    );

    if (!updated) {
      return res.status(404).json({
        message: `Department dengan id ${req.params.id} tidak ditemukan!`,
      });
    }

    const updatedDepartment = await Department.findByPk(req.params.id);

    res.status(200).json({
      message: `Berhasil mengupdate department dengan id ${req.params.id}`,
      data: updatedDepartment,
    });
    // const [updated] = await Department.update(req.body, {
    //   where: { id: req.params.id },
    // });
    // if (updated === 0)
    //   return res.status(404).json({
    //     message: `Department dengan id ${req.params.id} tidak ditemukan`,
    //   });
    // const updatedDepartment = await Department.findByPk(req.params.id);
    // res.status(200).json({
    //   message: `Berhasil mengupdate department dengan id ${req.params.id}`,
    //   data: updatedDepartment,
    // });
  } catch (e) {
    res.status(500).json({
      message: "Gagal mengupdate department",
      error: e.message,
    });
  }
};

export const deleteDepartment = async (req, res) => {
  //   try {
  //     const deleted = await Department.destroy({ where: { id: req.params.id } });
  //     if (deleted === 0)
  //       return res.status(404).json({
  //         message: `Department dengan id ${req.params.id} tidak ditemukan`,
  //       });
  //     res.status(200).json({
  //       message: `Berhasil menghapus department dengan id ${req.params.id}`,
  //     });
  //   } catch (e) {
  //     res.status(500).json({
  //       message: "Gagal menghapus department",
  //       error: e.message,
  //     });
  //   }

  try {
    const id = req.params.id;
    const divisionCount = await Division.count({
      where: { departmentId: id },
    });

    if (divisionCount > 0) {
      return res.status(400).json({
        message: "Departemen masih memiliki divisi!",
      });
    }

    // Jika aman → hapus
    const deleted = await Department.destroy({
      where: { id },
    });

    if (deleted === 0) {
      return res.status(404).json({
        message: `Department dengan id ${id} tidak ditemukan`,
      });
    }

    res.status(200).json({
      message: `Berhasil menghapus department dengan id ${id}`,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal menghapus department",
      error: e.message,
    });
  }
};

// export const getDepartments = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     try {
//       const response = await Department.findAll();
//       if (response.length === 0) {
//         res.status(404).json({
//           message: "Department tidak ditemukan",
//           department: [],
//         });
//       } else {
//         res.status(200).json({
//           message: "Berhasil menampilkan semua department",
//           department: response,
//         });
//       }
//     } catch (e) {
//       res
//         .status(500)
//         .json({ message: "Gagal menampilkan department", error: e.message });
//     }
//   } else {
//     // selain admin dan super admin, akses ditolak
//     return res.status(403).json({
//       message: "Akses Ditolak. Anda tidak berhak melihat data departemen.",
//     });
//   }
// };

// export const getDepartmentById = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Supervisor" ||
//     req.role === "Manager"
//   ) {
//     try {
//       const { id } = req.params;
//       const department = await Department.findByPk(id);
//       if (!department) {
//         return res
//           .status(404)
//           .json({ message: `Department dengan id ${id} tidak ditemukan` });
//       } else {
//         res.status(200).json({
//           message: `Berhasil menampilkan departmen dengan id ${id}`,
//           department,
//         });
//       }
//     } catch (e) {
//       res
//         .status(500)
//         .json({ message: "gagal menampilkan department", error: e.message });
//     }
//   } else {
//     // selain admin dan super admin, akses ditolak
//     return res.status(403).json({
//       message: "Akses Ditolak. Anda tidak berhak melihat data departemen.",
//     });
//   }
// };

// export const createDepartment = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Manager" ||
//     req.role === "Supervisor"
//   ) {
//     try {
//       if (!req.body || Object.keys(req.body).length === 0) {
//         return res
//           .status(400)
//           .json({ message: "Data department tidak boleh kosong" });
//       }

//       const department = await Department.create(req.body);
//       res.status(201).json({
//         message: "Berhasil menambahkan department",
//         department: department,
//       });
//     } catch (e) {
//       res
//         .status(500)
//         .json({ message: "Gagal menambahkan department", error: e.message });
//     }
//   } else {
//     // selain admin dan super admin, akses ditolak
//     return res.status(403).json({
//       message: "Akses Ditolak. Anda tidak berhak menambahkan data departemen.",
//     });
//   }
// };

// export const updateDepartment = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Manager" ||
//     req.role === "Supervisor"
//   ) {
//     try {
//       const [updated] = await Department.update(req.body, {
//         where: {
//           id: req.params.id,
//         },
//       });
//       if (updated === 0) {
//         res.status(404).json({
//           message: `Department dengan id ${req.params.id} tidak ditemukan`,
//         });
//       }
//       const updatedDepartment = await Department.findByPk(req.params.id);
//       res.status(200).json({
//         message: `Berhasil mengupdate department dengan id ${req.params.id}`,
//         department: updatedDepartment,
//       });
//     } catch (e) {
//       res
//         .status(500)
//         .json({ message: "Gagal mengupdate department", error: e.message });
//     }
//   } else {
//     // selain admin dan super admin, akses ditolak
//     return res.status(403).json({
//       message: "Akses Ditolak. Anda tidak berhak melihat data user.",
//     });
//   }
// };

// export const deleteDepartment = async (req, res) => {
//   if (
//     req.role === "Admin" ||
//     req.role === "Super Admin" ||
//     req.role === "Manager" ||
//     req.role === "Supervisor"
//   ) {
//     try {
//       const deleted = await Department.destroy({
//         where: {
//           id: req.params.id,
//         },
//       });
//       if (deleted === 0) {
//         return;
//         res.status(404).json({
//           message: `Department dengan id ${req.params.id} tidak ditemukan`,
//         });
//       } else {
//         res.status(200).json({
//           message: `Berhasil menghapus department dengan id ${req.params.id}`,
//         });
//       }
//     } catch (e) {
//       res
//         .status(500)
//         .json({ message: "Gagal menghapus department", error: e.message });
//     }
//   } else {
//     // selain admin dan super admin, akses ditolak
//     return res.status(403).json({
//       message: "Akses Ditolak. Anda tidak berhak menghapus data departemen.",
//     });
//   }
// };

// const allowedRoles = ["Admin", "Super Admin", "Supervisor", "Manager"];

// bisa diakses semua role kecuali user
// export const getDepartments = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const departments = await Department.findAll();
//     if (departments.length === 0)
//       return res
//         .status(404)
//         .json({ message: "Department tidak ditemukan", data: [] });
//     res.status(200).json({
//       message: "Berhasil menampilkan semua department",
//       data: departments,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menampilkan department", error: e.message });
//   }
// };

// export const getDepartmentById = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const department = await Department.findByPk(req.params.id);
//     if (!department)
//       return res.status(404).json({
//         message: `Department dengan id ${req.params.id} tidak ditemukan`,
//       });
//     res.status(200).json({
//       message: `Berhasil menampilkan department dengan id ${req.params.id}`,
//       data: department,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menampilkan department", error: e.message });
//   }
// };

// export const createDepartment = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     if (!req.body || Object.keys(req.body).length === 0)
//       return res
//         .status(400)
//         .json({ message: "Data department tidak boleh kosong" });
//     const department = await Department.create(req.body);
//     res
//       .status(201)
//       .json({ message: "Berhasil menambahkan department", data: department });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menambahkan department", error: e.message });
//   }
// };

// export const updateDepartment = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const [updated] = await Department.update(req.body, {
//       where: { id: req.params.id },
//     });
//     if (updated === 0)
//       return res.status(404).json({
//         message: `Department dengan id ${req.params.id} tidak ditemukan`,
//       });
//     const updatedDepartment = await Department.findByPk(req.params.id);
//     res.status(200).json({
//       message: `Berhasil mengupdate department dengan id ${req.params.id}`,
//       data: updatedDepartment,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal mengupdate department", error: e.message });
//   }
// };

// export const deleteDepartment = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const deleted = await Department.destroy({ where: { id: req.params.id } });
//     if (deleted === 0)
//       return res.status(404).json({
//         message: `Department dengan id ${req.params.id} tidak ditemukan`,
//       });
//     res.status(200).json({
//       message: `Berhasil menghapus department dengan id ${req.params.id}`,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menghapus department", error: e.message });
//   }
// };
