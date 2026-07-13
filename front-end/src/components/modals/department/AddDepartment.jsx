import { useState } from "react";
// import axios from "axios";
import { FaTimes } from "react-icons/fa";
import axiosInstance from "../../../api/axios";

const AddDepartment = ({ isOpen, onClose, onSuccess }) => {
  //   const token = localStorage.getItem("token");
  const [department, setDepartment] = useState({
    name: "",
    // headOfDepartment: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(
        "/departments",
        { name: department.name },
        // {
        //   headers: { Authorization: `Bearer ${token}` },
        // },
      );
      alert("Departemen berhasil ditambahkan!");
      onSuccess();
    } catch (e) {
      console.error(e);
      alert("Gagal membuat departemen");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="add-department-container">
      <button className="modal-close" onClick={onClose}>
        <FaTimes />
      </button>
      <h2 className="add-department-header">Tambah Departemen</h2>
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

export default AddDepartment;

// <div className="columns is-centered mt-6">
//   <div className="column is-half">
//     <div className="box">
//       <h3 className="title is-4 has-text-centered mb-4">
//         Tambah Departemen
//       </h3>
//       <form onSubmit={handleSubmit}>
//         <div className="field">
//           <label className="label">Nama Departemen</label>
//           <div className="control">
//             <input
//               className="input"
//               type="text"
//               placeholder="Masukkan Nama Departemen Baru"
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
//               placeholder="Masukkan Nama Kepala Departemen Baru"
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
//             <button type="submit" className="button is-success">
//               Simpan
//             </button>
//           </p>
//         </div>
//       </form>
//     </div>
//   </div>
// </div>;

// JALAN;
// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";

// const AddDepartment = () => {
//   const [department, setDepartment] = useState({
//     name: "",
//     headOfDepartment: "",
//   });

//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await axios.post("http://localhost:3000/departments", {
//         name: department.name,
//         headOfDepartment: department.headOfDepartment,
//       });
//       navigate("/departments");
//     } catch (e) {
//       console.error("Gagal menambahkan departemen:", e);
//     }
//   };

//   return (
//     <div className="columns is-centered mt-6">
//       <div className="column is-half">
//         <div className="box">
//           <h3 className="title is-4 has-text-centered mb-4">
//             Form Tambah Departemen
//           </h3>

//           <form onSubmit={handleSubmit}>
//             {/* Nama Departemen */}
//             <div className="field">
//               <label className="label">Nama Departemen</label>
//               <div className="control">
//                 <input
//                   className="input"
//                   type="text"
//                   placeholder="Masukkan Nama Departemen Baru"
//                   value={department.name}
//                   onChange={(e) =>
//                     setDepartment({ ...department, name: e.target.value })
//                   }
//                   required
//                 />
//               </div>
//             </div>

//             {/* Kepala Departemen */}
//             <div className="field">
//               <label className="label">Nama Kepala Departemen</label>
//               <div className="control">
//                 <input
//                   className="input"
//                   type="text"
//                   placeholder="Masukkan Nama Kepala Departemen Baru"
//                   value={department.headOfDepartment}
//                   onChange={(e) =>
//                     setDepartment({
//                       ...department,
//                       headOfDepartment: e.target.value,
//                     })
//                   }
//                 />
//               </div>
//             </div>

//             {/* Tombol Aksi */}
//             <div className="field is-grouped is-grouped-right mt-5">
//               <p className="control">
//                 <Link to="/departments" className="button is-light">
//                   Kembali
//                 </Link>
//               </p>
//               <p className="control">
//                 <button type="submit" className="button is-success">
//                   Simpan
//                 </button>
//               </p>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddDepartment;
