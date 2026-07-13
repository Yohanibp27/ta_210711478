import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";
import axiosInstance from "../api/axios";
import { jwtDecode } from "jwt-decode";

const savedToken = localStorage.getItem("token");
const savedUser = localStorage.getItem("user");
// const saveRole = localStorage.getItem("role");

const initialState = {
  //   user: savedUser ? JSON.parse(savedUser) : null,
  user: savedUser && savedUser !== "undefined" ? JSON.parse(savedUser) : null,
  token: savedToken || null,

  //   user: null,
  //   token: null,
  isAuthChecked: false, // untuk cek status auth saat app loading
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// ambil token dari backend
export const LoginUser = createAsyncThunk(
  "user/login",
  async (user, thunkAPI) => {
    try {
      const response = await axiosInstance.post("/login", {
        // email: user.email,
        nip: user.nip, // 30 April 26 PERBAIKAN: Backend menggunakan nip
        password: user.password,
      });
      //   const token = response.data.token;
      const token = response.data.accessToken; // 30 April 26 PERBAIKAN: Backend mengirim accessToken
      //   const userData = response.data.user; // 30 April 26 Ambil object user langsung
      if (!token) throw new Error("Token tidak ditemukan");
      localStorage.setItem("token", token); // simpan token
      //   localStorage.setItem("user", JSON.stringify(userData)); // 30 April 26 Simpan user utuh
      return token;
      //   return { token, user: userData }; // 30 April 26
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Login gagal";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// ambil user dari backend
export const StayLoggedIn = createAsyncThunk(
  "user/stay",
  async (_, thunkAPI) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token tidak ditemukan");

      const response = await axiosInstance.get("/stay", {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Token tidak valid";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// hapus token di localStorage
export const Logout = createAsyncThunk("user/logout", async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
});

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: () => initialState,
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    setAccessToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem("token", action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },

  // LOGIN
  extraReducers: (builder) => {
    builder.addCase(LoginUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(LoginUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;

      const token = action.payload;
      state.token = token;
      try {
        const decoded = jwtDecode(token);
        state.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        };
        state.isAuthChecked = true;
      } catch (e) {
        state.user = null;
        e.message = "Token tidak valid";
        state.isAuthChecked = true;
      }

      //   state.token = action.payload.token; // 30 April 26 PERBAIKAN: Gunakan data user dari response backend, bukan jwtDecode
      //   state.user = action.payload.user;
      //   state.isAuthChecked = true;
    });
    builder.addCase(LoginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload;
    });

    // Get User Login
    builder.addCase(StayLoggedIn.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(StayLoggedIn.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.user = action.payload;
      state.isAuthChecked = true;
    });
    builder.addCase(StayLoggedIn.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload;
      state.isAuthChecked = true;
      localStorage.setItem("user", JSON.stringify(action.payload));
    });

    // logout
    builder.addCase(Logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    });
  },
});

export const { reset, setUser, logout } = authSlice.actions;
export default authSlice.reducer;

// masih pake session express
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const initialState = {
//   user: null,
//   role: null,
//   department: null,
//   division: null,
//   position: null,

//   isError: false,
//   isSuccess: false,
//   isLoading: false,
//   message: "",
// };

// export const LoginUser = createAsyncThunk(
//   "user/login",
//   async (user, thunkAPI) => {
//     try {
//       const response = await axios.post(
//         "http://localhost:3000/login",
//         {
//           email: user.email,
//           password: user.password,
//         },
//         { withCredentials: true } // session
//       );
//       return response.data.data;
//     } catch (error) {
//       if (error.response) {
//         const message = error.response.data.message;
//         return thunkAPI.rejectWithValue(message);
//       }
//     }
//   }
// );

// export const StayLoggedIn = createAsyncThunk(
//   "user/stay",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axios.get("http://localhost:3000/stay", {
//         withCredentials: true,
//       });
//       return response.data;
//     } catch (error) {
//       if (error.response) {
//         const message = error.response.data.message;
//         return thunkAPI.rejectWithValue(message);
//       }
//     }
//   }
// );

// export const Logout = createAsyncThunk("user/logout", async () => {
//   await axios.delete("http://localhost:3000/logout");
// });

// export const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     reset: (state) => initialState,
//     setUser: (state, action) => {
//       state.user = action.payload;
//       localStorage.setItem("user", JSON.stringify(action.payload));
//     },
//     logout: (state) => {
//       state.user = null;
//       localStorage.removeItem("user");
//     },
//   },
//   extraReducers: (builder) => {
//     builder.addCase(LoginUser.pending, (state) => {
//       state.isLoading = true;
//     });
//     builder.addCase(LoginUser.fulfilled, (state, action) => {
//       state.isLoading = false;
//       state.isSuccess = true;
//       //   state.user = action.payload;

//       const payload =
//         action.payload.data || action.payload.user || action.payload;

//       state.user = {
//         id: payload.id || null,
//         firstName: payload.firstName || "",
//         middleName: payload.middleName || "",
//         lastName: payload.lastName || "",
//         nip: payload.nip || "",
//         email: payload.email || "",
//         phone: payload.phone || "",
//         joinDate: payload.joinDate || "",
//         role: payload.role?.name
//           ? { name: payload.role.name }
//           : { name: payload.role || "N/A" },
//         department: payload.department || null,
//         division: payload.division || null,
//         position: payload.position || null,
//         workShift: payload.workShift || null,
//       };
//     });
//     builder.addCase(LoginUser.rejected, (state, action) => {
//       state.isLoading = false;
//       state.isError = true;
//       state.message = action.payload;
//     });

//     // Get User Login
//     builder.addCase(StayLoggedIn.pending, (state) => {
//       state.isLoading = true;
//     });
//     builder.addCase(StayLoggedIn.fulfilled, (state, action) => {
//       state.isLoading = false;
//       state.isSuccess = true;
//       //   state.user = action.payload;

//       const payload =
//         action.payload.data || action.payload.user || action.payload;

//       state.user = {
//         id: payload.id || null,
//         firstName: payload.firstName || "",
//         middleName: payload.middleName || "",
//         lastName: payload.lastName || "",
//         nip: payload.nip || "",
//         email: payload.email || "",
//         phone: payload.phone || "",
//         joinDate: payload.joinDate || "",
//         role: payload.role?.name
//           ? { name: payload.role.name }
//           : { name: payload.role || "-" },
//         department: payload.department || null,
//         division: payload.division || null,
//         position: payload.position || null,
//         workShift: payload.workShift || null,
//       };
//     });
//     builder.addCase(StayLoggedIn.rejected, (state, action) => {
//       state.isLoading = false;
//       state.isError = true;
//       state.message = action.payload;
//     });

//     // logout
//     builder.addCase(Logout.fulfilled, (state) => {
//       state.user = null;
//       state.isSuccess = false;
//       state.isError = false;
//       state.message = "";
//     });
//   },
// });

// export const { reset, setUser, clearUser } = authSlice.actions;
// export default authSlice.reducer;
