import { getAhmedTrend, getPatientAttention, getPatientsNeedingAttention } from "./doctorClinicalInsights";
import { buildAttentionItems } from "./doctorAssistantActions";
import { ROUTES } from "../../../../utils/routes";
import { getPatientById } from "../data/doctorClinicalMockData";

/**
 * Static conversation-history FIXTURES for the Doctor Assistant — three
 * realistic previous conversations demonstrating the clinical workspace's
 * intended interaction style.
 *
 * LOCALIZATION ARCHITECTURE: every message stores a `contentKey` +
 * `values` pair (resolved through i18next at RENDER time by
 * DoctorHomeAssistant.jsx's ConversationTurn), never an already-rendered
 * `content` string — the opposite of a "one-language mock object". This is
 * what makes switching the dashboard language re-render these seeded
 * conversations immediately, in place, with zero special-casing: the
 * renderer already calls `useTranslation()`, so React re-renders it
 * whenever the active language changes, exactly like every other
 * `t()`-driven string in the app. Conversation titles work the same way
 * (`titleKey`, resolved by DoctorConversationHistory.jsx).
 *
 * This intentionally does NOT set a per-conversation `language` field
 * (unlike a live/runtime conversation) — these conversations don't have
 * one fixed language anymore; they always follow whichever language is
 * currently active. `pending: false` on every message still applies (so
 * it renders as static text immediately, never replaying the Typewriter
 * reveal), and these are still never re-processed through
 * matchAssistantAction/execute once seeded.
 *
 * CLINICAL VALUES: `{{placeholders}}` in the translation strings are always
 * filled from the SAME numbers driving the Clinical Brief/live assistant
 * answers/attention widget (getAhmedTrend/getPatientAttention over
 * data/doctorClinicalMockData.js) — locale changes only the surrounding
 * prose, never the numbers themselves. Frozen `createdAt`/`updatedAt`
 * timestamps are unchanged from before — this is a record of a past
 * conversation, so it should read the same regardless of when "today"
 * actually is.
 */

const staticMessage = (id, role, contentKey, values = {}, extra = {}) => ({
  id,
  role,
  contentKey,
  values,
  pending: false,
  ...extra,
});

const ahmedProfileRoute = ROUTES.DOCTOR_PATIENT_PROFILE.replace(":id", "1");
const ahmedReportsRoute = ROUTES.DOCTOR_PATIENT_REPORTS.replace(":id", "1");
const ahmedExercisesRoute = ROUTES.DOCTOR_PATIENT_EXERCISES.replace(":id", "1");

const buildAhmedProgressConversation = () => {
  const ahmed = getPatientById("ahmed-ali");
  const trend = getAhmedTrend(ahmed);

  return {
    id: "mock-doctor-ahmed-progress",
    titleKey: "doctorDashboard.assistant.demo.ahmedProgress.title",
    isMockHistory: true,
    status: "historical",
    createdAt: "2026-08-10T08:05:00.000Z",
    updatedAt: "2026-08-10T08:09:00.000Z",
    messages: [
      staticMessage("mock-dap-1", "user", "doctorDashboard.assistant.demo.ahmedProgress.q1"),
      staticMessage("mock-dap-2", "assistant", "doctorDashboard.assistant.demo.ahmedProgress.a1", {
        completed: ahmed.sessionsCompletedThisWeek,
        prescribed: ahmed.sessionsPrescribedThisWeek,
        percent: trend.adherencePercent,
        flexionOldest: trend.flexionOldest,
        flexionLatest: trend.flexionLatest,
        painRecentAverage: trend.painRecentAverage,
        sessionDelta: Math.abs(trend.flexionLatestSessionDelta),
      }),
      staticMessage("mock-dap-3", "user", "doctorDashboard.assistant.demo.ahmedProgress.q2"),
      staticMessage(
        "mock-dap-4",
        "assistant",
        "doctorDashboard.assistant.demo.ahmedProgress.a2",
        {},
        {
          actions: [
            { id: "open-ahmed", labelKey: "doctorDashboard.assistant.responses.openPatient", routeTo: ahmedProfileRoute },
            { id: "ahmed-report", labelKey: "doctorDashboard.assistant.responses.viewLatestReport", routeTo: ahmedReportsRoute },
            { id: "ahmed-rehab", labelKey: "doctorDashboard.assistant.responses.reviewRehabProgram", routeTo: ahmedExercisesRoute },
          ],
        }
      ),
    ],
  };
};

