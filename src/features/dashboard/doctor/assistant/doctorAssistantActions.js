import { LuUsers, LuCalendarClock, LuFileText, LuActivity, LuTrendingDown, LuTrendingUp, LuCalendarPlus, LuCalendarCheck } from "react-icons/lu";
import { ROUTES } from "../../../../utils/routes";
import { rehabRepository } from "../../../../domain/rehab/useRehabDomain";
import { ATTENTION_REASON, ATTENTION_LEVEL_I18N_KEY, REPORT_TREND } from "../../../../domain/rehab/rehabEnums";
import { sessionAverageRom, compareReports, deriveReportTrend } from "../../../../domain/rehab/rehabDerived";
import {
  getTodayAppointments,
  getNewReports,
  getPatientsNeedingAttention,
  getPatientProgressSummary,
  getPendingAppointmentRequests,
  getUpcomingScheduleConflicts,
  getLatestReportTrendByPatient,
  getPrioritizedReportForReview,
  getPreviousReportForPatient,
} from "./doctorClinicalInsights";

/**
 * The Doctor Assistant action registry — the doctor-side counterpart to
 * patient/assistant/patientAssistantActions.js, deliberately a separate
 * file/registry (Doctor actions answer clinical/roster questions, Patient
 * actions answer the patient's own recovery questions).
 *
 * MIGRATED: every action below now reads from the shared rehab domain
 * (src/domain/rehab/) via doctorClinicalInsights.js — the old
 * data/doctorClinicalMockData.js dependency (an independent, ad-hoc
 * AHMED/SARA/MOHAMMED record never wired to the Doctor Patients module)
 * is gone. Route targets point at the canonical Patient Workspace
 * (`patient-ahmed`, `?tab=...`), not the old separate profile/reports/
 * exercises pages (those routes no longer exist).
 *
 * `execute({ navigate, t, language })` returns a response descriptor
 * `{ content, widget?, actions? }`. `actions` are always plain navigation
 * descriptors — `{ id, labelKey, routeTo }` — JSON-serializable, matching
 * doctorAssistantStorage.js's persistence contract.
 */

export const ASSISTANT_ACTION_TYPES = {
  DISPLAY: "DISPLAY",
};

const AHMED_ROUTE_ID = "patient-ahmed";
const ahmedProfileRoute = () => ROUTES.DOCTOR_PATIENT_PROFILE.replace(":id", AHMED_ROUTE_ID);
const ahmedReportsRoute = () => `${ahmedProfileRoute()}?tab=reports`;
const ahmedExercisesRoute = () => `${ahmedProfileRoute()}?tab=rehabilitation`;

/**
 * Resolves "ahmed"/"sara" out of the raw matched query text (Section 28 of
 * the Doctor Reports brief — "show sara's latest report" needs a
 * different patient than "show ahmed's latest report" from the SAME
 * registry entry). Bounded to the two canonical first names these
 * report-specific actions' own `patterns` below actually match on — same
 * honest, no-real-NLP scoping already established for DOCTOR_PATIENT_PROGRESS/
 * PATIENT_APPOINTMENTS (Ahmed-only) and PENDING_APPOINTMENT_REQUESTS-style
 * matching, just extended to a second name where the brief explicitly
 * asked for Sara by name.
 */
const resolveNamedPatientId = (query) => {
  const normalized = (query || "").toLowerCase();
  if (normalized.includes("sara")) return "patient-sara";
  if (normalized.includes("ahmed")) return AHMED_ROUTE_ID;
  return null;
};

const ADHERENCE_REASON_CODES = new Set([ATTENTION_REASON.MISSED_SESSIONS, ATTENTION_REASON.LOW_ADHERENCE]);

/**
 * Shared by DOCTOR_ATTENTION_PATIENTS/DOCTOR_ADHERENCE_RISK — builds the
 * `attentionList` widget's items directly from each patient's canonical
 * bundle (rehabRepository.getPatientBundle, the exact same builder
 * DoctorPatientWorkspace's tabs use). Metrics shown are picked from
 * whichever reasons are actually present (Section 5) — never a
 * hand-picked pair of numbers.
 */
