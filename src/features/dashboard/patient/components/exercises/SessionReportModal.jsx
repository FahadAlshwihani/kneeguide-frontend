import React from "react";
import { useTranslation } from "react-i18next";
import { formatDurationWords } from "../../session/patientSessionEngine";
import PatientDialog, { PatientDialogCloseButton } from "../PatientDialog";
import "./SessionReportModal.css";

/**
 * The full session report — frontend/mock in this iteration (Section 20),
 * summarizing ONLY data actually collected during the session (or, for a
 * past day, the same deterministic mock summary already shown in
 * SessionHero's read-only card — never fabricated fields). Built on the
 * shared PatientDialog primitive (overlay/focus/Escape/scroll-lock — see
 * that file) rather than its own bespoke modal implementation, and
 * rendered here instead of a new route or a change to the existing
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

  if (!report) return null;

  return (
    <PatientDialog isOpen={isOpen} onClose={onClose} ariaLabelledBy="session-report-title" panelClassName="session-report-panel">
      <div className="session-report-header">
        <div>
          <p className="session-report-eyebrow">{t("patientExercises.session.reportReady")}</p>
          <h2 id="session-report-title" className="session-report-title">
            {t("patientExercises.session.reportTitle")}
          </h2>
          <p className="session-report-date">{report.dateLabel}</p>
        </div>
        <PatientDialogCloseButton onClose={onClose} label={t("patientExercises.session.close")} />
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

      {report.insight && <p className="session-report-insight">{t(report.insight.messageKey, report.insight.values)}</p>}

      <p className="session-report-future-note">{t("patientExercises.session.reportFutureNote")}</p>
    </PatientDialog>
  );
};

export default SessionReportModal;
