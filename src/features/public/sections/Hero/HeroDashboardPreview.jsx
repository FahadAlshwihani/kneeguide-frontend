import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { FaUsers, FaCalendarCheck, FaFileLines, FaTriangleExclamation, FaListCheck } from "react-icons/fa6";

import MetricCard from "../../../dashboard/shared/components/MetricCard";
import ProgressCard from "../../../dashboard/shared/components/ProgressCard";
import AppointmentCard from "../../../dashboard/shared/components/AppointmentCard";
import ExerciseCard from "../../../dashboard/shared/components/ExerciseCard";
import DashboardCard from "../../../dashboard/shared/components/DashboardCard";

import { getHeroPreviewData } from "./heroPreviewData";
import useViewportTier from "./useViewportTier";
import "./HeroDashboardPreview.css";

// Cards settle at rest (y:0, rotate:0) — an intentional, aligned grid, not
// a scattered/floating composition. Only the entrance is animated; nothing
// rests at a permanent offset, so cards can never drift toward the CTAs
// or heading above.
const cardEntrance = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: "easeOut" },
  }),
};

/**
 * Builds the pool of preview "widgets", ordered from most to least
 * essential — tiers slice from the front, so shrinking the count always
 * keeps the clearest, most representative cards on screen.
 */
const buildPool = (data) => [
  {
    id: "doctor-appointment",
    size: "lg",
    node: (
      <>
        <span className="hero-dashboard-preview-tag">{data.doctor.badge}</span>
        <DashboardCard title={data.doctor.appointment.title}>
          <AppointmentCard {...data.doctor.appointment} previewMode />
        </DashboardCard>
      </>
    ),
  },
  {
    id: "patient-exercise",
    size: "md",
    node: (
      <>
        <span className="hero-dashboard-preview-tag hero-dashboard-preview-tag-patient">{data.patient.badge}</span>
        <ExerciseCard {...data.patient.exercise} previewMode />
      </>
    ),
  },
  {
    id: "doctor-active-patients",
    size: "sm",
    node: <MetricCard icon={FaUsers} value={data.doctor.metric.value} label={data.doctor.metric.label} />,
  },
  {
    id: "patient-progress",
    size: "md",
    node: (
      <DashboardCard>
        <div className="progress-card-list">
          <ProgressCard {...data.patient.rom} />
          <ProgressCard {...data.patient.adherence} />
        </div>
      </DashboardCard>
    ),
  },
  {
    id: "doctor-progress",
    size: "md",
    node: (
      <DashboardCard>
        <ProgressCard {...data.doctor.progress} />
      </DashboardCard>
    ),
  },
  {
    id: "patient-appointment",
    size: "lg",
    node: (
      <DashboardCard title={data.patient.appointment.title}>
        <AppointmentCard {...data.patient.appointment} previewMode />
      </DashboardCard>
    ),
  },
  {
    id: "doctor-today-appointments",
    size: "sm",
    node: (
      <MetricCard
        icon={FaCalendarCheck}
        value={data.doctor.todayAppointments.value}
        label={data.doctor.todayAppointments.label}
      />
    ),
  },
  {
    id: "doctor-alert",
    size: "sm",
    node: (
      <MetricCard
        icon={FaTriangleExclamation}
        label={data.doctor.alert.label}
        trend={data.doctor.alert.sub}
        status="alert"
      />
    ),
  },
  {
    id: "doctor-new-reports",
    size: "sm",
    node: (
      <MetricCard icon={FaFileLines} value={data.doctor.newReports.value} label={data.doctor.newReports.label} />
    ),
  },
  {
    id: "patient-exercises-assigned",
    size: "sm",
    node: (
      <MetricCard
        icon={FaListCheck}
        value={data.patient.exercisesAssigned.value}
        label={data.patient.exercisesAssigned.label}
        status="success"
      />
    ),
  },
];

const SCALE_MAX = 0.83;
const SCALE_MIN = 0.6;
const SCALE_STEP = 0.04;

/**
 * Composes real, shared dashboard cards (the same components the Doctor
 * and Patient dashboards render) into an organic, floating-widget preview
 * for the public Hero. Supplies only static local preview data — no auth,
 * no API calls, no navigation. Interactive elements render with
 * `previewMode` so they stay focusable/keyboard-accessible but perform no
 * real action.
 *
 * Card *count* is width-responsive (ultra-wide down to a single mobile
 * card) via `useViewportTier` — that's the ceiling. Below that, this
 * component fits what it's actually given: it measures `wrapRef` (the
 * fixed-height box the Hero handed it) against its own rendered height and,
 * if it doesn't fit, first shrinks its scale, then — only if still too
 * tall at the minimum scale — drops cards from the end of the (already
 * least-to-most-essential-ordered) pool. Every card that ends up on screen
 * is always shown whole; nothing is ever clipped mid-card.
 */
const HeroDashboardPreview = ({ wrapRef }) => {
  const { t } = useTranslation();
  const tier = useViewportTier();
  const data = useMemo(() => getHeroPreviewData(t), [t]);
  const pool = useMemo(() => buildPool(data), [data]);

  // Mobile shows exactly one card, chosen once at random on mount (not on
  // every resize) — no slider, no carousel, no autoplay.
  const [mobilePick] = useState(() => Math.floor(Math.random() * pool.length));

  const candidates =
    tier.name === "mobile" ? [pool[mobilePick]] : pool.slice(0, tier.cardCount);

  const gridRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(candidates.length);
  const [scale, setScale] = useState(SCALE_MAX);

  // A new width tier (or a fresh mobile pick) changes the candidate set —
  // start over at full size/count and let the fit pass below trim it back
  // down if the available height doesn't allow it.
  useLayoutEffect(() => {
    setVisibleCount(candidates.length);
    setScale(SCALE_MAX);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier.name, candidates.length]);

  // When the box we've been given resizes (viewport height change), give
  // the full candidate set another chance before re-measuring — it may
  // now fit more (or less) than it did before.
  useLayoutEffect(() => {
    const wrap = wrapRef?.current;
    if (!wrap || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      setVisibleCount(candidates.length);
      setScale(SCALE_MAX);
    });
    observer.observe(wrap);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates.length]);

  // Runs after every render (no deps): measures the current render against
  // the available box and, if it overflows, nudges scale down a step, or —
  // once at the scale floor — drops the least-essential visible card. Each
  // nudge causes a re-render, which runs this effect again, converging
  // before the browser ever paints the intermediate (overflowing) frame.
  useLayoutEffect(() => {
    const wrap = wrapRef?.current;
    const grid = gridRef.current;
    if (!wrap || !grid) return;

    const available = wrap.clientHeight;
    if (available <= 0) return;

    const needed = grid.getBoundingClientRect().height;
    if (needed <= available + 0.5) return;

    if (scale > SCALE_MIN + 0.001) {
      setScale((s) => Math.max(SCALE_MIN, +(s - SCALE_STEP).toFixed(2)));
    } else if (visibleCount > 1) {
      setVisibleCount((c) => c - 1);
    }
  });

  const visible = candidates.slice(0, Math.min(visibleCount, candidates.length));

  return (
    <div
      ref={gridRef}
      className="hero-dashboard-preview-root"
      style={{ transform: `scale(${scale})` }}
    >
      {visible.map((item, index) => (
        <motion.div
          key={item.id}
          className={`hero-dashboard-preview-item hero-dashboard-preview-item--${item.size}`}
          variants={cardEntrance}
          initial="hidden"
          animate="visible"
          custom={index * 0.05}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          {item.node}
        </motion.div>
      ))}
    </div>
  );
};

export default HeroDashboardPreview;
