import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://kneeguide-backend.onrender.com/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// إضافة التوكين تلقائيًا
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  const publicAuthPaths = [
    "users/login/",
    "users/register/",
    "users/check-email/",
    "users/verify-otp/",
    "users/resend-otp/",
  ];
  const isPublicAuthRequest = publicAuthPaths.some((path) =>
    (config.url || "").startsWith(path)
  );

  if (token && !isPublicAuthRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }
  return config;
});

// التعامل مع 401 (انتهاء التوكين)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
