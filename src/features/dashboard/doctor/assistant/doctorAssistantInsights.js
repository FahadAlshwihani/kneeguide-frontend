import { ATTENTION_LEVEL, ATTENTION_REASON, APPOINTMENT_STATUS, REPORT_STATUS } from "../../../../domain/rehab/rehabEnums";
import { sessionAverageRom } from "../../../../domain/rehab/rehabDerived";
import { ROUTES } from "../../../../utils/routes";

/**
 * THE Doctor Assistant insight engine — pure functions over a
 * `useRehabPatient(patientId)`-shaped bundle (the exact same bundle
 * DoctorPatientWorkspace's tabs already consume) or a
 * `useRehabWorklist()`-shaped list. No JSX, no localStorage, no
 * navigation, no mutation (per the task's own Section 4 constraint) —
 * every insight returned is a plain descriptor:
 *
 *   { category, severity, messageKey, values, actions, ...extra }
 *
 * `actions` is `{ id, labelKey, routeTo }[]` — the EXACT shape
 * doctorAssistantMockHistory.js/doctorAssistantActions.js already use for
 * conversation-turn action buttons (DoctorConversationTurn.jsx), so the
 * same descriptor can drive an inline Workspace card AND (via
 * doctorAssistantActions.js) a chat response, without two action shapes.
 *
 * Severity/priority is NEVER invented here — `buildClinicalInsight`
 * selects its template purely from `bundle.priority.reasons`
 * (rehabDerived.derivePatientPriority, the exact same computation
 * DoctorPatients.jsx's worklist and DoctorPatientWorkspace already use).
 * This module only decides WHICH translated template best explains an
 * already-derived fact, and interpolates already-derived numbers into it
 * — it never recomputes adherence/attention/trends itself.
 */

export const INSIGHT_SEVERITY = {
  DANGER: "danger",
  WARNING: "warning",
  INFO: "info",
  SUCCESS: "success",
};

const SEVERITY_RANK = {
  [INSIGHT_SEVERITY.DANGER]: 0,
  [INSIGHT_SEVERITY.WARNING]: 1,
  [INSIGHT_SEVERITY.INFO]: 2,
  [INSIGHT_SEVERITY.SUCCESS]: 3,
};

const workspaceRoute = (patientId, tab) => {
  const base = ROUTES.DOCTOR_PATIENT_PROFILE.replace(":id", patientId);
  return tab ? `${base}?tab=${tab}` : base;
};

const ACTIONS = {
  reviewSession: (patientId) => ({ id: "reviewSession", labelKey: "doctorAssistantInsights.actions.reviewSession", routeTo: workspaceRoute(patientId, "sessions") }),
  reviewReport: (patientId) => ({ id: "reviewReport", labelKey: "doctorAssistantInsights.actions.reviewReport", routeTo: workspaceRoute(patientId, "reports") }),
  reviewPlan: (patientId) => ({ id: "reviewPlan", labelKey: "doctorAssistantInsights.actions.reviewPlan", routeTo: workspaceRoute(patientId, "rehabilitation") }),
  reviewAppointment: (patientId) => ({ id: "reviewAppointment", labelKey: "doctorAssistantInsights.actions.reviewAppointment", routeTo: workspaceRoute(patientId, "appointments") }),
  openPatient: (patientId) => ({ id: "openPatient", labelKey: "doctorAssistantInsights.actions.openPatient", routeTo: workspaceRoute(patientId) }),
};

const dedupeActions = (actionLists) => {
  const seen = new Set();
  const out = [];
  actionLists.flat().forEach((action) => {
    if (seen.has(action.id)) return;
    seen.add(action.id);
    out.push(action);
  });
  return out;
};

/**
 * The primary clinical narrative (Section 5.A-E) — a finite, deterministic
 * template selection over `bundle.priority.reasons`. Pain/ROM values come
 * straight from the two most recent canonical sessions (the same records
 * the Sessions tab renders); adherence values come straight from
 * `bundle.adherence` (the same object the Overview/worklist cards show).
 */
