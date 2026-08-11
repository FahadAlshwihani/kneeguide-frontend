// src/pages/PatientDashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCalendarClock, LuDumbbell, LuHeartPulse } from "react-icons/lu";
import "../styles/PatientDashboard.css";
import PainWheel from "../components/PainWheel";
import PatientHomeAssistant from "../components/PatientHomeAssistant";

/**
 * Patient Home — rebuilt around the KneeGuide Assistant experience
 * (PatientHomeAssistant.jsx) instead of a dense grid of always-visible
 * cards. See the task's own audit requirement: every field below is the
 * exact same mock data the previous dashboard already used (unchanged
 * shape/values) — this redesign only changes WHERE and HOW it's
 * presented, not what's real vs. mock. Genuinely real: `user` (from
 * AuthContext, via PatientHomeAssistant) and the exercises/reports routes
 * this page links out to. Still mock, exactly as before: appointment,
 * report, and adherence figures — there is no backend for any of them
 * yet, so there is no real "loading"/"API error" state to show here
 * either; the assistant's own response templates are still written
 * defensively for when that data is genuinely absent (see
 * assistant/patientAssistantActions.js).
 */
const PatientDashboard = () => {
  const { t } = useTranslation();

  // =======================
  // MOCK DATA — unchanged from the previous dashboard
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
    painLevel: "3/10",
    statusLabel: t("patientDashboard.mock.lastReport.statusLabel"),
  };

  const todayExercises = [
    { name: "Quad Sets", reps: "3 x 12", status: "Completed" },
    { name: "Straight Leg Raises", reps: "3 x 10", status: "In progress" },
    { name: "Heel Slides", reps: "3 x 15", status: "Pending" },
  ];

  const adherence = {
    streakDays: 5,
    completionPercentage: 76,
    missedThisWeek: 1,
  };

  const assistantData = { nextAppointment, lastReport, adherence };

  // Pain wheel — kept as a real, local-only interaction (no backend
  // persistence existed before this redesign either); collapsed by
  // default and revealed on request instead of always taking up a third
  // of the page, per the task's own "reduce clutter, don't recreate the
  // old dashboard underneath the assistant" direction.
  const [painToday, setPainToday] = useState(4);
  const [painRevealed, setPainRevealed] = useState(false);
  const painSectionRef = useRef(null);

  useEffect(() => {
    if (!painRevealed) return;
    const heading = painSectionRef.current;
    if (!heading) return;
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [painRevealed]);

  const handleReveal = (section) => {
    if (section === "pain") setPainRevealed(true);
  };

  const completedCount = todayExercises.filter((ex) => ex.status === "Completed").length;

  return (
    <div className="pd-page">
      <div className="pd-inner">
        <PatientHomeAssistant data={assistantData} onReveal={handleReveal} />

        {/* ==========================
            COMPACT GLANCEABLE CONTEXT
            Only the three items patients check most day-to-day — the
            full appointment/report/exercise detail already lives on its
            own dedicated route (or, for appointments, doesn't exist as a
            route at all yet — see the assistant registry's own note).
        =========================== */}
        <section className="pd-context" aria-label={t("patientDashboard.context.regionLabel")}>
          <div className="pd-context-item">
            <LuCalendarClock className="pd-context-icon" aria-hidden="true" />
            <div>
              <p className="pd-context-label">{t("patientDashboard.context.nextAppointment")}</p>
              <p className="pd-context-value">
                {nextAppointment.date} · {nextAppointment.time}
              </p>
            </div>
          </div>

          <div className="pd-context-item">
            <LuDumbbell className="pd-context-icon" aria-hidden="true" />
            <div>
              <p className="pd-context-label">{t("patientDashboard.context.todayExercises")}</p>
              <p className="pd-context-value">
                {todayExercises.length > 0
                  ? t("patientDashboard.context.exercisesProgress", {
                      done: completedCount,
                      total: todayExercises.length,
                    })
                  : t("patientDashboard.context.noExercises")}
              </p>
            </div>
          </div>

          <div className="pd-context-item">
            <LuHeartPulse className="pd-context-icon" aria-hidden="true" />
            <div>
              <p className="pd-context-label">{t("patientDashboard.context.latestPain")}</p>
              <p className="pd-context-value">{lastReport.painLevel}</p>
            </div>
          </div>
        </section>

        {/* ==========================
            PAIN LOGGING — revealed on request (see handleReveal above)
        =========================== */}
        {painRevealed && (
          <section className="pd-pain-section">
            <h2 ref={painSectionRef} className="pd-pain-heading">
              {t("patientDashboard.pain.title")}
            </h2>
            <PainWheel value={painToday} onChange={setPainToday} />
          </section>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
