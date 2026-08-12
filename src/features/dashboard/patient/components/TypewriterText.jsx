import React, { useEffect, useMemo, useState } from "react";
import "./TypewriterText.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Grapheme-aware, not code-point-naive `Array.from` alone — Arabic
// diacritics (harakat) are combining marks that can occupy their own
// code point, and revealing them mid-animation separately from their
// base letter would visibly flash the wrong shape for a frame.
// `Intl.Segmenter` (grapheme granularity) is the correct primitive for
// this and has solid modern-browser support; `Array.from` remains as a
// fallback for the rare browser without it — still correct for the vast
// majority of real text, just not maximally precise for combining marks.
const segmentGraphemes = (str) => {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(str), (s) => s.segment);
  }
  return Array.from(str);
};

/**
 * Restrained typewriter primitive — reveals `text` grapheme-by-grapheme.
 * Deliberately plain React state (`useState`/`useEffect`/`setInterval`),
 * never Motion — this must never depend on an ancestor's inherited Motion
 * variant lifecycle (the exact bug class that once left Auth route content
 * stuck at opacity:0). RTL-safe by construction: it only ever reveals an
 * increasing PREFIXES of the already-correctly-ordered translated string
 * and never reverses/re-orders characters itself — the browser's own bidi
 * rendering handles Arabic shaping/direction for whatever prefix is
 * currently visible, exactly as it would for the complete string.
 *
 * Renders the complete `text` twice: once as the animated, `aria-hidden`
 * visual, and once in a screen-reader-only element with the full text
 * available immediately — so assistive tech never receives a stream of
 * per-character DOM mutations, matching the "no noisy typewriter
 * announcements" requirement without losing the message itself.
 *
 * `visuallyHiddenClassName` defaults to `"patient-visually-hidden"`
 * (unchanged from before this prop existed — every existing Patient call
 * site keeps working identically) — the class that actually hides that
 * span is scoped to `.patient-shell` (patientTokens.css), so a consumer
 * OUTSIDE that scope (e.g. Doctor Home, which reuses this otherwise fully
 * generic component) must pass its own equivalent utility class instead of
 * silently rendering visible duplicate text.
 */
const TypewriterText = ({ text, as: Tag = "p", className = "", speed = 26, onComplete, dir, visuallyHiddenClassName = "patient-visually-hidden" }) => {
  const graphemes = useMemo(() => segmentGraphemes(text), [text]);
  const reducedMotion = prefersReducedMotion();

  const [visibleCount, setVisibleCount] = useState(reducedMotion ? graphemes.length : 0);
  const [done, setDone] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setVisibleCount(graphemes.length);
      setDone(true);
      onComplete?.();
      return undefined;
    }

    setVisibleCount(0);
    setDone(false);

    let index = 0;
    const id = setInterval(() => {
      index += 1;
      setVisibleCount(index);
      if (index >= graphemes.length) {
        clearInterval(id);
        setDone(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphemes, reducedMotion, speed]);

  const visibleText = graphemes.slice(0, visibleCount).join("");

  return (
    <Tag className={`typewriter-text ${className}`.trim()} dir={dir}>
      <span aria-hidden="true">
        {visibleText}
        {!done && <span className="typewriter-cursor" />}
      </span>
      <span className={visuallyHiddenClassName}>{text}</span>
    </Tag>
  );
};

export default TypewriterText;
