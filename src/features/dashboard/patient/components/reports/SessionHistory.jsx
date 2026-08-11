import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronRight } from "react-icons/lu";
import { getPainValue, getFlexionValue } from "../../reports/patientReportMetrics";
import "./SessionHistory.css";

const SESSION_STATUS_TONE = { completed: "positive", incomplete: "neutral" };
const REVIEW_STATUS_TONE = { reviewed: "positive", awaiting_review: "neutral", not_shared: "neutral" };

const StatusPill = ({ label, tone }) => <span className={`session-history-pill session-history-pill--${tone}`}>{label}</span>;

/**
 * The Sessions Log — now interactive (Section 11) and with SESSION
 * status and REVIEW status kept as two separate pills (Section 15/26),
 * never one overloaded "Pending" field. Renders BOTH a desktop table and
 * a mobile stacked-row list from the same `reports` prop — same pattern
 * already used elsewhere in this feature (one data source, two CSS-
 * breakpoint-gated markups) rather than trying to force one DOM shape to
 * do both jobs via table-layout tricks.
 *
 * `reports` here is in whatever order the caller's Sort By selection
 * produced — this component never reorders or recomputes trend data
 * itself (Section 24).
 */
const SessionHistory = ({ reports, sortBy, onSortChange, onViewReport }) => {
  const { t, i18n } = useTranslation();

  const dateLabel = (date) => date.toLocaleDateString(i18n.language, { month: "short", day: "numeric", year: "numeric" });

  return (
    <section className="session-history" aria-labelledby="session-history-heading">
      <div className="session-history-header">
        <div>
          <h2 id="session-history-heading">{t("patientReports.table.title")}</h2>
          <p>{t("patientReports.table.subtitle")}</p>
        </div>

        <div className="session-history-sort">
          <label htmlFor="session-history-sort-select">{t("patientReports.filters.sortBy")}</label>
          <select id="session-history-sort-select" value={sortBy} onChange={(event) => onSortChange(event.target.value)}>
            <option value="date-desc">{t("patientReports.sort.newest")}</option>
            <option value="date-asc">{t("patientReports.sort.oldest")}</option>
            <option value="pain-desc">{t("patientReports.sort.painHigh")}</option>
            <option value="pain-asc">{t("patientReports.sort.painLow")}</option>
          </select>
        </div>
      </div>

      {reports.length === 0 ? (
        <p className="session-history-empty">{t("patientReports.empty.noResultsForFilter")}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="session-history-table-wrapper">
            <table className="session-history-table">
              <thead>
                <tr>
                  <th>{t("patientReports.table.headers.date")}</th>
                  <th>{t("patientReports.table.headers.pain")}</th>
                  <th>{t("patientReports.table.headers.flexion")}</th>
                  <th>{t("patientReports.table.headers.status")}</th>
                  <th>{t("patientReports.table.headers.review")}</th>
                  <th aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const pain = getPainValue(report);
                  const flexion = getFlexionValue(report);
                  return (
                    <tr key={report.id}>
                      <td>{dateLabel(report.date)}</td>
                      <td dir="ltr">{pain !== null ? `${pain}/10` : "—"}</td>
                      <td dir="ltr">{flexion !== null ? `${flexion}°` : "—"}</td>
                      <td>
                        <StatusPill
                          label={t(`patientReports.status.session.${report.sessionStatus}`)}
                          tone={SESSION_STATUS_TONE[report.sessionStatus] || "neutral"}
                        />
                      </td>
                      <td>
                        {report.clinicalReview ? (
                          <StatusPill
                            label={t(`patientReports.status.review.${report.clinicalReview.status}`)}
                            tone={REVIEW_STATUS_TONE[report.clinicalReview.status] || "neutral"}
                          />
                        ) : (
                          <span className="session-history-dash">—</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="session-history-view-btn"
                          onClick={() => onViewReport(report)}
                        >
                          {t("patientReports.table.view")}
                          <LuChevronRight aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked rows */}
          <ul className="session-history-cards">
            {reports.map((report) => {
              const pain = getPainValue(report);
              const flexion = getFlexionValue(report);
              return (
                <li key={report.id} className="session-history-card">
                  <button type="button" className="session-history-card-btn" onClick={() => onViewReport(report)}>
                    <div className="session-history-card-top">
                      <span className="session-history-card-date">{dateLabel(report.date)}</span>
                      <StatusPill
                        label={t(`patientReports.status.session.${report.sessionStatus}`)}
                        tone={SESSION_STATUS_TONE[report.sessionStatus] || "neutral"}
                      />
                    </div>
                    <div className="session-history-card-metrics" dir="ltr">
                      <span>{pain !== null ? `${t("patientReports.table.headers.pain")} ${pain}/10` : ""}</span>
                      <span>{flexion !== null ? `${t("patientReports.table.headers.flexion")} ${flexion}°` : ""}</span>
                    </div>
                    <div className="session-history-card-bottom">
                      {report.clinicalReview ? (
                        <StatusPill
                          label={t(`patientReports.status.review.${report.clinicalReview.status}`)}
                          tone={REVIEW_STATUS_TONE[report.clinicalReview.status] || "neutral"}
                        />
                      ) : (
                        <span />
                      )}
                      <span className="session-history-card-action">
                        {t("patientReports.table.view")}
                        <LuChevronRight aria-hidden="true" />
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
};

export default SessionHistory;
