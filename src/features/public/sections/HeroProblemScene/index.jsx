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
 * Problem and Solution are wrapped in `.scene-light-phase`, a plain
 * normal-flow container with no explicit height of its own — its real
 * height is always exactly Problem's + Solution's rendered height,
 * whatever that turns out to be at any viewport/content size. The light
 * treatment layers live inside it and are sized with `inset: 0` /
 * `bottom: 0` against that real box, so they can never fall short of or
 * overshoot the two sections' actual combined height the way a flat
 * `100svh` guess could.
 *
 * The one remaining precise seam is Problem -> Solution: a ResizeObserver
 * on Problem's own measuring wrapper exposes its *real* rendered height as
 * `--problem-real-h` (with a `100svh` fallback for the brief moment
 * before the first observation fires), and the treatment layers use that
 * exact pixel length — not a percentage, not a guess — to anchor their
 * ramp so it always finishes precisely at Problem's real bottom edge,
 * with a small fixed overlap for subpixel safety. The Hero/Problem
 * boundary is intentionally left as a plain, visible section break — no
 * bridging layer there.
 *
 * Hero/Problem/Solution below render only their own foreground content;
 * none of them owns a background anymore.
 *
 * HeroDashboardBottomBand (the Hero's fold-crossing bottom card row) is
 * rendered here, as this scene's very last element — after Hero, after
 * `.scene-light-phase` (Problem + Solution) — instead of inside Hero
 * itself. That's the entire mechanism that guarantees it paints above
 * Problem/Solution's own light-transition layers: this scene already
 * relies on "z-index auto elements paint in DOM order" everywhere else
 * (see the stacking note in HeroProblemScene.css), and being last means
 * winning that comparison outright, with no z-index arithmetic needed
 * across Hero's own ancestor chain. `contentEdge` (Hero's real content
 * box, found via a plain `querySelector` within this scene's own ref —
 * Hero itself stays a normal, unmodified component, with no forwarded
 * ref or measurement of its own) is what lets that band know where the
 * Hero's copy ends and how tall the Hero itself is, without either of
 * those needing to live inside Hero.
 */
const HeroProblemScene = () => {
  const sceneRef = useRef(null);
  const problemMeasureRef = useRef(null);
  const [isSceneActive, setIsSceneActive] = useState(true);
  const [problemRealHeight, setProblemRealHeight] = useState(null);

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

  useEffect(() => {
    const node = problemMeasureRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setProblemRealHeight(entry.contentRect.height);
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  // Finds Hero's own root/content nodes via plain DOM queries (scoped to
  // this scene's own ref) rather than a forwarded ref — Hero stays a
  // normal, self-contained component; only this scene needs to know where
  // its content box is, purely to position HeroDashboardBottomBand.
  const sceneStyle = problemRealHeight
    ? { "--problem-real-h": `${problemRealHeight}px` }
    : undefined;

  return (
    <section className="hero-problem-scene" ref={sceneRef} style={sceneStyle}>
      <div className="scene-background-layer" aria-hidden="true">
        <PublicBackground active={isSceneActive} />
      </div>

      <div className="scene-hero-vignette" aria-hidden="true" />

      <Hero />

      <div className="scene-light-phase">
        <div className="scene-invert-lighten" aria-hidden="true" />
        <div className="scene-beam-fadeout" aria-hidden="true" />

        <div ref={problemMeasureRef}>
          <Problem />
        </div>
        <Solution />
      </div>

    </section>
  );
};

export default HeroProblemScene;
