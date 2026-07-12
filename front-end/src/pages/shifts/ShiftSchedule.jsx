import React, { useEffect, useState } from "react";
// import axios from "axios";
import * as XLSX from "xlsx";
import Avatar from "../../assets/avatar-ungu.png";
import { FaArrowsAltH, FaTimes } from "react-icons/fa";
// import AddShift from "../../components/modals/AddShift.jsx";
// import EditShift from "../../components/shift/EditShift.jsx";
import axiosInstance from "../../api/axios.js";

const ShiftCell = ({ shift, onClickShift, showOriginal }) => (
  <div
    className={`shift-cell ${shift ? "filled" : "empty"}`}
    style={shift ? { backgroundColor: shift.color } : {}}
  >
    {shift && shift.length > 0
      ? shift.map((s, i) => (
          <div
            key={i}
            className="shift-item"
            style={{ backgroundColor: s.color }}
            onClick={() => onClickShift(s)}
          >
            {/* {s.swapped && (showOriginal || s.displayAsOriginal) ? ( */}
            {s.swapped && showOriginal ? (
              <>
                <div className="shift-type text-gray-600">
                  {/* <span className="badge-original">Asli:</span> {s.originalType} */}
                  <span className="badge-original">Asli:</span> {s.type}
                </div>
                {/* <div className="shift-time">{s.originalTime}</div> */}
                <div className="shift-time">{s.time}</div>
                <div className="swap-indicator-small">Ditukar 🔁</div>
              </>
            ) : (
              <>
                <div className="shift-type">{s.type}</div>
                <div className="shift-time">{s.time}</div>
                {/* {s.swapped && <span className="swap-indicator">🔁</span>} */}
              </>
            )}
          </div>
        ))
      : "-"}
  </div>
);

const ScheduleRow = ({ staff, days, onClickShift, showOriginal }) => (
  <div className="schedule-row">
    <div className="staff-info">
      <img
        src={staff.avatarUrl || Avatar}
        alt={staff.name}
        className="staff-avatar"
      />
      <div>
        <div className="staff-name">{staff.name}</div>
        <div className="staff-title">{staff.title}</div>
      </div>
    </div>
    {days.map((day) => (
      <ShiftCell
        key={day.key}
        shift={staff.shifts[day.key]}
        onClickShift={onClickShift}
        showOriginal={showOriginal}
      />
    ))}
  </div>
);

