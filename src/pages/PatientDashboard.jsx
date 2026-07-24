// src/pages/PatientDashboard.jsx
import React, { useState } from "react";
import "../styles/PatientDashboard.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import PainWheel from "../components/patient/PainWheel";
import PatientBottomNav from "../components/layout/PatientBottomNav";
import { useTranslation } from "react-i18next";

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // =======================
  // MOCK DATA
  // =======================
  const nextAppointment = {
    date: "2025-11-25",
    time: "03:30 PM",
    doctor: "Dr. Sarah Ahmed",
    type: t("patientDashboard.mock.nextAppointment.type"),
    location: t("patientDashboard.mock.nextAppointment.location"),
  };

  const lastReport = {
    date: "2025-11-17",
    painLevel: "3 / 10",
    status: t("patientDashboard.mock.lastReport.status"),
    notes: t("patientDashboard.mock.lastReport.notes"),
  };

  const todayExercises = [
    { name: "Quad Sets", reps: "3 x 12", status: "Completed" },
    { name: "Straight Leg Raises", reps: "3 x 10", status: "In progress" },
    { name: "Heel Slides", reps: "3 x 15", status: "Pending" },
  ];

  const recentReports = [
    { date: "2025-11-17", status: "Reviewed", score: "Stable" },
    { date: "2025-11-10", status: "Reviewed", score: "Improving" },
    { date: "2025-11-03", status: "Reviewed", score: "Improving" },
  ];

  const adherence = {
    streakDays: 5,
    completionPercentage: 76,
    missedThisWeek: 1,
  };

  // Pain wheel state
  const [painToday, setPainToday] = useState(4);
  const [painNote, setPainNote] = useState("");

  const displayName =
    user?.first_name || user?.last_name
      ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
      : t("patientDashboard.header.fallbackName");

  const daysUntilAppointment = Math.max(
    0,
    Math.round(
      (new Date(nextAppointment.date) - new Date()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const painEmoji =
    painToday <= 2 ? "🙂" : painToday <= 5 ? "😐" : painToday <= 8 ? "😣" : "😭";

  const getExerciseStatusLabel = (status) => {
    switch (status) {
      case "Completed":
        return t("patientDashboard.exercises.status.completed");
      case "In progress":
        return t("patientDashboard.exercises.status.inProgress");
      case "Pending":
        return t("patientDashboard.exercises.status.pending");
      default:
        return status;
    }
  };

  const getReportStatusLabel = (status) => {
    switch (status) {
      case "Reviewed":
        return t("patientDashboard.recentReports.statusReviewed");
      default:
        return status;
    }
  };

  const getReportScoreLabel = (score) => {
    switch (score) {
      case "Stable":
        return t("patientDashboard.recentReports.scoreStable");
      case "Improving":
        return t("patientDashboard.recentReports.scoreImproving");
      default:
        return score;
    }
  };

  return (
    <div className="pd-page">
      <div className="pd-inner">
        {/* ==========================
            HEADER
        =========================== */}
        <header className="pd-header">
          <div className="pd-header-main">
            <h1 className="pd-title">
              {t("patientDashboard.header.greeting", { name: displayName })}{" "}
              <span className="pd-emoji">👋</span>
            </h1>
            <p className="pd-subtitle">
              {t("patientDashboard.header.subtitle")}
            </p>
          </div>

          <div className="pd-header-side">
            <span className="pd-role-pill">
              {t("patientDashboard.header.role")}
            </span>
            <span className="pd-date-pill">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <button className="pd-logout-btn" onClick={logout}>
              {t("patientDashboard.header.logout")}
            </button>
          </div>
        </header>

        {/* ==========================
            TOP GRID (3 CARDS)
        =========================== */}
        <section className="pd-grid pd-grid-3">
          <div className="pd-card pd-card-highlight">
            <div className="pd-card-label">
              {t("patientDashboard.topCards.nextAppointment.label")}
            </div>
            <div className="pd-card-main">
              <div className="pd-card-main-value">{nextAppointment.date}</div>
              <div className="pd-card-main-sub">
                {nextAppointment.time} · {nextAppointment.type}
              </div>
            </div>
            <div className="pd-card-footer">
              {t("patientDashboard.common.withDoctorPrefix")}{" "}
              <span className="pd-accent-text">
                {nextAppointment.doctor}
              </span>
            </div>
          </div>

          <div className="pd-card">
            <div className="pd-card-label">
              {t("patientDashboard.topCards.lastReportStatus.label")}
            </div>
            <div className="pd-card-main">
              <span className="pd-status-dot pd-status-success" />
              <span className="pd-card-main-value">
                {getReportStatusLabel(lastReport.status)}
              </span>
            </div>
            <div className="pd-card-footer">
              {t("patientDashboard.topCards.lastReportStatus.submittedOn")}{" "}
              <span className="pd-muted-text">{lastReport.date}</span>
            </div>
          </div>

          <div className="pd-card">
            <div className="pd-card-label">
              {t("patientDashboard.topCards.currentPain.label")}
            </div>
            <div className="pd-card-main">
              <span className="pd-card-main-value">
                {lastReport.painLevel}
              </span>
            </div>
            <div className="pd-card-footer">
              {t("patientDashboard.topCards.currentPain.footer")}
            </div>
          </div>
        </section>

        {/* ==========================
            PAIN WHEEL + TODAY SUMMARY
        =========================== */}
        <section className="pd-grid pd-grid-2 pd-block">
          {/* Pain Wheel */}
          <div className="pd-card pd-card-lg">
            <div className="pd-section-header">
              <h2>{t("patientDashboard.painSection.title")}</h2>
              <span className="pd-chip">
                {painEmoji} · {painToday}/10
              </span>
            </div>

            <PainWheel value={painToday} onChange={setPainToday} />

            <div className="pd-mini-metrics">
              <div className="pd-mini-metric">
                <span className="pd-mini-label">
                  {t("patientDashboard.painSection.lastReportPainLabel")}
                </span>
                <span className="pd-mini-value">
                  {lastReport.painLevel}
                </span>
              </div>
              <div className="pd-mini-metric">
                <span className="pd-mini-label">
                  {t("patientDashboard.painSection.trendLabel")}
                </span>
                <span className="pd-mini-value">
                  {t(
                    painToday <= parseInt(lastReport.painLevel)
                      ? "patientDashboard.painSection.trendImproving"
                      : "patientDashboard.painSection.trendHigher"
                  )}
                </span>
              </div>
            </div>

            {/* ملاحظة الألم اليومية */}
            <div className="pd-pain-note">
              <label className="pd-pain-note-label">
                {t("patientDashboard.painSection.noteLabel")}
              </label>
              <textarea
                className="pd-pain-note-input"
                placeholder={t(
                  "patientDashboard.painSection.notePlaceholder"
                )}
                value={painNote}
                onChange={(e) => setPainNote(e.target.value)}
              />
              <p className="pd-pain-note-hint">
                {t("patientDashboard.painSection.noteHint")}
              </p>
            </div>
          </div>

          {/* Today summary */}
          <div className="pd-card pd-card-lg">
            <div className="pd-section-header">
              <h2>{t("patientDashboard.todaySummary.title")}</h2>
            </div>

            <div className="pd-summary-list">
              <div className="pd-summary-row">
                <div>
                  <div className="pd-summary-label">
                    {t("patientDashboard.todaySummary.exercisesLabel")}
                  </div>
                  <div className="pd-summary-sub">
                    {t("patientDashboard.todaySummary.exercisesSub")}
                  </div>
                </div>
                <div className="pd-summary-value">
                  {todayExercises.length}
                </div>
              </div>

              <div className="pd-summary-row">
                <div>
                  <div className="pd-summary-label">
                    {t("patientDashboard.todaySummary.nextAppointmentLabel")}
                  </div>
                  <div className="pd-summary-sub">
                    {t(
                      "patientDashboard.todaySummary.nextAppointmentSub",
                      { days: daysUntilAppointment }
                    )}
                  </div>
                </div>
                <div className="pd-summary-value">
                  {nextAppointment.time}
                </div>
              </div>

              <div className="pd-summary-row">
                <div>
                  <div className="pd-summary-label">
                    {t("patientDashboard.todaySummary.adherenceLabel")}
                  </div>
                  <div className="pd-summary-sub">
                    {t("patientDashboard.todaySummary.adherenceSub")}
                  </div>
                </div>
                <div className="pd-summary-value">
                  {adherence.completionPercentage}%
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================
            LAST REPORT + NEXT APPOINTMENT
        =========================== */}
        <section className="pd-grid pd-grid-2 pd-middle">
          <div className="pd-card pd-card-lg">
            <div className="pd-section-header">
              <h2>{t("patientDashboard.lastReport.title")}</h2>
              <span className="pd-tag">
                {t("patientDashboard.lastReport.tagPrefix")}
                {new Date(lastReport.date)
                  .getTime()
                  .toString()
                  .slice(-4)}
              </span>
            </div>

            <div className="pd-report-meta">
              <div>
                <span className="pd-meta-label">
                  {t("patientDashboard.lastReport.dateLabel")}
                </span>
                <span className="pd-meta-value">{lastReport.date}</span>
              </div>

              <div>
                <span className="pd-meta-label">
                  {t("patientDashboard.lastReport.painLabel")}
                </span>
                <span className="pd-meta-value">
                  {lastReport.painLevel}
                </span>
              </div>

              <div>
                <span className="pd-meta-label">
                  {t("patientDashboard.lastReport.statusLabel")}
                </span>
                <span className="pd-status-chip pd-status-chip-success">
                  {getReportStatusLabel(lastReport.status)}
                </span>
              </div>
            </div>

            <p className="pd-report-notes">{lastReport.notes}</p>

            <button
              className="pd-ghost-button"
              onClick={() => navigate("/patient/reports")}
            >
              {t("patientDashboard.lastReport.viewButton")}
            </button>
          </div>

          <div className="pd-card pd-card-lg">
            <div className="pd-section-header">
              <h2>{t("patientDashboard.appointment.title")}</h2>
            </div>

            <div className="pd-appointment-main">
              <div className="pd-appointment-date">
                <span className="pd-appointment-day">
                  {new Date(nextAppointment.date).toLocaleDateString(
                    "en-US",
                    {
                      day: "2-digit",
                    }
                  )}
                </span>
                <span className="pd-appointment-month">
                  {new Date(nextAppointment.date).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                    }
                  )}
                </span>
              </div>

              <div className="pd-appointment-info">
                <div className="pd-appointment-time">
                  {nextAppointment.time}
                </div>
                <div className="pd-appointment-type">
                  {nextAppointment.type}
                </div>
                <div className="pd-appointment-doctor">
                  {t("patientDashboard.common.withDoctorPrefix")}{" "}
                  {nextAppointment.doctor}
                </div>
                <div className="pd-appointment-location">
                  {nextAppointment.location}
                </div>
              </div>
            </div>

            <div className="pd-appointment-actions">
              <button className="pd-primary-button-outline">
                {t("patientDashboard.appointment.reschedule")}
              </button>
              <button className="pd-ghost-button">
                {t("patientDashboard.appointment.viewAll")}
              </button>
            </div>
          </div>
        </section>

        {/* ==========================
            EXERCISES + RECENT REPORTS
        =========================== */}
        <section className="pd-bottom-grid">
          {/* Today's Exercises */}
          <div className="pd-card pd-card-lg">
            <div className="pd-section-header">
              <h2>{t("patientDashboard.exercises.title")}</h2>
              <span className="pd-muted-text">
                {t("patientDashboard.exercises.assignedCount", {
                  count: todayExercises.length,
                })}
              </span>
            </div>

            <div className="pd-exercise-list">
              {todayExercises.map((ex, idx) => (
                <div className="pd-exercise-item" key={idx}>
                  <div className="pd-exercise-main">
                    <div className="pd-exercise-name">{ex.name}</div>
                    <div className="pd-exercise-reps">{ex.reps}</div>
                  </div>

                  <div
                    className={`pd-exercise-status pd-ex-status-${ex.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {getExerciseStatusLabel(ex.status)}
                  </div>
                </div>
              ))}
            </div>

            <button className="pd-ghost-button">
              {t("patientDashboard.exercises.openProgram")}
            </button>
          </div>

          {/* Recent Reports */}
          <div className="pd-card pd-card-lg">
            <div className="pd-section-header">
              <h2>{t("patientDashboard.recentReports.title")}</h2>
            </div>

            <div className="pd-table">
              <div className="pd-table-header">
                <span>
                  {t("patientDashboard.recentReports.table.date")}
                </span>
                <span>
                  {t("patientDashboard.recentReports.table.status")}
                </span>
                <span>
                  {t("patientDashboard.recentReports.table.summary")}
                </span>
              </div>

              {recentReports.map((rep, idx) => (
                <div className="pd-table-row" key={idx}>
                  <span>{rep.date}</span>
                  <span>
                    <span className="pd-status-chip pd-status-chip-success">
                      {getReportStatusLabel(rep.status)}
                    </span>
                  </span>
                  <span className="pd-muted-text">
                    {getReportScoreLabel(rep.score)}
                  </span>
                </div>
              ))}
            </div>

            <button
              className="pd-ghost-button"
              onClick={() => navigate("/patient/reports")}
            >
              {t("patientDashboard.recentReports.viewAll")}
            </button>
          </div>
        </section>

        {/* ==========================
            ADHERENCE / STREAK CARD
        =========================== */}
        <section className="pd-card pd-card-lg pd-block">
          <div className="pd-section-header">
            <h2>{t("patientDashboard.adherence.title")}</h2>
          </div>

          <div className="pd-summary-list">
            <div className="pd-summary-row">
              <div>
                <div className="pd-summary-label">
                  {t("patientDashboard.adherence.currentStreakLabel")}
                </div>
                <div className="pd-summary-sub">
                  {t("patientDashboard.adherence.currentStreakSub")}
                </div>
              </div>
              <div className="pd-summary-value">
                {t("patientDashboard.adherence.currentStreakValue", {
                  days: adherence.streakDays,
                })}
              </div>
            </div>

            <div className="pd-summary-row">
              <div>
                <div className="pd-summary-label">
                  {t("patientDashboard.adherence.weeklyRateLabel")}
                </div>
                <div className="pd-summary-sub">
                  {t("patientDashboard.adherence.weeklyRateSub")}
                </div>
              </div>
              <div className="pd-summary-value">
                {adherence.completionPercentage}%
              </div>
            </div>

            <div className="pd-summary-row">
              <div>
                <div className="pd-summary-label">
                  {t("patientDashboard.adherence.missedLabel")}
                </div>
                <div className="pd-summary-sub">
                  {t("patientDashboard.adherence.missedSub")}
                </div>
              </div>
              <div className="pd-summary-value">
                {adherence.missedThisWeek}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* BOTTOM NAV */}
      <PatientBottomNav active="home" />
    </div>
  );
};

export default PatientDashboard;
