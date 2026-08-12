import { rehabRepository } from "../../../../domain/rehab/useRehabDomain";
import { sessionAverageRom, deriveReportTrend } from "../../../../domain/rehab/rehabDerived";
import { ATTENTION_LEVEL, APPOINTMENT_STATUS, REPORT_STATUS, REPORT_TREND } from "../../../../domain/rehab/rehabEnums";

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
 * Every appointment across every canonical patient that needs a doctor
 * decision — REQUESTED (new ask) or ALTERNATIVE_PROPOSED-that-the-doctor-
 * themself-owns is excluded (that status means it's the PATIENT's turn).
 * This is the single source both the Doctor Appointments page's Requests
 * rail and the Assistant's PENDING_APPOINTMENT_REQUESTS action read, so the
 * two counts can never disagree.
 */
export const getPendingAppointmentRequests = (referenceDate = new Date()) =>
  rehabRepository
    .getAllAppointments()
    .filter((appointment) => appointment.status === APPOINTMENT_STATUS.REQUESTED)
    .map((appointment) => ({ appointment, patient: rehabRepository.getPatient(appointment.patientId) }))
    .sort((a, b) => new Date(a.appointment.startAt) - new Date(b.appointment.startAt));

const PENDING_REQUEST_PRIORITY_RANK = {
  [ATTENTION_LEVEL.NEEDS_ATTENTION]: 0,
  [ATTENTION_LEVEL.REVIEW_RECOMMENDED]: 1,
  [ATTENTION_LEVEL.STABLE]: 2,
};

/**
 * The single pending request the Appointments-page Assistant card should
 * lead with (Section 10 of the Assistant-integration brief) — ranked by
 * each requester's own canonical `priority.level`
 * (rehabRepository.getPatientBundle -> rehabDerived.derivePatientPriority,
 * the EXACT same ranking the Patients worklist already uses), not a new
 * hidden severity score. Ties break on soonest requested time. Returns
 * `null` when there is nothing pending — the caller decides what to say
 * instead, this function only ever answers "which one, if any."
 */
export const getPrioritizedPendingAppointmentRequest = () => {
  const pending = getPendingAppointmentRequests();
  if (pending.length === 0) return null;
  const enriched = pending.map(({ appointment, patient }) => ({ appointment, patient, bundle: rehabRepository.getPatientBundle(patient.id) }));
  enriched.sort((a, b) => {
    const rankDiff = PENDING_REQUEST_PRIORITY_RANK[a.bundle.priority.level] - PENDING_REQUEST_PRIORITY_RANK[b.bundle.priority.level];
    return rankDiff !== 0 ? rankDiff : new Date(a.appointment.startAt) - new Date(b.appointment.startAt);
  });
  return enriched[0];
};

/**
 * Real, derived pairs of upcoming CONFIRMED appointments whose times
 * actually overlap (Section 19/38 — never a fabricated "gap" suggestion).
 * With `scheduleAppointment`/the composer now checking
 * `rehabRepository.findSchedulingConflict` before every write, this should
 * normally be empty going forward; it stays honest about pre-existing data.
 */
export const getUpcomingScheduleConflicts = (referenceDate = new Date()) => {
  const confirmed = rehabRepository
    .getAllAppointments()
    .filter((appointment) => appointment.status === APPOINTMENT_STATUS.CONFIRMED && new Date(appointment.startAt) > referenceDate);

  const conflicts = [];
  for (let i = 0; i < confirmed.length; i += 1) {
    for (let j = i + 1; j < confirmed.length; j += 1) {
      const a = confirmed[i];
      const b = confirmed[j];
      if (new Date(a.startAt) < new Date(b.endAt) && new Date(b.startAt) < new Date(a.endAt)) {
        conflicts.push({ a, b, patientA: rehabRepository.getPatient(a.patientId), patientB: rehabRepository.getPatient(b.patientId) });
      }
    }
  }
  return conflicts;
};

