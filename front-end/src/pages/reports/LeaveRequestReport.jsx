import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
// import axios from "axios";
import {
  FaFileExcel,
  FaCheckCircle,
  FaFilePdf,
  FaSort,
  FaCalendarCheck,
  FaHourglassHalf,
  FaTimesCircle,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaAngleRight,
  FaAngleLeft,
  FaEye,
  FaTimes,
} from "react-icons/fa";
import { formatDateIndo, formatTanggalLengkap } from "../../utils/dateHelper";
import Avatar from "../../assets/avatar-ungu.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import XLSX from "xlsx-js-style";
import axiosInstance from "../../api/axios.js";

const statusMap = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};
const colors = ["green", "blue", "red", "orange", "purple", "teal"];

const parseDateOnly = (value) => {
  const dateKey = String(value || "").slice(0, 10);

  return dateKey ? new Date(`${dateKey}T00:00:00`) : null;
};

const countOverlapDays = (startValue, endValue, rangeStart, rangeEnd) => {
  const start = parseDateOnly(startValue);
  const end = parseDateOnly(endValue);

  if (!start || !end) return 0;
  if (start > rangeEnd || end < rangeStart) return 0;

  const overlapStart = start > rangeStart ? start : rangeStart;

  const overlapEnd = end < rangeEnd ? end : rangeEnd;

  return (
    Math.floor(
      (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1
  );
};

const formatStatus = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "Menunggu";
    case "approved":
      return "Disetujui";
    case "rejected":
      return "Ditolak";
    case "cancelled":
      return "Dibatalkan";
    case "expired":
      return "Kedaluwarsa";
    default:
      return status;
  }
};

// const quotaData = [
//   {
//     fullName: "Andi Pratama",
//     nip: "NIP-2019-001",
//     dept: "Teknologi Informasi",
//     total: 12,
//     used: 3,
//     remaining: 9,
//     percent: 25,
//   },
//   {
//     fullName: "Dewi Lestari",
//     nip: "NIP-2021-023",
//     dept: "SDM",
//     total: 90,
//     used: 90,
//     remaining: 0,
//     percent: 100,
//   },
// ];

