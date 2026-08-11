import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "../styles/Reports.css";
import { getAllReports } from "../data/patientReportsData";
import { getRehabWeek, REHAB_DAY_STATUS } from "../data/patientRehabPlanData";
import {
  getPainValue,
  getFlexionValue,
  filterByRange,
  getAveragePain,
  getPreviousWindowAverage,
  getDelta,
  getCompletionRate,
  getCompletionCounts,
  getMilestones,
} from "../reports/patientReportMetrics";
import { getRecoveryFacts, getRecoveryInsight, getTrendExplanation } from "../reports/patientReportInsights";
import RecoveryInsight from "../components/reports/RecoveryInsight";
import RecoveryMilestones from "../components/reports/RecoveryMilestones";
import RecoveryTrends from "../components/reports/RecoveryTrends";
import SessionHistory from "../components/reports/SessionHistory";
import RecoveryReportModal from "../components/reports/RecoveryReportModal";

/**
 * Patient Recovery Reports — evolved from a generic analytics dashboard
 * into a KneeGuide Recovery Intelligence + Clinical Reports experience.
 * See the final report for the complete architecture; in short:
 *
 *   data/patientReportsData.js     — the unified report domain model +
 *     fixture history (reuses TODAY's real completed Exercise Session
 *     data when it exists, never re-fakes it)
 *   reports/patientReportMetrics.js  — pure chronological math
 *   reports/patientReportInsights.js — mock/deterministic KneeGuide
 *     recovery-insight + trend-explanation + report-comparison selection
 *   components/reports/*             — the presentational pieces
 *
 * This page owns: the Time Range / Sort By filter state, deriving the
 * filtered+chronological report list those metrics/insights are computed
 * from, and the currently-open report modal — no metric calculation or
 * insight-text logic lives directly in this component.
 *
 * Section 24's separation is enforced structurally: `chronological`
 * (filtered, oldest-first) is the ONLY array ever passed to metrics/
 * insights; `sortedForTable` (filtered, re-sorted per the Sort By
 * control) is only ever passed to SessionHistory for display — the two
 * are never the same array reference doing double duty.
 */

const RANGE_TO_DAYS = { "7": 7, "30": 30, "90": 90 };

