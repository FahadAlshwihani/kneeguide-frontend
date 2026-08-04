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

const MOBILE_MAX_WIDTH = 640;

// ---------------------------------------------------------------------
// Geometry model — the single source of truth for both the SVG arcs and
// every node's position, per the "air-traffic radar" direction: a
// half-dome of concentric arcs rising from a hub near the bottom-center,
// not a full circle. Every ring lists which node keys sit on it; a
// node's angle is derived purely from its position within that list, so
// there is nothing to eyeball per node — only the ring's radius and
// small offsetDeg (a deliberate, documented nudge for "controlled
// asymmetry", not a per-node magic number) ever get tuned by hand.
//
// Coordinates follow the brief's own formula exactly:
//   x = centerX + radius * cos(angle)
//   y = centerY - radius * sin(angle)
// with angle in degrees, 0deg = right, 90deg = top, 180deg = left — so a
// node list is always laid out left-to-right across the top of its ring.
// ---------------------------------------------------------------------
const RADAR_CENTER = { x: 50, y: 54 };
const RADAR_VIEWBOX = "0 0 100 58";
const ARC_START_DEG = 22;
const ARC_END_DEG = 158;

const DESKTOP_RINGS = [
  { radius: 20, offsetDeg: 6, keys: ["exercises", "reports", "progress"] },
  { radius: 34, offsetDeg: -5, keys: ["wearables", "ai", "notifications"] },
  { radius: 48, offsetDeg: 3, keys: ["patient", "clinician", "family"] },
];

const MOBILE_RINGS = [
  { radius: 24, offsetDeg: 4, keys: ["progress", "reports"] },
  { radius: 46, offsetDeg: -4, keys: ["patient", "clinician", "ai"] },
];

const polarToCartesian = (radius, angleDeg) => {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: RADAR_CENTER.x + radius * Math.cos(angleRad),
    y: RADAR_CENTER.y - radius * Math.sin(angleRad),
  };
};

// The full 180deg ring stroke: left edge -> top -> right edge.
const buildRingPath = (radius) => {
  const start = polarToCartesian(radius, 180);
  const end = polarToCartesian(radius, 0);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
};

// A short segment of that same ring, centered on one node's own angle —
// this is what actually lights up on hover, never the whole ring.
const buildArcHighlight = (radius, angleDeg, spreadDeg = 9) => {
  const from = polarToCartesian(radius, angleDeg - spreadDeg);
  const to = polarToCartesian(radius, angleDeg + spreadDeg);
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 0 0 ${to.x} ${to.y}`;
};

// A subtle straight connector from the hub to one node, shown only on
// hover of that node.
const buildRadialConnector = (x, y) => `M ${RADAR_CENTER.x} ${RADAR_CENTER.y} L ${x} ${y}`;

// Flattens the ring config into one array of fully-resolved nodes. Every
// node's (x, y) comes from exactly the same radius its ring's <path> is
// drawn with, so a node circle always sits precisely on the arc stroke.
const buildRadarNodes = (rings) =>
  rings.flatMap((ring, ringIndex) =>
    ring.keys.map((key, slotIndex) => {
      const angle =
        ring.keys.length === 1
          ? (ARC_START_DEG + ARC_END_DEG) / 2 + ring.offsetDeg
          : ARC_START_DEG + ((ARC_END_DEG - ARC_START_DEG) / (ring.keys.length - 1)) * slotIndex + ring.offsetDeg;
      const point = polarToCartesian(ring.radius, angle);
      return { key, ringIndex, radius: ring.radius, angle, x: point.x, y: point.y };
    })
  );

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < MOBILE_MAX_WIDTH : false));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_MAX_WIDTH);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
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
  const isMobile = useIsMobile();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [sweepProgress, setSweepProgress] = useState(null);

  const mapRef = useRef(null);
  const isMapInView = useInView(mapRef, { once: true, amount: 0.3 });

  const rings = isMobile ? MOBILE_RINGS : DESKTOP_RINGS;
  const nodes = buildRadarNodes(rings);

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
  }, [isMapInView]);

  const sweepRing = rings[Math.min(1, rings.length - 1)];
  const sweepAngle = sweepProgress === null ? null : 180 - sweepProgress * 180;
  const sweepPoint = sweepAngle === null ? null : polarToCartesian(sweepRing.radius, sweepAngle);
  const sweepOpacity = sweepProgress === null ? 0 : Math.sin(Math.min(1, Math.max(0, sweepProgress)) * Math.PI) * 0.55;

  return (
    <section className="solution-root">
      <div className="solution-container">
        <Reveal className="solution-header">
          <span className="solution-badge">{t("publicSolution.badge")}</span>
          <h2 className="solution-title">{t("publicSolution.title")}</h2>
          <p className="solution-description">{t("publicSolution.description")}</p>
        </Reveal>

        <div className="solution-map" ref={mapRef}>
          <svg className="platform-radar" viewBox={RADAR_VIEWBOX} aria-hidden="true">
            {rings.map((ring, ringIndex) => (
              <motion.path
                key={ringIndex}
                d={buildRingPath(ring.radius)}
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
                d={buildArcHighlight(node.radius, node.angle)}
                className={`platform-arc-highlight${hoveredNode === node.key ? " is-active" : ""}`}
              />
            ))}

            {nodes.map((node) => (
              <path
                key={`connector-${node.key}`}
                d={buildRadialConnector(node.x, node.y)}
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
                style={{ "--node-x": `${node.x}%`, "--node-y": `${(node.y / 58) * 100}%` }}
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
            style={{ "--node-x": `${RADAR_CENTER.x}%`, "--node-y": `${(RADAR_CENTER.y / 58) * 100}%` }}
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
      </div>
    </section>
  );
};

export default Solution;
