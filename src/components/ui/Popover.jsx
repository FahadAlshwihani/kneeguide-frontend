import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import "./Popover.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Generic anchored dropdown/popover primitive — genuinely shared between
 * the Doctor Topbar's Notifications and Account menu (both are "small
 * panel anchored under a trigger button" with identical mechanics: click-
 * outside closes it, Escape closes it, opening moves focus in, closing
 * returns focus to the trigger). Knows nothing about notifications or
 * accounts — a role-agnostic UI primitive, same spirit as Orb.jsx/Dock.jsx.
 *
 * Positioning is logical, not physical: the CALLER wraps its trigger
 * button and this component in a single `position: relative` element
 * (see Popover.css's `.ui-popover-anchor` for the expected shape) — the
 * panel itself anchors via `inset-inline-end: 0` so it naturally sits
 * under/aligned-to its trigger on whichever side is the inline-end in the
 * active direction (right in LTR, left in RTL), without any manual RTL
 * branching here.
 *
 * Deliberately NOT a full-screen modal like PatientDialog.jsx (no
 * backdrop by default, no scroll lock) — this is a lightweight anchored
 * panel, not a page-blocking dialog. `withBackdrop` opts a caller into a
 * transparent click-catching backdrop for mobile widths where "click
 * outside" needs a guaranteed hit target.
 */
const Popover = ({ isOpen, onClose, triggerRef, ariaLabel, panelClassName = "", withBackdrop = false, children }) => {
  const reducedMotion = prefersReducedMotion();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const panel = panelRef.current;
    const focusable = panel?.querySelector("button, [href], input, [tabindex]:not([tabindex='-1'])");
    focusable?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        triggerRef?.current?.focus();
      }
    };

    const handlePointerDown = (event) => {
      if (panelRef.current?.contains(event.target)) return;
      if (triggerRef?.current?.contains(event.target)) return;
      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, onClose, triggerRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {withBackdrop && <div className="ui-popover-backdrop" onClick={onClose} />}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label={ariaLabel}
            className={`ui-popover-panel ${panelClassName}`.trim()}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0.12 : 0.16, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Popover;
