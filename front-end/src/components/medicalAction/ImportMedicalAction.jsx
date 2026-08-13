import React, { useEffect, useState } from "react";
import {
  FiUploadCloud,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import {
  FaAngleLeft,
  FaAngleRight,
  FaFileExcel,
  FaFilePdf,
  FaSearch,
  FaSort,
  FaTrashAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { formatTanggalWaktuMundur } from "../../utils/dateHelper";
import axiosInstance from "../../api/axios.js";

const ImportMedicalAction = () => {
  //   const token = localStorage.getItem("token");
  const [file, setFile] = useState(null);
  const [actions, setActions] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedVisitType, setSelectedVisitType] = useState("");
  //   const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7),
  );
  const [monthDataCount, setMonthDataCount] = useState(0);
  const [checkingMonthCount, setCheckingMonthCount] = useState(false);

  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 10;

  const [sort, setSort] = useState({
    key: "dateOfAction",
    direction: "asc",
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sort.key === key && sort.direction === "asc") {
      direction = "desc";
    }
    setSort({ key, direction });
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchActions();
  }, [
    currentPage,
    searchTerm,
    sort,
    selectedUnit,
    selectedVisitType,
    selectedMonth,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedUnit, selectedVisitType, selectedMonth]);

  //   const fetchActions = async () => {
  //     setLoading(true);
  //     try {
  //       //   const response = await axios.get(
  //       //     `http://localhost:3000/medical-actions?page=${currentPage}&limit=${requestsPerPage}&search_query=${searchTerm}&sort_key=${sort.key}&sort_direction=${sort.direction}`,
  //       //     {
  //       //       headers: { Authorization: `Bearer ${token}` },
  //       //     },
  //       //   );

  //       const response = await axiosInstance.get(
  //         `/medical-actions?page=${currentPage}&limit=${requestsPerPage}&search_query=${searchTerm}&sort_key=${sort.key}&sort_direction=${sort.direction}`,
  //       );

  //       //   const response = await axiosInstance.get("/medical-actions", {
  //       //     params: {
  //       //       page: currentPage,
  //       //       limit: requestsPerPage,
  //       //       search_query: searchTerm,
  //       //       sort_key: sort.key,
  //       //       sort_direction: sort.direction,
  //       //     },
  //       //   });

  //       setActions(response.data.timeline || []);
  //       setTotalRows(response.data.totalRows);
  //       setTotalPages(response.data.totalPages);
  //     } catch (e) {
  //       console.log("Gagal mengambil data tindakan medis", e);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  const fetchActions = async () => {
    setLoading(true);
    try {
      // Mengirim semua parameter filter ke backend
      const response = await axiosInstance.get(
        `/medical-actions?page=${currentPage}&limit=${requestsPerPage}&search_query=${searchTerm}&sort_key=${sort.key}&sort_direction=${sort.direction}&unit=${selectedUnit}&visit_type=${selectedVisitType}&month=${selectedMonth}`,
      );

      // PERBAIKAN UTAMA: Menggunakan medicalActionTimeline sesuai response backend
      setActions(response.data.medicalActionTimeline || []);
      setTotalRows(response.data.totalRows || 0);
      setTotalPages(response.data.totalPages || 0);
    } catch (e) {
      console.error("Gagal mengambil data tindakan medis", e);
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setResult(null);
  };

  const onUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError("Pilih file excel terlebih dahulu!");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError("");

    try {
      //   const response = await axios.post(
      //     "http://localhost:3000/import-tindakan",
      //     formData,
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //         "Content-Type": "multipart/form-data",
      //       },
      //     },
      //   );

      const response = await axiosInstance.post("/import-tindakan", formData);
      setResult(response.data.summary);
      setFile(null);
      alert("Berhasil import data!");
      fetchActions(); // Refresh isi tabel setelah berhasil melakukan import
    } catch (err) {
      setError(err.response?.data?.message || "Terjadi kesalahan saat upload");
    } finally {
      setLoading(false);
    }
  };

  const indexOfLast = currentPage * requestsPerPage;
  const indexOfFirst = indexOfLast - requestsPerPage;
  //   const currentActions = actions;

  const checkMonthDataCount = async () => {
    if (!selectedMonth) {
      setMonthDataCount(0);
      return;
    }

    try {
      setCheckingMonthCount(true);

      const response = await axiosInstance.get(
        `/medical-actions/month/count?month=${selectedMonth}`,
      );

      setMonthDataCount(response.data.totalRows || 0);
    } catch (error) {
      console.error("Gagal menghitung data bulan:", error);

      setMonthDataCount(0);

      alert(
        error.response?.data?.message ||
          "Gagal mengecek jumlah data pada bulan tersebut.",
      );
    } finally {
      setCheckingMonthCount(false);
    }
  };

  useEffect(() => {
    checkMonthDataCount();
  }, [selectedMonth]);

  const handleDeleteMonth = async () => {
    if (!selectedMonth) {
      alert("Pilih bulan terlebih dahulu.");
      return;
    }

    if (monthDataCount === 0) {
      alert("Tidak ada data tindakan pada bulan yang dipilih.");
      return;
    }

    const [year, month] = selectedMonth.split("-");

    const confirmDelete = window.confirm(
      `Hapus seluruh data tindakan bulan ${month}/${year}?\n\n` +
        `Jumlah data: ${monthDataCount.toLocaleString("id-ID")} data\n\n` +
        `Data yang sudah dihapus tidak dapat dikembalikan.`,
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.delete(
        `/medical-actions/month?month=${selectedMonth}`,
      );

      alert(
        `${response.data.message}\n` +
          `Jumlah data yang dihapus: ${response.data.deletedCount.toLocaleString(
            "id-ID",
          )}`,
      );

      setCurrentPage(1);
      setResult(null);

      await fetchActions();

      // setelah berhasil dihapus, cek ulang jumlah bulan
      await checkMonthDataCount();
    } catch (err) {
      console.error("Gagal menghapus data bulan:", err);

      setError(
        err.response?.data?.message ||
          "Gagal menghapus data tindakan pada bulan tersebut.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-page">
      <div className="table-content-card">
        <div className="table-header-top">
          <h3>Import Tindakan Volume Pasien</h3>
        </div>
        {/* <p className="text-sm text-gray-500 mb-6"> */}
        <p className="info-text">
          Pastikan file Excel memiliki kolom:{" "}
          {/* <span className="font-mono text-blue-600 italic font-bold"> */}
          <span className="required-columns">
            "NO RM", "TGL TINDAKAN", "UNIT PELAYANAN", "JENIS KUNJUNGAN",
            "DOKTER", "NAMA TINDAKAN"
          </span>
        </p>
        {/* <form onSubmit={onUpload} className="space-y-4"> */}
        <form onSubmit={onUpload} className="import-medical-form">
          {/* <div className="flex items-center justify-center w-full">
          <div className="flex flex-col items-center justify-center pt-5 pb-6"> 
          <FiUploadCloud className="w-10 h-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">
          <span className="text-blue-600 font-medium">{file.name}</span>*/}
          <label className="import-medical-upload-area">
            <div className="import-medical-upload-inner">
              <FiUploadCloud className="import-medical-upload-icon" />
              <p className="import-medical-upload-text">
                {file ? (
                  <span className="import-medical-file-name">{file.name}</span>
                ) : (
                  "Klik untuk pilih file Excel (.xlsx)"
                )}
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={onFileChange}
              accept=".xlsx, .xls"
            />
          </label>
          {/* </div> */}
          <div className="import-medical-button-wrapper">
            <button
              type="submit"
              disabled={loading || !file}
              className="button is-success"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" /> Memproses Data...
                </>
              ) : (
                "Mulai Import Data"
              )}
            </button>
          </div>
        </form>
        {error && (
          //   <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 flex items-center">
          <div className="import-medical-error-box">
            <FiAlertCircle className="mr-2" /> {error}
          </div>
        )}
        {result && (
          //  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          // <div className="flex items-center mb-3 text-green-700 font-bold">
          <div className="import-medical-success-box">
            <div className="import-medical-success-header">
              <FiCheckCircle className="mr-2" /> Import Berhasil!
            </div>
            {/* <div className="grid grid-cols-3 gap-4 text-center"> 
              <div className="p-2 bg-white rounded shadow-sm"> 
               <p className="text-xs text-gray-500 uppercase">Total Data</p>
                <p className="text-xl font-bold text-gray-800">
                  {result.totalImported}
                </p>
             </div>
             <div className="p-2 bg-white rounded shadow-sm"> 
                <p className="text-xs text-gray-500 uppercase">Ter-mapping</p>
                <p className="text-xl font-bold text-blue-600">
                  {result.successfullyMapped}
                </p>
            </div>
             <div className="p-2 bg-white rounded shadow-sm"> 
                <p className="text-xs text-gray-500 uppercase">Gagal Mapping</p>
                <p className="text-xl font-bold text-red-500">
                  {result.failedMapping}
                </p>
            </div>*/}
            <div className="import-medical-result-grid">
              <div className="import-medical-result-item">
                <p className="import-medical-stat-label">Total Data</p>
                <p className="import-medical-stat-value text-default">
                  {result.totalImported}
                </p>
              </div>
              <div className="import-medical-result-item">
                {/* <p className="import-medical-stat-label">Ter-mapping</p> */}
                <p className="import-medical-stat-label">Berhasil Import</p>
                <p className="import-medical-stat-value text-mapped">
                  {/* {result.successfullyMapped} */}
                  {result.successfullyImported}
                </p>
              </div>
              <div className="import-medical-result-item">
                {/* <p className="import-medical-stat-label">Gagal Mapping</p> */}
                <p className="import-medical-stat-label">Duplikat</p>
                <p className="import-medical-stat-value text-failed">
                  {/* {result.failedMapping} */}
                  {result.duplicateCount}
                </p>
              </div>
            </div>
            {/* {result.failedMapping > 0 && (
              //   <p className="mt-3 text-xs text-orange-600 italic">
              <p className="import-medical-failed-note">
                * Ada <strong>{result.failedMapping}</strong> data yang tidak
                cocok dengan nama user di database. Mohon cek kembali penulisan
                nama dokter di Excel atau Database
              </p>
            )} */}

            {result.duplicateCount > 0 && (
              <p className="import-medical-failed-note">
                * Ada <strong>{result.duplicateCount}</strong> data yang tidak
                diimport karena sudah terdapat di database.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="table-content-card" style={{ marginTop: "25px" }}>
        {loading ? (
          <>
            <div className="table-header-top">
              <div
                className="skeleton-text"
                style={{ width: "300px", height: "30px" }}
              ></div>
              <div
                className="skeleton-text"
                style={{ width: "100px", height: "30px" }}
              ></div>
            </div>
            <div className="header-actions">
              <div className="search-wrapper">
                <div
                  className="search-input skeleton-text"
                  style={{
                    width: "200px",
                    height: "38px",
                    borderRadius: "8px",
                  }}
                ></div>
              </div>
              <div className="filter-select-group">
                <div
                  className="skeleton-text"
                  style={{
                    width: "100%",
                    height: "38px",
                    borderRadius: "8px",
                  }}
                ></div>
                <div
                  className="skeleton-text"
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
              <h3>Laporan Tindakan Volume Pasien</h3>
              <div className="panel-actions-right">
                <input
                  type="month"
                  className="select-input"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
                <button
                  type="button"
                  className="button is-danger"
                  onClick={handleDeleteMonth}
                  disabled={
                    loading || checkingMonthCount || monthDataCount === 0
                  }
                >
                  <FaTrashAlt />
                  Hapus Data Bulan
                </button>
              </div>
            </div>
            <div className="header-actions">
              <div className="search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari Dokter atau Unit ..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    // setCurrentPage(1);
                  }}
                />
              </div>
              <div className="filter-select-group">
                <select
                  className="select-input"
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                >
                  <option value="all">Semua Unit</option>
                  <option value="bank darah">Bank Darah</option>
                  <option value="dokpol">Dokpol</option>
                  <option value="dots">Dots</option>
                  <option value="fisioterapi">Fisioterapi</option>
                  <option value="hemodialisa">Hemodialisa</option>
                  <option value="icu">ICU</option>
                  <option value="igd">IGD</option>
                  <option value="kamar operasi">Kamar Operasi</option>
                  <option value="laboratorium">Laboratorium</option>
                  <option value="laboratorium mcu">
                    Laboratorium Khusus MCU
                  </option>
                  <option value="mcu">MCU</option>
                  <option value="nicu picu">NICU/PICU</option>
                  <option value="patologi anatomi">Patalogi Anatomi</option>
                  <option value="poli anak">Poliklinik Anak</option>
                  <option value="poli bedah">Poliklinik Bedah</option>
                  <option value="poli bedah mulut">
                    Poliklinik Bedah Mulut
                  </option>
                  <option value="poli gigi">Poliklinik Gigi</option>
                  <option value="poli gigi periodonti">
                    Poliklinik Gigi Periodonti
                  </option>
                  <option value="poli jika">Poliklinik Jiwa</option>
                  <option value="poli kandungan">Poliklinik Kandungan</option>
                  <option value="poli penyakit dalam">
                    Poliklinik Penyakit Dalam
                  </option>
                  <option value="poli psikolog">Poliklinik Psikolog</option>
                  <option value="poli saraf">Poliklinik Saraf</option>
                  <option value="poli vct">Poloklinik VCT</option>
                  <option value="amarta 1">Puri Amarta 1</option>
                  <option value="amarta 2">Puri Amarta 2</option>
                  <option value="amarta 3">Puri Amarta 3</option>
                  <option value="cakra kembar">Puri Cakra Kembang</option>
                  <option value="kencana 1">Puri Kencana 1</option>
                  <option value="kencana 2">Puri Kencana 2</option>
                  <option value="radiologi">Radiologi</option>
                  <option value="radiologi mcu">Radiologi Khusus MCU</option>
                  <option value="vk">VK</option>
                </select>
                <select
                  className="select-input"
                  value={selectedVisitType}
                  onChange={(e) => setSelectedVisitType(e.target.value)}
                >
                  <option value="all">Semua Jenis Kunjungan</option>
                  <option value="gawat darurat">Gawat Darurat</option>
                  <option value="laboratorium">Laboratorium</option>
                  <option value="radiologi">Radiologi</option>
                  <option value="rawat inap">Rawat Inap</option>
                  <option value="rawat jalan">Rawat Jalan</option>
                </select>
                {/* <select className="select-input">
                  <option value="all">Semua Jenis Tindakan</option>
                </select> */}
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
                    <th>
                      <div className="header-content">
                        No <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        No RM <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Tanggal Tindakan <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Unit Pelayanan <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Jenis Kunjungan <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Dokter <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Nama Tindakan <FaSort className="sort-icon" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="15" style={{ textAlign: "center" }}>
                      <div className="qr-loading-box">
                        <div className="qr-spinner"></div>
                        <p className="qr-loading">Memuat data...</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <>
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
                        className={`sortable-header ${sort.key === "noRM" ? "active-sort" : ""}`}
                        onClick={() => requestSort("noRM")}
                      >
                        <div className="header-content">
                          No RM{" "}
                          <FaSort
                            className="sort-icon"
                            style={{
                              transform:
                                sort.key === "noRM" && sort.direction === "desc"
                                  ? "rotate(180deg)"
                                  : "none",
                              transition: "transform 0.2s",
                            }}
                          />
                        </div>
                      </th>
                      {/* <th
                      className={`sortable-header ${sort.key === "nopen" ? "active-sort" : ""}`}
                      onClick={() => requestSort("nopen")}
                    >
                      <div className="header-content">
                        NOPEN <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "nosep" ? "active-sort" : ""}`}
                      onClick={() => requestSort("nosep")}
                    >
                      <div className="header-content">
                        No SEP <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "pasien" ? "active-sort" : ""}`}
                      onClick={() => requestSort("pasien")}
                    >
                      <div className="header-content">
                        Nama Pasien <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "jk" ? "active-sort" : ""}`}
                      onClick={() => requestSort("jk")}
                    >
                      <div className="header-content">
                        Jenis Kelamin <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "tglLahir" ? "active-sort" : ""}`}
                      onClick={() => requestSort("tglLahir")}
                    >
                      <div className="header-content">
                        Tanggal Lahir <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "bayar" ? "active-sort" : ""}`}
                      onClick={() => requestSort("bayar")}
                    >
                      <div className="header-content">
                        Jenis Pembayaran <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "tglKunjungan" ? "active-sort" : ""}`}
                      onClick={() => requestSort("tglKunjungan")}
                    >
                      <div className="header-content">
                        Tanggal Kunjungan <FaSort className="sort-icon" />
                      </div>
                    </th> */}
                      <th
                        className={`sortable-header ${sort.key === "dateOfAction" ? "active-sort" : ""}`}
                        onClick={() => requestSort("dateOfAction")}
                      >
                        <div className="header-content">
                          Tanggal Tindakan <FaSort className="sort-icon" />
                        </div>
                      </th>
                      <th
                        className={`sortable-header ${sort.key === "serviceUnit" ? "active-sort" : ""}`}
                        onClick={() => requestSort("serviceUnit")}
                      >
                        <div className="header-content">
                          Unit Pelayanan <FaSort className="sort-icon" />
                        </div>
                      </th>
                      <th
                        className={`sortable-header ${sort.key === "visitType" ? "active-sort" : ""}`}
                        onClick={() => requestSort("visitType")}
                      >
                        <div className="header-content">
                          Jenis Kunjungan <FaSort className="sort-icon" />
                        </div>
                      </th>
                      {/* <th
                      className={`sortable-header ${sort.key === "smf-ksm" ? "active-sort" : ""}`}
                      onClick={() => requestSort("smf-ksm")}
                    >
                      <div className="header-content">
                        SMF/KSM <FaSort className="sort-icon" />
                      </div>
                    </th> */}
                      <th
                        className={`sortable-header ${sort.key === "doctorName" ? "active-sort" : ""}`}
                        onClick={() => requestSort("doctorName")}
                      >
                        <div className="header-content">
                          Dokter <FaSort className="sort-icon" />
                        </div>
                      </th>
                      <th
                        className={`sortable-header ${sort.key === "actionName" ? "active-sort" : ""}`}
                        onClick={() => requestSort("actionName")}
                      >
                        <div className="header-content">
                          Nama Tindakan
                          <FaSort className="sort-icon" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* {currentActions.length > 0 ? (
                      currentActions.map((item, index) => ( */}
                    {actions.length > 0 ? (
                      actions.map((item, index) => (
                        <tr key={index + 1}>
                          <td>{indexOfFirst + index + 1}</td>
                          <td>{item.noRM}</td>
                          <td>{formatTanggalWaktuMundur(item.dateOfAction)}</td>
                          <td>{item.serviceUnit}</td>
                          <td>{item.visitType}</td>
                          <td>{item.doctorName}</td>
                          <td>{item.actionName}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center" }}>
                          <div className="no-data">
                            <h4 className="empty-title">
                              Belum ada data tindakan volume
                            </h4>
                            <p>Data tindakan volume akan muncul di sini</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="pag-footer-container">
                  <p className="pag-footer-text">
                    Menampilkan {actions.length > 0 ? indexOfFirst + 1 : 0} -{" "}
                    {indexOfFirst + actions.length} dari {totalRows} data
                  </p>
                  <div className="right-pagination">
                    <button
                      className="pagination-arrow"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportMedicalAction;
