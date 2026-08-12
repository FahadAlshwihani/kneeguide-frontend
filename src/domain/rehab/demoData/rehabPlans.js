import { EXERCISE_MODE, PRESCRIPTION_STATUS } from "../rehabEnums";

/**
 * THE canonical PRESCRIPTION layer — what's actually assigned to each
 * patient right now. Sits between the exercise CATALOG (exercises.js —
 * "what is this exercise") and SESSION EXECUTION ("what actually
 * happened" — sessions.js) — the same three-layer separation the
 * pre-refactor patient-side data/patientRehabPlanData.js already
 * documented, now keyed by `patientId` instead of implicitly meaning "the
 * one logged-in patient".
 *
 * Ahmed's three prescriptions below are reconciled 1:1 from that same
 * pre-refactor SESSION_EXERCISE_PLAN (sets/reps/target ROM unchanged) —
 * this is literally the brief's own worked example ("Doctor assigns
 * Ahmed: Quad Sets, 3 sets, 12 reps, 5 sessions/week").
 *
 * `mode` mirrors the exercise's own catalog `mode` (Section 16): REPS
 * prescriptions carry `repsPerSet` (+ optional `holdSeconds` for a
 * held-rep exercise like Quad Sets); DURATION prescriptions carry
 * `durationSeconds` instead of reps. `frequencyPerWeek` is new — the old
 * model had no real weekly cadence concept (every visible day just reused
 * the same plan). `status` distinguishes an active prescription from one
 * the doctor has since removed (soft-deleted, kept so historical sessions
 * that reference it remain meaningful — Section 57).
 */

const now = () => new Date().toISOString();

export const INITIAL_PRESCRIPTIONS = [
  // ---- Ahmed Ali ----
  {
    id: "rx-ahmed-quadSets",
    patientId: "patient-ahmed",
    exerciseId: "quadSets",
    mode: EXERCISE_MODE.REPS,
    sets: 3,
    repsPerSet: 12,
    holdSeconds: 5,
    frequencyPerWeek: 5,
    targetRomMin: 70,
    targetRomMax: 80,
    instructionsNote: null,
    status: PRESCRIPTION_STATUS.ACTIVE,
    createdAt: "2025-09-10T09:00:00.000Z",
    updatedAt: "2025-09-10T09:00:00.000Z",
  },
  {
    id: "rx-ahmed-legRaises",
    patientId: "patient-ahmed",
    exerciseId: "legRaises",
    mode: EXERCISE_MODE.REPS,
    sets: 3,
    repsPerSet: 10,
    holdSeconds: null,
    frequencyPerWeek: 5,
    targetRomMin: 65,
    targetRomMax: 75,
    instructionsNote: null,
    status: PRESCRIPTION_STATUS.ACTIVE,
    createdAt: "2025-09-10T09:00:00.000Z",
    updatedAt: "2025-09-10T09:00:00.000Z",
  },
  {
    id: "rx-ahmed-heelSlides",
    patientId: "patient-ahmed",
    exerciseId: "heelSlides",
    mode: EXERCISE_MODE.REPS,
    sets: 3,
    repsPerSet: 15,
    holdSeconds: null,
    frequencyPerWeek: 5,
    targetRomMin: 85,
    targetRomMax: 100,
    instructionsNote: null,
    status: PRESCRIPTION_STATUS.ACTIVE,
    createdAt: "2025-09-10T09:00:00.000Z",
    updatedAt: "2025-09-10T09:00:00.000Z",
  },

  // ---- Sara Almutairi (adherence concern) ----
  {
    id: "rx-sara-quadSets",
    patientId: "patient-sara",
    exerciseId: "quadSets",
    mode: EXERCISE_MODE.REPS,
    sets: 3,
    repsPerSet: 10,
    holdSeconds: 5,
    frequencyPerWeek: 4,
    targetRomMin: 60,
    targetRomMax: 70,
    instructionsNote: null,
    status: PRESCRIPTION_STATUS.ACTIVE,
    createdAt: "2025-10-02T09:00:00.000Z",
    updatedAt: "2025-10-02T09:00:00.000Z",
  },
  {
    id: "rx-sara-hamstring",
    patientId: "patient-sara",
    exerciseId: "hamstring",
    mode: EXERCISE_MODE.DURATION,
    sets: 2,
    durationSeconds: 30,
    frequencyPerWeek: 4,
    targetRomMin: null,
    targetRomMax: null,
    instructionsNote: null,
    status: PRESCRIPTION_STATUS.ACTIVE,
    createdAt: "2025-10-02T09:00:00.000Z",
    updatedAt: "2025-10-02T09:00:00.000Z",
  },

  // ---- Mohammed Aziz (stable, positive) ----
  {
    id: "rx-mohammed-heelSlides",
    patientId: "patient-mohammed",
    exerciseId: "heelSlides",
    mode: EXERCISE_MODE.REPS,
    sets: 3,
    repsPerSet: 15,
    holdSeconds: null,
    frequencyPerWeek: 4,
    targetRomMin: 100,
    targetRomMax: 120,
    instructionsNote: null,
    status: PRESCRIPTION_STATUS.ACTIVE,
    createdAt: "2025-07-14T09:00:00.000Z",
    updatedAt: "2025-07-14T09:00:00.000Z",
  },
  {
    id: "rx-mohammed-calfRaises",
    patientId: "patient-mohammed",
    exerciseId: "calfRaises",
    mode: EXERCISE_MODE.REPS,
    sets: 3,
    repsPerSet: 15,
    holdSeconds: null,
    frequencyPerWeek: 4,
    targetRomMin: null,
    targetRomMax: null,
    instructionsNote: null,
    status: PRESCRIPTION_STATUS.ACTIVE,
    createdAt: "2025-07-14T09:00:00.000Z",
    updatedAt: "2025-07-14T09:00:00.000Z",
  },

  // ---- Lama Khaled (pending appointment request) ----
  {
    id: "rx-lama-quadSets",
    patientId: "patient-lama",
    exerciseId: "quadSets",
    mode: EXERCISE_MODE.REPS,
    sets: 3,
    repsPerSet: 12,
    holdSeconds: 5,
    frequencyPerWeek: 2,
    targetRomMin: 65,
    targetRomMax: 75,
    instructionsNote: null,
    status: PRESCRIPTION_STATUS.ACTIVE,
    createdAt: "2025-08-20T09:00:00.000Z",
    updatedAt: "2025-08-20T09:00:00.000Z",
  },
  {
    id: "rx-lama-legRaises",
    patientId: "patient-lama",
    exerciseId: "legRaises",
    mode: EXERCISE_MODE.REPS,
    sets: 3,
    repsPerSet: 10,
    holdSeconds: null,
    frequencyPerWeek: 2,
    targetRomMin: 60,
    targetRomMax: 70,
    instructionsNote: null,
    status: PRESCRIPTION_STATUS.ACTIVE,
    createdAt: "2025-08-20T09:00:00.000Z",
    updatedAt: "2025-08-20T09:00:00.000Z",
  },
];

export const buildPrescriptionId = (patientId, exerciseId) => `rx-${patientId}-${exerciseId}-${Date.now()}`;

export const nowIso = now;
