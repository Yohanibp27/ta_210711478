// HANYA ADMIN DAN SUPERVISOR
import Profession from "../models/ProfessionModel.js";
import User from "../models/UserModel.js";

export const getProfessions = async (req, res) => {
  try {
    const professions = await Profession.findAll();
    if (professions.length === 0) {
      return res
        .status(404)
        .json({ message: "Profesi tidak ditemukan", data: [] });
    }
    res.status(200).json({
      message: "Berhasil menampilkan semua profesi",
      data: professions,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menampilkan profesi", error: e.message });
  }
};

export const getProfessionById = async (req, res) => {
  try {
    const profession = await Profession.findByPk(req.params.id);
    if (!profession) {
      return res.status(404).json({
        message: `Profesi dengan id ${req.params.id} tidak ditemukan`,
      });
    }
    res.status(200).json({
      message: `Berhasil menampilkan profesi dengan id ${req.params.id}`,
      data: profession,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menampilkan profesi", error: e.message });
  }
};

export const createProfession = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Nama profesi tidak boleh kosong!" });
    }
    const profession = await Profession.create(req.body);
    res
      .status(201)
      .json({ message: "Berhasil menambahkan profesi", data: profession });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal menambahkan profesi", error: e.message });
  }
};

export const updateProfession = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Nama profesi harus diisi" });
    }
    const [updated] = await Profession.update(req.body, {
      where: { id: req.params.id },
    });
    if (updated === 0) {
      return res.status(404).json({
        message: `Profesi dengan id ${req.params.id} tidak ditemukan`,
      });
    }
    const updatedProfession = await Profession.findByPk(req.params.id);
    res.status(200).json({
      message: `Berhasil mengupdate profesi dengan id ${req.params.id}`,
      data: updatedProfession,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal mengupdate profesi", error: e.message });
  }
};

export const deleteProfession = async (req, res) => {
  //   try {
  //     const deleted = await Profession.destroy({ where: { id: req.params.id } });
  //     if (deleted === 0) {
  //       return res.status(404).json({
  //         message: `Profesi dengan id ${req.params.id} tidak ditemukan`,
  //       });
  //     }
  //     res.status(200).json({
  //       message: `Berhasil menghapus profesi dengan id ${req.params.id}`,
  //     });
  //   } catch (e) {
  //     res
  //       .status(500)
  //       .json({ message: "Gagal menghapus profesi", error: e.message });
  //   }

  try {
    const id = req.params.id;
    const userCount = await User.count({
      where: { professionId: id },
    });

    if (userCount > 0) {
      return res.status(400).json({
        message: "Profesi masih memiliki user!",
      });
    }

    // Jika aman → hapus
    const deleted = await Profession.destroy({
      where: { id },
    });

    if (deleted === 0) {
      return res.status(404).json({
        message: `Profesi dengan id ${id} tidak ditemukan`,
      });
    }

    res.status(200).json({
      message: `Berhasil menghapus profesi dengan id ${id}`,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal menghapus profesi",
      error: e.message,
    });
  }
};

// const allowedRoles = ["Admin", "Super Admin", "Supervisor", "Manager"];
// export const getProfessions = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const professions = await Profession.findAll();
//     if (professions.length === 0)
//       return res
//         .status(404)
//         .json({ message: "Profesi tidak ditemukan", data: [] });
//     res.status(200).json({
//       message: "Berhasil menampilkan semua profesi",
//       data: professions,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menampilkan profesi", error: e.message });
//   }
// };

// export const getProfessionById = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const profession = await Profession.findByPk(req.params.id);
//     if (!profession)
//       return res.status(404).json({
//         message: `Profesi dengan id ${req.params.id} tidak ditemukan`,
//       });
//     res.status(200).json({
//       message: `Berhasil menampilkan profesi dengan id ${req.params.id}`,
//       data: profession,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menampilkan profesi", error: e.message });
//   }
// };

// export const createProfession = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     if (!req.body || Object.keys(req.body).length === 0)
//       return res
//         .status(400)
//         .json({ message: "Data profesi tidak boleh kosong" });
//     const profession = await Profession.create(req.body);
//     res
//       .status(201)
//       .json({ message: "Berhasil menambahkan profesi", data: profession });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menambahkan profesi", error: e.message });
//   }
// };

// export const updateProfession = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const [updated] = await Profession.update(req.body, {
//       where: { id: req.params.id },
//     });
//     if (updated === 0)
//       return res.status(404).json({
//         message: `Profesi dengan id ${req.params.id} tidak ditemukan`,
//       });
//     const updatedProfession = await Profession.findByPk(req.params.id);
//     res.status(200).json({
//       message: `Berhasil mengupdate profesi dengan id ${req.params.id}`,
//       data: updatedProfession,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal mengupdate profesi", error: e.message });
//   }
// };

// export const deleteProfession = async (req, res) => {
//   if (!allowedRoles.includes(req.role))
//     return res.status(403).json({ message: "Forbidden" });
//   try {
//     const deleted = await Profession.destroy({ where: { id: req.params.id } });
//     if (deleted === 0)
//       return res.status(404).json({
//         message: `Profesi dengan id ${req.params.id} tidak ditemukan`,
//       });
//     res.status(200).json({
//       message: `Berhasil menghapus profesi dengan id ${req.params.id}`,
//     });
//   } catch (e) {
//     res
//       .status(500)
//       .json({ message: "Gagal menghapus profesi", error: e.message });
//   }
// };
