import {
  SESSION_STATUS,
  EXERCISE_STATUS,
  createInitialSessionState,
  sessionReducer,
  getCurrentExercise,
  getSessionProgress,
  getSessionElapsedMs,
  getExerciseElapsedMs,
  formatClock,
  formatDurationWords,
} from "./patientSessionEngine";

const PLAN = [
  { exerciseId: "heelSlides", sets: 3 },
  { exerciseId: "quadSets", sets: 2 },
];

describe("createInitialSessionState", () => {
  test("builds a NOT_STARTED state with one UPCOMING entry per plan item", () => {
    const state = createInitialSessionState("day-1", PLAN);

    expect(state.status).toBe(SESSION_STATUS.NOT_STARTED);
    expect(state.dayId).toBe("day-1");
    expect(state.currentExerciseIndex).toBe(0);
    expect(state.exercises).toHaveLength(2);
    expect(state.exercises[0]).toMatchObject({
      id: "heelSlides",
      status: EXERCISE_STATUS.UPCOMING,
      completedSets: 0,
      totalSets: 3,
    });
  });
});

describe("sessionReducer", () => {
  test("START_SESSION activates the first exercise and records painBefore", () => {
    const initial = createInitialSessionState("day-1", PLAN);
    const next = sessionReducer(initial, { type: "START_SESSION", painBefore: 4 });

    expect(next.status).toBe(SESSION_STATUS.ACTIVE);
    expect(next.painBefore).toBe(4);
    expect(next.startedAt).not.toBeNull();
    expect(next.exercises[0].status).toBe(EXERCISE_STATUS.ACTIVE);
    expect(next.exercises[0].startedAt).not.toBeNull();
    expect(next.exercises[1].status).toBe(EXERCISE_STATUS.UPCOMING);
  });

  test("START_SESSION is a no-op once already started", () => {
    const initial = createInitialSessionState("day-1", PLAN);
    const started = sessionReducer(initial, { type: "START_SESSION" });
    const again = sessionReducer(started, { type: "START_SESSION", painBefore: 9 });

    expect(again).toBe(started);
  });

  test("COMPLETE_SET increments the active exercise's completedSets and records metrics", () => {
    const started = sessionReducer(createInitialSessionState("day-1", PLAN), { type: "START_SESSION" });
    const next = sessionReducer(started, { type: "COMPLETE_SET", metrics: { reps: 10 } });

    expect(next.exercises[0].completedSets).toBe(1);
    expect(next.exercises[0].setMetrics).toEqual([{ reps: 10 }]);
    expect(next.exercises[1].completedSets).toBe(0);
  });

  test("COMPLETE_SET is a no-op once the exercise's sets are already all completed", () => {
    let state = sessionReducer(createInitialSessionState("day-1", PLAN), { type: "START_SESSION" });
    state = sessionReducer(state, { type: "COMPLETE_SET" });
    state = sessionReducer(state, { type: "COMPLETE_SET" });
    state = sessionReducer(state, { type: "COMPLETE_SET" }); // all 3 sets done
    const overComplete = sessionReducer(state, { type: "COMPLETE_SET" });

    expect(overComplete).toBe(state);
    expect(overComplete.exercises[0].completedSets).toBe(3);
  });

  test("COMPLETE_EXERCISE is a no-op while sets remain", () => {
    const started = sessionReducer(createInitialSessionState("day-1", PLAN), { type: "START_SESSION" });
    const attempt = sessionReducer(started, { type: "COMPLETE_EXERCISE" });

    expect(attempt).toBe(started);
  });

  test("COMPLETE_EXERCISE moves to BETWEEN_EXERCISES once all sets are done", () => {
    let state = sessionReducer(createInitialSessionState("day-1", PLAN), { type: "START_SESSION" });
    state = sessionReducer(state, { type: "COMPLETE_SET" });
    state = sessionReducer(state, { type: "COMPLETE_SET" });
    state = sessionReducer(state, { type: "COMPLETE_SET" });
    const completed = sessionReducer(state, { type: "COMPLETE_EXERCISE" });

    expect(completed.status).toBe(SESSION_STATUS.BETWEEN_EXERCISES);
    expect(completed.exercises[0].status).toBe(EXERCISE_STATUS.COMPLETED);
    expect(completed.exercises[0].completedAt).not.toBeNull();
  });

  test("CONTINUE_TO_NEXT_EXERCISE activates the next exercise", () => {
    let state = sessionReducer(createInitialSessionState("day-1", PLAN), { type: "START_SESSION" });
    state = sessionReducer(state, { type: "COMPLETE_SET" });
    state = sessionReducer(state, { type: "COMPLETE_SET" });
    state = sessionReducer(state, { type: "COMPLETE_SET" });
    state = sessionReducer(state, { type: "COMPLETE_EXERCISE" });
    const next = sessionReducer(state, { type: "CONTINUE_TO_NEXT_EXERCISE" });

    expect(next.status).toBe(SESSION_STATUS.ACTIVE);
    expect(next.currentExerciseIndex).toBe(1);
    expect(next.exercises[1].status).toBe(EXERCISE_STATUS.ACTIVE);
  });

  test("CONTINUE_TO_NEXT_EXERCISE moves to PAIN_CHECK after the last exercise", () => {
    const singlePlan = [{ exerciseId: "heelSlides", sets: 1 }];
    let state = sessionReducer(createInitialSessionState("day-1", singlePlan), { type: "START_SESSION" });
    state = sessionReducer(state, { type: "COMPLETE_SET" });
    state = sessionReducer(state, { type: "COMPLETE_EXERCISE" });
    const next = sessionReducer(state, { type: "CONTINUE_TO_NEXT_EXERCISE" });

    expect(next.status).toBe(SESSION_STATUS.PAIN_CHECK);
  });

  test("SUBMIT_PAIN_AFTER completes the session and records the pain value", () => {
    const painCheckState = { ...createInitialSessionState("day-1", PLAN), status: SESSION_STATUS.PAIN_CHECK };
    const next = sessionReducer(painCheckState, { type: "SUBMIT_PAIN_AFTER", value: 2 });

    expect(next.status).toBe(SESSION_STATUS.COMPLETED);
    expect(next.painAfter).toBe(2);
    expect(next.completedAt).not.toBeNull();
  });

  test("SKIP_PAIN_CHECK completes the session without a painAfter value", () => {
    const painCheckState = { ...createInitialSessionState("day-1", PLAN), status: SESSION_STATUS.PAIN_CHECK };
    const next = sessionReducer(painCheckState, { type: "SKIP_PAIN_CHECK" });

    expect(next.status).toBe(SESSION_STATUS.COMPLETED);
    expect(next.painAfter).toBeNull();
  });

  test("RESTORE and RESET return exactly the provided state", () => {
    const initial = createInitialSessionState("day-1", PLAN);
    const restored = { ...initial, dayId: "restored" };

    expect(sessionReducer(initial, { type: "RESTORE", state: restored })).toBe(restored);
    expect(sessionReducer(initial, { type: "RESET", initialState: restored })).toBe(restored);
  });

  test("an unknown action type is a no-op", () => {
    const initial = createInitialSessionState("day-1", PLAN);
    expect(sessionReducer(initial, { type: "NOT_A_REAL_ACTION" })).toBe(initial);
  });
});

