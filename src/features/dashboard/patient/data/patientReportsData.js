import { getTodaySessionPlan } from "./patientRehabPlanData";
import { DEFAULT_CLINICIAN } from "./patientClinicianData";
import { loadSessionState } from "../session/patientSessionStorage";
import { SESSION_STATUS } from "../session/patientSessionEngine";
import { getAverageRom, getSessionAverageQuality } from "../session/patientSessionMetrics";

/**
 * The ONE coherent REPORT domain model for Patient Recovery Reports.
 * Audited before writing this: the old Reports.jsx owned a flat,
 * disconnected 5-item mock array (`painLevel`/`flexion`/`extension`/
 * `completed`) with no exercise-level detail and no clinician concept.
 * The Exercise Session engine (session/patientSessionEngine.js) now
 * produces genuinely richer per-session data (per-exercise sets/ROM/
 * quality, real timestamps) — but only for the ONE currently-persisted
 * "today" session (patientSessionStorage.js intentionally never keeps a
 * multi-day history, see that file). So a real multi-month report
 * HISTORY still has to be fixture data — exactly like the Assistant's
 * mock conversation history — but wherever today's actual completed
 * session exists, it is reused verbatim instead of re-faked (see
 * `getTodayLiveReport` below).
 *
 * Report shape (conceptually the Section 34 model, adapted to what this
 * repo already has):
 *   {
 *     id, date (Date), sessionStatus ("completed"|"incomplete"),
 *     duration (ms|null),
 *     pain: { before, after },      // either may be null
 *     rom: { flexion, extension },  // either may be null
 *     movementQuality,              // null for legacy summary reports
 *     completion: { exercisesCompleted, exercisesTotal, setsCompleted, setsTotal } | null,
 *     exercises: [{ id, nameKey, completedSets, totalSets, rom, qualityKey, durationMs }] | null,
 *     clinicalReview: { status, doctorName, reviewedAt, messageKey, followUpRecommended } | null,
 *     isDetailed,     // has exercises/completion/movementQuality — a real
 *                      // per-exercise breakdown, not just summary numbers
 *     isLiveToday,     // sourced from the actual live session, not a fixture
 *   }
 *
 * SESSION STATUS vs CLINICAL REVIEW STATUS are deliberately two separate
 * fields (Section 15/26) — "Completed"/"Incomplete" describes whether the
 * rehab session itself finished; `clinicalReview.status`
 * ("reviewed"/"awaiting_review"/"not_shared") describes whether a
 * clinician has looked at it. A `null` clinicalReview (the legacy
 * summary fixtures below) means the concept doesn't apply to that record
 * at all — never silently rendered as "not reviewed".
 */

export const REVIEW_STATUS = {
  REVIEWED: "reviewed",
  AWAITING_REVIEW: "awaiting_review",
  NOT_SHARED: "not_shared",
};

