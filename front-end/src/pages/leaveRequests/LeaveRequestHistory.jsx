import React, { useEffect, useMemo, useState } from "react";
// import axios from "axios";
import {
  FaCheck,
  FaTimes,
  FaSearch,
  FaSort,
  FaCalendarCheck,
  FaHourglassHalf,
  FaCheckCircle,
  FaTimesCircle,
  FaAngleRight,
  FaAngleLeft,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
// import LeaveRequestModal from "../../components/modals/LeaveRequestModal.jsx";
import Avatar from "../../assets/avatar-ungu.png";
import { formatDateIndo } from "../../utils/dateHelper.js";
import axiosInstance from "../../api/axios.js";
import { Navigate } from "react-router-dom";
// import "../../style/LeaveDetail.css";

const formatStatus = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "Menunggu";
    case "approved":
      return "Disetujui";
    case "rejected":
      return "Ditolak";
    case "cancelled":
      return "Dibatalkan";
    case "expired":
      return "Kedaluwarsa";
    default:
      return status;
  }
};

function LeaveRequestHistory() {
  //   const token = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;
  const role = user?.role?.toLowerCase();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7),
  );

  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jenisFilter, setJenisFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");
  //   const [showModal, setShowModal] = useState(false);
  const [showModalLeave, setShowModalLeave] = useState(false);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sort, setSort] = useState({
    key: "tanggal",
    direction: "asc",
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sort.key === key && sort.direction === "asc") {
      direction = "desc";
    }
    setSort({ key, direction });
    setSortOrder("");
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, jenisFilter, sortOrder]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      //   const res = await axios.get("http://localhost:3000/leave-requests", {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      //   const res = await axiosInstance.get("/leave-requests");

      let endpoint = "";
      const dept =
        user?.position?.division?.department?.name?.toLowerCase() || "";
      const isWasintern = dept.includes("subbag wasintern");
      const isManagerOrSupervisor = role === "manager" || role === "supervisor";
      if (role === "admin") {
        endpoint = "http://localhost:3000/leave-requests";
      } else if (isManagerOrSupervisor && isWasintern) {
        // SDM (Wasintern)
        endpoint = "http://localhost:3000/leave-requests";
      } else if (isManagerOrSupervisor) {
        // Manager/Supervisor biasa
        endpoint = "http://localhost:3000/leave-requests/manager";
      } else {
        return alert("Role tidak memiliki akses!");
      }

      const res = await axiosInstance.get(endpoint);
      setRequests(res.data.data);
    } catch (error) {
      console.error("Gagal mengambil data pengajuan", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id) => {
    try {
      const res = await axiosInstance.get(`/leave-requests/${id}`);
      setSelectedRequest(res.data.data);
      setShowModalLeave(true);
    } catch (error) {
      console.log("Gagal mengambil detail", error);
    }
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

  const approveRequest = async (id, note) => {
    try {
      let endpoint = "";
      //   if (role === "supervisor" || role === "admin") {
      //     endpoint = `/leave-requests/${id}/sdm/approve`;
      //   } else if (role === "manager") {
      //     endpoint = `/leave-requests/${id}/manager/approve`;
      //   } else {
      //     return alert("Role tidak memiliki hak persetujuan");
      //   }

      const dept =
        user?.position?.division?.department?.name?.toLowerCase() || "";
      const isWasintern = dept.includes("subbag wasintern");
      const isManagerOrSupervisor = role === "manager" || role === "supervisor";
      if (role === "admin") {
        endpoint = `/leave-requests/${id}/sdm/approve`;
      } else if (isManagerOrSupervisor && isWasintern) {
        // SDM (Wasintern)
        endpoint = `/leave-requests/${id}/sdm/approve`;
      } else if (isManagerOrSupervisor) {
        // Manager biasa
        endpoint = `/leave-requests/${id}/manager/approve`;
      } else {
        return alert("Role tidak memiliki hak persetujuan!");
      }

      const res = await axiosInstance.put(endpoint, { decisionNote: note });
      alert(res.data.message);
      fetchHistory(); // refresh data
      setSelectedRequest(null);
    } catch (e) {
      console.log("ERROR FULL:", e);
      const message = e.response?.data?.message || "Gagal menyetujui pengajuan";
      alert(message);
    }
  };

  //   const approveRequest = async (id, note) => {
  //   try {
  //     const isManagerOrSupervisor = role === "manager" || role === "supervisor";
  //     const isWasintern = user?.position?.division?.department?.name?.toLowerCase().includes("subbag wasintern");

  //     // Cek apakah pengajuan ini masih menunggu persetujuan Manager
  //     const isPendingManager = selectedRequest?.managerStatus === "pending";
  //     // Cek apakah ini staf dari departemen yang sama (Syaeful sebagai Manager)
  //     const isSameDept = selectedRequest?.user?.position?.division?.department?.id === user?.position?.division?.department?.id;

  //     let endpoint = "";

  //     if (role === "admin") {
  //       endpoint = `/leave-requests/${id}/sdm/approve`;
  //     } else if (isManagerOrSupervisor) {
  //       // LOGIKA UTAMA:
  //       // Jika dia Manager departemen yang sama DAN status manager masih pending,
  //       // dia harus bertindak sebagai Manager dulu.
  //       if (isSameDept && isPendingManager) {
  //         endpoint = `/leave-requests/${id}/manager/approve`;
  //       }
  //       // Jika dia Wasintern, dia punya otoritas SDM untuk semua departemen
  //       else if (isWasintern) {
  //         endpoint = `/leave-requests/${id}/sdm/approve`;
  //       } else {
  //         return alert("Anda tidak memiliki hak akses untuk tindakan ini!");
  //       }
  //     }

  //     const res = await axiosInstance.put(endpoint, { decisionNote: note });
  //     alert(res.data.message);
  //     fetchHistory();
  //     setSelectedRequest(null);
  //   } catch (e) {
  //     const message = e.response?.data?.message || "Gagal memproses";
  //     alert(message);
  //   }
  // };

  const rejectRequest = async (id, note) => {
    try {
      let endpoint = "";
      //   if (role === "supervisor" || role === "admin") {
      //     endpoint = `/leave-requests/${id}/sdm/reject`;
      //   } else if (role === "manager") {
      //     endpoint = `/leave-requests/${id}/manager/reject`;
      //   } else {
      //     return alert("Role tidak memiliki hak persetujuan");
      //   }
      const dept =
        user?.position?.division?.department?.name?.toLowerCase() || "";
      const isWasintern = dept.includes("subbag wasintern");
      const isManagerOrSupervisor = role === "manager" || role === "supervisor";
      if (role === "admin") {
        endpoint = `/leave-requests/${id}/sdm/reject`;
      } else if (isManagerOrSupervisor && isWasintern) {
        // SDM (Wasintern)
        endpoint = `/leave-requests/${id}/sdm/reject`;
      } else if (isManagerOrSupervisor) {
        // Manager biasa
        endpoint = `/leave-requests/${id}/manager/reject`;
      } else {
        return alert("Role tidak memiliki hak persetujuan!");
      }

      const res = await axiosInstance.put(endpoint, { decisionNote: note });
      alert(res.data.message);
      fetchHistory(); // refresh data
      setSelectedRequest(null);
    } catch (e) {
      console.log("ERROR FULL:", e);
      const message = e.response?.data?.message || "Gagal menolak pengajuan";
      alert(message);
    }
  };

  const filteredData = useMemo(() => {
    const userDeptId = user?.position?.division?.department?.id;
    const userDeptName =
      user?.position?.division?.department?.name?.toLowerCase() || "";
    const isWasintern = userDeptName.includes("subbag wasintern");

    const result = requests.filter((act) => {
      // 1. Validasi Fungsi/Departemen Otoritas Utama
      const requesterDeptId = act.user?.position?.division?.department?.id;
      let matchDepartment = true;

      if ((role === "manager" || role === "supervisor") && !isWasintern) {
        matchDepartment =
          userDeptId && requesterDeptId && userDeptId === requesterDeptId;
      }

      //   const statusLabel = statusMap[act.status] || act.status;
      //   const matchStatus =
      //     statusFilter === "all" || statusLabel === statusFilter;
      const statusLabel = formatStatus(act.status);
      const matchStatus =
        statusFilter === "all" || statusLabel === statusFilter;

      const matchJenis =
        jenisFilter === "all" ||
        act.leaveType?.name
          ?.toLowerCase()
          .includes(jenisFilter.toLowerCase()) ||
        act.leaveSubType?.name
          ?.toLowerCase()
          .includes(jenisFilter.toLowerCase());

      const fullName =
        `${act.user?.titlePrefix ?? ""} ${act.user?.fullName ?? ""} ${act.user?.titleSuffix ?? ""}`.toLowerCase();
      const nip = act.user?.nip?.toLowerCase() || "";
      const matchSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        nip.includes(searchTerm.toLowerCase()) ||
        act.leaveType?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const requestDate = new Date(act.createdAt);
      const requestYearMonth = requestDate.toISOString().substring(0, 7);
      const matchMonth = !selectedMonth || requestYearMonth === selectedMonth;

      return (
        matchDepartment &&
        matchStatus &&
        matchJenis &&
        matchSearch &&
        matchMonth
      );
    });

    return result.sort((a, b) => {
      let comparison = 0;
      if (sortOrder === "latest") {
        comparison = new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortOrder === "oldest") {
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
      } else {
        switch (sort.key) {
          case "tanggal":
            comparison = new Date(a.createdAt) - new Date(b.createdAt);
            break;
          case "nama":
            comparison = (a.user?.fullName || "").localeCompare(
              b.user?.fullName || "",
            );
            break;
          case "jenis":
            comparison = (a.leaveType?.name || "").localeCompare(
              b.leaveType?.name || "",
            );
            break;
          case "mulai":
            comparison = new Date(a.startDate) - new Date(b.startDate);
            break;
          case "akhir":
            comparison = new Date(a.endDate) - new Date(b.endDate);
            break;
          case "durasi": {
            const durA = new Date(a.endDate) - new Date(a.startDate);
            const durB = new Date(b.endDate) - new Date(b.startDate);
            comparison = durA - durB;
            break;
          }
          case "status":
            // comparison = (statusMap[a.status] || "").localeCompare(
            //   statusMap[b.status] || "",
            // );
            comparison = formatStatus(a.status).localeCompare(
              formatStatus(b.status),
            );
            break;
          default:
            comparison = 0;
        }
        if (sort.direction === "desc") {
          comparison = comparison * -1;
        }
      }

      return comparison;
    });
  }, [
    requests,
    searchTerm,
    statusFilter,
    jenisFilter,
    sortOrder,
    selectedMonth,
    sort,
    user,
    role,
  ]);

  const stats = useMemo(() => {
    const currentMonthData = requests.filter((req) => {
      const reqDate = new Date(req.createdAt).toISOString().substring(0, 7);
      return reqDate === selectedMonth;
    });

    const [year, month] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const previousMonthStr = prevDate.toISOString().substring(0, 7);

    const prevMonthData = requests.filter((req) => {
      const reqDate = new Date(req.createdAt).toISOString().substring(0, 7);
      return reqDate === previousMonthStr;
    });

    const getCounts = (data) => {
      return {
        total: data.length,
        // pending: data.filter((r) => statusMap[r.status] === "Pending").length,
        // approved: data.filter((r) => statusMap[r.status] === "Disetujui")
        //   .length,
        // rejected: data.filter((r) => statusMap[r.status] === "Ditolak").length,
        pending: data.filter((r) => r.status === "pending").length,
        approved: data.filter((r) => r.status === "approved").length,
        rejected: data.filter((r) => r.status === "rejected").length,
      };
    };

    const currentCounts = getCounts(currentMonthData);
    const prevCounts = getCounts(prevMonthData);

    const calculateGrowth = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    return {
      total: {
        value: currentCounts.total,
        growth: calculateGrowth(currentCounts.total, prevCounts.total),
      },
      pending: {
        value: currentCounts.pending,
        growth: calculateGrowth(currentCounts.pending, prevCounts.pending),
      },
      approved: {
        value: currentCounts.approved,
        growth: calculateGrowth(currentCounts.approved, prevCounts.approved),
      },
      rejected: {
        value: currentCounts.rejected,
        growth: calculateGrowth(currentCounts.rejected, prevCounts.rejected),
      },
    };
  }, [requests, selectedMonth]);

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
                <span className="stat-value-dash">{stats.total.value}</span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={stats.total.growth} /> dari bulan lalu
                </div>
              </div>
              <div className="stat-icon-dash purple-light-dash">
                <FaCalendarCheck />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Menunggu</span>
                <span className="stat-value-dash">{stats.pending.value}</span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={stats.pending.growth} /> dari bulan lalu
                </div>
              </div>
              <div className="stat-icon-dash orange-light-dash">
                <FaHourglassHalf />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Disetujui</span>
                <span className="stat-value-dash">{stats.approved.value}</span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={stats.approved.growth} /> dari bulan lalu
                </div>
              </div>
              <div className="stat-icon-dash green-light-dash">
                <FaCheckCircle />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Ditolak</span>
                <span className="stat-value-dash">{stats.rejected.value}</span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={stats.rejected.growth} /> dari bulan lalu
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
                style={{ width: "180px", height: "30px" }}
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
              {/* <h3>Riwayat Pengajuan ({currentRequest.length})</h3> */}
              <h3>Riwayat Pengajuan</h3>
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-select-group">
                <select
                  className="select-input"
                  value={jenisFilter}
                  onChange={(e) => {
                    setJenisFilter(e.target.value);
                  }}
                >
                  <option value="all">Semua Jenis </option>
                  <option value="Cuti">Cuti</option>
                  <option value="Izin">Izin</option>
                  <option value="Dinas Luar">Dinas Luar</option>
                </select>
                <select
                  className="select-input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Semua Status</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Ditolak">Ditolak</option>
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
                        Nama
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Jenis
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Sub Jenis
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Tanggal Mulai
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Tanggal Berakhir
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Durasi
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Status
                        <FaSort className="sort-icon" />
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
                        <p className="qr-loading">Memuat data pengajuan...</p>
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
                    {/* <th
                      className={`sortable-header ${sort.key === "tanggal" ? "active-sort" : ""}`}
                      onClick={() => requestSort("tanggal")}
                    >
                      <div className="header-content">
                        Tanggal Pengajuan
                        <FaSort className="sort-icon" />
                      </div>
                    </th> */}
                    <th
                      className={`sortable-header ${sort.key === "nama" ? "active-sort" : ""}`}
                      onClick={() => requestSort("nama")}
                    >
                      <div className="header-content">
                        Nama
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "jenis" ? "active-sort" : ""}`}
                      onClick={() => requestSort("jenis")}
                    >
                      <div className="header-content">
                        Jenis
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "sub-jenis" ? "active-sort" : ""}`}
                      onClick={() => requestSort("sub-jenis")}
                    >
                      <div className="header-content">
                        Sub Jenis
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "mulai" ? "active-sort" : ""}`}
                      onClick={() => requestSort("mulai")}
                    >
                      <div className="header-content">
                        Tanggal Mulai
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "akhir" ? "active-sort" : ""}`}
                      onClick={() => requestSort("akhir")}
                    >
                      <div className="header-content">
                        Tanggal Berakhir
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "durasi" ? "active-sort" : ""}`}
                      onClick={() => requestSort("durasi")}
                    >
                      <div className="header-content">
                        Durasi
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "status" ? "active-sort" : ""}`}
                      onClick={() => requestSort("status")}
                    >
                      <div className="header-content">
                        Status
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRequest.length > 0 ? (
                    currentRequest.map((req) => {
                      const start = new Date(req.startDate);
                      const end = new Date(req.endDate);
                      const durasi =
                        Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                      return (
                        <tr key={req.id}>
                          {/* <td>{formatTanggalLengkap(req.createdAt)}</td> */}
                          <td>
                            <div className="user-cell">
                              <img
                                src={req.user?.avatarUrl || Avatar}
                                alt={req.user?.fullName}
                                className="user-avatar"
                              />
                              <div className="user-info">
                                <span className="user-name">
                                  {[req.user?.titlePrefix, req.user?.fullName]
                                    .filter(Boolean)
                                    .join(" ") ?? "-"}
                                </span>
                                <span className="user-division">
                                  {req.user?.position?.name ?? "-"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>{req.leavetype?.name ?? "-"}</td>
                          <td>{req.leavesubtype?.name ?? "-"}</td>
                          <td>
                            {new Date(req.startDate).toLocaleDateString(
                              "id-ID",
                            ) ?? "-"}
                          </td>
                          <td>
                            {new Date(req.endDate).toLocaleDateString(
                              "id-ID",
                            ) ?? "-"}
                          </td>
                          <td>
                            <strong>{durasi ?? "-"} hari</strong>
                          </td>
                          <td>
                            <span
                              //   className={`status-tag-request ${
                              //     req.status.toLowerCase() ===
                              className={`status-badge ${
                                req.status.toLowerCase() === "pending"
                                  ? "pending"
                                  : req.status.toLowerCase() === "approved"
                                    ? "approved"
                                    : req.status.toLowerCase() === "rejected"
                                      ? "rejected"
                                      : req.status.toLowerCase() === "cancelled"
                                        ? "cancelled"
                                        : "expired"
                              }`}
                            >
                              {formatStatus(req.status)}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="button is-warning"
                                onClick={() => openDetail(req.id)}
                              >
                                Detail
                              </button>
                              {/* {(() => {
                                // 1. Manager hanya bisa approve jika status masih PENDING (manager → SDM)
                                console.log(
                                  "manager status:",
                                  req.managerStatus,
                                );
                                if (
                                  role === "manager" &&
                                  req.managerStatus === "pending"
                                ) {
                                  return (
                                    <>
                                      <button
                                        className="button is-success"
                                        onClick={() => approveRequest(req.id)}
                                      >
                                        <FaCheck />
                                      </button>
                                      <button
                                        className="button is-danger"
                                        onClick={() => rejectRequest(req.id)}
                                      >
                                        <FaTimes />
                                      </button>
                                    </>
                                  );
                                }
                                // 2. Supervisor hanya bisa approve jika status PENDING MANAGER (bypass) atau APPROVED MANAGER
                                // Tapi TIDAK BISA jika sudah APPROVED SDM (Final)
                                console.log("sdm status:", req.sdmStatus);
                                if (
                                  role === "supervisor" &&
                                  req.managerStatus === "approved" &&
                                  req.sdmStatus === "pending"
                                ) {
                                  // Tambahkan cek expired jika perlu
                                  if (!isApprovalExpired(req.startDate)) {
                                    return (
                                      <>
                                        <button
                                          className="button is-success"
                                          onClick={() => approveRequest(req.id)}
                                        >
                                          <FaCheck />
                                        </button>
                                        <button
                                          className="button is-danger"
                                          onClick={() => rejectRequest(req.id)}
                                        >
                                          <FaTimes />
                                        </button>
                                      </>
                                    );
                                  }
                                }
                                return null;
                              })()} */}
                              {(() => {
                                const isFinalStatus = [
                                  "approved",
                                  "rejected",
                                  "cancelled",
                                  "expired",
                                ].includes(req.status?.toLowerCase());

                                // 🚫 Jangan tampilkan tombol kalau sudah final
                                if (isFinalStatus) return null;

                                // 🚫 Jangan tampilkan kalau sudah expired
                                if (isApprovalExpired(req.startDate))
                                  return null;

                                // Deteksi department user login
                                const dept =
                                  user?.position?.division?.department?.name?.toLowerCase() ||
                                  "";
                                const isWasinternManager =
                                  role === "manager" &&
                                  dept.includes("subbag wasintern");

                                // ✅ MANAGER
                                console.log("ROLE MANAGER LOGIN:", role);
                                if (
                                  role === "manager" &&
                                  !isWasinternManager &&
                                  req.managerStatus === "pending"
                                ) {
                                  return (
                                    <>
                                      <button
                                        className="button is-success"
                                        // onClick={() => approveRequest(req.id)}
                                        onClick={() => {
                                          setSelectedRequest(req);
                                          setShowApprovedModal(true);
                                        }}
                                      >
                                        <FaCheck />
                                      </button>
                                      <button
                                        className="button is-danger"
                                        // onClick={() => rejectRequest(req.id)}
                                        onClick={() => {
                                          setSelectedRequest(req);
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
                                  //   role === "supervisor" &&
                                  (role === "supervisor" ||
                                    isWasinternManager) &&
                                  req.managerStatus?.toLowerCase() ===
                                    "approved" &&
                                  req.sdmStatus?.toLowerCase() === "pending"
                                ) {
                                  return (
                                    <>
                                      <button
                                        className="button is-success"
                                        // onClick={() => approveRequest(req.id)}
                                        onClick={() => {
                                          setSelectedRequest(req);
                                          setShowApprovedModal(true);
                                        }}
                                      >
                                        <FaCheck />
                                      </button>
                                      <button
                                        className="button is-danger"
                                        // onClick={() => rejectRequest(req.id)}
                                        onClick={() => {
                                          setSelectedRequest(req);
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
                                  (req.managerStatus?.toLowerCase() ===
                                    "pending" ||
                                    req.sdmStatus?.toLowerCase() === "pending")
                                ) {
                                  return (
                                    <>
                                      <button
                                        className="button is-success"
                                        onClick={() => {
                                          setSelectedRequest(req);
                                          setShowApprovedModal(true); // Modal ini akan mewajibkan isi decisionNote sesuai fungsi validasi Anda sebelumnya
                                        }}
                                      >
                                        <FaCheck />
                                      </button>
                                      <button
                                        className="button is-danger"
                                        onClick={() => {
                                          setSelectedRequest(req);
                                          setShowRejectModal(true);
                                        }}
                                        title="Bypass Reject"
                                      >
                                        <FaTimes />
                                      </button>
                                    </>
                                  );
                                }
                                console.log({
                                  role,
                                  status: req.status,
                                  managerStatus: req.managerStatus,
                                  sdmStatus: req.sdmStatus,
                                  expired: isApprovalExpired(req.startDate),
                                });
                                return null;
                              })()}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center" }}>
                        <div className="no-data">
                          <h4 className="empty-title">Data tidak ditemukan</h4>
                          <p>Data pengajuan akan muncul di sini</p>
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
      {/* <LeaveRequestModal
        show={showModal}
        data={selectedRequest}
        onClose={() => setShowModal(false)}
      /> */}
      <LeavaeRequestDetailModal
        show={showModalLeave}
        data={selectedRequest}
        onClose={() => setShowModalLeave(false)}
        onApproved={() => {
          setShowModalLeave(false);
          setShowApprovedModal(true);
        }}
        onRejected={() => {
          setShowModalLeave(false);
          setShowRejectModal(true);
        }}
        role={role}
        user={user}
      />
      <LeaveRequestApproveModal
        show={showApprovedModal}
        data={selectedRequest}
        onClose={() => {
          setShowApprovedModal(false);
        }}
        // onConfirm={(note) => {
        //   approveRequest(selectedRequest.id, note);
        onConfirm={(note) => {
          approveRequest(selectedRequest.id, note);
          setShowApprovedModal(false);
        }}
        userRole={user.role}
      />
      <LeaveRequestRejectModal
        show={showRejectModal}
        data={selectedRequest}
        onClose={() => setShowRejectModal(false)}
        // onConfirm={() => {
        //   setShowRejectModal(false);
        // }}
        onConfirm={(note) => {
          rejectRequest(selectedRequest.id, note);
          setShowRejectModal(false);
        }}
        userRole={user.role}
      />
    </div>
  );
}

export default LeaveRequestHistory;

const LeaveRequestModal = ({ show, onClose, data }) => {
  if (!show || !data) return null;

  const FILE_BASE_URL = "http://localhost:3000/uploads/evidence/";
  const getApprovalLabel = (status) => {
    return formatStatus(status);
  };
  const getStatusClass = (status) => {
    return status?.toLowerCase() === "pending"
      ? "pending"
      : status?.toLowerCase() === "approved"
        ? "approved"
        : status?.toLowerCase() === "rejected"
          ? "rejected"
          : status?.toLowerCase() === "cancelled"
            ? "cancelled"
            : "expired";
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Detail Pengajuan</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-row">
            <span>Tanggal Pengajuan</span>
            <strong>{new Date(data.createdAt).toLocaleString("id-ID")}</strong>
          </div>
          <div className="detail-row">
            <span>Nama Karyawan</span>
            <strong>{data.user?.fullName}</strong>
          </div>
          <div className="detail-row">
            <span>NIP</span>
            <strong>{data.user?.nip}</strong>
          </div>
          <div className="detail-row">
            <span>Departemen</span>
            <strong>{data.user?.position?.division?.department?.name}</strong>
          </div>
          <div className="detail-row">
            <span>Jenis Pengajuan</span>
            <strong>{data.leavesubtype?.name}</strong>
          </div>
          <div className="detail-row">
            <span>Tanggal</span>
            <strong>
              {formatDateIndo(data.startDate)} - {formatDateIndo(data.endDate)}
            </strong>
          </div>
          <div className="detail-row">
            <span>Catatan</span>
            <strong>{data.note || "-"}</strong>
          </div>
          <div className="detail-row">
            <span>Lampiran</span>
            {data.evidenceFile ? (
              <div className="evidence-preview">
                {data.evidenceFile.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <a
                    href={`${FILE_BASE_URL}${data.evidenceFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="evidence-link-container"
                  >
                    <img
                      src={`${FILE_BASE_URL}${data.evidenceFile}`}
                      alt="Bukti Lampiran"
                      className="img-evidence-thumb"
                    />
                    <div className="view-link-wrapper">
                      <p className="view-link">Klik untuk memperbesar</p>
                    </div>
                  </a>
                ) : (
                  <a
                    href={`${FILE_BASE_URL}${data.evidenceFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button is-small is-link"
                  >
                    Lihat Dokumen (PDF/Lainnya)
                  </a>
                )}
              </div>
            ) : (
              <strong>-</strong>
            )}
          </div>
          {data.manager && (
            <>
              <div className="detail-row">
                <span>Status Manager</span>
                {/* <strong>{getApprovalLabel("Manager")}</strong> */}
                <strong
                  className={`status-badge ${getStatusClass(data.status)}`}
                  s
                >
                  {getApprovalLabel(data.managerStatus)}
                </strong>
              </div>
              <div className="detail-row">
                <span>Nama Manager</span>
                <strong>
                  {[data.manager.titlePrefix, data.manager.fullName]
                    .filter(Boolean)
                    .join(" ")}
                </strong>
              </div>
              {data.managerStatus === "rejected" &&
                data.managerDecisionNote && (
                  <div className="detail-row">
                    <span>Catatan Manager</span>
                    <strong>{data.managerDecisionNote}</strong>
                  </div>
                )}
            </>
          )}
          {data.sdm && (
            <>
              <div className="detail-row">
                <span>Status SDM</span>
                <strong
                  className={`status-badge ${getStatusClass(data.status)}`}
                >
                  {getApprovalLabel(data.sdmStatus)}
                </strong>
              </div>
              <div className="detail-row">
                <span>Nama SDM</span>
                <strong>
                  {[data.sdm.titlePrefix, data.sdm.fullName]
                    .filter(Boolean)
                    .join(" ")}
                </strong>
              </div>
              {data.sdmStatus === "rejected" && data.sdmDecisionNote && (
                <div className="detail-row">
                  <span>Catatan SDM</span>
                  <strong>{data.sdmDecisionNote}</strong>
                </div>
              )}
            </>
          )}
          <div className="detail-row">
            <strong>Status Pengajuan</strong>
            <strong className={`status-badge ${getStatusClass(data.status)}`}>
              {formatStatus(data.status)}
            </strong>
          </div>
        </div>

        <div className="modal-footer">
          <button className="button is-danger" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

const LeavaeRequestDetailModal = ({
  show,
  onClose,
  data,
  onApproved,
  onRejected,
  role,
  user,
}) => {
  if (!show || !data) return null;

  const FILE_BASE_URL = "http://localhost:3000/uploads/evidence/";
  //   const getApprovalLabel = (status) => {
  //     return formatStatus(status);
  //   };
  const getStatusClass = (status) => {
    return status?.toLowerCase() === "pending"
      ? "pending"
      : status?.toLowerCase() === "approved"
        ? "approved"
        : status?.toLowerCase() === "rejected"
          ? "rejected"
          : status?.toLowerCase() === "cancelled"
            ? "cancelled"
            : "expired";
  };

  //   // BUAT LOGIKA PENGECEKAN HAK AKSES TOMBOL ACTION
  //   let showActionButtons = false;
  //   if (data.status === "pending") {
  //     const currentRole = role?.toLowerCase();
  //     const manStatus = data.managerStatus?.toLowerCase();
  //     const sdmStatus = data.sdmStatus?.toLowerCase();

  //     if (currentRole === "admin") {
  //       // Admin bisa bypass jika salah satu masih pending
  //       showActionButtons = manStatus === "pending" || sdmStatus === "pending";
  //     } else if (currentRole === "manager") {
  //       // Manager hanya bisa aksi jika managerStatus masih pending
  //       showActionButtons = manStatus === "pending";
  //     } else if (currentRole === "supervisor") {
  //       // Supervisor/SDM HANYA BISA AKSI JIKA Manager sudah "approved" dan SDM masih "pending"
  //       showActionButtons = manStatus === "approved" && sdmStatus === "pending";
  //     }
  //   }

  const currentRole = role?.toLowerCase();
  const manStatus = data.managerStatus?.toLowerCase();
  const sdmStatus = data.sdmStatus?.toLowerCase();

  // ✅ PERBAIKAN LOGIKA: Deteksi kesamaan departemen
  const userDeptId = user?.position?.division?.department?.id;
  const requesterDeptId = data.user?.position?.division?.department?.id; // pada schema leave-request biasanya mengacu ke data.user
  const isSameDepartment =
    userDeptId && requesterDeptId && userDeptId === requesterDeptId;

  const userDeptName =
    user?.position?.division?.department?.name?.toLowerCase() || "";
  const isWasintern = userDeptName.includes("subbag wasintern");

  // ATURAN VALIDASI AKSES TOMBOL SETUJUI/TOLAK
  let showActionButtons = false;
  if (data.status?.toLowerCase() === "pending") {
    if (currentRole === "admin") {
      showActionButtons = manStatus === "pending" || sdmStatus === "pending";
    } else if (isWasintern) {
      // Jika dia Orang SDM (Subbag Wasintern), berhak acc Tahap 2 setelah Manager acc
      showActionButtons = manStatus === "approved" && sdmStatus === "pending";
    } else if (["manager", "supervisor"].includes(currentRole)) {
      // ✅ KUNCI PERBAIKAN: Harus satu fungsi/departemen dan status approval manager masih pending
      showActionButtons = isSameDepartment && manStatus === "pending";
    }
  }

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const duration =
    start && end ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1 : 0;

  const isCuti = data.leavetype?.name === "Cuti";
  //   const isPending = data.status === "pending";
  //   const isApproved = data.status === "approved";
  //   const isRejected = data.status === "rejected";
  //   const isCancelled = data.status === "cancelled";
  //   const isExpired = data.status === "Kedaluwarsa";
  //   const isIzin = data.leavetype?.name === "Izin";
  //   const isDinasLuar = data.leavetype?.name === "Dinas Luar";

  return (
    <div className="modal-overlay">
      <div className="modal-leave-card">
        <div className="modal-header">
          <h3>Detail Pengajuan</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-leave-body">
          <div className="tags">
            <span className={`status-badge ${getStatusClass(data.status)}`}>
              {formatStatus(data.status)}
            </span>
            {/* <span className="tag-leave category">{data.leavetype?.name}</span> */}
            <span
              className={`tag-leave category ${data.leavetype?.name
                ?.toLowerCase()
                .replace(/\s/g, "-")}`}
            >
              {data.leavetype?.name}
            </span>
            <span className="tag-leave sub-category">
              {data.leavesubtype?.name}
            </span>
          </div>

          <div className="section section-box">
            <h3>INFORMASI KARYAWAN</h3>
            <div className="grid">
              <div>
                <label>Nama Karyawan</label>
                <p>
                  <strong>
                    {[data.user?.titlePrefix, data.user?.fullName]
                      .filter((item) => item && item !== "")
                      .join(" ")}
                  </strong>
                </p>
              </div>
              <div>
                <label>NIP</label>
                <p>
                  <strong>{data.user?.nip}</strong>
                </p>
              </div>
              <div>
                <label>Unit/Fungsi</label>
                <p>
                  <strong>
                    {data.user?.position?.division?.name}
                    {"/"}
                    {data.user?.position?.division?.department?.name}
                  </strong>
                </p>
              </div>
              <div>
                <label>Jabatan</label>
                <p>
                  <strong>{data.user?.position?.name}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="section section-box">
            <h3>DETAIL PENGAJUAN</h3>
            <div className="grid">
              <div>
                <label>Tanggal Pengajuan</label>
                <p>
                  <strong>
                    {/* {new Date(data.createdAt).toLocaleString("id-ID")} */}
                    {formatDateIndo(data.createdAt)}
                  </strong>
                </p>
              </div>
              <div>
                <label>Durasi</label>
                <p>
                  <strong>{duration} hari</strong>
                </p>
              </div>
              <div>
                <label>Tanggal Mulai</label>
                <p>
                  <strong>{formatDateIndo(data.startDate)}</strong>
                </p>
              </div>
              <div>
                <label>Tanggal Selesai</label>
                <p>
                  <strong>{formatDateIndo(data.endDate)}</strong>
                </p>
              </div>
            </div>
          </div>

          {data.evidenceFile && (
            <div className="detail-row">
              <span>Lampiran</span>
              <div className="evidence-preview">
                {data.evidenceFile.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <a
                    href={`${FILE_BASE_URL}${data.evidenceFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="evidence-link-container"
                  >
                    <img
                      src={`${FILE_BASE_URL}${data.evidenceFile}`}
                      alt="Bukti Lampiran"
                      className="img-evidence-thumb"
                    />
                    <div className="view-link-wrapper">
                      <p className="view-link">Klik untuk memperbesar</p>
                    </div>
                  </a>
                ) : (
                  <a
                    href={`${FILE_BASE_URL}${data.evidenceFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button is-small is-link"
                  >
                    Lihat Dokumen (PDF/Lainnya)
                  </a>
                )}
              </div>
            </div>
          )}

          {(() => {
            const userQuota = data.user?.userLeaveQuotas?.find(
              (item) => item.leaveSubTypeId === data.leaveSubTypeId,
            );
            if (isCuti && userQuota) {
              const total = userQuota.totalQuota;
              const used = userQuota.usedQuota;
              const remaining = total - used;
              const percentage = (used / total) * 100;
              const requestDays = duration;
              //   const newUsed = used + requestDays;
              //   const newRemaining = total - newUsed;
              //   const newPercentase = (newUsed / total) * 100;
              return (
                <div className="quota-box">
                  <h3>INFORMASI KUOTA CUTI</h3>
                  <div className="quota-stats">
                    <div>
                      <h4>{total}</h4>
                      <p>Total Kuota</p>
                    </div>
                    <div>
                      <h4>{used}</h4>
                      {/* <h4>{requestDays}</h4> */}
                      <p>Cuti Dipakai</p>
                      {/* <p>Sudah Dipakai</p> */}
                    </div>
                    <div>
                      <h4>{remaining}</h4>
                      <p>Sisa Kuota</p>
                      {/* <p>Sisa Setelah Pengajuan</p> */}
                    </div>
                  </div>
                  <div className="quota-progress-bg">
                    <div
                      className="quota-progress-fill"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="note">
                    Pengajuan ini akan menggunakan {requestDays} hari dari kuota
                    cuti
                  </p>
                </div>
              );
            }
            return null;
          })()}

          <div className="section">
            <h3 style={{ marginBottom: "10px" }}>Catatan Pengajuan</h3>
            {/* <p className="note-text">{data.reason || "-"}</p> */}
            {/* <textarea
              className="note-text"
              value={data.reason || "-"}
              readOnly
              disabled
            /> */}
            <div className="note-text-display">{data.note || "-"}</div>
          </div>

          {/* {isApproved && data.approvalNote && (
            <div className="approval-box">
              <h3>CATATAN PERSETUJUAN</h3>
              <p className="success-text">{data.approvalNote.text}</p>
              <p className="meta">
                Oleh: {data.approvalNote.by} | Pada: {data.approvalNote.date}
              </p>
            </div>
          )} */}

          {/* {data.managerStatus && data.managerStatus !== "pending" && (
            <div
              className={`approval-box ${
                data.managerStatus === "rejected" ? "rejected-box" : ""
              }`}
            >
              <h3>
                {data.managerStatus === "rejected"
                  ? "Alasan Penolakan Manager"
                  : "Persetujuan"}
              </h3>
              <p
                className={
                  data.managerStatus === "rejected"
                    ? "error-text"
                    : "success-text"
                }
              >
                {data.managerDecisionNote || "-"}
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
           
          {data.sdmStatus && data.sdmStatus !== "pending" && (
            <div
              className={`approval-box ${
                data.sdmStatus === "rejected" ? "rejected-box" : ""
              }`}
            >
              <h3>
                {data.sdmStatus === "rejected"
                  ? "Alasan Penolakan SDM"
                  : "Persetujuan SDM"}
              </h3>
              <p
                className={
                  data.sdmStatus === "rejected" ? "error-text" : "success-text"
                }
              >
                {data.sdmDecisionNote || "-"}
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
          )}

          {data.managerStatus === "rejected" && (
            <div className="approval-box rejected-box">
              <h3>ALASAN PENOLAKAN MANAGER</h3>
              <p className="error-text">{data.managerDecisionNote}</p>
              <p className="meta">
                Oleh:{" "}
                {[data.manager?.titlePrefix, data.manager?.fullName]
                  .filter(Boolean)
                  .join(" ")}{" "}
                | Pada: {formatDateIndo(data.managerDecisionAt)}
              </p>
            </div>
          )}
          {data.sdmStatus === "rejected" && (
            <div className="approval-box rejected-box">
              <h3>ALASAN PENOLAKAN SDM</h3>
              <p className="error-text">{data.sdmDecisionNote}</p>
              <p className="meta">
                Oleh:{" "}
                {[data.sdm?.titlePrefix, data.sdm?.fullName]
                  .filter(Boolean)
                  .join(" ") || "SDM"}{" "}
                | Pada: {formatDateIndo(data.sdmDecisionAt)}
              </p>
            </div>
          )}
        </div>

        {/* {data.status === "pending" && ( */}
        {showActionButtons && (
          <div className="modal-footer">
            <button className="button is-danger" onClick={onRejected}>
              Tolak Pengajuan
            </button>
            <button
              className="button is-success"
              onClick={onApproved}
              // onClick={() => approveRequest(data.id)}
            >
              Setujui Pengajuan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const LeaveRequestApproveModal = ({
  show,
  onClose,
  onConfirm,
  data,
  userRole,
}) => {
  const [note, setNote] = useState("");
  if (!show || !data) return null;
  //   const isAdmin = userRole === "admin";
  const isAdmin = userRole?.toLowerCase() === "admin";
  console.log("Status Admin Login Modal:", isAdmin);

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const duration =
    start && end ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1 : 0;

  const handleSubmit = () => {
    // Validasi: Jika Admin IT dan catatan kosong, hentikan proses
    // if (isAdmin && note.trim() === "") {
    if (isAdmin && (!note || note.trim() === "")) {
      alert(
        "Admin IT wajib mengisi catatan keputusan sebagai bukti bypass sistem!",
      );
      return;
    }
    onConfirm(note);
    setNote("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Setujui Pengajuan</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="section-box">
            <div className="detail-row">
              <span>Nama Pengaju</span>
              <strong>
                {[data.user?.titlePrefix, data.user?.fullName]
                  .filter((item) => item && item !== "")
                  .join(" ")}
              </strong>
            </div>
            <div className="detail-row">
              <span>Jenis</span>
              <strong>{data.leavetype?.name}</strong>
            </div>
            <div className="detail-row">
              <span>Periode</span>
              <strong>
                {formatDateIndo(data.startDate)} -{" "}
                {formatDateIndo(data.endDate)}
              </strong>
            </div>
            <div className="detail-row">
              <span>Durasi</span>
              <strong>{duration} hari</strong>
            </div>
          </div>

          <div className="approve-note">
            <label>
              {/* Catatan Persetujuan <span className="optional">(opsional)</span> */}
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
            </label>
            <textarea
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
            Dengan menyetujui, pengajuan ini akan diproses dan karyawan akan
            mendapat notifikasi
          </p>
        </div>

        <div className="modal-footer">
          <button className="button is-info" onClick={onClose}>
            Batal
          </button>
          {/* <button className="button is-success" onClick={() => onConfirm()}> */}
          <button className="button is-success" onClick={handleSubmit}>
            Ya, Setujui
          </button>
        </div>
      </div>
    </div>
  );
};

const LeaveRequestRejectModal = ({
  show,
  onClose,
  onConfirm,
  data,
  userRole,
}) => {
  const [note, setNote] = useState("");
  if (!show || !data) return null;
  const isAdmin = userRole?.toLowerCase() === "admin";
  console.log("Status Admin Login Modal:", isAdmin);

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const duration =
    start && end ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1 : 0;

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
          <h3>Tolak Pengajuan</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="section-box">
            <div className="detail-row">
              <span>Nama Pengaju</span>
              <strong>
                {[data.user?.titlePrefix, data.user?.fullName]
                  .filter((item) => item && item !== "")
                  .join(" ")}
              </strong>
            </div>
            <div className="detail-row">
              <span>Jenis</span>
              <strong>{data.leavetype?.name}</strong>
            </div>
            <div className="detail-row">
              <span>Periode</span>
              <strong>
                {data.startDate} - {data.endDate}
              </strong>
            </div>
            <div className="detail-row">
              <span>Durasi</span>
              <strong>{duration} hari</strong>
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
            catatan penolakan
          </p>
        </div>

        <div className="modal-footer">
          <button className="button is-danger" onClick={onClose}>
            Batal
          </button>
          <button
            className="button is-success"
            // onClick={() => {
            //   if (!note.trim()) {
            //     alert("Alasan penolakan wajib diisi");
            //     return;
            //   }
            //   onConfirm(note);
            // }}
            onClick={handleSubmit}
          >
            Ya, Tolak
          </button>
        </div>
      </div>
    </div>
  );
};

// <div className="modal-overlay">
//   <div className="modal-approve-card">
//     <div className="approve-header">
//       <div className="icon-circle">
//         <FaCheckCircle className="icon-check" />
//       </div>
//       <h3>Setujui Pengajuan</h3>
//       <p className="employee-name">{data.employeeName}</p>
//     </div>

//     <div className="approve-info">
//       <div className="info-row">
//         <span>Jenis</span>
//         <strong>{data.category}</strong>
//       </div>
//       <div className="info-row">
//         <span>Periode</span>
//         <strong>{data.period}</strong>
//       </div>
//       <div className="info-row">
//         <span>Durasi</span>
//         <strong>{data.duration}</strong>
//       </div>
//     </div>

//     {/* Textarea Catatan */}
//     <div className="approve-note">
//       <label>
//         Catatan Persetujuan <span className="optional">(opsional)</span>
//       </label>
//       <textarea
//         placeholder="Tambahkan catatan persetujuan..."
//         maxLength="500"
//       ></textarea>
//       <span className="char-count">0/500</span>
//     </div>

//     {/* Helper Text */}
//     <p className="helper-text">
//       Dengan menyetujui, pengajuan ini akan diproses dan karyawan akan
//       mendapat notifikasi.
//     </p>

//     {/* Footer Buttons */}
//     <div className="approve-footer">
//       <button className="btn-cancel" onClick={onClose}>
//         Batal
//       </button>
//       <button className="btn-submit" onClick={onConfirm}>
//         <FaCheckCircle /> Ya, Setujui
//       </button>
//     </div>
//   </div>
// </div>

// <div className="modal-overlay">
//   <div className="modal-reject-card">
//     <div className="reject-header">
//       <div className="icon-circle-reject">
//         <FaTimesCircle className="icon-reject" />
//       </div>
//       <h3>Tolak Pengajuan</h3>
//       <p className="employee-name">{data.employeeName}</p>
//     </div>

//     <div className="reject-info">
//       <div className="info-row">
//         <span>Jenis</span>
//         <strong>{data.category}</strong>
//       </div>
//       <div className="info-row">
//         <span>Periode</span>
//         <strong>{data.period}</strong>
//       </div>
//       <div className="info-row">
//         <span>Durasi</span>
//         <strong>{data.duration}</strong>
//       </div>
//     </div>

//     <div className="reject-note">
//       <label>
//         Alasan Penolakan <span className="required">*</span>
//       </label>
//       <textarea
//         placeholder="Masukkan alasan penolakan..."
//         maxLength="500"
//       ></textarea>
//       <span className="char-count">0/500</span>
//     </div>

//     <p className="helper-text">
//       Pengajuan akan ditolak dan karyawan akan mendapat notifikasi beserta
//       alasan penolakan.
//     </p>

//     <div className="reject-footer">
//       <button className="btn-cancel" onClick={onClose}>
//         Batal
//       </button>
//       <button className="btn-reject" onClick={onConfirm}>
//         <FaTimesCircle /> Ya, Tolak
//       </button>
//     </div>
//   </div>
// </div>