export const buildClinicalInsight = (bundle) => {
  const { patient, priority, adherence, sessions, romTrend, painTrend } = bundle;
  const reasonCodes = new Set(priority.reasons.map((reason) => reason.code));
  const hasPain = reasonCodes.has(ATTENTION_REASON.PAIN_INCREASED);
  const hasRom = reasonCodes.has(ATTENTION_REASON.ROM_REGRESSION);
  const hasAdherenceIssue = reasonCodes.has(ATTENTION_REASON.MISSED_SESSIONS) || reasonCodes.has(ATTENTION_REASON.LOW_ADHERENCE);

  const latest = sessions[sessions.length - 1] || null;
  const previous = sessions[sessions.length - 2] || null;

  const values = {
    name: patient.firstName,
    painFrom: previous?.painAfter ?? null,
    painTo: latest?.painAfter ?? null,
    romFrom: previous ? sessionAverageRom(previous) : null,
    romTo: latest ? sessionAverageRom(latest) : null,
    completed: adherence.completed,
    expected: adherence.expected,
    percent: adherence.percent,
  };

  if (hasPain && hasRom) {
    return {
      category: "clinical",
      severity: INSIGHT_SEVERITY.DANGER,
      messageKey: "doctorAssistantInsights.clinical.painRomCombo",
      values,
      actions: [ACTIONS.reviewSession(patient.id), ACTIONS.reviewReport(patient.id), ACTIONS.reviewPlan(patient.id)],
    };
  }
  if (hasPain) {
    return {
      category: "clinical",
      severity: INSIGHT_SEVERITY.WARNING,
      messageKey: "doctorAssistantInsights.clinical.painOnly",
      values,
      actions: [ACTIONS.reviewSession(patient.id), ACTIONS.reviewReport(patient.id)],
    };
  }
  if (hasRom) {
    return {
      category: "clinical",
      severity: INSIGHT_SEVERITY.WARNING,
      messageKey: "doctorAssistantInsights.clinical.romOnly",
      values,
      actions: [ACTIONS.reviewSession(patient.id), ACTIONS.reviewPlan(patient.id)],
    };
  }
  if (hasAdherenceIssue) {
    return {
      category: "adherence",
      severity: INSIGHT_SEVERITY.WARNING,
      messageKey: "doctorAssistantInsights.clinical.lowAdherence",
      values,
      actions: [ACTIONS.reviewPlan(patient.id), ACTIONS.reviewSession(patient.id)],
    };
  }

  // No negative signal — check whether the data actually supports a
  // POSITIVE call-out (Section 5.E) rather than defaulting straight to
  // a generic "stable" every time.
  const romImproving = romTrend && romTrend.to > romTrend.from;
  const painImproving = painTrend && painTrend.to < painTrend.from;
  const adherenceStrong = adherence.percent === null || adherence.percent >= 80;
  if (romImproving && painImproving && adherenceStrong) {
    return {
      category: "progress",
      severity: INSIGHT_SEVERITY.SUCCESS,
      messageKey: "doctorAssistantInsights.clinical.goodProgress",
      values,
      actions: [ACTIONS.reviewPlan(patient.id)],
    };
  }

  return {
    category: "stable",
    severity: INSIGHT_SEVERITY.INFO,
    messageKey: "doctorAssistantInsights.clinical.stable",
    values,
    actions: [ACTIONS.reviewPlan(patient.id)],
  };
};

/** Report-tab-facing insight (Section 5.F, 10) — `null` when nothing is awaiting review. */
export const buildReportInsight = (bundle) => {
  const { patient, reports } = bundle;
  const pending = reports.find((report) => report.reviewStatus === REPORT_STATUS.AWAITING_REVIEW);
  if (!pending) return null;
  return {
    category: "report",
    severity: INSIGHT_SEVERITY.WARNING,
    messageKey: pending.flags.length > 0 ? "doctorAssistantInsights.report.awaitingReviewFlagged" : "doctorAssistantInsights.report.awaitingReview",
    values: { name: patient.firstName, flagCount: pending.flags.length },
    actions: [ACTIONS.reviewReport(patient.id)],
    report: pending,
  };
};

