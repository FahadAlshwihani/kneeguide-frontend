import axios from "axios";

// const api = axios.create({
//   baseURL: "http://127.0.0.1:8000/api/",
// });

const api = axios.create({
  baseURL: "https://kneeguide-backend.onrender.com/api/",
});

// إضافة التوكين تلقائيًا
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
