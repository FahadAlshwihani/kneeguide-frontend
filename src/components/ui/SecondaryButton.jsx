import React from "react";
import "../../styles/Buttons.css";

const SecondaryButton = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`btn btn-secondary ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;