/** Appointment-tab-facing insight (Section 5.G-H, 11) — reflects the EXACT current status, never a stale "confirmed". */
export const buildAppointmentInsight = (bundle) => {
  const { patient, appointments } = bundle;
  const requested = appointments.find((appt) => appt.status === APPOINTMENT_STATUS.REQUESTED);
  if (requested) {
    return {
      category: "appointment",
      severity: INSIGHT_SEVERITY.WARNING,
      messageKey: "doctorAssistantInsights.appointment.requested",
      values: { name: patient.firstName },
      actions: [ACTIONS.reviewAppointment(patient.id)],
      appointment: requested,
    };
  }
  const proposed = appointments.find((appt) => appt.status === APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED);
  if (proposed) {
    return {
      category: "appointment",
      severity: INSIGHT_SEVERITY.INFO,
      messageKey: "doctorAssistantInsights.appointment.alternativeProposed",
      values: { name: patient.firstName },
      actions: [ACTIONS.reviewAppointment(patient.id)],
      appointment: proposed,
    };
  }
  return null;
};

/** Sessions-tab-facing insight (Section 5.C, 9) — only when the LATEST session itself carries a clinical flag. */
export const buildLatestSessionInsight = (bundle) => {
  const clinical = buildClinicalInsight(bundle);
  if (clinical.category !== "clinical") return null;
  return clinical;
};

/**
 * Clinician-only note insight (Section 12) — surfaces the most recent
 * clinician note ONLY within the Doctor Workspace; this function is never
 * called from anything Patient-facing, and the note content itself is
 * already filtered to `visibility: CLINICIAN_ONLY` by
 * rehabRepository.getClinicalNotes before it ever reaches this bundle.
 */
export const buildClinicalNoteInsight = (bundle) => {
  const { patient, clinicalNotes } = bundle;
  const latestNote = clinicalNotes[0]; // getClinicalNotes is already newest-first
  if (!latestNote) return null;
  return {
    category: "note",
    severity: INSIGHT_SEVERITY.INFO,
    messageKey: "doctorAssistantInsights.clinicalRecord.latestNote",
    values: { name: patient.firstName },
    note: latestNote,
  };
};

/**
 * The combined Overview narrative (Section 5.J, 7) — folds the clinical,
 * report, and appointment insights into one severity + a de-duplicated
 * action list, WITHOUT collapsing them into a single hand-written English
 * sentence: each piece keeps its own messageKey/values so the Overview
 * component renders up to three short translated sentences back to back,
 * exactly like the brief's own worked example reads.
 */
export const buildOverviewInsight = (bundle) => {
  const clinical = buildClinicalInsight(bundle);
  const report = buildReportInsight(bundle);
  const appointment = buildAppointmentInsight(bundle);

  const parts = [clinical, report, appointment].filter(Boolean);
  const severity = parts.reduce((worst, part) => (SEVERITY_RANK[part.severity] < SEVERITY_RANK[worst] ? part.severity : worst), INSIGHT_SEVERITY.SUCCESS);
  const actions = dedupeActions(parts.map((part) => part.actions || [])).slice(0, 4);

  return { clinical, report, appointment, severity, actions };
};

/**
 * ONE summary descriptor for the whole caseload (Section 23) — counts
 * only; per-patient reasoning belongs in the Workspace, not a paragraph on
 * the list page (Section 23/24's own "restrained" requirement).
 */
export const buildWorklistInsight = (worklist) => {
  // Same predicate DoctorPatients.jsx's own "Need attention" summary
  // metric already uses — one definition of "needs attention", not two.
  const attentionCount = worklist.filter((entry) => entry.priority.level === ATTENTION_LEVEL.NEEDS_ATTENTION).length;
  const reportCount = worklist.filter((entry) => entry.reports.some((report) => report.reviewStatus === REPORT_STATUS.AWAITING_REVIEW)).length;
  const appointmentCount = worklist.filter((entry) => entry.appointments.some((appt) => appt.status === APPOINTMENT_STATUS.REQUESTED)).length;

  if (attentionCount === 0 && reportCount === 0 && appointmentCount === 0) {
    return { messageKey: "doctorAssistantInsights.worklist.allStable", values: {} };
  }

  return {
    messageKey: "doctorAssistantInsights.worklist.summary",
    values: { attentionCount, reportCount, appointmentCount },
  };
};
