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
  PATIENT_APPOINTMENTS: "/patient/appointments",

  // Doctor pages
  DOCTOR_DASHBOARD: "/doctor/dashboard",
  DOCTOR_PATIENTS: "/doctor/patients",
  DOCTOR_REPORTS: "/doctor/reports",
  APPOINTMENTS: "/doctor/appointments",
  DOCTOR_PROFILE: "/doctor/profile",

  // Patient Workspace (doctor view) — ONE route with local tabs
  // (?tab=overview|rehabilitation|sessions|reports|appointments|clinicalRecord),
  // replacing the old separate profile/reports/exercises/new-appointment
  // routes (Section 9 of the Doctor Patients module brief).
  DOCTOR_PATIENT_PROFILE: "/doctor/patient/:id",

  NOT_FOUND: "/404",
};
