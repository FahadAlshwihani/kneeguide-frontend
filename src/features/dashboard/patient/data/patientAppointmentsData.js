import { DEFAULT_CLINICIAN } from "./patientClinicianData";

/**
 * The ONE coherent Patient APPOINTMENT domain model + fixture source.
 * Audited before writing this: no Patient appointments route/API existed
 * anywhere — `nextAppointment` was a small inline mock object owned only
 * by PatientDashboard.jsx, and the Assistant's NEXT_APPOINTMENT action
 * only ever read that same object via a prop. Both are updated to read
 * FROM this module instead (see patientAssistantActions.js and
 * PatientDashboard.jsx) — there is now exactly one appointment dataset,
 * not several disagreeing ones.
 *
 * Appointment shape (Section 2's model, adapted to what this repo already
 * has — Dates instead of raw ISO strings once loaded, since every other
 * mock-data module in this feature already follows that convention):
 *   {
 *     id, clinician: { id, name, specialtyKey },
 *     startAt (Date), endAt (Date),
 *     typeKey, reasonCode, note,
 *     status: APPOINTMENT_STATUS,
 *     requestedAt (Date), reviewedAt (Date|null),
 *     clinicianResponse: { messageKey, suggestedStartAt, suggestedEndAt,
 *       followUpLabelKey } | null,
 *     location: { type: "clinic"|"video", nameKey, room },
 *     source: "fixture" | "patient" | "assistant",
 *     reportId?: string,
 *   }
 *
 * Canonical time representation (Section 46/47): every fixture below
 * builds real `Date` objects via `atTime`/`dayOffset` — nothing here is a
 * pre-formatted display string like "Tuesday 10 AM". Formatting only ever
 * happens at the presentation layer via `toLocaleDateString`/
 * `toLocaleTimeString`, exactly like patientReportsData.js/
 * patientRehabPlanData.js already do.
 *
 * Fixture dates are relative to the REAL current date (same
 * getRehabWeek/patientReportsData precedent) so the demo never goes
 * chronologically stale.
 */

