import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
  Line,
  ComposedChart,
} from "recharts";
import {
  FaAngleLeft,
  FaAngleRight,
  FaArrowDown,
  FaArrowUp,
  FaBullseye,
  FaCalendar,
  FaCalendarCheck,
  FaCampground,
  FaChartBar,
  FaClock,
  FaDoorClosed,
  FaDoorOpen,
  FaDownload,
  FaExclamationTriangle,
  FaFileAlt,
  FaFileExcel,
  FaFilePdf,
  FaPercentage,
  FaRegClock,
  FaRegFileAlt,
  FaSignInAlt,
  FaSignOutAlt,
  FaStethoscope,
  FaTransgenderAlt,
  FaTrophy,
  FaUserAlt,
  FaUserAltSlash,
  FaUserClock,
  FaUserInjured,
  FaUserMd,
  FaUsers,
  FaUsersCog,
  FaUserSecret,
  FaUserShield,
  FaUsersSlash,
} from "react-icons/fa";
import axiosInstance from "../api/axios.js";
import jsPDF from "jspdf";
import XLSX from "xlsx-js-style";
import autoTable from "jspdf-autotable";

const WorkloadAnalysis = () => {
  const [period, setPeriod] = useState("month");
  const [hoveredCell, setHoveredCell] = useState(null);
  const chartContainerRef = useRef(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7),
  );
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalSDM: 0,
      totalTindakan: 0,
      totalPasien: 0,
      totalJamKehadiran: 0,
      totalTenagaMedisAktif: 0,
      rataRataBebanKerja: 0,
    },
    deltas: { tindakan: null, pasien: null, jam: null, rataRata: null },
    workload: [],
    distribution: [],
    totalSemuaTindakan: 0,
    unit_volume_tertinggi: "-",
    kontribusi_tertinggi: "0%",
    total_tindakan_20_unitlainnya: "",
    heatmap: [],
    heatmapSummary: null,
    timeline: [],
    attendanceSummary: { tepatWaktu: 0, terlambat: 0, tidakHadir: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [hoveredTimeline, setHoveredTimeline] = useState(null);
  const [timelineFilter, setTimelineFilter] = useState("Anomali");
  const [sortFilter, setSortFilter] = useState("beban_tertinggi");
  const [timelineData, setTimelineData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    data: null,
    activeIdx: null,
  });
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const formatIntegerID = (value) => {
    if (value === null || value === undefined) return "0";
    return Number(value).toLocaleString("id-ID", {
      maximumFractionDigits: 0,
    });
  };

  const formatDecimalID = (value, maxFraction = 2) => {
    if (value === null || value === undefined) return "0";
    return Number(value).toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxFraction,
    });
  };

  const formatPercentID = (value, maxFraction = 2) => {
    if (value === null || value === undefined || value === "") return "0%";

    const cleanValue =
      typeof value === "string"
        ? value.replace("%", "").replace(",", ".")
        : value;

    const numberValue = Number(cleanValue);

    if (Number.isNaN(numberValue)) return "0%";

    return `${numberValue.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxFraction,
    })}%`;
  };

  const fetchDashboardData = useCallback(async () => {
    if (!selectedMonth) return;
    try {
      setLoading(true);

      //   let apiParams = {
      //     period: period,
      //     ...(period === "day" && { day: selectedMonth }),
      //     ...(period !== "day" && { month: selectedMonth }),
      //   };

      let apiParams;
      if (period === "day") {
        apiParams = {
          period: "day",
          day: selectedMonth,
        };
      } else if (period === "week") {
        apiParams = {
          period: "week",
          week: selectedMonth,
        };
      } else {
        apiParams = {
          period: "month",
          month: selectedMonth,
        };
      }

      const summaryRes = await axiosInstance.get(`/dashboard/summary`, {
        params: apiParams,
      });
      const summaryData = summaryRes.data;

      const workloadRes = await axiosInstance.get(
        `/dashboard/workload-doctors`,
        { params: apiParams },
      );
      const workloadData = workloadRes.data?.workload || {
        total: {},
        byDoctor: [],
      };

      const unitDistRes = await axiosInstance.get(
        `/dashboard/unit-distribution`,
        { params: apiParams },
      );
      const unitDistFullData = unitDistRes.data || {};
      const unitDistData = unitDistFullData.distribution || [];
      const unitDistStaffData = unitDistFullData.distributionStaff || [];

      const heatmapRes = await axiosInstance.get(`/dashboard/heatmap`, {
        params: apiParams,
      });
      const heatmapData = heatmapRes.data?.heatmap || [];
      const heatmapSummaryData = heatmapRes.data?.summary || null;
      const formattedHeatmap = generateHeatmapData(heatmapData);

      const timelineRes = await axiosInstance.get(
        `/dashboard/attendance-timeline`,
        { params: apiParams },
      );
      //   const timelineData = timelineRes.data?.attendanceTimeline || {};
      const attendanceTimelineData = Array.isArray(
        timelineRes.data?.attendanceTimeline,
      )
        ? timelineRes.data.attendanceTimeline
        : [];

      setDashboardData({
        stats: summaryData.stats || {
          totalSDM: 0,
          totalTindakan: 0,
          totalPasien: 0,
          totalJamKehadiran: 0,
          totalTenagaMedisAktif: 0,
          rataRataBebanKerja: 0,
        },
        deltas: summaryData.deltas || {
          tindakan: null,
          pasien: null,
          jam: null,
          rataRata: null,
        },
        workload: Array.isArray(workloadData.byDoctor)
          ? workloadData.byDoctor
          : [],
        workloadTotal: workloadData.total || {},
        distribution: Array.isArray(unitDistData) ? unitDistData : [],
        distributionStaff: Array.isArray(unitDistStaffData)
          ? unitDistStaffData
          : [],
        totalSemuaTindakan: unitDistFullData.total_semua_tindakan || 0,
        unitVolumeTertinggi: unitDistFullData.unit_volume_tertinggi || "-",
        kontribusiTertinggi: unitDistFullData.kontribusi_tertinggi || "0%",
        totalTindakanLainnya:
          unitDistFullData.total_tindakan_20_unitlainnya || "",
        heatmap: formattedHeatmap,
        heatmapSummary: heatmapSummaryData,
        // timeline: timelineData,
        timeline: attendanceTimelineData,
      });

      //   setTimelineData(timelineData);
      setTimelineData(attendanceTimelineData);
    } catch (e) {
      console.error("Gagal mengambil data dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, [period, selectedMonth]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // SECTION CARD
  const getComparisonLabel = () => {
    if (period === "day") return "dari kemarin";
    if (period === "week") return "dari minggu lalu";
    return "dari bulan lalu";
  };

  const RenderGrowth = ({ value }) => {
    if (value === null || value === undefined) {
      return (
        <span className="stat-text-dash green">
          <FaArrowUp /> Data Baru
        </span>
      );
    }

    const numericValue = parseFloat(value);
    if (numericValue === 0) {
      return (
        <span className="stat-text-dash gray" style={{ color: "black" }}>
          <span style={{ marginRight: "5px" }}></span> 0%
        </span>
      );
    }

    const isPositive = numericValue > 0;
    return (
      <span className={`stat-text-dash ${isPositive ? "green" : "red"}`}>
        {isPositive ? <FaArrowUp /> : <FaArrowDown />}{" "}
        {formatPercentID(Math.abs(numericValue), 1)}
      </span>
    );
  };

  // BEBAN KERJA DOKTER
  const {
    totalTindakan = 0,
    totalJamKehadiran = 0,
    totalPasien = 0,
    rataRataBebanKerja = 0,
  } = dashboardData.stats;

  //   const sortedWorkload = [...dashboardData.workload]
  //     .sort((a, b) => b.tindakan - a.tindakan)
  //     .slice(0, 10);

  const sortedWorkload = [...dashboardData.workload]
    .filter((doc) => doc.hadir === true) // yang memiliki presensi hadir saja
    .sort((a, b) => {
      // Hitung total beban kerja (Sesuai jadwal + Luar jadwal/Cito)
      const totalA = (a.validActivity || 0) + (a.outOfShift || 0);
      const totalB = (b.validActivity || 0) + (b.outOfShift || 0);

      switch (sortFilter) {
        case "beban_tertinggi":
          return totalB - totalA; // Urutan menurun (terbesar ke terkecil)
        case "beban_terendah":
          return totalA - totalB; // Urutan menaik (terkecil ke terbesar)
        case "jam_tertinggi":
          return (b.jam || 0) - (a.jam || 0); // Berdasarkan jam hadir
        case "cito_tertinggi":
          return (b.outOfShift || 0) - (a.outOfShift || 0); // Berdasarkan tindakan Cito
        default:
          return totalB - totalA;
      }
    })
    .slice(0, 5);

  const hasWorkloadData = sortedWorkload.length > 0;

  //   const maxTindakanRaw =
  //     sortedWorkload.length > 0
  //       ? Math.max(
  //           ...sortedWorkload.map(
  //             (d) => (d.validActivity || 0) + (d.outOfShift || 0),
  //           ),
  //         )
  //       : 50;
  //   const maxScale = maxTindakanRaw || 50;

  const AXIS_INTERVALS = 4;
  const maxTindakanRaw =
    sortedWorkload.length > 0
      ? Math.max(
          ...sortedWorkload.map(
            (doctor) =>
              (Number(doctor.validActivity) || 0) +
              (Number(doctor.outOfShift) || 0),
          ),
        )
      : 0;

  /*
   * Contoh nilai maksimum 26:
   * tickStep = ceil(26 / 4) = 7
   * maxScale = 7 × 4 = 28
   * Sumbu = 0, 7, 14, 21, 28
   */
  const tickStep =
    maxTindakanRaw > 0
      ? Math.max(1, Math.ceil(maxTindakanRaw / AXIS_INTERVALS))
      : 1;

  const maxScale = tickStep * AXIS_INTERVALS;
  const axisTicks = Array.from({ length: AXIS_INTERVALS + 1 }, (_, index) => ({
    value: index * tickStep,
    percent: (index / AXIS_INTERVALS) * 100,
  }));

  // jangan dihapus
  //   const maxJamRaw =
  //     sortedWorkload.length > 0
  //       ? Math.max(...sortedWorkload.map((d) => d.jam || 0))
  //       : 24;
  //   const maxJamScale = maxJamRaw || 24;

  const workloadTotal = dashboardData.workloadTotal || {};
  const totalTindakanDokter = workloadTotal.tindakan || 0;
  //   const totalPasienDokter = workloadTotal.pasien || 0;
  const totalJamKehadiranDokter = workloadTotal.jam || 0;
  const totalOutOfShiftAll = workloadTotal.outOfShift || 0;
  const totalValidActivity = workloadTotal.validActivity || 0;
  const totalDokterAktif = dashboardData.workload.filter(
    (doc) => doc.hadir === true,
  ).length;

  // Persentase luar jadwal dihitung dari totalTindakan (summary card, semua tenaga medis)
  const persentaseLuarJadwal =
    totalTindakanDokter > 0
      ? ((totalOutOfShiftAll / totalTindakanDokter) * 100).toFixed(1)
      : 0;

  // DISTRIBUSI TINDAKAN MEDIS PER UNIT PELAYANAN
  const pureUnits = dashboardData.distribution.filter(
    (item) => item.name !== "UNIT LAINNYA",
  );
  const sortedPureUnits = [...pureUnits].sort((a, b) => b.value - a.value);
  const top10Distribution = [...sortedPureUnits.slice(0, 10)];
  const insightText = `Kontribusi tertinggi`;

  const CustomHorizontalBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-bar-tooltip">
          <div className="tooltip-header">{data.name}</div>
          <div className="tooltip-body">
            <div className="row">
              <span>Total Tindakan:</span>
              <strong>{data.value.toLocaleString()}</strong>
            </div>
            <div className="row">
              <span>Kontribusi:</span>
              <strong>{data.persentase}</strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // HEATMAP KESIBUKAN LAYANAN VS JADWAL SHIFT
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const ManagementTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip-management">
          <p className="tooltip-title">
            <strong>{data.name}</strong>
          </p>
          <hr />
          <p>
            Total Tindakan: <strong>{data.value}</strong>
          </p>
          <p>
            Tenaga Medis Hadir: <strong>{data.staffPresent} Orang</strong>
          </p>
          <div className="metric-box">
            <p>
              Rasio Tindakan: <strong>{data.ratio}</strong>{" "}
              <small>tindakan/personil</small>
            </p>
            <p>
              Beban Kerja: <strong>{data.workload}</strong>{" "}
              <small>tindakan/jam</small>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getCellColor = (tindakan, ratio) => {
    if (tindakan === 0) return "#f1f5f9"; // jam kosong / tidak ada tindakan
    if (ratio < 1.5) return "#4ade80"; // Hijau (Sepi)
    if (ratio >= 1.5 && ratio <= 2.5) return "#facc15"; // Kuning (Sedang)
    return "#f87171"; // Merah (Sangat Padat)
  };

  const formatRatio = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return "0";

    return number.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const round2 = (value) => {
    return parseFloat((Number(value) || 0).toFixed(2));
  };

  const generateHeatmapData = (rawHeatmapFromBackend) => {
    if (!Array.isArray(rawHeatmapFromBackend)) return [];

    return rawHeatmapFromBackend.map((item) => {
      const unitName = item.unit || "Tanpa Unit";
      const backendData = Array.isArray(item.data) ? item.data : [];

      const full24Hours = hours.map((hour) => {
        const slots = backendData.filter((d) => Number(d.hour) === hour);

        if (slots.length === 0) {
          return {
            hour,
            tanggal: null,
            tindakan: 0,
            total_pasien: 0,
            karyawan: 0,
            tenaga_hadir: 0,
            total_tm_terlibat: 0,
            shift_name: null,
            identitas_tenaga_medis: null,
            ratio: 0,
            slot_count: 0,
          };
        }

        const totalTindakan = slots.reduce(
          (sum, d) => sum + (Number(d.tindakan) || 0),
          0,
        );

        const totalPasien = slots.reduce(
          (sum, d) => sum + (Number(d.total_pasien) || 0),
          0,
        );

        const totalKaryawan = slots.reduce(
          (sum, d) => sum + (Number(d.karyawan) || 0),
          0,
        );

        const totalTenagaHadir = slots.reduce(
          (sum, d) => sum + (Number(d.tenaga_hadir) || 0),
          0,
        );

        const totalTmTerlibat = slots.reduce(
          (sum, d) => sum + (Number(d.total_tm_terlibat) || 0),
          0,
        );

        const totalRatio = slots.reduce(
          (sum, d) => sum + (Number(d.ratio) || 0),
          0,
        );

        const avgRatio = slots.length > 0 ? totalRatio / slots.length : 0;
        const avgKaryawan = slots.length > 0 ? totalKaryawan / slots.length : 0;
        const avgTenagaHadir =
          slots.length > 0 ? totalTenagaHadir / slots.length : 0;
        const avgTmTerlibat =
          slots.length > 0 ? totalTmTerlibat / slots.length : 0;

        const sortedSlots = [...slots].sort((a, b) => {
          return String(a.tanggal || "").localeCompare(String(b.tanggal || ""));
        });

        const tanggalAwal = sortedSlots[0]?.tanggal || null;
        const tanggalAkhir =
          sortedSlots[sortedSlots.length - 1]?.tanggal || null;

        const shiftSet = new Set();
        const identitySet = new Set();

        slots.forEach((slot) => {
          if (slot.shift_name) {
            slot.shift_name.split(",").forEach((shift) => {
              const cleanShift = shift.trim();
              if (cleanShift) shiftSet.add(cleanShift);
            });
          }

          if (slot.identitas_tenaga_medis) {
            slot.identitas_tenaga_medis.split(" | ").forEach((nama) => {
              const cleanName = nama.trim();
              if (cleanName) identitySet.add(cleanName);
            });
          }
        });

        const identities = Array.from(identitySet);
        const displayedIdentities = identities.slice(0, 20);
        const remainingIdentities =
          identities.length - displayedIdentities.length;

        return {
          hour,
          tanggal:
            tanggalAwal && tanggalAkhir && tanggalAwal !== tanggalAkhir
              ? `${tanggalAwal} s.d. ${tanggalAkhir}`
              : tanggalAwal,
          tindakan: totalTindakan,
          total_pasien: totalPasien,
          karyawan: round2(avgKaryawan),
          tenaga_hadir: round2(avgTenagaHadir),
          total_tm_terlibat: round2(avgTmTerlibat),
          shift_name:
            shiftSet.size > 0 ? Array.from(shiftSet).join(", ") : null,
          identitas_tenaga_medis:
            displayedIdentities.length > 0
              ? `${displayedIdentities.join(" | ")}${
                  remainingIdentities > 0
                    ? ` | +${remainingIdentities} tenaga medis lainnya`
                    : ""
                }`
              : null,
          ratio: round2(avgRatio),
          slot_count: slots.length,
        };
      });

      return {
        unit: unitName,
        avgRatio: round2(item.avgRatio),
        data: full24Hours,
        rawData: backendData,
      };
    });
  };

  const getRowAverage = (row) => {
    return formatRatio(row?.avgRatio || 0);
  };

  const getAverageColor = (val) => {
    const numVal = parseFloat(val);
    if (numVal === 0) return "#94a3b8"; // Abu-abu jika tidak ada data
    if (numVal < 1.5) return "#22c55e"; // Hijau
    if (numVal >= 1.5 && numVal <= 2.5) return "#eab308"; // Kuning
    return "#ef4444"; // Merah
  };

  // TIMELINE KEHADIRAN DAN AKTIVITAS TENAGA MEDIS
  const totalStaff = timelineData.length;
  const countNormal = timelineData.filter(
    (d) => d.status_audit === "Normal",
  ).length;
  const countAnomaly = timelineData.filter(
    (d) => d.status_audit !== "Normal",
  ).length;
  const percentageAnomaly =
    totalStaff > 0 ? ((countAnomaly / totalStaff) * 100).toFixed(2) : 0;

  const anomalyUnits = timelineData
    .filter((d) => d.status_audit !== "Normal" && d.unit_pelayanan)
    .reduce((acc, curr) => {
      acc[curr.unit_pelayanan] = (acc[curr.unit_pelayanan] || 0) + 1;
      return acc;
    }, {});

  let topAnomalyUnit = "-";
  let topAnomalyCount = 0;
  for (const [unit, count] of Object.entries(anomalyUnits)) {
    if (count > topAnomalyCount) {
      topAnomalyCount = count;
      topAnomalyUnit = unit;
    }
  }
  const topAnomalyPercentage =
    totalStaff > 0 ? ((topAnomalyCount / totalStaff) * 100).toFixed(2) : 0;

  const getPos = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    const totalMinutes = h * 60 + m;
    return (totalMinutes / (24 * 60)) * 100;
  };

  const sortedData = [...timelineData];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const filteredData = sortedData.filter((staff) => {
    if (timelineFilter === "Semua") return true;
    if (timelineFilter === "Normal") return staff.status_audit === "Normal";
    if (timelineFilter === "Anomali") return staff.status_audit !== "Normal";
    return true;
  });
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // export file
  const getExportPeriodInfo = () => {
    const locale = "id-ID";
    let periodLabel = "";
    let filePeriod = "";

    if (period === "day") {
      const date = new Date(`${selectedMonth}T00:00:00`);

      periodLabel = date.toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      filePeriod = selectedMonth;
    } else if (period === "week") {
      periodLabel = `Minggu ${selectedMonth.replace("-W", " Tahun ")}`;
      filePeriod = selectedMonth;
    } else {
      const [year, month] = selectedMonth.split("-");

      const date = new Date(Number(year), Number(month) - 1, 1);

      periodLabel = date.toLocaleDateString(locale, {
        month: "long",
        year: "numeric",
      });

      filePeriod = selectedMonth;
    }

    const safePeriodLabel = periodLabel
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "_");

    return {
      periodLabel,
      filePeriod,
      safePeriodLabel,
    };
  };

  const getFullExportData = () => {
    const workloadData = [...(dashboardData.workload || [])]
      .filter((doctor) => doctor.hadir === true)
      .sort((a, b) => {
        const totalA =
          (Number(a.validActivity) || 0) + (Number(a.outOfShift) || 0);

        const totalB =
          (Number(b.validActivity) || 0) + (Number(b.outOfShift) || 0);

        return totalB - totalA;
      })
      .map((doctor, index) => {
        const validActivity = Number(doctor.validActivity) || 0;
        const outOfShift = Number(doctor.outOfShift) || 0;
        const totalTindakan = validActivity + outOfShift;
        const jamKehadiran = Number(doctor.jam) || 0;

        return {
          no: index + 1,
          nama: doctor.name || "-",
          posisi: doctor.position || "-",
          tindakanSesuaiJadwal: validActivity,
          tindakanLuarJadwal: outOfShift,
          totalTindakan,
          jamKehadiran,
          pasien: Number(doctor.pasien) || 0,
          rasio:
            jamKehadiran > 0
              ? Number((totalTindakan / jamKehadiran).toFixed(2))
              : 0,
        };
      });

    const distributionData = [...(dashboardData.distribution || [])]
      .filter((unit) => unit.name !== "UNIT LAINNYA")
      .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
      .map((unit, index) => ({
        no: index + 1,
        unit: unit.name || "-",
        totalTindakan: Number(unit.value) || 0,
        persentase: formatPercentID(unit.persentase),
        tenagaHadir:
          Number(
            unit.staffPresent ?? unit.staff_present ?? unit.tenaga_hadir,
          ) || 0,
        rasio: Number(unit.ratio) || 0,
        bebanKerja: Number(unit.workload) || 0,
      }));

    const heatmapData = [];

    (dashboardData.heatmap || []).forEach((row) => {
      (row.data || []).forEach((cell) => {
        if ((Number(cell.tindakan) || 0) <= 0) return;

        let kategori = "Sepi";

        if (Number(cell.ratio) > 2.5) {
          kategori = "Sangat Padat";
        } else if (Number(cell.ratio) >= 1.5) {
          kategori = "Sedang";
        }

        heatmapData.push({
          unit: row.unit || "-",
          jam: `${String(cell.hour).padStart(2, "0")}:00`,
          periodeData: cell.tanggal || "-",
          shift: cell.shift_name || "-",
          tindakan: Number(cell.tindakan) || 0,
          pasien: Number(cell.total_pasien) || 0,
          tenagaHadir: Number(cell.karyawan) || 0,
          rasio: Number(cell.ratio) || 0,
          kategori,
          tenagaMedis: cell.identitas_tenaga_medis || "-",
        });
      });
    });

    const timelineExportSource =
      timelineFilter === "Semua"
        ? [...timelineData]
        : timelineData.filter((item) => {
            if (timelineFilter === "Normal") {
              return item.status_audit === "Normal";
            }

            return item.status_audit !== "Normal";
          });

    const timelineExportData = timelineExportSource.map((staff, index) => ({
      no: index + 1,
      nama: staff.nama_tenaga_medis || "-",
      posisi: staff.position_name || "-",
      unit: staff.unit_pelayanan || "-",
      shift: staff.shiftName || "-",
      jadwal:
        staff.shiftStart && staff.shiftEnd
          ? `${staff.shiftStart} - ${staff.shiftEnd}`
          : "-",
      jamMasuk: staff.jam_masuk || "-",
      tindakanPertama: staff.tanggal_tindakan_pertama || "-",
      tindakanTerakhir: staff.tanggal_tindakan_terakhir || "-",
      jamPulang: staff.jam_pulang || "-",
      totalTindakan: Number(staff.total_tindakan) || 0,
      totalPasien: Number(staff.total_pasien) || 0,
      status: staff.status_audit || "-",
    }));

    return {
      workloadData,
      distributionData,
      heatmapData,
      timelineExportData,
    };
  };

  const handleExportPDF = async () => {
    try {
      const { periodLabel, filePeriod, safePeriodLabel } =
        getExportPeriodInfo();

      const {
        workloadData,
        distributionData,
        heatmapData,
        timelineExportData,
      } = getFullExportData();

      const doc = new jsPDF("landscape", "mm", "a4");

      const pageWidth = doc.internal.pageSize.getWidth();
      const today = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const fileName = `Laporan_Dashboard_Analitik_${safePeriodLabel}.pdf`;

      const addHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(
          "RUMAH SAKIT BHAYANGKARA TK. III INDRAMAYU",
          pageWidth / 2,
          10,
          { align: "center" },
        );

        doc.setFontSize(12);
        doc.text(`LAPORAN DASHBOARD ANALITIK`, pageWidth / 2, 17, {
          align: "center",
        });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Periode: ${periodLabel}`, 14, 24);
        doc.text(`Tanggal cetak: ${today}`, 14, 29);
      };

      const addPageNumber = () => {
        const pageCount = doc.internal.getNumberOfPages();

        for (let page = 1; page <= pageCount; page += 1) {
          doc.setPage(page);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);

          doc.text(
            `Halaman ${page} dari ${pageCount}`,
            pageWidth - 14,
            doc.internal.pageSize.getHeight() - 6,
            { align: "right" },
          );
        }
      };

      addHeader();

      let currentY = 36;

      // =========================================================
      // 1. RINGKASAN EKSEKUTIF
      // =========================================================
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("1. RINGKASAN EKSEKUTIF", 14, currentY);

      autoTable(doc, {
        startY: currentY + 3,
        theme: "grid",
        head: [
          [
            "Total Tindakan",
            "Total Jam Kehadiran",
            "Total Pasien",
            "Rata-rata Beban Kerja",
            "Dokter Aktif",
            "Indikasi Anomali",
          ],
        ],
        body: [
          [
            formatIntegerID(dashboardData.stats?.totalTindakan || 0),
            `${formatIntegerID(
              dashboardData.stats?.totalJamKehadiran || 0,
            )} jam`,
            formatIntegerID(dashboardData.stats?.totalPasien || 0),
            formatDecimalID(dashboardData.stats?.rataRataBebanKerja || 0, 2),
            formatIntegerID(workloadData.length),
            `${formatIntegerID(countAnomaly)} (${formatPercentID(
              percentageAnomaly,
            )})`,
          ],
        ],
        styles: {
          fontSize: 8,
          halign: "center",
          valign: "middle",
          cellPadding: 2.5,
        },
        headStyles: {
          fillColor: [15, 118, 110],
          textColor: 255,
          fontStyle: "bold",
        },
        margin: {
          left: 14,
          right: 14,
        },
      });

      currentY = doc.lastAutoTable.finalY + 8;

      // =========================================================
      // 2. BEBAN KERJA SELURUH DOKTER
      // =========================================================
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("2. BEBAN KERJA SELURUH DOKTER", 14, currentY);

      autoTable(doc, {
        startY: currentY + 3,
        theme: "grid",
        showHead: "everyPage",
        head: [
          [
            "No.",
            "Nama Dokter",
            "Posisi/Spesialisasi",
            "Sesuai Jadwal",
            "Luar Jadwal",
            "Total Tindakan",
            "Jam Hadir",
            "Pasien",
            "Tindakan/Jam",
          ],
        ],
        body:
          workloadData.length > 0
            ? workloadData.map((doctor) => [
                doctor.no,
                doctor.nama,
                doctor.posisi,
                formatIntegerID(doctor.tindakanSesuaiJadwal),
                formatIntegerID(doctor.tindakanLuarJadwal),
                formatIntegerID(doctor.totalTindakan),
                formatIntegerID(doctor.jamKehadiran),
                formatIntegerID(doctor.pasien),
                formatDecimalID(doctor.rasio, 2),
              ])
            : [["-", "Tidak ada data", "-", "-", "-", "-", "-", "-", "-"]],
        styles: {
          fontSize: 7,
          valign: "middle",
          cellPadding: 1.8,
        },
        headStyles: {
          fillColor: [51, 65, 85],
          textColor: 255,
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { cellWidth: 42 },
          2: { cellWidth: 38 },
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right" },
          6: { halign: "right" },
          7: { halign: "right" },
          8: { halign: "right" },
        },
        margin: {
          left: 14,
          right: 14,
          top: 15,
          bottom: 12,
        },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text(`Laporan Dashboard Analitik – ${periodLabel}`, 14, 9);
          }
        },
      });

      currentY = doc.lastAutoTable.finalY + 8;

      // =========================================================
      // 3. DISTRIBUSI SELURUH UNIT
      // =========================================================
      if (currentY > 170) {
        doc.addPage();
        currentY = 15;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("3. DISTRIBUSI TINDAKAN MEDIS SELURUH UNIT", 14, currentY);

      autoTable(doc, {
        startY: currentY + 3,
        theme: "grid",
        showHead: "everyPage",
        head: [
          [
            "No.",
            "Unit Pelayanan",
            "Total Tindakan",
            "Kontribusi",
            "Tenaga Hadir",
            "Rasio",
            "Beban Kerja",
          ],
        ],
        body:
          distributionData.length > 0
            ? distributionData.map((unit) => [
                unit.no,
                unit.unit,
                formatIntegerID(unit.totalTindakan),
                unit.persentase,
                formatDecimalID(unit.tenagaHadir, 2),
                formatDecimalID(unit.rasio, 2),
                formatDecimalID(unit.bebanKerja, 2),
              ])
            : [["-", "Tidak ada data", "-", "-", "-", "-", "-"]],
        styles: {
          fontSize: 7,
          valign: "middle",
          cellPadding: 1.8,
        },
        headStyles: {
          fillColor: [13, 148, 136],
          textColor: 255,
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { cellWidth: 60 },
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right" },
          6: { halign: "right" },
        },
        margin: {
          left: 14,
          right: 14,
          top: 15,
          bottom: 12,
        },
      });

      currentY = doc.lastAutoTable.finalY + 8;

      // =========================================================
      // 4. HEATMAP DALAM FORMAT TABEL
      // =========================================================
      if (currentY > 160) {
        doc.addPage();
        currentY = 15;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("4. DETAIL KESIBUKAN UNIT DAN JAM OPERASIONAL", 14, currentY);

      autoTable(doc, {
        startY: currentY + 3,
        theme: "grid",
        showHead: "everyPage",
        head: [
          [
            "Unit",
            "Jam",
            "Shift",
            "Tindakan",
            "Pasien",
            "Tenaga Hadir",
            "Rasio",
            "Kategori",
          ],
        ],
        body:
          heatmapData.length > 0
            ? heatmapData.map((item) => [
                item.unit,
                item.jam,
                item.shift,
                formatIntegerID(item.tindakan),
                formatIntegerID(item.pasien),
                formatDecimalID(item.tenagaHadir, 2),
                formatDecimalID(item.rasio, 2),
                item.kategori,
              ])
            : [["Tidak ada data", "-", "-", "-", "-", "-", "-", "-"]],
        styles: {
          fontSize: 6.5,
          valign: "middle",
          cellPadding: 1.5,
        },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: 255,
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 48 },
          1: { halign: "center", cellWidth: 18 },
          2: { cellWidth: 35 },
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right" },
          6: { halign: "right" },
          7: { cellWidth: 27 },
        },
        margin: {
          left: 14,
          right: 14,
          top: 15,
          bottom: 12,
        },
      });

      currentY = doc.lastAutoTable.finalY + 8;

      // =========================================================
      // 5. DATA INDIVIDUAL SESUAI FILTER
      // =========================================================
      if (currentY > 155) {
        doc.addPage();
        currentY = 15;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(
        `5. RINGKASAN KINERJA INDIVIDUAL – FILTER ${timelineFilter.toUpperCase()}`,
        14,
        currentY,
      );

      autoTable(doc, {
        startY: currentY + 3,
        theme: "grid",
        showHead: "everyPage",
        tableWidth: pageWidth - 28,
        head: [
          [
            "No.",
            "Nama",
            "Posisi",
            "Unit",
            "Shift",
            "Masuk",
            "Tindakan Pertama",
            "Tindakan Terakhir",
            "Pulang",
            "Tindakan",
            "Pasien",
            "Status",
          ],
        ],
        body:
          timelineExportData.length > 0
            ? timelineExportData.map((staff) => [
                staff.no,
                staff.nama,
                staff.posisi,
                staff.unit,
                staff.jadwal,
                staff.jamMasuk,
                staff.tindakanPertama,
                staff.tindakanTerakhir,
                staff.jamPulang,
                formatIntegerID(staff.totalTindakan),
                formatIntegerID(staff.totalPasien),
                staff.status,
              ])
            : [
                [
                  "-",
                  "Tidak ada data",
                  "-",
                  "-",
                  "-",
                  "-",
                  "-",
                  "-",
                  "-",
                  "-",
                  "-",
                  "-",
                ],
              ],
        styles: {
          fontSize: 5.8,
          valign: "middle",
          cellPadding: 1.2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [71, 85, 105],
          textColor: 255,
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 8 },
          1: { cellWidth: 32 },
          2: { cellWidth: 29 },
          3: { cellWidth: 30 },
          4: { cellWidth: 27 },
          5: { halign: "center", cellWidth: 15 },
          6: { cellWidth: 30 },
          7: { cellWidth: 30 },
          8: { halign: "center", cellWidth: 15 },
          9: { halign: "right", cellWidth: 15 },
          10: { halign: "right", cellWidth: 14 },
          11: { cellWidth: 24 },
        },
        margin: {
          left: 14,
          right: 14,
          top: 15,
          bottom: 12,
        },
      });

      addPageNumber();
      const pdfBlob = doc.output("blob");
      doc.save(fileName);
      const formData = new FormData();
      formData.append("file", pdfBlob, fileName);
      formData.append(
        "reportName",
        `Laporan Dashboard Analitik ${periodLabel}`,
      );
      formData.append("period", filePeriod);
      formData.append("status", "Selesai");
      formData.append("reportType", "PDF");

      await axiosInstance.post("/history", formData);
    } catch (error) {
      console.error(
        "Gagal mengekspor laporan dashboard analitik ke PDF:",
        error,
      );

      alert("Laporan PDF gagal dibuat. Silakan coba kembali.");
    }
  };

  const handleExportExcel = async () => {
    try {
      const { periodLabel, filePeriod, safePeriodLabel } =
        getExportPeriodInfo();
      const {
        workloadData,
        distributionData,
        heatmapData,
        timelineExportData,
      } = getFullExportData();

      const workbook = XLSX.utils.book_new();

      const today = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const fileName = `Laporan_Dashboard_Analitik_${safePeriodLabel}.xlsx`;

      // Helper function untuk memberikan styling (Border, Font, Fill, Alignment) mirip Kinerja Karyawan
      const applySheetStyling = (
        ws,
        data,
        maxColIndex,
        headerKeywords = [],
      ) => {
        if (!ws["!ref"]) return;
        const range = XLSX.utils.decode_range(ws["!ref"]);

        for (let R = range.s.r; R <= range.e.r; ++R) {
          const row = data[R] || [];
          const isHeaderRow = row.some((cellVal) =>
            headerKeywords.some((keyword) => String(cellVal).includes(keyword)),
          );
          const isTitleRow = R <= 3; // Baris judul atas (1-4)

          for (let C = range.s.c; C <= Math.min(range.e.c, maxColIndex); ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) continue;

            // Default styling per sel (Border tipis & Alignment tengah/kiri)
            ws[cellAddress].s = {
              border: {
                top: { style: "thin", color: { auto: 1 } },
                bottom: { style: "thin", color: { auto: 1 } },
                left: { style: "thin", color: { auto: 1 } },
                right: { style: "thin", color: { auto: 1 } },
              },
              alignment: {
                vertical: "center",
                horizontal: C === 1 ? "left" : "center",
              },
            };

            // Styling khusus Judul Utama (A1, A2, A3, dst)
            if (isTitleRow && C === 0) {
              ws[cellAddress].s = {
                font: { bold: true, sz: R === 0 ? 12 : 11 },
                alignment: { horizontal: "center", vertical: "center" },
              };
            }

            // Styling khusus Header Tabel (Background D9E1F2 & Bold)
            if (isHeaderRow) {
              ws[cellAddress].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: "D9E1F2" } },
                border: {
                  top: { style: "thin", color: { auto: 1 } },
                  bottom: { style: "thin", color: { auto: 1 } },
                  left: { style: "thin", color: { auto: 1 } },
                  right: { style: "thin", color: { auto: 1 } },
                },
                alignment: { horizontal: "center", vertical: "center" },
              };
            }
          }
        }
      };

      // =========================================================
      // SHEET 1: RINGKASAN
      // =========================================================
      const summaryData = [
        ["RUMAH SAKIT BHAYANGKARA TK. III INDRAMAYU"],
        ["LAPORAN DASHBOARD VISUALISASI ANALITIK"],
        [`Periode: ${periodLabel}`],
        [`Tanggal Cetak: ${today}`],
        [],
        ["RINGKASAN EKSEKUTIF"],
        ["Indikator", "Nilai", "Satuan/Keterangan"],
        [
          "Total Tindakan Medis",
          Number(dashboardData.stats?.totalTindakan) || 0,
          "tindakan",
        ],
        [
          "Total Jam Kehadiran",
          Number(dashboardData.stats?.totalJamKehadiran) || 0,
          "jam",
        ],
        [
          "Total Pasien Ditangani",
          Number(dashboardData.stats?.totalPasien) || 0,
          "pasien",
        ],
        [
          "Rata-rata Beban Kerja",
          Number(dashboardData.stats?.rataRataBebanKerja) || 0,
          "pasien/tenaga medis",
        ],
        ["Dokter Aktif", workloadData.length, "dokter"],
        ["Indikasi Anomali", countAnomaly, "tenaga medis"],
        ["Persentase Indikasi Anomali", Number(percentageAnomaly) || 0, "%"],
        [
          "Unit Indikasi Anomali Terbanyak",
          topAnomalyUnit,
          `${topAnomalyCount} kasus`,
        ],
        [],
        ["RINGKASAN BEBAN KERJA DOKTER"],
        ["Indikator", "Nilai", "Satuan/Keterangan"],
        ["Total Tindakan Dokter", Number(totalTindakanDokter) || 0, "tindakan"],
        ["Tindakan Sesuai Jadwal", Number(totalValidActivity) || 0, "tindakan"],
        ["Tindakan Luar Jadwal", Number(totalOutOfShiftAll) || 0, "tindakan"],
        [
          "Persentase Tindakan Luar Jadwal",
          Number(persentaseLuarJadwal) || 0,
          "%",
        ],
        [
          "Total Jam Aktivitas Dokter",
          Number(totalJamKehadiranDokter) || 0,
          "jam",
        ],
        [],
        ["RINGKASAN DISTRIBUSI UNIT"],
        ["Indikator", "Nilai", "Satuan/Keterangan"],
        [
          "Total Tindakan Seluruh Unit",
          Number(dashboardData.totalSemuaTindakan) || 0,
          "tindakan",
        ],
        ["Unit Volume Tertinggi", dashboardData.unitVolumeTertinggi || "-", ""],
        ["Kontribusi Tertinggi", dashboardData.kontribusiTertinggi || "0%", ""],
        [
          "Kontribusi Unit Lainnya",
          dashboardData.totalTindakanLainnya || "-",
          "",
        ],
        [],
        ["RINGKASAN HEATMAP"],
        ["Indikator", "Nilai", "Satuan/Keterangan"],
        [
          "Jam Tersibuk",
          dashboardData.heatmapSummary?.jam_tersibuk?.rentang_jam || "-",
          `Rasio ${formatDecimalID(dashboardData.heatmapSummary?.jam_tersibuk?.nilai_rasio || 0, 2)}`,
        ],
        [
          "Unit Paling Padat",
          dashboardData.heatmapSummary?.unit_paling_padat?.nama_unit || "-",
          `Rasio ${formatDecimalID(dashboardData.heatmapSummary?.unit_paling_padat?.nilai_rasio || 0, 2)}`,
        ],
        [
          "Rasio Tertinggi",
          dashboardData.heatmapSummary?.rasio_tertinggi?.nama_unit || "-",
          `${dashboardData.heatmapSummary?.rasio_tertinggi?.jam_tindakan || "-"} | Rasio ${formatDecimalID(dashboardData.heatmapSummary?.rasio_tertinggi?.nilai_rasio || 0, 2)}`,
        ],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
      ];
      summarySheet["!cols"] = [{ wch: 38 }, { wch: 30 }, { wch: 35 }];
      applySheetStyling(summarySheet, summaryData, 2, ["Indikator"]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");

      // =========================================================
      // SHEET 2: BEBAN KERJA DOKTER
      // =========================================================
      const workloadSheetData = [
        ["BEBAN KERJA SELURUH DOKTER"],
        [`Periode: ${periodLabel}`],
        [],
        [
          "No.",
          "Nama Dokter",
          "Posisi/Spesialisasi",
          "Tindakan Sesuai Jadwal",
          "Tindakan Luar Jadwal",
          "Total Tindakan",
          "Jam Kehadiran",
          "Pasien Unik",
          "Rasio Tindakan per Jam",
        ],
        ...workloadData.map((doctor) => [
          doctor.no,
          doctor.nama,
          doctor.posisi,
          doctor.tindakanSesuaiJadwal,
          doctor.tindakanLuarJadwal,
          doctor.totalTindakan,
          doctor.jamKehadiran,
          doctor.pasien,
          doctor.rasio,
        ]),
      ];

      const workloadSheet = XLSX.utils.aoa_to_sheet(workloadSheetData);
      workloadSheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
      ];
      workloadSheet["!cols"] = [
        { wch: 7 },
        { wch: 34 },
        { wch: 30 },
        { wch: 24 },
        { wch: 22 },
        { wch: 18 },
        { wch: 18 },
        { wch: 15 },
        { wch: 24 },
      ];
      workloadSheet["!autofilter"] = {
        ref: `A4:I${Math.max(workloadSheetData.length, 4)}`,
      };
      applySheetStyling(workloadSheet, workloadSheetData, 8, ["Nama Dokter"]);
      XLSX.utils.book_append_sheet(
        workbook,
        workloadSheet,
        "Beban Kerja Dokter",
      );

      // =========================================================
      // SHEET 3: DISTRIBUSI UNIT
      // =========================================================
      const distributionSheetData = [
        ["DISTRIBUSI TINDAKAN MEDIS SELURUH UNIT"],
        [`Periode: ${periodLabel}`],
        [],
        [
          "No.",
          "Unit Pelayanan",
          "Total Tindakan",
          "Kontribusi",
          "Tenaga Medis Hadir",
          "Rasio",
          "Beban Kerja",
        ],
        ...distributionData.map((unit) => [
          unit.no,
          unit.unit,
          unit.totalTindakan,
          unit.persentase,
          unit.tenagaHadir,
          unit.rasio,
          unit.bebanKerja,
        ]),
      ];

      const distributionSheet = XLSX.utils.aoa_to_sheet(distributionSheetData);
      distributionSheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      ];
      distributionSheet["!cols"] = [
        { wch: 7 },
        { wch: 38 },
        { wch: 18 },
        { wch: 15 },
        { wch: 22 },
        { wch: 15 },
        { wch: 18 },
      ];
      distributionSheet["!autofilter"] = {
        ref: `A4:G${Math.max(distributionSheetData.length, 4)}`,
      };
      applySheetStyling(distributionSheet, distributionSheetData, 6, [
        "Unit Pelayanan",
      ]);
      XLSX.utils.book_append_sheet(
        workbook,
        distributionSheet,
        "Distribusi Unit",
      );

      // =========================================================
      // SHEET 4: HEATMAP KESIBUKAN
      // =========================================================
      const heatmapSheetData = [
        ["DETAIL KESIBUKAN UNIT DAN JAM OPERASIONAL"],
        [`Periode: ${periodLabel}`],
        [],
        [
          "No.",
          "Unit Pelayanan",
          "Jam",
          "Periode Data",
          "Shift",
          "Jumlah Tindakan",
          "Total Pasien",
          "Rata-rata Tenaga Hadir",
          "Rasio",
          "Kategori",
          "Identitas Tenaga Medis",
        ],
        ...heatmapData.map((item, index) => [
          index + 1,
          item.unit,
          item.jam,
          item.periodeData,
          item.shift,
          item.tindakan,
          item.pasien,
          item.tenagaHadir,
          item.rasio,
          item.kategori,
          item.tenagaMedis,
        ]),
      ];

      const heatmapSheet = XLSX.utils.aoa_to_sheet(heatmapSheetData);
      heatmapSheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
      ];
      heatmapSheet["!cols"] = [
        { wch: 7 },
        { wch: 35 },
        { wch: 10 },
        { wch: 26 },
        { wch: 22 },
        { wch: 20 },
        { wch: 16 },
        { wch: 25 },
        { wch: 12 },
        { wch: 18 },
        { wch: 80 },
      ];
      heatmapSheet["!autofilter"] = {
        ref: `A4:K${Math.max(heatmapSheetData.length, 4)}`,
      };
      applySheetStyling(heatmapSheet, heatmapSheetData, 10, ["Unit Pelayanan"]);
      XLSX.utils.book_append_sheet(workbook, heatmapSheet, "Heatmap Kesibukan");

      // =========================================================
      // SHEET 5: KINERJA INDIVIDUAL
      // =========================================================
      const timelineSheetData = [
        [
          `RINGKASAN KINERJA INDIVIDUAL – FILTER ${timelineFilter.toUpperCase()}`,
        ],
        [`Periode: ${periodLabel}`],
        [],
        [
          "No.",
          "Nama Tenaga Medis",
          "Posisi",
          "Unit Pelayanan",
          "Shift",
          "Jadwal Shift",
          "Jam Masuk",
          "Tindakan Pertama",
          "Tindakan Terakhir",
          "Jam Pulang",
          "Total Tindakan",
          "Total Pasien",
          "Status Audit",
        ],
        ...timelineExportData.map((staff) => [
          staff.no,
          staff.nama,
          staff.posisi,
          staff.unit,
          staff.shift,
          staff.jadwal,
          staff.jamMasuk,
          staff.tindakanPertama,
          staff.tindakanTerakhir,
          staff.jamPulang,
          staff.totalTindakan,
          staff.totalPasien,
          staff.status,
        ]),
      ];

      const timelineSheet = XLSX.utils.aoa_to_sheet(timelineSheetData);
      timelineSheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
      ];
      timelineSheet["!cols"] = [
        { wch: 7 },
        { wch: 34 },
        { wch: 28 },
        { wch: 30 },
        { wch: 18 },
        { wch: 20 },
        { wch: 14 },
        { wch: 28 },
        { wch: 28 },
        { wch: 14 },
        { wch: 18 },
        { wch: 16 },
        { wch: 22 },
      ];
      timelineSheet["!autofilter"] = {
        ref: `A4:M${Math.max(timelineSheetData.length, 4)}`,
      };
      applySheetStyling(timelineSheet, timelineSheetData, 12, [
        "Nama Tenaga Medis",
      ]);
      XLSX.utils.book_append_sheet(
        workbook,
        timelineSheet,
        "Kinerja Individual",
      );

      // Eksekusi generate file & download
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
        `Laporan Dashboard Analitik ${periodLabel}`,
      );
      formData.append("period", filePeriod);
      formData.append("status", "Selesai");
      formData.append("reportType", "XLSX");

      await axiosInstance.post("/history", formData);
    } catch (error) {
      console.error(
        "Gagal mengekspor laporan dashboard analitik ke Excel:",
        error,
      );
      alert("Laporan Excel gagal dibuat. Silakan coba kembali.");
    }
  };

  return (
    <div className="content-page">
      <section className="status-grid-sect">
        {loading ? (
          //   [...Array(4)].map((_, i) => (
          //     <div key={i} className="stat-card-dash">
          //       <div className="stat-info-dash">
          //         <div
          //           className="skeleton-text"
          //           style={{ width: "120px", height: "16px" }}
          //         ></div>
          //         <div
          //           className="skeleton-text"
          //           style={{ width: "80px", height: "32px", margin: "10px 0" }}
          //         ></div>
          //         <div
          //           className="skeleton-text"
          //           style={{ width: "120px", height: "12px" }}
          //         ></div>
          //       </div>
          //       <div className="stat-icon-dash skeleton-icon"></div>
          //     </div>
          //   ))
          <>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Tindakan Medis</span>
                <div
                  className="skeleton-text"
                  style={{ width: "80px", height: "32px", margin: "10px 0" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "120px", height: "12px" }}
                ></div>
              </div>
              <div className="stat-icon-dash purple-light-dash">
                <FaUserMd />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Jam Kehadiran</span>
                <div
                  className="skeleton-text"
                  style={{ width: "80px", height: "32px", margin: "10px 0" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "120px", height: "12px" }}
                ></div>
              </div>
              <div className="stat-icon-dash green-light-dash">
                <FaClock />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Pasien Ditangani</span>
                <div
                  className="skeleton-text"
                  style={{ width: "80px", height: "32px", margin: "10px 0" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "120px", height: "12px" }}
                ></div>
              </div>
              <div className="stat-icon-dash blue-light-dash">
                <FaUserInjured />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Rata-rata Beban Kerja</span>
                <div
                  className="skeleton-text"
                  style={{ width: "80px", height: "32px", margin: "10px 0" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "120px", height: "12px" }}
                ></div>
              </div>
              <div className="stat-icon-dash orange-light-dash">
                <FaChartBar />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Tindakan Medis</span>
                <span className="stat-value-dash">
                  {formatIntegerID(totalTindakan)}{" "}
                  <span className="stat-text-sect">tindakan</span>
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={dashboardData.deltas?.tindakan} />{" "}
                  {getComparisonLabel()}
                </div>
              </div>
              <div className="stat-icon-dash purple-light-dash">
                <FaUserMd />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Jam Kehadiran</span>
                <span className="stat-value-dash">
                  {formatIntegerID(totalJamKehadiran)}{" "}
                  <span className="stat-text-sect">jam</span>{" "}
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={dashboardData.deltas?.jam} />{" "}
                  {getComparisonLabel()}
                </div>
              </div>
              <div className="stat-icon-dash green-light-dash">
                <FaClock />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Pasien Ditangani</span>
                <span className="stat-value-dash">
                  {formatIntegerID(totalPasien)}{" "}
                  <span className="stat-text-sect">pasien</span>
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={dashboardData.deltas?.pasien} />{" "}
                  {getComparisonLabel()}
                </div>
              </div>
              <div className="stat-icon-dash blue-light-dash">
                <FaUserInjured />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Rata-rata Beban Kerja</span>
                <span className="stat-value-dash">
                  {formatDecimalID(rataRataBebanKerja, 2)}{" "}
                  <span className="stat-text-sect" style={{ fontSize: "13px" }}>
                    pasien/tenaga medis
                  </span>
                </span>
                <div className="stat-sub-dash">
                  <RenderGrowth value={dashboardData.deltas?.rataRata} />{" "}
                  {getComparisonLabel()}
                </div>
              </div>
              <div className="stat-icon-dash orange-light-dash">
                <FaChartBar />
              </div>
            </div>
          </>
        )}
      </section>

      <div
        className="content-grid"
        ref={chartContainerRef}
        style={{ position: "relative" }}
      >
        <div className="header-actions">
          <div className="header-title">
            <h3 className="title-dashboard">Beban Kerja Dokter</h3>
            <p className="chart-subtitle">Berdasarkan presensi dan tindakan</p>
          </div>
          <div className="panel-actions-right">
            <div className="filter-buttons">
              {["month", "week", "day"].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    const today = new Date();
                    let formatString = "";
                    if (p === "day") {
                      formatString = today.toISOString().substring(0, 10);
                    } else if (p === "week") {
                      const startDate = new Date(today.getFullYear(), 0, 1);
                      const days = Math.floor(
                        (today - startDate) / (24 * 60 * 60 * 1000),
                      );
                      const weekNumber = Math.ceil(days / 7);
                      formatString = `${today.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
                    } else {
                      formatString = today.toISOString().substring(0, 7);
                    }
                    setSelectedMonth(formatString);
                  }}
                  className={period === p ? "active" : ""}
                >
                  {p === "month"
                    ? "Bulanan"
                    : p === "week"
                      ? "Mingguan"
                      : "Harian"}
                </button>
              ))}
            </div>
            <input
              type={
                period === "day" ? "date" : period === "week" ? "week" : "month"
              }
              className="select-input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            <select
              name="workload-filter"
              id="workload-filter"
              className="select-input"
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value)}
            >
              <option value="beban_tertinggi">Beban Tertinggi</option>
              <option value="beban_terendah">Beban Terendah</option>
              <option value="jam_tertinggi">Jam Hadir Tertinggi</option>
              <option value="cito_tertinggi">Tindakan Cito Tertinggi</option>
            </select>
            <button
              className="button is-danger"
              onClick={handleExportPDF}
              disabled={loading}
            >
              <FaFilePdf /> PDF
            </button>
            <button
              className="button is-success"
              onClick={handleExportExcel}
              disabled={loading}
            >
              <FaFileExcel /> Excel
            </button>
          </div>
        </div>
        <div className="summary-cards">
          {loading ? (
            <>
              <div className="summary-card">
                <span className="summary-title">Total Tindakan Medis</span>
                <div
                  className="skeleton-text"
                  style={{ width: "60px", height: "24px", marginTop: "8px" }}
                ></div>
              </div>
              <div className="summary-card">
                <span className="summary-title">Dokter Aktif</span>
                <div
                  className="skeleton-text"
                  style={{
                    width: "80px",
                    height: "20px",
                  }}
                ></div>
              </div>
              <div className="summary-card">
                <span className="summary-title">Total Jam Aktivitas</span>
                <div
                  className="skeleton-text"
                  style={{
                    width: "80px",
                    height: "20px",
                  }}
                ></div>
              </div>
              <div className="summary-card alert-card">
                <span className="summary-title text-red">
                  Tindakan Luar Jadwal
                </span>
                <div
                  className="skeleton-text"
                  style={{
                    marginTop: "10px",
                    width: "80px",
                    height: "20px",
                  }}
                ></div>
              </div>
              <div className="summary-card highlight-card">
                <span className="summary-title text-green">
                  Beban Kerja Tertinggi
                </span>
                <div
                  className="skeleton-text"
                  style={{
                    width: "80px",
                    height: "20px",
                  }}
                ></div>
              </div>
            </>
          ) : (
            <>
              <div className="summary-card">
                <span className="summary-title">Total Tindakan Medis</span>
                <span className="card-value">
                  {totalTindakanDokter}{" "}
                  <span className="percentage">tindakan</span>
                </span>
              </div>
              <div className="summary-card">
                <span className="summary-title">Dokter Aktif</span>
                <span className="card-value">{totalDokterAktif}</span>
              </div>
              <div className="summary-card">
                <span className="summary-title">Total Jam Aktivitas</span>
                <span className="card-value">
                  {totalJamKehadiranDokter}{" "}
                  <span className="percentage">jam</span>
                </span>
              </div>
              <div className="summary-card alert-card">
                <span className="summary-title text-red">
                  Tindakan Luar Jadwal
                </span>
                <span className="card-value text-red">
                  {totalOutOfShiftAll}{" "}
                  <span className="percentage">
                    ({formatPercentID(persentaseLuarJadwal)})
                  </span>
                </span>
              </div>
              <div className="summary-card highlight-card">
                <span className="summary-title text-green">
                  Beban Kerja Tertinggi
                </span>
                <span className="card-value text-green title-name">
                  {sortedWorkload[0]?.name || "-"}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="chart-board">
          {(loading || hasWorkloadData) && (
            <div className="axis-guide-container">
              {axisTicks.map((tick) => (
                <div
                  className="axis-line"
                  style={{ left: `${tick.percent}%` }}
                  key={tick.value}
                >
                  {loading ? (
                    <span
                      className="skeleton-text"
                      style={{
                        width: "18px",
                        height: "14px",
                      }}
                    />
                  ) : (
                    <span>{formatIntegerID(tick.value)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="chart-rows">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  className="chart-row skeleton-row"
                  key={i}
                  style={{ opacity: 0.6 }}
                >
                  <div className="dokter-info">
                    <div
                      className="skeleton-text"
                      style={{
                        width: "130px",
                        height: "16px",
                        marginBottom: "6px",
                      }}
                    />
                    <div
                      className="skeleton-text"
                      style={{ width: "90px", height: "12px" }}
                    />
                  </div>
                  <div className="visual-container">
                    <div className="progress-bar-wrapper">
                      <div
                        className="skeleton-text"
                        style={{
                          width: "50%",
                          height: "100%",
                          borderTopLeftRadius: "4px",
                          borderBottomLeftRadius: "4px",
                        }}
                      />
                      <div
                        className="skeleton-text"
                        style={{
                          width: "15%",
                          height: "100%",
                          borderTopRightRadius: "4px",
                          borderBottomRightRadius: "4px",
                          marginLeft: "2px",
                          opacity: 0.7,
                        }}
                      />
                      <div
                        className="skeleton-text"
                        style={{
                          width: "70px",
                          height: "14px",
                          marginLeft: "12px",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : sortedWorkload.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "100px",
                  color: "#64748b",
                }}
              >
                Tidak ada data pada periode ini
              </div>
            ) : (
              sortedWorkload.map((dokter, idx) => {
                const tindakanSesuai = dokter.validActivity || 0;
                const tindakanLuar = dokter.outOfShift || 0;
                const totalTindakan = tindakanSesuai + tindakanLuar;
                const jamHadir = dokter.jam || 0;
                const rasio =
                  jamHadir > 0 ? (totalTindakan / jamHadir).toFixed(1) : 0;
                // const jadwalWidth = (tindakanSesuai / maxScale) * 100;
                // const luarJadwalWidth = (tindakanLuar / maxScale) * 100;
                const jadwalWidth =
                  maxScale > 0 ? (tindakanSesuai / maxScale) * 100 : 0;
                const luarJadwalWidth =
                  maxScale > 0 ? (tindakanLuar / maxScale) * 100 : 0;
                const hasTindakanLuar = tindakanLuar > 0;
                const adjustedLuarJadwalWidth = hasTindakanLuar
                  ? luarJadwalWidth + 1.5
                  : 0;
                // const totalWidth =
                //   maxScale > 0 ? (totalTindakan / maxScale) * 100 : 0;

                // const maxJam = Math.max(
                //   ...sortedWorkload.map((d) => d.jam || 0),
                //   1,
                // );
                // const linePosition = Math.min((jamHadir / maxJam) * 100, 100);
                const isAnyBarHovered = hoveredIdx !== null;
                const isCurrentBarHovered = hoveredIdx === idx;
                return (
                  <div
                    className={`chart-row ${
                      isAnyBarHovered
                        ? isCurrentBarHovered
                          ? "is-active"
                          : "is-dimmed"
                        : ""
                    }`}
                    key={idx}
                  >
                    <div className="dokter-info">
                      <div className="nama-dokter">{dokter.name}</div>
                      <div className="spesialis-dokter">{dokter.position}</div>
                    </div>
                    <div className="visual-container">
                      <div
                        className="progress-bar-wrapper"
                        onMouseEnter={(e) => {
                          setHoveredIdx(idx);
                          setTooltip({
                            visible: true,
                            x: e.clientX,
                            y: e.clientY,
                            data: dokter,
                          });
                        }}
                        onMouseMove={(e) => {
                          setTooltip((prev) => ({
                            ...prev,
                            x: e.clientX,
                            y: e.clientY,
                          }));
                        }}
                        onMouseLeave={() => {
                          setHoveredIdx(null);
                          setTooltip({
                            visible: false,
                            x: 0,
                            y: 0,
                            data: null,
                          });
                        }}
                      >
                        <div
                          //   className="bar-jadwal"
                          className={`bar-jadwal ${!hasTindakanLuar ? "bar-full-rounded" : ""}`}
                          style={{ width: `${jadwalWidth}%` }}
                        >
                          {tindakanSesuai > 0 && (
                            <span className="bar-value">
                              {formatIntegerID(tindakanSesuai)}
                            </span>
                          )}
                        </div>
                        {/* <div
                          className="bar-luar-jadwal"
                            style={{ width: `${luarJadwalWidth}%` }}
                        >
                          {tindakanLuar > 0 && (
                            <span className="bar-value">
                              {formatIntegerID(tindakanLuar)}
                            </span>
                          )}
                        </div> */}
                        {hasTindakanLuar && (
                          <div
                            className="bar-luar-jadwal"
                            style={{ width: `${adjustedLuarJadwalWidth}%` }}
                          >
                            <span className="bar-value">
                              {formatIntegerID(tindakanLuar)}
                            </span>
                          </div>
                        )}
                        <span className="total-and-ratio">
                          <span className="total-num">
                            {formatIntegerID(totalTindakan)}
                          </span>
                          <span className="ratio-text">
                            {formatDecimalID(rasio)} tindakan/jam
                          </span>
                          <span className="jam-badge">{jamHadir} jam</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {tooltip.visible &&
            tooltip.data &&
            (() => {
              const individualTindakan =
                tooltip.data.validActivity + tooltip.data.outOfShift;
              return (
                <div
                  className="dr-workload-tooltip-board"
                  style={{
                    position: "fixed",
                    left: tooltip.x + 12,
                    top: tooltip.y + 12,
                  }}
                >
                  <div className="tooltip-user">
                    <div className="user-text-name">{tooltip.data.name}</div>
                    <div className="user-role">
                      {tooltip.data.position || "Spesialis"}
                    </div>
                  </div>
                  <div className="tooltip-body">
                    <div className="row-item">
                      <span>Tindakan Sesuai Jadwal</span>
                      <span className="val green">
                        {tooltip.data.validActivity}
                      </span>
                    </div>
                    <div className="row-item">
                      <span>Tindakan Luar Jadwal</span>
                      <span className="val red">{tooltip.data.outOfShift}</span>
                    </div>
                    <div className="row-item bold-top">
                      <span>Total Tindakan</span>
                      <span className="val">
                        {tooltip.data.validActivity + tooltip.data.outOfShift}
                      </span>
                    </div>
                    <div className="divider" />
                    <div className="row-item">
                      <span>Jam Kehadiran</span>
                      <span className="val">{tooltip.data.jam} jam</span>
                    </div>
                    <div className="row-item">
                      <span>Pasien Unik</span>
                      <span className="val">{tooltip.data.pasien}</span>
                    </div>
                    <div className="row-item">
                      <span>Tindakan / Jam</span>
                      <span className="val">
                        {(individualTindakan / (tooltip.data.jam || 1)).toFixed(
                          1,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
        </div>
        {loading ? (
          <div className="chart-legend-summary">
            <div
              className="legend-item skeleton-text"
              style={{ width: "115px", height: "18px", margin: "10px 0" }}
            ></div>
            <div
              className="legend-item skeleton-text"
              style={{ width: "180px", height: "18px", margin: "10px 0" }}
            ></div>
            <div
              className="legend-item skeleton-text"
              style={{ width: "95px", height: "18px", margin: "10px 0" }}
            ></div>
          </div>
        ) : (
          <>
            <div className="chart-legend-summary">
              <div className="legend-item-summary">
                <span className="dot-summary green"></span> Tindakan Sesuai
                Jadwal
              </div>
              <div className="legend-item-summary">
                <span className="dot-summary red"></span> Tindakan Luar Jadwal
                (Cito)
              </div>
              <div className="legend-item-summary">
                <span className="dot-summary blue"></span> Jam Hadir / Aktivitas
              </div>
            </div>
          </>
        )}
        {!loading && dashboardData.workload.length > 0 && (
          <div className="workload-summary-footer">
            <p>
              Terdapat{" "}
              <span className="text-danger-bold">
                {dashboardData.workload.reduce(
                  (acc, curr) => acc + (curr.outOfShift || 0),
                  0,
                )}{" "}
                tindakan luar jadwal praktik
              </span>{" "}
              atau{" "}
              <span className="text-danger-bold">
                {formatDecimalID(
                  (
                    (dashboardData.workload.reduce(
                      (acc, curr) => acc + (curr.outOfShift || 0),
                      0,
                    ) /
                      dashboardData.workload.reduce(
                        (acc, curr) =>
                          acc + (curr.validActivity + curr.outOfShift),
                        0,
                      )) *
                    100
                  ).toFixed(1),
                )}
                %
              </span>{" "}
              dari total tindakan medis.{" "}
              <strong>{sortedWorkload[0]?.name}</strong> memiliki beban kerja
              tertinggi yaitu,{" "}
              <strong>
                {sortedWorkload[0]?.validActivity +
                  sortedWorkload[0]?.outOfShift}{" "}
                tindakan medis
              </strong>{" "}
              dalam{" "}
              <strong>{sortedWorkload[0]?.jam} jam aktivitas tercatat</strong>,
              setara{" "}
              <strong>
                {formatDecimalID(
                  (sortedWorkload[0]?.jam > 0
                    ? (sortedWorkload[0]?.validActivity +
                        sortedWorkload[0]?.outOfShift) /
                      sortedWorkload[0]?.jam
                    : 0
                  ).toFixed(1),
                )}{" "}
                tindakan per jam
              </strong>
              .{" "}
              <strong>
                {
                  [...dashboardData.workload].sort(
                    (a, b) => b.outOfShift - a.outOfShift,
                  )[0]?.name
                }
              </strong>{" "}
              juga mencatat tindakan luar jadwal terbanyak, yaitu{" "}
              <span className="text-danger-bold">
                {
                  [...dashboardData.workload].sort(
                    (a, b) => b.outOfShift - a.outOfShift,
                  )[0]?.outOfShift
                }{" "}
                tindakan medis
              </span>
            </p>
          </div>
        )}
      </div>

      {/* LOGIKA RELASI:
       * Medical action & user: mengetahui siapa yg melakukan tindakan dan dari profesi apa
       *medical action & attendances (berdasarkan userid & date of action vs attendance.date): validasi apakah tindakan medis dilakukan saat staf tersebut memang tercatat hadir?
       * attendance & shift assignment & work shift: memetakan tindakan tersebut terjadi di shift mana (pagi, siang, malam)
       */}
      <div className="content-grid bar-chart-container">
        <div className="header-actions">
          <div className="header-title">
            <h3 className="title-dashboard">
              Distribusi Tindakan Medis per Unit Pelayanan
            </h3>
            <p className="chart-subtitle">
              Analisis kontribusi tindakan medis berdasarkan unit pelayanan
              <em>
                Menampilkan 10 unit dengan volume tindakan tertinggi dari 30+
                unit
              </em>
            </p>
          </div>
          <div className="total-badge">
            <div className="badge-content">
              <span className="badge-label">Total Tindakan Medis</span>
              {loading ? (
                <div
                  className="badge-value skeleton-text"
                  style={{ width: "120px", height: "16px" }}
                ></div>
              ) : (
                <>
                  <span className="badge-value">
                    {formatIntegerID(dashboardData.totalSemuaTindakan || 0)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="bar-chart-wrapper">
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                padding: "20px 15px 20px 0",
              }}
            >
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: "15px" }}
                >
                  <div
                    className="skeleton-text"
                    style={{ width: "150px", height: "16px", flexShrink: 0 }}
                  ></div>
                  <div
                    className="skeleton-text"
                    style={{
                      width: `${Math.max(20, 90 - i * 7)}%`,
                      height: "25px",
                      borderRadius: "0 4px 4px 0",
                    }}
                  ></div>
                </div>
              ))}
            </div>
          ) : top10Distribution.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "100px",
                color: "#64748b",
              }}
            >
              Tidak ada data pada periode ini
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(top10Distribution.length * 45, 250)}
            >
              <BarChart
                layout="vertical"
                data={top10Distribution}
                margin={{ top: 5, right: 280, left: 15, bottom: 5 }}
                barSize={25}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#334155", fontSize: 13, fontWeight: 500 }}
                  width={150}
                  style={{ fontWeight: "bold" }}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  content={<CustomHorizontalBarTooltip />}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {top10Distribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#0d9488" : "#E2E8F0"}
                    />
                  ))}
                  <LabelList
                    dataKey="value"
                    content={(props) => {
                      const { x, y, width, value, index } = props;
                      const percentage =
                        top10Distribution[index]?.persentase || "0%";
                      const isInside = width > 55;
                      return (
                        <g>
                          <text
                            x={isInside ? x + width - 10 : x + width + 8}
                            y={y + 15}
                            fill={
                              isInside && index === 0 ? "#ffffff" : "#1e293b"
                            }
                            fontSize="13"
                            fontWeight="700"
                            textAnchor={isInside ? "end" : "start"}
                          >
                            {formatIntegerID(value)}
                          </text>
                          <text
                            x={isInside ? x + width + 8 : x + width + 45}
                            y={y + 15}
                            fill="#64748b"
                            fontSize="12"
                          >
                            ({percentage})
                          </text>
                          {index === 0 && (
                            <text
                              x={isInside ? x + width + 70 : x + width + 140}
                              y={y + 14}
                              fill="#0d9488"
                              fontSize="13"
                              fontWeight="600"
                            >
                              ← {insightText}
                            </text>
                          )}
                        </g>
                      );
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        {!loading && top10Distribution.length > 0 && (
          <div className="chart-footer-stats">
            <div className="stat-item">
              <FaTrophy className="icon-gold" />
              <span>
                Unit volume tertinggi:{" "}
                <strong>{dashboardData.unitVolumeTertinggi}</strong>
              </span>
            </div>
            <div className="stat-item">
              <FaPercentage className="icon-teal" />
              <span>
                Kontribusi tertinggi:{" "}
                <strong>
                  {dashboardData.kontribusiTertinggi} dari total keseluruhan
                </strong>
              </span>
            </div>
            <div className="stat-item" style={{ fontStyle: "italic" }}>
              <span>
                Unit lainnya menyumbang {dashboardData.totalTindakanLainnya}
              </span>
            </div>
          </div>
        )}
      </div>

      <div
        className="content-grid"
        style={{
          marginBottom: 0,
          position: "relative",
        }}
      >
        <div className="header-actions">
          <div className="header-title">
            <h3 className="title-dashboard">
              Heatmap Kesibukan Layanan per Unit dan Jam Operasional
            </h3>
            <p className="chart-subtitle">
              Analisis tingkat kesibukan berdasarkan rasio jumlah tindakan medis
              terhadap tenaga medis hadir per jam
              <em>Rasio = jumlah tindakan ÷ tenaga medis hadir per jam</em>
            </p>
          </div>
        </div>
        <div className="heatmap-legend">
          <div className="legend-item">
            <span className="box-summary no-data-heatmap"></span> Tidak Ada
            Tindakan
          </div>
          <div className="legend-item">
            <span className="box-summary green"></span> Sepi (Rasio &lt; 1,5)
          </div>
          <div className="legend-item">
            <span className="box-summary yellow"></span> Sedang (1,5 - 2,5)
          </div>
          <div className="legend-item">
            <span className="box-summary red"></span> Sangat Padat (Rasio &gt;
            2,5)
          </div>
        </div>
        <div
          className="heatmap-scroll-container"
          style={{
            maxHeight: "400px",
            overflowY: "auto",
            overflowX: "auto",
          }}
          onMouseLeave={() => setHoveredCell(null)}
        >
          <div className="heatmap-grid-wrapper">
            <div className="heatmap-row">
              <div className="unit-label-header"></div>
              <div className="cells-container">
                {hours.map((h) => (
                  <div key={h} className="hour-label">
                    {h < 10 ? `0${h}` : h}
                  </div>
                ))}
              </div>
              <div className="average-header">
                Rata-rata
                <br />
                Rasio/Hari
              </div>
            </div>
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <div
                  key={rIdx}
                  className="heatmap-row skeleton-row"
                  style={{ opacity: 0.7 }}
                >
                  <div className="unit-label">
                    <div
                      className="skeleton-text"
                      style={{
                        width: "80px",
                        height: "16px",
                        backgroundColor: "#e2e8f0",
                        borderRadius: "4px",
                        margin: "10px",
                      }}
                    />
                  </div>
                  <div className="cells-container">
                    {hours.map((_, cIdx) => (
                      <div
                        key={cIdx}
                        className="heatmap-cell skeleton-cell"
                        style={{
                          backgroundColor: "#f1f5f9",
                          borderRadius: "2px",
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : !dashboardData.heatmap || dashboardData.heatmap.length === 0 ? (
              <div
                style={{
                  padding: "100px",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                Tidak ada data pada periode ini
              </div>
            ) : (
              dashboardData.heatmap.map((row, idx) => {
                const avgVal = getRowAverage(row);
                return (
                  <div key={idx} className="heatmap-row">
                    <div className="unit-label">{row.unit}</div>
                    <div className="cells-container">
                      {row.data.map((cell, cIdx) => (
                        <div
                          key={cIdx}
                          className="heatmap-cell"
                          style={{
                            backgroundColor: getCellColor(
                              cell.tindakan,
                              cell.ratio,
                            ),
                          }}
                          onMouseEnter={(e) => {
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            const container = e.currentTarget
                              .closest(".content-grid")
                              .getBoundingClientRect();

                            setHoveredCell({
                              ...cell,
                              unit: row.unit,
                              x: rect.left - container.left + rect.width / 2,
                              y: rect.top - container.top,
                            });
                          }}
                        />
                      ))}
                    </div>
                    <div
                      className="row-average"
                      style={{ color: getAverageColor(avgVal) }}
                    >
                      {avgVal}
                    </div>
                  </div>
                );
              })
            )}
            <div className="heatmap-footer-labels">
              <div className="unit-label-header"></div>
              <div className="cells-container">
                <div className="time-label">00:00</div>
                <div className="time-label">06:00</div>
                <div className="time-label">12:00</div>
                <div className="time-label">18:00</div>
                <div className="time-label">23:00</div>
              </div>
              <div className="average-header"></div>
            </div>
            <div className="heatmap-axis-title">Jam Operasional</div>
          </div>
        </div>
        {!loading && dashboardData.heatmap.length > 0 && (
          <>
            <div className="scroll-indicator">
              <span>
                ⇅ Gulir ke bawah untuk melihat seluruh unit pelayanan -
                menampilkan 10 unit dengan rata-rata rasio kesibukan tertinggi
                dari seluruh unit tersedia
              </span>
            </div>
            <div className="heatmap-summary-cards">
              <div className="h-summary-card">
                <div className="h-card-icon">
                  <FaRegClock
                    style={{ color: "#3b82f6", width: "24px", height: "24px" }}
                  />
                </div>
                <div className="h-card-content">
                  <div className="h-card-title">Jam Tersibuk</div>
                  <div className="h-card-value">
                    {dashboardData.heatmapSummary?.jam_tersibuk?.rentang_jam ||
                      "-"}
                  </div>
                  <div className="h-card-sub">
                    <div>
                      Rata-rata rasio{" "}
                      {formatRatio(
                        dashboardData.heatmapSummary?.jam_tersibuk
                          ?.nilai_rasio || 0,
                      )}{" "}
                      <br />
                      Dibandingkan jam lainnya
                    </div>
                    <span className="h-badge yellow">
                      {formatPercentID(
                        dashboardData.heatmapSummary?.jam_tersibuk?.persentase,
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-summary-card">
                <div className="h-card-icon">
                  <FaBullseye
                    style={{ color: "#3b82f6", width: "24px", height: "24px" }}
                  />
                </div>
                <div className="h-card-content">
                  <div className="h-card-title">Unit Paling Padat</div>
                  <div className="h-card-value">
                    {dashboardData.heatmapSummary?.unit_paling_padat
                      ?.nama_unit || "-"}
                  </div>
                  <div className="h-card-sub">
                    <div>
                      Rata-rata rasio{" "}
                      {formatRatio(
                        dashboardData.heatmapSummary?.unit_paling_padat
                          ?.nilai_rasio || 0,
                      )}{" "}
                      <br />
                      Dibandingkan unit lainnya
                    </div>
                    <span className="h-badge green">
                      {formatPercentID(
                        dashboardData.heatmapSummary?.unit_paling_padat
                          ?.persentase,
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-summary-card">
                <div className="h-card-icon">
                  <FaUsers
                    style={{ color: "#3b82f6", width: "24px", height: "24px" }}
                  />
                </div>
                <div className="h-card-content">
                  <div className="h-card-title">Rasio Tertinggi</div>
                  <div
                    className="h-card-value"
                    style={{
                      color:
                        dashboardData.heatmapSummary?.rasio_tertinggi
                          ?.status === "KRITIS"
                          ? "#dc2626"
                          : "#22c55e",
                    }}
                  >
                    {dashboardData.heatmapSummary?.rasio_tertinggi
                      ? `${dashboardData.heatmapSummary.rasio_tertinggi.nama_unit} - Jam ${dashboardData.heatmapSummary.rasio_tertinggi.jam_tindakan}`
                      : "-"}
                  </div>
                  <div className="h-card-sub">
                    <div>
                      Rasio{" "}
                      {formatRatio(
                        dashboardData.heatmapSummary?.rasio_tertinggi
                          ?.nilai_rasio || 0,
                      )}
                      <br />
                      {dashboardData.heatmapSummary?.rasio_tertinggi
                        ?.kategori || "Aman"}
                    </div>
                    <span
                      className={`h-badge ${
                        dashboardData.heatmapSummary?.rasio_tertinggi
                          ?.status === "KRITIS"
                          ? "red"
                          : "green"
                      }`}
                    >
                      <span>
                        {dashboardData.heatmapSummary?.rasio_tertinggi
                          ?.status || "-"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-summary-card">
                <div className="h-card-icon">
                  <FaRegFileAlt
                    style={{ color: "#3b82f6", width: "24px", height: "24px" }}
                  />
                </div>
                <div className="h-card-content">
                  <div className="h-card-title">Ringkasan</div>
                  <p className="ringkasan-text">
                    Terdapat{" "}
                    <strong>
                      {dashboardData.heatmapSummary?.ringkasan?.nilai_slot || 0}
                    </strong>{" "}
                    slot waktu dengan rasio sangat padat (Rasio &gt; 2,5) yang
                    memerlukan perhatian manajemen, terutama di unit{" "}
                    <strong>
                      {dashboardData.heatmapSummary?.ringkasan
                        ?.top_unit_pertama || "-"}
                    </strong>
                    {dashboardData.heatmapSummary?.ringkasan?.top_unit_kedua &&
                      dashboardData.heatmapSummary.ringkasan.top_unit_kedua !==
                        "-" && (
                        <>
                          {" "}
                          dan{" "}
                          <strong>
                            {
                              dashboardData.heatmapSummary.ringkasan
                                .top_unit_kedua
                            }
                          </strong>
                        </>
                      )}{" "}
                    pada {dashboardData.heatmapSummary?.ringkasan?.waktu || "-"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
        {hoveredCell && (
          <div
            className="heatmap-tooltip"
            style={{
              left: `${hoveredCell.x}px`,
              top: `${hoveredCell.y - 10}px`,
              transform: "translate(-50%, -100%)",
              minWidth: "220px",
            }}
            onMouseLeave={() => setHoveredCell(null)}
          >
            <div
              className="tooltip-unit"
              style={{
                marginBottom: "8px",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "4px",
              }}
            >
              {hoveredCell.unit}
            </div>
            <div className="tooltip-row">
              <span>Waktu/Jam:</span>
              <strong>
                {hoveredCell.hour < 10
                  ? `0${hoveredCell.hour}:00`
                  : `${hoveredCell.hour}:00`}
              </strong>
            </div>
            <div className="tooltip-row">
              <span>Shift Terlibat:</span>
              <strong>{hoveredCell.shift_name || "-"}</strong>
            </div>
            <div className="tooltip-row">
              <span>Jumlah Tindakan:</span>
              <strong>{hoveredCell.tindakan} tindakan</strong>
            </div>
            {hoveredCell.slot_count > 0 && (
              <div className="tooltip-row">
                <span>Jumlah Slot Data:</span>
                <strong>{hoveredCell.slot_count} slot</strong>
              </div>
            )}
            <div className="tooltip-row">
              <span>Total Pasien:</span>
              <strong>{hoveredCell.total_pasien}</strong>
            </div>
            <div className="tooltip-row">
              <span>Rata-rata Tenaga Hadir:</span>
              <strong>{formatRatio(hoveredCell.karyawan)} orang</strong>
            </div>
            {hoveredCell.identitas_tenaga_medis && (
              <div
                className="tooltip-row"
                style={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  marginTop: "4px",
                }}
              >
                <span>Identitas Nakes:</span>
                <div
                  style={{
                    fontSize: "0.85em",
                    fontWeight: "600",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.4",
                  }}
                >
                  {hoveredCell.identitas_tenaga_medis
                    .split(" | ")
                    .map((nama, i) => (
                      <div key={i}>• {nama}</div>
                    ))}
                </div>
              </div>
            )}
            <div
              className="tooltip-row border-top"
              style={{
                marginTop: "8px",
                paddingTop: "8px",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <span>Rasio Beban Kerja:</span>
              <strong>{formatRatio(hoveredCell.ratio)}</strong>
            </div>
          </div>
        )}
      </div>

      <div
        className="content-grid"
        style={{
          marginBottom: 0,
          position: "relative",
        }}
      >
        <div className="header-actions timeline-header-actions">
          <div className="header-title">
            <h3 className="title-dashboard">
              Ringkasan Indikasi Anomali Kinerja Individual
            </h3>
            <p className="chart-subtitle">
              Audit kehadiran dan aktivitas individual
            </p>
            <div className="anomali-warning">
              <FaExclamationTriangle />
              <span>
                Indikasi anomali: tindakan di luar jadwal, presensi tidak
                lengkap, atau tidak ada aktivitas tindakan medis
              </span>
            </div>
          </div>
          <div className="timeline-controls">
            <div className="filter-buttons">
              {["Semua", "Normal", "Anomali"].map((f) => (
                <button
                  key={f}
                  onClick={() => setTimelineFilter(f)}
                  className={timelineFilter === f ? "active" : ""}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="timeline-kpi-container">
          <div className="kpi-card total">
            <div className="kpi-label">Total Tenaga Medis</div>
            {loading ? (
              <div
                className="kpi-value anomali-text skeleton-text"
                style={{ width: "100px", height: "26px" }}
              ></div>
            ) : (
              <div className="kpi-value">{totalStaff}</div>
            )}
          </div>
          <div className="kpi-card normal">
            <div className="kpi-label green">Normal</div>
            {loading ? (
              <div
                className="kpi-value anomali-text skeleton-text"
                style={{ width: "100px", height: "26px" }}
              ></div>
            ) : (
              <div className="kpi-value normal-text">{countNormal}</div>
            )}
          </div>
          <div className="kpi-card anomali">
            <div className="kpi-label red">Indikasi Anomali</div>
            {loading ? (
              <div
                className="kpi-value anomali-text skeleton-text"
                style={{ width: "100px", height: "26px" }}
              ></div>
            ) : (
              <div className="kpi-value anomali-text">{countAnomaly}</div>
            )}
          </div>
          <div className="kpi-card persentase">
            <div className="kpi-label orange">Persentase Indikasi Anomali</div>
            {loading ? (
              <div
                className="kpi-value anomali-text skeleton-text"
                style={{ width: "100px", height: "26px" }}
              ></div>
            ) : (
              <div className="kpi-value percent-anomali-text">
                {formatPercentID(percentageAnomaly)}
              </div>
            )}
          </div>
          <div className="kpi-card unit">
            <div className="kpi-label blue">
              Unit Indikasi Anomali Terbanyak
            </div>

            {loading ? (
              <>
                {" "}
                <div
                  className="kpi-value anomali-text skeleton-text"
                  style={{ width: "100px", height: "26px" }}
                ></div>
                <div
                  className="kpi-value anomali-text skeleton-text"
                  style={{ width: "70px", height: "12px" }}
                ></div>
              </>
            ) : (
              <>
                <div className="kpi-value unit-name">{topAnomalyUnit}</div>
                <div className="kpi-subtext">
                  {topAnomalyCount} kasus (
                  {formatPercentID(topAnomalyPercentage)})
                </div>
              </>
            )}
          </div>
        </div>
        <div className="timeline-legend">
          <div className="timeline-left">
            <div className="legend-item">
              <span className="dot normal"></span> Normal
            </div>
            <div className="legend-item">
              <span className="dot anomali"></span> Indikasi Anomali
            </div>
          </div>
          <div className="timeline-right">
            <div className="marker-legend">
              <span>
                <FaSignInAlt className="blue" /> Check-in
              </span>
              <span>
                <FaStethoscope className="orange" /> Tindakan Pertama & Terakhir
              </span>
              <span>
                <FaSignOutAlt className="purple" /> Check-out
              </span>
            </div>
          </div>
        </div>
        <div className="timeline-scroll-container">
          <div className="timeline-grid">
            <div className="timeline-row header">
              <div className="name-col"></div>
              <div className="track-col">
                {hours.map((h) => (
                  <span key={h} className="time-tick">
                    {h < 10 ? `0${h}:00` : `${h}:00`}
                  </span>
                ))}
              </div>
            </div>
            {loading ? (
              [...Array(5)].map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="timeline-row skeleton-row"
                >
                  <div className="name-col">
                    <span className="status-indicator skeleton-loading"></span>
                    <div style={{ flex: 1 }}>
                      <div className="skeleton-loading skeleton-text-title"></div>
                      <div className="skeleton-loading skeleton-text-subtitle"></div>
                    </div>
                  </div>
                  <div className="track-col">
                    <div className="grid-lines">
                      {[...Array(24)].map((_, i) => (
                        <div key={i} className="vertical-line"></div>
                      ))}
                    </div>
                    <div
                      className="skeleton-loading skeleton-activity-bar"
                      style={{
                        left: `${15 + idx * 8}%`,
                        width: "30%",
                        position: "absolute",
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : currentItems.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "100px",
                  color: "#64748b",
                }}
              >
                Tidak ada data pada periode ini
              </div>
            ) : (
              currentItems
                .filter((staff) => {
                  if (timelineFilter === "Semua") return true;
                  if (timelineFilter === "Normal")
                    return staff.status_audit === "Normal";
                  if (timelineFilter === "Anomali")
                    return staff.status_audit !== "Normal";
                  return true;
                })
                .map((staff, idx) => {
                  const posShiftStart = getPos(staff.shiftStart);
                  const posShiftEnd = getPos(staff.shiftEnd);
                  const posCheckIn = getPos(staff.jam_masuk);
                  const posCheckOut = getPos(staff.jam_pulang);
                  const jamTindakanPertama = staff.tanggal_tindakan_pertama
                    ? staff.tanggal_tindakan_pertama.split(" ")[1]
                    : null;
                  const posActionFirst = getPos(jamTindakanPertama);
                  const jamTindakanTerakhir = staff.tanggal_tindakan_terakhir
                    ? staff.tanggal_tindakan_terakhir.split(" ")[1]
                    : null;
                  const posActionLast = getPos(jamTindakanTerakhir);
                  const isAnomali = staff.status_audit !== "Normal";
                  return (
                    <div key={staff.id || idx} className="timeline-row">
                      <div className="name-col">
                        <span
                          className={`status-indicator ${isAnomali ? "anomali" : "normal"}`}
                        ></span>
                        <div>
                          <div className="staff-name">
                            {staff.nama_tenaga_medis}
                          </div>
                          <div className="staff-role">
                            {staff.position_name}
                          </div>
                        </div>
                      </div>
                      <div className="track-col">
                        <div className="grid-lines">
                          {[...Array(24)].map((_, i) => (
                            <div key={i} className="vertical-line"></div>
                          ))}
                        </div>
                        {staff.shiftStart &&
                          staff.shiftEnd &&
                          (posShiftStart <= posShiftEnd ? (
                            <div
                              className={`activity-bar ${isAnomali ? "anomali" : "normal"}`}
                              style={{
                                left: `${posShiftStart}%`,
                                width: `${posShiftEnd - posShiftStart}%`,
                                position: "absolute",
                              }}
                            ></div>
                          ) : (
                            /* Handling Shift Malam / Lintas Hari (contoh: 21:00 - 07:00) */
                            <>
                              <div
                                className={`activity-bar ${isAnomali ? "anomali" : "normal"}`}
                                style={{
                                  left: `${posShiftStart}%`,
                                  width: `${100 - posShiftStart}%`,
                                  position: "absolute",
                                }}
                              ></div>
                              <div
                                className={`activity-bar ${isAnomali ? "anomali" : "normal"}`}
                                style={{
                                  left: `0%`,
                                  width: `${posShiftEnd}%`,
                                  position: "absolute",
                                }}
                              ></div>
                            </>
                          ))}
                        {staff.jam_masuk && (
                          <div
                            className="marker in"
                            style={{
                              left: `${posCheckIn}%`,
                              position: "absolute",
                            }}
                            onMouseEnter={(e) =>
                              setHoveredTimeline({
                                ...staff,
                                type: "check-in",
                                x: e.clientX,
                                y: e.clientY,
                              })
                            }
                            onMouseLeave={() => setHoveredTimeline(null)}
                          >
                            <FaSignInAlt />
                          </div>
                        )}
                        {jamTindakanPertama && (
                          <div
                            className="marker action"
                            style={{
                              left: `${posActionFirst}%`,
                              position: "absolute",
                            }}
                            onMouseEnter={(e) =>
                              setHoveredTimeline({
                                ...staff,
                                type: "action",
                                currentActionName: staff.nama_tindakan_pertama,
                                currentActionTime: jamTindakanPertama,
                                x: e.clientX,
                                y: e.clientY,
                              })
                            }
                            onMouseLeave={() => setHoveredTimeline(null)}
                          >
                            <FaStethoscope />
                          </div>
                        )}

                        {jamTindakanTerakhir &&
                          jamTindakanTerakhir !== jamTindakanPertama && (
                            <div
                              className="marker action"
                              style={{
                                left: `${posActionLast}%`,
                                position: "absolute",
                              }}
                              onMouseEnter={(e) =>
                                setHoveredTimeline({
                                  ...staff,
                                  type: "action",
                                  currentActionName:
                                    staff.nama_tindakan_terakhir,
                                  currentActionTime: jamTindakanTerakhir,
                                  x: e.clientX,
                                  y: e.clientY,
                                })
                              }
                              onMouseLeave={() => setHoveredTimeline(null)}
                            >
                              <FaStethoscope />
                            </div>
                          )}

                        {staff.jam_pulang && (
                          <div
                            className="marker out"
                            style={{
                              left: `${posCheckOut}%`,
                              position: "absolute",
                            }}
                            onMouseEnter={(e) =>
                              setHoveredTimeline({
                                ...staff,
                                type: "check-out",
                                x: e.clientX,
                                y: e.clientY,
                              })
                            }
                            onMouseLeave={() => setHoveredTimeline(null)}
                          >
                            <FaSignOutAlt />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
          {hoveredTimeline && (
            <div
              className="timeline-tooltip-v2"
              style={{
                left: hoveredTimeline.x + 15,
                top: hoveredTimeline.y - 150,
              }}
            >
              <div className="tooltip-user-profile">
                <div className="user-avatar-circle">
                  <FaUserMd />
                </div>
                <div className="user-info-text-profile">
                  <div className="user-name-text">
                    {hoveredTimeline.nama_tenaga_medis}
                  </div>
                  <div className="user-role">
                    {hoveredTimeline.position_name}
                  </div>
                  <div className="user-shift-time">
                    <FaUserClock size={10} /> {hoveredTimeline.shiftName} (
                    {hoveredTimeline.shiftStart} - {hoveredTimeline.shiftEnd})
                  </div>
                </div>
              </div>
              <div className="tooltip-activity">
                <div className="activity-label">AKTIVITAS SAAT INI</div>
                <div className="activity-main">
                  <div className="activity-icon-box">
                    {hoveredTimeline.type === "check-in" && (
                      <FaSignInAlt className="blue-icon" />
                    )}
                    {hoveredTimeline.type === "action" && (
                      <FaStethoscope className="orange-icon" />
                    )}
                    {hoveredTimeline.type === "check-out" && (
                      <FaSignOutAlt className="purple-icon" />
                    )}
                  </div>
                  <div className="activity-details">
                    <div className="activity-title">
                      {hoveredTimeline.type === "check-in" && "Check-in"}
                      {hoveredTimeline.type === "action" &&
                        (hoveredTimeline.currentActionName || "Tindakan Medis")}
                      {hoveredTimeline.type === "check-out" && "Check-out"}
                    </div>
                    <div className="activity-subtitle">
                      {hoveredTimeline.type === "action"
                        ? `Unit: ${hoveredTimeline.unit_pelayanan}`
                        : "Log Absensi QR"}
                    </div>
                  </div>
                  <div className="activity-time-badge">
                    {hoveredTimeline.type === "check-in" &&
                      (hoveredTimeline.jam_masuk || "--:--")}
                    {hoveredTimeline.type === "action" &&
                      hoveredTimeline.currentActionTime}
                    {hoveredTimeline.type === "check-out" &&
                      (hoveredTimeline.jam_pulang || "--:--")}
                  </div>
                </div>
              </div>
              <div className="tooltip-summary-section">
                <div className="summary-label">RINGKASAN HARI INI</div>
                <div className="summary-row">
                  <span>
                    <FaSignInAlt className="icon-blue" /> Masuk
                  </span>
                  <span className="time-val">
                    {hoveredTimeline.jam_masuk || "--:--"}
                  </span>
                </div>
                <div className="summary-row">
                  <span>
                    <FaStethoscope className="icon-orange" /> Tindakan
                  </span>
                  <span className="time-val">
                    {hoveredTimeline.total_tindakan}x (Pasien:{" "}
                    {hoveredTimeline.total_pasien})
                  </span>
                </div>
                <div className="summary-row">
                  <span>
                    <FaSignOutAlt className="icon-purple" /> Pulang
                  </span>
                  <span className="time-val">
                    {hoveredTimeline.jam_pulang || "--:--"}
                  </span>
                </div>
              </div>
              <div className="tooltip-footer-status">
                <span>Audit Status</span>
                <span
                  className={`stats-pill ${hoveredTimeline.status_audit === "Normal" ? "normal" : "anomali"}`}
                >
                  {hoveredTimeline.status_audit}
                </span>
              </div>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="timeline-footer">
            <p className="pag-footer-text">
              Menampilkan {filteredData.length > 0 ? indexOfFirstItem + 1 : 0} -{" "}
              {Math.min(indexOfLastItem, filteredData.length)} dari{" "}
              {filteredData.length} data
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
    </div>
  );
};

export default WorkloadAnalysis;
