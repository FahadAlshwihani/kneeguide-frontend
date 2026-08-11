import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { LuX } from "react-icons/lu";
import { formatDurationWords } from "../../session/patientSessionEngine";
import "./SessionReportModal.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The full session report — frontend/mock in this iteration (Section 20),
 * summarizing ONLY data actually collected during the session (or, for a
 * past day, the same deterministic mock summary already shown in
 * SessionHero's read-only card — never fabricated fields). Rendered as a
 * lightweight modal rather than a new route or a change to the existing
 * (differently-shaped, patient/mock-clinical-report) Reports.jsx page —
 * see the final report for why that page wasn't reused here.
 *
 * `report.exerciseBreakdown` is present for TODAY's just-completed
 * session (real per-exercise/per-set data collected this run) and absent
 * for a past day (only a day-level mock summary exists for those).
 *
 * Explicitly honest about delivery (Section 21): this NEVER claims the
 * report was sent/shared with a clinician — there is no backend for that
 * in this iteration.
 */
const SessionReportModal = ({ isOpen, onClose, report }) => {
  const { t } = useTranslation();
  const reducedMotion = prefersReducedMotion();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const panel = panelRef.current;
    panel?.querySelector("button")?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!report) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="session-report-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.18 }}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("patientExercises.session.reportTitle")}
            className="session-report-panel"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.25 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="session-report-header">
              <div>
                <p className="session-report-eyebrow">{t("patientExercises.session.reportReady")}</p>
                <h2 className="session-report-title">{t("patientExercises.session.reportTitle")}</h2>
                <p className="session-report-date">{report.dateLabel}</p>
              </div>
              <button
                type="button"
                className="session-report-close"
                onClick={onClose}
                aria-label={t("patientExercises.session.close")}
              >
                <LuX aria-hidden="true" />
              </button>
            </div>

            <dl className="session-report-summary">
              <div>
                <dt>{t("patientExercises.session.reportDuration")}</dt>
                <dd dir="ltr">{formatDurationWords(report.durationMs)}</dd>
              </div>
              <div>
                <dt>{t("patientExercises.session.exercisesSummary")}</dt>
                <dd dir="ltr">
                  {report.exerciseCount}/{report.exerciseCount}
                </dd>
              </div>
              {typeof report.setCount === "number" && (
                <div>
                  <dt>{t("patientExercises.session.setsSummary")}</dt>
                  <dd dir="ltr">{report.setCount}</dd>
                </div>
              )}
              {typeof report.painBefore === "number" && typeof report.painAfter === "number" && (
                <div>
                  <dt>{t("patientExercises.session.painChange")}</dt>
                  <dd dir="ltr">
                    {report.painBefore}/10 → {report.painAfter}/10
                  </dd>
                </div>
              )}
              <div>
                <dt>{t("patientExercises.session.movementQuality")}</dt>
                <dd>{t(`patientExercises.session.quality.${report.qualityKey}`)}</dd>
              </div>
            </dl>

            {report.exerciseBreakdown && (
              <div className="session-report-table-wrapper">
                <table className="session-report-table">
                  <thead>
                    <tr>
                      <th>{t("patientExercises.session.reportExercise")}</th>
                      <th>{t("patientExercises.session.reportSets")}</th>
                      <th>{t("patientExercises.session.reportDuration")}</th>
                      <th>{t("patientExercises.session.range")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.exerciseBreakdown.map((row) => (
                      <tr key={row.id}>
                        <td dir="auto">{row.name}</td>
                        <td dir="ltr">
                          {row.completedSets}/{row.totalSets}
                        </td>
                        <td dir="ltr">{formatDurationWords(row.durationMs)}</td>
                        <td dir="ltr">{row.averageRom ? `${row.averageRom}°` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {report.insight && (
              <p className="session-report-insight">{t(report.insight.messageKey, report.insight.values)}</p>
            )}

            <p className="session-report-future-note">{t("patientExercises.session.reportFutureNote")}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SessionReportModal;
