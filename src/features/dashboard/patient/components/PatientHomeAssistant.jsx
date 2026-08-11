import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { LuSendHorizontal, LuPlus } from "react-icons/lu";
import { useAuth } from "../../../../context/AuthContext";
import {
  PATIENT_ASSISTANT_ACTIONS,
  matchAssistantAction,
  matchCapabilityTheme,
} from "../assistant/patientAssistantActions";
import { detectConversationLanguage } from "../assistant/patientAssistantLanguage";
import { createMockHistoryConversations } from "../assistant/patientAssistantMockHistory";
import { getLatestPainLog, savePainLog, DEFAULT_PAIN_VALUE } from "../utils/patientPainStorage";
import { useKneeGuideDevice } from "../device/KneeGuideDeviceContext";
import KneeGuideAssistantOrb from "./KneeGuideAssistantOrb";
import TypewriterText from "./TypewriterText";
import PatientButton from "./PatientButton";
import PatientPainLogger from "./PatientPainLogger";
import PatientConversationHistory, { PatientHistoryTrigger } from "./PatientConversationHistory";
import AppointmentRequestFlow from "./appointments/AppointmentRequestFlow";
import "./PatientHomeAssistant.css";

const SUCCESS_PULSE_MS = 700;
const NEAR_BOTTOM_THRESHOLD_PX = 80;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One conversation turn. Deliberately presentation-only — it never calls
 * into the action registry or the pain-storage utility itself, only
 * renders whatever PatientHomeAssistant already resolved and forwards
 * clicks back up via callbacks. `widget`/`actions` are serializable
 * descriptors (see patientAssistantActions.js) — this is the one place
 * they get mapped onto real components (PatientPainLogger) and buttons.
 *
 * ONE renderer for both live and historical (mock) messages — there is no
 * separate HistoricalMessage component. The only thing that differs is
 * data/state: a historical assistant message is simply seeded with
 * `pending: false` (see patientAssistantMockHistory.js), so it renders as
 * static text through the exact same `!message.pending` branch below that
 * an already-typed live message uses — Typewriter only ever plays for a
 * message that starts `pending: true`, i.e. a brand new live response.
 *
 * `dir="auto"` on the actual message text (not the whole turn) lets each
 * message's own script decide its bidi direction independently of both
 * the active UI language and any other message in the same conversation —
 * required once a single conversation can legitimately mix Arabic and
 * English turns over time (see patientAssistantLanguage.js).
 */
/**
 * The compact, chat-native exercise list a SHOW_EXERCISES response
 * renders inline — deliberately NOT a reproduction of the Exercises
 * page's ExerciseCard (image/video/progress ring/"Start" modal). This is
 * the Assistant answering a question, not embedding the Exercises page;
 * "Open exercise program" (message.secondaryAction, rendered by the
 * caller) is the route to that fuller experience. `items` were already
 * resolved (name translated for the turn's language, reps as-is) by
 * SHOW_EXERCISES' own `execute` — see patientAssistantActions.js.
 */
const AssistantExerciseList = ({ items }) => (
  <ul className="patient-exercise-list">
    {items.map((item) => (
      <li key={item.id} className="patient-exercise-row">
        <span className="patient-exercise-name" dir="auto">
          {item.name}
        </span>
        <span className="patient-exercise-reps" dir="ltr">
          {item.reps}
        </span>
      </li>
    ))}
  </ul>
);

/**
 * The inline device-scanner widget for the CONNECT_DEVICE response.
 * Reads live scan/connect state straight from `useKneeGuideDevice()` —
 * the SAME context Patient Profile's Devices tab reads (see
 * device/KneeGuideDeviceContext.jsx) — rather than from anything stored
 * on the message itself, so there is exactly one source of truth for
 * "is it scanning / what did it find / what's connecting / what's
 * connected" and Profile can never show something the Assistant
 * contradicts (or vice versa) within the same session.
 *
 * Compact/chat-native by design — a restrained list of rows, not the
 * Profile page's full device card.
 */
