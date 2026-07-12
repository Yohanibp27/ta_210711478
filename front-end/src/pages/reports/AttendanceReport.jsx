// LAPORAN PRESENSI HANYA MENAMPILKAN DATA MENTAH JADI KARYAWAN TERBAIK BUKAN DI SINI
import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
import {
  FaUsers,
  FaChartLine,
  FaClock,
  FaTrophy,
  FaSearch,
  FaFilePdf,
  FaFileExcel,
  FaEye,
  FaSort,
  FaAngleRight,
  FaAngleLeft,
  FaFileAlt,
  FaDownload,
  FaShare,
  FaFileImport,
  FaFileExport,
} from "react-icons/fa";
import Avatar from "../../assets/avatar-ungu.png";
import axiosInstance from "../../api/axios.js";

const AttendanceReport = () => {
  //   const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().substring(0, 7),
  );
  const [attendances, setAttendances] = useState([]);
  const [users, setUsers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const userPerPage = 10;
  const [sort, setSort] = useState({
    key: "nama",
    direction: "asc",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      //   const [divRes, shiftRes, userRes, attRes] = await Promise.all([
      //     axios.get("http://localhost:3000/divisions", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/workshifts", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/users", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/attendances", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //   ]);

      const [divRes, shiftRes, userRes, attRes] = await Promise.all([
        axiosInstance.get("/divisions"),
        axiosInstance.get("/workshifts"),
        axiosInstance.get("/users"),
        axiosInstance.get("/attendances"),
      ]);
      setDivisions(divRes.data.data || []);
      setShifts(shiftRes.data.data || []);
      setUsers(userRes.data.data || []);
      setAttendances(attRes.data.data || []);
    } catch (e) {
      console.log("Gagal memuat data", e);
    } finally {
      setLoading(false);
    }
  };

  const processedData = useMemo(() => {
    const [year, month] = selectedPeriod.split("-").map(Number);
    const totalHariKerja = new Date(year, month, 0).getDate();

    return users.map((user) => {
      const userAtt = attendances.filter((a) => {
        const isUser = a.userId === user.id || a.user?.id === user.id;
        if (!a.date) return false;
        const [attYear, attMonth] = a.date.split("-").map(Number);
        return isUser && attYear === year && attMonth === month;
      });

      let hadirCount = 0;
      let terlambatCount = 0;
      let dinasLuarCount = 0;
      let izinCount = 0;
      let cutiCount = 0;
      let tidakHadirCount = 0;
      let tidakValidCount = 0;
      let totalLateMinutes = 0;

      userAtt.forEach((curr) => {
        if (curr.attendanceStatus === "Hadir") {
          hadirCount++;
        } else if (curr.attendanceStatus === "Terlambat") {
          terlambatCount++;
        } else if (curr.attendanceStatus === "Dinas Luar") {
          dinasLuarCount++;
        } else if (curr.attendanceStatus === "Izin") {
          izinCount++;
        } else if (curr.attendanceStatus === "Cuti") {
          cutiCount++;
        } else if (curr.attendanceStatus === "Tidak Hadir") {
          tidakHadirCount++;
        } else if (curr.attendanceStatus === "Tidak Valid") {
          tidakValidCount++;
        }

        if (curr.checkInTime && curr.attendanceStatus === "Terlambat") {
          try {
            const checkInDate = new Date(curr.checkInTime);
            const hIn = checkInDate.getHours();
            const mIn = checkInDate.getMinutes();
            let hShift = 7;
            let mShift = 0;
            if (user.shiftAssignments && user.shiftAssignments.length > 0) {
              const assignedShift = user.shiftAssignments.find(
                (sa) => sa.date === curr.date,
              );
              if (assignedShift) {
                const shiftDetail = shifts.find(
                  (s) => s.id === assignedShift.workShiftId,
                );
                if (shiftDetail?.startTime) {
                  const [h, m] = shiftDetail.startTime.split(":").map(Number);
                  hShift = h;
                  mShift = m;
                }
              }
            }
            const totalMinutesIn = hIn * 60 + mIn;
            const totalMinutesShift = hShift * 60 + mShift;
            const TOLERANSI = 15;
            let calcIn = totalMinutesIn;
            if (hShift >= 18 && hIn < 12) calcIn += 1440;
            if (calcIn > totalMinutesShift + TOLERANSI) {
              totalLateMinutes += calcIn - totalMinutesShift;
            }
          } catch (err) {
            console.error("Error calc minutes:", err);
          }
        }
      });

      const fisikHadir = hadirCount + terlambatCount;
      const skorValue =
        totalHariKerja > 0 ? (fisikHadir / totalHariKerja) * 100 : 0;
      const avgLate =
        terlambatCount > 0 ? Math.round(totalLateMinutes / terlambatCount) : 0;

      return {
        id: user.id,
        nip: user.nip || "-",
        nama:
          [user.titlePrefix, user.fullName].filter(Boolean).join(" ") || "-",
        divisi: user.position?.division?.name || "-",
        avatarUrl: user.profilePhoto
          ? //   ? `http://localhost:3000/uploads/profilePhotos/${user.profilePhoto}`
            `/uploads/profilePhotos/${user.profilePhoto}`
          : Avatar,
        hadir: hadirCount,
        telat: terlambatCount,
        terlambat: `${avgLate} mnt`,
        dinasLuar: dinasLuarCount,
        izin: izinCount,
        cuti: cutiCount,
        tidakHadir: tidakHadirCount,
        tidakValid: tidakValidCount,
        skor: Math.min(parseFloat(skorValue.toFixed(1)), 100),
        avgLateRaw: totalLateMinutes,
      };
    });
  }, [users, attendances, selectedPeriod, shifts]);

  const filteredData = useMemo(() => {
    return processedData.filter((item) => {
      const matchSearch = item.nama
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchDivision =
        selectedDivision === "all" ||
        selectedDivision === "" ||
        item.divisi === selectedDivision;

      return matchSearch && matchDivision;
    });
  }, [processedData, searchTerm, selectedDivision]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aValue = a[sort.key];
      let bValue = b[sort.key];

      if (sort.key === "terlambat") {
        aValue = parseFloat(a.terlambat);
        bValue = parseFloat(b.terlambat);
      }

      if (aValue < bValue) return sort.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sort]);

  const requestSort = (key) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const summaryStats = useMemo(() => {
    if (filteredData.length === 0) {
      return { avgTotal: 0, frequentLate: 0, bestEmployee: "-" };
    }

    const totalSkor = filteredData.reduce((acc, curr) => acc + curr.skor, 0);
    const avgTotal = (totalSkor / filteredData.length).toFixed(1);

    const frequentLate = filteredData.filter((item) => item.telat > 3).length;

    const totalAbsence = filteredData.reduce((acc, curr) => {
      return acc + (curr.izin || 0) + (curr.cuti || 0) + (curr.tidakHadir || 0);
    }, 0);

    const bestEmployee = [...filteredData].sort((a, b) => {
      if (b.skor !== a.skor) return b.skor - a.skor;
      return a.avgLateRaw - b.avgLateRaw;
    })[0];

    return {
      avgTotal,
      frequentLate,
      totalAbsence,
      bestEmployee: bestEmployee?.nama || "-",
    };
  }, [filteredData]);

  const currentData = useMemo(() => {
    const indexOfLastItem = currentPage * userPerPage;
    const indexOfFirstItem = indexOfLastItem - userPerPage;
    return sortedData.slice(indexOfFirstItem, indexOfLastItem);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / userPerPage);
  const indexOfLastItem = currentPage * userPerPage;
  const indexOfFirstItem = indexOfLastItem - userPerPage;

  const importExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      alert("Sedang memproses import, mohon tunggu...");
      //   const response = await axios.post(
      //     "http://localhost:3000/attendances/import",
      //     formData,
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //         "Content-Type": "multipart/form-data",
      //       },
      //     },
      //   );

      const response = await axiosInstance.post(
        "/attendances/import",
        formData,
      );
      console.log("Hasil Import Attendances:", response.data);
      alert("Import Presensi Berhasil!");
      fetchInitialData();
      e.target.value = null;
    } catch (error) {
      console.error("Gagal import attendance excel:", error);
      alert(
        "Gagal import file: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  return (
    <div className="content-page">
      <section className="status-grid-sect">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="stat-card-dash">
              <div className="stat-info-dash">
                <div
                  className="skeleton-text"
                  style={{ width: "120px", height: "16px" }}
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
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Karyawan</span>
                <span className="stat-value-dash">{filteredData.length}</span>
              </div>
              <div className="stat-icon-dash blue-light-dash">
                <FaUsers />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Rata-rata Kehadiran</span>
                <span className="stat-value-dash">
                  {summaryStats.avgTotal}%
                </span>
              </div>
              <div className="stat-icon-dash green-light-dash">
                <FaChartLine />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">
                  Pernah Terlambat {">"} 3x
                </span>
                {/* <span className="stat-label-dash">
                  Pernah Terlambat &gt; 3x
                </span> */}
                <span className="stat-value-dash">
                  {summaryStats.frequentLate}{" "}
                  <small style={{ fontSize: "14px" }}>Orang</small>
                </span>
              </div>
              <div className="stat-icon-dash orange-light-dash">
                <FaClock />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">
                  Total Izin/Cuti/Tidak Hadir
                </span>
                <span className="stat-value-dash">
                  {summaryStats.totalAbsence}{" "}
                  <small style={{ fontSize: "14px" }}>Hari</small>
                </span>
              </div>
              <div className="stat-icon-dash red-light-dash">
                <FaFileAlt />
              </div>
            </div>
            {/* <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Terbaik Bulan Ini</span>
                <span className="stat-value-dash" style={{ fontSize: "18px" }}>
                  {summaryStats.bestEmployee}
                </span>
              </div>
              <div className="stat-icon-dash yellow-light-dash">
                <FaTrophy />
              </div>
            </div> */}
          </>
        )}
      </section>

      <div className="table-content-card">
        {loading ? (
          <div className="header-actions">
            <div className="search-wrapper">
              <div
                className="search-input skeleton-text"
                style={{ width: "100%", height: "38px", borderRadius: "8px" }}
              ></div>
            </div>
            <div className="panel-actions-right">
              <div
                className="skeleton-box"
                style={{
                  width: "180px",
                  height: "40px",
                  borderRadius: "8px",
                  marginTop: "5px",
                }}
              ></div>
              <div
                className="skeleton-box"
                style={{
                  width: "180px",
                  height: "40px",
                  borderRadius: "8px",
                  marginTop: "5px",
                }}
              ></div>
              <div
                className="skeleton-text"
                style={{
                  width: "100px",
                  height: "40px",
                  borderRadius: "8px",
                }}
              ></div>
              <div
                className="skeleton-text"
                style={{
                  width: "100px",
                  height: "40px",
                  borderRadius: "8px",
                }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="header-actions">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Cari nama karyawan..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="panel-actions-right">
              <select
                className="select-input"
                value={selectedDivision}
                onChange={(e) => {
                  setSelectedDivision(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">Semua Unit</option>
                {divisions.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              <input
                type="month"
                className="select-input"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              />

              <button
                className="button is-success"
                // onClick={() => alert("anda klik import laporan presensi")}
                onClick={() => document.getElementById("importFile").click()}
              >
                <FaFileImport /> Import
              </button>
              <input
                type="file"
                id="importFile"
                hidden
                accept=".xlsx"
                onChange={importExcel}
              />
              <button
                className="button is-info"
                onClick={() => navigate("/attendance/preview")}
              >
                <FaFileExport />
                Export
              </button>
            </div>
          </div>
        )}
        <div className="table-content-wrapper">
          {loading ? (
            <div className="table-content">
              <table className="content-table">
                <thead>
                  <tr>
                    <th>
                      <div className="header-content">
                        Nama <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Hadir <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Terlambat <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Dinas Luar <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Izin <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Cuti <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Tidak Hadir <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Tidak Valid <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Kehadiran <FaSort className="sort-icon" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="10" style={{ textAlign: "center" }}>
                      <div className="qr-loading-box">
                        <div className="qr-spinner"></div>
                        <p className="qr-loading">Memuat data presensi...</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-content">
              <table className="content-table">
                <thead>
                  <tr>
                    <th
                      className={`sortable-header ${sort.key === "nama" ? "active-sort" : ""}`}
                      onClick={() => requestSort("nama")}
                    >
                      <div className="header-content">
                        Nama <FaSort className="sort-icon" />
                      </div>
                    </th>
                    {/* <th
                      className={`sortable-header ${sort.key === "divisi" ? "active-sort" : ""}`}
                      onClick={() => requestSort("divisi")}
                    >
                      <div className="header-content">
                        Unit <FaSort className="sort-icon" />
                      </div>
                    </th> */}
                    <th
                      className={`sortable-header ${sort.key === "hadir" ? "active-sort" : ""}`}
                      onClick={() => requestSort("hadir")}
                    >
                      <div className="header-content">
                        Hadir <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "telat" ? "active-sort" : ""}`}
                      onClick={() => requestSort("telat")}
                    >
                      <div className="header-content">
                        Terlambat <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "dinasLuar" ? "active-sort" : ""}`}
                      onClick={() => requestSort("dinasLuar")}
                    >
                      <div className="header-content">
                        Dinas Luar <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "izin" ? "active-sort" : ""}`}
                      onClick={() => requestSort("izin")}
                    >
                      <div className="header-content">
                        Izin <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "cuti" ? "active-sort" : ""}`}
                      onClick={() => requestSort("cuti")}
                    >
                      <div className="header-content">
                        Cuti <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "tidakHadir" ? "active-sort" : ""}`}
                      onClick={() => requestSort("tidakHadir")}
                    >
                      <div className="header-content">
                        Tidak Hadir <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "tidakValid" ? "active-sort" : ""}`}
                      onClick={() => requestSort("tidakValid")}
                    >
                      <div className="header-content">
                        Tidak Valid <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "skor" ? "active-sort" : ""}`}
                      onClick={() => requestSort("skor")}
                    >
                      <div className="header-content">
                        Kehadiran <FaSort className="sort-icon" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((item, index) => (
                      <tr key={index}>
                        <td className="perf-name-cell">
                          <img
                            className="staff-avatar"
                            src={item.avatarUrl}
                            alt={item.nama}
                          />
                          <div>
                            <div className="user-name">{item.nama}</div>
                            <div className="user-nip">
                              {item.nip} - {item.divisi}
                            </div>
                          </div>
                        </td>
                        {/* <td>
                          <span className="badge-text">{item.divisi}</span>
                        </td> */}
                        <td>{item.hadir}</td>
                        <td>{item.telat}</td>
                        <td>{item.dinasLuar}</td>
                        <td>{item.izin}</td>
                        <td>{item.cuti}</td>
                        <td>{item.tidakHadir}</td>
                        <td>{item.tidakValid}</td>
                        <td>
                          <div className="progress-wrapper">
                            <div className="progress-container">
                              <div
                                className="progress-bar-table"
                                style={{ width: `${item.skor}%` }}
                              ></div>
                            </div>
                            <span className="progress-text">{item.skor}%</span>
                          </div>
                        </td>
                        {/* <td>{item.terlambat}</td>
                        <td>
                          <Link
                            to={`/attendance-detail/${item.id}`}
                            className="button is-info"
                          >
                            <FaEye />
                          </Link>
                        </td> */}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center" }}>
                        <div className="no-data">
                          <h4 className="empty-title">
                            Belum ada data presensi
                          </h4>
                          <p className="empty-desc">
                            Data presensi akan muncul di sini
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="pag-footer-container">
            <p className="pag-footer-text">
              Menampilkan {sortedData.length > 0 ? indexOfFirstItem + 1 : 0} -{" "}
              {Math.min(indexOfLastItem, sortedData.length)} dari{" "}
              {sortedData.length} data
            </p>
            <div className="right-pagination">
              <button
                className="pagination-arrow"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || totalPages === 0}
              >
                <FaAngleLeft />
              </button>
              {(() => {
                let startPage;
                if (totalPages <= 3) {
                  startPage = 1;
                } else if (currentPage === 1) {
                  startPage = 1;
                } else if (currentPage === totalPages) {
                  startPage = totalPages - 2;
                } else {
                  startPage = currentPage - 1;
                }
                const pagesToRender = [];
                for (let i = 0; i < Math.min(3, totalPages); i++) {
                  pagesToRender.push(startPage + i);
                }
                return pagesToRender.map((num) => (
                  <button
                    key={num}
                    className={`pagination-number ${currentPage === num ? "active" : ""}`}
                    onClick={() => setCurrentPage(num)}
                  >
                    {num}
                  </button>
                ));
              })()}
              <button
                className="pagination-arrow"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <FaAngleRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReport;
