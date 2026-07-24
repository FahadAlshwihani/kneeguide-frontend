import React from "react";
import "../../styles/Loader.css";

const Loader = ({ message = "Please wait..." }) => {
  return (
    <div className="loader-overlay">
      <div className="loader-container">
        <div className="loader-spinner">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <p className="loader-text">{message}</p>
      </div>
    </div>
  );
};

export default Loader;
