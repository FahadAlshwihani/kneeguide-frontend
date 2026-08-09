import React from "react";
import KneeGuideLogo from "../../../assets/images/logo/KneeGuideLogo1024.png";
import "./BrandLogo.css";

/**
 * The one canonical KneeGuide brand mark for the public site — a real
 * `<img>` now that the source is a clean, dedicated PNG export
 * (src/assets/images/logo/KneeGuideLogo1024.png), not a Canva SVG with
 * embedded C2PA metadata that broke CRA's SVGR loader. That's what forced
 * the previous CSS background-image/mask-image workaround (see git
 * history on BrandLogo.css) — a normal image import needs none of it.
 *
 * The artwork is icon-only (no wordmark baked in), so every call site
 * keeps its own visible "KneeGuide" text next to this — `decorative`
 * (default true) is what keeps the icon out of the accessibility tree in
 * that case, so screen readers announce the brand name once, from the
 * visible text, not twice.
 *
 * Sizing is deliberately not a prop: each call site defines its own
 * width/height via `className` (Header.css/Footer.css/Solution.css),
 * applied directly to this same <img> element.
 */
const BrandLogo = ({ className = "", decorative = true }) => (
  <img
    src={KneeGuideLogo}
    className={`brand-logo${className ? ` ${className}` : ""}`}
    alt={decorative ? "" : "KneeGuide"}
    aria-hidden={decorative ? "true" : undefined}
  />
);

export default BrandLogo;
