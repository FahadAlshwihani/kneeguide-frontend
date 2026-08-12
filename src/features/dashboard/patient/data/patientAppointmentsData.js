import { DEFAULT_CLINICIAN } from "./patientClinicianData";
import { APPOINTMENT_STATUS } from "../../../../domain/rehab/rehabEnums";

/**
 * APPOINTMENT_STATUS is now re-exported from the shared rehab domain
 * (src/domain/rehab/rehabEnums.js) — same literal values as before this
 * refactor, so every i18n key / CSS class this app builds from it
 * (`patientAppointments.status.${status}`, `.status-${status}` etc.)
 * still resolves correctly. The actual appointment RECORDS now live in
 * the shared repository (src/domain/rehab/rehabRepository.js), not a
 * fixture builder in this file — see patientAppointmentService.js.
 */
export { APPOINTMENT_STATUS };

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
 * Deterministic (no `Math.random`) clinician-availability simulation —
 * unrelated to any specific patient's canonical appointment records, so
 * it stays here rather than moving into the shared domain. `bookedStartTimes`
 * (the patient's own real confirmed appointments, passed in by the
 * caller) additionally marks the exact conflicting slot unavailable.
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
