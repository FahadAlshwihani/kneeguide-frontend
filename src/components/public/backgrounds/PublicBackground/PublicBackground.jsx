import React from "react";
import DotGrid from "./DotGrid";
import "./PublicBackground.css";

/**
 * Shared, reusable public-site background: a soft gradient wash beneath a
 * subtle DotGrid texture (React Bits, recolored to the dashboard's own
 * design tokens — no new colors introduced). Meant to sit behind a
 * section's content as an absolutely-positioned backdrop:
 *
 *   <section style={{ position: "relative" }}>
 *     <PublicBackground />
 *     <div style={{ position: "relative", zIndex: 1 }}>...content...</div>
 *   </section>
 *
 * Purely decorative — non-interactive content should never depend on it,
 * and it never intercepts clicks (pointer-events: none throughout).
 */
const PublicBackground = ({ className = "" }) => {
  return (
    <div className={`public-bg-root ${className}`.trim()} aria-hidden="true">
      {/* Dots sit behind the gradient wash — a texture to notice
          subconsciously, not a foreground effect. */}
      <DotGrid
        className="public-bg-dotgrid"
        dotSize={2.5}
        gap={30}
        baseColor="#1e293b"
        activeColor="#2563eb"
        proximity={100}
        shockRadius={140}
        shockStrength={1.5}
        resistance={750}
        returnDuration={1.5}
      />
      <div className="public-bg-wash" />
    </div>
  );
};

export default PublicBackground;
