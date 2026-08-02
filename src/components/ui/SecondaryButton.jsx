import React, { forwardRef } from "react";
import { Link } from "react-router-dom";
import "./SecondaryButton.css";

/**
 * The public marketing site's only secondary button. Transparent glass
 * pill with a thin white border — used for lower-emphasis actions (Login,
 * "I'm a Clinician", etc.) beside a PrimaryButton. See PrimaryButton.jsx
 * for the shared render-as-Link/anchor/button contract.
 */
const SecondaryButton = forwardRef(
  (
    {
      children,
      to,
      href,
      size = "md",
      icon,
      iconPosition = "right",
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
      "ui-secondary-btn",
      `ui-secondary-btn--${size}`,
      fullWidth && "ui-secondary-btn--full",
      loading && "ui-secondary-btn--loading",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const content = (
      <>
        {loading && <span className="ui-secondary-btn-spinner" aria-hidden="true" />}
        {!loading && icon && iconPosition === "left" && (
          <span className="ui-secondary-btn-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="ui-secondary-btn-label">{children}</span>
        {!loading && icon && iconPosition === "right" && (
          <span className="ui-secondary-btn-icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </>
    );

    if (to && !isInert) {
      return (
        <Link ref={ref} to={to} className={classes} aria-busy={loading} {...props}>
          {content}
        </Link>
      );
    }

    if (href && !isInert) {
      return (
        <a ref={ref} href={href} className={classes} aria-busy={loading} {...props}>
          {content}
        </a>
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

SecondaryButton.displayName = "SecondaryButton";

export default SecondaryButton;
