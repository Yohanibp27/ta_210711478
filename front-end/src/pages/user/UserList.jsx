// import axios from "axios";
import { useState, useEffect } from "react";
import AddUser from "../../components/modals/user/AddUser.jsx";
import EditUser from "../../components/modals/user/EditUser.jsx";
import Avatar from "../../assets/avatar-ungu.png";
import {
  FaAngleLeft,
  FaAngleRight,
  FaFemale,
  FaPlus,
  FaSearch,
  FaSort,
  FaUserMd,
  FaUserNurse,
  FaUsers,
  FaUserTie,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import axiosInstance from "../../api/axios.js";

const UserList = () => {
  //   const token = localStorage.getItem("token");

  // PERBAIKAN: Ambil data user yang sedang login
  const reduxAuth = useSelector((state) => state.auth);
  const reduxUser = reduxAuth?.user;
  const localUser = JSON.parse(localStorage.getItem("user"));
  const currentUser =
    reduxUser && Object.keys(reduxUser).length > 0 ? reduxUser : localUser;

  // PERBAIKAN: Buat variabel penanda apakah user sedang cuti
  const isReadOnly =
    currentUser?.status === "Cuti" || currentUser?.limited === true;

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("semua");
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("semua");

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [newDokter, setNewDokter] = useState(0);
  const [newPerawat, setNewPerawat] = useState(0);
  const [newBidan, setNewBidan] = useState(0);
  const [newNonMedis, setNewNonMedis] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState({
    key: "nama",
    direction: "asc",
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sort.key === key && sort.direction === "asc") {
      direction = "desc";
    }
    setSort({ key, direction });
  };

  const newUsersThisMonth = newDokter + newPerawat + newBidan + newNonMedis;

  useEffect(() => {
    getUsers();
    fetchDepartments();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDept, selectedStatus, searchText]);

  const fetchDepartments = async () => {
    try {
      //   const response = await axios.get("http://localhost:3000/departments", {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });
      const response = await axiosInstance.get("/departments");
      setDepartments(response.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const getUsers = async () => {
    setLoading(true);
    try {
      //   const response = await axios.get("http://localhost:3000/users", {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });
      const response = await axiosInstance.get("/users");
      const sortedUsers = (response.data.data || []).sort(
        (a, b) => b.id - a.id,
      );
      setUsers(sortedUsers);

      let newDok = 0,
        newPer = 0,
        newBid = 0,
        newNon = 0;

      setNewDokter(newDok);
      setNewPerawat(newPer);
      setNewBidan(newBid);
      setNewNonMedis(newNon);
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    try {
      //   await axios.delete(`http://localhost:3000/users/${userId}`, {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });
      await axiosInstance.delete(`/users/${userId}`);
      getUsers();
      alert("User berhasil dihapus!");
    } catch (e) {
      console.log(e);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesDept =
      selectedDept === "semua" ||
      (user.position?.division?.department?.name &&
        user.position.division.department.name.toLowerCase() ===
          selectedDept.toLowerCase());

    const matchesStatus =
      selectedStatus === "semua" ||
      (user.status &&
        user.status.toLowerCase() === selectedStatus.toLowerCase());

    const matchesSearch =
      searchText === "" ||
      (user.nip && user.nip.toLowerCase().includes(searchText.toLowerCase())) ||
      (user.titlePrefix &&
        user.titlePrefix.toLowerCase().includes(searchText.toLowerCase())) ||
      (user.fullName &&
        user.fullName.toLowerCase().includes(searchText.toLowerCase())) ||
      (user.email &&
        user.email.toLowerCase().includes(searchText.toLowerCase()));

    return matchesDept && matchesStatus && matchesSearch;
  });

  const sortedData = [...filteredUsers].sort((a, b) => {
    let aValue = "";
    let bValue = "";
    switch (sort.key) {
      case "nama":
        aValue = (a.fullName || "").toLowerCase();
        bValue = (b.fullName || "").toLowerCase();
        break;
      case "nip":
        aValue = (a.nip || "").toLowerCase();
        bValue = (b.nip || "").toLowerCase();
        break;
      case "departemen":
        aValue = (a.position?.division?.department?.name || "").toLowerCase();
        bValue = (b.position?.division?.department?.name || "").toLowerCase();
        break;
      case "posisi":
        aValue = (a.position?.name || "").toLowerCase();
        bValue = (b.position?.name || "").toLowerCase();
        break;
      case "role":
        aValue = (a.role?.name || "").toLowerCase();
        bValue = (b.role?.name || "").toLowerCase();
        break;
      case "status":
        aValue = (a.status || "").toLowerCase();
        bValue = (b.status || "").toLowerCase();
        break;
      default:
        aValue = a[sort.key] || "";
        bValue = b[sort.key] || "";
    }
    if (aValue < bValue) return sort.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sort.direction === "asc" ? 1 : -1;
    return 0;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedData.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const countByProfession = (type) => {
    return filteredUsers.filter((user) => {
      const prof = user.profession?.name?.toLowerCase() || "";
      if (type === "dokter") return prof.includes("dokter");
      if (type === "bidan") return prof.includes("bidan");
      if (type === "perawat")
        return (
          prof.includes("perawat") ||
          prof.includes("anestesi") ||
          prof.includes("fisioterapis") ||
          prof.includes("radiografer") ||
          prof.includes("apoteker") ||
          prof.includes("asisten apoteker") ||
          prof.includes("dokpol") ||
          prof.includes("psikolog") ||
          prof.includes("perekam medis")
        );
      if (type === "nonmedis")
        return !(
          prof.includes("dokter") ||
          prof.includes("bidan") ||
          prof.includes("perawat") ||
          prof.includes("anestesi") ||
          prof.includes("fisioterapis") ||
          prof.includes("radiografer") ||
          prof.includes("apoteker") ||
          prof.includes("asisten apoteker") ||
          prof.includes("dokpol") ||
          prof.includes("psikolog") ||
          prof.includes("perekam medis")
        );
    }).length;
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
                <span className="stat-value-dash">{filteredUsers.length}</span>
              </div>
              <div className="stat-icon-dash purple-light-dash">
                <FaUsers />
              </div>
              <span className="badge-sect plus">
                {newUsersThisMonth > 0 ? `+${newUsersThisMonth}` : "0"}
              </span>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Dokter</span>
                <span className="stat-value-dash">
                  {countByProfession("dokter")}
                </span>
              </div>
              <div className="stat-icon-dash green-light-dash">
                <FaUserMd />
              </div>
              <span className="badge-sect plus">
                {newDokter > 0 ? `+${newDokter}` : "0"}
              </span>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Perawat</span>
                <span className="stat-value-dash">
                  {countByProfession("perawat")}
                </span>
              </div>
              <div className="stat-icon-dash blue-light-dash">
                <FaUserNurse />
              </div>
              <span className="badge-sect plus">
                {newPerawat > 0 ? `+${newPerawat}` : "0"}
              </span>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Bidan</span>
                <span className="stat-value-dash">
                  {countByProfession("bidan")}
                </span>
              </div>
              <div className="stat-icon-dash pink-light-dash">
                <FaFemale />
              </div>
              <span className="badge-sect plus">
                {newBidan > 0 ? `+${newBidan}` : "0"}
              </span>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Non-Medis</span>
                <span className="stat-value-dash">
                  {countByProfession("nonmedis")}
                </span>
              </div>
              <div className="stat-icon-dash orange-light-dash">
                <FaUserTie />
              </div>
              <span className="badge-sect plus">
                {newNonMedis > 0 ? `+${newNonMedis}` : "0"}
              </span>
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
              {!isReadOnly && (
                <div
                  className="skeleton-text"
                  style={{ width: "100px", height: "30px" }}
                ></div>
              )}
            </div>
            <div className="header-actions">
              <div className="search-wrapper">
                <div
                  className="skeleton-text"
                  style={{ width: "100%", height: "38px", borderRadius: "8px" }}
                ></div>
              </div>
              <div className="filter-select-group">
                <div
                  className="select-input skeleton-text"
                  style={{
                    width: "100%",
                    height: "38px",
                    borderRadius: "8px",
                  }}
                ></div>
                <div
                  className="select-input skeleton-text"
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
              <h3>Daftar Karyawan</h3>
              {!isReadOnly && (
                <div className="panel-actions-right">
                  <button
                    type="button"
                    className="button is-success"
                    onClick={() => setShowAddModal(true)}
                  >
                    <FaPlus /> Tambah
                  </button>
                </div>
              )}
            </div>
            <div className="header-actions">
              <div className="search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari nama, NIP, atau email..."
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <div className="filter-select-group">
                <select
                  className="select-input"
                  name="department"
                  id="department"
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
                <select
                  className="select-input"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="semua">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
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
                    <th>No</th>
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
                        Jabatan <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Role <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Tipe <FaSort className="sort-icon" />
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
                    <td colSpan="9" style={{ textAlign: "center" }}>
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
                    <th>No</th>
                    <th
                      className={`sortable-header ${sort.key === "nama" ? "active-sort" : ""}`}
                      onClick={() => requestSort("nama")}
                    >
                      <div className="header-content">
                        Nama <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "departemen" ? "active-sort" : ""}`}
                      onClick={() => requestSort("departemen")}
                    >
                      <div className="header-content">
                        Fungsi <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "posisi" ? "active-sort" : ""}`}
                      onClick={() => requestSort("posisi")}
                    >
                      <div className="header-content">
                        Jabatan <FaSort className="sort-icon" />
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
                      className={`sortable-header ${sort.key === "status" ? "active-sort" : ""}`}
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
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user, index) => (
                      <tr key={user.id}>
                        <td>{indexOfFirstUser + index + 1}</td>
                        <td className="perf-name-cell">
                          {/* <div className="user-details">
                            <img
                              src={user.avatarUrl || Avatar}
                              alt={user.fullName || user.titlePrefix}
                              className="user-avatar"
                            />
                            <div className="user-info">
                              <strong>
                                {[user.titlePrefix, user.fullName]
                                  .filter(Boolean)
                                  .join(" ")}
                              </strong>
                              <small>{user.email}</small>
                            </div>
                          </div> */}
                          <img
                            className="staff-avatar"
                            src={user.avatarUrl || Avatar}
                            alt="profile"
                          />
                          <div className="user-info">
                            <div className="user-name">
                              {[user.titlePrefix, user.fullName]
                                .filter(Boolean)
                                .join(" ")}
                            </div>
                            <div className="user-nip">
                              {/* {user.nip} - {user.position?.name || "-"} */}
                              {user.nip} -{" "}
                              {user.position?.division?.name || "-"}
                            </div>
                          </div>
                        </td>
                        <td>{user.position?.division?.department?.name}</td>
                        <td>{user.position?.name}</td>
                        <td>
                          <span
                            className={`tag ${
                              user.role?.name === "Manager"
                                ? "is-info"
                                : "is-light"
                            }`}
                          >
                            {user.role?.name}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              user.status.toLowerCase() === "aktif"
                                ? "aktif"
                                : user.status.toLowerCase() === "cuti"
                                  ? "cuti"
                                  : "nonaktif"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        {!isReadOnly && (
                          <td style={{ alignItems: "center" }}>
                            <div className="action-buttons">
                              <button
                                className="button is-info"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowEditModal(true);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="button is-danger"
                                onClick={async () => {
                                  if (
                                    window.confirm(
                                      `Apakah yakin ingin menghapus user ${user.titlePrefix} ${user.fullName}?`,
                                    )
                                  ) {
                                    handleDelete(user.id);
                                  }
                                }}
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center" }}>
                        <div className="no-data">
                          <h4 className="empty-title">
                            Belum ada data karyawan
                          </h4>
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
            <div className="center-pagination">
              <button
                className="pagination-arrow"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
      {showAddModal && (
        <AddUser
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            getUsers();
            setShowAddModal(false);
          }}
        />
      )}
      {showEditModal && (
        <EditUser
          isOpen={showEditModal}
          userData={selectedUser}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            getUsers();
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
};

export default UserList;

// Modal tambah user

// Modal edit user