export const buildAttentionItems = (bundles) =>
  bundles.map(({ patient, priority, sessions, adherence }) => {
    const latest = sessions[sessions.length - 1] || null;
    const previous = sessions[sessions.length - 2] || null;
    const reasonCodes = new Set(priority.reasons.map((reason) => reason.code));
    const metrics = [];

    if (reasonCodes.has(ATTENTION_REASON.PAIN_INCREASED) && latest && previous) {
      metrics.push({ labelKey: "doctorDashboard.assistant.metrics.pain", before: previous.painAfter, after: latest.painAfter });
    }
    if (reasonCodes.has(ATTENTION_REASON.ROM_REGRESSION) && latest && previous) {
      metrics.push({
        labelKey: "doctorDashboard.assistant.metrics.flexion",
        before: sessionAverageRom(previous),
        after: sessionAverageRom(latest),
        unit: "°",
      });
    }
    if ([...reasonCodes].some((code) => ADHERENCE_REASON_CODES.has(code))) {
      metrics.push({ labelKey: "doctorDashboard.assistant.metrics.adherence", value: adherence.percent, unit: "%" });
      if (adherence.missed) metrics.push({ labelKey: "doctorDashboard.assistant.metrics.missedSessions", value: adherence.missed });
    }

    return {
      patientId: patient.id,
      name: patient.name,
      severityKey: ATTENTION_LEVEL_I18N_KEY[priority.level],
      metrics,
      routeTo: ROUTES.DOCTOR_PATIENT_PROFILE.replace(":id", patient.id),
    };
  });

