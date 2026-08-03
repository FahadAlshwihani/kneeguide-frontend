import React, { useMemo } from "react";
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
  FaClock,
  FaHeartPulse,
  FaGaugeHigh,
  FaWandMagicSparkles,
  FaFire,
  FaClipboardList,
  FaBell,
  FaCircleCheck,
} from "react-icons/fa6";

import MetricCard from "../../../dashboard/shared/components/MetricCard";
import ProgressCard from "../../../dashboard/shared/components/ProgressCard";
import AppointmentCard from "../../../dashboard/shared/components/AppointmentCard";
import ExerciseCard from "../../../dashboard/shared/components/ExerciseCard";
import DashboardCard from "../../../dashboard/shared/components/DashboardCard";

import { getHeroPreviewData } from "./heroPreviewData";
import useIsMobile from "./useIsMobile";
import "./HeroDashboardPreview.css";

// Same fade-up entrance every card has always used — only what each card's
// *rest* position is has changed (a per-zone stagger offset instead of a
// grid-row overlap), never the animation itself.
const cardEntrance = {
  hidden: { opacity: 0, y: 18 },
  visible: ({ delay = 0, restY = 0 } = {}) => ({
    opacity: 1,
    y: restY,
    transition: { duration: 0.5, delay, ease: "easeOut" },
  }),
};

