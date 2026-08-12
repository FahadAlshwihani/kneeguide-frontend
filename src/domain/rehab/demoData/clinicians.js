/**
 * The ONE shared mock clinician identity for the whole app (moved here,
 * unchanged, from the patient feature's data/patientClinicianData.js —
 * that file now just re-exports this so no existing import site has to
 * change). Every patient in the demo domain is treated by this same
 * clinician; a multi-clinician roster is out of scope for this demo.
 */

export const DEFAULT_CLINICIAN = {
  id: "dr-sarah-ahmed",
  name: "Dr. Sarah Ahmed",
  specialtyKey: "patientAppointments.clinician.specialty",
};
