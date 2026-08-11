import { getFixtureAppointments, getClinicianAvailability, DEFAULT_CLINICIAN, APPOINTMENT_STATUS } from "../data/patientAppointmentsData";
import { loadAppointmentOverrides, saveAppointmentOverrides, clearAppointmentOverrides } from "./patientAppointmentStorage";

/**
 * THE shared Patient appointment capability (Section 37/59) — the ONE
 * place that reads the merged appointment list and performs every
 * mutation (submit a request, accept a proposed alternative, choose
 * another time). `pages/PatientAppointments.jsx` and the KneeGuide
 * Assistant's REQUEST_APPOINTMENT action (patientAssistantActions.js)
 * both import and call these exact same functions — neither owns its own
 * copy of scheduling/conflict logic. This is the same shape as the
 * device capability's `useKneeGuideDevice()` (device/
 * KneeGuideDeviceContext.jsx), except appointments don't need a live
 * cross-component React state (a modal opened from either surface reads
 * fresh from localStorage each time), so a plain module — not a Context
 * provider — is the right amount of architecture here.
 *
 * MOCK, NOT REAL — every function here is synchronous and deterministic.
 * No network call, no `setTimeout` pretending to be "the doctor
 * reviewing," no fabricated confirmation. A newly submitted request is
 * always `REQUESTED` and stays that way until a fixture already encodes
 * a different outcome or the patient accepts/reschedules a proposed
 * alternative — never an automatic status change.
 */

const HALF_HOUR_MS = 30 * 60000;

const reviveDate = (value) => (value ? new Date(value) : null);

const reviveOverride = (raw) => ({
  ...raw,
  clinician: raw.clinician || DEFAULT_CLINICIAN,
  startAt: reviveDate(raw.startAt),
  endAt: reviveDate(raw.endAt),
  requestedAt: reviveDate(raw.requestedAt),
  reviewedAt: reviveDate(raw.reviewedAt),
  clinicianResponse: raw.clinicianResponse
    ? {
        ...raw.clinicianResponse,
        suggestedStartAt: reviveDate(raw.clinicianResponse.suggestedStartAt),
        suggestedEndAt: reviveDate(raw.clinicianResponse.suggestedEndAt),
      }
    : null,
});

const serializeDate = (value) => (value ? value.toISOString() : null);

const serializeAppointment = (appointment) => ({
  ...appointment,
  startAt: serializeDate(appointment.startAt),
  endAt: serializeDate(appointment.endAt),
  requestedAt: serializeDate(appointment.requestedAt),
  reviewedAt: serializeDate(appointment.reviewedAt),
  clinicianResponse: appointment.clinicianResponse
    ? {
        ...appointment.clinicianResponse,
        suggestedStartAt: serializeDate(appointment.clinicianResponse.suggestedStartAt),
        suggestedEndAt: serializeDate(appointment.clinicianResponse.suggestedEndAt),
      }
    : null,
});

let localIdCounter = 0;
const nextLocalId = () => {
  localIdCounter += 1;
  return `local-appt-${Date.now()}-${localIdCounter}`;
};

const persistOverride = (appointment) => {
  const overrides = loadAppointmentOverrides().filter((override) => override.id !== appointment.id);
  overrides.push(serializeAppointment(appointment));
  saveAppointmentOverrides(overrides);
};

/** Fixtures + any locally-submitted/mutated appointments, merged by id (an override always wins over its fixture), chronologically sorted. */
export const getAllAppointments = (referenceDate = new Date()) => {
  const fixtures = getFixtureAppointments(referenceDate);
  const overrides = loadAppointmentOverrides().map(reviveOverride);
  const overrideIds = new Set(overrides.map((override) => override.id));
  const merged = [...fixtures.filter((fixture) => !overrideIds.has(fixture.id)), ...overrides];
  return merged.sort((a, b) => a.startAt - b.startAt);
};

export const getAppointmentById = (id, referenceDate = new Date()) =>
  getAllAppointments(referenceDate).find((appointment) => appointment.id === id) || null;

export const getNextConfirmedAppointment = (referenceDate = new Date()) =>
  getAllAppointments(referenceDate).find(
    (appointment) => appointment.status === APPOINTMENT_STATUS.CONFIRMED && appointment.startAt > referenceDate
  ) || null;

export const getUpcomingAppointments = (referenceDate = new Date()) =>
  getAllAppointments(referenceDate).filter(
    (appointment) => appointment.status === APPOINTMENT_STATUS.CONFIRMED && appointment.startAt > referenceDate
  );

/** REQUESTED / ALTERNATIVE_PROPOSED / DECLINED — every request that isn't (yet, or ever) a confirmed future visit. */
export const getRequestAppointments = (referenceDate = new Date()) =>
  getAllAppointments(referenceDate).filter((appointment) =>
    [APPOINTMENT_STATUS.REQUESTED, APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED, APPOINTMENT_STATUS.DECLINED].includes(
      appointment.status
    )
  );

