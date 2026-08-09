import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "motion/react";
import {
  FaListCheck,
  FaUsers,
  FaHeartPulse,
  FaClipboardCheck,
  FaCalendarCheck,
  FaDroplet,
  FaArrowTrendUp,
  FaArrowUpRightFromSquare,
} from "react-icons/fa6";
import { ROUTES } from "../../../../utils/routes";
import { useSectionReveal } from "../../components/useSectionReveal";
import "./HeroKpiGrid.css";

// Deterministic demo sequences — never Math.random(), never regenerated
// per render. Matches the values already approved for this preview.
const SEQUENCES = {
  exercises: [3, 4, 3, 5, 3],
  patients: [42, 43, 42, 44],
  progress: [78, 79, 80, 79],
  completion: [84, 85, 86, 84],
  adherence: [76, 78, 77, 79],
};

// Two realistic demo states the appointment card cycles between — day/
// time pairs only, translated month/labels come from i18n.
const APPOINTMENT_STATES = [
  { day: "23", time: "3:30 PM" },
  { day: "26", time: "10:00 AM" },
];

// [period, phase] in shared ticks — deliberately staggered so cards
// (almost) never change in the same tick, satisfying "different timing
// offsets, not everything simultaneously" from one single interval rather
// than six independent timers.
const TIMING = {
  exercises: { period: 3, phase: 0 },
  patients: { period: 4, phase: 1 },
  progress: { period: 5, phase: 2 },
  completion: { period: 4, phase: 3 },
  adherence: { period: 5, phase: 4 },
  appointment: { period: 9, phase: 6 },
};

const TICK_MS = 2500;

const stepIndex = (tick, key, length) => {
  const { period, phase } = TIMING[key];
  return Math.floor((tick + phase) / period) % length;
};

// One shared lifecycle for all six cards: a single pooled IntersectionObserver
// (via useSectionReveal, the same primitive every other reveal on this site
// already shares), one page-visibility listener, one interval, one tick
// counter. No card owns its own observer or timer. Reduced motion and an
// offscreen/hidden Hero both simply stop the interval — the demo values
// freeze at whatever they last were rather than resetting, and resume
// advancing (not restarting) once relevant again.
const useKpiTicker = () => {
  const { ref, isVisible } = useSectionReveal();
  const prefersReducedMotion = useReducedMotion();
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const active = isVisible && pageVisible && !prefersReducedMotion;

  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, [active]);

  return { ref, tick, isVisible };
};

