import React, { useState, useEffect } from "react";
// import axios from "axios";
// import "../../style/ShiftExchange.css";
import Avatar from "../../assets/avatar-ungu.png";
import {
  FaAngleLeft,
  FaAngleRight,
  FaArrowDown,
  FaArrowRight,
  FaArrowUp,
  FaCalendarCheck,
  FaCheck,
  FaCheckCircle,
  FaHourglassHalf,
  FaSearch,
  FaSort,
  FaTimes,
  FaTimesCircle,
} from "react-icons/fa";
import {
  formatTanggalPendek,
  formatTanggalLengkap,
  formatDateIndo,
} from "../../utils/dateHelper";
import axiosInstance from "../../api/axios.js";

const UserCard = ({ user, label }) => (
  <div className="user-card">
    <div className="user-label">{label}</div>
    <div className="user-details">
      <img
        src={user.avatarUrl || Avatar}
        alt={user.name}
        className="user-avatar"
      />
      <div className="user-text">
        <div className="user-info">
          <span className="user-name">{user.name}</span>
          <span className="user-title">{user.title}</span>
        </div>
      </div>
    </div>
  </div>
);

const ShiftDetail = ({ shift, label, type = "exchange" }) => (
  <div
    className={`shift-detail ${type}`}
    style={{ backgroundColor: shift.color }}
  >
    <div className="shift-label">{label}</div>
    <div className="shift-info" style={{ color: shift.textColor }}>
      {shift.type} - {shift.date}
    </div>
    <div className="shift-time" style={{ color: shift.textColor }}>
      {shift.time}
    </div>
  </div>
);

