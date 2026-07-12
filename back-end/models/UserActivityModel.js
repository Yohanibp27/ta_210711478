import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./UserModel.js";

const { DataTypes } = Sequelize;

const UserActivity = db.define(
  "userActivities",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    category: {
      type: DataTypes.ENUM("attendance", "leave", "shift_exchange"),
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM(
        "success",
        "submitted",
        "approved",
        "rejected",
        "completed",
        "late",
        "missed",
        "invalid",
      ),
      allowNull: false,
    },
    // ATTENDANCE (Presensi)
    // Kejadian	category	action
    // Presensi masuk tepat waktu	attendance	success
    // Presensi masuk terlambat	attendance	late
    // Presensi pulang berhasil	attendance	completed
    // Tidak presensi	attendance	missed
    // Dinas luar	attendance	success
    // Kejadian	category	action
    // Pengajuan dibuat	leave	submitted
    // Disetujui	leave	approved
    // Ditolak	leave	rejected
    // Selesai dijalankan	leave	completed
    // Kejadian	category	action
    // Pengajuan tukar	shift_exchange	submitted
    // Disetujui	shift_exchange	approved
    // Ditolak	shift_exchange	rejected

    // type: {
    //   type: DataTypes.ENUM(
    //     "shift_submission",
    //     "shift_approved",
    //     "shift_rejected",
    //     "checkin_success",
    //     "checkin_late",
    //     "checkout_missed",
    //     "checkin_missed",
    //     "leave_submitted",
    //     "leave_approved",
    //     "leave_rejected",
    //   ),
    //   allowNull: false,
    // },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true, // bisa merujuk ke shift_exchange.id atau attendance.id
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    freezeTableName: true,
    updatedAt: false, // tidak perlu kolom updatedAt
  },
);

UserActivity.belongsTo(User, { foreignKey: "userId" });
User.hasMany(UserActivity, { foreignKey: "userId" });

export default UserActivity;

// // PENGAJUAN IZIN, CUTI, DINAS LUAR
// 1. Saat baru mengajukan
// JUDUL: Pengajuan Cuti Tahunan / Izin / Dinas Luar Terkirim
// SUB JUDUL: Permintaan cuti tahunan 3 hari terkirim

// 2. Disetujui oleh Manager/SDM
// JUDUL: Pengajuan Cuti / Izin / Dinas Luar Disetujui
// SUB JUDUL: Pengajuan izin sakit disetujui oleh manager/jabatan

// 3. Ditolak oleh Manager/SDM
// JUDUL: Pengajuan Cuti / Izin / Dinas Luar Ditolak
// SUB JUDUL: Permintaan dinas disetujui oleh SDM/jabatan

///////////////////////////////////////////////////////////////////////////////////
// // PERTUKARAN SHIFT (PENGAJU)
// 1. Saat baru mengajukan
// JUDUL: Pengajuan Tukar Shift Terkirim
// SUB JUDUL: Pengajuan tukar shift dengan dr. Ahmad telah dikirim

// 2. Menunggu respons penerima
// JUDUL: Menunggu Persetujuan
// SUB JUDUL: Pengajuan tukar shift dengan dr. Ahmad sedang menunggu persetujuan

// 3. Disetujui
// JUDUL: Tukar Shift Disetujui
// SUB JUDUL: Pengajuan tukar shift dengan dr. Sarah telah disetujui

// JUDUL: Tukar Shift Ditolak
// SUH JUDUL: Pengajuan tukar shift dengan dr. Budi ditolak

// // PERTUKARAN SHIFT (PENERIMA)
// 1. Saat menerima permintaan
// JUDUL: Permintaan Tukar Shift
// SUB JUDUL: Anda menerima permintaan tukar shift dari dr. Ahmad

// 2. Belum direspons
// JUDUL: Belum direspons
// SUB JUDUL: Pengajuan tukar shift dari dr. Ahmad menunggu persetujuan Anda

// 3. Jika disetujui
// JUDUL: Tukar Shift Disetujui
// SUB JUDUL: Anda menyetujui pengajuan tukar shift dengan dr. Ahmad

// 4. Jika ditolak
// JUDUL: Tukar Shift Ditolak
// SUB JUDUL: Anda menolak pengajuan tukar shift dari dr. Ahmad

// // KONFIRMASI PERTUKARAN SHIFT (MANAGER)
// 1. Menunggu persetujuan Manager
// JUDUL: Menunggu Persetujuan Manager
// SUB JUDUL: Pengajuan tukar shift dengan dr. Ahmad sedang menunggu persetujuan Manager

// 2. Disetujui Manager
// JUDUL: Disetujui Manager
// SUB JUDUL: Pengajuan tukar shift dengan dr. Ahmad telah disetujui oleh Manager

