import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
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
 * (Login or Register), keyed by `location.pathname`. Same height-
 * measurement technique Stepper.jsx already uses for its own step-to-step
 * transitions (measure the incoming content, animate the wrapper's height
 * to match) — reused rather than reinvented, so the card's footprint
 * animates smoothly between differently-sized content instead of the
 * "old disappears -> card collapses -> new appears -> card grows" jump a
 * naive AnimatePresence swap would produce. `mode="popLayout"` removes
 * the exiting content from flow the instant it starts exiting, so it
 * never fights the incoming content for space while both are briefly
 * mounted. A CSS min-height floor (AuthLayout.css) is the safety net
 * underneath all of this for the shortest content (Login, Register's
 * first step) — belt and suspenders, not either/or.
 *
 * Every motion.div in this file animates via plain target OBJECTS
 * (`animate={{opacity: 1}}`), never a string variant label. That's
 * deliberate, not stylistic: a string `animate="someLabel"` makes that
 * component the new nearest orchestrator for ITS OWN descendants'
 * variant lookups, which would shadow AuthCard's own "hidden"/"visible"
 * orchestration (AuthCard.jsx) for any <AuthCardItem> nested inside
 * Login/Register's actual content — silently breaking the field stagger
 * the approved Login already relies on. Plain objects animate the
 * element itself without creating that context, so AuthCard's own
 * top-level orchestration still reaches straight through every wrapper
 * here to whatever's actually inside <Outlet/>.
 */
const AuthContentTransition = () => {
  const location = useLocation();
  const [height, setHeight] = useState(null);
  const reducedMotion = prefersReducedMotion();

  return (
    <motion.div
      className="auth-content-frame"
      animate={{ height: height ?? "auto" }}
      transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <AuthContentSlide key={location.pathname} onHeightReady={setHeight} reducedMotion={reducedMotion}>
          <Outlet />
        </AuthContentSlide>
      </AnimatePresence>
    </motion.div>
  );
};

const AuthContentSlide = ({ children, onHeightReady, reducedMotion }) => {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (ref.current) onHeightReady(ref.current.offsetHeight);
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={ref}
      className="auth-content-slide"
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { duration: reducedMotion ? 0 : 0.3, ease: [0.22, 0.61, 0.36, 1] } }}
      exit={reducedMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Shared chrome for the auth experience — Login and Register now behave
 * as one surface: AuthLayout (this component), Header, Grainient, and
 * AuthFooter all stay mounted across /login <-> /register navigation
 * (React Router only swaps the matched leaf under <Outlet/>, not this
 * parent route element), and AuthCard itself is rendered exactly once
 * here rather than by each page — so its mount entrance/stagger
 * (AuthCard.jsx) plays once, on first landing on either route, and never
 * replays on a login<->register switch. Only AuthContentTransition's
 * content actually changes. Real routes throughout (see PublicRoutes.jsx)
 * — this is presentation only, not a `setMode()` local-state hack.
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
