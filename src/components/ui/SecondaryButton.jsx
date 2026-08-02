import React, { forwardRef } from "react";
import { Link } from "react-router-dom";
import { LuArrowUpRight } from "react-icons/lu";
import "./SecondaryButton.css";

/**
 * The public marketing site's only secondary button — the same flat
 * outlined rectangle as PrimaryButton, minus the hover fill. Used for
 * lower-emphasis actions (Login, "I'm a Clinician", etc.) beside a
 * PrimaryButton. See PrimaryButton.jsx for the shared render-as-Link/
 * anchor/button contract and the `showArrow` default.
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
      showArrow = true,
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
    // Smaller and thinner than the icon default (18/2) so it reads as part
    // of the typography rather than a standalone icon; uses `currentColor`
    // (react-icons/lu default), so it fades with the label's own color
    // transition instead of animating on its own.
    const resolvedIcon = icon ?? (showArrow ? <LuArrowUpRight size="0.8em" strokeWidth={1.75} /> : null);

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
        {!loading && resolvedIcon && iconPosition === "left" && (
          <span className="ui-secondary-btn-icon" aria-hidden="true">
            {resolvedIcon}
          </span>
        )}
        <span className="ui-secondary-btn-label">{children}</span>
        {!loading && resolvedIcon && iconPosition === "right" && (
          <span className="ui-secondary-btn-icon" aria-hidden="true">
            {resolvedIcon}
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
