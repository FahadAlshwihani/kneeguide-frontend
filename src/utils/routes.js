// src/utils/routes.js
export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_OTP: "/auth/verify-otp",

  // Patient pages
  PATIENT_DASHBOARD: "/patient/dashboard",
  PATIENT_REPORTS: "/patient/reports",
  PATIENT_EXERCISES: "/patient/exercises",
  PATIENT_PROFILE: "/patient/profile",

  // Doctor pages
  DOCTOR_DASHBOARD: "/doctor/dashboard",
  DOCTOR_PATIENTS: "/doctor/patients",
  DOCTOR_REPORTS: "/doctor/reports",
  APPOINTMENTS: "/doctor/appointments",
  DOCTOR_PROFILE: "/doctor/profile",

  // Patient-specific (doctor view)
  DOCTOR_PATIENT_PROFILE: "/doctor/patient/:id",
  DOCTOR_PATIENT_REPORTS: "/doctor/patient/:id/reports",
  DOCTOR_PATIENT_EXERCISES: "/doctor/patient/:id/exercises",
  DOCTOR_PATIENT_NEW_APPOINTMENT: "/doctor/patient/:id/new-appointment",

  NOT_FOUND: "/404",
};
