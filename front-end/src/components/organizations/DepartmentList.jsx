// import axios from "axios";
import { useState, useEffect } from "react";
import {
  FaAngleLeft,
  FaAngleRight,
  FaPlus,
  FaSearch,
  FaSort,
  FaTimes,
} from "react-icons/fa";
import axiosInstance from "../../api/axios.js";

// loadingnya masih ungu
const DepartmentList = () => {
  //   const token = localStorage.getItem("token");
  const [departments, setDepartments] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState({ show: false, id: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;
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

  useEffect(() => {
    getDepartments();
  }, []);

  const getDepartments = async () => {
    setLoading(true);
    try {
      //   const response = await axios.get("http://localhost:3000/departments", {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      const response = await axiosInstance.get("/departments");
      setDepartments(response.data.data);
    } catch (e) {
      console.log("Gagal menampilkan data fungsi", e.error);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (departmentId) => {
    try {
      //   await axios.delete(`http://localhost:3000/departments/${departmentId}`, {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      await axiosInstance.delete(`/departments/${departmentId}`);
      getDepartments();
      alert("Fungsi berhasil dihapus!");
    } catch (e) {
      if (e.response && e.response.status === 400) {
        alert(e.response.data.message);
      } else {
        alert("Terjadi kesalahan pada server.");
      }
      console.log(e);
    }
  };

  //   const filteredDepartments = departments.filter((dept) =>
  //     dept.name.toLowerCase().includes(searchTerm.toLowerCase()),
  //   );
  const filteredData = departments
    .filter((dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sort.key === "nama") {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();

        if (nameA < nameB) return sort.direction === "asc" ? -1 : 1;
        if (nameA > nameB) return sort.direction === "asc" ? 1 : -1;
        return 0;
      }

      if (sort.key === "no") {
        return sort.direction === "asc" ? a.id - b.id : b.id - a.id;
      }

      return 0;
    });

  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentDepartments = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / usersPerPage);

  return (
    <div className="content-page">
      <div className="table-content-card">
        {loading ? (
          <div className="header-actions">
            <div
              className="skeleton-text"
              style={{ width: "120px", height: "30px" }}
            ></div>
            <div className="right-actions">
              <div className="search-wrapper">
                <div
                  className="skeleton-box"
                  style={{
                    width: "100%",
                    height: "38px",
                    borderRadius: "8px",
                    marginBottom: "5px",
                  }}
                ></div>
              </div>
              <div
                className="skeleton-text"
                style={{
                  width: "70px",
                  height: "40px",
                  borderRadius: "8px",
                  marginBottom: "10px",
                }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="header-actions">
            <h3>Tabel Fungsi</h3>
            <div className="right-actions">
              <div className="search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari nama fungsi..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <button
                type="button"
                className="button is-success"
                onClick={() => setShowAddModal(true)}
              >
                <FaPlus /> Tambah
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
                      <div className="header-content">No</div>
                    </th>
                    <th>
                      <div className="header-content">
                        Nama <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>
                      <div className="preview-container">
                        <div className="preview-loading-container">
                          <div className="spinner"></div>
                          <p>Memuat data fungsi...</p>
                        </div>
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
                      className={`sortable-header ${sort.key === "no" ? "active-sort" : ""}`}
                      onClick={() => requestSort("no")}
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
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDepartments.length > 0 ? (
                    currentDepartments.map((department, id) => {
                      return (
                        <tr key={department.id}>
                          <td>{indexOfFirst + id + 1}</td>
                          <td>{department.name}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="button is-info"
                                onClick={() =>
                                  setShowEditModal({
                                    show: true,
                                    id: department.id,
                                  })
                                }
                              >
                                Edit
                              </button>
                              <button
                                className="button is-danger"
                                onClick={async () => {
                                  if (
                                    window.confirm(
                                      `Apakah yakin ingin menghapus ${department.name}?`,
                                    )
                                  ) {
                                    handleDelete(department.id);
                                  }
                                }}
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center" }}>
                        <div className="no-data">
                          <h4 className="empty-title">Belum ada data fungsi</h4>
                          <p className="empty-desc">
                            Data fungsi akan muncul di sini
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
      <AddDepartment
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          getDepartments();
          setShowAddModal(false);
        }}
      />
      <EditDepartment
        isOpen={showEditModal.id}
        id={showEditModal.id}
        onClose={() => setShowEditModal({ show: false, id: null })}
        onSuccess={() => {
          getDepartments();
          setShowEditModal({ show: false, id: null });
        }}
      />
    </div>
  );
};

export default DepartmentList;

// Modal tambah departemen
const AddDepartment = ({ isOpen, onClose, onSuccess }) => {
  //   const token = localStorage.getItem("token");
  const [department, setDepartment] = useState({ name: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //   await axios.post(
      //     "http://localhost:3000/departments",
      //     { name: department.name },
      //     {
      //       headers: { Authorization: `Bearer ${token}` },
      //     },
      //   );

      await axiosInstance.post("/departments", { name: department.name });
      alert("Departemen berhasil ditambahkan!");
      onSuccess();
    } catch (e) {
      console.error(e);
      alert("Gagal membuat departemen");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Tambah Fungsi</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="label-form">
              <label>
                Nama Fungsi <span>*</span>
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="Contoh: Subbag X"
                value={department.name}
                onChange={(e) =>
                  setDepartment({ ...department, name: e.target.value })
                }
                required
              />
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

// Modal edit departemen
const EditDepartment = ({ isOpen, id, onClose, onSuccess }) => {
  //   const token = localStorage.getItem("token");
  const [department, setDepartment] = useState({ name: "" });

  useEffect(() => {
    if (id) {
      getDepartmentById();
    }
  }, [id, isOpen]);

  const getDepartmentById = async () => {
    if (!isOpen) return;

    try {
      //   const res = await axios.get(`http://localhost:3000/departments/${id}`, {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      const res = await axiosInstance.get(`/departments/${id}`);
      setDepartment(res.data.data);
    } catch (e) {
      console.error("Gagal mengambil data departemen:", e);
      alert("Gagal mengambil data departemen");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      //   await axios.put(
      //     `http://localhost:3000/departments/${id}`,
      //     {
      //       name: department.name,
      //     },
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     },
      //   );

      await axiosInstance.put(`/departments/${id}`, {
        name: department.name,
      });
      onSuccess();
      alert("Departemen berhasil diperbarui!");
    } catch (e) {
      console.error("Gagal mengupdate departemen:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Edit Fungsi</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="label-form">
              <label>
                Nama Fungsi <span>*</span>
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="Contoh: Subbag X"
                value={department.name}
                onChange={(e) =>
                  setDepartment({ ...department, name: e.target.value })
                }
                required
              />
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
