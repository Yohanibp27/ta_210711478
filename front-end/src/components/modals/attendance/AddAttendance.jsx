import axios from "axios";
import { useState } from "react";
// import '../../../style/AddAttendance.css';
import "../AddAttendance.css";

const AddAttendance = () => {
  const token = localStorage.getItem("token");
  const today = new Date().toISOString().split("T")[0];
  const [attendance, setAttendance] = useState({
    userId: null,
    date: today,
    checkInTime: new Date().toLocaleTimeString("en-GB", {
      hour12: false,
    }),
    checkOutTime: "",
    checkInLocation: "",
    checkOutLocation: "",
    attendanceStatus: "Hadir",
    notes: "",

    checkInCoords: null,
    checkOutCoords: null,
  });
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const searchUser = async (query) => {
    if (!query) return setSearchResults([]);
    try {
      const res = await axios.get(
        `http://localhost:3000/users/search?q=${query}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    }
  };

  const selectUser = (user) => {
    setAttendance((prev) => ({
      ...prev,
      userId: user.id,
    }));
    setQuery(`${user.titlePrefix ?? ""} ${user.fullName ?? ""}`.trim());
    setSearchResults([]);
  };

  const getCurrentLocation = (type) => {
    if (navigator.geolocation) {
      alert(
        "Mencari lokasi saat ini... pastikan browser mengizinkan akses lokasi",
      );

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const coordsString = `${lat}, ${lng}`;

          if (type === "IN") {
            setAttendance((prev) => ({
              ...prev,
              checkInLocation: coordsString,
              checkInCoords: coordsString,
            }));
          } else if (type === "OUT") {
            setAttendance((prev) => ({
              ...prev,
              checkOutLocation: coordsString,
              checkOutCoords: coordsString,
            }));
          }
        },

        (error) => {
          console.error("Gagal mendapatkan lokasi:", error);
          alert("Gagal mendapatkan lokasi. Pastikan GPS/izin lokasi diizinkan");
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    } else {
      alert("Browser tidak mendukung Geolocation");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const now = new Date();
    const currentTime = now.toLocaleTimeString("en-GB", { hour12: false });

    console.log("Data yang dikirim:", {
      userId: attendance.userId,
      date: attendance.date || today,
      checkInTime: attendance.checkInTime || currentTime,
      checkOutTime: attendance.checkOutTime || null,
      checkInLocation: attendance.checkInLocation,
      checkOutLocation: attendance.checkOutLocation,
      attendanceStatus: attendance.attendanceStatus,
      notes: attendance.notes || "",
    });
    if (!attendance.userId) {
      alert("Pilih karyawan terlebih dahulu!");
      return;
    }

    try {
      await axios.post(
        "http://localhost:3000/attendances",
        {
          userId: attendance.userId,
          date: attendance.date || today,
          checkInTime: attendance.checkInTime || currentTime,
          checkOutTime: attendance.checkOutTime || null,
          checkInLocation: attendance.checkInLocation,
          checkOutLocation: attendance.checkOutLocation,
          attendanceStatus: attendance.attendanceStatus,
          notes: attendance.notes || "",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log("Data yang dikirim ke backend:", attendance);
      alert("Presensi berhasil disimpan");
    } catch (e) {
      console.error("Error submit:", e.response ? e.response.data : e);
    }
  };

  return (
    <form className="add-attendance-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Tambah Presensi Manual</h2>
      <div className="form-group">
        <label className="form-label">Pilih Karyawan</label>
        <div className="search-wrapper">
          <input
            type="text"
            className="form-input"
            placeholder="Cari nama atau NIP karyawan..."
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              searchUser(value);
            }}
          />
          {searchResults.length > 0 && (
            <ul className="search-dropdown">
              {searchResults.map((user) => (
                <li
                  key={user.id}
                  className="search-item"
                  onClick={() => selectUser(user)}
                >
                  <span className="search-name">
                    {`${user.titlePrefix ?? ""} ${user.fullName ?? ""}`.trim()}
                  </span>
                  <span className="search-nip">NIP: {user.nip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="time-grid">
        <div className="time-input">
          <label className="form-label">Jam Masuk</label>
          <input
            type="time"
            className="form-input"
            value={attendance.checkInTime || ""}
            onChange={(e) =>
              setAttendance({ ...attendance, checkInTime: e.target.value })
            }
          />
        </div>
        <div className="time-input">
          <label className="form-label">Jam Keluar</label>
          <input
            type="time"
            className="form-input"
            value={attendance.checkOutTime || ""}
            onChange={(e) =>
              setAttendance({ ...attendance, checkOutTime: e.target.value })
            }
          />
        </div>
      </div>

      <div className=" time-grid">
        <div className="location-input">
          <label className="form-label">Lokasi Masuk (GPS)</label>
          <input
            type="text"
            className="form-input"
            readOnly
            value={attendance.checkInLocation || "-"}
            disabled
          />
          <button
            type="button"
            className="btn-gps btn-gps-in"
            onClick={() => getCurrentLocation("IN")}
          >
            Ambil Lokasi
          </button>
        </div>
        <div className="location-input">
          <label className="form-label">Lokasi Keluar (GPS)</label>
          <input
            type="text"
            className="form-input"
            readOnly
            value={attendance.checkOutLocation || "-"}
            disabled
          />
          <button
            type="button"
            className="btn-gps btn-gps-out"
            onClick={() => getCurrentLocation("OUT")}
          >
            Ambil Lokasi
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Status Kehadiran</label>
        <select
          className="form-input"
          value={attendance.attendanceStatus}
          onChange={(e) =>
            setAttendance({
              ...attendance,
              attendanceStatus: e.target.value,
            })
          }
        >
          <option value="Hadir">Hadir</option>
          <option value="Terlambat">Terlambat</option>
          <option value="Cuti">Cuti</option>
          <option value="Izin">Izin</option>
          <option value="Dinas Luar">Dinas Luar</option>
          <option value="Tidak Hadir">Tidak Hadir</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Catatan (Opsional)</label>
        <textarea
          className="form-textarea"
          rows="3"
          placeholder="Tambahkan catatan jika diperlukan..."
          maxLength={200}
          value={attendance.notes || ""}
          onChange={(e) =>
            setAttendance({ ...attendance, notes: e.target.value })
          }
        />
        {/* <p>{attendance.notes.length}/200 karakter</p> */}
        <p className="char-count">
          {(attendance.notes ?? "").length}/200 karakter
        </p>
      </div>
      <div className="form-group">
        <button type="submit" className="btn-submit">
          Simpan Perubahan
        </button>
      </div>
    </form>
    // </div>
  );
};

export default AddAttendance;

// import axios from "axios";
// import { useState } from "react";
// import "../../style/AddAttendance.css";

// const AddAttendance = () => {
//   const token = localStorage.getItem("token");
//   const today = new Date().toISOString().split("T")[0];
//   const [attendance, setAttendance] = useState({
//     userId: null,
//     date: today,
//     checkIn: new Date().toLocaleTimeString("en-GB", { hour12: false }),
//     checkOut: "",
//     checkInLocation: "",
//     checkOutLocation: "",
//     attendanceStatus: "Hadir",
//     notes: "",
//     checkInCoords: null,
//     checkOutCoords: null,
//   });

//   const [query, setQuery] = useState("");
//   const [searchResults, setSearchResults] = useState([]);

//   const searchUser = async (query) => {
//     if (!query) return setSearchResults([]);
//     try {
//       const res = await axios.get(
//         `http://localhost:3000/users/search?q=${query}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setSearchResults(res.data);
//     } catch (err) {
//       console.error(err);
//       setSearchResults([]);
//     }
//   };

//   const selectUser = (user) => {
//     setAttendance((prev) => ({
//       ...prev,
//       userId: user.id,
//     }));
//     setQuery(`${user.firstName ?? ""} ${user.middleName ?? ""}`.trim());
//     setSearchResults([]);
//   };

//   const getCurrentLocation = (type) => {
//     if (navigator.geolocation) {
//       alert(
//         "Mencari lokasi saat ini... pastikan browser mengizinkan akses lokasi"
//       );

//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const lat = position.coords.latitude;
//           const lng = position.coords.longitude;
//           const coordsString = `${lat}, ${lng}`;

//           if (type === "IN") {
//             setAttendance((prev) => ({
//               ...prev,
//               checkInLocation: coordsString,
//               checkInCoords: coordsString,
//             }));
//           } else if (type === "OUT") {
//             setAttendance((prev) => ({
//               ...prev,
//               checkOutLocation: coordsString,
//               checkOutCoords: coordsString,
//             }));
//           }
//         },
//         (error) => {
//           console.error("Gagal mendapatkan lokasi:", error);
//           alert("Gagal mendapatkan lokasi. Pastikan GPS/izin lokasi diizinkan");
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 5000,
//           maximumAge: 0,
//         }
//       );
//     } else {
//       alert("Browser tidak mendukung Geolocation");
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const now = new Date();
//     const currentTime = now.toLocaleTimeString("en-GB", { hour12: false });

//     console.log("Data yang dikirim:", {
//       userId: attendance.userId,
//       date: attendance.date || today,
//       checkIn: attendance.checkIn || currentTime,
//       checkOut: attendance.checkOut || null,
//       checkInLocation: attendance.checkInLocation,
//       checkOutLocation: attendance.checkOutLocation,
//       attendanceStatus: attendance.attendanceStatus,
//       notes: attendance.notes || "",
//     });
//     if (!attendance.userId) {
//       alert("Pilih karyawan terlebih dahulu!");
//       return;
//     }

//     try {
//       await axios.post(
//         "http://localhost:3000/attendances",
//         {
//           userId: attendance.userId,
//           date: attendance.date || today,
//           checkIn: attendance.checkIn || currentTime,
//           checkOut: attendance.checkOut || null,
//           checkInLocation: attendance.checkInLocation,
//           checkOutLocation: attendance.checkOutLocation,
//           attendanceStatus: attendance.attendanceStatus,
//           notes: attendance.notes || "",
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       console.log("Data yang dikirim ke backend:", attendance);
//       alert("Presensi berhasil disimpan");
//     } catch (e) {
//       console.error("Error submit:", e.response ? e.response.data : e);
//     }
//   };

//   return (
//     <form className="add-attendance-form" onSubmit={handleSubmit}>
//       <h2 className="form-title">Tambah Presensi Manual</h2>

//       <div className="form-group">
//         <label className="form-label">Pilih Karyawan</label>
//         <div className="search-wrapper">
//           <input
//             type="text"
//             className="form-input"
//             placeholder="Cari nama atau NIP karyawan..."
//             value={query}
//             onChange={(e) => {
//               const value = e.target.value;
//               setQuery(value);
//               searchUser(value);
//             }}
//           />
//           {searchResults.length > 0 && (
//             <ul className="search-dropdown">
//               {searchResults.map((user) => (
//                 <li
//                   key={user.id}
//                   className="search-item"
//                   onClick={() => selectUser(user)}
//                 >
//                   <span className="search-name">
//                     {`${user.firstName ?? ""} ${user.middleName ?? ""}`.trim()}
//                   </span>
//                   <span className="search-nip">NIP: {user.nip}</span>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       </div>

//       <div className="form-group time-grid">
//         <div className="time-input">
//           <label className="form-label">Jam Masuk</label>
//           <input
//             type="time"
//             className="form-input"
//             value={attendance.checkIn || ""}
//             onChange={(e) =>
//               setAttendance({ ...attendance, checkIn: e.target.value })
//             }
//           />
//         </div>
//         <div className="time-input">
//           <label className="form-label">Jam Keluar</label>
//           <input
//             type="time"
//             className="form-input"
//             value={attendance.checkOut || ""}
//             onChange={(e) =>
//               setAttendance({ ...attendance, checkOut: e.target.value })
//             }
//           />
//         </div>
//       </div>

//       <div className="form-group location-grid">
//         <div className="location-input">
//           <label className="form-label">Lokasi Masuk (GPS)</label>
//           <input
//             type="text"
//             className="form-input"
//             readOnly
//             value={attendance.checkInLocation || "-"}
//             disabled
//           />
//           <button
//             type="button"
//             className="btn-gps btn-gps-in"
//             onClick={() => getCurrentLocation("IN")}
//           >
//             Ambil Lokasi Masuk (GPS)
//           </button>
//         </div>
//         <div className="location-input">
//           <label className="form-label">Lokasi Keluar (GPS)</label>
//           <input
//             type="text"
//             className="form-input"
//             readOnly
//             value={attendance.checkOutLocation || "-"}
//             disabled
//           />
//           <button
//             type="button"
//             className="btn-gps btn-gps-out"
//             onClick={() => getCurrentLocation("OUT")}
//           >
//             Ambil Lokasi Keluar (GPS)
//           </button>
//         </div>
//       </div>

//       <div className="form-group">
//         <label className="form-label">Status Kehadiran</label>
//         <select
//           className="form-input"
//           value={attendance.attendanceStatus}
//           onChange={(e) =>
//             setAttendance({
//               ...attendance,
//               attendanceStatus: e.target.value,
//             })
//           }
//         >
//           <option value="Hadir">Hadir</option>
//           <option value="Terlambat">Terlambat</option>
//           <option value="Cuti">Cuti</option>
//           <option value="Izin">Izin</option>
//           <option value="Dinas Luar">Dinas Luar</option>
//           <option value="Tidak Hadir">Tidak Hadir</option>
//         </select>
//       </div>

//       <div className="form-group">
//         <label className="form-label">Catatan (Opsional)</label>
//         <textarea
//           className="form-textarea"
//           rows="3"
//           placeholder="Tambahkan catatan jika diperlukan..."
//           maxLength={200}
//           value={attendance.notes || ""}
//           onChange={(e) =>
//             setAttendance({ ...attendance, notes: e.target.value })
//           }
//         />
//         <p className="char-count">
//           {(attendance.notes ?? "").length}/200 karakter
//         </p>
//       </div>

//       <div className="form-group">
//         <button type="submit" className="btn-submit">
//           Simpan Perubahan
//         </button>
//       </div>
//     </form>
//   );
// };

// export default AddAttendance;

// {
//   /* <div className="search-wrapper">
//           <input
//             type="text"
//             className="input"
//             placeholder="Cari nama atau NIP karyawan..."
//             value={query}
//             onChange={(e) => {
//               const value = e.target.value;
//               setQuery(value);
//               searchUser(value);
//             }}
//           />
//           {searchResults.length > 0 && (
//             <ul
//               className="search-results"
//               style={{ border: "1px solid #ccc", padding: "5px" }}
//             >
//               {searchResults.map((user) => (
//                 <li
//                   key={user.id || user.nip || Math.random()}
//                   onClick={() => selectUser(user)}
//                   style={{ cursor: "pointer", padding: "4px" }}
//                 >
//                   {`${user.firstName ?? ""} ${user.middleName ?? ""}`.trim()}{" "}
//                   (NIP: {user.nip})
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div> */
// }
