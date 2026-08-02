import React, { forwardRef } from "react";
import { Link } from "react-router-dom";
import "./PrimaryButton.css";

/**
 * The public marketing site's only primary button. Solid white pill —
 * every public page composes it instead of defining its own button CSS.
 * (The authenticated app has its own separate button system —
 * AppPrimaryButton/AppSecondaryButton in this same folder — untouched.)
 *
 * Renders as a react-router `<Link>` when `to` is set, a plain `<a>` when
 * `href` is set, or a `<button>` otherwise. Disabled/loading always render
 * as a `<button>` regardless of `to`/`href`, since a disabled link isn't a
 * real HTML concept.
 */
const PrimaryButton = forwardRef(
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
      "ui-primary-btn",
      `ui-primary-btn--${size}`,
      fullWidth && "ui-primary-btn--full",
      loading && "ui-primary-btn--loading",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const content = (
      <>
        {loading && <span className="ui-primary-btn-spinner" aria-hidden="true" />}
        {!loading && icon && iconPosition === "left" && (
          <span className="ui-primary-btn-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="ui-primary-btn-label">{children}</span>
        {!loading && icon && iconPosition === "right" && (
          <span className="ui-primary-btn-icon" aria-hidden="true">
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

PrimaryButton.displayName = "PrimaryButton";

export default PrimaryButton;
