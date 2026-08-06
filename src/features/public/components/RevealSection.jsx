import React from "react";
import { useSectionReveal } from "./useSectionReveal";
import "./RevealSection.css";

/**
 * The standard reveal wrapper for the homepage — controls only the
 * wrapped container's own opacity/blur/translateY, via the shared
 * IntersectionObserver in useSectionReveal.js. Sections that already run
 * their own interactive animation (ScrollStack's stacking, the dashboard
 * mock cards' idle loops, etc.) keep doing exactly that inside here
 * untouched — this component never reaches into a section's own
 * internals, it only toggles a class on the element it wraps.
 *
 * Repeatable by default (fades back out on scroll-past, back in on
 * re-entry) — pass `once` for the traditional reveal-and-stay behavior.
 */
const RevealSection = ({
  as = "div",
  className = "",
  delay = 0,
  once = false,
  threshold,
  rootMargin,
  children,
  ...rest
}) => {
  const Tag = as;
  const { ref, isVisible } = useSectionReveal({ once, threshold, rootMargin });

  return (
    <Tag
      ref={ref}
      className={`reveal-section${isVisible ? " reveal-section-visible" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default RevealSection;
