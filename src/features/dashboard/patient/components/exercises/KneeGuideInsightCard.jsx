import React from "react";
import KneeGuideAssistantOrb from "../KneeGuideAssistantOrb";
import "./KneeGuideInsightCard.css";

/**
 * The one shared "KneeGuide Insight" visual — a compact Orb + title +
 * message, used both between exercises (SessionExerciseSequence.jsx) and
 * at session completion (SessionHero.jsx). Deliberately a single small
 * component rather than the same markup written twice: this IS the
 * KneeGuide identity moment the task asks for ("use the Orb deliberately
 * around KneeGuide Insight... not as decoration on every exercise") and
 * it should look identical everywhere it appears.
 *
 * `tone` only ever adjusts the left accent border — never the only signal
 * (the message text itself always carries the actual meaning).
 */
const KneeGuideInsightCard = ({ title, message, tone = "neutral", children }) => (
  <div className={`kneeguide-insight-card kneeguide-insight-card--${tone}`}>
    <KneeGuideAssistantOrb state="idle" size="compact" />
    <div className="kneeguide-insight-card-body">
      <p className="kneeguide-insight-card-title">{title}</p>
      <p className="kneeguide-insight-card-message">{message}</p>
      {children && <div className="kneeguide-insight-card-actions">{children}</div>}
    </div>
  </div>
);

export default KneeGuideInsightCard;
