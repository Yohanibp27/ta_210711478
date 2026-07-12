// import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import axiosInstance from "../../../api/axios.js";

const EditShift = ({ isOpen, shiftData, onClose, onSuccess }) => {
  //   const token = localStorage.getItem("token");
  const [form, setForm] = useState({ userId: "", workShiftId: "", date: "" });
  const [users, setUsers] = useState([]);
  const [workShifts, setWorkShifts] = useState([]);
  const [displayUsers, setDisplayUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    if (!isOpen || !shiftData) return;

    fetchData();
  }, [shiftData, isOpen]);

  //   const fetchData = async () => {
  //     try {
  //       const [userRes, shiftRes, currentShiftRes] = await Promise.all([
  //         axios.get("http://localhost:3000/users", {
  //           headers: { Authorization: `Bearer ${token}` },
  //         }),
  //         axios.get("http://localhost:3000/workshifts", {
  //           headers: { Authorization: `Bearer ${token}` },
  //         }),
  //         axios.get(`http://localhost:3000/shifts/${shiftData?.id}`, {
  //           headers: { Authorization: `Bearer ${token}` },
  //         }),
  //       ]);

  //       const userData = Array.isArray(userRes.data)
  //         ? userRes.data
  //         : userRes.data.users || userRes.data.data || [];
  //       const shiftData = Array.isArray(shiftRes.data)
  //         ? shiftRes.data
  //         : shiftRes.data.workShifts || shiftRes.data.data || shiftRes.data || [];

  //       const currentShift =
  //         currentShiftRes.data?.data?.[0] ||
  //         currentShiftRes.data?.shift ||
  //         currentShiftRes.data ||
  //         null;

  //       const filteredUsers = userData.filter(
  //         (u) =>
  //           u.employmentType?.toLowerCase() === "shift" &&
  //           u.status?.toLowerCase() === "aktif",
  //       );
  //       const activeUsers = userData.filter(
  //         (u) =>
  //           u.status?.toLowerCase() === "aktif" &&
  //           u.employmentType?.toLowerCase() === "shift",
  //       );

  //       const uniqueUnitsMap = new Map();
  //       activeUsers.forEach((u) => {
  //         const div = u.position?.division;
  //         if (div) uniqueUnitsMap.set(div.id, { id: div.id, name: div.name });
  //       });

  //       setUsers(filteredUsers);
  //       setWorkShifts(shiftData);
  //       setDisplayUsers(activeUsers);
  //       setUnits(Array.from(uniqueUnitsMap.values()));

  //       if (currentShift) {
  //         const formattedDate = currentShift.date
  //           ? new Date(currentShift.date).toISOString().split("T")[0]
  //           : "";

  //         setForm({
  //           userId: Number(currentShift.userId),
  //           workShiftId: Number(currentShift.workShiftId),
  //           //   date: currentShift.date ? currentShift.date.slice(0, 10) : "",
  //           date: formattedDate,
  //         });
  //         const userUnitId = activeUsers.find((u) => u.id === currentShift.userId)
  //           ?.position?.division?.id;
  //         if (userUnitId) setSelectedUnit(userUnitId.toString());
  //       }
  //     } catch (e) {
  //       console.error("Fetch data error:", e);
  //       alert("Gagal mengambil data shift");
  //     }
  //   };

  const fetchData = async () => {
    if (!shiftData?.id) return;

    try {
      //   const [userRes, shiftRes] = await Promise.all([
      //     axios.get("http://localhost:3000/users", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //     axios.get("http://localhost:3000/workshifts", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     }),
      //   ]);

      const [userRes, shiftRes] = await Promise.all([
        axiosInstance.get("/users"),
        axiosInstance.get("/workshifts"),
      ]);
      const userData = Array.isArray(userRes.data)
        ? userRes.data
        : userRes.data.users || userRes.data.data || [];
      const shiftDataList = Array.isArray(shiftRes.data)
        ? shiftRes.data
        : shiftRes.data.workShifts || shiftRes.data.data || shiftRes.data || [];

      const filteredUsers = userData.filter(
        (u) =>
          u.employmentType?.toLowerCase() === "shift" &&
          u.status?.toLowerCase() === "aktif",
      );
      const activeUsers = userData.filter(
        (u) =>
          u.status?.toLowerCase() === "aktif" &&
          u.employmentType?.toLowerCase() === "shift",
      );

      const uniqueUnitsMap = new Map();
      activeUsers.forEach((u) => {
        const div = u.position?.division;
        if (div) uniqueUnitsMap.set(div.id, { id: div.id, name: div.name });
      });

      setUsers(filteredUsers);
      setWorkShifts(shiftDataList);
      setDisplayUsers(activeUsers);
      setUnits(Array.from(uniqueUnitsMap.values()));

      if (shiftData) {
        const formattedDate = shiftData.date
          ? new Date(shiftData.date).toISOString().split("T")[0]
          : "";

        const targetUserId = shiftData.userId || shiftData.user?.id;
        const targetWorkShiftId =
          shiftData.workShiftId || shiftData.workShift?.id;

        setForm({
          userId: Number(targetUserId),
          workShiftId: Number(targetWorkShiftId),
          date: formattedDate,
        });

        const userUnitId = activeUsers.find((u) => u.id === targetUserId)
          ?.position?.division?.id;

        if (userUnitId) setSelectedUnit(userUnitId.toString());
      }
    } catch (e) {
      console.error("Fetch data error detail:", e.response?.data || e.message);
      alert(
        `Gagal mengambil data shift: ${e.response?.data?.message || e.message}`,
      );
    }
  };

  useEffect(() => {
    if (selectedUnit === "") {
      setDisplayUsers(users);
    } else {
      const filtered = users.filter(
        (u) => u.position?.division?.id === parseInt(selectedUnit),
      );
      setDisplayUsers(filtered);
    }
  }, [selectedUnit, users]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //   await axios.put(
      //     `http://localhost:3000/shifts/${shiftData.id}`,
      //     {
      //       userId: form.userId,
      //       workShiftId: form.workShiftId,
      //       date: form.date,
      //     },
      //     { headers: { Authorization: `Bearer ${token}` } },
      //   );

      await axiosInstance.put(`/shifts/${shiftData.id}`, {
        userId: form.userId,
        workShiftId: form.workShiftId,
        date: form.date,
      });
      alert("Shift berhasil diperbarui!");
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal memperbarui shift");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus shift ini? Tindakan ini tidak dapat dibatalkan.",
    );

    if (!confirmDelete) return;

    try {
      //   await axios.delete(`http://localhost:3000/shifts/${shiftData.id}`, {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });

      await axiosInstance.delete(`/shifts/${shiftData.id}`);
      alert("Shift berhasil dihapus!");
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menghapus shift");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Edit Shift Karyawan</h3>
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
              <select name="userId" value={form.userId} onChange={handleChange}>
                <option value="" disabled>
                  Pilih karyawan...
                </option>
                {displayUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.titlePrefix} {u.fullName || ""} ({u.nip})
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
              />
            </div>
            <div className="label-form  form-group">
              <label>
                Sesi <span>*</span>
              </label>
              <select
                name="workShiftId"
                value={form.workShiftId}
                onChange={handleChange}
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
              onClick={handleDelete}
            >
              Hapus
            </button>
            <button type="button" className="button is-info" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="button is-success">
              Ubah
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditShift;
