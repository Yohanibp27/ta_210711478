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

// loading masih ungu
const ProfessionList = () => {
  const token = localStorage.getItem("token");
  const [professions, setProfessions] = useState([]);
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
    getProfessions();
  }, []);

  const getProfessions = async () => {
    setLoading(true);
    try {
      //   const resonse = await axios.get("http://localhost:3000/professions", {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      const resonse = await axiosInstance.get("/professions");
      setProfessions(resonse.data.data);
    } catch (e) {
      console.log("Gagal menampilkan data profesi", e);
      setProfessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (professionId) => {
    try {
      //   await axios.delete(`http://localhost:3000/professions/${professionId}`, {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      await axiosInstance.delete(`/professions/${professionId}`);
      getProfessions();
      alert("Berhasil hapus profesi");
    } catch (e) {
      if (e.response && e.response.status === 400) {
        alert(e.response.data.message);
      } else {
        alert("Terjadi kesalahan pada server");
      }
      console.log(e);
    }
  };

  //   const filteredProfessions = professions.filter((prof) =>
  //     prof.name.toLowerCase().includes(searchTerm.toLowerCase()),
  //   );
  const filteredData = professions
    .filter((prof) =>
      prof.name.toLowerCase().includes(searchTerm.toLowerCase()),
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
  const currentProfessions = filteredData.slice(indexOfFirst, indexOfLast);
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
            <h3>Tabel Profesi</h3>
            <div className="right-actions">
              <div className="search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari nama profesi..."
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
                      <div className="header-content">
                        No <FaSort className="sort-icon" />
                      </div>
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
                          <p>Memuat data profesi...</p>
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
                  {currentProfessions.length > 0 ? (
                    currentProfessions.map((profession, id) => (
                      <tr key={profession.id}>
                        <td>{indexOfFirst + id + 1}</td>
                        <td>{profession.name}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="button is-info"
                              onClick={() =>
                                setShowEditModal({
                                  show: true,
                                  id: profession.id,
                                })
                              }
                            >
                              Edit
                            </button>
                            <button
                              className="button is-danger"
                              onClick={() => handleDelete(profession.id)}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center" }}>
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
      <AddProfession
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          getProfessions();
          setShowAddModal(false);
        }}
      />
      <EditProfession
        isOpen={showEditModal.id}
        id={showEditModal.id}
        onClose={() => setShowEditModal({ show: false, id: null })}
        onSuccess={() => {
          getProfessions();
          setShowEditModal({ show: false, id: null });
        }}
      />
    </div>
  );
};

export default ProfessionList;

// Modal tambah profesi
const AddProfession = ({ isOpen, onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [profession, setProfession] = useState({
    name: "",
  });

  useEffect(() => {
    const fetchProfessions = async () => {
      try {
        // const res = await axios.get("http://localhost:3000/professions", {
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //   },
        // });

        const res = await axiosInstance.get("/professions");
        setProfession(res.data.data);
      } catch (e) {
        console.log(e);
      }
    };

    fetchProfessions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //   const response = await axios.post(
      //     "http://localhost:3000/professions",
      //     {
      //       name: profession.name,
      //     },
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     },
      //   );

      const response = await axiosInstance.post("/professions", {
        name: profession.name,
      });
      console.log("Berhasil menambahkan profesi", response.data);
      onSuccess();
      alert("Profesi berhasil ditambahkan!");
    } catch {
      console.log(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Tambah Profesi</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="label-form form-group">
              <label>
                Nama Profesi <span>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Administrasi"
                value={profession.name}
                onChange={(e) =>
                  setProfession({ ...profession, name: e.target.value })
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

// Modal edit profesi
const EditProfession = ({ isOpen, id, onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [profession, setProfession] = useState({
    name: "",
  });

  useEffect(() => {
    getProfessionById();
  }, [id, isOpen]);

  const getProfessionById = async () => {
    try {
      //   const response = await axios.get(
      //     `http://localhost:3000/professions/${id}`,
      //     {
      //       headers: { Authorization: `Bearer ${token}` },
      //     },
      //   );

      const response = await axiosInstance.get(`/professions/${id}`);
      setProfession(response.data.data);
    } catch (e) {
      console.log(e);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    try {
      //   const res = await axios.put(
      //     `http://localhost:3000/professions/${id}`,
      //     {
      //       name: profession.name,
      //     },
      //     {
      //       headers: { Authorization: `Bearer ${token}` },
      //     },
      //   );

      const res = await axiosInstance.put(`/professions/${id}`, {
        name: profession.name,
      });
      console.log("Berhasil update profesi", res.data);
      if (onSuccess) onSuccess();
      alert("Profesi berhasil diperbarui!");
    } catch (e) {
      console.log(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Edit Profesi</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleChange}>
          <div className="modal-body">
            <div className="label-form form-group">
              <label>
                Nama Profesi <span>*</span>
              </label>
              <div className="control">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Administrasi"
                  value={profession.name}
                  onChange={(e) =>
                    setProfession({ ...profession, name: e.target.value })
                  }
                  required
                />
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
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
