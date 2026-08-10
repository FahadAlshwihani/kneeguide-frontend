import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "../features/public/components/Header";
import Grainient from "../features/public/components/Grainient";
import AuthFooter from "../features/auth/components/AuthFooter";
import { initPerformanceTier } from "../features/public/performance/performanceTier";
import "./SiteBackground.css";
import "./AuthLayout.css";

// Same steady-state palette Grainient uses from ScrollStackFeature down
// through Footer on the public homepage (PublicLayout.jsx's own
// GRAINIENT_COLOR_1/2/3) — reused verbatim, not a new palette. No
// heroColor*/regionBoundarySelector: those exist only to ease from a
// "hero" tone into this one across a scroll boundary, and this page has
// no hero moment to ease from — Grainient defaults heroColor* to
// color1/2/3 themselves when omitted, so the canvas renders this one
// palette uniformly, exactly what a steady auth background needs.
const GRAINIENT_COLOR_1 = "#2563EB";
const GRAINIENT_COLOR_2 = "#050505";
const GRAINIENT_COLOR_3 = "#1D4ED8";

/**
 * Shared chrome for auth pages (Login now; Register/Forgot Password/OTP
 * can move under this same layout later without restructuring — see
 * PublicRoutes.jsx). Deliberately not PublicLayout itself: that always
 * renders the full public Footer, which is too heavy for a focused auth
 * flow (see AuthFooter), and only mounts Grainient for the home route.
 *
 * Reuses the exact same building blocks PublicLayout does — the real
 * <Header/>, the real <Grainient/>, and the `.public-root` class itself
 * (its reset/typography/token contract lives in index.css and doesn't
 * depend on PublicLayout specifically) — rather than re-implementing any
 * of them. This is a second *mount* of Grainient, not a second
 * simultaneous instance: exactly like navigating between `/` and `/about`
 * already tears down and remounts PublicLayout's own instance today, only
 * one Grainient/WebGL context ever exists at a time.
 */
const AuthLayout = () => {
  useEffect(() => {
    initPerformanceTier();
  }, []);

  return (
    <div className="public-root auth-layout-root">
      <Grainient
        className="site-background-canvas"
        color1={GRAINIENT_COLOR_1}
        color2={GRAINIENT_COLOR_2}
        color3={GRAINIENT_COLOR_3}
      />
      <Header />
      <main className="auth-layout-main">
        <Outlet />
      </main>
      <AuthFooter />
    </div>
  );
};

export default AuthLayout;