// Deterministic, small per-card offset derived from its id — same card
// always gets the same nudge. Used both for the vertical "one card higher,
// one lower" stagger and, at a smaller magnitude, for horizontal jitter on
// the rails. Never random per render, always bounded.
const hashOf = (id) => Array.from(id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

const staggerY = (id, min = 8, span = 18) => min + (hashOf(id) % span);
const jitterX = (id, span = 10) => (hashOf(id) % (span * 2 + 1)) - span;

// Depth tiers: only translateY/scale/opacity/blur, never a real perspective
// transform. "front" cards (the two hero appointment cards) stay at full
// scale/clarity; "mid" cards ease back slightly; "back" cards (the smaller
// rail/bonus tiles) sit a touch further with a whisper of blur.
const DEPTH = {
  front: { scale: 1, opacity: 1, blur: 0 },
  mid: { scale: 0.98, opacity: 0.95, blur: 0 },
  back: { scale: 0.96, opacity: 0.88, blur: 1 },
};

// `scale` (not a raw `transform` string) because this element's `y` is
// already animated via cardEntrance's variants — motion composes its own
// `transform` from x/y/scale/rotate style keys, so scale has to be passed
// the same way or it would be clobbered by motion's generated transform.
const depthStyle = ({ scale, opacity, blur }) => ({
  scale,
  opacity,
  filter: blur ? `blur(${blur}px)` : undefined,
});

/**
 * The pool of preview widgets. Every entry reuses one of the five shared
 * dashboard card components verbatim (MetricCard, ProgressCard,
 * AppointmentCard, ExerciseCard, DashboardCard) with only local, clearly
 * fictional preview data — no card is redesigned here.
 */
const buildPool = (data) => ({
  "doctor-appointment": (
    <>
      <span className="hero-dashboard-preview-tag">{data.doctor.badge}</span>
      <DashboardCard title={data.doctor.appointment.title}>
        <AppointmentCard {...data.doctor.appointment} previewMode />
      </DashboardCard>
    </>
  ),
  "patient-appointment": (
    <DashboardCard title={data.patient.appointment.title}>
      <AppointmentCard {...data.patient.appointment} previewMode />
    </DashboardCard>
  ),
  "patient-exercise": (
    <>
      <span className="hero-dashboard-preview-tag hero-dashboard-preview-tag-patient">{data.patient.badge}</span>
      <ExerciseCard {...data.patient.exercise} previewMode />
    </>
  ),
  "doctor-progress": (
    <DashboardCard>
      <ProgressCard {...data.doctor.progress} />
    </DashboardCard>
  ),
  "patient-progress": (
    <DashboardCard>
      <div className="progress-card-list">
        <ProgressCard {...data.patient.rom} />
        <ProgressCard {...data.patient.adherence} />
      </div>
    </DashboardCard>
  ),
  "patient-weekly-progress": (
    <DashboardCard>
      <ProgressCard {...data.patient.weeklyProgress} />
    </DashboardCard>
  ),
  "patient-daily-goal": (
    <DashboardCard>
      <ProgressCard {...data.patient.dailyGoal} />
    </DashboardCard>
  ),
  "doctor-ai-recommendation": (
    <DashboardCard>
      <MetricCard icon={FaWandMagicSparkles} label={data.doctor.aiRecommendation.label} trend={data.doctor.aiRecommendation.sub} status="success" />
    </DashboardCard>
  ),
  "doctor-active-patients": (
    <MetricCard icon={FaUsers} value={data.doctor.metric.value} label={data.doctor.metric.label} />
  ),
  "doctor-today-appointments": (
    <MetricCard icon={FaCalendarCheck} value={data.doctor.todayAppointments.value} label={data.doctor.todayAppointments.label} />
  ),
  "doctor-alert": (
    <MetricCard icon={FaTriangleExclamation} label={data.doctor.alert.label} trend={data.doctor.alert.sub} status="alert" />
  ),
  "doctor-new-reports": (
    <MetricCard icon={FaFileLines} value={data.doctor.newReports.value} label={data.doctor.newReports.label} />
  ),
  "doctor-messages": (
    <MetricCard icon={FaComments} value={data.doctor.messages.value} label={data.doctor.messages.label} />
  ),
  "doctor-notes": (
    <MetricCard icon={FaNoteSticky} value={data.doctor.notes.value} label={data.doctor.notes.label} />
  ),
  "doctor-streak": (
    <MetricCard icon={FaFire} value={data.doctor.streak.value} label={data.doctor.streak.label} trend={data.doctor.streak.sub} status="success" />
  ),
  "doctor-compliance": (
    <MetricCard icon={FaClipboardList} value={data.doctor.compliance.value} label={data.doctor.compliance.label} />
  ),
  "doctor-notifications": <MetricCard icon={FaBell} value={data.doctor.notifications.value} label={data.doctor.notifications.label} />,
  "patient-exercises-assigned": (
    <MetricCard icon={FaListCheck} value={data.patient.exercisesAssigned.value} label={data.patient.exercisesAssigned.label} status="success" />
  ),
  "patient-session-completion": (
    <MetricCard icon={FaClipboardCheck} value={data.patient.sessionCompletion.value} label={data.patient.sessionCompletion.label} />
  ),
  "patient-avg-exercise-time": (
    <MetricCard icon={FaStopwatch} value={data.patient.avgExerciseTime.value} label={data.patient.avgExerciseTime.label} />
  ),
  "patient-rom-improvement": (
    <MetricCard icon={FaArrowTrendUp} value={data.patient.romImprovement.value} label={data.patient.romImprovement.label} status="success" />
  ),
  "patient-today-sessions": (
    <MetricCard icon={FaClock} value={data.patient.todaySessions.value} label={data.patient.todaySessions.label} />
  ),
  "patient-recovery-score": (
    <MetricCard icon={FaHeartPulse} value={data.patient.recoveryScore.value} label={data.patient.recoveryScore.label} status="success" />
  ),
  "patient-pain-level": (
    <MetricCard icon={FaGaugeHigh} value={data.patient.painLevel.value} label={data.patient.painLevel.label} trend={data.patient.painLevel.sub} status="success" />
  ),
  "patient-exercise-completion": (
    <MetricCard icon={FaCircleCheck} value={data.patient.exerciseCompletion.value} label={data.patient.exerciseCompletion.label} status="success" />
  ),
});

// The composition itself: which widgets sit in which zone, at what size and
// depth, and (for the rail/bonus tiles) which ones only appear once there's
// genuinely enough room (`tier: 2`, revealed by a media query — see
// HeroDashboardPreview.css — never by a JS width bucket). Nothing here is a
// pixel coordinate; every zone anchors to a corner/edge with percentages and
// the cards inside it simply flow (flex column/wrap), so the composition
// keeps its intent — frame the edges, leave the center clear — at any size.
const CORNERS = [
  { id: "patient-exercises-assigned", depth: "back" },
  { id: "doctor-active-patients", depth: "back" },
];

const RAIL_LEFT = [
  { id: "doctor-alert", depth: "back", tier: 1 },
  { id: "patient-recovery-score", depth: "back", tier: 1 },
  { id: "doctor-streak", depth: "back", tier: 1 },
  { id: "doctor-messages", depth: "back", tier: 2 },
  { id: "patient-exercise-completion", depth: "back", tier: 2 },
];

const RAIL_RIGHT = [
  { id: "patient-rom-improvement", depth: "back", tier: 1 },
  { id: "doctor-new-reports", depth: "back", tier: 1 },
  { id: "patient-today-sessions", depth: "back", tier: 1 },
  { id: "doctor-notes", depth: "back", tier: 2 },
  { id: "doctor-compliance", depth: "back", tier: 2 },
];

const BOTTOM_BAND = [
  { id: "doctor-appointment", size: "lg", depth: "front", tier: 1 },
  { id: "patient-exercise", size: "md", depth: "mid", tier: 1 },
  { id: "doctor-progress", size: "md", depth: "mid", tier: 1 },
  { id: "patient-progress", size: "md", depth: "mid", tier: 1 },
  { id: "patient-weekly-progress", size: "md", depth: "mid", tier: 1 },
  { id: "patient-appointment", size: "lg", depth: "front", tier: 1 },
  { id: "doctor-ai-recommendation", size: "md", depth: "back", tier: 2 },
  { id: "patient-daily-goal", size: "md", depth: "back", tier: 2 },
  { id: "patient-avg-exercise-time", size: "sm", depth: "back", tier: 2 },
  { id: "patient-session-completion", size: "sm", depth: "back", tier: 2 },
  { id: "patient-pain-level", size: "sm", depth: "back", tier: 2 },
  { id: "doctor-notifications", size: "sm", depth: "back", tier: 2 },
];

// Mobile has no horizontal room to frame the content, so it gets its own
// small, hand-picked vertical stack instead of the corner/rail/band zones —
// staggered, never a rigid single column of identically-aligned cards.
const MOBILE_STACK = [
  { id: "doctor-appointment", size: "lg", depth: "front" },
  { id: "patient-recovery-score", size: "sm", depth: "mid" },
  { id: "patient-today-sessions", size: "sm", depth: "mid" },
  { id: "doctor-streak", size: "sm", depth: "back" },
];

// Rail geometry used to turn `safeZone` (real, measured clearance) into a
// real pixel width for each rail — and, just as importantly, into a plain
// "there isn't room, don't render it" decision instead of ever forcing an
// overlap. RAIL_OUTER_INSET/CORNER_OUTER_INSET intentionally use the upper
// end of the CSS clamp() the outer anchor actually renders at (see
// HeroDashboardPreview.css), so this always *under*-estimates available
// space rather than over-estimating it — the failure mode this exists to
// prevent is a card touching the safe zone, never a card sitting a few
// extra px further out than it strictly had to.
const RAIL_OUTER_INSET = 28;
const RAIL_GAP = 20;
const MIN_RAIL_WIDTH = 120;
const MAX_RAIL_WIDTH = 182;
const CORNER_OUTER_INSET = 16;
const MIN_CORNER_CLEARANCE = 130;

const computeLayout = (safeZone) => {
  if (!safeZone) return null;

  const leftRailWidth = safeZone.left - RAIL_OUTER_INSET - RAIL_GAP;
  const rightRailWidth = safeZone.right - RAIL_OUTER_INSET - RAIL_GAP;

  return {
    showLeftRail: leftRailWidth >= MIN_RAIL_WIDTH,
    showRightRail: rightRailWidth >= MIN_RAIL_WIDTH,
    leftRailWidth: Math.min(MAX_RAIL_WIDTH, Math.max(MIN_RAIL_WIDTH, leftRailWidth)),
    rightRailWidth: Math.min(MAX_RAIL_WIDTH, Math.max(MIN_RAIL_WIDTH, rightRailWidth)),
    showCorners: safeZone.top >= CORNER_OUTER_INSET + MIN_CORNER_CLEARANCE,
    bandTop: Math.max(0, safeZone.bottom),
  };
};

// Shared by both components below so the pool/layout/render logic exists
// in exactly one place even though the framing zones (corners + rails)
// and the bottom band render as two separate React trees now — the band
// has to live outside .hero-container to escape its overflow clip (see
// Hero/index.jsx and Hero.css), so it can no longer be a child of the
// same component instance that renders the rails.
const useHeroDashboardPreview = (safeZone) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const data = useMemo(() => getHeroPreviewData(t), [t]);
  const pool = useMemo(() => buildPool(data), [data]);
  const layout = useMemo(() => computeLayout(safeZone), [safeZone]);

  const renderCard = (entry, index, { axis = "y", sizeClass = "sm" } = {}) => {
    const restY = axis === "y" ? staggerY(entry.id, entry.size === "lg" ? 0 : 8) : 0;
    const jitter = axis === "x" ? jitterX(entry.id) : 0;
    const depth = DEPTH[entry.depth] || DEPTH.mid;

    return (
      <motion.div
        key={entry.id}
        className={`hero-dashboard-preview-item hero-dashboard-preview-item--${sizeClass}`}
        style={{
          ...depthStyle(depth),
          ...(jitter ? { marginInlineStart: `${jitter}px` } : null),
        }}
        variants={cardEntrance}
        initial="hidden"
        animate="visible"
        custom={{ delay: index * 0.05, restY }}
        whileHover={{ y: restY - 4, transition: { duration: 0.2 } }}
      >
        {pool[entry.id]}
      </motion.div>
    );
  };

  return { isMobile, layout, renderCard };
};