// 3. Ditolak Manager
// JUDUL: Ditolak Manager
// SUB JUDUL: Pengajuan tukar shift dengan dr. Ahmad ditolak oleh Manager

// // KONFIRMASI PERTUKARAN SHIFT (SDM)
// 1. Menunggu persetujuan SDM
// JUDUL: Menunggu Persetujuan SDM
// SUB JUDUL: Pengajuan tukar shift dengan dr. Ahmad sedang menunggu persetujuan SDM

// 2. Jika disetujui
// JUDUL: Disetujui SDM
// SUB JUDUL: Pengajuan tukar shift dengan dr. Ahmad telah disetujui oleh SDM

// 3. Jika ditolak
// JUDUL: Ditolak SDM
// SUB JUDUL: Pengajuan tukar shift dengan dr. Ahmad ditolak oleh SDM

// ok persetujuan jadinya 3x, rekan, karu, dan sdm, tapi masalahnya 1 pada struktur organisasi yang udah aku buat
// ini adalah struktur dari rumah sakit baik tenaga medis atau karyawan biasa
// jabatan/posisi              | unit/divisi:            | fungsi/departemen:
// - Administrasi PDP          | Pdp Yanwat              | Subbid Yanwat
// - Analis Kesehatan          | Laboratorium            | Subbid Jangmedum
// - Apoteker                  |	Farmasi                 | Subbid Jangmedum
// -	Asisten Apoteker          | Farmasi                 |	Subbid Jangmedum
// -	Bidan Amarta              | Puri Amarta             |	Subbid Yanwat
// -	Bidan Cakra Kembang       | Puri Cakra Kembang      |	Subbid Yanwat
// -	Bidan Pdp                 |	Pdp Yanwat              | Subbid Yanwat
// -	Dokter Gigi               | Yanmed                  | Subbid Yanmeddokpol
// -	Dokter Spesialis          | Yanmed                  | Subbid Yanmeddokpol
// -	Dokter Umum               | Yanmed                  | Subbid Yanmeddokpol
// -	Driver                    | Ambulance               | Subbid Jangmedum
// -	Ka Ur Diklit              | Diklit                  | Subbag Binfung
// - Ka Ur Jangmed             | Jangum	                | Subbid Jangmedum
// - Ka Ur Keuangan            | Keuangan                |	Subbag Renmin
// - Ka Ur Min	Urmin           | Urmin                   | Subbag Renmin
// - Ka Ur SIM RM              | Sim & Rm                | Subbag Binfung
// -	Ka Ur Tu	                | Urtu	                  | Subbag Renmin
// -	Ka Ur Wasbin	            | Wasbin	                |	Subbag Wasintern
// -	Ka Ur Wasopyan	          | Wasopyan	              |	Subbag Wasintern
// -	Ka Ur Yanmed	            | Yanmed	                | Subbid Yanmeddokpol
// - Ka Ur Yanmeddokpol	      | Yanmed	                | Subbid Yanmeddokpol
// -	Ka Ur Yanwat	            | Pdp Yanwat	            | Subbid Yanwat
// - Karumkit	                | Kepala & Wakil Rumkit   | Ka-Waka Rumkit
// -	Kasubbag Binfung	        | Binfung	                | Subbag Binfung
// -	Kasubbag Renmin	          | Renmin                  | Subbag Renmin
// - Kasubbag Wasintern	      | Wasintern	              |	Subbag Wasintern
// -	Kasubbid Jangmedum	      | Jangum	                | Subbid Jangmedum
// -	Kaur Ren	                | Perencanaan	            | Subbag Renmin
// -	Koordinator Ambulance	    | Ambulance	              | Subbid Jangmedum
// -	Koordinator Cssd	        | Cssd                    | Subbid Jangmedum
// -	Koordinator Farmasi	      | Farmasi	                |	Subbid Jangmedum
// -	Koordinator Gizi	        | Gizi	                  |	Subbid Jangmedum
// -	Koordinator ICU	          | ICU	                    |	Subbid Yanwat
// -	Koordinator Kamar Operasi | Kamar Operasi	          |	Subbid Yanwat
// -	Koordinator Laboratorium  | Laboratorium            | Subbid Jangmedum
// - Koordinator NICU-PICU	    | NICU-PICU	              | Subbid Yanwat
// -	Koordinator Pdp	Pdp       | Yanwat	                | Subbid Yanwat
// -	Koordinator Pendaftaran	  | Pendaftaran	            | Subbag Binfung
// -	Koordinator Radiologi	    | Radiologi	              | Subbid Jangmedum
// -	Koordinator Sim & Rm	    | Sim & Rm	              |	Subbag Binfung
// - Perawat Amarta	          | Puri Amarta	            |	Subbid Yanwat
// -	Perawat Hd                | Poliklinik	            |	Subbid Yanwat
// -	Perawat ICU	              | ICU	                    |	Subbid Yanwat
// -	Perawat IGD	              | IGD	                    |	Subbid Yanwat
// -	Perawat Kamar Operasi     | Kamar Operasi	          | Subbid Yanwat
// -	Perawat NICU-PICU	        | NICU-PICU	              | Subbid Yanwat
// -	Perawat Pdp	Pdp           | Yanwat	                | Subbid Yanwat
// -	Perawat PK1	              | Puri Kencana 1	        |	Subbid Yanwat
// -	Perawat PK2	              | Puri Kencana 2	        |	Subbid Yanwat
// -	Perawat Poliklinik	      | Poliklinik	            |	Subbid Yanwat
// - Perawat Ponek IGD	        | Ponek IGD	              |	Subbid Yanwat
// -	Position Updated	        | Cssd	                  | Subbid Jangmedum
// -	Psikolog Pdp	            | Pdp Jangmedum	          | Subbid Jangmedum
// -	Psikolog Yanwat	          | Pdp Yanwat	            | Subbid Yanwat
// -	Radiografer	              | Radiologi               | Subbid Jangmedum
// - Staf Admin	              | Farmasi	                |	Subbid Jangmedum
// -	Staf Admin Gudang	        | Farmasi	                | Subbid Jangmedum
// -	Staf Cssd	                | Cssd	                  | Subbid Jangmedum
// -	Staf Diklit	              | Diklit	                | Subbag Binfung
// -	Staf Dokpol	              | Dokpol                  | Subbid Yanmeddokpol
// - Staf Gizi	                | Gizi	                  |	Subbid Jangmedum
// -	Staf Gizi	                | Jangum	                | Subbid Jangmedum
// -	Staf Humas	              | Humas	                  |	Subbag Binfung
// -	Staf IT	                  | IT	                    | Subbag Binfung
// -	Staf Jangum	              | Jangum                  | Subbid Jangmedum
// - Staf Kasir	              | Keuangan	              |	Subbag Renmin
// -	Staf Keuangan	            | Keuangan	              |	Subbag Renmin
// -	Staf Pdp	                | Pdp Yanwat	            | Subbid Yanwat
// -	Staf Ren	                | Perencanaan	            | Subbag Renmin
// -	Staf SIM RM	              | Pendaftaran             |	Subbag Binfung
// - Staf SIM RM	              | Sim & Rm	              |	Subbag Binfung
// -	Staf Urmin	              | Urmin	                  | Subbag Renmin
// -	Staf Urtu	                | Urtu	                  | Subbag Renmin
// -	Staf Wasbin	              | Wasbin	                |	Subbag Wasintern
// -	Staf Wasopyan	            | Wasopyan                |	Subbag Wasintern
// -	Teknisi Hd	              | Poliklinik	            | Subbid Yanwat
// -	Wakarumkit	              | Kepala & Wakil Rumkit   | Ka-Waka Rumkit

