import React from "react";
// import "../../style/AttendanceModalBaru.css";
import { formatTimeForInput } from "../../../utils/dateHelper.js";
import { FaTimes, FaMapMarkerAlt, FaClock, FaUserAlt } from "react-icons/fa";

const getGoogleMapsEmbedUrl = (locationString) => {
  if (!locationString || locationString.includes("Manual")) return null;
  const coords = locationString.trim();
  return `https://maps.google.com/maps?q=${coords}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
};

const AttendanceModal = ({ data, onClose }) => {
  if (!data) return null;

  const fullName =
    `${data.user?.titlePrefix || ""} ${data.user?.fullName || ""} ${data.user?.titleSuffix || ""}`.trim();
  const checkInMapUrl = getGoogleMapsEmbedUrl(data.checkInLocation);
  const checkOutMapUrl = getGoogleMapsEmbedUrl(data.checkOutLocation);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-user-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <FaClock className="header-icon" />
            <h3>Detail Presensi Karyawan</h3>
          </div>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {/* Section: Identitas */}
          <div className="modal-section">
            <h4 className="section-title">
              <FaUserAlt /> Informasi Karyawan
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input type="text" value={fullName} readOnly />
              </div>
              <div className="form-group">
                <label>NIP</label>
                <input type="text" value={data.user?.nip || "-"} readOnly />
              </div>
              <div className="form-group">
                <label>Profesi</label>
                <input
                  type="text"
                  value={data.user?.profession?.name || "-"}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Section: Waktu */}
          <div className="modal-section">
            <h4 className="section-title">
              <FaClock /> Waktu & Status
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Shift Kerja</label>
                <input
                  type="text"
                  className="highlight-input"
                  value={
                    data.user?.workShift
                      ? `${data.user.workShift.name} (${data.user.workShift.startTime} - ${data.user.workShift.endTime})`
                      : "-"
                  }
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>Jam Masuk</label>
                <input
                  type="time"
                  value={formatTimeForInput(data.checkInTime)}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>Jam Keluar</label>
                <input
                  type="time"
                  value={formatTimeForInput(data.checkOutTime)}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <span
                  className={`status-badge ${data.attendanceStatus?.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {data.attendanceStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Lokasi */}
          <div className="modal-section">
            <h4 className="section-title">
              <FaMapMarkerAlt /> Lokasi Presensi
            </h4>
            <div className="location-grid">
              <div className="location-box">
                <label>Lokasi Masuk</label>
                {checkInMapUrl ? (
                  <div className="map-wrapper">
                    <iframe
                      src={checkInMapUrl}
                      title="In Map"
                      loading="lazy"
                    ></iframe>
                    <a
                      href={`https://www.google.com/maps?q=${data.checkInLocation}`}
                      target="_blank"
                      rel="noreferrer"
                      className="map-btn"
                    >
                      Lihat di Maps
                    </a>
                  </div>
                ) : (
                  <div className="manual-location">
                    {data.checkInLocation || "Tidak ada data"}
                  </div>
                )}
              </div>

              <div className="location-box">
                <label>Lokasi Keluar</label>
                {checkOutMapUrl ? (
                  <div className="map-wrapper">
                    <iframe
                      src={checkOutMapUrl}
                      title="Out Map"
                      loading="lazy"
                    ></iframe>
                    <a
                      href={`https://www.google.com/maps?q=${data.checkOutLocation}`}
                      target="_blank"
                      rel="noreferrer"
                      className="map-btn"
                    >
                      Lihat di Maps
                    </a>
                  </div>
                ) : (
                  <div className="manual-location">
                    {data.checkOutLocation || "Tidak ada data"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Catatan */}
          <div className="modal-section">
            <div className="form-group full-width">
              <label>Keterangan / Catatan</label>
              <textarea value={data.notes || "-"} rows={2} readOnly></textarea>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="button-close-alt" onClick={onClose}>
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
