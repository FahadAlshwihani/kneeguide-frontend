import React from "react";
import { useTranslation } from "react-i18next";
import "./DoctorFeedback.css";

const getInitials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

/**
 * Clinician feedback — visually deliberately NOT another AI response
 * (Section 14). A plain initials avatar and neutral surface, no Orb, no
 * blue-purple KneeGuide gradient — the patient must be able to tell at a
 * glance "this came from KneeGuide" vs "this came from my doctor".
 *
 * `clinicalReview` is the report's own field (data/patientReportsData.js)
 * — this component never invents doctor content; a `null` review renders
 * nothing (the caller decides whether that's expected), and
 * `awaiting_review` renders an honest neutral state instead of fake
 * feedback (Section 15: a freshly completed local session is never
 * pre-reviewed).
 */
const DoctorFeedback = ({ clinicalReview }) => {
  const { t, i18n } = useTranslation();

  if (!clinicalReview) return null;

  if (clinicalReview.status !== "reviewed") {
    return (
      <section className="doctor-feedback doctor-feedback--pending" aria-label={t("patientReports.doctorFeedback.title")}>
        <p className="doctor-feedback-title">{t("patientReports.doctorFeedback.title")}</p>
        <p className="doctor-feedback-pending-text">
          {t(
            clinicalReview.status === "awaiting_review"
              ? "patientReports.doctorFeedback.awaitingReview"
              : "patientReports.doctorFeedback.notShared"
          )}
        </p>
      </section>
    );
  }

  const reviewedDate = clinicalReview.reviewedAt
    ? clinicalReview.reviewedAt.toLocaleDateString(i18n.language, { month: "short", day: "numeric" })
    : null;

  return (
    <section className="doctor-feedback" aria-label={t("patientReports.doctorFeedback.title")}>
      <p className="doctor-feedback-title">{t("patientReports.doctorFeedback.title")}</p>
      <div className="doctor-feedback-body">
        <div className="doctor-feedback-avatar" aria-hidden="true">
          {getInitials(clinicalReview.doctorName)}
        </div>
        <div className="doctor-feedback-content">
          <div className="doctor-feedback-byline">
            <span className="doctor-feedback-name">{clinicalReview.doctorName}</span>
            <span className="doctor-feedback-badge">
              {t("patientReports.status.review.reviewed")}
              {reviewedDate ? ` · ${reviewedDate}` : ""}
            </span>
          </div>
          <p className="doctor-feedback-message" dir="auto">
            {t(clinicalReview.messageKey)}
          </p>
          {clinicalReview.followUpRecommended && (
            <p className="doctor-feedback-followup">{t("patientReports.doctorFeedback.followUpRecommended")}</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default DoctorFeedback;
