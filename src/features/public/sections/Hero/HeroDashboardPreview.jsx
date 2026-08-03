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

// Depth tiers: only translateY/scale/brightness/blur, never a real
// perspective transform. "front" cards (the two hero appointment cards)
// stay at full scale/clarity; "mid" cards ease back slightly; "back"
// cards (the smaller rail/bonus tiles) sit a touch further with a
// whisper of blur.
//
// `brightness` (a `filter` function), not the `opacity` *property* — this
// used to be `opacity`, which works by alpha-blending the whole card
// against whatever is actually behind it. That's invisible over the
// Hero's own dark canvas, but for the bottom band's small escaped sliver
// that crosses into the next section's already-light background, it let
// that lighter backdrop show through the "back"/"mid" cards, which read
// as the card inheriting the next section's treatment. `brightness()`
// only recomputes the element's own already-rendered pixels — the card
// stays fully opaque and looks identical no matter what's behind it.
const DEPTH = {
  front: { scale: 1, brightness: 1, blur: 0 },
  mid: { scale: 0.98, brightness: 0.95, blur: 0 },
  back: { scale: 0.96, brightness: 0.88, blur: 1 },
};

// `scale` (not a raw `transform` string) because this element's `y` is
// already animated via cardEntrance's variants — motion composes its own
// `transform` from x/y/scale/rotate style keys, so scale has to be passed
// the same way or it would be clobbered by motion's generated transform.
const depthStyle = ({ scale, brightness, blur }) => {
  const filters = [];
  if (brightness !== 1) filters.push(`brightness(${brightness})`);
  if (blur) filters.push(`blur(${blur}px)`);

  return {
    scale,
    filter: filters.length ? filters.join(" ") : undefined,
  };
};

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
// the cards inside it simply flow (flex column/wrap). This composition is
// allowed to run behind the Hero content — it is never shrunk, hidden, or
// trimmed to dodge it; see `.hero-content`'s z-index in Hero.css for what
// actually keeps the copy on top.
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

// How much of the fold-anchored row is allowed to float past the Hero's
// own edge, into the next section — meant to land around 20-30px, a
// sliver, not a second row worth. Desktop cards in this row also get
// `restY` (the entrance stagger, 0-25px extra downward via a `transform`,
// see staggerY) on top of this anchor, so this constant is deliberately
// small: base (5px) + restY (0-25px) lands the *total* escape in roughly
// the 5-30px range per card, never a flat 30 + up to 25 more (55px) like
// before. Mobile cards don't get a restY (they only ever get horizontal
// jitter), so its own anchor can sit closer to the full target directly.
const BOTTOM_OVERLAP = 5;
const MOBILE_OVERLAP = 24;

// Shared by both components below so the pool/render logic exists in
// exactly one place even though the framing zones (corners + rails) and
// the bottom band render as two separate React trees — the band lives
// outside .hero-container so it can escape its overflow clip into the
// next section (see Hero/index.jsx and Hero.css), so it can no longer be
// a child of the same component instance that renders the rails.
//
// Corners and rails take no measurement at all — fixed positions, always
// rendered, exactly as before; `.hero-content`'s z-index (see Hero.css)
// is what would keep the copy readable if they ever grazed it. The
// bottom band is the one zone that can wrap into an upper row tall
// enough to reach behind the content, so it alone splits off whichever
// of its own cards would land there into a separate cluster placed
// right below the CTA instead — see HeroDashboardBottomBand. No card is
// ever removed or hidden; it only ever moves between those two clusters.
const useHeroDashboardPreview = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const data = useMemo(() => getHeroPreviewData(t), [t]);
  const pool = useMemo(() => buildPool(data), [data]);

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

  return { isMobile, renderCard };
};