export const DOCTOR_ASSISTANT_ACTIONS = [
  {
    id: "DOCTOR_ATTENTION_PATIENTS",
    labelKey: "doctorDashboard.assistant.actions.attentionPatients",
    icon: LuUsers,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: [
        "who needs my attention",
        "needs attention",
        "who should i review",
        "patients needing attention",
        "who is falling behind",
        "attention today",
      ],
      ar: ["مين يحتاج مراجعة", "مرضى يحتاجون مراجعة", "مين أراجع اليوم", "المرضى اللي يحتاجون انتباه", "الحالات اللي تحتاج مراجعة"],
    },
    execute: ({ t, language }) => {
      const bundles = getPatientsNeedingAttention();
      if (bundles.length === 0) {
        return { content: t("doctorDashboard.assistant.responses.attentionNone", { lng: language }) };
      }
      return {
        content: t("doctorDashboard.assistant.responses.attentionIntro", { lng: language, count: bundles.length }),
        widget: { type: "attentionList", items: buildAttentionItems(bundles) },
      };
    },
  },
  {
    id: "DOCTOR_TODAY_APPOINTMENTS",
    labelKey: "doctorDashboard.assistant.actions.todayAppointments",
    icon: LuCalendarClock,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: ["today's appointments", "my appointments today", "who am i seeing today", "what's on my schedule", "appointments today", "my schedule"],
      ar: ["مواعيدي اليوم", "وش عندي اليوم", "مين عندي اليوم", "جدولي اليوم", "مواعيد اليوم"],
    },
    execute: ({ t, language }) => {
      const appointments = getTodayAppointments()
        .map((appointment) => ({ ...appointment, patient: rehabRepository.getPatient(appointment.patientId) }))
        .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

      if (appointments.length === 0) {
        return { content: t("doctorDashboard.assistant.responses.noAppointmentsToday", { lng: language }) };
      }

      const now = new Date();
      const nextIndex = appointments.findIndex((appointment) => new Date(appointment.startAt) > now);
      const next = nextIndex >= 0 ? appointments[nextIndex] : null;
      const following = nextIndex >= 0 ? appointments[nextIndex + 1] : null;

      let content;
      if (next && following) {
        content = t("doctorDashboard.assistant.responses.todayAppointmentsIntroWithNext", {
          lng: language,
          count: appointments.length,
          nextName: next.patient?.name || "",
          nextTime: new Date(next.startAt).toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" }),
          followingName: following.patient?.name || "",
          followingTime: new Date(following.startAt).toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" }),
        });
      } else if (next) {
        content = t("doctorDashboard.assistant.responses.todayAppointmentsIntroLast", {
          lng: language,
          count: appointments.length,
          nextName: next.patient?.name || "",
          nextTime: new Date(next.startAt).toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" }),
        });
      } else {
        content = t("doctorDashboard.assistant.responses.todayAppointmentsIntroDone", { lng: language, count: appointments.length });
      }

      return {
        content,
        widget: {
          type: "appointmentList",
          items: appointments.map((appointment) => ({
            id: appointment.id,
            name: appointment.patient?.name || "",
            timeIso: appointment.startAt,
            reasonKey: `doctorDashboard.assistant.reasons.${appointment.reasonCode}`,
          })),
        },
      };
    },
  },
  {
    id: "DOCTOR_REPORT_SUMMARY",
    labelKey: "doctorDashboard.assistant.actions.reportSummary",
    icon: LuFileText,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: [
        "summarize today's reports",
        "summarize reports",
        "new reports",
        "today's reports",
        "report summary",
        "which reports need my attention",
        "reports need my attention",
        "show reports awaiting review",
        "reports awaiting review",
      ],
      ar: ["لخص تقارير اليوم", "تقارير اليوم", "ملخص التقارير", "تقارير جديدة", "أي تقارير تحتاج مراجعتي", "تقارير بانتظار المراجعة"],
    },
    execute: ({ t, language }) => {
      const entries = getNewReports();
      if (entries.length === 0) {
        return { content: t("doctorDashboard.assistant.responses.noNewReports", { lng: language }) };
      }
      return {
        content: t("doctorDashboard.assistant.responses.reportSummaryIntro", { lng: language, count: entries.length }),
        widget: {
          type: "reportList",
          items: entries.map(({ report, patient }) => ({
            id: report.id,
            patientName: patient.name,
            summary:
              report.painTrend && report.adherencePercent !== null
                ? t("doctorAssistantInsights.report.compactSummary", {
                    lng: language,
                    percent: report.adherencePercent,
                    painFrom: report.painTrend.from,
                    painTo: report.painTrend.to,
                  })
                : t("doctorAssistantInsights.report.compactSummaryNoTrend", { lng: language, percent: report.adherencePercent }),
          })),
        },
        actions: [{ id: "view-reports", labelKey: "doctorDashboard.assistant.responses.viewAllReports", routeTo: ROUTES.DOCTOR_REPORTS }],
      };
    },
  },
  {
    id: "WHO_IMPROVED",
    labelKey: "doctorDashboard.assistant.actions.whoImproved",
    icon: LuTrendingUp,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: ["who improved", "who improved the most", "which patient improved the most", "who is improving"],
      ar: ["مين تحسن", "مين تحسن أكثر", "أي مريض تحسن أكثر"],
    },
    execute: ({ t, language }) => {
      const { improved } = getLatestReportTrendByPatient();
      if (improved.length === 0) {
        return { content: t("doctorDashboard.assistant.responses.noImprovedPatients", { lng: language }) };
      }
      return {
        content: t("doctorDashboard.assistant.responses.whoImprovedIntro", { lng: language, count: improved.length }),
        widget: {
          type: "reportList",
          items: improved.map(({ report, patient }) => ({
            id: report.id,
            patientName: patient.name,
            summary:
              report.painTrend && report.romTrend
                ? t("doctorAssistantInsights.report.improvedSummary", { lng: language, painFrom: report.painTrend.from, painTo: report.painTrend.to, romFrom: report.romTrend.from, romTo: report.romTrend.to })
                : t("doctorAssistantInsights.report.compactSummaryNoTrend", { lng: language, percent: report.adherencePercent }),
          })),
        },
        actions: [{ id: "view-reports", labelKey: "doctorDashboard.assistant.responses.viewAllReports", routeTo: ROUTES.DOCTOR_REPORTS }],
      };
    },
  },
  {
    id: "WHO_REGRESSED",
    labelKey: "doctorDashboard.assistant.actions.whoRegressed",
    icon: LuTrendingDown,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: [
        "who is getting worse",
        "who regressed",
        "who has regressed",
        "which patient had the biggest pain increase",
        "biggest pain increase",
        "any noteworthy changes",
        "noteworthy changes",
      ],
      ar: ["مين وضعه يسوء", "مين تراجع", "أكبر زيادة في الألم", "فيه تغييرات مهمة"],
    },
    execute: ({ t, language }) => {
      const { regressed } = getLatestReportTrendByPatient();
      if (regressed.length === 0) {
        return { content: t("doctorDashboard.assistant.responses.noRegressedPatients", { lng: language }) };
      }
      return {
        content: t("doctorDashboard.assistant.responses.whoRegressedIntro", { lng: language, count: regressed.length }),
        widget: {
          type: "reportList",
          items: regressed.map(({ report, patient }) => ({
            id: report.id,
            patientName: patient.name,
            summary: t("doctorAssistantInsights.report.flagsSummary", { lng: language, flags: report.flags.map((flag) => t(`doctorPatientWorkspace.reports.flags.${flag}`, { lng: language })).join(", ") }),
          })),
        },
        actions: [{ id: "view-reports", labelKey: "doctorDashboard.assistant.responses.viewAllReports", routeTo: ROUTES.DOCTOR_REPORTS }],
      };
    },
  },
  {
    id: "HIGHEST_PRIORITY_REPORT",
    labelKey: "doctorDashboard.assistant.actions.highestPriorityReport",
    icon: LuFileText,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: ["open the highest-priority report", "highest priority report", "which report should i review first"],
      ar: ["افتح أهم تقرير", "أهم تقرير للمراجعة", "أي تقرير أراجع أول"],
    },
    execute: ({ t, language }) => {
      const top = getPrioritizedReportForReview();
      if (!top) {
        return { content: t("doctorDashboard.assistant.responses.noNewReports", { lng: language }) };
      }
      return {
        content: t("doctorDashboard.assistant.responses.highestPriorityReportIntro", { lng: language, name: top.patient.name }),
        actions: [{ id: "open-report", labelKey: "doctorDashboard.assistant.responses.viewAllReports", routeTo: `${ROUTES.DOCTOR_REPORTS}?openReport=${top.report.id}` }],
      };
    },
  },
  {
    id: "PATIENT_LATEST_REPORT",
    labelKey: "doctorDashboard.assistant.actions.ahmedLatestReport",
    icon: LuFileText,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    // Ahmed/Sara scoped (see resolveNamedPatientId above).
    patterns: {
      en: ["ahmed's latest report", "sara's latest report", "show ahmed's latest report", "show sara's latest report", "ahmed's report", "sara's report"],
      ar: ["آخر تقرير لأحمد", "آخر تقرير لسارة", "تقرير أحمد", "تقرير سارة"],
    },
    execute: ({ t, language, query }) => {
      const patientId = resolveNamedPatientId(query);
      const patient = patientId ? rehabRepository.getPatient(patientId) : null;
      // rehabRepository.getReports sorts newest-first (by periodEnd desc), so index 0 is the latest.
      const reports = patientId ? rehabRepository.getReports(patientId) : [];
      const latest = reports[0] || null;
      if (!patient || !latest) {
        return { content: t("doctorDashboard.assistant.responses.patientNoReports", { lng: language, name: patient?.name || "" }) };
      }
      const trend = deriveReportTrend(latest);
      return {
        content: t("doctorDashboard.assistant.responses.patientLatestReportIntro", {
          lng: language,
          name: patient.name,
          trend: t(`rehabDomain.attentionLevel.${trend === REPORT_TREND.IMPROVING ? "improving" : trend === REPORT_TREND.NEEDS_ATTENTION ? "needsAttention" : "stable"}`, { lng: language }),
        }),
        actions: [{ id: "open-report", labelKey: "doctorDashboard.assistant.responses.viewAllReports", routeTo: `${ROUTES.DOCTOR_REPORTS}?openReport=${latest.id}` }],
      };
    },
  },
  {
    id: "COMPARE_LATEST_REPORTS",
    labelKey: "doctorDashboard.assistant.actions.compareLatestReports",
    icon: LuFileText,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: ["compare ahmed's latest two reports", "compare sara's latest two reports", "compare ahmed's reports", "compare sara's reports"],
      ar: ["قارن آخر تقريرين لأحمد", "قارن آخر تقريرين لسارة"],
    },
    execute: ({ t, language, query }) => {
      const patientId = resolveNamedPatientId(query);
      const patient = patientId ? rehabRepository.getPatient(patientId) : null;
      // rehabRepository.getReports sorts newest-first (by periodEnd desc), so index 0 is the latest.
      const reports = patientId ? rehabRepository.getReports(patientId) : [];
      const latest = reports[0] || null;
      const previous = latest ? getPreviousReportForPatient(patientId, latest.id) : null;
      if (!patient || !latest || !previous) {
        return { content: t("doctorDashboard.assistant.responses.noComparableReports", { lng: language, name: patient?.name || "" }) };
      }
      const rows = compareReports(latest, previous);
      if (rows.length === 0) {
        return { content: t("doctorDashboard.assistant.responses.noComparableReports", { lng: language, name: patient.name }) };
      }
      const parts = rows.map((row) => {
        const unit = row.metric === "rom" ? "°" : row.metric === "adherence" ? "%" : "";
        const arrow = row.change === 0 ? "" : row.change > 0 ? "↑" : "↓";
        return `${t(`doctorReports.detail.metrics.${row.metric}`, { lng: language })} ${row.previous}${unit} → ${row.current}${unit} (${arrow}${Math.abs(row.change)}${unit})`;
      });
      return {
        content: t("doctorDashboard.assistant.responses.compareLatestReportsIntro", { lng: language, name: patient.name, comparison: parts.join(" · ") }),
        actions: [{ id: "open-report", labelKey: "doctorDashboard.assistant.responses.viewAllReports", routeTo: `${ROUTES.DOCTOR_REPORTS}?openReport=${latest.id}` }],
      };
    },
  },
  {
    id: "DOCTOR_PATIENT_PROGRESS",
    labelKey: "doctorDashboard.assistant.actions.ahmedProgress",
    icon: LuActivity,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: ["how is ahmed", "ahmed progress", "ahmed's progress", "how is ahmed doing", "ahmed ali progress"],
      ar: ["كيف أحمد", "وش وضع أحمد", "تقدم أحمد", "كيف حال أحمد"],
    },
    execute: ({ t, language }) => {
      const summary = getPatientProgressSummary(AHMED_ROUTE_ID);
      return {
        content: t("doctorDashboard.assistant.responses.ahmedProgressSummary", {
          lng: language,
          completed: summary.completed,
          prescribed: summary.prescribed,
          percent: summary.percent,
          flexionOldest: summary.flexionOldest,
          flexionLatest: summary.flexionLatest,
          painRecentAverage: summary.painRecentAverage,
          painLatest: summary.painLatest,
          sessionDelta: Math.abs(summary.flexionLatestSessionDelta ?? 0),
        }),
        actions: [
          { id: "open-ahmed", labelKey: "doctorDashboard.assistant.responses.openPatient", routeTo: ahmedProfileRoute() },
          { id: "ahmed-report", labelKey: "doctorDashboard.assistant.responses.viewLatestReport", routeTo: ahmedReportsRoute() },
          { id: "ahmed-rehab", labelKey: "doctorDashboard.assistant.responses.reviewRehabProgram", routeTo: ahmedExercisesRoute() },
        ],
      };
    },
  },
  {
    id: "PATIENT_APPOINTMENTS",
    labelKey: "doctorDashboard.assistant.actions.ahmedAppointments",
    icon: LuCalendarClock,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    // Ahmed-only, same honest scoping precedent as DOCTOR_PATIENT_PROGRESS
    // above (this demo's free-text matcher can only reliably recognize one
    // named patient without real NLP — matching "sara's appointments" would
    // need per-patient pattern sets this bounded matcher doesn't have).
    patterns: {
      en: ["ahmed's appointments", "ahmed appointments", "show ahmed's appointments", "what are ahmed's appointments"],
      ar: ["مواعيد أحمد", "مواعيد أحمد علي", "وش مواعيد أحمد"],
    },
    execute: ({ t, language }) => {
      const appointments = rehabRepository.getAppointments(AHMED_ROUTE_ID);
      if (appointments.length === 0) {
        return { content: t("doctorDashboard.assistant.responses.patientAppointmentsNone", { lng: language, name: "Ahmed Ali" }) };
      }
      return {
        content: t("doctorDashboard.assistant.responses.patientAppointmentsIntro", { lng: language, name: "Ahmed Ali", count: appointments.length }),
        widget: {
          // Reuses the existing appointmentList widget/renderer — its
          // `reasonKey` slot holds the appointment STATUS here (this
          // action is a per-patient rundown, not a "why" explanation),
          // which the same generic `t(item.reasonKey)` call already
          // renders correctly since it's just a translation key.
          type: "appointmentList",
          items: appointments.map((appointment) => ({
            id: appointment.id,
            name: `Ahmed Ali`,
            timeIso: appointment.startAt,
            reasonKey: `doctorAppointments.status.${appointment.status}`,
          })),
        },
        actions: [{ id: "open-ahmed-appointments", labelKey: "doctorAssistantInsights.actions.openPatient", routeTo: `${ahmedProfileRoute()}?tab=appointments` }],
      };
    },
  },
  {
    id: "PENDING_APPOINTMENT_REQUESTS",
    labelKey: "doctorDashboard.assistant.actions.pendingRequests",
    icon: LuCalendarCheck,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: [
        "pending appointment requests",
        "appointment requests",
        "who is waiting for an appointment",
        "new appointment requests",
        "requests waiting",
        "who requested an appointment",
        "show pending appointment requests",
      ],
      ar: ["طلبات المواعيد", "طلبات مواعيد بالانتظار", "مين ينتظر موعد", "طلبات جديدة للمواعيد", "مين طلب موعد"],
    },
    execute: ({ t, language }) => {
      const pending = getPendingAppointmentRequests();
      if (pending.length === 0) {
        return { content: t("doctorDashboard.assistant.responses.noPendingRequests", { lng: language }) };
      }
      return {
        content: t("doctorDashboard.assistant.responses.pendingRequestsIntro", { lng: language, count: pending.length }),
        widget: {
          type: "appointmentRequestList",
          items: pending.map(({ appointment, patient }) => ({
            id: appointment.id,
            name: patient?.name || "",
            timeIso: appointment.startAt,
            reviewRoute: `${ROUTES.APPOINTMENTS}?openAppointment=${appointment.id}`,
          })),
        },
      };
    },
  },
  {
    id: "SCHEDULE_APPOINTMENT",
    labelKey: "doctorDashboard.assistant.actions.scheduleAppointment",
    icon: LuCalendarPlus,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: ["schedule an appointment", "book an appointment", "create an appointment", "schedule appointment", "new appointment"],
      ar: ["احجز موعد", "جدولة موعد", "أضف موعد", "موعد جديد"],
    },
    execute: ({ t, language }) => {
      const patients = rehabRepository.getPatients();
      return {
        content: t("doctorDashboard.assistant.responses.scheduleAppointmentIntro", { lng: language }),
        // Each button opens the SAME canonical composer the Global
        // Appointments page and the Workspace both use, locked to that
        // patient (Section 17 — never a separate Assistant-only form).
        actions: patients.map((patient) => ({
          id: `schedule-${patient.id}`,
          label: patient.name,
          routeTo: `${ROUTES.APPOINTMENTS}?composeFor=${patient.id}`,
        })),
      };
    },
  },
  {
    id: "CHECK_SCHEDULE_CONFLICTS",
    labelKey: "doctorDashboard.assistant.actions.checkConflicts",
    icon: LuCalendarClock,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: ["check for scheduling conflicts", "any scheduling conflicts", "double booked", "schedule conflicts", "overlapping appointments"],
      ar: ["فيه تعارض بالمواعيد", "مواعيد متعارضة", "تحقق من تعارض الجدول"],
    },
    execute: ({ t, language }) => {
      const conflicts = getUpcomingScheduleConflicts();
      if (conflicts.length === 0) {
        return { content: t("doctorDashboard.assistant.responses.noScheduleConflicts", { lng: language }) };
      }
      return {
        content: t("doctorDashboard.assistant.responses.scheduleConflictsIntro", { lng: language, count: conflicts.length }),
        actions: [{ id: "view-appointments", labelKey: "doctorDashboard.assistant.responses.viewAppointments", routeTo: ROUTES.APPOINTMENTS }],
      };
    },
  },
  {
    id: "DOCTOR_ADHERENCE_RISK",
    labelKey: "doctorDashboard.assistant.actions.adherenceRisk",
    icon: LuTrendingDown,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: ["falling behind", "adherence risk", "who is missing sessions", "low adherence", "behind on rehab"],
      ar: ["متأخرين بالتأهيل", "التزام ضعيف", "مين ملتزم أقل", "مرضى متأخرين"],
    },
    execute: ({ t, language }) => {
      const bundles = getPatientsNeedingAttention().filter((bundle) => bundle.priority.reasons.some((reason) => ADHERENCE_REASON_CODES.has(reason.code)));
      if (bundles.length === 0) {
        return { content: t("doctorDashboard.assistant.responses.adherenceRiskNone", { lng: language }) };
      }
      return {
        content: t("doctorDashboard.assistant.responses.adherenceRiskIntro", { lng: language, count: bundles.length }),
        widget: { type: "attentionList", items: buildAttentionItems(bundles) },
      };
    },
  },
];

