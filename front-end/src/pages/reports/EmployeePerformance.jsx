import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
// import axios from "axios";
import {
  FaAngleLeft,
  FaAngleRight,
  FaBan,
  FaCheck,
  FaCrown,
  FaExclamationTriangle,
  FaEye,
  FaFileExcel,
  FaFilePdf,
  FaInfoCircle,
  FaLightbulb,
  FaSearch,
  FaSort,
  FaStar,
  FaThumbsUp,
  FaTrophy,
} from "react-icons/fa";
import XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Avatar from "../../assets/avatar-ungu.png";
import axiosInstance from "../../api/axios.js";

const EmployeePerformance = () => {
  const token = localStorage.getItem("token");
  const [employees, setEmployees] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [divisionStats, setDivisionStats] = useState([]);
  const [dayStats, setDayStats] = useState([]);
  const [topLateEmployees, setTopLateEmployees] = useState([]);
  const [stats, setStats] = useState({
    sangatBaik: 0,
    baik: 0,
    cukup: 0,
    perluPerhatian: 0,
  });
  const [globalStats, setGlobalStats] = useState({
    avgAttendance: 0,
    percTepatWaktu: 0,
    percTelat: 0,
    percAlfa: 0,
  });
  const [trends, setTrends] = useState([]);
  const [distribution, setDistribution] = useState([
    { label: "1-5 menit", count: 0, percentage: 0, color: "#10b981" },
    { label: "6-10 menit", count: 0, percentage: 0, color: "#3b82f6" },
    { label: "11-15 menit", count: 0, percentage: 0, color: "#f59e0b" },
    { label: "16-30 menit", count: 0, percentage: 0, color: "#f97316" },
    { label: "+ 30 menit", count: 0, percentage: 0, color: "#ef4444" },
  ]);
  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().substring(0, 7),
  );
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("Semua Unit");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [sort, setSort] = useState({
    key: "nama",
    direction: "asc",
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sort.key === key && sort.direction === "asc") {
      direction = "desc";
    }
    setSort({ key, direction });
  };

  const calculatePerformance = useCallback(async () => {
    setLoading(true);
    try {
      //   const [resUsers, resAttendances, resDivs] = await Promise.all([
      //     axios.get("http://localhost:3000/users", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/attendances", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/divisions", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //   ]);

      const [resUsers, resAttendances, resDivs] = await Promise.all([
        axiosInstance.get("/users"),
        axiosInstance.get("/attendances"),
        axiosInstance.get("/divisions"),
      ]);

      const allUsers = resUsers.data.data || [];
      const rawAttendances = resAttendances.data.data || [];
      setDivisions(resDivs.data.data || []);

      const isAllUnits =
        selectedDivision === "Semua Unit" ||
        selectedDivision === "Semua Divisi";

      const filteredAttendances = rawAttendances.filter((att) => {
        if (!att.date) return false;
        const attMonth = att.date.includes("T")
          ? att.date.split("T")[0].substring(0, 7)
          : att.date.substring(0, 7);
        return attMonth === selectedPeriod;
      });

      const attendanceMap = filteredAttendances.reduce((acc, a) => {
        const uid = a.user?.id;
        if (!uid) return acc;
        if (!acc[uid]) acc[uid] = [];
        acc[uid].push(a);
        return acc;
      }, {});

      const performanceData = allUsers
        .filter((user) => {
          const userDiv = user.position?.division?.name;
          return isAllUnits || userDiv === selectedDivision;
        })
        .map((user) => {
          const userAtt = attendanceMap[user.id] || [];
          const hadir = userAtt.filter((a) =>
            ["hadir", "dinas luar"].includes(a.attendanceStatus?.toLowerCase()),
          ).length;
          const telat = userAtt.filter(
            (a) => a.attendanceStatus?.toLowerCase() === "terlambat",
          ).length;
          const dinasLuar = userAtt.filter(
            (a) => a.attendanceStatus?.toLowerCase() === "dinas luar",
          ).length;
          const izin = userAtt.filter(
            (a) => a.attendanceStatus?.toLowerCase() === "izin",
          ).length;
          const alfa = userAtt.filter(
            (a) => a.attendanceStatus?.toLowerCase() === "tidak hadir",
          ).length;
          const tidakValid = userAtt.filter(
            (a) => a.attendanceStatus?.toLowerCase() === "tidak valid",
          ).length;

          const totalHari = userAtt.length;
          let skor = 0;
          if (totalHari > 0) {
            skor =
              (hadir / totalHari) * 40 +
              ((totalHari - telat) / totalHari) * 30 +
              ((totalHari - izin) / totalHari) * 20 +
              ((totalHari - alfa) / totalHari) * 10;
          }

          const telatMinutes = userAtt
            .filter(
              (a) =>
                a.attendanceStatus?.toLowerCase() === "terlambat" &&
                a.checkInTime,
            )
            .map((a) => {
              const timePart = a.checkInTime.includes("T")
                ? a.checkInTime.split("T")[1]
                : a.checkInTime;
              const [hIn, mIn] = timePart.split(":").map(Number);
              const masukMenit = hIn * 60 + mIn;
              let standarMenit = 7 * 60;
              if (hIn >= 11 && hIn <= 18) standarMenit = 15 * 60;
              else if (hIn >= 19 || hIn <= 4) standarMenit = 23 * 60;
              let diff = masukMenit - standarMenit;
              if (hIn <= 4 && standarMenit === 1380)
                diff = (hIn + 24) * 60 + mIn - standarMenit;
              return diff > 0 ? diff : 0;
            });

          const rawAvg =
            telatMinutes.length > 0
              ? telatMinutes.reduce((s, v) => s + v, 0) / telatMinutes.length
              : 0;

          return {
            id: user.id,
            name: `${user.titlePrefix || ""} ${user.fullName}`.trim(),
            nip: user.nip,
            div: user.position?.division?.name || "-",
            photo: user.profilePhoto,
            hadir,
            telat,
            dinasLuar,
            izin,
            alfa,
            tidakValid,
            rawAvg,
            rata_rata: rawAvg,
            avgTelat: rawAvg > 0 ? Math.round(rawAvg) + " mnt" : "-",
            skor: Math.round(skor),
          };
        });
      setEmployees(performanceData);

      setStats({
        sangatBaik: performanceData.filter((e) => e.skor >= 95).length,
        baik: performanceData.filter((e) => e.skor >= 85 && e.skor < 95).length,
        cukup: performanceData.filter((e) => e.skor >= 75 && e.skor < 85)
          .length,
        perluPerhatian: performanceData.filter((e) => e.skor < 75).length,
      });

      const globalFiltered = filteredAttendances.filter(
        (a) =>
          isAllUnits || a.user?.position?.division?.name === selectedDivision,
      );
      const totalEntries = globalFiltered.length;

      if (totalEntries > 0) {
        const gHadir = globalFiltered.filter((a) =>
          ["hadir", "dinas luar"].includes(a.attendanceStatus?.toLowerCase()),
        ).length;
        const gTelat = globalFiltered.filter(
          (a) => a.attendanceStatus?.toLowerCase() === "terlambat",
        ).length;
        const gAlfa = globalFiltered.filter(
          (a) => a.attendanceStatus?.toLowerCase() === "tidak hadir",
        ).length;

        setGlobalStats({
          avgAttendance: (((gHadir + gTelat) / totalEntries) * 100).toFixed(1),
          percTepatWaktu: ((gHadir / totalEntries) * 100).toFixed(0),
          percTelat: ((gTelat / totalEntries) * 100).toFixed(0),
          percAlfa: ((gAlfa / totalEntries) * 100).toFixed(0),
        });
      } else {
        setGlobalStats({
          avgAttendance: 0,
          percTepatWaktu: 0,
          percTelat: 0,
          percAlfa: 0,
        });
      }

      const topLate = [...performanceData]
        .filter((e) => e.rawAvg > 0)
        .sort((a, b) => b.rawAvg - a.rawAvg)
        .slice(0, 10)
        .map((emp, idx) => ({
          rank: idx + 1,
          name: emp.name,
          div: emp.div,
          freq: emp.telat + " kali",
          total: Math.round(emp.rawAvg * emp.telat) + " mnt",
          avg: emp.avgTelat,
          status: emp.rawAvg > 30 ? "Bahaya" : "Peringatan",
        }));
      setTopLateEmployees(topLate);

      const now = new Date();
      const startOfWeek = new Date(now);
      const dayDiff = now.getDay() === 0 ? -6 : 1 - now.getDay();
      startOfWeek.setDate(now.getDate() + dayDiff + currentWeekOffset * 7);
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(selectedPeriod + "-01");
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const dayAnalysis = [];
      const daysName = [
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
        "Minggu",
      ];

      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(startOfWeek);
        targetDate.setDate(startOfWeek.getDate() + i);

        const dateString = targetDate.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        });

        const isOutsideMonth =
          targetDate < startOfMonth || targetDate > endOfMonth;

        dayAnalysis.push({
          day: daysName[i],
          displayDate: dateString,
          fullDate: targetDate.toISOString().split("T")[0],
          count: 0,
          totalMinutes: 0,
          isOutsideMonth,
        });
      }
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      filteredAttendances.forEach((att) => {
        if (!att.date) return;
        const attDateObj = new Date(att.date);
        if (attDateObj < startOfWeek || attDateObj > endOfWeek) return;
        if (attDateObj < startOfMonth || attDateObj > endOfMonth) return;
        if (att.attendanceStatus?.toLowerCase() !== "terlambat") return;
        const attDate = att.date.split("T")[0];
        const dayMatch = dayAnalysis.find((d) => d.fullDate === attDate);
        if (!dayMatch) return;
        const timePart = att.checkInTime?.includes("T")
          ? att.checkInTime.split("T")[1]
          : att.checkInTime;
        if (!timePart) return;
        const [hIn, mIn] = timePart.split(":").map(Number);
        const masukMenit = hIn * 60 + mIn;

        let standarMenit = 7 * 60;
        if (hIn >= 11 && hIn <= 18) standarMenit = 15 * 60;
        else if (hIn >= 19 || hIn <= 4) standarMenit = 23 * 60;
        let diff = masukMenit - standarMenit;

        if (hIn <= 4 && standarMenit === 1380) {
          diff = (hIn + 24) * 60 + mIn - standarMenit;
        }

        dayMatch.count += 1;
        dayMatch.totalMinutes += diff > 0 ? diff : 0;
      });

      const finalDayStats = dayAnalysis.map((item) => ({
        ...item,
        avg: item.count > 0 ? Math.round(item.totalMinutes / item.count) : 0,
      }));

      setDayStats(finalDayStats);

      const divMap = {};
      filteredAttendances.forEach((att) => {
        const divName = att.user?.position?.division?.name || "Tanpa Unit";
        if (
          selectedDivision !== "Semua Unit" &&
          selectedDivision !== "Semua Divisi" &&
          divName !== selectedDivision
        )
          return;
        if (!divMap[divName]) {
          divMap[divName] = { total: 0, totalMinutes: 0 };
        }

        if (att.attendanceStatus?.toLowerCase() === "terlambat") {
          divMap[divName].total += 1;
          const timePart = att.checkInTime?.includes("T")
            ? att.checkInTime.split("T")[1]
            : att.checkInTime;
          if (timePart) {
            const [hIn, mIn] = timePart.split(":").map(Number);
            const masukMenit = hIn * 60 + mIn;
            let standarMenit = 7 * 60;
            if (hIn >= 11 && hIn <= 18) standarMenit = 15 * 60;
            else if (hIn >= 19 || hIn <= 4) standarMenit = 23 * 60;
            let diff = masukMenit - standarMenit;
            if (hIn <= 4 && standarMenit === 1380)
              diff = (hIn + 24) * 60 + mIn - standarMenit;
            divMap[divName].totalMinutes += diff > 0 ? diff : 0;
          }
        }
      });

      const processedDivStats = Object.keys(divMap).map((name) => ({
        divisi: name,
        total: divMap[name].total,
        rata_rata:
          divMap[name].total > 0
            ? Math.round(divMap[name].totalMinutes / divMap[name].total) +
              " mnt"
            : "0 mnt",
      }));
      setDivisionStats(processedDivStats);

      const distCounts = { cat1: 0, cat2: 0, cat3: 0, cat4: 0, cat5: 0 };
      let totalLateCases = 0;

      filteredAttendances.forEach((att) => {
        const userDiv = att.user?.position?.division?.name;
        if (
          selectedDivision !== "Semua Unit" &&
          selectedDivision !== "Semua Divisi" &&
          userDiv !== selectedDivision
        )
          return;

        if (att.attendanceStatus?.toLowerCase() === "terlambat") {
          const timePart = att.checkInTime?.includes("T")
            ? att.checkInTime.split("T")[1]
            : att.checkInTime;
          if (timePart) {
            const [hIn, mIn] = timePart.split(":").map(Number);
            const masukMenit = hIn * 60 + mIn;
            let standarMenit = 7 * 60;
            if (hIn >= 11 && hIn <= 18) standarMenit = 15 * 60;
            else if (hIn >= 19 || hIn <= 4) standarMenit = 23 * 60;
            let diff = masukMenit - standarMenit;
            if (hIn <= 4 && standarMenit === 1380)
              diff = (hIn + 24) * 60 + mIn - standarMenit;

            const finalDiff = diff > 0 ? diff : 0;
            totalLateCases++;

            if (finalDiff <= 5) distCounts.cat1++;
            else if (finalDiff <= 10) distCounts.cat2++;
            else if (finalDiff <= 15) distCounts.cat3++;
            else if (finalDiff <= 30) distCounts.cat4++;
            else distCounts.cat5++;
          }
        }
      });

      const getPerc = (count) =>
        totalLateCases > 0 ? Math.round((count / totalLateCases) * 100) : 0;

      setDistribution([
        {
          label: "1-5 menit",
          count: distCounts.cat1,
          percentage: getPerc(distCounts.cat1),
          color: "#10b981",
        },
        {
          label: "6-10 menit",
          count: distCounts.cat2,
          percentage: getPerc(distCounts.cat2),
          color: "#3b82f6",
        },
        {
          label: "11-15 menit",
          count: distCounts.cat3,
          percentage: getPerc(distCounts.cat3),
          color: "#f59e0b",
        },
        {
          label: "16-30 menit",
          count: distCounts.cat4,
          percentage: getPerc(distCounts.cat4),
          color: "#f97316",
        },
        {
          label: "+ 30 menit",
          count: distCounts.cat5,
          percentage: getPerc(distCounts.cat5),
          color: "#ef4444",
        },
      ]);

      const last6Months = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        last6Months.push(d.toISOString().substring(0, 7));
      }

      const trendData = last6Months.map((month) => {
        const monthlyAtt = rawAttendances.filter(
          (a) => a.date && a.date.substring(0, 7) === month,
        );

        const unitAtt = monthlyAtt.filter(
          (a) =>
            selectedDivision === "Semua Unit" ||
            selectedDivision === "Semua Divisi" ||
            a.user?.position?.division?.name === selectedDivision,
        );

        const lateCases = unitAtt.filter(
          (a) => a.attendanceStatus?.toLowerCase() === "terlambat",
        );

        const totalMins = lateCases.reduce((acc, curr) => {
          const timePart = curr.checkInTime?.includes("T")
            ? curr.checkInTime.split("T")[1]
            : curr.checkInTime;
          if (!timePart) return acc;
          const [hIn, mIn] = timePart.split(":").map(Number);
          const masukMenit = hIn * 60 + mIn;
          let standarMenit = 7 * 60;
          if (hIn >= 11 && hIn <= 18) standarMenit = 15 * 60;
          else if (hIn >= 19 || hIn <= 4) standarMenit = 23 * 60;
          let diff = masukMenit - standarMenit;
          if (hIn <= 4 && standarMenit === 1380)
            diff = (hIn + 24) * 60 + mIn - standarMenit;
          return acc + (diff > 0 ? diff : 0);
        }, 0);

        const avg =
          lateCases.length > 0 ? Math.round(totalMins / lateCases.length) : 0;

        const monthName = new Date(month + "-01").toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        });

        return {
          bulan: monthName,
          kasus: lateCases.length,
          rata: avg + " mnt",
          val: lateCases.length,
          rawMonth: month,
        };
      });

      const finalTrends = trendData.map((item, idx) => {
        let trenIcon = "-";
        if (idx > 0) {
          const prev = trendData[idx - 1].kasus;
          if (item.kasus > prev) trenIcon = "↑ Naik";
          else if (item.kasus < prev) trenIcon = "↓ Turun";
          else trenIcon = "↔ Stabil";
        }

        const maxKasus = Math.max(...trendData.map((t) => t.kasus), 1);
        const width = (item.kasus / maxKasus) * 100 + "%";

        return { ...item, tren: trenIcon, width };
      });

      setTrends(finalTrends);
    } catch (err) {
      console.error("Gagal sinkronisasi data:", err);
    } finally {
      setLoading(false);
    }
  }, [token, selectedPeriod, selectedDivision]);

  useEffect(() => {
    calculatePerformance();
  }, [calculatePerformance, currentWeekOffset]);

  const getAttendanceStatus = (value) => {
    if (value >= 85) return "good";
    if (value >= 60) return "warning";
    return "bad";
  };

  const attendanceStatus = getAttendanceStatus(
    Number(globalStats.avgAttendance),
  );

  //   const getAttendanceStyle = () => {
  //     const val = parseFloat(globalStats.avgAttendance);

  //     if (val >= 85) return { backgroundColor: "#10b981" }; // hijau
  //     if (val >= 70) return { backgroundColor: "#f59e0b" }; // kuning
  //     return { backgroundColor: "#ef4444" }; // merah
  //   };

  //   const getAttendanceIcon = () => {
  //     const val = parseFloat(globalStats.avgAttendance);

  //     if (val >= 85) return <FaCheck />;
  //     if (val >= 70) return <FaInfoCircle />;
  //     return <FaExclamationTriangle />;
  //   };

  const filteredEmployees = employees.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDiv =
      selectedDivision === "Semua Unit" || e.div === selectedDivision;
    return matchSearch && matchDiv;
  });

  const bestEmployee =
    employees.length > 0
      ? [...employees].sort((a, b) => b.skor - a.skor)[0]
      : null;

  const sortedData = [...filteredEmployees].sort((a, b) => {
    let aValue = a[sort.key];
    let bValue = b[sort.key];

    if (sort.key === "rata_rata") {
      aValue = a.avgTelat === "-" ? 0 : parseFloat(a.avgTelat);
      bValue = b.avgTelat === "-" ? 0 : parseFloat(b.avgTelat);
    }

    if (sort.key === "skor") {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (aValue < bValue) {
      return sort.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sort.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const currentDivisionItems = [...divisionStats]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const sortedTopDivisions = [...currentDivisionItems].sort((a, b) => {
    let aValue = a[sort.key];
    let bValue = b[sort.key];

    if (sort.key === "total" || sort.key === "rata_rata") {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    }

    if (aValue < bValue) return sort.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sort.direction === "asc" ? 1 : -1;
    return 0;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const handleExportPDF = async () => {
    const doc = new jsPDF("l", "mm", "a4");
    const [year, month] = selectedPeriod.split("-");
    const monthName = new Date(year, month - 1).toLocaleString("id-ID", {
      month: "long",
      year: "numeric",
    });
    const today = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("RUMAH SAKIT BHAYANGKARA TK.III INDRAMAYU", 148, 10, {
      align: "center",
    });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`LAPORAN KINERJA KARYAWAN ${monthName.toUpperCase()}`, 148, 18, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${today}`, 14, 25);

    let currentY = 32;

    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN KINERJA", 14, currentY);
    autoTable(doc, {
      startY: currentY + 2,
      head: [
        [
          "No",
          "Sangat Baik",
          "Skor",
          "Baik",
          "Cukup",
          "Perlu Perhatian",
          "Terbaik Bulan Ini",
        ],
      ],
      body: [
        [
          1,
          stats.sangatBaik,
          "≥95",
          stats.baik,
          stats.cukup,
          stats.perluPerhatian,
          employees.sort((a, b) => b.skor - a.skor)[0]?.name || "-",
        ],
      ],
    });
    currentY = doc.lastAutoTable.finalY + 8;

    doc.setFont("helvetica", "bold");
    doc.text("DETAIL KINERJA KARYAWAN", 14, currentY);
    autoTable(doc, {
      startY: currentY + 2,
      styles: { fontSize: 7 },
      head: [
        [
          "No",
          "Nama",
          "Unit",
          "Hadir",
          "Telat",
          "DL",
          "Izin",
          "Tidak Hadir",
          "Tidak Valid",
          "Rata-rata (mnt)",
          "Skor",
        ],
      ],
      body: employees.map((e, i) => [
        i + 1,
        e.name,
        e.div,
        e.hadir,
        e.telat,
        e.dinasLuar,
        e.izin,
        e.alfa,
        e.tidakValid,
        e.avgTelat,
        e.skor,
      ]),
    });
    currentY = doc.lastAutoTable.finalY + 8;

    doc.text("TREN KETERLAMBATAN 6 BULAN", 14, currentY);
    autoTable(doc, {
      startY: currentY + 2,
      head: [["Bulan", "Kasus", "Rata-rata"]],
      body: trends.map((t) => [t.bulan, t.kasus, t.rata]),
    });
    currentY = doc.lastAutoTable.finalY + 8;

    doc.text("STATISTIK KEHADIRAN", 14, currentY);
    autoTable(doc, {
      startY: currentY + 2,
      body: [
        [
          `Rata-rata Kehadiran: ${globalStats.avgAttendance}% | Hadir Tepat Waktu: ${globalStats.percTepatWaktu}% | Telat: ${globalStats.percTelat}% | Tidak Hadir: ${globalStats.percAlfa}%`,
        ],
      ],
    });
    currentY = doc.lastAutoTable.finalY + 8;

    doc.text("KETERLAMBATAN PER UNIT", 14, currentY);
    autoTable(doc, {
      startY: currentY + 2,
      head: [["Unit", "Total", "Rata-rata"]],
      body: divisionStats.map((d) => [d.divisi, d.total, d.rata_rata]),
    });
    currentY = doc.lastAutoTable.finalY + 8;

    doc.text("DISTRIBUSI DURASI KETERLAMBATAN", 14, currentY);
    autoTable(doc, {
      startY: currentY + 2,
      head: [["Kategori", "Jumlah", "Persentase"]],
      body: distribution.map((d) => [d.label, d.count, d.percentage + "%"]),
    });
    currentY = doc.lastAutoTable.finalY + 8;

    doc.text("TOP 10 KETERLAMBATAN TERTINGGI", 14, currentY);
    autoTable(doc, {
      startY: currentY + 2,
      styles: { fontSize: 7 },
      head: [
        ["No", "Nama", "Unit", "Frekuensi", "Total", "Rata-rata", "Status"],
      ],
      body: topLateEmployees.map((e) => [
        e.rank,
        e.name,
        e.div,
        e.freq,
        e.total,
        e.avg,
        e.status,
      ]),
    });
    doc.save(`Laporan_Kinerja_Karyawan_${monthName}.pdf`);

    const fileName = `Laporan_Kinerja_Karyawan_${monthName}.pdf`;
    const pdfBlob = doc.output("blob");
    const formData = new FormData();
    formData.append("file", pdfBlob, fileName);
    formData.append("reportName", `Laporan Kinerja Karyawan ${monthName}`);
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
      console.error("Gagal menyimpan riwayat laporan kinerja karyawan", e);
    }
  };

  const handleExportExcel = async () => {
    const wb = XLSX.utils.book_new();
    const [year, month] = selectedPeriod.split("-");
    const monthName = new Date(year, month - 1).toLocaleString("id-ID", {
      month: "long",
      year: "numeric",
    });
    const today = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const sheetData = [
      ["RUMAH SAKIT BHAYANGKARA TK.III INDRAMAYU"],
      [`LAPORAN KINERJA KARYAWAN ${monthName.toUpperCase()}`],
      [`Tanggal Cetak: ${today}`],
      [],

      ["RINGKASAN KINERJA"],
      ["Sangat Baik", stats.sangatBaik],
      ["Baik", stats.baik],
      ["Cukup", stats.cukup],
      ["Perlu Perhatian", stats.perluPerhatian],
      [],

      ["DETAIL KARYAWAN"],
      [
        "No",
        "Nama",
        "Unit",
        "Hadir",
        "Telat",
        "DL",
        "Izin",
        "Tidak Hadir",
        "Tidak Valid",
        "Rata-rata",
        "Skor",
      ],
      ...employees.map((e, i) => [
        i + 1,
        e.name,
        e.div,
        e.hadir,
        e.telat,
        e.dinasLuar,
        e.izin,
        e.alfa,
        e.tidakValid,
        e.avgTelat,
        e.skor,
      ]),
      [],

      ["TREN 6 BULAN"],
      ["Bulan", "Kasus", "Rata-rata"],
      ...trends.map((t) => [t.bulan, t.kasus, t.rata]),
      [],

      ["STATISTIK KEHADIRAN"],
      [`Rata-rata Kehadiran: ${globalStats.avgAttendance}%`],
      [`Hadir Tepat: ${globalStats.percTepatWaktu}%`],
      [`Telat: ${globalStats.percTelat}%`],
      [`Tidak Hadir: ${globalStats.percAlfa}%`],
      [],

      ["KETERLAMBATAN PER DIVISI"],
      ["Unit", "Total", "Rata-rata Keterlambatan"],
      ...divisionStats.map((d) => [d.divisi, d.total, d.rata_rata]),
      [],

      ["DISTRIBUSI KETERLAMBATAN"],
      ["Kategori", "Jumlah", "Persentase"],
      ...distribution.map((d) => [d.label, d.count, d.percentage + "%"]),
      [],

      ["TOP 10 KETERLAMBATAN"],
      [
        "No",
        "Nama",
        "Unit",
        "Frekuensi",
        "Total",
        "Rata-rata Keterlambatan",
        "Status",
      ],
      ...topLateEmployees.map((e) => [
        e.rank,
        e.name,
        e.div,
        e.freq,
        e.total,
        e.avg,
        e.status,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } },
    ];

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
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

    ["A1", "A2", "A3"].forEach((cell) => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, sz: 12 },
          alignment: { horizontal: "center" },
        };
      }
    });

    sheetData.forEach((row, idx) => {
      if (!row) return;
      if (
        row.includes("Nama") ||
        row.includes("Unit") ||
        row.includes("Kategori") ||
        row.includes("Bulan") ||
        row.includes("No")
      ) {
        for (let C = 0; C <= 10; C++) {
          const cell = XLSX.utils.encode_cell({ r: idx, c: C });
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
      }
    });

    sheetData.forEach((row, idx) => {
      if (
        typeof row[0] === "string" &&
        row[0].match(/^(I|II|III|IV|V|VI|VII)\./)
      ) {
        const cell = XLSX.utils.encode_cell({ r: idx, c: 0 });
        if (ws[cell]) {
          ws[cell].s = {
            font: { bold: true },
          };
        }
      }
    });

    ws["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `Laporan_Kinerja_${monthName}.xlsx`);

    const fileName = `Laporan_Presensi_Unit_${monthName}.xlsx`;
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
      //   await axios.post("http://localhost:3000/history", formData, {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });

      await axiosInstance.post("/history", formData);
    } catch (e) {
      console.error("Gagal menyimpan riwayat laporan kinerja karyawan", e);
    }
  };

  return (
    <div className="content-page">
      <section className="status-grid-sect">
        {loading ? (
          [...Array(5)].map((_, i) => (
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
                <span className="stat-label-dash">Kinerja Sangat Baik</span>
                <span className="stat-value-dash">{stats.sangatBaik}</span>
                <p className="stat-sub-dash">Skor ≥ 95</p>
              </div>
              <div className="stat-icon-dash blue-light-dash">
                <FaCrown />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Kinerja Baik</span>
                <span className="stat-value-dash">{stats.baik}</span>
                <p className="stat-sub-dash">Skor 85-94</p>
              </div>
              <div className="stat-icon-dash green-light-dash">
                <FaThumbsUp />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Kinerja Cukup</span>
                <span className="stat-value-dash">{stats.cukup}</span>
                <p className="stat-sub-dash">Skor 75-84</p>
              </div>
              <div className="stat-icon-dash orange-light-dash">
                <FaInfoCircle />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Perlu Perhatian</span>
                <span className="stat-value-dash">{stats.perluPerhatian}</span>
                <p className="stat-sub-dash">Skor ≤ 74</p>
              </div>
              <div className="stat-icon-dash red-light-dash">
                <FaExclamationTriangle />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Terbaik Bulan Ini</span>
                <span className="stat-value-dash" style={{ fontSize: "20px" }}>
                  {bestEmployee ? bestEmployee.name : "-"}
                </span>
              </div>
              <div className="stat-icon-dash yellow-light-dash">
                <FaTrophy />
              </div>
            </div>
          </>
        )}
      </section>

      <div className="table-content-card">
        {loading ? (
          <div className="header-actions">
            <div className="search-wrapper">
              <div
                className="search-input skeleton-text"
                style={{ width: "100%", height: "38px", borderRadius: "8px" }}
              ></div>
            </div>
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
          </div>
        ) : (
          <div className="header-actions">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Cari nama karyawan..."
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="panel-actions-right">
              <select
                className="select-input"
                value={selectedDivision}
                onChange={(e) => {
                  setSelectedDivision(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="Semua Unit">Semua Unit</option>
                {divisions.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
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
              <button className="button is-success" onClick={handleExportExcel}>
                <FaFileExcel /> Excel
              </button>
            </div>
          </div>
        )}
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
                        Dinas Luar
                        <FaSort className="sort-icon" />
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
                        Rata-rata Keterlambatan <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Skor Kinerja <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="11" style={{ textAlign: "center" }}>
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
                      className={`sortable-header ${sort.key === "name" ? "active-sort" : ""}`}
                      onClick={() => requestSort("name")}
                    >
                      <div className="header-content">
                        Nama <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "div" ? "active-sort" : ""}`}
                      onClick={() => requestSort("div")}
                    >
                      <div className="header-content">
                        Unit <FaSort className="sort-icon" />
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
                      className={`sortable-header ${sort.key === "dinasLuar" ? "active-sort" : ""}`}
                      onClick={() => requestSort("dinasLuar")}
                    >
                      <div className="header-content">
                        Dinas Luar <FaSort className="sort-icon" />
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
                      className={`sortable-header ${sort.key === "alfa" ? "active-sort" : ""}`}
                      onClick={() => requestSort("alfa")}
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
                      className={`sortable-header ${sort.key === "rata_rata" ? "active-sort" : ""}`}
                      onClick={() => requestSort("rata_rata")}
                    >
                      <div className="header-content">
                        Rata-rata Keterlambatan <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "skor" ? "active-sort" : ""}`}
                      onClick={() => requestSort("skor")}
                    >
                      <div className="header-content">
                        Skor Kinerja <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((e) => (
                      <tr key={e.id}>
                        <td className="perf-name-cell">
                          <img
                            className="staff-avatar"
                            src={
                              e.photo
                                ? `http://localhost:3000/uploads/profilePhotos/${e.photo}`
                                : Avatar
                            }
                            alt={e.name.charAt(0)}
                          />
                          <div>
                            <div className="user-name">{e.name}</div>
                            <div className="user-nip">{e.nip}</div>
                          </div>
                        </td>
                        <td>
                          <span className="badge-text">{e.div}</span>
                        </td>
                        <td>{e.hadir}</td>
                        <td>{e.telat}</td>
                        <td>{e.dinasLuar}</td>
                        <td>{e.izin}</td>
                        <td>{e.alfa}</td>
                        <td>{e.tidakValid}</td>
                        <td>{e.avgTelat}</td>
                        <td>
                          <span
                            className={`perf-score-badge ${
                              e.skor >= 95
                                ? "s-excel"
                                : e.skor >= 85
                                  ? "s-good"
                                  : e.skor >= 75
                                    ? "s-average"
                                    : "s-bad"
                            }`}
                          >
                            {e.skor}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/performance-report/${e.id}`}
                            className="button is-info"
                            style={{ borderRadius: "8px" }}
                          >
                            <FaEye />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" style={{ textAlign: "center" }}>
                        <div className="no-data">
                          <h4 className="empty-title">
                            Belum ada data presensi
                          </h4>
                          <p className="empty-desc">
                            Data presensi akan muncul di sini
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
              Menampilkan {sortedData.length > 0 ? indexOfFirst + 1 : 0} -{" "}
              {Math.min(indexOfLast, sortedData.length)} dari{" "}
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

      <div className="content-grid">
        {loading ? (
          <div
            className="skeleton-text"
            style={{ width: "250px", height: "24px", marginBottom: "20px" }}
          ></div>
        ) : (
          <h3 className="title-section">Tren Keterlambatan Bulanan</h3>
        )}
        <div className="list-tren">
          {loading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="item-tren">
                  <div className="info-tren">
                    <div
                      className="skeleton-text"
                      style={{
                        width: "100px",
                        height: "12px",
                        marginBottom: "6px",
                      }}
                    ></div>
                    <div
                      className="skeleton-text"
                      style={{ width: "180px", height: "10px" }}
                    ></div>
                  </div>

                  <div className="progress-bg">
                    <div
                      className="progress-fill skeleton-line"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </div>
              ))
            : trends.map((t, i) => (
                <div key={i} className="item-tren">
                  <div className="info-tren">
                    <span>{t.bulan}</span>
                    <span>
                      {t.kasus} kasus | Rata-rata: {t.rata} |{" "}
                      <span
                        className={
                          t.tren.includes("↓") ? "tren-turun" : "tren-naik"
                        }
                      >
                        {t.tren}
                      </span>
                    </span>
                  </div>
                  <div className="progress-bg">
                    <div
                      className="progress-fill"
                      style={{ width: t.width }}
                    ></div>
                  </div>
                </div>
              ))}
        </div>
      </div>

      <div className="perf-summary-grid">
        <div className="perf-summary-card">
          {loading ? (
            <div
              className="skeleton-text"
              style={{ width: "250px", height: "24px", marginBottom: "20px" }}
            ></div>
          ) : (
            <h3 className="title-section">Karyawan Terbaik Bulan Ini</h3>
          )}
          <div className="best-employee-list">
            {loading ? (
              <>
                <>
                  <div
                    className="skeleton-text"
                    style={{
                      width: "220px",
                      height: "24px",
                      marginBottom: "16px",
                    }}
                  />
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="skeleton-item"
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginBottom: "12px",
                      }}
                    >
                      <div className="skeleton-circle" />
                      <div style={{ flex: 1 }}>
                        <div
                          className="skeleton-text"
                          style={{
                            width: "60%",
                            height: "14px",
                            marginBottom: "6px",
                          }}
                        />
                        <div
                          className="skeleton-text"
                          style={{ width: "40%", height: "12px" }}
                        />
                      </div>
                      <div
                        className="skeleton-text"
                        style={{ width: "40px", height: "14px" }}
                      />
                    </div>
                  ))}
                </>
              </>
            ) : (
              [...employees]
                .sort((a, b) => b.skor - a.skor)
                .slice(0, 3)
                .map((emp, i) => (
                  <div key={i} className="best-employee-item">
                    <div className="rank-badge">{i + 1}</div>
                    <div className="emp-info">
                      <span className="emp-name">{emp.name}</span>
                      <span className="emp-div">{emp.div}</span>
                    </div>
                    <span className="emp-score-text">{emp.skor}%</span>
                  </div>
                ))
            )}
          </div>
        </div>
        <div className="perf-summary-card">
          {loading ? (
            <div
              className="skeleton-text"
              style={{ width: "150px", height: "24px", marginBottom: "20px" }}
            ></div>
          ) : (
            <h3 className="title-section">Perlu Perhatian</h3>
          )}
          <div className="attention-box">
            {loading ? (
              <>
                <div className="attention-item">
                  <div
                    className="skeleton-circle"
                    style={{ width: "32px", height: "32px" }}
                  />
                  <div className="emp-info" style={{ flex: 1 }}>
                    <div
                      className="skeleton-text"
                      style={{
                        width: "60%",
                        height: "14px",
                        marginBottom: "6px",
                      }}
                    />
                    <div
                      className="skeleton-text"
                      style={{ width: "40%", height: "12px" }}
                    />
                  </div>
                  <div
                    className="skeleton-text"
                    style={{ width: "70px", height: "14px" }}
                  />
                </div>
              </>
            ) : employees.filter((e) => e.skor < 75).length > 0 ? (
              [...employees]
                .filter((e) => e.skor < 75)
                .sort((a, b) => a.skor - b.skor)
                .slice(0, 1)
                .map((emp, i) => (
                  <div key={i} className="attention-item">
                    <div className="attention-icon">
                      <FaExclamationTriangle />
                    </div>
                    <div className="emp-info">
                      <span className="emp-name">{emp.name}</span>
                      <span className="emp-div">{emp.div}</span>
                    </div>
                    <span className="status-tag-icon tag-red">
                      Skor {emp.skor}%
                    </span>
                  </div>
                ))
            ) : (
              <p className="no-data-small">Semua performa baik</p>
            )}
            {loading ? (
              <div
                className="skeleton-text"
                style={{ width: "90%", height: "12px", marginTop: "12px" }}
              />
            ) : (
              stats.perluPerhatian > 1 && (
                <p className="attention-note">
                  Terdapat {stats.perluPerhatian - 1} karyawan lainnya dengan
                  skor di bawah 75. Segera evaluasi kehadiran mereka
                </p>
              )
            )}
          </div>
        </div>
        <div className="perf-summary-card">
          {loading ? (
            <div
              className="skeleton-text"
              style={{ width: "180px", height: "24px", marginBottom: "20px" }}
            ></div>
          ) : (
            <h3 className="title-section">Statistik Kehadiran</h3>
          )}
          <div className="attendance-circle-container">
            <div className="attendance-main-stat">
              {loading ? (
                <>
                  <div
                    className="skeleton-circle"
                    style={{
                      width: "60px",
                      height: "60px",
                      marginBottom: "10px",
                    }}
                  />
                  <div
                    className="skeleton-text"
                    style={{
                      width: "140px",
                      height: "12px",
                      marginBottom: "8px",
                    }}
                  />
                  <div
                    className="skeleton-text"
                    style={{ width: "80px", height: "20px" }}
                  />
                </>
              ) : (
                <>
                  <div
                    className={`check-icon-circle ${
                      attendanceStatus === "good"
                        ? "green"
                        : attendanceStatus === "warning"
                          ? "yellow"
                          : "red"
                    }`}
                  >
                    {attendanceStatus === "good" ? (
                      <FaCheck />
                    ) : attendanceStatus === "warning" ? (
                      <FaInfoCircle />
                    ) : (
                      <FaExclamationTriangle />
                    )}
                  </div>
                  <span className="avg-label">Rata-rata Kehadiran</span>
                  <h2 className="avg-value">{globalStats.avgAttendance}%</h2>
                </>
              )}
            </div>
            <div className="attendance-mini-bars">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="mini-bar-item">
                    <div className="bar-labels">
                      <div
                        className="skeleton-text"
                        style={{ width: "100px", height: "12px" }}
                      />
                      <div
                        className="skeleton-text"
                        style={{ width: "30px", height: "12px" }}
                      />
                    </div>

                    <div className="bar-bg">
                      <div
                        className="skeleton-text"
                        style={{
                          width: "100%",
                          height: "8px",
                          borderRadius: "6px",
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="mini-bar-item">
                    <div className="bar-labels">
                      <span>Tepat Waktu</span>
                      <span>{globalStats.percTepatWaktu}%</span>
                    </div>
                    <div className="bar-bg">
                      <div
                        className="bar-fill green-fill"
                        style={{ width: `${globalStats.percTepatWaktu}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mini-bar-item">
                    <div className="bar-labels">
                      <span>Terlambat</span>
                      <span>{globalStats.percTelat}%</span>
                    </div>
                    <div className="bar-bg">
                      <div
                        className="bar-fill orange-fill"
                        style={{ width: `${globalStats.percTelat}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mini-bar-item">
                    <div className="bar-labels">
                      <span>Tidak Hadir</span>
                      <span>{globalStats.percAlfa}%</span>
                    </div>
                    <div className="bar-bg">
                      <div
                        className="bar-fill red-fill"
                        style={{ width: `${globalStats.percAlfa}%` }}
                      ></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
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
            <h3 className="title-section">Keterlambatan Per Divisi</h3>
          )}
          <div className="table-content-wrapper">
            {loading ? (
              <div className="table-content">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>
                        <div className="header-content">
                          Unit <FaSort className="sort-icon" />
                        </div>
                      </th>
                      <th>
                        <div className="header-content">
                          Total <FaSort className="sort-icon" />
                        </div>
                      </th>
                      <th>
                        <div className="header-content">
                          Rata-rata <FaSort className="sort-icon" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center" }}>
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
                <table className="report-table">
                  <thead>
                    <tr>
                      <th
                        className={`sortable-header ${sort.key === "divisi" ? "active-sort" : ""}`}
                        onClick={() => requestSort("divisi")}
                      >
                        <div className="header-content">
                          Unit <FaSort className="sort-icon" />
                        </div>
                      </th>
                      <th
                        className={`sortable-header ${sort.key === "total" ? "active-sort" : ""}`}
                        onClick={() => requestSort("total")}
                      >
                        <div className="header-content">
                          Total <FaSort className="sort-icon" />
                        </div>
                      </th>

                      <th
                        className={`sortable-header ${sort.key === "rata_rata" ? "active-sort" : ""}`}
                        onClick={() => requestSort("rata_rata")}
                      >
                        <div className="header-content">
                          Rata-rata Keterlambatan{" "}
                          <FaSort className="sort-icon" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTopDivisions.length > 0 ? (
                      sortedTopDivisions.map((e, index) => (
                        <tr key={index}>
                          <td>{e.divisi}</td>
                          <td>{e.total}</td>
                          <td className="bold-orange">{e.rata_rata}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" style={{ textAlign: "center" }}>
                          <div className="no-data">
                            <h4 className="empty-title">
                              Belum ada data keterlambatan
                            </h4>
                            <p className="empty-desc">
                              Data keterlambatan akan muncul di sini
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
        </div>
        <div className="content-card" style={{ marginBottom: "0px" }}>
          {loading ? (
            <div
              className="skeleton-text"
              style={{ width: "300px", height: "24px", marginBottom: "20px" }}
            ></div>
          ) : (
            <h3 className="title-section">Distribusi Durasi Keterlambatan</h3>
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
          ) : (
            distribution.map((item, index) => (
              <div key={index} className="dist-item">
                <div className="dist-label">
                  <span>{item.label}</span>
                  <span>
                    {item.count} kasus ({item.percentage}%)
                  </span>
                </div>
                <div className="progress-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                      transition: "width 0.8s ease-in-out",
                    }}
                  ></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="table-content-card">
        {loading ? (
          <div
            className="skeleton-text"
            style={{ width: "420px", height: "24px", marginBottom: "20px" }}
          ></div>
        ) : (
          <h3 className="title-card">
            Top 10 Karyawan dengan Keterlambatan Tertinggi
          </h3>
        )}
        <div className="table-content-wrapper">
          {loading ? (
            <div className="table-content">
              <table className="content-table">
                <thead>
                  <tr>
                    <th>
                      <div className="header-content">
                        Peringkat <FaSort className="sort-icon" />
                      </div>
                    </th>
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
                        Frekuensi <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Total Durasi <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Rata-rata <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Status <FaSort className="sort-icon" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
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
                      className={`sortable-header ${sort.key === "rank" ? "active-sort" : ""}`}
                      onClick={() => requestSort("rank")}
                    >
                      <div className="header-content">
                        Peringkat <FaSort className="sort-icon" />
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
                      className={`sortable-header ${sort.key === "unit" ? "active-sort" : ""}`}
                      onClick={() => requestSort("unit")}
                    >
                      <div className="header-content">
                        Unit <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "frekuensi" ? "active-sort" : ""}`}
                      onClick={() => requestSort("frekuensi")}
                    >
                      <div className="header-content">
                        Frekuensi <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "durasi" ? "active-sort" : ""}`}
                      onClick={() => requestSort("durasi")}
                    >
                      <div className="header-content">
                        Total Durasi <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "rata_rata" ? "active-sort" : ""}`}
                      onClick={() => requestSort("rata_rata")}
                    >
                      <div className="header-content">
                        Rata-rata <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "status" ? "active-sort" : ""}`}
                      onClick={() => requestSort("status")}
                    >
                      <div className="header-content">
                        Status <FaSort className="sort-icon" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topLateEmployees.length > 0 ? (
                    topLateEmployees.map((emp, i) => (
                      <tr key={i}>
                        <td>
                          <span className="rank-badge">{emp.rank}</span>
                        </td>
                        <td className="bold-text">{emp.name}</td>
                        <td>{emp.div}</td>
                        <td>{emp.freq}</td>
                        <td>{emp.total}</td>
                        <td className="red-text">{emp.avg}</td>
                        <td>
                          <span
                            className={`status-badge ${emp.status === "Peringatan" ? "yellow" : "red"}`}
                          >
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        style={{ textAlign: "center", padding: "20px" }}
                      >
                        Tidak ada data keterlambatan yang ditemukan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="content-grid-bottom">
        <div className="week-nav">
          {loading ? (
            <div
              className="skeleton-text"
              style={{ width: "250px", height: "24px", marginBottom: "20px" }}
            ></div>
          ) : (
            <h3 className="card-title" style={{ margin: 0 }}>
              Pola Keterlambatan Mingguan
            </h3>
          )}
          <div className="week-navigation">
            <button
              onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
              className="nav-button"
            >
              <FaAngleLeft />
            </button>
            <span
              style={{ fontWeight: "600", fontSize: "0.9rem", color: "#666" }}
            >
              {currentWeekOffset === 0
                ? "Minggu Ini"
                : `Minggu ${currentWeekOffset > 0 ? "+" : ""}${currentWeekOffset}`}
            </span>
            <button
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
              className="nav-button"
            >
              <FaAngleRight />
            </button>
            {currentWeekOffset !== 0 && (
              <button
                className="res-btn"
                onClick={() => setCurrentWeekOffset(0)}
              >
                Reset
              </button>
            )}
          </div>
        </div>
        <div className="days-grid">
          {loading
            ? [...Array(7)].map((_, i) => (
                <div key={i} className="day-card">
                  <div style={{ marginBottom: "10px" }}>
                    <div
                      className="day-name skeleton-text-emp"
                      style={{ width: "100px", height: "12px" }}
                    ></div>
                  </div>
                  <div
                    className="day-name skeleton-text-emp"
                    style={{
                      width: "30px",
                      height: "24px",
                      marginBottom: "20px",
                    }}
                  ></div>
                  <div
                    className="day-sub skeleton-text-emp"
                    style={{
                      width: "50px",
                      height: "8px",
                      marginBottom: "5px",
                    }}
                  ></div>
                  <div className="day-line">
                    <div
                      className="day-line-fill skeleton-line-emp"
                      style={{ width: "0%" }}
                    ></div>
                  </div>
                </div>
              ))
            : dayStats.map((item) => (
                <div
                  className={`day-card ${item.isOutsideMonth ? "disabled-day" : ""}`}
                >
                  <div style={{ marginBottom: "8px" }}>
                    <span className="day-name">
                      {item.day}, {item.displayDate}
                    </span>
                  </div>
                  <h4
                    className="day-value"
                    style={{
                      color:
                        item.count > 10
                          ? "#ef4444"
                          : item.count > 0
                            ? "#f97316"
                            : "#10b981",
                    }}
                  >
                    {item.count}
                  </h4>
                  <span className="day-sub" style={{ color: "#666" }}>
                    {item.avg} mnt
                  </span>
                  <div className="day-line">
                    <div
                      className="day-line-fill"
                      style={{
                        width: `${Math.min(item.count * 10, 100)}%`,
                        backgroundColor:
                          item.count > 10
                            ? "#ef4444"
                            : item.count > 0
                              ? "#f97316"
                              : "#10b981",
                      }}
                    ></div>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* <div className="content-grid-bottom">
        <div className="grid-rekomendasi">
          <div className="box-rekomendasi bg-merah">
            <h4>
              <div className="cat-label-group">
                <FaBan className="red" /> <span>Tindakan Segera</span>
              </div>
            </h4>
            <ul>
              <li>Panggil 3 karyawan dengan keterlambatan tertinggi</li>
              <li>Evaluasi penyebab keterlambatan di unit Administrasi</li>
            </ul>
          </div>
          <div className="box-rekomendasi bg-kuning">
            <h4>
              <div className="cat-label-group">
                <FaLightbulb className="orange" />{" "}
                <span>Tindakan Preventif</span>
              </div>
            </h4>
            <ul>
              <li>Sosialisasi pentingnya disiplin waktu</li>
              <li>Pertimbangkan sistem reward kehadiran</li>
            </ul>
          </div>
          <div className="box-rekomendasi bg-hijau">
            <h4>
              <div className="cat-label-group">
                <FaSearch className="green" />
                <span>Monitoring</span>
              </div>
            </h4>
            <ul>
              <li>Pantau tren keterlambatan mingguan</li>
              <li>Analisis pola keterlambatan per shift</li>
            </ul>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default EmployeePerformance;