describe("selectors", () => {
  test("getCurrentExercise returns the exercise at currentExerciseIndex", () => {
    const state = createInitialSessionState("day-1", PLAN);
    expect(getCurrentExercise(state)).toMatchObject({ id: "heelSlides" });
  });

  test("getCurrentExercise returns null past the end of the list", () => {
    const state = { ...createInitialSessionState("day-1", PLAN), currentExerciseIndex: 99 };
    expect(getCurrentExercise(state)).toBeNull();
  });

  test("getSessionProgress sums completed/total sets and exercises across the plan", () => {
    let state = sessionReducer(createInitialSessionState("day-1", PLAN), { type: "START_SESSION" });
    state = sessionReducer(state, { type: "COMPLETE_SET" });

    expect(getSessionProgress(state)).toEqual({
      completedExercises: 0,
      totalExercises: 2,
      completedSets: 1,
      totalSets: 5,
      ratio: 1 / 5,
    });
  });

  test("getSessionElapsedMs is 0 before the session starts", () => {
    const state = createInitialSessionState("day-1", PLAN);
    expect(getSessionElapsedMs(state)).toBe(0);
  });

  test("getSessionElapsedMs measures against `now` while running, and freezes at completedAt once done", () => {
    const started = "2024-01-01T00:00:00.000Z";
    const runningState = { ...createInitialSessionState("day-1", PLAN), startedAt: started };
    const now = Date.parse("2024-01-01T00:00:10.000Z");
    expect(getSessionElapsedMs(runningState, now)).toBe(10000);

    const completedState = { ...runningState, completedAt: "2024-01-01T00:00:05.000Z" };
    // Even if `now` has moved on further, a completed session's duration is frozen.
    expect(getSessionElapsedMs(completedState, now)).toBe(5000);
  });

  test("getExerciseElapsedMs is 0 for an exercise that hasn't started", () => {
    expect(getExerciseElapsedMs(null)).toBe(0);
    expect(getExerciseElapsedMs({ startedAt: null })).toBe(0);
  });
});

describe("formatters", () => {
  test("formatClock pads minutes and seconds to MM:SS", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65_000)).toBe("01:05");
    expect(formatClock(3_661_000)).toBe("61:01");
  });

  test("formatDurationWords renders 'Nm SSs'", () => {
    expect(formatDurationWords(0)).toBe("0m 00s");
    expect(formatDurationWords(1_122_000)).toBe("18m 42s");
  });
});