// Corners + rails, at fixed positions/widths (see HeroDashboardPreview.css)
// — always rendered, regardless of how close that puts them to the
// content; `.hero-content`'s z-index is what keeps the copy readable if
// they ever overlap. Mobile has no frame zones, so this renders nothing
// there — see HeroDashboardBottomBand for its stack.
const HeroDashboardPreview = () => {
  const { isMobile, renderCard } = useHeroDashboardPreview();

  if (isMobile) return null;

  return (
    <div className="hero-scatter-wrap">
      <div className="scatter-corner scatter-corner-left">{renderCard(CORNERS[0], 0, { axis: "x", sizeClass: "sm" })}</div>
      <div className="scatter-corner scatter-corner-right">{renderCard(CORNERS[1], 1, { axis: "x", sizeClass: "sm" })}</div>

      <div className="scatter-rail scatter-rail-left">
        {RAIL_LEFT.map((entry, index) => (
          <div key={entry.id} className={entry.tier === 2 ? "scatter-tier-2" : undefined}>
            {renderCard(entry, index + 2, { axis: "x", sizeClass: "sm" })}
          </div>
        ))}
      </div>

      <div className="scatter-rail scatter-rail-right">
        {RAIL_RIGHT.map((entry, index) => (
          <div key={entry.id} className={entry.tier === 2 ? "scatter-tier-2" : undefined}>
            {renderCard(entry, index + 2, { axis: "x", sizeClass: "sm" })}
          </div>
        ))}
      </div>
    </div>
  );
};

// BOTTOM_BAND wraps (flex-wrap) in DOM order — earlier entries fill the
// upper row(s), the latest entries land in the row actually anchored to
// the fold. So "however many cards from the front are making the row too
// tall" is exactly the same set as "whichever cards would otherwise land
// in a row high enough to reach the content" — this measures the real
// rendered height of whatever's currently assigned to the fold-anchored
// band and, only if it's taller than the real room below the content
// allows, moves one more card (from the front) into the below-CTA
// cluster and checks again. Same every-render-measure/converge pattern
// used elsewhere in this file; `splitIndex < total - 1` is the floor that
// guarantees it terminates and never empties the fold band entirely.
const useBottomBandSplit = (ref, total, contentEdge) => {
  const [splitIndex, setSplitIndex] = useState(0);

  useLayoutEffect(() => {
    setSplitIndex(0);
  }, [total, contentEdge?.bottom, contentEdge?.heroHeight]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || !contentEdge) return;
    const available = Math.max(0, contentEdge.heroHeight - contentEdge.bottom - BOTTOM_OVERLAP);
    const needed = node.getBoundingClientRect().height;
    if (needed > available + 0.5 && splitIndex < total - 1) {
      setSplitIndex((count) => count + 1);
    }
  });

  return splitIndex;
};

// The bottom row (desktop) / mobile stack — rendered by Hero/index.jsx as
// a sibling of .hero-container, specifically so the fold-anchored part
// sits outside that element's overflow clip and can float a small,
// deliberate overlap past the Hero's fold into the next section. Anchored
// via a negative `bottom` (see BOTTOM_OVERLAP), so the escaping amount
// stays fixed regardless of card height.
//
// On desktop, whichever cards would otherwise make that fold-anchored row
// tall enough to reach behind the content (see useBottomBandSplit) render
// instead in `.scatter-center-band`, a second cluster pinned right below
// the CTA (`top: contentEdge.bottom`) — same cards, same styling, same
// stagger/depth, just a different one of the two positions. Nothing is
// ever removed, hidden, or left overlapping the content.
export const HeroDashboardBottomBand = ({ contentEdge }) => {
  const { isMobile, renderCard } = useHeroDashboardPreview();
  const bandRef = useRef(null);
  const splitIndex = useBottomBandSplit(bandRef, BOTTOM_BAND.length, contentEdge);

  if (isMobile) {
    return (
      <div className="scatter-mobile-band" style={{ bottom: -MOBILE_OVERLAP }}>
        {MOBILE_STACK.map((entry, index) => renderCard(entry, index, { axis: "x", sizeClass: entry.size }))}
      </div>
    );
  }

  const centerCards = BOTTOM_BAND.slice(0, splitIndex);
  const foldCards = BOTTOM_BAND.slice(splitIndex);

  return (
    <>
      {centerCards.length > 0 && contentEdge && (
        <div className="scatter-center-band" style={{ top: contentEdge.bottom }}>
          {centerCards.map((entry, index) => (
            <div key={entry.id} className={entry.tier === 2 ? "scatter-tier-2" : undefined}>
              {renderCard(entry, index, { axis: "y", sizeClass: entry.size })}
            </div>
          ))}
        </div>
      )}

      <div ref={bandRef} className="scatter-bottom-band" style={{ bottom: -BOTTOM_OVERLAP }}>
        {foldCards.map((entry, index) => (
          <div key={entry.id} className={entry.tier === 2 ? "scatter-tier-2" : undefined}>
            {renderCard(entry, index + splitIndex, { axis: "y", sizeClass: entry.size })}
          </div>
        ))}
      </div>
    </>
  );
};

export default HeroDashboardPreview;
