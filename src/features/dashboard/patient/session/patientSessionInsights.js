/**
 * MOCK / DETERMINISTIC KneeGuide insight selection — a small, bounded
 * dictionary of message templates chosen by comparing already-collected
 * mock metrics, never a generative or randomized text source. This is
 * intentionally the ONE place that picks WHICH message applies; the UI
 * (KneeGuideInsightCard, rendered from SessionExerciseSequence.jsx) only
 * ever consumes `{ severity, messageKey, values }` and calls
 * `t(messageKey, values)` — it never constructs medical-sounding
 * reasoning itself. This is the seam a real backend/AI analysis endpoint
 * would fill later (returning the same shape) without the card component
 * changing.
 *
 * Guardrails followed deliberately: no dosage/prescription-style
 * instructions ("increase resistance by X%"), no diagnostic claims, no
 * statements about medical devices/conditions healing. Every template is
 * a qualitative movement/comfort observation plus conservative,
 * plan-following guidance.
 */

export const INSIGHT_SEVERITY = {
  POSITIVE: "positive",
  NEUTRAL: "neutral",
  CAUTION: "caution",
};

const ROM_IMPROVEMENT_THRESHOLD = 3;

/** Between-exercise insight — compares this exercise's average ROM against its previous-session value. */
export const getExerciseInsight = ({ averageRom, previousRom }) => {
  const delta = averageRom - previousRom;

  if (delta >= ROM_IMPROVEMENT_THRESHOLD) {
    return {
      severity: INSIGHT_SEVERITY.POSITIVE,
      messageKey: "patientExercises.session.insights.exerciseImproved",
      values: { delta },
    };
  }

  if (delta <= -ROM_IMPROVEMENT_THRESHOLD) {
    return {
      severity: INSIGHT_SEVERITY.CAUTION,
      messageKey: "patientExercises.session.insights.exerciseReduced",
      values: {},
    };
  }

  return {
    severity: INSIGHT_SEVERITY.NEUTRAL,
    messageKey: "patientExercises.session.insights.exerciseMaintained",
    values: {},
  };
};

/** End-of-session recovery insight — the one moment allowed to reference pain trend, still conservatively worded. */
export const getSessionInsight = ({ painBefore, painAfter }) => {
  if (typeof painBefore === "number" && typeof painAfter === "number" && painAfter > painBefore) {
    return {
      severity: INSIGHT_SEVERITY.CAUTION,
      messageKey: "patientExercises.session.insights.sessionPainIncreased",
      values: {},
    };
  }

  if (typeof painBefore === "number" && typeof painAfter === "number" && painAfter < painBefore) {
    return {
      severity: INSIGHT_SEVERITY.POSITIVE,
      messageKey: "patientExercises.session.insights.sessionPainDecreased",
      values: {},
    };
  }

  return {
    severity: INSIGHT_SEVERITY.NEUTRAL,
    messageKey: "patientExercises.session.insights.sessionConsistent",
    values: {},
  };
};

/**
 * A short, bounded list of post-session recommendation lines — never
 * arbitrary lifestyle advice (Section 18's own "do not recommend
 * nutrition" example). Pain-aware: an increase surfaces the
 * "keep activity light" line; otherwise it's omitted.
 */
export const getPostSessionRecommendations = ({ painIncreased }) => {
  const keys = ["patientExercises.session.recommendations.followPlan"];
  if (painIncreased) {
    keys.push("patientExercises.session.recommendations.lightActivity");
  }
  keys.push("patientExercises.session.recommendations.monitor");
  keys.push("patientExercises.session.recommendations.contactClinician");
  return keys;
};
