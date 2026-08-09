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
import useHeroResponsiveMode from "./useHeroResponsiveMode";
import "./HeroKpiGrid.css";

// Deterministic demo sequences — never Math.random(), never regenerated
// per render.
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
// (almost) never change in the same tick, from one single interval
// rather than six independent timers.
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

// Fixed 6-slot rotation used only to pace the icon micro-interaction (see
// `activeCard` below) — independent of which cards are actually rendered
// in the current responsive mode, so a single visible card (mobile) still
// pulses only "occasionally" (roughly 1 turn in 6) rather than every tick.
const CARD_ORDER = ["exercises", "patients", "progress", "completion", "appointment", "adherence"];

// Card metadata, keyed by id — the single source every render pass reads
// from. Only entries present in the current mode's key list (see
// CARD_KEYS_BY_MODE) are ever looked up, computed, or rendered.
const CARD_DEFINITIONS = {
  exercises: {
    accent: "info",
    icon: FaListCheck,
    labelKey: "publicHero.kpi.exercisesAssigned.label",
    trendKey: "publicHero.kpi.exercisesAssigned.trend",
    visual: "sparkline",
  },
  patients: {
    accent: "success",
    icon: FaUsers,
    labelKey: "publicHero.kpi.activePatients.label",
    trendKey: "publicHero.kpi.activePatients.trend",
    visual: "sparkline",
  },
  progress: {
    accent: "info",
    icon: FaHeartPulse,
    labelKey: "publicHero.kpi.rehabProgress.label",
    trendKey: "publicHero.kpi.rehabProgress.trend",
    visual: "progress",
    isPercent: true,
  },
  completion: {
    accent: "success",
    icon: FaClipboardCheck,
    labelKey: "publicHero.kpi.sessionCompletion.label",
    trendKey: "publicHero.kpi.sessionCompletion.trend",
    visual: "progress",
    isPercent: true,
  },
  adherence: {
    accent: "info",
    icon: FaDroplet,
    labelKey: "publicHero.kpi.weeklyAdherence.label",
    trendKey: "publicHero.kpi.weeklyAdherence.trend",
    visual: "progress",
    isPercent: true,
  },
};

// The actual responsive-reduction requirement: desktop keeps the full
// product-preview (row 1: exercises/patients/progress, row 2: completion/
// appointment/adherence — DOM order doubles as grid order, see
// HeroKpiGrid.css). Tablet and mobile render fewer *elements*, not the
// same six hidden behind CSS — a card key absent here is never looked up,
// never has its sequence/step computed, and never mounts a DOM node.
const CARD_KEYS_BY_MODE = {
  desktop: ["exercises", "patients", "progress", "completion", "appointment", "adherence"],
  tablet: ["progress", "appointment"],
  mobile: ["progress"],
};

// One shared lifecycle for every rendered card: a single pooled
// IntersectionObserver (via useSectionReveal, the same primitive every
// other reveal on this site already shares), one page-visibility
// listener, one interval, one tick counter. Reduced motion and an
// offscreen/hidden Hero both simply stop the interval — demo values
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

// Catmull-Rom -> cubic Bezier, tension 1/6 — a standard, compact way to
// draw one smooth continuous curve through an arbitrary list of [x, y]
// points without hand-tuning bezier control handles for each one.
const smoothPath = (points) => {
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
};

// Deterministic, hand-authored datasets — never Math.random(). Each chart
// is a stable "history" (7 points, never changes) plus one of three
// "tail" variants (the last 1-2 points) selected by that metric's own
// current step — so a metric changing doesn't redraw a whole new random
// shape, it reads as "the newest data point moved", the rest of the line
// staying visually put. viewBox is 180x56: wide enough to read as an
// actual trend rather than an icon-sized squiggle.
const SPARKLINE_DATA = {
  exercises: {
    history: [[0, 40], [22, 36], [44, 38], [66, 27], [88, 30], [110, 19], [132, 23]],
    tails: [
      [[152, 14], [176, 9]],
      [[152, 19], [176, 14]],
      [[152, 25], [176, 17]],
    ],
  },
  patients: {
    history: [[0, 34], [22, 38], [44, 30], [66, 33], [88, 24], [110, 28], [132, 20]],
    tails: [
      [[152, 12], [176, 8]],
      [[152, 17], [176, 13]],
      [[152, 22], [176, 16]],
    ],
  },
};

