import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaFlag,
  FaSuitcase,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaPen,
  FaTrash,
  FaExchangeAlt,
  FaFileExport,
  FaPlus,
  FaHospital,
  FaTimes,
  FaUsers,
  FaUserMd,
  FaFilePdf,
} from "react-icons/fa";
import axios from "axios";
import axiosInstance from "../../api/axios.js";

const CalendarManagement = () => {
  //   const token = localStorage.getItem("token");
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("monthly");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      //   const response = await axios.get(
      //     `http://localhost:3000/calendars?year=${year}`,
      //     { headers: {Authorization: `Bearer ${token}`}},
      //   );
      const response = await axiosInstance.get(`/calendars?year=${year}`);
      setHolidays(response.data.data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [currentDate.getFullYear()]);

  const toggleModal = () => {
    setShowAddModal(!showAddModal);
    if (showAddModal) fetchHolidays();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus hari libur ini?")) {
      try {
        // await axios.delete(`http://localhost:3000/calendars/${id}`);
        await axiosInstance.delete(`/calendars/${id}`);
        fetchHolidays();
      } catch (e) {
        console.error(e);
        alert("Gagal menghapus data kalender!");
      }
    }
  };

  const handleEditClick = (holiday) => {
    setSelectedHoliday(holiday);
    setShowEditModal(true);
  };

  const stats = {
    total: holidays.length,
    national: holidays.filter((h) => h.holidayType === "Nasional").length,
    joint: holidays.filter((h) => h.holidayType === "Cuti Bersama").length,
    hospital: holidays.filter((h) => h.holidayType === "RS").length,
  };

  const changeMonth = (offset) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1),
    );
  };

  const goToToday = () => setCurrentDate(new Date());

  const monthYearLabel = currentDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", { weekday: "long" });
  };

  const filteredHolidays = holidays.filter((h) => {
    // const holidayName = h.description || h.name || "";
    // const matchesSearch = holidayName
    //   .toLowerCase()
    //   .includes(searchQuery.toLowerCase());
    // const matchesFilter = filterType === "all" || h.type === filterType;
    // const matchesFilter =
    //   filterType === "all" ||
    //   (filterType === "national" && h.holidayType === "Nasional") ||
    //   (filterType === "joint" && h.holidayType === "Cuti Bersama");
    // return matchesSearch && matchesFilter;

    const holidayTitle = h.name || h.description || "";
    const matchesSearch = holidayTitle
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterType === "all" ||
      (filterType === "national" && h.holidayType === "Nasional") ||
      (filterType === "joint" && h.holidayType === "Cuti Bersama") ||
      (filterType === "hospital" && h.holidayType === "Rumah Sakit");
    return matchesSearch && matchesFilter;
  });

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Penyesuaian index hari (Senin sebagai hari pertama)
    const emptySlots = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let i = 0; i < emptySlots; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const holiday = holidays.find((h) => h.date === dateString);

      const isToday =
        d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

      let dayClass = "calendar-day";
      if (isToday) dayClass += " is-today";
      //   if (holiday) {
      //     dayClass +=
      //       holiday.holidayType === "Nasional" ? " is-national" : " is-joint";
      //   }
      if (holiday) {
        dayClass +=
          holiday.holidayType === "Nasional"
            ? // tetap pake spasi
              " is-national"
            : holiday.holidayType === "Cuti Bersama"
              ? " is-joint"
              : " is-hospital";
      }

      days.push(
        <div key={d} className={dayClass}>
          <span className="day-number">{d}</span>
          {holiday && <div className="cal-day-label">{holiday.name}</div>}
        </div>,
      );
    }
    return days;
  };

  return (
    <div className="content-page">
      {loading ? (
        <div className="page-header-container">
          <div className="header-left"></div>
          <div className="panel-actions-right">
            {[1, 2, 3].map((_, i) => (
              <div
                key={i}
                className="skeleton-box"
                style={{
                  width: "100px",
                  height: "40px",
                  borderRadius: "8px",
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="page-header-container">
          <div className="header-left"></div>
          <div className="panel-actions-right">
            <button className="button is-danger">
              <FaFilePdf /> PDF
            </button>
            <button className="button is-success">
              <FaFileExport /> Excel
            </button>
            <button
              className="button is-success"
              onClick={() => toggleModal(true)}
            >
              <FaPlus /> Tambah
            </button>
          </div>
        </div>
      )}

      <section className="status-grid-sect">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="stat-card-dash">
              <div className="stat-info-dash">
                <div
                  className="skeleton-text"
                  style={{ width: "150px", height: "16px" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "80px", height: "32px", margin: "10px 0" }}
                ></div>
              </div>
              <div className="stat-icon-dash skeleton-icon"></div>
            </div>
          ))
        ) : (
          <>
            <div className="stat-card-sect purple">
              <div className="stat-info-sect">
                <span className="stat-label-sect">Total Hari Libur</span>
                <span className="stat-value-sect">{stats.total}</span>
              </div>
              <div className="stat-icon-sect">
                <FaCalendarAlt />
              </div>
            </div>
            <div className="stat-card-sect red">
              <div className="stat-info-sect">
                <span className="stat-label-sect">Libur Nasional</span>
                <span className="stat-value-sect">{stats.national}</span>
              </div>
              <div className="stat-icon-sect">
                <FaFlag />
              </div>
            </div>
            <div className="stat-card-sect orange">
              <div className="stat-info-sect">
                <span className="stat-label-sect">Cuti Bersama</span>
                <span className="stat-value-sect">{stats.joint}</span>
              </div>
              <div className="stat-icon-sect">
                <FaSuitcase />
              </div>
            </div>
            <div className="stat-card-sect blue">
              <div className="stat-info-sect">
                <span className="stat-label-sect">Rumah Sakit</span>
                <span className="stat-value-sect">{stats.hospital}</span>
              </div>
              <div className="stat-icon-sect">
                <FaHospital />
              </div>
            </div>
          </>
        )}
      </section>

      <div className="calendar-content">
        <div className="left-panel">
          <div className="panel-header">
            {loading ? (
              <>
                <div className="toggle-group-calendar">
                  {[1, 2].map((_, i) => (
                    <div
                      key={i}
                      className="skeleton-box"
                      style={{
                        width: "90px",
                        height: "30px",
                        borderRadius: "8px",
                      }}
                    />
                  ))}
                </div>
                <div className="panel-actions-right">
                  <div className="filter-chips">
                    {[1, 2, 3, 4].map((_, i) => (
                      <div
                        key={i}
                        className="skeleton-box"
                        style={{
                          width: "80px",
                          height: "30px",
                          borderRadius: "20px",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="toggle-group-calendar">
                  <button
                    className={`toggle-button ${viewMode === "monthly" ? "active" : ""}`}
                    onClick={() => setViewMode("monthly")}
                  >
                    Bulanan
                  </button>
                  <button
                    className={`toggle-button ${viewMode === "list" ? "active" : ""}`}
                    onClick={() => setViewMode("list")}
                  >
                    Daftar
                  </button>
                </div>
                <div className="panel-actions-right">
                  <div className="filter-chips">
                    <button
                      className={`chip ${filterType === "all" ? "active" : ""}`}
                      onClick={() => setFilterType("all")}
                    >
                      Semua
                    </button>
                    <button
                      className={`chip ${filterType === "national" ? "active" : ""}`}
                      onClick={() => setFilterType("national")}
                    >
                      Libur Nasional
                    </button>
                    <button
                      className={`chip ${filterType === "joint" ? "active" : ""}`}
                      onClick={() => setFilterType("joint")}
                    >
                      Cuti Bersama
                    </button>
                    <button
                      className={`chip ${filterType === "hospital" ? "active" : ""}`}
                      onClick={() => setFilterType("hospital")}
                    >
                      Rumah Sakit
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          {loading ? (
            <div className="calendar-wrapper">
              <div className="calendar-nav">
                <div
                  className="skeleton-box"
                  style={{ width: "30px", height: "30px" }}
                />
                <div
                  className="skeleton-text"
                  style={{ width: "150px", height: "20px" }}
                />
                <div
                  className="skeleton-text"
                  style={{ width: "80px", height: "16px" }}
                />
                <div
                  className="skeleton-box"
                  style={{ width: "30px", height: "30px" }}
                />
              </div>
              <div className="calendar-grid-header">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="skeleton-text"
                    style={{ width: "30px", height: "12px" }}
                  />
                ))}
              </div>
              <div className="calendar-grid">
                {[...Array(35)].map((_, i) => (
                  <div key={i} className="calendar-day">
                    <div
                      className="skeleton-text"
                      style={{ width: "20px", height: "12px" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : viewMode === "monthly" ? (
            <div className="calendar-wrapper">
              <div className="calendar-nav">
                <button onClick={() => changeMonth(-1)}>
                  <FaChevronLeft />
                </button>
                <h2>{monthYearLabel}</h2>
                <a href="#" className="today-link" onClick={goToToday}>
                  Hari Ini
                </a>
                <button onClick={() => changeMonth(1)}>
                  <FaChevronRight />
                </button>
              </div>
              <div className="calendar-grid-header">
                <span>Sen</span>
                <span>Sel</span>
                <span>Rab</span>
                <span>Kam</span>
                <span>Jum</span>
                <span>Sab</span>
                <span>Min</span>
              </div>
              <div className="calendar-grid">{renderCalendar()}</div>
            </div>
          ) : (
            <div className="list-view-container scroll-container">
              {filteredHolidays.length > 0 ? (
                filteredHolidays.map((holiday) => {
                  const hDate = new Date(holiday.date);
                  return (
                    <div key={holiday.id} className="list-item">
                      <div className="date-box">
                        <span className="date-num">{hDate.getDate()}</span>
                        <span className="date-month">
                          {hDate
                            .toLocaleDateString("id-ID", { month: "short" })
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="list-details">
                        <h4>{holiday.name}</h4>
                        <p>{getDayName(holiday.date)}</p>
                        <span
                          className={`status-badge ${holiday.holidayType === "Nasional" ? "red" : "yellow"}`}
                        >
                          {holiday.holidayType}
                        </span>
                      </div>
                      <div className="list-actions">
                        <button className="button is-info">
                          <FaPen onClick={() => handleEditClick(holiday)} />
                        </button>
                        <button
                          className="button is-danger"
                          onClick={() => handleDelete(holiday.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-data">
                  <h4>Belum ada jadwal hari libur</h4>
                  <p>Data hari libur akan muncul di sini</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="right-panel">
          {loading ? (
            <>
              <div className="sidebar-header-calendar">
                <div
                  className="skeleton-text"
                  style={{ width: "200px", height: "30px" }}
                />
                <div
                  className="skeleton-text"
                  style={{ width: "50px", height: "24px" }}
                />
              </div>
              <div className="search-box">
                <div
                  className="skeleton-box"
                  style={{ width: "300px", height: "38px" }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="sidebar-header-calendar">
                <h3>Daftar Hari Libur {currentDate.getFullYear()}</h3>
                <span className="tag-count">{stats.total} Hari</span>
              </div>
              <div className="search-box">
                <FaSearch className="search-icon-box" />
                <input
                  type="text"
                  className="search-box-input"
                  placeholder="Cari hari libur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="sidebar-list">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="sidebar-item-calendar">
                  <div
                    className="skeleton-box"
                    style={{ width: "4px", height: "40px" }}
                  />
                  <div className="sidebar-content">
                    <div
                      className="skeleton-text"
                      style={{ width: "120px", height: "14px" }}
                    />
                    <div
                      className="skeleton-text"
                      style={{
                        width: "90px",
                        height: "12px",
                        marginTop: "5px",
                      }}
                    />
                  </div>
                </div>
              ))
            ) : filteredHolidays.length > 0 ? (
              filteredHolidays.map((holiday) => {
                const holidayDate = new Date(holiday.date);
                return (
                  <div key={holiday.id} className="sidebar-item-calendar">
                    <div
                      className={`sidebar-indicator ${holiday.holidayType === "Nasional" ? "national" : holiday.holidayType === "Cuti Bersama" ? "joint" : "hospital"}`}
                    ></div>
                    <div className="sidebar-content">
                      <h4>{holiday.name}</h4>
                      <p>
                        {holidayDate.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {holiday.repeatYearly && (
                      <FaExchangeAlt
                        className="recurring-icon"
                        title="Berulang Tahunan"
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="no-data">
                <h4>Belum ada jadwal hari libur</h4>
                <p>Data hari libur akan muncul di sini</p>
              </div>
            )}
          </div>
          <div className="legend-box">
            {loading ? (
              <>
                <div
                  className="skeleton-text"
                  style={{
                    width: "120px",
                    height: "20px",
                    marginBottom: "10px",
                  }}
                />
              </>
            ) : (
              <>
                <h4>Keterangan</h4>
                <div className="legend-item">
                  <span className="dot red"></span> Libur Nasional
                </div>
                <div className="legend-item">
                  <span className="dot orange"></span> Cuti Bersama
                </div>
                <div className="legend-item">
                  <span className="dot blue"></span> Rumah Sakit
                </div>
                <div className="legend-item">
                  <span className="dot-outline"></span> Hari Ini
                </div>
                <div className="legend-item">
                  <FaExchangeAlt className="legend-icon" /> Berulang Setiap
                  Tahun
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <AddCalendar
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchHolidays}
      />
      <EditCalendar
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedHoliday(null);
        }}
        onSuccess={fetchHolidays}
        holidayData={selectedHoliday}
      />
    </div>
  );
};

export default CalendarManagement;

// Modal tambah kalender
const AddCalendar = ({ isOpen, onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    holidayType: "Nasional",
    appliesTo: "Semua",
    description: "",
    repeatYearly: false,
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
        name: formData.name,
        date: formData.date,
        holidayType: formData.holidayType,
        appliesTo: formData.appliesTo,
        description: formData.description,
        isHoliday: true,
        repeatYearly: formData.repeatYearly,
      };

      await axios.post("http://localhost:3000/calendars", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Berhasil menambahkan hari libur!");
      setFormData({
        name: "",
        date: "",
        holidayType: "Nasional",
        appliesTo: "Semua",
        description: "",
        repeatYearly: false,
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
      <div className="modal-user-card">
        <div className="modal-header">
          <h3>Tambah Hari Libur</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Nama Hari Libur <span>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Hari Raya Idul Fitri"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
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
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Kategori Libur <span>*</span>
                  </label>
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
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Berlaku Untuk <span>*</span>
                  </label>
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
                      fontSize: "0.75rem",
                      marginTop: "5px",
                      display: "block",
                    }}
                  >
                    * Libur "Non-Medis" tidak akan memotong jatah libur
                    Medis/Shift
                  </small>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>Deskripsi</label>
                  <textarea
                    placeholder="Tambahkan catatan atau deskripsi..."
                    maxLength="200"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>
                  <small className="text-count">
                    {formData.description.length}/200
                  </small>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form toggle-group">
                  <div className="toggle-info">
                    <strong>Ulangi Setiap Tahun</strong>
                    <p>Hari libur akan otomatis muncul setiap tahun</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="repeatYearly"
                      checked={formData.repeatYearly}
                      onChange={handleChange}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
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
              className="button is-success"
              disabled={isLoading}
            >
              {isLoading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal edit kalender
const EditCalendar = ({ isOpen, onClose, onSuccess, holidayData }) => {
  const token = localStorage.getItem("token");
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    holidayType: "Nasional",
    appliesTo: "Semua",
    description: "",
    repeatYearly: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (holidayData) {
      setFormData({
        name: holidayData.name || "",
        date: holidayData.date || "",
        holidayType: holidayData.holidayType || "Nasional",
        appliesTo: holidayData.appliesTo || "Semua",
        description: holidayData.description || "",
        repeatYearly: formData.repeatYearly || false,
      });
    }
  }, [holidayData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!holidayData?.id) return;

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

      await axios.put(
        `http://localhost:3000/calendars/${holidayData.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      alert("Berhasil memperbarui hari libur!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Gagal memperbarui data");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-user-card">
        <div className="modal-header">
          <h3>Edit Hari Libur</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Nama Hari Libur <span>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Hari Raya Idul Fitri"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
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
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Kategori Libur <span>*</span>
                  </label>
                  <div className="category-selection">
                    <button
                      type="button"
                      className={`cat-btn national ${formData.holidayType === "Nasional" ? "active" : ""}`}
                      onClick={() =>
                        setFormData({ ...formData, holidayType: "Nasional" })
                      }
                    >
                      <FaFlag /> Libur Nasional
                    </button>
                    <button
                      type="button"
                      className={`cat-btn joint ${formData.holidayType === "Cuti Bersama" ? "active" : ""}`}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          holidayType: "Cuti Bersama",
                        })
                      }
                    >
                      <FaSuitcase /> Cuti Bersama
                    </button>
                    <button
                      type="button"
                      className={`cat-btn hospital ${formData.holidayType === "RS" ? "active" : ""}`}
                      onClick={() =>
                        setFormData({ ...formData, holidayType: "RS" })
                      }
                      style={{ marginLeft: "5px" }}
                    >
                      <FaHospital /> Libur RS
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Berlaku Untuk <span>*</span>
                  </label>
                  <div className="category-selection">
                    <button
                      type="button"
                      className={`cat-btn ${formData.appliesTo === "Semua" ? "active" : ""}`}
                      onClick={() =>
                        setFormData({ ...formData, appliesTo: "Semua" })
                      }
                    >
                      <FaUsers /> Semua Karyawan
                    </button>
                    <button
                      type="button"
                      className={`cat-btn ${formData.appliesTo === "Non-Medis" ? "active" : ""}`}
                      onClick={() =>
                        setFormData({ ...formData, appliesTo: "Non-Medis" })
                      }
                    >
                      <FaUserMd /> Khusus Non-Medis
                    </button>
                  </div>
                  <small
                    style={{
                      color: "#666",
                      fontSize: "0.75rem",
                      marginTop: "5px",
                      display: "block",
                    }}
                  >
                    * Libur "Non-Medis" tidak akan memotong jatah libur
                    Medis/Shift
                  </small>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>Deskripsi</label>
                  <textarea
                    placeholder="Tambahkan catatan atau deskripsi..."
                    maxLength="200"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>
                  <small className="text-count">
                    {formData.description.length}/200
                  </small>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="toggle-group">
                  <div className="label-form toggle-info">
                    <strong>Ulangi Setiap Tahun</strong>
                    <p>Hari libur akan otomatis muncul setiap tahun</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="repeatYearly"
                      checked={formData.repeatYearly}
                      onChange={handleChange}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
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
              className="button is-purple"
              disabled={isLoading}
            >
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
