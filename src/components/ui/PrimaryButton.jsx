import React, { forwardRef } from "react";
import { Link } from "react-router-dom";
import { LuArrowUpRight } from "react-icons/lu";
import "./PrimaryButton.css";

/**
 * The public marketing site's only primary button — a near-square
 * outlined rectangle that fades to a solid white background/black text on
 * hover (plain color transition, no fill sweep, no movement). Every
 * public page composes it instead of defining its own button CSS. (The
 * authenticated app has its own separate button system —
 * AppPrimaryButton/AppSecondaryButton in this same folder — untouched.)
 *
 * Renders as a react-router `<Link>` when `to` is set, a plain `<a>` when
 * `href` is set, or a `<button>` otherwise. Disabled/loading always render
 * as a `<button>` regardless of `to`/`href`, since a disabled link isn't a
 * real HTML concept.
 *
 * Shows a diagonal arrow (Lucide ArrowUpRight) by default — pass
 * `showArrow={false}` to omit it, or `icon`/`iconPosition` for a custom
 * one instead. The arrow's RTL mirroring (a static flip, not animated) is
 * handled entirely in PrimaryButton.css via the ancestor `dir`, not here;
 * its color rides the button's own color transition via `currentColor`.
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
        {!loading && resolvedIcon && iconPosition === "left" && (
          <span className="ui-primary-btn-icon" aria-hidden="true">
            {resolvedIcon}
          </span>
        )}
        <span className="ui-primary-btn-label">{children}</span>
        {!loading && resolvedIcon && iconPosition === "right" && (
          <span className="ui-primary-btn-icon" aria-hidden="true">
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

PrimaryButton.displayName = "PrimaryButton";

export default PrimaryButton;
