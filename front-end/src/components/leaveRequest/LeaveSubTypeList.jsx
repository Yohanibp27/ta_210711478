import axios from "axios";
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

const LeaveSubTypeList = () => {
  const token = localStorage.getItem("token");
  const [leaveSubs, setLeaveSubs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState({ show: false, id: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const leaveSubPerPage = 5;
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
    getLeaveSubTypes(token);
  }, []);

  const getLeaveSubTypes = async () => {
    setLoading(true);
    try {
      //   const res = await axios.get("http://localhost:3000/leavesubtypes", {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      const res = await axiosInstance.get("/leavesubtypes");
      setLeaveSubs(res.data.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (leaveSubId) => {
    try {
      //   await axios.delete(`http://localhost:3000/leavesubtypes/${leaveSubId}`, {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      await axiosInstance.delete(`/leavesubtypes/${leaveSubId}`);
      getLeaveSubTypes();
      alert("Jenis Sub Pengajuan berhasil dihapus!");
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
    let result = leaveSubs.filter(
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
        } else if (sort.key === "jenis") {
          aValue = (a.leaveType?.name || "").toLowerCase();
          bValue = (b.leaveType?.name || "").toLowerCase();
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
  }, [leaveSubs, searchTerm, sort]);

  const totalPages = Math.ceil(filteredData.length / leaveSubPerPage);
  const indexOfLast = currentPage * leaveSubPerPage;
  const indexOfFirst = indexOfLast - leaveSubPerPage;
  const currents = filteredData.slice(indexOfFirst, indexOfLast);

  return (
    <div className="content-page">
      <div className="table-content-card">
        <div className="header-actions">
          <h3>Tabel Jenis Sub Pengajuan</h3>
          <div className="right-actions">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Cari jenis sub pengajuan..."
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
                    <th>
                      <div className="header-content">
                        Jenis <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Wajib Bukti</th>
                    <th>Izin Hari yang Sama</th>
                    <th>Jam Batas Pengajuan (Jika Izin di Hari yang Sama)</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
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
                    <th
                      className={`sortable-header ${sort.key === "jenis" ? "active-sort" : ""}`}
                      onClick={() => requestSort("jenis")}
                    >
                      <div className="header-content">
                        Jenis <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Wajib Bukti</th>
                    <th>Izin Hari yang Sama</th>
                    <th>Jam Batas Pengajuan (Jika Izin di Hari yang Sama)</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currents.length > 0 ? (
                    currents.map((leaveSub, id) => (
                      <tr key={leaveSub.id}>
                        <td>{indexOfFirst + id + 1}</td>
                        <td>{leaveSub.name}</td>
                        <td>{leaveSub.leavetype?.name ?? "-"}</td>
                        <td>{leaveSub.requireEvidence ? "Ya" : "Tidak"} </td>
                        <td>{leaveSub.allowSameDay ? "Ya" : "Tidak"}</td>
                        <td>
                          {leaveSub.allowSameDay
                            ? `Maks. pukul ${leaveSub.cutoffHour}.00 WIB`
                            : "-"}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="button is-info"
                              onClick={() =>
                                setShowEditModal({
                                  show: true,
                                  id: leaveSub.id,
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
                                    `Apakah yakin ingin menghapus jenis pengajuan ${leaveSub.name}?`,
                                  )
                                ) {
                                  handleDelete(leaveSub.id);
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
                            Belum ada data sub jenis
                          </h4>
                          <p className="empty-desc">
                            Data sub jenis akan muncul di sini
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
      <AddLeaveSubType
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          getLeaveSubTypes();
          setShowAddModal(false);
        }}
      />
      <EditLeaveSubType
        isOpen={showEditModal.id}
        id={showEditModal.id}
        onClose={() => setShowEditModal({ show: false, id: null })}
        onSuccess={() => {
          getLeaveSubTypes();
          setShowEditModal({ show: false, id: null });
        }}
      />
    </div>
  );
};

export default LeaveSubTypeList;

// Modal tambah sub jenis pengajuan
const AddLeaveSubType = ({ isOpen, onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [leaveSubs, setLeaveSubs] = useState({
    name: "",
    leaveTypeId: "",
    requireEvidence: false,
    allowSameDay: true,
    cutoffHour: 10,
  });
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    const fecthLeaveTypes = async () => {
      try {
        const res = await axios.get("http://localhost:3000/leavetypes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLeaveTypes(res.data.data);
      } catch (e) {
        console.log("Gagal mengambil data pengajuan", e);
      }
    };

    fecthLeaveTypes();
  }, [token, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:3000/leavesubtypes",
        {
          name: leaveSubs.name,
          leaveTypeId: Number(leaveSubs.leaveTypeId),
          requireEvidence: leaveSubs.requireEvidence,
          allowSameDay: leaveSubs.allowSameDay,
          cutoffHour: leaveSubs.allowSameDay
            ? Number(leaveSubs.cutoffHour)
            : null,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Jenis sub pengajuan berhasil ditambahkan!");
      onSuccess();
    } catch (e) {
      console.log(e);
      alert("Gagal menambahkan jenis sub pengajuan");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Tambah Jenis Sub Pengajuan</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="label-form">
              <label>
                Nama Sub Pengajuan <span>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Izin Sakit"
                value={leaveSubs.name}
                onChange={(e) => {
                  setLeaveSubs({ ...leaveSubs, name: e.target.value });
                }}
                required
              />
            </div>
            <div className="label-form">
              <label>
                Jenis Pengajuan <span>*</span>
              </label>
              <select
                className="select-input"
                value={leaveSubs.leaveTypeId}
                onChange={(e) => {
                  setLeaveSubs({ ...leaveSubs, leaveTypeId: e.target.value });
                }}
                required
              >
                <option value="" disabled>
                  Pilih jenis pengajuan
                </option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Wajib Melampirkan Bukti <span>*</span>
                  </label>
                  <div className="switch">
                    <label>
                      <input
                        type="checkbox"
                        checked={leaveSubs.requireEvidence}
                        onChange={(e) =>
                          setLeaveSubs({
                            ...leaveSubs,
                            requireEvidence: e.target.checked,
                          })
                        }
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label>Boleh Pengajuan di Hari yang Sama?</label>
                  <div className="switch">
                    <label>
                      <input
                        type="checkbox"
                        checked={leaveSubs.allowSameDay}
                        onChange={(e) =>
                          setLeaveSubs({
                            ...leaveSubs,
                            allowSameDay: e.target.checked,
                          })
                        }
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            {leaveSubs.allowSameDay && (
              <>
                <div className="label-form">
                  <label>
                    Batas Jam Pengajuan (WIB) <span>*</span>
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min="0"
                    max="23"
                    placeholder="Contoh: 10"
                    value={leaveSubs.cutoffHour}
                    onChange={(e) =>
                      setLeaveSubs({
                        ...leaveSubs,
                        cutoffHour: e.target.value,
                      })
                    }
                    required
                  />
                  <small className="helper-text">
                    Pengajuan hanya dapat dilakukan hingga pukul{" "}
                    {leaveSubs.cutoffHour}.00 WIB
                  </small>
                </div>
              </>
            )}
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

// Modal edit sub pengajuan
const EditLeaveSubType = ({ isOpen, id, onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [leaveSubs, setLeaveSubs] = useState({
    name: "",
    leaveTypeId: "",
    requireEvidence: false,
    allowSameDay: true,
    cutoffHour: 10,
  });
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    fetchLeaveSubTypeId();
    fetchLeaveSubType();
  }, [id, isOpen]);

  const fetchLeaveSubType = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/leavesubtypes/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.data) setLeaveSubs(response.data.data);
    } catch (e) {
      console.error("Gagal ambil data sub pengajuan:", e);
    }
  };

  const fetchLeaveSubTypeId = async () => {
    try {
      const res = await axios.get("http://localhost:3000/leavetypes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLeaveTypes(res.data.data || []);
    } catch (err) {
      console.error("Gagal ambil data jenis pengajuan:", err);
      setLeaveTypes([]);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();

    if (
      leaveSubs.allowSameDay &&
      (leaveSubs.cutoffHour < 0 || leaveSubs.cutoffHour > 23)
    ) {
      alert("Jam batas harus antara 0-23");
      return;
    }
    try {
      await axios.put(
        `http://localhost:3000/leavesubtypes/${id}`,
        {
          name: leaveSubs.name,
          leaveTypeId: Number(leaveSubs.leaveTypeId),
          requireEvidence: leaveSubs.requireEvidence,
          allowSameDay: leaveSubs.allowSameDay,
          cutoffHour: leaveSubs.allowSameDay
            ? Number(leaveSubs.cutoffHour)
            : null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      alert("Jenis sub pengajuan berhasil diperbarui!");
      onSuccess();
    } catch (e) {
      console.log(e);
      alert("Gagal memperbarui jenis sub pengajuan");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Edit Jenis Sub Pengajuan</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleChange}>
          <div className="modal-body">
            <div className="label-form">
              <label>
                Nama Sub Pengajuan <span>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Izin Sakit"
                value={leaveSubs.name}
                onChange={(e) => {
                  setLeaveSubs({ ...leaveSubs, name: e.target.value });
                }}
                required
              />

              <div className="label-form">
                <label>
                  Jenis Pengajuan <span>*</span>
                </label>
                <select
                  className="select-input input-field"
                  value={leaveSubs.leaveTypeId}
                  onChange={(e) => {
                    setLeaveSubs({ ...leaveSubs, leaveTypeId: e.target.value });
                  }}
                  required
                >
                  <option value="" disabled>
                    Pilih jenis pengajuan
                  </option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-column">
                  <div className="label-form">
                    <label>
                      Wajib Melampirkan Bukti <span>*</span>
                    </label>
                    <div className="switch">
                      <label>
                        <input
                          type="checkbox"
                          checked={leaveSubs.requireEvidence}
                          onChange={(e) =>
                            setLeaveSubs({
                              ...leaveSubs,
                              requireEvidence: e.target.checked,
                            })
                          }
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="form-column">
                  <div className="label-form">
                    <label>Boleh Pengajuan di Hari yang Sama</label>
                    <div className="switch">
                      <label>
                        <input
                          type="checkbox"
                          checked={leaveSubs.allowSameDay}
                          onChange={(e) =>
                            setLeaveSubs({
                              ...leaveSubs,
                              allowSameDay: e.target.checked,
                            })
                          }
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {leaveSubs.allowSameDay && (
                <>
                  <div className="label-form">
                    <label>
                      Batas Jam Pengajuan (WIB) <span>*</span>
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      min="0"
                      max="23"
                      placeholder="Contoh: 10"
                      value={leaveSubs.cutoffHour}
                      onChange={(e) =>
                        setLeaveSubs({
                          ...leaveSubs,
                          cutoffHour: e.target.value,
                        })
                      }
                      required
                    />
                    <small className="helper-text">
                      Pengajuan hanya dapat dilakukan hingga pukul{" "}
                      {leaveSubs.cutoffHour}.00 WIB
                    </small>
                  </div>
                </>
              )}
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
