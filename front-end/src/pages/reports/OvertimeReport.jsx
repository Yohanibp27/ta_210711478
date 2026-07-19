import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
// import axios from "axios";
import {
  FaFileExcel,
  FaClock,
  FaUsers,
  FaUser,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaFilePdf,
  FaSort,
  FaCalendarAlt,
  FaAngleLeft,
  FaAngleRight,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import Avatar from "../../assets/avatar-ungu.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import XLSX from "xlsx-js-style";
import axiosInstance from "../../api/axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const getProfilePhotoUrl = (photo) => {
  if (!photo) return Avatar;

  const photoValue = String(photo).trim();

  // Apabila backend mengirim URL penuh selain localhost
  if (
    /^https?:\/\//i.test(photoValue) &&
    !photoValue.includes("localhost") &&
    !photoValue.includes("127.0.0.1")
  ) {
    return photoValue;
  }

  // Ambil nama file apabila nilai masih berupa URL localhost
  const fileName = photoValue.split("/").pop();

  return `${API_BASE_URL}/uploads/profilePhotos/${encodeURIComponent(
    fileName,
  )}`;
};

const OvertimeReport = () => {
  //   const token = localStorage.getItem("token");
  const [attendances, setAttendances] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("Semua Divisi");
  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().substring(0, 7),
  );

  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

  useEffect(() => {
    fetchOvertimeData();
  }, [selectedPeriod]);

  const fetchOvertimeData = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedPeriod.split("-");
      //   const response = await axios.get(
      //     `http://localhost:3000/attendances-report?month=${month}&year=${year}`,
      //     { headers: { Authorization: `Bearer ${token}` } },
      //   );

      const response = await axiosInstance.get(
        `/attendances-report?month=${month}&year=${year}`,
      );
      setAttendances(response.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil data lembur:", error);
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  const processedData = useMemo(() => {
    const grouped = attendances.reduce((acc, curr) => {
      const userId = curr.user.id;
      if (
        selectedDivision !== "Semua Divisi" &&
        curr.divisionName !== selectedDivision
      ) {
        return acc;
      }

      if (!acc[userId]) {
        acc[userId] = {
          name: `${curr.user.titlePrefix || ""} ${curr.user.fullName}`.trim(),
          division: curr.divisionName,
          position: curr.positionName,
          photo: curr.user.profilePhoto,
          totalMinutes: 0,
          daysSet: new Set(),
        };
      }
      if (curr.overtimeMinutes > 0) {
        acc[userId].totalMinutes += curr.overtimeMinutes;
        const dateOnly = curr.date;
        acc[userId].daysSet.add(dateOnly);
      }

      return acc;
    }, {});

    return Object.values(grouped)
      .map((emp) => {
        const totalHours = parseFloat((emp.totalMinutes / 60).toFixed(1));
        const totalDays = emp.daysSet.size;
        let hourlyRate = 50000;
        if (["IGD", "ICU", "BEDAH"].includes(emp.division.toUpperCase()))
          hourlyRate = 75000;
        if (["FARMASI"].includes(emp.division.toUpperCase()))
          hourlyRate = 60000;
        return {
          ...emp,
          totalHours,
          totalDays: totalDays,
          avgHours: totalDays > 0 ? (totalHours / totalDays).toFixed(1) : 0,
          rate: hourlyRate,
          totalCost: totalHours * hourlyRate,
        };
      })
      .filter((emp) => emp.totalHours > 0);
  }, [attendances, selectedDivision]);

  const summary = useMemo(() => {
    const totalHours = processedData.reduce((s, i) => s + i.totalHours, 0);
    const uniqueCompanyDays = new Set();
    processedData.forEach((emp) => {
      if (emp.daysSet) {
        emp.daysSet.forEach((date) => uniqueCompanyDays.add(date));
      }
    });
    const totalDays = uniqueCompanyDays.size;
    const avgPerDay = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : 0;
    return {
      totalHours: totalHours.toFixed(1),
      totalDays,
      totalCost: processedData.reduce((s, i) => s + i.totalCost, 0),
      totalPeople: processedData.filter((i) => i.totalHours > 0).length,
      avgPerPerson:
        processedData.length > 0
          ? (totalHours / processedData.length).toFixed(1)
          : 0,
      avgPerDay,
    };
  }, [processedData]);

  const uniqueDivisions = useMemo(() => {
    const divs = attendances.map((a) => a.divisionName);
    return ["Semua Divisi", ...new Set(divs)];
  }, [attendances]);

  const distributionData = useMemo(() => {
    const divTotals = attendances.reduce((acc, curr) => {
      const div = curr.divisionName;
      acc[div] = (acc[div] || 0) + curr.overtimeMinutes;
      return acc;
    }, {});

    const totalAllMinutes = Object.values(divTotals).reduce((a, b) => a + b, 0);
    const colors = ["purple", "blue", "green", "orange", "yellow", "red"];

    return Object.keys(divTotals)
      .map((div, index) => {
        const mins = divTotals[div];
        const percentage =
          totalAllMinutes > 0 ? ((mins / totalAllMinutes) * 100).toFixed(1) : 0;
        return {
          label: div,
          value: `${(mins / 60).toFixed(1)} jam (${percentage}%)`,
          width: `${percentage}%`,
          color: colors[index % colors.length],
        };
      })
      .sort((a, b) => parseFloat(b.width) - parseFloat(a.width))
      .slice(0, 6);
  }, [attendances]);

  const weeklyTrend = useMemo(() => {
    if (!attendances.length) return [];
    const [year, month] = selectedPeriod.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const numWeeks = Math.ceil(daysInMonth / 7);
    const weeks = Array.from({ length: numWeeks }, (_, i) => ({
      label: `Minggu ${i + 1}`,
      mins: 0,
      cost: 0,
    }));

    attendances.forEach((curr) => {
      const date = new Date(curr.date);
      const day = date.getDate();

      let weekIdx = Math.floor((day - 1) / 7);
      if (weekIdx >= weeks.length) weekIdx = weeks.length - 1;
      weeks[weekIdx].mins += curr.overtimeMinutes;

      let rate = 50000;
      if (["IGD", "ICU", "BEDAH"].includes(curr.divisionName?.toUpperCase()))
        rate = 75000;
      weeks[weekIdx].cost += (curr.overtimeMinutes / 60) * rate;
    });

    const maxMins = Math.max(...weeks.map((w) => w.mins), 1);

    return weeks.map((w) => ({
      ...w,
      hours: (w.mins / 60).toFixed(1),
      width: `${(w.mins / maxMins) * 100}%`,
    }));
  }, [attendances, selectedPeriod]);

  //   const analysis = useMemo(() => {
  //     if (processedData.length === 0) return null;
  //     const divTotals = attendances.reduce((acc, curr) => {
  //       acc[curr.divisionName] =
  //         (acc[curr.divisionName] || 0) + curr.overtimeMinutes;
  //       return acc;
  //     }, {});
  //     const topDivision = Object.entries(divTotals).sort(
  //       (a, b) => b[1] - a[1],
  //       )[0];

  //     const topDivName = topDivision ? topDivision[0] : "-";
  //     const overworkLimit = 40;
  //     const overworkedStaff = processedData.filter(
  //       (emp) => emp.totalHours > overworkLimit,
  //     );
  //     const costWarning = summary.totalCost > 50000000;
  //     return {
  //       topDivName,
  //       overworkedCount: overworkedStaff.length,
  //       hasOverworkIssue: overworkedStaff.length > 0,
  //       costWarning,
  //       avgHours: summary.avgPerPerson,
  //       totalCompanyHours: summary.totalHours,
  //     };
  //   }, [processedData, summary, attendances]);

  const analysis = useMemo(() => {
    if (processedData.length === 0) return null;
    const divTotals = attendances.reduce((acc, curr) => {
      const div = curr.divisionName;
      const hours = curr.overtimeMinutes / 60;
      acc[div] = (acc[div] || 0) + hours;
      return acc;
    }, {});

    const sortedDivs = Object.entries(divTotals).sort((a, b) => b[1] - a[1]);
    const topDivisionEntry = sortedDivs[0];
    const topDivName = topDivisionEntry ? topDivisionEntry[0] : "-";
    const topDivHours = topDivisionEntry ? topDivisionEntry[1].toFixed(1) : 0;

    const overworkLimit = 40;
    const overworkedStaff = processedData.filter(
      (emp) => emp.totalHours > overworkLimit,
    );

    return {
      topDivName,
      topDivHours,
      overworkedCount: overworkedStaff.length,
      hasOverworkIssue: overworkedStaff.length > 0,
      costWarning: summary.totalCost > 50000000,
      threshold: overworkLimit,
      avgHours: summary.avgPerPerson,
    };
  }, [processedData, summary, attendances]);

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

  const filteredEmployees = processedData.filter((e) => {
    const matchDiv =
      selectedDivision === "Semua Divisi" || e.division === selectedDivision;
    return matchDiv;
  });

  const sortedData = useMemo(() => {
    const data = [...filteredEmployees];

    const getValue = (item, key) => {
      switch (key) {
        case "nama":
          return item.name?.toLowerCase() || "";
        case "unit":
          return item.division?.toLowerCase() || "";
        case "hari":
          return item.daysCount || 0;
        case "jam":
          return item.totalHours || 0;
        case "avg":
          return parseFloat(item.avgHours) || 0;
        default:
          return "";
      }
    };

    return data.sort((a, b) => {
      const valA = getValue(a, sort.key);
      const valB = getValue(b, sort.key);

      if (valA < valB) return sort.direction === "asc" ? -1 : 1;
      if (valA > valB) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredEmployees, sort]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmployees.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

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

    let y = 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("RUMAH SAKIT BHAYANGKARA TK. III INDRAMAYU", 105, y, {
      align: "center",
    });

    y += 7;
    doc.setFontSize(12);
    doc.text(`LAPORAN LEMBUR ${monthName.toUpperCase()}`, 105, y, {
      align: "center",
    });

    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Tanggal Cetak: ${today}`, 14, y);

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN LEMBUR", 14, y);

    autoTable(doc, {
      startY: y + 2,
      head: [
        [
          "Total Jam Lembur",
          "Total Hari Lembur",
          "Rata-rata / Karyawan",
          "Total Karyawan",
        ],
      ],
      body: [
        [
          summary.totalHours,
          summary.totalDays,
          summary.avgPerPerson,
          summary.totalPeople,
        ],
      ],
    });
    y = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("DETAIL LEMBUR KARYAWAN", 14, y);

    const detailRows = processedData.map((d, i) => [
      i + 1,
      d.name,
      d.division,
      d.position,
      d.totalDays,
      d.totalHours,
      d.avgHours,
    ]);

    autoTable(doc, {
      startY: y + 2,
      head: [
        [
          "No",
          "Nama Karyawan",
          "Unit",
          "Jabatan",
          "Hari",
          "Total Jam",
          "Rata-rata/Hari",
        ],
      ],
      body: detailRows,
    });

    y = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("DISTRIBUSI LEMBUR PER DIVISI", 14, y);
    const distRows = distributionData.map((d, i) => [
      i + 1,
      d.label,
      d.value,
      d.width,
    ]);

    autoTable(doc, {
      startY: y + 2,
      head: [["No", "Unit", "Total Jam", "Persentase"]],
      body: distRows,
    });
    y = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("TREN LEMBUR MINGGUAN", 14, y);

    const trendHeader = weeklyTrend.map((w) => w.label);
    const trendValue = weeklyTrend.map((w) => `${w.hours} jam`);

    autoTable(doc, {
      startY: y + 2,
      head: [trendHeader],
      body: [trendValue],
    });
    doc.save(`Laporan_Lembur_${monthName}.pdf`);

    const fileName = `Laporan_Lembur_${monthName}.pdf`;
    const pdfBlob = doc.output("blob");
    const formData = new FormData();
    formData.append("file", pdfBlob, fileName);
    formData.append("reportName", `Laporan Lembur ${monthName}`);
    formData.append("period", selectedPeriod);
    formData.append("status", "Selesai");
    formData.append("reportType", "PDF");
    try {
      //   await axios.post("http://localhost:3000/history", formData, {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //       "Content-Type": "multipart/form-data",
      //     },
      //   });

      await axiosInstance.post("/history", formData);
    } catch (e) {
      console.error("Gagal menyimpan riwayat laporan lembur", e);
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
      ["RUMAH SAKIT BHAYANGKARA TK.III INDRAMAYU"],
      [`LAPORAN LEMBUR ${monthName.toUpperCase()}`],
      [`Tanggal Cetak: ${today}`],
      [],

      ["RINGKASAN LEMBUR"],
      ["Total Jam", "Total Hari", "Rata-rata/Karyawan", "Total Karyawan"],
      [
        summary.totalHours,
        summary.totalDays,
        summary.avgPerPerson,
        summary.totalPeople,
      ],
      [],

      ["DETAIL LEMBUR KARYAWAN"],
      ["No", "Nama", "Unit", "Jabatan", "Hari", "Total Jam", "Rata-rata/Hari"],
      ...processedData.map((d, i) => [
        i + 1,
        d.name,
        d.division,
        d.position || "-",
        d.totalDays,
        d.totalHours,
        d.avgHours,
      ]),
      [],

      ["DISTRIBUSI PER DIVISI"],
      ["No", "Unit", "Total Jam", "Persentase"],
      ...distributionData.map((d, i) => [i + 1, d.label, d.value, d.width]),
      [],

      ["TREN LEMBUR MINGGUAN"],
      ["Minggu", "Jam", "Biaya"],
      ...weeklyTrend.map((w) => [w.label, w.hours, w.cost]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
    ];

    ws["A1"].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: "center", vertical: "center" },
    };

    ws["A2"].s = {
      font: { bold: true, sz: 13 },
      alignment: { horizontal: "center" },
    };

    ws["A3"].s = {
      font: { italic: true },
      alignment: { horizontal: "center" },
    };

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cell]) continue;

        ws[cell].s = {
          ...(ws[cell].s || {}),
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
          alignment: {
            vertical: "center",
            horizontal: C === 0 ? "left" : "center",
          },
        };
      }
    }

    const sectionHeaders = [
      "RINGKASAN LEMBUR",
      "DETAIL LEMBUR KARYAWAN",
      "DISTRIBUSI PER DIVISI",
      "TREN LEMBUR MINGGUAN",
    ];

    sheetData.forEach((row, idx) => {
      if (sectionHeaders.includes(row[0])) {
        const cell = XLSX.utils.encode_cell({ r: idx, c: 0 });

        ws[cell].s = {
          font: { bold: true },
        };
      }
    });

    sheetData.forEach((row, idx) => {
      if (
        row[0] === "No" ||
        row[0] === "Minggu" ||
        row.includes("Nama") ||
        row.includes("Unit")
      ) {
        for (let C = 0; C <= 6; C++) {
          const cell = XLSX.utils.encode_cell({ r: idx, c: C });
          if (!ws[cell]) continue;

          ws[cell].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "D9E1F2" } },
            alignment: { horizontal: "center" },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            },
          };
        }
      }
    });

    ws["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 10 },
      { wch: 15 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Lembur");
    XLSX.writeFile(wb, `Laporan_Lembur_${monthName}.xlsx`);

    const fileName = `Laporan_Lembur_${monthName}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const excelBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const formData = new FormData();
    formData.append("file", excelBlob, fileName);
    formData.append("reportName", `Laporan Lembur ${monthName}`);
    formData.append("period", selectedPeriod);
    formData.append("status", "Selesai");
    formData.append("reportType", "XLSX");
    try {
      //   await axios.post("http://localhost:3000/history", formData, {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //       "Content-Type": "multipart/form-data",
      //     },
      //   });

      await axiosInstance.post("/history", formData);
    } catch (e) {
      console.error("Gagal menyimpan riwayat laporan lembur", e);
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
                <span className="stat-label-dash">Total Jam Lembur</span>
                <span className="stat-value-dash">
                  {summary.totalHours}{" "}
                  <span className="stat-text-dash">jam</span>
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={0} /> dari bulan lalu
                </div>
              </div>
              <div className="stat-icon-dash purple-light-dash">
                <FaClock />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Hari Lembur</span>
                <span className="stat-value-dash">
                  {summary.totalDays}{" "}
                  <span className="stat-text-dash">hari</span>
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={0} /> dari bulan lalu
                </div>
              </div>
              <div className="stat-icon-dash green-light-dash">
                <FaCalendarAlt />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Rata-rata per Karyawan</span>
                <span className="stat-value-dash">
                  {summary.avgPerPerson}{" "}
                  <span className="stat-text-dash">jam</span>
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={0} /> dari bulan lalu
                </div>
              </div>
              <div className="stat-icon-dash blue-light-dash">
                <FaUser />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Karyawan Lembur</span>
                <span className="stat-value-dash">
                  {summary.totalPeople}{" "}
                  <span className="stat-text-dash">orang</span>
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={0} /> dari bulan lalu
                </div>
              </div>
              <div className="stat-icon-dash orange-light-dash">
                <FaUsers />
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
                style={{ width: "230px", height: "24px", marginBottom: "20px" }}
              ></div>{" "}
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
              <h3>Detail Lembur Karyawan</h3>
              <div className="panel-actions-right">
                <select
                  className="select-input"
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                >
                  {uniqueDivisions.map((div) => (
                    <option key={div} value={div}>
                      {div}
                    </option>
                  ))}
                </select>
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
                        Nama <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Unit <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Hari Lembur <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th></th>
                    <th>
                      <div className="header-content">
                        Total Jam Lembur <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Rata-rata/Hari <FaSort className="sort-icon" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      <div className="qr-loading-box">
                        <div className="qr-spinner"></div>
                        <p className="qr-loading">Memuat data lembur...</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="">
              <table className="content-table">
                <thead>
                  <tr>
                    <th
                      className={`sortable-header ${sort.key === "nama" ? "active-sort" : ""}`}
                      onClick={() => requestSort("nama")}
                    >
                      <div>
                        Nama{" "}
                        <FaSort
                          className={`sort-icon ${sort.key === "nama" ? "active" : ""}`}
                        />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "unit" ? "active-sort" : ""}`}
                      onClick={() => requestSort("unit")}
                    >
                      <div>
                        Unit{" "}
                        <FaSort
                          className={`sort-icon ${sort.key === "unit" ? "active" : ""}`}
                        />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "hari" ? "active-sort" : ""}`}
                      onClick={() => requestSort("hari")}
                    >
                      <div>
                        Hari Lembur{" "}
                        <FaSort
                          className={`sort-icon ${sort.key === "hari" ? "active" : ""}`}
                        />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "jam" ? "active-sort" : ""}`}
                      onClick={() => requestSort("jam")}
                    >
                      <div>
                        Total Jam Lembur{" "}
                        <FaSort
                          className={`sort-icon ${sort.key === "jam" ? "active" : ""}`}
                        />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "avg" ? "active-sort" : ""}`}
                      onClick={() => requestSort("avg")}
                    >
                      <div>
                        Rata-rata/Hari{" "}
                        <FaSort
                          className={`sort-icon ${sort.key === "nama" ? "active" : ""}`}
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((d, index) => {
                      return (
                        <tr key={index}>
                          <td className="perf-name-cell">
                            <img
                              className="staff-avatar"
                              //   src={
                              //     d.photo
                              //       ? `http://localhost:3000/uploads/profilePhotos/${d.photo}`
                              //       : Avatar
                              //   }
                              src={getProfilePhotoUrl(d.photo)}
                              alt={d.name}
                            />
                            <div className="user-info">
                              <span className="user-name">{d.name}</span>
                              <span className="user-division">
                                {d.position ?? "-"}
                              </span>
                            </div>
                          </td>
                          {/* <td>
                            <div className="user-cell">
                              <img
                                className="user-avatar"
                                src={
                                  d.photo
                                    ? `http://localhost:3000/uploads/profilePhotos/${d.photo}`
                                    : Avatar
                                }
                                alt={d.name}
                              />
                              <div className="user-info">
                                <span className="user-name">{d.name}</span>
                                <span className="user-division">
                                  {d.position ?? "-"}
                                </span>
                              </div>
                            </div>
                          </td> */}
                          <td>{d.division}</td>
                          <td>{d.totalDays} Hari</td>
                          <td>
                            <strong>{d.totalHours} jam</strong>
                          </td>
                          <td>{d.avgHours} jam/hari</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center" }}>
                        <div className="no-data">
                          <h4 className="empty-title">Belum ada data lembur</h4>
                          <p className="empty-desc">
                            Data lembur akan muncul di sini
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="table-footer-row">
                    <td colSpan="2">
                      <strong>Total</strong>
                    </td>
                    <td>{summary.totalDays} hari</td>
                    <td>
                      <strong>{summary.totalHours} jam</strong>
                    </td>
                    <td>{summary.avgPerDay} jam/hari</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
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
        </div>
      </div>

      <div className="content-two-grid">
        <div className="content-card" style={{ marginBottom: "0px" }}>
          {loading ? (
            <div
              className="skeleton-text"
              style={{ width: "250px", height: "24px", marginBottom: "20px" }}
            ></div>
          ) : (
            <h3>Distribusi Lembur per Divisi</h3>
          )}
          {loading ? (
            <div className="loading-distribution-container">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="dist-row loading-skeleton-animation">
                  <div className="dist-info" style={{ marginBottom: "8px" }}>
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
          ) : distributionData.length > 0 ? (
            distributionData.map((item, i) => {
              return (
                <div key={i} className="dist-row">
                  <div className="dist-info">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="progress-bg">
                    <div
                      className={`progress-bar fill ${item.color}`}
                      style={{
                        width: item.width,
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
              style={{ width: "200px", height: "24px", marginBottom: "20px" }}
            ></div>
          ) : (
            <h3>Tren Lembur Mingguan</h3>
          )}
          {loading ? (
            <div className="loading-trend-container">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="trend-item loading-skeleton-animation">
                  <div className="trend-info" style={{ marginBottom: "8px" }}>
                    <div
                      className="skeleton-text"
                      style={{ width: "30%", height: "14px" }}
                    ></div>
                    <div
                      className="trend-val"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                      }}
                    >
                      <div
                        className="skeleton-text"
                        style={{
                          width: "50px",
                          height: "12px",
                          marginBottom: "4px",
                        }}
                      ></div>
                      <div
                        className="skeleton-text"
                        style={{ width: "70px", height: "10px" }}
                      ></div>
                    </div>
                  </div>
                  <div
                    className="skeleton-progress"
                    style={{ height: "10px", borderRadius: "10px" }}
                  ></div>
                </div>
              ))}
            </div>
          ) : (
            weeklyTrend.map((w) => (
              <div key={w} className="trend-row">
                <div className="trend-info">
                  <span>{w.label}</span>
                  <div className="trend-val">
                    <strong>{w.hours} jam</strong>
                  </div>
                </div>
                <div className="progress-bg">
                  <div
                    className="progress-bar fill purple"
                    style={{
                      width: w.width,
                      transition: "width 0.8s ease-in-out",
                    }}
                  ></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="ot-card analysis-section">
        {loading ? (
          <>
            <div
              className="skeleton-text"
              style={{ width: "200px", height: "24px", marginBottom: "20px" }}
            ></div>
            <div className="alert-item warning">
              <div
                className="skeleton-circle"
                style={{ width: "20px", height: "20px", marginTop: "5px" }}
              />
              <div style={{ flex: 1 }}>
                <div
                  className="skeleton-text"
                  style={{
                    width: "180px",
                    height: "16px",
                    marginBottom: "10px",
                  }}
                />
                <div
                  className="skeleton-text"
                  style={{ width: "60%", height: "12px", marginBottom: "8px" }}
                />
              </div>
            </div>
            <div className="alert-item info">
              <div
                className="skeleton-circle"
                style={{ width: "20px", height: "20px", marginTop: "5px" }}
              />
              <div style={{ flex: 1 }}>
                <div
                  className="skeleton-text"
                  style={{
                    width: "160px",
                    height: "16px",
                    marginBottom: "10px",
                  }}
                />
                <div
                  className="skeleton-text"
                  style={{ width: "82%", height: "12px", marginBottom: "8px" }}
                />
              </div>
            </div>
          </>
        ) : analysis ? (
          <>
            <h3>Analisis & Rekomendasi</h3>
            {analysis.hasOverworkIssue || analysis.costWarning ? (
              <div className="alert-item warning">
                <FaExclamationTriangle className="alert-icon" />
                <div>
                  <strong>
                    Perhatian: Beban Tinggi di {analysis.topDivName}
                  </strong>
                  <p>
                    Unit <b>{analysis.topDivName}</b> mencatat total lembur
                    tertinggi sebesar <b>{analysis.topDivHours} jam</b> bulan
                    ini. Terdapat <b>{analysis.overworkedCount} karyawan</b>{" "}
                    yang telah melampaui batas 40 jam kerja lembur
                    {analysis.costWarning &&
                      " Diperlukan peninjauan anggaran karena total biaya melonjak."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="alert-item info">
                <FaCheckCircle className="alert-icon" />
                <div>
                  <strong>Kondisi Unit Terkendali</strong>
                  <p>
                    Meskipun unit <b>{analysis.topDivName}</b> menjadi yang
                    tertinggi dengan <b>{analysis.topDivHours} jam</b>, secara
                    individu tidak ada karyawan yang melewati batas kritis
                    lembur (Standard: {analysis.threshold} jam)
                  </p>
                </div>
              </div>
            )}
            <div className="alert-item info">
              <FaInfoCircle className="alert-icon" />
              <div>
                <strong>Informasi Distribusi</strong>
                <p>
                  Rata-rata lembur tiap individu adalah{" "}
                  <b>{analysis.avgHours} jam</b>. Beban kerja saat ini paling
                  terkonsentrasi di unit <b>{analysis.topDivName}</b>.
                  Pertimbangkan distribusi tenaga kerja tambahan untuk unit
                  tersebut jika tren ini berlanjut
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="empty-desc">
            Data tidak mencukupi untuk melakukan analisis
          </p>
        )}
      </div>
    </div>
  );
};

export default OvertimeReport;