const normalize = (value) => (typeof value === "string" ? value.toLowerCase().trim() : "");

/** Bounded, deterministic free-form matcher — NOT NLP. Mirrors patientAssistantActions.js's own matchAssistantAction exactly. */
export const matchAssistantAction = (query, language) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return null;

  const matches = DOCTOR_ASSISTANT_ACTIONS.filter((action) => {
    const patterns = action.patterns?.[language] || [];
    return patterns.some((pattern) => normalizedQuery.includes(normalize(pattern)));
  });

  return matches.length === 1 ? matches[0] : null;
};

/**
 * A small, honest "not connected yet" dictionary for the one capability
 * the seeded mock conversation #2 demonstrates that the LIVE registry
 * above does not implement — rescheduling an appointment directly from
 * chat (the real reschedule flow is the Appointments tab's "Propose new
 * time" action). Never silently pretends a typed request did anything.
 */
const CAPABILITY_FALLBACK_THEMES = [
  {
    id: "reschedule",
    responseKey: "doctorDashboard.assistant.responses.capabilityReschedule",
    patterns: {
      en: ["move his appointment", "move the appointment", "reschedule", "change the appointment time", "move him to"],
      ar: ["غيّر الموعد", "أجل الموعد", "حرك الموعد", "بدل وقت الموعد"],
    },
  },
];

export const matchCapabilityTheme = (query, language) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return null;
  return (
    CAPABILITY_FALLBACK_THEMES.find((theme) => (theme.patterns?.[language] || []).some((pattern) => normalizedQuery.includes(normalize(pattern)))) || null
  );
};
