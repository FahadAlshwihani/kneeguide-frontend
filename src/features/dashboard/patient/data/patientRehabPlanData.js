import { TODAY_EXERCISES } from "./patientExercisesData";

/**
 * The REHAB ASSIGNMENT layer — sits between the exercise CATALOG
 * (patientExercisesData.js, read directly by the Exercise Library, the
 * KneeGuide Assistant's SHOW_EXERCISES action, and the Exercise Details
 * modal — untouched by this module) and SESSION EXECUTION state
 * (session/patientSessionEngine.js):
 *
 *   catalog (what an exercise IS: name, description, instructions, cues
 *            — intrinsic, doesn't change per day)
 *     -> plan (what's PRESCRIBED today: sets/reps/target ROM/duration)
 *       -> session execution (what actually HAPPENED: completed sets,
 *          timestamps, metrics — see patientSessionEngine.js)
 *
 * Note the qualitative "target/focus" of an exercise (e.g. "Knee
 * extension control") now lives on the CATALOG entry itself
 * (`targetKey` in patientExercisesData.js) — it's a property of the
 * exercise, not of today's prescription. This layer only owns the
 * NUMERIC target ROM range (`targetRomMin`/`targetRomMax`), which
 * genuinely is session-specific.
 *
 * This separation is what lets a real "GET today's rehab day" endpoint
 * replace `getTodaySessionPlan`/`getRehabWeek` later without the session
 * engine or any UI component changing shape — they only ever consume the
 * plain data shape returned here, never this module's internals.
 *
 * Everything below is deterministic mock data (no `Math.random`), so a
 * demo session/day summary looks identical on every load — intentional,
 * not an oversight.
 */

export const REHAB_DAY_STATUS = {
  COMPLETED: "completed",
  TODAY: "today",
  UPCOMING: "upcoming",
};

// One prescription per catalog exercise for "today's" session. A real
// assignment engine would vary this per day; this mock keeps one plan
// definition every day in the visible week reuses, which is exactly the
// shape a day-specific GET could later return without this file's
// consumers changing.
const SESSION_EXERCISE_PLAN = [
  {
    exerciseId: "quadSets",
    sets: 3,
    repsPerSet: 12,
    estimatedMinutes: 4,
    baseRom: 74,
    targetRomMin: 70,
    targetRomMax: 80,
    previous: { qualityKey: "good", rom: 78, painAfter: 3 },
  },
  {
    exerciseId: "legRaises",
    sets: 3,
    repsPerSet: 10,
    estimatedMinutes: 6,
    baseRom: 68,
    targetRomMin: 65,
    targetRomMax: 75,
    previous: { qualityKey: "good", rom: 71, painAfter: 3 },
  },
  {
    exerciseId: "heelSlides",
    sets: 3,
    repsPerSet: 15,
    estimatedMinutes: 5,
    baseRom: 90,
    targetRomMin: 85,
    targetRomMax: 100,
    previous: { qualityKey: "excellent", rom: 94, painAfter: 2 },
  },
];

/**
 * Today's session plan, each entry joined with its catalog definition
 * (name/description/media) — the one place that join happens, so every
 * consumer (session engine, UI) gets one already-complete object instead
 * of re-looking-up the catalog itself.
 */
export const getTodaySessionPlan = () =>
  SESSION_EXERCISE_PLAN.map((plan) => ({
    ...plan,
    catalog: TODAY_EXERCISES.find((exercise) => exercise.id === plan.exerciseId) || null,
  }));

export const getSessionTotals = (plan = getTodaySessionPlan()) => ({
  exerciseCount: plan.length,
  setCount: plan.reduce((sum, item) => sum + item.sets, 0),
  estimatedMinutes: plan.reduce((sum, item) => sum + item.estimatedMinutes, 0),
});

const toDayId = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const BASE_SESSION_NUMBER = 6;

/**
 * The visible rehab week — always the Monday-start week CONTAINING the
 * real current date, so "Today" in the rail is always genuinely today,
 * not a hardcoded calendar date that goes stale the day after this was
 * written. Days before today are `completed`, days after are `upcoming`
 * — a deliberately simple two-state-plus-today model (Section 3's own
 * "this is a rehab timeline, not a calendar app" direction), not a real
 * per-day completion ledger (that lives in each day's own persisted
 * session state — see patientSessionEngine.js/patientSessionStorage.js
 * for "today", and getCompletedDaySummary below for read-only mock
 * history of earlier days).
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
 * A plausible "Week N" label — there is no real enrollment-date/program-
 * start field anywhere in this project (audited before writing this), so
 * this derives a stable, deterministic number from the calendar's own
 * ISO week-of-year rather than inventing a fake persisted program-start
 * date. Purely flavor text (Section 4's own "Week 3" example) — nothing
 * else in the UI depends on its exact value.
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
 * Read-only mock summary for an already-completed PAST day (never
 * today — today's real summary comes from the actual persisted session
 * state once it completes). Deterministic by day id so the same past day
 * always shows the same numbers.
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
