import React from "react";
import "./ProgressCard.css";

/**
 * Single metric row extracted from PatientDashboard's repeated
 * `.pd-summary-row` pattern (used identically for both the "Today Summary"
 * and "Adherence" sections). `progress` is an additive, optional bar not
 * present on the original row — used by the Hero preview only.
 */
const ProgressCard = ({ label, sub, value, progress, className = "" }) => {
  return (
    <div className={`progress-card-root ${className}`.trim()}>
      <div className="progress-card-row">
        <div className="progress-card-info">
          <div className="progress-card-label">{label}</div>
          {sub && <div className="progress-card-sub">{sub}</div>}
        </div>
        {value !== undefined && <div className="progress-card-value">{value}</div>}
      </div>

      {typeof progress === "number" && (
        <div className="progress-card-bar">
          <div className="progress-card-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
};

export default ProgressCard;
