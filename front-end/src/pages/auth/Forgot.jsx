import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Logo from "../../assets/images/bhayangkara.png";

function ForgotPass() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:3000/forgot-password",
        {
          email,
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      );
      alert("Link reset password sudah dikirim ke email Anda!");
      setMessage(res.data.message);
    } catch (e) {
      console.error(e);
      setError(
        e.response?.data?.message || "Terjadi kesalahan saat mengirim email.",
      );
    } finally {
      setLoading(false);
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
          <h1 className="login-title">Lupa Password?</h1>
          <p className="login-subtitle">
            Kami akan mengirim link reset password ke email Anda
          </p>
        </div>

        <div className="forgot-info">
          <strong>Reset Password</strong>
          <p>
            Masukkan email yang terdaftar dalam sistem untuk menerima link reset
            password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <p style={{ color: "red" }}>{error}</p>}
          {message && <p style={{ color: "green" }}>{message}</p>}
          <div className="label-form">
            <label>Email Terdaftar</label>
            <input
              type="email"
              className="input-field"
              placeholder="Masukkan email Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <small className="forgot-text">
            Contoh: admin@gmail.com
          </small>
          <button type="submit" className="button-login">
            {loading ? "Mengirim..." : "Kirim Link"}
          </button>
          <button
            type="button"
            className="button-back"
            onClick={() => navigate("/")}
          >
            Kembali ke Login
          </button>
        </form>

        {/* <div className="login-demo">
          <p>Kredensial Demo:</p>
          <p>
            <strong>Admin: </strong>
            admin@gmail.com
          </p>
          <p>
            <strong>Karyawan: </strong>Email sesuai data karyawan
          </p>
        </div> */}
      </div>
      {/* <footer className="login-footer">
        © 2025 Rumah Sakit Bhayangkara TK III Indramayu
      </footer> */}
    </div>
  );
}
export default ForgotPass;
