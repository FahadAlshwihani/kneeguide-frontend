import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import DoctorModal from "./DoctorModal";
import { rehabRepository } from "../../../../../domain/rehab/useRehabDomain";
import { DEFAULT_CLINICIAN_ID } from "../../../../../domain/rehab/demoData/patients";
import { APPOINTMENT_TYPE } from "../../../../../domain/rehab/demoData/appointments";

/**
 * Doctor-created appointment (Section 28) — confirmed immediately, no
 * request/accept cycle. Writes through `rehabRepository.scheduleAppointment`,
 * the SAME shared record store the Patient's own Appointments page and
 * this Workspace's Appointments tab read (Section 26: one entity).
 */
const ScheduleAppointmentModal = ({ isOpen, onClose, patient }) => {
  const { t } = useTranslation();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState(APPOINTMENT_TYPE.REHAB_SESSION);
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);

  const reset = () => {
    setDate("");
    setTime("");
    setType(APPOINTMENT_TYPE.REHAB_SESSION);
    setNote("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!date || !time) {
      setError(t("doctorPatientWorkspace.appointments.errors.dateTime"));
      return;
    }
    const startAt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(startAt.getTime()) || startAt < new Date()) {
      setError(t("doctorPatientWorkspace.appointments.errors.invalidDate"));
      return;
    }
    rehabRepository.scheduleAppointment(patient.id, {
      startAt: startAt.toISOString(),
      typeKey: type,
      note,
      clinicianId: DEFAULT_CLINICIAN_ID,
    });
    handleClose();
  };

  return (
    <DoctorModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("doctorPatientWorkspace.appointments.scheduleNew")}
      closeLabel={t("doctorPatientWorkspace.close")}
      footer={
        <>
          <button type="button" className="dw-btn-secondary" onClick={handleClose}>
            {t("doctorPatientWorkspace.cancel")}
          </button>
          <button type="button" className="dw-btn-primary" onClick={handleSubmit}>
            {t("doctorPatientWorkspace.appointments.schedule")}
          </button>
        </>
      }
    >
      <div className="dw-field-row">
        <div className="dw-field">
          <label htmlFor="sa-date">{t("doctorPatientWorkspace.appointments.fields.date")}</label>
          <input id="sa-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <div className="dw-field">
          <label htmlFor="sa-time">{t("doctorPatientWorkspace.appointments.fields.time")}</label>
          <input id="sa-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </div>
      </div>

      <div className="dw-field">
        <label htmlFor="sa-type">{t("doctorPatientWorkspace.appointments.fields.type")}</label>
        <select id="sa-type" value={type} onChange={(event) => setType(event.target.value)}>
          <option value={APPOINTMENT_TYPE.REHAB_SESSION}>{t(APPOINTMENT_TYPE.REHAB_SESSION)}</option>
          <option value={APPOINTMENT_TYPE.FOLLOW_UP}>{t(APPOINTMENT_TYPE.FOLLOW_UP)}</option>
          <option value={APPOINTMENT_TYPE.INITIAL}>{t(APPOINTMENT_TYPE.INITIAL)}</option>
        </select>
      </div>

      <div className="dw-field">
        <label htmlFor="sa-note">{t("doctorPatientWorkspace.appointments.fields.note")}</label>
        <textarea id="sa-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </div>

      {error && <p className="dw-field-error">{error}</p>}
    </DoctorModal>
  );
};

export default ScheduleAppointmentModal;
