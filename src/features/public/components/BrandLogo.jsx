import React from "react";
import KneeGuideLogo from "../../../assets/images/logo/KneeGuideLogo.svg";
import "./BrandLogo.css";

/**
 * The one canonical KneeGuide brand mark for the public site — a single
 * `<img>` pointed at the real asset (src/assets/images/logo/
 * KneeGuideLogo.svg), never re-created in CSS/text. KneeGuideLogo.svg is
 * icon-only (a stylized knee-joint mark, no wordmark baked into the
 * artwork), so every call site keeps its own visible "KneeGuide" text
 * next to this — `decorative` (default true) is what keeps the icon out
 * of the accessibility tree in that case, so screen readers announce the
 * brand name once, from the visible text, not twice.
 *
 * Sizing is deliberately not a prop: each call site defines its own
 * width/height via `className` (matching whatever footprint the fake
 * mark it replaced already had — see Header.css/Footer.css/Solution.css),
 * and this component only ever contributes `object-fit: contain` +
 * `display: block` so the artwork's own aspect ratio is preserved
 * regardless of the box it's given.
 */
const BrandLogo = ({ className = "", decorative = true }) => (
  <img
    src={KneeGuideLogo}
    alt={decorative ? "" : "KneeGuide"}
    className={`brand-logo${className ? ` ${className}` : ""}`}
    draggable={false}
  />
);

export default BrandLogo;
