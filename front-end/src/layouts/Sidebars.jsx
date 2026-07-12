import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import Logo from "../assets/images/bhayangkara.png";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiRepeat,
  FiFileText,
  FiMenu,
  FiGrid,
  FiSettings,
  FiCheckSquare,
  FiChevronDown,
  FiChevronRight,
  FiInbox,
} from "react-icons/fi";
import {
  FaClipboardList,
  FaFileAlt,
  FaFileArchive,
  FaFilePrescription,
  FaFileSignature,
  FaInbox,
  FaInfoCircle,
  FaRegFileAlt,
  FaTasks,
} from "react-icons/fa";

const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  const reduxAuth = useSelector((state) => state.auth);
  const reduxUser = reduxAuth?.user;
  const localUser = JSON.parse(localStorage.getItem("user"));
  const currentUser =
    reduxUser && Object.keys(reduxUser).length > 0 ? reduxUser : localUser;
  const roleName = currentUser?.role || "Role tidak ditemukan";
  const [openMenus, setOpenMenus] = useState({});

  const toggleSubMenu = (name) => {
    if (isCollapsed) return;
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const menuByRole = {
    // TIM IT
    Admin: [
      { name: "Dashboard", path: "/dashboard", icon: <FiHome /> },
      {
        name: "Kelola Karyawan",
        path: "/users",
        icon: <FiUsers />,
      },
      {
        name: "Kelola Presensi",
        icon: <FiCheckSquare />,
        children: [
          //   { name: "Input Presensi", path: "/attendances" },
          { name: "Riwayat Presensi", path: "/attendances/history" },
          { name: "QR Code Presensi", path: "/qr-page" },
        ],
      },
      {
        name: "Kelola Jadwal Shift",
        icon: <FiCalendar />,
        children: [
          { name: "Tabel Shift", path: "/shifts" },
          { name: "Jadwal Shift", path: "/shift-schedule" },
          //   {
          //     name: "Pertukaran Shift",
          //     path: "/shift-exchanges",
          //     icon: <FiRepeat />,
          //   },
        ],
      },
      {
        name: "Kelola Pengajuan",
        // icon: <FiFileText />,
        icon: <FiInbox />,
        children: [
          {
            name: "Tukar Shift",
            path: "/shift-exchanges",
            icon: <FiRepeat />,
          },
          //   { name: "Daftar Pengajuan", path: "/leave-requests" },
          // { name: "Riwayat Pengajuan", path: "/leave-request-history" },
          //  { name: "Form Pengajuan", path: "/form-request" },
          { name: "Izin & Dinas Luar", path: "/leave-request-history" },
        ],
      },
      {
        name: "Kelola Organisasi",
        icon: <FiGrid />,
        children: [
          { name: "Fungsi", path: "/departments" },
          { name: "Unit", path: "/divisions" },
          { name: "Jabatan", path: "/positions" },
          { name: "Profesi", path: "/professions" },
        ],
      },
      {
        name: "Laporan",
        icon: <FiFileText />,
        children: [
          { name: "Generator Laporan", path: "/report-generator" },
          { name: "Import Laporan", path: "/import-medical-action" },
          { name: "Laporan Data Karyawan", path: "/user/report" },
          { name: "Laporan Data Presensi", path: "/attendance/report" },
        ],
      },
      {
        name: "Pengaturan",
        icon: <FiSettings />,
        children: [
          { name: "Profil Akun", path: "/user/profile" },
          { name: "Kelola Hari Libur", path: "/calendar-management" },
          { name: "Kelola Jam Kerja", path: "/workshifts" },
          { name: "Jenis Pengajuan", path: "/leaves" },
          { name: "Jenis Sub Pengajuan", path: "/sub-leaves" },
        ],
      },
    ],

    // KARUMKIT & WAKARUMKIT ROLE ID = 2 SUPER ADMIN
    "Super Admin": [
      { name: "Dashboard", path: "/dashboard", icon: <FiHome /> },
      {
        name: "Presensi",
        icon: <FiCheckSquare />,
        children: [
          { name: "Riwayat Presensi", path: "/attendances/history" },
          { name: "QR Code Presensi", path: "/qr-page" },
        ],
      },
      {
        name: "Jadwal Shift",
        icon: <FiCalendar />,
        children: [
          { name: "Tabel Shift", path: "/shifts" },
          { name: "Jadwal Shift", path: "/shift-schedule" },
        ],
      },
      {
        name: "Kelola Pengajuan",
        icon: <FiFileText />,
        children: [
          {
            name: "Tukar Shift",
            path: "/shift-exchanges",
          },
          { name: "Izin & Dinas Luar", path: "/leave-request-history" },
        ],
      },
      {
        name: "Laporan",
        icon: <FiFileText />,
        children: [
          { name: "Generator Laporan", path: "/report-generator" },
          { name: "Import Laporan", path: "/import-medical-action" },
          { name: "Laporan Data Karyawan", path: "/user/report" },
          { name: "Laporan Data Presensi", path: "/attendance/report" },
        ],
      },
      {
        name: "Pengaturan",
        icon: <FiSettings />,
        children: [{ name: "Profil Akun", path: "/user/profile" }],
      },
    ],

    // TIM WASINTER ROLE ID = 3 SUPERVISOR
    Supervisor: [
      { name: "Dashboard", path: "/dashboard", icon: <FiHome /> },
      {
        name: "Kelola Presensi",
        icon: <FiCheckSquare />,
        children: [
          { name: "Riwayat Presensi", path: "/attendances/history" },
          { name: "QR Code Presensi", path: "/qr-page" },
        ],
      },
      {
        name: "Kelola Shift",
        icon: <FiCalendar />,
        children: [
          { name: "Tabel Jadwal Shift", path: "/shifts" },
          { name: "Jadwal Shift", path: "/shift-schedule" },
        ],
      },
      {
        name: "Kelola Pengajuan",
        icon: <FiFileText />,
        children: [
          {
            name: "Tukar Shift",
            path: "/shift-exchanges",
          },
          { name: "Izin & Dinas Luar", path: "/leave-request-history" },
        ],
      },
      {
        name: "Laporan",
        icon: <FiFileText />,
        children: [
          { name: "Generator Laporan", path: "/report-generator" },
          { name: "Import Laporan", path: "/import-medical-action" },
          { name: "Laporan Data Karyawan", path: "/user/report" },
          { name: "Laporan Data Presensi", path: "/attendance/report" },
        ],
      },
      {
        name: "Pengaturan",
        icon: <FiSettings />,
        children: [
          { name: "Profil Akun", path: "/user/profile" },
          { name: "Kelola Hari Libur", path: "/calendar-management" },
        ],
      },
    ],

    // KEPALA UNIT ROLE ID = 4 MANAGER
    Manager: [
      { name: "Dashboard", path: "/dashboard", icon: <FiHome /> },
      {
        name: "Jadwal Shift",
        icon: <FiCalendar />,
        children: [
          { name: "Tabel Jadwal Shift", path: "/shifts" },
          { name: "Jadwal Shift", path: "/shift-schedule" },
        ],
      },
      {
        name: "Riwayat Presensi",
        icon: <FiCheckSquare />,
        path: "/attendances/history",
      },
      {
        name: "Kelola Pengajuan",
        icon: <FiFileText />,
        children: [
          {
            name: "Tukar Shift",
            path: "/shift-exchanges",
          },
          { name: "Izin & Dinas Luar", path: "/leave-request-history" },
        ],
      },
      {
        name: "Laporan",
        icon: <FiFileText />,
        children: [
          { name: "Generator Laporan", path: "/report-generator" },
          { name: "Laporan Data Karyawan", path: "/user/report" },
          { name: "Laporan Data Presensi", path: "/attendance/report" },
        ],
      },
      {
        name: "Pengaturan",
        icon: <FiSettings />,
        children: [{ name: "Profil Akun", path: "/user/profile" }],
      },
    ],
  };

  const currentMenuItems = menuByRole[roleName] || [];

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {/* <div className="logo-wrapper">
          <div className="logo-icon-box">
            <img src={Logo} alt="Logo RSBI" size={22} className="logo-img" />
          </div>
          {!isCollapsed && <span className="logo-text">MedShift</span>}
        </div>
        <button className="collapse-btn" onClick={onToggleCollapse}>
          <FiMenu size={20} />
        </button> */}
        {isCollapsed ? (
          <button className="collapse-btn centered" onClick={onToggleCollapse}>
            <FiMenu size={24} />
          </button>
        ) : (
          <>
            <div className="logo-wrapper">
              <div className="logo-icon-box">
                <img src={Logo} alt="Logo RSBI" className="logo-img" />
              </div>
              <span className="logo-text">RSBI</span>
            </div>
            <button className="collapse-btn" onClick={onToggleCollapse}>
              <FiMenu size={20} />
            </button>
          </>
        )}
      </div>

      <nav className="sidebar-menu">
        {currentMenuItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = openMenus[item.name];
          return (
            <div key={item.name} className="menu-group">
              {hasChildren ? (
                <>
                  <div
                    className={`sidebar-item flex-between ${isOpen ? "active-parent" : ""}`}
                    onClick={() => toggleSubMenu(item.name)}
                  >
                    <div className="item-inner">
                      <span className="icon">{item.icon}</span>
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>
                    {!isCollapsed &&
                      (isOpen ? <FiChevronDown /> : <FiChevronRight />)}
                  </div>
                  {isOpen && !isCollapsed && (
                    <div className="submenu-list">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className="submenu-item"
                        >
                          {child.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink to={item.path} className="sidebar-item">
                  <span className="icon">{item.icon}</span>
                  {!isCollapsed && <span>{item.name}</span>}
                </NavLink>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
