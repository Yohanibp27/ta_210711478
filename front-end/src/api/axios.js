// 22 mei 2026
// access token yang dihasilkan ketika login hanya berlaku 15 menit, ketika login / aktivitas sudah melebihi 15 menit access token expired, pada backend menolak request data karna access token expired dengan mengembalikan status 401 dan di waktu bersamaan pada frontend, interceptor menerima response dari backend bahwa access token expired dan menyimpan request lama (orginal request) untuk menembak route '/token' dari fungsi refreshToken yang expired 7 hari untuk membantu menghasilkan access token baru dengan melihat waktu expired refresh token sendiri untuk menghasilkan access token baru, kemudian interceptor mengulang request lama
// alurnya : Request → 401 → interceptor → refresh → retry request

// versi gpt: Access token memiliki masa berlaku pendek (15 menit). Ketika expired, backend akan mengembalikan status 401. Interceptor di frontend akan menangkap response tersebut, lalu melakukan request ke endpoint refresh token menggunakan refresh token yang disimpan di HTTP-only cookie. Jika refresh token masih valid, backend akan mengirimkan access token baru, dan request sebelumnya akan diulang menggunakan token baru. Jika refresh token juga expired, maka user akan dipaksa login kembali

// versi gemini: Access token yang dihasilkan ketika login hanya berlaku 15 menit, ketika aktivitas sudah melebihi 15 menit access token expired, backend menolak request data interceptor menerima response bahwa access token expired dan menahan request menembak route /token dari fungsi refreshToken (expired 7 hari) untuk membantu menghasilkan access token baru dengan melihat waktu expired refresh token sendiri untuk menghasilkan access token baru. Setelah access token baru berhasil dicetak, Interceptor akan mengirim ulang request yang sempat ditahan tadi ke backend, sehingga data yang diminta user (seperti data presensi atau shift) tetap berhasil tampil di layar tanpa harus login ulang

// alur yang terjadi di kodemu saat refresh token sudah expired:
// 1. Akses Ditolak (Baris 19-20): Saat access token habis, request pertamamu ke backend akan gagal dan mengembalikan status 401. Karena ini kegagalan pertama (!originalRequest._retry), kodemu masuk ke dalam blok if.
// 2. Mencoba Refresh Token (Baris 24): Sistemmu mencoba memanggil endpoint /token untuk meminta access token baru.
// 3. Refresh Token Ditolak: Nah, karena refresh token-mu juga sudah expired, backend akan menolak request /token ini (biasanya dengan status 401 atau 403 juga).
// 4. Eksekusi Blok Catch (Baris 34-39): Karena pemanggilan /token gagal, eksekusi kode akan langsung melompat ke blok catch (refreshError). Di sinilah letak "sabuk pengaman" aplikasimu:
// - localStorage.clear(); -> Sistem menghapus sisa token atau data user yang mungkin masih menempel di memori peramban.
// - window.location.href = "/login"; -> Ini adalah baris yang menjawab pertanyaanmu. Perintah ini secara paksa akan me-refresh dan memindahkan peramban user kembali ke rute /login.

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  //   baseURL: "http://localhost:3000",
  baseURL: API_URL,
  withCredentials: true, // PENTING: agar cookie refreshToken terkirim
});

// Interceptor untuk menyisipkan token ke setiap request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor untuk menangani Token Expired otomatis
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jika error 401 dan belum pernah dicoba refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Panggil endpoint refresh token
        // const res = await axios.get("http://localhost:3000/token", {
        const res = await axios.get(`${API_URL}/token`, {
          withCredentials: true,
        });

        const newAccessToken = res.data.accessToken;
        localStorage.setItem("token", newAccessToken);

        // Ulangi request yang tadi gagal dengan token baru
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Jika gagal refresh (refresh token juga mati), Logout paksa
        localStorage.clear();
        // window.location.href = "/login";
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;

// 29 mei 2026
// import axios from "axios";

