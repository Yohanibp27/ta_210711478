// belum dipake, notif udah ada dinavbar
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Notifications() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="alert-dropdown-wrapper" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="alert-button">
        🔔
        <span className="alert-badge">3</span>
      </button>

      {open && (
        <div className="alert-dropdown">
          <div className="alert-header">Notifikasi</div>

          <div className="alert-list">
            <div
              className="alert-item"
              onClick={() => navigate("/shift-exchanges")}
            >
              <div className="alert-item-title">Permintaan Tukar Shift</div>
              <div className="alert-item-desc">
                Ns. Andi Rahman ingin menukar shift dengan Anda
              </div>
              <div className="alert-time">5 menit yang lalu</div>
            </div>

            <div className="alert-item" onClick={() => navigate("/schedule")}>
              <div className="alert-item-title">Jadwal Shift Baru</div>
              <div className="alert-item-desc">
                Jadwal shift minggu depan telah tersedia
              </div>
              <div className="alert-time">1 jam yang lalu</div>
            </div>

            <div className="alert-item" onClick={() => navigate("/presence")}>
              <div className="alert-item-title">Reminder Presensi</div>
              <div className="alert-item-desc">
                Jangan lupa melakukan presensi masuk
              </div>
              <div className="alert-time">2 jam yang lalu</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;
