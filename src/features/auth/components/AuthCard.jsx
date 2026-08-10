import React from "react";
import { motion } from "motion/react";
import "./AuthCard.css";

// Same local-helper pattern as useSectionNavigation.js's own
// prefersReducedMotion() — a plain synchronous read at render time, not a
// subscribed/live value. That's sufficient here: this only ever gates a
// one-time mount animation, never re-evaluated mid-session.
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// motion/react isn't wrapped in a global <MotionConfig reducedMotion="user">
// anywhere in this app (every other motion usage on the public site is
// scroll-triggered via `whileInView`, which naturally does very little
// above the fold) — so an immediate mount animation like this one has to
// check reduced-motion itself. Swapping to no-op variants (rather than
// fighting motion's own per-frame inline styles with a CSS override) keeps
// this reliable regardless of how framer/motion applies its transforms.
const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1], staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const noopVariants = { hidden: {}, visible: {} };

/**
 * The reusable glass-card shell + entrance/stagger choreography behind
 * every auth page (Login now; Register/Forgot Password/OTP can reuse this
 * unchanged later). Visual chrome (background/border/blur/radius/shadow)
 * lives in AuthCard.css; this file owns only the motion.
 *
 * AuthCardItem is intentionally presentation-only. Auth route children
 * must never rely on this persistent parent's one-time variant lifecycle
 * to become visible after client-side navigation.
 *
 * `layout="size"` is what makes the card's own height smoothly animate
 * between Login/Register's differently-sized content, and between
 * Register's own Stepper steps — WITHOUT any manual height measurement,
 * ref, or overflow clipping (the exact architecture that caused the
 * earlier blank-card regression). Motion's layout engine snapshots this
 * element's own rendered box before/after each render and interpolates
 * the delta itself; React Router keeps exclusively owning WHEN content
 * mounts/unmounts through the plain <Outlet/> in AuthLayout.jsx — this
 * only ever reacts to the SIZE that content naturally produces, never
 * decides what renders. `"size"` (not the default full `layout`, which
 * also tracks position) is deliberate: this card is always horizontally
 * centered by its parent flex container and never itself moves — only
 * its height genuinely changes.
 */
const AuthCard = ({ className = "", children, ...rest }) => {
  const reducedMotion = prefersReducedMotion();

  return (
    <motion.div
      layout="size"
      className={`auth-card${className ? ` ${className}` : ""}`}
      initial="hidden"
      animate="visible"
      variants={reducedMotion ? noopVariants : cardVariants}
      transition={{ layout: { duration: reducedMotion ? 0 : 0.36, ease: [0.22, 1, 0.36, 1] } }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export const AuthCardItem = ({ as = "div", className, children, ...rest }) => {
  const Tag = as;
  return <Tag className={className} {...rest}>{children}</Tag>;
};

export default AuthCard;
