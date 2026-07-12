import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
// import axios from "axios";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
// import "../../style/AttendanceReportPreview.css";
import { formatTime } from "../../utils/dateHelper.js";
import XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// import { saveAs } from "file-saver";
import axiosInstance from "../../api/axios.js";

const formatTanggalWaktuLengkap = () => {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    //   hour: "2-digit",
    //   minute: "2-digit",
    //   second: "2-digit",
    //   hour12: false,
  }).format(new Date());
};

const getDaysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};
const getDayName = (day, month, year) => {
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  return days[new Date(year, month - 1, day).getDay()];
};

const getRangeFromWeek = (weekString) => {
  if (!weekString) return { start: null, end: null };
  const [year, week] = weekString.split("-W");
  // Mulai dari tanggal 1 Januari tahun tersebut
  const firstDayOfYear = new Date(year, 0, 1);
  const days = (parseInt(week) - 1) * 7;

  // Cari hari Senin pertama di tahun tersebut
  const dayOffset =
    firstDayOfYear.getDay() <= 4
      ? firstDayOfYear.getDay() - 1
      : firstDayOfYear.getDay() + 6;
  const startOfWeek = new Date(year, 0, 1 + days - dayOffset);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return { start: startOfWeek, end: endOfWeek };
};

const AttendanceReportPreview = () => {
  //   const token = localStorage.getItem("token");
  const [attendances, setAttendances] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [reportType, setReportType] = useState("bulanan");

  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDept, setSelectedDept] = useState("SEMUA");
  const [selectedDiv, setSelectedDiv] = useState("SEMUA");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitData();
  }, []);

  const fetchInitData = async () => {
    setLoading(true);
    try {
      //   const [resAttend, resDepts, resDivs] = await Promise.all([
      //     axios.get("http://localhost:3000/attendances", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/departments", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/divisions", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //   ]);

      const [resAttend, resDepts, resDivs] = await Promise.all([
        axiosInstance.get("/attendances"),
        axiosInstance.get("/departments"),
        axiosInstance.get("/divisions"),
      ]);
      setAttendances(resAttend.data.data || []);
      setDepartments(resDepts.data.data || []);
      setDivisions(resDivs.data.data || []);
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedDeptId = departments.find((d) => d.name === selectedDept)?.id;

  const availableDivisions = useMemo(() => {
    if (selectedDept === "SEMUA" || selectedDept === "semua") return divisions;
    return divisions.filter((d) => d.departmentId === selectedDeptId);
  }, [selectedDept, selectedDeptId, divisions]);

  const resolveStatus = (att) => {
    const status = att.attendanceStatus?.toLowerCase();
    // 1. Cek Tidak Valid (Ada masuk, tidak ada pulang)
    if (att.checkInTime && !att.checkOutTime) return "TIDAK VALID";
    // 2. Cek Dinas Luar (Berdasarkan status dari DB)
    if (status === "dinas luar") return "DINAS LUAR";
    // 3. Cek Terlambat / Hadir
    if (status === "terlambat") return "TERLAMBAT";
    if (status === "hadir") return "HADIR";
    // 4. Cek Izin / Cuti
    if (status === "izin") return "IZIN";
    if (status === "cuti") return "CUTI";
    return "ALFA"; // Default jika tidak ada data
  };

  const reportData = useMemo(() => {
    const employeeMap = {};
    const weekRange = getRangeFromWeek(selectedWeek);
    // Filter data berdasarkan Departemen & Divisi terlebih dahulu
    const filteredRaw = attendances.filter((att) => {
      const matchDept =
        selectedDept === "SEMUA" ||
        att.user?.position?.division?.department?.name === selectedDept;
      const matchDiv =
        selectedDiv === "SEMUA" ||
        att.user?.position?.division?.name === selectedDiv;

      // Filter Waktu berdasarkan reportType
      const attDate = new Date(att.date);
      let matchTime = true;

      if (reportType === "bulanan") {
        const [year, month] = selectedPeriod.split("-");
        matchTime =
          attDate.getFullYear() === parseInt(year) &&
          attDate.getMonth() + 1 === parseInt(month);
      } else if (reportType === "tahunan") {
        matchTime = attDate.getFullYear() === parseInt(selectedYear);
      } else if (reportType === "mingguan" && weekRange.start) {
        // Filter berdasarkan range tanggal Senin - Minggu
        matchTime = attDate >= weekRange.start && attDate <= weekRange.end;
      }
      // Tambahkan logika mingguan jika diperlukan menggunakan lib moment/date-fns

      return matchDept && matchDiv && matchTime;
    });

    filteredRaw.forEach((att) => {
      const userId = att.user?.id;
      if (!userId) return;

      if (!employeeMap[userId]) {
        employeeMap[userId] = {
          name: [
            att.user?.titlePrefix,
            att.user?.fullName,
            att.user?.titleSuffix,
          ]
            .filter(Boolean)
            .join(" "),
          nip: att.user?.nip,
          records: {},
        };
      }

      const day = new Date(att.date).getDate();
      const month = new Date(att.date).getMonth() + 1;
      const dateObj = new Date(att.date);

      if (reportType === "bulanan") {
        employeeMap[userId].records[day] = {
          in: att.checkInTime,
          out: att.checkOutTime,
          status: resolveStatus(att),
        };
      } else if (reportType === "mingguan") {
        const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();
        employeeMap[userId].records[dayOfWeek] = {
          in: att.checkInTime,
          out: att.checkOutTime,
          status: resolveStatus(att),
        };
      } else {
        if (!employeeMap[userId].records[month]) {
          employeeMap[userId].records[month] = {
            H: 0,
            T: 0,
            DL: 0,
            C: 0,
            I: 0,
            A: 0,
            TV: 0,
          };
        }
        const s = resolveStatus(att);
        if (s === "HADIR") employeeMap[userId].records[month].H++;
        else if (s === "TERLAMBAT") employeeMap[userId].records[month].T++;
        else if (s === "DINAS LUAR") employeeMap[userId].records[month].DL++;
        else if (s === "CUTI") employeeMap[userId].records[month].C++;
        else if (s === "IZIN") employeeMap[userId].records[month].I++;
        else if (s === "TIDAK VALID") employeeMap[userId].records[month].TV++;
        else employeeMap[userId].records[month].A++;
      }
    });

    return Object.values(employeeMap);
  }, [
    attendances,
    reportType,
    selectedPeriod,
    selectedYear,
    selectedWeek,
    selectedDept,
    selectedDiv,
  ]);

  const daysInSelectedMonth = useMemo(() => {
    if (reportType !== "bulanan") return 7; // default untuk mingguan
    const [year, month] = selectedPeriod.split("-");
    return getDaysInMonth(parseInt(month), parseInt(year));
  }, [selectedPeriod, reportType]);

  const renderHeader = () => {
    const days = reportType === "bulanan" ? daysInSelectedMonth : 7;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agt",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];

    if (reportType === "mingguan") {
      const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
      const dates = ["1", "2", "3", "4", "5", "6", "7"];
      return (
        <thead>
          <tr>
            <th rowSpan="3">No</th>
            <th rowSpan="3">Nama Karyawan</th>
            {weekDays.map((day, i) => (
              <th
                key={i}
                colSpan="2"
                className="text-center"
                style={{ backgroundColor: "#d9ead3" }}
              >
                {day}
              </th>
            ))}
            <th rowSpan="3" style={{ backgroundColor: "#fff2cc" }}>
              Total Kehadiran
            </th>
          </tr>
          <tr>
            {dates.map((date, i) => (
              <th key={i} colSpan="2" className="text-center">
                {date}
              </th>
            ))}
          </tr>
          <tr>
            {weekDays.map((_, i) => (
              <React.Fragment key={i}>
                <th
                  className="text-center"
                  style={{ fontSize: "10px", backgroundColor: "#d9ead3" }}
                >
                  In
                </th>
                <th
                  className="text-center"
                  style={{ fontSize: "10px", backgroundColor: "#f4b6b6" }}
                >
                  Out
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
      );
    } else if (reportType === "bulanan") {
      const [year, month] = selectedPeriod.split("-");
      const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];
      const displayMonthYear = `${monthNames[parseInt(month) - 1]} - ${year}`;
      return (
        <thead>
          <tr>
            <th rowSpan="3">No</th>
            <th rowSpan="3" style={{ minWidth: "200px" }}>
              Nama Karyawan
            </th>
            <th colSpan={days}>{displayMonthYear}</th>
          </tr>
          <tr>
            {Array.from({ length: days }, (_, i) => (
              <th key={`day-${i}`} className="small-header">
                {getDayName(i + 1, parseInt(month), parseInt(year))}
              </th>
            ))}
          </tr>
          <tr>
            {Array.from({ length: days }, (_, i) => (
              <th key={i} className="small-header">
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
      );
    } else {
      const workingDays = [25, 24, 26, 25, 25, 24, 26, 25, 25, 24, 26, 25];
      return (
        <>
          {/* <thead>
          <tr>
            <th rowSpan="4">No</th>
            <th rowSpan="4" style={{ minWidth: "200px" }}>
              Nama Karyawan
            </th>
            <th colSpan="90" className="text-center">
              {selectedYear}
            </th>
          </tr>
          <tr>
            <th
              className="text-left"
              style={{ padding: "5px 10px", fontSize: "8px" }}
            >
              H: Hadir, T: Telat, DL: Dinas Luar, I: Izin, C: Cuti, TH: Tidak
              Hadir, TV: Tidak Valid
            </th>
            {months.map((m) => (
              <th key={m} colSpan="7">
                {m}
              </th>
            ))}
          </tr>
          <tr>
            {workingDays.map((days, i) => (
              <th key={i} colSpan="7" className="text-center">
                {days}
              </th>
            ))}
          </tr>
          <tr>
            {months.map((_, i) => (
              <React.Fragment key={i}>
                <th className="status-col h">H</th>
                <th className="status-col t">T</th>
                <th className="status-col dl">DL</th>
                <th className="status-col i">I</th>
                <th className="status-col c">C</th>
                <th className="status-col th">TH</th>
                <th className="status-col tv">TV</th>
              </React.Fragment>
            ))}
          </tr>
           <tr>
            {Array.from({ length: 12 }).map((_, i) => (
              <React.Fragment key={i}>
                <th className="status-col h">H</th>
                <th className="status-col t">T</th>
                <th className="status-col dl">DL</th>
                <th className="status-col i">I</th>
                <th className="status-col c">C</th>
                <th className="status-col th">TH</th>
                <th className="status-col tv">TV</th>
              </React.Fragment>
            ))}
          </tr> 
        </thead>*/}
          <thead>
            <tr>
              <th colSpan={3 + 12 * 7} className="text-center">
                {selectedYear}
              </th>
            </tr>
            <tr>
              <th rowSpan="4">No</th>
              <th className="text-left" style={{ fontSize: "8px" }}>
                H: Hadir, T: Telat, DL: Dinas Luar, I: Izin, C: Cuti, TH: Tidak
                Hadir, TV: Tidak Valid
              </th>
              {months.map((m) => (
                <th key={m} colSpan="7">
                  {m}
                </th>
              ))}
            </tr>
            <tr>
              <th className="text-left">Total Hari Kerja</th>
              {workingDays.map((days, i) => (
                <th key={i} colSpan="7" className="text-center">
                  {days}
                </th>
              ))}
            </tr>
            <tr>
              <th className="text-left" style={{ minWidth: "200px" }}>
                Nama Karyawan
              </th>
              {months.map((_, i) => (
                <React.Fragment key={i}>
                  <th className="status-col h">H</th>
                  <th className="status-col t">T</th>
                  <th className="status-col dl">DL</th>
                  <th className="status-col i">I</th>
                  <th className="status-col c">C</th>
                  <th className="status-col th">TH</th>
                  <th className="status-col tv">TV</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
        </>
      );
    }
  };

  return (
    <div className="content-page">
      <div className="table-content-card">
        <div className="header-actions">
          <div className="page-header-section">
            <h2 style={{ margin: "0" }}>RS BHAYANGKARA INDRAMAYU</h2>
            <h3 style={{ margin: "5px 0", fontWeight: "normal" }}>
              LAPORAN DATA PRESENSI {reportType.toUpperCase()}
            </h3>
            {/* <div className="section-divider" /> */}
          </div>
          <div className="right-actions">
            <button
              className="button is-danger"
              onClick={() => alert("Anda klik export PDF")}
            >
              <FaFilePdf /> Export PDF
            </button>
            <button className="button is-success">
              <FaFileExcel onClick={() => alert("Anda klik export Excel")} />
              Export Excel
            </button>
          </div>
        </div>

        <div className="header-actions">
          <div className="filter-group">
            <div className="custom-label-report">
              <label className="label-report">Jenis Laporan</label>
              <select
                value={reportType}
                className="select-input"
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="mingguan">Mingguan</option>
                <option value="bulanan">Bulanan</option>
                <option value="tahunan">Tahunan</option>
              </select>
            </div>
            <div className="custom-label-report">
              <label className="label-report">Fungsi</label>
              <select
                className="select-input"
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                }}
              >
                <option value="semua">Semua Fungsi</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="custom-label-report">
              <label className="label-report">Unit</label>
              <select
                className="select-input"
                value={selectedDiv}
                onChange={(e) => {
                  setSelectedDiv(e.target.value);
                }}
              >
                <option value="SEMUA">Semua Unit</option>
                {availableDivisions.map((div) => (
                  <option key={div.id} value={div.name}>
                    {div.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="custom-label-report">
              <label className="label-report">Periode</label>
              {reportType === "bulanan" && (
                <input
                  type="month"
                  className="select-input"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                />
              )}
              {reportType === "mingguan" && (
                <input
                  type="week"
                  className="select-input"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                />
              )}
              {reportType === "tahunan" && (
                <select
                  value={selectedYear}
                  className="select-input"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {[2024, 2025, 2026].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div style={{ alignSelf: "flex-end", fontSize: "13px" }}>
            Tanggal Cetak: {formatTanggalWaktuLengkap()}
          </div>
        </div>

        <div className="table-content-wrapper scroll-container">
          <table className="custom-report-table">
            {renderHeader()}
            <tbody>
              {reportData.map((emp, idx) => (
                <tr key={idx}>
                  <td className="text-center">{idx + 1}</td>
                  <td className="sticky-col">
                    <div className="emp-info">
                      <span className="emp-name">{emp.name}</span>
                      <span className="emp-nip">{emp.nip}</span>
                    </div>
                  </td>
                  {reportType === "tahunan"
                    ? Array.from({ length: 12 }, (_, i) => {
                        const mData = emp.records[i + 1] || {
                          H: 0,
                          T: 0,
                          DL: 0,
                          I: 0,
                          C: 0,
                          TH: 0,
                          TV: 0,
                        };
                        return (
                          <React.Fragment key={i}>
                            <td className="text-center">{mData.H}</td>
                            <td className="text-center">{mData.T}</td>
                            <td className="text-center">{mData.DL}</td>
                            <td className="text-center">{mData.I}</td>
                            <td className="text-center">{mData.C}</td>
                            <td className="text-center">{mData.TH}</td>
                            <td className="text-center">{mData.TV}</td>
                          </React.Fragment>
                        );
                      })
                    : Array.from(
                        {
                          length:
                            reportType === "bulanan" ? daysInSelectedMonth : 7,
                        },
                        (_, i) => {
                          const dayRec = emp.records[i + 1];
                          if (reportType === "mingguan") {
                            return (
                              <React.Fragment key={i}>
                                <td
                                  className="text-center time-cell"
                                  style={{ color: "green", fontWeight: "bold" }}
                                >
                                  {dayRec ? formatTime(dayRec.in) : "-"}
                                </td>
                                <td
                                  className="text-center time-cell"
                                  style={{ color: "red", fontWeight: "bold" }}
                                >
                                  {dayRec ? formatTime(dayRec.out) : "-"}
                                </td>
                              </React.Fragment>
                            );
                          }
                          return (
                            <td key={i} className="text-center time-cell">
                              {dayRec ? (
                                <div className="time-box">
                                  <span className="time-in">
                                    {formatTime(dayRec.in)}
                                  </span>
                                  <span className="time-out">
                                    {formatTime(dayRec.out)}
                                  </span>
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                          );
                        },
                      )}
                  {reportType === "mingguan" && (
                    <td
                      className="text-center"
                      style={{ fontWeight: "bold", backgroundColor: "#fff2cc" }}
                    >
                      {
                        // Menghitung jumlah record yang memiliki status HADIR, TERLAMBAT, atau DINAS LUAR
                        Object.values(emp.records).filter(
                          (rec) =>
                            rec.status === "HADIR" ||
                            rec.status === "TERLAMBAT" ||
                            rec.status === "DINAS LUAR",
                        ).length
                      }
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReportPreview;
