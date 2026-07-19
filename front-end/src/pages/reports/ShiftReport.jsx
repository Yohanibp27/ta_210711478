import React, { useEffect, useState, useCallback } from "react";
// import axios from "axios";
import { Link } from "react-router-dom";
import { FaCloud, FaFileExcel, FaFilePdf, FaMoon, FaSun } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import XLSX from "xlsx-js-style";
import axiosInstance from "../../api/axios.js";

const statusClassMap = {
  Sempurna: "sempurna",
  "Sangat Baik": "sangatBaik",
  Baik: "baik",
  Peringatan: "peringatan",
  Kritis: "kritis",
  "Tidak Ada Data": "tidakAdaData",
};

const ShiftReport = () => {
  //   const token = localStorage.getItem("token");
  const [shiftData, setShiftData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("Harian");
  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
  });

  const extractDate = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.split("T")[0].split(" ")[0];
  };

  const extractTime = (dateTimeStr) => {
    if (!dateTimeStr) return "00:00";
    if (dateTimeStr.includes("T")) {
      const d = new Date(dateTimeStr);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    const timePart = dateTimeStr.split(" ")[1];
    if (timePart) {
      const parts = timePart.split(":");
      return `${parts[0]}:${parts[1]}`;
    }
    return "00:00";
  };

  const calculateMinutesDiff = (start, actual) => {
    if (!start || !actual) return 0;
    const [h1, m1] = start.split(":").map(Number);
    const [h2, m2] = actual.split(":").map(Number);
    let totalStart = h1 * 60 + m1;
    let totalActual = h2 * 60 + m2;
    if (totalActual < totalStart && totalStart > 1200) {
      totalActual += 1440;
    }
    const diff = totalActual - totalStart;
    return diff > 0 ? diff : 0;
  };

  const fetchShiftAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      //   const [resShifts, resAttendances] = await Promise.all([
      //     axios.get("http://localhost:3000/shifts", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/attendances", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //   ]);

      let attendanceParams = {};

      if (filterType === "Harian") {
        attendanceParams = {
          date: selectedPeriod,
        };
      } else if (filterType === "Mingguan") {
        attendanceParams = {
          period: "Mingguan",
          month: selectedWeek,
        };
      } else if (filterType === "Bulanan") {
        attendanceParams = {
          period: "Bulanan",
          month: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`,
        };
      }

      const [resShifts, resAttendances] = await Promise.all([
        axiosInstance.get("/shifts"),
        axiosInstance.get("/attendances", { params: attendanceParams }),
      ]);
      const allAssignments = resShifts.data.data || [];
      console.log("shifts", allAssignments);

      const allAttendances = resAttendances.data.data || [];
      console.log("attendaces", allAttendances);

      const filteredAssignments = allAssignments.filter((asg) => {
        const dStr = extractDate(asg.date);
        const d = new Date(dStr);
        if (filterType === "Harian") return dStr === selectedPeriod;
        if (filterType === "Mingguan")
          return dStr >= startDate && dStr <= endDate;
        if (filterType === "Bulanan")
          return (
            d.getMonth() + 1 === parseInt(selectedMonth) &&
            d.getFullYear() === parseInt(selectedYear)
          );
        if (filterType === "Tahunan")
          return d.getFullYear() === parseInt(selectedYear);
        return true;
      });

      const grouped = {
        1: {
          name: "Pagi",
          startTime: "07:00",
          endTime: "15:00",
          employees: 0,
          present: 0,
          late: 0,
          lateCount: 0,
        },
        2: {
          name: "Siang",
          startTime: "15:00",
          endTime: "23:00",
          employees: 0,
          present: 0,
          late: 0,
          lateCount: 0,
        },
        3: {
          name: "Malam",
          startTime: "23:00",
          endTime: "07:00",
          employees: 0,
          present: 0,
          late: 0,
          lateCount: 0,
        },
      };

      filteredAssignments.forEach((asg) => {
        const wsId = asg.workShiftId;
        if (grouped[wsId]) grouped[wsId].employees += 1;
      });

      const filteredAttendances = allAttendances.filter((att) => {
        const dStr = extractDate(att.date);
        const d = new Date(dStr);
        if (filterType === "Harian") return dStr === selectedPeriod;
        if (filterType === "Mingguan")
          return dStr >= startDate && dStr <= endDate;
        if (filterType === "Bulanan")
          return (
            d.getMonth() + 1 === parseInt(selectedMonth) &&
            d.getFullYear() === parseInt(selectedYear)
          );
        if (filterType === "Tahunan")
          return d.getFullYear() === parseInt(selectedYear);
        return true;
      });

      filteredAttendances.forEach((att) => {
        const attDateStr = extractDate(att.date);
        const currentUserId = att.userId || att.user?.id;
        console.log("currentUserId", currentUserId);

        // const userAsg = filteredAssignments.find(
        //   (asg) =>
        //     Number(asg.userId) === Number(currentUserId) &&
        //     extractDate(asg.date) === attDateStr,
        // );
        if (!currentUserId || !attDateStr) return;
        const userAsg = filteredAssignments.find((asg) => {
          const assignmentUserId = asg.userId ?? asg.user?.id ?? asg.User?.id;

          const assignmentDate = extractDate(
            asg.date ?? asg.shiftDate ?? asg.assignmentDate,
          );

          return (
            Number(assignmentUserId) === Number(currentUserId) &&
            assignmentDate === attDateStr
          );
        });
        console.log("userAsg", userAsg);
        if (!userAsg) {
          console.warn("Shift assignment tidak ditemukan:", {
            currentUserId,
            attDateStr,
          });
          return;
        }

        // let wsId = att.workShiftId;
        const wsId = Number(
          att.workShiftId ?? userAsg.workShiftId ?? userAsg.workShift?.id,
        );
        // console.log(wsId);

        if (wsId && grouped[wsId]) {
          const status = att.attendanceStatus?.toLowerCase();
          const isPresent = ["hadir", "terlambat"].includes(status);

          if (isPresent) {
            grouped[wsId].present += 1;

            if (!userAsg) {
              grouped[wsId].employees += 1;
            }

            if (status === "terlambat" && att.checkInTime) {
              grouped[wsId].lateCount += 1;
              const actualTimeStr = extractTime(att.checkInTime);
              let diff = calculateMinutesDiff(
                grouped[wsId].startTime,
                actualTimeStr,
              );
              if (diff > 15) {
                diff = diff - 15;
              } else {
                diff = 0;
              }
              grouped[wsId].late += diff;
            }
          }
        }
      });

      const finalData = Object.values(grouped).map((item) => {
        const employees = item.employees || 0;
        const present = item.present || 0;
        const rateNumber = employees > 0 ? (present / employees) * 100 : 0;
        const cappedRate = rateNumber > 100 ? 100 : rateNumber;
        const avgLValue =
          item.lateCount > 0 ? (item.late / item.lateCount).toFixed(1) : 0;

        //   Status    | Syarat Kehadiran  | Syarat Keterlambatan(Rata - rata) | Arti
        //   Perfect   | >= 95 %           | 0 Menit                           | Semua masuk dan tepat waktu
        //   Excellent | >= 90 %           | < 15 Menit                        | Kehadiran tinggi, telat masih dalam toleransi
        //   Good      | >= 80 %           | =< 30 Menit                       | Kehadiran oke, tapi perlu dipantau
        //   Warning   | < 80 % ATAU       | > 30 Menit                        | Kehadiran rendah atau telatnya sudah parah
        //   Critical  | < 50%             | -                                 | Setengah staf tidak hadir

        let status = "Tidak Ada Data";
        if (employees === 0) {
          status = "Tidak Ada Data";
        } else if (present === 0) {
          status = "Kritis";
        } else if (rateNumber === 0) {
          status = "Tidak Ada Data";
        } else if (rateNumber >= 95 && avgLValue === 0) {
          status = "Sempurna";
        } else if (rateNumber >= 90 && avgLValue < 15) {
          status = "Sangat Baik";
        } else if (rateNumber >= 80 && avgLValue < 30) {
          status = "Baik";
        } else if (avgLValue >= 30 || rateNumber < 80) {
          status = "Peringatan";
        }
        if (rateNumber < 50 && rateNumber > 0) {
          status = "Kritis";
        }
        if (employees > 0 && rateNumber > 0 && rateNumber < 50) {
          status = "Kritis";
        }
        return {
          ...item,
          attendance: cappedRate.toFixed(1),
          lateAvg: avgLValue,
          status: status,
          icon:
            item.name === "Pagi" ? (
              <FaSun className="orange" />
            ) : item.name === "Siang" ? (
              <FaCloud className="grey" />
            ) : (
              <FaMoon className="orange" />
            ),
          color:
            item.name === "Pagi"
              ? "blue"
              : item.name === "Siang"
                ? "green"
                : "purple",
          time: `${item.startTime} - ${item.endTime}`,
        };
      });

      setShiftData(finalData);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [
    filterType,
    selectedPeriod,
    startDate,
    endDate,
    selectedMonth,
    selectedYear,
  ]);

  useEffect(() => {
    fetchShiftAnalytics();
  }, [fetchShiftAnalytics]);

  useEffect(() => {
    if (filterType === "Mingguan" && selectedWeek) {
      const [year, week] = selectedWeek.split("-W");
      const simple = new Date(year, 0, 1 + (week - 1) * 7);
      const dayOfWeek = simple.getDay();
      const ISOweekStart = simple;
      if (dayOfWeek <= 4) {
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
      } else {
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
      }
      const start = new Date(ISOweekStart);
      const end = new Date(ISOweekStart);
      end.setDate(start.getDate() + 6);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    }
  }, [selectedWeek, filterType]);

  const summary = {
    totalShift: shiftData.length,
    totalEmployees: shiftData.reduce((acc, s) => acc + s.employees, 0),
    avgAttendance:
      shiftData.length > 0
        ? (
            shiftData.reduce((acc, s) => acc + parseFloat(s.attendance), 0) /
            shiftData.length
          ).toFixed(1)
        : 0,
    avgLate:
      shiftData.length > 0
        ? (
            shiftData.reduce((acc, s) => acc + parseFloat(s.lateAvg), 0) /
            shiftData.length
          ).toFixed(1)
        : 0,
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();
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
    doc.text(
      `LAPORAN ANALITIK SHIFT KARYAWAN ${monthName.toUpperCase()}`,
      105,
      y,
      {
        align: "center",
      },
    );

    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Tanggal Cetak: ${today}`, 14, y);

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN SHIFT", 14, y);

    autoTable(doc, {
      startY: y + 2,
      head: [
        [
          "Total Shift",
          "Total Karyawan",
          "Rata-rata Kehadiran",
          "Rata-rata Terlambat",
        ],
      ],
      body: [
        [
          summary.totalShift,
          summary.totalEmployees,
          `${summary.avgAttendance}%`,
          `${summary.avgLate} menit`,
        ],
      ],
    });

    y = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("DETAIL ANALITIK SHIFT", 14, y);

    const rows = shiftData.map((s, i) => [
      i + 1,
      s.name,
      s.time,
      s.employees,
      `${s.attendance}%`,
      `${s.lateAvg} menit`,
      s.status,
    ]);

    autoTable(doc, {
      startY: y + 2,
      head: [
        [
          "No",
          "Shift",
          "Jam",
          "Jumlah Karyawan",
          "Kehadiran",
          "Terlambat",
          "Status",
        ],
      ],
      body: rows,
    });
    doc.save("Laporan_Shift.pdf");

    const fileName = `Laporan_Shift_${monthName}.pdf`;
    const pdfBlob = doc.output("blob");
    const formData = new FormData();
    formData.append("file", pdfBlob, fileName);
    formData.append("reportName", `Laporan Shift ${monthName}`);
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
      console.error("Gagal menyimpan riwayat laporan shift", e);
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
      [`LAPORAN ANALITIK SHIFT KARYAWAN ${monthName.toUpperCase()}`],
      [`Tanggal Cetak: ${today}`],
      [],

      ["RINGKASAN SHIFT"],
      [
        "Total Shift",
        "Total Karyawan",
        "Rata-rata Kehadiran",
        "Rata-rata Terlambat",
      ],
      [
        summary.totalShift,
        summary.totalEmployees,
        `${summary.avgAttendance}%`,
        `${summary.avgLate} menit`,
      ],
      [],

      ["DETAIL ANALITIK SHIFT"],
      [
        "No",
        "Shift",
        "Jam",
        "Jumlah Karyawan",
        "Kehadiran",
        "Terlambat",
        "Status",
      ],
      ...shiftData.map((s, i) => [
        i + 1,
        s.name,
        s.time,
        s.employees,
        `${s.attendance}%`,
        `${s.lateAvg} menit`,
        s.status,
      ]),
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

    const sectionHeaders = ["RINGKASAN SHIFT", "DETAIL ANALITIK SHIFT"];

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
        row.includes("Shift") ||
        row.includes("Total Shift")
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
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Analitik Shift");
    XLSX.writeFile(wb, "Laporan_Shift.xlsx");

    const fileName = `Laporan_Shift_${monthName}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const excelBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const formData = new FormData();
    formData.append("file", excelBlob, fileName);
    formData.append("reportName", `Laporan Shift ${monthName}`);
    formData.append("period", selectedPeriod);
    formData.append("status", "Selesai");
    formData.append("reportType", "XLSX");
    try {
      //   await axios.post("http://localhost:3000/history", formData, {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });

      await axiosInstance.post("/history", formData);
    } catch (e) {
      console.error("Gagal menyimpan riwayat laporan shift", e);
    }
  };

  return (
    <div className="content-page">
      {loading ? (
        <>
          <div className="page-header-container">
            <div className="header-left"></div>
            <div className="panel-actions-right">
              <div
                className="skeleton-box"
                style={{
                  width: "100px",
                  height: "40px",
                  borderRadius: "8px",
                  marginTop: "5px",
                }}
              ></div>
              {filterType === "Harian" && (
                <div
                  className="skeleton-box"
                  style={{
                    width: "150px",
                    height: "40px",
                    borderRadius: "8px",
                    marginTop: "5px",
                  }}
                ></div>
              )}
              {filterType === "Mingguan" && (
                <div
                  className="skeleton-box"
                  style={{
                    width: "150px",
                    height: "40px",
                    borderRadius: "8px",
                    marginTop: "5px",
                  }}
                ></div>
              )}
              {filterType === "Bulanan" && (
                <>
                  {filterType === "Bulanan" && (
                    <div
                      className="skeleton-box"
                      style={{
                        width: "100px",
                        height: "40px",
                        borderRadius: "8px",
                        marginTop: "5px",
                      }}
                    ></div>
                  )}
                  <div
                    className="skeleton-box"
                    style={{
                      width: "100px",
                      height: "40px",
                      borderRadius: "8px",
                      marginTop: "5px",
                    }}
                  ></div>
                </>
              )}
              {filterType === "Tahunan" && (
                <div
                  className="skeleton-box"
                  style={{
                    width: "100px",
                    height: "40px",
                    borderRadius: "8px",
                    marginTop: "5px",
                  }}
                ></div>
              )}
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
          </div>
        </>
      ) : (
        <>
          <div className="page-header-container">
            <div className="header-left"></div>
            <div className="panel-actions-right">
              <select
                className="select-input"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option>Tipe</option>
                <option>Harian</option>
                <option>Mingguan</option>
                <option>Bulanan</option>
                <option>Tahunan</option>
              </select>
              {filterType === "Harian" && (
                <input
                  type="date"
                  className="select-input"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                />
              )}
              {filterType === "Mingguan" && (
                <>
                  <input
                    type="week"
                    className="select-input"
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    style={{ margin: 0 }}
                  />
                </>
              )}
              {filterType === "Bulanan" && (
                <>
                  {filterType === "Bulanan" && (
                    <select
                      className="select-input"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      {[
                        "Januari",
                        "Februari",
                        "Maret",
                        "April",
                        "Mei",
                        "Juni",
                        "Juli",
                        "Agustus",
                        "September",
                        "Oktober",
                        "November",
                        "Desember",
                      ].map((m, i) => (
                        <option key={i} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  )}
                  <select
                    className="select-input"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {[2024, 2025, 2026].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  {/* <input
                type="month"
                className="select-input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              /> */}
                </>
              )}
              {filterType === "Tahunan" && (
                <select
                  className="select-input"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {[2024, 2025, 2026].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              )}
              <button className="button is-danger" onClick={handleExportPDF}>
                <FaFilePdf /> PDF
              </button>
              <button className="button is-success" onClick={handleExportExcel}>
                <FaFileExcel /> Excel
              </button>
            </div>
          </div>
        </>
      )}

      <div className="cards-grid">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="card loading-skeleton-animation">
              <div className="card-header">
                <div className="skeleton-icon"></div>
                <div className="skeleton-badge"></div>
              </div>
              <div className="card-body">
                <div className="skeleton-line title"></div>
                <div className="skeleton-line sub-title"></div>
                <div className="stat-row">
                  <div className="skeleton-line text"></div>
                  <div className="skeleton-line text-end"></div>
                </div>
                <div className="skeleton-progress"></div>
                <div className="skeleton-stat">
                  <div className="skeleton-line text"></div>
                  <div className="skeleton-line text-end"></div>
                </div>
                <div className="skeleton-progress"></div>
              </div>
            </div>
          ))
        ) : shiftData.length > 0 ? (
          shiftData.map((shift, index) => (
            <div key={index} className="card">
              <div className="card-header">
                <span className={`icon-box ${shift.color}`}>{shift.icon}</span>
                <span
                  className={`status-badge ${statusClassMap[shift.status]}`}
                >
                  {shift.status}
                </span>
              </div>
              <div className="card-body">
                <h3>
                  {shift.name} <span className="time-text">({shift.time})</span>
                </h3>
                <p className="sub-text">
                  <strong>{shift.employees}</strong> karyawan terjadwal
                </p>
                <div className="stat-row">
                  <span>Tingkat Kehadiran</span>
                  <span className="bold">{shift.attendance}%</span>
                </div>
                <div className="progress-bg">
                  <div
                    className="progress-fill purple"
                    style={{ width: `${shift.attendance}%` }}
                  ></div>
                </div>
                <div className="stat-row">
                  <span>Rata-rata Terlambat</span>
                  <span className="bold">{shift.lateAvg} mnt</span>
                </div>
                <div className="progress-bg">
                  <div
                    className="progress-fill red"
                    style={{ width: `${(shift.lateAvg / 30) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-desc">Tidak ada jadwal shift hari ini</p>
        )}
      </div>

      <div className="content-two-grid">
        <div className="content-card" style={{ marginBottom: "0px" }}>
          {loading ? (
            <div
              className="skeleton-text"
              style={{ width: "320px", height: "20px" }}
            />
          ) : (
            <h3>Perbandingan Kehadiran Antar Shift</h3>
          )}
          <div className="bar-chart-mock">
            {loading
              ? [...Array(3)].map((_, i) => (
                  <div key={i} className="bar-group">
                    <div className="bar-container">
                      <div className="bar skeleton-bar"></div>
                    </div>
                    <div className="bar-info">
                      <div className="skeleton-text short"></div>
                      <div className="skeleton-text"></div>
                    </div>
                  </div>
                ))
              : shiftData.map((s, i) => (
                  <div key={i} className="bar-group">
                    <span className="bar-value-dash">{s.attendance}%</span>
                    <div
                      className={`bar ${s.color}`}
                      style={{ height: `${s.attendance}%` }}
                    ></div>
                    <span className="bar-label">
                      {s.name.split(" ")[1] || s.name}
                    </span>
                  </div>
                ))}
          </div>
        </div>
        <div className="content-card" style={{ marginBottom: "0px" }}>
          {loading ? (
            <div
              className="skeleton-text"
              style={{ width: "250px", height: "20px" }}
            />
          ) : (
            <h3>Pola Keterlambatan Per Shift</h3>
          )}
          <div className="bar-chart-mock">
            {loading
              ? [...Array(3)].map((_, i) => (
                  <div key={i} className="bar-group">
                    <div className="bar-container">
                      <div className="bar skeleton-bar"></div>
                    </div>
                    <div className="bar-info">
                      <div className="skeleton-text short"></div>
                      <div className="skeleton-text"></div>
                    </div>
                  </div>
                ))
              : shiftData.map((s, i) => (
                  <div key={i} className="bar-group">
                    <span className="bar-value-dash">{s.lateAvg} min</span>
                    <div
                      className="bar red"
                      style={{
                        height: `${Math.min((s.lateAvg / 30) * 100, 100)}%`,
                      }}
                    ></div>
                    <span className="bar-label">
                      {s.name.split(" ")[1] || s.name}
                    </span>
                  </div>
                ))}
          </div>
        </div>
      </div>

      <div className="table-content-card">
        {loading ? (
          <div
            className="skeleton-text"
            style={{ width: "180px", height: "20px" }}
          />
        ) : (
          <h3>Detail Analitik Shift</h3>
        )}
        <div className="table-content-wrapper">
          {loading ? (
            <table className="shift-table">
              <thead>
                <tr>
                  <th>Sesi</th>
                  <th>Jam Kerja</th>
                  <th>Jumlah Karyawan</th>
                  <th>Tingkat Kehadiran</th>
                  <th>Rata-rata Terlambat</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    <div className="qr-loading-box">
                      <div className="qr-spinner"></div>
                      <p className="qr-loading">Memuat data shift...</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="shift-table">
              <thead>
                <tr>
                  <th>Sesi</th>
                  <th>Jam Kerja</th>
                  <th>Jumlah Karyawan</th>
                  <th>Tingkat Kehadiran</th>
                  <th>Rata-rata Terlambat</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shiftData.map((shift, index) => (
                  <tr key={index}>
                    <td className="flex-cell">
                      <span className={`small-icon ${shift.color}`}>
                        {shift.icon}
                      </span>{" "}
                      {shift.name}
                    </td>
                    <td>{shift.time}</td>
                    <td>{shift.employees}</td>
                    <td>
                      <div className="table-progress">
                        <div className="progress-container">
                          <div
                            className="progress-fill purple"
                            style={{
                              width: `${shift.attendance}%`,
                              height: "100%",
                            }}
                          ></div>
                        </div>
                        <span>{shift.attendance}%</span>
                      </div>
                    </td>
                    <td>{shift.lateAvg} menit</td>
                    <td>
                      <span
                        className={`status-badge ${statusClassMap[shift.status]}`}
                      >
                        {shift.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftReport;
