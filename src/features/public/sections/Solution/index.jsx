import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { motion, useInView, useMotionValue, animate } from "motion/react";
import { FaUser, FaUserDoctor, FaBrain, FaDumbbell, FaChartLine, FaFileLines, FaBell, FaStopwatch, FaPeopleGroup } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import BrandLogo from "../../components/BrandLogo";
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

// Same 9 nodes/3 rings on every breakpoint, mobile included — only the
// scale changes per tier below, never which nodes exist.
const FULL_RING_KEYS = [
  ["exercises", "reports", "progress"],
  ["wearables", "ai", "notifications"],
  ["patient", "clinician", "family"],
];
const FULL_RING_OFFSETS = [6, -5, 3];

const buildRings = (radii, offsets, keysList) => radii.map((radius, i) => ({ radius, offsetDeg: offsets[i], keys: keysList[i] }));

// Base ring radii per width tier, in "percent of the map's own width"
// units (viewBox width is always fixed at 100) — sized to comfortably
// fill the map ("large background visualization", not a tiny diagram
// floating in empty space). These are the *starting* radii; render time
// always scales them down further when needed (see fitRings below) to
// guarantee they fit the container's real, measured height *and* stay
// within its horizontal edges — never a hand-tuned viewBoxHeight per
// tier, never eyeballed. Mobile's own radii are spaced a bit more
// generously between rings than a straight-down-scaled version of
// tablet's would be (see RADAR_TIERS) specifically to keep 9 nodes'
// worth of circles+labels from crowding a narrow screen — paired with
// smaller node/label chrome at that same breakpoint (see the
// max-width: 640px block, Solution.css) and a larger minInnerGap (see
// fitRings below and RADAR_TIERS) so the bottom-clearance boost doesn't
// squeeze the inner ring back up against the middle one.
const RADAR_TIERS = [
  { id: "mobile", minWidth: 0, minInnerGap: 12, rings: buildRings([20, 37, 49], FULL_RING_OFFSETS, FULL_RING_KEYS) },
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

// How close the bottom-clearance boost below is allowed to push the
// inner ring toward the middle one — 2 units was fine everywhere this
// mattered until mobile's own narrow width started forcing a much larger
// boost, which (capped at only 2 units of separation) squeezed the two
// rings' nodes close enough to visually collide. RADAR_TIERS' mobile
// entry passes a larger value to fix that; every other tier has no
// minInnerGap of its own, so `tier.minInnerGap` is `undefined` there —
// same as never passing a fourth argument at all — so their own numbers
// are unaffected, byte for byte, by this change.
const DEFAULT_MIN_INNER_GAP = 2;

const fitRings = (rings, viewBoxHeight, mapWidth, minInnerGap = DEFAULT_MIN_INNER_GAP) => {
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
      scaledRings[0] = { ...scaledRings[0], radius: Math.min(requiredInnerRadius, nextRadius - minInnerGap) };
    }
  }

  return scaledRings;
};

// Purely decorative background arcs beyond the last node-bearing ring —
// they never carry nodes and never feed fitRings/buildRadarNodes, so the
// real geometry above is completely untouched. Count and spacing are
// derived every render, never a hand-picked number per breakpoint: the
// gap reuses the real rings' own average spacing (so the rhythm looks
// continuous, not a different pattern grafted on), and arcs keep being
// added outward until they pass the farthest corner of the map — meaning
// on a wide screen more of them fit before that happens (more arcs) and
// on a narrow one fewer do, exactly mirroring "however many arcs fit
// this viewport". The outermost ones are expected to render mostly (or
// entirely) outside the visible box; `.platform-radar-clip`'s own
// `overflow: hidden` (see index.jsx's JSX and Solution.css) is what
// quietly crops them.
const DECORATIVE_ARC_MIN = 1;
const DECORATIVE_ARC_MAX = 6;

