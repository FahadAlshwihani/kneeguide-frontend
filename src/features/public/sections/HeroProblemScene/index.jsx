import React, { useEffect, useRef, useState } from "react";
import Hero from "../Hero";
import Problem from "../Problem";
import Solution from "../Solution";
import "./HeroProblemScene.css";

/**
 * Hero, Problem AND Solution no longer render their own background at
 * all — the single, page-wide Grainient canvas (mounted once in
 * PublicLayout, behind the entire homepage including this scene) shows
 * straight through, since nothing in this wrapper sets an opaque
 * background of its own. This scene used to mount its own separate Beams
 * (Three.js) canvas here and coordinate pausing it against Grainient
 * elsewhere on the page; that second rendering engine — and the
 * cross-component visibility coordination it required — has been removed
 * in favor of one shared engine for the whole page. Grainient itself
 * eases its palette from a Beams-derived "hero" tone toward its existing
 * main palette as the user scrolls past `.scene-light-phase` below (see
 * Grainient.jsx's `regionBoundarySelector` and the color props passed to
 * it in PublicLayout.jsx) — this component doesn't need to know that's
 * happening.
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
 * none of them owns a background.
 */
const HeroProblemScene = () => {
  const problemMeasureRef = useRef(null);
  const [problemRealHeight, setProblemRealHeight] = useState(null);

  useEffect(() => {
    const node = problemMeasureRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setProblemRealHeight(entry.contentRect.height);
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const sceneStyle = problemRealHeight
    ? { "--problem-real-h": `${problemRealHeight}px` }
    : undefined;

  return (
    <section className="hero-problem-scene" style={sceneStyle}>
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
