import React from "react";
import { useTranslation } from "react-i18next";
import "./DoctorClinicalMessage.css";

/**
 * Compact, restrained structured embeds for Doctor Assistant responses
 * (Section 11) — patient/appointment/report summaries as small rows
 * inside the conversation, never a full dashboard card. All three read
 * pre-resolved data the action registry already built
 * (doctorAssistantActions.js) — no clinical logic lives here, only
 * presentation. `onNavigate` is the ONE function passed down from
 * DoctorHomeAssistant.jsx that turns a plain `routeTo` string into an
 * actual `navigate()` call, so every action button stays a serializable
 * `{ id, labelKey, routeTo }` descriptor (see doctorAssistantStorage.js).
 */

const SEVERITY_TONE_CLASS = {
  high: "doctor-attention-badge--high",
  followUp: "doctor-attention-badge--followUp",
  positive: "doctor-attention-badge--positive",
};

export const DoctorAttentionList = ({ items, onNavigate }) => {
  const { t } = useTranslation();

  return (
    <ul className="doctor-attention-list">
      {items.map((item) => (
        <li key={item.patientId} className="doctor-attention-row">
          <div className="doctor-attention-row-top">
            <span className="doctor-attention-name" dir="auto">
              {item.name}
            </span>
            <span className={`doctor-attention-badge ${SEVERITY_TONE_CLASS[item.severityKey] || ""}`}>
              {t(`doctorDashboard.assistant.attention.severity.${item.severityKey}`)}
            </span>
          </div>

          {item.metrics.length > 0 && (
            <div className="doctor-attention-metrics">
              {item.metrics.map((metric) => (
                <div key={metric.labelKey} className="doctor-attention-metric">
                  <span className="doctor-attention-metric-label">{t(metric.labelKey)}</span>
                  <span className="doctor-attention-metric-value" dir="ltr">
                    {typeof metric.value === "number"
                      ? `${metric.value}${metric.unit || ""}`
                      : `${metric.before}${metric.unit || ""} → ${metric.after}${metric.unit || ""}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {item.routeTo && (
            <button type="button" className="doctor-attention-open" onClick={() => onNavigate(item.routeTo)}>
              {t("doctorDashboard.assistant.responses.openPatient")}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
};

export const DoctorAppointmentList = ({ items }) => {
  const { t, i18n } = useTranslation();

  return (
    <ul className="doctor-appointment-list">
      {items.map((item) => (
        <li key={item.id} className="doctor-appointment-row">
          <span className="doctor-appointment-name" dir="auto">
            {item.name}
          </span>
          <span className="doctor-appointment-reason">{t(item.reasonKey)}</span>
          <span className="doctor-appointment-time" dir="ltr">
            {new Date(item.timeIso).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}
          </span>
        </li>
      ))}
    </ul>
  );
};

export const DoctorReportList = ({ items }) => (
  <ul className="doctor-report-list">
    {items.map((item) => (
      <li key={item.id} className="doctor-report-row">
        <span className="doctor-report-name" dir="auto">
          {item.patientName}
        </span>
        <span className="doctor-report-summary" dir="auto">
          {item.summary}
        </span>
      </li>
    ))}
  </ul>
);
