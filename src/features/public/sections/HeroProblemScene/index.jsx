import React from "react";
import PublicBackground from "../../../../components/public/backgrounds/PublicBackground";
import Hero from "../Hero";
import Problem from "../Problem";
import Solution from "../Solution";
import "./HeroProblemScene.css";

/**
 * Hero, Problem AND Solution share ONE continuous Beams canvas instead of
 * each rendering its own separate background — mounted exactly once here,
 * absolutely positioned behind all three sections' combined height (this
 * geometry is deliberate and must not change to `position: sticky` — an
 * earlier attempt at that pushed Hero itself down the page, since sticky
 * elements still occupy their own space in normal flow, unlike absolute).
 * Beams.jsx gets only a narrow, additive performance extension (see its
 * own file) — never touched for shader/geometry/visual-behavior reasons —
 * and PublicBackground (the existing wrapper around it) drives that
 * extension (DPR cap + pause-when-offscreen) without changing its own
 * rendered appearance while visible.
 *
 * The journey (see HeroProblemScene.css for the actual layers):
 *   Hero      — fully cinematic, untouched (only its own original
 *               vignette covers it, extended a short, softly-masked
 *               distance past Hero's own edge for the Problem handoff —
 *               nothing else is allowed to overlap Hero's own height,
 *               which is what keeps its beams exactly as bright/sharp as
 *               before).
 *   Problem   — the same beams, still fully visible, gradually recolored
 *               (via `mix-blend-mode: exclusion`, not dimmed) from
 *               bright-on-black to soft-gray-on-warm-white across its
 *               whole height — its own ramp rises quickly over the first
 *               short stretch (overlapping the vignette's own fade-out)
 *               before settling into the slow climb for the rest of
 *               Problem.
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
      <div className="scene-invert-lighten" aria-hidden="true" />
      <div className="scene-beam-fadeout" aria-hidden="true" />

      <Hero />
      <Problem />
      <Solution />
    </section>
  );
};

export default HeroProblemScene;
