// import axios from "axios";
import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import axiosInstance from "../../../api/axios.js";

const EditUser = ({ isOpen, userData, onClose, onSuccess }) => {
  //   const token = localStorage.getItem("token");
  const [roles, setRoles] = useState([]);
  const [workShifts, setWorkShifts] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [positions, setPositions] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allPositions, setAllPositions] = useState([]);
  const [allDivisions, setAllDivisions] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState({ ...userData });

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  //   useEffect(() => {
  //     if (!isOpen || !userData) return;

  //     const fetchDropdowns = async () => {
  //       try {
  //         const [rl, ws, pf, ps, dv, dp] = await Promise.all([
  //           axiosInstance.get("/roles"),
  //           axiosInstance.get("/workshifts"),
  //           axiosInstance.get("/professions"),
  //           axiosInstance.get("/positions"),
  //           axiosInstance.get("/divisions"),
  //           axiosInstance.get("/departments"),
  //         ]);

  //         setRoles(rl.data?.data || []);
  //         setWorkShifts(ws.data?.data || []);
  //         setProfessions(pf.data?.data || []);
  //         setAllPositions(ps.data?.data || []);
  //         setAllDivisions(dv.data?.data || []);
  //         setDepartments(dp.data?.data || []);

  //         // set divisions & positions sesuai userData
  //         const depId = userData.departmentId || "";
  //         const divId = userData.divisionId || "";
  //         setDivisions(dv.data?.data.filter((d) => d.departmentId === depId));
  //         setPositions(ps.data?.data.filter((p) => p.divisionId === divId));
  //       } catch (err) {
  //         console.error(err);
  //         alert("Gagal memuat dropdown");
  //       }
  //     };
  //     fetchDropdowns();
  //   }, [userData, isOpen]);

  useEffect(() => {
    if (user.employmentType === "Non-Shift") {
      const defaultShift = workShifts.find((ws) =>
        ws.name.toLowerCase().includes("pagi"),
      );
      setUser((prev) => ({
        ...prev,
        workShiftId: defaultShift ? defaultShift.id : "",
      }));
    } else if (user.employmentType === "Shift") {
      setUser((prev) => ({ ...prev, workShiftId: "" }));
    }
  }, [user.employmentType, workShifts]);

  //   const getUserById = useCallback(async () => {
  //     if (!userData?.id) return;

  //     try {
  //       const response = await axiosInstance.get(`/users/${userData.id}`);

  //       const data = response.data?.data;
  //       const depId = data.position?.division?.department?.id || "";
  //       const divId = data.position?.division?.id || "";
  //       const posId = data.position?.id || "";

  //       setUser({
  //         titlePrefix: data.titlePrefix || "",
  //         fullName: data.fullName || "",
  //         titleSuffix: data.titleSuffix || "",
  //         nip: data.nip || "",
  //         departmentId: depId,
  //         divisionId: divId,
  //         positionId: posId,
  //         professionId: data.professionId || "",
  //         email: data.email || "",
  //         phone: data.phone || "",
  //         joinDate: formatDate(data.joinDate),
  //         workShiftId: data.workShiftId || "",
  //         employmentType: data.employmentType || "Non-Shift",
  //         status: data.status || "Aktif",
  //         roleId: data.roleId || "",
  //         password: "",
  //       });
  //       setDivisions(allDivisions.filter((d) => d.departmentId === depId));
  //       setPositions(allPositions.filter((p) => p.divisionId === divId));
  //     } catch (e) {
  //       console.error("Error fetching user:", e);
  //       alert("Gagal mengambil data user");
  //     }
  //   }, [userData?.id, allDivisions, allPositions]);

  //   useEffect(() => {
  //     if (allDivisions.length && allPositions.length) {
  //       getUserById();
  //     }
  //   }, [allDivisions, allPositions, getUserById]);

  useEffect(() => {
    if (!isOpen || !userData?.id) return;

    let isCancelled = false;

    const getResponseArray = (response) => {
      if (Array.isArray(response.data?.data)) {
        return response.data.data;
      }

      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    };

    const loadEditData = async () => {
      try {
        const [
          roleResponse,
          workShiftResponse,
          professionResponse,
          positionResponse,
          divisionResponse,
          departmentResponse,
          userResponse,
        ] = await Promise.all([
          axiosInstance.get("/roles"),
          axiosInstance.get("/workshifts"),
          axiosInstance.get("/professions"),
          axiosInstance.get("/positions"),
          axiosInstance.get("/divisions"),
          axiosInstance.get("/departments"),
          axiosInstance.get(`/users/${userData.id}`),
        ]);

        if (isCancelled) return;

        const roleList = getResponseArray(roleResponse);
        const workShiftList = getResponseArray(workShiftResponse);
        const professionList = getResponseArray(professionResponse);
        const positionList = getResponseArray(positionResponse);
        const divisionList = getResponseArray(divisionResponse);
        const departmentList = getResponseArray(departmentResponse);

        const data = userResponse.data?.data;

        if (!data) {
          throw new Error("Data pengguna tidak ditemukan");
        }

        /*
         * Mengantisipasi perbedaan nama association Sequelize:
         * position atau Position
         * division atau Division
         * department atau Department
         */
        const positionData = data.position || data.Position || null;

        const divisionData =
          positionData?.division || positionData?.Division || null;

        const departmentData =
          divisionData?.department || divisionData?.Department || null;

        const departmentId = departmentData?.id || "";
        const divisionId = divisionData?.id || "";
        const positionId = positionData?.id || data.positionId || "";

        setRoles(roleList);
        setWorkShifts(workShiftList);
        setProfessions(professionList);
        setAllPositions(positionList);
        setAllDivisions(divisionList);
        setDepartments(departmentList);

        setDivisions(
          divisionList.filter(
            (division) =>
              Number(division.departmentId) === Number(departmentId),
          ),
        );

        setPositions(
          positionList.filter(
            (position) => Number(position.divisionId) === Number(divisionId),
          ),
        );

        setUser({
          titlePrefix: data.titlePrefix || "",
          fullName: data.fullName || "",
          titleSuffix: data.titleSuffix || "",
          nip: data.nip || "",
          departmentId,
          divisionId,
          positionId,
          professionId: data.professionId || "",
          email: data.email || "",
          phone: data.phone || "",
          joinDate: formatDate(data.joinDate),
          workShiftId: data.workShiftId || "",
          employmentType: data.employmentType || "Non-Shift",
          status: data.status || "Aktif",
          roleId: data.roleId || "",
          profilePhoto: data.profilePhoto || null,
          avatarUrl: data.avatarUrl || null,
          password: "",
        });
      } catch (error) {
        console.error(
          "Gagal memuat data edit karyawan:",
          error.response?.data || error.message,
        );

        alert(
          error.response?.data?.message ||
            error.message ||
            "Gagal memuat data edit karyawan",
        );
      }
    };

    loadEditData();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, userData?.id]);

  //   const handleDropdownChange = (e) => {
  //     const { name, value } = e.target;

  //     if (name === "department") {
  //       const depId = parseInt(value);
  //       setUser({
  //         ...user,
  //         departmentId: depId,
  //         divisionId: "",
  //         positionId: "",
  //       });
  //       setDivisions(allDivisions.filter((div) => div.departmentId === depId));
  //       setPositions([]);
  //     }

  //     if (name === "division") {
  //       const divId = parseInt(value);
  //       setUser({
  //         ...user,
  //         divisionId: divId,
  //         positionId: "",
  //       });
  //       setPositions(allPositions.filter((pos) => pos.divisionId === divId));
  //     }

  //     if (name === "position") {
  //       setUser({
  //         ...user,
  //         positionId: parseInt(value),
  //       });
  //     }
  //   };

  const handleDropdownChange = (event) => {
    const { name, value } = event.target;

    if (name === "department") {
      const departmentId = Number(value);

      setUser((previous) => ({
        ...previous,
        departmentId,
        divisionId: "",
        positionId: "",
      }));

      setDivisions(
        allDivisions.filter(
          (division) => Number(division.departmentId) === departmentId,
        ),
      );

      setPositions([]);
      return;
    }

    if (name === "division") {
      const divisionId = Number(value);

      setUser((previous) => ({
        ...previous,
        divisionId,
        positionId: "",
      }));

      setPositions(
        allPositions.filter(
          (position) => Number(position.divisionId) === divisionId,
        ),
      );

      return;
    }

    if (name === "position") {
      setUser((previous) => ({
        ...previous,
        positionId: Number(value),
      }));
    }
  };

  //   tanpa edit foto profile
  //   const handleSubmit = async (e) => {
  //     e.preventDefault();
  //     const payload = {
  //       firstName: user.firstName,
  //       middleName: user.middleName,
  //       lastName: user.lastName,
  //       nip: user.nip,
  //       positionId: user.positionId ? parseInt(user.positionId) : null,
  //       professionId: user.professionId ? parseInt(user.professionId) : null,
  //       email: user.email,
  //       phone: user.phone,
  //       joinDate: user.joinDate,
  //       workShiftId: user.workShiftId ? parseInt(user.workShiftId) : null,
  //       employmentType: user.employmentType,
  //       status: user.status,
  //       roleId: user.roleId ? parseInt(user.roleId) : null,
  //     };
  //     if (user.password.trim() !== "") payload.password = user.password;

  //     try {
  //       await axios.put(`http://localhost:3000/users/${userData.id}`, payload, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //       alert("User berhasil diperbarui!");
  //       console.log(payload);
  //       onSuccess();
  //     } catch (e) {
  //       console.error("Gagal update user:", e);
  //       alert("Gagal memperbarui data user!");
  //     }
  //   };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    // Object.entries({
    //   titlePrefix: user.titlePrefix,
    //   fullName: user.fullName,
    //   titleSuffix: user.titleSuffix,
    //   nip: user.nip,
    //   positionId: user.positionId,
    //   professionId: user.professionId,
    //   email: user.email,
    //   phone: user.phone,
    //   joinDate: user.joinDate,
    //   workShiftId: user.workShiftId,
    //   employmentType: user.employmentType,
    //   status: user.status,
    //   roleId: user.roleId,
    // }).forEach(([key, value]) => {
    //   if (value !== null && value !== "") {
    //     formData.append(key, value);
    //   }
    // });

    const userDataFields = {
      titlePrefix: user.titlePrefix,
      fullName: user.fullName,
      titleSuffix: user.titleSuffix,
      nip: user.nip,
      positionId: user.positionId,
      professionId: user.professionId,
      email: user.email,
      phone: user.phone,
      joinDate: user.joinDate,
      workShiftId: user.workShiftId,
      employmentType: user.employmentType,
      status: user.status,
      roleId: user.roleId,
    };
    Object.entries(userDataFields).forEach(([key, value]) => {
      if (value !== null && value !== "" && value !== undefined) {
        formData.append(key, value);
      }
    });

    if (user.password?.trim()) {
      formData.append("password", user.password);
    }
    if (user.profilePhoto instanceof File) {
      formData.append("profilePhoto", user.profilePhoto);
    }

    try {
      //   await axios.put(`http://localhost:3000/users/${userData.id}`, formData, {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //       "Content-Type": "multipart/form-data",
      //     },
      //   });

      await axiosInstance.put(`/users/${userData.id}`, formData);

      alert("User berhasil diperbarui!");
      onSuccess();
    } catch (e) {
      console.error(e);
      alert("Gagal memperbarui user");
    }
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-user-card">
        <div className="modal-header">
          <h3>Edit Karyawan</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label className="label">Gelar Depan</label>
                  <div className="control">
                    <input
                      type="text"
                      className="input-field"
                      name="titlePrefix"
                      placeholder="Gelar Depan"
                      value={user.titlePrefix}
                      onChange={(e) =>
                        setUser({ ...user, titlePrefix: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Nama Lengkap <span>*</span>
                  </label>
                  <div className="control">
                    <input
                      type="text"
                      className="input-field"
                      name="fullName"
                      placeholder="Masukkan nama lengkap"
                      value={user.fullName}
                      onChange={(e) =>
                        setUser({ ...user, fullName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label className="label">Gelar Belakang</label>
                  <div className="control">
                    <input
                      type="text"
                      className="input-field"
                      name="titleSuffix"
                      placeholder="Gelar Belakang"
                      value={user.titleSuffix}
                      onChange={(e) =>
                        setUser({ ...user, titleSuffix: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    NIP <span>*</span>
                  </label>
                  <div className="control">
                    <input
                      type="text"
                      className="input-field"
                      name="nip"
                      placeholder="Contoh: 123456"
                      value={user.nip}
                      onChange={(e) =>
                        setUser({ ...user, nip: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Fungsi <span>*</span>
                  </label>
                  <div className="control">
                    <select
                      name="department"
                      id="department"
                      value={user.departmentId || ""}
                      onChange={handleDropdownChange}
                      required
                    >
                      <option value="" disabled>
                        Pilih Fungsi
                      </option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Unit <span>*</span>
                  </label>
                  <div className="control">
                    <select
                      name="division"
                      id="division"
                      value={user.divisionId || ""}
                      onChange={handleDropdownChange}
                      required
                    >
                      <option value="" disabled>
                        Pilih Unit
                      </option>
                      {divisions.map((div) => (
                        <option key={div.id} value={div.id}>
                          {div.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Profesi <span>*</span>
                  </label>
                  <div className="control">
                    <select
                      name="profession"
                      id="profession"
                      value={user.professionId || ""}
                      onChange={(e) =>
                        setUser({
                          ...user,
                          professionId: parseInt(e.target.value) || "",
                        })
                      }
                      required
                    >
                      <option value="" disabled>
                        Pilih Profesi
                      </option>
                      {professions.map((prof) => (
                        <option key={prof.id} value={prof.id}>
                          {prof.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Jabatan <span>*</span>
                  </label>
                  <div className="control">
                    <select
                      name="position"
                      id="position"
                      value={user.positionId || ""}
                      onChange={handleDropdownChange}
                      required
                    >
                      <option value="" disabled>
                        Pilih Jabatan
                      </option>
                      {positions.map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Email <span>*</span>
                  </label>
                  <div className="control">
                    <input
                      type="email"
                      className="input-field"
                      name="email"
                      placeholder="Masukkan Email"
                      value={user.email}
                      onChange={(e) =>
                        setUser({ ...user, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Telepon <span>*</span>
                  </label>
                  <div className="control">
                    <input
                      type="tel"
                      className="input-field"
                      name="phone"
                      id="phone"
                      placeholder="Masukkan Nomor Telepon"
                      value={user.phone}
                      onChange={(e) =>
                        setUser({ ...user, phone: e.target.value })
                      }
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Tanggal Bergabung <span>*</span>
                  </label>
                  <div className="control">
                    <input
                      type="date"
                      className="input-field"
                      name="joinDate"
                      value={formatDate(user?.joinDate)}
                      onChange={(e) =>
                        setUser({ ...user, joinDate: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Tipe Karyawan <span>*</span>
                  </label>
                  <div className="control">
                    <select
                      name="employmentType"
                      id="employmentType"
                      value={user.employmentType}
                      onChange={(e) =>
                        setUser({ ...user, employmentType: e.target.value })
                      }
                      required
                    >
                      <option value="" disabled>
                        Pilih Tipe
                      </option>
                      <option value="Non-Shift">Non-shift</option>
                      <option value="Shift">Shift</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Status <span>*</span>
                  </label>
                  <div className="control">
                    <select
                      name="status"
                      id="status"
                      value={user.status}
                      onChange={(e) =>
                        setUser({ ...user, status: e.target.value })
                      }
                      required
                    >
                      <option value="" disabled>
                        Pilih Status
                      </option>
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Role Akses <span>*</span>
                  </label>
                  <div className="control">
                    <select
                      name="role"
                      id="role"
                      value={user.roleId || ""}
                      onChange={(e) =>
                        setUser({
                          ...user,
                          roleId: parseInt(e.target.value) || "",
                        })
                      }
                      required
                    >
                      <option value="" disabled>
                        Pilih Role
                      </option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label className="label">Foto</label>
                  <div className="control">
                    <input
                      type="file"
                      className="input-field"
                      accept="image/*"
                      //   onChange={(e) => {
                      //     setUser({ ...user, profilePhoto: e.target.files[0] });
                      //   }}
                      onChange={(event) => {
                        const selectedFile = event.target.files?.[0];
                        if (!selectedFile) return;
                        setUser((previous) => ({
                          ...previous,
                          profilePhoto: selectedFile,
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Password <text>(Kosongkan jika tidak diubah)</text>
                  </label>
                  <div className="control">
                    <input
                      type={showPassword ? "text" : "password"}
                      //   className="input-field"
                      name="password"
                      placeholder="Masukkan Password Baru"
                      value={user.password}
                      onChange={(e) =>
                        setUser({ ...user, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="button is-danger"
              onClick={onClose}
            >
              Batal
            </button>
            <button type="submit" className="button is-purple">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;

// modal lama diupdate tanggal 19 februari 2026
{
  /* <div className="add-user-container">
  <button className="modal-close" onClick={onClose}>
    ✖
  </button>
  <h2 className="add-user-header">Edit Karyawan</h2>

  <form onSubmit={handleSubmit}>
    <div className="form-row">
      <div className="form-column">
        <label className="label">Gelar Depan</label>
        <div className="control">
          <input
            type="text"
            name="titlePrefix"
            placeholder="Masukkan Gelar Depan"
            value={user.titlePrefix}
            onChange={(e) => setUser({ ...user, titlePrefix: e.target.value })}
          />
        </div>
      </div>

      <div className="form-column">
        <label className="label">Nama Lengkap</label>
        <div className="control">
          <input
            type="text"
            name="fullName"
            placeholder="Masukkan nama lengkap"
            value={user.fullName}
            onChange={(e) => setUser({ ...user, fullName: e.target.value })}
          />
        </div>
      </div>

      <div className="form-column">
        <label className="label">Gelar Belakang</label>
        <div className="control">
          <input
            type="text"
            name="titleSuffix"
            placeholder="Masukkan Gelar Belakang"
            value={user.titleSuffix}
            onChange={(e) => setUser({ ...user, titleSuffix: e.target.value })}
          />
        </div>
      </div>

      <div className="form-column">
        <label className="label">NIP</label>
        <div className="control">
          <input
            type="text"
            name="nip"
            placeholder="Contoh: 123456"
            value={user.nip}
            onChange={(e) => setUser({ ...user, nip: e.target.value })}
          />
        </div>
      </div>
    </div>

    <div className="form-row">
      <div className="form-column">
        <label className="label">Departemen *</label>
        <div className="control">
          <select
            name="department"
            id="department"
            value={user.departmentId || ""}
            onChange={handleDropdownChange}
          >
            <option value="" disabled>
              Pilih Departemen
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-column">
        <label className="label">Divisi *</label>
        <div className="control">
          <select
            name="division"
            id="division"
            value={user.divisionId || ""}
            onChange={handleDropdownChange}
          >
            <option value="" disabled>
              Pilih Divisi
            </option>
            {divisions.map((div) => (
              <option key={div.id} value={div.id}>
                {div.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-column">
        <label className="label">Posisi *</label>
        <div className="control">
          <select
            name="position"
            id="position"
            value={user.positionId || ""}
            onChange={handleDropdownChange}
          >
            <option value="" disabled>
              Pilih Posisi
            </option>
            {positions.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-column">
        <label className="label">Profesi *</label>
        <div className="control">
          <select
            name="profession"
            id="profession"
            value={user.professionId || ""}
            onChange={(e) =>
              setUser({
                ...user,
                professionId: parseInt(e.target.value) || "",
              })
            }
          >
            <option value="" disabled>
              Pilih Profesi
            </option>
            {professions.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>

    <div className="form-row">
      <div className="form-column">
        <label className="label">Email *</label>
        <div className="control">
          <input
            type="email"
            name="email"
            placeholder="Masukkan Email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
        </div>
      </div>

      <div className="form-column">
        <label className="label">Telepon *</label>
        <div className="control">
          <input
            type="tel"
            name="phone"
            id="phone"
            placeholder="Masukkan Nomor Telepon"
            value={user.phone}
            onChange={(e) => setUser({ ...user, phone: e.target.value })}
            min="0"
          />
        </div>
      </div>

      <div className="form-column">
        <label className="label">Tanggal Bergabung *</label>
        <div className="control">
          <input
            type="date"
            name="joinDate"
            value={formatDate(user?.joinDate)}
            onChange={(e) => setUser({ ...user, joinDate: e.target.value })}
          />
        </div>
      </div>

      <div className="form-column">
        <label className="label">Tipe Karyawan *</label>
        <div className="control">
          <select
            name="employmentType"
            id="employmentType"
            value={user.employmentType}
            onChange={(e) =>
              setUser({ ...user, employmentType: e.target.value })
            }
          >
            <option value="Non-Shift">Non-shift</option>
            <option value="Shift">Shift</option>
          </select>
        </div>
      </div>
    </div>

    {/* <div className="form-row">
          <div className="form-column">
            <label className="label">Tanggal Bergabung *</label>
            <div className="control">
              <input
                type="date"
                name="joinDate"
                value={formatDate(user?.joinDate)}
                onChange={(e) => setUser({ ...user, joinDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-column">
            <label className="label">Tipe Karyawan *</label>
            <div className="control">
              <select
                name="employmentType"
                id="employmentType"
                value={user.employmentType}
                onChange={(e) =>
                  setUser({ ...user, employmentType: e.target.value })
                }
              >
                <option value="Non-Shift">Non-shift</option>
                <option value="Shift">Shift</option>
              </select>
            </div>
          </div>

          <div className="form-column">
            <label className="label">Jam Kerja *</label>
            <div className="control">
              <select
                name="workShift"
                id="workShift"
                value={user.workShiftId || ""}
                onChange={(e) =>
                  setUser({
                    ...user,
                    workShiftId: parseInt(e.target.value) || "",
                  })
                }
                disabled={user.employmentType === "Non-Shift"}
              >
                <option value="" disabled>
                  Pilih Jam Kerja
                </option>

                {Array.isArray(workShifts) &&
                  workShifts.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name} ({ws.startTime?.slice(0, 5)} -{" "}
                      {ws.endTime?.slice(0, 5)})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div> // batas

    <div className="form-row">
      <div className="form-column">
        <label className="label">Status *</label>
        <div className="control">
          <select
            name="status"
            id="status"
            value={user.status}
            onChange={(e) => setUser({ ...user, status: e.target.value })}
          >
            <option value="Aktif">Aktif</option>
            <option value="Cuti">Cuti</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>
      <div className="form-column">
        <label className="label">Role Akses *</label>
        <div className="control">
          <select
            name="role"
            id="role"
            value={user.roleId || ""}
            onChange={(e) =>
              setUser({
                ...user,
                roleId: parseInt(e.target.value) || "",
              })
            }
          >
            <option value="" disabled>
              Pilih Role
            </option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>

    <div className="form-row">
      <div className="form-column">
        <label className="label">Password (Kosongkan jika tidak diubah)</label>
        <div className="control">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Masukkan Password Baru"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="form-column">
        <label className="label">Foto Profil</label>
        <div className="control">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setUser({ ...user, profilePhoto: e.target.files[0] });
            }}
          />
        </div>
      </div>

      {/* <div className="form-column button-group"> // batas
      <div className="form-column actions-buttons">
        <button type="button" className="button is-danger" onClick={onClose}>
          Batal
        </button>
        <button type="submit" className="button is-success">
          Simpan Perubahan
        </button>
      </div>
    </div>
  </form>
</div>; */
}

// <div className="modal-overlay">
//   <div className="modal">
//     <h3 className="modal-title">Edit User</h3>
//     <form onSubmit={handleSubmit} className="modal-form">
//       <div className="form-row">
//         <div className="form-column">
//           <label className="label">Gelar Depan</label>
//           <div className="control">
//             <input
//               type="text"
//               name="firstName"
//               placeholder="Masukkan Gelar Depan"
//               value={user.firstName}
//               onChange={(e) =>
//                 setUser({ ...user, firstName: e.target.value })
//               }
//             />
//           </div>
//         </div>
//         <div className="form-column">
//           <label className="label">Nama Lengkap</label>
//           <div className="control">
//             <input
//               type="text"
//               name="middleName"
//               placeholder="Masukkan nama lengkap"
//               value={user.middleName}
//               onChange={(e) =>
//                 setUser({ ...user, middleName: e.target.value })
//               }
//             />
//           </div>
//         </div>
//         <div className="form-column">
//           <label className="label">Gelar Belakang</label>
//           <div className="control">
//             <input
//               type="text"
//               name="lastName"
//               placeholder="Masukkan Gelar Belakang"
//               value={user.lastName}
//               onChange={(e) =>
//                 setUser({ ...user, lastName: e.target.value })
//               }
//             />
//           </div>
//         </div>
//         <div className="form-column">
//           <label className="label">NIP</label>
//           <div className="control">
//             <input
//               type="text"
//               name="nip"
//               placeholder="Contoh: 123456"
//               value={user.nip}
//               onChange={(e) => setUser({ ...user, nip: e.target.value })}
//             />
//           </div>
//         </div>
//       </div>

//       <div className="form-row">
//         <div className="form-column">
//           <label className="label">Departemen *</label>
//           <div className="control">
//             <select
//               name="department"
//               id="department"
//               value={user.departmentId || ""}
//               onChange={handleDropdownChange}
//             >
//               <option value="" disabled>
//                 Pilih Departemen
//               </option>
//               {departments.map((d) => (
//                 <option key={d.id} value={d.id}>
//                   {d.name}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//         <div className="form-column">
//           <label className="label">Divisi *</label>
//           <div className="control">
//             <select
//               name="division"
//               id="division"
//               value={user.divisionId || ""}
//               onChange={handleDropdownChange}
//             >
//               <option value="" disabled>
//                 Pilih Divisi
//               </option>
//               {divisions.map((div) => (
//                 <option key={div.id} value={div.id}>
//                   {div.name}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//         <div className="form-column">
//           <label className="label">Posisi *</label>
//           <div className="control">
//             <select
//               name="position"
//               id="position"
//               value={user.positionId || ""}
//               onChange={handleDropdownChange}
//             >
//               <option value="" disabled>
//                 Pilih Posisi
//               </option>
//               {positions.map((pos) => (
//                 <option key={pos.id} value={pos.id}>
//                   {pos.name}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//         <div className="form-column">
//           <label className="label">Profesi *</label>
//           <div className="control">
//             <select
//               name="profession"
//               id="profession"
//               value={user.professionId || ""}
//               onChange={(e) =>
//                 setUser({
//                   ...user,
//                   professionId: parseInt(e.target.value) || "",
//                 })
//               }
//             >
//               <option value="" disabled>
//                 Pilih Profesi
//               </option>
//               {professions.map((prof) => (
//                 <option key={prof.id} value={prof.id}>
//                   {prof.name}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>

//       <div className="form-row">
//         <div className="form-column">
//           <label className="label">Email *</label>
//           <div className="control">
//             <input
//               type="email"
//               name="email"
//               placeholder="Masukkan Email"
//               value={user.email}
//               onChange={(e) => setUser({ ...user, email: e.target.value })}
//             />
//           </div>
//         </div>
//         <div className="form-column">
//           <label className="label">Telepon *</label>
//           <div className="control">
//             <input
//               type="tel"
//               name="phone"
//               id="phone"
//               placeholder="Masukkan Nomor Telepon"
//               value={user.phone}
//               onChange={(e) => setUser({ ...user, phone: e.target.value })}
//               min="0"
//             />
//           </div>
//         </div>
//       </div>
//       <div className="form-row">
//         <div className="form-column">
//           <label className="label">Tanggal Bergabung *</label>
//           <div className="control">
//             <input
//               type="date"
//               name="joinDate"
//               value={formatDate(user?.joinDate)}
//               onChange={(e) =>
//                 setUser({ ...user, joinDate: e.target.value })
//               }
//             />
//           </div>
//         </div>

//         <div className="form-column">
//           <label className="label">Tipe Karyawan *</label>
//           <div className="control">
//             <select
//               name="employmentType"
//               id="employmentType"
//               value={user.employmentType}
//               onChange={(e) =>
//                 setUser({ ...user, employmentType: e.target.value })
//               }
//             >
//               <option value="Non-Shift">Non-shift</option>
//               <option value="Shift">Shift</option>
//             </select>
//           </div>
//         </div>

//         {/* <div className="form-column">
//           <label className="label">Jam Kerja *</label>
//           <div className="control">
//             <select
//               name="workShift"
//               id="workShift"
//               value={user.workShiftId || ""}
//               onChange={(e) =>
//                 setUser({
//                   ...user,
//                   workShiftId: parseInt(e.target.value) || "",
//                 })
//               }
//             >
//               <option value="" disabled>
//                 Pilih Jam Kerja
//               </option>
//               {workShifts.map((ws) => (
//                 <option key={ws.id} value={ws.id}>
//                   {ws.name} ({ws.startTime?.slice(0, 5)} -{" "}
//                   {ws.endTime?.slice(0, 5)})
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div> */}
//         <div className="form-column">
//           <label className="label">Jam Kerja *</label>
//           <div className="control">
//             <select
//               name="workShift"
//               id="workShift"
//               value={user.workShiftId || ""}
//               onChange={(e) =>
//                 setUser({
//                   ...user,
//                   workShiftId: parseInt(e.target.value) || "",
//                 })
//               }
//               disabled={user.employmentType === "Non-Shift"}
//             >
//               <option value="" disabled>
//                 Pilih Jam Kerja
//               </option>

//               {Array.isArray(workShifts) &&
//                 workShifts.map((ws) => (
//                   <option key={ws.id} value={ws.id}>
//                     {ws.name} ({ws.startTime?.slice(0, 5)} -{" "}
//                     {ws.endTime?.slice(0, 5)})
//                   </option>
//                 ))}
//             </select>
//           </div>
//         </div>
//       </div>

//       <div className="form-row">
//         <div className="form-column">
//           <label className="label">Status *</label>
//           <div className="control">
//             <select
//               name="status"
//               id="status"
//               value={user.status}
//               onChange={(e) => setUser({ ...user, status: e.target.value })}
//             >
//               <option value="Aktif">Aktif</option>
//               <option value="Cuti">Cuti</option>
//               <option value="Nonaktif">Nonaktif</option>
//             </select>
//           </div>
//         </div>
//         <div className="form-column">
//           <label className="label">Role Akses *</label>
//           <div className="control">
//             <select
//               name="role"
//               id="role"
//               value={user.roleId || ""}
//               onChange={(e) =>
//                 setUser({ ...user, roleId: parseInt(e.target.value) || "" })
//               }
//             >
//               <option value="" disabled>
//                 Pilih Role
//               </option>
//               {roles.map((r) => (
//                 <option key={r.id} value={r.id}>
//                   {r.name}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>

//       <div className="form-row">
//         {/* <div className="form-column">
//           <label className="label">Password Lama</label>
//           <div className="control">
//             <input
//               type={showPassword ? "text" : "password"}
//               name="currentPassword"
//               placeholder="Masukkan password lama"
//               value={user.currentPassword || ""}
//               onChange={(e) =>
//                 setUser({ ...user, currentPassword: e.target.value })
//               }
//             />
//           </div>
//         </div> */}
//         <div className="form-column">
//           <label className="label">
//             Password (Kosongkan jika tidak diubah)
//           </label>
//           <div className="control">
//             <input
//               type={showPassword ? "text" : "password"}
//               name="password"
//               placeholder="Masukkan Password Baru"
//               value={user.password}
//               onChange={(e) =>
//                 setUser({ ...user, password: e.target.value })
//               }
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//             >
//               {showPassword ? "Hide" : "Show"}
//             </button>
//           </div>
//         </div>
//         <div className="form-column button-group">
//           <button
//             type="button"
//             className="button is-danger"
//             onClick={onClose}
//           >
//             Batal
//           </button>
//           <button type="submit" className="button is-success">
//             Simpan Perubahan
//           </button>
//         </div>
//       </div>
//     </form>
//   </div>
// </div>
