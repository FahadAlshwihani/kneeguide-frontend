import React, { useState, useEffect } from "react";
import Beams from "./Beams";
import "./PublicBackground.css";

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
 */
const PublicBackground = ({ className = "" }) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <div className={`public-bg-root ${className}`.trim()} aria-hidden="true">
      {reducedMotion ? (
        <div className="public-bg-static-fallback" />
      ) : (
        <Beams
          beamWidth={2}
          beamHeight={15}
          beamNumber={12}
          lightColor="#ffffff"
          speed={2}
          noiseIntensity={1.75}
          scale={0.2}
          rotation={0}
        />
      )}
    </div>
  );
};

export default PublicBackground;
