import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LuSearch, LuChevronRight } from "react-icons/lu";
import DoctorLayout from "../components/DoctorLayout";
import { useRehabWorklist } from "../../../../domain/rehab/useRehabDomain";
import {
  ATTENTION_LEVEL,
  APPOINTMENT_STATUS,
  REPORT_STATUS,
  ATTENTION_LEVEL_I18N_KEY,
  ATTENTION_REASON_I18N_KEY,
} from "../../../../domain/rehab/rehabEnums";
import { ROUTES } from "../../../../utils/routes";
import { buildWorklistInsight } from "../assistant/doctorAssistantInsights";
import DoctorClinicalOrb from "../components/assistant/DoctorClinicalOrb";
import "../styles/DoctorPatients.css";

/**
 * Doctor -> Patients, redesigned as a CLINICAL WORKLIST (Section 5-8 of
 * the Doctor Patients module brief) instead of a generic contact-card
 * grid. Every number here comes from `useRehabWorklist()` — the shared
 * rehab domain's live, derived summary per patient (adherence, latest
 * pain/ROM, attention level + reasons) — never a second, independently
 * hardcoded count (Section 5: "DO NOT hardcode arbitrary counts
 * independently").
 */

const FILTERS = ["all", "needsAttention", "stable", "pendingAppointment", "reportAwaitingReview"];
const SORTS = ["priority", "activity", "name"];

const PRIORITY_RANK = { [ATTENTION_LEVEL.NEEDS_ATTENTION]: 0, [ATTENTION_LEVEL.REVIEW_RECOMMENDED]: 1, [ATTENTION_LEVEL.STABLE]: 2 };

const hasPendingAppointment = (appointments) =>
  appointments.some((appt) => appt.status === APPOINTMENT_STATUS.REQUESTED || appt.status === APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED);

const hasReportAwaitingReview = (reports) => reports.some((report) => report.reviewStatus === REPORT_STATUS.AWAITING_REVIEW);

