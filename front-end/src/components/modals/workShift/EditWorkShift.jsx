import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
// import axios from "axios";
import axiosIntance from "../../../api/axios.js";

const EditWorkShift = () => {
  const [position, setPosition] = useState({
    name: "",
    // headOfPosition: "",
  });
  const { id } = useParams();

  useEffect(() => {
    getPositionById();
  }, []);

  const handleChange = async (e) => {
    e.preventDefault();
    try {
      //   await axios.put(`http://localhost:3000/workshifts/${id}`, {
      await axiosIntance.put(`/workshifts/${id}`, {
        name: position.name,
        // headOfPosition: position.headOfPosition,
      });
      alert("Posisi berhasil diperbarui!");
    } catch (e) {
      console.log(e);
    }
  };

  const getPositionById = async () => {
    // const response = await axios.get(`http://localhost:3000/workshifts/${id}`);
    const response = await axiosIntance.get(`/workshifts/${id}`);
    setPosition(response.data.data);
  };
  return (
    <div className="columns mt-5 is-centered">
      <div className="column is-half">
        <h3>Form Edit Posisi</h3>
      </div>
      <form onSubmit={handleChange}>
        <div className="field">
          <label htmlFor="" className="label">
            Nama Posisi
          </label>
          <div className="control">
            <input
              type="text"
              name=""
              id=""
              placeholder="Masukkan nama posisi"
              value={position.name}
              onChange={(e) =>
                setPosition({ ...position, name: e.target.value })
              }
            />
          </div>
        </div>
        <div className="field">
          <div className="control">
            <button type="button" className="button is-danger">
              <Link to={"/positions"}>Kembali</Link>
            </button>
            <button type="submit" className="button is-success">
              Simpan
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditWorkShift;
