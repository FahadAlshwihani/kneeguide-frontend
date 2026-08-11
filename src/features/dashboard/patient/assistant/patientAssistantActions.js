import { LuDumbbell, LuFileText, LuCalendarClock, LuHeartPulse, LuChartLine, LuBluetooth, LuCalendarPlus } from "react-icons/lu";
import { ROUTES } from "../../../../utils/routes";
import { getRecentPainLog, DEFAULT_PAIN_VALUE } from "../utils/patientPainStorage";
import { TODAY_EXERCISES } from "../data/patientExercisesData";
import { getNextConfirmedAppointment } from "../appointments/patientAppointmentService";
import { DEFAULT_CLINICIAN } from "../data/patientClinicianData";

/**
 * The Patient Assistant action registry — one source of truth mapping
 * each quick-suggestion chip (and now, bilingual free-form phrases — see
 * `patterns` below) to something that genuinely already exists in
 * KneeGuide (audited against routes/DashboardRoutes.jsx and
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
 * `execute(context)` receives `{ navigate, t, data, language }` and
 * returns either `undefined` (NAVIGATE — the side effect already
 * happened) or a response descriptor `{ message, secondaryAction?,
 * widget?, actions? }` (DISPLAY). `language` ('en' | 'ar') is the
 * CONVERSATION language for this turn (see patientAssistantLanguage.js) —
 * NOT the active UI language — so `execute` asks i18next for a
 * fixed-language string via `t(key, { lng: language, ...values })`
 * instead of `i18n.changeLanguage()`, which is never called anywhere in
 * this feature. `patterns` below are the bilingual, bounded, literal
 * phrase list a typed free-form message is matched against — still not
 * NLP, just an explicit dictionary per action per language.
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
    // DISPLAY, not NAVIGATE — the Assistant should ANSWER the question
    // ("what are today's exercises") inline first; the exercises route is
    // now only a secondary "go deeper" action, not the entire response.
    // `TODAY_EXERCISES` is imported from data/patientExercisesData.js —
    // the exact same module PatientExercises.jsx itself now reads (see
    // that file) — so the names/reps shown here can never drift from
    // what the actual Exercises page shows for "Today".
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: ["show today's exercises", "show my exercises", "today's exercises", "my exercises", "exercises"],
      ar: ["عرض تمارين اليوم", "تمارين اليوم", "اعرض تمارين", "تمارين", "وش تماريني اليوم", "وش تماريني"],
    },
    execute: ({ t, navigate, language }) => {
      if (TODAY_EXERCISES.length === 0) {
        return { message: t("patientDashboard.assistant.responses.noExercisesToday", { lng: language }) };
      }

      return {
        message: t("patientDashboard.assistant.responses.exercisesIntro", {
          lng: language,
          count: TODAY_EXERCISES.length,
        }),
        widget: {
          type: "exerciseList",
          items: TODAY_EXERCISES.map((exercise) => ({
            id: exercise.id,
            name: t(exercise.nameKey, { lng: language }),
            reps: exercise.reps,
          })),
        },
        secondaryAction: {
          labelKey: "patientDashboard.assistant.responses.openExerciseProgram",
          onClick: () => navigate(ROUTES.PATIENT_EXERCISES),
        },
      };
    },
  },
  {
    id: "NEXT_APPOINTMENT",
    labelKey: "patientDashboard.assistant.actions.nextAppointment",
    icon: LuCalendarClock,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: ["next appointment", "when is my appointment", "when is my next appointment", "my appointment"],
      ar: ["متى موعدي", "موعدي القادم", "متى موعدي القادم", "متى موعدي الجاي", "الموعد الجاي", "موعدي الجاي"],
    },
    // A real (mock) Patient appointments capability now exists —
    // appointments/patientAppointmentService.js is the SAME source
    // pages/PatientAppointments.jsx itself reads (Section 40: one source
    // of truth, no separate Home/Assistant appointment data). "View
    // appointments" is now a real, honest secondary action since the
    // route/page genuinely exist.
    execute: ({ t, navigate, language }) => {
      const nextAppointment = getNextConfirmedAppointment();
      if (!nextAppointment) {
        return {
          message: t("patientDashboard.assistant.responses.noAppointment", { lng: language }),
          secondaryAction: {
            labelKey: "patientDashboard.assistant.responses.openAppointments",
            onClick: () => navigate(ROUTES.PATIENT_APPOINTMENTS),
          },
        };
      }
      return {
        message: t("patientDashboard.assistant.responses.nextAppointment", {
          lng: language,
          date: nextAppointment.startAt.toLocaleDateString(language, { weekday: "long", month: "long", day: "numeric" }),
          time: nextAppointment.startAt.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" }),
          doctor: nextAppointment.clinician.name,
        }),
        secondaryAction: {
          labelKey: "patientDashboard.assistant.responses.openAppointments",
          onClick: () => navigate(ROUTES.PATIENT_APPOINTMENTS),
        },
      };
    },
  },
  {
    id: "LATEST_REPORT",
    labelKey: "patientDashboard.assistant.actions.latestReport",
    icon: LuFileText,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: ["latest report", "my latest report", "show my report", "my report", "report"],
      ar: ["آخر تقرير", "تقريري الأخير", "عرض تقريري", "وش وضع تقريري", "تقريري"],
    },
    execute: ({ t, navigate, data, language }) => {
      const { lastReport } = data;
      if (!lastReport) {
        return { message: t("patientDashboard.assistant.responses.noReport", { lng: language }) };
      }
      return {
        message: t("patientDashboard.assistant.responses.latestReport", {
          lng: language,
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
    patterns: {
      en: ["log today's pain", "log my pain", "log pain", "today's pain"],
      ar: ["تسجيل ألم اليوم", "سجل الألم", "سجل ألمي", "الم اليوم", "ألم اليوم"],
    },
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
    execute: ({ t, language }) => {
      const recent = getRecentPainLog();

      if (recent) {
        return {
          message: t("patientDashboard.assistant.responses.painRecentExists", {
            lng: language,
            value: recent.value,
          }),
          widget: { type: "painExistingConfirmation", value: recent.value },
          actions: [
            { id: "change-pain", labelKey: "patientDashboard.assistant.actions.changePain" },
            { id: "keep-pain", labelKey: "patientDashboard.assistant.actions.keepPain" },
          ],
        };
      }

      return {
        message: t("patientDashboard.assistant.responses.logPainPrompt", { lng: language }),
        widget: { type: "painLogger", value: DEFAULT_PAIN_VALUE, mode: "log" },
      };
    },
  },
  {
    id: "REHAB_PROGRESS",
    labelKey: "patientDashboard.assistant.actions.rehabProgress",
    icon: LuChartLine,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: ["rehab progress", "my progress", "how is my progress", "recovery progress", "progress"],
      ar: ["تقدم برنامجي", "تقدمي العلاجي", "كيف تقدمي", "تقدم التأهيل", "تقدمي"],
    },
    execute: ({ t, navigate, data, language }) => {
      const { adherence } = data;
      if (!adherence) {
        return { message: t("patientDashboard.assistant.responses.noProgress", { lng: language }) };
      }
      return {
        message: t("patientDashboard.assistant.responses.rehabProgress", {
          lng: language,
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
  {
    id: "CONNECT_DEVICE",
    labelKey: "patientDashboard.assistant.actions.connectDevice",
    icon: LuBluetooth,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: [
        "how do i connect my device",
        "connect my device",
        "connect sensor",
        "connect device",
        "scan for devices",
        "pair my sensor",
        "pair sensor",
      ],
      ar: [
        "كيف اربط الجهاز",
        "كيف أربط جهازي",
        "اربط الجهاز",
        "ابحث عن الجهاز",
        "ابحث عن أجهزة",
        "كيف اشبك الحساس",
      ],
    },
    // Deliberately no device-specific data here — `widget: { type:
    // "deviceScanner" }` only NAMES the capability; the actual
    // scan/connect state (PatientHomeAssistant.jsx's rendering of it)
    // reads live from the same shared useKneeGuideDevice() context Patient
    // Profile > Devices reads from (see device/KneeGuideDeviceContext.js)
    // — there is no second Bluetooth/device implementation here, only a
    // second UI surface onto the one that already exists.
    execute: ({ t, navigate, language }) => ({
      message: t("patientDashboard.assistant.responses.deviceIntro", { lng: language }),
      widget: { type: "deviceScanner" },
      secondaryAction: {
        labelKey: "patientDashboard.assistant.responses.openDeviceSettings",
        onClick: () => navigate(`${ROUTES.PATIENT_PROFILE}?tab=devices`),
      },
    }),
  },
  {
    id: "REQUEST_APPOINTMENT",
    labelKey: "patientDashboard.assistant.actions.requestAppointment",
    icon: LuCalendarPlus,
    type: ASSISTANT_ACTION_TYPES.DISPLAY,
    patterns: {
      en: [
        "request an appointment",
        "request appointment",
        "book an appointment",
        "book me an appointment",
        "book appointment",
        "schedule an appointment",
        "i want an appointment",
        "i need an appointment",
      ],
      ar: [
        "أبي أحجز موعد",
        "ابي احجز موعد",
        "أبي موعد",
        "ابي موعد",
        "أبغى أحجز موعد",
        "اطلب موعد",
        "أحتاج موعد",
        "احتاج موعد",
      ],
    },
    // Same rule as CONNECT_DEVICE: no booking logic lives here.
    // `openAppointmentFlow` (passed through the action-execution context
    // by PatientHomeAssistant.jsx) opens the EXACT SAME
    // AppointmentRequestFlow modal component pages/PatientAppointments.jsx
    // uses, which itself only ever calls
    // appointments/patientAppointmentService.js — the one shared
    // scheduling/request source of truth (Section 37). This action
    // answers first (Section 35) and never claims a booking happened;
    // the flow's own "Submitted" step and the confirmation turn
    // PatientHomeAssistant.jsx appends afterward both say "Requested",
    // never "Confirmed" (Section 20/38).
    execute: ({ t, language, openAppointmentFlow }) => ({
      message: t("patientDashboard.assistant.responses.requestAppointmentIntro", {
        lng: language,
        doctorName: DEFAULT_CLINICIAN.name,
      }),
      secondaryAction: {
        labelKey: "patientDashboard.assistant.actions.chooseAppointmentTime",
        onClick: () => openAppointmentFlow(),
      },
    }),
  },
];

const normalize = (value) => (typeof value === "string" ? value.toLowerCase().trim() : "");

/**
 * Bounded, deterministic free-form matcher — NOT NLP. `language` narrows
 * which of an action's two pattern lists is checked, so a typed phrase
 * resolves to the same action regardless of the active UI language (e.g.
 * UI English + Arabic-typed "متى موعدي الجاي؟" still resolves to
 * NEXT_APPOINTMENT). Exactly one match required, mirroring the previous
 * single-language behavior — zero or multiple matches are the caller's
 * (PatientHomeAssistant.jsx's) job to turn into an honest fallback.
 */