const DoctorPatients = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const worklist = useRehabWorklist();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");

  const relativeTime = useMemo(() => new Intl.RelativeTimeFormat(i18n.language, { numeric: "auto" }), [i18n.language]);

  const formatActivity = (session) => {
    if (!session) return t("doctorPatients.activity.none");
    const diffDays = Math.round((new Date(session.date) - new Date()) / 86400000);
    return relativeTime.format(diffDays, "day");
  };

  const summary = useMemo(() => {
    const needAttention = worklist.filter((entry) => entry.priority.level === ATTENTION_LEVEL.NEEDS_ATTENTION).length;
    const pendingAppointments = worklist.filter((entry) => hasPendingAppointment(entry.appointments)).length;
    const reportsAwaitingReview = worklist.filter((entry) => hasReportAwaitingReview(entry.reports)).length;
    return { active: worklist.length, needAttention, pendingAppointments, reportsAwaitingReview };
  }, [worklist]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = worklist.filter((entry) => {
      if (!query) return true;
      return entry.patient.name.toLowerCase().includes(query) || entry.patient.displayId.toLowerCase().includes(query);
    });

    if (filter === "needsAttention") list = list.filter((entry) => entry.priority.level === ATTENTION_LEVEL.NEEDS_ATTENTION);
    if (filter === "stable") list = list.filter((entry) => entry.priority.level === ATTENTION_LEVEL.STABLE);
    if (filter === "pendingAppointment") list = list.filter((entry) => hasPendingAppointment(entry.appointments));
    if (filter === "reportAwaitingReview") list = list.filter((entry) => hasReportAwaitingReview(entry.reports));

    const sorted = [...list];
    if (sortBy === "priority") {
      sorted.sort((a, b) => PRIORITY_RANK[a.priority.level] - PRIORITY_RANK[b.priority.level]);
    } else if (sortBy === "activity") {
      sorted.sort((a, b) => {
        const aTime = a.latestSession ? new Date(a.latestSession.date).getTime() : 0;
        const bTime = b.latestSession ? new Date(b.latestSession.date).getTime() : 0;
        return bTime - aTime;
      });
    } else if (sortBy === "name") {
      sorted.sort((a, b) => a.patient.name.localeCompare(b.patient.name));
    }
    return sorted;
  }, [worklist, search, filter, sortBy]);

  return (
    <DoctorLayout active="patients">
      <div className="dp-page">
        <div className="dp-header">
          <div>
            <h1>{t("doctorPatients.title")}</h1>
            <p>{t("doctorPatients.subtitle")}</p>
          </div>
        </div>

        <div className="dp-summary-row">
          <div className="dp-summary-card">
            <span className="dp-summary-value">{summary.active}</span>
            <span className="dp-summary-label">{t("doctorPatients.summary.active")}</span>
          </div>
          <div className="dp-summary-card dp-summary-card--attention">
            <span className="dp-summary-value">{summary.needAttention}</span>
            <span className="dp-summary-label">{t("doctorPatients.summary.needAttention")}</span>
          </div>
          <div className="dp-summary-card dp-summary-card--pending">
            <span className="dp-summary-value">{summary.pendingAppointments}</span>
            <span className="dp-summary-label">{t("doctorPatients.summary.pendingAppointments")}</span>
          </div>
          <div className="dp-summary-card dp-summary-card--pending">
            <span className="dp-summary-value">{summary.reportsAwaitingReview}</span>
            <span className="dp-summary-label">{t("doctorPatients.summary.reportsAwaitingReview")}</span>
          </div>
        </div>

        {(() => {
          const worklistInsight = buildWorklistInsight(worklist);
          return (
            <div className="dp-assistant-summary">
              <DoctorClinicalOrb state="idle" size="tiny" className="dp-assistant-summary-orb" />
              <p>{t(worklistInsight.messageKey, worklistInsight.values)}</p>
              {worklistInsight.values.attentionCount > 0 && (
                <button type="button" className="dp-assistant-summary-link" onClick={() => setFilter("needsAttention")}>
                  {t("doctorAssistantInsights.worklist.showAttention")}
                </button>
              )}
              {worklistInsight.values.reportCount > 0 && (
                <button type="button" className="dp-assistant-summary-link" onClick={() => setFilter("reportAwaitingReview")}>
                  {t("doctorAssistantInsights.worklist.showReports")}
                </button>
              )}
              {worklistInsight.values.appointmentCount > 0 && (
                <button type="button" className="dp-assistant-summary-link" onClick={() => setFilter("pendingAppointment")}>
                  {t("doctorAssistantInsights.worklist.showAppointments")}
                </button>
              )}
            </div>
          );
        })()}

        <div className="dp-controls">
          <div className="dp-search-box">
            <LuSearch aria-hidden="true" />
            <input
              type="text"
              placeholder={t("doctorPatients.search")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label={t("doctorPatients.search")}
            />
          </div>

          <div className="dp-filters" role="group" aria-label={t("doctorPatients.filters.label")}>
            {FILTERS.map((key) => (
              <button
                key={key}
                type="button"
                className={`dp-filter-chip ${filter === key ? "active" : ""}`}
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                {t(`doctorPatients.filters.${key}`)}
              </button>
            ))}
          </div>

          <div className="dp-sort">
            <label htmlFor="dp-sort-select">{t("doctorPatients.sort.label")}</label>
            <select id="dp-sort-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              {SORTS.map((key) => (
                <option key={key} value={key}>
                  {t(`doctorPatients.sort.${key}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="dp-empty">{t("doctorPatients.empty")}</div>
        ) : (
          <div className="dp-grid">
            {filtered.map((entry) => {
              const { patient, priority, adherence, latestPain, latestRom, latestSession } = entry;
              const levelKey = ATTENTION_LEVEL_I18N_KEY[priority.level];
              const pendingAppt = hasPendingAppointment(entry.appointments);
              const pendingReport = hasReportAwaitingReview(entry.reports);

              return (
                <button
                  key={patient.id}
                  type="button"
                  className="dp-card"
                  onClick={() => navigate(ROUTES.DOCTOR_PATIENT_PROFILE.replace(":id", patient.id))}
                >
                  <div className="dp-card-top">
                    <div className="dp-card-identity">
                      <span className="dp-avatar" aria-hidden="true">
                        {patient.firstName[0]}
                        {patient.lastName[0]}
                      </span>
                      <div>
                        <h3 className="dp-name">{patient.name}</h3>
                        <p className="dp-id">{patient.displayId}</p>
                      </div>
                    </div>
                    <span className={`dp-attention dp-attention-${levelKey}`}>{t(`rehabDomain.attentionLevel.${levelKey}`)}</span>
                  </div>

                  <p className="dp-clinical-context">
                    {t(patient.diagnosisKey)} · {t(`rehabDomain.phase.${patient.phaseKey}`)}
                  </p>

                  {priority.reasons.length > 0 && (
                    <ul className="dp-reasons">
                      {priority.reasons.slice(0, 2).map((reason) => (
                        <li key={reason.code}>{t(`rehabDomain.attentionReason.${ATTENTION_REASON_I18N_KEY[reason.code]}`)}</li>
                      ))}
                    </ul>
                  )}

                  <div className="dp-metrics">
                    <div className="dp-metric">
                      <span className="dp-metric-value">{adherence.percent ?? "—"}{adherence.percent !== null ? "%" : ""}</span>
                      <span className="dp-metric-label">{t("doctorPatients.metrics.adherence")}</span>
                    </div>
                    <div className="dp-metric">
                      <span className="dp-metric-value" dir="ltr">
                        {latestPain ? `${latestPain.value}/10` : "—"}
                      </span>
                      <span className="dp-metric-label">{t("doctorPatients.metrics.latestPain")}</span>
                    </div>
                    <div className="dp-metric">
                      <span className="dp-metric-value" dir="ltr">
                        {latestRom !== null ? `${latestRom}°` : "—"}
                      </span>
                      <span className="dp-metric-label">{t("doctorPatients.metrics.latestRom")}</span>
                    </div>
                  </div>

                  <div className="dp-card-footer">
                    <span className="dp-activity">{formatActivity(latestSession)}</span>
                    <div className="dp-pending-tags">
                      {pendingAppt && <span className="dp-tag dp-tag--pending">{t("doctorPatients.tags.appointmentPending")}</span>}
                      {pendingReport && <span className="dp-tag dp-tag--pending">{t("doctorPatients.tags.reportPending")}</span>}
                    </div>
                    <span className="dp-view-link">
                      {t("doctorPatients.actions.view")} <LuChevronRight aria-hidden="true" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
};

export default DoctorPatients;
