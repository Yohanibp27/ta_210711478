import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  FaAngleLeft,
  FaAngleRight,
  FaArrowDown,
  FaArrowUp,
  FaCalendar,
  FaChartLine,
  FaCheck,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaFileExcel,
  FaFilePdf,
  FaSort,
  FaUsers,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axiosInstance from "../../api/axios.js";

const MonthlyReport = () => {
  const token = localStorage.getItem("token");
  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().substring(0, 7),
  );
  const [reportData, setReportData] = useState([]);
  const [trends, setTrends] = useState([]);
  const [stats, setStats] = useState({
    totalWorkDays: { value: 0, growth: 0 },
    avgAttendance: { value: "0", growth: 0 },
    totalTelat: { value: 0, growth: 0 },
    totalIzin: { value: 0, growth: 0 },
  });
  const [recommendations, setRecommendations] = useState({
    worstDiv: null,
    bestDiv: null,
    trendInfo: "",
  });
  const [distribution, setDistribution] = useState({
    Hadir: 0,
    Terlambat: 0,
    Izin: 0,
    DinasLuar: 0,
    TidakHadir: 0,
    TidakValid: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [sort, setSort] = useState({
    key: "div",
    direction: "asc",
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sort.key === key && sort.direction === "asc") {
      direction = "desc";
    }
    setSort({ key, direction });
  };

  const getTotalWeeksInMonth = (year, month) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return Math.ceil((lastDay + firstDay) / 7);
  };

  const getWeekOfMonth = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return Math.ceil((day + firstDay) / 7);
  };

  const calculateGrowth = (current, previous) => {
    if (previous === 0 && current === 0) return 0;
    if (previous === 0) return 100; // Asumsi kenaikan maksimal jika sblmnya 0
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const processReportData = useCallback((users, attendances, periodStr) => {
    const [yearStr, monthStr] = periodStr.split("-");
    const targetYear = parseInt(yearStr);
    const targetMonth = parseInt(monthStr) - 1;

    const prevDate = new Date(targetYear, targetMonth - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth();

    const extractMonthStats = (tYear, tMonth) => {
      const totalWeeks = getTotalWeeksInMonth(tYear, tMonth);
      let weekMap = {};
      for (let i = 1; i <= totalWeeks; i++) weekMap[i] = 0;

      const monthAttendances = attendances.filter((a) => {
        if (!a.date) return false;
        const d = new Date(a.date);
        return d.getMonth() === tMonth && d.getFullYear() === tYear;
      });

      const uniqueDates = new Set(monthAttendances.map((a) => a.date));
      const totalWorkDays = uniqueDates.size > 0 ? uniqueDates.size : 1;

      let divMap = {};
      let statsCounter = {
        totalHadirFisik: 0,
        totalTelat: 0,
        totalIzin: 0,
        totalTidakHadir: 0,
        totalDinasLuar: 0,
        totalTidakValid: 0,
      };
      let distCount = {
        Hadir: 0,
        Terlambat: 0,
        Izin: 0,
        DinasLuar: 0,
        TidakHadir: 0,
        TidakValid: 0,
      };

      const attendanceMap = monthAttendances.reduce((acc, curr) => {
        const uid = curr.user?.id || curr.userId;
        if (!uid) return acc;
        const key = String(uid);
        if (!acc[key]) acc[key] = [];
        acc[key].push(curr);
        return acc;
      }, {});

      users.forEach((user) => {
        const divName = user.position?.division?.name || "Lainnya";
        if (!divMap[divName]) {
          divMap[divName] = {
            div: divName,
            staff: 0,
            hadir: 0,
            telat: 0,
            izin: 0,
            tidakHadir: 0,
            dinasLuar: 0,
            tidakValid: 0,
          };
        }
        divMap[divName].staff += 1;

        const userAtts = attendanceMap[String(user.id)] || [];
        userAtts.forEach((att) => {
          const status = att.attendanceStatus;
          const week = getWeekOfMonth(att.date);
          if (status === "Hadir") {
            divMap[divName].hadir++;
            distCount.Hadir++;
            statsCounter.totalHadirFisik++;
          } else if (status === "Dinas Luar") {
            divMap[divName].dinasLuar++;
            divMap[divName].hadir++;
            distCount.DinasLuar++;
            statsCounter.totalDinasLuar++;
            statsCounter.totalHadirFisik++;
          } else if (status === "Terlambat") {
            divMap[divName].telat++;
            divMap[divName].hadir++;
            distCount.Terlambat++;
            statsCounter.totalTelat++;
            if (weekMap[week] !== undefined) weekMap[week]++;
            statsCounter.totalHadirFisik++;
          } else if (status === "Izin" || status === "Cuti") {
            divMap[divName].izin++;
            distCount.Izin++;
            statsCounter.totalIzin++;
          } else if (status === "Tidak Hadir") {
            divMap[divName].tidakHadir++;
            distCount.TidakHadir++;
            statsCounter.totalTidakHadir++;
          } else if (status === "Tidak Valid") {
            divMap[divName].tidakValid++;
            divMap[divName].hadir++;
            distCount.TidakValid++;
            statsCounter.totalTidakValid++;
            statsCounter.totalHadirFisik++;
          }
        });
      });

      const processedTable = Object.values(divMap).map((d) => {
        const potentialPresence = d.staff * totalWorkDays;
        const rate =
          potentialPresence === 0 ? 0 : (d.hadir / potentialPresence) * 100;
        return { ...d, rate: rate.toFixed(1) };
      });

      const totalPotentialAll = users.length * totalWorkDays;
      const avgAttendanceValue =
        totalPotentialAll === 0
          ? 0
          : (statsCounter.totalHadirFisik / totalPotentialAll) * 100;

      return {
        totalWorkDays,
        avgAttendanceValue,
        statsCounter,
        processedTable,
        weekMap,
        distCount,
      };
    };
    const currentData = extractMonthStats(targetYear, targetMonth);
    const previousData = extractMonthStats(prevYear, prevMonth);
    setStats({
      totalWorkDays: {
        value: currentData.totalWorkDays,
        growth: calculateGrowth(
          currentData.totalWorkDays,
          previousData.totalWorkDays,
        ),
      },
      avgAttendance: {
        value: `${currentData.avgAttendanceValue.toFixed(1)}%`,
        growth: calculateGrowth(
          currentData.avgAttendanceValue,
          previousData.avgAttendanceValue,
        ),
      },
      totalTelat: {
        value: currentData.statsCounter.totalTelat,
        growth: calculateGrowth(
          currentData.statsCounter.totalTelat,
          previousData.statsCounter.totalTelat,
        ),
      },
      totalIzin: {
        value: currentData.statsCounter.totalIzin,
        growth: calculateGrowth(
          currentData.statsCounter.totalIzin,
          previousData.statsCounter.totalIzin,
        ),
      },
    });

    setReportData(currentData.processedTable);
    setTrends(Object.values(currentData.weekMap));
    setDistribution(currentData.distCount);

    if (currentData.processedTable.length > 0) {
      const sortedDivs = [...currentData.processedTable].sort(
        (a, b) => parseFloat(b.rate) - parseFloat(a.rate),
      );
      setRecommendations({
        bestDiv: sortedDivs[0],
        worstDiv: sortedDivs[sortedDivs.length - 1],
        trendInfo:
          currentData.statsCounter.totalTelat > users.length * 0.5
            ? "Tren keterlambatan cukup signifikan"
            : "Tren keterlambatan stabil",
      });
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      //   const [resUsers, resAttendances] = await Promise.all([
      //     axios.get("http://localhost:3000/users", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/attendances", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //   ]);

      const [resUsers, resAttendances] = await Promise.all([
        axiosInstance.get("/users"),
        axiosInstance.get("/attendances"),
      ]);
      processReportData(
        resUsers.data.data || [],
        resAttendances.data.data || [],
        selectedPeriod,
      );
    } catch (e) {
      console.error("Error fetching report data:", e);
    } finally {
      setLoading(false);
    }
  }, [token, processReportData, selectedPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [reportData]);

  const sortedData = React.useMemo(() => {
    let sortableItems = [...reportData];
    if (sort.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sort.key];
        let bValue = b[sort.key];

        if (!isNaN(aValue) && !isNaN(bValue)) {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        }

        if (aValue < bValue) {
          return sort.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sort.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [reportData, sort]);

  const RenderGrowth = ({ value }) => {
    if (parseFloat(value) === 0) {
      return (
        <span className="stat-text-dash gray" style={{ color: "black" }}>
          <span style={{ marginRight: "5px" }}></span> 0%
        </span>
      );
    }
    const isPositive = value > 0;
    return (
      <span className={`stat-text-dash ${isPositive ? "green" : "red"}`}>
        {isPositive ? <FaArrowUp /> : <FaArrowDown />} {Math.abs(value)}%
      </span>
    );
  };

  const totalDist = Object.values(distribution).reduce((a, b) => a + b, 0);
  const getDistPercent = (val) =>
    totalDist === 0 ? 0 : ((val / totalDist) * 100).toFixed(1);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = useMemo(() => {
    return sortedData.slice(indexOfFirstItem, indexOfLastItem);
  }, [sortedData, indexOfFirstItem, indexOfLastItem]);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleExportPDF = async () => {
    // const doc = new jsPDF();
    const doc = new jsPDF("l", "mm", "a4");
    const [year, month] = selectedPeriod.split("-");
    const monthName = new Date(year, month - 1).toLocaleString("id-ID", {
      month: "long",
      year: "numeric",
    });
    const today = new Date().toLocaleString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("RUMAH SAKIT BHAYANGKARA TK. III INDRAMAYU", 105, 10, {
      align: "center",
    });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`LAPORAN KEHADIRAN ${monthName.toUpperCase()}`, 105, 18, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${today}`, 14, 25);
    let currentY = 32;

    doc.setFont("helvetica", "bold");
    doc.text("KEHADIRAN PER UNIT", 14, currentY);
    currentY += 0;

    const tableColumn = [
      "No",
      "Nama Unit",
      "Jumlah Karyawan",
      "Jumlah Kehadiran",
      "Jumlah Keterlambatan",
      "Jumlah Izin",
      "Jumlah Tidak Hadir",
      "Jumlah Tidak Valid",
      "Jumlah Dinas Luar",
      "Persentase Kehadiran",
    ];

    const tableRows = reportData.map((row, index) => [
      index + 1,
      row.div,
      row.staff,
      row.hadir,
      row.telat,
      row.izin,
      row.tidakHadir,
      row.tidakValid,
      row.dinasLuar,
      `${row.rate}%`,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: currentY + 2,
    });
    currentY = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("TREN KETERLAMBATAN PER MINGGU", 14, currentY);
    const trendHeaders = trends.map((_, i) => `Minggu ${i + 1}`);
    autoTable(doc, {
      head: [trendHeaders],
      body: [trends],
      startY: currentY + 2,
    });
    currentY = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("DISTRIBUSI STATUS KEHADIRAN", 14, currentY);

    const distTable = [
      ["Hadir", distribution.Hadir],
      ["Terlambat", distribution.Terlambat],
      ["Izin", distribution.Izin],
      ["Dinas Luar", distribution.DinasLuar],
      ["Tidak Hadir", distribution.TidakHadir],
      ["Tidak Valid", distribution.TidakValid],
    ];

    autoTable(doc, {
      head: [["Status", "Jumlah"]],
      body: distTable,
      startY: currentY + 2,
    });
    doc.save(`Laporan_Presensi_Unit_${monthName}.pdf`);

    const fileName = `Laporan_Presensi_Unit_${monthName}.pdf`;
    // doc.save(fileName);
    const pdfBlob = doc.output("blob");
    const formData = new FormData();
    formData.append("file", pdfBlob, fileName);
    formData.append("reportName", `Laporan Presensi Unit ${monthName}`);
    formData.append("period", selectedPeriod);
    formData.append("status", "Selesai");
    formData.append("reportType", "PDF");

    try {
      //   await axios.post(
      //     "http://localhost:3000/history",
      //     // {
      //     //   reportName: `Laporan Presensi Unit ${monthName}`,
      //     //   period: selectedPeriod,
      //     //   status: "Selesai",
      //     //   reportType: "PDF",
      //     //   fileUrl: "",
      //     // },
      //     formData,
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //         "Content-Type": "multipart/form-data",
      //       },
      //     },
      //   );

      await axiosInstance.post("/history", formData);
      //   fetchHistory();
    } catch (e) {
      console.error("Gagal menyimpan riwayat laporan presensi unit", e);
    }
  };

  const handleExportExcel = async () => {
    const wb = XLSX.utils.book_new();
    const [year, month] = selectedPeriod.split("-");
    const monthName = new Date(year, month - 1).toLocaleString("id-ID", {
      month: "long",
      year: "numeric",
    });
    const today = new Date().toLocaleString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const sheetData = [
      ["RUMAH SAKIT BHAYANGKARA TK. III INDRAMAYU"],
      [`LAPORAN KEHADIRAN ${monthName.toUpperCase()}`],
      [`Tanggal Cetak: ${today}`],
      [],
      ["KEHADIRAN PER UNIT"],
      [
        "No",
        "Nama Unit",
        "Jumlah Karyawan",
        "Jumlah Kehadiran",
        "Jumlah Keterlambatan",
        "Jumlah Izin",
        "Jumlah Tidak Hadir",
        "Jumlah Tidak Valid",
        "Jumlah Dinas Luar",
        "Persentase Kehadiran",
      ],
      ...reportData.map((row, i) => [
        i + 1,
        row.div,
        row.staff,
        row.hadir,
        row.telat,
        row.izin,
        row.tidakHadir,
        row.tidakValid,
        row.dinasLuar,
        `${row.rate}%`,
      ]),
      [],
      ["TREN KETERLAMBATAN PER MINGGU"],
      trends.map((_, i) => `Minggu ${i + 1}`),
      trends,
      [],
      ["DISTRIBUSI STATUS KEHADIRAN"],
      ["Status", "Jumlah"],
      ["Hadir", distribution.Hadir],
      ["Terlambat", distribution.Terlambat],
      ["Izin", distribution.Izin],
      ["Dinas Luar", distribution.DinasLuar],
      ["Tidak Hadir", distribution.TidakHadir],
      ["Tidak Valid", distribution.TidakValid],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const range = XLSX.utils.decode_range(ws["!ref"]);

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cell]) continue;
        ws[cell].s = {
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
          alignment: {
            vertical: "center",
            horizontal: C === 1 ? "left" : "center",
          },
        };
      }
    }

    ws["A1"].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: "center" },
    };
    ws["A2"].s = {
      font: { bold: true, sz: 12 },
      alignment: { horizontal: "center" },
    };
    ws["A3"].s = {
      font: { italic: true },
      alignment: { horizontal: "center" },
    };

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },
    ];

    const headerRows = [];
    sheetData.forEach((row, idx) => {
      if (!row) return;

      if (
        row.includes("Nama Unit") ||
        row.includes("Status") ||
        row.some((val) => String(val).includes("Minggu"))
      ) {
        headerRows.push(idx);
      }
    });

    headerRows.forEach((r) => {
      for (let C = 0; C <= 9; C++) {
        const cell = XLSX.utils.encode_cell({ r, c: C });
        if (!ws[cell]) continue;

        ws[cell].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "D9E1F2" } },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
          alignment: { horizontal: "center" },
        };
      }
    });

    sheetData.forEach((row, idx) => {
      if (
        row[0] === "KEHADIRAN PER UNIT" ||
        row[0] === "TREN KETERLAMBATAN PER MINGGU" ||
        row[0] === "DISTRIBUSI STATUS KEHADIRAN"
      ) {
        const cell = XLSX.utils.encode_cell({ r: idx, c: 0 });
        ws[cell].s = {
          font: { bold: true },
        };
      }
    });

    ws["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 20 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `Laporan_Presensi_Unit_${monthName}.xlsx`);

    const fileName = `Laporan_Presensi_Unit_${monthName}.xlsx`;
    // XLSX.writeFile(wb, fileName);
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const excelBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const formData = new FormData();
    formData.append("file", excelBlob, fileName);
    formData.append("reportName", `Laporan Presensi Unit ${monthName}`);
    formData.append("period", selectedPeriod);
    formData.append("status", "Selesai");
    formData.append("reportType", "XLSX");

    try {
      //   await axios.post(
      //     "http://localhost:3000/history",
      //     // {
      //     //   reportName: `Laporan Presensi Uit ${monthName}`,
      //     //   period: selectedPeriod,
      //     //   status: "Selesai",
      //     //   reportType: "XLSX",
      //     //   fileUrl: "",
      //     // },
      //     formData,
      //     {
      //       headers: { Authorization: `Bearer ${token}` },
      //     },
      //   );

      await axiosInstance.post("/history", formData);
      //   fetchHistory();
    } catch (e) {
      console.error("Gagal menyimpan riwayat laporan presensi unit", e);
    }
  };

  return (
    <div className="content-page">
      <section className="status-grid-sect">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="stat-card-dash">
              <div className="stat-info-dash">
                <div
                  className="skeleton-text"
                  style={{ width: "120px", height: "16px" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "80px", height: "32px", margin: "10px 0" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "120px", height: "12px" }}
                ></div>
              </div>
              <div className="stat-icon-dash skeleton-icon"></div>
            </div>
          ))
        ) : (
          <>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Hari Kerja</span>
                <span className="stat-value-dash">
                  {stats.totalWorkDays.value}
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={stats.totalWorkDays.growth} /> dari bulan
                  lalu
                </div>
              </div>
              <div className="stat-icon-dash purple-light-dash">
                <FaCalendar />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Rata-rata Kehadiran</span>
                <span className="stat-value-dash">
                  {stats.avgAttendance.value}
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={stats.avgAttendance.growth} /> dari bulan
                  lalu
                </div>
              </div>
              <div className="stat-icon-dash green-light-dash">
                <FaUsers />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Keterlambatan</span>
                <span className="stat-value-dash">
                  {stats.totalTelat.value}
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={stats.totalTelat.growth} /> dari bulan
                  lalu
                </div>
              </div>
              <div className="stat-icon-dash orange-light-dash">
                <FaClock />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">
                  Total Izin/Cuti/Tidak Hadir
                </span>
                <span className="stat-value-dash">{stats.totalIzin.value}</span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={stats.totalIzin.growth} /> dari bulan
                  lalu
                </div>
              </div>
              <div className="stat-icon-dash red-light-dash">
                <FaFileAlt />
              </div>
            </div>
          </>
        )}
      </section>

      <div className="table-content-card" style={{ marginBottom: "20px" }}>
        <div className="header-actions">
          {loading ? (
            <>
              <div
                className="skeleton-text"
                style={{ width: "180px", height: "24px" }}
              ></div>
              <div className="panel-actions-right">
                <div
                  className="skeleton-box"
                  style={{
                    width: "150px",
                    height: "40px",
                    borderRadius: "8px",
                    marginTop: "5px",
                  }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{
                    width: "70px",
                    height: "40px",
                    borderRadius: "8px",
                  }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{
                    width: "70px",
                    height: "40px",
                    borderRadius: "8px",
                  }}
                ></div>
              </div>
            </>
          ) : (
            <>
              <h3>Kehadiran Per Unit</h3>
              <div className="panel-actions-right">
                <input
                  type="month"
                  className="select-input"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                />
                <button className="button is-danger" onClick={handleExportPDF}>
                  <FaFilePdf /> PDF
                </button>
                <button
                  className="button is-success"
                  onClick={handleExportExcel}
                >
                  <FaFileExcel /> Excel
                </button>
              </div>
            </>
          )}
        </div>
        <div className="table-content-wrapper">
          {loading ? (
            <div className="table-content">
              <table className="content-table">
                <thead>
                  <tr>
                    <th>
                      <div className="header-content">
                        Unit <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Karyawan <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Hadir <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Terlambat <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Izin <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Tidak Hadir <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Tidak Valid <FaSort className="sort-icon" />
                      </div>
                    </th>

                    <th>
                      <div className="header-content">
                        Dinas Luar <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Tingkat Kehadiran <FaSort className="sort-icon" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>
                      <div className="qr-loading-box">
                        <div className="qr-spinner"></div>
                        <p className="qr-loading">Memuat data presensi...</p>
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
                      className={`sortable-header ${sort.key === "div" ? "active-sort" : ""}`}
                      onClick={() => requestSort("div")}
                    >
                      <div className="header-content">
                        Unit{" "}
                        <FaSort
                          className={`sort-icon ${sort.key === "div" ? "active" : ""}`}
                        />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "staff" ? "active-sort" : ""}`}
                      onClick={() => requestSort("staff")}
                    >
                      <div className="header-content">
                        Karyawan <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "hadir" ? "active-sort" : ""}`}
                      onClick={() => requestSort("hadir")}
                    >
                      <div className="header-content">
                        Hadir <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "telat" ? "active-sort" : ""}`}
                      onClick={() => requestSort("telat")}
                    >
                      <div className="header-content">
                        Terlambat <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "izin" ? "active-sort" : ""}`}
                      onClick={() => requestSort("izin")}
                    >
                      <div className="header-content">
                        Izin <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "tidakHadir" ? "active-sort" : ""}`}
                      onClick={() => requestSort("tidakHadir")}
                    >
                      <div className="header-content">
                        Tidak Hadir <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "tidakValid" ? "active-sort" : ""}`}
                      onClick={() => requestSort("tidakValid")}
                    >
                      <div className="header-content">
                        Tidak Valid <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "dinasLuar" ? "active-sort" : ""}`}
                      onClick={() => requestSort("dinasLuar")}
                    >
                      <div className="header-content">
                        Dinas Luar <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "rate" ? "active-sort" : ""}`}
                      onClick={() => requestSort("rate")}
                    >
                      <div className="header-content">
                        Tingkat Kehadiran <FaSort className="sort-icon" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(9)].map((_, j) => (
                        <td key={j}>
                          <div className="skeleton-text"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                              ) : */}
                  {currentItems.length > 0 ? (
                    currentItems.map((row, index) => {
                      return (
                        <tr key={index}>
                          <td>
                            <strong>{row.div}</strong>
                          </td>
                          <td>{row.staff}</td>
                          <td>{row.hadir}</td>
                          <td>{row.izin}</td>
                          <td>{row.tidakHadir}</td>
                          <td>{row.tidakValid}</td>
                          <td>{row.telat}</td>
                          <td style={{ fontWeight: "600", color: "#2980b9" }}>
                            {row.dinasLuar}
                          </td>
                          <td>
                            <div className="progress-wrapper">
                              <div className="progress-container">
                                <div
                                  className="progress-bar-table"
                                  style={{ width: `${row.rate}%` }}
                                ></div>
                              </div>
                              <span className="progress-text">{row.rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center" }}>
                        <div className="no-data">
                          <h4 className="empty-title">
                            Belum ada data kehadiran
                          </h4>
                          <p className="empty-desc">
                            Data kehadiran akan muncul di sini
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
        {totalPages > 0 && (
          <div className="pag-footer-container">
            <p className="pag-footer-text">
              Menampilkan {sortedData.length > 0 ? indexOfFirstItem + 1 : 0} -{" "}
              {Math.min(indexOfLastItem, sortedData.length)} dari{" "}
              {sortedData.length} data
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

      <div className="content-two-grid">
        <div className="content-card" style={{ marginBottom: "0px" }}>
          {loading ? (
            <div
              className="skeleton-text"
              style={{ width: "180px", height: "20px", marginBottom: "16px" }}
            />
          ) : (
            <h3>Tren Keterlambatan</h3>
          )}
          {loading ? (
            <div className="loading-trend-container">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="tren-item loading-skeleton-animation">
                  <div className="tren-info" style={{ marginBottom: "8px" }}>
                    <div
                      className="skeleton-text"
                      style={{ width: "80px", height: "12px" }}
                    ></div>
                    <div
                      className="skeleton-text"
                      style={{ width: "40px", height: "12px" }}
                    ></div>
                  </div>
                  <div className="skeleton-progress"></div>
                </div>
              ))}
            </div>
          ) : trends.length > 0 ? (
            trends.map((cases, i) => {
              const maxCases = Math.max(...trends, 5);
              const percentage = (cases / maxCases) * 100;
              let trendColorClass = "green";
              if (cases > 10) trendColorClass = "red";
              else if (cases > 5) trendColorClass = "dark-orange";
              else if (cases > 0) trendColorClass = "orange";
              return (
                <div key={i} className="tren-item">
                  <div className="tren-info">
                    <span>Minggu {i + 1}</span>
                    <span
                      className={cases > 0 ? "text-danger" : "text-success"}
                      style={{ fontWeight: "bold" }}
                    >
                      {cases} kasus
                    </span>
                  </div>
                  <div className="progress-bg">
                    <div
                      className={`progress-bar ${trendColorClass}`}
                      style={{
                        width: `${percentage}%`,
                        transition: "width 0.8s ease-in-out",
                      }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="empty-desc">Tidak ada data minggu ini</p>
          )}
        </div>
        <div className="content-card" style={{ marginBottom: "0px" }}>
          {loading ? (
            <div
              className="skeleton-text"
              style={{ width: "240px", height: "20px", marginBottom: "16px" }}
            />
          ) : (
            <h3>Distribusi Status Kehadiran</h3>
          )}
          <ul className="dist-list">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div
                      className="skeleton-circle"
                      style={{ width: "10px", height: "8px" }}
                    />
                    <div
                      className="skeleton-text"
                      style={{ width: "120px", height: "14px" }}
                    />
                  </div>
                  <div
                    className="skeleton-text"
                    style={{ width: "80px", height: "14px" }}
                  />
                </li>
              ))
            ) : (
              <>
                <li className="legend-item">
                  <span className="dot green"></span> Hadir Tepat Waktu{" "}
                  <span className="val">
                    {distribution.Hadir || 0} (
                    {getDistPercent(distribution.Hadir)}
                    %)
                  </span>
                </li>
                <li className="legend-item">
                  <span className="dot orange"></span> Terlambat{" "}
                  <span className="val">
                    {distribution.Terlambat || 0} (
                    {getDistPercent(distribution.Terlambat)}%)
                  </span>
                </li>
                <li className="legend-item">
                  <span className="dot purple"></span> Izin{" "}
                  <span className="val">
                    {distribution.Izin || 0} (
                    {getDistPercent(distribution.Izin && distribution.Izin)}%)
                  </span>
                </li>
                <li className="legend-item">
                  <span className="dot blue"></span> Dinas Luar{" "}
                  <span className="val">
                    {distribution.DinasLuar || 0} (
                    {getDistPercent(
                      distribution.DinasLuar && distribution.DinasLuar,
                    )}
                    %)
                  </span>
                </li>
                <li className="legend-item">
                  <span className="dot red"></span> Tidak Hadir{" "}
                  <span className="val">
                    {distribution.TidakHadir || 0} (
                    {getDistPercent(distribution.TidakHadir)}%)
                  </span>
                </li>
                <li className="legend-item">
                  <span className="dot grey"></span> Tidak Valid{" "}
                  <span className="val">
                    {distribution.TidakValid || 0} (
                    {getDistPercent(distribution.TidakValid)}%)
                  </span>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      <div className="content-grid-bottom">
        <div className="mont-recommendation-section">
          {loading ? (
            <>
              <div
                className="skeleton-text"
                style={{ width: "200px", height: "20px", marginBottom: "16px" }}
              />
              <div className="rec-box warning">
                <div
                  className="skeleton-text"
                  style={{
                    width: "160px",
                    height: "14px",
                    marginBottom: "10px",
                  }}
                />
                <div
                  className="skeleton-text"
                  style={{ width: "90%", height: "12px", marginBottom: "8px" }}
                />
                <div
                  className="skeleton-text"
                  style={{ width: "80%", height: "12px" }}
                />
              </div>
              <div className="rec-box success">
                <div
                  className="skeleton-text"
                  style={{
                    width: "140px",
                    height: "14px",
                    marginBottom: "10px",
                  }}
                />
                <div
                  className="skeleton-text"
                  style={{ width: "85%", height: "12px", marginBottom: "8px" }}
                />
                <div
                  className="skeleton-text"
                  style={{ width: "75%", height: "12px" }}
                />
              </div>
              <div className="rec-box info">
                <div
                  className="skeleton-text"
                  style={{
                    width: "150px",
                    height: "14px",
                    marginBottom: "10px",
                  }}
                />
                <div
                  className="skeleton-text"
                  style={{ width: "90%", height: "12px", marginBottom: "8px" }}
                />
                <div
                  className="skeleton-text"
                  style={{ width: "80%", height: "12px" }}
                />
              </div>
            </>
          ) : (
            <>
              <h3>Rekomendasi & Catatan</h3>
              {reportData.length > 0 ? (
                <>
                  <div className="rec-box warning">
                    <strong className="cat-label-group">
                      <FaExclamationTriangle className="orange" /> Perhatian
                      Khusus:
                    </strong>
                    <p>
                      Unit <b>{recommendations.worstDiv?.div || "N/A"}</b>{" "}
                      memerlukan perhatian lebih karena memiliki tingkat
                      kehadiran terendah bulan ini, yaitu sebesar{" "}
                      <b>{recommendations.worstDiv?.rate}%</b>.
                    </p>
                    {stats.totalTelat > 0 && (
                      <p>
                        Tercatat total <b>{stats.totalTelat}</b> kasus
                        keterlambatan. Disarankan untuk meninjau kembali
                        ketepatan waktu pada unit terkait.
                      </p>
                    )}
                  </div>
                  <div className="rec-box success">
                    <strong className="cat-label-group">
                      <FaCheck className="green" /> Kinerja Terbaik:
                    </strong>
                    <p>
                      Apresiasi diberikan kepada Unit{" "}
                      <b>{recommendations.bestDiv?.div}</b> yang mempertahankan
                      performa terbaik dengan tingkat kehadiran mencapai{" "}
                      <b>{recommendations.bestDiv?.rate}%</b>.
                    </p>
                    <p>
                      Pertahankan standar operasional ini sebagai percontohan
                      bagi unit lainnya.
                    </p>
                  </div>
                  <div className="rec-box info">
                    <strong className="cat-label-group">
                      <FaChartLine className="blue" /> Ringkasan Tren:
                    </strong>
                    <p>
                      Rata-rata kehadiran seluruh karyawan berada di angka{" "}
                      <b>{stats.avgAttendance.value}</b>.
                    </p>
                    <p>
                      Terdapat <b>{distribution.Izin || 0}</b> pengajuan izin
                      dan <b>{distribution.DinasLuar || 0}</b> penugasan dinas
                      luar yang telah divalidasi.
                      {recommendations.trendInfo}
                    </p>
                  </div>
                </>
              ) : (
                <div className="rec-box info">
                  <p>
                    Belum ada data yang cukup untuk menyusun rekomendasi bulan
                    ini
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;
