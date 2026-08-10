// src/api/axiosClient.js
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://kneeguide-backend.onrender.com/api/";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// إضافة التوكين أوتوماتيكياً لكل طلب (مع استثناءات)
axiosClient.interceptors.request.use((config) => {
  // نقرأ التوكين من localStorage
  const rawToken = localStorage.getItem("access_token");
  const token =
    rawToken && rawToken !== "null" && rawToken !== "undefined"
      ? rawToken
      : null;

  // مسارات عامة لا تحتاج توكين (register / login / otp / check-email)
  const url = (config.url || "").replace(/^\//, "");

  const isPublicAuthEndpoint =
    url.startsWith("users/register/") ||
    url.startsWith("users/login/") ||
    url.startsWith("users/verify-otp/") ||
    url.startsWith("users/resend-otp/") ||
    url.startsWith("users/check-email/");

  // لو المسار عام → لا نضيف Authorization نهائياً
  if (isPublicAuthEndpoint) {
    if (config.headers && config.headers.Authorization) {
      delete config.headers.Authorization;
    }
  } else if (token) {
    // غير كذا، لو فيه توكين صالح → نرسله
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers && config.headers.Authorization) {
    // لو ما فيه توكين، نتأكد إنه ما فيه بقايا هيدر قديم
    delete config.headers.Authorization;
  }

  return config;
});

// التعامل مع انتهاء الجلسة (401 مع رسالة Session expired)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data?.detail === "Session expired due to inactivity."
    ) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user"); // لو كنت تخزن اليوزر
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
