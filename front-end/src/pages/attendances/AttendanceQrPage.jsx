import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../../api/axios.js";

const AttendanceQrPage = ({ fullScreen = false }) => {
  const token = localStorage.getItem("token");
  const [qrUrl, setQrUrl] = useState("");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrToken, setQrToken] = useState("");
  const [expiresIn, setExpiresIn] = useState(30);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);

        setUserId(decoded.id || decoded.userId);
      } catch (err) {
        console.error("Token tidak valid:", err);
      }
    }
  }, []);

  useEffect(() => {
    let interval;
    const fetchQr = async () => {
      setLoading(true);
      try {
        // ip address laptop:localhost/route
        // const res = await fetch("http://192.168.100.199:3000/dynamic-qr", {
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //   },
        // });
        //  const data = await res.json();

        const res = await axiosInstance.get("/dynamic-qr");
        const data = res.data;
        // backend cuma kirim token + expiresIn
        setQrToken(data.token);
        setExpiresIn(data.expiresIn);

        const qrImage = await QRCode.toDataURL(data.token);
        setQrUrl(qrImage);
        setLoading(false);
      } catch (err) {
        console.error("Gagal mengambil QR:", err);
        setLoading(false);
      }
    };
    fetchQr();

    // refresh otomatis sesuai expiresIn
    interval = setInterval(fetchQr, 30000);

    return () => clearInterval(interval);
  }, [token]);

  // statis new tab kosong
  //   const handleWindowOpen = () => {
  //     if (!qrUrl) return;
  //     const newWindow = window.open("", "_blank");
  //     if (newWindow) {
  //       newWindow.document.write(`
  //     <html>
  //       <head>
  //         <title>QR Code Kehadiran RSBI</title>
  //         <style>
  //           body {
  //             display: flex;
  //             justify-content: center;
  //             align-items: center;
  //             height: 100vh;
  //             //   background: linear-gradient(135deg, #e3f2fd, #f8f9fa);
  //             background: linear-gradient(135deg, #e9d7ff, #c5a3ff, #8b5cf6);
  //             margin: 0;
  //             font-family: Arial, sans-serif;
  //           }
  //           .card {
  //             background: white;
  //             padding: 30px;
  //             border-radius: 16px;
  //             box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  //             display: flex;
  //             flex-direction: column;
  //             align-items: center;
  //             animation: fadeIn 0.4s ease;
  //           }
  //           .title {
  //             font-size: 22px;
  //             font-weight: 600;
  //             margin-bottom: 18px;
  //             color: #2c3e50;
  //           }
  //           img {
  //             width: 400px;
  //             height: 400px;
  //           //   width: auto;
  //           //   height: auto;
  //             max-width: 100vw;
  //             max-height: 100vh;
  //             margin-bottom: 20px;
  //           }
  //           p {
  //             font-size: 16px;
  //             color: #555;
  //             margin: 0;
  //           }
  //           @keyframes fadeIn {
  //             from { opacity: 0; transform: translateY(10px); }
  //             to { opacity: 1; transform: translateY(0); }
  //           }
  //         </style>
  //       </head>
  //       <body>
  //         <div class="card">
  //           <div class="title">QR Code Presensi RSBI</div>
  //           <img src="${qrUrl}" alt="QR Code" />
  //           <p>Silakan scan menggunakan aplikasi presensi</p>
  //         </div>
  //       </body>
  //     </html>
  //   `);
  //       newWindow.document.close();
  //     }
  //   };

  const handleOpenNewTab = () => {
    window.open("/qr-fullscreen", "_blank");
  };
  if (fullScreen) {
    return (
      <div className="qr-full-screen">
        <div className="qr-display-card">
          <h1>QR Code Presensi RSBI</h1>
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="qr-large" />
          ) : (
            <div className="qr-loading-box">
              <div className="qr-spinner"></div>
              <p className="qr-loading">Memuat QR Code...</p>
            </div>
          )}
          <p>Silakan scan menggunakan aplikasi presensi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-page">
      <div className="qr-container">
        <div className="qr-card">
          <h2 className="qr-title">QR Code Kehadiran</h2>
          {qrUrl ? (
            <>
              <img src={qrUrl} alt="QR Attendance" className="qr-image" />
              <p className="qr-desc">
                Scan QR ini untuk mencatat kehadiran otomatis
              </p>
              <button className="qr-newtab-btn" onClick={handleOpenNewTab}>
                Buka di Tab Baru
              </button>
            </>
          ) : (
            <div className="qr-loading-box">
              <div className="qr-spinner"></div>
              <p className="qr-loading">Memuat QR Code...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceQrPage;

// yang lama JANGAN DIHAPUS!!!
//   useEffect(() => {
//     const generateQr = async () => {
//       if (!userId) return;

//       setLoading(true);
//       try {
//         // const qrData = `http://localhost:3000/attendance/scan?userId=${userId}`;
//         const qrData = `http://192.168.1.7:3000/attendance/scan?userId=${userId}`;
//         const qrImage = await QRCode.toDataURL(qrData);
//         // setQrUrl(qrImage);
//         setTimeout(() => {
//           setQrUrl(qrImage);
//           setLoading(false);
//         }, 600);
//       } catch (err) {
//         console.error("Error generating QR:", err);
//         setLoading(false);
//       }
//     };
//     generateQr();
//   }, [userId]);