function ShiftExchangeList() {
  //   const token = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;
  const role = user?.role?.toLowerCase();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7),
  );
  const [exchangeData, setExchangeData] = useState([]);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  //   const [selectedRejectId, setSelectedRejectId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [divisions, setDivisions] = useState([]);
  const [selectedDiv, setSelectedDiv] = useState("semua");
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [counts, setCounts] = useState({
    total: { value: 0, growth: 0 },
    menunggu: { value: 0, growth: 0 },
    disetujui: { value: 0, growth: 0 },
    ditolak: { value: 0, growth: 0 },
  });
  const [sort, setSort] = useState({ key: "div", direction: "asc" });

  const requestSort = (key) => {
    let direction = "asc";
    if (sort.key === key && sort.direction === "asc") {
      direction = "desc";
    }
    setSort({ key, direction });
  };

  //   useEffect(() => {
  //     fetchExchanges();
  //     fetchDivisions();
  //   }, []);

  useEffect(() => {
    fetchExchanges();
  }, [selectedMonth]);

  useEffect(() => {
    fetchDivisions();
  }, []);

  const fetchExchanges = async () => {
    setLoading(true);
    try {
      //   const res = await axios.get("http://localhost:3000/all-shift-exchanges", {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });

      //   const dept =
      //     user?.position?.division?.department?.name?.toLowerCase() || "";
      //   const isWasinternManager =
      //     role === "manager" && dept.includes("subbag wasintern");
      //   let endpoint = "";

      //   if (role === "manager" && !isWasinternManager) {
      //     endpoint = "http://localhost:3000/shift-exchanges/manager";
      //   } else {
      //     // admin, admin super, supervisor, manager wasintern (SDM RS)
      //     endpoint = "http://localhost:3000/all-shift-exchanges";
      //   }

      let endpoint = "";
      const dept =
        user?.position?.division?.department?.name?.toLowerCase() || "";
      const isWasintern = dept.includes("subbag wasintern");
      const isManagerOrSupervisor = role === "manager" || role === "supervisor";
      if (role === "admin") {
        endpoint = "http://localhost:3000/all-shift-exchanges";
      } else if (isManagerOrSupervisor && isWasintern) {
        // SDM (Wasintern)
        endpoint = "http://localhost:3000/all-shift-exchanges";
      } else if (isManagerOrSupervisor) {
        // Manager/Supervisor biasa
        endpoint = "http://localhost:3000/shift-exchanges/manager";
      } else {
        return alert("Role tidak memiliki akses!");
      }

      //   const res = await axios.get(endpoint, {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });
      const res = await axiosInstance.get(endpoint);
      const allData = res.data.data;

      //   const now = new Date();
      //   const currentMonth = now.getMonth();
      //   const currentYear = now.getFullYear();
      //   const thisMonthData = allData.filter((d) => {
      //     const date = new Date(d.createdAt);
      //     return (
      //       date.getMonth() === currentMonth && date.getFullYear() === currentYear
      //     );
      //   });
      //   const lastMonthData = allData.filter((d) => {
      //     const date = new Date(d.createdAt);
      //     const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      //     const yearOfLastMonth =
      //       currentMonth === 0 ? currentYear - 1 : currentYear;
      //     return (
      //       date.getMonth() === lastMonth &&
      //       date.getFullYear() === yearOfLastMonth
      //     );
      //   });

      const [selYear, selMonth] = selectedMonth.split("-").map(Number);
      const filteredBySelectedMonth = allData.filter((d) => {
        const date = new Date(d.createdAt);
        return (
          date.getMonth() + 1 === selMonth && date.getFullYear() === selYear
        );
      });
      const prevDate = new Date(selYear, selMonth - 2);
      const prevMonth = prevDate.getMonth() + 1;
      const prevYear = prevDate.getFullYear();

      const filteredByLastMonth = allData.filter((d) => {
        const date = new Date(d.createdAt);
        return (
          date.getMonth() + 1 === prevMonth && date.getFullYear() === prevYear
        );
      });

      const calculateGrowth = (current, last) => {
        if (last === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - last) / last) * 100);
      };
      const getStats = (dataList) => ({
        total: dataList.length,
        menunggu: dataList.filter((d) => d.status === "pending").length,
        disetujui: dataList.filter((d) => d.status === "approved").length,
        ditolak: dataList.filter((d) => d.status === "rejected").length,
      });
      //   const currentStats = getStats(thisMonthData);
      //   const prevStats = getStats(lastMonthData);
      const currentStats = getStats(filteredBySelectedMonth);
      const prevStats = getStats(filteredByLastMonth);

      setCounts({
        total: {
          value: currentStats.total,
          growth: calculateGrowth(currentStats.total, prevStats.total),
        },
        menunggu: {
          value: currentStats.menunggu,
          growth: calculateGrowth(currentStats.menunggu, prevStats.menunggu),
        },
        disetujui: {
          value: currentStats.disetujui,
          growth: calculateGrowth(currentStats.disetujui, prevStats.disetujui),
        },
        ditolak: {
          value: currentStats.ditolak,
          growth: calculateGrowth(currentStats.ditolak, prevStats.ditolak),
        },
      });
      //   const data = res.data.data.map((ex) => ({
      const data = allData.map((ex) => ({
        ...ex,
        submittedDate: formatTanggalPendek(ex.createdAt),
        proposer: {
          //   name: `${ex.requester.titlePrefix} ${ex.requester.fullName || ""}`,
          name: [ex.requester.titlePrefix, ex.requester?.fullName]
            .filter((item) => item && item !== "")
            .join(" "),
          title: ex.requester.position?.name,
          nip: ex.requester.nip,
          avatarUrl: ex.requester.avatarUrl,
        },
        target: {
          //   name: `${ex.partner.titlePrefix} ${ex.partner.fullName || ""}`,
          name: [ex.partner.titlePrefix, ex.partner?.fullName]
            .filter((item) => item && item !== "")
            .join(" "),
          title: ex.partner.position?.name,
          nip: ex.partner.nip,
          avatarUrl: ex.partner.avatarUrl,
        },
        shiftToExchange: {
          type: ex.requesterShift.shiftDetail.name,
          date: formatTanggalLengkap(ex.requesterShift.date),
          shortDate: formatTanggalPendek(ex.requesterShift.date),
          time: `${ex.requesterShift.shiftDetail.startTime.slice(0, 5)} - ${ex.requesterShift.shiftDetail.endTime.slice(0, 5)}`,
          color: "#FEE2E2",
          textColor: "#991B1B",
        },
        shiftDesired: {
          type: ex.partnerShift.shiftDetail.name,
          date: formatTanggalLengkap(ex.partnerShift.date),
          shortDate: formatTanggalPendek(ex.partnerShift.date),
          time: `${ex.partnerShift.shiftDetail.startTime.slice(0, 5)} - ${ex.partnerShift.shiftDetail.endTime.slice(0, 5)}`,
          color: "#D1FAE5",
          textColor: "#065F46",
        },
        manager: ex.manager
          ? {
              name: `${ex.manager.titlePrefix || ""} ${ex.manager.fullName || ""}`.trim(),
              title: ex.manager.position?.name,
            }
          : null,
        sdm: ex.sdm
          ? {
              name: `${ex.sdm.titlePrefix || ""} ${ex.sdm.fullName || ""}`.trim(),
              title: ex.sdm.position?.name,
            }
          : null,
        statusIndo:
          ex.status === "pending"
            ? "Menunggu"
            : ex.status === "approved"
              ? "Disetujui"
              : ex.status === "rejected"
                ? "Ditolak"
                : ex.status === "cancelled"
                  ? "Dibatalkan"
                  : "Kedaluwarsa",
      }));

      setExchangeData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisions = async () => {
    try {
      //   const response = await axios.get("http://localhost:3000/divisions", {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });
      const response = await axiosInstance.get("/divisions");
      setDivisions(response.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredData = exchangeData
    .filter((d) => {
      const dateObj = new Date(d.createdAt);
      const yearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
      const matchesMonth = yearMonth === selectedMonth;

      const matchesStatus =
        selectedStatus === "semua" ||
        d.status.toLowerCase() ===
          selectedStatus.replace("approved", "approved");

      const matchesSearch =
        d.proposer.name.toLowerCase().includes(searchText.toLowerCase()) ||
        d.target.name.toLowerCase().includes(searchText.toLowerCase());

      const matchesDiv =
        selectedDiv === "semua" || d.requester.division?.name === selectedDiv;

      return matchesMonth && matchesStatus && matchesSearch && matchesDiv;
    })
    .sort((a, b) => {
      const isAsc = sort.direction === "asc" ? 1 : -1;
      if (sort.key === "pengaju")
        return a.proposer.name.localeCompare(b.proposer.name) * isAsc;
      if (sort.key === "tanggal")
        return (
          new Date(a.requesterShift.date) -
          new Date(b.requesterShift.date) * isAsc
        );
      return 0;
    });

  const approveShift = async (id, note) => {
    try {
      //   let endpoint = "";
      //   const dept =
      //     user?.position?.division?.department?.name?.toLowerCase() || "";
      //   const isWasinternManager =
      //     role === "manager" && dept.includes("subbag wasintern");
      //   if (role === "supervisor" || role === "admin" || isWasinternManager) {
      //     endpoint = `http://localhost:3000/shift-exchange/${id}/sdm/approve`;
      //   } else if (role === "manager") {
      //     endpoint = `http://localhost:3000/shift-exchange/${id}/manager/approve`;
      //   } else {
      //     return alert("Role tidak memiliki hak persetujuan!");
      //   }

      let endpoint = "";
      const dept =
        user?.position?.division?.department?.name?.toLowerCase() || "";
      const isWasintern = dept.includes("subbag wasintern");
      const isManagerOrSupervisor = role === "manager" || role === "supervisor";
      if (role === "admin") {
        endpoint = `/shift-exchange/${id}/sdm/approve`;
      } else if (isManagerOrSupervisor && isWasintern) {
        // SDM (Wasintern)
        endpoint = `/shift-exchange/${id}/sdm/approve`;
      } else if (isManagerOrSupervisor) {
        // Manager biasa
        endpoint = `/shift-exchange/${id}/manager/approve`;
      } else {
        return alert("Role tidak memiliki hak persetujuan!");
      }

      const response = await axiosInstance.put(endpoint, {
        decisionNote: note,
      });

      alert(response.data.message);
      fetchExchanges(); // refresh data
      setSelectedExchange(null);
    } catch (e) {
      console.log("Gagal menyetujui pertukaran", e);
      alert("Gagal menyetujui pertukaran");
    }
  };

  const rejectShift = async (id, note) => {
    try {
      //   let endpoint = "";
      //   const dept =
      //     user?.position?.division?.department?.name?.toLowerCase() || "";
      //   const isWasinternManager =
      //     role === "manager" && dept.includes("subbag wasintern");
      //   if (role === "supervisor" || role === "admin" || isWasinternManager) {
      //     endpoint = `http://localhost:3000/shift-exchange/${id}/sdm/reject`;
      //   } else if (role === "manager") {
      //     endpoint = `http://localhost:3000/shift-exchange/${id}/manager/reject`;
      //   } else {
      //     return alert("Role tidak memiliki hak penolakan!");
      //   }

      let endpoint = "";
      const dept =
        user?.position?.division?.department?.name?.toLowerCase() || "";
      const isWasintern = dept.includes("subbag wasintern");
      const isManagerOrSupervisor = role === "manager" || role === "supervisor";
      if (role === "admin") {
        endpoint = `/shift-exchange/${id}/sdm/reject`;
      } else if (isManagerOrSupervisor && isWasintern) {
        // SDM (Wasintern)
        endpoint = `/shift-exchange/${id}/sdm/reject`;
      } else if (isManagerOrSupervisor) {
        // Manager biasa
        endpoint = `/shift-exchange/${id}/manager/reject`;
      } else {
        return alert("Role tidak memiliki hak persetujuan!");
      }

      const response = await axiosInstance.put(endpoint, {
        decisionNote: note,
      });

      alert(response.data.message);
      fetchExchanges();
      await fetchExchanges();
      setSelectedExchange(null);
    } catch (e) {
      console.log("Gagal menolak pertukaran", e);
      alert("Gagal menolak pertukaran");
    }
  };

  const openDetail = (data) => {
    setSelectedExchange(data);
    setShowDetailModal(true);
  };

  const isApprovalExpired = (startDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const limitDate = new Date(start);
    limitDate.setDate(start.getDate() - 1);
    return today > limitDate;
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

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentRequest = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

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
                <span className="stat-label-dash">Total Pengajuan</span>
                <span className="stat-value-dash">{counts.total.value}</span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={counts.total.growth} /> dari bulan lalu
                </div>
              </div>
              <div className="stat-icon-dash purple-light-dash">
                <FaCalendarCheck />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Menunggu</span>
                <span className="stat-value-dash">{counts.menunggu.value}</span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={counts.menunggu.growth} /> dari bulan
                  lalu
                </div>
              </div>
              <div className="stat-icon-dash orange-light-dash">
                <FaHourglassHalf />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Disetujui</span>
                <span className="stat-value-dash">
                  {counts.disetujui.value}
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={counts.disetujui.growth} /> dari bulan
                  lalu
                </div>
              </div>
              <div className="stat-icon-dash green-light-dash">
                <FaCheckCircle />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Ditolak</span>
                <span className="stat-value-dash">{counts.ditolak.value}</span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={counts.ditolak.growth} /> dari bulan lalu
                </div>
              </div>
              <div className="stat-icon-dash red-light-dash">
                <FaTimesCircle />
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
                style={{ width: "260px", height: "30px" }}
              ></div>
              <div
                className="skeleton-box"
                style={{ width: "180px", height: "38px" }}
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
                    width: "355px",
                    height: "38px",
                    borderRadius: "8px",
                  }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{
                    width: "355px",
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
              <h3>Daftar Pengajuan Tukar Shift</h3>
              <div className="panel-actions-right">
                <input
                  type="month"
                  className="select-input"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
            </div>
            <div className="header-actions">
              <div className="search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari nama karyawan..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <div className="filter-select-group">
                <select
                  className="select-input"
                  value={selectedDiv}
                  onChange={(e) => {
                    setSelectedDiv(e.target.value);
                  }}
                >
                  <option value="semua">Semua Unit</option>
                  {divisions.map((div) => (
                    <option key={div.id} value={div.name}>
                      {div.name}
                    </option>
                  ))}
                </select>
                <select
                  className="select-input"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="semua">Semua Status</option>
                  <option value="pending">Menunggu</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Ditolak</option>
                </select>
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
                        Pengaju <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Target <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Tanggal Shift <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Pertukaran Shift <FaSort className="sort-icon" />
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
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      <div className="qr-loading-box">
                        <div className="qr-spinner"></div>
                        <p className="qr-loading">Memuat data pertukaran...</p>
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
                      className={`sortable-header ${sort.key === "pengaju" ? "active-sort" : ""}`}
                      onClick={() => requestSort("pengaju")}
                    >
                      <div className="header-content">
                        Tanggal Pengajuan
                        <FaSort
                          className={`sort-icon ${sort.key === "pengaju" ? "active" : ""}`}
                        />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "pengaju" ? "active-sort" : ""}`}
                      onClick={() => requestSort("pengaju")}
                    >
                      <div className="header-content">
                        Pengaju
                        <FaSort
                          className={`sort-icon ${sort.key === "pengaju" ? "active" : ""}`}
                        />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "target" ? "active-sort" : ""}`}
                      onClick={() => requestSort("target")}
                    >
                      <div className="header-content">
                        Target
                        <FaSort
                          className={`sort-icon ${sort.key === "target" ? "active" : ""}`}
                        />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "tanggal" ? "active-sort" : ""}`}
                      onClick={() => requestSort("tanggal")}
                    >
                      <div className="header-content">
                        Tanggal Shift
                        <FaSort
                          className={`sort-icon ${sort.key === "tanggal" ? "active" : ""}`}
                        />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "tukar" ? "active-sort" : ""}`}
                      onClick={() => requestSort("tukar")}
                    >
                      <div className="header-content">
                        Pertukaran Shift
                        <FaSort
                          className={`sort-icon ${sort.key === "tukar" ? "active" : ""}`}
                        />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "status" ? "active-sort" : ""}`}
                      onClick={() => requestSort("status")}
                    >
                      <div className="header-content">
                        Status
                        <FaSort
                          className={`sort-icon ${sort.key === "status" ? "active" : ""}`}
                        />
                      </div>
                    </th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {/* {filteredData.length > 0 ? ( */}
                  {/* filteredData.map((data) => ( */}
                  {currentRequest.length > 0 ? (
                    currentRequest.map((data) => (
                      <tr key={data.id}>
                        {/* <td>{formatTanggalLengkap(data.createdAt)}</td> */}
                        <td style={{ textAlign: "center" }}>
                          {formatDateIndo(data.createdAt)}
                        </td>
                        <td>
                          <div className="perf-name-cell">
                            <img
                              className="staff-avatar"
                              src={data.proposer.avatarUrl || Avatar}
                              alt={data.proposer.name}
                            />
                            <div>
                              <div className="user-name">
                                {data.proposer.name}
                              </div>
                              <div className="user-nip">
                                {/* {data.proposer.nip || "-"} -{" "} */}
                                {data.proposer.title || "-"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="perf-name-cell">
                            <img
                              className="staff-avatar"
                              src={data.target.avatarUrl || Avatar}
                              alt={data.target.name}
                            />
                            <div>
                              <div className="user-name">
                                {data.target.name}
                              </div>
                              <div className="user-nip">
                                {/* {data.target.nip || "-"} -{" "} */}
                                {data.target.title || "-"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {data.shiftToExchange.shortDate}{" "}
                          <span className="arrow-sep">
                            <FaArrowRight />
                          </span>
                          {data.shiftDesired.shortDate}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${data.shiftToExchange.type.toLowerCase() === "pagi" ? "pagi" : data.shiftToExchange.type.toLowerCase() === "siang" ? "siang" : "malam"}`}
                          >
                            {data.shiftToExchange.type}
                          </span>
                          <span className="arrow-sep">
                            <FaArrowRight />
                          </span>
                          <span
                            className={`status-badge ${data.shiftDesired.type.toLowerCase() === "pagi" ? "pagi" : data.shiftDesired.type.toLowerCase() === "siang" ? "siang" : "malam"}`}
                          >
                            {data.shiftDesired.type}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${data.status.toLowerCase() === "pending" ? "pending" : data.status.toLowerCase() === "approved" ? "approved" : data.status.toLowerCase() === "rejected" ? "rejected" : data.status.toLowerCase() === "cancelled" ? "cancelled" : "expired"}`}
                          >
                            {data.statusIndo}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="button is-warning"
                              onClick={() => openDetail(data)}
                            >
                              Detail
                            </button>
                            {(() => {
                              //   const status = data.status?.toLowerCase();
                              //   const partner = data.partnerStatus;
                              //   const manager = data.managerStatus;
                              //   const sdm = data.sdmStatus;
                              //   const dept =
                              //     user?.position?.division?.department?.name?.toLowerCase() ||
                              //     "";
                              //   const isWasinternManager =
                              //     role === "manager" &&
                              //     dept.includes("subbag wasintern");

                              //   if (
                              //     (role === "manager" || role === "admin") &&
                              //     status === "pending" &&
                              //     partner === "approved" &&
                              //     manager !== "approved" &&
                              //     manager !== "rejected"
                              //   ) {
                              //     // MANAGER (partner → manager → SDM)
                              //     //   if (
                              //     //     (role === "manager" || role === "admin") &&
                              //     //     status === "pending" &&
                              //     //     data.partnerStatus === "approved"
                              //     //   )
                              //     return (
                              //       <>
                              //         <button
                              //           className="button is-success"
                              //           onClick={() => approveShift(data.id)}
                              //         >
                              //           <FaCheck />
                              //         </button>
                              //         <button
                              //           className="button is-danger"
                              //           onClick={() => {
                              //             setSelectedRejectId(data.id);
                              //             setShowRejectModal(true);
                              //             setSelectedExchange(data);
                              //           }}
                              //         >
                              //           <FaTimes />
                              //         </button>
                              //       </>
                              //     );
                              //   }

                              //   // ✅ SUPERVISOR (SDM) (partner → manager → SDM)
                              //   console.log(
                              //     "apakah manager dari wasintern",
                              //     isWasinternManager,
                              //   );
                              //   console.log("partnerStatus:", data.partnerStatus);
                              //   console.log("managerStatus:", data.managerStatus);
                              //   //   if (
                              //   //     (role === "supervisor" || role === "admin") &&
                              //   //     data.partnerStatus === "approved" &&
                              //   //     (status === "pending" || status === "approved")
                              //   //   )
                              //   //   if (
                              //   //     (role === "supervisor" || role === "admin") &&
                              //   //     status === "pending" &&
                              //   //     data.partnerStatus === "approved" &&
                              //   //     data.managerStatus === "approved"
                              //   //   ) {

                              //   if (
                              //     (role === "supervisor" ||
                              //       role === "admin" ||
                              //       isWasinternManager) &&
                              //     status === "pending" &&
                              //     partner === "approved" &&
                              //     manager === "approved" &&
                              //     sdm !== "approved" &&
                              //     sdm !== "rejected"
                              //   ) {
                              //     return (
                              //       <>
                              //         <button
                              //           className="button is-success"
                              //           onClick={() => approveShift(data.id)}
                              //         >
                              //           <FaCheck />
                              //         </button>
                              //         <button
                              //           className="button is-danger"
                              //           onClick={() => {
                              //             setSelectedRejectId(data.id);
                              //             setShowRejectModal(true);
                              //             setSelectedExchange(data);
                              //           }}
                              //         >
                              //           <FaTimes />
                              //         </button>
                              //       </>
                              //     );
                              //   }
                              const currentStatus = data.status?.toLowerCase();
                              const isFinalStatus = [
                                "approved",
                                "rejected",
                                "cancelled",
                                "expired",
                              ].includes(currentStatus);

                              // 🚫 Jangan tampilkan tombol kalau sudah final
                              if (isFinalStatus) return null;

                              // 🚫 Hati-hati! Di Shift Exchange gunakan data.expiryDate atau tanggal shift untuk cek expired
                              // Kita gunakan opsi aman memanggil tanggal shift requester jika ada
                              if (
                                data.requesterShift?.date &&
                                isApprovalExpired(data.requesterShift.date)
                              ) {
                                return null;
                              }

                              // Deteksi department user login
                              const dept =
                                user?.position?.division?.department?.name?.toLowerCase() ||
                                "";
                              const isWasinternManager =
                                role === "manager" &&
                                dept.includes("subbag wasintern");

                              // ✅ KONDISI MUTLAK UNTUK SEMUA ROLE: Partner harus "approved" baru bisa diproses atasan/admin
                              const isPartnerApproved =
                                data.partnerStatus?.toLowerCase() ===
                                "approved";

                              if (!isPartnerApproved) return null; // Cegah semua tombol jika partner belum setuju

                              // ✅ MANAGER
                              console.log("ROLE MANAGER LOGIN:", role);
                              if (
                                role === "manager" &&
                                !isWasinternManager &&
                                data.managerStatus?.toLowerCase() === "pending"
                              ) {
                                return (
                                  <>
                                    <button
                                      className="button is-success"
                                      onClick={() => {
                                        setSelectedExchange(data);
                                        setShowApprovedModal(true);
                                      }}
                                    >
                                      <FaCheck />
                                    </button>
                                    <button
                                      className="button is-danger"
                                      onClick={() => {
                                        setSelectedExchange(data);
                                        setShowRejectModal(true);
                                      }}
                                    >
                                      <FaTimes />
                                    </button>
                                  </>
                                );
                              }

                              // ✅ SUPERVISOR / SDM
                              console.log("ROLE SDM LOGIN:", role);
                              if (
                                (role === "supervisor" || isWasinternManager) &&
                                // role === "supervisor" &&
                                data.managerStatus?.toLowerCase() ===
                                  "approved" &&
                                data.sdmStatus?.toLowerCase() === "pending"
                              ) {
                                return (
                                  <>
                                    <button
                                      className="button is-success"
                                      onClick={() => {
                                        setSelectedExchange(data);
                                        setShowApprovedModal(true);
                                      }}
                                    >
                                      <FaCheck />
                                    </button>
                                    <button
                                      className="button is-danger"
                                      onClick={() => {
                                        setSelectedExchange(data);
                                        setShowRejectModal(true);
                                      }}
                                    >
                                      <FaTimes />
                                    </button>
                                  </>
                                );
                              }

                              {
                                /* ✅ ADMIN IT (SUPER USER BYPASS) */
                              }
                              console.log("ROLE ADMIN LOGIN:", role);
                              if (
                                role === "admin" &&
                                currentStatus === "pending"
                              ) {
                                return (
                                  <>
                                    <button
                                      className="button is-success"
                                      onClick={() => {
                                        setSelectedExchange(data);
                                        setShowApprovedModal(true);
                                      }}
                                    >
                                      <FaCheck />
                                    </button>
                                    <button
                                      className="button is-danger"
                                      onClick={() => {
                                        setSelectedExchange(data);
                                        setShowRejectModal(true);
                                      }}
                                    >
                                      <FaTimes />
                                    </button>
                                  </>
                                );
                              }
                              console.log({
                                role,
                                status: data.status,
                                managerStatus: data.managerStatus,
                                sdmStatus: data.sdmStatus,
                                expired: isApprovalExpired(data.startDate),
                              });
                              return null;
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center" }}>
                        <div className="no-data">
                          <h4 className="empty-title">
                            Belum ada data pertukaran shift
                          </h4>
                          <p className="empty-desc">
                            Data pertukaran shift akan muncul di sini
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
              Menampilkan {filteredData.length > 0 ? indexOfFirst + 1 : 0} -{" "}
              {Math.min(indexOfLast, filteredData.length)} dari{" "}
              {filteredData.length} data
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
      {/* {showDetailModal && selectedExchange && (
        <DetailShiftModal
          data={selectedExchange}
          onClose={() => setShowDetailModal(false)}
        />
      )}
      {showRejectModal && (
        <RejectShiftModal
          onClose={() => setShowRejectModal(false)}
          onSuccess={async (note) => {
            await rejectShift(selectedRejectId, note);
            setShowRejectModal(false);
          }}
          show={showRejectModal}
          data={selectedExchange}
        />
        )} */}
      <DetailShiftModal
        show={showDetailModal}
        data={selectedExchange}
        onClose={() => setShowDetailModal(false)}
        onApproved={() => {
          setShowDetailModal(false);
          setShowApprovedModal(true);
        }}
        onRejected={() => {
          setShowDetailModal(false);
          setShowRejectModal(true);
        }}
      />
      <ApproveShiftModal
        show={showApprovedModal}
        data={selectedExchange}
        onClose={() => setShowApprovedModal(false)}
        onConfirm={(note) => {
          approveShift(selectedExchange.id, note);
          setShowApprovedModal(false);
        }}
        userRole={user.role}
      />
      <RejectShiftModal
        show={showRejectModal}
        data={selectedExchange}
        onClose={() => setShowRejectModal(false)}
        onConfirm={async (note) => {
          rejectShift(selectedExchange.id, note);
          setShowRejectModal(false);
        }}
        userRole={user.role}
      />
    </div>
  );
}

export default ShiftExchangeList;

// Modal detail pertukaran shift
const DetailShiftModal = ({
  data,
  onClose,
  show,
  onApproved,
  onRejected,
  user,
  role,
}) => {
  if (!show || !data) return null;

  // 1. Ambil status-status penting (ubah ke lowercase untuk keamanan komparasi)
  const currentStatus = data.status?.toLowerCase();
  const managerStatus = data.managerStatus?.toLowerCase();
  const sdmStatus = data.sdmStatus?.toLowerCase();
  const partnerStatus = data.partnerStatus?.toLowerCase();

  // 2. Deteksi departemen User Login vs Departemen Pengaju (Proposer)
  const userDeptId = user?.position?.division?.department?.id;
  const requesterDeptId = data.proposer?.position?.division?.department?.id;
  const isSameDepartment =
    userDeptId && requesterDeptId && userDeptId === requesterDeptId;

  const userDeptName =
    user?.position?.division?.department?.name?.toLowerCase() || "";
  const isWasintern = userDeptName.includes("subbag wasintern");
  const isPartnerApproved = partnerStatus === "approved";

  // 3. SELEKSI OTORISASI TOMBOL (Aturan Bisnis Mutlak)

  // A. Akses Tahap 1: Manager/Supervisor dari Departemen yang SAMA dengan Pengaju
  const canApproveAsManager =
    ["manager", "supervisor"].includes(role) &&
    isSameDepartment &&
    managerStatus === "pending" &&
    isPartnerApproved &&
    currentStatus === "pending";

  // B. Akses Tahap 2: Supervisor atau Manager dari Subbag Wasintern (Bertindak sebagai SDM)
  // Hanya bisa tampil JIKA Manager departemen asal SUDAH menyetujui
  const canApproveAsSDM =
    (role === "supervisor" || (role === "manager" && isWasintern)) &&
    managerStatus === "approved" &&
    sdmStatus === "pending" &&
    isPartnerApproved &&
    currentStatus === "pending";

  // C. Akses Super User: Admin IT (Bypass)
  const canBypassAsAdmin =
    role === "admin" && isPartnerApproved && currentStatus === "pending";

  // Gabungkan semua kondisi otorisasi
  const showActionButtons =
    canApproveAsManager || canApproveAsSDM || canBypassAsAdmin;

  const StatusStep = ({ label, status, date, actor }) => {
    const getColor = () => {
      if (data.status === "cancelled") return "red";
      if (status === "approved") return "green";
      if (status === "rejected") return "red";
      return "gray";
    };

    const getText = () => {
      if (data.status === "cancelled") return "Dibatalkan";
      if (status === "approved") return "Disetujui";
      if (status === "rejected") return "Ditolak";
      return "Menunggu";
    };

    return (
      <div className={`status-step ${getColor()}`}>
        <div className="status-label">{label}</div>
        <div className="status-value">{getText()}</div>
        {actor && (
          <div className="status-actor">
            oleh: <strong>{actor}</strong>
          </div>
        )}
        {date && (
          <div className="status-date">{formatTanggalLengkap(date)}</div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-user-card">
        <div className="modal-header">
          <h3>Detail Pertukaran Shift</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="detail-expand-wrapper">
          {data.status === "cancelled" && (
            <div className="cancelled-banner">
              Pengajuan ini telah dibatalkan oleh pengaju
            </div>
          )}
          <div className="approval-status-flow">
            <div className="status-title">Status Persetujuan Pengajuan</div>
            <div className="status-steps">
              <StatusStep
                label="Rekan Shift"
                status={data.partnerStatus}
                date={data.partnerDecisionAt}
                actor={data.target.name}
              />
              <StatusStep
                label="Kepala Ruangan"
                status={data.managerStatus}
                date={data.managerDecisionAt}
                actor={data.manager?.name}
              />
              <StatusStep
                label="SDM"
                status={data.sdmStatus}
                date={data.sdmDecisionAt}
                actor={data.sdm?.name}
              />
            </div>
          </div>
          <div className="exchange-detail-card">
            <div className="user-comparison">
              <UserCard user={data.proposer} label="Pengaju" />
              <UserCard user={data.target} label="Target Pertukaran" />
            </div>
            <div className="shift-comparison">
              <ShiftDetail
                shift={data.shiftToExchange}
                label="Shift Asli:"
                type="exchange"
              />
              <ShiftDetail
                shift={data.shiftDesired}
                label="Menjadi Shift:"
                type="desired"
              />
            </div>
            {/* <div className="reason-section">
              <div className="status-header">
                <strong>Alasan Pengajuan:</strong>
                {formatTanggalLengkap(data.createdAt)}
              </div>
              <p className="reason-text">{data.reason || "-"}</p>
            </div> */}

            <div className="section">
              {/* <div className="status-header">
                <h3 style={{ marginBottom: "10px" }}>Catatan Pengajuan</h3>
                {formatTanggalLengkap(data.createdAt)}
              </div> */}
              <h3 style={{ marginBottom: "10px" }}>Catatan Pengajuan</h3>
              <div className="note-text-display">{data.reason || "-"}</div>
            </div>
          </div>

          {/* {data.partnerDecisionNote && (
            <div className="rec-box danger">
              <div className="status-header">
                <strong>Alasan Penolakan Rekan Shift:</strong>
                <p className="reject-result-text">
                  Direview pada {formatTanggalLengkap(data.partnerDecisionAt)}
                </p>
              </div>
              {data.partnerDecisionNote}
            </div>
          )}
          {data.managerDecisionNote && (
            <div className="rec-box danger">
              <div className="status-header">
                <strong>Alasan Penolakan Kepala Ruangan:</strong>
                <p className="reject-result-text">
                  Direview pada {formatTanggalLengkap(data.managerDecisionAt)}
                </p>
              </div>
              {data.managerDecisionNote}
            </div>
          )}
          {data.sdmDecisionNote && (
            <div className="rec-box danger">
              <div className="status-header">
                <strong>Alasan Penolakan SDM:</strong>
                <p className="reject-result-text">
                  Direview pada {formatTanggalLengkap(data.sdmDecisionAt)}
                </p>
              </div>
              {data.sdmDecisionNote}
            </div>
          )} */}

          {/* {data.partnerStatus === "approved" && (
            <div className="approval-box approved-box">
              <h3>DISETUJUI REKAN SHIFT</h3>
              <p
                className={
                  data.partnerStatus === "rejected"
                    ? "error-text"
                    : "success-text"
                }
              >
                {data.partnerDecisionNote}
              </p>
              <p className="meta">
                Oleh:{" "}
                {[data.partner?.titlePrefix, data.partner?.fullName]
                  .filter(Boolean)
                  .join(" ")}{" "}
                | Pada: {formatDateIndo(data.partnerDecisionAt)}
              </p>
            </div>
          )}
          {data.managerStatus === "approved" && (
            <div className="approval-box approved-box">
              <h3>DISETUJUI MANAGER</h3>
              <p
                className={
                  data.managerStatus === "rejected"
                    ? "error-text"
                    : "success-text"
                }
              >
                {data.managerDecisionNote}
              </p>
              <p className="meta">
                Oleh:{" "}
                {[data.manager?.titlePrefix, data.manager?.fullName]
                  .filter(Boolean)
                  .join(" ")}{" "}
                | Pada: {formatDateIndo(data.managerDecisionAt)}
              </p>
            </div>
          )}
          {data.sdmStatus === "approved" && (
            <div className="approval-box approved-box">
              <h3>DISETUJUI SDM</h3>
              <p
                className={
                  data.sdmStatus === "rejected" ? "error-text" : "success-text"
                }
              >
                {data.sdmDecisionNote}
              </p>
              <p className="meta">
                Oleh:{" "}
                {[data.sdm?.titlePrefix, data.sdm?.fullName]
                  .filter(Boolean)
                  .join(" ") || "SDM"}{" "}
                | Pada: {formatDateIndo(data.sdmDecisionAt)}
              </p>
            </div>
          )} */}

          {data.partnerStatus === "rejected" && (
            <div className="approval-box rejected-box">
              <h3>ALASAN PENOLAKAN REKAN SHIFT</h3>
              <p className="error-text">{data.partnerDecisionNote}</p>
              <p className="meta">
                Oleh:{" "}
                {[data.partner?.titlePrefix, data.partner?.fullName]
                  .filter(Boolean)
                  .join(" ")}{" "}
                | Pada: {formatDateIndo(data.partnerDecisionAt)}
              </p>
            </div>
          )}
          {data.managerStatus === "rejected" && (
            <div className="approval-box rejected-box">
              <h3>ALASAN PENOLAKAN MANAGER</h3>
              <p className="error-text">{data.managerDecisionNote}</p>
              <p className="meta">
                Oleh: {data.manager?.name} | Pada:{" "}
                {formatDateIndo(data.managerDecisionAt)}
              </p>
            </div>
          )}
          {data.sdmStatus === "rejected" && (
            <div className="approval-box rejected-box">
              <h3>ALASAN PENOLAKAN SDM</h3>
              <p className="error-text">{data.sdmDecisionNote}</p>
              <p className="meta">
                Oleh: {data.sdm?.name} | Pada:{" "}
                {formatDateIndo(data.sdmDecisionAt)}
              </p>
            </div>
          )}
        </div>

        {/* {data.status === "pending" && ( */}
        {showActionButtons && (
          <div className="modal-footer">
            <button className="button is-danger" onClick={onRejected}>
              Tolak Pertukaran
            </button>
            <button className="button is-success" onClick={onApproved}>
              Setujui Pertukaran
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Modal setujui pertukaran shift
const ApproveShiftModal = ({ show, data, onClose, onConfirm, userRole }) => {
  const [note, setNote] = useState("");
  if (!show || !data) return null;
  const isAdmin = userRole?.toLowerCase() === "admin";
  console.log("Status Admin Login Modal (shift exchange):", isAdmin);

  const handleSubmit = () => {
    // Validasi: Jika Admin IT dan catatan kosong, hentikan proses
    if (isAdmin && (!note || note.trim() === "")) {
      alert(
        "Admin IT wajib mengisi catatan keputusan sebagai bukti bypass sistem!",
      );
      return;
    }
    // Jalankan fungsi onConfirm dengan membawa catatan persetujuan
    onConfirm(note);
    setNote(""); // Reset form setelah sukses
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Setujui Pertukaran Shift</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="section-box">
            <div className="detail-row">
              <span>Nama Pengaju</span>
              <strong>{data.proposer?.name}</strong>
            </div>
            <div className="detail-row">
              <span>Nama Rekan</span>
              <strong>{data.target?.name}</strong>
            </div>
            <div className="detail-row">
              <span>Jadwal Pengaju</span>
              <strong>{data.shiftToExchange?.date}</strong>
            </div>
            <div className="detail-row">
              <span>Jadwal Rekan</span>
              <strong>{data.shiftDesired?.date}</strong>
            </div>
          </div>

          <div className="approve-note">
            {/* <label>
              Catatan Persetujuan <span className="optional">(opsional)</span>
            </label> */}
            <label>
              Catatan Persetujuan
              {isAdmin ? (
                <span className="required" style={{ fontSize: "11px" }}>
                  {" "}
                  (Wajib untuk Bypass Admin)
                </span>
              ) : (
                <span className="optional"> (Opsional)</span>
              )}
            </label>
            <textarea
              //   placeholder="Masukkan catatan (Sangat disarankan mengisi alasan jika Anda Admin IT yang melakukan bypass)..."
              placeholder={
                isAdmin
                  ? "Wajib tambahakan alasan bypass..."
                  : "Tambahkan catatan persetujuan (opsional)..."
              }
              maxLength="500"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required={isAdmin} // Wajib jika admin
            ></textarea>
            <span className="char-count">{note.length}/500</span>
          </div>
          <p className="helper-text">
            Dengan menyetujui, jadwal shift kedua karyawan akan otomatis saling
            bertukar di dalam sistem
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" className="button is-info" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="button is-success"
            onClick={handleSubmit}
          >
            Ya, Setujui
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal tolak pertukaran shift (WAJIB ALASAN)
const RejectShiftModal = ({ show, data, onClose, onConfirm, userRole }) => {
  const [note, setNote] = useState("");
  if (!show || !data) return null;
  const isAdmin = userRole?.toLowerCase() === "admin";
  console.log("Status Admin Login Modal (shift exchange):", isAdmin);

  //   const handleSubmit = async (e) => {
  //     e.preventDefault();
  //     if (!note.trim()) {
  //       alert("Alasan penolakan wajib diisi!");
  //       return;
  //     }
  //     await onConfirm(note);
  //   };

  const handleSubmit = () => {
    if (!note || note.trim() === "") {
      alert("Alasan penolakan wajib diisi!");
      return;
    }
    onConfirm(note);
    setNote("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Tolak Pertukaran Shift</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* <div className="modal-body">
          <div className="approved-info-section">
            <div className="result-label">
              Apakah Anda yakin akan menolak permintaan ini?
            </div>
          </div>
        </div> */}
        {/*<form onSubmit={handleSubmit}>
          <div className="modal-body">
             <div className="label-form form-group">
              <label className="label">
                Catatan Review <span>*</span>
              </label>
              <textarea
                rows="4"
                className="form-textarea"
                placeholder="Jelaskan alasan penolakan (wajib diisi)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
              />
            </div>
            <div className="label-form">
              <label
                className="label"
                style={{ fontSize: "11px", marginTop: "0px" }}
              >
                <span>*</span> Alasan penolakan wajib diisi untuk memberikan
                penjelasan kepada pengaju
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
            <button type="submit" className="button is-success">
              Tolak
            </button>
          </div>
        </form> */}

        <div className="modal-body">
          <div className="section-box">
            <div className="detail-row">
              <span>Nama Pengaju</span>
              <strong>{data.proposer?.name}</strong>
            </div>
            <div className="detail-row">
              <span>Nama Rekan</span>
              <strong>{data.target.name}</strong>
            </div>
            <div className="detail-row">
              <span>Jadwal Pengaju</span>
              <strong>{data.shiftToExchange.date}</strong>
            </div>
            <div className="detail-row">
              <span>Jadwal Rekan</span>
              <strong>{data.shiftDesired.date}</strong>
            </div>
          </div>
          <div className="reject-note">
            <label>
              Alasan Penolakan <span className="required">*</span>
            </label>
            <textarea
              placeholder="Masukkan alasan penolakan..."
              maxLength="500"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
            ></textarea>
            <span className="char-count">{note.length}/500</span>
          </div>
          <p className="helper-text">
            Pengajuan akan ditolak dan karyawan akan mendapat notifikasi beserta
            alasan penolakan
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" className="button is-danger" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            className="button is-success"
            onClick={handleSubmit}
          >
            Ya, Tolak
          </button>
        </div>
      </div>
    </div>
  );
};
