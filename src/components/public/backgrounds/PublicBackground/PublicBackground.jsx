import React, { useState, useEffect, useRef } from "react";
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
 * Two additional, narrow performance behaviors, both driven from here
 * rather than inside Beams.jsx itself (which only grew small, additive,
 * backward-compatible `dpr`/`frameloop` passthrough props for this — its
 * shader/geometry/animation are untouched, and its rendered appearance
 * while visible does not change):
 *   - `dpr` is capped well below Beams' own default (see above).
 *   - `frameloop` drops to "never" once this element has scrolled fully
 *     out of view (IntersectionObserver, with a 200px margin so it never
 *     visibly starts/stops right at the viewport edge), so the WebGL
 *     frame loop isn't running behind sections that don't use it.
 */
const PublicBackground = ({ className = "" }) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [dpr, setDpr] = useState(getResponsiveDpr);
  const rootRef = useRef(null);

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

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      rootMargin: "200px 0px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={`public-bg-root ${className}`.trim()} aria-hidden="true">
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
          frameloop={isVisible ? "always" : "never"}
        />
      )}
    </div>
  );
};

export default PublicBackground;
