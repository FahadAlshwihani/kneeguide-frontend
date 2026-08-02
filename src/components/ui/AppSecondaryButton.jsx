import React from "react";
import "../../styles/Buttons.css";

// The authenticated app's (auth flow + dashboard) button — separate from
// the public marketing site's PrimaryButton/SecondaryButton design system
// in this same folder. Renamed from the old `SecondaryButton` name to free
// that name up for the public system; visually and behaviorally unchanged.
const AppSecondaryButton = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`btn btn-secondary ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};

export default AppSecondaryButton;
