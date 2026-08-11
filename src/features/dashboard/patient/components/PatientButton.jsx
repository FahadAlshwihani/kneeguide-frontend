import React, { forwardRef } from "react";
import { Link } from "react-router-dom";
import "./PatientButton.css";

/**
 * The Patient Dashboard's own button primitive — reads exclusively from
 * patientTokens.css (--patient-*), never from the Public/Auth button
 * system (components/ui/PrimaryButton.css) or Doctor's own button classes.
 * Product UI has different needs than marketing CTAs (denser, more
 * frequent, needs a "danger" variant for things like disconnecting a
 * device), so this is a dedicated component rather than a reskin of an
 * existing one.
 *
 * Renders a real <button>, or a react-router <Link> when `to` is passed
 * (disabled/loading always render as <button> regardless of `to`, since a
 * disabled link isn't a real HTML concept — same rule PrimaryButton
 * already established).
 */
const PatientButton = forwardRef(
  (
    {
      children,
      to,
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "start",
      loading = false,
      disabled = false,
      fullWidth = false,
      type = "button",
      className = "",
      ...props
    },
    ref
  ) => {
    const isInert = disabled || loading;

    const classes = [
      "patient-btn",
      `patient-btn--${variant}`,
      `patient-btn--${size}`,
      fullWidth && "patient-btn--full",
      loading && "patient-btn--loading",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const content = (
      <>
        {loading && <span className="patient-btn-spinner" aria-hidden="true" />}
        {!loading && icon && iconPosition === "start" && (
          <span className="patient-btn-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="patient-btn-label">{children}</span>
        {!loading && icon && iconPosition === "end" && (
          <span className="patient-btn-icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </>
    );

    if (to && !isInert) {
      return (
        <Link ref={ref} to={to} className={classes} {...props}>
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={isInert}
        aria-busy={loading}
        {...props}
      >
        {content}
      </button>
    );
  }
);

PatientButton.displayName = "PatientButton";

export default PatientButton;