// `sequenceKey` picks the dataset, `variantIndex` (that card's own current
// step) picks which tail — the shared history stays identical either way.
// Re-keyed by `animKey` (the card's current value) so it remounts, and
// its CSS draw-in animation (see HeroKpiGrid.css) replays, exactly when
// the number changes.
const HeroSparkline = ({ sequenceKey, variantIndex, animKey }) => {
  const { history, tails } = SPARKLINE_DATA[sequenceKey];
  const tail = tails[variantIndex % tails.length];
  const d = smoothPath([...history, ...tail]);
  const [endX, endY] = tail[tail.length - 1];

  return (
    <svg className="hero-kpi-sparkline" key={animKey} viewBox="0 0 180 56" aria-hidden="true" focusable="false">
      <path
        className="hero-kpi-sparkline-line"
        d={d}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="hero-kpi-sparkline-glow" cx={endX} cy={endY} r="9" />
      <circle className="hero-kpi-sparkline-dot" cx={endX} cy={endY} r="3.2" />
    </svg>
  );
};

// `isActive` briefly shows a small pulsing indicator dot on the icon —
// driven by the shared tick (see CARD_ORDER/activeCard below), so only
// one card's icon ever reacts at a time, in a slow round-robin, never a
// separate timer.
const HeroMetricCard = ({ accent, icon: Icon, label, value, visual, sequenceKey, variantIndex, progress, trend, isActive }) => (
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
      {visual === "sparkline" && <HeroSparkline sequenceKey={sequenceKey} variantIndex={variantIndex} animKey={value} />}
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
 * The Hero's product-preview KPI area. Desktop shows all six cards (3x2);
 * tablet shows exactly two (Rehabilitation Progress + Upcoming
 * Appointment); mobile shows exactly one (Rehabilitation Progress,
 * permanently — never rotates). The active mode (useHeroResponsiveMode)
 * determines which card *keys* get rendered at all — a key missing from
 * the current mode's list is never looked up, never has its demo value
 * computed, never mounts a DOM node; it is not merely hidden with CSS.
 * One HeroMetricCard implementation, different selected data — no
 * per-card duplication.
 */
const HeroKpiGrid = () => {
  const { t } = useTranslation();
  const mode = useHeroResponsiveMode();
  const { ref, tick, isVisible } = useKpiTicker();

  // Which single card "reacts" this tick — see CARD_ORDER's own comment
  // for why this stays a fixed 6-slot rotation regardless of mode.
  const activeCard = CARD_ORDER[tick % CARD_ORDER.length];
  const visibleKeys = CARD_KEYS_BY_MODE[mode];

  const renderCard = (key, index) => {
    const slotClass = `hero-kpi-card-slot hero-kpi-slot-${index + 1}`;

    if (key === "appointment") {
      const appointmentState = APPOINTMENT_STATES[stepIndex(tick, "appointment", APPOINTMENT_STATES.length)];
      return (
        <div key={key} className={slotClass}>
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
      );
    }

    const def = CARD_DEFINITIONS[key];
    const step = stepIndex(tick, key, SEQUENCES[key].length);
    const rawValue = SEQUENCES[key][step];
    const value = def.isPercent ? `${rawValue}%` : rawValue;

    return (
      <div key={key} className={slotClass}>
        <HeroMetricCard
          accent={def.accent}
          icon={def.icon}
          label={t(def.labelKey)}
          value={value}
          visual={def.visual}
          sequenceKey={key}
          variantIndex={step}
          progress={def.isPercent ? rawValue : undefined}
          trend={t(def.trendKey)}
          isActive={activeCard === key}
        />
      </div>
    );
  };

  return (
    <div
      ref={ref}
      className={`hero-kpi-grid hero-kpi-grid-${mode}${isVisible ? " hero-kpi-grid-visible" : ""}`}
      aria-label={t("publicHero.kpi.ariaLabel")}
    >
      {visibleKeys.map((key, index) => renderCard(key, index))}
    </div>
  );
};

export default HeroKpiGrid;
