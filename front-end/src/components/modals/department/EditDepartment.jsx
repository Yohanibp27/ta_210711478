import { useState, useEffect } from "react";
import axios from "axios";

const EditDepartment = ({ id, onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [department, setDepartment] = useState({
    name: "",
    // headOfDepartment: "",
  });

  useEffect(() => {
    getDepartmentById();
  }, []);

  const getDepartmentById = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/departments/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setDepartment(response.data.data);
    } catch (e) {
      console.error("Gagal mengambil data departemen:", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:3000/departments/${id}`,
        {
          name: department.name,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log("Berhasil mengupdate departemen:", response.data);
      onSuccess();
      alert("Departemen berhasil diperbarui!");
    } catch (e) {
      console.error("Gagal mengupdate departemen:", e);
    }
  };

  return (
    <div className="add-department-container">
      <button className="modal-close" onClick={onClose}>
        ✖
      </button>
      <h2 className="add-department-header">Edit Departemen</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nama Departemen</label>
          <input
            className="input-field"
            type="text"
            placeholder="Masukkan nama departemen"
            value={department.name}
            onChange={(e) =>
              setDepartment({ ...department, name: e.target.value })
            }
            required
          />
        </div>
        <div className="button-group">
          <button type="button" className="button is-danger" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="button is-success">
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDepartment;

// <div className="columns is-centered mt-6">
//   <div className="column is-half">
//     <div className="box">
//       <h3 className="title is-4 has-text-centered mb-4">
//         Form Edit Departemen
//       </h3>
//       <form onSubmit={handleSubmit}>
//         <div className="field">
//           <label className="label">Nama Departemen</label>
//           <div className="control">
//             <input
//               className="input"
//               type="text"
//               placeholder="Masukkan Nama Departemen"
//               value={department.name}
//               onChange={(e) =>
//                 setDepartment({ ...department, name: e.target.value })
//               }
//               required
//             />
//           </div>
//         </div>
//         <div className="field">
//           <label className="label">Nama Kepala Departemen</label>
//           <div className="control">
//             <input
//               className="input"
//               type="text"
//               placeholder="Masukkan Nama Kepala Departemen"
//               //   value={department.headOfDepartment}
//               //   onChange={(e) =>
//               //     setDepartment({
//               //       ...department,
//               //       headOfDepartment: e.target.value,
//               //     })
//               //   }
//             />
//           </div>
//         </div>
//         <div className="field is-grouped is-grouped-right mt-5">
//           <p className="control">
//             <button
//               type="button"
//               className="button is-danger"
//               onClick={onClose}
//             >
//               Batal
//             </button>
//           </p>
//           <p className="control">
//             <button type="submit" className="button is-success">
//               Simpan
//             </button>
//           </p>
//         </div>
//       </form>
//     </div>
//   </div>
// </div>
