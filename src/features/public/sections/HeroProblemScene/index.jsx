import React, { useEffect, useRef, useState } from "react";
import PublicBackground from "../../../../components/public/backgrounds/PublicBackground";
import Hero from "../Hero";
import Problem from "../Problem";
import Solution from "../Solution";
import "./HeroProblemScene.css";

/**
 * Hero, Problem AND Solution share ONE continuous Beams canvas instead of
 * each rendering its own separate background — mounted exactly once here.
 * Beams.jsx gets only a narrow, additive performance extension (see its
 * own file) — never touched for shader/geometry/visual-behavior reasons —
 * and PublicBackground (the existing wrapper around it) drives the DPR
 * cap without changing its own rendered appearance while visible.
 *
 * Canvas geometry (the actual performance fix): `.scene-background-layer`
 * is `position: absolute; inset: 0` — removed from normal flow entirely,
 * so it contributes no height of its own and can never push Hero/Problem/
 * Solution down the page. Its child, `.scene-background-sticky`, is the
 * one that's `position: sticky; height: 100svh` — nested *inside* that
 * already-out-of-flow box, so its own sticky behavior pins it to the
 * viewport for this wrapper's entire scroll range without ever occupying
 * flow space itself either. The result: the WebGL canvas only ever
 * renders at ~1 viewport size, for the whole Hero→Problem→Solution
 * scroll, instead of a framebuffer 3 sections tall. (An earlier attempt
 * made `.scene-background-layer` itself sticky — that's wrong: a sticky
 * element that IS a normal-flow child still occupies its own space in
 * that flow, which is exactly what pushed Hero down the page. The fix is
 * sticky-inside-absolute, not sticky alone.)
 *
 * Visibility is tracked once, here, on the whole three-section wrapper
 * (not narrower) via IntersectionObserver + document.visibilityState,
 * and passed down as a plain `active` prop — PublicBackground only ever
 * toggles the existing Canvas's `frameloop` prop in response (pause/
 * resume), it never remounts the Canvas or restarts the animation.
 *
 * The journey (see HeroProblemScene.css for the actual treatment layers):
 *   Hero      — fully cinematic, untouched down to the pixel.
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
        <div className="scene-background-sticky">
          <PublicBackground active={isSceneActive} />
        </div>
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
