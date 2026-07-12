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

const WorkShiftList = () => {
  //   const token = localStorage.getItem("token");
  const [workShift, setWorkShift] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState({ show: false, id: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

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
    getWorkShifts();
  }, []);

  const getWorkShifts = async () => {
    setLoading(true);
    try {
      //   const response = await axios.get("http://localhost:3000/workshifts", {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });
      const response = await axiosInstance.get("/workshifts");
      setWorkShift(response.data.data || []);
    } catch (e) {
      console.error(e);
      setWorkShift([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workShiftId) => {
    try {
      //   await axios.delete(`http://localhost:3000/workshifts/${workShiftId}`, {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });
      await axiosInstance.delete(`/workshifts/${workShiftId}`);
      getWorkShifts();
      alert("Jam kerja berhasil dihapus!");
    } catch (e) {
      if (e.response && e.response.status === 400) {
        alert(e.response.data.message);
      } else {
        alert("Terjadi kesalahan pada server.");
      }
      console.log(e);
    }
  };

  //   const filteredShifts = workShift.filter((shift) =>
  //     shift.name.toLowerCase().includes(searchTerm.toLowerCase()),
  //   );
  const filteredShifts = workShift
    .filter((ws) => ws.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sort.key === "nama") {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();

        if (nameA < nameB) return sort.direction === "asc" ? -1 : 1;
        if (nameA > nameB) return sort.direction === "asc" ? 1 : -1;
        return 0;
      }

      if (sort.key === "masuk") {
        const deptA =
          workShift.find((d) => d.id === a.departmentId)?.name || "";
        const deptB =
          workShift.find((d) => d.id === b.departmentId)?.name || "";

        if (deptA < deptB) return sort.direction === "asc" ? -1 : 1;
        if (deptA > deptB) return sort.direction === "asc" ? 1 : -1;
        return 0;
      } else if (sort.key === "keluar") {
        const deptA =
          workShift.find((d) => d.id === a.departmentId)?.name || "";
        const deptB =
          workShift.find((d) => d.id === b.departmentId)?.name || "";

        if (deptA < deptB) return sort.direction === "asc" ? -1 : 1;
        if (deptA > deptB) return sort.direction === "asc" ? 1 : -1;
        return 0;
      } else if (sort.key === "toleransi") {
        const deptA =
          workShift.find((d) => d.id === a.departmentId)?.name || "";
        const deptB =
          workShift.find((d) => d.id === b.departmentId)?.name || "";

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
  const currentWorkShifts = filteredShifts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredShifts.length / usersPerPage);

  return (
    <div className="content-page">
      <div className="table-content-card">
        {loading ? (
          <div className="header-actions">
            <div
              className="skeleton-text"
              style={{ width: "150px", height: "30px" }}
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
            <h3>Tabel Jam Kerja</h3>
            <div className="right-actions">
              <div className="search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari nama jam kerja..."
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
                        Mulai <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Selesai <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Toleransi Keterlambatan <FaSort className="sort-icon" />
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
                        <p className="qr-loading">Memuat data jam kerja...</p>
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
                      className={`sortable-header ${sort.key === "masuk" ? "active-sort" : ""}`}
                      onClick={() => requestSort("masuk")}
                    >
                      <div className="header-content">
                        Mulai <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "keluar" ? "active-sort" : ""}`}
                      onClick={() => requestSort("keluar")}
                    >
                      <div className="header-content">
                        Selesai <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "toleransi" ? "active-sort" : ""}`}
                      onClick={() => requestSort("toleransi")}
                    >
                      <div className="header-content">
                        Toleransi Keterlambatan <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentWorkShifts.length > 0 ? (
                    currentWorkShifts.map((shift, id) => (
                      <tr key={shift.id}>
                        <td>{indexOfFirst + 1 + id}</td>
                        <td>{shift.name}</td>
                        <td>{shift.startTime}</td>
                        <td>{shift.endTime}</td>
                        <td>{shift.tolerance || "-"}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="button is-info"
                              onClick={() =>
                                setShowEditModal({
                                  show: true,
                                  id: shift.id,
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
                                    `Apakah Anda yakin ingin menghapus ${shift.name}?`,
                                  )
                                ) {
                                  handleDelete(shift.id);
                                }
                              }}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center" }}>
                        <div className="no-data">
                          <h4 className="empty-title">
                            Belum ada data jam kerja
                          </h4>
                          <p className="empty-desc">
                            Data jam kerja akan muncul di sini
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
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              <FaAngleLeft />
            </button>
            <span>
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              <FaAngleRight />
            </button>
          </div>
        )}
      </div>
      <AddWorkShift
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          getWorkShifts();
          setShowAddModal(false);
        }}
      />
      <EditWorkShift
        isOpen={showEditModal.id}
        id={showEditModal.id}
        onClose={() => setShowEditModal({ show: false, id: null })}
        onSuccess={() => {
          getWorkShifts();
          setShowEditModal({ show: false, id: null });
        }}
      />
    </div>
  );
};

export default WorkShiftList;

// Modal tambah work shift
const AddWorkShift = ({ isOpen, onClose, onSuccess }) => {
  //   const token = localStorage.getItem("token");
  const [workShift, setWorkshifts] = useState({
    name: "",
    startTime: "",
    endTime: "",
    tolerance: "",
  });

  useEffect(() => {
    const fetchWorkShift = async () => {
      try {
        // const res = await axios.get("http://localhost:3000/workshifts", {
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //   },
        // });
        const res = await axiosInstance.get("/workshifts");
        setWorkshifts(res.data.data);
      } catch (err) {
        console.error("Gagal mengambil data departemen:", err);
      }
    };

    fetchWorkShift();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //   await axios.post(
      //     "http://localhost:3000/workshifts",
      //     {
      //       name: workShift.name,
      //       startTime: workShift.startTime,
      //       endTime: workShift.endTime,
      //       tolerance: workShift.tolerance,
      //     },
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     },
      //   );
      await axiosInstance.post("/workshifts", {
        name: workShift.name,
        startTime: workShift.startTime,
        endTime: workShift.endTime,
        tolerance: workShift.tolerance,
      });
      alert("Jam Kerja berhasil ditambahkan!");
      if (onSuccess) onSuccess();
    } catch (e) {
      console.log("Gagal menambahkan jam kerja", e);
      alert("Gagal membuat jam kerja!");
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
                Nama Jam Kerja <span>*</span>
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="Contoh: Sesi Pagi"
                value={workShift.name}
                onChange={(e) =>
                  setWorkshifts({ ...workShift, name: e.target.value })
                }
                required
              />
            </div>
            <div className="form-row">
              <div className="form-column label-form">
                <label>
                  Mulai <span>*</span>
                </label>
                <input
                  className="input-field"
                  type="time"
                  placeholder="Contoh: Subbag X"
                  value={workShift.startTime}
                  onChange={(e) =>
                    setWorkshifts({ ...workShift, startTime: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-column label-form">
                <label>
                  Selesai <span>*</span>
                </label>
                <input
                  className="input-field"
                  type="time"
                  placeholder="Contoh: Subbag X"
                  value={workShift.endTime}
                  onChange={(e) =>
                    setWorkshifts({ ...workShift, endTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="label-form">
              <label>
                Toleransi Keterlambatan <span>*</span>
              </label>
              <input
                className="input-field"
                type="number"
                placeholder="0"
                value={workShift.tolerance}
                onChange={(e) =>
                  setWorkshifts({ ...workShift, tolerance: e.target.value })
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

// Modal edit work shift
const EditWorkShift = ({ isOpen, id, onClose, onSuccess }) => {
  //   const token = localStorage.getItem("token");
  const [workShift, setWorkshifts] = useState({
    name: "",
    startTime: "",
    endTime: "",
    tolerance: "",
  });

  useEffect(() => {
    if (id) {
      getDepartmentById();
    }
  }, [id, isOpen]);

  const getDepartmentById = async () => {
    if (!isOpen) return;

    try {
      //   const res = await axios.get(`http://localhost:3000/workshifts/${id}`, {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });
      const res = await axiosInstance.get(`/workshifts/${id}`);
      setWorkshifts(res.data.data);
    } catch (e) {
      console.error("Gagal mengambil jam kerja:", e);
      alert("Gagal mengambil jam kerja");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      //   await axios.put(
      //     `http://localhost:3000/workshifts/${id}`,
      //     {
      //       name: workShift.name,
      //       startTime: workShift.startTime,
      //       endTime: workShift.endTime,
      //       tolerance: workShift.tolerance,
      //     },
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     },
      //   );
      await axiosInstance.put(`/workshifts/${id}`, {
        name: workShift.name,
        startTime: workShift.startTime,
        endTime: workShift.endTime,
        tolerance: workShift.tolerance,
      });
      onSuccess();
      alert("Jam kerja berhasil diperbarui!");
    } catch (e) {
      console.error("Gagal mengupdate jam kerja:", e);
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
                Nama Jam Kerja <span>*</span>
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="Contoh: Sesi Pagi"
                value={workShift.name}
                onChange={(e) =>
                  setWorkshifts({ ...workShift, name: e.target.value })
                }
                required
              />
            </div>
            <div className="label-form">
              <label>
                Jam Masuk <span>*</span>
              </label>
              <input
                className="input-field"
                type="time"
                placeholder="Contoh: Subbag X"
                value={workShift.startTime}
                onChange={(e) =>
                  setWorkshifts({ ...workShift, startTime: e.target.value })
                }
                required
              />
            </div>
            <div className="label-form">
              <label>
                Jam Keluar <span>*</span>
              </label>
              <input
                className="input-field"
                type="time"
                placeholder="Contoh: Subbag X"
                value={workShift.endTime}
                onChange={(e) =>
                  setWorkshifts({ ...workShift, endTime: e.target.value })
                }
                required
              />
            </div>
            <div className="label-form">
              <label>
                Toleransi Keterlambatan <span>*</span>
              </label>
              <input
                className="input-field"
                type="number"
                placeholder="0"
                value={workShift.tolerance}
                onChange={(e) =>
                  setWorkshifts({ ...workShift, tolerance: e.target.value })
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
