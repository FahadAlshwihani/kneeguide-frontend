import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DoctorClinicalOrb from "../assistant/DoctorClinicalOrb";
import "./AssistantInsightCard.css";

/**
 * The ONE reusable "clinical decision support" presentation component for
 * every KneeGuide Assistant insight in the Doctor Patient Workspace.
 * Visual-polish-pass composition (rebuilt from the original tiny-Orb-
 * above-text layout): an Orb "face" column beside a content column —
 *
 *   [ ORB ]   KNEEGUIDE ASSISTANT
 *             concise insight
 *             secondary insight
 *             [ actions ]
 *
 * `flex-direction: row` (AssistantInsightCard.css) is what mirrors this
 * correctly in RTL with zero JS/branching — flexbox's main axis for
 * `row` already follows the document's inline direction, so the Orb ends
 * up on the correct logical "start" side in both languages automatically
 * (verified: the Orb itself never mirrors, only its position swaps).
 *
 * `lines` is an array of `{ messageKey, values }` so a caller can compose
 * up to a few short sentences (never a bullet list, never nested cards
 * per sentence — see doctorAssistantInsights.js's own message-key
 * catalog) without concatenating raw strings here; every piece still
 * resolves through `t()`. `actions` is the same `{ id, labelKey, routeTo }`
 * shape used throughout the Assistant, with one addition: an action may
 * carry `onSelect` instead of `routeTo` for an in-place mutation (e.g. the
 * Doctor Appointments page's "Accept" — it calls the exact same
 * `rehabRepository.confirmAppointment` the Requests rail uses, right where
 * the doctor already is, rather than forcing a navigation for something
 * that isn't a navigation). Every existing Workspace caller only ever
 * passes `routeTo`, so this is additive, not a breaking change.
 *
 * This component is rendered ONCE per Workspace (DoctorPatientWorkspace.jsx
 * hoists it above the swapped tab content specifically so the Orb/WebGL
 * canvas inside it never unmounts on tab navigation — see that file's own
 * comment for the full flicker root-cause writeup).
 */
const AssistantInsightCard = ({ titleKey = "doctorAssistantInsights.cardTitle", severity = "info", lines, actions = [], className = "" }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!lines || lines.length === 0) return null;

  const handleActionClick = (action) => {
    if (action.onSelect) {
      action.onSelect();
      return;
    }
    navigate(action.routeTo);
  };

  return (
    <section className={`assistant-insight-card assistant-insight-card--${severity} ${className}`.trim()} aria-label={t(titleKey)}>
      <div className="assistant-insight-card-orb-col">
        <DoctorClinicalOrb state="idle" size="insight" />
      </div>

      <div className="assistant-insight-card-content">
        <span className="assistant-insight-card-label">{t(titleKey)}</span>

        <div className="assistant-insight-card-body">
          {lines.map((line, index) => (
            <p key={`${line.messageKey}-${index}`} dir="auto" className={index === 0 ? "assistant-insight-card-primary" : "assistant-insight-card-secondary"}>
              {t(line.messageKey, line.values)}
            </p>
          ))}
        </div>

        {actions.length > 0 && (
          <div className="assistant-insight-card-actions">
            {actions.map((action) => (
              <button key={action.id} type="button" className="assistant-insight-card-action" onClick={() => handleActionClick(action)}>
                {t(action.labelKey)}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AssistantInsightCard;
