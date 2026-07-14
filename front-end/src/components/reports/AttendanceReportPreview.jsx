import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
// import "../../style/AttendanceReportPreview.css";
import { formatTime } from "../../utils/dateHelper.js";
import XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// import { saveAs } from "file-saver";
import axiosInstance from "../../api/axios.js";

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

const getDaysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};
const getDayName = (day, month, year) => {
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  return days[new Date(year, month - 1, day).getDay()];
};

const getRangeFromWeek = (weekString) => {
  if (!weekString) return { start: null, end: null };
  const [year, week] = weekString.split("-W");
  // Mulai dari tanggal 1 Januari tahun tersebut
  const firstDayOfYear = new Date(year, 0, 1);
  const days = (parseInt(week) - 1) * 7;

  // Cari hari Senin pertama di tahun tersebut
  const dayOffset =
    firstDayOfYear.getDay() <= 4
      ? firstDayOfYear.getDay() - 1
      : firstDayOfYear.getDay() + 6;
  const startOfWeek = new Date(year, 0, 1 + days - dayOffset);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return { start: startOfWeek, end: endOfWeek };
};

const AttendanceReportPreview = () => {
  const [attendances, setAttendances] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [reportType, setReportType] = useState("bulanan");

  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDept, setSelectedDept] = useState("SEMUA");
  const [selectedDiv, setSelectedDiv] = useState("SEMUA");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, [reportType, selectedPeriod, selectedWeek, selectedYear]);

  const fetchOrganizationData = async () => {
    try {
      const [resDepts, resDivs] = await Promise.all([
        axiosInstance.get("/departments"),
        axiosInstance.get("/divisions"),
      ]);

      setDepartments(
        Array.isArray(resDepts.data?.data) ? resDepts.data.data : [],
      );

      setDivisions(Array.isArray(resDivs.data?.data) ? resDivs.data.data : []);
    } catch (error) {
      console.error(
        "Gagal memuat data organisasi:",
        error.response?.data || error.message,
      );
    }
  };

  //   const fetchInitData = async () => {
  //     setLoading(true);
  //     try {
  //       const [resAttend, resDepts, resDivs] = await Promise.all([
  //         axiosInstance.get("/attendances"),
  //         axiosInstance.get("/departments"),
  //         axiosInstance.get("/divisions"),
  //       ]);
  //       setAttendances(resAttend.data.data || []);
  //       setDepartments(resDepts.data.data || []);
  //       setDivisions(resDivs.data.data || []);
  //     } catch (err) {
  //       console.error("Gagal memuat data:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  const fetchAttendanceData = async () => {
    setLoading(true);

    try {
      let attendanceData = [];

      if (reportType === "bulanan") {
        const response = await axiosInstance.get("/attendances", {
          params: {
            period: "Bulanan",
            month: selectedPeriod,
          },
        });

        attendanceData = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
      } else if (reportType === "mingguan") {
        if (!selectedWeek) {
          setAttendances([]);
          return;
        }

        const response = await axiosInstance.get("/attendances", {
          params: {
            period: "Mingguan",
            month: selectedWeek,
          },
        });

        attendanceData = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
      } else if (reportType === "tahunan") {
        /*
         * Backend belum memiliki period Tahunan.
         * Ambil satu per satu setiap bulan agar tidak mengirim
         * 12 request sekaligus ke Railway.
         */
        for (let month = 1; month <= 12; month++) {
          const monthValue = `${selectedYear}-${String(month).padStart(2, "0")}`;

          const response = await axiosInstance.get("/attendances", {
            params: {
              period: "Bulanan",
              month: monthValue,
            },
          });

          const monthData = Array.isArray(response.data?.data)
            ? response.data.data
            : [];

          attendanceData.push(...monthData);
        }
      }

      setAttendances(attendanceData);
    } catch (error) {
      console.error(
        "Gagal memuat data presensi:",
        error.response?.data || error.message,
      );

      setAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedDeptId = departments.find(
    (dept) => dept.name === selectedDept,
  )?.id;

  const availableDivisions = useMemo(() => {
    if (selectedDept === "SEMUA") return divisions;
    return divisions.filter(
      (div) => Number(div.departmentId) === Number(selectedDeptId),
    );
  }, [selectedDept, selectedDeptId, divisions]);

  const resolveStatus = (att) => {
    const status = att.attendanceStatus?.toLowerCase();
    // 1. Cek Tidak Valid (Ada masuk, tidak ada pulang)
    if (att.checkInTime && !att.checkOutTime) return "TIDAK VALID";
    // 2. Cek Dinas Luar (Berdasarkan status dari DB)
    if (status === "dinas luar") return "DINAS LUAR";
    // 3. Cek Terlambat / Hadir
    if (status === "terlambat") return "TERLAMBAT";
    if (status === "hadir") return "HADIR";
    // 4. Cek Izin / Cuti
    if (status === "izin") return "IZIN";
    if (status === "cuti") return "CUTI";
    return "ALFA"; // Default jika tidak ada data
  };

  const reportData = useMemo(() => {
    const employeeMap = {};
    const weekRange = getRangeFromWeek(selectedWeek);
    // Filter data berdasarkan Departemen & Divisi terlebih dahulu
    const filteredRaw = attendances.filter((att) => {
      const matchDept =
        selectedDept === "SEMUA" ||
        att.user?.position?.division?.department?.name === selectedDept;
      const matchDiv =
        selectedDiv === "SEMUA" ||
        att.user?.position?.division?.name === selectedDiv;

      // Filter Waktu berdasarkan reportType
      //   const attDate = new Date(att.date);
      const rawDate = String(att.date || "").slice(0, 10);
      const attDate = new Date(`${rawDate}T00:00:00`);
      let matchTime = true;

      if (reportType === "bulanan") {
        const [year, month] = selectedPeriod.split("-");
        matchTime =
          attDate.getFullYear() === parseInt(year) &&
          attDate.getMonth() + 1 === parseInt(month);
      } else if (reportType === "tahunan") {
        matchTime = attDate.getFullYear() === parseInt(selectedYear);
      } else if (reportType === "mingguan" && weekRange.start) {
        // Filter berdasarkan range tanggal Senin - Minggu
        matchTime = attDate >= weekRange.start && attDate <= weekRange.end;
      }
      // Tambahkan logika mingguan jika diperlukan menggunakan lib moment/date-fns

      return matchDept && matchDiv && matchTime;
    });

    filteredRaw.forEach((att) => {
      const userId = att.user?.id;
      if (!userId) return;

      if (!employeeMap[userId]) {
        employeeMap[userId] = {
          name: [
            att.user?.titlePrefix,
            att.user?.fullName,
            att.user?.titleSuffix,
          ]
            .filter(Boolean)
            .join(" "),
          nip: att.user?.nip,
          records: {},
        };
      }

      const day = new Date(att.date).getDate();
      const month = new Date(att.date).getMonth() + 1;
      const dateObj = new Date(att.date);

      if (reportType === "bulanan") {
        employeeMap[userId].records[day] = {
          in: att.checkInTime,
          out: att.checkOutTime,
          status: resolveStatus(att),
        };
      } else if (reportType === "mingguan") {
        const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();
        employeeMap[userId].records[dayOfWeek] = {
          in: att.checkInTime,
          out: att.checkOutTime,
          status: resolveStatus(att),
        };
      } else {
        if (!employeeMap[userId].records[month]) {
          employeeMap[userId].records[month] = {
            H: 0,
            T: 0,
            DL: 0,
            C: 0,
            I: 0,
            TH: 0,
            TV: 0,
          };
        }
        const s = resolveStatus(att);
        if (s === "HADIR") employeeMap[userId].records[month].H++;
        else if (s === "TERLAMBAT") employeeMap[userId].records[month].T++;
        else if (s === "DINAS LUAR") employeeMap[userId].records[month].DL++;
        else if (s === "CUTI") employeeMap[userId].records[month].C++;
        else if (s === "IZIN") employeeMap[userId].records[month].I++;
        else if (s === "TIDAK VALID") employeeMap[userId].records[month].TV++;
        else employeeMap[userId].records[month].TH++;
      }
    });

    return Object.values(employeeMap);
  }, [
    attendances,
    reportType,
    selectedPeriod,
    selectedYear,
    selectedWeek,
    selectedDept,
    selectedDiv,
  ]);

  const daysInSelectedMonth = useMemo(() => {
    if (reportType !== "bulanan") return 7; // default untuk mingguan
    const [year, month] = selectedPeriod.split("-");
    return getDaysInMonth(parseInt(month), parseInt(year));
  }, [selectedPeriod, reportType]);

  const renderHeader = () => {
    const days = reportType === "bulanan" ? daysInSelectedMonth : 7;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agt",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];

    if (reportType === "mingguan") {
      const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
      const dates = ["1", "2", "3", "4", "5", "6", "7"];
      return (
        <thead>
          <tr>
            <th rowSpan="3">No</th>
            <th rowSpan="3">Nama Karyawan</th>
            {weekDays.map((day, i) => (
              <th
                key={i}
                colSpan="2"
                className="text-center"
                style={{ backgroundColor: "#d9ead3" }}
              >
                {day}
              </th>
            ))}
            <th rowSpan="3" style={{ backgroundColor: "#fff2cc" }}>
              Total Kehadiran
            </th>
          </tr>
          <tr>
            {dates.map((date, i) => (
              <th key={i} colSpan="2" className="text-center">
                {date}
              </th>
            ))}
          </tr>
          <tr>
            {weekDays.map((_, i) => (
              <React.Fragment key={i}>
                <th
                  className="text-center"
                  style={{ fontSize: "10px", backgroundColor: "#d9ead3" }}
                >
                  In
                </th>
                <th
                  className="text-center"
                  style={{ fontSize: "10px", backgroundColor: "#f4b6b6" }}
                >
                  Out
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
      );
    } else if (reportType === "bulanan") {
      const [year, month] = selectedPeriod.split("-");
      const monthNames = [
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
      ];
      const displayMonthYear = `${monthNames[parseInt(month) - 1]} - ${year}`;
      return (
        <thead>
          <tr>
            <th rowSpan="3">No</th>
            <th rowSpan="3" style={{ minWidth: "200px" }}>
              Nama Karyawan
            </th>
            <th colSpan={days}>{displayMonthYear}</th>
          </tr>
          <tr>
            {Array.from({ length: days }, (_, i) => (
              <th key={`day-${i}`} className="small-header">
                {getDayName(i + 1, parseInt(month), parseInt(year))}
              </th>
            ))}
          </tr>
          <tr>
            {Array.from({ length: days }, (_, i) => (
              <th key={i} className="small-header">
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
      );
    } else {
      const workingDays = [25, 24, 26, 25, 25, 24, 26, 25, 25, 24, 26, 25];
      return (
        <>
          {/* <thead>
          <tr>
            <th rowSpan="4">No</th>
            <th rowSpan="4" style={{ minWidth: "200px" }}>
              Nama Karyawan
            </th>
            <th colSpan="90" className="text-center">
              {selectedYear}
            </th>
          </tr>
          <tr>
            <th
              className="text-left"
              style={{ padding: "5px 10px", fontSize: "8px" }}
            >
              H: Hadir, T: Telat, DL: Dinas Luar, I: Izin, C: Cuti, TH: Tidak
              Hadir, TV: Tidak Valid
            </th>
            {months.map((m) => (
              <th key={m} colSpan="7">
                {m}
              </th>
            ))}
          </tr>
          <tr>
            {workingDays.map((days, i) => (
              <th key={i} colSpan="7" className="text-center">
                {days}
              </th>
            ))}
          </tr>
          <tr>
            {months.map((_, i) => (
              <React.Fragment key={i}>
                <th className="status-col h">H</th>
                <th className="status-col t">T</th>
                <th className="status-col dl">DL</th>
                <th className="status-col i">I</th>
                <th className="status-col c">C</th>
                <th className="status-col th">TH</th>
                <th className="status-col tv">TV</th>
              </React.Fragment>
            ))}
          </tr>
           <tr>
            {Array.from({ length: 12 }).map((_, i) => (
              <React.Fragment key={i}>
                <th className="status-col h">H</th>
                <th className="status-col t">T</th>
                <th className="status-col dl">DL</th>
                <th className="status-col i">I</th>
                <th className="status-col c">C</th>
                <th className="status-col th">TH</th>
                <th className="status-col tv">TV</th>
              </React.Fragment>
            ))}
          </tr> 
        </thead>*/}
          <thead>
            <tr>
              <th colSpan={3 + 12 * 7} className="text-center">
                {selectedYear}
              </th>
            </tr>
            <tr>
              <th rowSpan="4">No</th>
              <th className="text-left" style={{ fontSize: "8px" }}>
                H: Hadir, T: Telat, DL: Dinas Luar, I: Izin, C: Cuti, TH: Tidak
                Hadir, TV: Tidak Valid
              </th>
              {months.map((m) => (
                <th key={m} colSpan="7">
                  {m}
                </th>
              ))}
            </tr>
            <tr>
              <th className="text-left">Total Hari Kerja</th>
              {workingDays.map((days, i) => (
                <th key={i} colSpan="7" className="text-center">
                  {days}
                </th>
              ))}
            </tr>
            <tr>
              <th className="text-left" style={{ minWidth: "200px" }}>
                Nama Karyawan
              </th>
              {months.map((_, i) => (
                <React.Fragment key={i}>
                  <th className="status-col h">H</th>
                  <th className="status-col t">T</th>
                  <th className="status-col dl">DL</th>
                  <th className="status-col i">I</th>
                  <th className="status-col c">C</th>
                  <th className="status-col th">TH</th>
                  <th className="status-col tv">TV</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
        </>
      );
    }
  };

  const monthNamesLong = [
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
  ];

  const monthNamesShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agt",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  const formatDateID = (date) => {
    if (!date || Number.isNaN(new Date(date).getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  };

  const getExportContext = () => {
    let periodLabel = "";
    let filePeriod = "";

    if (reportType === "bulanan") {
      const [year, month] = selectedPeriod.split("-");

      periodLabel = `${monthNamesLong[Number(month) - 1]} ${year}`;
      filePeriod = selectedPeriod;
    } else if (reportType === "mingguan") {
      const weekRange = getRangeFromWeek(selectedWeek);

      periodLabel =
        weekRange.start && weekRange.end
          ? `${formatDateID(weekRange.start)} sampai ${formatDateID(
              weekRange.end,
            )}`
          : selectedWeek || "Minggu belum dipilih";

      filePeriod = selectedWeek || "mingguan";
    } else {
      periodLabel = `Tahun ${selectedYear}`;
      filePeriod = String(selectedYear);
    }

    const departmentLabel =
      selectedDept === "SEMUA" ? "Semua Fungsi" : selectedDept;

    const divisionLabel = selectedDiv === "SEMUA" ? "Semua Unit" : selectedDiv;

    const safePeriodLabel =
      `${reportType}_${filePeriod}_${departmentLabel}_${divisionLabel}`
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .replace(/_+/g, "_");

    return {
      periodLabel,
      filePeriod,
      departmentLabel,
      divisionLabel,
      safePeriodLabel,
    };
  };

  const getExportTableData = () => {
    if (reportType === "mingguan") {
      const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

      const columns = [
        "No.",
        "Nama Karyawan",
        "NIP",
        ...weekDays.flatMap((day) => [`${day} Masuk`, `${day} Pulang`]),
        "Total Kehadiran",
      ];

      const body = reportData.map((employee, index) => {
        const timeColumns = [];

        for (let day = 1; day <= 7; day += 1) {
          const record = employee.records[day];

          timeColumns.push(record ? formatTime(record.in) : "-");
          timeColumns.push(record ? formatTime(record.out) : "-");
        }

        const totalAttendance = Object.values(employee.records).filter(
          (record) =>
            record.status === "HADIR" ||
            record.status === "TERLAMBAT" ||
            record.status === "DINAS LUAR",
        ).length;

        return [
          index + 1,
          employee.name,
          employee.nip || "-",
          ...timeColumns,
          totalAttendance,
        ];
      });

      return { columns, body };
    }

    if (reportType === "bulanan") {
      const [year, month] = selectedPeriod.split("-").map(Number);

      const dayColumns = Array.from(
        { length: daysInSelectedMonth },
        (_, index) => {
          const day = index + 1;
          return `${day}\n${getDayName(day, month, year)}`;
        },
      );

      const columns = ["No.", "Nama Karyawan", "NIP", ...dayColumns];

      const body = reportData.map((employee, index) => {
        const attendanceColumns = Array.from(
          { length: daysInSelectedMonth },
          (_, dayIndex) => {
            const record = employee.records[dayIndex + 1];

            if (!record) {
              return "-";
            }

            return `${formatTime(record.in)}\n${formatTime(record.out)}`;
          },
        );

        return [
          index + 1,
          employee.name,
          employee.nip || "-",
          ...attendanceColumns,
        ];
      });

      return { columns, body };
    }

    // Laporan tahunan dibuat vertikal per karyawan dan bulan
    // agar tetap terbaca ketika diekspor ke PDF.
    const columns = [
      "No.",
      "Nama Karyawan",
      "NIP",
      "Bulan",
      "H",
      "T",
      "DL",
      "I",
      "C",
      "TH",
      "TV",
    ];

    let rowNumber = 1;

    const body = reportData.flatMap((employee) =>
      monthNamesShort.map((monthName, monthIndex) => {
        const record = employee.records[monthIndex + 1] || {
          H: 0,
          T: 0,
          DL: 0,
          I: 0,
          C: 0,
          TH: 0,
          TV: 0,
        };

        return [
          rowNumber++,
          employee.name,
          employee.nip || "-",
          monthName,
          record.H || 0,
          record.T || 0,
          record.DL || 0,
          record.I || 0,
          record.C || 0,
          record.TH || 0,
          record.TV || 0,
        ];
      }),
    );

    return { columns, body };
  };

  const handleExportPDF = async () => {
    if (reportData.length === 0) {
      alert("Tidak ada data yang dapat diekspor.");
      return;
    }

    try {
      const {
        periodLabel,
        filePeriod,
        departmentLabel,
        divisionLabel,
        safePeriodLabel,
      } = getExportContext();

      const { columns, body } = getExportTableData();

      /*
       * Bulanan memakai A3 karena jumlah kolom tanggal bisa
       * mencapai 31 kolom.
       */
      const pageFormat = reportType === "bulanan" ? "a3" : "a4";

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: pageFormat,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const printedAt = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const fileName = `Laporan_Presensi_${safePeriodLabel}.pdf`;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);

      doc.text("RUMAH SAKIT BHAYANGKARA TK. III INDRAMAYU", pageWidth / 2, 12, {
        align: "center",
      });

      doc.setFontSize(11);

      doc.text(
        `LAPORAN DATA PRESENSI ${reportType.toUpperCase()}`,
        pageWidth / 2,
        19,
        {
          align: "center",
        },
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      doc.text(`Periode: ${periodLabel}`, 14, 27);
      doc.text(`Fungsi: ${departmentLabel}`, 14, 32);
      doc.text(`Unit: ${divisionLabel}`, 14, 37);
      doc.text(`Tanggal Cetak: ${printedAt}`, 14, 42);

      autoTable(doc, {
        startY: 47,
        theme: "grid",
        showHead: "everyPage",
        head: [columns],
        body: body.length > 0 ? body : [["-", "Tidak ada data", "-"]],

        styles: {
          fontSize:
            reportType === "bulanan" ? 5 : reportType === "mingguan" ? 6.5 : 7,
          cellPadding: reportType === "bulanan" ? 1 : 1.5,
          valign: "middle",
          halign: "center",
          overflow: "linebreak",
        },

        headStyles: {
          fillColor: [71, 85, 105],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },

        columnStyles: {
          0: {
            cellWidth: 8,
            halign: "center",
          },
          1: {
            cellWidth: reportType === "bulanan" ? 40 : 42,
            halign: "left",
          },
          2: {
            cellWidth: reportType === "bulanan" ? 25 : 28,
            halign: "left",
          },
        },

        margin: {
          left: 10,
          right: 10,
          top: 15,
          bottom: 12,
        },

        didDrawPage: () => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);

          doc.text(`Laporan Presensi ${reportType} – ${periodLabel}`, 10, 8);
        },
      });

      const pageCount = doc.internal.getNumberOfPages();

      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        doc.text(
          `Halaman ${page} dari ${pageCount}`,
          pageWidth - 12,
          pageHeight - 6,
          {
            align: "right",
          },
        );
      }

      const pdfBlob = doc.output("blob");

      doc.save(fileName);

      const formData = new FormData();

      formData.append("file", pdfBlob, fileName);
      formData.append(
        "reportName",
        `Laporan Presensi ${reportType} ${periodLabel}`,
      );
      formData.append("period", filePeriod);
      formData.append("status", "Selesai");
      formData.append("reportType", "PDF");

      await axiosInstance.post("/history", formData);
    } catch (error) {
      console.error(
        "Gagal mengekspor laporan presensi ke PDF:",
        error.response?.data || error.message,
      );

      alert("Laporan PDF gagal dibuat. Silakan coba kembali.");
    }
  };

  const handleExportExcel = async () => {
    if (reportData.length === 0) {
      alert("Tidak ada data yang dapat diekspor.");
      return;
    }

    try {
      const {
        periodLabel,
        filePeriod,
        departmentLabel,
        divisionLabel,
        safePeriodLabel,
      } = getExportContext();

      const { columns, body } = getExportTableData();

      const printedAt = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const fileName = `Laporan_Presensi_${safePeriodLabel}.xlsx`;

      const worksheetData = [
        ["RUMAH SAKIT BHAYANGKARA TK. III INDRAMAYU"],
        [`LAPORAN DATA PRESENSI ${reportType.toUpperCase()}`],
        [`Periode: ${periodLabel}`],
        [`Fungsi: ${departmentLabel}`],
        [`Unit: ${divisionLabel}`],
        [`Tanggal Cetak: ${printedAt}`],
        [],
        columns,
        ...body,
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      const lastColumnIndex = Math.max(columns.length - 1, 0);

      worksheet["!merges"] = [
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: lastColumnIndex },
        },
        {
          s: { r: 1, c: 0 },
          e: { r: 1, c: lastColumnIndex },
        },
        {
          s: { r: 2, c: 0 },
          e: { r: 2, c: lastColumnIndex },
        },
        {
          s: { r: 3, c: 0 },
          e: { r: 3, c: lastColumnIndex },
        },
        {
          s: { r: 4, c: 0 },
          e: { r: 4, c: lastColumnIndex },
        },
        {
          s: { r: 5, c: 0 },
          e: { r: 5, c: lastColumnIndex },
        },
      ];

      const range = XLSX.utils.decode_range(worksheet["!ref"]);

      const headerRowIndex = 7;

      for (let row = range.s.r; row <= range.e.r; row += 1) {
        for (let column = range.s.c; column <= range.e.c; column += 1) {
          const address = XLSX.utils.encode_cell({
            r: row,
            c: column,
          });

          const cell = worksheet[address];

          if (!cell) continue;

          if (row <= 5) {
            cell.s = {
              font: {
                bold: true,
                sz: row === 0 ? 14 : 11,
              },
              alignment: {
                horizontal: "center",
                vertical: "center",
              },
            };

            continue;
          }

          if (row === headerRowIndex) {
            cell.s = {
              font: {
                bold: true,
                color: {
                  rgb: "FFFFFF",
                },
              },
              fill: {
                fgColor: {
                  rgb: "475569",
                },
              },
              alignment: {
                horizontal: "center",
                vertical: "center",
                wrapText: true,
              },
              border: {
                top: {
                  style: "thin",
                  color: { rgb: "000000" },
                },
                bottom: {
                  style: "thin",
                  color: { rgb: "000000" },
                },
                left: {
                  style: "thin",
                  color: { rgb: "000000" },
                },
                right: {
                  style: "thin",
                  color: { rgb: "000000" },
                },
              },
            };

            continue;
          }

          if (row > headerRowIndex) {
            cell.s = {
              alignment: {
                horizontal: column === 1 || column === 2 ? "left" : "center",
                vertical: "center",
                wrapText: true,
              },
              border: {
                top: {
                  style: "thin",
                  color: { rgb: "B7B7B7" },
                },
                bottom: {
                  style: "thin",
                  color: { rgb: "B7B7B7" },
                },
                left: {
                  style: "thin",
                  color: { rgb: "B7B7B7" },
                },
                right: {
                  style: "thin",
                  color: { rgb: "B7B7B7" },
                },
              },
            };
          }
        }
      }

      worksheet["!cols"] = columns.map((_, index) => {
        if (index === 0) return { wch: 7 };
        if (index === 1) return { wch: 35 };
        if (index === 2) return { wch: 22 };

        if (reportType === "bulanan") {
          return { wch: 12 };
        }

        if (reportType === "mingguan") {
          return { wch: 14 };
        }

        return { wch: 12 };
      });

      worksheet["!rows"] = worksheetData.map((_, index) => ({
        hpt: index === headerRowIndex ? 32 : index > headerRowIndex ? 28 : 20,
      }));

      worksheet["!autofilter"] = {
        ref: `A${headerRowIndex + 1}:${XLSX.utils.encode_col(
          lastColumnIndex,
        )}${Math.max(worksheetData.length, headerRowIndex + 1)}`,
      };

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Presensi");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const excelBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const downloadUrl = URL.createObjectURL(excelBlob);

      const downloadLink = document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download = fileName;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      URL.revokeObjectURL(downloadUrl);

      const formData = new FormData();

      formData.append("file", excelBlob, fileName);
      formData.append(
        "reportName",
        `Laporan Presensi ${reportType} ${periodLabel}`,
      );
      formData.append("period", filePeriod);
      formData.append("status", "Selesai");
      formData.append("reportType", "XLSX");

      await axiosInstance.post("/history", formData);
    } catch (error) {
      console.error(
        "Gagal mengekspor laporan presensi ke Excel:",
        error.response?.data || error.message,
      );

      alert("Laporan Excel gagal dibuat. Silakan coba kembali.");
    }
  };

  return (
    <div className="content-page">
      <div className="table-content-card">
        <div className="header-actions">
          <div className="page-header-section">
            <h2 style={{ margin: "0" }}>RS BHAYANGKARA INDRAMAYU</h2>
            <h3 style={{ margin: "5px 0", fontWeight: "normal" }}>
              LAPORAN DATA PRESENSI {reportType.toUpperCase()}
            </h3>
            {/* <div className="section-divider" /> */}
          </div>
          <div className="right-actions">
            <button
              className="button is-danger"
              onClick={handleExportPDF}
              disabled={loading || reportData.length === 0}
            >
              <FaFilePdf /> PDF
            </button>
            <button
              className="button is-success"
              onClick={handleExportExcel}
              disabled={loading || reportData.length === 0}
            >
              <FaFileExcel />
              Excel
            </button>
          </div>
        </div>

        <div className="header-actions">
          <div className="filter-group">
            <div className="custom-label-report">
              <label className="label-report">Jenis Laporan</label>
              <select
                value={reportType}
                className="select-input"
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="mingguan">Mingguan</option>
                <option value="bulanan">Bulanan</option>
                <option value="tahunan">Tahunan</option>
              </select>
            </div>
            <div className="custom-label-report">
              <label className="label-report">Fungsi</label>
              <select
                className="select-input"
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedDiv("SEMUA");
                }}
              >
                <option value="SEMUA">Semua Fungsi</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="custom-label-report">
              <label className="label-report">Unit</label>
              <select
                className="select-input"
                value={selectedDiv}
                onChange={(e) => {
                  setSelectedDiv(e.target.value);
                }}
              >
                <option value="SEMUA">Semua Unit</option>
                {availableDivisions.map((div) => (
                  <option key={div.id} value={div.name}>
                    {div.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="custom-label-report">
              <label className="label-report">Periode</label>
              {reportType === "bulanan" && (
                <input
                  type="month"
                  className="select-input"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                />
              )}
              {reportType === "mingguan" && (
                <input
                  type="week"
                  className="select-input"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                />
              )}
              {reportType === "tahunan" && (
                <select
                  value={selectedYear}
                  className="select-input"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {[2024, 2025, 2026].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div style={{ alignSelf: "flex-end", fontSize: "13px" }}>
            Tanggal Cetak: {formatTanggalWaktuLengkap()}
          </div>
        </div>

        <div className="table-content-wrapper scroll-container">
          <table className="custom-report-table">
            {renderHeader()}
            <tbody>
              {reportData.map((emp, idx) => (
                <tr key={idx}>
                  <td className="text-center">{idx + 1}</td>
                  <td className="sticky-col">
                    <div className="emp-info">
                      <span className="emp-name">{emp.name}</span>
                      <span className="emp-nip">{emp.nip}</span>
                    </div>
                  </td>
                  {reportType === "tahunan"
                    ? Array.from({ length: 12 }, (_, i) => {
                        const mData = emp.records[i + 1] || {
                          H: 0,
                          T: 0,
                          DL: 0,
                          I: 0,
                          C: 0,
                          TH: 0,
                          TV: 0,
                        };
                        return (
                          <React.Fragment key={i}>
                            <td className="text-center">{mData.H}</td>
                            <td className="text-center">{mData.T}</td>
                            <td className="text-center">{mData.DL}</td>
                            <td className="text-center">{mData.I}</td>
                            <td className="text-center">{mData.C}</td>
                            <td className="text-center">{mData.TH}</td>
                            <td className="text-center">{mData.TV}</td>
                          </React.Fragment>
                        );
                      })
                    : Array.from(
                        {
                          length:
                            reportType === "bulanan" ? daysInSelectedMonth : 7,
                        },
                        (_, i) => {
                          const dayRec = emp.records[i + 1];
                          if (reportType === "mingguan") {
                            return (
                              <React.Fragment key={i}>
                                <td
                                  className="text-center time-cell"
                                  style={{ color: "green", fontWeight: "bold" }}
                                >
                                  {dayRec ? formatTime(dayRec.in) : "-"}
                                </td>
                                <td
                                  className="text-center time-cell"
                                  style={{ color: "red", fontWeight: "bold" }}
                                >
                                  {dayRec ? formatTime(dayRec.out) : "-"}
                                </td>
                              </React.Fragment>
                            );
                          }
                          return (
                            <td key={i} className="text-center time-cell">
                              {dayRec ? (
                                <div className="time-box">
                                  <span className="time-in">
                                    {formatTime(dayRec.in)}
                                  </span>
                                  <span className="time-out">
                                    {formatTime(dayRec.out)}
                                  </span>
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                          );
                        },
                      )}
                  {reportType === "mingguan" && (
                    <td
                      className="text-center"
                      style={{ fontWeight: "bold", backgroundColor: "#fff2cc" }}
                    >
                      {
                        // Menghitung jumlah record yang memiliki status HADIR, TERLAMBAT, atau DINAS LUAR
                        Object.values(emp.records).filter(
                          (rec) =>
                            rec.status === "HADIR" ||
                            rec.status === "TERLAMBAT" ||
                            rec.status === "DINAS LUAR",
                        ).length
                      }
                    </td>
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

export default AttendanceReportPreview;
