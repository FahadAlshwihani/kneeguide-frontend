import React, { useState, useEffect } from "react";
import Beams from "./Beams";
import { getDprForTier, getPerformanceTier, subscribePerformanceTier } from "../../../../features/public/performance/performanceTier";
import "./PublicBackground.css";

// Beams' own cap table — deliberately more conservative than the shared
// default (see performanceTier.js's DEFAULT_DPR_CAPS): it's a full-screen
// 3D shader, heavier per pixel than Grainient's 2D fragment shader, so even
// the "high" tier stays at 1.25x, not 2x. Sharing the tier *classification*
// (not the DPR numbers) is what keeps device detection centralized without
// forcing every renderer onto the same ceiling.
const BEAMS_DPR_CAPS = { high: 1.25, medium: 1, low: 0.75 };

// Mobile gets the flat floor (1x) regardless of tier — same behavior this
// had before tiering existed. Larger screens get the tier-appropriate cap.
const getResponsiveDpr = (tier) => {
  if (typeof window === "undefined") return 1;
  if (window.innerWidth < 768) return 1;
  return getDprForTier(tier, BEAMS_DPR_CAPS);
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
  const [dpr, setDpr] = useState(() => getResponsiveDpr(getPerformanceTier()));

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const handleResize = () => setDpr(getResponsiveDpr(getPerformanceTier()));
    window.addEventListener("resize", handleResize);
    // Downgrade-only, at most once per session — see performanceTier.js.
    // Beams' own frameloop re-renders at the new DPR on its next frame; no
    // canvas/context recreation happens here.
    const unsubscribeTier = subscribePerformanceTier((tier) => setDpr(getResponsiveDpr(tier)));
    return () => {
      window.removeEventListener("resize", handleResize);
      unsubscribeTier();
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || typeof window === "undefined") return undefined;
    window.__KG_PERF__ = window.__KG_PERF__ || {};
    window.__KG_PERF__.beamsActive = active && !reducedMotion;
    return undefined;
  }, [active, reducedMotion]);

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
          cameraZoom={1.46}
          cameraY={0.22}
          dpr={dpr}
          frameloop={active ? "always" : "never"}
        />
      )}
    </div>
  );
};

export default PublicBackground;
