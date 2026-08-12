import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { rehabRepository } from "../../../../../domain/rehab/useRehabDomain";
import { APPOINTMENT_STATUS } from "../../../../../domain/rehab/rehabEnums";
import ProposeAlternativeModal from "./ProposeAlternativeModal";
import DeclineAppointmentModal from "./DeclineAppointmentModal";
import "./AppointmentsTab.css";

/**
 * Appointments tab (Section 26-29) — the SAME shared appointment records
 * the Patient side's Appointments page reads/writes (Section 26: no
 * duplicate doctor/patient appointment mocks). Actions are gated by
 * status, matching the state machine in rehabRepository.js:
 *   requested            -> accept / propose new time / decline (with reason)
 *   alternative_proposed  -> (patient's turn — read-only here)
 *   confirmed              -> cancel
 *   completed/declined/cancelled -> read-only
 *
 * Propose/decline now open the SAME shared modals the Global Appointments
 * page uses (ProposeAlternativeModal/DeclineAppointmentModal) instead of an
 * inline form only this tab had — one review workflow, not two.
 */
const AppointmentsTab = ({ bundle, onScheduleNew }) => {
  const { t, i18n } = useTranslation();
  const { appointments } = bundle;
  const [proposing, setProposing] = useState(null);
  const [declining, setDeclining] = useState(null);

  const dateTimeFormatter = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" });
  const ordered = [...appointments].sort((a, b) => new Date(b.startAt) - new Date(a.startAt));

  const handleAccept = (id) => rehabRepository.confirmAppointment(id);
  const handleCancel = (id) => rehabRepository.cancelAppointment(id);

  return (
    <div>
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

              {appt.status === APPOINTMENT_STATUS.DECLINED && appt.clinicianResponse?.declineReasonCode && (
                <p className="at-proposed">
                  {t("doctorAppointments.decline.reasonLabel")}: {t(`doctorAppointments.declineReasons.${appt.clinicianResponse.declineReasonCode}`)}
                </p>
              )}

              <div className="at-actions">
                {appt.status === APPOINTMENT_STATUS.REQUESTED && (
                  <>
                    <button type="button" className="dw-btn-primary" onClick={() => handleAccept(appt.id)}>
                      {t("doctorPatientWorkspace.appointments.accept")}
                    </button>
                    <button type="button" className="dw-btn-secondary" onClick={() => setProposing(appt)}>
                      {t("doctorPatientWorkspace.appointments.proposeNewTime")}
                    </button>
                    <button type="button" className="dw-btn-danger" onClick={() => setDeclining(appt)}>
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

      <ProposeAlternativeModal isOpen={!!proposing} onClose={() => setProposing(null)} appointment={proposing} />
      <DeclineAppointmentModal isOpen={!!declining} onClose={() => setDeclining(null)} appointment={declining} />
    </div>
  );
};

export default AppointmentsTab;
