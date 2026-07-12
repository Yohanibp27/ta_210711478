import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// import axios from "axios";
import XLSX from "xlsx-js-style";
import {
  FaBackspace,
  FaBackward,
  FaFileExcel,
  FaFilePdf,
} from "react-icons/fa";
import { Link, Navigate } from "react-router-dom";
import axiosInstance from "../../api/axios.js";

const UserReportPreview = () => {
  const [users, setUsers] = useState([]);
  //   const token = localStorage.getItem("token");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedYear, setSelectedYear] = useState("SEMUA");
  const [selectedDept, setSelectedDept] = useState("SEMUA");
  const [selectedDiv, setSelectedDiv] = useState("SEMUA");
  const [visibleColumns, setVisibleColumns] = useState({
    No: true,
    NIP: true,
    "Nama Lengkap": true,
    Fungsi: true,
    Unit: true,
    Jabatan: true,
    Status: true,
    "Tanggal Bergabung": true,
  });
  const toggleColumn = (colName) => {
    setVisibleColumns((prev) => ({ ...prev, [colName]: !prev[colName] }));
  };

  const formatTanggalWaktuLengkap = () => {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      //   hour: "2-digit",
      //   minute: "2-digit",
      //   second: "2-digit",
      //   hour12: false,
    }).format(new Date());
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      //   const [resUsers, resDepts, resDivs] = await Promise.all([
      //     axios.get("http://localhost:3000/users", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/departments", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/divisions", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //   ]);

      const [resUsers, resDepts, resDivs] = await Promise.all([
        axiosInstance.get("/users"),
        axiosInstance.get("/departments"),
        axiosInstance.get("/divisions"),
      ]);
      setUsers(resUsers.data.data || []);
      setFilteredUsers(resUsers.data.data || []);
      setDepartments(resDepts.data.data || []);
      setDivisions(resDivs.data.data || []);
    } catch (err) {
      console.error("Gagal memuat data:", err);
    }
  };

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    filterData(year, selectedDept, selectedDiv);
  };

  const handleDeptChange = (e) => {
    const deptName = e.target.value;
    setSelectedDept(deptName);
    setSelectedDiv("SEMUA");
    filterData(selectedYear, deptName, "SEMUA");
  };

  const handleDivChange = (e) => {
    const divName = e.target.value;
    setSelectedDiv(divName);
    filterData(selectedYear, selectedDept, divName);
  };

  const filterData = (year, dept, div) => {
    let temp = [...users];
    if (year && year.toString().toUpperCase() !== "SEMUA") {
      const searchYear = year.toString().trim();
      temp = temp.filter((u) => {
        if (!u.joinDate) return false;
        const dateObj = new Date(u.joinDate);
        if (isNaN(dateObj.getTime())) return false;
        const userYear = dateObj.getFullYear().toString();
        return userYear.includes(searchYear);
      });
    }
    if (dept !== "SEMUA") {
      temp = temp.filter(
        (u) => u.position?.division?.department?.name === dept,
      );
    }
    if (div !== "SEMUA") {
      temp = temp.filter((u) => u.position?.division?.name === div);
    }
    setFilteredUsers(temp);
  };

  const selectedDeptId = departments.find((d) => d.name === selectedDept)?.id;
  const availableDivisions =
    selectedDept === "SEMUA"
      ? divisions
      : divisions.filter((d) => d.departmentId === selectedDeptId);

  const exportPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const headers = [
      "No",
      "NIP",
      "Nama Lengkap",
      "Fungsi",
      "Unit",
      "Jabatan",
      "Status",
      "Tanggal Bergabung",
    ].filter((h) => visibleColumns[h]);

    const rows = filteredUsers.map((u, idx) => {
      const rowData = [];
      if (visibleColumns["No"]) rowData.push(idx + 1);
      if (visibleColumns["NIP"]) rowData.push(u.nip || "-");
      if (visibleColumns["Nama Lengkap"])
        rowData.push(
          [u.titlePrefix, u.fullName, u.titleSuffix].filter(Boolean).join(" "),
        );
      if (visibleColumns["Fungsi"])
        rowData.push(u.position?.division?.department?.name || "-");
      if (visibleColumns["Unit"])
        rowData.push(u.position?.division?.name || "-");
      if (visibleColumns["Jabatan"]) rowData.push(u.position?.name || "-");
      if (visibleColumns["Status"]) rowData.push(u.status || "-");
      if (visibleColumns["Tanggal Bergabung"]) rowData.push(u.joinDate || "-");
      return rowData;
    });

    doc.setFontSize(14).text("RS BHAYANGKARA INDRAMAYU", 14, 15);
    doc.setFontSize(12).text("LAPORAN DATA KARYAWAN", 14, 22);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 45,
      theme: "grid",
      styles: { fontSize: 8 },
    });

    doc.save(`Laporan_Karyawan.pdf`);
  };

  // YANG DIPAKE
  //   const exportExcel = () => {
  //     const title = [["RS BHAYANGKARA INDRAMAYU"]];
  //     const reportName = [["LAPORAN DATA KARYAWAN"]];

  //     const info = [
  //       ["Periode", ": " + (selectedYear === "" ? "SEMUA" : selectedYear)],
  //       ["Fungsi", ": " + selectedDept],
  //       ["Unit", ": " + selectedDiv],
  //       ["Tanggal Cetak", ": " + formatTanggalWaktuLengkap()],
  //       [],
  //     ];

  //     const tableHeader = [
  //       [
  //         "No",
  //         "NIP",
  //         "Nama Lengkap",
  //         "Fungsi",
  //         "Unit",
  //         "Jabatan",
  //         "Status",
  //         "Tanggal Bergabung",
  //       ],
  //     ];

  //     const tableData = filteredUsers.map((u, idx) => [
  //       idx + 1,
  //       u.nip || "-",
  //       [u.titlePrefix, u.fullName, u.titleSuffix].filter(Boolean).join(" "),
  //       u.position?.division?.department?.name || "-",
  //       u.position?.division?.name || "-",
  //       u.position?.name || "-",
  //       u.status || "-",
  //       u.joinDate || "-",
  //     ]);

  //     const finalData = [
  //       ...title,
  //       ...reportName,
  //       [],
  //       ...info,
  //       ...tableHeader,
  //       ...tableData,
  //     ];

  //     const worksheet = XLSX.utils.aoa_to_sheet(finalData);

  //     // --- 1. SETTING FONT SIZE 14 BOLD UNTUK TITLE ---
  //     // A1 (Title) dan A2 (Report Name)
  //     const titleCells = ["A1", "A2"];
  //     titleCells.forEach((cell) => {
  //       if (worksheet[cell]) {
  //         worksheet[cell].s = {
  //           font: {
  //             name: "Arial",
  //             sz: 14,
  //             bold: true,
  //           },
  //           alignment: { horizontal: "center" },
  //         };
  //       }
  //     });

  //     // --- 2. SETTING BOLD UNTUK LABEL INFORMASI ---
  //     // Baris info dimulai dari baris ke-4 (indeks Excel A4, A5, A6, A7)
  //     const labelCells = ["A4", "A5", "A6", "A7"];
  //     labelCells.forEach((cell) => {
  //       if (worksheet[cell]) {
  //         worksheet[cell].s = {
  //           font: {
  //             bold: true,
  //           },
  //         };
  //       }
  //     });

  //     // --- 2. PERBAIKAN STYLE INFO (Size 12, Bold Label, Left Align) ---
  //     const infoRows = [3, 4, 5, 6];
  //     infoRows.forEach((R) => {
  //       // Loop untuk kolom A (Label) dan B (Value)
  //       for (let C = 0; C <= 1; C++) {
  //         const address = XLSX.utils.encode_cell({ r: R, c: C });
  //         if (worksheet[address]) {
  //           worksheet[address].s = {
  //             font: {
  //               name: "Arial",
  //               sz: 12,
  //               bold: C === 0, // Hanya kolom A (label) yang bold
  //             },
  //             alignment: { horizontal: "left", vertical: "center" },
  //           };
  //         }
  //       }
  //     });

  //     // --- 3. SETTING BOLD UNTUK HEADER TABEL ---
  //     // Header tabel ada di baris ke-9 (A9 sampai H9)
  //     // const range = XLSX.utils.decode_range(worksheet["!ref"]);
  //     // for (let C = range.s.c; C <= range.e.c; ++C) {
  //     //   const address = XLSX.utils.encode_col(C) + "9";
  //     //   if (!worksheet[address]) continue;
  //     //   worksheet[address].s = {
  //     //     font: { bold: true },
  //     //     fill: { fgColor: { rgb: "EEEEEE" } },
  //     //     border: {
  //     //       top: { style: "thin" },
  //     //       bottom: { style: "thin" },
  //     //       left: { style: "thin" },
  //     //       right: { style: "thin" },
  //     //     },
  //     //   };
  //     // }

  //     const thinBorder = {
  //       top: { style: "thin" },
  //       bottom: { style: "thin" },
  //       left: { style: "thin" },
  //       right: { style: "thin" },
  //     };

  //     const range = XLSX.utils.decode_range(worksheet["!ref"]);
  //     const tableStartRow = 8; // Baris ke-9 di Excel (index 8) adalah awal header

  //     // Kita set filter mulai dari kolom A sampai kolom terakhir (H) pada baris header (index 8)
  //     worksheet["!autofilter"] = {
  //       ref: XLSX.utils.encode_range({
  //         s: { r: tableStartRow, c: 0 }, // Mulai dari A9
  //         e: { r: range.e.r, c: range.e.c }, // Sampai baris terakhir data
  //       }),
  //     };

  //     // for (let R = tableStartRow; R <= range.e.r; ++R) {
  //     //   for (let C = range.s.c; C <= range.e.c; ++C) {
  //     //     const address = XLSX.utils.encode_cell({ r: R, c: C });
  //     //     if (!worksheet[address]) {
  //     //       // Jika sel kosong tapi masuk dalam range tabel, buat sel kosong agar border muncul
  //     //       worksheet[address] = { t: "s", v: "" };
  //     //     }

  //     //     // Berikan Border ke semua sel di area tabel
  //     //     worksheet[address].s = {
  //     //       border: thinBorder,
  //     //       font: { sz: 12 },
  //     //       alignment: { vertical: "center", indent: 1 },
  //     //     };

  //     //     // Khusus untuk Header (Baris ke-9 / index 8)
  //     //     if (R === tableStartRow) {
  //     //       worksheet[address].s = {
  //     //         ...worksheet[address].s,
  //     //         font: { bold: true, sz: 12 },
  //     //         fill: { fgColor: { rgb: "EEEEEE" } },
  //     //         alignment: { horizontal: "center", vertical: "center" },
  //     //       };
  //     //     }
  //     //   }
  //     // }

  //     for (let R = tableStartRow; R <= range.e.r; ++R) {
  //       for (let C = range.s.c; C <= range.e.c; ++C) {
  //         const address = XLSX.utils.encode_cell({ r: R, c: C });
  //         if (!worksheet[address]) worksheet[address] = { t: "s", v: "" };

  //         // 1. STYLE DASAR UNTUK SEMUA SEL TABEL
  //         let cellStyle = {
  //           border: thinBorder,
  //           font: { sz: 12 },
  //           alignment: { vertical: "center", horizontal: "left", indent: 1 }, // Default rata kiri
  //         };

  //         // 2. KHUSUS HEADER TABEL (Baris ke-9 / index 8)
  //         if (R === tableStartRow) {
  //           cellStyle.font = { bold: true, sz: 12 };
  //           cellStyle.fill = { fgColor: { rgb: "EEEEEE" } };
  //           cellStyle.alignment = { horizontal: "center", vertical: "center" };
  //         }

  //         worksheet[address].s = cellStyle;
  //       }
  //     }

  //     // --- PERBAIKAN TITLE (Wajib ditaruh SETELAH loop tabel agar tidak tertimpa) ---
  //     const titleRows = [0, 1]; // Baris 1 dan 2
  //     titleRows.forEach((R) => {
  //       for (let C = 0; C <= 7; C++) {
  //         const address = XLSX.utils.encode_cell({ r: R, c: C });
  //         if (!worksheet[address]) worksheet[address] = { t: "s", v: "" };

  //         worksheet[address].s = {
  //           font: { name: "Arial", sz: 14, bold: true },
  //           alignment: { horizontal: "center", vertical: "center" }, // Paksa Center
  //         };
  //       }
  //     });

  //     // Merging Title
  //     worksheet["!merges"] = [
  //       { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
  //       { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Merge Info Value (Kolom B sampai H agar teks panjang tidak terpotong)
  //       { s: { r: 3, c: 1 }, e: { r: 3, c: 7 } }, // Periode
  //       { s: { r: 4, c: 1 }, e: { r: 4, c: 7 } }, // Fungsi
  //       { s: { r: 5, c: 1 }, e: { r: 5, c: 7 } }, // Unit
  //       { s: { r: 6, c: 1 }, e: { r: 6, c: 7 } }, // Tanggal Cetak
  //     ];

  //     // Kolom Width
  //     worksheet["!cols"] = [
  //       { wch: 6 },
  //       { wch: 22 },
  //       { wch: 35 },
  //       { wch: 25 },
  //       { wch: 25 },
  //       { wch: 25 },
  //       { wch: 12 },
  //       { wch: 18 },
  //     ];

  //     const workbook = XLSX.utils.book_new();
  //     XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
  //     const fileName = `Laporan_Karyawan_${selectedYear}_${selectedDept.replace(/ /g, "_")}.xlsx`;
  //     XLSX.writeFile(workbook, fileName);
  //   };
  const exportExcel = () => {
    const title = [["RS BHAYANGKARA INDRAMAYU"]];
    const reportName = [["LAPORAN DATA KARYAWAN"]];
    const info = [
      ["Periode", ": " + selectedYear],
      ["Fungsi", ": " + selectedDept],
      ["Unit", ": " + selectedDiv],
      ["Tanggal Cetak", ": " + formatTanggalWaktuLengkap()],
      [],
    ];

    const activeHeaders = [
      "No",
      "NIP",
      "Nama Lengkap",
      "Fungsi",
      "Unit",
      "Jabatan",
      "Status",
      "Tanggal Bergabung",
    ].filter((h) => visibleColumns[h]);

    const activeData = filteredUsers.map((u, idx) => {
      const row = [];
      if (visibleColumns["No"]) row.push(idx + 1);
      if (visibleColumns["NIP"]) row.push(u.nip || "-");
      if (visibleColumns["Nama Lengkap"])
        row.push(
          [u.titlePrefix, u.fullName, u.titleSuffix].filter(Boolean).join(" "),
        );
      if (visibleColumns["Fungsi"])
        row.push(u.position?.division?.department?.name || "-");
      if (visibleColumns["Unit"]) row.push(u.position?.division?.name || "-");
      if (visibleColumns["Jabatan"]) row.push(u.position?.name || "-");
      if (visibleColumns["Status"]) row.push(u.status || "-");
      if (visibleColumns["Tanggal Bergabung"]) row.push(u.joinDate || "-");
      return row;
    });

    const finalData = [
      ...title,
      ...reportName,
      [],
      ...info,
      activeHeaders,
      ...activeData,
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(finalData);

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    const tableStartRow = 8;

    worksheet["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: tableStartRow, c: 0 },
        e: { r: range.e.r, c: activeHeaders.length - 1 },
      }),
    };

    for (let R = tableStartRow; R <= range.e.r; ++R) {
      for (let C = 0; C < activeHeaders.length; ++C) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[address]) worksheet[address] = { t: "s", v: "" };

        worksheet[address].s = {
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
          font: { sz: 11 },
          alignment: { vertical: "center", indent: 1 },
        };

        if (R === tableStartRow) {
          worksheet[address].s.font.bold = true;
          worksheet[address].s.fill = { fgColor: { rgb: "EEEEEE" } };
          worksheet[address].s.alignment.horizontal = "center";
        }
      }
    }

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: activeHeaders.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: activeHeaders.length - 1 } },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, "Laporan_Karyawan.xlsx");
  };

  return (
    <div className="content-page">
      <div className="table-content-card">
        <div className="header-actions">
          <div className="page-header-section">
            <h2 style={{ margin: "0" }}>RS BHAYANGKARA INDRAMAYU</h2>
            <h3 style={{ margin: "5px 0", fontWeight: "normal" }}>
              LAPORAN DATA KARYAWAN
            </h3>
          </div>
          <div className="right-actions">
            <button className="button is-danger" onClick={exportPDF}>
              <FaFilePdf /> PDF
            </button>
            <button className="button is-success" onClick={exportExcel}>
              <FaFileExcel /> Excel
            </button>
          </div>
        </div>

        <div className="header-actions">
          <div className="filter-group">
            <div className="custom-label-report">
              <div>
                <label className="label-report">
                  Periode:{" "}
                  <span style={{ fontSize: "8px", color: "#666" }}>
                    *Ketik tahun atau biarkan "SEMUA"
                  </span>
                </label>
                <input
                  className="select-input"
                  type="text"
                  value={selectedYear}
                  onChange={handleYearChange}
                  onFocus={(e) =>
                    e.target.value === "SEMUA" && setSelectedYear("")
                  }
                  onBlur={(e) =>
                    e.target.value === "" && setSelectedYear("SEMUA")
                  }
                  placeholder="Contoh: 2024 atau SEMUA"
                />
              </div>
            </div>
            <div className="custom-label-report">
              <label className="label-report">Fungsi:</label>
              <select
                className="select-input"
                value={selectedDept}
                onChange={handleDeptChange}
              >
                <option value="SEMUA">Semua Fungsi</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="custom-label-report">
              <label className="label-report">Unit:</label>
              <select
                className="select-input"
                value={selectedDiv}
                onChange={handleDivChange}
              >
                <option value="SEMUA">Semua Unit</option>
                {availableDivisions.map((div) => (
                  <option key={div.id} value={div.name}>
                    {div.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ alignSelf: "flex-end", fontSize: "13px" }}>
            Tanggal Cetak: {formatTanggalWaktuLengkap()}
          </div>
        </div>

        <div className="table-content-wrapper scroll-container">
          <table className="custom-report-table">
            <thead>
              <tr>
                {[
                  "No",
                  "NIP",
                  "Nama Lengkap",
                  "Fungsi",
                  "Unit",
                  "Jabatan",
                  "Status",
                  "Tanggal Bergabung",
                ].map((h) => (
                  <th key={h}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span>{h}</span>
                      <input
                        type="checkbox"
                        checked={visibleColumns[h]}
                        onChange={() => toggleColumn(h)}
                        title="Centang untuk menyertakan kolom ini di laporan"
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => (
                <tr key={u.id}>
                  {visibleColumns["No"] && <td>{idx + 1}</td>}
                  {visibleColumns["NIP"] && <td>{u.nip}</td>}
                  {visibleColumns["Nama Lengkap"] && (
                    <td>
                      {[u.titlePrefix, u.fullName, u.titleSuffix]
                        .filter(Boolean)
                        .join(" ")}
                    </td>
                  )}
                  {visibleColumns["Fungsi"] && (
                    <td>{u.position?.division?.department?.name || "-"}</td>
                  )}
                  {visibleColumns["Unit"] && (
                    <td>{u.position?.division?.name || "-"}</td>
                  )}
                  {visibleColumns["Jabatan"] && (
                    <td>{u.position?.name || "-"}</td>
                  )}
                  {visibleColumns["Status"] && <td>{u.status}</td>}
                  {visibleColumns["Tanggal Bergabung"] && (
                    <td>{u.joinDate || "-"}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserReportPreview;
