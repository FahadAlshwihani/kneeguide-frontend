// Small, defensive localStorage boundary for Patient UI PREFERENCES only
// (language + appearance) — same architecture as patientPainStorage.js/
// patientAppointmentStorage.js/session/patientSessionStorage.js (one
// namespaced key, a versioned + structurally-validated schema, every read
// defensive, corrupt/unknown data discarded rather than trusted or thrown).
//
// Deliberately UI-preferences-only: diagnosis, doctor notes, weight,
// medical history, appointment/report content, and session state all keep
// living in their own existing storage boundaries — this key never touches
// any of that.

const STORAGE_KEY = "kneeguide.patient.preferences";
const SCHEMA_VERSION = 1;

export const SUPPORTED_LANGUAGES = ["en", "ar"];
export const THEME_PREFERENCES = ["system", "light", "dark"];

export const DEFAULT_PREFERENCES = {
  version: SCHEMA_VERSION,
  language: "en",
  theme: "system",
};

const isValidRecord = (record) => {
  if (!record || typeof record !== "object") return false;
  if (record.version !== SCHEMA_VERSION) return false;
  if (!SUPPORTED_LANGUAGES.includes(record.language)) return false;
  if (!THEME_PREFERENCES.includes(record.theme)) return false;
  return true;
};

const readRaw = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable (private browsing, disabled, quota/security
    // errors) — the caller falls back to in-memory defaults for this
    // session rather than crashing.
    return null;
  }
};

/** The stored preference object, or `null` if none/corrupt/unknown-version — never throws. */
export const loadPatientPreferences = () => {
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
      // best-effort cleanup only
    }
    return null;
  }

  return { version: parsed.version, language: parsed.language, theme: parsed.theme };
};

/** Persists `{ version, language, theme }`. Silently no-ops if localStorage is unavailable — the in-memory value still drives the current session. */
export const savePatientPreferences = ({ language, theme }) => {
  const record = {
    version: SCHEMA_VERSION,
    language: SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_PREFERENCES.language,
    theme: THEME_PREFERENCES.includes(theme) ? theme : DEFAULT_PREFERENCES.theme,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Quota/security/unavailable — degrade silently.
  }

  return record;
};
