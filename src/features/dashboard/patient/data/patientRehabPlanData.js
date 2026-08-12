import { getExerciseById } from "./patientExercisesData";
import { rehabRepository } from "../../../../domain/rehab/useRehabDomain";
import { computeAdherence as deriveAdherence } from "../../../../domain/rehab/rehabDerived";
import { PATIENT_PROFILE_PATIENT_ID } from "../../../../domain/rehab/demoData/patients";

/**
 * The REHAB ASSIGNMENT layer, now sourced from the shared rehab domain
 * (src/domain/rehab/) instead of a private hardcoded plan — this is what
 * makes a Doctor's "Edit rehabilitation plan" change appear here
 * immediately (Section 17 of the Doctor Patients module brief:
 * "exact same prescription appears" on the Patient side). Every function
 * below keeps its pre-refactor name/return shape so
 * PatientExercises.jsx, patientProfileInsights.js, SessionHero.jsx, and
 * SessionExerciseSequence.jsx are unchanged.
 *
 * `estimatedMinutes`/`baseRom` are execution-pacing flavor constants for
 * the mock sensor-metrics generator (session/patientSessionMetrics.js) —
 * NOT a prescribed or historical fact, so they intentionally stay static
 * heuristics here rather than being derived from real session history
 * (deriving them from the patient's actual last-session ROM would make
 * every new session's mock metrics start near/at the target ROM
 * immediately, flattening the felt "progress within a session" pacing
 * this UI was designed around). `previous` (last real session's
 * quality/ROM/pain for this exercise), by contrast, IS a fact the Doctor
 * needs to see too — it's now derived from the shared canonical session
 * history, not a second hardcoded copy.
 */

export const REHAB_DAY_STATUS = {
  COMPLETED: "completed",
  TODAY: "today",
  UPCOMING: "upcoming",
};

const PACING_DEFAULTS = {
  quadSets: { estimatedMinutes: 4, baseRom: 74 },
  legRaises: { estimatedMinutes: 6, baseRom: 68 },
  heelSlides: { estimatedMinutes: 5, baseRom: 90 },
  hamstring: { estimatedMinutes: 3, baseRom: 20 },
  calfRaises: { estimatedMinutes: 4, baseRom: 40 },
};

const pacingFor = (exerciseId, targetRomMin) =>
  PACING_DEFAULTS[exerciseId] || { estimatedMinutes: 4, baseRom: targetRomMin || 60 };

/** Most recent completed session that recorded this exercise, for the "previous session" comparison shown mid-session. */
const findPreviousExerciseResult = (sessions, exerciseId) => {
  for (let i = sessions.length - 1; i >= 0; i -= 1) {
    const entry = sessions[i].exercises.find((exercise) => exercise.id === exerciseId);
    if (entry) {
      return { qualityKey: entry.qualityKey || "good", rom: entry.rom ?? 0, painAfter: sessions[i].painAfter ?? null };
    }
  }
  return { qualityKey: "good", rom: null, painAfter: null };
};

/**
 * Today's session plan, each active prescription joined with its catalog
 * definition — the one place that join happens (unchanged from before).
 */
export const getTodaySessionPlan = () => {
  const prescriptions = rehabRepository.getPrescriptions(PATIENT_PROFILE_PATIENT_ID, { activeOnly: true });
  const sessions = rehabRepository.getSessions(PATIENT_PROFILE_PATIENT_ID);

  return prescriptions.map((rx) => {
    const pacing = pacingFor(rx.exerciseId, rx.targetRomMin);
    return {
      exerciseId: rx.exerciseId,
      sets: rx.sets,
      repsPerSet: rx.repsPerSet,
      durationSeconds: rx.durationSeconds,
      holdSeconds: rx.holdSeconds,
      estimatedMinutes: pacing.estimatedMinutes,
      baseRom: pacing.baseRom,
      targetRomMin: rx.targetRomMin,
      targetRomMax: rx.targetRomMax,
      previous: findPreviousExerciseResult(sessions, rx.exerciseId),
      catalog: getExerciseById(rx.exerciseId),
    };
  });
};

