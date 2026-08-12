import { LuUsers, LuCalendarClock, LuFileText, LuActivity, LuTrendingDown } from "react-icons/lu";
import { ROUTES } from "../../../../utils/routes";
import { getTodayAppointments, getNewReports, getPatientById } from "../data/doctorClinicalMockData";
import { getAhmedTrend, getPatientsNeedingAttention, ATTENTION_SEVERITY } from "./doctorClinicalInsights";

/**
 * The Doctor Assistant action registry — the doctor-side counterpart to
 * patient/assistant/patientAssistantActions.js, DELIBERATELY a separate
 * file/registry (never merged — Doctor actions answer clinical/roster
 * questions, Patient actions answer the patient's own recovery questions;
 * combining them would blur a distinction the whole product depends on).
 *
 * Same shape/contract as the patient registry on purpose (so a future real
 * backend's intent resolution could drive either registry identically):
 * `execute({ navigate, t, language })` returns a response descriptor
 * `{ message, widget?, actions? }`. `actions` here are ALWAYS plain
 * navigation descriptors — `{ id, labelKey, routeTo }`, no closures — so
 * every action button is JSON-serializable (this is what lets a
 * localStorage-restored conversation's buttons keep working after a
 * refresh; see doctorAssistantStorage.js).
 *
 * ROUTES: DoctorPatientProfile.jsx/DoctorPatientReportsPage.jsx/
 * DoctorPatientExercisesPage.jsx all read `:id` from the URL but (audited
 * before writing this) none of them actually use it to look up a specific
 * patient — Reports/Exercises show fixed generic mock lists, and Profile
 * always renders one hardcoded "Ahmed Ali" record regardless of the id
 * passed. That happens to make an Ahmed-specific deep link honest (it
 * really does show Ahmed), but doing the same for Sara or Mohammed would
 * silently show the WRONG patient's data — so only Ahmed ever gets a
 * per-patient `routeTo` below; every other patient falls back to the
 * genuinely patient-agnostic list route (ROUTES.DOCTOR_PATIENTS), per the
 * task's own "if only a list route exists, use the list route" rule.
 */

export const ASSISTANT_ACTION_TYPES = {
  DISPLAY: "DISPLAY",
};

// "ahmed-ali" matches doctorClinicalMockData.js's own AHMED.id (that
// module is a separate, Assistant-only mock — see its header comment —
// not yet migrated onto the shared rehab domain's canonical
// "patient-ahmed" id; full migration is tracked as follow-up work).
// Route targets below DO use the canonical workspace id/route, since
// that is what actually exists post-refactor (Section 9: one Workspace
// route with local tabs, replacing the old separate profile/reports/
// exercises routes this file used to point at).
const AHMED_ID = "ahmed-ali";
const CANONICAL_AHMED_ROUTE_ID = "patient-ahmed";
const ahmedProfileRoute = () => ROUTES.DOCTOR_PATIENT_PROFILE.replace(":id", CANONICAL_AHMED_ROUTE_ID);
const ahmedReportsRoute = () => `${ahmedProfileRoute()}?tab=reports`;
const ahmedExercisesRoute = () => `${ahmedProfileRoute()}?tab=rehabilitation`;

const severityToKey = (severity) => {
  switch (severity) {
    case ATTENTION_SEVERITY.HIGH:
      return "high";
    case ATTENTION_SEVERITY.FOLLOW_UP:
      return "followUp";
    case ATTENTION_SEVERITY.POSITIVE:
      return "positive";
    default:
      return "neutral";
  }
};

/**
 * Shared by DOCTOR_ATTENTION_PATIENTS/DOCTOR_ADHERENCE_RISK AND (exported)
 * by doctorAssistantMockHistory.js, which seeds its own "patients needing
 * attention" historical message with this exact same builder over the
 * exact same live selector — one structured-widget shape, never a
 * hand-duplicated copy of the same numbers.
 */
