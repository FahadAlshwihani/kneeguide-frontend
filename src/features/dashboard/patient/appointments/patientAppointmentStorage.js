// Small, defensive localStorage boundary for mock appointment REQUEST
// state — same architecture as patientPainStorage.js/
// patientSessionStorage.js (see those files for the full reasoning; this
// mirrors it rather than duplicating a second philosophy). One
// namespaced key, a versioned + structurally-validated schema, every
// read defensive, corrupt data discarded rather than trusted.
//
// Stores an ARRAY of "overrides" — each one either a brand-new
// patient-submitted appointment request (source: "patient"/"assistant")
// or a full replacement of a fixture appointment the patient has since
// mutated (e.g. accepting a proposed alternative). patientAppointmentService.js
// is the ONLY module that reads/writes this file directly; everything
// else goes through that service.
//
// Kept bounded (Section 21): only the fields actually needed to redraw
// the UI are persisted (id, clinician id, times, reason code, a short
// optional note, status, timestamps, clinician response) — no raw
// exception objects, no duplicated catalog/translation content. Written
// only on explicit request/response transitions, never continuously.

const STORAGE_KEY = "kneeguide.patient.appointmentRequests";
const SCHEMA_VERSION = 1;

const isValidOverride = (item) => {
  if (!item || typeof item !== "object") return false;
  if (typeof item.id !== "string" || !item.id) return false;
  if (typeof item.status !== "string") return false;
  if (!Date.parse(item.startAt)) return false;
  return true;
};

const readRaw = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/** Returns a plain-object array (dates still ISO strings) — the service layer revives them into `Date`s. */
export const loadAppointmentOverrides = () => {
  const raw = readRaw();
  if (!raw) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!parsed || parsed.version !== SCHEMA_VERSION || !Array.isArray(parsed.overrides)) {
    return [];
  }

  return parsed.overrides.filter(isValidOverride);
};

export const saveAppointmentOverrides = (overrides) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, overrides }));
  } catch {
    // Quota/private-mode/security errors — the in-memory list still works
    // for this tab, it just won't survive a refresh.
  }
};

export const clearAppointmentOverrides = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort only
  }
};
