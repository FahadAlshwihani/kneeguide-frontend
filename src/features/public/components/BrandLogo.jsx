import React from "react";
import "./BrandLogo.css";

/**
 * The one canonical KneeGuide brand mark for the public site — the real
 * asset (src/assets/images/logo/KneeGuideLogo.svg), never re-created in
 * CSS/text. Rendered as a CSS background-image (see BrandLogo.css)
 * rather than `<img src={...}>`: this file embeds Canva/C2PA content-
 * provenance metadata containing namespaced XML tags (e.g.
 * `<c2pa:manifest>`), which is valid SVG but not valid JSX — CRA's
 * webpack config routes every `.svg` imported from a .js/.jsx file
 * through `@svgr/webpack` unconditionally (there's no query-string way to
 * opt out of it), and that JSX-parsing step fails on this specific file.
 * A CSS `url()` reference never goes through that JS-only loader rule, so
 * it loads the exact same file without needing to touch the asset itself.
 *
 * KneeGuideLogo.svg is icon-only (a stylized knee-joint mark, no
 * wordmark baked into the artwork), so every call site keeps its own
 * visible "KneeGuide" text next to this — `decorative` (default true) is
 * what keeps the icon out of the accessibility tree in that case, so
 * screen readers announce the brand name once, from the visible text,
 * not twice.
 *
 * Sizing is deliberately not a prop: each call site defines its own
 * width/height via `className` (matching whatever footprint the fake
 * mark it replaced already had — see Header.css/Footer.css/Solution.css),
 * and this component only ever contributes the background-image itself
 * plus `background-size: contain` so the artwork's own aspect ratio is
 * preserved regardless of the box it's given.
 */
const BrandLogo = ({ className = "", decorative = true }) => (
  <span
    className={`brand-logo${className ? ` ${className}` : ""}`}
    role={decorative ? undefined : "img"}
    aria-label={decorative ? undefined : "KneeGuide"}
    aria-hidden={decorative ? true : undefined}
  />
);

export default BrandLogo;