function ShiftSchedule() {
  const token = localStorage.getItem("token");
  const [scheduleData, setScheduleData] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("Semua");
  const [selectedDivision, setSelectedDivision] = useState("Semua");
  const [startDate, setStartDate] = useState(getMonday(new Date()));
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState({ show: false, id: null });
  const [visibleCount, setVisibleCount] = useState(100);
  const [isOpen, setIsOpen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [loading, setLoading] = useState(true);

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const generateWeekDays = (start) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = `${d.toLocaleDateString("id-ID", {
        weekday: "long",
      })}_${d.getDate()}/${d.getMonth() + 1}`;
      days.push({
        key,
        label: d.toLocaleDateString("id-ID", { weekday: "short" }),
        date: `${d.getDate()}/${d.getMonth() + 1}`,
        isoDate: d.toISOString().split("T")[0],
      });
    }
    return days;
  };

  const daysOfWeek = generateWeekDays(startDate);

  const targetFungsi = [
    "Subbid Yanmeddokpol",
    "Subbid Yanwat",
    "Subbid Jangmedum",
  ];

  const availableDivisions = [
    ...new Set(
      scheduleData
        .filter(
          (staff) =>
            selectedDepartment === "Semua" ||
            staff.department === selectedDepartment,
        )
        .map((staff) => staff.division)
        .filter(Boolean),
    ),
  ];

  useEffect(() => {
    fetchData();
    fetchSchedule();
  }, [token, startDate, showOriginal]);

  const fetchData = async () => {
    setLoading(true);
    try {
      //   const [deptRes, divRes, profRes] = await Promise.all([
      //     axios.get("http://localhost:3000/departments", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/divisions", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/professions", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //   ]);

      const divRes = await axiosInstance.get("/divisions");
      setDivisions(divRes.data.data || []);
    } catch (e) {
      console.error("Gagal memuat data", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      //   const [resShifts, resExchanges] = await Promise.all([
      //     axios.get("http://localhost:3000/shifts", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/all-shift-exchanges", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //   ]);

      const [resShifts, resExchanges] = await Promise.all([
        axiosInstance.get("/shifts"),
        axiosInstance.get("/all-shift-exchanges"),
      ]);

      const rawShifts = resShifts.data.data || [];
      const rawExchanges = resExchanges.data.data || [];
      const staffMap = {};
      const exchangeMap = {};

      rawExchanges.forEach((ex) => {
        if (ex.status === "approved" || ex.status === "Disetujui") {
          const reqShift =
            ex.requesterShift?.shiftDetail ||
            ex.requesterShift?.workShift ||
            ex.requesterShift ||
            {};
          const partnerShift =
            ex.partnerShift?.shiftDetail ||
            ex.partnerShift?.workShift ||
            ex.partnerShift ||
            {};

          exchangeMap[ex.requesterShiftId] = {
            newShift: partnerShift,
            originalShift: reqShift,
            originalDate: ex.requesterShift?.date,
            swappedDate: ex.partnerShift?.date,
          };
          exchangeMap[ex.partnerShiftId] = {
            newShift: reqShift,
            originalShift: partnerShift,
            originalDate: ex.partnerShift?.date,
            swappedDate: ex.requesterShift?.date,
          };
        }
      });

      rawShifts.forEach((shift) => {
        const user = shift.user || {};
        const workShift = shift.workShift || {};
        const exchangeData = exchangeMap[shift.id];

        let finalType = workShift.name || "-";
        let finalTime = workShift.startTime
          ? `${workShift.startTime.slice(0, 5)} - ${workShift.endTime.slice(0, 5)}`
          : "-";
        let usedDate = shift.date;
        let isSwapped = false;

        if (exchangeData) {
          isSwapped = true;
          if (showOriginal) {
            // finalType = exchangeData.originalShift.name || "-";
            // finalTime = exchangeData.originalShift.startTime
            //   ? `${exchangeData.originalShift.startTime.slice(0, 5)} - ${exchangeData.originalShift.endTime.slice(0, 5)}`
            //   : "-";
            // usedDate = exchangeData.originalDate || shift.date;

            // MODE LIHAT JADWAL ASLI
            finalType = exchangeData.newShift.name || "-";
            finalTime = exchangeData.newShift.startTime
              ? `${exchangeData.newShift.startTime.slice(0, 5)} - ${exchangeData.newShift.endTime.slice(0, 5)}`
              : "-";
            // PINDAH KE TANGGAL HASIL TUKAR
            usedDate = exchangeData.swappedDate || shift.date;
          } else {
            // finalType = exchangeData.newShift.name || "-";
            // finalTime = exchangeData.newShift.startTime
            //   ? `${exchangeData.newShift.startTime.slice(0, 5)} - ${exchangeData.newShift.endTime.slice(0, 5)}`
            //   : "-";
            // usedDate = shift.date;

            // MODE HASIL TUKAR (DEFAULT)
            finalType = exchangeData.originalShift.name || "-";
            finalTime = exchangeData.originalShift.startTime
              ? `${exchangeData.originalShift.startTime.slice(0, 5)} - ${exchangeData.originalShift.endTime.slice(0, 5)}`
              : "-";
            // BALIK KE TANGGAL ASLI (SEBELUM DITUKAR)
            usedDate = exchangeData.originalDate || shift.date;
          }
        }

        if (!staffMap[user.id]) {
          staffMap[user.id] = {
            id: user.id,
            name: `${user.titlePrefix || ""} ${user.fullName || ""}`.trim(),
            title: user.position?.name || "-",
            department: user.position?.division?.department?.name || "-",
            division: user.position?.division?.name || "-",
            avatarUrl: user.profilePhoto || Avatar,
            shifts: {},
          };
        }

        const dateObj = new Date(usedDate);
        const key = `${dateObj.toLocaleDateString("id-ID", {
          weekday: "long",
        })}_${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

        if (!staffMap[user.id].shifts[key]) {
          staffMap[user.id].shifts[key] = [];
        }

        staffMap[user.id].shifts[key].push({
          id: shift.id,
          type: finalType,
          time: finalTime,
          swapped: isSwapped,
          originalType: exchangeData?.originalShift?.name || finalType,
          originalTime: exchangeData?.originalShift?.startTime
            ? `${exchangeData.originalShift.startTime.slice(0, 5)} - ${exchangeData.originalShift.endTime.slice(0, 5)}`
            : finalTime,
          color:
            finalType === "Pagi"
              ? "#aaffc8"
              : finalType === "Siang"
                ? "#fedbae"
                : "#bcafff",
        });
      });

      setScheduleData(Object.values(staffMap));
    } catch (error) {
      console.error("Gagal memuat data shift:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!scheduleData || scheduleData.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const firstDate = new Date(startDate);
    const year = firstDate.getFullYear();
    const month = firstDate.getMonth();
    const monthName = firstDate.toLocaleDateString("id-ID", { month: "long" });
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const row1 = [`Jadwal Shift Karyawan`];
    const row2 = Array(6).fill("");
    row2.push(monthName);

    const header = [
      "No",
      "Nama Lengkap",
      "Departemen",
      "Divisi",
      "Posisi",
      "Profesi",
      ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`),
    ];

    const rows = scheduleData.map((staff, index) => {
      const dayShifts = Array.from({ length: daysInMonth }, (_, i) => {
        const dateKey = `${new Date(year, month, i + 1).toLocaleDateString(
          "id-ID",
          { weekday: "long" },
        )}_${i + 1}/${month + 1}`;

        const shiftList = staff.shifts?.[dateKey];
        if (!shiftList || shiftList.length === 0) return "-";

        return shiftList[shiftList.length - 1].type;
      });

      return [
        index + 1,
        staff.name,
        staff.department,
        staff.position?.division || "-",
        staff.position || "-",
        staff.title,
        ...dayShifts,
      ];
    });

    const worksheetData = [row1, row2, header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws["!merges"] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: 5 + daysInMonth },
      },
      {
        s: { r: 1, c: 6 },
        e: { r: 1, c: 5 + daysInMonth },
      },
    ];

    ws["A1"].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: "center" },
    };

    ws["G2"].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: "center" },
    };

    for (let col = 6; col <= 5 + daysInMonth; col++) {
      const cell = XLSX.utils.encode_cell({ r: 2, c: col });
      ws[cell].s = {
        font: { bold: true },
        alignment: { horizontal: "center" },
      };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal");
    XLSX.writeFile(wb, `Jadwal_${month + 1}-${year}.xlsx`);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      alert("Sedang memproses import, mohon tunggu...");
      //   const response = await axios.post(
      //     "http://localhost:3000/shifts/import",
      //     formData,
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //         "Content-Type": "multipart/form-data",
      //       },
      //     },
      //   );
      const response = await axiosInstance.post("/shifts/import", formData);
      console.log("Hasil Import:", response.data);
      alert("Import Jadwal Berhasil!");
      fetchSchedule();
      e.target.value = null;
    } catch (error) {
      console.error("Gagal import excel:", error);
      alert(
        "Gagal import file: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  //   const filteredData =
  //     selectedDepartment === "Semua"
  //       ? scheduleData
  //       : scheduleData.filter((staff) => staff.department === selectedDepartment);

  const filteredData = scheduleData.filter((staff) => {
    const matchFungsi =
      selectedDepartment === "Semua" || staff.department === selectedDepartment;
    const matchUnit =
      selectedDivision === "Semua" || staff.division === selectedDivision;

    return matchFungsi && matchUnit;
  });
  console.log("filter data", filteredData);

  const handleScroll = (e) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;

    if (bottom) {
      setVisibleCount((prev) => prev + 20);
    }
  };
  const displayedData = filteredData.slice(0, visibleCount);

  const downloadTemplateFix = () => {
    const header = [
      ["RS BHAYANGKARA INDRAMAYU"],
      ["JL. RAYA LOSARANG KM. 73 LOSARANG"],
      [""],
      ["JADWAL SHIFT KARYAWAN"],
      ["PERIODE: APRIL 2026"],
      [""],
      [
        "*Catatan: Isi kolom tanggal dengan 'Pagi', 'Siang', atau 'Malam'. Gunakan '-' jika libur",
      ],
      [
        "NO",
        "userId",
        "NAMA KARYAWAN",
        "UNIT",
        "PROFESI",
        ...Array.from({ length: 31 }, (_, i) => (i + 1).toString()),
      ],
      [
        1,
        "101",
        "Contoh Nama",
        "IGD",
        "Perawat",
        "Pagi",
        "-",
        "Siang",
        "Malam",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(header);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 35 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 35 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 35 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 35 } },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Shift");
    XLSX.writeFile(wb, "Template_Jadwal_SIGAPRES.xlsx");
  };

  return (
    <div className="content-page">
      <div className="header-controls">
        {loading ? (
          <>
            <div className="filter-group">
              <div className="filter-item">
                <div className="skeleton-text label-skeleton"></div>
                <div className="skeleton-input"></div>
              </div>
              <div className="filter-item">
                <div className="skeleton-text label-skeleton"></div>
                <div className="skeleton-input"></div>
              </div>
              <div className="filter-item">
                <div className="skeleton-text label-skeleton"></div>
                <div className="skeleton-input"></div>
              </div>
              <div className="checkbox-item">
                <div className="skeleton-checkbox"></div>
              </div>
            </div>
            <div className="action-buttons">
              <div
                className="skeleton-text"
                style={{
                  width: "100px",
                  height: "35px",
                  borderRadius: "8px",
                }}
              ></div>
              <div
                className="skeleton-text"
                style={{
                  width: "100px",
                  height: "35px",
                  borderRadius: "8px",
                }}
              ></div>
            </div>
          </>
        ) : (
          <>
            <div className="filter-group">
              <div className="filter-item">
                <label className="label">Pilih Minggu</label>
                <input
                  type="date"
                  className="date-input-normal"
                  value={startDate.toISOString().split("T")[0]}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                />
              </div>
              <div className="filter-item">
                <label className="label">Fungsi</label>
                <select
                  className="select-input"
                  onClick={() => setIsOpen(!isOpen)}
                  onBlur={() => setIsOpen(false)}
                  value={selectedDepartment}
                  //   onChange={(e) => setSelectedDepartment(e.target.value)}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setSelectedDivision("Semua");
                  }}
                >
                  <option value="Semua">Semua Fungsi</option>
                  {/* <option value="Subbid Yanmeddokpol">
                    Subbid Yanmeddokpol
                  </option>
                  <option value="Subbid Jangmedum">Subbid Jangmedum</option>
                  <option value="Subbid Yanwat">Subbid Yanwat</option> */}
                  {targetFungsi.map((deptName, index) => (
                    <option key={index} value={deptName}>
                      {deptName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <label className="label">Unit</label>
                <select
                  className="select-input"
                  onClick={() => setIsOpen(!isOpen)}
                  onBlur={() => setIsOpen(false)}
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                >
                  <option value="Semua">Semua Unit</option>
                  {availableDivisions.map((divName, index) => (
                    <option key={index} value={divName}>
                      {divName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-item checkbox-item">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={showOriginal}
                    onChange={(e) => setShowOriginal(e.target.checked)}
                  />
                  <span className="checkbox-label">Lihat Jadwal Asli</span>
                </label>
              </div>
            </div>
            <div className="actions-buttons">
              <button
                className="button is-success"
                onClick={() => setShowAddModal(true)}
              >
                Tambah Shift
              </button>
              <button
                className="button is-info"
                onClick={() => document.getElementById("importFile").click()}
              >
                Import Jadwal
              </button>
              <input
                id="importFile"
                type="file"
                hidden
                accept=".xlsx"
                onChange={handleImportExcel}
              />
            </div>
          </>
        )}
      </div>

      <div className="schedule-table">
        <div className="schedule-header">
          <div className="staff-header">Tenaga Medis</div>
          {daysOfWeek.map((day) => (
            <div key={day.key} className="day-header">
              <div className="day-label-shift">{day.label}</div>
              <div className="day-date">{day.date}</div>
            </div>
          ))}
        </div>
        <div className="schedule-body scrollable-table" onScroll={handleScroll}>
          {loading ? (
            <div className="qr-loading-box">
              <div className="qr-spinner"></div>
              <p className="qr-loading">Memuat data jadwal shift...</p>
            </div>
          ) : displayedData.length > 0 ? (
            displayedData.map((staff) => (
              <ScheduleRow
                key={staff.id}
                staff={staff}
                days={daysOfWeek}
                onClickShift={(shiftItem) => {
                  //   setSelectedShift(shiftItem);
                  setShowEditModal({ show: true, id: shiftItem.id });
                }}
                showOriginal={showOriginal}
              />
            ))
          ) : (
            <div className="no-data">Tidak ada data shift</div>
          )}
        </div>
      </div>
      <div className="legend-container">
        {loading ? (
          <>
            <div
              className="skeleton-text"
              style={{
                width: "100px",
                height: "25px",
                marginBottom: "8px",
              }}
            ></div>
            <div className="legend-items">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="legend-item">
                  <div
                    className="skeleton-text"
                    style={{
                      width: "140px",
                      height: "18px",
                    }}
                  ></div>
                </div>
              ))}
              <div
                className="skeleton-box"
                style={{
                  width: "120px",
                  height: "35px",
                  marginLeft: "auto",
                }}
              ></div>
              <div
                className="skeleton-box"
                style={{
                  width: "120px",
                  height: "35px",
                  marginLeft: "auto",
                }}
              ></div>
            </div>
          </>
        ) : (
          <>
            <strong>Keterangan</strong>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-color pagi"></span>
                Shift Pagi (07:00-15:00)
              </div>
              <div className="legend-item">
                <span className="legend-color siang"></span>
                Shift Siang (15:00-23:00)
              </div>
              <div className="legend-item">
                <span className="legend-color malam"></span>
                Shift Malam (23:00-07:00)
              </div>
              <div className="legend-item">
                <span className="legend-icon">
                  <FaArrowsAltH />
                </span>
                Jadwal Hasil Pertukaran
              </div>
              <button
                type="button"
                className="button is-danger"
                style={{ marginLeft: "auto" }}
                onClick={exportToExcel}
              >
                Export Jadwal
              </button>
              <button
                className="button is-danger"
                onClick={downloadTemplateFix}
              >
                Export Template
              </button>
            </div>
          </>
        )}
      </div>
      {showAddModal && (
        <AddShift
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchSchedule();
            setShowAddModal(false);
          }}
        />
      )}
      {showEditModal && (
        <EditShift
          isOpen={showEditModal.id}
          data={showEditModal.id}
          onClose={() => setShowEditModal({ show: false, id: null })}
          onSuccess={() => {
            fetchSchedule();
            setShowEditModal({ show: false, id: null });
          }}
        />
      )}
      {/* <AddShift
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        onSuccess={() => {
          fetchSchedule();
          setAddModal(false);
        }}
      /> */}
    </div>
  );
}

export default ShiftSchedule;

// // Modal tambah shift
const AddShift = ({ isOpen, onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    userId: "",
    workShiftId: "",
    date: today,
  });
  const [users, setUsers] = useState([]);
  const [workShifts, setWorkShifts] = useState([]);

  const [allUsers, setAllUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    // const [userRes, shiftRes] = await Promise.all([
    //   axios.get("http://localhost:3000/users", {
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //   }),
    //   axios.get("http://localhost:3000/workshifts", {
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //   }),
    // ]);

    const [userRes, shiftRes] = await Promise.all([
      axiosInstance.get("/users"),
      axiosInstance.get("/workshifts"),
    ]);

    const userData = Array.isArray(userRes.data)
      ? userRes.data
      : userRes.data.users || userRes.data.data || [];

    const shiftData = Array.isArray(shiftRes.data)
      ? shiftRes.data
      : shiftRes.data.workShifts || shiftRes.data.data || [];

    const activeUsers = userData.filter(
      (u) =>
        u.status?.toLowerCase() === "aktif" &&
        u.employmentType?.toLowerCase() === "shift",
    );

    const uniqueUnitsMap = new Map();
    activeUsers.forEach((u) => {
      const division = u.position?.division;
      if (division && division.id) {
        uniqueUnitsMap.set(division.id, {
          id: division.id,
          name: division.name,
        });
      }
    });
    const uniqueUnitsArray = Array.from(uniqueUnitsMap.values());
    setAllUsers(activeUsers);
    setUsers(activeUsers);
    setUnits(uniqueUnitsArray);
    setWorkShifts(shiftData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //   await axios.post("http://localhost:3000/shifts", form, {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });
      await axiosInstance.post("/shifts", form);
      alert("Shift berhasil ditambahkan!");
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menambahkan shift");
    }
  };

  useEffect(() => {
    if (selectedUnit === "") {
      setUsers(allUsers);
    } else {
      const filtered = allUsers.filter(
        (u) => u.position?.division?.id === parseInt(selectedUnit),
      );
      setUsers(filtered);
    }
    setForm((prev) => ({ ...prev, userId: "" }));
  }, [selectedUnit, allUsers]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Tambah Shift Karyawan</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="label-form form-group">
              <label>
                Unit <span>*</span>
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                <option value="" disabled>
                  Pilih Unit
                </option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="label-form form-group">
              <label>
                Nama Karyawan <span>*</span>
              </label>
              <select
                name="userId"
                value={form.userId}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Pilih User
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.titlePrefix} {u.fullName} ({u.nip}) - {u.employmentType}{" "}
                    - {u.status} - {u.position?.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="label-form form-group">
              <label>
                Tanggal <span>*</span>
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="label-form form-group">
              <label>
                Sesi <span>*</span>
              </label>
              <select
                name="workShiftId"
                value={form.workShiftId}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Pilih Sesi
                </option>
                {workShifts.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}: ({ws.startTime} - {ws.endTime})
                  </option>
                ))}
              </select>
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
            <button type="submit" className="button is-success">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal edit shift
