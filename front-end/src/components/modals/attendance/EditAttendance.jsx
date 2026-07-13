import { useState, useEffect } from "react";
import axios from "axios";
import { FaMapMarkerAlt, FaTimes } from "react-icons/fa";
import { formatDateIndo } from "../../../utils/dateHelper";
import axiosInstance from "../../../api/axios.js";

const EditAttendance = ({ data, onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [formData, setFormData] = useState({
    id: "",
    user: {},
    titlePrefix: "",
    fullName: "",
    titleSuffix: "",
    nip: "",
    date: "",
    checkInTime: "",
    checkOutTime: "",
    checkInLocation: "",
    checkOutLocation: "",
    tolerance: "",
    attendanceStatus: "",
    notes: "",
    workShiftId: "",
    source: "",
  });
  const [loadingLocation, setLoadingLocation] = useState({
    in: false,
    out: false,
  });

  useEffect(() => {
    if (data) getAttendanceById();
  }, [data]);

  const getAttendanceById = async () => {
    try {
      //   const response = await axios.get(
      //     `http://localhost:3000/attendances/${data}`,
      //     { headers: { Authorization: `Bearer ${token}` } },
      //   );
      const response = await axiosInstance.get(`/attendances/${data}`);
      const attend = response.data.data;

      // Fungsi untuk mengambil jam saja (HH:mm) dari ISO String
      //   const extractTime = (isoString) => {
      //     if (!isoString) return "";
      //     const dateObj = new Date(isoString);
      //     const hours = String(dateObj.getHours()).padStart(2, "0");
      //     const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      //     return `${hours}:${minutes}`;
      //   };

      const formatDateTimeLocal = (isoString) => {
        if (!isoString) return "";
        const dateObj = new Date(isoString);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");
        const seconds = String(dateObj.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };

      setFormData({
        id: attend.id,
        user: attend.user ?? {},
        date: attend.date,
        // checkInTime: extractTime(attend.checkInTime),
        // checkOutTime: extractTime(attend.checkOutTime),
        checkInTime: formatDateTimeLocal(attend.checkInTime),
        checkOutTime: formatDateTimeLocal(attend.checkOutTime),
        checkInLocation: attend.checkInLocation || "",
        checkOutLocation: attend.checkOutLocation || "",
        attendanceStatus: attend.attendanceStatus || "",
        notes: attend.notes || "",
        workShiftId: attend.workShiftId || "",
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(
        `/attendances/${data}`,
        {
          date: formData.date,
          checkInTime: formData.checkInTime,
          checkOutTime: formData.checkOutTime,
          checkInLocation: formData.checkInLocation,
          checkOutLocation: formData.checkOutLocation,
          attendanceStatus: formData.attendanceStatus,
          notes: formData.notes,
          source: "Manual",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Presensi berhasil diperbarui!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      console.log(e);
    }
  };

  const handleGetLocation = (type) => {
    setLoadingLocation({ ...loadingLocation, [type]: true });

    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung oleh browser Anda");
      setLoadingLocation({ ...loadingLocation, [type]: false });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locString = `${position.coords.latitude}, ${position.coords.longitude}`;
        setFormData((prev) => ({
          ...prev,
          [type === "in" ? "checkInLocation" : "checkOutLocation"]: locString,
        }));
        setLoadingLocation({ ...loadingLocation, [type]: false });
      },
      (error) => {
        alert("Gagal mengambil lokasi: " + error.message);
        setLoadingLocation({ ...loadingLocation, [type]: false });
      },
    );
  };

  const getJamKerja = () => {
    const user = formData.user;
    if (!user || Object.keys(user).length === 0) return "";

    if (user.workShift) {
      return `${user.workShift.name}: ${user.workShift.startTime} - ${user.workShift.endTime}`;
    }

    if (user.shiftAssignments && user.shiftAssignments.length > 0) {
      const attendanceDate = formData.date;
      const attendanceWorkShiftId = formData.workShiftId;
      const shiftAssign = user.shiftAssignments.find(
        (sa) =>
          sa.date === attendanceDate &&
          sa.workShiftId === attendanceWorkShiftId,
      );

      if (shiftAssign && shiftAssign.workShift) {
        const s = shiftAssign.workShift;
        return `${s.name}: ${s.startTime} - ${s.endTime}`;
      } else if (shiftAssign) {
        return `Shift ID ${shiftAssign.workShiftId} (Detail tidak ter-load)`;
      }
    }
    return "Tidak diketahui";
  };

  return (
    <div className="modal-overlay">
      {/* <div className="modal-user-card" style={{ maxWidth: "1000px" }}> */}
      <div className="modal-user-card">
        <div className="modal-header">
          <h3>Edit Presensi</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleChange}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>Nama Karyawan</label>
                  <input
                    type="text"
                    value={`${formData.user?.titlePrefix || ""} ${
                      formData.user?.fullName || ""
                    }`.trim()}
                    disabled
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label>Tanggal</label>
                  <input
                    type="text"
                    value={formatDateIndo(formData.date)}
                    disabled
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Jam Kerja <span>*</span>
                  </label>
                  <input type="text" value={getJamKerja()} disabled />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Jam Masuk <span>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={formData.checkInTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        checkInTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Jam Keluar <span>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={formData.checkOutTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        checkOutTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Status Kehadiran <span>*</span>
                  </label>
                  <select
                    className="select-input"
                    value={formData.attendanceStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attendanceStatus: e.target.value,
                      })
                    }
                  >
                    <option disabled>Pilih Status</option>
                    <option value="Hadir">Hadir</option>
                    <option value="Terlambat">Terlambat</option>
                    <option value="Dinas Luar">Dinas Luar</option>
                    <option value="Izin">Izin</option>
                    <option value="Tidak Hadir">Tidak Hadir</option>
                    <option value="Tidak Valid">Tidak Valid</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Lokasi Masuk <span>*</span>
                  </label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Koordinat lat, long"
                      value={formData.checkInLocation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          checkInLocation: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="button is-success"
                      onClick={() => handleGetLocation("in")}
                      disabled={loadingLocation.in}
                    >
                      <FaMapMarkerAlt /> {loadingLocation.in ? "..." : "Ambil"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Lokasi Keluar <span>*</span>
                  </label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Koordinat lat, long"
                      value={formData.checkOutLocation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          checkOutLocation: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="button is-warning"
                      onClick={() => handleGetLocation("out")}
                      disabled={loadingLocation.out}
                    >
                      <FaMapMarkerAlt /> {loadingLocation.out ? "..." : "Ambil"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <div className="label-form">
                  <label>
                    Keterangan <span>*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Input manual oleh admin"
                    className="input-field"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  ></textarea>
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
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAttendance;
