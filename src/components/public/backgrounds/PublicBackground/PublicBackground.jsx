import React, { useState, useEffect } from "react";
import Beams from "./Beams";
import "./PublicBackground.css";

/**
 * Shared, reusable Hero background: React Bits' Beams (Three.js), recolored
 * to the dashboard's own navy/blue palette — no new colors introduced (see
 * Beams.jsx for the two hardcoded tones changed from the demo's black).
 * Tuned specifically for KneeGuide: slow, quiet, low-noise — a texture to
 * notice subconsciously, not a foreground effect.
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
          beamWidth={1.8}
          beamHeight={32}
          beamNumber={8}
          lightColor="#ffffff"
          speed={0.4}
          noiseIntensity={0.6}
          scale={0.15}
          rotation={18}
        />
      )}
    </div>
  );
};

export default PublicBackground;
