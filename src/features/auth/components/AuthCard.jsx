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
- * this reliable regardless of how framer/motion applies its transforms.
const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1], staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const noopVariants = { hidden: {}, visible: {} };

/**
 * The reusable glass-card shell + entrance/stagger choreography behind
 * every auth page (Login now; Register/Forgot Password/OTP can reuse this
 * unchanged later). Visual chrome (background/border/blur/radius/shadow)
 * lives in AuthCard.css; this file owns only the motion.
 *
 * Children that should participate in the stagger use <AuthCardItem> —
 * plain children (icons, non-animated wrappers) are unaffected.
 */
const AuthCard = ({ className = "", children, ...rest }) => (
  <motion.div
    className={`auth-card${className ? ` ${className}` : ""}`}
    initial="hidden"
    animate="visible"
    variants={prefersReducedMotion() ? noopVariants : cardVariants}
    {...rest}
  >
    {children}
  </motion.div>
);

export const AuthCardItem = ({ as = "div", className, children, ...rest }) => {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag className={className} variants={prefersReducedMotion() ? noopVariants : itemVariants} {...rest}>
      {children}
    </MotionTag>
  );
};

export default AuthCard;
