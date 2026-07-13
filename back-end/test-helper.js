import { isUserOnLeave } from "./helpers/isUserOnLeave.js";
// import { LeaveRequest, LeaveType, LeaveSubType } from "../index.js";

async function testHelper() {
  try {
    console.log("--- MEMULAI PENGUJIAN HELPER ---");

    // Ganti dengan ID user dan tanggal yang ada di database Anda
    const testUserId = 1;
    const testDate = "2026-01-30";

    const result = await isUserOnLeave(testUserId, testDate);

    if (result) {
      console.log("✅ DATA DITEMUKAN:");
      console.log("- ID Pengajuan:", result.id);
      console.log("- Status:", result.finalStatus);

      // Cek apakah include leaveType berhasil
      if (result.leaveType) {
        console.log("- Jenis Izin:", result.leaveType.name);
      } else {
        console.log(
          "❌ ERROR: Alias 'leaveType' tidak terbaca. Periksa include di helper!",
        );
      }
    } else {
      console.log(
        "ℹ️ HASIL NULL: Tidak ada izin yang disetujui (approved) pada tanggal tersebut.",
      );
    }
  } catch (error) {
    console.error("❌ TERJADI ERROR SAAT TESTING:", error.message);
  } finally {
    process.exit();
  }
}

testHelper();
