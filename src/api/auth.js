import api from "./axios";

// تسجيل الدخول
export const login = async (email, password) => {
  const res = await api.post("users/login/", { email, password });
  return res.data;
};

// تسجيل مستخدم جديد
export const registerUser = async (formData) => {
  const res = await api.post("users/register/", formData);
  return res.data;
};

// التحقق من OTP
export const verifyOtp = async (email, code) => {
  const res = await api.post("users/verify-otp/", { email, code });
  return res.data;
};

// إعادة إرسال OTP
export const resendOtp = async (email) => {
  const res = await api.post("users/resend-otp/", { email });
  return res.data;
};

// جلب بروفايل المستخدم
export const getProfile = async () => {
  const res = await api.get("users/me/");
  return res.data;
};

export const checkEmail = async (email) => {
  const res = await api.post("users/check-email/", { email });
  return res.data;
};
