import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { FaCube } from "react-icons/fa6";
import "./HeroVisual.css";

/**
 * Isolated placeholder for the Hero's visual slot.
 *
 * This is the ONLY file that should change when the real 3D model ships —
 * swap the contents of .hero-visual-stage for <KneeModelViewer /> and the
 * surrounding Hero layout (column widths, spacing) is untouched, since
 * Hero.jsx only ever renders <HeroVisual /> and never reaches inside it.
 *
 * Future formats this slot is designed to accept without a layout shift:
 *   - React Three Fiber GLB model (e.g. <KneeModelViewer />)
 *   - a PNG product shot
 *   - an SVG illustration
 */
const HeroVisual = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="hero-visual-root">
      <div className="hero-visual-glow" aria-hidden="true" />

      <div className="hero-visual-stage">
        <div className="hero-visual-pattern" aria-hidden="true" />

        <motion.div
          className="hero-visual-ring"
          aria-hidden="true"
          animate={prefersReducedMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />

        <div className="hero-visual-content">
          <span className="hero-visual-icon">
            <FaCube aria-hidden="true" />
          </span>
          <p className="hero-visual-label">3D Knee Model</p>
          <p className="hero-visual-sublabel">Interactive model loads here</p>
        </div>

        <span className="hero-visual-chip">Preview</span>
      </div>
    </div>
  );
};

export default HeroVisual;
