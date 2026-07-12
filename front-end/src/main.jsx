import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice";
import axios from "axios";
import App from "./App.jsx";
import "./index.css";
import "../src/style/style.css";

axios.defaults.withCredentials = true;
const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
