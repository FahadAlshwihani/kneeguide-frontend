import React from "react";
import { useTranslation } from "react-i18next";
import PatientDialog, { PatientDialogCloseButton } from "../PatientDialog";
import PatientButton from "../PatientButton";
import { APPOINTMENT_STATUS, APPOINTMENT_STATUS_TONE } from "../../data/patientAppointmentsData";
import "./AppointmentDetailsModal.css";

/**
 * The full appointment detail view (Section 30) — status, date/time,
 * clinician, reason/note, location, a compact request TIMELINE (Section
 * 31, derived from the appointment's own `requestedAt`/`reviewedAt`
 * rather than a separately-tracked event log), and the clinician's
 * response when one exists. Accept/"Choose another time" only render for
 * an ALTERNATIVE_PROPOSED appointment (Section 25/26/27) and call
 * straight into appointments/patientAppointmentService.js via the props
 * the page wires up — this component owns no scheduling logic itself.
 *
 * `appointment.reportId` (Section 41) is supported but intentionally
 * unused by any fixture this round — no current report fixture has a
 * stable, appointment-referencing id to link to honestly, so nothing
 * infers that relationship. The field exists so a future fixture/API can
 * populate it without this component changing shape.
 */
const AppointmentDetailsModal = ({ isOpen, onClose, appointment, onAcceptAlternative, onChooseAnotherTime }) => {
  const { t, i18n } = useTranslation();

  if (!appointment) return null;

  const timeline = [];
  if (appointment.requestedAt) {
    timeline.push({ key: "submitted", labelKey: "patientAppointments.timeline.submitted", date: appointment.requestedAt });
  }
  if (appointment.reviewedAt) {
    timeline.push({
      key: "reviewed",
      labelKey: "patientAppointments.timeline.reviewed",
      date: appointment.reviewedAt,
      values: { doctorName: appointment.clinician.name },
    });
    if (appointment.status === APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED) {
      timeline.push({ key: "alternative", labelKey: "patientAppointments.timeline.alternativeProposed", date: appointment.reviewedAt });
    } else if (appointment.status === APPOINTMENT_STATUS.DECLINED) {
      timeline.push({ key: "declined", labelKey: "patientAppointments.timeline.declined", date: appointment.reviewedAt });
    } else if (appointment.status === APPOINTMENT_STATUS.CONFIRMED) {
      timeline.push({ key: "confirmed", labelKey: "patientAppointments.timeline.confirmed", date: appointment.reviewedAt });
    }
  }

  const formatDateTime = (date) =>
    `${date.toLocaleDateString(i18n.language, { month: "short", day: "numeric" })} · ${date.toLocaleTimeString(i18n.language, {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

  return (
    <PatientDialog isOpen={isOpen} onClose={onClose} ariaLabelledBy="appointment-details-title" panelClassName="appointment-details-panel">
      <div className="appointment-details-header">
        <div className="appointment-details-header-text">
          <p className="appointment-details-eyebrow">{t("patientAppointments.details.eyebrow")}</p>
          <h2 id="appointment-details-title" className="appointment-details-title">
            {appointment.startAt.toLocaleDateString(i18n.language, { weekday: "long", month: "long", day: "numeric" })}
          </h2>
          <span className={`appointment-details-status appointment-details-status--${APPOINTMENT_STATUS_TONE[appointment.status]}`}>
            {t(`patientAppointments.status.${appointment.status}`)}
          </span>
        </div>
        <PatientDialogCloseButton onClose={onClose} label={t("patientAppointments.close")} />
      </div>

      <dl className="appointment-details-summary">
        <div>
          <dt>{t("patientAppointments.clinician.label")}</dt>
          <dd>{appointment.clinician.name}</dd>
        </div>
        <div>
          <dt>{t("patientAppointments.details.time")}</dt>
          <dd dir="ltr">{appointment.startAt.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}</dd>
        </div>
        <div>
          <dt>{t("patientAppointments.request.reasonLabel")}</dt>
          <dd>{t(`patientAppointments.reasons.${appointment.reasonCode}`)}</dd>
        </div>
        <div>
          <dt>{t("patientAppointments.details.location")}</dt>
          <dd>{t(appointment.location.nameKey)}</dd>
        </div>
      </dl>

      {appointment.note && (
        <div className="appointment-details-section">
          <p className="appointment-details-section-title">{t("patientAppointments.request.noteLabel")}</p>
          <p className="appointment-details-note" dir="auto">
            {appointment.note}
          </p>
        </div>
      )}

      {appointment.status === APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED && appointment.clinicianResponse && (
        <div className="appointment-details-alternative">
          <p className="appointment-details-section-title">{t("patientAppointments.details.doctorResponse")}</p>
          <p className="appointment-details-requested-time" dir="auto">
            {t("patientAppointments.details.youRequested")}{" "}
            <span dir="ltr">{formatDateTime(appointment.startAt)}</span>
          </p>
          <p className="appointment-details-suggested-time" dir="auto">
            {t("patientAppointments.details.doctorSuggested", { doctorName: appointment.clinician.name })}{" "}
            <span dir="ltr">{formatDateTime(appointment.clinicianResponse.suggestedStartAt)}</span>
          </p>
          {appointment.clinicianResponse.messageKey && (
            <p className="appointment-details-message" dir="auto">
              {t(appointment.clinicianResponse.messageKey)}
            </p>
          )}
          <div className="appointment-details-actions">
            <PatientButton type="button" variant="primary" size="sm" onClick={() => onAcceptAlternative(appointment.id)}>
              {t("patientAppointments.details.acceptAlternative")}
            </PatientButton>
            <PatientButton type="button" variant="outline" size="sm" onClick={() => onChooseAnotherTime(appointment)}>
              {t("patientAppointments.details.chooseAnotherTime")}
            </PatientButton>
          </div>
        </div>
      )}

      {appointment.status === APPOINTMENT_STATUS.DECLINED && appointment.clinicianResponse && (
        <div className="appointment-details-section">
          <p className="appointment-details-section-title">{t("patientAppointments.details.doctorResponse")}</p>
          {appointment.clinicianResponse.messageKey && (
            <p className="appointment-details-message" dir="auto">
              {t(appointment.clinicianResponse.messageKey)}
            </p>
          )}
          {appointment.clinicianResponse.followUpLabelKey && (
            <p className="appointment-details-followup">
              {t("patientAppointments.details.suggestedNextReview")}: {t(appointment.clinicianResponse.followUpLabelKey)}
            </p>
          )}
        </div>
      )}

      {timeline.length > 0 && (
        <div className="appointment-details-section">
          <p className="appointment-details-section-title">{t("patientAppointments.details.timeline")}</p>
          <ol className="appointment-details-timeline">
            {timeline.map((entry) => (
              <li key={entry.key}>
                <span className="appointment-details-timeline-label">{t(entry.labelKey, entry.values)}</span>
                <span className="appointment-details-timeline-date" dir="ltr">
                  {formatDateTime(entry.date)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </PatientDialog>
  );
};

export default AppointmentDetailsModal;
