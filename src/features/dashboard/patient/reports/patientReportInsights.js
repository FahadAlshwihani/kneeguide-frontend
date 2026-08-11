import { getPainValue, getFlexionValue, getExtensionValue, getBoundaryValues, getPercentChange, getCompletionCounts } from "./patientReportMetrics";

/**
 * MOCK / DETERMINISTIC recovery-insight selection — the multi-session
 * counterpart to session/patientSessionInsights.js (which stays
 * untouched and exercise/session-scoped). Same architecture, same
 * guardrails: a small bounded dictionary of message templates chosen by
 * comparing already-computed numbers, never generated prose, never a
 * diagnostic claim. `getRecoveryFacts` is the ONE place that turns a
 * chronological report list into structured numbers; everything else in
 * this file only branches on those numbers to pick a translation key.
 *
 * Three DISTINCT insight granularities exist in this feature, kept
 * deliberately separate rather than merged into one generic "AI insight"
 * (Section 19):
 *   - Exercise Insight   (session/patientSessionInsights.js, unchanged)
 *   - Session Insight    (getReportComparisonInsight below — ONE report
 *                          vs the immediately previous one)
 *   - Recovery Insight   (getRecoveryInsight below — the last few
 *                          reports as a trend)
 */

export const INSIGHT_SEVERITY = {
  POSITIVE: "positive",
  NEUTRAL: "neutral",
  CAUTION: "caution",
};

const TREND_DIRECTION = {
  IMPROVING: "improving",
  STABLE: "stable",
  DECLINING: "declining",
  INSUFFICIENT_DATA: "insufficient_data",
};

const STRONGEST_IMPROVEMENT_PAIN_THRESHOLD = 30; // percent
const STRONGEST_IMPROVEMENT_FLEXION_THRESHOLD = 15; // degrees
const PAIN_DECLINE_THRESHOLD = -1; // pain got at least 1 point worse
const FLEXION_DECLINE_THRESHOLD = -5; // degrees

/**
 * Structured facts over the last `windowSize` CHRONOLOGICAL reports
 * (Section 5's schema) — the input array must already be sorted oldest
 * to newest (patientReportMetrics.js's sortChronological). Positive
 * `painDelta` means pain went DOWN (an improvement); positive
 * `flexionDelta`/`extensionDelta` mean the value went UP.
 */
export const getRecoveryFacts = (chronologicalReports, windowSize = 5) => {
  const window = chronologicalReports.slice(-windowSize);

  const { oldest: oldestPain, newest: newestPain } = getBoundaryValues(window, getPainValue);
  const { oldest: oldestFlexion, newest: newestFlexion } = getBoundaryValues(window, getFlexionValue);
  const { oldest: oldestExtension, newest: newestExtension } = getBoundaryValues(window, getExtensionValue);

  const painDelta = oldestPain !== null && newestPain !== null ? oldestPain - newestPain : null;
  const painPercentChange = getPercentChange(oldestPain, newestPain);
  const flexionDelta = oldestFlexion !== null && newestFlexion !== null ? newestFlexion - oldestFlexion : null;
  const extensionDelta = oldestExtension !== null && newestExtension !== null ? newestExtension - oldestExtension : null;

  const { completed: completedSessions, total: sessionCount } = getCompletionCounts(window);
  const completionRate = sessionCount === 0 ? null : completedSessions / sessionCount;

  const hasEnoughHistory = window.length >= 2 && (painDelta !== null || flexionDelta !== null);

  let trendDirection = TREND_DIRECTION.INSUFFICIENT_DATA;
  if (hasEnoughHistory) {
    const painWorsened = painDelta !== null && painDelta <= PAIN_DECLINE_THRESHOLD;
    const flexionWorsened = flexionDelta !== null && flexionDelta <= FLEXION_DECLINE_THRESHOLD;
    const painImproved = painDelta !== null && painDelta > 0;
    const flexionImproved = flexionDelta !== null && flexionDelta > 0;

    if (painWorsened || flexionWorsened) trendDirection = TREND_DIRECTION.DECLINING;
    else if (painImproved || flexionImproved) trendDirection = TREND_DIRECTION.IMPROVING;
    else trendDirection = TREND_DIRECTION.STABLE;
  }

  let strongestImprovement = null;
  if (painPercentChange !== null && painPercentChange >= STRONGEST_IMPROVEMENT_PAIN_THRESHOLD) {
    strongestImprovement = "pain";
  } else if (flexionDelta !== null && flexionDelta >= STRONGEST_IMPROVEMENT_FLEXION_THRESHOLD) {
    strongestImprovement = "flexion";
  }

  let consistency = "low";
  if (completionRate !== null) {
    if (completionRate >= 0.8) consistency = "high";
    else if (completionRate >= 0.5) consistency = "moderate";
  }

  return {
    sessionCount: window.length,
    completedSessions,
    completionRate,
    oldestPain,
    newestPain,
    painDelta,
    painPercentChange,
    oldestFlexion,
    newestFlexion,
    flexionDelta,
    oldestExtension,
    newestExtension,
    extensionDelta,
    trendDirection,
    strongestImprovement,
    consistency,
    hasEnoughHistory,
  };
};

