import { getAhmedTrend, getPatientsNeedingAttention } from "./doctorClinicalInsights";
import { buildAttentionItems } from "./doctorAssistantActions";
import { ROUTES } from "../../../../utils/routes";
import { getPatientById } from "../data/doctorClinicalMockData";

/**
 * Static conversation-history FIXTURES for the Doctor Assistant — three
 * realistic previous conversations demonstrating the clinical workspace's
 * intended interaction style, mirroring patient/assistant/
 * patientAssistantMockHistory.js's own architecture exactly:
 * `isMockHistory: true` + every message `pending: false` (so it renders as
 * static text immediately, never replaying the Typewriter reveal), never
 * re-processed through matchAssistantAction/execute once seeded.
 *
 * Frozen in time on purpose (fixed `createdAt`/`updatedAt`, fixed
 * appointment-time STRINGS rather than live Date math) — this is a record
 * of a past conversation, so it should read the same regardless of when
 * "today" actually is. The attention-list conversation is the one
 * exception that reuses LIVE selectors (getPatientsNeedingAttention +
 * buildAttentionItems, both pure/deterministic) rather than hand-copying
 * the same structured numbers a second time, since Section 22's "one
 * source of truth" applies here too.
 */

const staticMessage = (id, role, content, extra = {}) => ({ id, role, content, pending: false, ...extra });

const ahmedProfileRoute = ROUTES.DOCTOR_PATIENT_PROFILE.replace(":id", "1");
const ahmedReportsRoute = ROUTES.DOCTOR_PATIENT_REPORTS.replace(":id", "1");
const ahmedExercisesRoute = ROUTES.DOCTOR_PATIENT_EXERCISES.replace(":id", "1");

const buildAhmedProgressConversation = () => {
  const ahmed = getPatientById("ahmed-ali");
  const trend = getAhmedTrend(ahmed);

  return {
    id: "mock-doctor-ahmed-progress",
    title: "Ahmed Ali progress review",
    language: "en",
    isMockHistory: true,
    status: "historical",
    createdAt: "2026-08-10T08:05:00.000Z",
    updatedAt: "2026-08-10T08:09:00.000Z",
    messages: [
      staticMessage("mock-dap-1", "user", "How has Ahmed been doing this week?"),
      staticMessage(
        "mock-dap-2",
        "assistant",
        `Ahmed completed ${ahmed.sessionsCompletedThisWeek} of ${ahmed.sessionsPrescribedThisWeek} prescribed sessions this week (${trend.adherencePercent}% adherence). Knee flexion improved from ${trend.flexionOldest}° to ${trend.flexionLatest}°, while pain has generally trended down toward ${trend.painRecentAverage}/10 before today. Movement quality remained stable. His latest session showed a small ${Math.abs(trend.flexionLatestSessionDelta)}° ROM decrease compared with the previous session.`
      ),
      staticMessage("mock-dap-3", "user", "Do you think I should progress his exercises?"),
      staticMessage(
        "mock-dap-4",
        "assistant",
        `His recent trend is generally positive, but the latest ROM decrease is worth reviewing before changing the program. Today's pain log also came in higher than his recent average, so it's worth a look before progressing intensity.`,
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

const buildTodayAppointmentsConversation = () => ({
  id: "mock-doctor-today-appointments",
  title: "Today's appointments",
  language: "en",
  isMockHistory: true,
  status: "historical",
  createdAt: "2026-08-11T07:20:00.000Z",
  updatedAt: "2026-08-11T07:24:00.000Z",
  messages: [
    staticMessage("mock-dta-1", "user", "Who's on my schedule today?"),
    staticMessage(
      "mock-dta-2",
      "assistant",
      "7 appointments are scheduled today. Your next appointment is Ahmed Ali at 2:30 PM, followed by Sara Almutairi at 3:10 PM."
    ),
    staticMessage("mock-dta-3", "user", "Why did Ahmed request the appointment?"),
    staticMessage(
      "mock-dta-4",
      "assistant",
      "Ahmed requested a follow-up after reporting increased pain following his recent rehabilitation sessions. His latest pain log was 7/10 compared with a recent average of about 4.7/10."
    ),
    staticMessage("mock-dta-5", "user", "Move him to the first available slot."),
    staticMessage(
      "mock-dta-6",
      "assistant",
      "Demo schedule updated — Ahmed is now shown in the earliest available mock slot. Since this is a frontend demo, no real appointment system was changed."
    ),
  ],
});

const buildAttentionConversation = () => {
  const entries = getPatientsNeedingAttention();
  return {
    id: "mock-doctor-attention",
    title: "Patients needing attention",
    language: "en",
    isMockHistory: true,
    status: "historical",
    createdAt: "2026-08-11T16:40:00.000Z",
    updatedAt: "2026-08-11T16:44:00.000Z",
    messages: [
      staticMessage("mock-dpa-1", "user", "Who should I review today?"),
      staticMessage("mock-dpa-2", "assistant", `${entries.length} patients stand out in today's rehabilitation data:`, {
        widget: { type: "attentionList", items: buildAttentionItems(entries) },
      }),
      staticMessage("mock-dpa-3", "user", "What about Sara specifically — is it serious?"),
      staticMessage(
        "mock-dpa-4",
        "assistant",
        "Not an emergency, but worth a check-in — her weekly adherence has dropped to 63% after missing several sessions, which is a pattern worth understanding rather than a clinical red flag on its own."
      ),
      staticMessage("mock-dpa-5", "user", "Got it, I'll message her before her next visit."),
      staticMessage("mock-dpa-6", "assistant", "Sounds good. Let me know if you'd like a summary of her adherence trend to share with her."),
    ],
  };
};

/** Returns FRESH, deep-cloned conversations every call — callers own their own copy. */
export const createDoctorMockHistoryConversations = () =>
  [buildAhmedProgressConversation(), buildTodayAppointmentsConversation(), buildAttentionConversation()].map((conversation) => ({
    ...conversation,
    messages: conversation.messages.map((message) => ({ ...message })),
  }));
