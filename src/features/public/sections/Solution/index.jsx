import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useInView, animate } from "motion/react";
import { FaUser, FaUserDoctor, FaBrain, FaDumbbell, FaChartLine, FaFileLines, FaBell, FaStopwatch, FaPeopleGroup } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import "./Solution.css";

const NODE_ICONS = {
  patient: FaUser,
  clinician: FaUserDoctor,
  ai: FaBrain,
  exercises: FaDumbbell,
  progress: FaChartLine,
  reports: FaFileLines,
  notifications: FaBell,
  wearables: FaStopwatch,
  family: FaPeopleGroup,
};

// ---------------------------------------------------------------------
// Geometry model — the single source of truth for both the SVG arcs and
// every node's position. `center`/`radius` are always passed in (never
// read from a module-level constant), so the exact same formula produces
// the ring path and every node sitting on it, at whatever scale the
// active breakpoint uses:
//   x = center.x + radius * cos(angle)
//   y = center.y - radius * sin(angle)
// angle in degrees, 0deg = right, 90deg = top, 180deg = left — a node
// list is always laid out left-to-right across the top of its ring.
// ---------------------------------------------------------------------
const ARC_START_DEG = 22;
const ARC_END_DEG = 158;

const polarToCartesian = (center, radius, angleDeg) => {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: center.x + radius * Math.cos(angleRad),
    y: center.y - radius * Math.sin(angleRad),
  };
};

// The full 180deg ring stroke: left edge -> top -> right edge.
const buildRingPath = (center, radius) => {
  const start = polarToCartesian(center, radius, 180);
  const end = polarToCartesian(center, radius, 0);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
};

