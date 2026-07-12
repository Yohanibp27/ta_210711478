import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaAngleLeft,
  FaAngleRight,
  FaPlus,
  FaSearch,
  FaSort,
  FaTimes,
} from "react-icons/fa";
import axiosInstance from "../../api/axios.js";

const DivisionList = () => {
  const token = localStorage.getItem("token");
  const [divisions, setDivisions] = useState([]);
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
    getDivisions();
    getDepartments();
  }, []);

  const getDivisions = async () => {
    setLoading(true);
    try {
      //   const response = await axios.get("http://localhost:3000/divisions", {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      const response = await axiosInstance.get("/divisions");
      setDivisions(response.data.data || []);
    } catch (e) {
      console.log("Gagal menampilkan data unit", e.error);
      setDivisions([]);
    } finally {
      setLoading(false);
    }
  };

  const getDepartments = async () => {
    try {
      //   const response = await axios.get("http://localhost:3000/departments", {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      const response = await axiosInstance.get("/departments");
      setDepartments(response.data.data);
    } catch (e) {
      console.log("Gagal menampilkan data fuungsi", e.error);
    }
  };

  const handleDelete = async (divisionId) => {
    try {
      //   await axios.delete(`http://localhost:3000/divisions/${divisionId}`, {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });

      await axiosInstance.delete(`/divisions/${divisionId}`);
      getDivisions();
      alert("Unit berhasil dihapus");
    } catch (e) {
      if (e.response && e.response.status === 400) {
        alert(e.response.data.message);
      } else {
        alert("Terjadi kesalahan pada server.");
      }
      console.log(e);
    }
  };

  //   const filteredDivisions = divisions.filter((divs) =>
  //     divs.name.toLowerCase().includes(searchTerm.toLowerCase()),
  //   );
  const filteredData = divisions
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

      if (sort.key === "fungsi") {
        const deptA =
          departments.find((d) => d.id === a.departmentId)?.name || "";
        const deptB =
          departments.find((d) => d.id === b.departmentId)?.name || "";

        if (deptA < deptB) return sort.direction === "asc" ? -1 : 1;
        if (deptA > deptB) return sort.direction === "asc" ? 1 : -1;
        return 0;
      }

      if (sort.key === "no") {
        return sort.direction === "asc" ? a.id - b.id : b.id - a.id;
      }

      return 0;
    });

  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentDivisions = filteredData.slice(indexOfFirst, indexOfLast);
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
            <h3>Tabel Unit</h3>
            <div className="right-actions">
              <div className="search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari nama unit..."
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

        {/* <div className="table-division-container">
          <table className="table is-striped is-fullwidth"> */}
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
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>
                      <div className="qr-loading-box">
                        <div className="qr-spinner"></div>
                        <p className="qr-loading">Memuat data unit...</p>
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
                    <th
                      className={`sortable-header ${sort.key === "fungsi" ? "active-sort" : ""}`}
                      onClick={() => requestSort("fungsi")}
                    >
                      <div className="header-content">
                        Fungsi <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDivisions.length > 0 ? (
                    currentDivisions.map((division, id) => {
                      const dept = departments.find(
                        (d) => d.id === division.departmentId,
                      );
                      return (
                        <tr key={division.id}>
                          <td>{indexOfFirst + id + 1}</td>
                          <td>{division.name}</td>
                          <td>{dept ? dept.name : "-"}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="button is-info"
                                onClick={() =>
                                  setShowEditModal({
                                    show: true,
                                    id: division.id,
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
                                      `Apakah Anda yakin ingin menghapus ${division.name}?`,
                                    )
                                  ) {
                                    handleDelete(division.id);
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
                      <td colSpan="4" style={{ textAlign: "center" }}>
                        <div className="no-data">
                          <h4 className="empty-title">Belum ada data unit</h4>
                          <p className="empty-desc">
                            Data unit akan muncul di sini
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
      <AddDivision
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          getDivisions();
          setShowAddModal(false);
        }}
      />
      <EditDivision
        isOpen={showEditModal.id}
        id={showEditModal.id}
        onClose={() => setShowEditModal({ show: false, id: null })}
        onSuccess={() => {
          getDivisions();
          setShowEditModal({ show: false, id: null });
        }}
      />
    </div>
  );
};

export default DivisionList;

// Modal tambah divisi
const AddDivision = ({ isOpen, onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [division, setDivision] = useState({
    name: "",
    departmentId: "",
  });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // const res = await axios.get("http://localhost:3000/departments", {
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //   },
        // });

        const res = await axiosInstance.get("/departments");
        setDepartments(res.data.data);
      } catch (err) {
        console.error("Gagal mengambil data departemen:", err);
      }
    };

    fetchDepartments();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //   const response = await axios.post(
      //     "http://localhost:3000/divisions",
      //     {
      //       name: division.name,
      //       departmentId: division.departmentId,
      //     },
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     },
      //   );

      const response = await axiosInstance.post("/divisions", {
        name: division.name,
        departmentId: division.departmentId,
      });
      console.log("Berhasil menambahkan divis:", response.data);
      alert("Divisi berhasil ditambahkan!");
      if (onSuccess) onSuccess();
    } catch (e) {
      console.log("Gagal menambahkan divisi", e);
      alert("Gagal membuat divisi");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Tambah Unit</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="label-form form-group">
              <label>
                Nama Unit <span>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Ambulance"
                value={division.name}
                onChange={(e) =>
                  setDivision({ ...division, name: e.target.value })
                }
                required
              />
            </div>

            <div className="label-form form-group">
              <label>
                Pilih Fungsi <span>*</span>
              </label>
              <select
                className="input-field"
                value={division.departmentId}
                onChange={(e) =>
                  setDivision({ ...division, departmentId: e.target.value })
                }
                required
              >
                <option value="" disabled>
                  Pilih Fungsi
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
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

// Modal edit divisi
const EditDivision = ({ isOpen, id, onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [division, setDivision] = useState({
    name: "",
    departmentId: "",
  });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    getDivisionById();
    getDepartments();
  }, [id, isOpen]);

  const getDivisionById = async () => {
    try {
      //   const response = await axios.get(
      //     `http://localhost:3000/divisions/${id}`,
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     },
      //   );

      const response = await axiosInstance.get(`/divisions/${id}`);
      if (response.data) {
        setDivision(response.data.data);
      }
    } catch (e) {
      console.error("Gagal ambil data division:", e);
    }
  };

  const getDepartments = async () => {
    try {
      //   const res = await axios.get("http://localhost:3000/departments", {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      const res = await axiosInstance.get("/departments");
      if (Array.isArray(res.data)) {
        setDepartments(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setDepartments(res.data.data);
      } else {
        setDepartments([]);
      }
    } catch (e) {
      console.error("Gagal ambil data departemen:", e);
      setDepartments([]);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    try {
      //   await axios.put(
      //     `http://localhost:3000/divisions/${id}`,
      //     {
      //       name: division.name,
      //       departmentId: division.departmentId,
      //     },
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     },
      //   );

      await axiosInstance.put(`/divisions/${id}`, {
        name: division.name,
        departmentId: division.departmentId,
      });
      alert("Divisi berhasil diperbarui!");
      if (onSuccess) onSuccess();
    } catch (e) {
      console.log(e);
      alert("Gagal memperbarui divisi");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Edit Unit</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleChange}>
          <div className="modal-body">
            <div className="label-form form-group">
              <label>
                Nama Unit <span>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Ambulance"
                value={division.name}
                onChange={(e) =>
                  setDivision({ ...division, name: e.target.value })
                }
                required
              />
            </div>
            <div className="label-form form-group">
              <label>
                Pilih Fungsi <span>*</span>
              </label>
              <select
                className="input-field"
                value={division.departmentId}
                onChange={(e) =>
                  setDivision({ ...division, departmentId: e.target.value })
                }
                required
              >
                <option value="">Pilih Fungsi</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
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
