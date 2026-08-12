import { ATTENTION_LEVEL, ATTENTION_REASON, APPOINTMENT_STATUS, REPORT_STATUS, TREND_DIRECTION, REPORT_TREND, WEEKDAY_ORDER } from "./rehabEnums";

/**
 * Pure derivation functions over plain domain data — no React, no
 * localStorage, no randomness (same architecture as the pre-refactor
 * reports/patientReportMetrics.js and doctor/assistant/
 * doctorClinicalInsights.js, which this module's priority logic is
 * directly adapted from). Every "fact" the UI shows that CAN be computed
 * from more primitive facts is computed here, once, so the Doctor
 * worklist, the Patient Workspace Overview, the Assistant, and generated
 * reports can never independently disagree (Section 57 of the brief:
 * "Derived values are NOT independently stored").
 */

const round1 = (value) => Math.round(value * 10) / 10;

export const sessionAverageRom = (session) => {
  const values = (session.exercises || []).map((exercise) => exercise.rom).filter((value) => typeof value === "number");
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const sortByDateAsc = (sessions) => [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));

/** Sessions completed within the trailing `days` window, ending at `now`. */
export const sessionsInWindow = (sessions, { days = 7, now = new Date() } = {}) => {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return sessions.filter((session) => new Date(session.date).getTime() >= cutoff && new Date(session.date).getTime() <= now.getTime());
};

/**
 * Adherence = completed sessions / expected sessions for the same window
 * (Section 18: "completed prescribed sessions / expected sessions" —
 * DERIVED, never doctor-editable). Expected-per-week is the prescribed
 * frequency shared by this patient's active exercises (every seed
 * patient prescribes all their exercises at the same weekly cadence, so
 * one number is meaningful; the max is taken defensively if that ever
 * stops being true).
 */
export const computeAdherence = ({ prescriptions, sessions, days = 7, now = new Date() }) => {
  const active = prescriptions.filter((rx) => rx.status === "active");
  const expected = active.length === 0 ? 0 : Math.max(...active.map((rx) => rx.frequencyPerWeek || 0));
  const completed = sessionsInWindow(sessions, { days, now }).length;
  const percent = expected === 0 ? null : Math.min(100, Math.round((completed / expected) * 100));
  return { completed, expected, percent, missed: expected === 0 ? 0 : Math.max(0, expected - completed) };
};

export const deriveLatestPain = (painLogs) => {
  if (!painLogs || painLogs.length === 0) return null;
  return [...painLogs].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))[0];
};

export const derivePainTrend = (painLogs, { count = 5 } = {}) => {
  if (!painLogs || painLogs.length === 0) return null;
  const sorted = [...painLogs].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
  const slice = sorted.slice(-count);
  return { from: slice[0].value, to: slice[slice.length - 1].value, series: slice };
};

export const deriveLatestRom = (sessions) => {
  const sorted = sortByDateAsc(sessions);
  const latest = sorted[sorted.length - 1];
  return latest ? sessionAverageRom(latest) : null;
};

export const deriveRomTrend = (sessions, { count = 5 } = {}) => {
  const sorted = sortByDateAsc(sessions);
  const slice = sorted.slice(-count).map((session) => ({ date: session.date, rom: sessionAverageRom(session) })).filter((point) => point.rom !== null);
  if (slice.length === 0) return null;
  return { from: slice[0].rom, to: slice[slice.length - 1].rom, series: slice };
};

/**
 * Patient attention/priority (Section 8/37) — deterministic threshold
 * rules over already-derived facts, returning REASON codes (translated at
 * render time) instead of prose. Deliberately conservative: a single
 * pending administrative item (an appointment request, a report awaiting
 * review) alone only reaches REVIEW_RECOMMENDED, never NEEDS_ATTENTION —
 * that tier is reserved for an actual clinical signal (pain up, ROM down,
 * missed sessions, low adherence), mirroring the pre-existing Doctor Home
 * Assistant's own severity split in doctorClinicalInsights.js.
 */
