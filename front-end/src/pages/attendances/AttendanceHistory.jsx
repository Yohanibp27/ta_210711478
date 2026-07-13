import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AttendanceDetailModal from "../../components/modals/attendance/AttendanceDetailModal.jsx";
import EditAttendance from "../../components/modals/attendance/EditAttendance.jsx";
import Avatar from "../../assets/avatar-ungu.png";
import {
  formatTime,
  formatDateIndo,
  isCrossDay,
  formatToDatetimeLocalComplete,
} from "../../utils/dateHelper.js";
import {
  FaUser,
  FaUserCheck,
  FaUserClock,
  FaFileMedical,
  FaUserTimes,
  FaAngleLeft,
  FaAngleRight,
  FaSort,
  FaTrashAlt,
  FaPen,
  FaEye,
  FaSearch,
  FaArrowDown,
  FaArrowUp,
  FaPlus,
  FaTimes,
  FaMapMarkerAlt,
} from "react-icons/fa";
import axiosInstance from "../../api/axios.js";

function AttendanceHistory() {
  const today = new Date().toISOString().split("T")[0];
  const endDate = new Date(new Date().setDate(new Date().getDate() + 7))
    .toISOString()
    .split("T")[0];
  const [attendance, setAttendance] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  //   const [sort, setSort] = useState("latest");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  //   const itemsPerPage = 5;
  const itemsPerPage = 10;
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRows: 0,
    limit: 10,
  });
  const [filter, setFilter] = useState({
    karyawan: "semua",
    startDate: today,
    endDate: endDate,
  });
  const [status, setStatus] = useState({
    total: { count: 0, growth: 0 },
    hadir: { count: 0, growth: 0 },
    terlambat: { count: 0, growth: 0 },
    izin: { count: 0, growth: 0 },
    tidakHadir: { count: 0, growth: 0 },
  });
  const [departments, setdepartments] = useState([]);
  const [divisions, setdivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortIcon, setSortIcon] = useState({
    key: "date",
    direction: "asc",
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sortIcon.key === key && sortIcon.direction === "asc") {
      direction = "desc";
    }
    setSortIcon({ key, direction });
  };

  useEffect(() => {
    // getAttendances();
    fetchAttendanceHistory();
    fetchOrganizations();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    statusFilter,
    searchText,
    filter.karyawan,
    filter.startDate,
    filter.endDate,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // const res = await axiosInstance.get("/attendances/history");
        // const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        // setAttendance(data);

        const response = await axiosInstance.get("/attendances/history", {
          params: {
            page: currentPage,
            limit: 10,
            startDate: filter.startDate,
            endDate: filter.endDate,
            search_query: searchText,
            status: statusFilter,
          },
        });
        setAttendance(response.data.data || []);
        setStatus({
          total: { count: response.data.summary?.total || 0 },
          hadir: { count: response.data.summary?.hadir || 0 },
          terlambat: { count: response.data.summary?.terlambat || 0 },
          izin: { count: response.data.summary?.izin || 0 },
          tidakHadir: {
            count: response.data.summary?.tidakHadir || 0,
          },
        });
        setPagination(response.data.pagination);

        const start = new Date(filter.startDate);
        const end = new Date(filter.endDate);

        const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

        const prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - diffDays);

        const prevEnd = new Date(end);
        prevEnd.setDate(prevEnd.getDate() - diffDays);

        const filterRange = (list, startDate, endDate) => {
          return list.filter((d) => {
            const dt = new Date(d.date);
            return dt >= startDate && dt <= endDate;
          });
        };

        const currentData = filterRange(data, start, end);
        const prevData = filterRange(data, prevStart, prevEnd);

        const calcGrowth = (curr, prev) => {
          if (prev === 0) return curr > 0 ? 100 : 0;
          return (((curr - prev) / prev) * 100).toFixed(1);
        };

        const countStatus = (list, statusList) =>
          list.filter((d) => statusList.includes(d.attendanceStatus)).length;

        const newStatus = {
          total: {
            count: currentData.length,
            growth: calcGrowth(currentData.length, prevData.length),
          },

          hadir: {
            count: countStatus(currentData, ["Hadir", "Dinas Luar"]),
            growth: calcGrowth(
              countStatus(currentData, ["Hadir", "Dinas Luar"]),
              countStatus(prevData, ["Hadir", "Dinas Luar"]),
            ),
          },

          terlambat: {
            count: countStatus(currentData, ["Terlambat"]),
            growth: calcGrowth(
              countStatus(currentData, ["Terlambat"]),
              countStatus(prevData, ["Terlambat"]),
            ),
          },

          izin: {
            count: countStatus(currentData, ["Izin"]),
            growth: calcGrowth(
              countStatus(currentData, ["Izin"]),
              countStatus(prevData, ["Izin"]),
            ),
          },

          tidakHadir: {
            count: countStatus(currentData, ["Tidak Hadir"]),
            growth: calcGrowth(
              countStatus(currentData, ["Tidak Hadir"]),
              countStatus(prevData, ["Tidak Hadir"]),
            ),
          },
        };

        setStatus(newStatus);
      } catch (err) {
        console.error("Gagal hitung statistik:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter.startDate, filter.endDate]);

  //   const getAttendances = async () => {
  //     try {
  //       const response = await axiosInstance.get("/attendances");
  //       setAttendance(response.data.data || []);
  //     } catch (e) {
  //       console.error(e);
  //     }
  //   };

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get("/attendances/history", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          startDate: filter.startDate,
          endDate: filter.endDate,
          search_query: searchText,
          status: statusFilter,
        },
      });

      setAttendance(response.data.data || []);

      setStatus({
        total: {
          count: response.data.summary?.total || 0,
          growth: 0,
        },
        hadir: {
          count: response.data.summary?.hadir || 0,
          growth: 0,
        },
        terlambat: {
          count: response.data.summary?.terlambat || 0,
          growth: 0,
        },
        izin: {
          count: response.data.summary?.izin || 0,
          growth: 0,
        },
        tidakHadir: {
          count: response.data.summary?.tidakHadir || 0,
          growth: 0,
        },
      });

      setPagination(
        response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRows: 0,
          limit: itemsPerPage,
        },
      );
    } catch (error) {
      console.error(
        "Gagal mengambil riwayat presensi:",
        error.response?.data || error.message,
      );

      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, [currentPage, filter.startDate, filter.endDate, statusFilter, searchText]);

  const fetchOrganizations = async () => {
    try {
      const [deptRes, divRes] = await Promise.all([
        axiosInstance.get("/departments"),
        axiosInstance.get("/divisions"),
      ]);
      setdepartments(deptRes.data.data || deptRes.data);
      setdivisions(divRes.data.data || divRes.data);
    } catch (err) {
      console.error("Gagal memuat profesi:", err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/attendances/${id}`);
      //   getAttendances();
      fetchAttendanceHistory();
      alert("Data presensi berhasil dihapus!");
    } catch (e) {
      console.error(e);
    }
  };

  const calculateWorkDuration = (jamMasuk, jamPulang) => {
    if (!jamMasuk || !jamPulang) return "-";
    const masuk = new Date(jamMasuk);
    const pulang = new Date(jamPulang);
    if (isNaN(masuk) || isNaN(pulang)) return "-";
    const diffMs = pulang - masuk;
    if (diffMs <= 0) return "-";
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} jam ${minutes} menit`;
  };

  const RenderGrowth = ({ value }) => {
    if (parseFloat(value) === 0) {
      return (
        <span className="stat-text-dash gray" style={{ color: "black" }}>
          <span style={{ marginRight: "5px" }}></span> 0%
        </span>
      );
    }
    const isPositive = value > 0;
    return (
      <span className={`stat-text-dash ${isPositive ? "green" : "red"}`}>
        {isPositive ? <FaArrowUp /> : <FaArrowDown />} {Math.abs(value)}%
      </span>
    );
  };

  const filteredAttendance = attendance
    .filter((att) => {
      const fullName = [
        att.user?.titlePrefix,
        att.user?.fullName,
        att.user?.titleSuffix,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const nip = att.user?.nip?.toLowerCase() || "";
      const dept =
        att.user?.position?.division?.department?.name?.toLowerCase() || "";
      const div = att.user?.position?.division?.name?.toLowerCase() || "";

      const searchQuery = searchText.toLowerCase();

      const matchSearch =
        fullName.includes(searchQuery) ||
        nip.includes(searchQuery) ||
        dept.includes(searchQuery) ||
        div.includes(searchQuery);

      const matchStatus =
        statusFilter === "all" || att.attendanceStatus === statusFilter;
      const macthDepartment =
        filter.karyawan === "semua" ||
        dept.toLowerCase().trim() === filter.karyawan.toLowerCase().trim();
      const macthDivision =
        filter.karyawan === "semua" ||
        div.toLowerCase().trim() === filter.karyawan.toLowerCase().trim();

      const attDate = new Date(att.date);
      const start = new Date(filter.startDate);
      const end = new Date(filter.endDate);
      const matchDate = attDate >= start && attDate <= end;

      return (
        matchSearch &&
        matchStatus &&
        macthDepartment &&
        macthDivision &&
        matchDate
      );
    })
    .sort((a, b) => {
      if (sortIcon === "latest") return new Date(b.date) - new Date(a.date);
      return new Date(a.date) - new Date(b.date);
    });

  const sortedData = [...filteredAttendance].sort((a, b) => {
    let aValue;
    let bValue;

    switch (sortIcon.key) {
      case "tanggal":
        aValue = new Date(a.date);
        bValue = new Date(b.date);
        break;

      case "nama":
        aValue = (a.user?.fullName || "").toLowerCase();
        bValue = (b.user?.fullName || "").toLowerCase();
        break;

      case "sesi":
        aValue = a.user?.workShift?.name || "";
        bValue = b.user?.workShift?.name || "";
        break;

      case "checkin":
        aValue = new Date(a.checkInTime || 0);
        bValue = new Date(b.checkInTime || 0);
        break;

      case "checkout":
        aValue = new Date(a.checkOutTime || 0);
        bValue = new Date(b.checkOutTime || 0);
        break;

      case "duration": {
        const aIn = new Date(a.checkInTime || 0);
        const aOut = new Date(a.checkOutTime || 0);
        const bIn = new Date(b.checkInTime || 0);
        const bOut = new Date(b.checkOutTime || 0);

        aValue = aOut - aIn;
        bValue = bOut - bIn;
        break;
      }

      case "status":
        aValue = a.attendanceStatus || "";
        bValue = b.attendanceStatus || "";
        break;

      default:
        return 0;
    }

    if (aValue < bValue) return sortIcon.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortIcon.direction === "asc" ? 1 : -1;
    return 0;
  });

  //   const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  //   const indexFirst = (currentPage - 1) * itemsPerPage;
  //   const indexLast = indexFirst + itemsPerPage;
  //   const paginatedData = sortedData.slice(indexFirst, indexLast);
  const totalPages = pagination.totalPages;
  const indexFirst = (currentPage - 1) * pagination.limit;
  const indexLast = Math.min(
    indexFirst + attendance.length,
    pagination.totalRows,
  );
  const paginatedData = sortedData;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getShiftFromAttendance = (attend) => {
    const user = attend.user;
    if (!user) return null;
    // Jika tipe karyawan bukan shift, ambil default workShift user
    if (user.employmentType === "Non-Shift") {
      return user.workShift || null;
    }
    // Perbaikan: Gunakan workShiftId yang ada di level root objek attendance
    if (user.employmentType === "Shift") {
      // Cari shift assignment yang cocok dengan TANGGAL DAN ID SHIFT-nya
      const shiftAssign = user.shiftAssignments?.find(
        (sa) =>
          sa.date === attend.date && sa.workShiftId === attend.workShiftId,
      );
      // Jika ditemukan di assignments, kembalikan detail workShift-nya
      if (shiftAssign?.workShift) {
        return shiftAssign.workShift;
      }
      /* 
      Fallback: Jika data shiftAssignments tidak lengkap di response API, 
      pastikan backend mengirimkan detail workShift langsung di objek attendance.
      Namun berdasarkan JSON Anda, logika pencocokan ID di atas adalah solusi paling akurat.
    */
      return null;
    }
    return null;
  };

  return (
    <div className="content-page">
      <div className="filter-card">
        {loading ? (
          <>
            <div
              className="skeleton-text"
              style={{ width: "120px", height: "30px", marginBottom: "10px" }}
            ></div>
            <div className="filter-grid">
              {[1, 2, 3].map((item) => (
                <div key={item}>
                  <div
                    className="skeleton-text"
                    style={{
                      width: "80px",
                      height: "16px",
                      marginBottom: "8px",
                    }}
                  ></div>
                  <div
                    className="skeleton-box"
                    style={{
                      width: "100%",
                      height: "38px",
                      borderRadius: "8px",
                    }}
                  ></div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h3 className="title">Filter Riwayat</h3>
            <div className="filter-grid">
              <div>
                <label className="label">Fungsi</label>
                <select
                  className="select-input"
                  value={filter.karyawan}
                  onChange={(e) =>
                    setFilter({ ...filter, karyawan: e.target.value })
                  }
                >
                  <option value="semua">Semua Fungsi</option>
                  {departments.map((department, index) => (
                    <option key={index} value={department.name}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tanggal Mulai</label>
                <input
                  type="date"
                  className="date-input-normal"
                  style={{ width: "" }}
                  value={filter.startDate}
                  onChange={(e) =>
                    setFilter({ ...filter, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Tanggal Akhir</label>
                <input
                  type="date"
                  className="date-input-normal"
                  value={filter.endDate}
                  onChange={(e) =>
                    setFilter({ ...filter, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>

      <section className="status-grid-sect">
        {loading ? (
          [...Array(5)].map((_, i) => (
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
                <span className="stat-label-dash">Total Presensi</span>
                <span className="stat-value-dash">
                  {/* {filteredAttendance.length} */}
                  {status.total.count}
                </span>
                {/* <span className="stat-value-dash">{status.total.count}</span>  <div className="stat-sub-dash">
                  <span className="stat-text-dash">
                    <RenderGrowth value={status.total.growth} />
                  </span>{" "}
                  dari bulan lalu
                </div> */}
              </div>
              <div className="stat-icon-dash purple-light-dash">
                <FaUser />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Hadir</span>
                <span className="stat-value-dash">
                  {/* {
                    filteredAttendance.filter(
                      (a) => a.attendanceStatus === "Hadir",
                    ).length
                  } */}
                  {/* {
                    filteredAttendance.filter((a) =>
                      ["Hadir", "Dinas Luar"].includes(a.attendanceStatus),
                    ).length
                  } */}
                  {status.hadir.count}
                </span>
                {/* <span className="stat-value-dash">{status.hadir.count}</span>
                <div className="stat-sub-dash">
                  <span className="stat-text-dash">
                    <RenderGrowth value={status.hadir.growth} />
                  </span>{" "}
                  dari bulan lalu
                </div> */}
              </div>
              <div className="stat-icon-dash green-light-dash ">
                <FaUserCheck />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Terlambat</span>
                <span className="stat-value-dash">
                  {/* {
                    filteredAttendance.filter(
                      (a) => a.attendanceStatus === "Terlambat",
                    ).length
                  } */}
                  {status.terlambat.count}
                </span>
                {/* <span className="stat-value-dash">
                  {status.terlambat.count}
                </span>
                <div className="stat-sub-dash">
                  <span className="stat-text-dash">
                    <RenderGrowth value={status.terlambat.growth} />
                  </span>{" "}
                  dari bulan lalu
                </div> */}
              </div>
              <div className="stat-icon-dash orange-light-dash">
                <FaUserClock />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Izin</span>
                <span className="stat-value-dash">
                  {/* {
                    filteredAttendance.filter((a) =>
                      ["Sakit", "Izin"].includes(a.attendanceStatus),
                    ).length
                  } */}
                  {status.izin.count}
                </span>
                {/* <span className="stat-value-dash">{status.izin.count}</span>
                <div className="stat-sub-dash">
                  <span className="stat-text-dash">
                    <RenderGrowth value={status.izin.growth} />
                  </span>{" "}
                  dari bulan lalu
                </div> */}
              </div>
              <div className="stat-icon-dash gray-light-dash">
                <FaFileMedical />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Tidak Hadir</span>
                <span className="stat-value-dash">
                  {/* {
                    filteredAttendance.filter(
                      (a) => a.attendanceStatus === "Tidak Hadir",
                    ).length
                  } */}
                  {status.tidakHadir.count}
                </span>
                {/* <span className="stat-value-dash">
                  {status.tidakHadir.count}
                </span>
                <div className="stat-sub-dash">
                  <span className="stat-text-dash">
                    <RenderGrowth value={status.tidakHadir.growth} />
                  </span>{" "}
                  dari bulan lalu
                </div> */}
              </div>
              <div className="stat-icon-dash red-light-dash">
                <FaUserTimes />
              </div>
            </div>
          </>
        )}
      </section>

      <div className="table-content-card">
        {loading ? (
          <>
            <div className="table-header-top">
              <div
                className="skeleton-text"
                style={{ width: "200px", height: "30px" }}
              ></div>
              <div
                className="skeleton-text"
                style={{ width: "100px", height: "30px" }}
              ></div>
            </div>
            <div className="header-actions">
              <div className="search-wrapper">
                <div
                  className="search-input skeleton-text"
                  style={{ width: "100%", height: "38px", borderRadius: "8px" }}
                ></div>
              </div>
              <div className="filter-select-group">
                <div
                  className="skeleton-text"
                  style={{
                    width: "100%",
                    height: "38px",
                    borderRadius: "8px",
                  }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{
                    width: "100%",
                    height: "38px",
                    borderRadius: "8px",
                  }}
                ></div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="table-header-top">
              {/* <h3>Riwayat Presensi ({filteredAttendance.length})</h3> */}
              <h3>Riwayat Presensi ({pagination.totalRows})</h3>
              <div className="panel-actions-right">
                <button
                  type="button"
                  className="button is-success"
                  onClick={() => setShowAddModal(true)}
                >
                  <FaPlus /> Tambah Manual
                </button>
              </div>
            </div>
            <div className="header-actions">
              <div className="search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari nama atau NIP karyawan..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <div className="filter-select-group">
                <select
                  className="select-input"
                  value={filter.karyawan}
                  onChange={(e) =>
                    setFilter({ ...filter, karyawan: e.target.value })
                  }
                >
                  <option value="semua">Semua Unit</option>
                  {divisions.map((division, index) => (
                    <option key={index} value={division.name}>
                      {division.name}
                    </option>
                  ))}
                </select>
                <select
                  className="select-input"
                  value={statusFilter || "all"}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Semua Status</option>
                  <option value="Hadir">Hadir</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Izin">Izin</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Dinas Luar">Dinas Luar</option>
                  <option value="Tidak Hadir">Tidak Hadir</option>
                </select>
                {/* <select
              className="select-input"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="latest">Tanggal Terbaru</option>
              <option value="oldest">Tanggal Terlama</option>
            </select> */}
              </div>
            </div>
          </>
        )}
        <div className="table-content-wrapper">
          {loading ? (
            <div className="table-content">
              <table className="content-table">
                <thead>
                  <tr>
                    <th>
                      <div className="header-content">
                        Tanggal <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Nama <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Sesi <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Masuk <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Keluar <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Durasi Kerja <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Status <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      <div className="qr-loading-box">
                        <div className="qr-spinner"></div>
                        <p className="qr-loading">Memuat data presensi...</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="table-content">
              <table className="content-table">
                <thead>
                  <tr>
                    <th>
                      <div className="header-content">
                        Tanggal <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Nama <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Sesi <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Masuk <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Keluar <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Durasi Kerja <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Status <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      <div className="no-data">
                        <h4>Belum ada data presensi</h4>
                        <p>Data presensi karyawan akan muncul di sini</p>
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
                      className={`sortable-header ${sortIcon.key === "tanggal" ? "active-sort" : ""}`}
                      onClick={() => requestSort("tanggal")}
                    >
                      <div className="header-content">
                        Tanggal <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sortIcon.key === "nama" ? "active-sort" : ""}`}
                      onClick={() => requestSort("nama")}
                    >
                      <div className="header-content">
                        Nama <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sortIcon.key === "sesi" ? "active-sort" : ""}`}
                      onClick={() => requestSort("sesi")}
                    >
                      <div className="header-content">
                        Sesi <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sortIcon.key === "checkin" ? "active-sort" : ""}`}
                      onClick={() => requestSort("checkin")}
                    >
                      <div className="header-content">
                        Masuk <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sortIcon.key === "checkout" ? "active-sort" : ""}`}
                      onClick={() => requestSort("checkout")}
                    >
                      <div className="header-content">
                        Keluar <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sortIcon.key === "duration" ? "active-sort" : ""}`}
                      onClick={() => requestSort("duration")}
                    >
                      <div className="header-content">
                        Durasi Kerja <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sortIcon.key === "status" ? "active-sort" : ""}`}
                      onClick={() => requestSort("status")}
                    >
                      <div className="header-content">
                        Status <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((attend, i) => {
                    const shift = getShiftFromAttendance(attend);
                    const shiftName = shift?.name || "-";
                    return (
                      <tr key={attend.i || i}>
                        <td>{formatDateIndo(attend.date)}</td>
                        <td className="perf-name-cell">
                          <img
                            className="staff-avatar"
                            // className="user-avatar"
                            src={attend.user?.avatarUrl || Avatar}
                            alt="profile"
                          />
                          <div>
                            <div className="user-name">
                              {[attend.user?.titlePrefix, attend.user?.fullName]
                                .filter(Boolean)
                                .join(" ")}
                            </div>
                            <div className="user-nip">
                              {attend.user?.nip} -{" "}
                              {attend.user?.position?.name || "-"}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              shiftName.toLowerCase() === "pagi"
                                ? "pagi"
                                : shiftName.toLowerCase() === "siang"
                                  ? "siang"
                                  : shiftName.toLowerCase() === "malam"
                                    ? "malam"
                                    : ""
                            }`}
                          >
                            {shiftName}
                          </span>
                        </td>
                        <td>
                          {formatTime(attend.checkInTime)}
                          {isCrossDay(attend.date, attend.checkInTime) && (
                            <span className="cross-day"> (+1 hari)</span>
                          )}
                        </td>
                        <td>
                          {formatTime(attend.checkOutTime)}
                          {isCrossDay(attend.date, attend.checkOutTime) && (
                            <span className="cross-day"> (+1 hari)</span>
                          )}
                        </td>
                        <td>
                          {calculateWorkDuration(
                            attend.checkInTime,
                            attend.checkOutTime,
                          )}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              attend.attendanceStatus === "Hadir"
                                ? "hadir"
                                : attend.attendanceStatus === "Terlambat"
                                  ? "terlambat"
                                  : attend.attendanceStatus === "Tidak Hadir"
                                    ? "tidak-hadir"
                                    : attend.attendanceStatus === "Izin"
                                      ? "izin"
                                      : attend.attendanceStatus === "Cuti"
                                        ? "cuti"
                                        : attend.attendanceStatus ===
                                            "Dinas Luar"
                                          ? "dinas-luar"
                                          : attend.attendanceStatus ===
                                              "Tidak Valid"
                                            ? "tidak-valid"
                                            : ""
                            }`}
                          >
                            {attend.attendanceStatus}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="button is-warning"
                              onClick={() => setSelectedAttendance(attend)}
                            >
                              Detail
                            </button>

                            <Link
                              className="button is-info"
                              onClick={() => setShowEditModal(attend.id)}
                            >
                              Edit
                            </Link>
                            <button
                              className="button is-danger"
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    "Apakah Anda yakin ingin menghapus data presensi ini?",
                                  )
                                ) {
                                  await handleDelete(attend.id);
                                }
                              }}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="pag-footer-container">
            <div className="pag-footer-text">
              {/* Menampilkan {sortedData.length > 0 ? indexFirst + 1 : 0} -{" "}
              {Math.min(indexLast, sortedData.length)} dari {sortedData.length}{" "}
              data */}
              Menampilkan {pagination.totalRows > 0 ? indexFirst + 1 : 0} -{" "}
              {indexLast} dari {pagination.totalRows} data
            </div>
            <div className="center-pagination">
              <button
                className="pagination-arrow"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <FaAngleRight />
              </button>
            </div>
          </div>
        )}
      </div>
      <AddAttendance
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setAttendance();
          setShowAddModal(false);
        }}
      />
      {selectedAttendance && (
        <AttendanceDetailModal
          data={selectedAttendance}
          onClose={() => setSelectedAttendance(null)}
        />
      )}
      {showEditModal && (
        <EditAttendance
          data={showEditModal}
          onClose={() => setShowEditModal(null)}
          onSuccess={() => {
            // getAttendances();
            fetchAttendanceHistory();
            setShowEditModal(null);
          }}
        />
      )}
    </div>
  );
}

export default AttendanceHistory;

// Modal tambah presensi manual
const AddAttendance = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    userId: "",
    date: new Date().toISOString().split("T")[0],
    checkInTime: formatToDatetimeLocalComplete(new Date()),
    checkOutTime: "",
    checkInLocation: "",
    checkOutLocation: "",
    attendance: "INSIDE",
    source: "Manual",
    attendanceStatus: "Hadir",
    notes: "",
  });

  const [users, setUsers] = useState([]);
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get("/users");
      setUsers(res.data.data || []);
    } catch (err) {
      console.error("Gagal mengambil data user:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.userId) return alert("Pilih karyawan terlebih dahulu!");

    try {
      await axiosInstance.post("/attendances/admin", formData);
      alert("Presensi manual berhasil ditambahkan!");
      if (onSuccess) onSuccess();
      onClose();
      setFormData({
        userId: "",
        date: new Date().toISOString().split("T")[0],
        checkInTime: formatToDatetimeLocalComplete(new Date()),
        checkOutTime: "",
        checkInLocation: "",
        checkOutLocation: "",
        attendance: "INSIDE",
        attendanceStatus: "Hadir",
        source: "Manual",
        notes: "",
      });
    } catch (e) {
      console.error("Gagal tambah presensi:", e);
      alert(e.response?.data?.message || "Terjadi kesalahan sistem");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-user-card">
        <div className="modal-header">
          <h3>Tambah Presensi Manual</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Pilih Karyawan <span>*</span>
                  </label>
                  <select
                    className="select-input"
                    required
                    value={formData.userId}
                    onChange={(e) =>
                      setFormData({ ...formData, userId: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Pilih Karyawan
                    </option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} - {u.nip}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Tanggal <span>*</span>
                  </label>
                  <input
                    className="input-field"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Jam Masuk <span>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    required
                    value={formData.checkInTime}
                    onChange={(e) =>
                      setFormData({ ...formData, checkInTime: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label>Jam Keluar</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={formData.checkOutTime}
                    onChange={(e) =>
                      setFormData({ ...formData, checkOutTime: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Status <span>*</span>
                  </label>
                  <select
                    className="select-input"
                    value={formData.attendanceStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attendanceStatus: e.target.value,
                      })
                    }
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Terlambat">Terlambat</option>
                    <option value="Dinas Luar">Dinas Luar</option>
                    <option value="Izin">Izin</option>
                    <option value="Tidak Hadir">Tidak Hadir</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>Lokasi Masuk</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Input presensi manual tidak perlu koordinat lat, long"
                    disabled
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label>Lokasi Keluar</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Input presensi manual tidak perlu koordinat lat, long"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Keterangan <span>*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Input manual oleh admin"
                    className="input-field"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    required
                  ></textarea>
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
            <button type="submit" className="button is-purple">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
