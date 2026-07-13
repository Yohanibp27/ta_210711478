import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiBell, FiChevronDown, FiMenu } from "react-icons/fi";
import Clock from "../components/Clock.jsx";
import { useSelector } from "react-redux";
import AvatarUrl from "../assets/avatar-ungu.png";
import { useLocation, useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
import axiosInstance from "../api/axios";

const Navbar = ({ onToggleMobile }) => {
  //   const dispatch = useDispatch(); // Memanggil hook useDispatch agar 'dispatch' bisa digunakan
  const token = localStorage.getItem("token");
  const [isOpen, setIsOpen] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const reduxAuth = useSelector((state) => state.auth);
  const reduxUser = reduxAuth?.user;
  const localUser = JSON.parse(localStorage.getItem("user"));
  const currentUser =
    reduxUser && Object.keys(reduxUser).length > 0 ? reduxUser : localUser;

  const dropDownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const statusMap = {
    pending: "Menunggu",
    pending_manager: "Menunggu",
    approved_manager: "Disetujui",
    approved_sdm: "Disetujui",
    rejected_manager: "Ditolak",
    rejected_sdm: "Ditolak",
  };

  const fetchAllNotifications = async () => {
    setLoading(true);
    try {
      const [resExchange, resLeave] = await Promise.all([
        axiosInstance.get("/all-shift-exchanges"),
        axiosInstance.get("/leave-requests"),
      ]);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const exchanges = resExchange.data.data
        .filter((item) => {
          const itemDate = new Date(item.createdAt);
          const isPending = item.status.toLowerCase() === "pending";
          const isRecent = itemDate >= oneWeekAgo;
          return isPending && isRecent;
        })
        .map((item) => ({
          id: `ex-${item.id}`,
          title: "Permintaan Tukar Shift",
          desc: `${item.requester?.fullName} ingin tukar shift`,
          time: item.createdAt,
          link: "/shift-exchanges",
        }));

      const leaves = resLeave.data.data
        .filter((item) => {
          const itemDate = new Date(item.createdAt);
          const mappedStatus =
            statusMap[item.status.toLowerCase()] || statusMap[item.status];
          const isPending = mappedStatus === "Menunggu";
          const isRecent = itemDate >= oneWeekAgo;
          return isPending && isRecent;
        })
        .map((item) => ({
          id: `lv-${item.id}`,
          title: `Pengajuan ${item.leavetype?.name}`,
          desc: `${item.user?.fullName} mengajukan izin`,
          time: item.createdAt,
          link: "/leave-request-history",
        }));

      const combined = [...exchanges, ...leaves].sort(
        (a, b) => new Date(b.time) - new Date(a.time),
      );

      setNotifications(combined);
    } catch (err) {
      console.error("Gagal mengambil notifikasi", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAllNotifications();
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropDownRef.current && !dropDownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setOpenNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " tahun lalu";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " bulan lalu";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " hari lalu";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " jam lalu";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " menit lalu";
    return "baru saja";
  };

  const handleLogout = () => {
    axiosInstance
      .delete("/logout")
      .catch((e) =>
        console.error("Gagal memanggil endpoint logout di server:", e),
      );

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const getPageTitle = (pathname) => {
    if (pathname.match(/^\/performance-report\/\d+$/)) {
      return "Detail Kinerja Karyawan";
    }

    const titles = {
      "/dashboard": "Dashboard",
      "/users": "Kelola Karyawan",

      "/shifts": "Tabel Shift",
      "/shift-schedule": "Jadwal Shift",
      "/shift-exchanges": "Pertukaran Shift",

      "/attendances": "Input Presensi",
      "/attendances/history": "Riwayat Presensi",
      "/qr-page": "QR Code Presensi",

      "/leave-requests": "Daftar Pengajuan",
      "/leave-request-history": "Riwayat Pengajuan",

      "/departments": "Fungsi",
      "/divisions": "Unit",
      "/positions": "Jabatan",
      "/professions": "Profesi",

      "/user/report": "Laporan Data Karyawan",
      "/user/preview": "Preview Data Karyawan",
      "/attendance/report": "Laporan Data Presensi",
      "/attendance/preview": "Preview Data Presensi",
      "/attendance/export": "Export Presensi",

      "/report-generator": "Generator Laporan",
      "/monthly-report": "Laporan Bulanan",
      "/performance-report": "Laporan Kinerja Karyawan",
      "performance-report/:id": "Detail Kinerja Karyawan",
      "/shift-report": "Analitik Shift Kerja",
      "/delay-report": "Laporan Keterlambatan",
      "/overtime-report": "Laporan Lembur",
      "/request-report": "Laporan Pengajuan",
      "/executive-dashboard": "Dashboard Eksekutif", // untuk super admin, supervisor, dan manager
      "/workload-analytic": "Dashboard Eksekutif", // untuk super admin, supervisor, dan manager

      "/user/profile": "Profil Akun",
      //   "/settings": "Pengaturan Akun",
      "/import-medical-action": "Import Laporan",
      "/calendars": "Kelola Hari Libur",
      "/workshifts": "Kelola Jam Kerja",
      "/leaves": "Kelola Pengajuan",
      "/sub-leaves": "Kelola Sub Pengajuan",
    };

    return titles[pathname] || "";
  };

  const routeNameMap = {
    dashboard: "Dashboard",
    users: "Kelola Karyawan",
    shifts: "Tabel Shift",
    "shift-schedule": "Jadwal Shift",
    "shift-exchanges": "Pertukaran Shift",
    attendances: "Input Presensi",
    "qr-page": "QR Code Presensi",
    history: "Riwayat Presensi",
    "leave-requests": "Daftar Pengajuan",
    "leave-request-history": "Riwayat Pengajuan",
    departments: "Fungsi",
    divisions: "Unit",
    positions: "Jabatan",
    professions: "Profesi",
    "report-generator": "Laporan",
    // "workload-analytic": "Dashboard Eksekutif",
    "executive-dashboard": "Dashboard Eksekutif",
    user: "Pengguna",
    profile: "Profil",
    settings: "Pengaturan",
    "performance-report": "Laporan Kinerja Karyawan",
  };

  const customBreadcrumbs = {
    "/attendances/history": [
      { name: "Kelola Presensi", path: "#" },
      { name: "Riwayat Presensi", path: "/attendances/history" },
    ],
    "/qr-page": [
      { name: "Kelola Presensi", path: "#" },
      { name: "QR Code Presensi", path: "/qr-page" },
    ],
    "/shifts": [
      { name: "Kelola Jadwal Shift", path: "#" },
      { name: "Tabel Shift", path: "/shifts" },
    ],
    "/shift-schedule": [
      { name: "Kelola Jadwal Shift", path: "#" },
      { name: "Jadwal Shift", path: "/shift-schedule" },
    ],
    "/shift-exchanges": [
      { name: "Kelola Pengajuan", path: "#" },
      { name: "Tukar Shift", path: "/shift-exchanges" },
    ],
    "/leave-request-history": [
      { name: "Kelola Pengajuan", path: "#" },
      { name: "Izin & Dinas Luar", path: "/leave-request-history" },
    ],
    "/departments": [
      { name: "Kelola Organisasi", path: "#" },
      { name: "Fungsi", path: "/departments" },
    ],
    "/divisions": [
      { name: "Kelola Organisasi", path: "#" },
      { name: "Unit", path: "/divisions" },
    ],
    "/positions": [
      { name: "Kelola Organisasi", path: "#" },
      { name: "Jabatan", path: "/positions" },
    ],
    "/professions": [
      { name: "Kelola Organisasi", path: "#" },
      { name: "Profesi", path: "/professions" },
    ],
    "/monthly-report": [
      { name: "Laporan", path: "/report-generator" },
      { name: "Laporan Bulanan", path: "/monthly-report" },
    ],
    "/performance-report": [
      { name: "Laporan", path: "/report-generator" },
      { name: "Laporan Kinerja Karyawan", path: "/performance-report" },
    ],
    "/performance-report/:id": [
      { name: "Laporan", path: "/report-generator" },
      { name: "Laporan Kinerja Karyawan", path: "/performance-report" },
      { name: "Detail Kinerja Karyawan", path: "/performance-report/:id" },
    ],
    "/shift-report": [
      { name: "Laporan", path: "/report-generator" },
      { name: "Analitik Shift Kerja", path: "/shift-report" },
    ],
    "/overtime-report": [
      { name: "Laporan", path: "/report-generator" },
      { name: "Laporan Lembur", path: "/overtime-report" },
    ],
    "/request-report": [
      { name: "Laporan", path: "/report-generator" },
      { name: "Laporan Pengajuan", path: "/request-report" },
    ],
    "/executive-dashboard": [
      { name: "Laporan", path: "/report-generator" },
      { name: "Dashboard Eksekutif", path: "/executive-dashboard" },
    ],
    "/import-medical-action": [
      { name: "Laporan", path: "#" },
      { name: "Import Laporan Tindakan Medis", path: "/import-medical-action" },
    ],
    "/user/report": [
      { name: "Laporan", path: "#" },
      { name: "Laporan Data Karyawan", path: "/user/report" },
    ],
    "/user/preview": [
      { name: "Laporan", path: "#" },
      { name: "Laporan Data Karayawan", path: "/user/report" },
      { name: "Preview Data Karayawan", path: "/user/preview" },
    ],
    "/attendance/report": [
      { name: "Laporan", path: "#" },
      { name: "Laporan Data Presensi", path: "/attendance/report" },
    ],
    "/attendance/preview": [
      { name: "Laporan", path: "#" },
      { name: "Laporan Data Presensi", path: "/attendance/report" },
      { name: "Preview Data Presensi", path: "/attendance/preview" },
    ],
    "/user/profile": [
      { name: "Pengaturan", path: "#" },
      { name: "Profil Akun", path: "/user/profile" },
    ],
    "/calendars": [
      { name: "Pengaturan", path: "#" },
      { name: "Kelola Hari Libur", path: "/calendars" },
    ],
    "/workshifts": [
      { name: "Pengaturan", path: "#" },
      { name: "Kelola Jam Kerja", path: "/workshift" },
    ],
    "/leaves": [
      { name: "Pengaturan", path: "#" },
      { name: "Kelola Jenis Pengajuan", path: "/leaves" },
    ],
    "/sub-leaves": [
      { name: "Pengaturan", path: "#" },
      { name: "Kelola Jenis Sub Pengajuan", path: "/sub-leaves" },
    ],
  };

  const generateBreadcrumbs = (pathname) => {
    // DETAIL KINERJA KARYAWAN
    if (pathname.match(/^\/performance-report\/\d+$/)) {
      return [
        {
          name: "Laporan",
          path: "/report-generator",
        },
        {
          name: "Laporan Kinerja Karyawan",
          path: "/performance-report",
        },
        {
          name: "Detail Kinerja Karyawan",
          path: pathname,
        },
      ].map((item, index, arr) => ({
        ...item,
        isLast: index === arr.length - 1,
      }));
    }

    if (customBreadcrumbs[pathname]) {
      return customBreadcrumbs[pathname].map((item, index, arr) => ({
        ...item,
        isLast: index === arr.length - 1,
      }));
    }

    const paths = pathname.split("/").filter((p) => p);

    return paths.map((path, index) => {
      const routeTo = "/" + paths.slice(0, index + 1).join("/");

      return {
        name: routeNameMap[path] || path,
        path: routeTo,
        isLast: index === paths.length - 1,
      };
    });
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <button className="mobile-toggle" onClick={onToggleMobile}>
          <FiMenu size={24} />
        </button>
        <div className="header-titles">
          <h2 className="page-title">{getPageTitle(location.pathname)}</h2>
          <nav className="nav-breadcrumbs">
            <Link className="breadcrumb-link" to="/dashboard">
              Dashboard
            </Link>
            {location.pathname !== "/dashboard" &&
              generateBreadcrumbs(location.pathname).map((crumb, index) => (
                <span key={index}>
                  <span className="breadcrumb-separator"> &gt; </span>
                  {crumb.isLast ? (
                    <span className="breadcrumb-current">{crumb.name}</span>
                  ) : (
                    <Link className="breadcrumb-link" to={crumb.path}>
                      {crumb.name}
                    </Link>
                  )}
                </span>
              ))}
          </nav>
        </div>
      </div>

      <div className="nav-right">
        <div className="clock-badge">
          <Clock />
        </div>
        <div className="notif-box" ref={notifRef}>
          <FiBell
            size={22}
            className="notif-icon"
            onClick={() => setOpenNotif(!openNotif)}
          />
          {notifications.length > 0 && (
            <span className="notif-badge">{notifications.length}</span>
          )}
          {openNotif && (
            <div className="notif-dropdown">
              <div className="notif-header">
                Notifikasi
                <span className="notif-refresh" onClick={fetchAllNotifications}>
                  Refresh
                </span>
              </div>

              <div className="notif-list">
                {loading ? (
                  <div className="notif-item">Memuat...</div>
                ) : notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="notif-item"
                      onClick={() => {
                        navigate(notif.link);
                        setIsOpen(false);
                        setOpenNotif(false);
                      }}
                    >
                      <div className="notif-item-title">{notif.title}</div>
                      <div className="notif-item-desc">{notif.desc}</div>
                      <div className="notif-time">{timeAgo(notif.time)}</div>
                    </div>
                  ))
                ) : (
                  <div
                    className="alert-item"
                    style={{
                      textAlign: "center",
                      fontSize: "12px",
                      color: "#999",
                    }}
                  >
                    Tidak ada notifikasi baru
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="profile-container-dropdown" ref={dropDownRef}>
          <div className="profile-dropdown" onClick={() => setIsOpen(!isOpen)}>
            <img
              className="img-avatar"
              src={currentUser?.avatarUrl || AvatarUrl}
              alt={currentUser?.fullName || "Avatar"}
            />
            <div className="profile-meta">
              <p className="name">{currentUser?.fullName || "User"}</p>
              <p className="role">{currentUser?.role || "Akses"}</p>
            </div>
            <FiChevronDown
              size={18}
              className={`arrow ${isOpen ? "up" : ""}`}
            />
          </div>
          {isOpen && (
            <div className="menu-dropdown">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/user/profile");
                }}
              >
                Akun
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/settings");
                }}
              >
                Pengaturan
              </button>
              <hr className="dropdown-divider" />
              <button className="dropdown-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
