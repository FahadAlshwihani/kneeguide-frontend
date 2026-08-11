import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronRight } from "react-icons/lu";
import { APPOINTMENT_STATUS_TONE } from "../../data/patientAppointmentsData";
import "./AppointmentList.css";

/**
 * Compact appointment rows (Section 28/29) — reused for all three list
 * sections (requests / upcoming / past) via `title`/`appointments`/
 * `emptyMessage` props, rather than three near-duplicate components.
 * Each row exposes ONE "View details" affordance (never the whole row
 * as a giant button — same "distinct info action" pattern already
 * established for the Exercise Library's ⓘ control) opening
 * AppointmentDetailsModal.
 */
const AppointmentList = ({ title, appointments, emptyMessage, onViewDetails }) => {
  const { t, i18n } = useTranslation();

  return (
    <section className="appointment-list" aria-label={title}>
      <h2 className="appointment-list-title">{title}</h2>

      {appointments.length === 0 ? (
        <p className="appointment-list-empty">{emptyMessage}</p>
      ) : (
        <ul className="appointment-list-rows">
          {appointments.map((appointment) => (
            <li key={appointment.id}>
              <button type="button" className="appointment-row" onClick={() => onViewDetails(appointment)}>
                <div className="appointment-row-main">
                  <span className="appointment-row-date" dir="ltr">
                    {appointment.startAt.toLocaleDateString(i18n.language, { month: "short", day: "numeric" })}
                    {" · "}
                    {appointment.startAt.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="appointment-row-clinician">{appointment.clinician.name}</span>
                  <span className="appointment-row-type">{t(appointment.typeKey)}</span>
                </div>
                <div className="appointment-row-end">
                  <span className={`appointment-row-status appointment-row-status--${APPOINTMENT_STATUS_TONE[appointment.status]}`}>
                    {t(`patientAppointments.status.${appointment.status}`)}
                  </span>
                  <LuChevronRight aria-hidden="true" className="appointment-row-chevron" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default AppointmentList;
