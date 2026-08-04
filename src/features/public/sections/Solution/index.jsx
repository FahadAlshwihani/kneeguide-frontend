import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useInView } from "motion/react";
import {
  FaCircleNodes,
  FaUser,
  FaUserDoctor,
  FaBrain,
  FaDumbbell,
  FaChartLine,
  FaFileLines,
  FaBell,
  FaStopwatch,
  FaPeopleGroup,
} from "react-icons/fa6";
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

// Full ring on desktop/tablet; mobile keeps the same "everything orbits
// KneeGuide" idea with fewer orbiting nodes (never a card grid) so labels
// stay legible at narrow widths.
const ALL_NODE_KEYS = ["patient", "clinician", "ai", "exercises", "progress", "reports", "notifications", "wearables", "family"];
const MOBILE_NODE_KEYS = ["patient", "clinician", "ai", "progress", "reports"];

// How far from center each node sits, as a percent of the (always-square)
// map. A single named constant, not a value repeated/guessed per node —
// every node's actual position is *derived* from it plus its index below.
const NODE_RADIUS_PERCENT = 38;
const MOBILE_MAX_WIDTH = 640;

// Choreography constants (seconds) — named so the sequence in the JSX
// below reads as "center, then rings, then lines, then pulse" rather than
// a wall of unexplained numbers.
const CENTER_REVEAL_DURATION = 0.6;
const NODE_REVEAL_DURATION = 0.5;
const NODE_REVEAL_START = 0.45;
const NODE_REVEAL_STEP = 0.08;
const PATH_DRAW_DURATION = 0.7;
const PATH_DRAW_STEP = 0.08;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < MOBILE_MAX_WIDTH : false));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_MAX_WIDTH);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

// Even angular distribution starting at the top, going clockwise —
// exactly the same formula every node uses, so the ring is always evenly
// spaced regardless of how many nodes are actually showing.
const buildNodePositions = (keys) =>
  keys.map((key, index) => {
    const angle = (index / keys.length) * 2 * Math.PI - Math.PI / 2;
    return {
      key,
      x: 50 + NODE_RADIUS_PERCENT * Math.cos(angle),
      y: 50 + NODE_RADIUS_PERCENT * Math.sin(angle),
    };
  });

// A gentle quadratic curve from the center to a node instead of a
// straight line — the control point is offset perpendicular to the
// center->node direction, so every connection bows the same visual
// amount regardless of which direction it points in.
const buildConnectionPath = (x, y) => {
  const dx = x - 50;
  const dy = y - 50;
  const length = Math.hypot(dx, dy) || 1;
  const bow = 5;
  const controlX = (50 + x) / 2 + (-dy / length) * bow;
  const controlY = (50 + y) / 2 + (dx / length) * bow;
  return `M 50 50 Q ${controlX} ${controlY} ${x} ${y}`;
};

const Solution = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [hoveredNode, setHoveredNode] = useState(null);

  const mapRef = useRef(null);
  const isMapInView = useInView(mapRef, { once: true, amount: 0.3 });

  const nodeKeys = isMobile ? MOBILE_NODE_KEYS : ALL_NODE_KEYS;
  const nodes = buildNodePositions(nodeKeys);

  // Once the whole reveal sequence has visually settled, the center node
  // starts a slow, looping "pulse" ring to read as live/connected rather
  // than a static illustration — computed from the same choreography
  // constants above instead of a separate guessed number.
  const pulseStart =
    NODE_REVEAL_START + nodeKeys.length * NODE_REVEAL_STEP + PATH_DRAW_DURATION + 0.4;

  return (
    <section className="solution-root">
      <div className="solution-container">
        <Reveal className="solution-header">
          <span className="solution-badge">{t("publicSolution.badge")}</span>
          <h2 className="solution-title">{t("publicSolution.title")}</h2>
          <p className="solution-description">{t("publicSolution.description")}</p>
        </Reveal>

        <div className="solution-map" ref={mapRef}>
          <svg className="platform-lines" viewBox="0 0 100 100" aria-hidden="true">
            {nodes.map((node, index) => (
              <motion.path
                key={node.key}
                d={buildConnectionPath(node.x, node.y)}
                className={`platform-path${hoveredNode === node.key ? " is-active" : ""}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isMapInView ? { pathLength: 1, opacity: 1 } : {}}
                transition={{
                  duration: PATH_DRAW_DURATION,
                  delay: NODE_REVEAL_START + nodeKeys.length * NODE_REVEAL_STEP + index * PATH_DRAW_STEP * 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}
          </svg>

          <motion.div
            className="platform-node platform-node--center"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={isMapInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: CENTER_REVEAL_DURATION, ease: "easeOut" }}
          >
            <motion.span
              className="platform-node-pulse"
              initial={false}
              animate={
                isMapInView
                  ? { opacity: [0, 0.45, 0], scale: [1, 1.7, 2] }
                  : { opacity: 0 }
              }
              transition={{
                duration: 2.2,
                repeat: Infinity,
                repeatDelay: 1.8,
                delay: pulseStart,
                ease: "easeOut",
              }}
              aria-hidden="true"
            />
            <span className="platform-node-circle">
              <FaCircleNodes aria-hidden="true" />
            </span>
            <span className="platform-node-label">{t("publicSolution.center")}</span>
          </motion.div>

          {nodes.map((node, index) => {
            const Icon = NODE_ICONS[node.key];
            return (
              <motion.div
                key={node.key}
                className={`platform-node${hoveredNode === node.key ? " is-hovered" : ""}`}
                style={{ "--node-x": `${node.x}%`, "--node-y": `${node.y}%` }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={isMapInView ? { opacity: 1, scale: 1 } : {}}
                transition={{
                  duration: NODE_REVEAL_DURATION,
                  delay: NODE_REVEAL_START + index * NODE_REVEAL_STEP,
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
        </div>
      </div>
    </section>
  );
};

export default Solution;
