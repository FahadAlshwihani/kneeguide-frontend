import { rehabRepository } from "../../../../domain/rehab/useRehabDomain";
import { PATIENT_PROFILE_PATIENT_ID, DEFAULT_CLINICIAN_ID } from "../../../../domain/rehab/demoData/patients";
import { APPOINTMENT_STATUS } from "../../../../domain/rehab/rehabEnums";
import { getClinicianAvailability, DEFAULT_CLINICIAN } from "../data/patientAppointmentsData";

/**
 * THIN WRAPPER over the shared rehab domain's appointment actions
 * (src/domain/rehab/rehabRepository.js) — the Patient side's appointment
 * RECORDS now live there (shared with the Doctor side, Section 26 of the
 * Doctor Patients module brief), but every function this module exported
 * before keeps its exact name/signature/return shape (including reviving
 * ISO-string dates back into real `Date` objects, since every existing
 * caller — PatientAppointments.jsx, AppointmentRequestFlow.jsx, the
 * Assistant's REQUEST_APPOINTMENT action — calls `.getTime()`/
 * `.toLocaleDateString()` on them directly).
 */

const reviveDate = (value) => (value ? new Date(value) : null);

const reviveAppointment = (appt) => ({
  ...appt,
  clinician: DEFAULT_CLINICIAN,
  startAt: reviveDate(appt.startAt),
  endAt: reviveDate(appt.endAt),
  requestedAt: reviveDate(appt.requestedAt),
  reviewedAt: reviveDate(appt.reviewedAt),
  clinicianResponse: appt.clinicianResponse
    ? {
        ...appt.clinicianResponse,
        suggestedStartAt: reviveDate(appt.clinicianResponse.suggestedStartAt),
        suggestedEndAt: reviveDate(appt.clinicianResponse.suggestedEndAt),
      }
    : null,
});

export const getAllAppointments = () => rehabRepository.getAppointments(PATIENT_PROFILE_PATIENT_ID).map(reviveAppointment);

export const getAppointmentById = (id) => {
  const found = rehabRepository.getAppointmentById(id);
  return found && found.patientId === PATIENT_PROFILE_PATIENT_ID ? reviveAppointment(found) : null;
};

export const getNextConfirmedAppointment = (referenceDate = new Date()) =>
  getAllAppointments().find((appointment) => appointment.status === APPOINTMENT_STATUS.CONFIRMED && appointment.startAt > referenceDate) ||
  null;

export const getUpcomingAppointments = (referenceDate = new Date()) =>
  getAllAppointments().filter((appointment) => appointment.status === APPOINTMENT_STATUS.CONFIRMED && appointment.startAt > referenceDate);

export const getRequestAppointments = () =>
  getAllAppointments().filter((appointment) =>
    [APPOINTMENT_STATUS.REQUESTED, APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED, APPOINTMENT_STATUS.DECLINED].includes(appointment.status)
  );

export const getPastAppointments = () =>
  getAllAppointments()
    .filter((appointment) => [APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELLED].includes(appointment.status))
    .sort((a, b) => b.startAt - a.startAt);

export const getAvailability = (referenceDate = new Date(), days = 7) => {
  const confirmedStartTimes = getAllAppointments()
    .filter((appointment) => appointment.status === APPOINTMENT_STATUS.CONFIRMED)
    .map((appointment) => appointment.startAt);
  return getClinicianAvailability(DEFAULT_CLINICIAN, { fromDate: referenceDate, days, bookedStartTimes: confirmedStartTimes });
};

export const submitAppointmentRequest = ({ reasonCode, note, startAt, endAt, typeKey = "patientAppointments.types.followUp" }) => {
  const result = rehabRepository.requestAppointment(PATIENT_PROFILE_PATIENT_ID, {
    reasonCode,
    note,
    startAt: startAt.toISOString(),
    endAt: endAt ? endAt.toISOString() : null,
    typeKey,
    clinicianId: DEFAULT_CLINICIAN_ID,
  });
  return result.ok ? { ok: true, appointment: reviveAppointment(result.appointment) } : result;
};

export const acceptAlternative = (appointmentId) => {
  const result = rehabRepository.acceptAlternative(appointmentId);
  return result.ok ? { ok: true, appointment: reviveAppointment(result.appointment) } : result;
};

export const chooseAnotherTime = (appointmentId, { startAt, endAt }) => {
  const result = rehabRepository.chooseAnotherTime(appointmentId, {
    startAt: startAt.toISOString(),
    endAt: endAt ? endAt.toISOString() : null,
  });
  return result.ok ? { ok: true, appointment: reviveAppointment(result.appointment) } : result;
};

/** Dev-only escape hatch — resets the ENTIRE shared demo domain, not just appointments (superset of the old behavior). */
export const resetAppointmentOverrides = () => rehabRepository.resetDemoDomain();
