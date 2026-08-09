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

// Card render order — also drives the staggered icon micro-interaction
// (one card "reacts" per tick, in this order, looping) so it reuses the
// exact same shared tick as the demo data instead of a timer of its own.
const CARD_ORDER = ["exercises", "patients", "progress", "completion", "appointment", "adherence"];

// Three deterministic, hand-authored trend shapes (never randomized) —
// which one a chart shows is derived from that card's own current step
// index, so the shape changes in step with its number, never arbitrarily.
// Endpoint coordinates are listed alongside each path so the glow dot
// lands exactly on the line's own last point.
const SPARKLINE_VARIANTS = [
  { path: "M2,18 C14,16 20,10 28,11 C36,12 42,6 50,7 C54,7 56,5 58,4", endX: 58, endY: 4 },
  { path: "M2,16 C10,12 16,17 24,13 C32,9 38,11 44,6 C50,3 54,5 58,3", endX: 58, endY: 3 },
  { path: "M2,19 C12,18 20,17 28,14 C36,11 44,9 50,5 C54,3 56,4 58,2", endX: 58, endY: 2 },
];

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

// Deterministic, non-random trend line — which of the three hand-authored
// shapes renders is picked by `variantIndex` (that card's own current step
// in its demo sequence), and the whole `<svg>` is re-keyed by `animKey`
// (the card's current value) so it remounts — and its CSS draw-in
// animation (see HeroKpiGrid.css) replays — exactly when the number
// changes, never on an independent continuous loop. The endpoint dot +
// soft glow sit exactly on the line's own last point, not a separate
// guess.
const HeroSparkline = ({ variantIndex, animKey }) => {
  const { path, endX, endY } = SPARKLINE_VARIANTS[variantIndex % SPARKLINE_VARIANTS.length];
  return (
    <svg className="hero-kpi-sparkline" key={animKey} viewBox="0 0 64 24" aria-hidden="true" focusable="false">
      <path className="hero-kpi-sparkline-line" d={path} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle className="hero-kpi-sparkline-glow" cx={endX} cy={endY} r="5" />
      <circle className="hero-kpi-sparkline-dot" cx={endX} cy={endY} r="2.2" />
    </svg>
  );
};

// `isActive` briefly shows a small pulsing indicator dot on the icon —
// driven by the shared tick (see CARD_ORDER/activeCard in the main
// component below), so only one card's icon ever reacts at a time, in a
// slow round-robin, never all six together and never a separate timer.
const HeroMetricCard = ({ accent, icon: Icon, label, value, visual, variantIndex, progress, trend, isActive }) => (
  <div className={`hero-kpi-card hero-kpi-card-${accent}`}>
    <span className={`hero-kpi-icon${isActive ? " hero-kpi-icon-active" : ""}`} aria-hidden="true">
      <Icon />
      <span className="hero-kpi-icon-dot" />
    </span>
    <p className="hero-kpi-label">{label}</p>
    <div className="hero-kpi-value-row">
      <span className="hero-kpi-value" key={value}>
        {value}
      </span>
      {visual === "sparkline" && <HeroSparkline variantIndex={variantIndex} animKey={value} />}
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

const HeroAppointmentCard = ({ label, month, day, time, sessionType, patientTag, viewDetailsLabel, isActive }) => (
  <div className="hero-kpi-card hero-kpi-card-appointment hero-kpi-card-blue">
    <span className={`hero-kpi-icon${isActive ? " hero-kpi-icon-active" : ""}`} aria-hidden="true">
      <FaCalendarCheck />
      <span className="hero-kpi-icon-dot" />
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

  const exercisesStep = stepIndex(tick, "exercises", SEQUENCES.exercises.length);
  const patientsStep = stepIndex(tick, "patients", SEQUENCES.patients.length);
  const exercisesValue = SEQUENCES.exercises[exercisesStep];
  const patientsValue = SEQUENCES.patients[patientsStep];
  const progressValue = SEQUENCES.progress[stepIndex(tick, "progress", SEQUENCES.progress.length)];
  const completionValue = SEQUENCES.completion[stepIndex(tick, "completion", SEQUENCES.completion.length)];
  const adherenceValue = SEQUENCES.adherence[stepIndex(tick, "adherence", SEQUENCES.adherence.length)];
  const appointmentState =
    APPOINTMENT_STATES[stepIndex(tick, "appointment", APPOINTMENT_STATES.length)];

  // Exactly one card "reacts" per tick, in CARD_ORDER, looping — the same
  // shared tick already driving the demo values, no separate schedule.
  const activeCard = CARD_ORDER[tick % CARD_ORDER.length];

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
          variantIndex={exercisesStep}
          trend={t("publicHero.kpi.exercisesAssigned.trend")}
          isActive={activeCard === "exercises"}
        />
      </div>
      <div className="hero-kpi-card-slot hero-kpi-slot-2">
        <HeroMetricCard
          accent="success"
          icon={FaUsers}
          label={t("publicHero.kpi.activePatients.label")}
          value={patientsValue}
          visual="sparkline"
          variantIndex={patientsStep}
          trend={t("publicHero.kpi.activePatients.trend")}
          isActive={activeCard === "patients"}
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
          isActive={activeCard === "progress"}
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
          isActive={activeCard === "completion"}
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
          isActive={activeCard === "appointment"}
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
          isActive={activeCard === "adherence"}
          trend={t("publicHero.kpi.weeklyAdherence.trend")}
        />
      </div>
    </div>
  );
};

export default HeroKpiGrid;
