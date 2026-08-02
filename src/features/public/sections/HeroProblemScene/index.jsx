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
 * instance. Hero stays fully cinematic through its own height AND
 * roughly the first half of Problem (the shift only actually starts deep
 * inside Problem, not at the seam) via a warm-white layer blended with
 * `mix-blend-mode: exclusion` — that inverts the beams' own brightness
 * rather than just dimming them, which is how they stay visible as soft
 * gray shapes on the light background instead of fading to nothing.
 * Hero and Problem below render only their own foreground content;
 * neither owns a background anymore.
 */
const HeroProblemScene = () => {
  return (
    <section className="hero-problem-scene">
      <div className="scene-beams-layer" aria-hidden="true">
        <PublicBackground />
      </div>

      <div className="scene-hero-vignette" aria-hidden="true" />
      <div className="scene-dark-continuation" aria-hidden="true" />
      <div className="scene-invert-lighten" aria-hidden="true" />

      <Hero />
      <Problem />
    </section>
  );
};

export default HeroProblemScene;