// Corners + rails only — unchanged from before. Nothing renders until the
// real content box has been measured — with `useLayoutEffect` driving
// that measurement in Hero/index.jsx this resolves before the first
// paint, so in practice there's no visible pop-in; what it guarantees is
// that a card is never placed from a guessed position, even for one
// frame. Mobile has no frame zones, so this renders nothing there — see
// HeroDashboardBottomBand for its stack.
const HeroDashboardPreview = ({ safeZone }) => {
  const { isMobile, layout, renderCard } = useHeroDashboardPreview(safeZone);

  if (!layout || isMobile) return null;

  return (
    <div className="hero-scatter-wrap">
      {layout.showCorners && (
        <>
          <div className="scatter-corner scatter-corner-left">{renderCard(CORNERS[0], 0, { axis: "x", sizeClass: "sm" })}</div>
          <div className="scatter-corner scatter-corner-right">{renderCard(CORNERS[1], 1, { axis: "x", sizeClass: "sm" })}</div>
        </>
      )}

      {layout.showLeftRail && (
        <div className="scatter-rail scatter-rail-left" style={{ width: layout.leftRailWidth }}>
          {RAIL_LEFT.map((entry, index) => (
            <div key={entry.id} className={entry.tier === 2 ? "scatter-tier-2" : undefined}>
              {renderCard(entry, index + 2, { axis: "x", sizeClass: "sm" })}
            </div>
          ))}
        </div>
      )}

      {layout.showRightRail && (
        <div className="scatter-rail scatter-rail-right" style={{ width: layout.rightRailWidth }}>
          {RAIL_RIGHT.map((entry, index) => (
            <div key={entry.id} className={entry.tier === 2 ? "scatter-tier-2" : undefined}>
              {renderCard(entry, index + 2, { axis: "x", sizeClass: "sm" })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// The bottom row (desktop) / mobile stack — rendered by Hero/index.jsx as
// a sibling of .hero-container, specifically so it sits outside that
// element's overflow clip and can float its small, deliberate overlap
// past the Hero's fold into the next section. Position, stagger, depth
// and card set are all unchanged from before; only where this piece of
// markup lives in the DOM (and its CSS positioning context) changed —
// see HeroDashboardPreview.css for the z-index that keeps it above the
// next section's own content in that overlap band.
export const HeroDashboardBottomBand = ({ safeZone }) => {
  const { isMobile, layout, renderCard } = useHeroDashboardPreview(safeZone);

  if (!layout) return null;

  if (isMobile) {
    return (
      <div className="scatter-mobile-band" style={{ top: layout.bandTop }}>
        {MOBILE_STACK.map((entry, index) => renderCard(entry, index, { axis: "x", sizeClass: entry.size }))}
      </div>
    );
  }

  return (
    <div className="scatter-bottom-band" style={{ top: layout.bandTop }}>
      {BOTTOM_BAND.map((entry, index) => (
        <div key={entry.id} className={entry.tier === 2 ? "scatter-tier-2" : undefined}>
          {renderCard(entry, index, { axis: "y", sizeClass: entry.size })}
        </div>
      ))}
    </div>
  );
};

export default HeroDashboardPreview;
