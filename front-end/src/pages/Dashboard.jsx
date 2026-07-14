import React, { useState, useEffect } from "react";
// import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaUserMd,
  FaCalendarDay,
  FaExchangeAlt,
  FaClock,
  FaUsers,
  FaUserCheck,
  FaUserClock,
  FaUserTimes,
  FaArrowUp,
  FaArrowDown,
  FaArrowRight,
} from "react-icons/fa";
import axiosInstance from "../api/axios";

function Dashboard() {
  //   const token = localStorage.getItem("token");
  const today = new Date().toISOString().split("T")[0];
  const [shiftExchanges, setShiftExchanges] = useState([]);
  const [chartData, setChartData] = useState([]);
  const user = JSON.parse(localStorage.getItem("user")) || {
    fullName: "Admin",
  };
  const [attendanceMetrics, setAttendanceMetrics] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
  });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [shiftMetrics, setShiftMetrics] = useState({
    totalStaff: 0,
    todaySchedule: 0,
    activeShifts: 0,
    exchangeRequests: 0,
  });
  const [growthMetrics, setGrowthMetrics] = useState({
    staff: 0,
    schedule: 0,
    shifts: 0,
    exchanges: 0,
  });
  const [loading, setLoading] = useState(true);

  //   useEffect(() => {
  //     fetchAttendanceMetrics();
  //     fetchTodaySchedule();
  //     fetchShiftMetrics();
  //     fetchShiftExchanges();
  //     fetchMonthlyAttendance();
  //   }, []);

  useEffect(() => {
    // Implementasi Promise.allSettled untuk memuat semua data secara paralel
    const fetchDashboardContent = async () => {
      setLoading(true);
      try {
        await Promise.allSettled([
          fetchAttendanceMetrics(),
          fetchTodaySchedule(),
          fetchShiftMetrics(),
          fetchShiftExchanges(),
          fetchMonthlyAttendance(),
        ]);
      } catch (error) {
        console.error("Gagal memuat konten dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAttendanceMetrics = async () => {
    setLoading(true);
    try {
      //   const res = await axios.get(
      //     `http://localhost:3000/attendances?date=${today}`,
      //     { headers: { Authorization: `Bearer ${token}` }},
      //   );
      const res = await axiosInstance.get(`/attendances?date=${today}`);
      const todayAttendances = res.data.data.filter(
        (att) => att.date.slice(0, 10) === today,
      );
      const present = todayAttendances.filter(
        (a) => a.attendanceStatus === "Hadir",
      ).length;
      const late = todayAttendances.filter(
        (a) => a.attendanceStatus === "Terlambat",
      ).length;
      const absent = todayAttendances.filter((a) =>
        ["Izin", "Sakit", "Tidak Hadir"].includes(a.attendanceStatus),
      ).length;

      setAttendanceMetrics((prev) => ({
        ...prev,
        presentToday: present,
        lateToday: late,
        absentToday: absent,
      }));
    } catch (err) {
      console.log("Error fetch attendance metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaySchedule = async () => {
    setLoading(true);
    try {
      //   const res = await axios.get(
      //     `http://localhost:3000/shifts?date=${today}`,
      //     {  headers: { Authorization: `Bearer ${token}` }},
      //   );
      const res = await axiosInstance.get(`/shifts?date=${today}`);
      const filtered = res.data.data.filter((sh) => {
        const shiftDate = sh.date?.slice(0, 10);
        return shiftDate === today;
      });

      const mapped = filtered.map((sh) => ({
        name: `${sh.user.titlePrefix} ${sh.user.fullName}`,
        unit: sh.user?.position?.name || "-",
        shift: sh.workShift?.name || "Tidak ditemukan",
        time: `${sh.workShift?.startTime.slice(
          0,
          5,
        )} - ${sh.workShift?.endTime.slice(0, 5)}`,
      }));

      setTodaySchedule(mapped);
      setShiftMetrics((prev) => ({ ...prev, todaySchedule: mapped.length }));
    } catch (err) {
      console.log("Error fetch schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchShiftMetrics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonth = lastMonthDate.getMonth();

      //   const staffRes = await axios.get("http://localhost:3000/users", {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });
      const staffRes = await axiosInstance.get("/users");
      const allUsers = staffRes.data.data;

      const totalEmployees = allUsers.filter(
        (u) => u.status === "Aktif" || u.status === "Cuti",
      ).length;

      const medicalProfessions = [
        "Analis",
        "Apoteker",
        "Asisten Apoteker",
        "Bidan",
        "Dokpol",
        "Dokter",
        "Dokter Spesialis",
        "Fisioterapis",
        "Penata Anestesi",
        "Penunjang Medis",
        "Perawat",
        "Perekam Medis",
        "Psikolog",
        "Radiografer",
      ];

      //   const totalMedicalStaff = allUsers.filter(
      //     (u) =>
      //       (u.status === "Aktif" || u.status === "Cuti") &&
      //       u.profession &&
      //       medicalProfessions.includes(u.profession.name),
      //   ).length;

      const medicalStaffArray = allUsers.filter(
        (u) =>
          (u.status === "Aktif" || u.status === "Cuti") &&
          u.profession &&
          medicalProfessions.includes(u.profession.name),
      );
      const totalMedicalStaffCount = medicalStaffArray.length;

      setShiftMetrics((prev) => ({
        ...prev,
        totalStaff: totalMedicalStaffCount,
      }));
      setAttendanceMetrics((prev) => ({
        ...prev,
        totalEmployees: totalEmployees,
      }));

      //   const shiftRes = await axios.get(
      //     `http://localhost:3000/shifts?date=${today}`,
      //     {headers: { Authorization: `Bearer ${token}` }},
      //   );
      const shiftRes = await axiosInstance.get(`shifts?date=${today}`);

      const shiftsOnlyToday = shiftRes.data.data.filter((s) => {
        const shiftDate = s.date?.slice(0, 10);
        return shiftDate === today;
      });

      const activeShiftsCount = shiftsOnlyToday.length;
      //   console.log("Total Shift Hari Ini (Aktif):", activeShiftsCount);

      //   const isShiftActive = (startTime, endTime) => {
      //     if (!startTime || !endTime) return false;
      //     const currentTime = new Date();
      //     const currentTotalMinutes =
      //       currentTime.getHours() * 60 + currentTime.getMinutes();

      //     const [startHour, startMinute] = startTime.split(":").map(Number);
      //     const startTotalMinutes = startHour * 60 + startMinute;

      //     const [endHour, endMinute] = endTime.split(":").map(Number);
      //     const endTotalMinutes = endHour * 60 + endMinute;

      //     if (startTotalMinutes <= endTotalMinutes) {
      //       return (
      //         currentTotalMinutes >= startTotalMinutes &&
      //         currentTotalMinutes <= endTotalMinutes
      //       );
      //     } else {
      //       return (
      //         currentTotalMinutes >= startTotalMinutes ||
      //         currentTotalMinutes <= endTotalMinutes
      //       );
      //     }
      //   };

      //   // FILTER 2: Dari shift hari ini, mana yang jam-nya sedang aktif?
      //   const activeShiftsArray = shiftsOnlyToday.filter((s) =>
      //     isShiftActive(s.workShift?.startTime, s.workShift?.endTime),
      //   );

      //   const activeShiftsCount = activeShiftsArray.length;
      //   console.log("Total Shift Hari Ini:", shiftsOnlyToday.length);
      //   console.log("Jumlah Shift Aktif Saat Ini:", activeShiftsCount);

      const exchangeRes = await axiosInstance.get("/all-shift-exchanges");
      //   const exchangeRes = await axios.get(
      //     "http://localhost:3000/all-shift-exchanges",
      //     { headers: { Authorization: `Bearer ${token}` } },
      //   );
      const staffThisMonth = medicalStaffArray.filter(
        (u) => new Date(u.createdAt).getMonth() === currentMonth,
      ).length;
      const staffLastMonth = medicalStaffArray.filter(
        (u) => new Date(u.createdAt).getMonth() === lastMonth,
      ).length;

      //   const allShiftsRes = await axios.get("http://localhost:3000/shifts", {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });
      const allShiftsRes = await axiosInstance.get("/shifts");
      const shiftsThisMonth = allShiftsRes.data.data.filter(
        (s) => new Date(s.date).getMonth() === currentMonth,
      ).length;
      const shiftsLastMonth = allShiftsRes.data.data.filter(
        (s) => new Date(s.date).getMonth() === lastMonth,
      ).length;

      const exchangesThisMonth = exchangeRes.data.data.filter(
        (ex) => new Date(ex.createdAt).getMonth() === currentMonth,
      ).length;
      const exchangesLastMonth = exchangeRes.data.data.filter(
        (ex) => new Date(ex.createdAt).getMonth() === lastMonth,
      ).length;

      const calculateGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return (((current - previous) / previous) * 100).toFixed(1);
      };

      setGrowthMetrics({
        staff: calculateGrowth(staffThisMonth, staffLastMonth),
        schedule: calculateGrowth(shiftsThisMonth, shiftsLastMonth),
        exchanges: calculateGrowth(exchangesThisMonth, exchangesLastMonth),
      });

      setShiftMetrics((prev) => ({
        ...prev,
        totalStaff: totalMedicalStaffCount,
        activeShifts: activeShiftsCount,
        exchangeRequests: exchangesThisMonth,
      }));
    } catch (e) {
      console.log("Gagal menampilkan data", e);
    } finally {
      setLoading(false);
    }
  };

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

  const ScheduleItem = ({ item }) => (
    // <div className="schedule-item">
    //   <div className="user-info-text">
    //     <div className="user-details-text">
    //       <div className="user-name">{item.name}</div>
    //       <div className="user-unit">{item.unit}</div>
    //     </div>
    //   </div>
    //   <div className="shift-details">
    //     {/* <div className="shift-name">{item.shift}</div> */}
    //     <div
    //       className={`status-badge ${item.shift.toLowerCase() === "pagi" ? "pagi" : item.shift.toLowerCase() === "siang" ? "siang" : "malam"}`}
    //     >
    //       {item.shift}
    //     </div>
    //     <div className="time-shift">{item.time}</div>
    //   </div>
    // </div>
    <div className="schedule-item">
      <div className="user-details-text">
        <div className="user-name">{item.name}</div>
        <div className="user-unit">{item.unit}</div>
      </div>
      <div className="shift-details">
        <div
          className={`status-badge ${item.shift.toLowerCase() === "pagi" ? "pagi" : item.shift.toLowerCase() === "siang" ? "siang" : "malam"}`}
        >
          {item.shift}
        </div>
        <div className="time-shift">{item.time}</div>
      </div>
    </div>
  );

  const fetchShiftExchanges = async () => {
    setLoading(true);
    try {
      //   const res = await axios.get("http://localhost:3000/all-shift-exchanges", {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });
      const res = await axiosInstance.get("/all-shift-exchanges");
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const filteredData = res.data.data.filter((ex) => {
        const date = new Date(ex.createdAt || ex.requestDate);
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        );
      });

      //   const mapped = res.data.data.map((ex) => ({
      const mapped = filteredData.map((ex) => ({
        id: ex.id,
        status: ex.status,
        reason: ex.reason,
        createdAt: ex.createdAt,
        requesterName:
          `${ex.requester.titlePrefix} ${ex.requester.fullName}`.trim(),
        partnerName: `${ex.partner.titlePrefix} ${ex.partner.fullName}`.trim(),
        requesterShift: ex.requesterShift?.shiftDetail
          ? `${
              ex.requesterShift.shiftDetail.name
            } (${ex.requesterShift.shiftDetail.startTime.slice(
              0,
              5,
            )} - ${ex.requesterShift.shiftDetail.endTime.slice(0, 5)})`
          : "-",
        partnerShift: ex.partnerShift?.shiftDetail
          ? `${
              ex.partnerShift.shiftDetail.name
            } (${ex.partnerShift.shiftDetail.startTime.slice(
              0,
              5,
            )} - ${ex.partnerShift.shiftDetail.endTime.slice(0, 5)})`
          : "-",
      }));
      setShiftExchanges(mapped);
    } catch (e) {
      console.log("Error fetch shift exchanges:", e);
    } finally {
      setLoading(false);
    }
  };

  const ShiftExchangeItem = ({ item }) => (
    <div className="exchange-item">
      <div className="exchange-details">
        <p className="exchange-names">
          {item.requesterName} <FaArrowRight /> {item.partnerName}
        </p>
        <p className="exchange-reason">{item.reason}</p>
      </div>
      {/* <div
        className={`exchange-status-tag 
    ${
      item.status === "Pending" || item.status === "Pending"
        ? "status-pending"
        : ""
    }
    ${
      item.status === "Disetujui" || item.status === "Approved"
        ? "status-approved"
        : ""
    }
    ${
      item.status === "Ditolak" || item.status === "Rejected"
        ? "status-rejected"
        : ""
    }
  `}
      >
        {item.status}
      </div> */}
      <div
        className={`status-badge ${item.status.toLowerCase() === "pending" ? "pending" : item.status.toLowerCase() === "approved" ? "approved" : item.status.toLowerCase() === "rejected" ? "rejected" : item.status.toLowerCase() === "cencelled" ? "cancelled" : "expired"}`}
      >
        {item.status}
      </div>
    </div>
  );

  const fetchMonthlyAttendance = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthParam = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0",
      )}`;

      const res = await axiosInstance.get("/attendances", {
        params: {
          period: "Bulanan",
          month: monthParam,
        },
      });

      const attendanceData = Array.isArray(res.data?.data) ? res.data.data : [];
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const totalWeeks = Math.ceil(daysInMonth / 7);
      const weeks = {};
      for (let weekNumber = 1; weekNumber <= totalWeeks; weekNumber++) {
        const startDay = (weekNumber - 1) * 7 + 1;
        const endDay = Math.min(weekNumber * 7, daysInMonth);

        weeks[`Minggu ${weekNumber}`] = {
          week: `Minggu ${weekNumber}`,
          range: `${startDay}–${endDay}`,
          hadir: 0,
          terlambat: 0,
          "tidak-hadir": 0,
          izin: 0,
        };
      }

      const currentMonthData = attendanceData.filter((item) => {
        if (!item.date) return false;

        const attendanceDate = new Date(
          `${String(item.date).slice(0, 10)}T00:00:00`,
        );

        return (
          !Number.isNaN(attendanceDate.getTime()) &&
          attendanceDate.getMonth() === currentMonth &&
          attendanceDate.getFullYear() === currentYear
        );
      });

      currentMonthData.forEach((item) => {
        const attendanceDate = new Date(
          `${String(item.date).slice(0, 10)}T00:00:00`,
        );

        const dayOfMonth = attendanceDate.getDate();

        /*
         * Tanggal 1–7   = minggu 1
         * Tanggal 8–14  = minggu 2
         * Tanggal 15–21 = minggu 3
         * Tanggal 22–28 = minggu 4
         * Tanggal 29–31 = minggu 5
         */
        const weekNumber = Math.ceil(dayOfMonth / 7);
        const weekKey = `Minggu ${weekNumber}`;

        if (!weeks[weekKey]) return;

        switch (item.attendanceStatus) {
          case "Hadir":
          case "Dinas Luar":
            weeks[weekKey].hadir += 1;
            break;

          case "Terlambat":
            weeks[weekKey].terlambat += 1;
            break;

          case "Tidak Hadir":
            weeks[weekKey]["tidak-hadir"] += 1;
            break;

          case "Izin":
          case "Sakit":
          case "Cuti":
            weeks[weekKey].izin += 1;
            break;

          default:
            break;
        }
      });

      const formatted = Object.values(weeks);

      //   const data = res.data.data.filter((item) => {
      //     const date = new Date(item.date + "T00:00:00");
      //     return (
      //       date.getMonth() === currentMonth && date.getFullYear() === currentYear
      //     );
      //   });
      //   const weeks = {
      //     "Minggu 1": {
      //       hadir: 0,
      //       terlambat: 0,
      //       "tidak-hadir": 0,
      //       izin: 0,
      //     },
      //     "Minggu 2": {
      //       hadir: 0,
      //       terlambat: 0,
      //       "tidak-hadir": 0,
      //       izin: 0,
      //     },
      //     "Minggu 3": {
      //       hadir: 0,
      //       terlambat: 0,
      //       "tidak-hadir": 0,
      //       izin: 0,
      //     },
      //     "Minggu 4": {
      //       hadir: 0,
      //       terlambat: 0,
      //       "tidak-hadir": 0,
      //       izin: 0,
      //     },
      //   };

      //   data.forEach((item) => {
      //     const dateObj = new Date(item.date + "T00:00:00");
      //     const day = dateObj.getDate();

      //     let weekKey = "";
      //     if (day <= 7) weekKey = "Minggu 1";
      //     else if (day <= 14) weekKey = "Minggu 2";
      //     else if (day <= 21) weekKey = "Minggu 3";
      //     else weekKey = "Minggu 4";

      //     switch (item.attendanceStatus) {
      //       case "Hadir":
      //         weeks[weekKey].hadir++;
      //         break;
      //       case "Terlambat":
      //         weeks[weekKey].terlambat++;
      //         break;
      //       case "Tidak Hadir":
      //         weeks[weekKey]["tidak-hadir"]++;
      //         break;
      //       case "Izin":
      //       case "Sakit":
      //         // weeks[weekKey]["izin-sakit"]++;
      //         weeks[weekKey].izin++;
      //         break;
      //       default:
      //         break;
      //     }
      //   });

      //   const formatted = Object.entries(weeks).map(([week, value]) => ({
      //     week,
      //     hadir: value.hadir,
      //     terlambat: value.terlambat,
      //     "tidak-hadir": value["tidak-hadir"],
      //     // "izin-sakit": value["izin-sakit"],
      //     izin: value.izin,
      //   }));

      setChartData(formatted);
    } catch (err) {
      console.log("Error fetch monthly:", err);
    } finally {
      setLoading(false);
    }
  };

  const getBarHeight = (value) => {
    const numericValue = Number(value) || 0;

    // Nilai 0 tetap memiliki garis tipis agar label terlihat
    if (numericValue === 0) return 2;

    return Math.min(numericValue * 10, 100);
  };

  return (
    <div className="content-page">
      <header className="header-admin">
        {loading ? (
          <div className="header-skeleton">
            <div
              className="skeleton-text"
              style={{ width: "300px", height: "32px", marginBottom: "12px" }}
            ></div>
            <div
              className="skeleton-text"
              style={{ width: "450px", height: "16px" }}
            ></div>
          </div>
        ) : (
          <>
            <h2>
              Selamat Datang,{" "}
              {/* {user ? `${user.titlePrefix} ${user.fullName}` : "Admin"} */}
              {user
                ? [user.titlePrefix, user.fullName]
                    .filter((item) => item && item !== "")
                    .join(" ")
                : "Admin"}
            </h2>
            <p>
              Kelola Presensi Karyawan Rumah Sakit Bhayangkara Tk. III Indramayu
            </p>
          </>
        )}
      </header>

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
              </div>
              <div className="stat-icon-dash skeleton-icon"></div>
            </div>
          ))
        ) : (
          <>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Karyawan</span>
                <span className="stat-value-dash">
                  {attendanceMetrics.totalEmployees}
                </span>
              </div>
              <div className="stat-icon-dash purple-light-dash">
                <FaUsers />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Kehadiran</span>
                <span className="stat-value-dash">
                  {attendanceMetrics.presentToday}
                </span>
              </div>
              <div className="stat-icon-dash green-light-dash">
                <FaUserCheck />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Keterlambatan</span>
                <span className="stat-value-dash">
                  {attendanceMetrics.lateToday}
                </span>
              </div>
              <div className="stat-icon-dash orange-light-dash">
                <FaUserClock />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Total Izin/Tidak Hadir</span>
                <span className="stat-value-dash">
                  {attendanceMetrics.absentToday}
                </span>
              </div>
              <div className="stat-icon-dash red-light-dash">
                <FaUserTimes />
              </div>
            </div>
          </>
        )}
      </section>

      <div className="presence-chart-wrapper">
        <div className="content-card">
          {loading ? (
            <div
              className="skeleton-text"
              style={{ width: "200px", height: "24px", marginBottom: "20px" }}
            ></div>
          ) : (
            <h3>Rekap Presensi</h3>
          )}
          {/* <div className="bar-chart-mock dashboard-chart"> */}
          <div className="bar-chart-mock">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bar-group">
                  <div className="bar-container">
                    <div
                      className="bar skeleton-bar"
                      style={{ height: "60%" }}
                    ></div>
                  </div>
                  <div
                    className="skeleton-text"
                    style={{ width: "50px", height: "12px", marginTop: "10px" }}
                  ></div>
                </div>
              ))
            ) : chartData.length === 0 ? (
              <p className="chart-placeholder ">
                Chart Presensi akan tampil disini
              </p>
            ) : (
              chartData.map((data, i) => (
                <div key={i} className="bar-group">
                  <div className="bars-container">
                    <div
                      className="bar-wrapper"
                      style={{
                        "--bar-height": `${getBarHeight(data.hadir)}%`,
                      }}
                    >
                      <span className="bar-value-dash">{data.hadir}</span>
                      <div
                        className={`bar green`}
                        style={{
                          height: `${Math.min(data.hadir * 10, 100)}%`,
                        }}
                      ></div>
                      <span className="bar-label">Hadir</span>
                    </div>
                    <div
                      className="bar-wrapper"
                      style={{
                        "--bar-height": `${getBarHeight(data.hadir)}%`,
                      }}
                    >
                      <span className="bar-value-dash">{data.terlambat}</span>
                      <div
                        className={`bar yellow`}
                        style={{
                          height: `${Math.min(data.terlambat * 10, 100)}%`,
                        }}
                      ></div>
                      <span className="bar-label">Terlambat</span>
                    </div>
                    <div
                      className="bar-wrapper"
                      style={{
                        "--bar-height": `${getBarHeight(data.hadir)}%`,
                      }}
                    >
                      <span className="bar-value-dash">
                        {data["tidak-hadir"]}
                      </span>
                      <div
                        className="bar red"
                        style={{
                          height: `${Math.min(data["tidak-hadir"] * 10, 100)}%`,
                        }}
                      ></div>
                      <span className="bar-label">Tidak Hadir</span>
                    </div>
                    <div
                      className="bar-wrapper"
                      style={{
                        "--bar-height": `${getBarHeight(data.hadir)}%`,
                      }}
                    >
                      <span className="bar-value-dash">{data.izin}</span>
                      <div
                        className="bar blue"
                        style={{
                          height: `${Math.min(data.izin * 10, 100)}%`,
                        }}
                      ></div>
                      <span className="bar-label">Izin</span>
                    </div>
                  </div>
                  <span className="bar-label">{data.week}</span>
                  {/* <div className="bar-week-label">
                    <span className="bar-label">{data.week}</span>
                    <small className="bar-week-range">
                      Tanggal {data.range}
                    </small>
                  </div> */}
                </div>
              ))
            )}
          </div>
          {!loading && (
            <>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="dot green"></span> Hadir
                </div>
                <div className="legend-item">
                  <span className="dot yellow"></span> Terlambat
                </div>
                <div className="legend-item">
                  <span className="dot red"></span> Tidak Hadir
                </div>
                <div className="legend-item">
                  <span className="dot blue"></span> Izin
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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
                <span className="stat-label-dash">Total Tenaga Medis</span>
                <span className="stat-value-dash">
                  {shiftMetrics.totalStaff}
                </span>
              </div>
              <div className="stat-icon-dash purple-light">
                <FaUserMd />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Jadwal Hari Ini</span>
                <span className="stat-value-dash">
                  {shiftMetrics.todaySchedule}
                </span>
              </div>
              <div className="stat-icon-dash green-light">
                <FaCalendarDay />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Shift Aktif</span>
                <span className="stat-value-dash">
                  {shiftMetrics.activeShifts}
                </span>
              </div>
              <div className="stat-icon-dash yellow-light">
                <FaClock />
              </div>
            </div>
            <div className="stat-card-dash">
              <div className="stat-info-dash">
                <span className="stat-label-dash">Permintaan Tukar</span>
                <span className="stat-value-dash">
                  {shiftMetrics.exchangeRequests}
                </span>
              </div>
              <div className="stat-icon-dash blue-light">
                <FaExchangeAlt />
              </div>
            </div>
          </>
        )}
      </section>

      <div className="content-two-grid" style={{ marginBottom: 0 }}>
        <div className="card-column">
          <div className="column-header header-with-link">
            {loading ? (
              <>
                <div
                  className="skeleton-text"
                  style={{ width: "140px", height: "20px" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "70px", height: "20px" }}
                ></div>
              </>
            ) : (
              <>
                <span>Jadwal Hari Ini</span>
                <Link to="/shift-schedule" className="view-all">
                  Lihat Semua
                </Link>
              </>
            )}
          </div>
          <div className="scheadule-list">
            {loading ? (
              [...Array(1)].map((_, i) => (
                <div
                  key={i}
                  className="schedule-item skeleton-item"
                  style={{ padding: "15px" }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      className="skeleton-text"
                      style={{
                        width: "70%",
                        height: "16px",
                        marginBottom: "8px",
                      }}
                    ></div>
                    <div
                      className="skeleton-text"
                      style={{ width: "40%", height: "12px" }}
                    ></div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      className="skeleton-text"
                      style={{
                        width: "60px",
                        height: "14px",
                        marginBottom: "8px",
                        marginLeft: "auto",
                      }}
                    ></div>
                    <div
                      className="skeleton-text"
                      style={{
                        width: "80px",
                        height: "12px",
                        marginLeft: "auto",
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : todaySchedule.length === 0 ? (
              <div className="no-data">
                <h4 className="empty-title">Belum ada jadwal hari ini</h4>
                <p className="empty-desc">Jadwal shift akan muncul di sini</p>
              </div>
            ) : (
              todaySchedule
                .slice(0, 3)
                .map((item, index) => <ScheduleItem key={index} item={item} />)
            )}
          </div>
        </div>

        <div className="card-column">
          <div className="column-header header-with-link">
            {loading ? (
              <>
                <div
                  className="skeleton-text"
                  style={{ width: "220px", height: "20px" }}
                ></div>
                <div
                  className="skeleton-text"
                  style={{ width: "70px", height: "20px" }}
                ></div>
              </>
            ) : (
              <>
                <span>Permintaan Tukar Shift</span>
                <Link to="/shift-exchanges" className="view-all">
                  Lihat Semua
                </Link>
              </>
            )}
          </div>
          <div className="exchange-list">
            {loading ? (
              [...Array(1)].map((_, i) => (
                <div
                  key={i}
                  className="exchange-item skeleton-item"
                  style={{ padding: "15px" }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      className="skeleton-text"
                      style={{
                        width: "80%",
                        height: "16px",
                        marginBottom: "10px",
                      }}
                    ></div>
                    <div
                      className="skeleton-text"
                      style={{ width: "50%", height: "12px" }}
                    ></div>
                  </div>
                  <div
                    className="skeleton-text"
                    style={{
                      width: "70px",
                      height: "24px",
                      borderRadius: "12px",
                    }}
                  ></div>
                </div>
              ))
            ) : shiftExchanges.length === 0 ? (
              <div className="no-data">
                <h4 className="empty-title">
                  Belum ada permintaan tukar shift hari ini
                </h4>
                <p className="empty-desc">
                  Permintaan tukar shift akan muncul di sini
                </p>
              </div>
            ) : (
              //   shiftExchanges
              //     .sort(
              //       (a, b) =>
              //         new Date(b.requestDate || b.createdAt) -
              //         new Date(a.requestDate || a.createdAt),
              //     )
              //     .slice(0, 3)
              //     .map((item) => <ShiftExchangeItem key={item.id} item={item} />)
              shiftExchanges
                .sort(
                  (a, b) =>
                    new Date(b.requestDate || b.createdAt) -
                    new Date(a.requestDate || a.createdAt),
                )
                .slice(0, 3)
                .map((item, index) => (
                  <ShiftExchangeItem key={index} item={item} />
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
