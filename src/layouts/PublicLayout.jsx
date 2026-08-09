import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../features/public/components/Header";
import Footer from "../features/public/components/Footer";
import Grainient from "../features/public/components/Grainient";
import { initPerformanceTier } from "../features/public/performance/performanceTier";
import "./SiteBackground.css";

// Mirrors the approved brand tokens in index.css — the main palette, used
// from ScrollStackFeature down through Footer, and (via the blend below)
// what the former Beams region eases into as the user scrolls past it.
const GRAINIENT_COLOR_1 = "#2563EB";
const GRAINIENT_COLOR_2 = "#050505";
const GRAINIENT_COLOR_3 = "#1D4ED8";

// The former Beams scene's own actual colors — not approximated, not
// invented. Beams.jsx (now removed) rendered a pure black R3F scene
// background (`<color attach="background" args={['#000000']} />`) lit by
// white beams (`lightColor="#ffffff"`, also its default ambient light
// color); `#070f1a` is the exact hex this codebase already used elsewhere
// as "the same navy the Beams scene renders" (its previous reduced-motion
// static fallback color) — i.e. an already-validated real-world reading
// of how that black-plus-white-light scene actually looked on screen,
// not a fresh guess. Mapped onto Grainient's own three-slot model (color1
// = lightest/accent, color3 = darkest) so the former Hero region keeps
// that black/navy/white character while being rendered by Grainient.
const GRAINIENT_HERO_COLOR_1 = "#FFFFFF";
const GRAINIENT_HERO_COLOR_2 = "#070F1A";
const GRAINIENT_HERO_COLOR_3 = "#000000";

const PublicLayout = () => {
  const { pathname } = useLocation();
  const isHomeRoute = pathname === "/";

  // Only where the tier is actually consumed (Grainient, home-only) —
  // resolves from a hint instantly, refines with a one-shot runtime
  // sample at most once per session (see performanceTier.js), and is a
  // no-op on every navigation after the first thanks to its own internal
  // sessionStorage/in-flight-promise caching.
  useEffect(() => {
    if (isHomeRoute) initPerformanceTier();
  }, [isHomeRoute]);

  return (
    <div className="public-root">
      {/* Exactly one Grainient instance — the homepage's only background
          engine (Beams/PublicBackground has been removed entirely; see
          HeroProblemScene/index.jsx). Rendered here rather than inside
          HomePage so the same canvas also sits behind <Header/> and
          <Footer/>, which PublicLayout renders once per page across every
          public route. Only mounted on the home route: it would be fully
          hidden behind every other page's normal opaque section
          backgrounds anyway.

          `regionBoundarySelector` points at `.scene-light-phase`
          (HeroProblemScene.css — the wrapper around Problem + Solution,
          i.e. everything after Hero) so the canvas eases from the hero
          palette into the main one across real, measured section
          geometry: full hero palette for all of Hero itself, ramping
          across Problem + Solution, fully the main palette from
          ScrollStackFeature on. */}
      {isHomeRoute && (
        <Grainient
          className="site-background-canvas"
          color1={GRAINIENT_COLOR_1}
          color2={GRAINIENT_COLOR_2}
          color3={GRAINIENT_COLOR_3}
          heroColor1={GRAINIENT_HERO_COLOR_1}
          heroColor2={GRAINIENT_HERO_COLOR_2}
          heroColor3={GRAINIENT_HERO_COLOR_3}
          regionBoundarySelector=".scene-light-phase"
        />
      )}
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
};

export default PublicLayout;