const Reports = () => {
  const { t } = useTranslation();

  const [range, setRange] = useState("30");
  const [sortBy, setSortBy] = useState("date-desc");
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const trendsRef = useRef(null);

  const referenceDate = useMemo(() => new Date(), []);
  const todayId = useMemo(() => getRehabWeek(referenceDate).find((day) => day.status === REHAB_DAY_STATUS.TODAY)?.id, [referenceDate]);

  // The full history — fixtures + today's real completed session if any
  // — computed once per page visit; always chronological (oldest first).
  const allReports = useMemo(() => getAllReports(referenceDate, todayId), [referenceDate, todayId]);

  // Section 23: Time Range genuinely filters the local dataset that every
  // metric/chart/insight/milestone below is computed from.
  const chronological = useMemo(
    () => filterByRange(allReports, RANGE_TO_DAYS[range] ?? null, referenceDate),
    [allReports, range, referenceDate]
  );

  const sortedForTable = useMemo(() => {
    const list = [...chronological];
    if (sortBy === "date-desc") list.sort((a, b) => b.date - a.date);
    if (sortBy === "date-asc") list.sort((a, b) => a.date - b.date);
    if (sortBy === "pain-desc") list.sort((a, b) => (getPainValue(b) ?? -1) - (getPainValue(a) ?? -1));
    if (sortBy === "pain-asc") list.sort((a, b) => (getPainValue(a) ?? 11) - (getPainValue(b) ?? 11));
    return list;
  }, [chronological, sortBy]);

  const avgPain = getAveragePain(chronological);
  const previousAvgPain = getPreviousWindowAverage(allReports, chronological, getPainValue, 5);
  const flexionDelta = getDelta(chronological, getFlexionValue);
  const completionRate = getCompletionRate(chronological);
  const completionCounts = getCompletionCounts(chronological);

  const facts = useMemo(() => getRecoveryFacts(chronological, 5), [chronological]);
  const insight = useMemo(() => getRecoveryInsight(facts), [facts]);
  const trendExplanation = useMemo(() => getTrendExplanation(facts), [facts]);
  const milestones = useMemo(() => getMilestones(chronological), [chronological]);

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setModalOpen(true);
  };

  const previousReportFor = (report) => {
    const index = allReports.findIndex((item) => item.id === report.id);
    return index > 0 ? allReports[index - 1] : null;
  };

  const scrollToTrends = () => {
    trendsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="reports-page patient-version">
      <div className="reports-wrapper">
        <header className="reports-header">
          <h1>{t("patientReports.header.title")}</h1>
          <p>{t("patientReports.header.subtitle")}</p>
        </header>

        <div className="reports-top-row">
          <div className="reports-filters">
            <div className="filter-group">
              <label htmlFor="reports-range-select">{t("patientReports.filters.range")}</label>
              <select id="reports-range-select" value={range} onChange={(event) => setRange(event.target.value)}>
                <option value="7">{t("patientReports.range.last7")}</option>
                <option value="30">{t("patientReports.range.last30")}</option>
                <option value="90">{t("patientReports.range.last90")}</option>
              </select>
            </div>
          </div>

          <div className="reports-summary">
            <div className="summary-card">
              <p className="label">{t("patientReports.summary.avgPain")}</p>
              <h3 dir="ltr">{avgPain !== null ? `${avgPain.toFixed(1)}/10` : "—"}</h3>
              <span className="hint">
                {previousAvgPain !== null && avgPain !== null
                  ? t("patientReports.summary.painComparison", {
                      value: Math.abs(avgPain - previousAvgPain).toFixed(1),
                      direction: avgPain <= previousAvgPain ? t("patientReports.summary.down") : t("patientReports.summary.up"),
                    })
                  : t("patientReports.summary.hintSessions")}
              </span>
            </div>

            <div className="summary-card">
              <p className="label">{t("patientReports.summary.flexion")}</p>
              <h3 dir="ltr">{flexionDelta !== null ? `${flexionDelta > 0 ? "+" : ""}${flexionDelta}°` : "—"}</h3>
              <span className="hint">
                {flexionDelta === null
                  ? t("patientReports.summary.hintImprovement")
                  : flexionDelta > 0
                  ? t("patientReports.summary.improving")
                  : flexionDelta < 0
                  ? t("patientReports.summary.declining")
                  : t("patientReports.summary.hintImprovement")}
              </span>
            </div>

            <div className="summary-card">
              <p className="label">{t("patientReports.summary.completion")}</p>
              <h3 dir="ltr">{completionRate !== null ? `${Math.round(completionRate * 100)}%` : "—"}</h3>
              <span className="hint">
                {t("patientReports.summary.hintCompletionCount", {
                  completed: completionCounts.completed,
                  total: completionCounts.total,
                })}
              </span>
            </div>
          </div>
        </div>

        {chronological.length === 0 ? (
          <p className="reports-empty">
            {t(allReports.length === 0 ? "patientReports.empty.noReportsYet" : "patientReports.empty.noReportsInRange")}
          </p>
        ) : (
          <>
            <RecoveryInsight insight={insight} facts={facts} onViewTrends={chronological.length >= 2 ? scrollToTrends : null} />

            {milestones.sessionsTracked > 0 && <RecoveryMilestones milestones={milestones} />}

            <div ref={trendsRef}>
              {chronological.length >= 2 ? (
                <RecoveryTrends chronologicalReports={chronological} explanation={trendExplanation} />
              ) : (
                <p className="reports-single-report-note">{t("patientReports.empty.singleReportTrend")}</p>
              )}
            </div>

            <SessionHistory reports={sortedForTable} sortBy={sortBy} onSortChange={setSortBy} onViewReport={handleViewReport} />
          </>
        )}
      </div>

      <RecoveryReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        report={selectedReport}
        previousReport={selectedReport ? previousReportFor(selectedReport) : null}
      />
    </div>
  );
};

export default Reports;
