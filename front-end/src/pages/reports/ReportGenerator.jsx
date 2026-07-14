import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import axios from "axios";
import { FaFileAlt } from "react-icons/fa";
import axiosInstance from "../../api/axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getReportFileUrl = (fileUrl) => {
  if (!fileUrl) return "";

  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }

  return `${API_BASE_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
};

const TemplateCard = ({ icon, title, description, color }) => {
  const navigate = useNavigate();
  const iconStyle = {
    color: color,
    backgroundColor: `${color}1A`,
  };

  const handleUseTemplate = () => {
    if (title === "Laporan Bulanan Lengkap") {
      navigate("/monthly-report");
    } else if (title === "Laporan Kinerja Karyawan") {
      navigate("/performance-report");
    } else if (title === "Analitik Shift Kerja") {
      navigate("/shift-report");
      // } else if (title === "Laporan Keterlambatan") {
      //   navigate("/delay-report");
    } else if (title === "Laporan Lembur") {
      navigate("/overtime-report");
    } else if (title === "Laporan Pengajuan") {
      navigate("/request-report");
    } else {
      navigate("/executive-dashboard");
      //   navigate("/workload-analytic");
    }
  };

  return (
    <div className="template-card">
      <div className="template-header">
        <div className="template-icon" style={iconStyle}>
          {icon}
        </div>
        <div className="template-info">
          <h4 className="template-title">{title}</h4>
          <p className="template-description">{description}</p>
        </div>
      </div>
      <button className="button-use-template" onClick={handleUseTemplate}>
        {/* Gunakan Template */}
        Lihat Laporan
      </button>
    </div>
  );
};

// const ReportGeneratorPage = ({ onGenerate }) => {
const ReportGeneratorPage = () => {
  //   const token = localStorage.getItem("token");
  const [historyList, setHistoryList] = useState([]);
  //   const [divisions, setDivisions] = useState([]);
  //   const [periode, setPeriode] = useState("Januari 2024");
  //   const [divisi, setDivisi] = useState("Semua Divisi");
  //   const [jenisLaporan, setJenisLaporan] = useState("Ringkasan");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
    // getDivisions();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      //   const res = await axios.get("http://localhost:3000/history", {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });
      const res = await axiosInstance.get("/history");
      setHistoryList(res.data.data);
    } catch (error) {
      console.error("Gagal mengambil riwayat", error);
    } finally {
      setLoading(false);
    }
  };

  //   const getDivisions = async () => {
  //     try {
  //       const res = await axios.get("http://localhost:3000/divisions", {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });
  //       setDivisions(res.data.data);
  //     } catch (e) {
  //       console.log(e);
  //     }
  //   };
  //   const handleExportPDF = () => {
  //     alert("Laporan PDF sedang diunduh...");
  //     console.log("Exporting PDF with filters:", {
  //       periode,
  //       divisi,
  //       jenisLaporan,
  //     });
  //   };
  //   const handleExportExcel = () => {
  //     alert("Laporan Excel sedang diunduh...");
  //     console.log("Exporting Excel with filters:", {
  //       periode,
  //       divisi,
  //       jenisLaporan,
  //     });
  //   };
  //   const handlePreview = () => {
  //     alert("Memuat laporan...");
  //     console.log("Previewing Report with filters:", {
  //       periode,
  //       divisi,
  //       jenisLaporan,
  //     });
  //     onGenerate();
  //   };

  const templates = [
    {
      title: "Laporan Bulanan Lengkap",
      description: "Ringkasan kehadiran, keterlambatan, dan analitik per unit",
      icon: "🟦",
      color: "#4169E1",
    },
    {
      title: "Laporan Kinerja Karyawan",
      description: "Detail kehadiran individual dan evaluasi kinerja",
      icon: "🟢",
      color: "#32CD32",
    },
    {
      title: "Analitik Shift Kerja",
      description: "Perbandingan efektivitas antar shift dan rekomendasi",
      icon: "🟠",
      color: "#FF8C00",
    },
    // {
    //   title: "Laporan Keterlambatan",
    //   description: "Analisis pola keterlambatan dan tren bulanan",
    //   icon: "🟣",
    //   color: "#8A2BE2",
    // },
    {
      title: "Laporan Lembur",
      description: "Rekap jam lembur dan biaya operasional",
      icon: "🟪",
      color: "#800080",
    },
    {
      title: "Laporan Pengajuan",
      description: "Rekap pengajuan izin, cuti, dan dinas luar",
      icon: "🔴",
      color: "#DC143C",
    },
    {
      title: "Dashboard Eksekutif",
      description: "Ringkasan tingkat tinggi untuk manajemen",
      icon: "🔴",
      color: "#DC143C",
    },
  ];

  return (
    <div className="content-page">
      {/* <div className="content-card">
        <h2>Generator Laporan</h2>
        <div className="generator-controls">
          <div className="control-group">
            <label>Periode</label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
            >
              <option value="semua">Semua Periode</option>
              <option>Januari 2024</option>
              <option>Desember 2023</option>
            </select>
          </div>
          <div className="control-group">
            <label>Unit</label>
            <select value={divisi} onChange={(e) => setDivisi(e.target.value)}>
              <option value="semua">Semua Unit</option>
              {divisions.map((div) => (
                <option key={div.id} value={div.name}>
                  {div.name}
                </option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label>Jenis Laporan</label>
            <select
              value={jenisLaporan}
              onChange={(e) => setJenisLaporan(e.target.value)}
            >
              <option>Ringkasan</option>
              <option>Detail Karyawan</option>
              <option>Rekap Presensi</option>
              <option>Rekap Presensi Dinas Luar</option>
              <option>Rekap Tukar Shift</option>
            </select>
          </div>
        </div>
        <div className="generator-actions">
          <button className="button is-danger" onClick={handleExportPDF}>
            Export PDF
          </button>
          <button className="button is-success" onClick={handleExportExcel}>
            Export Excel
          </button>
          <button className="button is-info" onClick={handlePreview}>
            Preview Laporan
          </button>
        </div>
      </div> */}
      {loading ? (
        <div
          className="skeleton-text"
          style={{ width: "270px", height: "30px", marginBottom: "20px" }}
        ></div>
      ) : (
        <div className="generator-title">Jenis Laporan Tersedia</div>
      )}
      <div className="templates-grid">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="template-card">
                <div className="template-header">
                  {/* <div className="skeleton-circle"></div> */}
                  <div
                    className="stat-icon-dash skeleton-icon"
                    style={{
                      marginRight: "10px",
                    }}
                  ></div>
                  <div style={{ flex: 1 }}>
                    <div
                      className="skeleton-text short"
                      style={{ width: "150px", height: "20px" }}
                    ></div>
                    <div
                      className="skeleton-text"
                      style={{ width: "200px", height: "13px" }}
                    ></div>
                  </div>
                </div>
                <div className="skeleton-button"></div>
              </div>
            ))
          : templates.map((template, index) => (
              <TemplateCard
                key={index}
                title={template.title}
                description={template.description}
                icon={template.icon}
                color={template.color}
              />
            ))}
      </div>
      <div className="content-card" style={{ marginBottom: 0 }}>
        {loading ? (
          <div
            className="skeleton-text"
            style={{ width: "200px", height: "30px", marginBottom: "20px" }}
          ></div>
        ) : (
          <h2 style={{ marginBottom: "10px" }}>Riwayat Laporan</h2>
        )}
        <table className="history-table">
          <thead>
            <tr>
              <th>Nama Laporan</th>
              <th>Jenis</th>
              <th>Periode</th>
              <th>Dibuat</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j}>
                      <div className="skeleton-text"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : historyList.length > 0 ? (
              historyList.slice(0, 5).map((report) => (
                <tr key={report.id}>
                  <td>
                    <span className="history-doc-icon">
                      <FaFileAlt />
                    </span>
                    {report.reportName}
                  </td>
                  <td>{report.reportType}</td>
                  <td>{report.period}</td>
                  <td>
                    {new Date(report.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td>
                    <span
                      className={`status-tag status-${report.status.toLowerCase()}`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td>
                    {report.fileUrl && report.fileUrl !== "" ? (
                      <>
                        <a
                          //   href={`http://localhost:3000${report.fileUrl}`}
                          href={getReportFileUrl(report.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-link"
                          download
                        >
                          Unduh
                        </a>{" "}
                        |
                        <a
                          href={getReportFileUrl(report.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-link"
                        >
                          Lihat
                        </a>
                      </>
                    ) : (
                      // TAMPILAN JIKA FILE DI-GENERATE LOKAL
                      <span
                        style={{
                          color: "gray",
                          fontStyle: "italic",
                          fontSize: "0.9em",
                        }}
                      >
                        Tersimpan di perangkat lokal
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  <div className="no-data">
                    <h4 className="empty-title">Belum ada riwayat laporan</h4>
                    <p className="empty-desc">
                      Riwayat laporan akan muncul di sini
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportGeneratorPage;
