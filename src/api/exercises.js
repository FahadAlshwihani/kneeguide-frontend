import api from "./axios";

// تمرين جديد (دكتور)
export const createExercise = async (data) => {
  const res = await api.post("exercises/create/", data);
  return res.data;
};

// التمارين حسب المريض
export const getExercisesForPatient = async (patientId) => {
  const res = await api.get(`exercises/patient/${patientId}/`);
  return res.data;
};
