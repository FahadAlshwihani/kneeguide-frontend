import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DoctorModal from "./DoctorModal";
import PatientPicker from "./PatientPicker";
import "../../styles/DoctorPatientWorkspace.css";
import { rehabRepository } from "../../../../../domain/rehab/useRehabDomain";
import { DEFAULT_CLINICIAN_ID } from "../../../../../domain/rehab/demoData/patients";
import { APPOINTMENT_TYPE } from "../../../../../domain/rehab/demoData/appointments";
import { DOCTOR_AVAILABILITY_STATUS, WEEKDAY_ORDER } from "../../../../../domain/rehab/rehabEnums";
import { getPendingAppointmentRequests } from "../../assistant/doctorClinicalInsights";

const DURATION_OPTIONS_MINUTES = [30, 45, 60];

/**
 * THE one canonical "doctor creates an appointment" form (Section 15 of the
 * Doctor Appointments brief) — replaces the old `ScheduleAppointmentModal`
 * (Workspace-only, patient always pre-locked) with a single component that
 * covers BOTH call sites: locked to a patient when `patientId` is passed
 * (Workspace's "Schedule appointment"), or a real searchable canonical
 * patient picker when it isn't (Global Appointments' "New appointment").
 * Writes through the exact same `rehabRepository.scheduleAppointment` — no
 * second creation path, no Status field (a doctor-created appointment is
 * always CONFIRMED immediately, never a doctor-chosen value), and a real
 * pre-submit scheduling-conflict check against `findSchedulingConflict`.
 */
