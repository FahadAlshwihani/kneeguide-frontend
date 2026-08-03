import React, { useEffect, useRef, useState } from "react";
import PublicBackground from "../../../../components/public/backgrounds/PublicBackground";
import Hero from "../Hero";
import Problem from "../Problem";
import Solution from "../Solution";
import "./HeroProblemScene.css";

/**
 * Hero, Problem AND Solution share ONE continuous Beams canvas instead of
 * each rendering its own separate background — mounted exactly once here,
 * absolutely positioned behind all three sections' combined height, and
 * scrolling with the document exactly like the rest of the page (no
 * `position: sticky`/`fixed` anywhere in this wrapper — a sticky-canvas
 * version was tried for its performance benefit and reverted: it read as
 * a fixed/parallax background with content scrolling over it, which is
 * explicitly not the intended feel here. The background must move with
 * the page like a normal, continuous canvas; only its color treatment
 * changes while scrolling, never its position).
 *
 * Beams.jsx gets only a narrow, additive performance extension (see its
 * own file) — never touched for shader/geometry/visual-behavior reasons —
 * and PublicBackground (the existing wrapper around it) drives a DPR cap
 * and a pause-when-offscreen signal without changing its own rendered
 * appearance while visible or restarting its animation. Visibility is
 * tracked once, here, on the whole three-section wrapper via
 * IntersectionObserver + document.visibilityState, and passed down as a
 * plain `active` prop that only toggles the existing Canvas's `frameloop`
 * — pause/resume only, never a remount.
 *
 * The journey (see HeroProblemScene.css for the actual treatment layers)
 * is now anchored entirely to Problem's own vertical progress, not to the
 * Hero/Problem boundary:
 *   Hero      — fully cinematic, untouched down to the pixel.
 *   Problem   — starts looking identical to Hero's own ending state (so
 *               there is nothing to blend right at the boundary — both
 *               sides already match), then performs the entire dark ->
 *               warm-white transformation gradually across its own full
 *               height. The beams stay fully visible throughout, only
 *               recolored (`mix-blend-mode: exclusion`, never dimmed).
 *   Solution  — continues that same light/gray-beams look, then the
 *               beams themselves gradually fade beneath a solid
 *               warm-white cover, reaching a clean flat warm-white by
 *               its bottom edge (unchanged from before).
 *
 * Hero/Problem/Solution below render only their own foreground content;
 * none of them owns a background anymore.
 */
const HeroProblemScene = () => {
  const sceneRef = useRef(null);
  const [isSceneActive, setIsSceneActive] = useState(true);

  useEffect(() => {
    const node = sceneRef.current;
    if (!node) return undefined;

    // Two independent signals (intersection, tab visibility) combined
    // into one `active` boolean every time either one changes.
    let isIntersecting = true;
    const recompute = () => {
      setIsSceneActive(isIntersecting && document.visibilityState !== "hidden");
    };

    let observer;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          isIntersecting = entry.isIntersecting;
          recompute();
        },
        { rootMargin: "200px 0px" }
      );
      observer.observe(node);
    }

    document.addEventListener("visibilitychange", recompute);

    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", recompute);
    };
  }, []);

  return (
    <section className="hero-problem-scene" ref={sceneRef}>
      <div className="scene-background-layer" aria-hidden="true">
        <PublicBackground active={isSceneActive} />
      </div>

      <div className="scene-hero-vignette" aria-hidden="true" />
      <div className="scene-problem-dark-wash" aria-hidden="true" />
      <div className="scene-invert-lighten" aria-hidden="true" />
      <div className="scene-beam-fadeout" aria-hidden="true" />

      <Hero />
      <Problem />
      <Solution />
    </section>
  );
};

export default HeroProblemScene;
