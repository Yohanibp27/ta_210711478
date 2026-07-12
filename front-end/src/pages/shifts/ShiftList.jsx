import React, { useEffect, useMemo, useState } from "react";
// import axios from "axios";
import {
  FaAngleLeft,
  FaAngleRight,
  FaPlus,
  FaSearch,
  FaSort,
  FaTimes,
} from "react-icons/fa";
import Avatar from "../../assets/avatar-ungu.png";
import AddShift from "../../components/modals/shift/AddShift.jsx";
import EditShift from "../../components/modals/shift/EditShift.jsx";
import axiosInstance from "../../api/axios.js";

const ShiftList = () => {
  //   const token = localStorage.getItem("token");
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const shiftsPerPage = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);

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

  const getShifts = async () => {
    setLoading(true);
    try {
      //   const res = await axios.get("http://localhost:3000/shifts", {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });
      const res = await axiosInstance.get("/shifts");
      setShifts(res.data.data || []);
    } catch (e) {
      console.error("Gagal menampilkan data shift", e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getShifts();
  }, []);

  const deleteShift = async (id) => {
    if (!window.confirm("Apakah Anda yakin akan menghapus jadwal shift ini?"))
      return;
    try {
      //   await axios.delete(`http://localhost:3000/shifts/${id}`, {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });
      await axiosInstance.delete(`/shifts/${id}`);
      getShifts();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredData = useMemo(() => {
    let result = [...shifts];
    if (searchTerm) {
      result = result.filter((item) =>
        item.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    result.sort((a, b) => {
      let aValue, bValue;
      if (sort.key === "nama") {
        aValue = a.user?.fullName?.toLowerCase() || "";
        bValue = b.user?.fullName?.toLowerCase() || "";
      } else {
        aValue = a[sort.key];
        bValue = b[sort.key];
      }
      if (aValue < bValue) return sort.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [shifts, searchTerm, sort]);

  const indexOfLast = currentPage * shiftsPerPage;
  const indexOfFirst = indexOfLast - shiftsPerPage;
  const currentShifts = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(shifts.length / shiftsPerPage);

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
            <h2>Tabel Shift</h2>
            <div className="right-actions">
              <div className="search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari karyawan..."
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
              {/* <table className="shiftlist-table"> */}
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
                        Sesi <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Jam Kerja <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Tanggal <FaSort className="sort-icon" />
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
                        <p className="qr-loading">
                          Memuat data jadwal shift...
                        </p>
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
                      className={`sortable-header ${sort.key === "date" ? "active-sort" : ""}`}
                      onClick={() => requestSort("date")}
                    >
                      <div className="header-content">
                        Tanggal <FaSort className="sort-icon" />
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
                    <th>Sesi</th>
                    <th>Jam Kerja</th>

                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentShifts.length > 0 ? (
                    currentShifts.map((item, index) => (
                      <tr key={item.id}>
                        <td>{indexOfFirst + index + 1}</td>
                        <td>{item.date}</td>
                        <td>
                          <div className="perf-name-cell">
                            <img
                              className="staff-avatar"
                              src={
                                item.user.avatarUrl
                                  ? item.user.avatarUrl
                                  : Avatar
                              }
                              alt={item.user.fullName}
                            />
                            <div className="">
                              <div className="user-name">
                                {item.user
                                  ? `${item.user.titlePrefix} ${item.user.fullName || ""}`
                                  : "-"}
                              </div>
                              <div className="user-nip">
                                {item.user.nip} - {item.user.divisi}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${item.workShift?.name.toLowerCase() === "pagi" ? "pagi" : item.workShift?.name.toLowerCase() === "siang" ? "siang" : "malam"}`}
                          >
                            {item.workShift?.name || "-"}
                          </span>
                        </td>
                        <td>
                          {item.workShift
                            ? `${item.workShift.startTime} - ${item.workShift.endTime}`
                            : "-"}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="button is-info"
                              onClick={() => {
                                setSelectedShift(item);
                                setShowEditModal(true);
                                // setShowEditModal({ show: true, id: item.id });
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="button is-danger"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Apakah yakin ingin menghapus shift ${item.user.fullName} pada tanggal ${item.date}?`,
                                  )
                                ) {
                                  deleteShift(item.id);
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
                            Belum ada data jadwal shift
                          </h4>
                          <p className="empty-desc">
                            Data jadwal shift akan muncul di sini
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
      {showAddModal && (
        <AddShift
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            getShifts();
            setShowAddModal(false);
          }}
        />
      )}
      {showEditModal && (
        <EditShift
          isOpen={showEditModal}
          shiftData={selectedShift}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            getShifts();
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ShiftList;
