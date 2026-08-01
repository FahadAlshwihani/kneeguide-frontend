import React, { useState, useEffect } from "react";
import Beams from "./Beams";
import "./PublicBackground.css";

/**
 * Shared, reusable Hero background: React Bits' Beams (Three.js), matching
 * the official demo's grayscale look (dark beams, white light) rather than
 * a reinterpretation — the only change is swapping the demo's pure black
 * for the site's own near-black token. Wide, few, well-spaced beams plus a
 * CSS blur keep it cinematic rather than a tiled/repetitive pattern.
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
          beamWidth={3}
          beamHeight={45}
          beamNumber={4}
          beamSpacing={6}
          lightColor="#ffffff"
          lightIntensity={0.7}
          ambientIntensity={0.4}
          speed={0.5}
          noiseIntensity={0.6}
          scale={0.2}
          rotation={0}
        />
      )}
    </div>
  );
};

export default PublicBackground;
