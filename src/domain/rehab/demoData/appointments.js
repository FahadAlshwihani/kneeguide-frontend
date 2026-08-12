import { APPOINTMENT_STATUS, APPOINTMENT_SOURCE } from "../rehabEnums";
import { DEFAULT_CLINICIAN_ID } from "./patients";

/**
 * THE canonical appointment fixtures — one shared timeline per patient,
 * readable/writable from both the Patient appointment flow and the
 * Doctor's calendar/workspace (Section 26 of the brief: "no duplicate
 * doctorAppointmentMock and patientAppointmentMock").
 *
 * Ahmed's four fixtures below are reconciled from the pre-refactor
 * Patient-side data/patientAppointmentsData.js fixtures (same day offsets,
 * reason codes, and clinician response shape) — just re-keyed onto
 * `patientId` and the lower-case status enum. Lama additionally has one
 * REQUESTED (pending) appointment, matching the brief's own worked
 * example ("Lama Khaled — pending appointment request", Section 36) —
 * this is what the Doctor Patients list's "pending appointment request"
 * filter/metric and Lama's own Appointments tab both read.
 */

export const APPOINTMENT_TYPE = {
  FOLLOW_UP: "patientAppointments.types.followUp",
  INITIAL: "patientAppointments.types.initial",
  REHAB_SESSION: "doctorPatients.appointmentTypes.rehabSession",
};

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
const clinicLocation = { type: "clinic", nameKey: "patientAppointments.location.clinicName", room: "4" };