// Fixed, decorative shape — never recomputed from real data. Re-keyed by
// the card's current value so it briefly re-enters (CSS animation on
// mount, see HeroKpiGrid.css) exactly when that value changes, instead of
// running its own independent, continuous loop.
const HeroSparkline = ({ animKey }) => (
  <svg
    className="hero-kpi-sparkline"
    key={animKey}
    viewBox="0 0 64 24"
    aria-hidden="true"
    focusable="false"
  >
    <polyline
      points="0,17 9,13 18,15 27,8 36,11 45,4 54,7 64,3"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HeroMetricCard = ({ accent, icon: Icon, label, value, visual, progress, trend }) => (
  <div className={`hero-kpi-card hero-kpi-card-${accent}`}>
    <span className="hero-kpi-icon" aria-hidden="true">
      <Icon />
    </span>
    <p className="hero-kpi-label">{label}</p>
    <div className="hero-kpi-value-row">
      <span className="hero-kpi-value" key={value}>
        {value}
      </span>
      {visual === "sparkline" && <HeroSparkline animKey={value} />}
    </div>
    {visual === "progress" && (
      <div className="hero-kpi-progress-track">
        <div className="hero-kpi-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    )}
    <span className="hero-kpi-trend">
      <FaArrowTrendUp aria-hidden="true" />
      {trend}
    </span>
  </div>
);

const HeroAppointmentCard = ({ label, month, day, time, sessionType, patientTag, viewDetailsLabel }) => (
  <div className="hero-kpi-card hero-kpi-card-appointment hero-kpi-card-blue">
    <span className="hero-kpi-icon" aria-hidden="true">
      <FaCalendarCheck />
    </span>
    <p className="hero-kpi-label">{label}</p>
    <div className="hero-kpi-appointment-body">
      <div className="hero-kpi-appointment-date" key={day}>
        <span className="hero-kpi-appointment-day">{day}</span>
        <span className="hero-kpi-appointment-month">{month}</span>
      </div>
      <div className="hero-kpi-appointment-info">
        <span className="hero-kpi-appointment-time" key={time}>
          {time}
        </span>
        <span className="hero-kpi-appointment-type">{sessionType}</span>
      </div>
      <span className="hero-kpi-appointment-tag">{patientTag}</span>
    </div>
    <Link to={ROUTES.REGISTER} className="hero-kpi-appointment-action">
      {viewDetailsLabel}
      <FaArrowUpRightFromSquare aria-hidden="true" />
    </Link>
  </div>
);

/**
 * The Hero's product-preview KPI area — six compact cards replacing the
 * previous ~25-widget scattered/floating composition (corners, rails,
 * bottom band, mobile carousel — see git history). One responsive CSS
 * grid, one data-driven render pass, one shared demo-data lifecycle
 * (useKpiTicker above). Reduced motion freezes every card at its first
 * value — still fully readable as static content, nothing hidden.
 */
const HeroKpiGrid = () => {
  const { t } = useTranslation();
  const { ref, tick, isVisible } = useKpiTicker();

  const exercisesValue = SEQUENCES.exercises[stepIndex(tick, "exercises", SEQUENCES.exercises.length)];
  const patientsValue = SEQUENCES.patients[stepIndex(tick, "patients", SEQUENCES.patients.length)];
  const progressValue = SEQUENCES.progress[stepIndex(tick, "progress", SEQUENCES.progress.length)];
  const completionValue = SEQUENCES.completion[stepIndex(tick, "completion", SEQUENCES.completion.length)];
  const adherenceValue = SEQUENCES.adherence[stepIndex(tick, "adherence", SEQUENCES.adherence.length)];
  const appointmentState =
    APPOINTMENT_STATES[stepIndex(tick, "appointment", APPOINTMENT_STATES.length)];

  return (
    <div
      ref={ref}
      className={`hero-kpi-grid${isVisible ? " hero-kpi-grid-visible" : ""}`}
      aria-label={t("publicHero.kpi.ariaLabel")}
    >
      <div className="hero-kpi-card-slot hero-kpi-slot-1">
        <HeroMetricCard
          accent="info"
          icon={FaListCheck}
          label={t("publicHero.kpi.exercisesAssigned.label")}
          value={exercisesValue}
          visual="sparkline"
          trend={t("publicHero.kpi.exercisesAssigned.trend")}
        />
      </div>
      <div className="hero-kpi-card-slot hero-kpi-slot-2">
        <HeroMetricCard
          accent="success"
          icon={FaUsers}
          label={t("publicHero.kpi.activePatients.label")}
          value={patientsValue}
          visual="sparkline"
          trend={t("publicHero.kpi.activePatients.trend")}
        />
      </div>
      <div className="hero-kpi-card-slot hero-kpi-slot-3">
        <HeroMetricCard
          accent="info"
          icon={FaHeartPulse}
          label={t("publicHero.kpi.rehabProgress.label")}
          value={`${progressValue}%`}
          visual="progress"
          progress={progressValue}
          trend={t("publicHero.kpi.rehabProgress.trend")}
        />
      </div>
      <div className="hero-kpi-card-slot hero-kpi-slot-4">
        <HeroMetricCard
          accent="success"
          icon={FaClipboardCheck}
          label={t("publicHero.kpi.sessionCompletion.label")}
          value={`${completionValue}%`}
          visual="progress"
          progress={completionValue}
          trend={t("publicHero.kpi.sessionCompletion.trend")}
        />
      </div>
      <div className="hero-kpi-card-slot hero-kpi-slot-5">
        <HeroAppointmentCard
          label={t("publicHero.kpi.appointment.label")}
          month={t("publicHero.kpi.appointment.month")}
          day={appointmentState.day}
          time={appointmentState.time}
          sessionType={t("publicHero.kpi.appointment.sessionType")}
          patientTag={t("publicHero.kpi.appointment.patientTag")}
          viewDetailsLabel={t("publicHero.kpi.appointment.viewDetails")}
        />
      </div>
      <div className="hero-kpi-card-slot hero-kpi-slot-6">
        <HeroMetricCard
          accent="info"
          icon={FaDroplet}
          label={t("publicHero.kpi.weeklyAdherence.label")}
          value={`${adherenceValue}%`}
          visual="progress"
          progress={adherenceValue}
          trend={t("publicHero.kpi.weeklyAdherence.trend")}
        />
      </div>
    </div>
  );
};

export default HeroKpiGrid;
