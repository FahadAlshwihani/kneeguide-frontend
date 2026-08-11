import React from "react";
import { useTranslation } from "react-i18next";
import { LuTrophy, LuTrendingDown, LuCircleCheck } from "react-icons/lu";
import "./RecoveryMilestones.css";

/**
 * A compact milestone strip (Section 22) — deliberately NOT another row
 * of large cards. Plain aggregation (reports/patientReportMetrics.js's
 * getMilestones) rendered as a few small labeled facts.
 */
const RecoveryMilestones = ({ milestones }) => {
  const { t } = useTranslation();

  if (!milestones || milestones.sessionsTracked === 0) return null;

  return (
    <section className="recovery-milestones" aria-label={t("patientReports.milestones.title")}>
      <p className="recovery-milestones-title">{t("patientReports.milestones.title")}</p>
      <div className="recovery-milestones-list">
        {milestones.bestFlexion !== null && (
          <span className="recovery-milestone">
            <LuTrophy aria-hidden="true" />
            {t("patientReports.milestones.bestFlexion", { value: milestones.bestFlexion })}
          </span>
        )}
        {milestones.lowestPain !== null && (
          <span className="recovery-milestone">
            <LuTrendingDown aria-hidden="true" />
            {t("patientReports.milestones.lowestPain", { value: milestones.lowestPain })}
          </span>
        )}
        <span className="recovery-milestone">
          <LuCircleCheck aria-hidden="true" />
          {t("patientReports.milestones.sessionsTracked", {
            completed: milestones.completedSessions,
            total: milestones.sessionsTracked,
          })}
        </span>
      </div>
    </section>
  );
};

export default RecoveryMilestones;
