/**
 * Pure, deterministic math over the report domain model
 * (data/patientReportsData.js) — no React, no i18n, no randomness.
 * Every function here operates on a plain array of report objects; the
 * CALLER is responsible for chronological ordering where it matters
 * (Section 24: table display order must never influence trend math).
 * `patientReportInsights.js` maps these numbers to translation keys —
 * this file only ever returns numbers/booleans/null, never prose.
 */

export const getPainValue = (report) => (typeof report.pain?.after === "number" ? report.pain.after : report.pain?.before ?? null);
export const getFlexionValue = (report) => (typeof report.rom?.flexion === "number" ? report.rom.flexion : null);
export const getExtensionValue = (report) => (typeof report.rom?.extension === "number" ? report.rom.extension : null);

/** Ascending by date — the ONE chronological ordering every metric/insight function assumes as input. */
export const sortChronological = (reports) => [...reports].sort((a, b) => a.date - b.date);

/** Keeps only reports within the last `rangeDays` (inclusive) of `referenceDate`. `rangeDays` of `null` means "all time". */
export const filterByRange = (reports, rangeDays, referenceDate = new Date()) => {
  if (!rangeDays) return reports;
  const cutoff = new Date(referenceDate);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - rangeDays);
  return reports.filter((report) => report.date >= cutoff);
};

const average = (reports, valueGetter) => {
  const values = reports.map(valueGetter).filter((value) => typeof value === "number");
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const getAveragePain = (reports) => average(reports, getPainValue);

/**
 * The average of `valueGetter` across the `windowSize` reports
 * immediately BEFORE `currentWindow` inside the full chronological list
 * — used for "↓ 1.8 vs previous 5 sessions"-style comparisons. Returns
 * `null` when there's no earlier history to compare against (rather than
 * comparing against an empty/fabricated baseline).
 */
export const getPreviousWindowAverage = (allChronological, currentWindow, valueGetter, windowSize = 5) => {
  if (currentWindow.length === 0) return null;
  const indexInFull = allChronological.findIndex((report) => report.id === currentWindow[0].id);
  if (indexInFull <= 0) return null;
  const previousSlice = allChronological.slice(Math.max(0, indexInFull - windowSize), indexInFull);
  return average(previousSlice, valueGetter);
};

/** Oldest/newest report that actually HAS a value for `valueGetter`, within an already-chronological array. */
export const getBoundaryValues = (chronologicalReports, valueGetter) => {
  const withValue = chronologicalReports.filter((report) => typeof valueGetter(report) === "number");
  if (withValue.length === 0) return { oldest: null, newest: null };
  return { oldest: valueGetter(withValue[0]), newest: valueGetter(withValue[withValue.length - 1]) };
};

/** newest - oldest, or `null` if fewer than two data points exist. */
export const getDelta = (chronologicalReports, valueGetter) => {
  const { oldest, newest } = getBoundaryValues(chronologicalReports, valueGetter);
  if (oldest === null || newest === null) return null;
  return newest - oldest;
};

export const getCompletionCounts = (reports) => ({
  completed: reports.filter((report) => report.sessionStatus === "completed").length,
  total: reports.length,
});

export const getCompletionRate = (reports) => {
  if (reports.length === 0) return null;
  const { completed, total } = getCompletionCounts(reports);
  return completed / total;
};

/**
 * `(oldValue - newValue) / oldValue * 100` — positive means "the value
 * went down" (the correct direction for a pain-style "lower is better"
 * metric). Returns `null` whenever `oldValue` is 0/missing, since a
 * percentage of a zero baseline is meaningless, never a fabricated
 * divide-by-zero result (Section 6/37.F).
 */
export const getPercentChange = (oldValue, newValue) => {
  if (typeof oldValue !== "number" || typeof newValue !== "number" || oldValue === 0) return null;
  return ((oldValue - newValue) / oldValue) * 100;
};

/** A compact strip of "best so far" facts (Section 22) — plain aggregation, no interpretation. */
export const getMilestones = (reports) => {
  const flexionValues = reports.map(getFlexionValue).filter((value) => typeof value === "number");
  const painValues = reports.map(getPainValue).filter((value) => typeof value === "number");
  const { completed, total } = getCompletionCounts(reports);
  return {
    bestFlexion: flexionValues.length > 0 ? Math.max(...flexionValues) : null,
    lowestPain: painValues.length > 0 ? Math.min(...painValues) : null,
    sessionsTracked: total,
    completedSessions: completed,
  };
};
