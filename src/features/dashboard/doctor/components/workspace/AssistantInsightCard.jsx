import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DoctorClinicalOrb from "../assistant/DoctorClinicalOrb";
import "./AssistantInsightCard.css";

/**
 * The ONE reusable "clinical decision support" presentation component for
 * every KneeGuide Assistant insight surfaced inside the Doctor Patient
 * Workspace (Overview/Rehabilitation/Sessions/Reports/Appointments) — a
 * small identity + a translated sentence (or a short sequence of them) +
 * an optional severity indicator + up to a few real actions. Never a
 * giant chatbot block: no composer, no history, no orb animation beyond
 * the shared tiny `DoctorClinicalOrb` identity mark already used by the
 * Assistant Drawer/Home.
 *
 * `lines` is an array of `{ messageKey, values }` so a tab can compose
 * 1-3 short sentences (Section 5.J's "combine related facts") without
 * concatenating raw strings in JS — every piece still goes through
 * `t()`. `actions` is the same `{ id, labelKey, routeTo }` shape used
 * throughout the Assistant (doctorAssistantInsights.js), so a click here
 * is a real `navigate()` into an existing Workspace tab — never a fake
 * button.
 */
const AssistantInsightCard = ({ titleKey = "doctorAssistantInsights.cardTitle", severity = "info", lines, actions = [], className = "" }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!lines || lines.length === 0) return null;

  return (
    <section className={`assistant-insight-card assistant-insight-card--${severity} ${className}`.trim()} aria-label={t(titleKey)}>
      <div className="assistant-insight-card-header">
        <DoctorClinicalOrb state="idle" size="tiny" className="assistant-insight-card-orb" />
        <span className="assistant-insight-card-title">{t(titleKey)}</span>
      </div>

      <div className="assistant-insight-card-body">
        {lines.map((line, index) => (
          <p key={`${line.messageKey}-${index}`} dir="auto">
            {t(line.messageKey, line.values)}
          </p>
        ))}
      </div>

      {actions.length > 0 && (
        <div className="assistant-insight-card-actions">
          {actions.map((action) => (
            <button key={action.id} type="button" className="assistant-insight-card-action" onClick={() => navigate(action.routeTo)}>
              {t(action.labelKey)}
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default AssistantInsightCard;
