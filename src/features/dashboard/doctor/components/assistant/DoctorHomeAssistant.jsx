import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { LuSendHorizontal, LuPlus } from "react-icons/lu";
import { useAuth } from "../../../../../context/AuthContext";
import { DOCTOR_ASSISTANT_ACTIONS, matchAssistantAction, matchCapabilityTheme } from "../../assistant/doctorAssistantActions";
import { detectConversationLanguage } from "../../../patient/assistant/patientAssistantLanguage";
import { createDoctorMockHistoryConversations } from "../../assistant/doctorAssistantMockHistory";
import { loadDoctorAssistantState, saveDoctorAssistantState } from "../../assistant/doctorAssistantStorage";
import { getDoctorClinicalBrief } from "../../assistant/doctorClinicalInsights";
import DoctorClinicalOrb from "./DoctorClinicalOrb";
import TypewriterText from "../../../patient/components/TypewriterText";
import DoctorConversationHistory, { DoctorHistoryTrigger } from "./DoctorConversationHistory";
import { DoctorAttentionList, DoctorAppointmentList, DoctorReportList } from "./DoctorClinicalMessage";
import "./DoctorHomeAssistant.css";

const SUCCESS_PULSE_MS = 700;
const NEAR_BOTTOM_THRESHOLD_PX = 80;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One conversation turn — presentation-only, mirrors patient/components/
 * PatientHomeAssistant.jsx's own ConversationTurn architecture (one
 * renderer for both live and historical/mock messages; `pending` is the
 * sole Typewriter gate). `onNavigate` turns a message's plain
 * `{ id, labelKey, routeTo }` action descriptors into a real route change
 * — see doctorAssistantActions.js's own comment on why these are always
 * serializable strings, never closures.
 */
// Seeded/demo messages (doctorAssistantMockHistory.js) store a
// `contentKey` + `values` pair instead of an already-rendered `content`
// string, specifically so they re-render in the currently active
// dashboard language rather than staying frozen in whatever language they
// were authored in. Live/runtime messages (built in this file's own
// `appendAssistantMessage`/`appendUserMessage`) keep working exactly as
// before — they already resolved `content` once, in the detected INPUT
// language for that turn (Section 16's own "these are two different
// things" distinction) — this function is just the one place both shapes
// funnel through, never a second copy of either code path.
const resolveMessageText = (message, t) => (message.contentKey ? t(message.contentKey, message.values) : message.content);