export const buildInitialAppointments = (referenceDate = new Date()) => {
  const confirmedStart = atTime(dayOffset(5, referenceDate), 10, 0);
  const alternativeRequestedStart = atTime(dayOffset(3, referenceDate), 9, 30);
  const alternativeSuggestedStart = atTime(dayOffset(4, referenceDate), 11, 30);
  const declinedRequestedStart = atTime(dayOffset(2, referenceDate), 10, 0);
  const completed1Start = atTime(dayOffset(-14, referenceDate), 11, 0);
  const lamaRequestedStart = atTime(dayOffset(6, referenceDate), 10, 30);
  const saraConfirmedStart = atTime(dayOffset(2, referenceDate), 15, 0);
  const mohammedCompletedStart = atTime(dayOffset(-10, referenceDate), 9, 0);

  return [
    // ---- Ahmed Ali ----
    {
      id: "appt-ahmed-confirmed-1",
      patientId: "patient-ahmed",
      clinicianId: DEFAULT_CLINICIAN_ID,
      startAt: confirmedStart.toISOString(),
      endAt: new Date(confirmedStart.getTime() + HALF_HOUR_MS).toISOString(),
      typeKey: APPOINTMENT_TYPE.FOLLOW_UP,
      reasonCode: "reviewProgress",
      note: null,
      status: APPOINTMENT_STATUS.CONFIRMED,
      requestedAt: dayOffset(-4, referenceDate).toISOString(),
      reviewedAt: dayOffset(-3, referenceDate).toISOString(),
      clinicianResponse: null,
      location: clinicLocation,
      source: APPOINTMENT_SOURCE.PATIENT,
    },
    {
      id: "appt-ahmed-alternative-1",
      patientId: "patient-ahmed",
      clinicianId: DEFAULT_CLINICIAN_ID,
      startAt: alternativeRequestedStart.toISOString(),
      endAt: new Date(alternativeRequestedStart.getTime() + HALF_HOUR_MS).toISOString(),
      typeKey: APPOINTMENT_TYPE.FOLLOW_UP,
      reasonCode: "painIncreased",
      note: null,
      status: APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED,
      requestedAt: dayOffset(-1, referenceDate).toISOString(),
      reviewedAt: dayOffset(0, referenceDate).toISOString(),
      clinicianResponse: {
        messageKey: "patientAppointments.doctorResponses.alternative1",
        suggestedStartAt: alternativeSuggestedStart.toISOString(),
        suggestedEndAt: new Date(alternativeSuggestedStart.getTime() + HALF_HOUR_MS).toISOString(),
        followUpLabelKey: null,
      },
      location: clinicLocation,
      source: APPOINTMENT_SOURCE.PATIENT,
    },
    {
      id: "appt-ahmed-declined-1",
      patientId: "patient-ahmed",
      clinicianId: DEFAULT_CLINICIAN_ID,
      startAt: declinedRequestedStart.toISOString(),
      endAt: new Date(declinedRequestedStart.getTime() + HALF_HOUR_MS).toISOString(),
      typeKey: APPOINTMENT_TYPE.FOLLOW_UP,
      reasonCode: "reviewProgress",
      note: null,
      status: APPOINTMENT_STATUS.DECLINED,
      requestedAt: dayOffset(-3, referenceDate).toISOString(),
      reviewedAt: dayOffset(-2, referenceDate).toISOString(),
      clinicianResponse: {
        messageKey: "patientAppointments.doctorResponses.declined1",
        suggestedStartAt: null,
        suggestedEndAt: null,
        followUpLabelKey: "patientAppointments.followUp.nextWeek",
      },
      location: clinicLocation,
      source: APPOINTMENT_SOURCE.PATIENT,
    },
    {
      id: "appt-ahmed-completed-1",
      patientId: "patient-ahmed",
      clinicianId: DEFAULT_CLINICIAN_ID,
      startAt: completed1Start.toISOString(),
      endAt: new Date(completed1Start.getTime() + HALF_HOUR_MS).toISOString(),
      typeKey: APPOINTMENT_TYPE.FOLLOW_UP,
      reasonCode: "generalFollowUp",
      note: null,
      status: APPOINTMENT_STATUS.COMPLETED,
      requestedAt: dayOffset(-20, referenceDate).toISOString(),
      reviewedAt: dayOffset(-19, referenceDate).toISOString(),
      clinicianResponse: null,
      location: clinicLocation,
      source: APPOINTMENT_SOURCE.PATIENT,
    },

    // ---- Sara Almutairi ----
    {
      id: "appt-sara-confirmed-1",
      patientId: "patient-sara",
      clinicianId: DEFAULT_CLINICIAN_ID,
      startAt: saraConfirmedStart.toISOString(),
      endAt: new Date(saraConfirmedStart.getTime() + HALF_HOUR_MS).toISOString(),
      typeKey: APPOINTMENT_TYPE.FOLLOW_UP,
      reasonCode: "exerciseDifficulty",
      note: null,
      status: APPOINTMENT_STATUS.CONFIRMED,
      requestedAt: dayOffset(-2, referenceDate).toISOString(),
      reviewedAt: dayOffset(-1, referenceDate).toISOString(),
      clinicianResponse: null,
      location: clinicLocation,
      source: APPOINTMENT_SOURCE.DOCTOR,
    },

    // ---- Mohammed Aziz ----
    {
      id: "appt-mohammed-completed-1",
      patientId: "patient-mohammed",
      clinicianId: DEFAULT_CLINICIAN_ID,
      startAt: mohammedCompletedStart.toISOString(),
      endAt: new Date(mohammedCompletedStart.getTime() + HALF_HOUR_MS).toISOString(),
      typeKey: APPOINTMENT_TYPE.FOLLOW_UP,
      reasonCode: "reviewProgress",
      note: null,
      status: APPOINTMENT_STATUS.COMPLETED,
      requestedAt: dayOffset(-16, referenceDate).toISOString(),
      reviewedAt: dayOffset(-15, referenceDate).toISOString(),
      clinicianResponse: null,
      location: clinicLocation,
      source: APPOINTMENT_SOURCE.PATIENT,
    },

    // ---- Lama Khaled (pending request — the brief's own example patient) ----
    {
      id: "appt-lama-requested-1",
      patientId: "patient-lama",
      clinicianId: DEFAULT_CLINICIAN_ID,
      startAt: lamaRequestedStart.toISOString(),
      endAt: new Date(lamaRequestedStart.getTime() + HALF_HOUR_MS).toISOString(),
      typeKey: APPOINTMENT_TYPE.FOLLOW_UP,
      reasonCode: "romConcern",
      note: null,
      status: APPOINTMENT_STATUS.REQUESTED,
      requestedAt: dayOffset(-1, referenceDate).toISOString(),
      reviewedAt: null,
      clinicianResponse: null,
      location: clinicLocation,
      source: APPOINTMENT_SOURCE.PATIENT,
    },
  ];
};
