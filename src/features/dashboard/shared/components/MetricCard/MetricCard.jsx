import React from "react";
import "./MetricCard.css";

/**
 * Simple stat tile extracted from DoctorDashboard's `.stat-card`.
 * Presentational only: parent supplies the value/label; no data fetching,
 * no navigation. `status` is an additive variant (not present in the
 * original) used for alert-style callouts such as the Hero's "recent alert"
 * preview card.
 */
const MetricCard = ({
  icon: Icon,
  value,
  label,
  trend,
  status,
  interactive = false,
  onClick,
  className = "",
}) => {
  const rootClassName = [
    "metric-card-root",
    status && `metric-card-status-${status}`,
    interactive && "metric-card-interactive",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {Icon && (
        <span className="metric-card-icon">
          <Icon aria-hidden="true" />
        </span>
      )}
      {value !== undefined && <span className="metric-card-value">{value}</span>}
      <span className="metric-card-label">{label}</span>
      {trend && <span className="metric-card-trend">{trend}</span>}
    </>
  );

  if (interactive) {
    return (
      <button type="button" className={rootClassName} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={rootClassName}>{content}</div>;
};

export default MetricCard;
