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
const depthStyle = ({ scale, brightness }) => {
  return {
    scale,
    "--hero-card-brightness": brightness,
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
  { id: "doctor-appointment", depth: "front" },
  { id: "patient-exercise", depth: "mid" },
];

const RAIL_RIGHT = [
  { id: "patient-rom-improvement", depth: "back", tier: 1 },
  { id: "doctor-new-reports", depth: "back", tier: 1 },
  { id: "patient-today-sessions", depth: "back", tier: 1 },
  { id: "doctor-notes", depth: "back", tier: 2 },
  { id: "doctor-compliance", depth: "back", tier: 2 },
  { id: "patient-appointment", depth: "front" },
  { id: "patient-progress", depth: "mid" },
];

const BOTTOM_BAND = [
  { id: "doctor-progress", size: "md", depth: "mid", tier: 1 },
  { id: "patient-weekly-progress", size: "md", depth: "mid", tier: 1 },
  { id: "doctor-ai-recommendation", size: "md", depth: "back", tier: 2 },
  { id: "patient-daily-goal", size: "md", depth: "back", tier: 2 },
  { id: "patient-avg-exercise-time", size: "sm", depth: "back", tier: 2 },
  { id: "patient-session-completion", size: "sm", depth: "back", tier: 2 },
  { id: "patient-pain-level", size: "sm", depth: "back", tier: 2 },
  { id: "doctor-notifications", size: "sm", depth: "back", tier: 2 },
];

// Mobile has neither the horizontal room to frame the content nor the
// vertical room for a multi-card stack — it gets a one-card-at-a-time
// carousel instead (HeroMobileCarousel), entirely separate from the
// corner/rail/band zones below.

// The fold-anchored row's box sits flush with the Hero's own bottom edge
// (see the `top`/`transform` pairing on `.scatter-bottom-band` in
// HeroDashboardPreview.css) — it has no independent negative offset of
// its own any more. The *only* thing that lets a card cross the fold is
// its own entrance-stagger transform (`restY`, see staggerY), clamped to
// this ceiling — a real structural invariant, not a tuned magic number:
// since a card's `restY` is applied via `transform`, it never affects the
// row's own measured layout height (what useBottomBandSplit checks
// against the content's safe zone), so however large this constant is,
// it can only ever push a card *down*, past the fold, away from the
// content — never up into it. Bounding it here means no single card can
// ever end up more than this many px into the next section, i.e. it can
// never render fully inside it — by construction, not by chance.
// Shared by every card-rendering component in the Hero (corners/rails,
// the fold band + center band, and the mobile carousel in
// HeroMobileCarousel.jsx) so the pool/render logic exists in exactly one
// place even though they render as separate React trees — the fold band
// in particular now renders at the HeroProblemScene level, not inside
// Hero at all (see HeroDashboardBottomBand and HeroProblemScene/index.jsx),
// specifically so it's guaranteed, by plain DOM order, to paint above
// Problem/Solution's own light-transition layers — never a z-index
// guess about a treatment it has nothing to do with.
//
// Corners and rails take no measurement at all — fixed positions, always
// rendered, exactly as before; `.hero-content`'s z-index (see Hero.css)
// is what would keep the copy readable if they ever grazed it. The
// bottom band is the one zone that can wrap into an upper row tall
// enough to reach behind the content, so it alone splits off whichever
// of its own cards would land there into a separate cluster placed
// right below the CTA instead — see HeroDashboardBottomBand. No card is
// ever removed or hidden; it only ever moves between those two clusters.
export const useHeroDashboardPreview = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const data = useMemo(() => getHeroPreviewData(t), [t]);
  const pool = useMemo(() => buildPool(data), [data]);

  const renderCard = (entry, index, { axis = "y", sizeClass = "sm" } = {}) => {
    let restY = axis === "y" ? staggerY(entry.id, entry.size === "lg" ? 0 : 8) : 0;
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

  return { isMobile, pool, renderCard };
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
        {RAIL_LEFT.map((entry, index) => {
          const progress = (index / (RAIL_LEFT.length - 1)) * 100;
          return (
          <div
            key={entry.id}
            className={entry.tier === 2 ? "scatter-tier-2" : undefined}
            style={{ "--rail-position": `${progress}%`, "--rail-shift": `-${progress}%` }}
          >
            {renderCard(entry, index + 2, { axis: "x", sizeClass: "sm" })}
          </div>
          );
        })}
      </div>

      <div className="scatter-rail scatter-rail-right">
        {RAIL_RIGHT.map((entry, index) => {
          const progress = (index / (RAIL_RIGHT.length - 1)) * 100;
          return (
          <div
            key={entry.id}
            className={entry.tier === 2 ? "scatter-tier-2" : undefined}
            style={{ "--rail-position": `${progress}%`, "--rail-shift": `-${progress}%` }}
          >
            {renderCard(entry, index + 2, { axis: "x", sizeClass: "sm" })}
          </div>
          );
        })}
      </div>

      <div className="scatter-bottom-band">
        {BOTTOM_BAND.map((entry, index) => (
          <div key={entry.id} className="scatter-bottom-slot">
            {renderCard(entry, index + 12, { axis: "y", sizeClass: entry.size })}
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
// rendered *layout* height of whatever's currently assigned to the
// fold-anchored band (a card's `restY` is a transform, so it never
// contributes to this — it only ever pushes a card further down, past
// the fold, which this check doesn't need to guard against) and, only if
// that layout height is taller than the real room below the content
// allows, moves one more card (from the front) into the below-CTA
// cluster and checks again. Same every-render-measure/converge pattern
// used elsewhere in this file; `splitIndex < total - 1` is the floor that
// guarantees it terminates and never empties the fold band entirely.
// Desktop only — mobile uses HeroMobileCarousel instead (rendered
// separately; see Hero/index.jsx). Rendered by HeroProblemScene as the
// very last element in the scene (after `.scene-light-phase`, i.e. after
// Problem/Solution) — not by Hero at all any more — specifically so it's
// guaranteed to paint above Problem/Solution's light-transition layers by
// plain DOM order, the same rule this whole scene already relies on
// elsewhere (see the stacking note in HeroProblemScene.css), rather than
// by a z-index competing across an ancestor chain. Its own box sits
// flush with the Hero's bottom edge (`top: contentEdge.heroHeight` +
// `transform: translateY(-100%)`, see HeroDashboardPreview.css) — every
// card's own `restY` transform (capped at MAX_FOLD_OVERFLOW) is the
// *only* thing that lets it cross the fold, so no card can ever end up
// more than that many px into Section 2.
//
// Whichever cards would otherwise make that fold-anchored row tall enough
// to reach behind the content (see useBottomBandSplit) render instead in
// `.scatter-center-band`, a second cluster pinned right below the CTA
// (`top: contentEdge.bottom`) — same cards, same styling, same stagger/
// depth, just a different one of the two positions. Nothing is ever
// removed, hidden, or left overlapping the content.
export default HeroDashboardPreview;
