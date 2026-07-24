import api from "./axios";

// إرسال تقرير جديد من المريض
export const submitReport = async (data) => {
  const res = await api.post("reports/submit/", data);
  return res.data;
};

// تقارير مريض
export const getReportsForPatient = async (patientId) => {
  const res = await api.get(`reports/patient/${patientId}/`);
  return res.data;
};

// تحديث التقييم (Doctor)
export const updateReportByDoctor = async (reportId, data) => {
  const res = await api.patch(`reports/${reportId}/update/`, data);
  return res.data;
};

// داشبورد المريض
export const getPatientDashboard = async (patientId) => {
  const res = await api.get(`reports/dashboard/${patientId}/`);
  return res.data;
};

// داشبورد الدكتور
export const getDoctorDashboard = async () => {
  const res = await api.get("reports/doctor/dashboard/");
  return res.data;
};
