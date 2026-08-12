import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DoctorModal from "./DoctorModal";
import "../../styles/DoctorPatientWorkspace.css";
import { rehabRepository } from "../../../../../domain/rehab/useRehabDomain";
import { DECLINE_REASON } from "../../../../../domain/rehab/rehabEnums";

const REASON_OPTIONS = [
  DECLINE_REASON.REQUESTED_TIME_UNAVAILABLE,
  DECLINE_REASON.SCHEDULE_CONFLICT,
  DECLINE_REASON.NO_CLINICAL_NEED_YET,
  DECLINE_REASON.CONTINUE_CURRENT_PLAN,
  DECLINE_REASON.OTHER,
];

/**
 * Decline-with-reason (Section 11/39 of the Doctor Appointments brief) —
 * declining a REQUESTED appointment always requires picking a real reason
 * from a small controlled taxonomy (never a blind reject). Shared by the
 * Workspace Appointments tab and the Global Appointments page so both
 * write through the exact same `rehabRepository.rejectAppointment` call.
 */
const DeclineAppointmentModal = ({ isOpen, onClose, appointment, onDeclined }) => {
  const { t } = useTranslation();
  const [reasonCode, setReasonCode] = useState(REASON_OPTIONS[0]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReasonCode(REASON_OPTIONS[0]);
      setNote("");
    }
  }, [isOpen, appointment]);

  const handleSubmit = () => {
    const result = rehabRepository.rejectAppointment(appointment.id, { reasonCode, note });
    onDeclined?.(result.appointment);
    onClose();
  };

  return (
    <DoctorModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("doctorAppointments.decline.title")}
      closeLabel={t("doctorPatientWorkspace.close")}
      footer={
        <>
          <button type="button" className="dw-btn-secondary" onClick={onClose}>
            {t("doctorPatientWorkspace.cancel")}
          </button>
          <button type="button" className="dw-btn-danger" onClick={handleSubmit}>
            {t("doctorAppointments.decline.confirm")}
          </button>
        </>
      }
    >
      <fieldset className="dw-field">
        <legend>{t("doctorAppointments.decline.reasonLabel")}</legend>
        {REASON_OPTIONS.map((code) => (
          <label key={code} className="dac-radio-row">
            <input type="radio" name="decline-reason" value={code} checked={reasonCode === code} onChange={() => setReasonCode(code)} />
            <span>{t(`doctorAppointments.declineReasons.${code}`)}</span>
          </label>
        ))}
      </fieldset>

      <div className="dw-field">
        <label htmlFor="decline-note">{t("doctorAppointments.decline.noteLabel")}</label>
        <textarea id="decline-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </div>
    </DoctorModal>
  );
};

export default DeclineAppointmentModal;
