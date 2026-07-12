import axios from "axios";
import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import axiosInstance from "../../../api/axios.js";

const AddUser = ({ isOpen, onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const today = new Date().toISOString().split("T")[0];
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [positions, setPositions] = useState([]);
  const [professions, setProfessions] = useState([]);
  //   const [workShifts, setWorkShifts] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  const [user, setUser] = useState({
    titlePrefix: "",
    fullName: "",
    titleSuffix: "",
    nip: "",
    departmentId: "",
    divisionId: "",
    positionId: "",
    professionId: "",
    email: "",
    phone: "",
    joinDate: today,
    workShiftId: "",
    employmentType: "",
    status: "Aktif",
    roleId: "",
    password: "",
    profilePhoto: "",
  });

  const handleCategoryChange = (type) => {
    setUser((prev) => ({ ...prev, employmentType: type }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // const [dept, rl, ws, pf] = await Promise.all([
        //   axios.get("http://localhost:3000/departments", {
        //     headers: { Authorization: `Bearer ${token}` },
        //   }),
        //   axios.get("http://localhost:3000/roles", {
        //     headers: { Authorization: `Bearer ${token}` },
        //   }),
        //   axios.get("http://localhost:3000/workshifts", {
        //     headers: { Authorization: `Bearer ${token}` },
        //   }),
        //   axios.get("http://localhost:3000/professions", {
        //     headers: { Authorization: `Bearer ${token}` },
        //   }),
        // ]);

        const [dept, rl, ws, pf] = await Promise.all([
          axiosInstance.get("/departments"),
          axiosInstance.get("/roles"),
          axiosInstance.get("/workshifts"),
          axiosInstance.get("/professions"),
        ]);

        setDepartments(dept.data?.data ?? []);
        setRoles(rl.data?.data ?? []);
        // setWorkShifts(ws.data?.data ?? []); // Tidak perlu set divisions di awal, karena akan di-fetch berdasarkan departmentId
        setProfessions(pf.data?.data ?? []);
      } catch (e) {
        console.error("Fetch dropdown error:", e);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    if (user.employmentType === "Non-Shift") {
      setUser((prev) => ({
        ...prev,
        workShiftId: 1,
      }));
    } else if (user.employmentType === "Shift") {
      setUser((prev) => ({
        ...prev,
        workShiftId: null,
      }));
    }
  }, [user.employmentType]);

  useEffect(() => {
    if (!user.departmentId) {
      setDivisions([]);
      setUser((prev) => ({ ...prev, divisionId: "", positionId: "" }));
      return;
    }

    const fetchDivisions = async () => {
      if (!user?.departmentId) {
        setDivisions([]);
        return;
      }

      try {
        // const res = await axios.get(
        //   `http://localhost:3000/divisions?departmentId=${user.departmentId}`,
        //   { headers: { Authorization: `Bearer ${token}` } },
        // );
        const res = await axiosInstance.get(
          `/divisions?departmentId=${user.departmentId}`,
        );
        setDivisions(res.data?.data ?? []);
        setUser((prev) => ({ ...prev, divisionId: "", positionId: "" }));
      } catch (err) {
        console.error("Fetch divisions error:", err);
        setDivisions([]);
      }
    };

    fetchDivisions();
  }, [user.departmentId, token]);

  useEffect(() => {
    if (!user.divisionId) {
      setPositions([]);
      setUser((prev) => ({ ...prev, positionId: "" }));
      return;
    }

    const fetchPositions = async () => {
      if (!user?.divisionId) {
        setPositions([]);
        return;
      }

      try {
        // const ds = await axios.get(
        //   `http://localhost:3000/positions?divisionId=${user.divisionId}`,
        //   { headers: { Authorization: `Bearer ${token}` } },
        // );
        const ds = await axiosInstance.get(
          `/positions?divisionId=${user.divisionId}`,
        );
        setPositions(ds.data?.data ?? []);
        setUser((prev) => ({ ...prev, positionId: "" }));
      } catch (e) {
        console.error("Fetch positions error:", e);
        setPositions([]);
      }
    };

    fetchPositions();
  }, [user.divisionId, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !user.fullName ||
      !user.nip ||
      !user.email ||
      !user.departmentId ||
      !user.divisionId ||
      !user.positionId ||
      !user.professionId ||
      !user.email ||
      !user.phone ||
      !user.joinDate ||
      !user.employmentType ||
      !user.status ||
      !user.roleId ||
      !user.password
    ) {
      alert("Semua field harus diisi!");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(user.password)) {
      alert("Password harus mengandung huruf besar, huruf kecil, dan angka");
      return;
    }

    try {
      const formData = new FormData();
      for (let key in user) {
        if (user[key] !== "" && user[key] !== null) {
          if (key !== "profilePhoto") {
            formData.append(key, user[key]);
          }
        }
      }

      if (user.profilePhoto) {
        formData.append("profilePhoto", user.profilePhoto);
      }

      formData.delete("departmentId");
      formData.delete("divisionId");

      //   await axios.post("http://localhost:3000/users", formData, {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //       "Content-Type": "multipart/form-data",
      //     },
      //   });
      await axiosInstance.post("/users", formData);

      alert("User berhasil ditambahkan!");
      onSuccess();
    } catch (e) {
      console.error(e);
      alert("Gagal membuat user");
      alert(e.response?.data?.message || "Gagal menambah user!");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-user-card">
        <div className="modal-header">
          <h3>Tambah Karyawan</h3>
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
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Nama Lengkap <span>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    name="fullName"
                    placeholder="Nama Lengkap"
                    value={user.fullName}
                    onChange={(e) =>
                      setUser({ ...user, fullName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label className="label">Gelar Belakang</label>
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
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    NIP <span>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    name="nip"
                    placeholder="Contoh: 123456"
                    value={user.nip}
                    onChange={(e) => setUser({ ...user, nip: e.target.value })}
                    required
                  />
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
                      onChange={(e) =>
                        setUser({
                          ...user,
                          departmentId: parseInt(e.target.value) || "",
                          divisionId: "",
                          positionId: "",
                        })
                      }
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
                      onChange={(e) =>
                        setUser({
                          ...user,
                          divisionId: parseInt(e.target.value) || "",
                          positionId: "",
                        })
                      }
                      disabled={!divisions.length}
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
                      onChange={(e) =>
                        setUser({
                          ...user,
                          positionId: parseInt(e.target.value) || "",
                        })
                      }
                      disabled={!positions.length}
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
                      id="email"
                      placeholder="Contoh: example@gmail.com"
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
                      placeholder="Contoh: 1234567890"
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
                      id="joinDate"
                      onChange={(e) =>
                        setUser({ ...user, joinDate: e.target.value })
                      }
                      value={user.joinDate}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-row">
              {/* <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Kategori Karyawan <span>*</span>
                  </label>
                  <div className="category-selection">
                    <button
                      className={`cat-btn non-shift ${user.employmentType === "Non-Shift" ? "active" : ""}`}
                      onClick={() => handleCategoryChange("Non-Hsift")}
                    >
                      <FaUserTie />
                      Non-Shift
                    </button>
                    <button
                      className={`cat-btn shift ${user.employmentType === "Shift" ? "active" : ""}`}
                      onClick={() => handleCategoryChange("Non-Hsift")}
                    >
                      <FaUserMd />
                      Shift
                    </button>
                  </div>
                </div>
              </div> */}
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Tipe <span>*</span>
                  </label>
                  <div className="control">
                    <select
                      name="employmentType"
                      id="employmentType"
                      value={user.employmentType || ""}
                      onChange={(e) =>
                        setUser({
                          ...user,
                          employmentType: e.target.value || "",
                        })
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
                      value={user.status || ""}
                      onChange={(e) =>
                        setUser({ ...user, status: e.target.value || "" })
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
                      onChange={(e) => {
                        setUser({ ...user, profilePhoto: e.target.files[0] });
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label className="label">
                    Password <span>*</span>
                  </label>
                  <div className="control">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      //   className="input-field"
                      id="password"
                      placeholder="Masukkan Password"
                      value={user.password}
                      onChange={(e) =>
                        setUser({ ...user, password: e.target.value })
                      }
                      required
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
            <button type="submit" className="button is-success">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUser;

// modal lama diupdate tanggal 19 februari 2026
{
  /* <div className="add-user-container">
  <button className="modal-close" onClick={onClose}>
    ✖
  </button>
  <h2 className="add-user-header">Tambah Karyawan</h2>
  <form onSubmit={handleSubmit}>
    <div className="form-row">
      <div className="form-column">
        <label className="label">Gelar Depan</label>
        <div className="control">
          <input
            type="text"
            name="titlePrefix"
            placeholder="Gelar Depan"
            value={user.titlePrefix}
            onChange={(e) =>
              setUser({ ...user, titlePrefix: e.target.value })
            }
          />
        </div>
      </div>

      <div className="form-column">
        <label className="label">Nama Lengkap *</label>
        <div className="control">
          <input
            type="text"
            name="fullName"
            placeholder="Nama Lengkap"
            value={user.fullName}
            onChange={(e) => setUser({ ...user, fullName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="form-column">
        <label className="label">Gelar Belakang</label>
        <div className="control">
          <input
            type="text"
            name="titleSuffix"
            placeholder="Gelar Belakang"
            value={user.titleSuffix}
            onChange={(e) =>
              setUser({ ...user, titleSuffix: e.target.value })
            }
          />
        </div>
      </div>

      <div className="form-column">
        <label className="label">NIP *</label>
        <div className="control">
          <input
            type="text"
            name="nip"
            placeholder="Contoh: 123456"
            value={user.nip}
            onChange={(e) => setUser({ ...user, nip: e.target.value })}
            required
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
            onChange={(e) =>
              setUser({
                ...user,
                departmentId: parseInt(e.target.value) || "",
                divisionId: "",
                positionId: "",
              })
            }
            required
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
            onChange={(e) =>
              setUser({
                ...user,
                divisionId: parseInt(e.target.value) || "",
                positionId: "",
              })
            }
            disabled={!divisions.length}
            required
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
            onChange={(e) =>
              setUser({
                ...user,
                positionId: parseInt(e.target.value) || "",
              })
            }
            disabled={!positions.length}
            required
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

    <div className="form-row">
      <div className="form-column">
        <label className="label">Email *</label>
        <div className="control">
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Masukkan Email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            required
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
            required
          />
        </div>
      </div>

      <div className="form-column">
        <label className="label">Tanggal Bergabung *</label>
        <div className="control">
          <input
            type="date"
            name="joinDate"
            id="joinDate"
            onChange={(e) => setUser({ ...user, joinDate: e.target.value })}
            value={user.joinDate}
            required
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
            required
          >
            <option value="" disabled>
              Pilih Tipe User
            </option>
            <option value="Non-Shift">Non-shift</option>
            <option value="Shift">Shift</option>
          </select>
        </div>
      </div>
    </div>

    <div className="form-row">
      <div className="form-column">
        <label className="label">Status *</label>
        <div className="control">
          <select
            name="status"
            id="status"
            value={user.status}
            onChange={(e) => setUser({ ...user, status: e.target.value })}
            required
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
      <div className="form-column">
        <label className="label">Password *</label>
        <div className="control">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            placeholder="Masukkan Password"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
            required
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

    <div className="form-row">
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

      <div className="form-column actions-buttons">
        <button
          type="button"
          className="button is-danger"
          onClick={onClose}
        >
          Batal
        </button>
        <button type="submit" className="button is-success">
          Simpan
        </button>
      </div>
    </div>
  </form>
</div>; */
}
