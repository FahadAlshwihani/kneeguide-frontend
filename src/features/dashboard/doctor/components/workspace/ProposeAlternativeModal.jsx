import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DoctorModal from "./DoctorModal";
import "../../styles/DoctorPatientWorkspace.css";
import { rehabRepository } from "../../../../../domain/rehab/useRehabDomain";

/**
 * Propose Alternative Time (Section 12) — extracted from what used to be
 * an inline modal only inside AppointmentsTab.jsx so the Global
 * Appointments page can open the exact same flow instead of a second
 * implementation (Section 15/23: Workspace and Global Appointments must
 * never diverge on how a request is reviewed).
 */
const ProposeAlternativeModal = ({ isOpen, onClose, appointment, onProposed }) => {
  const { t } = useTranslation();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    if (isOpen && appointment) {
      const start = new Date(appointment.startAt);
      setDate(start.toISOString().slice(0, 10));
      setTime(start.toISOString().slice(11, 16));
    }
  }, [isOpen, appointment]);

  const handleSubmit = () => {
    if (!date || !time) return;
    const suggestedStartAt = new Date(`${date}T${time}:00`).toISOString();
    const suggestedEndAt = new Date(new Date(suggestedStartAt).getTime() + 30 * 60000).toISOString();
    const result = rehabRepository.proposeAppointmentTime(appointment.id, { suggestedStartAt, suggestedEndAt });
    onProposed?.(result.appointment);
    onClose();
  };

  return (
    <DoctorModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("doctorPatientWorkspace.appointments.proposeNewTime")}
      closeLabel={t("doctorPatientWorkspace.close")}
      footer={
        <>
          <button type="button" className="dw-btn-secondary" onClick={onClose}>
            {t("doctorPatientWorkspace.cancel")}
          </button>
          <button type="button" className="dw-btn-primary" onClick={handleSubmit} disabled={!date || !time}>
            {t("doctorPatientWorkspace.appointments.sendProposal")}
          </button>
        </>
      }
    >
      <div className="dw-field-row">
        <div className="dw-field">
          <label htmlFor="pam-date">{t("doctorPatientWorkspace.appointments.fields.date")}</label>
          <input id="pam-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <div className="dw-field">
          <label htmlFor="pam-time">{t("doctorPatientWorkspace.appointments.fields.time")}</label>
          <input id="pam-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </div>
      </div>
    </DoctorModal>
  );
};

export default ProposeAlternativeModal;