// const axiosInstance = axios.create({
//   baseURL: "http://localhost:3000",
//   withCredentials: true,
// });

// // Variabel bantuan untuk menangani antrean request
// let isRefreshing = false;
// let refreshSubscribers = [];

// // Fungsi untuk memasukkan request yang gagal ke dalam antrean
// const subscribeTokenRefresh = (cb) => {
//   refreshSubscribers.push(cb);
// };

// // Fungsi untuk mengeksekusi semua request yang tertunda setelah token baru didapat
// const onRefreshed = (token) => {
//   refreshSubscribers.map((cb) => cb(token));
//   refreshSubscribers = [];
// };

// axiosInstance.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // 1. Amankan pengecekan error.response agar tidak crash jika jaringan terputus sementara
//     if (!error.response) {
//       console.error("⚠️ Masalah jaringan atau server tidak merespon.");
//       return Promise.reject(error);
//     }

//     // 2. Tangani status 401 (Unauthorized / Token Expired)
//     if (error.response.status === 401 && !originalRequest._retry) {
//       // Jika sistem sedang melakukan refresh token, masukkan request ini ke antrean
//       if (isRefreshing) {
//         return new Promise((resolve) => {
//           subscribeTokenRefresh((token) => {
//             originalRequest.headers.Authorization = `Bearer ${token}`;
//             resolve(axiosInstance(originalRequest));
//           });
//         });
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         console.log("🔄 Access token kedaluwarsa, mencoba memperbarui...");

//         // Menggunakan instance axios basic (bukan axiosInstance) untuk menghindari loop infini
//         const res = await axios.get("http://localhost:3000/token", {
//           withCredentials: true,
//         });

//         const newAccessToken = res.data.accessToken;
//         localStorage.setItem("token", newAccessToken);

//         // Beritahu semua request yang mengantre bahwa token baru sudah siap
//         onRefreshed(newAccessToken);
//         isRefreshing = false;

//         // Jalankan kembali request awal yang sempat gagal
//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//         return axiosInstance(originalRequest);
//       } catch (refreshError) {
//         isRefreshing = false;
//         refreshSubscribers = [];

//         // console.error(
//         //   "❌ Refresh token gagal atau kedaluwarsa. Membuka halaman login.",
//         // );
//         // // Hapus session hanya jika refresh token dari cookie memang sudah benar-benar habis/invalid
//         // localStorage.clear();
//         // window.location.href = "/";

//         // PERBAIKAN LOGIKA DISINI
//         // Hanya keluarkan user jika backend secara spesifik menolak Refresh Token (401 / 403)
//         if (
//           refreshError.response &&
//           (refreshError.response.status === 401 ||
//             refreshError.response.status === 403)
//         ) {
//           console.error(
//             "❌ Refresh token tidak valid/kedaluwarsa. Mengembalikan ke login.",
//           );
//           localStorage.removeItem("token"); // Hapus token
//           window.location.href = "/"; // Tendang ke halaman login
//         } else {
//           // Jika error karena Wi-Fi terputus atau server database (MySQL) timeout 500,
//           // Jangan lakukan localStorage.clear(). Biarkan saja gagal sementara.
//           console.error(
//             "⚠️ Gagal memperbarui token karena masalah jaringan atau server. Sesi tetap dipertahankan.",
//           );
//         }
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   },
// );

// export default axiosInstance;

// GA DIPAKE
// import axios from "axios";
// import store from "../store";
// import { setAccessToken, logout } from "../features/authSlice";

// const api = axios.create({
//   baseURL: "http://localhost:3000",
//   withCredentials: true, // 🔴 WAJIB biar cookie refreshToken kebawa
// });

// api.interceptors.request.use((config) => {
//   const token = store.getState().auth.accessToken;

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         const res = await api.get("/token");
//         store.dispatch(setAccessToken(res.data.accessToken));

//         originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;

//         return api(originalRequest);
//       } catch (err) {
//         store.dispatch(logout());
//         return Promise.reject(err);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;
