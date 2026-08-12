// Small, defensive localStorage boundary for the Doctor Assistant's LIVE
// (non-mock-history) demo conversations — same architecture as
// patient/utils/patientPainStorage.js and patient/appointments/
// patientAppointmentStorage.js (one namespaced, ROLE-SPECIFIC key, a
// versioned + structurally-validated schema, every read defensive,
// corrupt/malformed data discarded rather than trusted or thrown). Never
// reuses the Patient key — Doctor and Patient conversations must never be
// able to collide or leak into each other's storage.
//
// Only ever persists conversations that are NOT mock history (those are
// always freshly re-seeded from doctorAssistantMockHistory.js on load) and
// that already have at least one message — an empty just-created draft is
// render-only state, never written here (mirrors the exact filter
// PatientConversationHistory.jsx already uses to decide what's "real").
//
// Message-level `actions`/`widget` are plain serializable descriptors
// (see doctorAssistantActions.js — `actions` are `{ id, labelKey, routeTo }`
// strings only, never closures), so a restored conversation's buttons keep
// working after a refresh — unlike a naive design that stored `onClick`
// functions and silently lost them to JSON.stringify.

const STORAGE_KEY = "kneeguide.doctor.assistant";
const SCHEMA_VERSION = 1;

const isValidMessage = (message) =>
  !!message &&
  typeof message === "object" &&
  (message.role === "user" || message.role === "assistant") &&
  typeof message.content === "string";

const isValidConversation = (conversation) =>
  !!conversation &&
  typeof conversation === "object" &&
  typeof conversation.id === "string" &&
  !!conversation.id &&
  Array.isArray(conversation.messages) &&
  conversation.messages.every(isValidMessage);

const readRaw = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/** `{ conversations, activeConversationId } | null` — null means "nothing usable was stored", never throws. */
export const loadDoctorAssistantState = () => {
  const raw = readRaw();
  if (!raw) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || parsed.version !== SCHEMA_VERSION || !Array.isArray(parsed.conversations)) {
    return null;
  }

  const conversations = parsed.conversations.filter(isValidConversation);
  if (conversations.length === 0) return null;

  return {
    conversations,
    activeConversationId: typeof parsed.activeConversationId === "string" ? parsed.activeConversationId : null,
  };
};

export const saveDoctorAssistantState = ({ conversations, activeConversationId }) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, activeConversationId, conversations }));
  } catch {
    // Quota/private-mode/security errors — the in-memory conversation still
    // works for this tab, it just won't survive a refresh.
  }
};
