import React from "react";
import { useTranslation } from "react-i18next";
import PatientDialog, { PatientDialogCloseButton } from "../PatientDialog";
import KneeGuideInsightCard from "../exercises/KneeGuideInsightCard";
import DoctorFeedback from "./DoctorFeedback";
import { getReportComparisonInsight } from "../../reports/patientReportInsights";
import { getPainValue, getFlexionValue } from "../../reports/patientReportMetrics";
import { formatDurationWords } from "../../session/patientSessionEngine";
import "./RecoveryReportModal.css";

const SESSION_STATUS_TONE = { completed: "positive", incomplete: "neutral" };
const REVIEW_STATUS_TONE = { reviewed: "positive", awaiting_review: "neutral", not_shared: "neutral" };

/**
 * The full individual Recovery Report — built on the shared
 * PatientDialog primitive (same overlay/focus/Escape/scroll-lock
 * mechanics as SessionReportModal/ExerciseDetailsModal, never a fourth
 * bespoke modal implementation). Distinguishes SUMMARY vs DETAILED
 * reports (Section 12): legacy fixtures only ever show the fields they
 * actually have; the exercise breakdown and movement-quality fields only
 * render when `report.isDetailed` and the data is actually present —
 * never fabricated for older summary-only sessions.
 *
 * The KneeGuide Insight here is the REPORT-LEVEL "Session Insight"
 * (Section 18/19) — current report vs the immediately previous
 * chronological one — a different granularity from both the page-level
 * Recovery Insight and the Exercise Session's own between-exercise
 * insight. `previousReport` is `null`-safe: no previous report means no
 * comparison is rendered, never a fabricated one.
 */
const RecoveryReportModal = ({ isOpen, onClose, report, previousReport }) => {
  const { t, i18n } = useTranslation();

  if (!report) return null;

  const pain = getPainValue(report);
  const flexion = getFlexionValue(report);
  const comparisonInsight = getReportComparisonInsight(report, previousReport);

  return (
    <PatientDialog
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="recovery-report-title"
      panelClassName="recovery-report-panel"
    >
      <div className="recovery-report-header">
        <div>
          <p className="recovery-report-eyebrow">{t("patientReports.reportModal.eyebrow")}</p>
          <h2 id="recovery-report-title" className="recovery-report-title">
            {report.date.toLocaleDateString(i18n.language, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </h2>
          <div className="recovery-report-pills">
            <span className={`recovery-report-pill recovery-report-pill--${SESSION_STATUS_TONE[report.sessionStatus] || "neutral"}`}>
              {t(`patientReports.status.session.${report.sessionStatus}`)}
            </span>
            {report.clinicalReview && (
              <span
                className={`recovery-report-pill recovery-report-pill--${REVIEW_STATUS_TONE[report.clinicalReview.status] || "neutral"}`}
              >
                {t(`patientReports.status.review.${report.clinicalReview.status}`)}
              </span>
            )}
          </div>
        </div>
        <PatientDialogCloseButton onClose={onClose} label={t("patientReports.reportModal.close")} />
      </div>

      <dl className="recovery-report-summary">
        {typeof report.duration === "number" && (
          <div>
            <dt>{t("patientReports.reportModal.duration")}</dt>
            <dd dir="ltr">{formatDurationWords(report.duration)}</dd>
          </div>
        )}
        {pain !== null && (
          <div>
            <dt>{t("patientReports.table.headers.pain")}</dt>
            <dd dir="ltr">
              {typeof report.pain?.before === "number" ? `${report.pain.before} → ${pain}` : `${pain}/10`}
            </dd>
          </div>
        )}
        {flexion !== null && (
          <div>
            <dt>{t("patientReports.table.headers.flexion")}</dt>
            <dd dir="ltr">{flexion}°</dd>
          </div>
        )}
        {typeof report.rom?.extension === "number" && (
          <div>
            <dt>{t("patientReports.table.headers.extension")}</dt>
            <dd dir="ltr">{report.rom.extension}°</dd>
          </div>
        )}
        {report.movementQuality && (
          <div>
            <dt>{t("patientExercises.session.movementQuality")}</dt>
            <dd>{t(`patientExercises.session.quality.${report.movementQuality}`)}</dd>
          </div>
        )}
      </dl>

      {comparisonInsight && (
        <div className="recovery-report-insight-slot">
          <KneeGuideInsightCard
            title={t("patientReports.reportModal.sessionInsightTitle")}
            message={t(comparisonInsight.messageKey, comparisonInsight.values)}
            tone={comparisonInsight.severity}
          />
        </div>
      )}

      {report.isDetailed && Array.isArray(report.exercises) && report.exercises.length > 0 && (
        <div className="recovery-report-exercises">
          <p className="recovery-report-section-title">{t("patientReports.reportModal.exercises")}</p>
          <ul className="recovery-report-exercise-list">
            {report.exercises.map((exercise) => (
              <li key={exercise.id} className="recovery-report-exercise-row">
                <span className="recovery-report-exercise-name" dir="auto">
                  {t(exercise.nameKey)}
                </span>
                <span className="recovery-report-exercise-meta" dir="ltr">
                  {exercise.completedSets}/{exercise.totalSets} {t("patientReports.reportModal.sets")}
                  {typeof exercise.rom === "number" ? ` · ${t("patientReports.table.headers.flexion")} ${exercise.rom}°` : ""}
                  {exercise.qualityKey ? ` · ${t(`patientExercises.session.quality.${exercise.qualityKey}`)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <DoctorFeedback clinicalReview={report.clinicalReview} />
    </PatientDialog>
  );
};

export default RecoveryReportModal;
