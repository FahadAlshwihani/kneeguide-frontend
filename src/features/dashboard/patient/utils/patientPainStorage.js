import { rehabRepository } from "../../../../domain/rehab/useRehabDomain";
import { PATIENT_PROFILE_PATIENT_ID } from "../../../../domain/rehab/demoData/patients";

/**
 * THIN WRAPPER over the shared rehab domain's pain log (Section 12/57 of
 * the Doctor Patients module brief: "Pain must match Patient side" — a
 * pain value logged here must be the exact same fact the Doctor Overview,
 * pain trend chart, and Assistant read). The underlying storage/schema
 * now lives in src/domain/rehab/ (one versioned key shared with every
 * other rehab fact, replacing this file's own former
 * `kneeguide.patient.painLog` key) — but every function this module
 * exported before keeps the exact same name/signature/return shape, so
 * every existing call site (PatientExercises.jsx, the Assistant's
 * LOG_PAIN action, PatientPainLogger.jsx) is unchanged.
 *
 * `PATIENT_PROFILE_PATIENT_ID` is "the one real logged-in demo patient"
 * (Ahmed) — there is still only one patient login flow in this app, so
 * every Patient-side page implicitly means that patient, exactly as
 * before this refactor.
 */

const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_PAIN_VALUE = 4;

const toLegacyRecord = (entry) => (entry ? { version: 1, value: entry.value, recordedAt: entry.recordedAt } : null);

export const getLatestPainLog = () => toLegacyRecord(rehabRepository.getLatestPainLogEntry(PATIENT_PROFILE_PATIENT_ID));

export const isPainLogRecent = (record, now = Date.now()) => {
  if (!record) return false;
  const recordedAtMs = Date.parse(record.recordedAt);
  if (!Number.isFinite(recordedAtMs)) return false;
  return now - recordedAtMs < RECENT_WINDOW_MS;
};

export const getRecentPainLog = (now = Date.now()) => {
  const record = getLatestPainLog();
  return record && isPainLogRecent(record, now) ? record : null;
};

export const savePainLog = (value) => {
  const record = rehabRepository.logPain(PATIENT_PROFILE_PATIENT_ID, value);
  return toLegacyRecord(record);
};
