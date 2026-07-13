import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import axios from "axios";
import axiosInstance from "../../../api/axios";

const AddWorkShift = ({ onAdd }) => {
  const [shift, setShift] = useState({
    name: "",
    startTime: "",
    endTime: "",
    tolerance: "",
  });
  const navigate = useNavigate();
  //   const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post(
        // "http://localhost:3000/workshifts",
        "/workshifts",
        {
          name: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          tolerance: shift.tolerance || 0,
        },
        // {
        //   headers: { Authorization: `Bearer ${token}` },
        // }
      );
      console.log("Berhasil menambahkan jam kerja:", response.data);
      if (onAdd) onAdd();
      navigate("/workshifts");
      alert("Jam kerja berhasil ditambahkan!");
    } catch (err) {
      console.error("Gagal menambahkan jam kerja:", err);
    }
  };
  return (
    <div className="columns mt-5 is-centered">
      <div className="column is-half">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Nama Jam Kerja</label>
            <div className="control">
              <input
                type="text"
                placeholder="Nama Jam Kerja Baru"
                value={shift.name}
                onChange={(e) => setShift({ ...shift, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Jam Masuk</label>
            <div className="control">
              <input
                type="time"
                value={shift.startTime}
                onChange={(e) =>
                  setShift({ ...shift, startTime: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Jam Keluar</label>
            <div className="control">
              <input
                type="time"
                value={shift.endTime}
                onChange={(e) =>
                  setShift({ ...shift, endTime: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Toleransi Keterlambatan (menit)</label>
            <div className="control">
              <input
                type="number"
                placeholder="0"
                value={shift.tolerance}
                onChange={(e) =>
                  setShift({ ...shift, tolerance: e.target.value })
                }
              />
            </div>
          </div>

          <div className="field mt-3">
            <div className="control">
              <button
                type="button"
                className="button is-danger mr-2"
                onClick={() => navigate("/workshifts")}
              >
                Kembali
              </button>
              <button type="submit" className="button is-success">
                Simpan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkShift;
