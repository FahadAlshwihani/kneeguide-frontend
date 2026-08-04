import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
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
// the ring path and every node sitting on it:
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

// Base ring radii per width tier, in "percent of the map's own width"
// units (viewBox width is always fixed at 100) — sized to comfortably
// fill the map ("large background visualization", not a tiny diagram
// floating in empty space). These are the *starting* radii; render time
// always scales them down further when needed (see fitRings below) to
// guarantee they fit the container's real, measured height *and* stay
// within its horizontal edges — never a hand-tuned viewBoxHeight per
// tier, never eyeballed.
const RADAR_TIERS = [
  { id: "mobile", minWidth: 0, rings: buildRings([24, 46], MOBILE_RING_OFFSETS, MOBILE_RING_KEYS) },
  { id: "tablet", minWidth: 641, rings: buildRings([18, 31, 44], FULL_RING_OFFSETS, FULL_RING_KEYS) },
  { id: "laptop", minWidth: 1024, rings: buildRings([20, 34, 48], FULL_RING_OFFSETS, FULL_RING_KEYS) },
  { id: "desktop", minWidth: 1280, rings: buildRings([22, 36, 50], FULL_RING_OFFSETS, FULL_RING_KEYS) },
];

const pickRadarTier = (width) => RADAR_TIERS.reduce((match, tier) => (width >= tier.minWidth ? tier : match), RADAR_TIERS[0]);

const useRadarTier = () => {
  const [tier, setTier] = useState(() => pickRadarTier(typeof window !== "undefined" ? window.innerWidth : 1280));

  useEffect(() => {
    const handleResize = () => setTier(pickRadarTier(window.innerWidth));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return tier;
};

// Guarantees the outer ring always fits inside the *real, measured*
// viewBox on both axes — instead of trusting hand-typed radius/height
// pairs to agree, this derives the correction directly from measurement
// every time, so every ring (and therefore every node sitting on it) is
// mathematically guaranteed to stay inside the map at any width *and*
// any height the container actually renders at.
const TOP_MARGIN_UNITS = 6;
// The arc only spans ARC_START_DEG..ARC_END_DEG, so its widest horizontal
// reach happens at those two endpoints, not at 180deg — this is the
// radius, in the same "percent of the fixed 100-wide viewBox" units, at
// which a node sitting right at ARC_START_DEG would just touch the
// viewBox's own left/right edge. A couple of units of margin keeps a
// node's own circle from touching that edge.
const ARC_START_RAD = (ARC_START_DEG * Math.PI) / 180;
const HORIZONTAL_RADIUS_LIMIT = 50 / Math.cos(ARC_START_RAD) - 2;

// Minimum pixel distance a node's CENTER must keep from the map's bottom
// edge so its full circle + up-to-two-line label always stays inside the
// visible box — sized generously for the largest breakpoint's node chrome
// (22px circle radius + 6px gap + ~2 label lines), then converted to
// viewBox units from the container's own measured width every render, so
// it's exact at any size rather than a per-breakpoint guess.
const NODE_BOTTOM_CLEARANCE_PX = 64;

const fitRings = (rings, viewBoxHeight, mapWidth) => {
  const outerRadius = Math.max(...rings.map((ring) => ring.radius));
  const verticalAvailable = viewBoxHeight - TOP_MARGIN_UNITS;
  const verticalScale = verticalAvailable > 0 ? Math.min(1, verticalAvailable / outerRadius) : 1;
  const horizontalScale = Math.min(1, HORIZONTAL_RADIUS_LIMIT / outerRadius);
  const scale = Math.min(verticalScale, horizontalScale);
  const scaledRings = rings.map((ring) => ({ ...ring, radius: ring.radius * scale }));

  // The innermost ring's side nodes (angle == ARC_START_DEG/ARC_END_DEG)
  // sit closer to the bottom edge than anything else on the map (every
  // other node has either a larger radius or a steeper angle, both of
  // which only move it further away) — so guaranteeing clearance for
  // that one ring's own side nodes guarantees it for every node. Each
  // ring's arc and its own nodes always share the same radius (see
  // buildRingPath/buildRadarNodes), so nudging just this ring outward
  // keeps its arc and nodes perfectly matched without touching any other
  // ring's already-correct scale.
  if (mapWidth > 0 && scaledRings.length > 0) {
    const clearanceUnits = (NODE_BOTTOM_CLEARANCE_PX * 100) / mapWidth;
    const requiredInnerRadius = clearanceUnits / Math.sin(ARC_START_RAD);
    const nextRadius = scaledRings[1]?.radius ?? Infinity;
    if (scaledRings[0].radius < requiredInnerRadius) {
      scaledRings[0] = { ...scaledRings[0], radius: Math.min(requiredInnerRadius, nextRadius - 2) };
    }
  }

  return scaledRings;
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
  const tier = useRadarTier();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [sweepProgress, setSweepProgress] = useState(null);

  const mapRef = useRef(null);
  const isMapInView = useInView(mapRef, { once: true, amount: 0.3 });

  // The map's real rendered (width, height) — the *only* source of truth
  // for the SVG's coordinate system (see viewBoxHeight below). Measuring
  // it directly, rather than trying to keep a CSS aspect-ratio and a
  // hand-picked viewBox in numeric agreement, is what guarantees a node's
  // icon center and its arc's centerline can never drift apart: there is
  // only one number, derived from the DOM itself.
  const [mapSize, setMapSize] = useState(null);

  useLayoutEffect(() => {
    const node = mapRef.current;
    if (!node) return undefined;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) setMapSize({ width: rect.width, height: rect.height });
    };

    measure();

    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(node);
    } else {
      window.addEventListener("resize", measure);
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // centerY == viewBoxHeight puts the hub exactly on the map's real
  // bottom edge — the container's own `overflow: hidden`, pinned flush
  // against the next section (see Solution.css), is what then crops
  // roughly half of it and the arcs' own lower reach. Before the first
  // measurement lands, fall back to a plausible ratio so nothing renders
  // from a guess for more than a frame.
  const viewBoxHeight = mapSize ? (mapSize.height / mapSize.width) * 100 : 30;
  const center = { x: 50, y: viewBoxHeight };
  const rings = fitRings(tier.rings, viewBoxHeight);
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
  }, [isMapInView, tier.id]);

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

      {/* Full-bleed and pinned to the section's own bottom edge (see
          Solution.css) — a sibling of .solution-container, not a
          descendant, so it spans the full width instead of being boxed
          inside the header's max-width column, and its bottom is exactly
          where the next section begins. That's the entire clipping
          mechanism: nothing below that edge is ever painted. */}
      <div className="solution-map" ref={mapRef}>
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
