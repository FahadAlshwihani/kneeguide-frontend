import React from "react";
import { useTranslation } from "react-i18next";
import { LuCheck } from "react-icons/lu";
import "./PatientPainLogger.css";

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Keeps the existing conceptual Low/Moderate/High grouping the old
// PainWheel already used (its conic-gradient breakpoints at 120deg/220deg
// out of 360 ~= value 3.3/6.1) rounded to clean integer boundaries — not a
// new medical interpretation, just a faithful, simpler restatement of what
// was already there. UI/mock semantics only; never a diagnosis.
export const getPainSeverity = (value) => {
  if (value <= 3) return "low";
  if (value <= 6) return "moderate";
  return "high";
};

const SEVERITY_COLOR_VAR = {
  low: "--patient-color-success",
  moderate: "--patient-color-warning",
  high: "--patient-color-danger",
};

/**
 * The Patient Home conversational pain-selection control. Exactly ONE
 * source of truth for the value (the `value` prop, owned by the caller —
 * PatientHomeAssistant.jsx) — the ring is a pure, non-interactive visual
 * reflection of it; the real interaction is the native range input below
 * it. This is deliberately not the old PainWheel's radial-drag geometry:
 * that control required precise angular pointer math (awkward on both
 * mouse and touch), and a native <input type="range"> gets exact 0–10
 * selection, full keyboard operability (arrow keys, Home/End), and
 * reliable touch dragging/tap-to-position for free from the browser.
 *
 * PainWheel.jsx (the previous component) was audited before this file was
 * written — it had no other consumers anywhere in the app, so it was
 * retired rather than kept as an unused generic primitive; see this
 * round's report for that confirmation.
 */
const PatientPainLogger = ({ value, onChange, disabled = false, resolved = false }) => {
  const { t } = useTranslation();
  const reducedMotion = prefersReducedMotion();
  const severity = getPainSeverity(value);
  const offset = CIRCUMFERENCE * (1 - value / 10);
  const severityLabel = t(`painWheel.${severity}`);

  // Once submitted, this turn's widget becomes a small, subordinate,
  // read-only summary instead of leaving an active editable control
  // sitting in old transcript history — see PatientHomeAssistant.jsx's
  // handlePainSubmit, which flips `widget.state` to "resolved". To
  // change the value again, the user re-invokes "Log today's pain",
  // which the recent-log confirmation flow (patientAssistantActions.js)
  // handles.
  if (resolved) {
    return (
      <div className={`patient-pain-logger patient-pain-logger--resolved patient-pain-logger--${severity}`}>
        <div className="patient-pain-resolved-label">
          <span className="patient-pain-resolved-value">{value}/10</span>
          <span className="patient-pain-resolved-caption">
            <LuCheck aria-hidden="true" />
            {t("patientDashboard.assistant.painLogger.logged")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`patient-pain-logger patient-pain-logger--${severity}`}>
      <div className="patient-pain-ring" aria-hidden="true">
        <svg viewBox="0 0 100 100" className="patient-pain-ring-svg">
          <circle className="patient-pain-ring-track" cx="50" cy="50" r={RADIUS} />
          <circle
            className="patient-pain-ring-fill"
            cx="50"
            cy="50"
            r={RADIUS}
            style={{
              stroke: `var(${SEVERITY_COLOR_VAR[severity]})`,
              strokeDasharray: CIRCUMFERENCE,
              strokeDashoffset: offset,
              transition: reducedMotion ? "none" : "stroke-dashoffset 200ms ease, stroke 200ms ease",
            }}
          />
        </svg>
        <div className="patient-pain-ring-center">
          <span className="patient-pain-value">{value}</span>
          <span className="patient-pain-max">/10</span>
        </div>
      </div>

      <p className="patient-pain-severity">{severityLabel}</p>

      <div className="patient-pain-control">
        <label htmlFor="patient-pain-range" className="patient-visually-hidden">
          {t("patientDashboard.assistant.painLogger.rangeLabel")}
        </label>
        <input
          id="patient-pain-range"
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          className="patient-pain-range"
          aria-valuetext={`${value} — ${severityLabel}`}
        />
        <div className="patient-pain-scale-caps" aria-hidden="true">
          <span>0</span>
          <span>10</span>
        </div>
      </div>
    </div>
  );
};

export default PatientPainLogger;
