import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LuX } from "react-icons/lu";
import "./PatientDialog.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The ONE shared overlay/dialog primitive for Patient scope — backdrop,
 * focus-on-open, Escape-to-close, body-scroll-lock (restored exactly on
 * close, never left modified), and automatic focus-return to whatever
 * triggered the dialog (via `document.activeElement`, captured the
 * instant it opens — works regardless of which of potentially many
 * trigger buttons on the page opened it, e.g. any of the per-exercise
 * info buttons). `SessionReportModal` and `ExerciseDetailsModal` both
 * render their own header/body content as `children` — this component
 * owns none of that, only the shared mechanics, so there is exactly one
 * accessible-dialog implementation instead of a duplicated one per
 * modal (audited before writing this — see the final report).
 *
 * Responsive by CSS alone (PatientDialog.css): a centered modal on
 * desktop, a full-height bottom sheet on narrow viewports — same
 * component, same markup, no JS breakpoint branching.
 */
const PatientDialog = ({ isOpen, onClose, ariaLabelledBy, ariaLabel, panelClassName = "", children }) => {
  const reducedMotion = prefersReducedMotion();
  const panelRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement;
    } else if (previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus?.();
      previouslyFocusedRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const panel = panelRef.current;
    panel?.querySelector("button, [href], input, [tabindex]:not([tabindex='-1'])")?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="patient-dialog-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.18 }}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelledBy}
            aria-label={ariaLabel}
            className={`patient-dialog-panel ${panelClassName}`.trim()}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.22, ease: [0.22, 0.61, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/** A small, reusable dialog close button — same look everywhere a PatientDialog is used. */
export const PatientDialogCloseButton = ({ onClose, label }) => (
  <button type="button" className="patient-dialog-close" onClick={onClose} aria-label={label}>
    <LuX aria-hidden="true" />
  </button>
);

export default PatientDialog;
