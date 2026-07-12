import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../assets/images/bhayangkara.png";

function Login() {
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nip, password }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Login gagal!");
        return;
      }

      localStorage.setItem("token", data.accessToken);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      localStorage.setItem("limited", data.limited ? "true" : "false");
      localStorage.setItem("status", data.user.status);

      console.log("Data user (login frontend):", data);
      console.log("Token disimpan (login frontend):", data.accessToken);

      if (data.user.status === "Cuti") {
        alert("Anda sedang cuti. Beberapa fitur tidak dapat digunakan.");
      } else if (data.user.status === "Nonaktif") {
        alert(
          "Akun Anda tidak aktif. Hubungi admin untuk mengaktifkan kembali.",
        );
        setLoading(false);
        return;
      }
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (e) {
      console.error(e);
      console.log("response data:", e);
      alert("Terjadi kesalahan server");
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <span role="img" aria-label="rsbi">
              <img src={Logo} alt="Logo" className="icon-logo" />
            </span>
          </div>
          <h1 className="login-title">RSBI</h1>
          <p className="login-subtitle">Masuk ke Sistem Presensi Rumah Sakit</p>
        </div>

        <div className="login-info">
          <strong>Akses Administrator</strong>
          <p>Hanya admin yang dapat mengakses sistem presensi</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="label-form">
            <label>NIP</label>
            <input
              type="text"
              className="input-field"
              placeholder="Masukkan NIP"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              required
            />
          </div>
          <div className="label-form">
            <label>Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="forgot-password">
            <a href="/forgot-password">Lupa Password?</a>
          </div>

          <button type="submit" className="button-login" disabled={loading}>
            {loading ? "Loading..." : "Login"}
          </button>
        </form>
        {/* <div className="login-demo">
          <p>Kredensial Demo:</p>
          <p>
            <strong>Email:</strong> yohaniseprini@gmail.com
          </p>
          <p>
            <strong>NIP:</strong> 1234567890
          </p>
          <p>
            <strong>Password:</strong> yohani123
          </p>
        </div> */}
      </div>
      {/* <footer className="login-footer">
        © 2025 Rumah Sakit Bhayangkara Tk III Indramayu
      </footer> */}
    </div>
  );
}

export default Login;

// pake session express (credentials: 'include')
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { setUser } from "../features/authSlice.js";

// // css
// import Logo from "../assets/images/bhayangkara.png";
// import "../style/Login.css";

// function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await fetch("http://localhost:3000/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include", // session cookie tersimpan
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await res.json();
//       console.log("Login Response:", data);

//       if (!res.ok) {
//         alert(data.message || "Login gagal!");
//         return;
//       }
//       alert("Login berhasil!");
//       dispatch(setUser(data.data));
//       // simpan user ke localStorage biar bisa dipakai di halaman lain
//       localStorage.setItem("user", JSON.stringify(data.data));
//       navigate("/dashboard");
//     } catch (e) {
//       console.error(e);
//       console.log("response data:", e);
//       alert("Terjadi kesalahan server");
//     }
//   };
//   return (
//     <div className="login-container">
//       <div className="login-card">
//         <div className="login-header">
//           <div className="login-icon">
//             <span role="img" aria-label="hospital">
//               <img src={Logo} alt="Logo" className="logo-img" />
//             </span>
//           </div>
//           <h1 className="login-title">RSBI</h1>
//           <p className="login-subtitle">Masuk ke Sistem Presensi</p>
//         </div>

//         <div className="login-info">
//           <strong>Akses Administrator</strong>
//           <p>Hanya admin yang dapat mengakses sistem presensi</p>
//         </div>

//         <form onSubmit={handleSubmit} className="login-form">
//           <label>Email</label>
//           <div className="input-group">
//             <input
//               type="email"
//               placeholder="Masukkan email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />
//           </div>

//           <label>Password</label>
//           <div className="input-group">
//             <input
//               type="password"
//               placeholder="Masukkan password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//           </div>

//           <div className="forgot-password">
//             <a href="/reset-pass">Lupa Password?</a>
//           </div>

//           <button type="submit" className="btn-login">
//             Login
//           </button>
//         </form>

//         <div className="login-demo">
//           <p>Kredensial Demo:</p>
//           <p>
//             <strong>Email:</strong> yohaniseprini@gmail.com
//           </p>
//           <p>
//             <strong>Password:</strong> yohani123
//           </p>
//         </div>
//       </div>
//       <footer className="login-footer">
//         © 2025 Rumah Sakit Bhayangkara Tk III Indramayu
//       </footer>
//     </div>
//   );
// }

// export default Login;
