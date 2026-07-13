import React, { useEffect, useMemo, useState } from "react";
import {
  FaAngleLeft,
  FaAngleRight,
  FaPlus,
  FaSearch,
  FaSort,
  FaTimes,
} from "react-icons/fa";
import axiosInstance from "../../api/axios.js";

const LeaveTypeList = () => {
  const token = localStorage.getItem("token");
  const [leaves, setLeaves] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState({ show: false, id: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const leavePerPage = 5;
  const [sort, setSort] = useState({
    key: "id",
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
    getLeaveTypes(token);
  }, []);

  const getLeaveTypes = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/leavetypes");
      setLeaves(res.data.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await axiosInstance.patch(`/leavetypes/${id}`, {
        active: !currentStatus,
      });
      getLeaveTypes();
    } catch (e) {
      alert("Gagal mengubah status jenis pengajuan!");
      console.log(e);
    }
  };

  const handleDelete = async (leaveId) => {
    try {
      await axiosInstance.delete(`/leavetypes/${leaveId}`);
      getLeaveTypes();
      alert("Jenis Pengajuan berhasil dihapus!");
    } catch (e) {
      if (e.response && e.response.status === 400) {
        alert(e.response.data.message);
      } else {
        alert("Terjadi kesalahan pada sever");
      }
      console.log(e);
    }
  };

  const filteredData = useMemo(() => {
    let result = leaves.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.leaveType?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );

    if (sort.key) {
      result.sort((a, b) => {
        let aValue, bValue;

        if (sort.key === "nama") {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        } else {
          aValue = a[sort.key];
          bValue = b[sort.key];
        }

        if (aValue < bValue) return sort.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sort.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [leaves, searchTerm, sort]);

  const totalPages = Math.ceil(filteredData.length / leavePerPage);
  const indexOfLast = currentPage * leavePerPage;
  const indexOfFirst = indexOfLast - leavePerPage;
  const currents = filteredData.slice(indexOfFirst, indexOfLast);

  return (
    <div className="content-page">
      <div className="table-content-card">
        <div className="header-actions">
          <h3>Tabel Jenis Pengajuan</h3>
          <div className="right-actions">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Cari jenis pengajuan..."
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
              <FaPlus />
              Tambah
            </button>
          </div>
        </div>

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
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      <div className="qr-loading-box">
                        <div className="qr-spinner"></div>
                        <p className="qr-loading">Memuat data sub jenis...</p>
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
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currents.length > 0 ? (
                    currents.map((leave, id) => {
                      return (
                        <tr key={leave.id}>
                          <td>{indexOfFirst + id + 1}</td>
                          <td>{leave.name}</td>
                          <td>
                            <div className="switch">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={leave.active}
                                  onChange={() =>
                                    handleToggleStatus(leave.id, leave.active)
                                  }
                                />
                                <span className="slider"></span>
                              </label>
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="button is-info"
                                onClick={() =>
                                  setShowEditModal({ show: true, id: leave.id })
                                }
                              >
                                Edit
                              </button>
                              <button
                                className="button is-danger"
                                onClick={async () => {
                                  if (
                                    window.confirm(
                                      `Apakah yakin ingin menghapus jenis pengajuan ${leave.name}?`,
                                    )
                                  ) {
                                    handleDelete(leave.id);
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
                          <h4 className="empty-title">Belum ada data jenis</h4>
                          <p className="empty-desc">
                            Data jenis akan muncul di sini
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

      <AddLeaveType
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          getLeaveTypes();
          setShowAddModal(false);
        }}
      />

      <EditLeaveType
        isOpen={showEditModal.id}
        id={showEditModal.id}
        onClose={() => setShowEditModal({ show: false, id: null })}
        onSuccess={() => {
          getLeaveTypes();
          setShowEditModal({ show: false, id: null });
        }}
      />
    </div>
  );
};

export default LeaveTypeList;

// Modal tambah jenis pengajuan
const AddLeaveType = ({ isOpen, onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [leaves, setLeaves] = useState({
    name: "",
    active: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(
        "/leaveTypes",
        { name: leaves.name, active: leaves.active },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("Jenis pengajuan berhasil ditambahkan!");
      onSuccess();
    } catch (e) {
      console.log(e);
      alert("Gagal menambahkan jenis pengajuan");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Tambah Jenis Pengajuan</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <div className="label-form">
                <label>
                  Nama Jenis Pengajuan <span>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Masukkan nama jenis pengajuan"
                  onChange={(e) => {
                    setLeaves({ ...leaves, name: e.target.value });
                  }}
                  required
                />
              </div>
              <div className="label-form">
                <label>
                  Status <span>*</span>
                </label>
                <div className="switch">
                  <label>
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="button is-danger" onClick={onClose}>
                Batas
              </button>
              <button type="submit" className="button is-success">
                Simpan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal edit jenis pengajuan
const EditLeaveType = ({ isOpen, id, onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [levaes, setLeaves] = useState({
    name: "",
    active: "",
  });

  useEffect(() => {
    getLeavesTypeId();
  }, [id, isOpen]);

  const getLeavesTypeId = async () => {
    try {
      const res = await axiosInstance.get(`/leavetypes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data) setLeaves(res.data.data);
    } catch (e) {
      console.log("Gagal mengambil data jenis pengajuan", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.put(
        `/leavetypes/${id}`,
        {
          name: levaes.name,
          active: levaes.active,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log("Berhasil mengupdate jenis pengajuan", res.data);
      onSuccess();
      alert("Jenis pengajuan berhasil diperbarui!");
    } catch (e) {
      console.log("Gagal mengambil data jenis pengajuan", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Edit Jenis Pengajuan</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="from-group">
              <div className="label-form">
                <label>
                  Nama Jenis Pengajuan <span>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Masukkan nama jenis pengajuan"
                  value={levaes.name}
                  onChange={(e) => {
                    setLeaves({ ...levaes, name: e.target.value });
                  }}
                  required
                />
              </div>
              <div className="label-form">
                <label>
                  Status <span>*</span>
                </label>
                <div className="switch">
                  <label>
                    <input
                      type="checkbox"
                      checked={levaes.active}
                      onChange={(e) =>
                        setLeaves({ ...levaes, active: e.target.checked })
                      }
                    />
                    <span className="slider"></span>
                  </label>
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
            <button type="submit" className="button is-success">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