export const APPOINTMENT_STATUS = {
  REQUESTED: "REQUESTED",
  CONFIRMED: "CONFIRMED",
  ALTERNATIVE_PROPOSED: "ALTERNATIVE_PROPOSED",
  DECLINED: "DECLINED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

// Shared status -> visual tone mapping (Section 57) — one place, reused
// by every component that renders a status pill (never color-only; each
// tone always pairs with a translated text label at the point of use).
export const APPOINTMENT_STATUS_TONE = {
  [APPOINTMENT_STATUS.CONFIRMED]: "positive",
  [APPOINTMENT_STATUS.REQUESTED]: "neutral",
  [APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED]: "warning",
  [APPOINTMENT_STATUS.DECLINED]: "danger",
  [APPOINTMENT_STATUS.COMPLETED]: "muted",
  [APPOINTMENT_STATUS.CANCELLED]: "muted",
};

export const APPOINTMENT_REASONS = [
  "painIncreased",
  "reviewProgress",
  "romConcern",
  "exerciseDifficulty",
  "deviceIssue",
  "generalFollowUp",
  "other",
];

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

const HALF_HOUR_MS = 30 * 60000;

const buildFixtureAppointments = (referenceDate) => {
  const confirmedDay = dayOffset(7, referenceDate);
  const confirmedStart = atTime(confirmedDay, 10, 0);

  const alternativeRequestedDay = dayOffset(3, referenceDate);
  const alternativeRequestedStart = atTime(alternativeRequestedDay, 9, 30);
  const alternativeSuggestedDay = dayOffset(4, referenceDate);
  const alternativeSuggestedStart = atTime(alternativeSuggestedDay, 11, 30);

  const declinedRequestedAt = dayOffset(-3, referenceDate);
  const declinedRequestedStart = atTime(dayOffset(2, referenceDate), 10, 0);
  const declinedReviewedAt = atTime(dayOffset(-2, referenceDate), 9, 20);

  const completed1Start = atTime(dayOffset(-14, referenceDate), 11, 0);
  const completed2Start = atTime(dayOffset(-45, referenceDate), 9, 0);

  return [
    {
      id: "appt-confirmed-1",
      clinician: DEFAULT_CLINICIAN,
      startAt: confirmedStart,
      endAt: new Date(confirmedStart.getTime() + HALF_HOUR_MS),
      typeKey: "patientAppointments.types.followUp",
      reasonCode: "reviewProgress",
      note: null,
      status: APPOINTMENT_STATUS.CONFIRMED,
      requestedAt: dayOffset(-4, referenceDate),
      reviewedAt: dayOffset(-3, referenceDate),
      clinicianResponse: null,
      location: { type: "clinic", nameKey: "patientAppointments.location.clinicName", room: "4" },
      source: "fixture",
    },
    {
      id: "appt-alternative-1",
      clinician: DEFAULT_CLINICIAN,
      startAt: alternativeRequestedStart,
      endAt: new Date(alternativeRequestedStart.getTime() + HALF_HOUR_MS),
      typeKey: "patientAppointments.types.followUp",
      reasonCode: "painIncreased",
      note: null,
      status: APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED,
      requestedAt: dayOffset(-1, referenceDate),
      reviewedAt: dayOffset(0, referenceDate),
      clinicianResponse: {
        messageKey: "patientAppointments.doctorResponses.alternative1",
        suggestedStartAt: alternativeSuggestedStart,
        suggestedEndAt: new Date(alternativeSuggestedStart.getTime() + HALF_HOUR_MS),
        followUpLabelKey: null,
      },
      location: { type: "clinic", nameKey: "patientAppointments.location.clinicName", room: "4" },
      source: "fixture",
    },
    {
      id: "appt-declined-1",
      clinician: DEFAULT_CLINICIAN,
      startAt: declinedRequestedStart,
      endAt: new Date(declinedRequestedStart.getTime() + HALF_HOUR_MS),
      typeKey: "patientAppointments.types.followUp",
      reasonCode: "reviewProgress",
      note: null,
      status: APPOINTMENT_STATUS.DECLINED,
      requestedAt: declinedRequestedAt,
      reviewedAt: declinedReviewedAt,
      clinicianResponse: {
        messageKey: "patientAppointments.doctorResponses.declined1",
        suggestedStartAt: null,
        suggestedEndAt: null,
        followUpLabelKey: "patientAppointments.followUp.nextWeek",
      },
      location: { type: "clinic", nameKey: "patientAppointments.location.clinicName", room: "4" },
      source: "fixture",
    },
    {
      id: "appt-completed-1",
      clinician: DEFAULT_CLINICIAN,
      startAt: completed1Start,
      endAt: new Date(completed1Start.getTime() + HALF_HOUR_MS),
      typeKey: "patientAppointments.types.followUp",
      reasonCode: "generalFollowUp",
      note: null,
      status: APPOINTMENT_STATUS.COMPLETED,
      requestedAt: dayOffset(-20, referenceDate),
      reviewedAt: dayOffset(-19, referenceDate),
      clinicianResponse: null,
      location: { type: "clinic", nameKey: "patientAppointments.location.clinicName", room: "4" },
      source: "fixture",
    },
    {
      id: "appt-completed-2",
      clinician: DEFAULT_CLINICIAN,
      startAt: completed2Start,
      endAt: new Date(completed2Start.getTime() + HALF_HOUR_MS),
      typeKey: "patientAppointments.types.initial",
      reasonCode: "generalFollowUp",
      note: null,
      status: APPOINTMENT_STATUS.COMPLETED,
      requestedAt: dayOffset(-52, referenceDate),
      reviewedAt: dayOffset(-51, referenceDate),
      clinicianResponse: null,
      location: { type: "clinic", nameKey: "patientAppointments.location.clinicName", room: "4" },
      source: "fixture",
    },
  ];
};

export const getFixtureAppointments = (referenceDate = new Date()) => buildFixtureAppointments(referenceDate);

// ---------- Clinician availability (mock, deterministic) ----------

const WORKING_HOURS = [
  { hour: 9, minute: 0 },
  { hour: 9, minute: 30 },
  { hour: 10, minute: 0 },
  { hour: 10, minute: 30 },
  { hour: 11, minute: 0 },
  { hour: 11, minute: 30 },
  { hour: 14, minute: 0 },
  { hour: 14, minute: 30 },
  { hour: 15, minute: 0 },
  { hour: 15, minute: 30 },
  { hour: 16, minute: 0 },
  { hour: 16, minute: 30 },
];

/**
 * Deterministic (no `Math.random`) day+slot-index pattern deciding base
 * unavailability — stands in for "the clinician already has other
 * patients booked" without ever exposing who. `bookedStartTimes` (the
 * confirmed appointments already in the merged list) additionally marks
 * the exact conflicting slot unavailable, so availability never contradicts
 * a real confirmed booking (Section 51).
 */
export const getClinicianAvailability = (clinician, { fromDate = new Date(), days = 7, bookedStartTimes = [] } = {}) => {
  const bookedTimestamps = new Set(bookedStartTimes.map((date) => date.getTime()));

  return Array.from({ length: days }, (_, dayIndex) => {
    const date = dayOffset(dayIndex, fromDate);
    const slots = WORKING_HOURS.map((time, slotIndex) => {
      const startAt = atTime(date, time.hour, time.minute);
      const endAt = new Date(startAt.getTime() + HALF_HOUR_MS);
      const isPast = startAt.getTime() <= fromDate.getTime();
      const isBooked = bookedTimestamps.has(startAt.getTime());
      // A stable, repeatable "the clinic is busy" pattern — roughly a
      // third of slots, shifted per day so the pattern doesn't look like
      // a static grid.
      const isDeterministicallyBusy = (dayIndex * 5 + slotIndex) % 3 === 0;
      return {
        startAt,
        endAt,
        available: !isPast && !isBooked && !isDeterministicallyBusy,
      };
    });
    return { date, slots };
  });
};

export { DEFAULT_CLINICIAN };