/** PAGE-LEVEL "KneeGuide Recovery Insight" — the main narrative (Section 4/6). */
export const getRecoveryInsight = (facts) => {
  if (facts.sessionCount === 0) return null;

  if (!facts.hasEnoughHistory) {
    return {
      severity: INSIGHT_SEVERITY.NEUTRAL,
      messageKey: "patientReports.insights.recovery.insufficientHistory",
      values: {},
    };
  }

  if (facts.trendDirection === TREND_DIRECTION.IMPROVING) {
    if (facts.oldestPain !== null && facts.newestPain !== null && facts.oldestFlexion !== null && facts.newestFlexion !== null) {
      return {
        severity: INSIGHT_SEVERITY.POSITIVE,
        messageKey: "patientReports.insights.recovery.improvingFull",
        values: {
          count: facts.sessionCount,
          oldPain: facts.oldestPain,
          newPain: facts.newestPain,
          oldFlexion: facts.oldestFlexion,
          newFlexion: facts.newestFlexion,
        },
      };
    }
    return {
      severity: INSIGHT_SEVERITY.POSITIVE,
      messageKey: "patientReports.insights.recovery.improvingPartial",
      values: { count: facts.sessionCount },
    };
  }

  if (facts.trendDirection === TREND_DIRECTION.DECLINING) {
    return {
      severity: INSIGHT_SEVERITY.CAUTION,
      messageKey: "patientReports.insights.recovery.declining",
      values: { count: facts.sessionCount },
    };
  }

  return {
    severity: INSIGHT_SEVERITY.NEUTRAL,
    messageKey: "patientReports.insights.recovery.stable",
    values: { count: facts.sessionCount },
  };
};

/** The short line under the trend charts (Section 10). */
export const getTrendExplanation = (facts) => {
  if (!facts.hasEnoughHistory) return null;

  const painImproving = facts.painDelta !== null && facts.painDelta > 0;
  const painStable = facts.painDelta !== null && Math.abs(facts.painDelta) < 1;
  const flexionImproving = facts.flexionDelta !== null && facts.flexionDelta > 0;

  if (painImproving && flexionImproving) {
    return { messageKey: "patientReports.insights.trend.painDownRomUp" };
  }
  if (painStable && flexionImproving) {
    return { messageKey: "patientReports.insights.trend.romUpPainStable" };
  }
  if (facts.trendDirection === TREND_DIRECTION.DECLINING) {
    return { messageKey: "patientReports.insights.trend.reviewWithClinician" };
  }
  if (facts.trendDirection === TREND_DIRECTION.STABLE) {
    return { messageKey: "patientReports.insights.trend.bothStable" };
  }
  return { messageKey: "patientReports.insights.trend.mixed" };
};

/**
 * REPORT-LEVEL "Session Insight" (Section 18/19) — compares ONE report
 * against the immediately previous CHRONOLOGICAL report only. Returns
 * `null` when there is no previous report to compare against — never a
 * fabricated first-ever-session comparison.
 */
export const getReportComparisonInsight = (current, previous) => {
  if (!previous) return null;

  const currentPain = getPainValue(current);
  const previousPain = getPainValue(previous);
  const currentFlexion = getFlexionValue(current);
  const previousFlexion = getFlexionValue(previous);

  const painDelta = currentPain !== null && previousPain !== null ? previousPain - currentPain : null;
  const flexionDelta = currentFlexion !== null && previousFlexion !== null ? currentFlexion - previousFlexion : null;

  if (painDelta === null && flexionDelta === null) return null;

  if (flexionDelta !== null && flexionDelta > 0 && painDelta !== null && painDelta >= 0) {
    return {
      severity: INSIGHT_SEVERITY.POSITIVE,
      messageKey: "patientReports.insights.session.improvedBoth",
      values: { flexionDelta, painDelta },
    };
  }
  if (flexionDelta !== null && flexionDelta > 0) {
    return {
      severity: INSIGHT_SEVERITY.POSITIVE,
      messageKey: "patientReports.insights.session.flexionImproved",
      values: { flexionDelta },
    };
  }
  if (painDelta !== null && painDelta > 0) {
    return {
      severity: INSIGHT_SEVERITY.POSITIVE,
      messageKey: "patientReports.insights.session.painImproved",
      values: { painDelta },
    };
  }
  if ((flexionDelta !== null && flexionDelta < 0) || (painDelta !== null && painDelta < 0)) {
    return {
      severity: INSIGHT_SEVERITY.CAUTION,
      messageKey: "patientReports.insights.session.mixed",
      values: {},
    };
  }
  return {
    severity: INSIGHT_SEVERITY.NEUTRAL,
    messageKey: "patientReports.insights.session.stable",
    values: {},
  };
};
