import { DEFAULT_CLINICIAN } from "./clinicians";

/**
 * THE canonical patient roster for the demo domain. Four patients (Section
 * 36 of the brief), each demonstrating a distinct clinical scenario:
 *
 *   patient-ahmed     — improving, but a same-day pain spike + ROM dip
 *                        needs review (matches the existing Doctor Home
 *                        Assistant's Ahmed narrative in
 *                        doctorClinicalMockData.js/doctorClinicalInsights.js)
 *   patient-sara       — missed sessions / adherence concern
 *   patient-mohammed    — stable, positive progress
 *   patient-lama         — pending appointment request
 *
 * `id` is the ONE stable identifier used everywhere (route params,
 * prescriptions, sessions, appointments, reports, notes) — this is what
 * fixes the pre-refactor bug where Ahmed had four different ids across
 * DoctorPatients.jsx ("1"), DoctorPatientProfile.jsx ("PT-0003"),
 * DoctorReports.jsx ("PT-0001"), and doctorClinicalMockData.js
 * ("ahmed-ali"). `displayId` is a cosmetic "PT-000N" label ONLY, derived
 * here once, never independently re-invented per screen.
 *
 * Ahmed's fields are reconciled from the pre-refactor Patient-side facts
 * (the more complete/live source per the brief's Section 35), which is
 * why age/diagnosis/phase/email below match what
 * src/features/dashboard/patient/pages/PatientProfile.jsx used to hardcode
 * locally — that page now reads these same fields instead of its own copy
 * (see PATIENT_PROFILE_PATIENT_ID in that file).
 */

export const PATIENT_PROFILE_PATIENT_ID = "patient-ahmed"; // the one real logged-in demo patient
export const DEFAULT_CLINICIAN_ID = DEFAULT_CLINICIAN.id;

export const PATIENTS = [
  {
    id: "patient-ahmed",
    displayId: "PT-0001",
    firstName: "Ahmed",
    lastName: "Ali",
    name: "Ahmed Ali",
    age: 32,
    sex: "male",
    email: "ahmed@example.com",
    phone: "0555555555",
    diagnosisKey: "rehabDomain.diagnosis.aclPartialTear",
    phaseKey: "phase2",
    programStartDate: "2025-09-10",
    clinicianId: DEFAULT_CLINICIAN_ID,
    goalKey: "rehabDomain.goal.romStrength",
  },
  {
    id: "patient-sara",
    displayId: "PT-0002",
    firstName: "Sara",
    lastName: "Almutairi",
    name: "Sara Almutairi",
    age: 45,
    sex: "female",
    email: "sara.almutairi@example.com",
    phone: "0561234567",
    diagnosisKey: "rehabDomain.diagnosis.meniscusTearPostOp",
    phaseKey: "phase1",
    programStartDate: "2025-10-02",
    clinicianId: DEFAULT_CLINICIAN_ID,
    goalKey: "rehabDomain.goal.restoreMobility",
  },
  {
    id: "patient-mohammed",
    displayId: "PT-0003",
    firstName: "Mohammed",
    lastName: "Aziz",
    name: "Mohammed Aziz",
    age: 29,
    sex: "male",
    email: "mohammed.aziz@example.com",
    phone: "0567654321",
    diagnosisKey: "rehabDomain.diagnosis.patellarTendinopathy",
    phaseKey: "phase3",
    programStartDate: "2025-07-14",
    clinicianId: DEFAULT_CLINICIAN_ID,
    goalKey: "rehabDomain.goal.returnToSport",
  },
  {
    id: "patient-lama",
    displayId: "PT-0004",
    firstName: "Lama",
    lastName: "Khaled",
    name: "Lama Khaled",
    age: 24,
    sex: "female",
    email: "lama.khaled@example.com",
    phone: "0539876543",
    diagnosisKey: "rehabDomain.diagnosis.aclReconstruction",
    phaseKey: "phase2",
    programStartDate: "2025-08-20",
    clinicianId: DEFAULT_CLINICIAN_ID,
    goalKey: "rehabDomain.goal.romStrength",
  },
];

export const getPatientById = (patientId) => PATIENTS.find((patient) => patient.id === patientId) || null;
