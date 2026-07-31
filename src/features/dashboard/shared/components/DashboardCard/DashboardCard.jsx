import React from "react";
import "./DashboardCard.css";

/**
 * Generic dashboard card shell (surface + optional header) extracted from
 * the repeated `.pd-card.pd-card-lg` + `.pd-section-header` pattern in
 * PatientDashboard. Presentational only — the parent owns data/behavior.
 */
const DashboardCard = ({ title, tag, actions, className = "", children }) => {
  return (
    <div className={`dashboard-card-root ${className}`.trim()}>
      {(title || tag || actions) && (
        <div className="dashboard-card-header">
          {title && <h2 className="dashboard-card-title">{title}</h2>}
          {tag && <span className="dashboard-card-tag">{tag}</span>}
          {actions}
        </div>
      )}
      <div className="dashboard-card-body">{children}</div>
    </div>
  );
};

export default DashboardCard;