export const buildAttentionItems = (entries) =>
  entries.map(({ severity, patient, trend }) => {
    const isAhmed = patient.id === AHMED_ID;
    const metrics = [];

    if ("painLatest" in trend && "painPrevious" in trend) {
      metrics.push({ labelKey: "doctorDashboard.assistant.metrics.pain", before: trend.painPrevious, after: trend.painLatest });
    }
    if ("flexionLatest" in trend && "flexionPrevious" in trend) {
      metrics.push({ labelKey: "doctorDashboard.assistant.metrics.flexion", before: trend.flexionPrevious, after: trend.flexionLatest, unit: "°" });
    }
    if ("romImprovement" in trend) {
      metrics.push({ labelKey: "doctorDashboard.assistant.metrics.flexion", before: patient.flexionPrevious, after: patient.flexionLatest, unit: "°" });
    }
    if ("painChange" in trend) {
      metrics.push({ labelKey: "doctorDashboard.assistant.metrics.pain", before: patient.painPrevious, after: patient.painLatest });
    }
    if ("adherencePercent" in trend && !("painLatest" in trend)) {
      metrics.push({ labelKey: "doctorDashboard.assistant.metrics.adherence", value: trend.adherencePercent, unit: "%" });
      if (typeof trend.missed === "number") {
        metrics.push({ labelKey: "doctorDashboard.assistant.metrics.missedSessions", value: trend.missed });
      }
    }

    return {
      patientId: patient.id,
      name: patient.name,
      severityKey: severityToKey(severity),
      metrics,
      routeTo: isAhmed ? ahmedProfileRoute() : null,
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
      const entries = getPatientsNeedingAttention();
      if (entries.length === 0) {
        return { content: t("doctorDashboard.assistant.responses.attentionNone", { lng: language }) };
      }
      return {
        content: t("doctorDashboard.assistant.responses.attentionIntro", { lng: language, count: entries.length }),
        widget: { type: "attentionList", items: buildAttentionItems(entries) },
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
      const appointments = getTodayAppointments();
      if (appointments.length === 0) {
        return { content: t("doctorDashboard.assistant.responses.noAppointmentsToday", { lng: language }) };
      }

      const now = new Date();
      const nextIndex = appointments.findIndex((appointment) => appointment.startAt > now);
      const next = nextIndex >= 0 ? appointments[nextIndex] : null;
      const following = nextIndex >= 0 ? appointments[nextIndex + 1] : null;

      let content;
      if (next && following) {
        content = t("doctorDashboard.assistant.responses.todayAppointmentsIntroWithNext", {
          lng: language,
          count: appointments.length,
          nextName: next.patientName,
          nextTime: next.startAt.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" }),
          followingName: following.patientName,
          followingTime: following.startAt.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" }),
        });
      } else if (next) {
        content = t("doctorDashboard.assistant.responses.todayAppointmentsIntroLast", {
          lng: language,
          count: appointments.length,
          nextName: next.patientName,
          nextTime: next.startAt.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" }),
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
            name: appointment.patientName,
            timeIso: appointment.startAt.toISOString(),
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
      en: ["summarize today's reports", "summarize reports", "new reports", "today's reports", "report summary"],
      ar: ["لخص تقارير اليوم", "تقارير اليوم", "ملخص التقارير", "تقارير جديدة"],
    },
    execute: ({ t, language }) => {
      const reports = getNewReports();
      if (reports.length === 0) {
        return { content: t("doctorDashboard.assistant.responses.noNewReports", { lng: language }) };
      }
      return {
        content: t("doctorDashboard.assistant.responses.reportSummaryIntro", { lng: language, count: reports.length }),
        widget: {
          type: "reportList",
          items: reports.map((report) => ({
            id: report.id,
            patientName: report.patientName,
            summary: t(report.summaryKey, { lng: language }),
          })),
        },
        actions: [{ id: "view-reports", labelKey: "doctorDashboard.assistant.responses.viewAllReports", routeTo: ROUTES.DOCTOR_REPORTS }],
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
      const ahmed = getPatientById(AHMED_ID);
      const trend = getAhmedTrend(ahmed);
      return {
        content: t("doctorDashboard.assistant.responses.ahmedProgressSummary", {
          lng: language,
          completed: ahmed.sessionsCompletedThisWeek,
          prescribed: ahmed.sessionsPrescribedThisWeek,
          percent: trend.adherencePercent,
          flexionOldest: trend.flexionOldest,
          flexionLatest: trend.flexionLatest,
          painRecentAverage: trend.painRecentAverage,
          painLatest: trend.painLatest,
          sessionDelta: Math.abs(trend.flexionLatestSessionDelta),
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
    id: "DOCTOR_ADHERENCE_RISK",
    labelKey: "doctorDashboard.assistant.actions.adherenceRisk",
    icon: LuTrendingDown,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: ["falling behind", "adherence risk", "who is missing sessions", "low adherence", "behind on rehab"],
      ar: ["متأخرين بالتأهيل", "التزام ضعيف", "مين ملتزم أقل", "مرضى متأخرين"],
    },
    execute: ({ t, language }) => {
      const entries = getPatientsNeedingAttention().filter((entry) => entry.severity === ATTENTION_SEVERITY.FOLLOW_UP);
      if (entries.length === 0) {
        return { content: t("doctorDashboard.assistant.responses.adherenceRiskNone", { lng: language }) };
      }
      return {
        content: t("doctorDashboard.assistant.responses.adherenceRiskIntro", { lng: language, count: entries.length }),
        widget: { type: "attentionList", items: buildAttentionItems(entries) },
      };
    },
  },
];

const normalize = (value) => (typeof value === "string" ? value.toLowerCase().trim() : "");

/** Bounded, deterministic free-form matcher — NOT NLP. Mirrors patientAssistantActions.js's own matchAssistantAction exactly (kept as a small local copy rather than importing a private helper across the role boundary). */
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
 * above does not implement — rescheduling an appointment. Mirrors patient/
 * assistant/patientAssistantActions.js's CAPABILITY_FALLBACK_THEMES
 * purpose exactly: never silently pretend a typed request like "move
 * Ahmed's appointment" did anything.
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
