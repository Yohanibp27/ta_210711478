import { useEffect, useState } from "react";
import QRCode from "qrcode";
import axiosInstance from "../../api/axios.js";

const pageStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  width: "100vw",
  background: "linear-gradient(135deg, #e9d7ff, #c5a3ff, #8b5cf6)",
  margin: 0,
  fontFamily: "Arial, sans-serif",
};

const cardStyle = {
  background: "white",
  padding: "40px",
  borderRadius: "16px",
  boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  animation: "fadeIn 0.4s ease",
};

const qrLoading = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px 0",
};

const qrSpinner = {
  width: "45px",
  height: "45px",
  border: "5px solid #f3f3f3",
  borderTop: "5px solid #3b82f6",
  borderRadius: "50%",
  animation: "spinQr 0.8s linear infinite",
  marginBottom: "12px",
};

const textStyle = {
  fontSize: "16px",
  color: "#555",
  margin: 0,
};

const FullscreenQrPage = () => {
  const token = localStorage.getItem("token");
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQr = async () => {
      setLoading(true);
      try {
        // const res = await fetch("http://192.168.100.199:3000/dynamic-qr", {
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //   },
        // });
        //   const data = await res.json();

        const res = await axiosInstance.get("/dynamic-qr");
        const data = res.data;
        const qrImage = await QRCode.toDataURL(data.token);
        setQrUrl(qrImage);
        setLoading(false);
      } catch (err) {
        console.error("Gagal mengambil QR:", err);
        setLoading(false);
      }
    };
    fetchQr();
    const interval = setInterval(fetchQr, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // TANPA SPINNER
  // return (
  //     <div style={pageStyle}>
  //       <div style={cardStyle}>
  //         <h1 style={{ color: "#2c3e50", marginBottom: "20px" }}>
  //           QR Code Presensi RSBI
  //         </h1>

  //         {qrUrl ? (
  //           <img
  //             src={qrUrl}
  //             alt="QR Code"
  //             style={{ width: "400px", height: "400px", maxWidth: "90vw" }}
  //           />
  //         ) : (
  //           <div style={qrLoading}>
  //             <div style={qrSpinner}></div>
  //             <p style={textStyle}>Memuat QR Code...</p>
  //           </div>
  //         )}

  //         <p style={{ marginTop: "20px", color: "#555", fontSize: "18px" }}>
  //           QR Code akan diperbarui secara otomatis.
  //         </p>
  //       </div>
  //     </div>

  return (
    <div style={pageStyle}>
      <style>
        {`
          @keyframes spinQr {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <div style={cardStyle}>
        <h1 style={{ color: "#2c3e50", marginBottom: "20px" }}>
          QR Code Presensi RSBI
        </h1>
        {qrUrl && !loading ? (
          <img
            src={qrUrl}
            alt="QR Code"
            style={{
              width: "400px",
              height: "400px",
              maxWidth: "90vw",
              animation: "fadeIn 0.5s ease",
            }}
          />
        ) : (
          <div style={qrLoading}>
            <div style={qrSpinner}></div>
            <p style={textStyle}>Memuat QR Code...</p>
          </div>
        )}
        <p style={{ marginTop: "20px", color: "#555", fontSize: "18px" }}>
          Silakan scan menggunakan aplikasi presensi
        </p>
      </div>
    </div>
  );
};

export default FullscreenQrPage;
