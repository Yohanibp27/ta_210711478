import React from "react";
import {
  formatDateIndo,
  formatToDatetimeLocalComplete,
} from "../../../utils/dateHelper.js";
import { FaTimes } from "react-icons/fa";

// Fungsi Pembantu: Mengambil koordinat dan membuat URL embed
const getGoogleMapsEmbedUrl = (locationString) => {
  // Asumsi: locationString adalah "latitude, longitude" (misal: "-6.30, 107.80")
  if (!locationString || locationString.includes("Manual")) return null;
  const coords = locationString.trim();
  // Gunakan URL Embed Google Maps. Ini TIDAK memerlukan API Key,
  // tetapi memiliki batasan styling yang lebih sedikit.
  return `https://maps.google.com/maps?q=${coords}&z=15&output=embed`;
};

const openBase64InNewTab = (base64String) => {
  if (!base64String) return;
  // Bersihkan string dari whitespace/newline
  let cleanString = base64String.replace(/[\r\n\s]+/g, "");
  // Ambil data murninya saja (tanpa prefix data:image/...)
  const parts = cleanString.split(",");
  const byteString = atob(parts.length > 1 ? parts[1] : parts[0]);
  const mimeString =
    parts.length > 1 ? parts[0].split(":")[1].split(";")[0] : "image/jpeg";
  // Ubah ke ArrayBuffer
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  // Buat Blob dan URL-nya
  const blob = new Blob([ab], { type: mimeString });
  const blobUrl = URL.createObjectURL(blob);
  // Buka tab baru
  const newTab = window.open();
  if (newTab) {
    newTab.location.href = blobUrl;
    // Bersihkan memori setelah tab ditutup (opsional)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } else {
    alert("Mohon izinkan popup untuk melihat foto.");
  }
};

const AttendanceDetailModal = ({ data, onClose }) => {
  if (!data) return null;

  const fullName = `${data.user?.titlePrefix || ""} ${
    data.user?.fullName || ""
  } ${data.user?.titleSuffix || ""}`.trim();

  // Siapkan URL embed
  const checkInMapUrl = getGoogleMapsEmbedUrl(data.checkInLocation);
  const checkOutMapUrl = getGoogleMapsEmbedUrl(data.checkOutLocation);

  const isDinasLuar =
    data.attendanceStatus === "Dinas Luar" || data.attendanceType === "OUTSIDE";

  const getShiftForDate = (user, attendanceDate, currentWorkShiftId) => {
    if (!user || !attendanceDate || !currentWorkShiftId) return null;
    const targetDate = attendanceDate.split("T")[0];
    return user.shiftAssignments?.find(
      (sa) => sa.date === targetDate && sa.workShiftId === currentWorkShiftId,
    );
  };

  const getJamKerja = () => {
    const user = data.user;
    if (user?.employmentType === "Non-Shift") {
      return user.workShift
        ? `${user.workShift.name}: ${user.workShift.startTime} - ${user.workShift.endTime}`
        : "Tidak ditemukan";
    } else if (user?.employmentType === "Shift") {
      const shiftAssign = getShiftForDate(user, data.date, data.workShiftId);
      if (!shiftAssign) return "Tidak ada jadwal shift";
      const shift = shiftAssign.workShift;
      return shift
        ? `${shift.name}: ${shift.startTime} - ${shift.endTime}`
        : "Shift tidak ditemukan";
    }
    return "Tidak diketahui";
  };

  return (
    <div className="modal-overlay">
      {/* <div className="modal-user-card"> */}
      <div className="modal-user-card" style={{ maxWidth: "1000px" }}>
        <div className="modal-header">
          <h3>Detail Presensi</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>Nama Karyawan</label>
                  <input type="text" value={fullName} disabled />
                </div>
              </div>
              {/* <div className="form-column">
                <div className="label-form">
                  <label>
                    NIP <span>*</span>
                  </label>
                  <input
                    type="text"
                    value={data.user?.nip || "Tidak ditemukan"}
                    disabled
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Profesi <span>*</span>
                  </label>
                  <input
                    type="text"
                    value={data.user?.profession?.name || "Tidak ditemukan"}
                    disabled
                  />
                </div>
              </div> */}
              <div className="form-column">
                <div className="label-form">
                  <label>Tanggal</label>
                  <input
                    type="text"
                    value={formatDateIndo(data.date)}
                    disabled
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label>Jam Kerja</label>
                  <input type="text" value={getJamKerja()} disabled />
                </div>
              </div>
            </div>

            <div className="form-row">
              {/* <div className="form-column">
                <div className="label-form">
                  <label>
                    Jam Kerja <span>*</span>
                  </label>
                  <input type="text" value={getJamKerja()} disabled />
                </div>
              </div> */}
              <div className="form-column">
                <div className="label-form">
                  <label>Jam Masuk</label>
                  <input
                    type="datetime-local"
                    value={formatToDatetimeLocalComplete(data.checkInTime)}
                    disabled
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label>Jam Keluar</label>
                  <input
                    type="datetime-local"
                    value={formatToDatetimeLocalComplete(data.checkOutTime)}
                    disabled
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label>Status Kehadiran</label>
                  <input type="text" value={data.attendanceStatus} />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>Lokasi Masuk</label>
                  {data.checkInLocation &&
                  !data.checkInLocation.includes("Manual") ? (
                    <div className="map-container">
                      <iframe
                        src={checkInMapUrl}
                        title={`Lokasi Masuk ${fullName}`}
                        width="100%"
                        height="130"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                      <a
                        href={`https://maps.google.com/?q=${data.checkInLocation.trim()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-link-button"
                      >
                        Buka di Google Maps
                      </a>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={data.checkInLocation || "-"}
                      disabled
                    />
                  )}
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label>Lokasi Pulang</label>
                  {data.checkOutLocation &&
                  !data.checkOutLocation.includes("Manual") ? (
                    <div className="map-container">
                      <iframe
                        src={checkOutMapUrl}
                        title={`Lokasi Keluar ${fullName}`}
                        width="100%"
                        height="130"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                      <a
                        href={`https://maps.google.com/?q=${data.checkOutLocation.trim()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-link-button"
                      >
                        Buka di Google Maps
                      </a>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={data.checkOutLocation || "-"}
                      disabled
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="form-row">
              {/* <div className="form-column">
                <div className="label-form">
                  <label>Status Kehadiran</label>
                  <input type="text" value={data.attendanceStatus} />
                </div>
              </div> */}
              <div className="form-column" style={{ marginBottom: 0 }}>
                <div className="label-form">
                  <label>Keterangan</label>
                  <textarea
                    value={data.notes || "-"}
                    rows={3}
                    disabled
                  ></textarea>
                </div>
              </div>
            </div>

            {isDinasLuar && (
              <div className="form-row">
                <div className="form-column full-width">
                  <div className="label-form">
                    <label>Foto Bukti Dinas Luar</label>
                    <div className="evidence-link-container">
                      {/* {data.evidencePhoto ? ( */}
                      {data.checkInEvidencePhoto ? (
                        <div className="evidence-action-row">
                          <input
                            type="text"
                            value="Lampiran tersedia"
                            disabled
                            className="input-attachment-status"
                          />
                          <button
                            type="button"
                            className="button is-purple"
                            onClick={() =>
                              // openBase64InNewTab(data.evidencePhoto)
                              openBase64InNewTab(data.checkInEvidencePhoto)
                            }
                            style={{ cursor: "pointer" }}
                          >
                            Buka Foto di Tab Baru
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value="Foto bukti tidak dilampirkan"
                          disabled
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="button is-purple"
              onClick={onClose}
            >
              Tutup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceDetailModal;