const buildDecorativeArcs = (nodeRings, center, viewBoxHeight) => {
  if (nodeRings.length === 0) return [];
  const lastRadius = nodeRings[nodeRings.length - 1].radius;
  const gap = nodeRings.length > 1 ? (lastRadius - nodeRings[0].radius) / (nodeRings.length - 1) : lastRadius * 0.6;
  if (gap <= 0) return [lastRadius + lastRadius * 0.5];

  const cornerDistance = Math.sqrt(center.x * center.x + viewBoxHeight * viewBoxHeight);
  const maxRadius = cornerDistance * 1.2;

  const radii = [];
  let radius = lastRadius + gap;
  while (radius <= maxRadius && radii.length < DECORATIVE_ARC_MAX) {
    radii.push(radius);
    radius += gap;
  }
  if (radii.length < DECORATIVE_ARC_MIN) radii.push(lastRadius + gap);
  return radii;
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

// The sweep is one continuous, never-stopping, constant-speed rotation
// (a real radar rotates one direction forever, it doesn't ease in/out or
// pause) — see the rotation effect below. Angles here use the same "0deg
// = top, clockwise-positive" reference as the CSS conic-gradient that
// paints the beam (see .platform-sweep, Solution.css) and nodeBeta()
// below, which converts a node's own polar angle into that same frame so
// "the beam is currently over this node" can be detected with simple
// numeric comparisons.
const SWEEP_ROTATION_DURATION = 9;
const SWEEP_TRAIL_DEG = 30;
const NODE_REACTION_DURATION_MS = 320;

// The radar echo (see the pulse circle below): one soft wave, not an
// expanding ring — it briefly brightens just after leaving the hub, then
// spends the rest of its (slow, unhurried) travel simultaneously
// thinning (strokeWidth) and fading (opacity) toward nothing, so it
// reads as a wave dissipating into the distance rather than a shape
// growing outward at constant strength.
const PULSE_DURATION = 2.2;
const PULSE_TIMES = [0, 0.12, 1];
const PULSE_RADIUS_KEYFRAMES = [0, 0.32, 1]; // multiplied by pulseMaxRadius
const PULSE_OPACITY_KEYFRAMES = [0, 0.14, 0];
const PULSE_STROKE_KEYFRAMES = [0.9, 0.5, 0.03];

// Our node angles are expressed the usual math way (0deg = right, 90deg
// = top, counter-clockwise positive). The sweep instead rotates in the
// CSS/SVG convention (0deg = top, clockwise positive) because that's
// what a CSS conic-gradient and `transform: rotate()` both speak natively
// — this is the one, single conversion between the two, used both to
// paint the beam and to know when it's crossing a node.
const nodeBeta = (angleDeg) => (((90 - angleDeg) % 360) + 360) % 360;

// The radar's own "origin" — the angle its ring paths themselves start
// being drawn from (buildRingPath's `M` point, polar angle 180deg, the
// arc's far-left end) — expressed in the sweep's CSS-rotate frame via
// nodeBeta(180): 90-180 = -90, normalized to 270. The sweep's visible
// rotation is this constant plus whatever the underlying 0->360 tween
// reports (see rotateMV/the rotation effect below), so it always starts
// exactly here — never mid-sweep — the instant it becomes visible.
const SWEEP_START_OFFSET_DEG = 270;

// Did the sweep's angle pass through `target` between last frame (`prev`)
// and this one (`curr`)? Handles the one wraparound moment per
// revolution (curr < prev, i.e. the animation just looped back to 0)
// exactly like the continuous rotation it represents — the beam doesn't
// stop existing at the 360/0 seam, it just keeps going.
const angleCrossed = (prev, curr, target) => {
  if (curr >= prev) return target >= prev && target <= curr;
  return target >= prev || target <= curr;
};

const Solution = () => {
  const { t, i18n } = useTranslation();
  const tier = useRadarTier();
  const [hoveredNode, setHoveredNode] = useState(null);
  // Increments once per completed sweep revolution — the only React state
  // the whole radar-realism system touches per frame. The rotation itself
  // is a Motion value (see rotateMV below), which updates the DOM
  // directly and never goes through React at all; this counter only
  // changes roughly once every SWEEP_ROTATION_DURATION seconds, driving a
  // fresh `key` on the pulse circle so it replays (see render below).
  const [pulseCount, setPulseCount] = useState(0);
  // Starts at SWEEP_START_OFFSET_DEG, not 0 — the beam is invisible
  // (opacity: 0) until the rotation effect's delay elapses, but it still
  // renders at whatever rotation this holds the whole time; initializing
  // it to the sweep's real starting angle means there is never a single
  // frame where a 0deg (unrelated) rotation could show through.
  const rotateMV = useMotionValue(SWEEP_START_OFFSET_DEG);

  // DOM refs for each node's circle, populated as they mount, so the
  // sweep can flash one directly (classList) when it crosses it without
  // ever calling setState per node, per frame.
  const nodeCircleRefs = useRef(new Map());
  const sweepTimeoutsRef = useRef(new Map());
  // Always the latest `nodes` array (reassigned every render, below —
  // not read through the rotation effect's dependency array), so the
  // rotation effect's onUpdate never has to rely on whatever `nodes`
  // looked like back when the effect last happened to restart. Removes
  // any chance of the crossing-check working off a stale angle set.
  const nodesRef = useRef([]);

  const mapRef = useRef(null);
  const isMapInView = useInView(mapRef, { once: true, amount: 0.3 });

  // The map's real rendered (width, height) — the *only* source of truth
  // for the SVG's coordinate system (see viewBoxHeight below). Measuring
  // it directly, rather than trying to keep a CSS aspect-ratio and a
  // hand-picked viewBox in numeric agreement, is what guarantees a node's
  // icon center and its arc's centerline can never drift apart: there is
  // only one number, derived from the DOM itself.
  const [mapSize, setMapSize] = useState(null);

  // Document-relative pixel position of the radar origin (the map's own
  // bottom-center — see hubPortalPos usage below), measured alongside
  // mapSize from the exact same rect. This is what lets the hub render
  // through a portal (see the return statement) instead of as a normal
  // descendant here — see the note above the portal call for why that's
  // necessary.
  const [hubPortalPos, setHubPortalPos] = useState(null);

  useLayoutEffect(() => {
    const node = mapRef.current;
    if (!node) return undefined;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setMapSize({ width: rect.width, height: rect.height });
        setHubPortalPos({ x: rect.left + rect.width / 2 + window.scrollX, y: rect.bottom + window.scrollY });
      }
    };

    measure();

    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      // A translated header or language-dependent section above can move
      // the map without changing the map's own width or height. Observe
      // the ancestor chain so those layout shifts also refresh the portal.
      let current = node;
      while (current) {
        observer.observe(current);
        current = current.parentElement;
      }
    }

    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    document.fonts?.addEventListener?.("loadingdone", measure);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      document.fonts?.removeEventListener?.("loadingdone", measure);
    };
  }, [i18n.language]);

  // centerY == viewBoxHeight puts the radar origin exactly on the map's
  // real bottom edge — every ring, node, the hub, the sweep's origin and
  // the pulse's origin are all built from this exact point. Everything
  // drawn inside .platform-radar-clip (rings, nodes, the sweep, the
  // pulse) is clipped there, at that same edge, same as before. The hub
  // alone is exempt (see the portal at the end of the return statement,
  // and hubPortalPos above) — it's still centered on this exact same
  // point, just rendered through a portal so an ancestor several levels
  // up (HeroProblemScene's own `overflow: hidden`, which wraps Hero,
  // Problem AND Solution as one continuous scene and would otherwise crop
  // the hub exactly like it crops everything else) never gets a chance to
  // clip it. Before the first measurement lands, fall back to a plausible
  // ratio so nothing renders from a guess for more than a frame.
  const viewBoxHeight = mapSize ? (mapSize.height / mapSize.width) * 100 : 30;
  const center = { x: 50, y: viewBoxHeight };
  const rings = fitRings(tier.rings, viewBoxHeight, mapSize?.width ?? 0, tier.minInnerGap);
  const nodes = buildRadarNodes(center, rings);
  nodesRef.current = nodes;
  const decorativeArcs = buildDecorativeArcs(rings, center, viewBoxHeight);
  const viewBox = `0 0 100 ${viewBoxHeight}`;

  const arcsDrawEnd = ARC_DRAW_START + (rings.length - 1) * ARC_DRAW_RING_STEP + ARC_DRAW_DURATION;
  const nodesRevealStart = arcsDrawEnd + 0.1;
  const sweepStart = nodesRevealStart + nodes.length * NODE_REVEAL_STEP + 0.7;

  // How far out the pulse (and the sweep beam itself) reach — the
  // farthest decorative arc when there are any, otherwise the outermost
  // real ring — so both visibly "travel through all radar arcs" per the
  // spec, whatever that count happens to be on this viewport.
  const pulseMaxRadius = decorativeArcs.length > 0 ? decorativeArcs[decorativeArcs.length - 1] : rings[rings.length - 1].radius;
  // 1 viewBox unit == mapSize.width/100 px on both axes (see viewBoxHeight
  // above — it's derived to make that true), so this is the one place
  // that ever needs to turn a unit-radius into a real pixel size.
  const sweepDiameterPx = mapSize ? 2 * pulseMaxRadius * (mapSize.width / 100) : 0;

  // Briefly flashes one node's circle directly via the DOM (no React
  // state, no re-render) — see the rotation effect below, which calls
  // this the instant the beam's angle crosses that node's own angle.
  const triggerNodeReaction = (key) => {
    const el = nodeCircleRefs.current.get(key);
    if (!el) return;
    el.classList.add("is-swept");
    const pending = sweepTimeoutsRef.current.get(key);
    if (pending) window.clearTimeout(pending);
    const timeoutId = window.setTimeout(() => {
      el.classList.remove("is-swept");
      sweepTimeoutsRef.current.delete(key);
    }, NODE_REACTION_DURATION_MS);
    sweepTimeoutsRef.current.set(key, timeoutId);
  };

  // The radar sweep: one continuous, constant-speed, never-stopping
  // rotation (0deg -> 360deg internally, linear, repeating forever — a
  // real radar never eases or pauses between revolutions). Driven
  // entirely through a Motion value (rotateMV, bound to the beam's
  // `rotate` style below) so the rotation itself never touches React
  // state or triggers a re-render; onUpdate only does three
  // side-effecting things, none of them a setState per frame: it offsets
  // the raw 0->360 value by SWEEP_START_OFFSET_DEG before handing it to
  // rotateMV, so the beam's very first rendered frame is already at the
  // radar's real starting angle instead of mounting mid-rotation; it
  // checks each node's angle (in that same offset frame) against the
  // beam's for a brief DOM-only flash (triggerNodeReaction); and
  // onRepeat bumps pulseCount once per finished revolution to replay the
  // pulse ring.
  useEffect(() => {
    if (!isMapInView) return undefined;

    let previousVisualDeg = SWEEP_START_OFFSET_DEG;

    const controls = animate(0, 360, {
      duration: SWEEP_ROTATION_DURATION,
      delay: sweepStart,
      ease: "linear",
      repeat: Infinity,
      onRepeat: () => setPulseCount((count) => count + 1),
      onUpdate: (deg) => {
        const visualDeg = (deg + SWEEP_START_OFFSET_DEG) % 360;
        rotateMV.set(visualDeg);
        // Read nodesRef.current fresh every frame (not a snapshot taken
        // when this effect last started) — identical logic regardless of
        // how many nodes/rings exist, so tablet/laptop/desktop's 9 nodes
        // behave exactly like mobile's.
        nodesRef.current.forEach((node) => {
          if (angleCrossed(previousVisualDeg, visualDeg, nodeBeta(node.angle))) triggerNodeReaction(node.key);
        });
        previousVisualDeg = visualDeg;
      },
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapInView, tier.id]);

  return (
    <section className="solution-root" id="approach">
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
          where the next section begins. Everything here (rings, nodes,
          the sweep, the pulse) is cropped away past that edge — the hub
          is the one exception, and it isn't even rendered inside this
          div; see the portal at the end of this component's return. */}
      <div className="solution-map" ref={mapRef}>
        {/* Everything that must stay clipped at the section boundary —
            rings, nodes, the sweep, the pulse — lives inside this
            wrapper, which is what actually owns `overflow: hidden` (see
            .platform-radar-clip, Solution.css). */}
        <div className="platform-radar-clip">
        {/* Shares one fade mask between the decorative arcs and the sweep
            beam (see .platform-fade-layer, Solution.css) so the beam
            dissolves into the background exactly the same way the arcs
            already do, instead of getting hard-cut by
            .platform-radar-clip's overflow first. Nodes and the pulse are
            deliberately NOT inside this wrapper — nodes are real UI that
            should never fade, and the pulse has its own reasons to stay
            unmasked (see .platform-pulse-layer below). */}
        <div className="platform-fade-layer">
        <svg className="platform-radar" viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true">
          {decorativeArcs.map((radius, i) => (
            <motion.path
              key={`decorative-${i}`}
              d={buildRingPath(center, radius)}
              className="platform-ring platform-ring--decorative"
              initial={{ pathLength: 0, opacity: 0 }}
              // Fainter than the real rings (opacity 0.45 vs 1) so they
              // read as receding into the distance — set as the actual
              // animate target, not a CSS opacity override, since Motion
              // owns this element's `opacity` once it animates it at all.
              animate={isMapInView ? { pathLength: 1, opacity: 0.45 } : {}}
              transition={{
                duration: ARC_DRAW_DURATION,
                delay: ARC_DRAW_START + (rings.length + i) * ARC_DRAW_RING_STEP,
                ease: "easeInOut",
              }}
            />
          ))}

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
        </svg>

        {/* The rotating beam itself: a static conic-gradient wedge (see
            .platform-sweep, Solution.css) whose only animated properties
            are `opacity` (fades in once, see below) and `rotate` (bound
            directly to rotateMV — a Motion value, so the spin itself is a
            compositor-only GPU transform and never re-renders React).
            Anchored at the hub, same as .platform-hub, just with a
            dynamic pixel diameter (see sweepDiameterPx) since it isn't
            itself an SVG shape. Inside .platform-fade-layer (opened
            above), so it dissolves near the same edge the decorative
            arcs do — see that wrapper's own comment. */}
        {mapSize && (
          <motion.div
            className="platform-sweep"
            initial={{ opacity: 0 }}
            // Stays invisible for the whole intro reveal (arcs, nodes,
            // hub) and only fades in right as the rotation itself starts
            // (see sweepStart/the rotation effect) — so the beam never
            // sits there pre-rendered/frozen before the user has even
            // seen the radar finish appearing.
            animate={isMapInView ? { opacity: 1 } : {}}
            transition={{ delay: sweepStart, duration: 0.5, ease: "easeOut" }}
            style={{
              width: `${sweepDiameterPx}px`,
              height: `${sweepDiameterPx}px`,
              "--sweep-trail-deg": `${SWEEP_TRAIL_DEG}deg`,
              x: "-50%",
              y: "-50%",
              rotate: rotateMV,
            }}
          />
        )}
        </div>

        {/* The radar echo lives in its own, separate (unmasked) SVG layer
            — same viewBox/coordinate space as .platform-radar above, so
            cx/cy/r mean exactly the same thing in both, but this one
            deliberately has no top-fade mask. .platform-fade-layer's mask
            is tuned for the decorative arcs/sweep dissolving near the top
            edge; the pulse's radius routinely grows much larger than that
            (it's meant to travel through every decorative arc, per
            pulseMaxRadius), so sharing that mask made it fade to nothing
            almost immediately after leaving the hub on short/wide
            (desktop-ish) containers. This layer still gets a hard clip
            from .platform-radar-clip at the true edges, same as
            everything else — it just doesn't *also* fade early. */}
        <svg className="platform-pulse-layer" viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true">
          {/* One soft radar echo, replayed by remounting on every
              pulseCount bump (see the rotation effect) — starts at the
              hub, briefly brightens, then travels outward through every
              arc while simultaneously thinning and fading, so it reads
              as a wave dissipating into the distance rather than a shape
              expanding at constant strength. */}
          {isMapInView && pulseCount > 0 && (
            <motion.circle
              key={pulseCount}
              className="platform-pulse"
              cx={center.x}
              cy={center.y}
              initial={{ r: 0, opacity: 0, strokeWidth: PULSE_STROKE_KEYFRAMES[0] }}
              animate={{
                r: PULSE_RADIUS_KEYFRAMES.map((f) => f * pulseMaxRadius),
                opacity: PULSE_OPACITY_KEYFRAMES,
                strokeWidth: PULSE_STROKE_KEYFRAMES,
              }}
              transition={{ duration: PULSE_DURATION, ease: "easeOut", times: PULSE_TIMES }}
            />
          )}
        </svg>

        {nodes.map((node) => {
          const Icon = NODE_ICONS[node.key];
          const ringNodeIndex = rings[node.ringIndex].keys.indexOf(node.key);
          const priorRingNodes = rings.slice(0, node.ringIndex).reduce((sum, ring) => sum + ring.keys.length, 0);
          const revealIndex = priorRingNodes + ringNodeIndex;

          return (
            // Plain (non-motion) positioning wrapper: `top`/`left` +
            // `transform: translate(-50%, -50%)` are declared once in CSS
            // and never touched again, so nothing can override them. Its
            // own box is exactly the circle's box (the label is
            // `position: absolute`, out of flow), so that translate
            // centers the CIRCLE's own center on (node.x, node.y) — the
            // same point the arc itself is drawn through. The animated
            // scale/opacity live on the motion.span *inside*, which owns
            // its own independent transform and can't interfere with the
            // parent's static one.
            <div
              key={node.key}
              className="platform-node"
              style={{ "--node-x": `${node.x}%`, "--node-y": `${(node.y / viewBoxHeight) * 100}%` }}
              onMouseEnter={() => setHoveredNode(node.key)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <motion.span
                ref={(el) => {
                  if (el) nodeCircleRefs.current.set(node.key, el);
                  else nodeCircleRefs.current.delete(node.key);
                }}
                className={`platform-node-circle${hoveredNode === node.key ? " is-hovered" : ""}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={isMapInView ? { opacity: 1, scale: 1 } : {}}
                transition={{
                  duration: NODE_REVEAL_DURATION,
                  delay: nodesRevealStart + revealIndex * NODE_REVEAL_STEP,
                  ease: "easeOut",
                }}
              >
                <Icon aria-hidden="true" />
              </motion.span>
              <span className="platform-node-label">{t(`publicSolution.nodes.${node.key}`)}</span>
            </div>
          );
        })}
        </div>
      </div>

      {/* The hub is portaled straight to document.body instead of
          rendering here as a normal descendant. Reason: HeroProblemScene
          — the shared wrapper around Hero, Problem AND this section (see
          HeroProblemScene.css) — has its own `overflow: hidden`, an
          intentional, documented boundary that stops the whole scene
          (WebGL canvas included) from ever bleeding into whatever section
          comes next. The hub sits exactly on Solution's own bottom edge,
          which is also exactly HeroProblemScene's own bottom edge, so
          that outer overflow: hidden crops it too — no amount of z-index
          or restructuring *inside* Solution can escape an ancestor's own
          clip. A portal is the one way to keep the hub visually anchored
          to the same point (via hubPortalPos, measured from the same rect
          as mapSize, so it stays correct on scroll/resize with no extra
          tracking) while its DOM node lives entirely outside that
          ancestor's subtree. z-index keeps it above ordinary page content
          (Technology included) without approaching the site's real
          chrome — see --z-header/--z-dropdown/etc. in src/index.css. */}
      {typeof document !== "undefined" &&
        hubPortalPos &&
        createPortal(
          <div
            className="platform-hub"
            style={{ "--node-x": `${hubPortalPos.x}px`, "--node-y": `${hubPortalPos.y}px` }}
          >
            <motion.span
              className="platform-hub-circle"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={isMapInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: HUB_REVEAL_DURATION, ease: "easeOut" }}
            >
              <span className="platform-hub-mark">
                <BrandLogo className="platform-hub-mark-icon brand-logo-light" />
              </span>
            </motion.span>
            {/* Visible text label right below the mark already reads
                "KneeGuide" (publicSolution.center) — BrandLogo defaults to
                decorative (empty alt) precisely so this is the one place
                a screen reader announces the brand name, not twice. */}
            <span className="platform-hub-label">{t("publicSolution.center")}</span>
          </div>,
          document.body
        )}
    </section>
  );
};

export default Solution;