const AssistantDeviceScanner = () => {
  const { t } = useTranslation();
  const { scanning, devices, connectingDeviceId, connectedDevice, scanForDevices, connectToDevice } =
    useKneeGuideDevice();

  if (connectedDevice) {
    return (
      <div className="patient-device-scanner">
        <p className="patient-device-status" role="status" dir="auto">
          {t("patientDashboard.assistant.responses.deviceConnected", { name: connectedDevice.name })}
        </p>
      </div>
    );
  }

  return (
    <div className="patient-device-scanner">
      {!scanning && devices.length === 0 && (
        <PatientButton type="button" variant="primary" size="sm" onClick={scanForDevices}>
          {t("patientDashboard.assistant.responses.deviceScan")}
        </PatientButton>
      )}

      {scanning && (
        <p className="patient-device-status" role="status" dir="auto">
          {t("patientDashboard.assistant.responses.deviceScanning")}
        </p>
      )}

      {!scanning && devices.length > 0 && (
        <>
          <p className="patient-device-status" dir="auto">
            {t("patientDashboard.assistant.responses.deviceFound", { count: devices.length })}
          </p>
          <ul className="patient-device-list">
            {devices.map((device) => {
              const isConnecting = connectingDeviceId === device.id;
              return (
                <li key={device.id} className="patient-device-row">
                  <span className="patient-device-row-info">
                    <span className="patient-device-name" dir="auto">
                      {device.name}
                    </span>
                    <span className="patient-device-signal" dir="ltr">
                      {t("patientDashboard.assistant.responses.deviceSignal", { value: device.signal })}
                    </span>
                  </span>
                  <PatientButton
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isConnecting}
                    onClick={() => connectToDevice(device)}
                    aria-label={t("patientDashboard.assistant.responses.deviceConnectAriaLabel", { name: device.name })}
                  >
                    {isConnecting
                      ? t("patientDashboard.assistant.responses.deviceConnecting")
                      : t("patientDashboard.assistant.responses.deviceConnect")}
                  </PatientButton>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};

const ConversationTurn = ({
  message,
  scrollRef,
  reducedMotion,
  onTypedComplete,
  onPainValueChange,
  onPainSubmit,
  onContextualAction,
}) => {
  const { t } = useTranslation();

  if (message.role === "user") {
    return (
      <motion.div
        ref={scrollRef}
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.25, ease: "easeOut" }}
        className="patient-chat-turn patient-chat-turn--user"
      >
        <span className="patient-visually-hidden">{t("patientDashboard.assistant.youLabel")}</span>
        <p className="patient-chat-bubble" dir="auto">
          {message.content}
        </p>
      </motion.div>
    );
  }

  const isPainLogger = message.widget?.type === "painLogger";
  const isResolvedPainLogger = isPainLogger && message.widget.state === "resolved";

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.25, ease: "easeOut" }}
      className="patient-chat-turn patient-chat-turn--assistant"
    >
      <span className="patient-chat-turn-label">{t("patientDashboard.assistant.orbLabel")}</span>

      {message.pending ? (
        <TypewriterText as="p" className="patient-chat-text" dir="auto" text={message.content} onComplete={onTypedComplete} />
      ) : (
        <p className="patient-chat-text" dir="auto">
          {message.content}
        </p>
      )}

      {isPainLogger && (
        <div className="patient-chat-widget">
          <PatientPainLogger
            value={message.widget.value}
            onChange={(value) => onPainValueChange(message.id, value)}
            disabled={isResolvedPainLogger}
            resolved={isResolvedPainLogger}
          />
          {!isResolvedPainLogger && (
            <PatientButton
              type="button"
              variant="primary"
              size="sm"
              className="patient-pain-submit"
              onClick={() => onPainSubmit(message.id)}
            >
              {t("patientDashboard.assistant.painLogger.submit")}
            </PatientButton>
          )}
        </div>
      )}

      {message.widget?.type === "exerciseList" && (
        <div className="patient-chat-widget">
          <AssistantExerciseList items={message.widget.items} />
        </div>
      )}

      {message.widget?.type === "deviceScanner" && (
        <div className="patient-chat-widget">
          <AssistantDeviceScanner />
        </div>
      )}

      {message.actions && message.actions.length > 0 && !message.resolved && (
        <div className="patient-chat-actions">
          {message.actions.map((action) => (
            <PatientButton
              key={action.id}
              type="button"
              variant={action.id === "change-pain" ? "outline" : "ghost"}
              size="sm"
              onClick={() => onContextualAction(message.id, action.id)}
            >
              {t(action.labelKey)}
            </PatientButton>
          ))}
        </div>
      )}

      {message.secondaryAction && (
        <PatientButton variant="ghost" size="sm" onClick={message.secondaryAction.onClick}>
          {t(message.secondaryAction.labelKey)}
        </PatientButton>
      )}
    </motion.div>
  );
};

let conversationCounter = 0;
const nextConversationId = () => {
  conversationCounter += 1;
  return `live-${conversationCounter}`;
};

const createDraftConversation = () => {
  const now = new Date().toISOString();
  return {
    id: nextConversationId(),
    title: null,
    createdAt: now,
    updatedAt: now,
    language: null,
    status: "active",
    isMockHistory: false,
    messages: [],
  };
};

/**
 * The primary Patient Home experience: a KneeGuide-Assistant-IS-the-
 * product workspace, not a dashboard with a chat bolted on. Structurally
 * two things now, side by side on desktop / one-with-a-drawer on mobile
 * (.patient-home-workspace in the CSS):
 *
 * - CONVERSATION HISTORY (PatientConversationHistory.jsx) — a narrow,
 *   collapsible rail on desktop, a Drawer/Sheet on mobile. Lists real
 *   conversations only: the two mock demo fixtures
 *   (patientAssistantMockHistory.js) plus whatever the user has actually
 *   sent messages in this session (an empty just-created draft never
 *   appears here — see the `.filter` in PatientConversationHistory.jsx).
 * - ACTIVE CONVERSATION — everything this component already had: two
 *   presentation modes over the SAME markup family:
 *     WELCOME  (messages.length === 0): large Orb, greeting, typed intro,
 *       starting suggestions, composer.
 *     CONVERSATION (messages.length > 0): compact Orb + "KneeGuide"
 *       identity, accumulated conversation history, composer, follow-up
 *       suggestions.
 *   `mode` is DERIVED from `messages.length`, exactly as before — this is
 *   also what makes opening a historical (already non-empty) conversation
 *   land directly in Conversation Mode with a compact Orb, no large-to-
 *   compact replay, for free.
 *
 * MULTI-CONVERSATION STATE: `conversations` is the single source of truth
 * — the two static mock fixtures plus every conversation created this
 * session (starting with one empty draft). `activeConversationId` points
 * at whichever one is on screen; `messages` below is simply that
 * conversation's own `messages` array. New Chat creates a new empty
 * conversation and activates it (Welcome Mode, since it has zero
 * messages); selecting a history row just changes which conversation's
 * `messages` are being read — the Orb (one mounted WebGL instance, see
 * KneeGuideAssistantOrb/Orb.jsx), the transcript container, the composer,
 * and this whole component never remount, and no route changes.
 *
 * ONE conversation-turn pipeline (appendUserMessage/appendAssistantMessage,
 * now scoped to whichever conversation is active) is still the sole place
 * user/assistant messages get created — suggestion clicks, matched
 * free-form queries, and unsupported free-form queries all funnel through
 * it exactly once each. Contextual pain actions (Yes/No/Submit) are
 * explicit, separate handlers — they never go through the free-text
 * matcher, since their behavior is already known from context.
 *
 * LANGUAGE: every appended user-visible turn (typed freely OR a clicked
 * suggestion/contextual button) runs its own source text through
 * `detectConversationLanguage` (patientAssistantLanguage.js) to decide
 * that turn's language, independent of the active UI language — a
 * suggestion chip naturally resolves to the UI language because its own
 * label text IS in the UI language; free text is judged on its own
 * script. The conversation's `language` field is updated turn-by-turn
 * (never retroactively rewriting earlier messages) and is what a
 * follow-up turn without fresh text (e.g. the Pain Logger's Submit,
 * which intentionally never creates a user bubble) falls back to. Actual
 * response strings still come from i18next's real EN/AR resource bundles
 * via `t(key, { lng: language })` (patientAssistantActions.js) — a fixed-
 * language lookup, never `i18n.changeLanguage()`; the active UI language
 * is completely untouched by any of this.
 *
 * Still NOT AN LLM: submitting free text matches against a small, fixed,
 * bilingual phrase dictionary (matchAssistantAction) — never a general
 * NLP/intent engine — and an equally small, fixed dictionary
 * (matchCapabilityTheme) recognizes a few themes the MOCK history
 * demonstrates as future capability (report analysis, exercise analysis,
 * booking) so the live assistant can answer honestly ("not connected
 * yet") instead of silently falling through to the generic fallback.
 * Historical fixture messages themselves are never re-processed through
 * either matcher — they are seeded once, verbatim, from
 * patientAssistantMockHistory.js (`isMockHistory: true`) and never touch
 * the live executor again.
 *
 * LAYOUT: Conversation Mode renders as a bounded header/transcript/footer
 * shell (PatientHomeAssistant.css's `.patient-assistant--conversation` +
 * children) instead of normal document flow — the transcript
 * (`.patient-chat-history`) is the ONLY scrolling element; the Orb header
 * and composer/suggestions footer sit outside it. `onModeChange` reports
 * the current mode up to PatientDashboard.jsx so its own page wrapper
 * (`.pd-page`) can size itself to the viewport (via the existing
 * --patient-dock-clearance token, no hardcoded pixel subtraction) only
 * while Conversation Mode is active — Welcome Mode keeps the page's
 * normal, unbounded document flow untouched. The new history rail lives
 * inside the same bound (`.patient-home-workspace`, see the CSS) and owns
 * its own internal scroll — it never makes the page itself scroll.
 */
const PatientHomeAssistant = ({ data, onModeChange }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const reducedMotion = prefersReducedMotion();

  const [conversations, setConversations] = useState(() => [
    ...createMockHistoryConversations(),
    createDraftConversation(),
  ]);
  const [activeConversationId, setActiveConversationId] = useState(
    () => conversations[conversations.length - 1].id
  );
  const [inputValue, setInputValue] = useState("");
  const [orbState, setOrbState] = useState("idle");
  const [lastActionId, setLastActionId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);
  // useMemo (not a plain `?? []`) so this has a stable reference across
  // renders whenever the conversation itself hasn't changed — otherwise a
  // fresh fallback array every render would make every hook below that
  // depends on `messages` look unstable to exhaustive-deps.
  const messages = useMemo(() => activeConversation?.messages ?? [], [activeConversation]);
  const mode = messages.length === 0 ? "welcome" : "conversation";

  const idRef = useRef(0);
  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  const successTimeoutRef = useRef(null);
  const latestUserMessageRef = useRef(null);
  const transcriptRef = useRef(null);
  const historyTriggerRef = useRef(null);
  // Reflects the scroll position as of the last actual scroll EVENT, not
  // recomputed after content grows — this is what makes the "was the user
  // near the bottom right before this new message arrived" check correct
  // instead of being confused by the new message's own height change (see
  // the effect below). Starts true: a fresh conversation has nothing to
  // preserve a reading position against.
  const wasNearBottomRef = useRef(true);
  const processingRef = useRef(new Set());
  const submittingPainRef = useRef(false);
  const previousConversationIdRef = useRef(activeConversationId);

  useEffect(
    () => () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    },
    []
  );

  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  const displayName = user?.first_name?.trim() || t("patientDashboard.greeting.fallbackName");

  // Derived locally from the device clock — no new API for a greeting.
  const greetingKey = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  }, []);

  // The most recently asked action moves to the END of the suggestion
  // list rather than staying the most prominent follow-up — a plain,
  // deterministic reorder over the SAME registry, not a recommendation
  // engine. Before any action has run (Welcome Mode), this is just the
  // registry's own natural order.
  const suggestionActions = useMemo(() => {
    if (!lastActionId) return PATIENT_ASSISTANT_ACTIONS;
    const rest = PATIENT_ASSISTANT_ACTIONS.filter((action) => action.id !== lastActionId);
    const justAsked = PATIENT_ASSISTANT_ACTIONS.find((action) => action.id === lastActionId);
    return justAsked ? [...rest, justAsked] : PATIENT_ASSISTANT_ACTIONS;
  }, [lastActionId]);

  // Newest user turn scrolled into view once it (and its pair) mount —
  // scoped to the transcript container (scrollIntoView targets the
  // nearest scrollable ancestor, which is `.patient-chat-history`). When
  // the active conversation itself just changed (New Chat / opening a
  // history row / switching between two history rows), position at the
  // latest message IMMEDIATELY instead — chat-history convention, and
  // explicitly not an animated scroll through the whole transcript. Only
  // a genuinely new message inside the SAME conversation gets the
  // smooth, near-bottom-aware behavior.
  useEffect(() => {
    const switchedConversation = previousConversationIdRef.current !== activeConversationId;
    previousConversationIdRef.current = activeConversationId;

    const el = transcriptRef.current;
    if (!el || messages.length === 0) return;

    if (switchedConversation) {
      el.scrollTop = el.scrollHeight;
      wasNearBottomRef.current = true;
      return;
    }

    if (!wasNearBottomRef.current) return;
    latestUserMessageRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, messages.length]);

  // Plain ref, not React state — updated on real scroll events only
  // (never on content growth alone), per the performance requirement of
  // not setting state per scroll pixel and not attaching anything to
  // `window`. Scoped entirely to the transcript element itself.
  const handleTranscriptScroll = () => {
    const el = transcriptRef.current;
    if (!el) return;
    wasNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX;
  };

  const pulseSuccess = () => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setOrbState("success");
    successTimeoutRef.current = setTimeout(() => setOrbState("idle"), SUCCESS_PULSE_MS);
  };

  // ---------- Conversation-scoped state helpers ----------
  const updateConversation = (id, updater) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === id
          ? { ...conversation, ...updater(conversation), updatedAt: new Date().toISOString() }
          : conversation
      )
    );
  };

  // Judges a fresh piece of turn text against this conversation's own
  // established language (falling back to the active UI language, then
  // English) — see patientAssistantLanguage.js for the actual detection.
  const deriveTurnLanguage = (text) =>
    detectConversationLanguage(text, {
      conversationLanguage: activeConversation?.language,
      uiLanguage: i18n.language,
    });

  const markTyped = (id) => {
    updateConversation(activeConversationId, (conversation) => ({
      messages: conversation.messages.map((message) => (message.id === id ? { ...message, pending: false } : message)),
    }));
  };

  // ---------- The one turn-creation pipeline ----------
  const appendUserMessage = (content, language) => {
    updateConversation(activeConversationId, (conversation) => ({
      language: language || conversation.language,
      messages: [...conversation.messages, { id: nextId(), role: "user", content, pending: false }],
    }));
  };

  const appendAssistantMessage = ({ content, secondaryAction, widget, actions }) => {
    updateConversation(activeConversationId, (conversation) => ({
      messages: [
        ...conversation.messages,
        { id: nextId(), role: "assistant", content, secondaryAction, widget, actions, pending: true },
      ],
    }));
  };

  const runAction = (action, sourceText, explicitLanguage) => {
    const text = sourceText || t(action.labelKey);
    const language = explicitLanguage || deriveTurnLanguage(text);
    const result = action.execute({ navigate, t, data, language, openAppointmentFlow });

    // NAVIGATE actions return nothing — the destination page IS the
    // response, so no conversation turn is created (the component is
    // about to unmount via the route change anyway).
    if (!result) return;

    appendUserMessage(text, language);
    appendAssistantMessage({
      content: result.message,
      secondaryAction: result.secondaryAction,
      widget: result.widget,
      actions: result.actions,
    });
    setLastActionId(action.id);
    pulseSuccess();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    setInputValue("");

    const language = deriveTurnLanguage(query);
    const matchedAction = matchAssistantAction(query, language);

    if (matchedAction) {
      runAction(matchedAction, query, language);
      return;
    }

    // Zero or multiple matches — both treated the same: a normal, honest
    // Assistant conversation turn, never an external warning, and never a
    // guess at which of several possible actions was meant. A small
    // bilingual capability dictionary answers a FEW specific "not
    // connected yet" themes the mock history demonstrates (report
    // analysis, exercise analysis, booking); everything else gets the
    // generic, still-honest fallback — both always in the detected
    // language, not the UI language.
    appendUserMessage(query, language);
    const theme = matchCapabilityTheme(query, language);
    const fallbackKey = theme ? theme.responseKey : "patientDashboard.assistant.responses.unsupported";
    appendAssistantMessage({ content: t(fallbackKey, { lng: language }) });
    pulseSuccess();
  };

  // ---------- Contextual pain actions (never go through the matcher) ----------
  const handleContextualAction = (messageId, actionId) => {
    if (processingRef.current.has(messageId)) return;
    const message = messages.find((m) => m.id === messageId);
    if (!message || message.resolved) return;
    processingRef.current.add(messageId);

    updateConversation(activeConversationId, (conversation) => ({
      messages: conversation.messages.map((m) => (m.id === messageId ? { ...m, resolved: true } : m)),
    }));

    if (actionId === "change-pain") {
      const recent = getLatestPainLog();
      const labelText = t("patientDashboard.assistant.actions.changePain");
      const language = deriveTurnLanguage(labelText);
      appendUserMessage(labelText, language);
      appendAssistantMessage({
        content: t("patientDashboard.assistant.responses.painChangePrompt", { lng: language }),
        widget: { type: "painLogger", value: recent ? recent.value : DEFAULT_PAIN_VALUE, mode: "change" },
      });
      pulseSuccess();
    } else if (actionId === "keep-pain") {
      const recent = getLatestPainLog();
      const labelText = t("patientDashboard.assistant.actions.keepPain");
      const language = deriveTurnLanguage(labelText);
      appendUserMessage(labelText, language);
      appendAssistantMessage({
        content: t("patientDashboard.assistant.responses.painKept", {
          lng: language,
          value: recent ? recent.value : DEFAULT_PAIN_VALUE,
        }),
      });
      pulseSuccess();
    }
  };

  const handlePainValueChange = (messageId, value) => {
    updateConversation(activeConversationId, (conversation) => ({
      messages: conversation.messages.map((m) => (m.id === messageId ? { ...m, widget: { ...m.widget, value } } : m)),
    }));
  };

  // Never a user chat bubble ("Submit pain level") — this is a UI action,
  // not conversation content. Only KneeGuide's own confirmation turn is
  // appended; the logger itself becomes a small resolved/read-only
  // summary in place (see PatientPainLogger's `resolved` prop). With no
  // fresh text to judge language from, this turn continues in whatever
  // language the conversation is already established in.
  const handlePainSubmit = (messageId) => {
    if (submittingPainRef.current) return;
    const message = messages.find((m) => m.id === messageId);
    if (!message || !message.widget || message.widget.state === "resolved") return;

    submittingPainRef.current = true;
    const { value, mode: painMode } = message.widget;
    const language = activeConversation?.language || i18n.language || "en";

    savePainLog(value);

    updateConversation(activeConversationId, (conversation) => ({
      messages: conversation.messages.map((m) => (m.id === messageId ? { ...m, widget: { ...m.widget, state: "resolved" } } : m)),
    }));

    appendAssistantMessage({
      content: t(
        painMode === "change"
          ? "patientDashboard.assistant.responses.painUpdated"
          : "patientDashboard.assistant.responses.painLogged",
        { lng: language, value }
      ),
    });

    pulseSuccess();
    submittingPainRef.current = false;
  };

  // ---------- Appointment request (shared capability, Section 37) ----------
  // The Assistant mounts the EXACT same AppointmentRequestFlow component
  // the Appointments page uses (components/appointments/
  // AppointmentRequestFlow.jsx) — it reads/writes the same
  // appointments/patientAppointmentService.js localStorage-backed state,
  // so a request submitted from either surface is immediately visible on
  // the other. This is UI state only (which modal is open), never a
  // second booking implementation.
  const [appointmentFlowOpen, setAppointmentFlowOpen] = useState(false);
  const openAppointmentFlow = () => setAppointmentFlowOpen(true);

  // Appends KneeGuide's own confirmation turn once the shared flow
  // actually creates a request — same honesty as the page's own
  // "Submitted" step: REQUESTED, never "confirmed" (Section 20/38).
  const handleAppointmentRequestSubmitted = (appointment) => {
    const language = activeConversation?.language || i18n.language || "en";
    appendAssistantMessage({
      content: t("patientDashboard.assistant.responses.appointmentRequestSubmitted", {
        lng: language,
        date: appointment.startAt.toLocaleDateString(language, { weekday: "long", month: "long", day: "numeric" }),
        time: appointment.startAt.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" }),
        status: t("patientAppointments.status.REQUESTED", { lng: language }),
      }),
    });
    pulseSuccess();
  };

  // ---------- Conversation history: New Chat / switching ----------
  const handleNewChat = () => {
    const draft = createDraftConversation();
    setConversations((prev) => [...prev, draft]);
    setActiveConversationId(draft.id);
    setInputValue("");
    setLastActionId(null);
  };

  const handleSelectConversation = (id) => {
    if (id === activeConversationId) return;
    setActiveConversationId(id);
    setInputValue("");
    setLastActionId(null);
  };

  const closeHistoryDrawer = () => {
    setHistoryDrawerOpen(false);
    historyTriggerRef.current?.focus();
  };

  const composerNode = (
    <form className="patient-assistant-form" onSubmit={handleSubmit}>
      <label htmlFor="patient-assistant-input" className="patient-visually-hidden">
        {t("patientDashboard.assistant.inputLabel")}
      </label>
      <div className="patient-assistant-input-row">
        <input
          id="patient-assistant-input"
          type="text"
          dir="auto"
          className="patient-assistant-input"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onFocus={() => setOrbState("engaged")}
          onBlur={() => setOrbState("idle")}
          placeholder={t("patientDashboard.assistant.inputPlaceholder")}
          autoComplete="off"
        />
        <button
          type="submit"
          className="patient-assistant-send"
          aria-label={t("patientDashboard.assistant.sendLabel")}
        >
          <LuSendHorizontal aria-hidden="true" />
        </button>
      </div>
    </form>
  );

  const suggestionsNode = (
    <div
      className="patient-assistant-suggestions"
      role="group"
      aria-label={t(
        mode === "welcome" ? "patientDashboard.assistant.suggestionsLabel" : "patientDashboard.assistant.followUpLabel"
      )}
    >
      {suggestionActions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            className="patient-assistant-chip"
            onClick={() => runAction(action)}
          >
            <Icon aria-hidden="true" />
            <span>{t(action.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );

  const lastUserMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "user") return messages[i].id;
    }
    return null;
  }, [messages]);

  // `layout="size"` intentionally does NOT apply in Conversation Mode —
  // that mode's own height is now bounded/flex-driven (see
  // PatientHomeAssistant.css), a fundamentally different sizing scheme
  // than Welcome Mode's normal-flow box, and animating a FLIP transform
  // across that scheme change risks a glitchy snap. Welcome Mode keeps it
  // (unchanged from before) purely to smooth its own intro-exit height
  // change; the Orb's own independent `layout` transition (
  // KneeGuideAssistantOrb.jsx, unaffected by any of this, and never keyed
  // by conversation id — see the module doc comment above) remains the
  // primary carrier of the large-to-compact visual transformation.
  //
  // AnimatePresence here stays mounted across BOTH modes (same as every
  // other top-level child below) — only ITS child conditionally renders
  // on `mode`. This is what lets the intro block actually play its exit
  // animation instead of just vanishing: if the whole Welcome/Conversation
  // branch were swapped as one unit, AnimatePresence itself would unmount
  // together with its child and never get the chance to animate the exit.
  return (
    <div className="patient-home-workspace">
      <PatientConversationHistory
        variant="rail"
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
      />

      <motion.section
        layout={mode === "welcome" ? "size" : undefined}
        transition={{ duration: reducedMotion ? 0 : 0.4, ease: [0.22, 0.61, 0.36, 1] }}
        className={`patient-assistant patient-assistant--${mode}`}
        aria-label={t("patientDashboard.assistant.regionLabel")}
      >
        {/* Mobile-only compact toolbar — the desktop rail already carries
            New Chat + history access, so this row is hidden above the
            rail breakpoint (PatientHomeAssistant.css). Always mounted (in
            both Welcome and Conversation mode) so history stays reachable
            from a brand-new chat, not just from an existing one. */}
        <div className="patient-mobile-toolbar">
          <PatientHistoryTrigger onClick={() => setHistoryDrawerOpen(true)} triggerRef={historyTriggerRef} />
          <button
            type="button"
            className="patient-history-icon-button"
            onClick={handleNewChat}
            aria-label={t("patientDashboard.assistant.history.newChat")}
            title={t("patientDashboard.assistant.history.newChat")}
          >
            <LuPlus aria-hidden="true" />
          </button>
        </div>

        {mode === "welcome" ? (
          <KneeGuideAssistantOrb state={orbState} size="large" className="patient-assistant-orb" />
        ) : (
          // HEADER — outside the transcript scroll container entirely,
          // never scrolls with messages.
          <div className="patient-assistant-header">
            <KneeGuideAssistantOrb state={orbState} size="compact" className="patient-assistant-orb" />
            <span className="patient-assistant-identity-label">{t("patientDashboard.assistant.orbLabel")}</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {mode === "welcome" && (
            <motion.div
              key="patient-assistant-intro"
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
              className="patient-assistant-intro"
            >
              <h1 className="patient-assistant-greeting">
                {t(`patientDashboard.greeting.${greetingKey}`, { name: displayName })}
              </h1>
              <TypewriterText
                as="p"
                className="patient-assistant-message"
                text={t("patientDashboard.assistant.intro")}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {mode === "conversation" && (
          // TRANSCRIPT — the ONE vertically scrolling element in
          // Conversation Mode (.patient-assistant--conversation
          // .patient-chat-history in the CSS). Keyed by
          // `activeConversationId` so switching conversations remounts
          // this `role="log"` region instead of diffing its children in
          // place — a fresh live region's initial content is not the
          // kind of thing screen readers retroactively announce as "just
          // arrived", whereas swapping 10+ children inside a persistent
          // one plausibly would be. New live messages inside the SAME
          // conversation still land as ordinary appended children.
          <div
            key={activeConversationId}
            ref={transcriptRef}
            onScroll={handleTranscriptScroll}
            className="patient-chat-history"
            role="log"
            aria-label={t("patientDashboard.assistant.historyLabel")}
          >
            {messages.map((message) => (
              <ConversationTurn
                key={message.id}
                message={message}
                reducedMotion={reducedMotion}
                scrollRef={message.id === lastUserMessageId ? latestUserMessageRef : null}
                onTypedComplete={() => markTyped(message.id)}
                onPainValueChange={handlePainValueChange}
                onPainSubmit={handlePainSubmit}
                onContextualAction={handleContextualAction}
              />
            ))}
          </div>
        )}

        {mode === "welcome" ? (
          <>
            {suggestionsNode}
            {composerNode}
          </>
        ) : (
          // FOOTER — composer + follow-up suggestions, outside the
          // transcript, never scrolls with messages.
          <div className="patient-assistant-footer">
            {composerNode}
            {suggestionsNode}
          </div>
        )}
      </motion.section>

      <PatientConversationHistory
        variant="drawer"
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        isOpen={historyDrawerOpen}
        onClose={closeHistoryDrawer}
      />

      <AppointmentRequestFlow
        isOpen={appointmentFlowOpen}
        onClose={() => setAppointmentFlowOpen(false)}
        mode="new"
        onSubmitted={handleAppointmentRequestSubmitted}
      />
    </div>
  );
};

export default PatientHomeAssistant;
