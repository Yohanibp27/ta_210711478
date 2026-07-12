import React, { useEffect, useState } from "react";
// import axios from "axios";
import { FaTimes } from "react-icons/fa";
import axiosInstance from "../../../api/axios.js";

const AddShift = ({ onClose, onSuccess }) => {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    userId: "",
    workShiftId: "",
    date: today,
  });
  const [users, setUsers] = useState([]);
  const [workShifts, setWorkShifts] = useState([]);
  const token = localStorage.getItem("token");

  const [allUsers, setAllUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const fetchData = async () => {
    // const [userRes, shiftRes] = await Promise.all([
    //   axios.get("http://localhost:3000/users", {
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //   }),
    //   axios.get("http://localhost:3000/workshifts", {
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //   }),
    // ]);

    const [userRes, shiftRes] = await Promise.all([
      axiosInstance.get("/users"),
      axiosInstance.get("/workshifts"),
    ]);

    const userData = Array.isArray(userRes.data)
      ? userRes.data
      : userRes.data.users || userRes.data.data || [];

    const shiftData = Array.isArray(shiftRes.data)
      ? shiftRes.data
      : shiftRes.data.workShifts || shiftRes.data.data || [];

    // const filteredUsers = userData.filter(
    //   (u) =>
    //     u.employmentType?.toLowerCase() === "shift" &&
    //     u.status?.toLowerCase() === "aktif",
    // );

    const activeUsers = userData.filter(
      (u) =>
        u.status?.toLowerCase() === "aktif" &&
        u.employmentType?.toLowerCase() === "shift",
    );

    // 4. EKSTRAK DATA UNIT DARI USER (Auto-Generate Dropdown Unit)
    // Kita cari unit/divisi unik dari daftar user yang ada
    const uniqueUnitsMap = new Map();
    activeUsers.forEach((u) => {
      const division = u.position?.division;
      if (division && division.id) {
        uniqueUnitsMap.set(division.id, {
          id: division.id,
          name: division.name,
        });
      }
    });
    const uniqueUnitsArray = Array.from(uniqueUnitsMap.values());
    setAllUsers(activeUsers); // Simpan master data
    setUsers(activeUsers); // Awalnya tampilkan semua
    setUnits(uniqueUnitsArray); // Isi dropdown unit

    // setUsers(filteredUsers);
    setWorkShifts(shiftData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //   await axios.post("http://localhost:3000/shifts", form, {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      await axiosInstance.post("/shifts", form);
      alert("Shift berhasil ditambahkan!");
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menambahkan shift");
    }
  };

  useEffect(() => {
    if (selectedUnit === "") {
      setUsers(allUsers);
    } else {
      const filtered = allUsers.filter(
        (u) => u.position?.division?.id === parseInt(selectedUnit),
      );
      setUsers(filtered);
    }
    // Reset pilihan user di form jika ganti unit
    setForm((prev) => ({ ...prev, userId: "" }));
  }, [selectedUnit, allUsers]);

  useEffect(() => {
    fetchData();
  }, [token]);

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Tambah Shift Karyawan</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="label-form form-group">
              <label>
                Pilih Unit <span>*</span>
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                <option value="" disabled>
                  Semua Unit
                </option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="label-form form-group">
              <label>
                Nama Karyawan <span>*</span>
              </label>
              <select
                name="userId"
                value={form.userId}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Pilih User
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.titlePrefix} {u.fullName} ({u.nip}) - {u.employmentType}{" "}
                    - {u.status} - {u.position?.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="label-form form-group">
              <label>
                Tanggal <span>*</span>
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="label-form form-group">
              <label>
                Sesi <span>*</span>
              </label>
              <select
                name="workShiftId"
                value={form.workShiftId}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Pilih Sesi
                </option>
                {workShifts.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}: {ws.startTime} - {ws.endTime}
                  </option>
                ))}
              </select>
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

export default AddShift;