const buildTodayAppointmentsConversation = () => {
  const ahmed = getPatientById("ahmed-ali");
  const trend = getAhmedTrend(ahmed);

  return {
    id: "mock-doctor-today-appointments",
    titleKey: "doctorDashboard.assistant.demo.todayAppointments.title",
    isMockHistory: true,
    status: "historical",
    createdAt: "2026-08-11T07:20:00.000Z",
    updatedAt: "2026-08-11T07:24:00.000Z",
    messages: [
      staticMessage("mock-dta-1", "user", "doctorDashboard.assistant.demo.todayAppointments.q1"),
      staticMessage("mock-dta-2", "assistant", "doctorDashboard.assistant.demo.todayAppointments.a1", {
        count: 7,
        nextName: "Ahmed Ali",
        nextTime: "2:30 PM",
        followingName: "Sara Almutairi",
        followingTime: "3:10 PM",
      }),
      staticMessage("mock-dta-3", "user", "doctorDashboard.assistant.demo.todayAppointments.q2"),
      // Same Ahmed pain numbers as the progress-review conversation
      // (getAhmedTrend, not hand-copied) — one source of truth across
      // both seeded conversations.
      staticMessage("mock-dta-4", "assistant", "doctorDashboard.assistant.demo.todayAppointments.a2", {
        painLatest: trend.painLatest,
        painRecentAverage: trend.painRecentAverage,
      }),
      staticMessage("mock-dta-5", "user", "doctorDashboard.assistant.demo.todayAppointments.q3"),
      staticMessage("mock-dta-6", "assistant", "doctorDashboard.assistant.demo.todayAppointments.a3"),
    ],
  };
};

const buildAttentionConversation = () => {
  const entries = getPatientsNeedingAttention();
  const sara = getPatientById("sara-almutairi");
  const saraAttention = getPatientAttention(sara);

  return {
    id: "mock-doctor-attention",
    titleKey: "doctorDashboard.assistant.demo.attention.title",
    isMockHistory: true,
    status: "historical",
    createdAt: "2026-08-11T16:40:00.000Z",
    updatedAt: "2026-08-11T16:44:00.000Z",
    messages: [
      staticMessage("mock-dpa-1", "user", "doctorDashboard.assistant.demo.attention.q1"),
      staticMessage(
        "mock-dpa-2",
        "assistant",
        "doctorDashboard.assistant.demo.attention.a1",
        { count: entries.length },
        { widget: { type: "attentionList", items: buildAttentionItems(entries) } }
      ),
      staticMessage("mock-dpa-3", "user", "doctorDashboard.assistant.demo.attention.q2"),
      staticMessage("mock-dpa-4", "assistant", "doctorDashboard.assistant.demo.attention.a2", {
        adherence: saraAttention.trend.adherencePercent,
      }),
      staticMessage("mock-dpa-5", "user", "doctorDashboard.assistant.demo.attention.q3"),
      staticMessage("mock-dpa-6", "assistant", "doctorDashboard.assistant.demo.attention.a3"),
    ],
  };
};

/** Returns FRESH, deep-cloned conversations every call — callers own their own copy. */
export const createDoctorMockHistoryConversations = () =>
  [buildAhmedProgressConversation(), buildTodayAppointmentsConversation(), buildAttentionConversation()].map((conversation) => ({
    ...conversation,
    messages: conversation.messages.map((message) => ({ ...message })),
  }));
