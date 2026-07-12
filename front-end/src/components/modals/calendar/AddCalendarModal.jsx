import React, { useState } from "react";
import "../../style/AddCalendar.css";
import {
  FaFlag,
  FaSuitcase,
  FaTimes,
  FaHospital,
  FaUsers,
  FaUserMd,
} from "react-icons/fa";
import axios from "axios";
import axiosInstance from "../../api/axios.js";

const AddCalendar = ({ isOpen, onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [formData, setFormData] = useState({
    description: "",
    date: "",
    holidayType: "Nasional",
    appliesTo: "Semua",
    isRepeat: false, // Tidak masuk DB, tapi untuk logic Backend
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCategoryChange = (type) => {
    setFormData((prev) => ({ ...prev, holidayType: type }));
  };

  const handleAppliesToChange = (target) => {
    setFormData((prev) => ({ ...prev, appliesTo: target }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        date: formData.date,
        description: formData.description,
        holidayType: formData.holidayType,
        appliesTo: formData.appliesTo,
        isHoliday: true,
        repeat: formData.isRepeat,
      };

      //   await axios.post("http://localhost:3000/calendars", payload, {
      //     headers: {Authorization: `Bearer ${token}`},
      //   });
      await axiosInstance.post("/calendars", payload);

      alert("Berhasil menambahkan hari libur!");
      setFormData({
        description: "",
        date: "",
        holidayType: "Nasional",
        appliesTo: "Semua",
        isRepeat: false,
      });
      if (onSuccess) onSuccess();
      if (onClose) onClose();
      console.log(payload);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Tambah Hari Libur Baru</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group-calendar">
              <label>
                Nama Hari Libur <span>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Hari Raya Idul Fitri"
                required
                name="description"
                value={formData.description}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>
            <div className="form-group-calendar">
              <label>
                Tanggal <span>*</span>
              </label>
              <input
                type="date"
                required
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>
            <div className="form-group-calendar">
              <label>Kategori Libur</label>
              <div className="category-selection">
                <button
                  type="button"
                  className={`cat-btn national ${formData.holidayType === "Nasional" ? "active" : ""}`}
                  onClick={() => handleCategoryChange("Nasional")}
                >
                  <FaFlag /> Libur Nasional
                </button>
                <button
                  type="button"
                  className={`cat-btn joint ${formData.holidayType === "Cuti Bersama" ? "active" : ""}`}
                  onClick={() => handleCategoryChange("Cuti Bersama")}
                >
                  <FaSuitcase /> Cuti Bersama
                </button>
                <button
                  type="button"
                  className={`cat-btn hospital ${formData.holidayType === "RS" ? "active" : ""}`}
                  onClick={() => handleCategoryChange("RS")}
                  style={{ marginLeft: "5px" }}
                >
                  <FaHospital /> Libur RS
                </button>
              </div>
            </div>
            <div className="form-group-calendar">
              <label>Berlaku Untuk</label>
              <div className="category-selection">
                <button
                  type="button"
                  className={`cat-btn ${formData.appliesTo === "Semua" ? "active" : ""}`}
                  onClick={() => handleAppliesToChange("Semua")}
                >
                  <FaUsers /> Semua Karyawan
                </button>
                <button
                  type="button"
                  className={`cat-btn ${formData.appliesTo === "Non-Medis" ? "active" : ""}`}
                  onClick={() => handleAppliesToChange("Non-Medis")}
                >
                  <FaUserMd /> Khusus Non-Medis
                </button>
              </div>
              <small
                style={{
                  color: "#666",
                  fontSize: "0.85rem",
                  marginTop: "5px",
                  display: "block",
                }}
              >
                *Libur "Non-Medis" tidak akan memotong jatah libur Medis/Shift.
              </small>
            </div>
            <div className="form-group-calendar">
              <label>Deskripsi</label>
              <textarea
                placeholder="Tambahkan catatan atau deskripsi..."
                maxLength="200"
              ></textarea>
              <small className="char-count">0/200</small>
            </div>
            <div className="form-group-calendar toggle-group">
              <div className="toggle-info">
                <strong>Ulangi Setiap Tahun</strong>
                <p>Hari libur akan otomatis muncul setiap tahun</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  name="isRepeat"
                  checked={formData.isRepeat}
                  onChange={handleChange}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="button is-danger"
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-submit-calendar"
              disabled={isLoading}
            >
              {isLoading ? "Menyimpan..." : "Tambah Hari Libur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCalendar;
