import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LuSendHorizontal } from "react-icons/lu";
import { useAuth } from "../../../../context/AuthContext";
import { PATIENT_ASSISTANT_ACTIONS } from "../assistant/patientAssistantActions";
import KneeGuideAssistantOrb from "./KneeGuideAssistantOrb";
import TypewriterText from "./TypewriterText";
import PatientButton from "./PatientButton";
import "./PatientHomeAssistant.css";

const SUCCESS_PULSE_MS = 700;

/**
 * The primary Patient Home experience: KneeGuide Assistant's Orb presence,
 * a contextual typed greeting, and a suggestion-driven interaction surface
 * over the patient assistant action registry (assistant/patientAssistant
 * Actions.js). This component owns UI/interaction state only — it never
 * fabricates data or medical content itself; `data` (next appointment,
 * latest report, adherence) is passed in from PatientDashboard.jsx exactly
 * as it already existed before this redesign, still clearly mock (unchanged
 * source), just now also feeding the assistant instead of five separate
 * always-visible cards.
 *
 * NOT AN LLM: submitting free text matches against the registry's own
 * translated labels (a small, fixed, real list) — never a general NLP/
 * intent engine. An unmatched or ambiguous query gets one honest,
 * restrained note asking the user to pick a suggestion; it never
 * fabricates a response. See patientAssistantActions.js for why this
 * boundary is deliberately a clean seam for a real AI backend later.
 */
const PatientHomeAssistant = ({ data, onReveal }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [inputValue, setInputValue] = useState("");
  const [inputNote, setInputNote] = useState("");
  const [orbState, setOrbState] = useState("idle");
  const [response, setResponse] = useState(null);

  const successTimeoutRef = useRef(null);

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

  const pulseSuccess = () => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setOrbState("success");
    successTimeoutRef.current = setTimeout(() => setOrbState("idle"), SUCCESS_PULSE_MS);
  };

  const runAction = (action) => {
    setInputNote("");
    const result = action.execute({ navigate, t, data, reveal: onReveal });
    setResponse(result ? { actionId: action.id, ...result } : null);
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
      runAction(matches[0]);
      setInputValue("");
    } else {
      // Honest, restrained — never a fabricated answer, never a fake
      // "thinking" delay. See section 8/26 of the task this implements:
      // free-form input isn't connected to a real AI backend yet.
      setInputNote(t("patientDashboard.assistant.inputHint"));
    }
  };

  return (
    <section className="patient-assistant" aria-label={t("patientDashboard.assistant.regionLabel")}>
      <KneeGuideAssistantOrb state={orbState} className="patient-assistant-orb" />

      <h1 className="patient-assistant-greeting">
        {t(`patientDashboard.greeting.${greetingKey}`, { name: displayName })}
      </h1>

      <TypewriterText
        as="p"
        className="patient-assistant-message"
        text={t("patientDashboard.assistant.intro")}
      />

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

      <div
        className="patient-assistant-suggestions"
        role="group"
        aria-label={t("patientDashboard.assistant.suggestionsLabel")}
      >
        {PATIENT_ASSISTANT_ACTIONS.map((action) => {
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

      {response && (
        <div key={response.actionId} className="patient-assistant-response" aria-live="polite">
          <p>{response.message}</p>
          {response.secondaryAction && (
            <PatientButton variant="ghost" size="sm" onClick={response.secondaryAction.onClick}>
              {t(response.secondaryAction.labelKey)}
            </PatientButton>
          )}
        </div>
      )}
    </section>
  );
};

export default PatientHomeAssistant;
