/**
 * The rehab SESSION EXECUTION state machine — a plain, dependency-free
 * reducer (used via React's own `useReducer`, see PatientExercises.jsx),
 * not scattered booleans. This is deliberately the ONLY place session
 * state transitions happen, so "impossible" combinations (e.g. two
 * exercises simultaneously ACTIVE, or a set counted twice from a
 * double-click) are structurally prevented by the reducer's own guards
 * rather than relying on every call site to remember to check first.
 *
 * TIMER PHILOSOPHY: every duration in this state is derived from
 * `startedAt`/`completedAt` ISO timestamps, never an incrementing
 * "elapsedSeconds" counter. The visible clock (PatientExercises.jsx)
 * re-renders once a second while something is running, but the state
 * itself never stores a tick count — this is what keeps a page refresh,
 * a backgrounded tab, or a phone screen sleeping from ever desyncing the
 * displayed time from the truth.
 */

export const SESSION_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  ACTIVE: "ACTIVE",
  BETWEEN_EXERCISES: "BETWEEN_EXERCISES",
  PAIN_CHECK: "PAIN_CHECK",
  COMPLETED: "COMPLETED",
};

export const EXERCISE_STATUS = {
  UPCOMING: "UPCOMING",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
};

export const SESSION_SCHEMA_VERSION = 1;

/** Builds the initial, NOT_STARTED state for a given day + its plan. */
export const createInitialSessionState = (dayId, plan) => ({
  version: SESSION_SCHEMA_VERSION,
  dayId,
  status: SESSION_STATUS.NOT_STARTED,
  startedAt: null,
  completedAt: null,
  currentExerciseIndex: 0,
  painBefore: null,
  painAfter: null,
  exercises: plan.map((item) => ({
    id: item.exerciseId,
    status: EXERCISE_STATUS.UPCOMING,
    startedAt: null,
    completedAt: null,
    completedSets: 0,
    totalSets: item.sets,
    setMetrics: [],
  })),
});

const nowIso = () => new Date().toISOString();

/**
 * `dispatch({ type, ...payload })`. Every branch guards against being
 * applied from the wrong state (the "make impossible states hard to
 * represent" requirement) — a stray or duplicate dispatch (e.g. a
 * double-clicked button whose handler fires twice before React
 * re-renders) is a no-op, returning the SAME state reference, not a
 * mutated duplicate-counted one.
 */
export function sessionReducer(state, action) {
  switch (action.type) {
    case "RESTORE": {
      return action.state;
    }

    case "START_SESSION": {
      if (state.status !== SESSION_STATUS.NOT_STARTED) return state;
      const startedAt = nowIso();
      const exercises = state.exercises.map((exercise, index) =>
        index === 0 ? { ...exercise, status: EXERCISE_STATUS.ACTIVE, startedAt } : exercise
      );
      return {
        ...state,
        status: SESSION_STATUS.ACTIVE,
        startedAt,
        painBefore: action.painBefore ?? null,
        exercises,
      };
    }

    case "COMPLETE_SET": {
      if (state.status !== SESSION_STATUS.ACTIVE) return state;
      const exercise = state.exercises[state.currentExerciseIndex];
      if (!exercise || exercise.completedSets >= exercise.totalSets) return state;

      const exercises = state.exercises.map((item, index) =>
        index === state.currentExerciseIndex
          ? {
              ...item,
              completedSets: item.completedSets + 1,
              setMetrics: [...item.setMetrics, action.metrics || null],
            }
          : item
      );
      return { ...state, exercises };
    }

    case "COMPLETE_EXERCISE": {
      if (state.status !== SESSION_STATUS.ACTIVE) return state;
      const exercise = state.exercises[state.currentExerciseIndex];
      if (!exercise || exercise.status !== EXERCISE_STATUS.ACTIVE) return state;
      if (exercise.completedSets < exercise.totalSets) return state;

      const completedAt = nowIso();
      const exercises = state.exercises.map((item, index) =>
        index === state.currentExerciseIndex ? { ...item, status: EXERCISE_STATUS.COMPLETED, completedAt } : item
      );
      // Every exercise — including the last — passes through
      // BETWEEN_EXERCISES so its KneeGuide Insight is shown; the LAST
      // exercise's "Continue" button reads "Finish session" and its
      // CONTINUE_TO_NEXT_EXERCISE dispatch (below) is what actually
      // transitions to PAIN_CHECK.
      return { ...state, exercises, status: SESSION_STATUS.BETWEEN_EXERCISES };
    }

    case "CONTINUE_TO_NEXT_EXERCISE": {
      if (state.status !== SESSION_STATUS.BETWEEN_EXERCISES) return state;
      const nextIndex = state.currentExerciseIndex + 1;

      if (nextIndex >= state.exercises.length) {
        return { ...state, status: SESSION_STATUS.PAIN_CHECK };
      }

      const startedAt = nowIso();
      const exercises = state.exercises.map((item, index) =>
        index === nextIndex ? { ...item, status: EXERCISE_STATUS.ACTIVE, startedAt } : item
      );
      return { ...state, exercises, currentExerciseIndex: nextIndex, status: SESSION_STATUS.ACTIVE };
    }

    case "SUBMIT_PAIN_AFTER": {
      if (state.status !== SESSION_STATUS.PAIN_CHECK) return state;
      return { ...state, painAfter: action.value, status: SESSION_STATUS.COMPLETED, completedAt: nowIso() };
    }

    case "SKIP_PAIN_CHECK": {
      if (state.status !== SESSION_STATUS.PAIN_CHECK) return state;
      return { ...state, status: SESSION_STATUS.COMPLETED, completedAt: nowIso() };
    }

    case "RESET": {
      return action.initialState;
    }

    default:
      return state;
  }
}

// ---------- Pure selectors/formatters (no React, easy to reuse/test) ----------

export const getCurrentExercise = (state) => state.exercises[state.currentExerciseIndex] || null;

export const getSessionProgress = (state) => {
  const completedExercises = state.exercises.filter((e) => e.status === EXERCISE_STATUS.COMPLETED).length;
  const completedSets = state.exercises.reduce((sum, e) => sum + e.completedSets, 0);
  const totalSets = state.exercises.reduce((sum, e) => sum + e.totalSets, 0);
  return {
    completedExercises,
    totalExercises: state.exercises.length,
    completedSets,
    totalSets,
    ratio: totalSets === 0 ? 0 : completedSets / totalSets,
  };
};

/** Elapsed ms for the whole session — frozen once completed. */
export const getSessionElapsedMs = (state, now = Date.now()) => {
  if (!state.startedAt) return 0;
  const end = state.completedAt ? Date.parse(state.completedAt) : now;
  return Math.max(0, end - Date.parse(state.startedAt));
};

/** Elapsed ms for one exercise — frozen once that exercise is completed. */
export const getExerciseElapsedMs = (exercise, now = Date.now()) => {
  if (!exercise?.startedAt) return 0;
  const end = exercise.completedAt ? Date.parse(exercise.completedAt) : now;
  return Math.max(0, end - Date.parse(exercise.startedAt));
};

/** "MM:SS" — used for live/frozen timers (session + exercise clocks). */
export const formatClock = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

/** "18m 42s" — used for the completion summary's headline duration. */
export const formatDurationWords = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
};
