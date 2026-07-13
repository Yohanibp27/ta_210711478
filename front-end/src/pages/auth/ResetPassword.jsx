import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";
import axiosInstance from "../../api/axios";
import Logo from "../../assets/images/bhayangkara.png";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sesuai dengan password baru!");
      return;
    }

    setLoading(true);

    try {
      const res = await axiosInstance.post(
        // `http://localhost:3000/reset-password/${token}`,
        `/reset-password/${token}`,
        { password },
        // { headers: { "Content-Type": "application/json" } },
      );
      console.log("Token:", token);
      setSuccess(res.data.message);
      setTimeout(() => {
        navigate("/");
      }, 2000);
      // setTimeout(()=>{}, 2000); // atau tanpa kembali ke login supaya ga banyak tab
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Terjadi kesalahan saat reset password.",
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
          <h2 className="login-title">Reset Password</h2>
          <p className="login-subtitle">Masukkan password baru Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
          <div style={{ marginBottom: "10px" }}>
            <div className="label-form">
              <label>Password Baru</label>
              <input
                type="password"
                className="input-field"
                placeholder="Masukkan password baru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="label-form">
              <label>Konfirmasi Password Baru</label>
              <input
                type="password"
                className="input-field"
                placeholder="Konfirmasi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="button-login" disabled={loading}>
            {loading ? "Memproses..." : "Reset Password"}
          </button>

          <button
            type="button"
            className="button-back"
            onClick={() => navigate("/")}
          >
            Kembali ke Login
          </button>
        </form>
      </div>
      {/* <footer className="forgot-footer">
        © 2025 Rumah Sakit Bhayangkara TK III Indramayu
      </footer> */}
    </div>
  );
}

export default ResetPassword;
