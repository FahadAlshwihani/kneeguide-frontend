import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PatientDialog, { PatientDialogCloseButton } from "../PatientDialog";
import PatientButton from "../PatientButton";
import AvailabilityPicker from "./AvailabilityPicker";
import { APPOINTMENT_REASONS } from "../../data/patientAppointmentsData";
import { getAvailability, submitAppointmentRequest, chooseAnotherTime } from "../../appointments/patientAppointmentService";
import "./AppointmentRequestFlow.css";

const STEPS = { REASON: "reason", AVAILABILITY: "availability", REVIEW: "review", SUBMITTED: "submitted" };

/**
 * THE one appointment-request UI — a compact guided flow (Section 12),
 * not the generic Auth Stepper (audited: that component is tuned for a
 * fixed multi-field registration form with its own visual chrome; a
 * smaller purpose-built flow fits the Patient product surface and this
 * feature's actual 3-screen shape better). Reason -> Availability ->
 * Review, then a Submitted confirmation — Sections 12's "choose date"
 * and "choose available time" are ONE combined "Availability" screen
 * here (AvailabilityPicker already shows the date rail and that date's
 * time grid together), which is materially the same information, one
 * screen simpler.
 *
 * Reused for TWO product moments (Section 27/37) via `mode`:
 *   "new"          — Request Appointment (from the page or the Assistant)
 *   "reschedule"   — "Choose another time" after rejecting a proposed
 *                     alternative; starts on the Availability step with
 *                     the original reason/note carried over, and submits
 *                     through `chooseAnotherTime` instead of creating a
 *                     second request for the same appointment id.
 *
 * Talks to appointments/patientAppointmentService.js ONLY — the same
 * module the Appointments page and the Assistant's REQUEST_APPOINTMENT
 * action both use. No booking logic lives in this component.
 */
