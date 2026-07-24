// تعريف ثابت للأدوار واستخدامها في الحماية

export const ROLE_PATIENT = "patient";
export const ROLE_DOCTOR = "doctor";

export const isPatient = (user) => user?.role === ROLE_PATIENT;
export const isDoctor = (user) => user?.role === ROLE_DOCTOR;
