import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { LuSendHorizontal, LuPlus } from "react-icons/lu";
import { useDoctorAssistant } from "../../assistant/DoctorAssistantContext";
import DoctorClinicalOrb from "./DoctorClinicalOrb";
import TypewriterText from "../../../patient/components/TypewriterText";
import DoctorConversationHistory, { DoctorHistoryTrigger } from "./DoctorConversationHistory";
import DoctorConversationTurn from "./DoctorConversationTurn";
import "./DoctorHomeAssistant.css";

const NEAR_BOTTOM_THRESHOLD_PX = 80;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Doctor Home's primary interface — the KneeGuide Clinical Assistant IS
 * the page. All conversation STATE (conversations, matching, storage,
 * insights) now lives in DoctorAssistantContext.jsx (mounted once by
 * DoctorDashboardShell.jsx) so the Topbar's Assistant Drawer reads/writes
 * the exact same data — this component only owns VIEW-local concerns that
 * genuinely don't apply to the drawer's compact preview: the transcript's
 * own scroll-position tracking, the conversation-history rail's collapsed
 * state, and its own composer's `inputValue`. Rendered markup/behavior is
 * unchanged from before this extraction.
 */
const DoctorHomeAssistant = ({ onModeChange }) => {
  const { t } = useTranslation();
  const reducedMotion = prefersReducedMotion();
  const {
    conversations,
    activeConversationId,
    messages,
    mode,
    orbState,
    setOrbState,
    suggestionActions,
    brief,
    displayName,
    greetingKey,
    runAction,
    submitQuery,
    markTyped,
    handleNewChat,
    handleSelectConversation,
    handleNavigateAction,
  } = useDoctorAssistant();

  const [inputValue, setInputValue] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  const latestUserMessageRef = useRef(null);
  const transcriptRef = useRef(null);
  const historyTriggerRef = useRef(null);
  const wasNearBottomRef = useRef(true);
  const previousConversationIdRef = useRef(activeConversationId);

  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

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

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = inputValue.trim();
    if (!query) return;
    setInputValue("");
    submitQuery(query);
  };

  const handleNewChatLocal = () => {
    handleNewChat();
    setInputValue("");
  };

  const handleSelectConversationLocal = (id) => {
    handleSelectConversation(id);
    setInputValue("");
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
        onSelect={handleSelectConversationLocal}
        onNewChat={handleNewChatLocal}
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
          <button type="button" className="doctor-history-icon-button" onClick={handleNewChatLocal} aria-label={t("doctorDashboard.assistant.history.newChat")} title={t("doctorDashboard.assistant.history.newChat")}>
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
              <DoctorConversationTurn
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
        onSelect={handleSelectConversationLocal}
        onNewChat={handleNewChatLocal}
        isOpen={historyDrawerOpen}
        onClose={closeHistoryDrawer}
      />
    </div>
  );
};

export default DoctorHomeAssistant;
