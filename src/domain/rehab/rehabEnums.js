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

/**
 * The doctor's own broad availability override (Doctor Profile brief,
 * Section 13/18) — reuses the exact 3-value taxonomy the pre-refactor
 * Profile mock already established (never invented fresh here). AVAILABLE
 * means working hours apply normally; BUSY/AWAY both mean "not currently
 * accepting new bookings" for the Appointments composer's warning, while
 * never erasing the underlying working-hours schedule (Section 18: the
 * override must stay reversible).
 */
export const DOCTOR_AVAILABILITY_STATUS = {
  AVAILABLE: "available",
  BUSY: "busy",
  AWAY: "away",
};

export const WEEKDAY_ORDER = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export const APPOINTMENT_SOURCE = {
  PATIENT: "patient",
  DOCTOR: "doctor",
  ASSISTANT: "assistant",
};

/**
 * Small, controlled decline-reason taxonomy (Section 11 of the Doctor
 * Appointments brief — a decline must carry a REAL reason, never a blind
 * reject). Stored as `clinicianResponse.declineReasonCode` on the
 * canonical appointment; `clinicianResponse.messageKey` is set from this
 * same code (`patientAppointments.declineReasons.<code>`) so the existing
 * Patient-side AppointmentDetailsModal — which already renders
 * `clinicianResponse.messageKey` generically — shows a real reason with no
 * Patient-side code change.
 */
export const DECLINE_REASON = {
  SCHEDULE_CONFLICT: "schedule_conflict",
  NO_CLINICAL_NEED_YET: "no_clinical_need_yet",
  REQUESTED_TIME_UNAVAILABLE: "requested_time_unavailable",
  CONTINUE_CURRENT_PLAN: "continue_current_plan",
  OTHER: "other",
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

/**
 * Enum value -> i18n leaf-key maps (camelCase JSON keys can't contain the
 * enum's own snake_case values directly). Defined once here so every
 * consumer (DoctorPatients.jsx, OverviewTab.jsx, SessionsTab.jsx, ...)
 * uses the exact same mapping instead of re-deriving it locally.
 */
export const ATTENTION_LEVEL_I18N_KEY = {
  [ATTENTION_LEVEL.NEEDS_ATTENTION]: "needsAttention",
  [ATTENTION_LEVEL.REVIEW_RECOMMENDED]: "reviewRecommended",
  [ATTENTION_LEVEL.STABLE]: "stable",
};

/**
 * A single REPORT's own clinical trend (Section 9 of the Doctor Reports
 * brief) — deliberately NOT a duplicate of ATTENTION_LEVEL. A patient's
 * `priority.level` describes their CURRENT overall standing from live
 * session/appointment/report data; a report's trend describes only
 * whether THAT specific report's own stored `flags`/`painTrend`/
 * `romTrend` (already-derived fields, never recomputed here) show a
 * negative, positive, or neutral change within its own period — a report
 * can be IMPROVING even while the patient's live priority is still
 * NEEDS_ATTENTION for an unrelated reason (e.g. a pending appointment),
 * and vice versa. Where the concepts DO overlap (attention vs stable),
 * the exact same string values and i18n keys are reused on purpose
 * (`rehabDomain.attentionLevel.*`) — only the genuinely new positive tier
 * needed a new key.
 */
export const REPORT_TREND = {
  NEEDS_ATTENTION: ATTENTION_LEVEL.NEEDS_ATTENTION,
  IMPROVING: "improving",
  STABLE: ATTENTION_LEVEL.STABLE,
};

export const REPORT_TREND_I18N_KEY = {
  [REPORT_TREND.NEEDS_ATTENTION]: "needsAttention",
  [REPORT_TREND.IMPROVING]: "improving",
  [REPORT_TREND.STABLE]: "stable",
};

export const ATTENTION_REASON_I18N_KEY = {
  [ATTENTION_REASON.PAIN_INCREASED]: "painIncreased",
  [ATTENTION_REASON.ROM_REGRESSION]: "romRegression",
  [ATTENTION_REASON.MISSED_SESSIONS]: "missedSessions",
  [ATTENTION_REASON.LOW_ADHERENCE]: "lowAdherence",
  [ATTENTION_REASON.REPORT_AWAITING_REVIEW]: "reportAwaitingReview",
  [ATTENTION_REASON.APPOINTMENT_PENDING]: "appointmentPending",
};

export const TREND_DIRECTION_I18N_KEY = {
  [TREND_DIRECTION.IMPROVING]: "improving",
  [TREND_DIRECTION.STABLE]: "stable",
  [TREND_DIRECTION.REQUIRES_REVIEW]: "requiresReview",
};
