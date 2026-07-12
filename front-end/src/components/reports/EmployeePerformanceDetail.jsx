import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
// import axios from "axios";
import {
  FaCalendarAlt,
  FaFileAlt,
  FaChartPie,
  FaClock,
  FaUserCheck,
  FaUserTimes,
  FaExclamationTriangle,
  FaCoffee,
  FaSort,
  FaAngleLeft,
  FaAngleRight,
  FaEye,
  FaDownload,
  FaPrint,
} from "react-icons/fa";
import { formatDateIndo } from "../../utils/dateHelper";
// import AttendanceModal from "../../components/modals/AttendanceModal.jsx";
import AttendanceModal from "../../components/modals/attendance/AttendanceDetailModal.jsx";
import axiosInstance from "../../api/axios.js";

const EmployeePerformanceDetail = () => {
  //   const token = localStorage.getItem("token");
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [activeTab, setActiveTab] = useState("ringkasan");
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sort, setSort] = useState({
    key: "tgl",
    direction: "desc",
  });

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 3; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return "--:--";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "--:--";
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isCrossDay = (shiftDate, dateTimeStr) => {
    if (
      !shiftDate ||
      !dateTimeStr ||
      dateTimeStr === "-" ||
      dateTimeStr === "--:--"
    )
      return false;
    const shift = new Date(shiftDate);
    const time = new Date(dateTimeStr);
    if (isNaN(shift.getTime()) || isNaN(time.getTime())) return false;
    return time.getDate() !== shift.getDate();
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return "-";
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h > 0 && m > 0) return `${h} jam ${m} menit`;
    if (h > 0) return `${h} jam`;
    return `${m} menit`;
  };

  const getFallbackLateMins = (checkInTime) => {
    if (!checkInTime) return 0;
    const d = new Date(checkInTime);
    const mins = d.getHours() * 60 + d.getMinutes();
    const shiftStart = 7 * 60;
    return mins > shiftStart ? mins - shiftStart : 0;
  };

  const getWorkingDaysInMonth = (month, year, holidayList = []) => {
    let days = 0;
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = date.toISOString().split("T")[0];
        const isHoliday = holidayList.some(
          (h) => h.date && h.date.startsWith(dateStr),
        );
        if (!isHoliday) days++;
      }
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const calculateJoinWorkDuration = (joinDate) => {
    if (!joinDate) return "-";
    const start = new Date(joinDate);
    const end = new Date();
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDay() - start.getDay();
    // Jika bulan minus, kurangi tahun dan tambahkan 12 ke bulan
    if (months < 0) {
      years--;
      months += 12;
      days += 31;
    }
    const yearText = years > 0 ? `${years} tahun ` : "";
    const monthText = months > 0 ? `${months} bulan ` : "";
    const dayText = days > 0 ? `${days} hari` : "";
    return yearText + monthText + dayText || "-";
  };

  const calculateOvertimeDuration = (jamMasuk, jamPulang, employmentType) => {
    if (!jamMasuk || !jamPulang || jamMasuk === "-" || jamPulang === "-")
      return "-";
    const masuk = new Date(jamMasuk);
    const pulang = new Date(jamPulang);
    if (isNaN(masuk.getTime()) || isNaN(pulang.getTime())) return "-";

    // Set batas waktu selesai kerja (expectedEndTime) dengan basis waktu check-in
    let expectedEndTime = new Date(masuk.getTime());

    if (employmentType !== "Shift") {
      // NON-SHIFT: Jam kerja pasti selesai pukul 15:00 di hari yang sama
      expectedEndTime.setHours(15, 0, 0, 0);
    } else {
      // SHIFT: Deteksi shift berdasarkan jam masuk sebagai acuan
      const masukHour = masuk.getHours();

      if (masukHour >= 5 && masukHour < 13) {
        // SHIFT PAGI: Selesai pukul 15:00
        expectedEndTime.setHours(15, 0, 0, 0);
      } else if (masukHour >= 13 && masukHour < 21) {
        // SHIFT SIANG: Selesai pukul 23:00
        expectedEndTime.setHours(23, 0, 0, 0);
      } else {
        // SHIFT MALAM: Selesai pukul 07:00 pagi (Lintas Malam/Hari)
        // Jika check-in dilakukan pada malam hari (misal 22:00), pulangnya adalah jam 07:00 besok
        if (masukHour >= 19) {
          expectedEndTime.setDate(expectedEndTime.getDate() + 1);
        }
        // Jika check-in lewat tengah malam (misal 00:15), pulangnya tetap 07:00 pagi hari itu juga
        expectedEndTime.setHours(7, 0, 0, 0);
      }
    }

    // Hitung waktu lembur: Selisih antara jam pulang aktual dengan expectedEndTime
    const diffMs = pulang.getTime() - expectedEndTime.getTime();

    // Jika pegawai pulang tepat waktu atau lebih awal, maka tidak ada lembur
    if (diffMs <= 0) return "-";
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hoursText = hours > 0 ? `${hours} jam ` : "";
    const minutesText = minutes > 0 ? `${minutes} menit` : "";
    return `${hoursText}${minutesText}`.trim();
  };

  const calculateLateDuration = (checkInTime, employmentType) => {
    if (!checkInTime || !employmentType || checkInTime === "-") return 0;

    const masuk = new Date(checkInTime);
    if (isNaN(masuk.getTime())) return 0;

    const jamMasuk = masuk.getHours();
    const menitMasuk = masuk.getMinutes();
    const totalMenitMasuk = jamMasuk * 60 + menitMasuk;

    let jamJadwal = 0;

    if (employmentType === "Non-Shift") {
      // Non-Shift selalu mengacu ke jam 07.00
      jamJadwal = 7;
    } else {
      // Penentuan Sesi Shift berdasarkan jam masuk (dengan toleransi 1 jam sebelum)
      if (jamMasuk >= 6 && jamMasuk < 14) {
        jamJadwal = 7; // Sesi Pagi
      } else if (jamMasuk >= 14 && jamMasuk < 22) {
        jamJadwal = 15; // Sesi Siang
      } else {
        jamJadwal = 23; // Sesi Malam
      }
    }

    const menitJadwal = jamJadwal * 60;
    const batasToleransi = menitJadwal + 15; // Contoh: 07.15

    // Jika masuk setelah jam 07.15 (atau 15.15 / 23.15)
    if (totalMenitMasuk > batasToleransi) {
      return totalMenitMasuk - menitJadwal;
    }

    return 0;
  };

  useEffect(() => {
    fetchDetailData(1);
  }, [id, viewDate]);

  const fetchDetailData = async () => {
    setLoading(true);
    try {
      const month = viewDate.getMonth() + 1;
      const year = viewDate.getFullYear();

      // Menyiapkan array untuk 6 bulan terakhir (untuk chart tren)
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(viewDate.getFullYear(), viewDate.getMonth() - i, 1);
        return {
          monthNum: d.getMonth() + 1,
          yearNum: d.getFullYear(),
          label: d.toLocaleString("id-ID", { month: "short" }),
        };
      }).reverse(); // Dibalik agar urutannya dari lampau ke terbaru
      // Menyiapkan promise calls: 1 untuk User, 1 untuk Presensi bulan ini, dan 6 untuk Tren
      //   const userPromise = axios.get(`http://localhost:3000/users/${id}`, {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });
      //   const currentAttPromise = axios.get(
      //     `http://localhost:3000/attendances/user/${id}?month=${month}&year=${year}`,
      //     { headers: { Authorization: `Bearer ${token}` } },
      //   );
      //   const calPromise = axios.get(`http://localhost:3000/calendars`, {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });
      //   const trendPromises = last6Months.map((m) =>
      //     axios
      //       .get(
      //         `http://localhost:3000/attendances/user/${id}?month=${m.monthNum}&year=${m.yearNum}`,
      //         { headers: { Authorization: `Bearer ${token}` } },
      //       )
      //       .then((res) => {
      //         const data = res.data.data || [];
      //         const countHadir = data.filter((a) => {
      //           const attDate = new Date(a.date);
      //           const isSameMonth = attDate.getMonth() + 1 === m.monthNum;
      //           return (
      //             isSameMonth &&
      //             (a.attendanceStatus === "Hadir" ||
      //               a.attendanceStatus === "Terlambat")
      //           );
      //         }).length;
      //         return { month: m.label, value: countHadir };
      //       })
      //       .catch(() => ({ month: m.label, value: 0 })),
      //   );

      const userPromise = axiosInstance.get(`/users/${id}`);
      const currentAttPromise = axiosInstance.get(
        `/attendances/user/${id}?month=${month}&year=${year}`,
      );
      const calPromise = axiosInstance.get(`/calendars`);
      const trendPromises = last6Months.map((m) =>
        axiosInstance
          .get(`/attendances/user/${id}?month=${m.monthNum}&year=${m.yearNum}`)
          .then((res) => {
            const data = res.data.data || [];
            const countHadir = data.filter((a) => {
              const attDate = new Date(a.date);
              const isSameMonth = attDate.getMonth() + 1 === m.monthNum;
              return (
                isSameMonth &&
                (a.attendanceStatus === "Hadir" ||
                  a.attendanceStatus === "Terlambat")
              );
            }).length;
            return { month: m.label, value: countHadir };
          })
          .catch(() => ({ month: m.label, value: 0 })),
      );
      const [userRes, attRes, calRes, ...trendsRes] = await Promise.all([
        userPromise,
        currentAttPromise,
        calPromise,
        ...trendPromises,
      ]);
      setUserData(userRes.data.data);
      setAttendances(attRes.data.data || []);
      const holidaysData = calRes.data.data || calRes.data || [];
      setHolidays(holidaysData);
      setTrendData(trendsRes);
    } catch (error) {
      console.error("Gagal mengambil detail presensi", error);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIVE TAB: RINGKASAN & ANALITIK ---
  // 1. Tingkat Kehadiran & Ketepatan
  const monthlyFilteredData = useMemo(() => {
    const activeMonth = viewDate.getMonth() + 1;
    const activeYear = viewDate.getFullYear();
    return attendances.filter((a) => {
      const d = new Date(a.date);
      return d.getMonth() + 1 === activeMonth && d.getFullYear() === activeYear;
    });
  }, [attendances, viewDate]);

  const summaryStats = useMemo(() => {
    const activeMonth = viewDate.getMonth() + 1;
    const activeYear = viewDate.getFullYear();
    const isShift = userData?.employmentType === "Shift";
    const daysInMonth = new Date(activeYear, activeMonth, 0).getDate();
    // Jika Non-Shift, hitung hari kerja (Senin-Jumat)
    // Jika Shift, total hari kerja adalah jumlah jadwal/kehadiran yang ada
    const totalHariKerja = isShift
      ? monthlyFilteredData.length
      : getWorkingDaysInMonth(activeMonth, activeYear, holidays);

    const stats = {
      hadirTepatWaktu: 0,
      telat: 0,
      izin: 0,
      alfa: 0,
      tidakValid: 0,
      totalLemburMins: 0,
    };

    monthlyFilteredData.forEach((a) => {
      const status = a.attendanceStatus?.toLowerCase();
      if (status === "hadir") stats.hadirTepatWaktu++;
      else if (status === "terlambat") stats.telat++;
      else if (status === "izin" || status === "sakit") stats.izin++;
      else if (status === "tidak hadir") stats.alfa++;
      else if (status === "tidak valid") stats.tidakValid++;
      if (a.overtime) stats.totalLemburMins += a.overtime;
    });
    const hadir = stats.hadirTepatWaktu + stats.telat;
    const rateKehadiran =
      totalHariKerja > 0 ? ((hadir / totalHariKerja) * 100).toFixed(1) : 0;
    const rateKetepatan =
      hadir > 0 ? ((stats.hadirTepatWaktu / hadir) * 100).toFixed(1) : 0;
    const libur = isShift
      ? Math.max(0, daysInMonth - monthlyFilteredData.length)
      : Math.max(0, daysInMonth - totalHariKerja);
    return {
      ...stats,
      totalHariKerja,
      hadir,
      libur,
      izinAlfa: stats.izin + stats.alfa,
      rateKehadiran,
      rateKetepatan,
    };
  }, [monthlyFilteredData, userData, viewDate, holidays]);

  // 3. Frekuensi Check-in
  const checkInFreqData = useMemo(() => {
    const bins = [
      { range: "< 06:45", min: 0, max: 405, count: 0, color: "purple" }, // 405 = 6 * 60 + 45
      { range: "06:45 - 07:00", min: 405, max: 420, count: 0, color: "purple" },
      { range: "07:00 - 07:05", min: 420, max: 425, count: 0, color: "purple" },
      { range: "07:05 - 07:15", min: 425, max: 435, count: 0, color: "purple" },
      { range: "07:15+", min: 435, max: Infinity, count: 0, color: "purple" },
    ];

    monthlyFilteredData.forEach((a) => {
      if (a.checkInTime) {
        const date = new Date(a.checkInTime);
        const totalMins = date.getHours() * 60 + date.getMinutes();
        const binIndex = bins.findIndex(
          (b) => totalMins >= b.min && totalMins < b.max,
        );
        if (binIndex !== -1) bins[binIndex].count++;
      }
    });

    const maxCount = Math.max(...bins.map((b) => b.count), 1);
    return bins.map((b) => ({
      ...b,
      percent: ((b.count / maxCount) * 100).toFixed(0),
      active: b.count === maxCount && b.count > 0, // Highlight bin terbanyak
    }));
  }, [monthlyFilteredData]);

  // 5. Pola Keterlambatan per Hari
  const lateByDayData = useMemo(() => {
    const daysArr = [
      { id: 1, day: "Senin", totalMins: 0, lateCount: 0 },
      { id: 2, day: "Selasa", totalMins: 0, lateCount: 0 },
      { id: 3, day: "Rabu", totalMins: 0, lateCount: 0 },
      { id: 4, day: "Kamis", totalMins: 0, lateCount: 0 },
      { id: 5, day: "Jumat", totalMins: 0, lateCount: 0 },
      { id: 6, day: "Sabtu", totalMins: 0, lateCount: 0 }, // user tenaga medis
      { id: 0, day: "Minggu", totalMins: 0, lateCount: 0 }, // user tenaga medis
    ];

    monthlyFilteredData.forEach((a) => {
      const lateTimeVal =
        a.lateTime !== undefined && a.lateTime !== null
          ? a.lateTime
          : a.attendanceStatus === "Terlambat"
            ? getFallbackLateMins(a.checkInTime)
            : 0;
      if (lateTimeVal > 0 && a.date) {
        const dayOfWeek = new Date(a.date).getDay();
        const targetDay = daysArr.find((d) => d.id === dayOfWeek);
        if (targetDay) {
          targetDay.totalMins += lateTimeVal;
          targetDay.lateCount++;
        }
      }
    });

    const avgData = daysArr.map((d) => ({
      day: d.day,
      avgMin: d.lateCount > 0 ? (d.totalMins / d.lateCount).toFixed(1) : 0,
    }));
    const maxAvg = Math.max(...avgData.map((d) => parseFloat(d.avgMin)), 1);
    return avgData.map((d) => {
      const avg = parseFloat(d.avgMin);
      return {
        ...d,
        width: `${((avg / maxAvg) * 100).toFixed(0)}%`,
        color: avg > 10 ? "red" : avg > 5 ? "orange" : "green",
      };
    });
  }, [monthlyFilteredData]);

  // --- TAB AKTIF: TABEL RIWAYAT ---
  const allFormattedData = useMemo(() => {
    return monthlyFilteredData.map((item) => {
      const dateObj = new Date(item.date);

      const lateValue = calculateLateDuration(
        item.checkInTime,
        userData?.employmentType,
      );

      return {
        id: item.id,
        // rawDate: dateObj.getTime(),
        rawDate: item.date,
        rawIn: item.checkInTime,
        rawOut: item.checkOutTime,
        tgl: dateObj.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        }),
        hari: dateObj.toLocaleDateString("id-ID", { weekday: "short" }),
        in: item.checkInTime || "-",
        out: item.checkOutTime || "-",
        status: item.attendanceStatus,
        type:
          item.attendanceStatus === "Hadir"
            ? "hadir"
            : item.attendanceStatus === "Terlambat"
              ? "terlambat"
              : item.attendanceStatus === "Tidak Hadir"
                ? "alfa"
                : item.attendanceStatus === "Izin"
                  ? "izin"
                  : "libur",
        // rawTelat: item.lateTime || 0,
        // telat: formatDuration(item.lateTime),
        rawTelat: lateValue,
        telat: lateValue > 0 ? formatDuration(lateValue) : "-",
        rawLembur: item.overtime || 0,
        lembur: formatDuration(item.overtime),
        ket: item.notes || "-",
      };
    });
  }, [monthlyFilteredData]);

  const filterCounts = useMemo(() => {
    return {
      semua: allFormattedData.length,
      hadir: allFormattedData.filter((d) => d.status === "Hadir").length,
      terlambat: allFormattedData.filter((d) => d.status === "Terlambat")
        .length,
      izin: allFormattedData.filter((d) => d.status === "Izin").length,
      alfa: allFormattedData.filter((d) => d.status === "Tidak Hadir").length,
      libur: summaryStats.libur,
    };
  }, [allFormattedData, summaryStats.libur]);

  // --- TAB AKTIF: KALENDER ---
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const emptyCells = firstDay === 0 ? 6 : firstDay - 1;
    const days = [];

    const today = new Date();
    const isSameMonthYear =
      today.getMonth() === month && today.getFullYear() === year;

    for (let i = 0; i < emptyCells; i++) days.push({ type: "empty" });
    for (let d = 1; d <= daysInMonth; d++) {
      const currentFullDate = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      const record = attendances.find((a) => {
        if (!a.date) return false;
        return a.date.startsWith(dateStr);
      });

      const isWeekend =
        currentFullDate.getDay() === 0 || currentFullDate.getDay() === 6;

      //   const isHoliday = holidays.some(
      //     (h) => h.date && h.date.startsWith(dateStr),
      //   );
      const holidayData = holidays.find(
        (h) => h.date && h.date.startsWith(dateStr),
      );

      const isHoliday = !!holidayData;
      let statusLabel = "";
      if (holidayData) {
        statusLabel = holidayData.description;
      } else if (isWeekend && userData?.employmentType !== "Shift") {
        statusLabel = "Libur Akhir Pekan";
      } else {
        statusLabel = "Normal";
      }

      let lateVal = 0;
      let overtimeVal = "-";

      if (record) {
        // Hitung terlambat dengan logika toleransi 15 menit
        lateVal = calculateLateDuration(
          record.checkInTime,
          userData?.employmentType,
        );
        // Hitung lembur sesuai shift/non-shift
        overtimeVal = calculateOvertimeDuration(
          record.checkInTime,
          record.checkOutTime,
          userData?.employmentType,
        );
      }

      days.push({
        dayNum: d,
        dateObj: currentFullDate,
        record: record,
        calculatedLate: lateVal,
        calculatedOvertime: overtimeVal,
        isLibur:
          isHoliday || (isWeekend && userData?.employmentType !== "Shift"),
        holidayDesc: statusLabel,
        status: record
          ? record.attendanceStatus
          : isHoliday || isWeekend
            ? "Libur"
            : "Normal",
        isToday: isSameMonthYear && d === today.getDate(),
      });
    }
    return days;
  }, [viewDate, attendances, holidays, userData]);

  const sortedData = useMemo(() => {
    let filteredItems = [...allFormattedData];
    if (filterStatus !== "Semua") {
      if (filterStatus === "Izin") {
        filteredItems = filteredItems.filter(
          (d) => d.status === "Izin" || d.status === "Sakit",
        );
      } else {
        filteredItems = filteredItems.filter((d) => d.status === filterStatus);
      }
    }

    if (sort.key !== null) {
      filteredItems.sort((a, b) => {
        let valA = a[sort.key];
        let valB = b[sort.key];
        if (sort.key === "tgl") {
          valA = a.rawDate;
          valB = b.rawDate;
        }
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return sort.direction === "asc" ? -1 : 1;
        if (valA > valB) return sort.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filteredItems;
  }, [allFormattedData, sort, filterStatus]);

  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage]);

  const indexLast = currentPage * itemsPerPage;
  const indexFirst = indexLast - itemsPerPage;
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const requestSort = (key) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="content-page">
      {/* <div className="page-header-container">
        <div className="header-left">
          <nav className="nav-breadcrumbs">
            <Link className="breadcrumb-link" to="/dashboard">
              Dashboard
            </Link>{" "}
            <span className="breadcrumb-separator">&gt;</span>{" "}
            <Link className="breadcrumb-link" to="/report-generator">
              Laporan
            </Link>{" "}
            <span className="breadcrumb-separator">&gt;</span>{" "}
            <Link className="breadcrumb-link" to="/performance-report">
              Laporan Kinerja Karyawan
            </Link>{" "}
            <span className="breadcrumb-separator">&gt;</span>{" "}
            <span className="breadcrumb-current">Detail Kinerja Karyawan</span>
          </nav>
          <h2 className="nav-page-title">Detail Kinerja Karyawan</h2>
        </div>
        <div className="panel-actions-right">
          <button
            className="button is-danger"
            onClick={() => alert("Anda klik cetak laporan")}
          >
            <FaPrint /> Cetak Laporan
          </button>
          <button
            className="button is-success"
            onClick={() => alert("Anda klik export")}
          >
            <FaDownload /> Export
          </button>
        </div>
      </div> */}

      {loading ? (
        <div className="profile-card">
          {/* <div className="profile-main">
            <div
              className="avatar-big skeleton-item"
              style={{ width: "80px", height: "80px", borderRadius: "50%" }}
            ></div>
            <div
              className="profile-info"
              style={{ flex: 1, marginLeft: "20px" }}
            >
              <div
                className="skeleton-text"
                style={{ width: "200px", height: "24px", marginBottom: "10px" }}
              ></div>
              <div
                className="skeleton-text"
                style={{ width: "120px", height: "16px" }}
              ></div>
            </div>
          </div> */}
          <div className="profile-main">
            <div
              className="avatar-big skeleton-item"
              style={{ width: "80px", height: "80px", borderRadius: "12px" }}
            >
              <div
                className="skeleton-text"
                style={{ width: "30px", height: "35px" }}
              ></div>
            </div>
            <div className="profile-info" style={{ flex: 1 }}>
              <div
                className="skeleton-text"
                style={{ width: "200px", height: "24px", marginBottom: "8px" }}
              ></div>
              <div
                className="skeleton-text"
                style={{ width: "120px", height: "16px", marginBottom: "6px" }}
              ></div>
              <div className="badge-group">
                <div
                  className="skeleton-text"
                  style={{ width: "60px", height: "24px", borderRadius: "6px" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "80px", height: "24px", borderRadius: "6px" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "70px", height: "24px", borderRadius: "6px" }}
                ></div>
              </div>
            </div>
          </div>
          <div className="profile-details-grid">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="detail-item">
                <div
                  className="skeleton-text"
                  style={{ width: "40px", height: "12px", marginBottom: "8px" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "100px", height: "18px" }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="profile-card">
            <div className="profile-main">
              <div className="avatar-big">{userData?.fullName?.charAt(0)}</div>
              <div className="profile-info">
                <h2>{userData?.fullName}</h2>
                <p className="nip-text">{userData?.nip || "-"}</p>
                <div className="badge-group">
                  <span className="badge purple">
                    <b>{userData?.position?.division?.name || "-"}</b>
                  </span>
                  <span className="badge gray">
                    <b>{userData?.position?.name || "-"}</b>
                  </span>
                  <span
                    className={`badge ${userData?.status === "Aktif" ? "green-light" : "red-light"}`}
                  >
                    <b>● {userData?.status || "-"}</b>
                  </span>
                </div>
              </div>
            </div>
            <div className="profile-details-grid">
              <div className="detail-item">
                <span>Tipe</span>
                <strong>{userData?.employmentType}</strong>
              </div>
              <div className="detail-item">
                <span>Telepon</span>
                <strong>{userData?.phone}</strong>
              </div>
              <div className="detail-item">
                <span>Email</span>
                <strong>{userData?.email}</strong>
              </div>
              <div className="detail-item">
                <span>Bergabung</span>
                <strong>{formatDateIndo(userData?.joinDate)}</strong>
              </div>
              <div className="detail-item">
                <span>Masa Kerja</span>
                <strong>{calculateJoinWorkDuration(userData?.joinDate)}</strong>
              </div>
            </div>
          </div>
        </>
      )}

      <section className="status-grid-sect">
        {loading ? (
          //   [...Array(5)].map((_, i) => (
          //     <div key={i} className="stat-card-sect skeleton-box">
          //       <div className="stat-info-sect">
          //         <div
          //           className="skeleton-text"
          //           style={{ width: "80px", height: "14px", marginBottom: "8px" }}
          //         ></div>
          //         <div
          //           className="skeleton-text"
          //           style={{ width: "60px", height: "20px" }}
          //         ></div>
          //       </div>
          //       <div
          //         className="stat-icon-box skeleton-item"
          //         style={{ opacity: 0.3 }}
          //       ></div>
          //     </div>
          //   ))
          <>
            <div className="stat-card-sect green">
              <div className="stat-info-sect">
                <div
                  className="skeleton-text"
                  style={{ width: "120px", height: "18px" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "80px", height: "32px", margin: "10px 0" }}
                ></div>
              </div>
              <div className="stat-icon-dash skeleton-icon"></div>
            </div>
            <div className="stat-card-sect orange">
              <div className="stat-info-sect">
                <div
                  className="skeleton-text"
                  style={{ width: "120px", height: "18px" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "80px", height: "32px", margin: "10px 0" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "100px", height: "12px" }}
                ></div>
              </div>
              <div className="stat-icon-dash skeleton-icon"></div>
            </div>
            <div className="stat-card-sect red">
              <div className="stat-info-sect">
                <div
                  className="skeleton-text"
                  style={{ width: "120px", height: "18px" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "80px", height: "32px", margin: "10px 0" }}
                ></div>
              </div>
              <div className="stat-icon-dash skeleton-icon"></div>
            </div>
            <div className="stat-card-sect black">
              <div className="stat-info-sect">
                <div
                  className="skeleton-text"
                  style={{ width: "120px", height: "18px" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "80px", height: "32px", margin: "10px 0" }}
                ></div>
              </div>
              <div className="stat-icon-dash skeleton-icon"></div>
            </div>
            <div className="stat-card-sect purple">
              <div className="stat-info-sect">
                <div
                  className="skeleton-text"
                  style={{ width: "120px", height: "18px" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "80px", height: "32px", margin: "10px 0" }}
                ></div>
              </div>
              <div className="stat-icon-dash skeleton-icon"></div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card-sect green">
              <div className="stat-info-sect">
                <span className="stat-label-sect">Hadir</span>
                <span className="stat-value-sect-att">
                  {summaryStats.hadir} Hari
                </span>
              </div>
              <div className="stat-icon-box green-light">
                <FaUserCheck />
              </div>
            </div>
            {/* <div className="stat-card-sect blue">
          <div className="stat-info-sect">
            <span className="stat-label-sect">Izin</span>
            <span className="stat-value-sect-att">
              {summaryStats.izin} Hari
            </span>
          </div>
          <div className="stat-icon-box blue-light">
            <FaFileAlt />
          </div>
        </div> */}
            <div className="stat-card-sect orange">
              <div className="stat-info-sect">
                <span className="stat-label-sect">Terlambat</span>
                <span className="stat-value-sect-att">
                  {summaryStats.telat} kali
                </span>
                <span className="stat-sub-sect">Rata-rata X mnt</span>
              </div>
              <div className="stat-icon-box orange-light">
                <FaClock />
              </div>
            </div>
            {/* <div className="stat-card-sect red">
          <div className="stat-info-sect">
            <span className="stat-label-sect">Tidak Hadir</span>
            <span className="stat-value-sect-att">{summaryStats.alfa} Hari</span>
          </div>
          <div className="stat-icon-box red-light">
            <FaUserTimes />
          </div>
        </div> */}
            <div className="stat-card-sect red">
              <div className="stat-info-sect">
                <span className="stat-label-sect">Izin/Tidak Hadir</span>
                <span className="stat-value-sect-att">
                  {summaryStats.izinAlfa} Hari
                </span>
              </div>
              <div className="stat-icon-box red-light">
                <FaUserTimes />
              </div>
            </div>
            <div className="stat-card-sect black">
              <div className="stat-info-sect">
                <span className="stat-label-sect">Tidak Valid</span>
                <span className="stat-value-sect-att">
                  {summaryStats.tidakValid}
                </span>
              </div>
              <div className="stat-icon-box black-light">
                <FaExclamationTriangle />
              </div>
            </div>
            <div className="stat-card-sect purple">
              <div className="stat-info-sect">
                <span className="stat-label-sect">Lembur</span>
                <h4 className="stat-value-sect-att">
                  {formatDuration(summaryStats.totalLemburMins)}
                </h4>
              </div>
              <div className="stat-icon-box purple-light">
                <FaCoffee />
              </div>
            </div>
          </>
        )}
      </section>

      {loading ? (
        <div className="tab-navigation skeleton-box">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="skeleton-box"
              style={{
                flex: 1,
                height: "36px",
                borderRadius: "8px",
                opacity: 0.6,
                background: "rgba(0,0,0,0.1)",
              }}
            />
          ))}
        </div>
      ) : (
        <div className="tab-navigation">
          <button
            className={activeTab === "ringkasan" ? "active" : ""}
            onClick={() => setActiveTab("ringkasan")}
          >
            <FaChartPie /> Ringkasan & Analitik
          </button>
          <button
            className={activeTab === "kalender" ? "active" : ""}
            onClick={() => setActiveTab("kalender")}
          >
            <FaCalendarAlt /> Kalender
          </button>
          <button
            className={activeTab === "riwayat" ? "active" : ""}
            onClick={() => setActiveTab("riwayat")}
          >
            <FaFileAlt /> Tabel Riwayat
          </button>
        </div>
      )}

      <div className="tab-content">
        {activeTab === "ringkasan" &&
          (loading ? (
            <SkeletonRingkasan />
          ) : (
            <div className="summary-container">
              {/* <div className="summary-grid-top"> */}
              <div className="content-three-grid">
                <div className="chart-card">
                  <h3>Tingkat Kehadiran & Ketepatan</h3>
                  <div className="circular-charts">
                    <div className="circle-item">
                      <div
                        className={`circle-box ${summaryStats.rateKehadiran > 80 ? "green-ring" : "red-ring"}`}
                      >
                        {summaryStats.rateKehadiran}%
                      </div>
                      <p>Kehadiran</p>
                    </div>
                    <div className="circle-item">
                      <div
                        className={`circle-box ${summaryStats.rateKetepatan >= 80 ? "purple-ring" : "red-ring"}`}
                      >
                        {summaryStats.rateKetepatan}%
                      </div>
                      <p>Ketepatan Waktu</p>
                    </div>
                  </div>
                  <div className="alert-badge-red">
                    Penilaian: Perlu Perhatian
                  </div>
                </div>

                <div className="chart-card">
                  <h3>Distribusi Status Presensi</h3>
                  <div className="donut-chart-wrapper">
                    <div className="donut-chart-container">
                      <div className="donut-chart-visual">
                        <div className="donut-hole">
                          <span className="total-days">
                            {allFormattedData.length}
                          </span>
                          <span className="total-label">Total Hari</span>
                        </div>
                      </div>
                    </div>
                    <div className="donut-legend">
                      <div className="legend-item">
                        <span className="dot green"></span>
                        <span className="label">Tepat Waktu</span>
                        <span className="value">
                          {summaryStats.hadirTepatWaktu}
                        </span>
                      </div>
                      <div className="legend-item">
                        <span className="dot orange"></span>
                        <span className="label">Terlambat</span>
                        <span className="value">{summaryStats.telat}</span>
                      </div>
                      <div className="legend-item">
                        <span className="dot blue"></span>
                        <span className="label">Izin</span>
                        <span className="value">{summaryStats.izin}</span>
                      </div>
                      <div className="legend-item">
                        <span className="dot red"></span>
                        <span className="label">Tidak Hadir</span>
                        <span className="value">{summaryStats.alfa}</span>
                      </div>
                      <div className="legend-item">
                        <span className="dot grey"></span>
                        <span className="label">Libur</span>
                        <span className="value">{summaryStats.libur}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="chart-card">
                  <div className="card-header-flex">
                    <h3>Frekuensi Check-in</h3>
                    <span className="info-tag">Target: 07:00</span>
                  </div>
                  <div className="checkin-horizontal-container">
                    {checkInFreqData.map((item, idx) => (
                      <div key={idx} className="horizontal-bar-item">
                        <span
                          className={`time-range-label ${item.active ? "bold" : ""}`}
                        >
                          {item.range}
                        </span>
                        <div className="bar-track-horizontal">
                          <div
                            className={`bar-fill-horizontal ${item.color}`}
                            style={{ width: `${item.percent}%` }}
                          >
                            {item.count > 0 && (
                              <span className="bar-inner-text">
                                {item.count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="checkin-analysis">
                    {/* <p>Mayoritas karyawan melakukan check-in tepat waktu pada
                    rentang <b>06:45 - 07:00</b> </p> */}
                    <p>
                      Bulan ini, waktu check-in paling sering adalah pada
                      rentang{" "}
                      <b>
                        {checkInFreqData.find((b) => b.active)?.range || "-"}
                      </b>
                    </p>
                  </div>
                </div>
              </div>

              <div className="summary-grid-bottom">
                <div className="chart-card">
                  <h3>Tren Kehadiran 6 Bulan Terakhir</h3>
                  <div className="trend-chart-container">
                    <div className="trend-visual-wrapper">
                      {trendData.map((item, idx) => {
                        const maxTrendVal = Math.max(
                          ...trendData.map((t) => t.value),
                          20,
                        );
                        const heightPercent = Math.min(
                          (item.value / maxTrendVal) * 100,
                          100,
                        ).toFixed(0);
                        return (
                          <div key={idx} className="trend-column">
                            <div className="trend-bar-area">
                              <div
                                className="trend-bar-pillar active"
                                style={{ height: `${heightPercent}%` }}
                              >
                                <span className="bar-tooltip">
                                  {item.value}
                                </span>
                              </div>
                            </div>
                            <span className="trend-month-label">
                              {item.month}
                            </span>
                            <span className="trend-value-label">
                              {heightPercent}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="chart-card">
                  <div className="card-header-flex">
                    <h3>Pola Keterlambatan per Hari</h3>
                  </div>
                  <div className="bar-chart-vertical">
                    {lateByDayData.map((item, idx) => (
                      <div key={idx} className="bar-item-container">
                        <span className="attend-day-label">{item.day}</span>
                        <div className="bar-track">
                          <div
                            className={`bar-fill-dynamic ${item.color}`}
                            style={{ width: item.width }}
                          >
                            {item.avgMin > 0 && (
                              <span className="minute-text">
                                {item.avgMin}m
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="chart-legend-mini">
                    <span className="legend-dot green"></span> {`< 5m`}
                    <span className="legend-dot orange"></span> {`5-10m`}
                    <span className="legend-dot red"></span> {`> 10m`}
                  </div>
                </div>
              </div>
            </div>
          ))}

        {activeTab === "kalender" &&
          (loading ? (
            <SkeletonKalender />
          ) : (
            <div className="calendar-container">
              <div className="calendar-header">
                <div className="calendar-month-nav">
                  <button
                    className="pagination-arrow"
                    onClick={() =>
                      setViewDate(
                        new Date(viewDate.setMonth(viewDate.getMonth() - 1)),
                      )
                    }
                  >
                    <FaAngleLeft />
                  </button>
                  <h4 className="current-view-label">
                    {viewDate.toLocaleString("id-ID", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h4>
                  <button
                    className="pagination-arrow"
                    onClick={() =>
                      setViewDate(
                        new Date(viewDate.setMonth(viewDate.getMonth() + 1)),
                      )
                    }
                  >
                    <FaAngleRight />
                  </button>
                </div>
              </div>
              <div className="calendar-grid">
                {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map(
                  (day) => (
                    <div key={day} className="day-name">
                      {day}
                    </div>
                  ),
                )}
                {calendarDays.map((cell, idx) => {
                  if (cell.type === "empty")
                    return <div key={idx} className="day-cell empty" />;
                  let statusClass = "normal";
                  let statusLabel = "";
                  if (cell.isLibur) {
                    statusClass = "libur";
                    statusLabel = cell.holidayDesc
                      ? cell.holidayDesc
                      : cell.dateObj.getDay() === 0 ||
                          cell.dateObj.getDay() === 6
                        ? "Libur Akhir Pekan"
                        : "Libur";
                  }
                  if (cell.record) {
                    const s = cell.record.attendanceStatus.toLowerCase();
                    if (s === "hadir") {
                      statusClass = "hadir";
                      statusLabel = "Hadir";
                    } else if (s === "terlambat") {
                      statusClass = "terlambat";
                      statusLabel = "Terlambat";
                    } else if (s === "izin") {
                      statusClass = "izin";
                      statusLabel = "Izin";
                    } else if (s === "tidak hadir") {
                      statusClass = "tidak-hadir";
                      statusLabel = "Tidak Hadir";
                    } else if (s === "tidak valid") {
                      statusClass = "tidak-valid";
                      statusLabel = "Tidak Valid";
                    }
                  }
                  return (
                    <div
                      key={idx}
                      className={`day-cell ${statusClass} ${cell.isToday ? "today" : ""}`}
                      title={cell.isLibur && !cell.record ? statusLabel : ""}
                      onClick={() => {
                        if (cell.record || cell.isLibur) {
                          setSelectedDate({
                            dayName: cell.dateObj.toLocaleDateString("id-ID", {
                              weekday: "long",
                            }),
                            fullDate: cell.dateObj.toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }),
                            status: statusClass,
                            statusText: statusLabel,
                            checkIn: cell.record?.checkInTime
                              ? formatTime(cell.record.checkInTime)
                              : "--:--",
                            checkOut: cell.record?.checkOutTime
                              ? formatTime(cell.record.checkOutTime)
                              : "--:--",
                            late:
                              cell.calculatedLate > 0
                                ? formatDuration(cell.calculatedLate)
                                : "-",
                            overtime:
                              cell.calculatedOvertime !== "-"
                                ? cell.calculatedOvertime
                                : "-",
                          });
                        }
                      }}
                    >
                      <span className="date-num">{cell.dayNum}</span>
                      {cell.record ? (
                        <div className="attendance-info">
                          <span className="time">
                            {formatTime(cell.record.checkInTime)}
                          </span>
                          <span className="status-label">{statusLabel}</span>
                        </div>
                      ) : cell.isLibur ? (
                        <div className="attendance-info holiday-info">
                          <span
                            className="status-label holiday"
                            style={{
                              // fontSize: "0.65rem",
                              // textAlign: "center",
                              // lineHeight: "1.2",
                              // display: "-webkit-box",
                              // WebkitLineClamp: 2,
                              // WebkitBoxOrient: "vertical",
                              // overflow: "hidden",
                              // textOverflow: "ellipsis",
                              // whiteSpace: "normal",
                              // wordBreak: "break-word",
                              color: "#d32f2f",
                              fontWeight: "600",
                            }}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {selectedDate && (
                <div
                  className="day-detail-wrapper"
                  onClick={() => setSelectedDate(null)}
                >
                  <div
                    className="day-detail-card"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="detail-header">
                      <div className="header-left">
                        <h4>{selectedDate.dayName}</h4>
                        <p>{selectedDate.fullDate}</p>
                      </div>
                      <span className={`status-badge ${selectedDate.status}`}>
                        {selectedDate.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="detail-stats-grid">
                      <div className="detail-stat-card">
                        <span className="label">Masuk</span>
                        <span className="value">{selectedDate.checkIn}</span>
                      </div>
                      <div className="detail-stat-card">
                        <span className="label">Keluar</span>
                        <span className="value">{selectedDate.checkOut}</span>
                      </div>
                      <div className="detail-stat-card">
                        <span className="label">Terlambat</span>
                        <span className="value text-red">
                          {selectedDate.late}
                        </span>
                      </div>
                      <div className="detail-stat-card">
                        <span className="label">Lembur</span>
                        <span className="value text-green">
                          {selectedDate.overtime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="calendar-legend-mini">
                {/* <span className="leg">
                  <i className="dot green"></i> Hadir
                </span> */}
                <span className="legend-item">
                  <i className="dot green"></i> Hadir
                </span>
                <span className="legend-item">
                  <i className="dot orange"></i> Terlambat
                </span>
                <span className="legend-item">
                  <i className="dot purple"></i> Dinas Luar
                </span>
                <span className="legend-item">
                  <i className="dot blue"></i> Izin
                </span>
                <span className="legend-item">
                  <i className="dot red"></i> Tidak Hadir
                </span>
                <span className="legend">
                  <i className="dot grey"></i> Tidak Valid
                </span>
              </div>
            </div>
          ))}

        {activeTab === "riwayat" &&
          (loading ? (
            <SkeletonRiwayat />
          ) : (
            <div className="history-container">
              <div className="history-header">
                <h3>Riwayat Kehadiran Harian</h3>
                <div className="header-filter-wrapper">
                  <div className="panel-actions-right">
                    <select
                      className="select-input"
                      value={month}
                      onChange={(e) => {
                        const newMonth = Number(e.target.value);
                        setMonth(newMonth);
                        setViewDate(new Date(year, newMonth - 1, 1));
                        setCurrentPage(1);
                      }}
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
                        <option key={i + 1} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      className="select-input"
                      value={year}
                      onChange={(e) => {
                        const newYear = Number(e.target.value);
                        setYear(newYear);
                        setViewDate(new Date(newYear, month - 1, 1));
                        setCurrentPage(1);
                      }}
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="history-filters">
                    <button
                      className={`filter-pill ${filterStatus === "Semua" ? "active" : ""}`}
                      onClick={() => {
                        setFilterStatus("Semua");
                        setCurrentPage(1);
                      }}
                    >
                      Semua
                      <span className="pill-count">{filterCounts.semua}</span>
                    </button>
                    <button
                      className={`filter-pill ${filterStatus === "Hadir" ? "active" : ""}`}
                      onClick={() => {
                        setFilterStatus("Hadir");
                        setCurrentPage(1);
                      }}
                    >
                      Hadir{" "}
                      <span className="pill-count">{filterCounts.hadir}</span>
                    </button>
                    <button
                      className={`filter-pill ${filterStatus === "Terlambat" ? "active" : ""}`}
                      onClick={() => {
                        setFilterStatus("Terlambat");
                        setCurrentPage(1);
                      }}
                    >
                      Terlambat{" "}
                      <span className="pill-count">
                        {filterCounts.terlambat}
                      </span>
                    </button>
                    <button
                      className={`filter-pill ${filterStatus === "Izin" ? "active" : ""}`}
                      onClick={() => {
                        setFilterStatus("Izin");
                        setCurrentPage(1);
                      }}
                    >
                      Izin{" "}
                      <span className="pill-count">{filterCounts.izin}</span>
                    </button>
                    <button
                      className={`filter-pill ${filterStatus === "Tidak Hadir" ? "active" : ""}`}
                      onClick={() => {
                        setFilterStatus("Tidak Hadir");
                        setCurrentPage(1);
                      }}
                    >
                      Tidak Hadir{" "}
                      <span className="pill-count">{filterCounts.alfa}</span>
                    </button>
                    <button
                      className={`filter-pill ${filterStatus === "Libur" ? "active" : ""}`}
                      onClick={() => {
                        setFilterStatus("Libur");
                        setCurrentPage(1);
                      }}
                    >
                      Libur{" "}
                      <span className="pill-count">{filterCounts.libur}</span>
                    </button>
                  </div>
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
                              Tanggal <FaSort className="sort-icon" />
                            </div>
                          </th>
                          <th>
                            <div className="header-content">
                              Hari <FaSort className="sort-icon" />
                            </div>
                          </th>
                          <th>
                            <div className="header-content">
                              Masuk <FaSort className="sort-icon" />
                            </div>
                          </th>
                          <th>
                            <div className="header-content">
                              Keluar <FaSort className="sort-icon" />
                            </div>
                          </th>
                          <th>
                            <div className="header-content">
                              Status <FaSort className="sort-icon" />
                            </div>
                          </th>
                          <th>
                            <div className="header-content">
                              Terlambat <FaSort className="sort-icon" />
                            </div>
                          </th>
                          <th>
                            <div className="header-content">
                              Lembur <FaSort className="sort-icon" />
                            </div>
                          </th>
                          <th>
                            <div className="header-content">
                              Keterangan <FaSort className="sort-icon" />
                            </div>
                          </th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan="9" style={{ textAlign: "center" }}>
                            <div className="qr-loading-box">
                              <div className="qr-spinner"></div>
                              <p className="qr-loading">
                                Memuat data presensi...
                              </p>
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
                            className={`sortable-header ${sort.key === "tgl" ? "active-sort" : ""}`}
                            onClick={() => requestSort("tgl")}
                          >
                            <div className="header-content">
                              Tanggal <FaSort className="sort-icon" />
                            </div>
                          </th>
                          <th
                            className={`sortable-header ${sort.key === "hari" ? "active-sort" : ""}`}
                            onClick={() => requestSort("hari")}
                          >
                            <div className="header-content">
                              Hari <FaSort className="sort-icon" />
                            </div>
                          </th>
                          <th
                            className={`sortable-header ${sort.key === "in" ? "active-sort" : ""}`}
                            onClick={() => requestSort("in")}
                          >
                            <div className="header-content">
                              Masuk <FaSort className="sort-icon" />
                            </div>
                          </th>
                          <th
                            className={`sortable-header ${sort.key === "out" ? "active-sort" : ""}`}
                            onClick={() => requestSort("out")}
                          >
                            <div className="header-content">
                              Keluar <FaSort className="sort-icon" />
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
                          <th
                            className={`sortable-header ${sort.key === "telat" ? "active-sort" : ""}`}
                            onClick={() => requestSort("telat")}
                          >
                            <div className="header-content">
                              Terlambat <FaSort className="sort-icon" />
                            </div>
                          </th>
                          <th
                            className={`sortable-header ${sort.key === "lembur" ? "active-sort" : ""}`}
                            onClick={() => requestSort("lembur")}
                          >
                            <div className="header-content">
                              Lembur <FaSort className="sort-icon" />
                            </div>
                          </th>
                          <th
                            className={`sortable-header ${sort.key === "ket" ? "active-sort" : ""}`}
                            onClick={() => requestSort("ket")}
                          >
                            <div className="header-content">
                              Keterangan <FaSort className="sort-icon" />
                            </div>
                          </th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTableData.length > 0 ? (
                          currentTableData.map((row) => (
                            <tr key={row.id}>
                              <td className="font-medium">{row.tgl}</td>
                              <td>{row.hari}</td>
                              <td>
                                {formatTime(row.in)}
                                {isCrossDay(row.tgl, row.in) && (
                                  <span className="cross-day"> (+1 hari)</span>
                                )}
                              </td>
                              <td>
                                {formatTime(row.out)}
                                {isCrossDay(row.tgl, row.out) && (
                                  <span className="cross-day"> (+1 hari)</span>
                                )}
                              </td>
                              <td>
                                <span
                                  className={`status-pill pill-${row.type}`}
                                >
                                  <span className="dot-mini"></span>
                                  {row.status}
                                </span>
                              </td>
                              <td className="text-orange font-medium">
                                {row.telat}
                              </td>
                              <td className="text-purple font-medium">
                                {calculateOvertimeDuration(row.in, row.out)}
                              </td>
                              <td
                                className={
                                  row.ket !== "-"
                                    ? "text-italic text-gray"
                                    : "text-gray"
                                }
                                // style={{
                                //   maxWidth: "150px",
                                //   whiteSpace: "nowrap",
                                //   overflow: "hidden",
                                //   textOverflow: "ellipsis",
                                // }}
                                style={{
                                  maxWidth: "200px",
                                  wordBreak: "break-word",
                                  whiteSpace: "normal",
                                }}
                              >
                                {row.ket}
                              </td>
                              <td>
                                <button
                                  className="button is-info"
                                  onClick={() => setSelectedAttendance(row)}
                                >
                                  <FaEye />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" style={{ textAlign: "center" }}>
                              <div className="no-data">
                                <h4 className="empty-title">
                                  Belum ada data presensi
                                </h4>
                                <p className="empty-desc">
                                  Data presensi akan tampil di sini
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
              <div className="history-footer">
                <div className="pag-footer-text">
                  Menampilkan {sortedData.length > 0 ? indexFirst + 1 : 0} -{" "}
                  {Math.min(indexLast, sortedData.length)} dari{" "}
                  {sortedData.length} data
                </div>
                <div className="center-pagination">
                  <button
                    className="pagination-arrow"
                    onClick={() => handlePageChange(currentPage - 1)}
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
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <FaAngleRight />
                  </button>
                </div>
              </div>
            </div>
          ))}

        {/* {loading ? (
          <div className="notes-section">
            <div
              className="notes-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <div
                className="skeleton-text"
                style={{ width: "180px", height: "24px" }}
              />
              <div
                className="skeleton-text"
                style={{ width: "60px", height: "24px", borderRadius: "12px" }}
              />
            </div>

            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="rec-box"
                style={{
                  height: "80px",
                  marginBottom: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: "16px",
                  borderLeft: "4px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    className="skeleton-text"
                    style={{ width: "100px", height: "18px" }}
                  />
                  <div
                    className="skeleton-text"
                    style={{ width: "120px", height: "14px" }}
                  />
                </div>
                <div
                  className="skeleton-text"
                  style={{ width: "60%", height: "14px" }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="notes-section">
            <div className="notes-header">
              <h3>Catatan & Keterangan</h3>
              <span className="notes-count">2 catatan</span>
            </div>
            <div className="note-list">
            <div className="note-item blue">
              <span className="note-type">Izin</span>
              <span className="note-date">6 Januari 2025</span>
              <p>Keperluan pribadi</p>
            </div>
            <div className="note-item red">
              <span className="note-type">Tidak Hadir</span>
              <span className="note-date">9 Januari 2025</span>
              <p>Tidak ada keterangan, sudah diberikan peringatan</p>
            </div>
          </div>
            <div className="rec-box info">
              <div className="rec-header">
                <div className="cat-label-group">
                  <strong>Izin</strong>
                </div>
                <span className="date-note">6 Januari 2025</span>
              </div>
              <p>Keperluan Pribadi</p>
            </div>
            <div className="rec-box danger">
              <div className="rec-header">
                <div className="cat-label-group">
                  <strong>Tidak Hadir</strong>
                </div>
                <span className="date-note">9 Januari 2025</span>
              </div>
              <p>Tidak ada keterangan, sudah diberikan peringatan</p>
            </div>
          </div>
        )} */}
      </div>

      {selectedAttendance && (
        <AttendanceModal
          data={selectedAttendance}
          onClose={() => setSelectedAttendance(null)}
        />
      )}
    </div>
  );
};

export default EmployeePerformanceDetail;

const SkeletonRingkasan = () => {
  //   return (
  //     <div className="summary-container">
  //       <div className="content-three-grid">
  //         {[...Array(3)].map((_, i) => (
  //           <div key={i} className="chart-card" style={{ height: "300px" }}>
  //             <div
  //               className="skeleton-text"
  //               style={{
  //                 width: "150px",
  //                 height: "20px",
  //                 marginBottom: "20px",
  //               }}
  //             />
  //             <div
  //               style={{
  //                 display: "flex",
  //                 gap: "20px",
  //                 justifyContent: "center",
  //               }}
  //             >
  //               {i === 0 &&
  //                 [...Array(2)].map((_, j) => (
  //                   <div
  //                     key={j}
  //                     className="skeleton-item"
  //                     style={{
  //                       width: "80px",
  //                       height: "80px",
  //                       borderRadius: "50%",
  //                     }}
  //                   />
  //                 ))}
  //               {i === 1 && (
  //                 <div
  //                   className="skeleton-item"
  //                   style={{
  //                     width: "120px",
  //                     height: "120px",
  //                     borderRadius: "50%",
  //                   }}
  //                 />
  //               )}
  //               {i === 2 &&
  //                 [...Array(5)].map((_, j) => (
  //                   <div
  //                     key={j}
  //                     className="skeleton-text"
  //                     style={{
  //                       width: "100%",
  //                       height: "20px",
  //                       marginBottom: "10px",
  //                     }}
  //                   />
  //                 ))}
  //             </div>
  //           </div>
  //         ))}
  //       </div>

  //       <div className="summary-grid-bottom" style={{ marginBottom: "0px" }}>
  //         {[...Array(2)].map((_, i) => (
  //           <div key={i} className="chart-card" style={{ height: "300px" }}>
  //             <div
  //               className="skeleton-text"
  //               style={{
  //                 width: "200px",
  //                 height: "20px",
  //                 marginBottom: "20px",
  //               }}
  //             />
  //             <div
  //               style={{
  //                 display: "flex",
  //                 gap: "10px",
  //                 alignItems: "flex-end",
  //                 height: "200px",
  //               }}
  //             >
  //               {[...Array(6)].map((_, j) => (
  //                 <div
  //                   key={j}
  //                   className="skeleton-item"
  //                   style={{ flex: 1, height: `${Math.random() * 100}%` }}
  //                 />
  //               ))}
  //             </div>
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   );

  return (
    <div className="summary-container animate-pulse">
      {/* Grid Atas: 3 Card */}
      <div className="content-three-grid">
        {/* Card 1: Circle Indicators */}
        <div className="chart-card" style={{ height: "300px" }}>
          <div
            className="skeleton-text"
            style={{ width: "150px", height: "20px", marginBottom: "30px" }}
          />
          <div
            style={{
              display: "flex",
              gap: "80px",
              justifyContent: "center",
            }}
          >
            {[...Array(2)].map((_, j) => (
              //   <div
              //     key={j}
              //     className="skeleton-item"
              //     style={{
              //       width: "100px",
              //       height: "100px",
              //       borderRadius: "50%",
              //     }}
              //   />
              <div
                key={j}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <div
                  //   className="skeleton-item"
                  className="skeleton-donut"
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                  }}
                />
                <div
                  className="skeleton-text"
                  style={{
                    width: "100px",
                    height: "18px",
                    borderRadius: "4px",
                  }}
                />
              </div>
            ))}
          </div>
          <div
            className="skeleton-text"
            style={{
              width: "100%",
              height: "30px",
              marginTop: "50px",
              borderRadius: "30px",
            }}
          />
        </div>

        {/* Card 2: Donut Chart */}
        <div className="chart-card" style={{ height: "300px" }}>
          <div
            className="skeleton-text"
            style={{ width: "230px", height: "20px", marginBottom: "25px" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
            <div
              //   className="skeleton-item"
              className="skeleton-donut"
              style={{ width: "120px", height: "120px", borderRadius: "50%" }}
            />
            {/* <div style={{ flex: 1 }}>
              {[...Array(5)].map((_, j) => (
                <div
                  key={j}
                  className="skeleton-text"
                  style={{
                    width: "80%",
                    height: "12px",
                    marginBottom: "10px",
                  }}
                />
              ))}
            </div> */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {[...Array(5)].map((_, j) => (
                <div
                  key={j}
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  {/* Indikator warna kecil */}
                  <div
                    className="skeleton-item"
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                    }}
                  />
                  {/* Teks label status */}
                  <div
                    className="skeleton-text"
                    style={{
                      width: "70%",
                      height: "12px",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Horizontal Bars */}
        {/* <div className="chart-card" style={{ height: "300px" }}>
          <div
            className="skeleton-text"
            style={{ width: "150px", height: "20px", marginBottom: "20px" }}
          />
          {[...Array(5)].map((_, j) => (
            <div
              key={j}
              style={{ display: "flex", gap: "10px", marginBottom: "15px" }}
            >
              <div
                className="skeleton-text"
                style={{ width: "60px", height: "15px" }}
              />
              <div
                className="skeleton-item"
                style={{ flex: 1, height: "15px", borderRadius: "4px" }}
              />
            </div>
          ))}
        </div> */}

        <div className="chart-card" style={{ height: "300px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div
              className="skeleton-text"
              style={{ width: "140px", height: "18px" }}
            />
            <div
              className="skeleton-text"
              style={{ width: "80px", height: "18px", borderRadius: "15px" }}
            />
          </div>
          {[...Array(5)].map((_, j) => (
            <div
              key={j}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "15px",
              }}
            >
              <div
                className="skeleton-text"
                style={{ width: "90px", height: "15px" }}
              />
              <div
                className="skeleton-item"
                style={{
                  flex: 1,
                  height: "20px",
                  borderRadius: "6px",
                  width: j === 4 ? "100%" : "80%",
                }}
              />
            </div>
          ))}
          <div
            className="skeleton-text"
            style={{
              width: "100%",
              height: "40px",
              marginTop: "20px",
              borderRadius: "8px",
            }}
          />
        </div>
      </div>

      {/* Grid Bawah: 2 Card */}
      <div className="summary-grid-bottom">
        {/* Card 4: Trend Chart */}
        <div className="chart-card" style={{ height: "300px" }}>
          <div
            className="skeleton-text"
            style={{ width: "300px", height: "20px", marginBottom: "20px" }}
          />
          <div
            style={{
              display: "flex",
              gap: "15px",
              alignItems: "flex-end",
              height: "200px",
            }}
          >
            {[...Array(6)].map((_, j) => (
              //   <div
              //     key={j}
              //     className="skeleton-item"
              //     style={{ flex: 1, height: `${40 + Math.random() * 50}%` }}
              //   />
              <div
                key={j}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  className="skeleton-item"
                  style={{
                    width: "100%",
                    height: `${50 + Math.random() * 40}%`,
                    borderRadius: "8px 8px 0 0",
                  }}
                />
                <div
                  className="skeleton-text"
                  style={{ width: "40px", height: "10px" }}
                />
                <div
                  className="skeleton-text"
                  style={{ width: "30px", height: "10px" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Vertical Bars */}
        <div
          className="chart-card"
          style={{
            height: "300px",
            display: "flex",
            flexDirection: "column",
            padding: "20px",
          }}
        >
          <div
            className="skeleton-text"
            style={{
              width: "200px",
              height: "20px",
              marginBottom: "20px",
              flexShrink: 0,
              display: "block",
            }}
          />
          <div style={{ flex: 1 }}>
            {[...Array(7)].map((_, j) => (
              <div
                key={j}
                style={{
                  display: "flex",
                  alignItems: "center",
                  //   gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <div
                  className="skeleton-text"
                  style={{ width: "50px", height: "15px", marginRight: "10px" }}
                />
                <div
                  className="skeleton-item"
                  style={{ flex: 1, height: "16px", borderRadius: "5px" }}
                />
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: "15px",
              //   marginTop: "10px",
              justifyContent: "flex-end",
            }}
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <div
                  className="skeleton-item"
                  style={{ width: "10px", height: "10px", borderRadius: "50%" }}
                />
                <div
                  className="skeleton-text"
                  style={{ width: "40px", height: "10px" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SkeletonKalender = () => {
  return (
    <div className="calendar-container animate-pulse">
      <div className="calendar-header" style={{ marginBottom: "20px" }}>
        <div
          className="calendar-month-nav"
          style={{ justifyContent: "center", gap: "20px" }}
        >
          <div
            className="pagination-arrow"
            style={{ background: "#e5e7eb", width: "30px", height: "30px" }}
          />
          <div
            style={{
              background: "#e5e7eb",
              width: "150px",
              height: "20px",
              borderRadius: "4px",
            }}
          />
          <div
            className="pagination-arrow"
            style={{ background: "#e5e7eb", width: "30px", height: "30px" }}
          />
        </div>
      </div>

      <div className="calendar-grid">
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
          <div
            key={day}
            className="day-name"
            style={{ background: "#f3f4f6", height: "25px" }}
          />
        ))}
        {Array.from({ length: 35 }).map((_, idx) => (
          <div
            key={idx}
            className="day-cell"
            style={{
              background: "#f9fafb",
              border: "1px solid #f3f4f6",
              minHeight: "80px",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              className="skeleton-text"
              style={{ width: "20px", height: "16px", borderRadius: "2px" }}
            />
            {/* <div
              className="skeleton-item"
              style={{ width: "10px", height: "10px", borderRadius: "50%" }}
            /> */}
          </div>
        ))}
      </div>

      <div
        className="calendar-legend-mini"
        style={{
          marginTop: "20px",
          display: "flex",
          gap: "15px",
          justifyContent: "start",
        }}
      >
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <div
              className="dot"
              style={{
                background: "#e5e7eb",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
              }}
            />
            <div
              style={{
                background: "#e5e7eb",
                width: "60px",
                height: "10px",
                borderRadius: "5px",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const SkeletonRiwayat = () => {
  return (
    <div className="history-container animate-pulse">
      <div className="history-header" style={{ marginBottom: "20px" }}>
        <div
          style={{
            width: "200px",
            height: "24px",
            background: "#e5e7eb",
            borderRadius: "4px",
            marginBottom: "15px",
          }}
        />
        <div
          className="header-filter-wrapper"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
          }}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <div
              style={{
                width: "100px",
                height: "35px",
                background: "#f3f4f6",
                borderRadius: "8px",
              }}
            />
            <div
              style={{
                width: "100px",
                height: "35px",
                background: "#f3f4f6",
                borderRadius: "8px",
              }}
            />
          </div>
          <div
            className="history-filters"
            style={{ display: "flex", gap: "10px" }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: "80px",
                  height: "25px",
                  background: "#f3f4f6",
                  borderRadius: "20px",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="table-content-wrapper">
        <div
          className="content-table"
          style={{
            background: "#fff",
            border: "1px solid #f3f4f6",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(9, 1fr)",
              padding: "15px",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: "15px",
                  background: "#e5e7eb",
                  borderRadius: "4px",
                  margin: "0 5px",
                }}
              />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(9, 1fr)",
                padding: "20px 15px",
                borderBottom: "1px solid #f9fafb",
              }}
            >
              {Array.from({ length: 9 }).map((_, j) => (
                <div
                  key={j}
                  style={{
                    height: "12px",
                    background: "#f9fafb",
                    borderRadius: "4px",
                    margin: "0 5px",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div
        className="history-footer"
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            width: "150px",
            height: "15px",
            background: "#e5e7eb",
            borderRadius: "4px",
          }}
        />
        <div
          style={{
            width: "120px",
            height: "30px",
            background: "#e5e7eb",
            borderRadius: "6px",
          }}
        />
      </div>
    </div>
  );
};

{
  /* <div className="calendar-grid">
              {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
                <div key={day} className="day-name">
                  {day}
                </div>
              ))}
              {/* Baris Kosong Awal Bulan (Contoh: Januari dimulai Rabu) 
              <div className="day-cell empty"></div>
              <div className="day-cell empty"></div>
              {/* Tanggal 1 - 31 
              {Array.from({ length: 31 }, (_, i) => {
                const date = i + 1;
                // Contoh logika penentuan status untuk demo
                let statusClass = "normal";
                let checkIn = "06:55";
                if ([5, 12, 19, 26].includes(date)) statusClass = "holiday"; // Minggu
                if ([2, 15, 22].includes(date)) statusClass = "late";
                if ([6, 20].includes(date)) statusClass = "leave";
                if (date === 9) statusClass = "absent";
                if ([1, 3, 4, 7, 8, 10, 11].includes(date))
                  statusClass = "present";
                return (
                  <div
                    key={date}
                    className={`day-cell ${statusClass}`}
                    onClick={() => handleDateClick(date, statusClass, checkIn)}
                  >
                    <span className="date-num">{date}</span>
                    {statusClass !== "holiday" && statusClass !== "empty" && (
                      <div className="attendance-info">
                        <span className="time">
                          {statusClass === "present" || statusClass === "late"
                            ? checkIn
                            : "--:--"}
                        </span>
                        <span className="status-label">
                          {statusClass === "present" && "Hadir"}
                          {statusClass === "late" && "Telat"}
                          {statusClass === "leave" && "Izin"}
                          {statusClass === "absent" && "Alfa"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div> */
}
