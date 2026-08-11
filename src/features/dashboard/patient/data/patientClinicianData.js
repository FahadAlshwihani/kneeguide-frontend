/**
 * The ONE shared mock clinician identity — audited before writing this:
 * "Dr. Sarah Ahmed" already appeared independently in
 * patientReportsData.js's doctor-feedback fixtures and in
 * PatientDashboard.jsx's inline `nextAppointment` mock, both hardcoded as
 * plain strings. Centralizing it here (and having both of those import
 * it — see patientReportsData.js and patientAppointmentsData.js) is what
 * prevents an accidental "Dr. Sarah Ahmed" / "Dr. Sarah Ahmad" / "Sarah A."
 * drift (Section 43) without building a full provider-management system —
 * this is deliberately just one small constant, not a clinician registry.
 */

export const DEFAULT_CLINICIAN = {
  id: "dr-sarah-ahmed",
  name: "Dr. Sarah Ahmed",
  specialtyKey: "patientAppointments.clinician.specialty",
};