// SAAT INI ROLE SUDAH DITERAPKAN PADA
// DI  | ROLE        | JABATAN/POSISI
// 1   | Admin       | TIM IT/STAF IT)
// 2   | Super Admin | KEPALA & WAKIL RS
// 3   | Supervisor  | KEPALA SUBBAG RENMIN, WASINTERN, BINFUNG)
// 4   | Manager     | KEPALA URUSAN REN, MIN, SUBBID JANGMEDUM, SIM & RM, WASOPYAN, JANGMED, DIKLIT, URTU, YANWAT, KEUANGAN, WASBIN, YANMED, YANMEDDOKPOL
// 5   | User        | SEMUA KARYAWAN DAN TENAGA MEDIS

// Jika Unit/Divisi Pengaju Adalah...                         | Maka "Karu" yang Menyetujui Adalah...
// Farmasi, Laboratorium, Radiologi, Gizi, CSSD, Ambulance    | User dengan jabatan Koordinator di unit tersebut
// ICU, Kamar Operasi, NICU-PICU, IGD, Puri Amarta, dsb       | User dengan jabatan Koordinator di unit tersebut
// SIM & RM, Diklit, Pendaftaran, IT                          | User dengan jabatan Kaur (Ka Ur) di unit tersebut
// Keuangan, Perencanaan, Urmin, Urtu                         | User dengan jabatan Kaur (Ka Ur) di unit tersebut

// import { Sequelize } from "sequelize";
// import db from "../config/Database.js";

// const { DataTypes } = Sequelize;

