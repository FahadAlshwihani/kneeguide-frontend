import { getTodaySessionPlan } from "../data/patientRehabPlanData";

/**
 * MOCK / DETERMINISTIC "KneeGuide Insight" selection for Patient Profile —
 * the profile-domain counterpart to session/patientSessionInsights.js,
 * reports/patientReportInsights.js, and appointments/
 * patientAppointmentInsights.js. Same architecture, same guardrails: no
 * `Math.random`, no generated prose, no diagnosis/prediction — each
 * function below returns AT MOST one `{ messageKey, values, tone }` (or
 * `null`, meaning "don't show a card here" — Section 29's "one insight per
 * meaningful section, not beside every field"), and only ever reasons from
 * numbers/flags that genuinely exist elsewhere in this codebase. The
 * caller resolves `messageKey`/`values` with `t()`; these functions never
 * touch i18n themselves.
 *
 * Overview and Medical intentionally read the same small `user` shape
 * PatientProfile.jsx already builds (rehabPhase/goal) rather than a second
 * "profile domain model" — there's no dedicated Profile API/data module in
 * this project to draw from (audited: PatientProfile's own `user` object
 * has always been the only source), so introducing one here would be new,
 * unrequested architecture, not a reuse of something that already exists.
 */

const QUALITY_RANK = { fair: 0, good: 1, excellent: 2 };

export const PROFILE_INSIGHT_TONE = {
  POSITIVE: "positive",
  NEUTRAL: "neutral",
  CAUTION: "caution",
};

/** Overview tab — ties the week's adherence to the patient's current rehab phase. */
export const getOverviewInsight = ({ rehabPhase, adherence }) => {
  if (!adherence) return null;
  const tone = adherence.completionPercentage >= 70 ? PROFILE_INSIGHT_TONE.POSITIVE : PROFILE_INSIGHT_TONE.NEUTRAL;
  return {
    messageKey: "patientProfile.insight.overview",
    values: { percent: adherence.completionPercentage, phase: rehabPhase },
    tone,
  };
};

/** Medical tab — restates the rehab phase as it relates to the latest clinical note, never a second diagnosis. */
export const getMedicalInsight = ({ rehabPhase }) => {
  if (!rehabPhase) return null;
  return {
    messageKey: "patientProfile.insight.medical",
    values: { phase: rehabPhase },
    tone: PROFILE_INSIGHT_TONE.NEUTRAL,
  };
};

/**
 * Rehab tab — adherence headline, PLUS (Section 11) a second, more
 * specific sentence naming whichever prescribed exercise's own
 * `previous.qualityKey` (patientRehabPlanData.js — real prior-session mock
 * data, not invented here) ranks highest, ONLY when that data actually
 * exists and isn't a flat tie across every exercise (a tie carries no real
 * signal, so the safer single-sentence insight is used instead).
 */
export const getRehabInsight = ({ adherence }) => {
  if (!adherence) return null;

  const plan = getTodaySessionPlan();
  const ranked = [...plan].sort((a, b) => (QUALITY_RANK[b.previous.qualityKey] ?? 0) - (QUALITY_RANK[a.previous.qualityKey] ?? 0));
  const best = ranked[0];
  const hasClearLeader = best && ranked.every((item) => item.exerciseId === best.exerciseId || QUALITY_RANK[item.previous.qualityKey] < QUALITY_RANK[best.previous.qualityKey]);

  const tone = adherence.missedThisWeek === 0 ? PROFILE_INSIGHT_TONE.POSITIVE : PROFILE_INSIGHT_TONE.NEUTRAL;

  if (hasClearLeader && best?.catalog?.nameKey) {
    return {
      messageKey: "patientProfile.insight.rehabWithLeader",
      values: { percent: adherence.completionPercentage, exerciseNameKey: best.catalog.nameKey },
      tone,
    };
  }

  return {
    messageKey: "patientProfile.insight.rehab",
    values: { percent: adherence.completionPercentage, missed: adherence.missedThisWeek },
    tone,
  };
};

/**
 * Devices tab — ONLY returns something once a device is actually
 * connected (Section 15); the disconnected empty state already carries
 * its own explanatory copy, so a second insight card there would be noise
 * (Section 29). Deliberately does NOT claim tracking "starts
 * automatically" — audited first: `SENSOR_CONNECTED`
 * (session/patientSessionMetrics.js) is a static flag, not something this
 * device connection actually flips, so promising automatic behavior that
 * isn't wired up would be exactly the kind of overclaim Section 15 warns
 * against.
 */
export const getDevicesInsight = ({ connectedDevice }) => {
  if (!connectedDevice) return null;
  return {
    messageKey: "patientProfile.insight.deviceConnected",
    values: { name: connectedDevice.name },
    tone: PROFILE_INSIGHT_TONE.POSITIVE,
  };
};
