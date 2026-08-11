import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { LuSendHorizontal } from "react-icons/lu";
import { useAuth } from "../../../../context/AuthContext";
import { PATIENT_ASSISTANT_ACTIONS } from "../assistant/patientAssistantActions";
import KneeGuideAssistantOrb from "./KneeGuideAssistantOrb";
import TypewriterText from "./TypewriterText";
import PatientButton from "./PatientButton";
import PainWheel from "./PainWheel";
import "./PatientHomeAssistant.css";

const SUCCESS_PULSE_MS = 700;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One conversation turn. Deliberately presentation-only — it never calls
 * into the action registry itself, only renders whatever
 * PatientHomeAssistant already resolved (see runAction there). `widget`
 * is the one place a real interactive component (PainWheel) gets mounted
 * inline in a turn; the registry only ever names it as a string
 * ("painWheel"), never imports/renders it itself (see
 * assistant/patientAssistantActions.js).
 */
const ConversationTurn = ({ message, scrollRef, reducedMotion, onTypedComplete, painValue, onPainChange }) => {
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

      {message.widget === "painWheel" && (
        <div className="patient-chat-widget">
          <PainWheel value={painValue} onChange={onPainChange} />
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
 * `mode` is DERIVED from `messages.length`, not tracked as separate state
 * — there is no way for it to desync from the conversation itself.
 *
 * Still NOT AN LLM: submitting free text matches against the registry's
 * own translated labels (a small, fixed, real list) — never a general
 * NLP/intent engine. See patientAssistantActions.js for the capability
 * boundary this stays behind.
 */
const PatientHomeAssistant = ({ data }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const reducedMotion = prefersReducedMotion();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [inputNote, setInputNote] = useState("");
  const [orbState, setOrbState] = useState("idle");
  const [lastActionId, setLastActionId] = useState(null);
  const [painToday, setPainToday] = useState(4);

  const mode = messages.length === 0 ? "welcome" : "conversation";

  const idRef = useRef(0);
  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  const successTimeoutRef = useRef(null);
  const latestUserMessageRef = useRef(null);

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

  const runAction = (action, sourceText) => {
    setInputNote("");
    const result = action.execute({ navigate, t, data });

    // NAVIGATE actions return nothing — the destination page IS the
    // response, so no conversation turn is created (the component is
    // about to unmount via the route change anyway).
    if (!result) return;

    const userMessage = { id: nextId(), role: "user", content: sourceText || t(action.labelKey) };
    const assistantMessage = {
      id: nextId(),
      role: "assistant",
      content: result.message,
      secondaryAction: result.secondaryAction,
      widget: result.widget,
      pending: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setLastActionId(action.id);
    pulseSuccess();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    const lowered = query.toLowerCase();
    const matches = PATIENT_ASSISTANT_ACTIONS.filter((action) =>
      t(action.labelKey).toLowerCase().includes(lowered)
    );

    if (matches.length === 1) {
      runAction(matches[0], query);
      setInputValue("");
    } else {
      // Honest, restrained — never a fabricated answer, never a fake
      // "thinking" delay. Free-form input isn't connected to a real AI
      // backend in this iteration.
      setInputNote(t("patientDashboard.assistant.inputHint"));
    }
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
          onChange={(event) => {
            setInputValue(event.target.value);
            if (inputNote) setInputNote("");
          }}
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

      {inputNote && (
        <p className="patient-assistant-input-note" aria-live="polite">
          {inputNote}
        </p>
      )}
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
              painValue={painToday}
              onPainChange={setPainToday}
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
