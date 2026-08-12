// Small, defensive localStorage boundary for which mock notifications the
// doctor has already read — same architecture as every other storage
// boundary in this feature (patientPainStorage.js's original precedent):
// one namespaced, ROLE-SPECIFIC key, a versioned + structurally-validated
// schema, every read defensive, corrupt data discarded rather than
// trusted or thrown. Only the read/unread STATE is persisted (a plain
// array of notification ids) — the notification content itself always
// comes fresh from data/doctorNotificationsMockData.js, so there's
// nothing here for a language switch to ever leave stale.

const STORAGE_KEY = "kneeguide.doctor.notifications";
const SCHEMA_VERSION = 1;

const readRaw = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/** Array of read notification ids, or `[]` if nothing/corrupt is stored — never throws. */
export const loadReadNotificationIds = () => {
  const raw = readRaw();
  if (!raw) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!parsed || parsed.version !== SCHEMA_VERSION || !Array.isArray(parsed.readIds)) {
    return [];
  }

  return parsed.readIds.filter((id) => typeof id === "string");
};

export const saveReadNotificationIds = (readIds) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, readIds }));
  } catch {
    // Quota/private-mode/security errors — read state still works for this tab.
  }
};
