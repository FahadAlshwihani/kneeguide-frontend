import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import DoctorLayout from "../components/DoctorLayout";
import DoctorModal from "../components/workspace/DoctorModal";
import AssistantInsightCard from "../components/workspace/AssistantInsightCard";
import DoctorAppointmentComposer from "../components/workspace/DoctorAppointmentComposer";
import { useRehabWorklist, rehabRepository } from "../../../../domain/rehab/useRehabDomain";
import { REPORT_STATUS, REPORT_TREND, REPORT_TREND_I18N_KEY, APPOINTMENT_STATUS } from "../../../../domain/rehab/rehabEnums";
import { compareReports } from "../../../../domain/rehab/rehabDerived";
import { getAllReportsWithContext, getPrioritizedReportForReview, getPreviousReportForPatient } from "../assistant/doctorClinicalInsights";
import { buildReportsPageInsight } from "../assistant/doctorAssistantInsights";
import { ROUTES } from "../../../../utils/routes";
import "../styles/DoctorReports.css";

/**
 * Doctor Reports (Global) — rebuilt on the SAME canonical report entities
 * `rehabRepository.getPatientBundle(patientId).reports` already exposes to
 * the Patient Workspace's own Reports tab (ReportsTab.jsx). There is no
 * independent report array here: every row comes from
 * `getAllReportsWithContext()`, a thin cross-patient flatten over
 * `useRehabWorklist()` — the exact same builder DoctorPatients.jsx's
 * worklist and the Workspace tabs already use. Marking a report reviewed
 * calls the exact same `rehabRepository.markReportReviewed` mutation
 * ReportsTab.jsx calls — one report workflow, viewed from two places.
 */

const TREND_FILTERS = ["all", REPORT_TREND.NEEDS_ATTENTION, REPORT_TREND.IMPROVING, REPORT_TREND.STABLE];
const STATUS_FILTERS = ["all", REPORT_STATUS.AWAITING_REVIEW, REPORT_STATUS.REVIEWED];

const hasUpcomingAppointment = (appointments) =>
  appointments.some(
    (appt) =>
      appt.status === APPOINTMENT_STATUS.REQUESTED ||
      appt.status === APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED ||
      (appt.status === APPOINTMENT_STATUS.CONFIRMED && new Date(appt.startAt) > new Date())
  );

