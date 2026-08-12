import { getPatientProgressSummary, getPatientAttention, getPatientsNeedingAttention } from "./doctorClinicalInsights";
import { buildAttentionItems } from "./doctorAssistantActions";
import { ROUTES } from "../../../../utils/routes";

/**
 * Static conversation-history FIXTURES for the Doctor Assistant — three
 * realistic previous conversations demonstrating the clinical workspace's
 * intended interaction style.
 *
 * LOCALIZATION ARCHITECTURE: every message stores a `contentKey` +
 * `values` pair (resolved through i18next at RENDER time), never an
 * already-rendered `content` string.
 *
 * CLINICAL VALUES: `{{placeholders}}` are filled from the SAME canonical
 * rehab domain (src/domain/rehab/) driving the Clinical Brief, the live
 * assistant answers, and the Doctor Patients worklist — via
 * doctorClinicalInsights.js, never a second hand-authored Ahmed/Sara
 * record (the old data/doctorClinicalMockData.js dependency is gone).
 * These values are resolved once, when `createDoctorMockHistoryConversations()`
 * runs (DoctorAssistantContext.jsx, on provider mount) — a deliberate,
 * pre-existing design choice (Section 17's "store action/query intent +
 * patient ID and derive the message dynamically"): the transcript's
 * PROSE is frozen as a historical record, but its NUMBERS still trace to
 * one live source rather than becoming a second, independently-drifting
 * copy. Frozen `createdAt`/`updatedAt` timestamps are unchanged.
 */

const staticMessage = (id, role, contentKey, values = {}, extra = {}) => ({
  id,
  role,
  contentKey,
  values,
  pending: false,
  ...extra,
});

// See doctorAssistantActions.js's own comment on the same routes for why
// this is the canonical Workspace route/id, not the old separate pages.
const ahmedProfileRoute = ROUTES.DOCTOR_PATIENT_PROFILE.replace(":id", "patient-ahmed");
const ahmedReportsRoute = `${ahmedProfileRoute}?tab=reports`;
const ahmedExercisesRoute = `${ahmedProfileRoute}?tab=rehabilitation`;

const buildAhmedProgressConversation = () => {
  const summary = getPatientProgressSummary("patient-ahmed");

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
        completed: summary.completed,
        prescribed: summary.prescribed,
        percent: summary.percent,
        flexionOldest: summary.flexionOldest,
        flexionLatest: summary.flexionLatest,
        painRecentAverage: summary.painRecentAverage,
        sessionDelta: Math.abs(summary.flexionLatestSessionDelta ?? 0),
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
  // This historical conversation's own appointment count/names are frozen
  // narrative flavor (a specific PAST day's schedule, not derivable from
  // "today"'s live calendar) — only the clinical pain numbers below trace
  // to the canonical domain, per this file's own header comment.
  const summary = getPatientProgressSummary("patient-ahmed");

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
      // (getPatientProgressSummary, not hand-copied) — one source of
      // truth across both seeded conversations.
      staticMessage("mock-dta-4", "assistant", "doctorDashboard.assistant.demo.todayAppointments.a2", {
        painLatest: summary.painLatest,
        painRecentAverage: summary.painRecentAverage,
      }),
      staticMessage("mock-dta-5", "user", "doctorDashboard.assistant.demo.todayAppointments.q3"),
      staticMessage("mock-dta-6", "assistant", "doctorDashboard.assistant.demo.todayAppointments.a3"),
    ],
  };
};

const buildAttentionConversation = () => {
  const bundles = getPatientsNeedingAttention();
  const saraAttention = getPatientAttention("patient-sara");

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
        { count: bundles.length },
        { widget: { type: "attentionList", items: buildAttentionItems(bundles) } }
      ),
      staticMessage("mock-dpa-3", "user", "doctorDashboard.assistant.demo.attention.q2"),
      staticMessage("mock-dpa-4", "assistant", "doctorDashboard.assistant.demo.attention.a2", {
        adherence: saraAttention?.adherence?.percent ?? 0,
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
