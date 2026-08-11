import React from "react";
import { useTranslation } from "react-i18next";
import { getPainValue, getFlexionValue } from "../../reports/patientReportMetrics";
import "./RecoveryTrends.css";

/**
 * ONE mini trend row for a single metric — its own local min/max scale,
 * never sharing an axis with the other metric (Section 9: pain 0–10 and
 * flexion ~90–130° are not comparable units, so they never share a
 * visual scale here). Each point shows its own value label plus a date
 * label, addressing the old chart's unreadable numeric x-axis (Section
 * 8) directly — no charting library, same hand-rolled-bars approach the
 * rest of this codebase already uses (e.g. the old progress-mini-chart),
 * just split into two clearly-scaled rows instead of one overlapping one.
 */
const TrendRow = ({ label, points, unit, colorVar, dateFormatter }) => {
  const values = points.map((point) => point.value).filter((value) => typeof value === "number");
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 1;
  const range = max - min || 1;

  return (
    <div className="recovery-trend-row">
      <p className="recovery-trend-row-label">{label}</p>
      <div className="recovery-trend-bars">
        {points.map((point, index) => {
          const heightPercent = typeof point.value === "number" ? 12 + ((point.value - min) / range) * 88 : 0;
          return (
            <div key={index} className="recovery-trend-bar-column">
              <span className="recovery-trend-bar-value" dir="ltr">
                {typeof point.value === "number" ? `${point.value}${unit}` : "—"}
              </span>
              <div className="recovery-trend-bar-track">
                {typeof point.value === "number" && (
                  <div
                    className="recovery-trend-bar-fill"
                    style={{ height: `${heightPercent}%`, background: `var(${colorVar})` }}
                  />
                )}
              </div>
              <span className="recovery-trend-bar-date">{dateFormatter(point.date)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Two aligned mini trend charts (pain, flexion) + one deterministic
 * interpretation line underneath (Section 10) — `explanation` is
 * pre-computed by reports/patientReportInsights.js's
 * getTrendExplanation; this component never derives it itself.
 */
const RecoveryTrends = ({ chronologicalReports, explanation }) => {
  const { t, i18n } = useTranslation();

  const dateFormatter = (date) => date.toLocaleDateString(i18n.language, { month: "short", day: "numeric" });

  const painPoints = chronologicalReports.map((report) => ({ date: report.date, value: getPainValue(report) }));
  const flexionPoints = chronologicalReports.map((report) => ({ date: report.date, value: getFlexionValue(report) }));

  return (
    <section className="recovery-trends" aria-labelledby="recovery-trends-heading">
      <div className="recovery-trends-header">
        <h2 id="recovery-trends-heading">{t("patientReports.trends.title")}</h2>
        <p>{t("patientReports.trends.subtitle")}</p>
      </div>

      <TrendRow
        label={t("patientReports.trends.painLabel")}
        points={painPoints}
        unit=""
        colorVar="--patient-color-warning"
        dateFormatter={dateFormatter}
      />
      <TrendRow
        label={t("patientReports.trends.flexionLabel")}
        points={flexionPoints}
        unit="°"
        colorVar="--patient-color-primary"
        dateFormatter={dateFormatter}
      />

      {explanation && <p className="recovery-trends-explanation">{t(explanation.messageKey, explanation.values)}</p>}
    </section>
  );
};

export default RecoveryTrends;