const AppointmentRequestFlow = ({
  isOpen,
  onClose,
  mode = "new",
  rescheduleAppointmentId = null,
  initialReasonCode = null,
  initialNote = "",
  onSubmitted,
}) => {
  const { t, i18n } = useTranslation();

  const [step, setStep] = useState(mode === "reschedule" ? STEPS.AVAILABILITY : STEPS.REASON);
  const [reasonCode, setReasonCode] = useState(initialReasonCode);
  const [note, setNote] = useState(initialNote || "");
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submittedAppointment, setSubmittedAppointment] = useState(null);
  const submittingRef = useRef(false);

  const availability = useMemo(() => (isOpen ? getAvailability() : []), [isOpen]);

  // Fresh state every time the flow actually opens — never carries stale
  // selections from a previous request into a new one.
  useEffect(() => {
    if (!isOpen) return;
    setStep(mode === "reschedule" ? STEPS.AVAILABILITY : STEPS.REASON);
    setReasonCode(initialReasonCode);
    setNote(initialNote || "");
    setSelectedDateKey(null);
    setSelectedSlot(null);
    setSubmitError(null);
    setSubmittedAppointment(null);
    submittingRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setSubmitError(null);
  };

  const goToAvailability = () => setStep(STEPS.AVAILABILITY);

  const goToReview = () => {
    // Section 48: re-verify the selection is still valid before trusting
    // it — a defensive check, not a real race in this synchronous mock,
    // but cheap and matches the requirement literally.
    const day = availability.find((item) => item.date.toDateString() === selectedDateKey);
    const stillAvailable = day?.slots.find((slot) => slot.startAt.getTime() === selectedSlot?.startAt.getTime())?.available;
    if (!selectedSlot || !stillAvailable) {
      setSelectedSlot(null);
      setSubmitError(t("patientAppointments.request.slotNoLongerAvailable"));
      setStep(STEPS.AVAILABILITY);
      return;
    }
    setStep(STEPS.REVIEW);
  };

  const handleSubmit = () => {
    if (submittingRef.current || !selectedSlot) return;
    submittingRef.current = true;

    const result =
      mode === "reschedule"
        ? chooseAnotherTime(rescheduleAppointmentId, { startAt: selectedSlot.startAt, endAt: selectedSlot.endAt })
        : submitAppointmentRequest({ reasonCode, note, startAt: selectedSlot.startAt, endAt: selectedSlot.endAt });

    if (!result.ok) {
      setSubmitError(
        t(
          result.reason === "conflict"
            ? "patientAppointments.request.errorConflict"
            : "patientAppointments.request.errorDuplicate"
        )
      );
      submittingRef.current = false;
      return;
    }

    setSubmittedAppointment(result.appointment);
    setStep(STEPS.SUBMITTED);
    onSubmitted?.(result.appointment);
    submittingRef.current = false;
  };

  const reasonLabel = reasonCode ? t(`patientAppointments.reasons.${reasonCode}`) : null;

  return (
    <PatientDialog
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="appointment-request-title"
      panelClassName="appointment-request-panel"
    >
      <div className="appointment-request-header">
        <h2 id="appointment-request-title" className="appointment-request-title">
          {t(mode === "reschedule" ? "patientAppointments.request.chooseAnotherTimeTitle" : "patientAppointments.request.title")}
        </h2>
        <PatientDialogCloseButton onClose={onClose} label={t("patientAppointments.close")} />
      </div>

      {step === STEPS.REASON && (
        <div className="appointment-request-step">
          <p className="appointment-request-step-label">{t("patientAppointments.request.reasonLabel")}</p>
          <div className="appointment-request-reasons" role="radiogroup" aria-label={t("patientAppointments.request.reasonLabel")}>
            {APPOINTMENT_REASONS.map((code) => (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={reasonCode === code}
                className={`appointment-request-reason${reasonCode === code ? " appointment-request-reason--selected" : ""}`}
                onClick={() => setReasonCode(code)}
              >
                {t(`patientAppointments.reasons.${code}`)}
              </button>
            ))}
          </div>

          <label htmlFor="appointment-request-note" className="appointment-request-step-label">
            {t("patientAppointments.request.noteLabel")}
          </label>
          <textarea
            id="appointment-request-note"
            className="appointment-request-note"
            rows={3}
            maxLength={280}
            dir="auto"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("patientAppointments.request.notePlaceholder")}
          />

          <div className="appointment-request-actions">
            <PatientButton type="button" variant="primary" disabled={!reasonCode} onClick={goToAvailability}>
              {t("patientAppointments.request.next")}
            </PatientButton>
          </div>
        </div>
      )}

      {step === STEPS.AVAILABILITY && (
        <div className="appointment-request-step">
          <AvailabilityPicker
            availability={availability}
            selectedDateKey={selectedDateKey}
            onSelectDate={setSelectedDateKey}
            selectedSlotKey={selectedSlot?.startAt.toISOString() || null}
            onSelectSlot={handleSelectSlot}
          />
          {submitError && (
            <p className="appointment-request-error" role="alert">
              {submitError}
            </p>
          )}
          <div className="appointment-request-actions">
            {mode !== "reschedule" && (
              <PatientButton type="button" variant="ghost" onClick={() => setStep(STEPS.REASON)}>
                {t("patientAppointments.request.back")}
              </PatientButton>
            )}
            <PatientButton type="button" variant="primary" disabled={!selectedSlot} onClick={goToReview}>
              {t("patientAppointments.request.next")}
            </PatientButton>
          </div>
        </div>
      )}

      {step === STEPS.REVIEW && selectedSlot && (
        <div className="appointment-request-step">
          <p className="appointment-request-step-label">{t("patientAppointments.request.reviewTitle")}</p>

          <dl className="appointment-request-summary">
            <div>
              <dt>{t("patientAppointments.clinician.label")}</dt>
              <dd>{t("patientAppointments.clinician.name")}</dd>
            </div>
            <div>
              <dt>{t("patientAppointments.request.chooseDate")}</dt>
              <dd dir="ltr">
                {selectedSlot.startAt.toLocaleDateString(i18n.language, { weekday: "long", month: "short", day: "numeric" })}
                {" · "}
                {selectedSlot.startAt.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}
              </dd>
            </div>
            {reasonLabel && (
              <div>
                <dt>{t("patientAppointments.request.reasonLabel")}</dt>
                <dd>{reasonLabel}</dd>
              </div>
            )}
            {note && (
              <div className="appointment-request-summary-note">
                <dt>{t("patientAppointments.request.noteLabel")}</dt>
                <dd dir="auto">{note}</dd>
              </div>
            )}
          </dl>

          {submitError && (
            <p className="appointment-request-error" role="alert">
              {submitError}
            </p>
          )}

          <div className="appointment-request-actions">
            <PatientButton type="button" variant="ghost" onClick={() => setStep(STEPS.AVAILABILITY)}>
              {t("patientAppointments.request.back")}
            </PatientButton>
            <PatientButton type="button" variant="primary" onClick={handleSubmit}>
              {t("patientAppointments.request.submit")}
            </PatientButton>
          </div>
        </div>
      )}

      {step === STEPS.SUBMITTED && submittedAppointment && (
        <div className="appointment-request-step appointment-request-submitted">
          <p className="appointment-request-submitted-title">{t("patientAppointments.request.submittedTitle")}</p>
          <p className="appointment-request-submitted-text">
            {t("patientAppointments.request.submittedBody", {
              date: submittedAppointment.startAt.toLocaleDateString(i18n.language, { weekday: "long", month: "short", day: "numeric" }),
              time: submittedAppointment.startAt.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" }),
            })}
          </p>
          <p className="appointment-request-submitted-status">
            {t("patientAppointments.status.REQUESTED")}
          </p>
          <div className="appointment-request-actions">
            <PatientButton type="button" variant="primary" onClick={onClose}>
              {t("patientAppointments.close")}
            </PatientButton>
          </div>
        </div>
      )}
    </PatientDialog>
  );
};

export default AppointmentRequestFlow;