export const derivePatientPriority = ({ prescriptions, sessions, appointments, reports, painLogs, now = new Date() }) => {
  const reasons = [];
  const sorted = sortByDateAsc(sessions);
  const latest = sorted[sorted.length - 1] || null;
  const previous = sorted[sorted.length - 2] || null;

  if (latest && previous) {
    if (typeof latest.painAfter === "number" && typeof previous.painAfter === "number" && latest.painAfter - previous.painAfter >= 1) {
      reasons.push({ code: ATTENTION_REASON.PAIN_INCREASED, delta: round1(latest.painAfter - previous.painAfter) });
    }
    const latestRom = sessionAverageRom(latest);
    const previousRom = sessionAverageRom(previous);
    if (latestRom !== null && previousRom !== null && latestRom < previousRom) {
      reasons.push({ code: ATTENTION_REASON.ROM_REGRESSION, delta: latestRom - previousRom });
    }
  }

  const adherence = computeAdherence({ prescriptions, sessions, now });
  if (adherence.expected > 0 && (adherence.percent < 70 || adherence.missed >= 2)) {
    reasons.push({ code: ATTENTION_REASON.MISSED_SESSIONS, missed: adherence.missed, adherencePercent: adherence.percent });
  }

  const pendingAppointment = appointments.some(
    (appt) => appt.status === APPOINTMENT_STATUS.REQUESTED || appt.status === APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED
  );
  if (pendingAppointment) reasons.push({ code: ATTENTION_REASON.APPOINTMENT_PENDING });

  const awaitingReport = reports.some((report) => report.reviewStatus === REPORT_STATUS.AWAITING_REVIEW);
  if (awaitingReport) reasons.push({ code: ATTENTION_REASON.REPORT_AWAITING_REVIEW });

  const clinicalReasons = reasons.filter((reason) =>
    [ATTENTION_REASON.PAIN_INCREASED, ATTENTION_REASON.ROM_REGRESSION, ATTENTION_REASON.MISSED_SESSIONS].includes(reason.code)
  );

  let level = ATTENTION_LEVEL.STABLE;
  if (clinicalReasons.length > 0) level = ATTENTION_LEVEL.NEEDS_ATTENTION;
  else if (reasons.length > 0) level = ATTENTION_LEVEL.REVIEW_RECOMMENDED;

  return { level, reasons, adherence };
};

/** Overview tab's "trend summary" (Section 11) — one word, derived from the same priority reasons. */
export const deriveTrendDirection = (priority) => {
  if (priority.reasons.some((reason) => [ATTENTION_REASON.PAIN_INCREASED, ATTENTION_REASON.ROM_REGRESSION].includes(reason.code))) {
    return TREND_DIRECTION.REQUIRES_REVIEW;
  }
  if (priority.level === ATTENTION_LEVEL.STABLE) return TREND_DIRECTION.IMPROVING;
  return TREND_DIRECTION.STABLE;
};

/**
 * Deterministic report snapshot generation (Section 23) — summarizes a
 * period strictly from sessions that fall inside it. Returns `null` if
 * there is nothing to summarize (no empty/fabricated report).
 */
export const generateReportMetrics = ({ prescriptions, sessions, periodStart, periodEnd }) => {
  const start = new Date(periodStart).getTime();
  const end = new Date(periodEnd).getTime();
  const periodSessions = sortByDateAsc(
    sessions.filter((session) => {
      const t = new Date(session.date).getTime();
      return t >= start && t <= end;
    })
  );
  if (periodSessions.length === 0) return null;

  const active = prescriptions.filter((rx) => rx.status === "active");
  const weeks = Math.max(1, Math.round((end - start) / (7 * 24 * 60 * 60 * 1000)));
  const sessionsExpected = active.length === 0 ? 0 : Math.max(...active.map((rx) => rx.frequencyPerWeek || 0)) * weeks;
  const sessionsCompleted = periodSessions.length;
  const adherencePercent = sessionsExpected === 0 ? null : Math.min(100, Math.round((sessionsCompleted / sessionsExpected) * 100));

  const painValues = periodSessions.map((session) => session.painAfter).filter((value) => typeof value === "number");
  const romValues = periodSessions.map((session) => sessionAverageRom(session)).filter((value) => value !== null);

  const flags = [];
  if (periodSessions.length >= 2) {
    const lastTwo = periodSessions.slice(-2);
    if (typeof lastTwo[1].painAfter === "number" && typeof lastTwo[0].painAfter === "number" && lastTwo[1].painAfter - lastTwo[0].painAfter >= 1) {
      flags.push("painSpike");
    }
    const romA = sessionAverageRom(lastTwo[0]);
    const romB = sessionAverageRom(lastTwo[1]);
    if (romA !== null && romB !== null && romB < romA) flags.push("romRegression");
  }

  return {
    sessionsCompleted,
    sessionsExpected,
    adherencePercent,
    painTrend: painValues.length > 0 ? { from: painValues[0], to: painValues[painValues.length - 1] } : null,
    romTrend: romValues.length > 0 ? { from: romValues[0], to: romValues[romValues.length - 1] } : null,
    flags,
  };
};

