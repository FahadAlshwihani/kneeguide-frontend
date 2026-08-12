import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import DoctorModal from "./DoctorModal";
import { rehabRepository } from "../../../../../domain/rehab/useRehabDomain";
import { APPOINTMENT_STATUS } from "../../../../../domain/rehab/rehabEnums";
import "./AppointmentsTab.css";

/**
 * Appointments tab (Section 26-29) — the SAME shared appointment records
 * the Patient side's Appointments page reads/writes (Section 26: no
 * duplicate doctor/patient appointment mocks). Actions are gated by
 * status, matching the state machine in rehabRepository.js:
 *   requested            -> accept / propose new time / reject
 *   alternative_proposed  -> (patient's turn — read-only here)
 *   confirmed              -> cancel
 *   completed/declined/cancelled -> read-only
 */
const AppointmentsTab = ({ bundle, onScheduleNew }) => {
  const { t, i18n } = useTranslation();
  const { appointments } = bundle;
  const [proposing, setProposing] = useState(null);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");

  const dateTimeFormatter = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" });
  const ordered = [...appointments].sort((a, b) => new Date(b.startAt) - new Date(a.startAt));

  const handleAccept = (id) => rehabRepository.confirmAppointment(id);
  const handleReject = (id) => rehabRepository.rejectAppointment(id, {});
  const handleCancel = (id) => rehabRepository.cancelAppointment(id);

  const openPropose = (appointment) => {
    const start = new Date(appointment.startAt);
    setProposing(appointment.id);
    setProposedDate(start.toISOString().slice(0, 10));
    setProposedTime(start.toISOString().slice(11, 16));
  };

  const submitPropose = () => {
    if (!proposedDate || !proposedTime) return;
    const suggestedStartAt = new Date(`${proposedDate}T${proposedTime}:00`).toISOString();
    const suggestedEndAt = new Date(new Date(suggestedStartAt).getTime() + 30 * 60000).toISOString();
    rehabRepository.proposeAppointmentTime(proposing, { suggestedStartAt, suggestedEndAt });
    setProposing(null);
  };

  // Section 11 — the appointment insight reflects the EXACT current
  // status (requested / alternative_proposed / nothing pending); a
  // second short line is appended ONLY when the patient's latest session
  // also carries a clinical flag, framed as relevant context, never as a
  // reason the appointment is medically necessary.
  const appointmentInsight = buildAppointmentInsight(bundle);
  const clinicalInsight = buildClinicalInsight(bundle);
  const appointmentLines = appointmentInsight
    ? [
        { messageKey: appointmentInsight.messageKey, values: appointmentInsight.values },
        clinicalInsight.category === "clinical" && { messageKey: "doctorAssistantInsights.appointment.clinicalContext", values: {} },
      ].filter(Boolean)
    : [];

  return (
    <div>
      {appointmentInsight && (
        <AssistantInsightCard severity={appointmentInsight.severity} lines={appointmentLines} actions={appointmentInsight.actions} />
      )}

      <div className="at-toolbar">
        <button type="button" className="dw-btn-primary" onClick={onScheduleNew}>
          {t("doctorPatientWorkspace.appointments.scheduleNew")}
        </button>
      </div>

      {ordered.length === 0 ? (
        <div className="dw-empty-state">{t("doctorPatientWorkspace.appointments.empty")}</div>
      ) : (
        <div className="at-list">
          {ordered.map((appt) => (
            <div key={appt.id} className="dw-section at-card">
              <div className="at-card-top">
                <div>
                  <p className="at-datetime" dir="ltr">
                    {dateTimeFormatter.format(new Date(appt.startAt))}
                  </p>
                  <p className="at-type">{t(appt.typeKey)}</p>
                </div>
                <span className={`at-status at-status--${appt.status.toLowerCase()}`}>
                  {t(`doctorPatientWorkspace.appointments.status.${appt.status.toLowerCase()}`)}
                </span>
              </div>

              <p className="at-source">
                {t("doctorPatientWorkspace.appointments.source", {
                  source: t(`doctorPatientWorkspace.appointments.sourceValue.${appt.source}`),
                })}
              </p>

              {appt.status === APPOINTMENT_STATUS.ALTERNATIVE_PROPOSED && appt.clinicianResponse?.suggestedStartAt && (
                <p className="at-proposed" dir="ltr">
                  {t("doctorPatientWorkspace.appointments.proposedTime")}: {dateTimeFormatter.format(new Date(appt.clinicianResponse.suggestedStartAt))}
                </p>
              )}

              <div className="at-actions">
                {appt.status === APPOINTMENT_STATUS.REQUESTED && (
                  <>
                    <button type="button" className="dw-btn-primary" onClick={() => handleAccept(appt.id)}>
                      {t("doctorPatientWorkspace.appointments.accept")}
                    </button>
                    <button type="button" className="dw-btn-secondary" onClick={() => openPropose(appt)}>
                      {t("doctorPatientWorkspace.appointments.proposeNewTime")}
                    </button>
                    <button type="button" className="dw-btn-danger" onClick={() => handleReject(appt.id)}>
                      {t("doctorPatientWorkspace.appointments.reject")}
                    </button>
                  </>
                )}
                {appt.status === APPOINTMENT_STATUS.CONFIRMED && new Date(appt.startAt) > new Date() && (
                  <button type="button" className="dw-btn-danger" onClick={() => handleCancel(appt.id)}>
                    {t("doctorPatientWorkspace.appointments.cancel")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DoctorModal
        isOpen={!!proposing}
        onClose={() => setProposing(null)}
        title={t("doctorPatientWorkspace.appointments.proposeNewTime")}
        closeLabel={t("doctorPatientWorkspace.close")}
        footer={
          <>
            <button type="button" className="dw-btn-secondary" onClick={() => setProposing(null)}>
              {t("doctorPatientWorkspace.cancel")}
            </button>
            <button type="button" className="dw-btn-primary" onClick={submitPropose} disabled={!proposedDate || !proposedTime}>
              {t("doctorPatientWorkspace.appointments.sendProposal")}
            </button>
          </>
        }
      >
        <div className="dw-field-row">
          <div className="dw-field">
            <label htmlFor="at-date">{t("doctorPatientWorkspace.appointments.fields.date")}</label>
            <input id="at-date" type="date" value={proposedDate} onChange={(event) => setProposedDate(event.target.value)} />
          </div>
          <div className="dw-field">
            <label htmlFor="at-time">{t("doctorPatientWorkspace.appointments.fields.time")}</label>
            <input id="at-time" type="time" value={proposedTime} onChange={(event) => setProposedTime(event.target.value)} />
          </div>
        </div>
      </DoctorModal>
    </div>
  );
};

export default AppointmentsTab;
