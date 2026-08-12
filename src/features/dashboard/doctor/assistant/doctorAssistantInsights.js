import { ATTENTION_LEVEL, ATTENTION_REASON, APPOINTMENT_STATUS, REPORT_STATUS, REPORT_TREND } from "../../../../domain/rehab/rehabEnums";
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
 * The Doctor Appointments (Global Calendar) page's own compact Assistant
 * card — the SAME `{severity, lines, actionIds}` shape every other surface
 * in this file already produces, just fed by pre-fetched CROSS-patient
 * facts (`topRequest` from doctorClinicalInsights.getPrioritizedPending
 * AppointmentRequest, `todayAppointments` from getTodayAppointments)
 * instead of one patient's bundle. `actionIds` are semantic strings
 * (never JSX/navigation) — the page component maps them onto its own
 * local handlers (open the details modal, mutate via rehabRepository,
 * navigate to the Workspace), so this function stays a pure derivation
 * with no DOM/routing concerns, exactly like every other builder here.
 *
 * When the top request's patient ALSO has a live clinical reason
 * (`bundle.priority.reasons`), a second line is added by reusing
 * `buildClinicalInsight`'s own messageKey/values for that same reason —
 * never a new clinical sentence invented here (Section 9/15 of the
 * brief: no duplicated clinical logic, no fabricated urgency).
 *
 * `formatDateTime` is an injected `(isoString) => string` — locale-aware
 * date formatting needs `i18n.language`, which this file deliberately
 * never imports (every other builder here leaves locale formatting to
 * its caller too; see doctorAssistantActions.js's own inline
 * `toLocaleTimeString` calls), so the caller (DoctorCalendar.jsx) passes
 * its own formatter instead of this module reaching for React context.
 */
export const buildAppointmentsPageInsight = ({ topRequest, todayAppointments, formatDateTime }) => {
  if (topRequest) {
    const { appointment, patient, bundle } = topRequest;
    const lines = [
      { messageKey: "doctorAssistantInsights.appointmentsPage.pendingRequest", values: { name: patient.firstName, dateTime: formatDateTime(appointment.startAt) } },
    ];

    // Pick the strongest already-derived clinical reason, same precedence
    // buildClinicalInsight itself checks (pain, then ROM, then adherence) —
    // this only SELECTS which existing fact to mention, it never computes
    // a new one.
    const clinicalReasonKey = { [ATTENTION_REASON.PAIN_INCREASED]: "pain", [ATTENTION_REASON.ROM_REGRESSION]: "rom", [ATTENTION_REASON.MISSED_SESSIONS]: "missedSessions" };
    const topClinicalReason = bundle.priority.reasons.find((reason) => clinicalReasonKey[reason.code]);
    if (topClinicalReason) {
      lines.push({
        messageKey: `doctorAssistantInsights.appointmentsPage.clinicalContext.${clinicalReasonKey[topClinicalReason.code]}`,
        values: { name: patient.firstName },
      });
    } else if (todayAppointments.length > 0) {
      lines.push({ messageKey: "doctorAssistantInsights.appointmentsPage.alsoToday", values: { count: todayAppointments.length } });
    }

    return {
      severity: bundle.priority.level === ATTENTION_LEVEL.NEEDS_ATTENTION ? INSIGHT_SEVERITY.WARNING : INSIGHT_SEVERITY.INFO,
      lines,
      actionIds: ["reviewRequest", "accept", "proposeNewTime"],
      topRequestAppointmentId: appointment.id,
      topRequestPatientId: patient.id,
    };
  }

  if (todayAppointments.length === 0) {
    return {
      severity: INSIGHT_SEVERITY.INFO,
      lines: [{ messageKey: "doctorAssistantInsights.appointmentsPage.noneToday", values: {} }],
      actionIds: ["scheduleAppointment"],
    };
  }

  const sorted = [...todayAppointments].sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  const next = sorted[0];
  return {
    severity: INSIGHT_SEVERITY.INFO,
    lines: [
      {
        messageKey: "doctorAssistantInsights.appointmentsPage.todaySummary",
        values: { count: todayAppointments.length, nextName: next.patient?.name || "", time: formatDateTime(next.startAt, { timeOnly: true }) },
      },
    ],
    actionIds: next.patient ? ["viewToday", "openNextPatient"] : ["viewToday"],
    nextPatientId: next.patient?.id || null,
  };
};

/**
 * The Doctor Reports page's own compact Assistant card — same
 * `{severity, lines, actionIds}` shape as `buildAppointmentsPageInsight`,
 * fed by `doctorClinicalInsights.getPrioritizedReportForReview()` (the
 * single awaiting-review report ranked by its OWN already-derived trend,
 * never a new score) and `awaitingReviewCount`. When the top report's
 * trend is NEEDS_ATTENTION, its `report.flags` (already computed by
 * `generateReportMetrics`, never recomputed here) are translated into the
 * second line via the SAME `doctorPatientWorkspace.reports.flags.*` keys
 * the Workspace Reports tab already uses for that exact report shape.
 * `translateFlag` is an injected `(flagCode) => string` — resolving a
 * translation key needs `t()`, which (like `formatDateTime` in the
 * Appointments-page insight above) this file deliberately never imports,
 * so the caller passes its own translator instead. `hasUpcomingAppointment`
 * (Section 26 — connecting Reports to the now-canonical Appointments
 * domain) is a plain boolean the caller derives from
 * `bundle.appointments`; when the top report needs attention and its
 * patient has neither a pending request nor a future confirmed visit, the
 * card offers "Schedule appointment" instead of "Open patient" — never
 * phrased as medically required, only as an available workflow action.
 */
export const buildReportsPageInsight = ({ prioritizedReport, awaitingReviewCount, translateFlag, hasUpcomingAppointment }) => {
  if (prioritizedReport) {
    const { report, patient, trend } = prioritizedReport;
    const lines = [
      {
        messageKey:
          trend === REPORT_TREND.NEEDS_ATTENTION
            ? "doctorAssistantInsights.reportsPage.needsAttentionLead"
            : "doctorAssistantInsights.reportsPage.awaitingReviewLead",
        values: { name: patient.firstName },
      },
    ];

    const needsAttentionNoAppointment = trend === REPORT_TREND.NEEDS_ATTENTION && !hasUpcomingAppointment;

    if (trend === REPORT_TREND.NEEDS_ATTENTION && report.flags.length > 0) {
      lines.push({
        messageKey: "doctorAssistantInsights.reportsPage.flagSummary",
        values: { flag: translateFlag(report.flags[0]) },
      });
    } else if (awaitingReviewCount > 1) {
      lines.push({ messageKey: "doctorAssistantInsights.reportsPage.alsoAwaiting", values: { count: awaitingReviewCount - 1 } });
    }

    if (needsAttentionNoAppointment) {
      lines.push({ messageKey: "doctorAssistantInsights.reportsPage.noUpcomingAppointment", values: {} });
    }

    return {
      severity: trend === REPORT_TREND.NEEDS_ATTENTION ? INSIGHT_SEVERITY.WARNING : INSIGHT_SEVERITY.INFO,
      lines,
      actionIds: needsAttentionNoAppointment ? ["reviewReport", "compareWithPrevious", "scheduleAppointment"] : ["reviewReport", "compareWithPrevious", "openPatient"],
      topReportId: report.id,
      topReportPatientId: patient.id,
    };
  }

  return {
    severity: INSIGHT_SEVERITY.SUCCESS,
    lines: [{ messageKey: "doctorAssistantInsights.reportsPage.noneAwaiting", values: {} }],
    actionIds: [],
  };
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
