import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { LuTriangleAlert } from "react-icons/lu";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The one auth alert treatment — Login's error and Register's both error
 * displays (the general banner and the email-exists warning) all render
 * through this instead of three independently-drifting `.auth-error`
 * blocks. `children` IS the visibility condition (same as the previous
 * `{error && <motion.div>...}` each call site wrote inline) — falsy
 * children (`""`, `null`, `false`) render nothing, so callers keep
 * passing `{error}` or a conditional exactly as before.
 *
 * Self-contained `initial`/`animate`/`exit` — never depends on AuthCard's
 * inherited variant lifecycle (same safety property every other route
 * animation in Auth already follows). `role="alert"` and the `id` prop
 * (for `aria-describedby` wiring on the fields that need it) are passed
 * straight through to the real DOM node.
 */
const AuthAlert = ({ id, children }) => {
  const reducedMotion = prefersReducedMotion();

  return (
    <AnimatePresence>
      {children && (
        <motion.div
          key="auth-alert"
          id={id}
          className="auth-alert"
          role="alert"
          initial={reducedMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
        >
          <LuTriangleAlert className="auth-alert-icon" aria-hidden="true" />
          <span className="auth-alert-message">{children}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthAlert;
