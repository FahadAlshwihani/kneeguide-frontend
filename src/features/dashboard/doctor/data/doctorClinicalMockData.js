/**
 * THE centralized Doctor clinical mock-data source. Audited before writing
 * this: no such module existed anywhere — DoctorDashboard.jsx,
 * DoctorPatients.jsx, DoctorCalendar.jsx, DoctorReports.jsx, and
 * DoctorPatientProfile.jsx each keep their own small, already-mutually-
 * inconsistent mock arrays (different patient names/ids/values). Those
 * pages are explicitly out of scope for this task (Doctor Home only) and
 * are left untouched — this module does NOT replace their data, it is the
 * ONE source every new Doctor Home Assistant surface (Clinical Brief,
 * live assistant answers, the 3 seeded previous conversations, embedded
 * clinical-message cards, attention calculation) reads from, so none of
 * those can ever silently disagree with each other.
 *
 * Patient names reuse the set DoctorCalendar.jsx's own mock already uses
 * (Ahmed Ali, Sara Almutairi, Mohammed Aziz, Ruba Salem, Fahad Alotaibi)
 * for narrative consistency across Doctor screens, without importing from
 * that file (it owns its own independent copy; this module owns its own).
 *
 * Deterministic only — no `Math.random()`. Today's appointments use real
 * `Date` objects anchored to the actual current date (legitimate
 * day/time-of-day handling, same technique
 * patient/data/patientAppointmentsData.js already uses), never a fake
 * clock-independent "today". Every clinical trend below (Ahmed's session-
 * by-session ROM/pain series, Sara's adherence, Mohammed's before/after
 * values) is a fixed array/pair — nothing here is randomized or
 * `Date.now()`-scaled.
 */

export const DOCTOR_DISPLAY_NAME = "Dr. Sarah Ahmed";

// ---------- Patients (clinical trend source) ----------
//
// Ahmed models a genuinely internally-consistent WEEK of sessions as a
// small chronological series (oldest -> newest) rather than a handful of
// hand-picked before/after numbers — every number the Assistant ever
// states about Ahmed (weekly trend, latest-session delta, today's pain
// spike) is DERIVED from these two arrays via doctorClinicalInsights.js,
// so it can never drift into contradicting itself across surfaces.
const AHMED = {
  id: "ahmed-ali",
  routeId: "1", // see doctorAssistantActions.js's own comment on DoctorPatientProfile.jsx's :id handling
  name: "Ahmed Ali",
  diagnosisKey: "doctorDashboard.assistant.mock.ahmed.diagnosis",
  sessionsPrescribedThisWeek: 6,
  sessionsCompletedThisWeek: 5,
  // Knee flexion, degrees — oldest to newest, this week's completed sessions.
  flexionSeries: [101, 107, 112, 118, 114],
  // Pain (0-10) — oldest to newest, one log per session, ends with today's spike.
  painSeries: [5.6, 5.0, 4.4, 3.8, 7.0],
  movementQualityKey: "stable",
};

const SARA = {
  id: "sara-almutairi",
  routeId: null, // no honest per-patient destination exists for Sara — see doctorAssistantActions.js
  name: "Sara Almutairi",
  sessionsPrescribedThisWeek: 8,
  sessionsCompletedThisWeek: 5,
};

const MOHAMMED = {
  id: "mohammed-aziz",
  routeId: null,
  name: "Mohammed Aziz",
  flexionPrevious: 96,
  flexionLatest: 110,
  painPrevious: 5,
  painLatest: 3,
};

export const PATIENTS = [AHMED, SARA, MOHAMMED];

export const getPatientById = (id) => PATIENTS.find((patient) => patient.id === id) || null;

// ---------- Today's appointments ----------

const dayOffset = (offset, referenceDate = new Date()) => {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

const atTime = (date, hours, minutes = 0) => {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

const TODAY_APPOINTMENT_PLAN = [
  { patientName: "Fahad Alotaibi", hour: 9, minute: 0, reasonCode: "generalFollowUp" },
  { patientName: "Ruba Salem", hour: 9, minute: 40, reasonCode: "reviewProgress" },
  { patientName: "Mohammed Aziz", hour: 10, minute: 15, reasonCode: "reviewProgress" },
  { patientName: "Lama Khaled", hour: 11, minute: 0, reasonCode: "generalFollowUp" },
  { patientName: "Ahmed Ali", hour: 14, minute: 30, reasonCode: "painIncreased", patientId: AHMED.id },
  { patientName: "Sara Almutairi", hour: 15, minute: 10, reasonCode: "reviewProgress", patientId: SARA.id },
  { patientName: "Noura Al-Harbi", hour: 16, minute: 0, reasonCode: "generalFollowUp" },
];

/** Fresh `Date`-bearing appointment objects for "today", chronologically ordered. */
export const getTodayAppointments = (referenceDate = new Date()) => {
  const today = dayOffset(0, referenceDate);
  return TODAY_APPOINTMENT_PLAN.map((item, index) => ({
    id: `today-appt-${index + 1}`,
    patientId: item.patientId || null,
    patientName: item.patientName,
    reasonCode: item.reasonCode,
    startAt: atTime(today, item.hour, item.minute),
  }));
};

// ---------- New reports ----------

export const NEW_REPORTS = [
  { id: "rpt-ahmed", patientId: AHMED.id, patientName: "Ahmed Ali", summaryKey: "doctorDashboard.assistant.mock.reports.ahmed" },
  { id: "rpt-sara", patientId: SARA.id, patientName: "Sara Almutairi", summaryKey: "doctorDashboard.assistant.mock.reports.sara" },
  { id: "rpt-mohammed", patientId: MOHAMMED.id, patientName: "Mohammed Aziz", summaryKey: "doctorDashboard.assistant.mock.reports.mohammed" },
  { id: "rpt-lama", patientId: null, patientName: "Lama Khaled", summaryKey: "doctorDashboard.assistant.mock.reports.lama" },
];

export const getNewReports = () => NEW_REPORTS;