// A short segment of that same ring, centered on one node's own angle —
// this is what actually lights up on hover, never the whole ring.
const buildArcHighlight = (center, radius, angleDeg, spreadDeg = 9) => {
  const from = polarToCartesian(center, radius, angleDeg - spreadDeg);
  const to = polarToCartesian(center, radius, angleDeg + spreadDeg);
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 0 0 ${to.x} ${to.y}`;
};

// A subtle straight connector from the hub to one node, shown only on
// hover of that node.
const buildRadialConnector = (center, x, y) => `M ${center.x} ${center.y} L ${x} ${y}`;

// Flattens a breakpoint's ring config into fully-resolved nodes. Every
// node's (x, y) comes from exactly the same center + radius its ring's
// <path> is drawn with, so a node's icon center always lands precisely
// on the arc's own centerline — never eyeballed, never a separate value.
const buildRadarNodes = (center, rings) =>
  rings.flatMap((ring, ringIndex) =>
    ring.keys.map((key, slotIndex) => {
      const angle =
        ring.keys.length === 1
          ? (ARC_START_DEG + ARC_END_DEG) / 2 + ring.offsetDeg
          : ARC_START_DEG + ((ARC_END_DEG - ARC_START_DEG) / (ring.keys.length - 1)) * slotIndex + ring.offsetDeg;
      const point = polarToCartesian(center, ring.radius, angle);
      return { key, ringIndex, radius: ring.radius, angle, x: point.x, y: point.y };
    })
  );

// Same 9 nodes/3 rings on desktop, laptop and tablet — only the scale
// changes per breakpoint. Mobile drops to 2 rings/5 nodes.
const FULL_RING_KEYS = [
  ["exercises", "reports", "progress"],
  ["wearables", "ai", "notifications"],
  ["patient", "clinician", "family"],
];
const FULL_RING_OFFSETS = [6, -5, 3];
const MOBILE_RING_KEYS = [
  ["progress", "reports"],
  ["patient", "clinician", "ai"],
];
const MOBILE_RING_OFFSETS = [4, -4];

const buildRings = (radii, offsets, keysList) => radii.map((radius, i) => ({ radius, offsetDeg: offsets[i], keys: keysList[i] }));

// Each breakpoint gets its *own* centerY (== viewBoxHeight, so the hub
// sits exactly on the visible area's bottom edge — roughly half its own
// circle above, half cropped below by .solution-map's overflow: hidden)
// and its own ring radii — never a single geometry uniformly scaled down
// by CSS. minWidth values pick the active tier on resize.
const RADAR_BREAKPOINTS = [
  { id: "mobile", minWidth: 0, viewBoxHeight: 42, rings: buildRings([18, 36], MOBILE_RING_OFFSETS, MOBILE_RING_KEYS) },
  { id: "tablet", minWidth: 641, viewBoxHeight: 48, rings: buildRings([17, 29, 42], FULL_RING_OFFSETS, FULL_RING_KEYS) },
  { id: "laptop", minWidth: 1024, viewBoxHeight: 56, rings: buildRings([21, 36, 51], FULL_RING_OFFSETS, FULL_RING_KEYS) },
  { id: "desktop", minWidth: 1280, viewBoxHeight: 60, rings: buildRings([23, 39, 55], FULL_RING_OFFSETS, FULL_RING_KEYS) },
];

const pickRadarBreakpoint = (width) => RADAR_BREAKPOINTS.reduce((match, bp) => (width >= bp.minWidth ? bp : match), RADAR_BREAKPOINTS[0]);

const useRadarBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState(() => pickRadarBreakpoint(typeof window !== "undefined" ? window.innerWidth : 1280));

  useEffect(() => {
    const handleResize = () => setBreakpoint(pickRadarBreakpoint(window.innerWidth));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return breakpoint;
};

// Choreography constants (seconds) — named so the sequence below reads as
// "hub, then arcs ring-by-ring, then nodes ring-by-ring, then the sweep"
// rather than a wall of unexplained numbers.
const HUB_REVEAL_DURATION = 0.6;
const ARC_DRAW_START = 0.35;
const ARC_DRAW_DURATION = 0.9;
const ARC_DRAW_RING_STEP = 0.18;
const NODE_REVEAL_DURATION = 0.45;
const NODE_REVEAL_STEP = 0.09;
const SWEEP_DURATION = 4.5;
const SWEEP_REPEAT_DELAY = 3;

const Solution = () => {
  const { t } = useTranslation();
  const breakpoint = useRadarBreakpoint();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [sweepProgress, setSweepProgress] = useState(null);

  const mapRef = useRef(null);
  const isMapInView = useInView(mapRef, { once: true, amount: 0.3 });

  const { viewBoxHeight, rings } = breakpoint;
  const center = { x: 50, y: viewBoxHeight };
  const nodes = buildRadarNodes(center, rings);
  const viewBox = `0 0 100 ${viewBoxHeight}`;

  const arcsDrawEnd = ARC_DRAW_START + (rings.length - 1) * ARC_DRAW_RING_STEP + ARC_DRAW_DURATION;
  const nodesRevealStart = arcsDrawEnd + 0.1;
  const sweepStart = nodesRevealStart + nodes.length * NODE_REVEAL_STEP + 0.7;

  // A very slow, refined radar sweep along the middle ring — a smooth
  // progress value (0 -> 1) drives both the blip's angle and its
  // opacity envelope (sin(progress * PI): 0 at the edges, peak at the
  // midpoint), so it fades in/out on its own instead of needing a
  // second, separately-timed animation.
  useEffect(() => {
    if (!isMapInView) return undefined;
    const controls = animate(0, 1, {
      duration: SWEEP_DURATION,
      delay: sweepStart,
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: SWEEP_REPEAT_DELAY,
      onUpdate: setSweepProgress,
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapInView, breakpoint.id]);

  const sweepRing = rings[Math.min(1, rings.length - 1)];
  const sweepAngle = sweepProgress === null ? null : 180 - sweepProgress * 180;
  const sweepPoint = sweepAngle === null ? null : polarToCartesian(center, sweepRing.radius, sweepAngle);
  const sweepOpacity = sweepProgress === null ? 0 : Math.sin(Math.min(1, Math.max(0, sweepProgress)) * Math.PI) * 0.55;

  return (
    <section className="solution-root">
      <div className="solution-container">
        <Reveal className="solution-header">
          <span className="solution-badge">{t("publicSolution.badge")}</span>
          <h2 className="solution-title">{t("publicSolution.title")}</h2>
          <p className="solution-description">{t("publicSolution.description")}</p>
        </Reveal>
      </div>

      {/* Full-bleed on purpose — a sibling of .solution-container, not a
          descendant, so it spans the Hero's full width instead of being
          boxed inside the header's max-width column. The radar is the
          section's visual foundation, not an illustration placed inside
          it. */}
      <div className="solution-map" ref={mapRef} style={{ aspectRatio: `100 / ${viewBoxHeight}` }}>
        <svg className="platform-radar" viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true">
          {rings.map((ring, ringIndex) => (
            <motion.path
              key={ringIndex}
              d={buildRingPath(center, ring.radius)}
              className="platform-ring"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isMapInView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{
                duration: ARC_DRAW_DURATION,
                delay: ARC_DRAW_START + ringIndex * ARC_DRAW_RING_STEP,
                ease: "easeInOut",
              }}
            />
          ))}

          {nodes.map((node) => (
            <path
              key={`highlight-${node.key}`}
              d={buildArcHighlight(center, node.radius, node.angle)}
              className={`platform-arc-highlight${hoveredNode === node.key ? " is-active" : ""}`}
            />
          ))}

          {nodes.map((node) => (
            <path
              key={`connector-${node.key}`}
              d={buildRadialConnector(center, node.x, node.y)}
              className={`platform-connector${hoveredNode === node.key ? " is-active" : ""}`}
            />
          ))}

          {sweepPoint && (
            <circle className="platform-sweep-blip" cx={sweepPoint.x} cy={sweepPoint.y} r={1.6} style={{ opacity: sweepOpacity }} />
          )}
        </svg>

        {nodes.map((node) => {
          const Icon = NODE_ICONS[node.key];
          const ringNodeIndex = rings[node.ringIndex].keys.indexOf(node.key);
          const priorRingNodes = rings.slice(0, node.ringIndex).reduce((sum, ring) => sum + ring.keys.length, 0);
          const revealIndex = priorRingNodes + ringNodeIndex;

          return (
            <motion.div
              key={node.key}
              className={`platform-node${hoveredNode === node.key ? " is-hovered" : ""}`}
              style={{ "--node-x": `${node.x}%`, "--node-y": `${(node.y / viewBoxHeight) * 100}%` }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isMapInView ? { opacity: 1, scale: 1 } : {}}
              transition={{
                duration: NODE_REVEAL_DURATION,
                delay: nodesRevealStart + revealIndex * NODE_REVEAL_STEP,
                ease: "easeOut",
              }}
              onMouseEnter={() => setHoveredNode(node.key)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <span className="platform-node-circle">
                <Icon aria-hidden="true" />
              </span>
              <span className="platform-node-label">{t(`publicSolution.nodes.${node.key}`)}</span>
            </motion.div>
          );
        })}

        <motion.div
          className="platform-hub"
          style={{ "--node-x": `${center.x}%`, "--node-y": `${(center.y / viewBoxHeight) * 100}%` }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={isMapInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: HUB_REVEAL_DURATION, ease: "easeOut" }}
        >
          <span className="platform-hub-circle">
            <span className="platform-hub-mark">KG</span>
          </span>
          <span className="platform-hub-label">{t("publicSolution.center")}</span>
        </motion.div>
      </div>
    </section>
  );
};

export default Solution;