export const matchAssistantAction = (query, language) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return null;

  const matches = PATIENT_ASSISTANT_ACTIONS.filter((action) => {
    const patterns = action.patterns?.[language] || [];
    return patterns.some((pattern) => normalizedQuery.includes(normalize(pattern)));
  });

  return matches.length === 1 ? matches[0] : null;
};

/**
 * A small, explicit dictionary of themes the mock conversation history
 * (patientAssistantMockHistory.js) demonstrates as FUTURE capability, so
 * the still-deterministic LIVE assistant can answer honestly instead of
 * silently falling through to the generic "unsupported" line — e.g.
 * someone who just read the report-analysis demo conversation typing
 * "حلل تقريري وقارن الزوايا" gets a specific, honest "not connected yet"
 * reply naming what it *can* do today, not a fabricated analysis. This is
 * intentionally NOT a general intent classifier — three fixed themes,
 * literal phrase lists, same bounded shape as the action patterns above.
 */
export const CAPABILITY_FALLBACK_THEMES = [
  {
    id: "reportAnalysis",
    responseKey: "patientDashboard.assistant.responses.capabilityReportAnalysis",
    patterns: {
      en: [
        "analyze my report",
        "analyse my report",
        "compare my report",
        "compare reports",
        "compare my angles",
        "compare angles",
        "detailed analysis",
        "report analysis",
      ],
      ar: [
        "حلل تقريري",
        "حلل التقرير",
        "قارن تقاريري",
        "قارن التقارير",
        "قارن الزوايا",
        "تحليل تقريري",
        "تحليل التقرير",
        "تحليل مفصل",
      ],
    },
  },
  {
    id: "exerciseAnalysis",
    responseKey: "patientDashboard.assistant.responses.capabilityExerciseAnalysis",
    patterns: {
      en: [
        "analyze my exercise",
        "analyse my exercise",
        "analyze my form",
        "analyze my performance",
        "exercise analysis",
      ],
      ar: ["حلل تماريني", "حلل تمريني", "حلل أدائي", "تحليل تماريني", "تحليل الأداء"],
    },
  },
  // The "booking" theme that used to live here was removed: a real (mock)
  // appointment-request capability now exists (REQUEST_APPOINTMENT
  // above), so telling the patient booking "isn't connected yet" would
  // now be dishonest in the other direction. Booking-flavored phrases
  // resolve to REQUEST_APPOINTMENT's own patterns instead.
];

export const matchCapabilityTheme = (query, language) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return null;

  return (
    CAPABILITY_FALLBACK_THEMES.find((theme) =>
      (theme.patterns?.[language] || []).some((pattern) => normalizedQuery.includes(normalize(pattern)))
    ) || null
  );
};
