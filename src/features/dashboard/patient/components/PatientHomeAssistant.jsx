import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { LuSendHorizontal } from "react-icons/lu";
import { useAuth } from "../../../../context/AuthContext";
import { PATIENT_ASSISTANT_ACTIONS } from "../assistant/patientAssistantActions";
import { getLatestPainLog, savePainLog, DEFAULT_PAIN_VALUE } from "../utils/patientPainStorage";
import KneeGuideAssistantOrb from "./KneeGuideAssistantOrb";
import TypewriterText from "./TypewriterText";
import PatientButton from "./PatientButton";
import PatientPainLogger from "./PatientPainLogger";
import "./PatientHomeAssistant.css";

const SUCCESS_PULSE_MS = 700;

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
 */
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
        <p className="patient-chat-bubble">{message.content}</p>
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
        <TypewriterText as="p" className="patient-chat-text" text={message.content} onComplete={onTypedComplete} />
      ) : (
        <p className="patient-chat-text">{message.content}</p>
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

/**
 * The primary Patient Home experience. Two presentation modes over the
 * SAME component/state — never a route change, never a remount:
 *
 * - WELCOME  (messages.length === 0): large Orb, greeting, typed intro,
 *   starting suggestions, composer.
 * - CONVERSATION (messages.length > 0): compact Orb + "KneeGuide" identity,
 *   accumulated conversation history, composer, follow-up suggestions.
 *
 * `mode` is DERIVED from `messages.length`, not tracked as separate state.
 *
 * ONE conversation-turn pipeline (appendUserMessage/appendAssistantMessage)
 * is the sole place user/assistant messages get created — suggestion
 * clicks, matched free-form queries, and unsupported free-form queries all
 * funnel through it exactly once each, so there is no path that can append
 * a duplicate user turn. Contextual pain actions (Yes/No/Submit) are
 * explicit, separate handlers — they never go through the global
 * NLP-style label matcher (see handleSubmit), since their behavior is
 * already known from context, not inferred from text.
 *
 * Still NOT AN LLM: submitting free text matches against the registry's
 * own translated labels (a small, fixed, real list) — never a general
 * NLP/intent engine. Anything that doesn't unambiguously match becomes a
 * normal, calm Assistant conversation turn (never an external warning) —
 * see patientAssistantActions.js for the capability boundary this stays
 * behind.
 */
const PatientHomeAssistant = ({ data }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const reducedMotion = prefersReducedMotion();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [orbState, setOrbState] = useState("idle");
  const [lastActionId, setLastActionId] = useState(null);

  const mode = messages.length === 0 ? "welcome" : "conversation";

  const idRef = useRef(0);
  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  const successTimeoutRef = useRef(null);
  const latestUserMessageRef = useRef(null);
  const processingRef = useRef(new Set());

  useEffect(
    () => () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    },
    []
  );

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
  // never a continuous/forced scroll while the user reads older turns,
  // since this only re-runs when the message COUNT changes.
  useEffect(() => {
    if (messages.length === 0) return;
    latestUserMessageRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const pulseSuccess = () => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setOrbState("success");
    successTimeoutRef.current = setTimeout(() => setOrbState("idle"), SUCCESS_PULSE_MS);
  };

  const markTyped = (id) => {
    setMessages((prev) => prev.map((message) => (message.id === id ? { ...message, pending: false } : message)));
  };

  // ---------- The one turn-creation pipeline ----------
  const appendUserMessage = (content) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", content }]);
  };

  const appendAssistantMessage = ({ content, secondaryAction, widget, actions }) => {
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "assistant", content, secondaryAction, widget, actions, pending: true },
    ]);
  };

  const runAction = (action, sourceText) => {
    const result = action.execute({ navigate, t, data });

    // NAVIGATE actions return nothing — the destination page IS the
    // response, so no conversation turn is created (the component is
    // about to unmount via the route change anyway).
    if (!result) return;

    appendUserMessage(sourceText || t(action.labelKey));
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

    const lowered = query.toLowerCase();
    const matches = PATIENT_ASSISTANT_ACTIONS.filter((action) =>
      t(action.labelKey).toLowerCase().includes(lowered)
    );

    if (matches.length === 1) {
      runAction(matches[0], query);
      return;
    }

    // Zero or multiple matches — both treated the same: a normal,
    // honest Assistant conversation turn, never an external warning, and
    // never a guess at which of several possible actions was meant.
    appendUserMessage(query);
    appendAssistantMessage({ content: t("patientDashboard.assistant.responses.unsupported") });
    pulseSuccess();
  };

  // ---------- Contextual pain actions (never go through the matcher) ----------
  const handleContextualAction = (messageId, actionId) => {
    if (processingRef.current.has(messageId)) return;
    const message = messages.find((m) => m.id === messageId);
    if (!message || message.resolved) return;
    processingRef.current.add(messageId);

    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, resolved: true } : m)));

    if (actionId === "change-pain") {
      const recent = getLatestPainLog();
      appendUserMessage(t("patientDashboard.assistant.actions.changePain"));
      appendAssistantMessage({
        content: t("patientDashboard.assistant.responses.painChangePrompt"),
        widget: { type: "painLogger", value: recent ? recent.value : DEFAULT_PAIN_VALUE, mode: "change" },
      });
      pulseSuccess();
    } else if (actionId === "keep-pain") {
      const recent = getLatestPainLog();
      appendUserMessage(t("patientDashboard.assistant.actions.keepPain"));
      appendAssistantMessage({
        content: t("patientDashboard.assistant.responses.painKept", {
          value: recent ? recent.value : DEFAULT_PAIN_VALUE,
        }),
      });
      pulseSuccess();
    }
  };

  const handlePainValueChange = (messageId, value) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, widget: { ...m.widget, value } } : m))
    );
  };

  const submittingPainRef = useRef(false);

  // Never a user chat bubble ("Submit pain level") — this is a UI action,
  // not conversation content. Only KneeGuide's own confirmation turn is
  // appended; the logger itself becomes a small resolved/read-only
  // summary in place (see PatientPainLogger's `resolved` prop).
  const handlePainSubmit = (messageId) => {
    if (submittingPainRef.current) return;
    const message = messages.find((m) => m.id === messageId);
    if (!message || !message.widget || message.widget.state === "resolved") return;

    submittingPainRef.current = true;
    const { value, mode: painMode } = message.widget;

    savePainLog(value);

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, widget: { ...m.widget, state: "resolved" } } : m))
    );

    appendAssistantMessage({
      content: t(
        painMode === "change"
          ? "patientDashboard.assistant.responses.painUpdated"
          : "patientDashboard.assistant.responses.painLogged",
        { value }
      ),
    });

    pulseSuccess();
    submittingPainRef.current = false;
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

  return (
    <motion.section
      layout="size"
      transition={{ duration: reducedMotion ? 0 : 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      className={`patient-assistant patient-assistant--${mode}`}
      aria-label={t("patientDashboard.assistant.regionLabel")}
    >
      {mode === "welcome" ? (
        <KneeGuideAssistantOrb state={orbState} size="large" className="patient-assistant-orb" />
      ) : (
        <div className="patient-assistant-identity">
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
        <div
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
        <>
          {composerNode}
          {suggestionsNode}
        </>
      )}
    </motion.section>
  );
};

export default PatientHomeAssistant;