export const getSessionTotals = (plan = getTodaySessionPlan()) => ({
  exerciseCount: plan.length,
  setCount: plan.reduce((sum, item) => sum + item.sets, 0),
  estimatedMinutes: plan.reduce((sum, item) => sum + item.estimatedMinutes, 0),
});

/**
 * Program-adherence snapshot — now DERIVED from real completed sessions
 * vs. the active prescriptions' weekly frequency (Section 18: "Adherence
 * should be DERIVED... completed prescribed sessions / expected
 * sessions"), not a hardcoded constant. `streakDays` is the count of
 * consecutive calendar days, ending at the most recent completed session,
 * that each have a completed session.
 */
export const getAdherence = () => {
  const prescriptions = rehabRepository.getPrescriptions(PATIENT_PROFILE_PATIENT_ID, { activeOnly: true });
  const sessions = rehabRepository.getSessions(PATIENT_PROFILE_PATIENT_ID);
  const adherence = deriveAdherence({ prescriptions, sessions });

  let streakDays = 0;
  if (sessions.length > 0) {
    const days = [...new Set(sessions.map((session) => new Date(session.date).toDateString()))]
      .map((label) => new Date(label))
      .sort((a, b) => b - a);
    streakDays = 1;
    for (let i = 0; i < days.length - 1; i += 1) {
      const diffDays = Math.round((days[i] - days[i + 1]) / 86400000);
      if (diffDays === 1) streakDays += 1;
      else break;
    }
  }

  return {
    streakDays,
    completionPercentage: adherence.percent ?? 0,
    missedThisWeek: adherence.missed,
  };
};

const toDayId = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const BASE_SESSION_NUMBER = 6;

/**
 * The visible rehab week — always the Monday-start week CONTAINING the
 * real current date (unchanged from before this refactor).
 */
export const getRehabWeek = (referenceDate = new Date()) => {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const todayId = toDayId(today);

  const isoWeekday = (today.getDay() + 6) % 7; // Monday = 0 .. Sunday = 6
  const monday = new Date(today);
  monday.setDate(today.getDate() - isoWeekday);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const id = toDayId(date);

    let status = REHAB_DAY_STATUS.UPCOMING;
    if (id < todayId) status = REHAB_DAY_STATUS.COMPLETED;
    else if (id === todayId) status = REHAB_DAY_STATUS.TODAY;

    return {
      id,
      date,
      status,
      sessionNumber: BASE_SESSION_NUMBER + index,
    };
  });
};

/**
 * A plausible "Week N" label — still purely flavor text derived from the
 * calendar's ISO week-of-year (unchanged; there is still no persisted
 * program-start-relative week counter anywhere in the canonical domain).
 */
export const getWeekLabel = (date = new Date()) => {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const weekNumber = Math.max(1, Math.ceil(dayOfYear / 7));
  return weekNumber;
};

const COMPLETED_DAY_SUMMARY_POOL = [
  { durationMs: 16 * 60000 + 40000, painBefore: 4, painAfter: 3, qualityKey: "good" },
  { durationMs: 17 * 60000 + 12000, painBefore: 3, painAfter: 3, qualityKey: "good" },
  { durationMs: 15 * 60000 + 58000, painBefore: 4, painAfter: 4, qualityKey: "fair" },
  { durationMs: 18 * 60000 + 5000, painBefore: 3, painAfter: 2, qualityKey: "excellent" },
];

/**
 * Read-only mock summary for an already-completed PAST day within the
 * CURRENT visible week that has no matching real seeded session (the rail
 * shows 7 days; the canonical seed only covers the days sessions.js
 * actually populated) — unchanged deterministic fallback so every past
 * day in the rail still has something to show.
 */
export const getCompletedDaySummary = (dayId) => {
  let hash = 0;
  for (let i = 0; i < dayId.length; i += 1) {
    hash = (hash * 31 + dayId.charCodeAt(i)) % COMPLETED_DAY_SUMMARY_POOL.length;
  }
  const base = COMPLETED_DAY_SUMMARY_POOL[hash];
  const totals = getSessionTotals();
  return {
    ...base,
    exerciseCount: totals.exerciseCount,
    setCount: totals.setCount,
  };
};
