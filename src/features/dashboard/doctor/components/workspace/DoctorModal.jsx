import React, { useEffect, useRef } from "react";
import { LuX } from "react-icons/lu";
import "./DoctorModal.css";

/**
 * Shared accessible modal/drawer shell for every Doctor Patient Workspace
 * dialog (prescription editor, session review, report review, schedule
 * appointment) — Section 50 of the Doctor Patients module brief:
 * labeled dialog role, Escape-to-close, focus trapping, and focus
 * restoration to whatever triggered it. Built once here instead of each
 * modal re-implementing its own chrome/backdrop/focus handling.
 */
const DoctorModal = ({ isOpen, onClose, title, children, footer, labelledBy, closeLabel = "Close" }) => {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);
  const titleId = labelledBy || "doctor-modal-title";

  useEffect(() => {
    if (!isOpen) return undefined;
    previouslyFocused.current = document.activeElement;

    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusable?.[0]?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="doctor-modal-backdrop" onMouseDown={onClose}>
      <div
        className="doctor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="doctor-modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="doctor-modal-close" onClick={onClose} aria-label={closeLabel}>
            <LuX aria-hidden="true" />
          </button>
        </div>
        <div className="doctor-modal-body">{children}</div>
        {footer && <div className="doctor-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default DoctorModal;
