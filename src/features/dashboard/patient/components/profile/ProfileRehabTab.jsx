import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import KneeGuideInsightCard from "../exercises/KneeGuideInsightCard";
import PatientButton from "../PatientButton";
import { ROUTES } from "../../../../../utils/routes";
import { getTodaySessionPlan, getSessionTotals } from "../../data/patientRehabPlanData";

/**
 * Rehab tab — a PROGRAM SUMMARY (Section 9), not a second exercise engine.
 * Both the totals and the per-exercise rows are derived from
 * `getTodaySessionPlan()`/`getSessionTotals()` (data/patientRehabPlanData.js
 * — the exact same source PatientExercises.jsx's own session hero reads),
 * so a sets/reps/target change there is reflected here automatically
 * instead of risking a second, silently-diverging hardcoded list (the
 * original Profile page's own "Rehab Program" tab used to do exactly
 * that — three rows typed directly into JSX, never touching the catalog).
 */
const ProfileRehabTab = ({ rehabPhaseKey, insight }) => {
  const { t } = useTranslation();
  const plan = useMemo(() => getTodaySessionPlan(), []);
  const totals = useMemo(() => getSessionTotals(plan), [plan]);

  return (
    <div className="pfl-tab-panel">
      <section className="pfl-card" aria-labelledby="pfl-rehab-heading">
        <h2 id="pfl-rehab-heading" className="pfl-card-title">
          {t("patientProfile.rehab.title")}
        </h2>

        <div className="pfl-metric-grid pfl-metric-grid--summary">
          <div className="pfl-metric">
            <span>{t("patientProfile.rehab.exercises")}</span>
            <p>{totals.exerciseCount}</p>
          </div>
          <div className="pfl-metric">
            <span>{t("patientProfile.rehab.sets")}</span>
            <p>{totals.setCount}</p>
          </div>
          <div className="pfl-metric">
            <span>{t("patientProfile.rehab.duration")}</span>
            <p>{t("patientProfile.rehab.durationValue", { count: totals.estimatedMinutes })}</p>
          </div>
          <div className="pfl-metric">
            <span>{t("patientProfile.rehab.phase")}</span>
            <p>{t(`patientProfile.rehabPhase.${rehabPhaseKey}`)}</p>
          </div>
        </div>

        <div className="pfl-exercise-list">
          {plan.map((item) => (
            <div key={item.exerciseId} className="pfl-exercise-row">
              <span className="pfl-exercise-name">{item.catalog ? t(item.catalog.nameKey) : item.exerciseId}</span>
              <span className="pfl-exercise-meta">
                {t("patientProfile.rehab.setsByReps", { sets: item.sets, reps: item.repsPerSet })}
              </span>
              {item.catalog && <span className="pfl-exercise-target">{t(item.catalog.targetKey)}</span>}
            </div>
          ))}
        </div>

        <PatientButton to={ROUTES.PATIENT_EXERCISES} variant="primary" size="sm">
          {t("patientProfile.rehab.openSession")}
        </PatientButton>
      </section>

      {insight && (
        <KneeGuideInsightCard
          title={t("patientProfile.insight.title")}
          message={t(insight.messageKey, resolveInsightValues(t, insight.values))}
          tone={insight.tone}
        />
      )}
    </div>
  );
};

// `exerciseNameKey` (getRehabInsight, profile/patientProfileInsights.js) is
// itself a translation key, not a display string — same "caller resolves
// the nested key before interpolating" convention
// KneeGuideCareInsight.jsx already uses for `followUpKey`.
const resolveInsightValues = (t, values) => (values.exerciseNameKey ? { ...values, exerciseName: t(values.exerciseNameKey) } : values);

export default ProfileRehabTab;