const dayOffset = (offset, referenceDate = new Date()) => {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

/**
 * Fixture dates are relative to the REAL current date (same pattern as
 * patientRehabPlanData.js's getRehabWeek) rather than hardcoded 2025
 * calendar dates — this is what keeps the demo's "last 7 / 30 / 90 days"
 * filters meaningfully non-empty no matter when this runs, instead of
 * the fixture history silently aging out of every range.
 */
const buildFixtureReports = (referenceDate) => [
  // ---- Legacy SUMMARY reports (Section 12) — only the fields the old
  // dataset ever actually had. No fabricated exercises/quality/review.
  {
    id: "legacy-1",
    date: dayOffset(-85, referenceDate),
    sessionStatus: "completed",
    duration: null,
    pain: { before: null, after: 6 },
    rom: { flexion: 90, extension: -5 },
    movementQuality: null,
    completion: null,
    exercises: null,
    clinicalReview: null,
    isDetailed: false,
    isLiveToday: false,
  },
  {
    id: "legacy-2",
    date: dayOffset(-70, referenceDate),
    sessionStatus: "completed",
    duration: null,
    pain: { before: null, after: 5 },
    rom: { flexion: 100, extension: -3 },
    movementQuality: null,
    completion: null,
    exercises: null,
    clinicalReview: null,
    isDetailed: false,
    isLiveToday: false,
  },
  {
    id: "legacy-3",
    date: dayOffset(-50, referenceDate),
    sessionStatus: "completed",
    duration: null,
    pain: { before: null, after: 4 },
    rom: { flexion: 110, extension: -2 },
    movementQuality: null,
    completion: null,
    exercises: null,
    clinicalReview: null,
    isDetailed: false,
    isLiveToday: false,
  },
  {
    id: "legacy-4",
    date: dayOffset(-25, referenceDate),
    sessionStatus: "completed",
    duration: null,
    pain: { before: null, after: 3 },
    rom: { flexion: 120, extension: 0 },
    movementQuality: null,
    completion: null,
    exercises: null,
    clinicalReview: null,
    isDetailed: false,
    isLiveToday: false,
  },
  {
    id: "legacy-5",
    date: dayOffset(-12, referenceDate),
    // This was the old dataset's `completed: false` row — that boolean
    // meant the SESSION wasn't finished, not "unreviewed" (Section 26).
    // An incomplete session has no pain-after/ROM captured and no
    // clinical review, honestly.
    sessionStatus: "incomplete",
    duration: null,
    pain: { before: null, after: null },
    rom: { flexion: null, extension: null },
    movementQuality: null,
    completion: null,
    exercises: null,
    clinicalReview: null,
    isDetailed: false,
    isLiveToday: false,
  },

  // ---- DETAILED fixture reports (Section 12/13) — demonstrate the
  // richer future capability: full exercise breakdown + mock clinician
  // feedback. Exercise ids/names reuse the real catalog
  // (data/patientExercisesData.js) via nameKey — never a second,
  // divergent exercise-name source.
  {
    id: "detailed-1",
    date: dayOffset(-6, referenceDate),
    sessionStatus: "completed",
    duration: 17 * 60000 + 40000,
    pain: { before: 4, after: 3 },
    rom: { flexion: 118, extension: 0 },
    movementQuality: "good",
    completion: { exercisesCompleted: 3, exercisesTotal: 3, setsCompleted: 9, setsTotal: 9 },
    exercises: [
      { id: "quadSets", nameKey: "patientExercises.mock.quadSets.name", completedSets: 3, totalSets: 3, rom: 78, qualityKey: "good", durationMs: 258000 },
      { id: "legRaises", nameKey: "patientExercises.mock.legRaises.name", completedSets: 3, totalSets: 3, rom: 72, qualityKey: "good", durationMs: 312000 },
      { id: "heelSlides", nameKey: "patientExercises.mock.heelSlides.name", completedSets: 3, totalSets: 3, rom: 92, qualityKey: "excellent", durationMs: 290000 },
    ],
    clinicalReview: {
      status: REVIEW_STATUS.REVIEWED,
      doctorName: DEFAULT_CLINICIAN.name,
      reviewedAt: dayOffset(-5, referenceDate),
      messageKey: "patientReports.doctorFeedback.fixtures.detailed1",
      followUpRecommended: false,
    },
    isDetailed: true,
    isLiveToday: false,
  },
  {
    id: "detailed-2",
    date: dayOffset(-2, referenceDate),
    sessionStatus: "completed",
    duration: 18 * 60000 + 5000,
    pain: { before: 3, after: 4 },
    rom: { flexion: 122, extension: 0 },
    movementQuality: "good",
    completion: { exercisesCompleted: 3, exercisesTotal: 3, setsCompleted: 9, setsTotal: 9 },
    exercises: [
      { id: "quadSets", nameKey: "patientExercises.mock.quadSets.name", completedSets: 3, totalSets: 3, rom: 80, qualityKey: "excellent", durationMs: 244000 },
      { id: "legRaises", nameKey: "patientExercises.mock.legRaises.name", completedSets: 3, totalSets: 3, rom: 74, qualityKey: "good", durationMs: 298000 },
      { id: "heelSlides", nameKey: "patientExercises.mock.heelSlides.name", completedSets: 3, totalSets: 3, rom: 96, qualityKey: "good", durationMs: 305000 },
    ],
    clinicalReview: {
      status: REVIEW_STATUS.REVIEWED,
      doctorName: DEFAULT_CLINICIAN.name,
      reviewedAt: dayOffset(-1, referenceDate),
      messageKey: "patientReports.doctorFeedback.fixtures.detailed2",
      followUpRecommended: true,
    },
    isDetailed: true,
    isLiveToday: false,
  },
];

/**
 * If TODAY's actual guided session (session/patientSessionEngine.js) has
 * been completed, reuse it verbatim as one more report — real collected
 * data, not another fixture. It is NEVER pre-reviewed (Section 15): a
 * freshly completed local session has no clinician attached to it yet.
 */
const getTodayLiveReport = (todayId, referenceDate) => {
  const state = loadSessionState(todayId);
  if (!state || state.status !== SESSION_STATUS.COMPLETED) return null;

  const plan = getTodaySessionPlan();
  const allSetMetrics = state.exercises.flatMap((exercise) => exercise.setMetrics);
  const exercisesCompleted = state.exercises.filter((exercise) => exercise.completedSets >= exercise.totalSets).length;
  const setsCompleted = state.exercises.reduce((sum, exercise) => sum + exercise.completedSets, 0);
  const setsTotal = state.exercises.reduce((sum, exercise) => sum + exercise.totalSets, 0);
  const duration =
    state.completedAt && state.startedAt ? Date.parse(state.completedAt) - Date.parse(state.startedAt) : null;

  return {
    id: "live-today",
    date: dayOffset(0, referenceDate),
    sessionStatus: "completed",
    duration,
    pain: { before: state.painBefore, after: state.painAfter },
    rom: { flexion: getAverageRom(allSetMetrics), extension: null },
    movementQuality: getSessionAverageQuality(state.exercises),
    completion: { exercisesCompleted, exercisesTotal: state.exercises.length, setsCompleted, setsTotal },
    exercises: state.exercises.map((exercise) => {
      const planItem = plan.find((item) => item.exerciseId === exercise.id);
      return {
        id: exercise.id,
        nameKey: planItem?.catalog?.nameKey || exercise.id,
        completedSets: exercise.completedSets,
        totalSets: exercise.totalSets,
        rom: getAverageRom(exercise.setMetrics),
        qualityKey: getSessionAverageQuality([exercise]),
        durationMs:
          exercise.completedAt && exercise.startedAt
            ? Date.parse(exercise.completedAt) - Date.parse(exercise.startedAt)
            : null,
      };
    }),
    clinicalReview: {
      status: REVIEW_STATUS.AWAITING_REVIEW,
      doctorName: null,
      reviewedAt: null,
      messageKey: null,
      followUpRecommended: false,
    },
    isDetailed: true,
    isLiveToday: true,
  };
};

/**
 * The full report list — fixtures + (if it exists) today's real
 * completed session — sorted chronologically (oldest first). Callers
 * that need a specific display order (e.g. "Newest first" in the table)
 * sort their OWN copy; this function is the one source of truth for
 * chronological order, which is what all trend/insight math must use
 * (Section 24).
 */
export const getAllReports = (referenceDate = new Date(), todayId = null) => {
  const reports = [...buildFixtureReports(referenceDate)];
  if (todayId) {
    const liveReport = getTodayLiveReport(todayId, referenceDate);
    if (liveReport) reports.push(liveReport);
  }
  return reports.sort((a, b) => a.date - b.date);
};
