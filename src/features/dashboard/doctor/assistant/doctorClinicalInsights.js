import { rehabRepository } from "../../../../domain/rehab/useRehabDomain";
import { sessionAverageRom } from "../../../../domain/rehab/rehabDerived";
import { ATTENTION_LEVEL, APPOINTMENT_STATUS, REPORT_STATUS } from "../../../../domain/rehab/rehabEnums";

/**
 * Pure, deterministic clinical-trend math for the Doctor Assistant — now
 * sourced ENTIRELY from the shared rehab domain (src/domain/rehab/),
 * never from a second hand-maintained patient dataset. This file used to
 * read data/doctorClinicalMockData.js (an independent AHMED/SARA/MOHAMMED
 * record with per-patient ad-hoc fields, never wired to the Doctor
 * Patients module or the Patient side) — that dependency is fully
 * removed. Every function below now takes a canonical `patientId` and
 * calls `rehabRepository.getPatientBundle(patientId)` — the EXACT same
 * builder DoctorPatientWorkspace's tabs and DoctorPatients.jsx's worklist
 * already use — so "how is Ahmed progressing?" can never disagree with
 * what the Workspace itself shows.
 *
 * `ATTENTION_SEVERITY` (the old HIGH/FOLLOW_UP/POSITIVE/NEUTRAL enum) is
 * retired — severity is now the canonical `ATTENTION_LEVEL`
 * (NEEDS_ATTENTION/REVIEW_RECOMMENDED/STABLE, domain/rehab/rehabEnums.js),
 * the same vocabulary the Doctor Patients list already renders.
 */

/** One patient's attention entry — the bundle IS the entry; nothing is re-shaped or re-derived. */
export const getPatientAttention = (patientId) => rehabRepository.getPatientBundle(patientId);

/** Every patient with a non-empty reason list, ranked NEEDS_ATTENTION -> REVIEW_RECOMMENDED -> STABLE. */
export const getPatientsNeedingAttention = () => rehabRepository.getPatientsNeedingAttention();

/** Count actually worth a doctor's attention — the SAME predicate DoctorPatients.jsx's own summary metric uses. */
export const getAttentionCount = () =>
  rehabRepository.getWorklistBundles().filter((bundle) => bundle.priority.level === ATTENTION_LEVEL.NEEDS_ATTENTION).length;

/** Appointments across every canonical patient whose start date is today. */
export const getTodayAppointments = (referenceDate = new Date()) => {
  const todayKey = referenceDate.toDateString();
  return rehabRepository.getAllAppointments().filter((appointment) => new Date(appointment.startAt).toDateString() === todayKey);
};

/** Every report currently awaiting clinician review, across every canonical patient. */
export const getNewReports = () =>
  rehabRepository
    .getWorklistBundles()
    .flatMap((bundle) => bundle.reports.filter((report) => report.reviewStatus === REPORT_STATUS.AWAITING_REVIEW).map((report) => ({ report, patient: bundle.patient })));

/**
 * The Clinical Brief's own three numbers (Doctor Home's welcome greeting
 * + the Topbar drawer's welcome brief) — ONE function so both surfaces
 * never risk reading two different counts for the same thing.
 */
export const getDoctorClinicalBrief = (referenceDate = new Date()) => ({
  appointmentsToday: getTodayAppointments(referenceDate).length,
  newReports: getNewReports().length,
  needAttentionCount: getAttentionCount(),
});

/**
 * Replaces the old `getAhmedTrend(patient)` — the values behind the
 * "how is {{name}} progressing?" answer, for ANY canonical patient (not
 * just Ahmed), derived from real sessions/adherence instead of a
 * hand-authored `flexionSeries`/`painSeries` pair.
 */
export const getPatientProgressSummary = (patientId) => {
  const bundle = rehabRepository.getPatientBundle(patientId);
  if (!bundle) return null;

  const { patient, adherence, sessions } = bundle;
  const latest = sessions[sessions.length - 1] || null;
  const previous = sessions[sessions.length - 2] || null;
  const oldest = sessions[0] || null;

  return {
    patient,
    completed: adherence.completed,
    prescribed: adherence.expected,
    percent: adherence.percent,
    flexionOldest: oldest ? sessionAverageRom(oldest) : null,
    flexionLatest: latest ? sessionAverageRom(latest) : null,
    flexionLatestSessionDelta: latest && previous ? sessionAverageRom(latest) - sessionAverageRom(previous) : null,
    painLatest: latest?.painAfter ?? null,
    painRecentAverage:
      sessions.length > 0
        ? Math.round((sessions.reduce((sum, session) => sum + (session.painAfter ?? 0), 0) / sessions.length) * 10) / 10
        : null,
    hasPendingReport: bundle.reports.some((report) => report.reviewStatus === REPORT_STATUS.AWAITING_REVIEW),
    hasPendingAppointment: bundle.appointments.some((appt) => appt.status === APPOINTMENT_STATUS.REQUESTED),
  };
};
