import React from "react";
import { handlePreviewInteraction } from "../../previewInteraction";
import "./AppointmentCard.css";

/**
 * Extracted from PatientDashboard's "Upcoming Appointment" block
 * (`.pd-appointment-main` / `.pd-appointment-actions`). Presentational only:
 * the parent supplies date/time/details and any real action handlers.
 *
 * previewMode: when true, the action buttons render but perform no action
 * (safe for the public Hero) and pick up a "platform preview" aria-label.
 */
const AppointmentCard = ({
  dateDay,
  dateMonth,
  time,
  type,
  withLabel,
  withName,
  location,
  primaryActionLabel,
  secondaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
  previewMode = false,
  className = "",
}) => {
  return (
    <div className={`appointment-card-root ${className}`.trim()}>
      <div className="appointment-card-main">
        <div className="appointment-card-date">
          <span className="appointment-card-day">{dateDay}</span>
          <span className="appointment-card-month">{dateMonth}</span>
        </div>

        <div className="appointment-card-info">
          <div className="appointment-card-time">{time}</div>
          <div className="appointment-card-type">{type}</div>
          {withName && (
            <div className="appointment-card-with">
              {withLabel} {withName}
            </div>
          )}
          {location && <div className="appointment-card-location">{location}</div>}
        </div>
      </div>

      {(primaryActionLabel || secondaryActionLabel) && (
        <div className="appointment-card-actions">
          {primaryActionLabel && (
            <button
              type="button"
              className="appointment-card-btn-primary"
              onClick={previewMode ? handlePreviewInteraction : onPrimaryAction}
              aria-label={previewMode ? `${primaryActionLabel} — platform preview` : undefined}
            >
              {primaryActionLabel}
            </button>
          )}
          {secondaryActionLabel && (
            <button
              type="button"
              className="appointment-card-btn-secondary"
              onClick={previewMode ? handlePreviewInteraction : onSecondaryAction}
              aria-label={previewMode ? `${secondaryActionLabel} — platform preview` : undefined}
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;
