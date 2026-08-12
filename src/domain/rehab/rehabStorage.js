/**
 * Versioned, validated localStorage boundary for the canonical rehab
 * domain — ONE namespaced key, following the exact pattern every
 * feature-level storage module in this app already established (see
 * patientPainStorage.js/patientSessionStorage.js/
 * patientAppointmentStorage.js): a `version` field, a structural
 * validator, defensive try/catch around both the storage call and the
 * JSON parse, and silent self-healing (a corrupt/invalid/stale-schema
 * record is discarded and the store falls back to fresh seed data rather
 * than throwing or trusting garbage) — Section 4 of the brief.
 *
 * This REPLACES the four scattered `kneeguide.patient.*` keys
 * (session/painLog/appointmentRequests are superseded; preferences stays
 * separate — it's UI settings, not rehab domain data) with one key,
 * `kneeguide.demo.rehab.v1`. Old keys are read once, best-effort, and
 * removed — see `migrateLegacyKeys` — so a browser with pre-refactor data
 * doesn't lose its in-progress local session/pain log/appointment
 * overrides, but also never keeps writing to two places afterward.
 */

const STORAGE_KEY = "kneeguide.demo.rehab.v1";
export const SCHEMA_VERSION = 1;

const LEGACY_KEYS = [
  "kneeguide.patient.session",
  "kneeguide.patient.painLog",
  "kneeguide.patient.appointmentRequests",
];

const readRaw = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/** Structural check — every top-level branch must be the collection shape the repository expects. */
const isValidEnvelope = (parsed) => {
  if (!isPlainObject(parsed)) return false;
  if (parsed.version !== SCHEMA_VERSION) return false;
  const requiredArrays = ["prescriptions", "sessions", "appointments", "reports", "clinicalNotes", "medicalFiles"];
  if (!requiredArrays.every((key) => Array.isArray(parsed.state?.[key]))) return false;
  if (!isPlainObject(parsed.state?.painLogs)) return false;
  return true;
};

/**
 * Loads the persisted state, or `null` if nothing valid is stored (the
 * repository falls back to fresh seed data in that case — first run,
 * corrupted data, or a private-browsing session that never persisted).
 */
export const loadRehabState = () => {
  const raw = readRaw(STORAGE_KEY);
  if (!raw) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isValidEnvelope(parsed)) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // best-effort cleanup only
    }
    return null;
  }

  return parsed.state;
};

export const saveRehabState = (state) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, savedAt: new Date().toISOString(), state }));
  } catch {
    // Quota/private-mode/security errors — the in-memory store still works for this tab.
  }
};

/** Best-effort removal of the pre-refactor scattered keys — read nothing from them; just stop them lingering. */
export const clearLegacyKeys = () => {
  LEGACY_KEYS.forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // best-effort only
    }
  });
};

export const resetRehabState = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort only
  }
};