// const User = db.define(
//   "users",
//   {
//     titlePrefix: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     fullName: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       validate: {
//         notEmpty: true,
//       },
//     },
//     titleSuffix: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     nip: {
//       type: DataTypes.STRING,
//       unique: true, //  unik per user
//       allowNull: false,
//       validate: {
//         notEmpty: true,
//       },
//     },
//     professionId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: "professions",
//         key: "id",
//       },
//     },
//     positionId: {
//       // User → Position → Division → Department (NESTEED)
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: "positions",
//         key: "id",
//       },
//     },
//     email: {
//       type: DataTypes.STRING,
//       allowNull: true, // sebelumnya false: tidak boleh kosong
//       unique: true, // email sebaiknya unik
//       validate: {
//         // notEmpty: false, // sebelumnya true: tidak boleh kosong
//         isEmail: true,
//       },
//     },
//     phone: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       validate: {
//         notEmpty: true,
//         isNumeric: true,
//         len: [10, 15],
//       },
//     },
//     joinDate: {
//       type: DataTypes.DATEONLY,
//       allowNull: false,
//       validate: {
//         notEmpty: true,
//       },
//     },
//     workShiftId: {
//       type: DataTypes.INTEGER,
//       allowNull: true, // karna setiap user non-shift punya jam kerja, tapi user shift ga bergantung ke work shift
//       //   defaultValue: 1, // id shift pagi default untuk karyawan non-shift
//       references: {
//         model: "workShifts",
//         key: "id",
//       },
//     },
//     employmentType: {
//       type: DataTypes.ENUM("Non-Medis", "Medis"),
//       allowNull: false,
//       defaultValue: "Non-Medis", // default: PNS/Polri
//     },
//     status: {
//       type: DataTypes.ENUM("Aktif", "Nonaktif"), // jangan ada cuti, karena cuti masuknya ke logika presensi
//       allowNull: false,
//       defaultValue: "Aktif",
//     },
//     roleId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: "roles",
//         key: "id",
//       },
//     },
//     password: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       validate: {
//         notEmpty: true,
//         // len: [8, 15], // antara 8 - 15 karakter
//       },
//     },
//     leaveStatus: {
//       // status cuti user jika sedang cuti dari pengajuan cuti yang disetujui
//       type: DataTypes.ENUM("none", "on_leave"),
//       defaultValue: "none",
//     },
//     profilePhoto: {
//       // simpah foto profile user
//       type: DataTypes.TEXT,
//       allowNull: true,
//       defaultValue: null,
//     },
//     refresh_token: {
//       type: DataTypes.TEXT,
//       allowNull: true, // JWT refresh token bisa kosong awalnya
//     },
//   },
//   {
//     freezeTableName: true,
//   },
// );

// export default User;

// import { Sequelize } from "sequelize";
// import db from "../config/Database.js";
// import User from "./UserModel.js";
// import ShiftAssignment from "./ShiftAssignmentModel.js";

// const { DataTypes } = Sequelize;

// const ShiftExchange = db.define(
//   "shiftExchanges",
//   {
//     requesterId: {
//       // tenaga medis yang meminta tukar
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: { model: User, key: "id" },
//     },
//     partnerId: {
//       // tenaga medis yang ditukar
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: { model: User, key: "id" },
//     },
//     requesterShiftId: {
//       // shift asli si requester
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: { model: ShiftAssignment, key: "id" },
//     },
//     partnerShiftId: {
//       // shift asli si partner
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: { model: ShiftAssignment, key: "id" },
//     },
//     reason: {
//       // alasan pengaju melakukan pertukaran shift
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     approvedBy: {// misal supervisor atau admin
//       type: DataTypes.INTEGER,
//       allowNull: true,
//       references: { model: User, key: "id" },
//     },
//     decisionNote: {
//       // alasan disetujui/ditolak, wajib ada alasan ditolak
//       type: DataTypes.STRING,
//       allowNull: true, // boleh kosong jika pengajuan disetujui
//       comment: "Catatan persetujuan atau penolakan dari admin/supervisor",
//     },
//     expiryDate: {
//       type: DataTypes.DATE,
//       allowNull: false,
//     },
//     status: {
//       // status akhir pengajuan
//       type: DataTypes.ENUM("Pending", "Disetujui", "Ditolak"),
//       defaultValue: "Pending",
//     },
//   },
//   { freezeTableName: true },
// );

// User.hasMany(ShiftExchange, {
//   foreignKey: "requesterId",
//   as: "requestedExchanges",
// });
// User.hasMany(ShiftExchange, {
//   foreignKey: "partnerId",
//   as: "receivedExchanges",
// });
// ShiftExchange.belongsTo(User, { foreignKey: "requesterId", as: "requester" });
// ShiftExchange.belongsTo(User, { foreignKey: "partnerId", as: "partner" });

// ShiftExchange.belongsTo(ShiftAssignment, {
//   foreignKey: "requesterShiftId",
//   as: "requesterShift",
// });

// ShiftExchange.belongsTo(ShiftAssignment, {
//   foreignKey: "partnerShiftId",
//   as: "partnerShift",
// });

// export default ShiftExchange;
