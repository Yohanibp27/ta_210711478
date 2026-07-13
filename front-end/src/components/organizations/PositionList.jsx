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

const PositionList = () => {
  //   const token = localStorage.getItem("token");
  const [positions, setPosition] = useState([]);
  const [divisions, setDivisions] = useState([]);
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
    getPositions();
    getDivisions();
  }, []);

  const getPositions = async () => {
    setLoading(true);
    try {
      //   const response = await axios.get("http://localhost:3000/positions", {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      const response = await axiosInstance.get("/positions");
      setPosition(response.data.data);
    } catch (e) {
      console.error("Gagal menampilkan data jabatan", e.error);
      setPosition([]);
    } finally {
      setLoading(false);
    }
  };

  const getDivisions = async () => {
    try {
      //   const response = await axios.get("http://localhost:3000/divisions", {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      const response = await axiosInstance.get("/divisions");
      setDivisions(response.data.data);
    } catch (e) {
      console.log(e);
    }
  };

  const handleDelete = async (positionId) => {
    try {
      //   await axios.delete(`http://localhost:3000/positions/${positionId}`, {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      await axiosInstance.delete(`/positions/${positionId}`);
      getPositions();
      alert("Posisi berhasil dihapus!");
    } catch (e) {
      if (e.response && e.response.status === 400) {
        alert(e.response.data.message);
      } else {
        alert("Terjadi kesalahan pada server.");
      }
      console.log(e);
    }
  };

  //   const filteredPositions = positions.filter((post) =>
  //     post.name.toLowerCase().includes(searchTerm.toLowerCase()),
  //   );
  const filteredData = positions
    .filter((post) =>
      post.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sort.key === "nama") {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();

        if (nameA < nameB) return sort.direction === "asc" ? -1 : 1;
        if (nameA > nameB) return sort.direction === "asc" ? 1 : -1;
        return 0;
      }

      if (sort.key === "unit") {
        const divA =
          divisions.find((d) => d.id === a.divisionId)?.name.toLowerCase() ||
          "";
        const divB =
          divisions.find((d) => d.id === b.divisionId)?.name.toLowerCase() ||
          "";

        if (divA < divB) return sort.direction === "asc" ? -1 : 1;
        if (divA > divB) return sort.direction === "asc" ? 1 : -1;
        return 0;
      }

      if (sort.key === "no") {
        return sort.direction === "asc" ? a.id - b.id : b.id - a.id;
      }

      return 0;
    });

  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentPositions = filteredData.slice(indexOfFirst, indexOfLast);
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
            <h3>Tabel Jabatan</h3>
            <div className="right-actions">
              <div className="search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari nama jabatan..."
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
                    <th>
                      <div className="header-content">
                        Unit <FaSort className="sort-icon" />
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
                        <p className="qr-loading">Memuat data jabatan...</p>
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
                      className={`sortable-header ${sort.key === "unit" ? "active-sort" : ""}`}
                      onClick={() => requestSort("unit")}
                    >
                      <div className="header-content">
                        Unit <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPositions.length > 0 ? (
                    currentPositions.map((position, id) => {
                      const div = divisions.find(
                        (d) => d.id === position.divisionId,
                      );
                      return (
                        <tr key={position.id}>
                          <td>{indexOfFirst + id + 1}</td>
                          <td>{position.name}</td>
                          <td>{div ? div.name : "-"}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="button is-info "
                                onClick={() =>
                                  setShowEditModal({
                                    show: true,
                                    id: position.id,
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
                                      `Apakah yakin ingin menghapus posisi ${position.name}?`,
                                    )
                                  ) {
                                    handleDelete(position.id);
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
                          <h4 className="empty-title">Belum ada data posisi</h4>
                          <p className="empty-desc">
                            Data posisi akan muncul di sini
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
      <AddPosition
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          getPositions();
          setShowAddModal(false);
        }}
      />
      <EditPosition
        isOpen={showEditModal.id}
        id={showEditModal.id}
        onClose={() => setShowEditModal({ show: false, id: null })}
        onSuccess={() => {
          getPositions();
          setShowEditModal({ show: false, id: null });
        }}
      />
    </div>
  );
};
export default PositionList;

// Modal tambah posisi
const AddPosition = ({ isOpen, onClose, onSuccess }) => {
  //   const token = localStorage.getItem("token");
  const [position, setPosition] = useState({
    name: "",
    divisionId: "",
  });
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        // const res = await axios.get("http://localhost:3000/divisions", {
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //   },
        // });

        const res = await axiosInstance.get("/divisions");
        setDivisions(res.data.data);
      } catch (err) {
        console.error("Gagal mengambil data departemen:", err);
      }
    };

    fetchDivisions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //   const response = await axios.post(
      //     "http://localhost:3000/positions",
      //     {
      //       name: position.name,
      //       divisionId: position.divisionId,
      //     },
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     },
      //   );

      const response = await axiosInstance.post("/positions", {
        name: position.name,
        divisionId: position.divisionId,
      });
      console.log("Berhasil menambahkan posisi", response.data);
      if (onSuccess) onSuccess();
      alert("Posisi berhasil ditambahkan!");
    } catch (e) {
      console.log("Gagal menambahkan posisi", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Tambah Jabatan</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="label-form form-group">
              <label>
                Nama Jabatan <span>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Administrasi PDP"
                value={position.name}
                onChange={(e) =>
                  setPosition({ ...position, name: e.target.value })
                }
                required
              />
            </div>
            <div className="label-form form-group">
              <label>
                Pilih Unit <span>*</span>
              </label>
              <select
                className="input-field"
                value={position.divisionId}
                onChange={(e) =>
                  setPosition({ ...position, divisionId: e.target.value })
                }
                required
              >
                <option value="" disabled>
                  Pilih Unit
                </option>
                {divisions.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.name}
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

// Modal edit posisi
const EditPosition = ({ isOpen, id, onClose, onSuccess }) => {
  //   const token = localStorage.getItem("token");
  const [position, setPosition] = useState({
    name: "",
    divisionId: "",
  });
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    getPositionById();
    fetchDivisions();
  }, [id, isOpen]);

  const getPositionById = async () => {
    try {
      //   const res = await axios.get(`http://localhost:3000/positions/${id}`, {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });

      const res = await axiosInstance.get(`/positions/${id}`);
      setPosition(res.data.data);
    } catch (e) {
      console.error("Gagal mengambil data posisi:", e);
    }
  };

  const fetchDivisions = async () => {
    try {
      //   const res = await axios.get("http://localhost:3000/divisions", {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });

      const res = await axiosInstance.get("/divisions");
      setDivisions(res.data.data);
    } catch (err) {
      console.error("Gagal mengambil data divisi:", err);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    try {
      //   const res = await axios.put(
      //     `http://localhost:3000/positions/${id}`,
      //     {
      //       name: position.name,
      //       divisionId: position.divisionId,
      //     },
      //     {
      //       headers: { Authorization: `Bearer ${token}` },
      //     },
      //   );

      const res = await axiosInstance.put(`/positions/${id}`, {
        name: position.name,
        divisionId: position.divisionId,
      });
      console.log("Berhasil update posisi", res.data);
      if (onSuccess) onSuccess();
      alert("Posisi berhasil diperbarui!");
    } catch (e) {
      console.log(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Edit Jabatan</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleChange}>
          <div className="modal-body">
            <div className="label-form form-group">
              <label>
                Nama Jabatan <span>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Administrasi PDP"
                value={position.name}
                onChange={(e) =>
                  setPosition({ ...position, name: e.target.value })
                }
                required
              />
            </div>
            <div className="label-form form-group">
              <label>
                Pilih Unit <span>*</span>
              </label>
              <select
                className="input-field"
                value={position.divisionId}
                onChange={(e) =>
                  setPosition({ ...position, divisionId: e.target.value })
                }
                required
              >
                <option value="" disabled>
                  Pilih Unit
                </option>
                {divisions.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.name}
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
