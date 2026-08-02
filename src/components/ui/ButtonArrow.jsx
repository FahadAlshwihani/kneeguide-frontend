import React from "react";

/**
 * The exact diagonal-arrow SVG shared by PrimaryButton and SecondaryButton
 * (internal implementation detail, not a public export). `stroke="currentColor"`
 * so it always follows the button's own text color through hover — sizing
 * (by button size variant) and RTL mirroring live in each button's CSS,
 * targeting this SVG via `.ui-*-btn-icon svg`.
 */
const ButtonArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <path
      d="M7 17L17 7M17 7H8M17 7V16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ButtonArrow;
