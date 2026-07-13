// penyimpanan kuota cuti
import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./UserModel.js";
import LeaveSubType from "./LeaveSubTypeModel.js";

const { DataTypes } = Sequelize;

// logika sisa cuti, tidak disimpan pada database hanya dikalkulasikan secara dinamis (totalQUota - usedQuota) di level controller atau frontend

// sistem flow (alur proses): alur pengajuan cuti melibatkan validasi kuota harus dirancang dengan pendekatan multi-layer validation (validasi frontend dan backend)
// Tahap 1: Inisialisasi Halaman (Front-End)
// * Saat user membuka LeaveFormPage, Flutter memanggil endpoint API (misal: GET /api/leave-quota/:userId).
// * Data sisa kuota ini kemudian disuntikkan ke dalam _buildInfoBanner() menggantikan teks hardcode tadi.
// Tahap 2: Pengisian Form & Validasi Lokal (Front-End)
// * Ketika user memilih tanggalMulai dan tanggalSelesai, kamu sudah memiliki variabel durasi.
// * Tambahkan logika di fungsi _validateForm(): Jika durasi > Sisa Kuota, maka form menjadi error dan tombol ajukan dinonaktifkan (atau munculkan alert "Sisa kuota tidak mencukupi").
// Tahap 3: Pengajuan & Validasi Back-End (Krusial)
// * Saat tombol diklik, data dikirim melalui fungsi _submitToApi() ke Node.js.
// * Jangan pernah hanya percaya pada validasi Flutter. Di controller Node.js, sebelum melakukan LeaveRequest.create(), sistem harus mengecek ulang database UserLeaveQuota untuk memastikan sisa kuotanya masih cukup.
// * Jika cukup, buat data di LeaveRequest dengan status pending_manager.
// Tahap 4: Pemotongan Kuota (Pengurangan)
// * Kapan kuota dipotong? Ini adalah pertanyaan krusial dalam perancangan arsitektur sistem. Ada dua pendekatan, namun untuk alur HTTP Request-Response biasa, saya merekomendasikan pendekatan ini:
// Soft Deduction (Saat Pending): Saat status pending_manager dibuat, tambahkan usedQuota sebesar durasi pengajuan. Ini mencegah user melakukan spam pengajuan di hari yang sama melebihi sisa kuotanya.
// * Rollback (Jika Ditolak): Jika manajer tidak menyetujui (rejected_manager) atau SDM menolak (rejected_sdm), sistem harus mengembalikan kuota tersebut (mengurangi kembali nilai usedQuota).
// * Finalisasi: Jika status mencapai approved_sdm atau completed, kuota sudah terpotong secara permanen.

const UserLeaveQuota = db.define(
  "userLeaveQuotas",
  {
    userId: {
      // relasi ke tabel user
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    leaveSubTypeId: {
      // biasanya hanya cuti tahunan yang memiliki batasan kuota pasti, sedangkan izi tidak dibatasi kuota tapi butuh surat dokter/keterangan
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "leavesubtypes",
        key: "id",
      },
    },
    year: {
      // tahun periode cuti, misal 2026
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    totalQuota: {
      // jatah cuti dalam setahun, misal 12 hari
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12, // Standar jatah cuti tahunan
    },
    usedQuota: {
      // Cuti yang sudah digunakan atau sedang dalam proses pengajuan
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    freezeTableName: true,
    tableName: "userleavequotas",
  },
);

export default UserLeaveQuota;

User.hasMany(UserLeaveQuota, { foreignKey: "userId" });
UserLeaveQuota.belongsTo(User, { foreignKey: "userId", as: "user" });

LeaveSubType.hasMany(UserLeaveQuota, { foreignKey: "leaveSubTypeId" });
UserLeaveQuota.belongsTo(LeaveSubType, { foreignKey: "leaveSubTypeId" });
