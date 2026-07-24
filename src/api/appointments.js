import api from "./axios";

// إنشاء موعد (دكتور فقط)
export const createAppointment = async (data) => {
  const res = await api.post("appointments/create/", data);
  return res.data;
};

// تفاصيل موعد واحد
export const getAppointmentDetails = async (id) => {
  const res = await api.get(`appointments/${id}/`);
  return res.data;
};

// تحديث موعد
export const updateAppointment = async (id, data) => {
  const res = await api.patch(`appointments/${id}/update/`, data);
  return res.data;
};

// إلغاء موعد
export const cancelAppointment = async (id) => {
  const res = await api.delete(`appointments/${id}/cancel/`);
  return res.data;
};

// قائمة مواعيد المريض
export const getAppointmentsForPatient = async (patientId) => {
  const res = await api.get(`appointments/patient/${patientId}/`);
  return res.data;
};

// قائمة مواعيد الدكتور
export const getAppointmentsForDoctor = async (doctorId) => {
  const res = await api.get(`appointments/doctor/${doctorId}/`);
  return res.data;
};