const DoctorAppointmentComposer = ({ isOpen, onClose, patientId: lockedPatientId, initialDate, initialTime, onScheduled, onReviewExisting }) => {
  const { t } = useTranslation();
  const [patientId, setPatientId] = useState(lockedPatientId || null);
  const [date, setDate] = useState(initialDate || "");
  const [time, setTime] = useState(initialTime || "");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [type, setType] = useState(APPOINTMENT_TYPE.REHAB_SESSION);
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setPatientId(lockedPatientId || null);
    setDate(initialDate || "");
    setTime(initialTime || "");
    setDurationMinutes(30);
    setType(APPOINTMENT_TYPE.REHAB_SESSION);
    setNote("");
    setError(null);
    setConflict(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lockedPatientId, initialDate, initialTime]);

  // Whichever entry point opened this composer (the Assistant's "Schedule
  // appointment", the page's own "New appointment", or Workspace's
  // "Schedule appointment"), the doctor is told about an existing pending
  // request for the SAME patient before creating a possible duplicate
  // (Section 8, Step 2 of the Assistant-integration brief) — one shared
  // check inside the one shared composer, not a separate warning step
  // bolted onto only the chat flow.
  const existingPendingForPatient = patientId
    ? getPendingAppointmentRequests().find((entry) => entry.appointment.patientId === patientId)
    : null;

  // Doctor Profile brief, Section 14 — the composer must not casually
  // present the doctor as normally available. This is informational only
  // (never blocks submit, unlike the hard scheduling-conflict check below)
  // since an availability status/working-hours window is an
  // administrative default the doctor can knowingly override.
  const doctorProfile = rehabRepository.getDoctorProfile();
  const availabilityWarning = (() => {
    if (!date || !time) return null;
    if (doctorProfile.availabilityStatus !== DOCTOR_AVAILABILITY_STATUS.AVAILABLE) {
      return { type: "status", status: doctorProfile.availabilityStatus };
    }
    const dayKey = WEEKDAY_ORDER[new Date(`${date}T00:00:00`).getDay()];
    const hours = doctorProfile.workingHours[dayKey];
    if (!hours || !hours.enabled) return { type: "closed", dayKey };
    if (time < hours.start || time >= hours.end) return { type: "outsideHours", dayKey, start: hours.start, end: hours.end };
    return null;
  })();

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    setConflict(null);

    if (!patientId) {
      setError(t("doctorAppointments.composer.errors.patient"));
      return;
    }
    if (!date || !time) {
      setError(t("doctorPatientWorkspace.appointments.errors.dateTime"));
      return;
    }
    const startAt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(startAt.getTime()) || startAt < new Date()) {
      setError(t("doctorPatientWorkspace.appointments.errors.invalidDate"));
      return;
    }
    const endAt = new Date(startAt.getTime() + durationMinutes * 60000);

    const conflicting = rehabRepository.findSchedulingConflict(startAt.toISOString(), endAt.toISOString());
    if (conflicting) {
      const conflictPatient = rehabRepository.getPatient(conflicting.patientId);
      setError(null);
      setConflict({ appointment: conflicting, patient: conflictPatient });
      return;
    }

    setError(null);
    const appointment = rehabRepository.scheduleAppointment(patientId, {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      typeKey: type,
      note,
      clinicianId: DEFAULT_CLINICIAN_ID,
    });
    onScheduled?.(appointment);
    handleClose();
  };

  return (
    <DoctorModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("doctorAppointments.composer.title")}
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
      <PatientPicker
        id="dac-patient"
        label={t("doctorAppointments.composer.fields.patient")}
        value={patientId}
        onChange={setPatientId}
        locked={!!lockedPatientId}
      />

      {existingPendingForPatient && (
        <div className="dac-existing-request-banner">
          <p>
            {t("doctorAppointments.composer.existingPending", {
              name: existingPendingForPatient.patient.name,
              time: new Date(existingPendingForPatient.appointment.startAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
            })}
          </p>
          {onReviewExisting && (
            <button
              type="button"
              className="dw-btn-secondary"
              onClick={() => {
                onReviewExisting(existingPendingForPatient.appointment.id);
                handleClose();
              }}
            >
              {t("doctorAppointments.composer.reviewExisting")}
            </button>
          )}
        </div>
      )}

      <div className="dw-field-row">
        <div className="dw-field">
          <label htmlFor="dac-date">{t("doctorPatientWorkspace.appointments.fields.date")}</label>
          <input id="dac-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <div className="dw-field">
          <label htmlFor="dac-time">{t("doctorPatientWorkspace.appointments.fields.time")}</label>
          <input id="dac-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </div>
      </div>

      <div className="dw-field-row">
        <div className="dw-field">
          <label htmlFor="dac-duration">{t("doctorAppointments.composer.fields.duration")}</label>
          <select id="dac-duration" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))}>
            {DURATION_OPTIONS_MINUTES.map((minutes) => (
              <option key={minutes} value={minutes}>
                {t("doctorAppointments.composer.fields.durationMinutes", { count: minutes })}
              </option>
            ))}
          </select>
        </div>
        <div className="dw-field">
          <label htmlFor="dac-type">{t("doctorPatientWorkspace.appointments.fields.type")}</label>
          <select id="dac-type" value={type} onChange={(event) => setType(event.target.value)}>
            <option value={APPOINTMENT_TYPE.REHAB_SESSION}>{t(APPOINTMENT_TYPE.REHAB_SESSION)}</option>
            <option value={APPOINTMENT_TYPE.FOLLOW_UP}>{t(APPOINTMENT_TYPE.FOLLOW_UP)}</option>
            <option value={APPOINTMENT_TYPE.INITIAL}>{t(APPOINTMENT_TYPE.INITIAL)}</option>
          </select>
        </div>
      </div>

      <div className="dw-field">
        <label htmlFor="dac-note">{t("doctorPatientWorkspace.appointments.fields.note")}</label>
        <textarea id="dac-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </div>

      {availabilityWarning && (
        <div className="dac-existing-request-banner">
          <p>
            {availabilityWarning.type === "status" &&
              t("doctorAppointments.composer.availabilityWarnings.status", { name: doctorProfile.name, status: t(`doctorProfile.status.${availabilityWarning.status}`) })}
            {availabilityWarning.type === "closed" &&
              t("doctorAppointments.composer.availabilityWarnings.closed", { name: doctorProfile.name, day: t(`doctorProfile.workingHours.days.${availabilityWarning.dayKey}`) })}
            {availabilityWarning.type === "outsideHours" &&
              t("doctorAppointments.composer.availabilityWarnings.outsideHours", {
                name: doctorProfile.name,
                start: new Date(`2000-01-01T${availabilityWarning.start}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
                end: new Date(`2000-01-01T${availabilityWarning.end}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
              })}
          </p>
        </div>
      )}

      {error && <p className="dw-field-error">{error}</p>}
      {conflict && (
        <p className="dw-field-error">
          {t("doctorAppointments.composer.errors.conflict", {
            name: conflict.patient?.name || "",
            time: new Date(conflict.appointment.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          })}
        </p>
      )}
    </DoctorModal>
  );
};

export default DoctorAppointmentComposer;