export const getPastAppointments = (referenceDate = new Date()) =>
  getAllAppointments(referenceDate)
    .filter((appointment) => [APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELLED].includes(appointment.status))
    .sort((a, b) => b.startAt - a.startAt);

/** Availability for the next `days`, with slots matching an existing CONFIRMED appointment already marked unavailable (Section 51). */
export const getAvailability = (referenceDate = new Date(), days = 7) => {
  const confirmedStartTimes = getAllAppointments(referenceDate)
    .filter((appointment) => appointment.status === APPOINTMENT_STATUS.CONFIRMED)
    .map((appointment) => appointment.startAt);
  return getClinicianAvailability(DEFAULT_CLINICIAN, { fromDate: referenceDate, days, bookedStartTimes: confirmedStartTimes });
};

/**
 * Creates a new REQUESTED appointment. Never auto-confirms. Rejects with
 * a reason code (never silently duplicates/overwrites) when the exact
 * slot is already confirmed or already has an unresolved request
 * (Section 50/51) — the caller maps `reason` to a translated message.
 */
export const submitAppointmentRequest = ({ reasonCode, note, startAt, endAt, typeKey = "patientAppointments.types.followUp", source = "patient", referenceDate = new Date() }) => {
  const existing = getAllAppointments(referenceDate);

  const hasConfirmedConflict = existing.some(
    (appointment) => appointment.status === APPOINTMENT_STATUS.CONFIRMED && appointment.startAt.getTime() === startAt.getTime()
  );
  if (hasConfirmedConflict) return { ok: false, reason: "conflict" };

  const hasDuplicateRequest = existing.some(
    (appointment) =>
      [APPOINTMENT_STATUS.REQUESTED, APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED].includes(appointment.status) &&
      appointment.startAt.getTime() === startAt.getTime()
  );
  if (hasDuplicateRequest) return { ok: false, reason: "duplicate" };

  const now = new Date();
  const appointment = {
    id: nextLocalId(),
    clinician: DEFAULT_CLINICIAN,
    startAt,
    endAt: endAt || new Date(startAt.getTime() + HALF_HOUR_MS),
    typeKey,
    reasonCode,
    // Bounded free text (Section 21/13) — never stored unbounded.
    note: typeof note === "string" && note.trim() ? note.trim().slice(0, 280) : null,
    status: APPOINTMENT_STATUS.REQUESTED,
    requestedAt: now,
    reviewedAt: null,
    clinicianResponse: null,
    location: { type: "clinic", nameKey: "patientAppointments.location.clinicName", room: "4" },
    source,
  };

  persistOverride(appointment);
  return { ok: true, appointment };
};

/** ALTERNATIVE_PROPOSED -> CONFIRMED at the clinician-suggested time. Idempotent: a second call on an already-resolved appointment is a no-op. */
export const acceptAlternative = (appointmentId, referenceDate = new Date()) => {
  const appointment = getAppointmentById(appointmentId, referenceDate);
  if (!appointment || appointment.status !== APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED || !appointment.clinicianResponse) {
    return { ok: false };
  }

  const updated = {
    ...appointment,
    status: APPOINTMENT_STATUS.CONFIRMED,
    startAt: appointment.clinicianResponse.suggestedStartAt,
    endAt: appointment.clinicianResponse.suggestedEndAt,
    clinicianResponse: null,
  };
  persistOverride(updated);
  return { ok: true, appointment: updated };
};

/** Rejecting a proposed alternative and picking a different slot — reuses the SAME request record, back to REQUESTED (Section 27). */
export const chooseAnotherTime = (appointmentId, { startAt, endAt }, referenceDate = new Date()) => {
  const existing = getAllAppointments(referenceDate);
  const appointment = existing.find((item) => item.id === appointmentId);
  if (!appointment) return { ok: false };

  const hasConfirmedConflict = existing.some(
    (item) => item.id !== appointmentId && item.status === APPOINTMENT_STATUS.CONFIRMED && item.startAt.getTime() === startAt.getTime()
  );
  if (hasConfirmedConflict) return { ok: false, reason: "conflict" };

  const updated = {
    ...appointment,
    startAt,
    endAt: endAt || new Date(startAt.getTime() + HALF_HOUR_MS),
    status: APPOINTMENT_STATUS.REQUESTED,
    requestedAt: referenceDate,
    reviewedAt: null,
    clinicianResponse: null,
  };
  persistOverride(updated);
  return { ok: true, appointment: updated };
};

/** Dev-only escape hatch — clears every locally-submitted/mutated appointment, leaving only the fixtures. Never exposed as a patient-facing control. */
export const resetAppointmentOverrides = () => clearAppointmentOverrides();
