import React from "react";
import PublicBackground from "../../../../components/public/backgrounds/PublicBackground";
import Hero from "../Hero";
import Problem from "../Problem";
import "./HeroProblemScene.css";

/**
 * Hero and Problem share ONE continuous Beams canvas instead of each
 * rendering its own separate background — mounted exactly once here, at
 * the top of this wrapper, absolutely positioned behind both sections'
 * combined height. Beams.jsx/Beams.css are never touched, and
 * PublicBackground (the existing, already-generic wrapper around it) is
 * reused completely unmodified: its own percentage-based sizing already
 * scales correctly to whatever container holds it, so simply placing it
 * in this taller wrapper is enough to span both sections with no changes
 * to that component either.
 *
 * The dark-Hero → warm-white-Problem color shift is implemented entirely
 * as overlay layers on top of that one canvas (see HeroProblemScene.css)
 * — never by touching the canvas, restarting it, or mounting a second
 * instance. Hero and Problem below render only their own foreground
 * content; neither owns a background anymore.
 */
const HeroProblemScene = () => {
  return (
    <section className="hero-problem-scene">
      <div className="scene-beams-layer" aria-hidden="true">
        <PublicBackground />
      </div>

      <div className="scene-hero-vignette" aria-hidden="true" />
      <div className="scene-crossfade" aria-hidden="true" />
      <div className="scene-problem-glow" aria-hidden="true" />

      <Hero />
      <Problem />
    </section>
  );
};

export default HeroProblemScene;
