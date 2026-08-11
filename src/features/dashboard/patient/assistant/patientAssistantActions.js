import { LuDumbbell, LuFileText, LuCalendarClock, LuHeartPulse, LuChartLine } from "react-icons/lu";
import { ROUTES } from "../../../../utils/routes";

/**
 * The Patient Assistant action registry — one source of truth mapping
 * each quick-suggestion chip to something that genuinely already exists
 * in KneeGuide (audited against routes/DashboardRoutes.jsx and
 * PatientDashboard.jsx's own data before writing this file — see the
 * final report for exactly what was found real vs. mock).
 *
 * This is deliberately NOT a component and NOT JSX — a plain data module
 * so it can be consumed identically by a suggestion chip today and, later,
 * by a real AI backend's intent resolution ("intent: VIEW_NEXT_APPOINTMENT"
 * invoking this exact same `execute`) without PatientHome or this registry
 * needing to change shape. No medical business logic lives here — `execute`
 * only ever navigates, reveals an existing section, or formats already-
 * loaded data into a deterministic response descriptor; it never
 * interprets, infers, or fabricates anything.
 *
 * ACTION TYPES
 * - NAVIGATE: goes to an existing, already-implemented Patient route.
 * - REVEAL:   reveals/scrolls/focuses an existing section already on Home.
 * - DISPLAY:  returns a response descriptor (plain data, not JSX) built
 *             from real, already-loaded data — PatientHomeAssistant.jsx
 *             renders it through structured React, never
 *             dangerouslySetInnerHTML.
 *
 * `execute(context)` receives `{ navigate, t, data, reveal }` and returns
 * either `undefined` (NAVIGATE/REVEAL — the side effect already happened)
 * or a response descriptor `{ message, secondaryAction? }` (DISPLAY).
 */

export const ASSISTANT_ACTION_TYPES = {
  NAVIGATE: "NAVIGATE",
  REVEAL: "REVEAL",
  DISPLAY: "DISPLAY",
};

export const PATIENT_ASSISTANT_ACTIONS = [
  {
    id: "SHOW_EXERCISES",
    labelKey: "patientDashboard.assistant.actions.showExercises",
    icon: LuDumbbell,
    type: ASSISTANT_ACTION_TYPES.NAVIGATE,
    // /patient/exercises is a real, already-implemented route with a real
    // page (PatientExercises.jsx) — its own exercise data is mock, but the
    // route/page/interaction genuinely exists, so this is a real capability.
    execute: ({ navigate }) => {
      navigate(ROUTES.PATIENT_EXERCISES);
    },
  },
  {
    id: "NEXT_APPOINTMENT",
    labelKey: "patientDashboard.assistant.actions.nextAppointment",
    icon: LuCalendarClock,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    // No dedicated Patient appointments route exists anywhere in this app
    // today (only Doctor has one) — confirmed by auditing
    // routes/DashboardRoutes.jsx before writing this. This response is
    // therefore display-only, with no secondary "view appointments"
    // action, rather than inventing a destination that doesn't exist.
    execute: ({ t, data }) => {
      const { nextAppointment } = data;
      if (!nextAppointment) {
        return { message: t("patientDashboard.assistant.responses.noAppointment") };
      }
      return {
        message: t("patientDashboard.assistant.responses.nextAppointment", {
          date: nextAppointment.date,
          time: nextAppointment.time,
          doctor: nextAppointment.doctor,
        }),
      };
    },
  },
  {
    id: "LATEST_REPORT",
    labelKey: "patientDashboard.assistant.actions.latestReport",
    icon: LuFileText,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    execute: ({ t, navigate, data }) => {
      const { lastReport } = data;
      if (!lastReport) {
        return { message: t("patientDashboard.assistant.responses.noReport") };
      }
      return {
        message: t("patientDashboard.assistant.responses.latestReport", {
          date: lastReport.date,
          status: lastReport.statusLabel,
          pain: lastReport.painLevel,
        }),
        secondaryAction: {
          labelKey: "patientDashboard.assistant.responses.viewReports",
          onClick: () => navigate(ROUTES.PATIENT_REPORTS),
        },
      };
    },
  },
  {
    id: "LOG_PAIN",
    labelKey: "patientDashboard.assistant.actions.logPain",
    icon: LuHeartPulse,
    type: ASSISTANT_ACTION_TYPES.REVEAL,
    // Reveals the existing pain-wheel interaction already on Home (kept
    // collapsed by default to reduce clutter — see PatientDashboard.jsx).
    // There is no backend persistence for this reading today (it's local
    // component state, same as before this redesign), so this only ever
    // reveals the real interaction — it never claims to "log" anything to
    // a server.
    execute: ({ reveal }) => {
      reveal("pain");
    },
  },
  {
    id: "REHAB_PROGRESS",
    labelKey: "patientDashboard.assistant.actions.rehabProgress",
    icon: LuChartLine,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    execute: ({ t, navigate, data }) => {
      const { adherence } = data;
      if (!adherence) {
        return { message: t("patientDashboard.assistant.responses.noProgress") };
      }
      return {
        message: t("patientDashboard.assistant.responses.rehabProgress", {
          days: adherence.streakDays,
          percent: adherence.completionPercentage,
        }),
        secondaryAction: {
          labelKey: "patientDashboard.assistant.responses.viewReports",
          onClick: () => navigate(ROUTES.PATIENT_REPORTS),
        },
      };
    },
  },
];
