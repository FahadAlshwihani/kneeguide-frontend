import React, { useEffect } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Header from "../features/public/components/Header";
import Grainient from "../features/public/components/Grainient";
import AuthFooter from "../features/auth/components/AuthFooter";
import AuthCard from "../features/auth/components/AuthCard";
import { initPerformanceTier } from "../features/public/performance/performanceTier";
import "../features/auth/styles/AuthForm.css";
import "./SiteBackground.css";
import "./AuthLayout.css";

const GRAINIENT_COLOR_1 = "#2563EB";
const GRAINIENT_COLOR_2 = "#050505";
const GRAINIENT_COLOR_3 = "#1D4ED8";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Owns the crossfade between whatever the current auth route renders
 * (Login or Register), keyed by `location.pathname`.
 *
 * Uses `useOutlet()`, NOT `<Outlet/>`, inside the animated/keyed element —
 * this is the actual fix for a real bug (previously: a live `<Outlet/>`
 * was nested inside the AnimatePresence-held exiting element; `<Outlet/>`
 * itself subscribes to the router and keeps re-rendering to match
 * whatever the CURRENT route is, so while AnimatePresence held the old
 * element mounted to play its exit animation, that element's own
 * `<Outlet/>` child re-resolved to the NEW route out from under it —
 * producing an inconsistent render that only a full remount recovered
 * from, exactly matching the reported "blank until refresh" symptom).
 * `useOutlet()` instead returns the already-resolved element for the
 * current match as an inert value — what gets animated/held is that frozen
 * element, which never changes out from under AnimatePresence.
 *
 * `mode="wait"` (sequential exit-then-enter), not `popLayout` or manual
 * height measurement: with two DIFFERENTLY-SIZED pages ever needing to be
 * "briefly both present" for an overlapping crossfade, the previous
 * combination of `popLayout` + a JS-measured, animated wrapper height +
 * `overflow: hidden` was also the likely reason the Stepper's footer
 * (Next/Back) could end up clipped — if the measured height ever landed
 * below the real content's height, everything past that point was simply
 * cut off. Removing that measurement entirely and letting the frame size
 * itself naturally (CSS min-height as a floor only, no JS-driven height,
 * no overflow clipping) makes that failure mode structurally impossible:
 * content can never render taller than a hard limit that doesn't exist.
 */
const AuthContentTransition = () => {
  const location = useLocation();
  const outlet = useOutlet();
  const reducedMotion = prefersReducedMotion();

  return (
    <div className="auth-content-frame">
      <AnimatePresence mode="wait" initial={false}>
        {outlet && (
          <motion.div
            key={location.pathname}
            className="auth-content-slide"
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: reducedMotion ? 0 : 0.3, ease: [0.22, 0.61, 0.36, 1] } }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
          >
            {outlet}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Shared chrome for the auth experience — Login and Register now behave
 * as one surface: AuthLayout (this component), Header, Grainient, and
 * AuthFooter all stay mounted across /login <-> /register navigation
 * (React Router only swaps the matched leaf, not this parent route
 * element), and AuthCard itself is rendered exactly once here rather than
 * by each page — so its mount entrance/stagger (AuthCard.jsx) plays once,
 * on first landing on either route, and never replays on a
 * login<->register switch. Only AuthContentTransition's content actually
 * changes. Real routes throughout (see PublicRoutes.jsx) — this is
 * presentation only, not a `setMode()` local-state hack.
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
        <AuthCard>
          <AuthContentTransition />
        </AuthCard>
      </main>
      <AuthFooter />
    </div>
  );
};

export default AuthLayout;
