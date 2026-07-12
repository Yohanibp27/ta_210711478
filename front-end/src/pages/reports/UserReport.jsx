import axios from "axios";
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "../../assets/avatar-ungu.png";
import {
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaUserSlash,
  FaFilePdf,
  FaFileExcel,
  FaSearch,
  FaAngleLeft,
  FaAngleRight,
  FaSort,
} from "react-icons/fa";
import axiosInstance from "../../api/axios.js";

const UserReport = () => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("semua");
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState({
    key: "id",
    direction: "asc",
  });

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      //   const [userRes, deptRes] = await Promise.all([
      //     axios.get("http://localhost:3000/users", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/departments", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //   ]);

      const [userRes, deptRes] = await Promise.all([
        axiosInstance.get("/users"),
        axiosInstance.get("/departments"),
      ]);
      setUsers(userRes.data.data || []);
      setDepartments(deptRes.data.data || []);
    } catch (e) {
      console.error("Gagal memuat data:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users.filter((user) => {
      const matchesDept =
        selectedDept === "semua" ||
        user.position?.division?.department?.name?.toLowerCase() ===
          selectedDept.toLowerCase();
      const matchesStatus =
        selectedStatus === "semua" ||
        user.status?.toLowerCase() === selectedStatus.toLowerCase();
      const matchesSearch =
        searchText === "" ||
        user.nip?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(searchText.toLowerCase());

      return matchesDept && matchesStatus && matchesSearch;
    });

    result.sort((a, b) => {
      let aValue, bValue;
      switch (sort.key) {
        case "nama":
          aValue =
            [a.titlePrefix, a.fullName]
              .filter(Boolean)
              .join(" ")
              ?.toLowerCase() || "";
          bValue =
            [b.titlePrefix, b.fullName]
              .filter(Boolean)
              .join(" ")
              ?.toLowerCase() || "";
          break;
        case "fungsi":
          aValue = a.position?.division?.department?.name?.toLowerCase() || "";
          bValue = b.position?.division?.department?.name?.toLowerCase() || "";
          break;
        case "status":
          aValue = a.status?.toLowerCase() || "";
          bValue = b.status?.toLowerCase() || "";
          break;
        case "role":
          aValue = a.role?.name?.toLowerCase() || "";
          bValue = b.role?.name?.toLowerCase() || "";
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }

      if (aValue < bValue) return sort.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, selectedDept, selectedStatus, searchText, sort]);

  const stats = useMemo(() => {
    return {
      total: filteredUsers.length,
      aktif: filteredUsers.filter((u) => u.status?.toLowerCase() === "aktif")
        .length,
      cuti: filteredUsers.filter((u) => u.status?.toLowerCase() === "cuti")
        .length,
      nonaktif: filteredUsers.filter(
        (u) => u.status?.toLowerCase() === "nonaktif",
      ).length,
    };
  }, [filteredUsers]);

  const requestSort = (key) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  //   const exportPDF = () => {
  //     const doc = new jsPDF();
  //     const headers = [
  //       "No",
  //       "NIP",
  //       "Nama Lengkap",
  //       "Email",
  //       "Fungsi",
  //       "Unit",
  //       "Jabatan",
  //       "Profesi",
  //       "Jam Kerja",
  //       "Status",
  //       "Role",
  //     ];
  //     const rows = filteredUsers.map((u, index) => [
  //       index + 1,
  //       u.nip,
  //       [u.titlePrefix, u.fullName, u.titleSuffix].filter(Boolean).join(" "),
  //       u.email,
  //       u.position?.division?.department?.name || "-",
  //       u.position?.division?.name || "-",
  //       u.position?.name || "-",
  //       u.profession?.name || "-",
  //       u.workShift?.name || "-",
  //       u.status,
  //       u.role?.name || "-",
  //     ]);
  //     autoTable(doc, {
  //       head: [headers],
  //       body: rows,
  //       startY: 20,
  //       styles: { fontSize: 10 },
  //       headStyles: { fillColor: [41, 128, 185] },
  //     });

  //     doc.text("Tabel User Aplikasi Presensi Karyawan", 14, 15);
  //     doc.save("user_report.pdf");
  //   };

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

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
                <span className="stat-value-dash">{stats.total}</span>
              </div>
              <div className="stat-icon-dash blue-light-dash">
                <FaUsers />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Aktif</span>
                <span className="stat-value-dash">{stats.aktif}</span>
              </div>
              <div className="stat-icon-dash green-light-dash">
                <FaUserCheck />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Cuti</span>
                <span className="stat-value-dash">{stats.cuti} orang</span>
              </div>
              <div className="stat-icon-dash orange-light-dash">
                <FaUserSlash />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Nonaktif</span>
                <span className="stat-value-dash">{stats.nonaktif}</span>
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
                  width: "150px",
                  height: "40px",
                  borderRadius: "8px",
                  marginTop: "5px",
                }}
              ></div>
              <div
                className="skeleton-box"
                style={{
                  width: "150px",
                  height: "40px",
                  borderRadius: "8px",
                  marginTop: "5px",
                }}
              ></div>
              <div
                className="skeleton-text"
                style={{
                  width: "150px",
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
                placeholder="Cari NIP atau Nama..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="panel-actions-right">
              <select
                className="select-input"
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="semua">Semua Departemen</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <select
                className="select-input"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="semua">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="cuti">Cuti</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
              <button
                className="button is-info"
                onClick={() => navigate("/user/preview")}
              >
                <FaFilePdf /> Export
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
                        No <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Nama <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Fungsi <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Unit <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Jabatan <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Status <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Role <FaSort className="sort-icon" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="10" style={{ textAlign: "center" }}>
                      <div className="qr-loading-box">
                        <div className="qr-spinner"></div>
                        <p className="qr-loading">Memuat data karyawan...</p>
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
                      className={`sortable-header ${sort.key === "id" ? "active-sort" : ""}`}
                      onClick={() => requestSort("id")}
                    >
                      <div className="header-content">
                        No <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "nama" ? "active-sort" : ""}`}
                      onClick={() => requestSort("nama")}
                    >
                      <div className="header-content">
                        Nama <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "funsgi" ? "active-sort" : ""}`}
                      onClick={() => requestSort("fungsi")}
                    >
                      <div className="header-content">
                        Fungsi <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "funsgi" ? "active-sort" : ""}`}
                      onClick={() => requestSort("fungsi")}
                    >
                      <div className="header-content">
                        Tipe <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "funsgi" ? "active-sort" : ""}`}
                      onClick={() => requestSort("fungsi")}
                    >
                      <div className="header-content">
                        Telepon <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "status" ? "active-sort" : ""}`}
                      onClick={() => requestSort("status")}
                    >
                      <div className="header-content">
                        Status <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "role" ? "active-sort" : ""}`}
                      onClick={() => requestSort("role")}
                    >
                      <div className="header-content">
                        Role <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "role" ? "active-sort" : ""}`}
                      onClick={() => requestSort("role")}
                    >
                      <div className="header-content">
                        Tanggal Bergabung <FaSort className="sort-icon" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user, index) => (
                      <tr key={user.id}>
                        <td>{indexOfFirstUser + index + 1}</td>
                        <td className="perf-name-cell">
                          <img
                            className="staff-avatar"
                            src={user.avatarUrl || Avatar}
                            alt="profile"
                          />
                          <div>
                            <div className="user-name">
                              {[user.titlePrefix, user.fullName]
                                .filter(Boolean)
                                .join(" ")}
                            </div>
                            <div className="user-nip">
                              {user.nip} - {user.position?.name || "-"}
                            </div>
                          </div>
                        </td>
                        <td>
                          {user.position?.division?.department?.name || "-"}
                        </td>
                        <td>{user.employmentType || "-"}</td>
                        <td>{user.phone || "-"}</td>{" "}
                        <td>
                          <span
                            className={`status-badge ${user.status?.toLowerCase() === "aktif" ? "aktif" : user.status?.toLowerCase() === "cuti" ? "cuti" : "nonaktif"}`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td>{user.role?.name || "-"}</td>{" "}
                        <td>{user.joinDate || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center" }}>
                        <div className="no-data">
                          <h4 className="empty-title">Data tidak ditemukan</h4>
                          <p className="empty-desc">
                            Data karyawan akan muncul di sini
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
              Menampilkan {filteredUsers.length > 0 ? indexOfFirstUser + 1 : 0}{" "}
              - {Math.min(indexOfLastUser, filteredUsers.length)} dari{" "}
              {filteredUsers.length} data
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

export default UserReport;
