import React from "react";
import PublicBackground from "../../../../components/public/backgrounds/PublicBackground";
import Hero from "../Hero";
import Problem from "../Problem";
import Solution from "../Solution";
import "./HeroProblemScene.css";

/**
 * Hero, Problem AND Solution share ONE continuous Beams canvas instead of
 * each rendering its own separate background — mounted exactly once here.
 * Beams.jsx/Beams.css are never touched, and PublicBackground (the
 * existing, already-generic wrapper around it) is reused completely
 * unmodified.
 *
 * Performance note: the canvas is NOT rendered at the full 3-section
 * height. `.scene-beams-layer` is `position: sticky`, pinned to the
 * viewport for as long as this wrapper is being scrolled through, so the
 * actual WebGL scene only ever renders at ~1 viewport size regardless of
 * how tall the combined journey is — rendering an animated canvas 3x
 * larger than what's ever visible at once would cost 3x the GPU work for
 * zero visual benefit. The illusion of a continuous, gradually-changing
 * background comes from the *treatment* layers below instead: those stay
 * in normal document flow (tall, scrolling normally, but just static CSS
 * gradients/blend — cheap to paint), so different slices of them align
 * with the fixed canvas as the user scrolls past.
 *
 * The journey (see HeroProblemScene.css for the actual layers):
 *   Hero      — fully cinematic, untouched (only its own original
 *               vignette covers it — nothing else is allowed to overlap
 *               that zone, which is what keeps its beams exactly as
 *               bright/sharp as before).
 *   Problem   — the same beams, still fully visible, gradually recolored
 *               (via `mix-blend-mode: exclusion`, not dimmed) from
 *               bright-on-black to soft-gray-on-warm-white across its
 *               whole height.
 *   Solution  — continues that same light/gray-beams look, then the
 *               beams themselves gradually fade beneath a solid
 *               warm-white cover, reaching a clean flat warm-white by
 *               its bottom edge.
 *
 * Hero/Problem/Solution below render only their own foreground content;
 * none of them owns a background anymore.
 */
const HeroProblemScene = () => {
  return (
    <section className="hero-problem-scene">
      <div className="scene-beams-layer" aria-hidden="true">
        <PublicBackground />
      </div>

      <div className="scene-hero-vignette" aria-hidden="true" />
      <div className="scene-seam-bridge" aria-hidden="true" />
      <div className="scene-invert-lighten" aria-hidden="true" />
      <div className="scene-beam-fadeout" aria-hidden="true" />

      <Hero />
      <Problem />
      <Solution />
    </section>
  );
};

export default HeroProblemScene;
