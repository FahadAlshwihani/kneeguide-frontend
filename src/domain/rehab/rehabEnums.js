/**
 * Shared semantic-id enums for the canonical rehabilitation domain
 * (src/domain/rehab/). Every status/severity/visibility value stored in
 * the domain is one of these string ids, never a display string — UI
 * layers translate at render time via i18next (Section 48/57 of the
 * Doctor Patients module brief). Keeping them in one file means the
 * repository, the derivation helpers, and every consuming component all
 * compare against the exact same literal, instead of a string that could
 * drift ("REQUESTED" vs "requested") between files.
 */

// Values are UPPERCASE to exactly match the pre-refactor Patient-side
// data/patientAppointmentsData.js enum — several existing Patient
// components build i18n keys / CSS class suffixes directly from this
// value (e.g. `patientAppointments.status.${status}`), so the literal
// string must stay byte-identical, not just semantically equivalent.
export const APPOINTMENT_STATUS = {
  REQUESTED: "REQUESTED",
  CONFIRMED: "CONFIRMED",
  ALTERNATIVE_PROPOSED: "ALTERNATIVE_PROPOSED",
  DECLINED: "DECLINED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export const APPOINTMENT_SOURCE = {
  PATIENT: "patient",
  DOCTOR: "doctor",
  ASSISTANT: "assistant",
};

// Matches the pre-refactor Patient-side data/patientReportsData.js
// REVIEW_STATUS values exactly (same reasoning as APPOINTMENT_STATUS
// above). A freshly generated, not-yet-opened report is represented as
// AWAITING_REVIEW with its own `generatedAt` timestamp — "Generated" is a
// display label derived from that timestamp, not a separate stored state.
export const REPORT_STATUS = {
  AWAITING_REVIEW: "awaiting_review",
  REVIEWED: "reviewed",
};

export const NOTE_VISIBILITY = {
  CLINICIAN_ONLY: "clinician_only",
  PATIENT_VISIBLE: "patient_visible",
};

export const NOTE_AUTHOR_ROLE = {
  DOCTOR: "doctor",
  PATIENT: "patient",
};

export const PRESCRIPTION_STATUS = {
  ACTIVE: "active",
  REMOVED: "removed",
};

export const EXERCISE_MODE = {
  REPS: "reps", // sets x reps (optionally with a per-rep hold)
  DURATION: "duration", // sets x a timed hold/duration
};

export const SESSION_SOURCE = {
  PATIENT_APP: "patient_app", // a real guided session completed through PatientExercises.jsx
  SEED: "seed", // historical demo data, never editable
};

/**
 * Patient attention/priority — deliberately NOT a "risk: high/medium/low"
 * label (Section 8 of the brief: this is not a clinical diagnosis). Reuses
 * the exact severity tiers the existing Doctor Home Assistant already
 * computes in doctorClinicalInsights.js (HIGH/FOLLOW_UP/POSITIVE/NEUTRAL),
 * renamed to this module's vocabulary so both surfaces can eventually
 * share one derivation without a naming mismatch.
 */
export const ATTENTION_LEVEL = {
  NEEDS_ATTENTION: "needs_attention",
  REVIEW_RECOMMENDED: "review_recommended",
  STABLE: "stable",
};

/** Why a patient is flagged — semantic reason ids, translated at render time (Section 37). */
export const ATTENTION_REASON = {
  PAIN_INCREASED: "pain_increased",
  ROM_REGRESSION: "rom_regression",
  MISSED_SESSIONS: "missed_sessions",
  LOW_ADHERENCE: "low_adherence",
  REPORT_AWAITING_REVIEW: "report_awaiting_review",
  APPOINTMENT_PENDING: "appointment_pending",
};

export const TREND_DIRECTION = {
  IMPROVING: "improving",
  STABLE: "stable",
  REQUIRES_REVIEW: "requires_review",
};
