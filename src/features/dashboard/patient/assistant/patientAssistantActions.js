import { LuDumbbell, LuFileText, LuCalendarClock, LuHeartPulse, LuChartLine } from "react-icons/lu";
import { ROUTES } from "../../../../utils/routes";
import { getRecentPainLog, DEFAULT_PAIN_VALUE } from "../utils/patientPainStorage";

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
 * only ever navigates or formats already-loaded data into a deterministic
 * response descriptor; it never interprets, infers, or fabricates anything.
 *
 * ACTION TYPES
 * - NAVIGATE: goes to an existing, already-implemented Patient route. No
 *             conversation turn is created — the destination page IS the
 *             response (see PatientHomeAssistant.jsx's runAction).
 * - DISPLAY:  returns a response descriptor (plain data, not JSX) built
 *             from real, already-loaded data — PatientHomeAssistant.jsx
 *             renders it as a conversation turn through structured React,
 *             never dangerouslySetInnerHTML. `widget` is an optional
 *             serializable descriptor (e.g. `{ type: "painLogger", value }`)
 *             naming an existing interactive component to render alongside
 *             the message — the registry names WHICH real capability and
 *             WHAT state it starts in, the chat renderer owns the actual
 *             widget-to-component mapping, so no JSX/UI concern leaks into
 *             this file. `actions` is an optional array of serializable
 *             contextual-button descriptors (`{ id, labelKey }`, no
 *             functions — see PatientHomeAssistant.jsx's
 *             handleContextualAction for how ids map to behavior) scoped
 *             to that ONE message, distinct from the global suggestion
 *             chips below the composer.
 *
 * `execute(context)` receives `{ navigate, t, data }` and returns either
 * `undefined` (NAVIGATE — the side effect already happened) or a response
 * descriptor `{ message, secondaryAction?, widget?, actions? }` (DISPLAY).
 */

export const ASSISTANT_ACTION_TYPES = {
  NAVIGATE: "NAVIGATE",
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
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    // Reads the real (mock, local-only) pain log before deciding how to
    // respond — this is exactly the "deterministic data access" this
    // registry already does for appointments/reports/adherence, just
    // sourced from localStorage instead of the in-memory mock objects.
    // No backend/API call, no medical interpretation: if a record exists
    // AND is within the last 24h, ask before overwriting it rather than
    // silently reopening a fresh logger; the actual Yes/No/Submit flow
    // transitions live in PatientHomeAssistant.jsx (see its
    // handleChangePain/handleKeepPain/handlePainSubmit), since they're
    // conversation-flow orchestration, not registry-level capability.
    execute: ({ t }) => {
      const recent = getRecentPainLog();

      if (recent) {
        return {
          message: t("patientDashboard.assistant.responses.painRecentExists", { value: recent.value }),
          widget: { type: "painExistingConfirmation", value: recent.value },
          actions: [
            { id: "change-pain", labelKey: "patientDashboard.assistant.actions.changePain" },
            { id: "keep-pain", labelKey: "patientDashboard.assistant.actions.keepPain" },
          ],
        };
      }

      return {
        message: t("patientDashboard.assistant.responses.logPainPrompt"),
        widget: { type: "painLogger", value: DEFAULT_PAIN_VALUE, mode: "log" },
      };
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
