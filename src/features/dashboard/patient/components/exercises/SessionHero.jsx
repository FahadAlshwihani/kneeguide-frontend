import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { LuCheck } from "react-icons/lu";
import PatientButton from "../PatientButton";
import KneeGuideInsightCard from "./KneeGuideInsightCard";
import {
  SESSION_STATUS,
  getSessionProgress,
  getSessionElapsedMs,
  formatClock,
  formatDurationWords,
} from "../../session/patientSessionEngine";
import { getSessionAverageQuality, getSessionRomTrend } from "../../session/patientSessionMetrics";
import { getSessionInsight, getPostSessionRecommendations } from "../../session/patientSessionInsights";
import { REHAB_DAY_STATUS } from "../../data/patientRehabPlanData";
import "./SessionHero.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The "what am I doing / how far am I / what did I get" panel for
 * whichever rehab day is currently selected — ONE component with three
 * variants (today / completed-past-day / upcoming), not three near-
 * duplicate files, since they share the same visual language and mostly
 * differ in which numbers are known yet. See PatientExercises.jsx for how
 * the day/session state is assembled and passed in.
 */
const SessionHero = ({
  day,
  isToday,
  totals,
  plan,
  sessionState,
  now,
  completedDaySummary,
  patientName,
  onStartSession,
  onOpenReport,
  onDevReset,
}) => {
  const { t } = useTranslation();
  const reducedMotion = prefersReducedMotion();

  // ---------- Upcoming (future) day — preview only, never startable ----------
  if (day.status === REHAB_DAY_STATUS.UPCOMING) {
    return (
      <section className="session-hero session-hero--upcoming" aria-labelledby="session-hero-heading">
        <h2 id="session-hero-heading" className="session-hero-heading">
          {t("patientExercises.session.upcomingHeading")}
        </h2>
        <p className="session-hero-sub">
          {t("patientExercises.session.upcomingSub", {
            count: totals.exerciseCount,
            minutes: totals.estimatedMinutes,
          })}
        </p>
        <ul className="session-hero-preview-list">
          {plan.map((item) => (
            <li key={item.exerciseId}>{item.catalog ? t(item.catalog.nameKey) : item.exerciseId}</li>
          ))}
        </ul>
        <p className="session-hero-locked-reason" role="status">
          {t("patientExercises.session.dayLockedReason")}
        </p>
      </section>
    );
  }

  // ---------- Completed PAST day (not today) — read-only summary ----------
  if (day.status === REHAB_DAY_STATUS.COMPLETED) {
    return (
      <section className="session-hero session-hero--completed-day" aria-labelledby="session-hero-heading">
        <h2 id="session-hero-heading" className="session-hero-heading">
          {day.date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </h2>
        <p className="session-hero-status-pill">
          <LuCheck aria-hidden="true" /> {t("patientExercises.session.dayStatus.completed")}
        </p>

        <dl className="session-hero-summary-grid">
          <div>
            <dt>{t("patientExercises.session.reportDuration")}</dt>
            <dd>{formatDurationWords(completedDaySummary.durationMs)}</dd>
          </div>
          <div>
            <dt>{t("patientExercises.session.exercisesSummary")}</dt>
            <dd>
              {completedDaySummary.exerciseCount}/{completedDaySummary.exerciseCount}
            </dd>
          </div>
          <div>
            <dt>{t("patientExercises.session.painChange")}</dt>
            <dd dir="ltr">
              {completedDaySummary.painBefore} → {completedDaySummary.painAfter}
            </dd>
          </div>
          <div>
            <dt>{t("patientExercises.session.movementQuality")}</dt>
            <dd>{t(`patientExercises.session.quality.${completedDaySummary.qualityKey}`)}</dd>
          </div>
        </dl>

        <PatientButton type="button" variant="outline" size="sm" onClick={onOpenReport}>
          {t("patientExercises.session.viewReport")}
        </PatientButton>
      </section>
    );
  }

  // ---------- Today ----------
  if (!isToday) return null;

  if (sessionState.status === SESSION_STATUS.NOT_STARTED) {
    return (
      <section className="session-hero session-hero--today" aria-labelledby="session-hero-heading">
        <h2 id="session-hero-heading" className="session-hero-heading">
          {t("patientExercises.session.todaysRehab")}
        </h2>
        <p className="session-hero-session-number">{t("patientExercises.session.sessionNumber", { number: day.sessionNumber })}</p>

        <div className="session-hero-facts">
          <span>{t("patientExercises.session.exercisesCount", { count: totals.exerciseCount })}</span>
          <span>{t("patientExercises.session.setsCount", { count: totals.setCount })}</span>
          <span>{t("patientExercises.session.estimatedDuration", { minutes: totals.estimatedMinutes })}</span>
        </div>

        <p className="session-hero-progress-label">
          {t("patientExercises.session.exercisesProgress", { completed: 0, total: totals.exerciseCount })}
        </p>

        <PatientButton type="button" variant="primary" onClick={onStartSession}>
          {t("patientExercises.session.startSession")}
        </PatientButton>
      </section>
    );
  }

  if (sessionState.status === SESSION_STATUS.COMPLETED) {
    const progress = getSessionProgress(sessionState);
    const elapsedMs = getSessionElapsedMs(sessionState, now);
    const avgQuality = getSessionAverageQuality(sessionState.exercises);
    const romTrend = getSessionRomTrend(sessionState.exercises, plan);
    const painIncreased =
      typeof sessionState.painBefore === "number" &&
      typeof sessionState.painAfter === "number" &&
      sessionState.painAfter > sessionState.painBefore;
    const insight = getSessionInsight({ painBefore: sessionState.painBefore, painAfter: sessionState.painAfter });
    const recommendationKeys = getPostSessionRecommendations({ painIncreased });

    return (
      <section className="session-hero session-hero--complete" aria-labelledby="session-hero-heading">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.3 }}
        >
          <p className="session-hero-complete-badge">
            <LuCheck aria-hidden="true" /> {t("patientExercises.session.sessionCompleteTitle")}
          </p>
          <h2 id="session-hero-heading" className="session-hero-heading">
            {t("patientExercises.session.greatWork", { name: patientName })}
          </h2>

          <dl className="session-hero-summary-grid">
            <div>
              <dt>{t("patientExercises.session.todaysRehabDuration")}</dt>
              <dd dir="ltr">{formatDurationWords(elapsedMs)}</dd>
            </div>
            <div>
              <dt>{t("patientExercises.session.exercisesSummary")}</dt>
              <dd dir="ltr">
                {progress.completedExercises} / {progress.totalExercises}
              </dd>
            </div>
            <div>
              <dt>{t("patientExercises.session.setsSummary")}</dt>
              <dd dir="ltr">
                {progress.completedSets} / {progress.totalSets}
              </dd>
            </div>
            <div>
              <dt>{t("patientExercises.session.avgQuality")}</dt>
              <dd>{t(`patientExercises.session.quality.${avgQuality}`)}</dd>
            </div>
            {typeof sessionState.painBefore === "number" && typeof sessionState.painAfter === "number" && (
              <div>
                <dt>{t("patientExercises.session.painChange")}</dt>
                <dd dir="ltr">
                  {sessionState.painBefore}/10 → {sessionState.painAfter}/10
                </dd>
              </div>
            )}
            <div>
              <dt>{t("patientExercises.session.romTrend")}</dt>
              <dd dir="ltr">
                {romTrend >= 0 ? "+" : ""}
                {romTrend}°
              </dd>
            </div>
          </dl>

          <div className="session-hero-insight-slot">
            <KneeGuideInsightCard
              title={t("patientExercises.session.recoveryInsightTitle")}
              message={t(insight.messageKey, insight.values)}
              tone={insight.severity}
            />
          </div>

          <div className="session-hero-recommendations">
            <p className="session-hero-recommendations-title">{t("patientExercises.session.recommendationTitle")}</p>
            <ul>
              {recommendationKeys.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ul>
          </div>

          <div className="session-hero-complete-actions">
            <PatientButton type="button" variant="primary" onClick={onOpenReport}>
              {t("patientExercises.session.viewReport")}
            </PatientButton>
            <p className="session-hero-report-note">{t("patientExercises.session.reportFutureNote")}</p>
          </div>

          {process.env.NODE_ENV === "development" && (
            <button type="button" className="session-hero-dev-reset" onClick={onDevReset}>
              {t("patientExercises.session.devReset")}
            </button>
          )}
        </motion.div>
      </section>
    );
  }

  // ACTIVE / BETWEEN_EXERCISES / PAIN_CHECK — live progress.
  const progress = getSessionProgress(sessionState);
  const elapsedMs = getSessionElapsedMs(sessionState, now);

  return (
    <section className="session-hero session-hero--in-progress" aria-labelledby="session-hero-heading">
      <h2 id="session-hero-heading" className="session-hero-heading">
        {t("patientExercises.session.todaysRehab")}
      </h2>

      <p className="session-hero-progress-label">
        {t("patientExercises.session.exercisesProgress", {
          completed: progress.completedExercises,
          total: progress.totalExercises,
        })}
        {" · "}
        {t("patientExercises.session.setsProgress", { completed: progress.completedSets, total: progress.totalSets })}
      </p>

      <div className="session-hero-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.ratio * 100)}>
        <div
          className="session-hero-progress-bar-fill"
          style={{ width: `${Math.round(progress.ratio * 100)}%`, transition: reducedMotion ? "none" : undefined }}
        />
      </div>

      <p className="session-hero-elapsed" aria-label={t("patientExercises.session.sessionTime")}>
        {t("patientExercises.session.elapsed", { time: formatClock(elapsedMs) })}
      </p>
    </section>
  );
};

export default SessionHero;
