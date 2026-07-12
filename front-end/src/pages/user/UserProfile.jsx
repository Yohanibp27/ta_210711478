import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import avatar from "../../assets/avatar-user.jpg";

const UserProfile = () => {
  const { user } = useSelector((state) => state.auth);
  //   const auth = useSelector((state) => state.auth);
  //   const user = auth.user?.data || auth.user;
  console.log("INFO USER: ", user);
  const formatJoinDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (!user) {
    return <div className="container mt-5">Gagal mengambil ada data user</div>;
  }

  const renderFullTitleName = () => {
    const prefix = user.titlePrefix ? `${user.titlePrefix} ` : "";
    // const suffix = user.titleSuffix ? `, ${user.titleSuffix}` : "";
    // return `${prefix}${user.fullName}${suffix}`;
    return `${prefix}${user.fullName}`;
  };

  //   // DEBUGGING TAMPIL DATA USER, DATA INI DITERIMA KETIKA USER BERHASIL LOGIN (BUKAN DARI STAY LOGGIN)
  //   const fullName = user?.fullName;
  //   const titlePrefix = user?.titlePrefix;
  //   const titleSuffix = user?.titleSuffix;
  //   const position = user?.position;
  //   const profession = user?.profession;
  //   const workShift = user?.workShift;
  //   const role = user?.role;
  //   const division = user?.position?.division;
  //   const department = user?.position?.division?.department;
  //   console.log(`Nama user: ${fullName}`);
  //   console.log(`Gelar depan: ${titlePrefix}`);
  //   console.log(`Gelar belakang: ${titleSuffix}`);
  //   console.log(position);
  //   console.log(profession);
  //   console.log(workShift);
  //   console.log(division);
  //   console.log(department);
  //   console.log(role);

  const [showSkeleton, setShowSkeleton] = useState(true);
  useEffect(() => {
    if (user) {
      setTimeout(() => setShowSkeleton(false), 500); // biar smooth
    }
  }, [user]);

  if (showSkeleton) {
    return (
      <div className="content-page">
        <div className="avatar-card header-card">
          <div className="header-info">
            <div className="skeleton-circle skeleton-avatar" />
            <div>
              <div className="skeleton-text skeleton-name" />
              <div className="skeleton-text skeleton-sub" />
            </div>
          </div>
        </div>

        <div className="avatar-card">
          <div className="info-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                className="info-group"
                key={i}
                style={{ marginBottom: "10px" }}
              >
                <div className="skeleton-text skeleton-label" />
                <div className="skeleton-text skeleton-value" />
              </div>
            ))}
          </div>
        </div>

        <div className="avatar-card">
          <div className="card-header-actions" style={{ marginBottom: "20px" }}>
            <div className="skeleton-text skeleton-title" />
          </div>
          <div className="skeleton-text skeleton-label" />
          <div
            className="skeleton-text skeleton-value"
            style={{ marginTop: "10px" }}
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="container mt-5">Data user tidak ditemukan!</div>;
  }

  return (
    <div className="content-page">
      <div className="avatar-card header-card">
        <div className="header-info">
          <img
            src={user?.avatarUrl || avatar}
            alt={user.fullName}
            className="profile-avatar"
          />
          <div>
            <h2 className="full-name">{renderFullTitleName()}</h2>
            <p className="profile-role-pos">
              • {user?.position?.division?.department?.name || "FUNGSI"},
              {user?.position?.division?.name || "UNIT"}
            </p>
          </div>
        </div>
      </div>

      <div className="avatar-card">
        <div className="info-grid">
          <div className="info-group">
            <label>Gelar Depan</label>
            <p>{user?.titlePrefix || "-"}</p>
          </div>
          <div className="info-group">
            <label>Nama Lengkap</label>
            <p>{user?.fullName || "-"}</p>
          </div>
          <div className="info-group">
            <label>NIP</label>
            <p>{user?.nip || "-"}</p>
          </div>
          <div className="info-group">
            <label>Alamat Email</label>
            <p>{user?.email || "-"}</p>
          </div>
          <div className="info-group">
            <label>Nomor Telepon</label>
            <p>{user?.phone || "-"}</p>
          </div>
          <div className="info-group">
            <label>Fungsi</label>
            <p>{user?.position?.division?.department?.name || "-"}</p>
          </div>
          <div className="info-group">
            <label>Unit</label>
            <p>{user?.position?.division?.name || "-"}</p>
          </div>
          <div className="info-group">
            <label>Jabatan</label>
            <p>{user?.position?.name || "-"}</p>
            {/* <p>{user?.position || "-"}</p> */}
          </div>
          <div className="info-group">
            <label>Profesi</label>
            {/* <p>{profession?.name || "-"}</p> */}
            <p>{user?.profession || "-"}</p>
          </div>
          <div className="info-group">
            <label>Jam Kerja</label>
            <p>
              {user?.workShift?.name
                ? `${user?.workShift?.name} (${user?.workShift?.startTime?.slice(
                    0,
                    5,
                  )} - ${user?.workShift?.endTime?.slice(0, 5)} WIB)`
                : "-"}
            </p>
          </div>
          <div className="info-group">
            <label>Status User</label>
            <p>{user?.status || "-"}</p>
          </div>
          <div className="info-group">
            <label>User Role</label>
            {/* <p className="role-badge">{user?.role?.name || "-"}</p> */}
            <p className="role-badge">{user?.role || "-"}</p>
          </div>
        </div>
      </div>

      <div className="avatar-card">
        <div className="card-header-actions">
          <h3 className="card-title-avatar">Informasi Tambahan</h3>
        </div>
        {/* <div className="info-grid"> */}
        <div className="info-group">
          <label>Tanggal Bergabung</label>
          <p>{formatJoinDate(user?.joinDate)}</p>
          {/* <p>{user?.joinDate || "-"}</p> */}
          {/* </div> */}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
