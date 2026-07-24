import React from "react";
import "../../styles/Buttons.css";

const PrimaryButton = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`btn btn-primary ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