/**
 * A single report's OWN clinical trend (Doctor Reports brief, Section 8/9)
 * — classified entirely from fields the report already stores
 * (`flags`, `painTrend`, `romTrend`, all written once by
 * `generateReportMetrics`/the seed fixtures, never recomputed here):
 *   - any flag present (painSpike/romRegression/missed_sessions, whatever
 *     the report actually carries)      -> NEEDS_ATTENTION
 *   - no flags AND every trend the report DOES have moved the right
 *     direction (pain down, ROM up)      -> IMPROVING
 *   - anything else (no flags, no clearly positive trend, or a trend the
 *     report doesn't carry at all)       -> STABLE
 * A report with neither painTrend nor romTrend recorded can only ever be
 * NEEDS_ATTENTION (via flags) or STABLE — it never claims IMPROVING
 * without at least one real improving measurement.
 */
export const deriveReportTrend = (report) => {
  if (report.flags && report.flags.length > 0) return REPORT_TREND.NEEDS_ATTENTION;

  const painImproving = report.painTrend ? report.painTrend.to < report.painTrend.from : null;
  const romImproving = report.romTrend ? report.romTrend.to > report.romTrend.from : null;

  const hasAnyTrend = painImproving !== null || romImproving !== null;
  const noneWorsened = (painImproving === null || painImproving === true) && (romImproving === null || romImproving === true);
  const atLeastOneImproved = painImproving === true || romImproving === true;

  if (hasAnyTrend && noneWorsened && atLeastOneImproved) return REPORT_TREND.IMPROVING;
  return REPORT_TREND.STABLE;
};

// Title tokens stripped before computing initials — "Dr. Sarah Ahmed"
// must produce "SA", not "DS" (Doctor Profile brief, Section 9). Kept as
// a short literal list rather than a locale-aware title parser; this
// demo only ever has one clinician name to format.
const NAME_TITLE_TOKENS = new Set(["dr", "dr.", "prof", "prof."]);

/**
 * Two-letter initials from a canonical display name (Doctor Profile
 * brief, Section 9) — the ONE implementation Profile/Topbar/AccountMenu
 * all call, so the avatar fallback can never disagree with itself across
 * surfaces.
 */
export const deriveInitialsFromName = (name) => {
  const words = (name || "").trim().split(/\s+/).filter((word) => word && !NAME_TITLE_TOKENS.has(word.toLowerCase()));
  return words
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

/**
 * Which of a set of (already-CONFIRMED, future) appointments would fall
 * OUTSIDE a candidate `workingHours` schedule (Doctor Profile brief,
 * Section 17) — a real, derived check reusing each appointment's own
 * `startAt`, never a guess. `workingHours` is the
 * `{ sunday: {enabled,start,end}, ... }` shape `doctorProfile.js` seeds
 * and Profile's working-hours editor produces. Returns the SUBSET of
 * `appointments` that would no longer fit, so the caller can show
 * "N existing appointments fall outside these updated hours" honestly —
 * never auto-cancels anything itself (Section 17: doctor decides).
 */
export const findAppointmentsOutsideWorkingHours = (workingHours, appointments) => {
  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };

  return appointments.filter((appointment) => {
    const start = new Date(appointment.startAt);
    const dayKey = WEEKDAY_ORDER[start.getDay()];
    const day = workingHours[dayKey];
    if (!day || !day.enabled) return true;

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    return startMinutes < toMinutes(day.start) || startMinutes >= toMinutes(day.end);
  });
};

/**
 * Previous-vs-current report comparison rows (Doctor Reports brief,
 * Section 18/19) — `current`/`previous`/`change` come straight from each
 * report's own already-stored `painTrend.to`/`romTrend.to`/
 * `adherencePercent` (the value at the END of each period), never
 * recomputed from raw sessions here. A metric only produces a row when
 * BOTH reports actually carry it — no fabricated baseline, no assumed
 * zero. Returns `[]` (not `null`) when `previous` is falsy so callers can
 * `.length === 0` check for "no previous comparable report" uniformly.
 */
export const compareReports = (current, previous) => {
  if (!previous) return [];
  const rows = [];
  if (current.painTrend && previous.painTrend) {
    rows.push({ metric: "pain", previous: previous.painTrend.to, current: current.painTrend.to, change: round1(current.painTrend.to - previous.painTrend.to), improvingDirection: -1 });
  }
  if (current.romTrend && previous.romTrend) {
    rows.push({ metric: "rom", previous: previous.romTrend.to, current: current.romTrend.to, change: round1(current.romTrend.to - previous.romTrend.to), improvingDirection: 1 });
  }
  if (typeof current.adherencePercent === "number" && typeof previous.adherencePercent === "number") {
    rows.push({
      metric: "adherence",
      previous: previous.adherencePercent,
      current: current.adherencePercent,
      change: round1(current.adherencePercent - previous.adherencePercent),
      improvingDirection: 1,
    });
  }
  return rows;
};
