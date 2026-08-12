import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { rehabRepository } from "../../../../../domain/rehab/useRehabDomain";
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

// `item.severityKey` is the canonical ATTENTION_LEVEL_I18N_KEY value
// (needsAttention/reviewRecommended/stable, domain/rehab/rehabEnums.js) —
// the SAME vocabulary the Doctor Patients list badges already use, so a
// patient's severity word never differs between the worklist and an
// Assistant response about that same patient.
const SEVERITY_TONE_CLASS = {
  needsAttention: "doctor-attention-badge--needsAttention",
  reviewRecommended: "doctor-attention-badge--reviewRecommended",
  stable: "doctor-attention-badge--stable",
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
              {t(`rehabDomain.attentionLevel.${item.severityKey}`)}
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

/**
 * Pending appointment requests, with a REAL one-click "Accept" (Section 18
 * — mutates `rehabRepository.confirmAppointment` directly, immediately
 * visible on the Global Appointments page / Workspace / Patient side via
 * the shared reactive store, no refresh). Declining still requires opening
 * the real reason modal on the Appointments page (Section 39: a decline
 * always needs a real reason, never a one-click blind reject), so its
 * button stays a navigation link into that page instead of mutating here.
 *
 * A chat transcript is a frozen record of what was said, not a live view
 * (the same convention the existing `appointmentList`/`reportList` widgets
 * already follow — their `reasonKey`/`timeIso` are also snapshots taken at
 * response time) — so "accepted" is tracked as local, per-message-render
 * UI state rather than re-deriving from the store on every keystroke
 * elsewhere in the app.
 */
export const DoctorAppointmentRequestList = ({ items, onNavigate }) => {
  const { t, i18n } = useTranslation();
  const [acceptedIds, setAcceptedIds] = useState(() => new Set());

  const handleAccept = (id) => {
    rehabRepository.confirmAppointment(id);
    setAcceptedIds((prev) => new Set(prev).add(id));
  };

  return (
    <ul className="doctor-appointment-request-list">
      {items.map((item) => {
        const accepted = acceptedIds.has(item.id);
        return (
          <li key={item.id} className="doctor-appointment-request-row">
            <div className="doctor-appointment-request-main">
              <span className="doctor-appointment-name" dir="auto">
                {item.name}
              </span>
              <span className="doctor-appointment-time" dir="ltr">
                {new Date(item.timeIso).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
              </span>
            </div>
            {accepted ? (
              <span className="doctor-appointment-request-accepted">{t("doctorDashboard.assistant.responses.requestAccepted")}</span>
            ) : (
              <div className="doctor-appointment-request-actions">
                <button type="button" className="doctor-appointment-request-accept" onClick={() => handleAccept(item.id)}>
                  {t("doctorPatientWorkspace.appointments.accept")}
                </button>
                <button type="button" className="doctor-appointment-request-review" onClick={() => onNavigate(item.reviewRoute)}>
                  {t("doctorDashboard.assistant.responses.reviewRequest")}
                </button>
              </div>
            )}
          </li>
        );
      })}
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
