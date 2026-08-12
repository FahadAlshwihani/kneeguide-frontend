import React from "react";
import { useTranslation } from "react-i18next";
import { LuTrendingDown, LuTrendingUp, LuArrowRight, LuCircleCheck } from "react-icons/lu";
import KneeGuideInsightCard from "../exercises/KneeGuideInsightCard";
import PatientButton from "../PatientButton";
import "./RecoveryInsight.css";

const TREND_ICON = {
  improving: LuTrendingUp,
  declining: LuTrendingDown,
  stable: LuArrowRight,
  insufficient_data: LuArrowRight,
};

/**
 * The page's main narrative — "KneeGuide Recovery Insight" — the biggest
 * missing feature the task asks for. Built on the SAME
 * KneeGuideInsightCard the Exercise Session flow already uses between
 * exercises and at session completion (components/exercises/
 * KneeGuideInsightCard.jsx, unchanged) — one visual identity for "this is
 * KneeGuide talking", not a second bespoke card style. `insight` and
 * `facts` are pre-computed by reports/patientReportInsights.js; this
 * component only renders them, never computes anything itself.
 *
 * Signal chips below the narrative are compact and few (Section 7) — the
 * narrative sentence stays the visually dominant element, not another
 * four-card dashboard grid.
 */
const RecoveryInsight = ({ insight, facts, onViewTrends }) => {
  const { t } = useTranslation();

  if (!insight) return null;

  const TrendIcon = TREND_ICON[facts.trendDirection] || LuArrowRight;
  const painImproved = facts.painDelta !== null && facts.painDelta > 0;
  const flexionImproved = facts.flexionDelta !== null && facts.flexionDelta > 0;

  return (
    <section className="recovery-insight" aria-labelledby="recovery-insight-heading">
      <KneeGuideInsightCard
        title={
          <span id="recovery-insight-heading">{t("patientReports.insight.title")}</span>
        }
        message={t(insight.messageKey, insight.values)}
        tone={insight.severity}
      >
        {onViewTrends && (
          <PatientButton type="button" variant="ghost" size="sm" onClick={onViewTrends}>
            {t("patientReports.insight.viewTrends")}
          </PatientButton>
        )}
      </KneeGuideInsightCard>

      {facts.hasEnoughHistory && (
        <div className="recovery-signals" role="list">
          {facts.painDelta !== null && (
            <div className="recovery-signal" role="listitem">
              {painImproved ? <LuTrendingDown aria-hidden="true" /> : <LuTrendingUp aria-hidden="true" />}
              <div>
                <p className="recovery-signal-label">
                  {t(painImproved ? "patientReports.insight.painImproving" : "patientReports.insight.painChanging")}
                </p>
                <p className="recovery-signal-value" dir="ltr">
                  {Math.round((facts.newestPain - facts.oldestPain) * 10) / 10 > 0 ? "+" : ""}
                  {Math.round((facts.newestPain - facts.oldestPain) * 10) / 10}
                </p>
              </div>
            </div>
          )}

          {facts.flexionDelta !== null && (
            <div className="recovery-signal" role="listitem">
              {flexionImproved ? <LuTrendingUp aria-hidden="true" /> : <LuTrendingDown aria-hidden="true" />}
              <div>
                <p className="recovery-signal-label">
                  {t(flexionImproved ? "patientReports.insight.flexionImproving" : "patientReports.insight.flexionChanging")}
                </p>
                <p className="recovery-signal-value" dir="ltr">
                  {facts.flexionDelta > 0 ? "+" : ""}
                  {facts.flexionDelta}°
                </p>
              </div>
            </div>
          )}

          {facts.completionRate !== null && (
            <div className="recovery-signal" role="listitem">
              <LuCircleCheck aria-hidden="true" />
              <div>
                <p className="recovery-signal-label">{t("patientReports.insight.adherence")}</p>
                <p className="recovery-signal-value" dir="ltr">
                  {Math.round(facts.completionRate * 100)}%
                </p>
              </div>
            </div>
          )}

          <div className="recovery-signal" role="listitem">
            <TrendIcon aria-hidden="true" />
            <div>
              <p className="recovery-signal-label">{t("patientReports.insight.recentTrend")}</p>
              <p className="recovery-signal-value">{t(`patientReports.insight.trendDirection.${facts.trendDirection}`)}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RecoveryInsight;