const DoctorReports = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const worklist = useRehabWorklist();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trendFilter, setTrendFilter] = useState("all");
  const [sortKey, setSortKey] = useState("period");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [reviewerNote, setReviewerNote] = useState("");
  const [composerPatientId, setComposerPatientId] = useState(null);

  // Deep link from the Doctor Assistant (chat and Drawer) — "highest
  // priority report" / a named patient's latest report / a comparison
  // both just point here with `?openReport=<id>`, opening the SAME detail
  // modal every row already opens. Consumed once, then stripped from the
  // URL so a refresh doesn't reopen it.
  useEffect(() => {
    const openReport = searchParams.get("openReport");
    if (!openReport) return;
    if (rehabRepository.getReportById(openReport)) {
      setSelectedReportId(openReport);
      setReviewerNote("");
    }
    const next = new URLSearchParams(searchParams);
    next.delete("openReport");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const periodFormatter = useMemo(() => new Intl.DateTimeFormat(i18n.language, { month: "short", day: "numeric" }), [i18n.language]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }), [i18n.language]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allReports = useMemo(() => getAllReportsWithContext(), [worklist]);

  const summary = useMemo(() => {
    const counts = { total: allReports.length, awaitingReview: 0, needsAttention: 0, improving: 0, stable: 0 };
    allReports.forEach((entry) => {
      if (entry.report.reviewStatus === REPORT_STATUS.AWAITING_REVIEW) counts.awaitingReview += 1;
      if (entry.trend === REPORT_TREND.NEEDS_ATTENTION) counts.needsAttention += 1;
      if (entry.trend === REPORT_TREND.IMPROVING) counts.improving += 1;
      if (entry.trend === REPORT_TREND.STABLE) counts.stable += 1;
    });
    return counts;
  }, [allReports]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const prioritizedReport = useMemo(() => getPrioritizedReportForReview(), [allReports]);
  const prioritizedBundle = prioritizedReport ? worklist.find((entry) => entry.patient.id === prioritizedReport.patient.id) : null;

  const reportsInsight = useMemo(
    () =>
      buildReportsPageInsight({
        prioritizedReport,
        awaitingReviewCount: summary.awaitingReview,
        translateFlag: (flag) => t(`doctorPatientWorkspace.reports.flags.${flag}`),
        hasUpcomingAppointment: prioritizedBundle ? hasUpcomingAppointment(prioritizedBundle.appointments) : false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prioritizedReport, summary.awaitingReview, i18n.language]
  );

  const openReport = (reportId) => {
    setSelectedReportId(reportId);
    setReviewerNote("");
  };
  const closeReport = () => setSelectedReportId(null);

  const ASSISTANT_ACTION_BUILDERS = {
    reviewReport: () => ({ id: "reviewReport", labelKey: "doctorReports.assistant.actions.reviewReport", onSelect: () => openReport(reportsInsight.topReportId) }),
    compareWithPrevious: () => ({
      id: "compareWithPrevious",
      labelKey: "doctorReports.assistant.actions.compareWithPrevious",
      onSelect: () => openReport(reportsInsight.topReportId),
    }),
    openPatient: () => ({
      id: "openPatient",
      labelKey: "doctorAssistantInsights.actions.openPatient",
      routeTo: `${ROUTES.DOCTOR_PATIENT_PROFILE.replace(":id", reportsInsight.topReportPatientId)}?tab=reports`,
    }),
    scheduleAppointment: () => ({
      id: "scheduleAppointment",
      labelKey: "doctorAppointments.newAppointment",
      onSelect: () => setComposerPatientId(reportsInsight.topReportPatientId),
    }),
  };
  const assistantActions = reportsInsight.actionIds.map((id) => ASSISTANT_ACTION_BUILDERS[id]());

  const filteredReports = useMemo(() => {
    let result = allReports;
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (entry) =>
          entry.patient.name.toLowerCase().includes(query) || entry.patient.displayId.toLowerCase().includes(query) || entry.report.id.toLowerCase().includes(query)
      );
    }
    if (statusFilter !== "all") result = result.filter((entry) => entry.report.reviewStatus === statusFilter);
    if (trendFilter !== "all") result = result.filter((entry) => entry.trend === trendFilter);

    const sorted = [...result];
    sorted.sort((a, b) => {
      if (sortKey === "period") {
        const diff = new Date(a.report.periodEnd) - new Date(b.report.periodEnd);
        return sortDir === "asc" ? diff : -diff;
      }
      if (sortKey === "pain") {
        const painA = a.report.painTrend?.to ?? -Infinity;
        const painB = b.report.painTrend?.to ?? -Infinity;
        return sortDir === "asc" ? painA - painB : painB - painA;
      }
      return 0;
    });
    return sorted;
  }, [allReports, search, statusFilter, trendFilter, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const selectedEntry = allReports.find((entry) => entry.report.id === selectedReportId) || null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const previousReport = selectedEntry ? getPreviousReportForPatient(selectedEntry.patient.id, selectedEntry.report.id) : null;
  const comparisonRows = selectedEntry ? compareReports(selectedEntry.report, previousReport) : [];
  const reviewerNoteText = (report) => (report.reviewerNote && report.reviewerNote.startsWith("rehabDomain.") ? t(report.reviewerNote) : report.reviewerNote);

  const handleMarkReviewed = () => {
    if (!selectedEntry) return;
    rehabRepository.markReportReviewed(selectedEntry.report.id, { reviewerNote });
    setReviewerNote("");
  };

  return (
    <DoctorLayout active="reports">
      <div className="drp-page">
        <div className="drp-wrapper">
          <header className="drp-header">
            <div>
              <h1>{t("doctorReports.title")}</h1>
              <p>{t("doctorReports.subtitle")}</p>
            </div>
            <div className="drp-header-meta">
              <span className="drp-counter">{t("doctorReports.meta.total", { count: summary.total })}</span>
              <span className="drp-counter">{t("doctorReports.meta.awaitingReview", { count: summary.awaitingReview })}</span>
            </div>
          </header>

          <AssistantInsightCard
            titleKey="doctorAssistantInsights.cardTitle"
            severity={reportsInsight.severity}
            lines={reportsInsight.lines}
            actions={assistantActions}
            className="drp-assistant-card"
          />

          <div className="drp-overview" role="group" aria-label={t("doctorReports.overview.label")}>
            <button type="button" className={`drp-overview-chip ${statusFilter === REPORT_STATUS.AWAITING_REVIEW && trendFilter === "all" ? "active" : ""}`} onClick={() => { setStatusFilter(REPORT_STATUS.AWAITING_REVIEW); setTrendFilter("all"); }}>
              <span className="drp-overview-value">{summary.awaitingReview}</span>
              <span className="drp-overview-label">{t("doctorReports.overview.awaitingReview")}</span>
            </button>
            <button type="button" className={`drp-overview-chip drp-overview-chip--attention ${trendFilter === REPORT_TREND.NEEDS_ATTENTION ? "active" : ""}`} onClick={() => { setTrendFilter(REPORT_TREND.NEEDS_ATTENTION); setStatusFilter("all"); }}>
              <span className="drp-overview-value">{summary.needsAttention}</span>
              <span className="drp-overview-label">{t(`rehabDomain.attentionLevel.${REPORT_TREND_I18N_KEY[REPORT_TREND.NEEDS_ATTENTION]}`)}</span>
            </button>
            <button type="button" className={`drp-overview-chip drp-overview-chip--improving ${trendFilter === REPORT_TREND.IMPROVING ? "active" : ""}`} onClick={() => { setTrendFilter(REPORT_TREND.IMPROVING); setStatusFilter("all"); }}>
              <span className="drp-overview-value">{summary.improving}</span>
              <span className="drp-overview-label">{t(`rehabDomain.attentionLevel.${REPORT_TREND_I18N_KEY[REPORT_TREND.IMPROVING]}`)}</span>
            </button>
            <button type="button" className={`drp-overview-chip ${trendFilter === REPORT_TREND.STABLE ? "active" : ""}`} onClick={() => { setTrendFilter(REPORT_TREND.STABLE); setStatusFilter("all"); }}>
              <span className="drp-overview-value">{summary.stable}</span>
              <span className="drp-overview-label">{t(`rehabDomain.attentionLevel.${REPORT_TREND_I18N_KEY[REPORT_TREND.STABLE]}`)}</span>
            </button>
          </div>

          <div className="drp-controls">
            <div className="drp-search-box">
              <input
                type="text"
                placeholder={t("doctorReports.filters.searchPlaceholder")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label={t("doctorReports.filters.searchPlaceholder")}
              />
            </div>
            <div className="drp-filter-group">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label={t("doctorReports.filters.statusLabel")}>
                {STATUS_FILTERS.map((key) => (
                  <option key={key} value={key}>
                    {key === "all" ? t("doctorReports.filters.statusAll") : t(`doctorPatientWorkspace.reports.status.${key}`)}
                  </option>
                ))}
              </select>
              <select value={trendFilter} onChange={(event) => setTrendFilter(event.target.value)} aria-label={t("doctorReports.filters.trendLabel")}>
                {TREND_FILTERS.map((key) => (
                  <option key={key} value={key}>
                    {key === "all" ? t("doctorReports.filters.trendAll") : t(`rehabDomain.attentionLevel.${REPORT_TREND_I18N_KEY[key]}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="drp-table-wrapper">
            <table className="drp-table">
              <thead>
                <tr>
                  <th>{t("doctorReports.table.columns.report")}</th>
                  <th>{t("doctorReports.table.columns.patient")}</th>
                  <th className="sortable" onClick={() => handleSort("period")}>
                    {t("doctorReports.table.columns.period")}
                    <span className="drp-sort-indicator">{sortKey === "period" ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
                  </th>
                  <th className="sortable" onClick={() => handleSort("pain")}>
                    {t("doctorReports.table.columns.pain")}
                    <span className="drp-sort-indicator">{sortKey === "pain" ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
                  </th>
                  <th>{t("doctorReports.table.columns.status")}</th>
                  <th>{t("doctorReports.table.columns.trend")}</th>
                  <th>{t("doctorReports.table.columns.updated")}</th>
                  <th aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={8} className="drp-empty">
                      {t("doctorReports.table.noResults")}
                    </td>
                  </tr>
                )}
                {filteredReports.map(({ report, patient, trend }) => (
                  <tr key={report.id} onClick={() => openReport(report.id)} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && openReport(report.id)}>
                    <td>
                      <span className="drp-report-id">{report.id.startsWith("rpt-") ? report.id.replace("rpt-", "").toUpperCase() : report.id}</span>
                    </td>
                    <td>
                      <div className="drp-patient-cell">
                        <span className="drp-patient-name" dir="auto">
                          {patient.name}
                        </span>
                        <span className="drp-patient-id">{patient.displayId}</span>
                      </div>
                    </td>
                    <td dir="ltr" className="drp-period-cell">
                      {periodFormatter.format(new Date(report.periodStart))} – {periodFormatter.format(new Date(report.periodEnd))}
                    </td>
                    <td dir="ltr">{report.painTrend ? `${report.painTrend.from} → ${report.painTrend.to}` : "—"}</td>
                    <td>
                      <span className={`drp-badge drp-badge--status-${report.reviewStatus}`}>
                        {t(`doctorPatientWorkspace.reports.status.${report.reviewStatus}`)}
                      </span>
                    </td>
                    <td>
                      <span className={`drp-badge drp-badge--trend-${trend}`}>{t(`rehabDomain.attentionLevel.${REPORT_TREND_I18N_KEY[trend]}`)}</span>
                    </td>
                    <td dir="ltr" className="drp-updated-cell">
                      {dateFormatter.format(new Date(report.reviewedAt || report.generatedAt))}
                    </td>
                    <td>
                      <button type="button" className="drp-row-action" onClick={(event) => { event.stopPropagation(); openReport(report.id); }}>
                        {report.reviewStatus === REPORT_STATUS.AWAITING_REVIEW ? t("doctorReports.table.reviewAction") : t("doctorReports.table.viewAction")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Compact card list — the mobile representation (Section 40 of
              the brief: avoid forcing the full desktop table into
              horizontal-scroll on small screens). Same `filteredReports`
              data, no second fetch; CSS toggles which one is visible. */}
          <div className="drp-mobile-list">
            {filteredReports.length === 0 ? (
              <p className="drp-empty">{t("doctorReports.table.noResults")}</p>
            ) : (
              filteredReports.map(({ report, patient, trend }) => (
                <button type="button" key={report.id} className="drp-mobile-card" onClick={() => openReport(report.id)}>
                  <div className="drp-mobile-card-top">
                    <span className="drp-patient-name" dir="auto">
                      {patient.name}
                    </span>
                    <span className={`drp-badge drp-badge--trend-${trend}`}>{t(`rehabDomain.attentionLevel.${REPORT_TREND_I18N_KEY[trend]}`)}</span>
                  </div>
                  <span className="drp-period-cell" dir="ltr">
                    {periodFormatter.format(new Date(report.periodStart))} – {periodFormatter.format(new Date(report.periodEnd))}
                  </span>
                  <div className="drp-mobile-card-bottom">
                    <span className={`drp-badge drp-badge--status-${report.reviewStatus}`}>
                      {t(`doctorPatientWorkspace.reports.status.${report.reviewStatus}`)}
                    </span>
                    <span className="drp-mobile-card-action">
                      {report.reviewStatus === REPORT_STATUS.AWAITING_REVIEW ? t("doctorReports.table.reviewAction") : t("doctorReports.table.viewAction")}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedEntry && (
        <DoctorModal
          isOpen={!!selectedEntry}
          onClose={closeReport}
          title={t("doctorReports.detail.title", { id: selectedEntry.report.id.startsWith("rpt-") ? selectedEntry.report.id.replace("rpt-", "").toUpperCase() : selectedEntry.report.id })}
          closeLabel={t("doctorPatientWorkspace.close")}
          footer={
            <>
              <button type="button" className="dw-btn-secondary" onClick={closeReport}>
                {t("doctorPatientWorkspace.close")}
              </button>
              {selectedEntry.report.reviewStatus !== REPORT_STATUS.REVIEWED && (
                <button type="button" className="dw-btn-primary" onClick={handleMarkReviewed}>
                  {t("doctorReports.detail.markReviewed")}
                </button>
              )}
            </>
          }
        >
          <div className="drp-detail-header">
            <button
              type="button"
              className="drp-detail-patient-link"
              onClick={() => navigate(`${ROUTES.DOCTOR_PATIENT_PROFILE.replace(":id", selectedEntry.patient.id)}?tab=reports`)}
            >
              {selectedEntry.patient.name}
            </button>
            <span className="drp-detail-meta">{selectedEntry.patient.displayId}</span>
          </div>
          <p className="drp-detail-period" dir="ltr">
            {dateFormatter.format(new Date(selectedEntry.report.periodStart))} – {dateFormatter.format(new Date(selectedEntry.report.periodEnd))}
          </p>

          <div className="drp-detail-tags">
            <span className={`drp-badge drp-badge--status-${selectedEntry.report.reviewStatus}`}>
              {t(`doctorPatientWorkspace.reports.status.${selectedEntry.report.reviewStatus}`)}
            </span>
            <span className={`drp-badge drp-badge--trend-${selectedEntry.trend}`}>
              {t(`rehabDomain.attentionLevel.${REPORT_TREND_I18N_KEY[selectedEntry.trend]}`)}
            </span>
          </div>

          <div className="drp-detail-section">
            <h3>{t("doctorReports.detail.measurements")}</h3>
            <ul className="drp-measurement-list">
              <li>
                <span>{t("doctorPatientWorkspace.reports.sessions")}</span>
                <span dir="ltr">
                  {selectedEntry.report.sessionsCompleted}/{selectedEntry.report.sessionsExpected}
                </span>
              </li>
              <li>
                <span>{t("doctorPatientWorkspace.reports.adherence")}</span>
                <span dir="ltr">{selectedEntry.report.adherencePercent !== null ? `${selectedEntry.report.adherencePercent}%` : "—"}</span>
              </li>
              {selectedEntry.report.painTrend && (
                <li>
                  <span>{t("doctorPatientWorkspace.reports.pain")}</span>
                  <span dir="ltr">
                    {selectedEntry.report.painTrend.from} → {selectedEntry.report.painTrend.to}
                  </span>
                </li>
              )}
              {selectedEntry.report.romTrend && (
                <li>
                  <span>{t("doctorPatientWorkspace.reports.rom")}</span>
                  <span dir="ltr">
                    {selectedEntry.report.romTrend.from}° → {selectedEntry.report.romTrend.to}°
                  </span>
                </li>
              )}
            </ul>
            {selectedEntry.report.flags.length > 0 && (
              <div className="drp-flags">
                {selectedEntry.report.flags.map((flag) => (
                  <span key={flag} className="drp-flag">
                    {t(`doctorPatientWorkspace.reports.flags.${flag}`)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="drp-detail-section">
            <h3>{t("doctorReports.detail.comparison")}</h3>
            {comparisonRows.length === 0 ? (
              <p className="drp-muted">{t("doctorReports.detail.noComparison")}</p>
            ) : (
              <table className="drp-comparison-table">
                <thead>
                  <tr>
                    <th>{t("doctorReports.detail.metric")}</th>
                    <th>{t("doctorReports.detail.previous")}</th>
                    <th>{t("doctorReports.detail.current")}</th>
                    <th>{t("doctorReports.detail.change")}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => {
                    const improved = row.change !== 0 && Math.sign(row.change) === row.improvingDirection;
                    const worsened = row.change !== 0 && Math.sign(row.change) !== row.improvingDirection;
                    const unit = row.metric === "rom" ? "°" : row.metric === "adherence" ? "%" : "";
                    return (
                      <tr key={row.metric}>
                        <td>{t(`doctorReports.detail.metrics.${row.metric}`)}</td>
                        <td dir="ltr">
                          {row.previous}
                          {unit}
                        </td>
                        <td dir="ltr">
                          {row.current}
                          {unit}
                        </td>
                        <td dir="ltr" className={improved ? "drp-change--improved" : worsened ? "drp-change--worsened" : ""}>
                          {row.change === 0 ? t("doctorReports.detail.noChange") : `${row.change > 0 ? "↑" : "↓"} ${Math.abs(row.change)}${unit}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {selectedEntry.report.sessionsCompleted > 0 && (
            <button
              type="button"
              className="drp-related-session-link"
              onClick={() => navigate(`${ROUTES.DOCTOR_PATIENT_PROFILE.replace(":id", selectedEntry.patient.id)}?tab=sessions`)}
            >
              {t("doctorReports.detail.viewSessions")}
            </button>
          )}

          <div className="drp-detail-section">
            <h3>{t("doctorReports.detail.clinicianNote")}</h3>
            {selectedEntry.report.reviewStatus === REPORT_STATUS.REVIEWED ? (
              <p className="drp-detail-note" dir="auto">
                {reviewerNoteText(selectedEntry.report) || t("doctorReports.detail.noClinicianNote")}
              </p>
            ) : (
              <div className="dw-field">
                <label htmlFor="drp-reviewer-note">{t("doctorReports.detail.addNote")}</label>
                <textarea id="drp-reviewer-note" rows={3} value={reviewerNote} onChange={(event) => setReviewerNote(event.target.value)} />
              </div>
            )}
          </div>
        </DoctorModal>
      )}

      <DoctorAppointmentComposer isOpen={!!composerPatientId} onClose={() => setComposerPatientId(null)} patientId={composerPatientId} />
    </DoctorLayout>
  );
};

export default DoctorReports;
