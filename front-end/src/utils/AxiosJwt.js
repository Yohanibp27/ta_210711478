import axios from "axios";
// YANG LAMA
// const getAxiosJWT = () => {
//   const token = localStorage.getItem("token");

//   //   return axios.create({
//   //     baseURL: "http://localhost:3000",
//   //     headers: {
//   //       Authorization: `Bearer ${token}`,
//   //     },
//   //   });

//   const axiosJWT = axios.create({
//     baseURL: "http://localhost:3000",
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   // response interceptor buat handle token expiration
//   //   axiosJWT.interceptors.response.use(
//   //     (response) => response,
//   //     (error) => {
//   //       if (error.response) {
//   //         const { status, data } = error.response;

//   //         if (
//   //           status === 401 &&
//   //           (data?.code === "TOKEN_EXPIRED" || data?.code === "INVALID_TOKEN")
//   //         ) {
//   //           // AUTO LOGOUT
//   //           localStorage.removeItem("token");
//   //           localStorage.removeItem("user");

//   //           window.location.href = "/";
//   //         }
//   //       }

//   //       return Promise.reject(error);
//   //     }
//   //   );

//   axiosJWT.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//       const originalRequest = error.config;
//       if (error.response) {
//         const { status, data } = error.response;

//         if (
//           status === 401 &&
//           (data?.code === "TOKEN_EXPIRED" || data?.code === "INVALID_TOKEN")
//         ) {
//           try {
//             // coba refresh token
//             const res = await axios.get("http://localhost:3000/token", {
//               withCredentials: true, // karena refresh token di cookie
//             });

//             const newAccessToken = res.data.accessToken;
//             localStorage.setItem("token", newAccessToken);

//             // update header original request
//             originalRequest.headers[
//               "Authorization"
//             ] = `Bearer ${newAccessToken}`;

//             // retry request asli
//             return axios(originalRequest);
//           } catch (err) {
//             // gagal refresh token → logout
//             localStorage.removeItem("token");
//             localStorage.removeItem("user");
//             window.location.href = "/";
//             return Promise.reject(err);
//           }
//         }
//       }

//       return Promise.reject(error);
//     }
//   );

//   return axiosJWT;
// };

const getAxiosJWT = (getToken, setToken) => {
  const token = localStorage.getItem("token");
  const axiosJWT = axios.create({
    baseURL: "http://localhost:3000",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  axiosJWT.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const res = await axios.get("http://localhost:3000/token", {
            // withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const newAccessToken = res.data.accessToken;
          setToken(newAccessToken); // update token di state atau localStorage
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return axiosJWT(originalRequest);
        } catch (err) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/";
          return Promise.reject(err);
        }
      }
      return Promise.reject(error);
    }
  );

  return axiosJWT;
};

export default getAxiosJWT;


  // axiosJWT.interceptors.response.use(
  //   (response) => {
  //     // cek header token baru
  //     const newToken = response.headers["x-new-token"];
  //     if (newToken) {
  //       setToken(newToken);
  //       localStorage.setItem("token", newToken);
  //       response.config.headers["Authorization"] = `Bearer ${newToken}`;
  //     }
  //     return response;
  //   },
  //   async (error) => {
  //     const originalRequest = error.config;
  //     if (error.response?.status === 401 && !originalRequest._retry) {
  //       originalRequest._retry = true;
  //       try {
  //         const res = await axios.get("http://localhost:3000/token", {
  //           headers: {
  //             Authorization: `Bearer ${localStorage.getItem("token")}`,
  //           },
  //         });
  //         const newAccessToken = res.data.accessToken;
  //         setToken(newAccessToken);
  //         localStorage.setItem("token", newAccessToken);
  //         originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
  //         return axiosJWT(originalRequest);
  //       } catch (err) {
  //         localStorage.removeItem("token");
  //         localStorage.removeItem("user");
  //         window.location.href = "/";
  //         return Promise.reject(err);
  //       }
  //     }
  //     return Promise.reject(error);
  //   }
  // );