/**
 * Every canonical report, across every patient, with its patient record
 * and its own `deriveReportTrend` classification attached (Section 8/9 of
 * the Doctor Reports brief) — the ONE list both the Global Reports page
 * and every report-related Assistant action read, sourced from the exact
 * same `bundle.reports` the Workspace Reports tab already renders.
 */
export const getAllReportsWithContext = () =>
  rehabRepository
    .getWorklistBundles()
    .flatMap((bundle) => bundle.reports.map((report) => ({ report, patient: bundle.patient, trend: deriveReportTrend(report) })))
    .sort((a, b) => new Date(b.report.periodEnd) - new Date(a.report.periodEnd));

/**
 * The chronologically previous report for the SAME patient (Section 19 —
 * the report detail view's "previous vs current" comparison), or `null`
 * when there isn't one. Never a fabricated baseline.
 */
export const getPreviousReportForPatient = (patientId, currentReportId) => {
  const ordered = rehabRepository.getReports(patientId).sort((a, b) => new Date(a.periodEnd) - new Date(b.periodEnd));
  const index = ordered.findIndex((report) => report.id === currentReportId);
  if (index <= 0) return null;
  return ordered[index - 1];
};

const REPORT_REVIEW_PRIORITY_RANK = {
  [REPORT_TREND.NEEDS_ATTENTION]: 0,
  [REPORT_TREND.STABLE]: 1,
  [REPORT_TREND.IMPROVING]: 2,
};

/**
 * The single awaiting-review report the Reports-page Assistant card
 * should lead with — ranked first by the report's OWN trend
 * (NEEDS_ATTENTION first, matching Section 13's "never an unexplained AI
 * score" — the ranking key IS the same trend already shown on the row),
 * tied-broken by the patient's live canonical priority level, then by
 * report recency. Returns `null` when nothing is awaiting review.
 */
export const getPrioritizedReportForReview = () => {
  const awaitingReview = getAllReportsWithContext().filter((entry) => entry.report.reviewStatus === REPORT_STATUS.AWAITING_REVIEW);
  if (awaitingReview.length === 0) return null;

  const ranked = [...awaitingReview].sort((a, b) => {
    const trendDiff = REPORT_REVIEW_PRIORITY_RANK[a.trend] - REPORT_REVIEW_PRIORITY_RANK[b.trend];
    if (trendDiff !== 0) return trendDiff;
    const bundleA = rehabRepository.getPatientBundle(a.patient.id);
    const bundleB = rehabRepository.getPatientBundle(b.patient.id);
    const priorityDiff = PENDING_REQUEST_PRIORITY_RANK[bundleA.priority.level] - PENDING_REQUEST_PRIORITY_RANK[bundleB.priority.level];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.report.periodEnd) - new Date(a.report.periodEnd);
  });
  return ranked[0];
};

/**
 * "Who improved?" / "Who regressed?" (Section 29-31) — looks only at each
 * patient's SINGLE most recent report (an older improving report doesn't
 * matter if a newer one shows regression) and groups by that report's own
 * `deriveReportTrend` classification. No combined numeric score, no
 * fabricated ranking beyond "does the most recent report show this
 * trend" — ties within a group are left unranked (recency only, since the
 * classification itself is already the ranking signal).
 */
export const getLatestReportTrendByPatient = () => {
  const latestPerPatient = new Map();
  getAllReportsWithContext().forEach((entry) => {
    if (!latestPerPatient.has(entry.patient.id)) latestPerPatient.set(entry.patient.id, entry);
  });
  const entries = Array.from(latestPerPatient.values());
  return {
    improved: entries.filter((entry) => entry.trend === REPORT_TREND.IMPROVING),
    regressed: entries.filter((entry) => entry.trend === REPORT_TREND.NEEDS_ATTENTION),
    stable: entries.filter((entry) => entry.trend === REPORT_TREND.STABLE),
  };
};

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