const EditShift = ({ isOpen, data, onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [form, setForm] = useState({ userId: "", workShiftId: "", date: "" });
  const [users, setUsers] = useState([]);
  const [workShifts, setWorkShifts] = useState([]);
  const [displayUsers, setDisplayUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    fetchData();
  }, [data, token]);

  const fetchData = async () => {
    try {
      //   const [userRes, shiftRes, currentShiftRes] = await Promise.all([
      //     axios.get("http://localhost:3000/users", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/workshifts", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get(`http://localhost:3000/shifts/${data}`, {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //   ]);

      const [userRes, shiftRes, currentShiftRes] = await Promise.all([
        axiosInstance.get("/users"),
        axiosInstance.get("/workshifts"),
        axiosInstance.get(`/shifts/${data}`),
      ]);

      const userData = Array.isArray(userRes.data)
        ? userRes.data
        : userRes.data.users || userRes.data.data || [];

      const shiftData = Array.isArray(shiftRes.data)
        ? shiftRes.data
        : shiftRes.data.workShifts || shiftRes.data.data || shiftRes.data || [];

      const currentShift =
        currentShiftRes.data?.data?.[0] ||
        currentShiftRes.data?.shift ||
        currentShiftRes.data ||
        null;

      const filteredUsers = userData.filter(
        (u) =>
          u.employmentType?.toLowerCase() === "shift" &&
          u.status?.toLowerCase() === "aktif",
      );
      const activeUsers = userData.filter(
        (u) =>
          u.status?.toLowerCase() === "aktif" &&
          u.employmentType?.toLowerCase() === "shift",
      );

      const uniqueUnitsMap = new Map();
      activeUsers.forEach((u) => {
        const div = u.position?.division;
        if (div) uniqueUnitsMap.set(div.id, { id: div.id, name: div.name });
      });

      setUsers(filteredUsers);
      setWorkShifts(shiftData);
      setDisplayUsers(activeUsers);
      setUnits(Array.from(uniqueUnitsMap.values()));

      if (currentShift) {
        const formattedDate = currentShift.date
          ? new Date(currentShift.date).toISOString().split("T")[0]
          : "";

        setForm({
          userId: Number(currentShift.userId),
          workShiftId: Number(currentShift.workShiftId),
          //   date: currentShift.date ? currentShift.date.slice(0, 10) : "",
          date: formattedDate,
        });
        // Otomatis set filter unit sesuai unit user yang sedang diedit
        const userUnitId = activeUsers.find((u) => u.id === currentShift.userId)
          ?.position?.division?.id;
        if (userUnitId) setSelectedUnit(userUnitId.toString());
      }
    } catch (e) {
      console.error("Fetch data error:", e);
    }
  };

  useEffect(() => {
    if (selectedUnit === "") {
      setDisplayUsers(users);
    } else {
      const filtered = users.filter(
        (u) => u.position?.division?.id === parseInt(selectedUnit),
      );
      setDisplayUsers(filtered);
    }
  }, [selectedUnit, users]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //   await axios.put(
      //     `http://localhost:3000/shifts/${data}`,
      //     {
      //       userId: form.userId,
      //       workShiftId: form.workShiftId,
      //       date: form.date,
      //     },
      //     { headers: { Authorization: `Bearer ${token}` } },
      //   );

      await axiosInstance.put(`/shifts/${data}`, {
        userId: form.userId,
        workShiftId: form.workShiftId,
        date: form.date,
      });
      alert("Shift berhasil diperbarui!");
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal memperbarui shift");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Edit Jadwal Karyawan</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="label-form form-group">
              <label>
                Unit <span>*</span>
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                <option value="" disabled>
                  Pilih Unit
                </option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="label-form form-group">
              <label>
                Nama Karyawan <span>*</span>
              </label>
              <select name="userId" value={form.userId} onChange={handleChange}>
                <option value="" disabled>
                  Pilih karyawan
                </option>
                {displayUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.titlePrefix} {u.fullName || ""} ({u.nip})
                  </option>
                ))}
              </select>
            </div>
            <div className="label-form form-group">
              <label>
                Tanggal <span>*</span>
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </div>
            <div className="label-form form-group">
              <label>
                Sesi <span>*</span>
              </label>
              <select
                name="workShiftId"
                value={form.workShiftId}
                onChange={handleChange}
              >
                <option value="" disabled>
                  Pilih sesi
                </option>
                {workShifts.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}: ({ws.startTime} - {ws.endTime})
                  </option>
                ))}
              </select>
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
            <button type="submit" className="button is-purple">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