const ConversationTurn = ({ message, scrollRef, reducedMotion, onTypedComplete, onNavigate }) => {
  const { t } = useTranslation();
  const text = resolveMessageText(message, t);

  if (message.role === "user") {
    return (
      <motion.div
        ref={scrollRef}
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.25, ease: "easeOut" }}
        className="doctor-chat-turn doctor-chat-turn--user"
      >
        <span className="doctor-visually-hidden">{t("doctorDashboard.assistant.youLabel")}</span>
        <p className="doctor-chat-bubble" dir="auto">
          {text}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.25, ease: "easeOut" }}
      className="doctor-chat-turn doctor-chat-turn--assistant"
    >
      <span className="doctor-chat-turn-label">{t("doctorDashboard.assistant.orbLabel")}</span>

      {message.pending ? (
        <TypewriterText as="p" className="doctor-chat-text" dir="auto" text={text} onComplete={onTypedComplete} visuallyHiddenClassName="doctor-visually-hidden" />
      ) : (
        <p className="doctor-chat-text" dir="auto">
          {text}
        </p>
      )}

      {message.widget?.type === "attentionList" && (
        <div className="doctor-chat-widget">
          <DoctorAttentionList items={message.widget.items} onNavigate={onNavigate} />
        </div>
      )}

      {message.widget?.type === "appointmentList" && (
        <div className="doctor-chat-widget">
          <DoctorAppointmentList items={message.widget.items} />
        </div>
      )}

      {message.widget?.type === "reportList" && (
        <div className="doctor-chat-widget">
          <DoctorReportList items={message.widget.items} />
        </div>
      )}

      {message.actions && message.actions.length > 0 && (
        <div className="doctor-chat-actions">
          {message.actions.map((action) => (
            <button key={action.id} type="button" className="doctor-chat-action-btn" onClick={() => onNavigate(action.routeTo)}>
              {t(action.labelKey)}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

let conversationCounter = 0;
const nextConversationId = () => {
  conversationCounter += 1;
  return `doctor-live-${conversationCounter}`;
};

const createDraftConversation = () => {
  const now = new Date().toISOString();
  return { id: nextConversationId(), title: null, createdAt: now, updatedAt: now, language: null, status: "active", isMockHistory: false, messages: [] };
};

/**
 * Initial conversations: the 3 static mock-history fixtures (always
 * freshly re-seeded, never persisted — see doctorAssistantStorage.js) plus
 * either a restored live conversation from localStorage or a brand-new
 * empty draft. Computed once, synchronously, in useState's initializer
 * (same "no extra flash/frame" reasoning as everywhere else in this
 * codebase that reads localStorage on mount).
 */
const buildInitialConversations = () => {
  const mockHistory = createDoctorMockHistoryConversations();
  const stored = loadDoctorAssistantState();
  if (stored && stored.conversations.length > 0) {
    return { conversations: [...mockHistory, ...stored.conversations], activeConversationId: stored.activeConversationId };
  }
  const draft = createDraftConversation();
  return { conversations: [...mockHistory, draft], activeConversationId: draft.id };
};

/**
 * Doctor Home's primary interface — the KneeGuide Clinical Assistant IS
 * the page (Section "Success Criteria"), not a chatbot bolted onto a
 * stats dashboard. Architecturally a close mirror of patient/components/
 * PatientHomeAssistant.jsx (mode derived from `messages.length`, one
 * conversation-turn pipeline, near-bottom-aware scroll, mount-once Orb),
 * deliberately NOT importing that file — see the final report for why a
 * parallel Doctor-owned implementation was built instead of a forced
 * shared abstraction.
 */
const DoctorHomeAssistant = ({ onModeChange }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const reducedMotion = prefersReducedMotion();

  // Computed exactly once (mock history + either a restored live
  // conversation or a fresh draft) — a ref, not two independent useState
  // lazy initializers, so localStorage/mock-history seeding never runs
  // twice on the same mount.
  const initialStateRef = useRef(null);
  if (initialStateRef.current === null) {
    initialStateRef.current = buildInitialConversations();
  }
  const [conversations, setConversations] = useState(() => initialStateRef.current.conversations);
  const [activeConversationId, setActiveConversationId] = useState(() => {
    const { conversations: seeded, activeConversationId: storedId } = initialStateRef.current;
    return seeded.some((conversation) => conversation.id === storedId) ? storedId : seeded[seeded.length - 1].id;
  });
  const [inputValue, setInputValue] = useState("");
  const [orbState, setOrbState] = useState("idle");
  const [lastActionId, setLastActionId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);
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
  const wasNearBottomRef = useRef(true);
  const previousConversationIdRef = useRef(activeConversationId);

  useEffect(() => () => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
  }, []);

  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  // Persist only non-mock, non-empty conversations — an empty just-created
  // draft is render-only state, never written (see doctorAssistantStorage.js).
  useEffect(() => {
    const persistable = conversations.filter((conversation) => !conversation.isMockHistory && conversation.messages.length > 0);
    saveDoctorAssistantState({ conversations: persistable, activeConversationId });
  }, [conversations, activeConversationId]);

  const displayName = user?.first_name?.trim() || t("doctorDashboard.greeting.fallbackName");

  const greetingKey = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  }, []);

  const brief = useMemo(() => getDoctorClinicalBrief(), []);

  const suggestionActions = useMemo(() => {
    if (!lastActionId) return DOCTOR_ASSISTANT_ACTIONS;
    const rest = DOCTOR_ASSISTANT_ACTIONS.filter((action) => action.id !== lastActionId);
    const justAsked = DOCTOR_ASSISTANT_ACTIONS.find((action) => action.id === lastActionId);
    return justAsked ? [...rest, justAsked] : DOCTOR_ASSISTANT_ACTIONS;
  }, [lastActionId]);

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
    latestUserMessageRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, messages.length]);

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

  const updateConversation = (id, updater) => {
    setConversations((prev) =>
      prev.map((conversation) => (conversation.id === id ? { ...conversation, ...updater(conversation), updatedAt: new Date().toISOString() } : conversation))
    );
  };

  const deriveTurnLanguage = (text) => detectConversationLanguage(text, { conversationLanguage: activeConversation?.language, uiLanguage: i18n.language });

  const markTyped = (id) => {
    updateConversation(activeConversationId, (conversation) => ({
      messages: conversation.messages.map((message) => (message.id === id ? { ...message, pending: false } : message)),
    }));
  };

  const appendUserMessage = (content, language) => {
    updateConversation(activeConversationId, (conversation) => ({
      language: language || conversation.language,
      messages: [...conversation.messages, { id: nextId(), role: "user", content, pending: false }],
    }));
  };

  const appendAssistantMessage = ({ content, widget, actions }) => {
    updateConversation(activeConversationId, (conversation) => ({
      messages: [...conversation.messages, { id: nextId(), role: "assistant", content, widget, actions, pending: true }],
    }));
  };

  const runAction = (action, sourceText, explicitLanguage) => {
    const text = sourceText || t(action.labelKey);
    const language = explicitLanguage || deriveTurnLanguage(text);
    const result = action.execute({ navigate, t, language });

    appendUserMessage(text, language);
    appendAssistantMessage({ content: result.content, widget: result.widget, actions: result.actions });
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

    appendUserMessage(query, language);
    const theme = matchCapabilityTheme(query, language);
    const fallbackKey = theme ? theme.responseKey : "doctorDashboard.assistant.responses.unsupported";
    appendAssistantMessage({ content: t(fallbackKey, { lng: language }) });
    pulseSuccess();
  };

  const handleNavigateAction = (routeTo) => {
    if (routeTo) navigate(routeTo);
  };

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
    <form className="doctor-assistant-form" onSubmit={handleSubmit}>
      <label htmlFor="doctor-assistant-input" className="doctor-visually-hidden">
        {t("doctorDashboard.assistant.inputLabel")}
      </label>
      <div className="doctor-assistant-input-row">
        <input
          id="doctor-assistant-input"
          type="text"
          dir="auto"
          className="doctor-assistant-input"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onFocus={() => setOrbState("engaged")}
          onBlur={() => setOrbState("idle")}
          placeholder={t("doctorDashboard.assistant.inputPlaceholder")}
          autoComplete="off"
        />
        <button type="submit" className="doctor-assistant-send" aria-label={t("doctorDashboard.assistant.sendLabel")}>
          <LuSendHorizontal aria-hidden="true" />
        </button>
      </div>
    </form>
  );

  const suggestionsNode = (
    <div className="doctor-assistant-suggestions" role="group" aria-label={t(mode === "welcome" ? "doctorDashboard.assistant.suggestionsLabel" : "doctorDashboard.assistant.followUpLabel")}>
      {suggestionActions.map((action) => {
        const Icon = action.icon;
        return (
          <button key={action.id} type="button" className="doctor-assistant-chip" onClick={() => runAction(action)}>
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

  return (
    <div className="doctor-home-workspace">
      <DoctorConversationHistory
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
        className={`doctor-assistant doctor-assistant--${mode}`}
        aria-label={t("doctorDashboard.assistant.regionLabel")}
      >
        <div className="doctor-mobile-toolbar">
          <DoctorHistoryTrigger onClick={() => setHistoryDrawerOpen(true)} triggerRef={historyTriggerRef} />
          <button type="button" className="doctor-history-icon-button" onClick={handleNewChat} aria-label={t("doctorDashboard.assistant.history.newChat")} title={t("doctorDashboard.assistant.history.newChat")}>
            <LuPlus aria-hidden="true" />
          </button>
        </div>

        {mode === "welcome" ? (
          <DoctorClinicalOrb state={orbState} size="large" className="doctor-assistant-orb" />
        ) : (
          <div className="doctor-assistant-header">
            <DoctorClinicalOrb state={orbState} size="compact" className="doctor-assistant-orb" />
            <span className="doctor-assistant-identity-label">{t("doctorDashboard.assistant.orbLabel")}</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {mode === "welcome" && (
            <motion.div
              key="doctor-assistant-intro"
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
              className="doctor-assistant-intro"
            >
              <h1 className="doctor-assistant-greeting">{t(`doctorDashboard.greeting.${greetingKey}`, { name: displayName })}</h1>
              <TypewriterText
                as="p"
                className="doctor-assistant-message"
                text={t("doctorDashboard.assistant.brief", { appointments: brief.appointmentsToday, reports: brief.newReports, attention: brief.needAttentionCount })}
                visuallyHiddenClassName="doctor-visually-hidden"
              />

              <div className="doctor-brief-strip" role="group" aria-label={t("doctorDashboard.assistant.today.title")}>
                <div className="doctor-brief-chip">
                  <span className="doctor-brief-value">{brief.appointmentsToday}</span>
                  <span className="doctor-brief-label">{t("doctorDashboard.assistant.today.appointments")}</span>
                </div>
                <div className="doctor-brief-chip">
                  <span className="doctor-brief-value">{brief.newReports}</span>
                  <span className="doctor-brief-label">{t("doctorDashboard.assistant.today.newReports")}</span>
                </div>
                <div className={`doctor-brief-chip${brief.needAttentionCount > 0 ? " doctor-brief-chip--attention" : ""}`}>
                  <span className="doctor-brief-value">{brief.needAttentionCount}</span>
                  <span className="doctor-brief-label">{t("doctorDashboard.assistant.today.needAttention")}</span>
                </div>
              </div>

              <p className="doctor-assistant-prompt">{t("doctorDashboard.assistant.briefPrompt")}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {mode === "conversation" && (
          <div key={activeConversationId} ref={transcriptRef} onScroll={handleTranscriptScroll} className="doctor-chat-history" role="log" aria-label={t("doctorDashboard.assistant.historyLabel")}>
            {messages.map((message) => (
              <ConversationTurn
                key={message.id}
                message={message}
                reducedMotion={reducedMotion}
                scrollRef={message.id === lastUserMessageId ? latestUserMessageRef : null}
                onTypedComplete={() => markTyped(message.id)}
                onNavigate={handleNavigateAction}
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
          <div className="doctor-assistant-footer">
            {composerNode}
            {suggestionsNode}
          </div>
        )}
      </motion.section>

      <DoctorConversationHistory
        variant="drawer"
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        isOpen={historyDrawerOpen}
        onClose={closeHistoryDrawer}
      />
    </div>
  );
};

export default DoctorHomeAssistant;
