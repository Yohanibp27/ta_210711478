import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import axios from "axios";
import { useSelector } from "react-redux";

const ScannerPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleScan = async (data) => {
    if (!data) return;
    setLoading(true);
    try {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      const location = `${position.coords.latitude},${position.coords.longitude}`;

      const res = await axios.post(
        "http://localhost:3000/attendance/scan",
        {
          userId: user?.id,
          location,
          qrToken: data,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage(res.data.msg || "Presensi berhasil!");
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.msg || "Gagal melakukan presensi");
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err) => {
    console.error(err);
    setMessage("Gagal mengakses kamera");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h1 className="text-2xl font-semibold">Scan QR Presensi</h1>

      <div className="w-72 h-72 border-2 border-gray-300 rounded-lg overflow-hidden">
        <Scanner
          onDecode={(result) => handleScan(result)}
          onError={handleError}
        />
      </div>

      {loading && <p>Memproses presensi...</p>}
      {message && (
        <p
          className={`p-2 rounded ${
            message.includes("berhasil")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default ScannerPage;
