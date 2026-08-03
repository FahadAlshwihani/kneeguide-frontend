import React, { useState, useEffect } from "react";
import Beams from "./Beams";
import "./PublicBackground.css";

// Caps render resolution well below Beams' own [1, 2] default — same
// shader/beam-count/animation, just fewer pixels to shade each frame.
// Mobile gets the flat floor (1x); larger screens still get a mild boost
// over 1x but never the full native DPR some displays report.
const getResponsiveDpr = () => {
  if (typeof window === "undefined") return 1;
  if (window.innerWidth < 768) return 1;
  return Math.min(window.devicePixelRatio || 1, 1.25);
};

/**
 * Shared, reusable Hero background: React Bits' Beams (Three.js), used
 * unmodified — only its props are set at the call site, never its internals.
 *
 *   <section style={{ position: "relative" }}>
 *     <PublicBackground />
 *     <div style={{ position: "relative", zIndex: 1 }}>...content...</div>
 *   </section>
 *
 * Purely decorative — non-interactive content should never depend on it,
 * and it never intercepts clicks (pointer-events: none throughout). Skips
 * the animated canvas entirely for prefers-reduced-motion.
 *
 * `active` (default `true`) is an external pause/resume signal — the
 * caller decides *when* (e.g. HeroProblemScene observes its own, wider
 * wrapper via IntersectionObserver + document.visibilityState and passes
 * the combined result down), this component just forwards it to Beams'
 * `frameloop` prop. Toggling it never remounts the Canvas or resets the
 * animation, it only starts/stops the frame loop on the same instance.
 * `dpr` is capped well below Beams' own default here (see above) — both
 * are small, additive, backward-compatible passthrough props on Beams.jsx
 * itself; its shader/geometry/animation are untouched, and its rendered
 * appearance while visible does not change.
 */
const PublicBackground = ({ className = "", active = true }) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [dpr, setDpr] = useState(getResponsiveDpr);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const handleResize = () => setDpr(getResponsiveDpr());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={`public-bg-root ${className}`.trim()} aria-hidden="true">
      {reducedMotion ? (
        <div className="public-bg-static-fallback" />
      ) : (
        <Beams
          beamWidth={3}
          beamHeight={30}
          beamNumber={20}
          lightColor="#ffffff"
          speed={2}
          noiseIntensity={1.75}
          scale={0.2}
          rotation={20}
          dpr={dpr}
          frameloop={active ? "always" : "never"}
        />
      )}
    </div>
  );
};

export default PublicBackground;
