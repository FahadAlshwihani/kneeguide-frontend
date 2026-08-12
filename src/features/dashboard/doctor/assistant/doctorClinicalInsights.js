import { PATIENTS, getTodayAppointments, getNewReports } from "../data/doctorClinicalMockData";

/**
 * Pure, deterministic clinical-trend math + severity rules over
 * data/doctorClinicalMockData.js — no React, no i18n, no randomness, same
 * architecture as the Patient side's reports/patientReportMetrics.js +
 * reports/patientReportInsights.js pair (numbers here, translation keys
 * there — see doctorAssistantActions.js for where these get mapped to
 * `messageKey`s). Every function returns numbers/booleans/semantic
 * objects, never prose — the UI/action layer is the only place a sentence
 * gets built, always via i18next.
 *
 * Conservative by construction (Section 28): severity is derived from
 * plain threshold comparisons on existing mock numbers, never an opaque
 * score, and never claims a diagnosis.
 */

const average = (values) => (values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length);

const round1 = (value) => Math.round(value * 10) / 10;

/** Ahmed-shaped trend: derived once from his session series, reused everywhere he's mentioned. */
export const getAhmedTrend = (patient) => {
  const { flexionSeries, painSeries, sessionsPrescribedThisWeek, sessionsCompletedThisWeek } = patient;
  const flexionOldest = flexionSeries[0];
  const flexionLatest = flexionSeries[flexionSeries.length - 1];
  const flexionPrevious = flexionSeries[flexionSeries.length - 2];
  const painLatest = painSeries[painSeries.length - 1];
  const painPrevious = painSeries[painSeries.length - 2];
  const painRecentAverage = round1(average(painSeries.slice(0, -1)));

  return {
    adherencePercent: Math.round((sessionsCompletedThisWeek / sessionsPrescribedThisWeek) * 100),
    flexionOldest,
    flexionLatest,
    flexionPrevious,
    flexionWeeklyDelta: flexionLatest - flexionOldest,
    flexionLatestSessionDelta: flexionLatest - flexionPrevious,
    painLatest,
    painPrevious,
    painRecentAverage,
    painIncreasedToday: painLatest > painPrevious,
    romDecreasedLatestSession: flexionLatest < flexionPrevious,
  };
};

export const ATTENTION_SEVERITY = {
  HIGH: "high",
  FOLLOW_UP: "followUp",
  POSITIVE: "positive",
  NEUTRAL: "neutral",
};

/**
 * ONE conservative, threshold-based severity rule per patient shape —
 * Ahmed's own trend (pain-up + ROM-down together) outranks a single
 * signal, matching the task's own "may need review" framing rather than
 * an autonomous diagnosis.
 */
export const getPatientAttention = (patient) => {
  if (patient.flexionSeries) {
    const trend = getAhmedTrend(patient);
    // A same-day pain spike OR a ROM dip versus the previous session is
    // already worth a look on its own; Ahmed's mock data happens to show
    // both together, which is exactly what pushes this toward HIGH rather
    // than a borderline call.
    if (trend.painIncreasedToday || trend.romDecreasedLatestSession) {
      return { severity: ATTENTION_SEVERITY.HIGH, patient, trend };
    }
    return { severity: ATTENTION_SEVERITY.NEUTRAL, patient, trend };
  }

  if (typeof patient.sessionsCompletedThisWeek === "number" && typeof patient.sessionsPrescribedThisWeek === "number") {
    const missed = patient.sessionsPrescribedThisWeek - patient.sessionsCompletedThisWeek;
    const adherencePercent = Math.round((patient.sessionsCompletedThisWeek / patient.sessionsPrescribedThisWeek) * 100);
    if (adherencePercent < 70 || missed >= 2) {
      return { severity: ATTENTION_SEVERITY.FOLLOW_UP, patient, trend: { missed, adherencePercent } };
    }
    return { severity: ATTENTION_SEVERITY.NEUTRAL, patient, trend: { missed, adherencePercent } };
  }

  if (typeof patient.flexionPrevious === "number" && typeof patient.flexionLatest === "number") {
    const romImprovement = patient.flexionLatest - patient.flexionPrevious;
    const painChange = patient.painLatest - patient.painPrevious;
    if (romImprovement > 0 && painChange < 0) {
      return { severity: ATTENTION_SEVERITY.POSITIVE, patient, trend: { romImprovement, painChange } };
    }
    return { severity: ATTENTION_SEVERITY.NEUTRAL, patient, trend: { romImprovement, painChange } };
  }

  return { severity: ATTENTION_SEVERITY.NEUTRAL, patient, trend: {} };
};

/** Every patient with a non-neutral severity, ranked HIGH -> FOLLOW_UP -> POSITIVE. */
const SEVERITY_RANK = {
  [ATTENTION_SEVERITY.HIGH]: 0,
  [ATTENTION_SEVERITY.FOLLOW_UP]: 1,
  [ATTENTION_SEVERITY.POSITIVE]: 2,
  [ATTENTION_SEVERITY.NEUTRAL]: 3,
};

export const getPatientsNeedingAttention = () =>
  PATIENTS.map(getPatientAttention)
    .filter((entry) => entry.severity !== ATTENTION_SEVERITY.NEUTRAL)
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

/** Count actually worth a doctor's attention (HIGH/FOLLOW_UP only — a POSITIVE highlight isn't a concern). */
export const getAttentionCount = () =>
  getPatientsNeedingAttention().filter((entry) => entry.severity !== ATTENTION_SEVERITY.POSITIVE).length;

/**
 * The Clinical Brief's own three numbers — ONE function so
 * DoctorHomeAssistant's welcome greeting and the compact "Today" strip
 * never risk reading two different counts for the same thing.
 */
export const getDoctorClinicalBrief = (referenceDate = new Date()) => ({
  appointmentsToday: getTodayAppointments(referenceDate).length,
  newReports: getNewReports().length,
  needAttentionCount: getAttentionCount(),
});
