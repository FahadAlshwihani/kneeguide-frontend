import { ROUTES } from "../../../../utils/routes";

/**
 * Centralized mock notification fixtures for the Doctor Topbar (Section
 * 13/33) — semantic IDs + translation KEYS, never pre-rendered prose, so
 * language switching updates them immediately like every other seeded
 * surface in this feature (same lesson as doctorAssistantMockHistory.js's
 * own contentKey/values architecture). `routeTo` only ever points at a
 * route that genuinely exists (audited against utils/routes.js) — Lama
 * Khaled's appointment-request notification has no honest per-patient
 * destination (same reasoning as doctorAssistantActions.js's own
 * Ahmed-only deep link), so it stays non-navigational.
 */

export const NOTIFICATION_SEVERITY = {
  WARNING: "warning",
  ATTENTION: "attention",
  INFO: "info",
};

const ahmedProfileRoute = ROUTES.DOCTOR_PATIENT_PROFILE.replace(":id", "1");

const NOTIFICATIONS = [
  {
    id: "pain-spike-ahmed",
    patientName: "Ahmed Ali",
    titleKey: "doctorShell.notifications.items.painSpike.title",
    messageKey: "doctorShell.notifications.items.painSpike.message",
    values: { pain: 7 },
    severity: NOTIFICATION_SEVERITY.WARNING,
    createdAt: "2026-08-12T14:05:00.000Z",
    routeTo: ahmedProfileRoute,
  },
  {
    id: "missed-sessions-sara",
    patientName: "Sara Almutairi",
    titleKey: "doctorShell.notifications.items.missedSessions.title",
    messageKey: "doctorShell.notifications.items.missedSessions.message",
    values: { count: 2 },
    severity: NOTIFICATION_SEVERITY.ATTENTION,
    createdAt: "2026-08-12T09:30:00.000Z",
    routeTo: ROUTES.DOCTOR_PATIENTS,
  },
  {
    id: "report-ready-mohammed",
    patientName: "Mohammed Aziz",
    titleKey: "doctorShell.notifications.items.reportReady.title",
    messageKey: "doctorShell.notifications.items.reportReady.message",
    values: {},
    severity: NOTIFICATION_SEVERITY.INFO,
    createdAt: "2026-08-11T18:15:00.000Z",
    routeTo: ROUTES.DOCTOR_REPORTS,
  },
  {
    id: "appointment-request-lama",
    patientName: "Lama Khaled",
    titleKey: "doctorShell.notifications.items.appointmentRequest.title",
    messageKey: "doctorShell.notifications.items.appointmentRequest.message",
    values: {},
    severity: NOTIFICATION_SEVERITY.INFO,
    createdAt: "2026-08-11T12:50:00.000Z",
    routeTo: null,
  },
];

/** Fresh copy every call — callers own their own array reference. */
export const getMockNotifications = () => NOTIFICATIONS.map((notification) => ({ ...notification }));

/**
 * A bucket + numeric value for a relative-time label — never a pre-
 * formatted string, so the caller resolves it through i18next
 * (`doctorShell.notifications.relative.<key>`) and stays bilingual, same
 * convention already used for e.g. appointment "days away" labels
 * elsewhere in this app.
 */
export const getRelativeTimeBucket = (isoDate, now = new Date()) => {
  const diffMinutes = Math.max(0, Math.floor((now - new Date(isoDate)) / 60000));
  if (diffMinutes < 1) return { key: "justNow", value: null };
  if (diffMinutes < 60) return { key: "minutesAgo", value: diffMinutes };
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return { key: "hoursAgo", value: diffHours };
  const diffDays = Math.floor(diffHours / 24);
  return { key: "daysAgo", value: diffDays };
};
