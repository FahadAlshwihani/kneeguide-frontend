import { APPOINTMENT_STATUS } from "../data/patientAppointmentsData";

/**
 * MOCK / DETERMINISTIC "KneeGuide Care Insight" selection — the
 * appointments-domain counterpart to session/patientSessionInsights.js
 * and reports/patientReportInsights.js. Same architecture, same
 * guardrails: ONE bounded priority list picks exactly one insight, never
 * several AI cards at once (Section 33), and a small dictionary maps the
 * chosen state to a translation key — never generated prose.
 *
 * Deliberately does NOT try to detect a "pain trend across recent
 * sessions" here: patientPainStorage.js only ever retains the single
 * LATEST pain value (audited before writing this — there is no real
 * multi-entry pain history anywhere in the app to compare against), and
 * Section 41 explicitly says not to deeply couple Appointments to
 * Reports. Inventing a trend from data that doesn't exist would be
 * exactly the kind of fabrication Section 34/62 forbid — so the priority
 * list below only ever reasons from real appointment-domain state.
 *
 * CLINICIAN PRECEDENCE (Section 34): a DECLINED request that carries an
 * explicit `clinicianResponse.followUpLabelKey` (e.g. "continue for
 * another week") is checked FIRST and, if present, is the only insight
 * shown — KneeGuide never simultaneously suggests booking a new
 * appointment when the clinician's own instruction says to wait.
 */

export const CARE_INSIGHT_TYPE = {
  CLINICIAN_FOLLOW_UP: "clinicianFollowUp",
  ALTERNATIVE_PROPOSED: "alternativeProposed",
  UPCOMING_SOON: "upcomingSoon",
  PENDING_REQUEST: "pendingRequest",
  NO_UPCOMING: "noUpcoming",
  NEUTRAL: "neutral",
};

const UPCOMING_SOON_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * `appointments` must be the full chronological list (patientAppointmentService.js's
 * `getAllAppointments()`); `now` is injectable for testability.
 */
export const getCareInsight = (appointments, now = new Date()) => {
  const mostRecentDeclinedWithFollowUp = [...appointments]
    .filter((appointment) => appointment.status === APPOINTMENT_STATUS.DECLINED && appointment.clinicianResponse?.followUpLabelKey)
    .sort((a, b) => (b.reviewedAt || 0) - (a.reviewedAt || 0))[0];

  if (mostRecentDeclinedWithFollowUp) {
    return {
      type: CARE_INSIGHT_TYPE.CLINICIAN_FOLLOW_UP,
      messageKey: "patientAppointments.insight.clinicianFollowUp",
      // `followUpKey` is itself a translation key (e.g. "next week"), not
      // a plain string — this module never calls `t()` (pure, no i18n
      // dependency, same as every other insight module in this feature),
      // so the CALLER resolves it first, then interpolates the resolved
      // text as `values.followUp` before rendering `messageKey`.
      values: { doctorName: mostRecentDeclinedWithFollowUp.clinician.name },
      followUpKey: mostRecentDeclinedWithFollowUp.clinicianResponse.followUpLabelKey,
      appointmentId: mostRecentDeclinedWithFollowUp.id,
      showRequestCta: false,
    };
  }

  const alternativeProposed = appointments.find((appointment) => appointment.status === APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED);
  if (alternativeProposed) {
    return {
      type: CARE_INSIGHT_TYPE.ALTERNATIVE_PROPOSED,
      messageKey: "patientAppointments.insight.alternativeProposed",
      values: { doctorName: alternativeProposed.clinician.name },
      appointmentId: alternativeProposed.id,
      showRequestCta: false,
    };
  }

  const nextConfirmed = appointments.find(
    (appointment) => appointment.status === APPOINTMENT_STATUS.CONFIRMED && appointment.startAt > now
  );
  if (nextConfirmed) {
    const daysAway = Math.ceil((nextConfirmed.startAt - now) / MS_PER_DAY);
    if (daysAway <= UPCOMING_SOON_DAYS) {
      return {
        type: CARE_INSIGHT_TYPE.UPCOMING_SOON,
        messageKey: "patientAppointments.insight.upcomingSoon",
        values: { doctorName: nextConfirmed.clinician.name, days: daysAway },
        appointmentId: nextConfirmed.id,
        showRequestCta: false,
      };
    }
  }

  const pendingRequest = appointments.find((appointment) => appointment.status === APPOINTMENT_STATUS.REQUESTED);
  if (pendingRequest) {
    return {
      type: CARE_INSIGHT_TYPE.PENDING_REQUEST,
      messageKey: "patientAppointments.insight.pendingRequest",
      values: {},
      appointmentId: pendingRequest.id,
      showRequestCta: false,
    };
  }

  if (!nextConfirmed) {
    return {
      type: CARE_INSIGHT_TYPE.NO_UPCOMING,
      messageKey: "patientAppointments.insight.noUpcoming",
      values: {},
      appointmentId: null,
      showRequestCta: true,
    };
  }

  return {
    type: CARE_INSIGHT_TYPE.NEUTRAL,
    messageKey: "patientAppointments.insight.neutral",
    values: { doctorName: nextConfirmed.clinician.name },
    appointmentId: nextConfirmed.id,
    showRequestCta: false,
  };
};
