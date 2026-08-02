import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  FaUsers,
  FaCalendarCheck,
  FaFileLines,
  FaTriangleExclamation,
  FaListCheck,
  FaComments,
  FaNoteSticky,
  FaClipboardCheck,
  FaStopwatch,
  FaArrowTrendUp,
} from "react-icons/fa6";

import MetricCard from "../../../dashboard/shared/components/MetricCard";
import ProgressCard from "../../../dashboard/shared/components/ProgressCard";
import AppointmentCard from "../../../dashboard/shared/components/AppointmentCard";
import ExerciseCard from "../../../dashboard/shared/components/ExerciseCard";
import DashboardCard from "../../../dashboard/shared/components/DashboardCard";

import { getHeroPreviewData } from "./heroPreviewData";
import useIsMobile from "./useIsMobile";
import "./HeroDashboardPreview.css";

// Cards settle at a small, deterministic vertical offset (never at a
// shared y:0) — an intentionally layered composition, not a rigid,
// perfectly aligned grid. The offset is bounded (see overlapOffsetFor) and
// only ever nudges a card *down toward its row below*, never up — pushing
// up risks poking a first-row card above the preview box entirely (where
// the wrap's overflow:hidden safety net would clip it), while pushing
// down only ever overlaps into content the preview already owns, and
// worst case adds a few px the fit loop below simply measures and
// accounts for like any other content.
const cardEntrance = {
  hidden: { opacity: 0, y: 18 },
  visible: ({ delay = 0, restY = 0 } = {}) => ({
    opacity: 1,
    y: restY,
    transition: { duration: 0.5, delay, ease: "easeOut" },
  }),
};

// Small, stable per-card overlap so neighboring rows read as a loosely
// layered stack (Apple-style floating previews) instead of a spreadsheet
// grid. Deterministic from the card's id — same card always gets the same
// nudge, never a fresh random value per render. The anchor card (index 0)
// sits at rest; every other card is pushed down by 8–20px into the row
// below it, which is the full extent of the "overlap" — bounded, and
// always downward so it can never escape the preview box upward.
const overlapOffsetFor = (id, index) => {
  if (index === 0) return 0;
  const hash = Array.from(id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const magnitude = 8 + (hash % 13); // 8–20px
  return index % 2 === 0 ? 0 : magnitude;
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
  {
    id: "doctor-messages",
    size: "sm",
    node: (
      <MetricCard icon={FaComments} value={data.doctor.messages.value} label={data.doctor.messages.label} />
    ),
  },
  {
    id: "doctor-notes",
    size: "sm",
    node: <MetricCard icon={FaNoteSticky} value={data.doctor.notes.value} label={data.doctor.notes.label} />,
  },
  {
    id: "patient-session-completion",
    size: "sm",
    node: (
      <MetricCard
        icon={FaClipboardCheck}
        value={data.patient.sessionCompletion.value}
        label={data.patient.sessionCompletion.label}
      />
    ),
  },
  {
    id: "patient-avg-exercise-time",
    size: "sm",
    node: (
      <MetricCard
        icon={FaStopwatch}
        value={data.patient.avgExerciseTime.value}
        label={data.patient.avgExerciseTime.label}
      />
    ),
  },
  {
    id: "patient-rom-improvement",
    size: "sm",
    node: (
      <MetricCard
        icon={FaArrowTrendUp}
        value={data.patient.romImprovement.value}
        label={data.patient.romImprovement.label}
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
 * Card count is never bucketed by viewport width — this component measures
 * `wrapRef` (the box the Hero handed it) against its own rendered height
 * and fits however many cards actually belong there: it starts from the
 * full pool and, if that overflows, first shrinks scale, then — only if
 * still too tall at the minimum scale — drops cards from the end of the
 * (already least-to-most-essential-ordered) pool. Every card that ends up
 * on screen is always shown whole; nothing is ever clipped mid-card. The
 * one deliberate exception is mobile (see `useIsMobile`), which always
 * shows exactly one card by product decision, not by measurement.
 */
const HeroDashboardPreview = ({ wrapRef }) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const data = useMemo(() => getHeroPreviewData(t), [t]);
  const pool = useMemo(() => buildPool(data), [data]);

  // Mobile shows exactly one card, chosen once at random on mount (not on
  // every resize) — no slider, no carousel, no autoplay.
  const [mobilePick] = useState(() => Math.floor(Math.random() * pool.length));

  const candidates = isMobile ? [pool[mobilePick]] : pool;

  const gridRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(candidates.length);
  const [scale, setScale] = useState(SCALE_MAX);

  // The candidate set itself changed (mobile toggled, or a fresh mobile
  // pick) — start over at full size/count and let the fit pass below trim
  // it back down if the available space doesn't allow it.
  useLayoutEffect(() => {
    setVisibleCount(candidates.length);
    setScale(SCALE_MAX);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, candidates.length]);

  // When the box we've been given resizes (viewport width or height
  // change), give the full candidate set another chance before
  // re-measuring — it may now fit more (or less) than it did before. This
  // is the *only* thing that decides how many cards render on desktop/
  // tablet — there is no width-bucketed count anywhere in this file.
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
  // the available box. Two passes, both strictly monotonic (only ever
  // trim, never grow, within this effect) so there's no risk of a
  // grow/shrink render loop that never settles:
  //
  //   1. Overflow: nudges scale down a step, or — once at the scale floor
  //      — drops the least-essential visible card.
  //   2. Once height fits: checks whether the last row is a sparse,
  //      mostly-empty remainder (the "gap on the right" a rigid card-count
  //      leaves behind) rather than a reasonably full row, and trims down
  //      to the last complete row so the composition never ends in a
  //      dangling, half-empty row. Never trims below one full row.
  //
  // Each trim causes a re-render, which runs this effect again, converging
  // before the browser ever paints an intermediate frame.
  useLayoutEffect(() => {
    const wrap = wrapRef?.current;
    const grid = gridRef.current;
    if (!wrap || !grid) return;

    const available = wrap.clientHeight;
    if (available <= 0) return;

    const needed = grid.getBoundingClientRect().height;
    if (needed > available + 0.5) {
      if (scale > SCALE_MIN + 0.001) {
        setScale((s) => Math.max(SCALE_MIN, +(s - SCALE_STEP).toFixed(2)));
      } else if (visibleCount > 1) {
        setVisibleCount((c) => c - 1);
      }
      return;
    }

    if (visibleCount <= 1) return;
    const columnCount = window
      .getComputedStyle(grid)
      .gridTemplateColumns.split(" ")
      .filter(Boolean).length;
    if (columnCount <= 1) return;

    const shown = candidates.slice(0, visibleCount);
    const totalSpan = shown.reduce((sum, item) => sum + (item.size === "lg" ? 2 : 1), 0);
    const remainder = totalSpan % columnCount;
    const rowIsMostlyEmpty = remainder !== 0 && remainder < columnCount / 2;
    if (rowIsMostlyEmpty && visibleCount - 1 >= columnCount) {
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
      {visible.map((item, index) => {
        const restY = overlapOffsetFor(item.id, index);
        return (
          <motion.div
            key={item.id}
            className={`hero-dashboard-preview-item hero-dashboard-preview-item--${item.size}`}
            style={{ zIndex: restY === 0 ? 1 : 2 }}
            variants={cardEntrance}
            initial="hidden"
            animate="visible"
            custom={{ delay: index * 0.05, restY }}
            whileHover={{ y: restY - 4, transition: { duration: 0.2 } }}
          >
            {item.node}
          </motion.div>
        );
      })}
    </div>
  );
};

export default HeroDashboardPreview;