const LeaveRequestReport = () => {
  //   const token = localStorage.getItem("token");
  const [request, setRequest] = useState([]);
  const [quotaData, setQuotaData] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [types, setTypes] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().substring(0, 7),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("semua");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [sort, setSort] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sort.key === key && sort.direction === "asc") {
      direction = "desc";
    }
    setSort({ key, direction });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      //   const [leaveRes, typesRes] = await Promise.all([
      //     axios.get(`http://localhost:3000/leave-requests`, {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get(`http://localhost:3000/leavetypes`, {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //   ]);

      const [leaveRes, typesRes] = await Promise.all([
        axiosInstance.get(`/leave-requests`),
        axiosInstance.get(`/leavetypes`),
      ]);
      setRequest(leaveRes.data.data || []);
      setTypes(typesRes.data.data || []);
    } catch (e) {
      console.error("Gagal mengambil data pengajuan", e);
      setRequest([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id) => {
    try {
      //   const res = await axios.get(`http://localhost:3000/leave-requests/${id}`, {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      const res = await axiosInstance.get(`/leave-requests/${id}`);
      setSelectedRequest(res.data.data || []);
      setShowModal(true);
    } catch (error) {
      console.log("Gagal mengambil detail", error);
    }
  };

  // Ringkasan kuota
  useEffect(() => {
    const fetchQuotas = async () => {
      try {
        setLoading(true);
        // const response = await axios.get("http://localhost:3000/leavequota", {
        //   headers: { Authorization: `Bearer ${token}` },
        // });

        const response = await axiosInstance.get("/leavequota");
        const rawQuota = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        // const formattedData = response.data.data.map((item) => ({
        const formattedData = rawQuota.map((item) => {
          const total = Number(item.total) || 0;
          const used = Number(item.used) || 0;
          const remainingValue = Number(item.remaining);
          return {
            ...item,
            titlePrefix: item.user?.titlePrefix,
            fullName: item.user?.fullName,
            titleSuffix: item.user?.titleSuffix,
            nip: item.user?.nip,
            avatarUrl: item.user?.profilePhoto,
            //   profession: item.user?.profession?.name,
            //   position: item.user?.position?.name,
            //   division: item.user?.position?.division?.name,
            //   department: item.user?.position?.division?.department?.name,
            profession: item.user?.profession,
            position: item.user?.position,
            division: item.user?.division,
            department: item.user?.department,
            percent: Math.round((item.used / item.total) * 100),
            total,
            used,
            remaining: Number.isFinite(remainingValue)
              ? remainingValue
              : Math.max(total - used, 0),
          };
        });

        setQuotaData(formattedData);
      } catch (error) {
        console.error("Gagal ambil data", error);
        setQuotaData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotas();
  }, []);

  const displayedQuotaData = useMemo(() => {
    if (!selectedPeriod) return [];

    const [year, month] = selectedPeriod.split("-").map(Number);

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    monthStart.setHours(0, 0, 0, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const yearStart = new Date(year, 0, 1);
    yearStart.setHours(0, 0, 0, 0);

    return quotaData.map((quota) => {
      const quotaUserId = Number(quota.userId ?? quota.user?.id);

      const approvedCuti = request.filter((leaveRequest) => {
        const requestUserId = Number(
          leaveRequest.userId ?? leaveRequest.user?.id,
        );

        const typeName = String(
          leaveRequest.leavetype?.name ??
            leaveRequest.leavesubtype?.leavetype?.name ??
            "",
        ).toLowerCase();

        return (
          requestUserId === quotaUserId &&
          leaveRequest.status?.toLowerCase() === "approved" &&
          typeName.includes("cuti")
        );
      });

      const usedThisMonth = approvedCuti.reduce(
        (total, leaveRequest) =>
          total +
          countOverlapDays(
            leaveRequest.startDate,
            leaveRequest.endDate,
            monthStart,
            monthEnd,
          ),
        0,
      );

      /*
       * Digunakan untuk menghitung sisa kuota
       * sampai akhir bulan yang dipilih.
       */
      const usedUntilSelectedMonth = approvedCuti.reduce(
        (total, leaveRequest) =>
          total +
          countOverlapDays(
            leaveRequest.startDate,
            leaveRequest.endDate,
            yearStart,
            monthEnd,
          ),
        0,
      );

      const totalQuota = Number(quota.total) || 0;

      const percentage =
        totalQuota > 0
          ? Math.min(
              100,
              Math.round((usedUntilSelectedMonth / totalQuota) * 100),
            )
          : 0;

      return {
        ...quota,

        // Terpakai pada bulan yang dipilih
        used: usedThisMonth,

        // Terpakai sejak Januari sampai bulan pilihan
        usedCumulative: usedUntilSelectedMonth,

        remaining: Math.max(totalQuota - usedUntilSelectedMonth, 0),

        percent: percentage,
      };
    });
  }, [quotaData, request, selectedPeriod]);

  const filteredData = useMemo(() => {
    return request.filter((item) => {
      const name = item.user?.name?.toLowerCase() || "";
      const matchesSearch = name.includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === "semua" || item.leavetype?.name === filterType;
      const matchesStatus =
        filterStatus === "semua" || statusMap[item.status] === filterStatus;

      const itemDate = new Date(item.createdAt);
      const itemMonth = itemDate.toISOString().substring(0, 7);
      const matchesMonth = !selectedPeriod || itemMonth === selectedPeriod;

      return matchesSearch && matchesType && matchesStatus && matchesMonth;
    });
  }, [request, searchTerm, filterType, filterStatus, selectedPeriod]);

  // Pengajuan Per Unit
  //   const functionDistribution = useMemo(() => {
  //     const map = {};
  //     request.forEach((item) => {
  //       const func = item.user?.position?.division?.name || "-";
  //       map[func] = (map[func] || 0) + 1;
  //     });
  //     return Object.entries(map).map(([name, total]) => ({
  //       name,
  //       total,
  //     }));
  //   }, [request]);
  const functionDistribution = useMemo(() => {
    const map = {};
    filteredData.forEach((item) => {
      const func = item.user?.position?.division?.name || "-";
      map[func] = (map[func] || 0) + 1;
    });

    return Object.entries(map).map(([name, total]) => ({ name, total }));
  }, [filteredData]);

  const totalFunction = functionDistribution.reduce(
    (sum, item) => sum + item.total,
    0,
  );

  // Distribusi Sub Jenis Pengajuan
  //   const subTypeDistribution = useMemo(() => {
  //     const map = {};
  //     request.forEach((item) => {
  //       const sub = item.leavesubtype?.name || "-";
  //       map[sub] = (map[sub] || 0) + 1;
  //     });
  //     return Object.entries(map).map(([name, total]) => ({
  //       name,
  //       total,
  //     }));
  //   }, [request]);
  //   const subTypeDistribution = useMemo(() => {
  //     const map = {};
  //     request.forEach((item) => {
  //       const subName = item.leavesubtype?.name || "Lainnya";
  //       const typeName =
  //         item.leavesubtype?.leavetype?.name ||
  //         item.leavetype?.name ||
  //         "Tidak Terdefinisi";
  //       const fullDisplayName =
  //         subName !== "Lainnya" ? `${typeName} - ${subName}` : "Lainnya";
  //       if (!map[fullDisplayName]) {
  //         map[fullDisplayName] = {
  //           //   name: fullDisplayName,
  //           name: subName,
  //           typeName: typeName,
  //           subName: subName,
  //           total: 0,
  //         };
  //       }
  //       map[fullDisplayName].total += 1;
  //     });
  //     return Object.values(map);
  //   }, [request]);
  const subTypeDistribution = useMemo(() => {
    const map = {};
    filteredData.forEach((item) => {
      const subName = item.leavesubtype?.name || "Lainnya";
      const typeName =
        item.leavesubtype?.leavetype?.name ||
        item.leavetype?.name ||
        "Tidak Terdefinisi";
      const fullDisplayName =
        subName !== "Lainnya" ? `${typeName} - ${subName}` : "Lainnya";

      if (!map[fullDisplayName]) {
        map[fullDisplayName] = {
          //   name: fullDisplayName,
          name: subName,
          typeName: typeName,
          subName: subName,
          total: 0,
        };
      }
      map[fullDisplayName].total += 1;
    });
    return Object.values(map);
  }, [filteredData]);

  // Tingkat Persetujuan
  //   const approvalStats = useMemo(() => {
  //     const total = request.length;
  //     const approved = request.filter((r) => r.status === "approved").length;
  //     const rejected = request.filter((r) => r.status === "rejected").length;
  //     const pending = request.filter((r) => r.status === "pending").length;
  //     return {
  //       approved,
  //       rejected,
  //       pending,
  //       approvedPercent: total ? ((approved / total) * 100).toFixed(0) : 0,
  //       rejectedPercent: total ? ((rejected / total) * 100).toFixed(0) : 0,
  //       pendingPercent: total ? ((pending / total) * 100).toFixed(0) : 0,
  //     };
  //   }, [request]);
  const approvalStats = useMemo(() => {
    const total = filteredData.length;
    const approved = filteredData.filter((r) => r.status === "approved").length;
    const rejected = filteredData.filter((r) => r.status === "rejected").length;
    const pending = filteredData.filter((r) => r.status === "pending").length;

    return {
      approved,
      rejected,
      pending,
      approvedPercent: total ? ((approved / total) * 100).toFixed(0) : 0,
      rejectedPercent: total ? ((rejected / total) * 100).toFixed(0) : 0,
      pendingPercent: total ? ((pending / total) * 100).toFixed(0) : 0,
    };
  }, [filteredData]);

  // Tren Pengajuan Bulanan
  //   const monthlyTrend = useMemo(() => {
  //     const now = new Date();
  //     const months = [];
  //     const map = {};
  //     for (let i = 5; i >= 0; i--) {
  //       const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
  //       const monthName = d.toLocaleString("id-ID", {
  //         month: "short",
  //       });
  //       const key = `${d.getFullYear()}-${d.getMonth()}`;
  //       months.push({ label: monthName, key });
  //       map[key] = 0;
  //     }
  //     request.forEach((item) => {
  //       const date = new Date(item.createdAt);
  //       const key = `${date.getFullYear()}-${date.getMonth()}`;
  //       if (map[key] !== undefined) {
  //         map[key] += 1;
  //       }
  //     });
  //     return months.map((m) => ({
  //       month: m.label,
  //       total: map[m.key],
  //     }));
  //   }, [request]);
  const monthlyTrend = useMemo(() => {
    const map = {};
    const selectedDate = new Date(selectedPeriod + "-01");

    for (let i = 5; i >= 0; i--) {
      const d = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() - i,
        1,
      );
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleString("id-ID", { month: "short" });
      map[key] = { label, total: 0 };
    }

    request.forEach((item) => {
      const d = new Date(item.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;

      if (map[key]) {
        map[key].total += 1;
      }
    });

    return Object.values(map).map((m) => ({
      month: m.label,
      total: m.total,
    }));
  }, [request, selectedPeriod]);

  const maxTrend = Math.max(...monthlyTrend.map((m) => m.total), 1);

  const sortedData = useMemo(() => {
    const data = [...filteredData];
    return data.sort((a, b) => {
      let aValue, bValue;

      if (sort.key === "nama") aValue = a.user?.name;
      else if (sort.key === "jenis") aValue = a.leavetype?.name;
      else aValue = a[sort.key];

      if (sort.key === "nama") bValue = b.user?.name;
      else if (sort.key === "jenis") bValue = b.leavetype?.name;
      else bValue = b[sort.key];

      if (aValue < bValue) return sort.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sort]);

  //   const stats = useMemo(() => {
  //     return {
  //       total: request.length,
  //       pending: request.filter((r) => statusMap[r.status] === "Menunggu").length,
  //       approved: request.filter((r) => statusMap[r.status] === "Disetujui")
  //         .length,
  //       rejected: request.filter((r) => statusMap[r.status] === "Ditolak").length,
  //       cancelled: request.filter((r) => statusMap[r.status] === "Dibatalkan")
  //         .length,
  //       expired: request.filter((r) => statusMap[r.status] === "Kedaluwarsa")
  //         .length,
  //     };
  //   }, [request]);
  const stats = useMemo(() => {
    return {
      total: filteredData.length,

      pending: filteredData.filter(
        (item) => statusMap[item.status] === "Menunggu",
      ).length,

      approved: filteredData.filter(
        (item) => statusMap[item.status] === "Disetujui",
      ).length,

      rejected: filteredData.filter(
        (item) => statusMap[item.status] === "Ditolak",
      ).length,

      cancelled: filteredData.filter(
        (item) => statusMap[item.status] === "Dibatalkan",
      ).length,

      expired: filteredData.filter(
        (item) => statusMap[item.status] === "Kedaluwarsa",
      ).length,
    };
  }, [filteredData]);

  const summaryStats = useMemo(() => {
    // const now = new Date();
    // const currentMonth = now.getMonth();
    // const currentYear = now.getFullYear();

    const [selectedYear, selectedMonth] = selectedPeriod.split("-").map(Number);
    const previousDate = new Date(selectedYear, selectedMonth - 2, 1);
    const previousPeriod = `${previousDate.getFullYear()}-${String(
      previousDate.getMonth() + 1,
    ).padStart(2, "0")}`;

    const getMonthKey = (dateString) => String(dateString || "").slice(0, 7);

    const isCurrentMonth = (dateString) =>
      getMonthKey(dateString) === selectedPeriod;

    const isLastMonth = (dateString) =>
      getMonthKey(dateString) === previousPeriod;

    // const isCurrentMonth = (dateString) => {
    //   if (!dateString) return false;
    //   const d = new Date(dateString);
    //   return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    // };

    // const isLastMonth = (dateString) => {
    //   if (!dateString) return false;
    //   const d = new Date(dateString);
    //   const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    //   return (
    //     d.getMonth() === lastMonthDate.getMonth() &&
    //     d.getFullYear() === lastMonthDate.getFullYear()
    //   );
    // };

    const calculateDays = (start, end) => {
      if (!start || !end) return 0;
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = Math.abs(e - s);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const current = {
      days: 0,
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cuti: 0,
      izin: 0,
      dinas: 0,
    };
    const previous = {
      days: 0,
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cuti: 0,
      izin: 0,
      dinas: 0,
    };

    request.forEach((item) => {
      const isCurr = isCurrentMonth(item.createdAt);
      const isPrev = isLastMonth(item.createdAt);

      if (!isCurr && !isPrev) return;
      const target = isCurr ? current : previous;
      target.total += 1;
      target.days += calculateDays(item.startDate, item.endDate);

      const status = (item.status || "").toLowerCase();
      if (status === "pending") target.pending += 1;
      else if (status === "approved") target.approved += 1;
      else if (status === "rejected") target.rejected += 1;

      const typeName = (
        item.leavetype?.name ||
        item.leavetype?.name ||
        ""
      ).toLowerCase();
      if (typeName.includes("cuti")) target.cuti += 1;
      else if (typeName.includes("izin")) target.izin += 1;
      else if (typeName.includes("dinas")) target.dinas += 1;
    });

    const calcGrowth = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return (((curr - prev) / prev) * 100).toFixed(1);
    };

    return {
      days: {
        value: current.days,
        growth: calcGrowth(current.days, previous.days),
      },
      totalReq: {
        value: current.total,
        growth: calcGrowth(current.total, previous.total),
      },
      statusCount: {
        value: `${current.pending}/${current.approved}/${current.rejected}`,
        growth: calcGrowth(current.total, previous.total),
      },
      typeCount: {
        value: `${current.cuti}/${current.izin}/${current.dinas}`,
        growth: calcGrowth(current.total, previous.total),
      },
    };
  }, [request, selectedPeriod]);

  const RenderGrowth = ({ value }) => {
    const numValue = parseFloat(value);

    if (isNaN(numValue) || numValue === 0) {
      return (
        <span
          className="stat-text-dash gray"
          style={{ color: "gray", fontWeight: "bold" }}
        >
          <span style={{ marginRight: "4px" }}>-</span> 0%
        </span>
      );
    }
    const isPositive = numValue > 0;
    return (
      <span className={`stat-text-dash ${isPositive ? "green" : "red"}`}>
        {isPositive ? <FaArrowUp /> : <FaArrowDown />} {Math.abs(numValue)}%
      </span>
    );
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleExportPdf = async () => {
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

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("RUMAH SAKIT BHAYANGKARA TK. III INDRAMAYU", 105, 10, {
      align: "center",
    });

    doc.setFontSize(12);
    doc.text(
      `LAPORAN PENGAJUAN CUTI & IZIN ${monthName.toUpperCase()}`,
      105,
      18,
      {
        align: "center",
      },
    );

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Tanggal Cetak: ${today}`, 14, 25);

    let currentY = 32;

    doc.setFont("helvetica", "bold");
    doc.text("DETAIL PENGAJUAN KARYAWAN", 14, currentY);
    currentY += 0;

    const tableLeaves = [
      "No",
      "Nama",
      "Jenis",
      "Sub Jenis",
      "Tanggal Mulai",
      "Tanggal Selesai",
      "Durasi",
      "Status",
    ];

    const tableRows = sortedData.map((item, index) => {
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);
      const durasi = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      const employeeName =
        [item.user?.titlePrefix, item.user?.fullName]
          .filter(Boolean)
          .join(" ") || "-";

      return [
        index + 1,
        employeeName || "-",
        item.leavetype?.name || "-",
        item.leavesubtype?.name || "-",
        formatDateIndo(item.startDate),
        formatDateIndo(item.endDate),
        `${durasi} hari`,
        formatStatus(item.status),
      ];
    });

    autoTable(doc, {
      head: [tableLeaves],
      body: tableRows,
      startY: currentY + 2,
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      // warna header tabel
      //   headStyles: {
      //     fillColor: [22, 160, 133],
      //   },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN STATUS PENGAJUAN", 14, currentY);

    const summaryData = [
      ["Total Pengajuan", stats.total],
      ["Menunggu", stats.pending],
      ["Disetujui", stats.approved],
      ["Ditolak", stats.rejected],
      ["Dibatalkan", stats.cancelled],
      ["Kedaluwarsa", stats.expired],
    ];

    autoTable(doc, {
      head: [["Keterangan", "Jumlah"]],
      body: summaryData,
      startY: currentY + 2,
      styles: { fontSize: 10 },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN KUOTA CUTI KARYAWAN", 14, currentY);

    // const quotaTable = quotaData.map((item, index) => [
    const quotaTable = displayedQuotaData.map((item, index) => [
      index + 1,
      item.fullName || "-",
      item.department || "-",
      item.total || 0,
      item.used || 0,
      item.remaining || 0,
      `${item.percent || 0}%`,
    ]);

    autoTable(doc, {
      head: [
        [
          "No",
          "Nama",
          "Fungsi",
          "Total Kuota",
          "Terpakai",
          "Sisa",
          "Penggunaan",
        ],
      ],
      body: quotaTable,
      startY: currentY + 2,
      styles: { fontSize: 9 },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("PENGAJUAN PER UNIT", 14, currentY);

    const functionTable = functionDistribution.map((item, index) => [
      index + 1,
      item.name,
      item.total,
    ]);

    autoTable(doc, {
      head: [["No", "Nama Unit", "Jumlah Penggunaan"]],
      body: functionTable,
      startY: currentY + 2,
      styles: { fontSize: 10 },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("DISTRIBUSI SUB JENIS PENGAJUAN", 14, currentY);

    const subTypeTable = subTypeDistribution.map((item, index) => [
      index + 1,
      item.typeName || "-",
      item.subName || "-",
      item.total || 0,
    ]);

    autoTable(doc, {
      head: [
        [
          "No",
          "Nama Jenis Pengajuan",
          "Nama Sub Jenis Pengajuan",
          "Total Penggunaan",
        ],
      ],
      body: subTypeTable,
      startY: currentY + 2,
      styles: { fontSize: 9 },
    });

    currentY = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("TINGKAT PERSETUJUAN", 14, currentY);

    const approvalTable = [
      [
        "Disetujui",
        approvalStats.approved,
        `${approvalStats.approvedPercent}%`,
      ],
      ["Menunggu", approvalStats.pending, `${approvalStats.pendingPercent}%`],
      ["Ditolak", approvalStats.rejected, `${approvalStats.rejectedPercent}%`],
    ];

    autoTable(doc, {
      head: [["Status", "Jumlah", "Persentase"]],
      body: approvalTable,
      startY: currentY + 2,
      styles: { fontSize: 10 },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("TREN PENGAJUAN BULANAN", 14, currentY);

    const maxTrend = Math.max(...monthlyTrend.map((m) => m.total), 1);

    const trendTable = monthlyTrend.map((item) => [
      item.month,
      item.total,
      `${((item.total / maxTrend) * 100).toFixed(0)}%`,
    ]);

    autoTable(doc, {
      head: [["Nama Bulan", "Jumlah", "Persentase"]],
      body: trendTable,
      startY: currentY + 2,
      styles: { fontSize: 10 },
    });
    doc.save(`Laporan_Pengajuan_${monthName}.pdf`);

    const fileName = `Laporan_Pengajuan_${monthName}.pdf`;
    const pdfBlob = doc.output("blob");
    const formData = new FormData();
    formData.append("file", pdfBlob, fileName);
    formData.append("reportName", `Laporan Pengajuan ${monthName}`);
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
      console.error("Gagal menyimpan riwayat laporan pengajuan", e);
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
      [`LAPORAN PENGAJUAN CUTI & IZIN ${monthName.toUpperCase()}`],
      [`Tanggal Cetak: ${today}`],
      [],

      ["DETAIL PENGAJUAN KARYAWAN"],
      [
        "No",
        "Nama",
        "Jenis",
        "Sub Jenis",
        "Tanggal Mulai",
        "Tanggal Selesai",
        "Durasi",
        "Status",
      ],
      ...sortedData.map((item, i) => {
        const start = new Date(item.startDate);
        const end = new Date(item.endDate);
        const durasi = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        const employeeName =
          [item.user?.titlePrefix, item.user?.fullName]
            .filter(Boolean)
            .join(" ") || "-";

        return [
          i + 1,
          employeeName,
          item.leavetype?.name || "-",
          item.leavesubtype?.name || "-",
          formatDateIndo(item.startDate),
          formatDateIndo(item.endDate),
          `${durasi} hari`,
          formatStatus(item.status),
        ];
      }),

      [],
      ["RINGKASAN STATUS PENGAJUAN"],
      ["Keterangan", "Jumlah"],
      ["Total Pengajuan", stats.total],
      ["Menunggu", stats.pending],
      ["Disetujui", stats.approved],
      ["Ditolak", stats.rejected],
      ["Dibatalkan", stats.cancelled],
      ["Kedaluwarsa", stats.expired],

      [],
      ["RINGKASAN KUOTA CUTI KARYAWAN"],
      ["No", "Nama", "Fungsi", "Total Kuota", "Terpakai", "Sisa", "Penggunaan"],
      //   ...quotaData.map((item, i) => [
      ...displayedQuotaData.map((item, i) => [
        i + 1,
        item.fullName || "-",
        item.dept || "-",
        item.total || 0,
        item.used || 0,
        item.remaining || 0,
        `${item.percent || 0}%`,
      ]),

      [],
      ["PENGAJUAN PER UNIT"],
      ["No", "Nama Unit", "Jumlah Penggunaan"],
      ...functionDistribution.map((item, i) => [i + 1, item.name, item.total]),

      [],
      ["DISTRIBUSI SUB JENIS PENGAJUAN"],
      ["No", "Nama Jenis", "Nama Sub Jenis", "Total Penggunaan"],
      ...subTypeDistribution.map((item, i) => [
        i + 1,
        item.typeName || "-",
        item.subName || "-",
        item.total || 0,
      ]),

      [],
      ["TINGKAT PERSETUJUAN"],
      ["Status", "Jumlah", "Persentase"],
      [
        "Disetujui",
        approvalStats.approved,
        `${approvalStats.approvedPercent}%`,
      ],
      ["Menunggu", approvalStats.pending, `${approvalStats.pendingPercent}%`],
      ["Ditolak", approvalStats.rejected, `${approvalStats.rejectedPercent}%`],

      [],
      ["TREN PENGAJUAN BULANAN"],
      ["Bulan", "Jumlah", "Persentase"],
      ...monthlyTrend.map((item) => {
        const maxTrend = Math.max(...monthlyTrend.map((m) => m.total), 1);
        return [
          item.month,
          item.total,
          `${((item.total / maxTrend) * 100).toFixed(0)}%`,
        ];
      }),
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
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
    ];

    const headerRows = [];
    sheetData.forEach((row, idx) => {
      if (!Array.isArray(row)) return;
      const rowString = row.map((cell) => String(cell).toLowerCase());
      const isHeader = rowString.some(
        (cell) =>
          rowString.includes("nama") ||
          rowString.includes("nama unit") ||
          rowString.includes("nama jenis") ||
          rowString.includes("nama sub jenis") ||
          rowString.includes("keterangan") ||
          rowString.includes("status") ||
          rowString.includes("bulan"),
      );

      if (isHeader) {
        headerRows.push(idx);
      }
    });

    headerRows.forEach((r) => {
      for (let C = 0; C <= 7; C++) {
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
      const firstCell = String(row[0] || "");

      if (
        firstCell.includes("DATA PENGAJUAN") ||
        firstCell.includes("RINGKASAN STATUS PENGAJUAN") ||
        firstCell.includes("RINGKASAN KUOTA CUTI KARYAWAN") ||
        firstCell.includes("PENGAJUAN PER UNIT") ||
        firstCell.includes("DISTRIBUSI SUB JENIS PENGAJUAN") ||
        firstCell.includes("TINGKAT PERSETUJUAN") ||
        firstCell.includes("TREN PENGAJUAN BULANAN")
      ) {
        const cell = XLSX.utils.encode_cell({ r: idx, c: 0 });
        if (ws[cell]) {
          ws[cell].s = { font: { bold: true } };
        }
      }
    });

    ws["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `Laporan_Pengajuan_${monthName}.xlsx`);

    const fileName = `Laporan_Pengajuan_${monthName}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const excelBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const formData = new FormData();
    formData.append("file", excelBlob, fileName);
    formData.append("reportName", `Laporan Pengajuan ${monthName}`);
    formData.append("period", selectedPeriod);
    formData.append("status", "Selesai");
    formData.append("reportType", "XLSX");

    try {
      //   await axios.post("http://localhost:3000/history", formData, {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });

      await axiosInstance.post("/history", formData);
    } catch (e) {
      console.error("Gagal menyimpan riwayat laporan pengajuan", e);
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
                ></div>{" "}
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
                <span className="stat-label-dash">Total hari</span>
                <span className="stat-value-dash">
                  {summaryStats.days.value}
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={summaryStats.days.growth} /> dari bulan
                  lalu
                </div>
              </div>
              <div className="stat-icon-dash purple-light-dash">
                <FaCalendarCheck />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Pengajuan</span>
                <span className="stat-value-dash">
                  {summaryStats.totalReq.value}
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={summaryStats.totalReq.growth} /> dari
                  bulan lalu
                </div>
              </div>
              <div className="stat-icon-dash orange-light-dash">
                <FaHourglassHalf />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">
                  Menunggu/Disetujui/Ditolak
                </span>
                <span className="stat-value-dash">
                  {summaryStats.statusCount.value}
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={summaryStats.statusCount.growth} /> dari
                  bulan lalu
                </div>
              </div>
              <div className="stat-icon-dash green-light-dash">
                <FaCheckCircle />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Cuti/Izin/Dinas Luar</span>
                <span className="stat-value-dash">
                  {summaryStats.typeCount.value}
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={summaryStats.typeCount.growth} /> dari
                  bulan lalu
                </div>
              </div>
              <div className="stat-icon-dash red-light-dash">
                <FaTimesCircle />
              </div>
            </div>
          </>
        )}
      </section>

      <div className="table-content-card">
        {loading ? (
          <>
            <div className="table-header-top">
              <div
                className="skeleton-text"
                style={{
                  width: "160px",
                  height: "24px",
                }}
              />
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
            </div>
            <div className="header-actions">
              <div className="search-wrapper">
                <div
                  className="search-input skeleton-text"
                  style={{ width: "100%", height: "38px", borderRadius: "8px" }}
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
              <h3>Daftar Pengajuan</h3>
              <div className="panel-actions-right">
                <input
                  type="month"
                  className="select-input"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                />
                <button className="button is-danger" onClick={handleExportPdf}>
                  <FaFilePdf /> PDF
                </button>
                <button
                  className="button is-success"
                  onClick={handleExportExcel}
                >
                  <FaFileExcel /> Excel
                </button>
              </div>
            </div>
            <div className="header-actions">
              <div className="search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari nama karyawan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-select-group">
                <select
                  className="select-input"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="semua">Semua Jenis</option>
                  {types.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <select
                  className="select-input"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="semua">Semua Status</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Ditolak">Ditolak</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                  <option value="Kedaluwarsa">Kedaluwarsa</option>
                </select>
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
                        Tanggal Pengajuan
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Nama
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Jenis
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Tanggal Mulai
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Tanggal Berakhir
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Durasi
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      <div className="qr-loading-box">
                        <div className="qr-spinner"></div>
                        <p className="qr-loading">Memuat data pengajuan...</p>
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
                      className={`sortable-header ${sort.key === "tanggal" ? "active-sort" : ""}`}
                      onClick={() => requestSort("tanggal")}
                    >
                      <div className="header-content">
                        Tanggal Pengajuan
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "nama" ? "active-sort" : ""}`}
                      onClick={() => requestSort("nama")}
                    >
                      <div className="header-content">
                        Nama
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "jenis" ? "active-sort" : ""}`}
                      onClick={() => requestSort("jenis")}
                    >
                      <div className="header-content">
                        Jenis
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "mulai" ? "active-sort" : ""}`}
                      onClick={() => requestSort("mulai")}
                    >
                      <div className="header-content">
                        Tanggal Mulai
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "akhir" ? "active-sort" : ""}`}
                      onClick={() => requestSort("akhir")}
                    >
                      <div className="header-content">
                        Tanggal Berakhir
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "durasi" ? "active-sort" : ""}`}
                      onClick={() => requestSort("durasi")}
                    >
                      <div className="header-content">
                        Durasi
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((req) => {
                      const start = new Date(req.startDate);
                      const end = new Date(req.endDate);
                      const durasi =
                        Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                      return (
                        <tr key={req.id}>
                          <td>{formatTanggalLengkap(req.createdAt)}</td>
                          {/* <td className="perf-name-cell">
                            <img
                              src={req.user?.avatarUrl || Avatar}
                              alt={req.user?.fullName}
                              className="staff-avatar"
                            />
                            <div className="user-info">
                              <div className="user-name">
                                {req.user?.fullName}
                              </div>
                              <div className="user-nip">{req.user?.nip}</div>
                            </div>
                          </td> */}
                          <td>
                            <div className="user-cell">
                              <img
                                src={req.user?.avatarUrl || Avatar}
                                alt={req.user?.fullName}
                                className="user-avatar"
                              />
                              <div className="user-info">
                                <span className="user-name">
                                  {[req.user?.titlePrefix, req.user?.fullName]
                                    .filter(Boolean)
                                    .join(" ") ?? "-"}
                                </span>
                                <span className="user-division">
                                  {req.user?.position?.name ?? "-"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ alignItems: "center" }}>
                            <span
                              className={`status-badge ${req.leavetype?.name.toLowerCase() === "izin" ? "izin" : req.leavetype?.name.toLowerCase() === "cuti" ? "cuti" : "dinas-luar"}`}
                            >
                              {req.leavetype?.name ?? "-"}
                            </span>
                          </td>
                          <td>{formatDateIndo(req.startDate)}</td>
                          <td>{formatDateIndo(req.endDate)}</td>
                          <td>{durasi ?? "-"} hari</td>
                          <td>
                            <span
                              className={`status-badge ${
                                req.status.toLowerCase() === "pending"
                                  ? "pending"
                                  : req.status.toLowerCase() === "approved"
                                    ? "approved"
                                    : req.status.toLowerCase() === "rejected"
                                      ? "rejected"
                                      : req.status.toLowerCase() === "cancelled"
                                        ? "cancelled"
                                        : "expired"
                              }`}
                            >
                              {formatStatus(req.status)}
                            </span>
                          </td>
                          <td>
                            <button
                              className="button is-warning"
                              onClick={() => openDetail(req.id)}
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center" }}>
                        <div className="no-data">
                          <h4 className="empty-title">Data tidak ditemukan</h4>
                          <p>Data pengajuan akan muncul di sini</p>
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

      <div className="table-content-card" style={{ marginTop: "25px" }}>
        <div className="table-header-top">
          {loading ? (
            <div
              className="skeleton-text"
              style={{
                width: "270px",
                height: "20px",
                marginBottom: "16px",
              }}
            />
          ) : (
            <h3>Ringkasan Kuota Cuti Karyawan</h3>
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
                        Nama
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Fungsi
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Total Kuota
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Terpakai
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Sisa
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>
                      <div className="header-content">
                        Penggunaan
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      <div className="qr-loading-box">
                        <div className="qr-spinner"></div>
                        <p className="qr-loading">Memuat data pengajuan...</p>
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
                      className={`sortable-header ${sort.key === "nama" ? "active-sort" : ""}`}
                      onClick={() => requestSort("nama")}
                    >
                      <div className="header-content">
                        Nama
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "jenis" ? "active-sort" : ""}`}
                      onClick={() => requestSort("jenis")}
                    >
                      <div className="header-content">
                        Fungsi
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "subJenis" ? "active-sort" : ""}`}
                      onClick={() => requestSort("subJenis")}
                    >
                      <div className="header-content">
                        Total Kuota
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "mulai" ? "active-sort" : ""}`}
                      onClick={() => requestSort("mulai")}
                    >
                      <div className="header-content">
                        Terpakai
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "akhir" ? "active-sort" : ""}`}
                      onClick={() => requestSort("akhir")}
                    >
                      <div className="header-content">
                        Sisa
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className={`sortable-header ${sort.key === "durasi" ? "active-sort" : ""}`}
                      onClick={() => requestSort("durasi")}
                    >
                      <div className="header-content">
                        Pernggunaan
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* {quotaData.length > 0 ? ( 
                   quotaData.map((req, i) => {*/}
                  {displayedQuotaData.length > 0 ? (
                    displayedQuotaData.map((req, i) => {
                      return (
                        <tr key={i}>
                          <td className="perf-name-cell">
                            <img
                              src={req.user?.avatarUrl || Avatar}
                              alt={req.user?.fullName}
                              className="staff-avatar"
                            />
                            <div className="user-info">
                              <div className="user-name">
                                {[req.titlePrefix, req.fullName].join(" ")}
                              </div>
                              <div className="user-nip">{req.nip}</div>
                            </div>
                          </td>
                          <td>
                            <span className="badge-text">{req.department}</span>
                          </td>
                          <td>{req.total}</td>
                          <td className="text-orange">
                            <strong>{req.used}</strong>
                          </td>
                          <td className="text-green">
                            <strong>{req.remaining}</strong>
                          </td>
                          <td>
                            {/* <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${req.percent}%`,
                                  backgroundColor:
                                    req.percent > 80 ? "#ef4444" : "#10b981",
                                }}
                              ></div>
                            </div>
                            <small>{req.percent}%</small> */}
                            <div className="progress-wrapper">
                              <div className="progress-container">
                                <div
                                  className="progress-bar-table"
                                  style={{
                                    width: `${req.percent}%`,
                                    backgroundColor:
                                      req.percent > 80 ? "#ef4444" : "#10b981",
                                  }}
                                ></div>
                              </div>
                              <span>{req.percent}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center" }}>
                        <div className="no-data">
                          <h4 className="empty-title">Data tidak ditemukan</h4>
                          <p>Data pengajuan akan muncul di sini</p>
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

      <div className="table-content-card" style={{ marginTop: "25px" }}>
        <div className="content-two-grid">
          <div
            className="content-card"
            style={{ marginBottom: "0px", border: "1px solid #efefef" }}
          >
            {loading ? (
              <>
                <div
                  className="skeleton-text"
                  style={{
                    width: "180px",
                    height: "20px",
                    marginBottom: "16px",
                  }}
                />
                <div className="loading-trend-container">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="dist-item loading-skeleton-animation"
                    >
                      <div
                        className="dist-label"
                        style={{ marginBottom: "8px" }}
                      >
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
              </>
            ) : (
              <>
                <h3>Pengajuan Per Fungsi</h3>
                {functionDistribution.map((item, index) => {
                  const percent = totalFunction
                    ? ((item.total / totalFunction) * 100).toFixed(0)
                    : 0;

                  return (
                    <div className="dist-item" key={index}>
                      <div className="dist-label">
                        <span>{item.name}</span>
                        <span>{item.total}</span>
                      </div>
                      <div className="progress-bg">
                        <div
                          className="progress-fill purple"
                          style={{
                            width: `${percent}%`,
                            transition: "width 0.8s ease-in-out",
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
          <div
            className="content-card"
            style={{ marginBottom: "0px", border: "1px solid #efefef" }}
          >
            {loading ? (
              <>
                <div
                  className="skeleton-text"
                  style={{
                    width: "240px",
                    height: "20px",
                    marginBottom: "16px",
                  }}
                />
                <ul className="dist-list">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
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
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h3>Distribusi Sub Jenis Pengajuan</h3>
                <ul className="dist-list">
                  <ul className="dist-list">
                    {subTypeDistribution.map((item, index) => (
                      <li className="legend-item" key={index}>
                        <span
                          className={`dot ${colors[index % colors.length]}`}
                        ></span>
                        {item.name} <span className="val">{item.total}</span>
                      </li>
                    ))}
                  </ul>
                </ul>
              </>
            )}
          </div>
        </div>
        <div className="content-two-grid" style={{ marginBottom: "0px" }}>
          <div
            className="content-card"
            style={{ marginBottom: "0px", border: "1px solid #efefef" }}
          >
            {loading ? (
              <>
                <div
                  className="skeleton-text"
                  style={{
                    width: "240px",
                    height: "20px",
                    marginBottom: "16px",
                  }}
                />
                <div className="circular-charts">
                  {[...Array(3)].map((_, i) => (
                    <div className="circle-content" key={i}>
                      <div className="circle-skeleton"></div>
                      <div className="skeleton-text small"></div>
                    </div>
                  ))}
                  <div className="legend-item-cont">
                    {[...Array(3)].map((_, i) => (
                      <div className="legend-item" key={i}>
                        <div className="skeleton-dot"></div>
                        <div
                          className="skeleton-text"
                          style={{ width: "80px" }}
                        ></div>
                        <div
                          className="skeleton-text"
                          style={{ width: "30px", marginLeft: "auto" }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3>Tingkat Persetujuan</h3>
                <div className="circular-charts">
                  <div className="circle-content">
                    <div
                      className="circle-item-box circle-green-ring"
                      style={{ "--percent": approvalStats.approvedPercent }}
                    >
                      <div className="percent-text">
                        {approvalStats.approvedPercent}%
                        <div className="small-text-circle">
                          <p>Disetujui</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="circle-content">
                    <div
                      className="circle-item-box circle-orange-ring"
                      style={{ "--percent": approvalStats.pendingPercent }}
                    >
                      <div className="percent-text">
                        {approvalStats.pendingPercent}%{" "}
                        <div className="small-text-circle">
                          <p>Menunggu</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="circle-content">
                    <div
                      className="circle-item-box circle-red-ring"
                      style={{ "--percent": approvalStats.rejectedPercent }}
                    >
                      <div className="percent-text">
                        {approvalStats.rejectedPercent}%{" "}
                        <div className="small-text-circle">
                          <p>Ditolak</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="legend-item-cont">
                    <div className="legend-item">
                      <span className="dot green"></span>Disetujui{" "}
                      <span className="val">{approvalStats.approved}</span>
                    </div>
                    <div className="legend-item">
                      <span className="dot orange"></span>Menunggu{" "}
                      <span className="val">{approvalStats.pending}</span>
                    </div>
                    <div className="legend-item">
                      <span className="dot red"></span>Ditolak{" "}
                      <span className="val">{approvalStats.rejected}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div
            className="content-card"
            style={{ marginBottom: "0px", border: "1px solid #efefef" }}
          >
            {loading ? (
              <>
                <div
                  className="skeleton-text"
                  style={{ width: "320px", height: "20px" }}
                />
                <div className="bar-chart-mock">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bar-group">
                      <div className="bar-container">
                        <div className="bar skeleton-bar"></div>
                      </div>
                      <div className="bar-info">
                        <div
                          className="skeleton-text short"
                          style={{ width: "50px", height: "10px" }}
                        ></div>
                        <div
                          className="skeleton-text"
                          style={{ width: "30px", height: "10px" }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3>Tren Pengajuan Bulanan</h3>
                <div className="bar-chart-mock">
                  {monthlyTrend.map((item, index) => {
                    const percent = (item.total / maxTrend) * 100;
                    return (
                      <div className="bar-group" key={index}>
                        <span className="bar-value-dash">{item.total}</span>
                        <div
                          className="bar blue"
                          style={{
                            height: `${percent}%`,
                            transition: "height 0.5s ease",
                          }}
                        ></div>
                        <span className="bar-label">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <LeaveRequestModal
        show={showModal}
        data={selectedRequest}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default LeaveRequestReport;

const LeaveRequestModal = ({ show, onClose, data }) => {
  if (!show || !data) return null;

  const API_BASE_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:3000"
  ).replace(/\/$/, "");

  //   const FILE_BASE_URL = "http://localhost:3000/uploads/evidence/";
  const getEvidenceUrl = (fileName) => {
    if (!fileName) return "";

    /*
     * Apabila backend sudah mengirim URL lengkap,
     * jangan ditambahkan base URL lagi.
     */
    if (/^https?:\/\//i.test(fileName)) {
      return fileName;
    }
    return `${API_BASE_URL}/uploads/evidence/${encodeURIComponent(fileName)}`;
  };

  const evidenceUrl = data.evidenceUrl || getEvidenceUrl(data.evidenceFile);
  const getApprovalLabel = (status) => {
    return formatStatus(status);
  };
  const getStatusClass = (status) => {
    return status?.toLowerCase() === "pending"
      ? "pending"
      : status?.toLowerCase() === "approved"
        ? "approved"
        : status?.toLowerCase() === "rejected"
          ? "rejected"
          : status?.toLowerCase() === "cancelled"
            ? "cancelled"
            : "expired";
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Detail Pengajuan</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <span>Tanggal Pengajuan</span>
            <strong>{new Date(data.createdAt).toLocaleString("id-ID")}</strong>
          </div>
          <div className="detail-row">
            <span>Nama Karyawan</span>
            <strong>{data.user?.fullName}</strong>
          </div>
          <div className="detail-row">
            <span>NIP</span>
            <strong>{data.user?.nip}</strong>
          </div>
          <div className="detail-row">
            <span>Departemen</span>
            <strong>{data.user?.position?.division?.department?.name}</strong>
          </div>
          <div className="detail-row">
            <span>Jenis Pengajuan</span>
            <strong>{data.leavesubtype?.name}</strong>
          </div>
          <div className="detail-row">
            <span>Tanggal</span>
            <strong>
              {formatDateIndo(data.startDate)} - {formatDateIndo(data.endDate)}
            </strong>
          </div>
          <div className="detail-row">
            <span>Catatan</span>
            <strong>{data.note || "-"}</strong>
          </div>
          <div className="detail-row">
            <span>Lampiran</span>
            {data.evidenceFile ? (
              <div className="evidence-preview">
                {data.evidenceFile.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <a
                    // href={`${FILE_BASE_URL}${data.evidenceFile}`}
                    href={evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="evidence-link-container"
                  >
                    <img
                      //   src={`${FILE_BASE_URL}${data.evidenceFile}`}
                      src={evidenceUrl}
                      alt="Bukti Lampiran"
                      className="img-evidence-thumb"
                    />
                    <div className="view-link-wrapper">
                      <p className="view-link">Klik untuk memperbesar</p>
                    </div>
                  </a>
                ) : (
                  <a
                    // href={`${FILE_BASE_URL}${data.evidenceFile}`}
                    href={evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button is-small is-link"
                  >
                    Lihat Dokumen (PDF/Lainnya)
                  </a>
                )}
              </div>
            ) : (
              <strong>-</strong>
            )}
          </div>
          {data.manager && (
            <>
              <div className="detail-row">
                <span>Status Manager</span>
                {/* <strong>{getApprovalLabel("Manager")}</strong> */}
                <strong
                  className={`status-badge ${getStatusClass(data.status)}`}
                >
                  {getApprovalLabel(data.managerStatus)}
                </strong>
              </div>
              <div className="detail-row">
                <span>Nama Manager</span>
                <strong>
                  {[data.manager.titlePrefix, data.manager.fullName]
                    .filter(Boolean)
                    .join(" ")}
                </strong>
              </div>
              {data.managerStatus === "rejected" &&
                data.managerDecisionNote && (
                  <div className="detail-row">
                    <span>Catatan Manager</span>
                    <strong>{data.managerDecisionNote}</strong>
                  </div>
                )}
            </>
          )}
          {data.sdm && (
            <>
              <div className="detail-row">
                <span>Status SDM</span>
                <strong
                  className={`status-badge ${getStatusClass(data.status)}`}
                >
                  {getApprovalLabel(data.sdmStatus)}
                </strong>
              </div>
              <div className="detail-row">
                <span>Nama SDM</span>
                <strong>
                  {[data.sdm.titlePrefix, data.sdm.fullName]
                    .filter(Boolean)
                    .join(" ")}
                </strong>
              </div>
              {data.sdmStatus === "rejected" && data.sdmDecisionNote && (
                <div className="detail-row">
                  <span>Catatan SDM</span>
                  <strong>{data.sdmDecisionNote}</strong>
                </div>
              )}
            </>
          )}
          <div className="detail-row">
            <strong>Status Pengajuan</strong>
            <strong className={`status-badge ${getStatusClass(data.status)}`}>
              {formatStatus(data.status)}
            </strong>
          </div>
        </div>

        <div className="modal-footer">
          <button className="button is-danger" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
