import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../features/public/components/Header";
import Footer from "../features/public/components/Footer";
import Grainient from "../features/public/components/Grainient";
import { initPerformanceTier } from "../features/public/performance/performanceTier";
import "./SiteBackground.css";

// Mirrors the approved brand tokens in index.css.
const GRAINIENT_COLOR_1 = "#2563EB";
const GRAINIENT_COLOR_2 = "#050505";
const GRAINIENT_COLOR_3 = "#1D4ED8";

const PublicLayout = () => {
  const { pathname } = useLocation();
  const isHomeRoute = pathname === "/";

  // Only where the tier is actually consumed (Beams + Grainient, both
  // home-only) — resolves from a hint instantly, refines with a one-shot
  // runtime sample at most once per session (see performanceTier.js), and
  // is a no-op on every navigation after the first thanks to its own
  // internal sessionStorage/in-flight-promise caching.
  useEffect(() => {
    if (isHomeRoute) initPerformanceTier();
  }, [isHomeRoute]);

  return (
    <div className="public-root">
      {/* Exactly one Grainient instance, used as-is — only the three
          colors are overridden, every other prop is the component's own
          default (see Grainient.jsx). Rendered here rather than inside
          HomePage so the same canvas can also sit behind <Footer/>, which
          PublicLayout renders once per page across every public route.
          Only mounted on the home route: it would be fully hidden behind
          every other page's normal opaque section backgrounds anyway. */}
      {isHomeRoute && (
        <Grainient
          className="site-background-canvas"
          color1={GRAINIENT_COLOR_1}
          color2={GRAINIENT_COLOR_2}
          color3={GRAINIENT_COLOR_3}
        />
      )}
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
};

export default PublicLayout;
