// Small, defensive localStorage boundary for the mock Patient pain log —
// deliberately isolated from PatientHomeAssistant.jsx so the UI only ever
// calls semantic functions (getRecentPainLog, savePainLog, ...) rather
// than parsing/validating JSON itself. This is what makes swapping
// localStorage for a real `patientPainService.submitPainLog()` API later
// a boundary change, not a chat-UI rewrite.
//
// Namespaced key (not "pain"/"data") and a versioned, validated schema —
// this is untrusted client data (a user, devtools, or a stale schema from
// a future app version could all produce garbage here), so every read is
// defensive: malformed/corrupt/out-of-range entries are treated as "no
// record" rather than trusted or allowed to throw.
//
// Stores ONLY a mock pain score + timestamp. Never tokens, identity,
// diagnoses, or report content — see the task this implements for why.

const STORAGE_KEY = "kneeguide.patient.painLog";
const SCHEMA_VERSION = 1;
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000; // exact rolling 24h, not "same calendar day"

export const DEFAULT_PAIN_VALUE = 4;

const isValidRecord = (record) => {
  if (!record || typeof record !== "object") return false;
  if (record.version !== SCHEMA_VERSION) return false;
  if (!Number.isInteger(record.value) || record.value < 0 || record.value > 10) return false;
  const recordedAtMs = Date.parse(record.recordedAt);
  if (!Number.isFinite(recordedAtMs)) return false;
  return true;
};

const readRaw = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable (private browsing, disabled, quota/security
    // errors) — treat exactly like "no record" rather than crashing.
    return null;
  }
};

/**
 * The latest STRUCTURALLY VALID stored record, regardless of age — or
 * `null` if none exists or it's corrupt. A corrupt/invalid entry is
 * removed defensively so it doesn't keep failing validation on every
 * future read. This is deliberately separate from "recent" (see
 * isPainLogRecent/getRecentPainLog below) — an old-but-valid record can
 * still be a reasonable mock fallback value elsewhere; it just shouldn't
 * trigger the "you logged recently" confirmation flow.
 */
export const getLatestPainLog = () => {
  const raw = readRaw();
  if (!raw) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isValidRecord(parsed)) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore — best-effort cleanup only.
    }
    return null;
  }

  return parsed;
};

/** Exact rolling 24h window — `now` is injectable for testability. */
export const isPainLogRecent = (record, now = Date.now()) => {
  if (!record) return false;
  const recordedAtMs = Date.parse(record.recordedAt);
  if (!Number.isFinite(recordedAtMs)) return false;
  return now - recordedAtMs < RECENT_WINDOW_MS;
};

/** The latest record, but only if it's also within the last 24h. */
export const getRecentPainLog = (now = Date.now()) => {
  const record = getLatestPainLog();
  return record && isPainLogRecent(record, now) ? record : null;
};

/**
 * Persists `{ version, value, recordedAt }` — always a fresh
 * `new Date().toISOString()`, so this always represents "logged/updated
 * right now", whether it's a first log or an overwrite of a previous one.
 * Throws on an invalid value (a real programmer error — every call site
 * in this codebase only ever passes an already-clamped 0–10 integer from
 * PatientPainLogger's own range input); silently no-ops if localStorage
 * itself is unavailable, since the conversation UI already reflects the
 * value locally regardless of whether it persisted.
 */
export const savePainLog = (value) => {
  const intValue = Math.round(value);
  if (!Number.isInteger(intValue) || intValue < 0 || intValue > 10) {
    throw new Error("savePainLog: value must be an integer between 0 and 10");
  }

  const record = {
    version: SCHEMA_VERSION,
    value: intValue,
    recordedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Quota/security/unavailable — degrade silently.
  }

  return record;
};
