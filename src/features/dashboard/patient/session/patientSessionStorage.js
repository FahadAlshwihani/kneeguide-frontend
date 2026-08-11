// Small, defensive localStorage boundary for the mock rehab SESSION
// EXECUTION state — same architecture as patientPainStorage.js (that
// file's own doc comment explains the reasoning; this mirrors it rather
// than duplicating a second philosophy). One namespaced key, a versioned
// + structurally-validated schema, every read defensive.
//
// Deliberately NOT written on every timer tick — see
// patientSessionEngine.js: only the reducer's STATE (timestamps, counts,
// status) is persisted, and only when it actually changes (i.e. on a real
// transition), never the once-a-second visual clock re-render.

import { SESSION_SCHEMA_VERSION, SESSION_STATUS, EXERCISE_STATUS } from "./patientSessionEngine";

const STORAGE_KEY = "kneeguide.patient.session";

const isValidExercise = (exercise) => {
  if (!exercise || typeof exercise !== "object") return false;
  if (!Object.values(EXERCISE_STATUS).includes(exercise.status)) return false;
  if (!Number.isInteger(exercise.completedSets) || exercise.completedSets < 0) return false;
  if (!Number.isInteger(exercise.totalSets) || exercise.totalSets < 0) return false;
  if (!Array.isArray(exercise.setMetrics)) return false;
  return true;
};

const isValidState = (state) => {
  if (!state || typeof state !== "object") return false;
  if (state.version !== SESSION_SCHEMA_VERSION) return false;
  if (typeof state.dayId !== "string" || !state.dayId) return false;
  if (!Object.values(SESSION_STATUS).includes(state.status)) return false;
  if (!Array.isArray(state.exercises) || !state.exercises.every(isValidExercise)) return false;
  if (!Number.isInteger(state.currentExerciseIndex)) return false;
  return true;
};

const readRaw = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Returns the persisted session state ONLY if it's structurally valid
 * AND belongs to the requested `dayId` — a session persisted for
 * yesterday is intentionally never silently resumed as if it were
 * today's (that would misrepresent a stale session as current progress).
 * Any corrupt/mismatched/stale record is discarded, never thrown.
 */
export const loadSessionState = (dayId) => {
  const raw = readRaw();
  if (!raw) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || !isValidState(parsed.state) || parsed.state.dayId !== dayId) {
    return null;
  }

  return parsed.state;
};

export const saveSessionState = (state) => {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: SESSION_SCHEMA_VERSION, savedAt: new Date().toISOString(), state })
    );
  } catch {
    // Quota/private-mode/security errors — the in-memory session still
    // works for this tab, it just won't survive a refresh.
  }
};

export const clearSessionState = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort only
  }
};

export const SESSION_STORAGE_KEY = STORAGE_KEY;
