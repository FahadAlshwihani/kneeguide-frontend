import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LuCamera } from "react-icons/lu";
import DoctorLayout from "../components/DoctorLayout";
import { useDoctorProfile, rehabRepository } from "../../../../domain/rehab/useRehabDomain";
import { deriveInitialsFromName, findAppointmentsOutsideWorkingHours } from "../../../../domain/rehab/rehabDerived";
import { DOCTOR_AVAILABILITY_STATUS, WEEKDAY_ORDER, APPOINTMENT_STATUS } from "../../../../domain/rehab/rehabEnums";
import { ROUTES } from "../../../../utils/routes";
import "../styles/DoctorProfile.css";

const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024; // 1.5MB — a real ceiling for a base64 value going into localStorage-backed canonical state.
const MAX_BIO_LENGTH = 500;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9()\-.\s]{7,20}$/;

/**
 * Doctor Profile brief — the canonical `doctorProfile` (rehabRepository)
 * is the same identity Topbar/AccountMenu/Workspace already read; this
 * page is a form over ONE local draft of it, committed only on Save
 * (Section 20 — a local draft is the correct pattern here, unlike every
 * other page in this app, precisely BECAUSE Cancel needs to mean
 * something).
 */
const DoctorProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const savedProfile = useDoctorProfile();

  const [draft, setDraft] = useState(savedProfile);
  const [errors, setErrors] = useState({});
  const [savedMessage, setSavedMessage] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const [hoursConflict, setHoursConflict] = useState(null);
  const fileInputRef = useRef(null);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(savedProfile), [draft, savedProfile]);
  const initials = deriveInitialsFromName(draft.name);

  const setField = (name, value) => {
    setDraft((prev) => ({ ...prev, [name]: value }));
    setSavedMessage(false);
    setHoursConflict(null);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const setWorkingHoursField = (day, patch) => {
    setDraft((prev) => ({ ...prev, workingHours: { ...prev.workingHours, [day]: { ...prev.workingHours[day], ...patch } } }));
    setSavedMessage(false);
    setHoursConflict(null);
    if (errors.workingHours) setErrors((prev) => ({ ...prev, workingHours: null }));
  };

  const copySundayToOpenDays = () => {
    const sunday = draft.workingHours.sunday;
    setDraft((prev) => ({
      ...prev,
      workingHours: Object.fromEntries(
        WEEKDAY_ORDER.map((day) => [day, prev.workingHours[day].enabled ? { ...prev.workingHours[day], start: sunday.start, end: sunday.end } : prev.workingHours[day]])
      ),
    }));
    setSavedMessage(false);
  };

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError(t("doctorProfile.avatar.errors.type"));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError(t("doctorProfile.avatar.errors.size"));
      return;
    }

    setAvatarError(null);
    const reader = new FileReader();
    reader.onload = () => setField("avatarDataUrl", reader.result);
    reader.onerror = () => setAvatarError(t("doctorProfile.avatar.errors.type"));
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setField("avatarDataUrl", null);
    setAvatarError(null);
  };

  const validate = () => {
    const next = {};
    if (!draft.name.trim()) next.name = t("doctorProfile.errors.required");
    if (!draft.specialty.trim()) next.specialty = t("doctorProfile.errors.required");

    const experience = Number(draft.yearsExperience);
    if (draft.yearsExperience === "" || !Number.isInteger(experience) || experience < 0 || experience > 70) {
      next.yearsExperience = t("doctorProfile.errors.yearsExperience");
    }

    if (!draft.licenseNumber.trim() || draft.licenseNumber.trim().length < 3) next.licenseNumber = t("doctorProfile.errors.licenseNumber");
    if (!draft.clinicName.trim()) next.clinicName = t("doctorProfile.errors.required");
    if (!EMAIL_PATTERN.test(draft.email.trim())) next.email = t("doctorProfile.errors.email");
    if (!PHONE_PATTERN.test(draft.phone.trim())) next.phone = t("doctorProfile.errors.phone");
    if (!draft.location.trim()) next.location = t("doctorProfile.errors.required");
    if (draft.bio.length > MAX_BIO_LENGTH) next.bio = t("doctorProfile.errors.bioLength", { max: MAX_BIO_LENGTH });

    const invalidDay = WEEKDAY_ORDER.find((day) => draft.workingHours[day].enabled && draft.workingHours[day].start >= draft.workingHours[day].end);
    if (invalidDay) next.workingHours = t("doctorProfile.errors.workingHours");

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const commitSave = () => {
    rehabRepository.updateDoctorProfile(draft);
    setSavedMessage(true);
    setHoursConflict(null);
  };

  const handleSave = () => {
    if (!validate()) return;

    const workingHoursChanged = JSON.stringify(draft.workingHours) !== JSON.stringify(savedProfile.workingHours);
    if (workingHoursChanged) {
      const futureConfirmed = rehabRepository.getAllAppointments().filter((appt) => appt.status === APPOINTMENT_STATUS.CONFIRMED && new Date(appt.startAt) > new Date());
      const outside = findAppointmentsOutsideWorkingHours(draft.workingHours, futureConfirmed);
      if (outside.length > 0) {
        setHoursConflict(outside);
        return;
      }
    }

    commitSave();
  };

  const handleCancel = () => {
    setDraft(savedProfile);
    setErrors({});
    setAvatarError(null);
    setSavedMessage(false);
    setHoursConflict(null);
  };

  return (
    <DoctorLayout active="profile">
      <div className="dprof-page">
        <div className="dprof-wrapper">
          <header className="dprof-header">
            <div>
              <h1>{t("doctorProfile.title")}</h1>
              <p>{t("doctorProfile.subtitle")}</p>
            </div>
          </header>

          {savedMessage && <div className="dprof-alert">{t("doctorProfile.saveSuccess")}</div>}

          <div className="dprof-identity">
            <div className="dprof-avatar-wrap">
              {draft.avatarDataUrl ? (
                <img src={draft.avatarDataUrl} alt="" className="dprof-avatar-img" />
              ) : (
                <span className="dprof-avatar-circle" aria-hidden="true">
                  {initials}
                </span>
              )}
            </div>
            <div className="dprof-identity-text">
              <h2 dir="auto">{draft.name}</h2>
              <p dir="auto">{draft.specialty}</p>
              <span className={`dprof-status-badge dprof-status-badge--${draft.availabilityStatus}`}>
                {t(`doctorProfile.status.${draft.availabilityStatus}`)}
              </span>
            </div>
            <div className="dprof-avatar-actions">
              <input ref={fileInputRef} type="file" accept={ACCEPTED_AVATAR_TYPES.join(",")} className="dprof-visually-hidden" onChange={handleAvatarChange} aria-hidden="true" tabIndex={-1} />
              <button type="button" className="dprof-btn-secondary" onClick={handleAvatarPick}>
                <LuCamera aria-hidden="true" /> {t("doctorProfile.avatar.change")}
              </button>
              {draft.avatarDataUrl && (
                <button type="button" className="dprof-btn-text" onClick={removeAvatar}>
                  {t("doctorProfile.avatar.remove")}
                </button>
              )}
            </div>
          </div>
          {avatarError && <p className="dprof-field-error dprof-avatar-error">{avatarError}</p>}

          <div className="dprof-grid">
            <section className="dprof-section">
              <div className="dprof-section-header">
                <h3>{t("doctorProfile.professionalInfo")}</h3>
                <p className="dprof-section-hint">{t("doctorProfile.visibleToAdmins")}</p>
              </div>

              <div className="dprof-field">
                <label htmlFor="dprof-name">{t("doctorProfile.labels.fullName")}</label>
                <input id="dprof-name" type="text" value={draft.name} onChange={(event) => setField("name", event.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "dprof-name-error" : undefined} />
                {errors.name && <p id="dprof-name-error" className="dprof-field-error">{errors.name}</p>}
              </div>

              <div className="dprof-field">
                <label htmlFor="dprof-specialty">{t("doctorProfile.labels.specialty")}</label>
                <input id="dprof-specialty" type="text" value={draft.specialty} onChange={(event) => setField("specialty", event.target.value)} aria-invalid={!!errors.specialty} />
                {errors.specialty && <p className="dprof-field-error">{errors.specialty}</p>}
              </div>

              <div className="dprof-field-row">
                <div className="dprof-field">
                  <label htmlFor="dprof-experience">{t("doctorProfile.labels.yearsExperience")}</label>
                  <input id="dprof-experience" type="number" min="0" max="70" step="1" value={draft.yearsExperience} onChange={(event) => setField("yearsExperience", event.target.value === "" ? "" : Number(event.target.value))} aria-invalid={!!errors.yearsExperience} />
                  {errors.yearsExperience && <p className="dprof-field-error">{errors.yearsExperience}</p>}
                </div>
                <div className="dprof-field">
                  <label htmlFor="dprof-license">{t("doctorProfile.labels.licenseNumber")}</label>
                  <input id="dprof-license" type="text" value={draft.licenseNumber} onChange={(event) => setField("licenseNumber", event.target.value)} aria-invalid={!!errors.licenseNumber} />
                  {errors.licenseNumber && <p className="dprof-field-error">{errors.licenseNumber}</p>}
                </div>
              </div>

              <div className="dprof-field">
                <label htmlFor="dprof-clinic">{t("doctorProfile.labels.clinicName")}</label>
                <input id="dprof-clinic" type="text" value={draft.clinicName} onChange={(event) => setField("clinicName", event.target.value)} aria-invalid={!!errors.clinicName} />
                {errors.clinicName && <p className="dprof-field-error">{errors.clinicName}</p>}
              </div>

              <div className="dprof-field">
                <label htmlFor="dprof-bio">{t("doctorProfile.labels.bio")}</label>
                <textarea id="dprof-bio" rows={4} maxLength={MAX_BIO_LENGTH + 50} value={draft.bio} onChange={(event) => setField("bio", event.target.value)} aria-invalid={!!errors.bio} />
                <p className="dprof-field-hint" dir="ltr">{draft.bio.length}/{MAX_BIO_LENGTH}</p>
                {errors.bio && <p className="dprof-field-error">{errors.bio}</p>}
              </div>
            </section>

            <section className="dprof-section">
              <div className="dprof-section-header">
                <h3>{t("doctorProfile.contactAvailability")}</h3>
              </div>

              <div className="dprof-field-row">
                <div className="dprof-field">
                  <label htmlFor="dprof-email">{t("doctorProfile.labels.email")}</label>
                  <input id="dprof-email" type="email" dir="ltr" value={draft.email} onChange={(event) => setField("email", event.target.value)} aria-invalid={!!errors.email} />
                  {errors.email && <p className="dprof-field-error">{errors.email}</p>}
                </div>
                <div className="dprof-field">
                  <label htmlFor="dprof-phone">{t("doctorProfile.labels.phone")}</label>
                  <input id="dprof-phone" type="tel" dir="ltr" value={draft.phone} onChange={(event) => setField("phone", event.target.value)} aria-invalid={!!errors.phone} />
                  {errors.phone && <p className="dprof-field-error">{errors.phone}</p>}
                </div>
              </div>

              <div className="dprof-field-row">
                <div className="dprof-field">
                  <label htmlFor="dprof-location">{t("doctorProfile.labels.location")}</label>
                  <input id="dprof-location" type="text" value={draft.location} onChange={(event) => setField("location", event.target.value)} aria-invalid={!!errors.location} />
                  {errors.location && <p className="dprof-field-error">{errors.location}</p>}
                </div>
                <div className="dprof-field">
                  <label htmlFor="dprof-availability">{t("doctorProfile.labels.availabilityStatus")}</label>
                  <select id="dprof-availability" value={draft.availabilityStatus} onChange={(event) => setField("availabilityStatus", event.target.value)}>
                    {Object.values(DOCTOR_AVAILABILITY_STATUS).map((status) => (
                      <option key={status} value={status}>
                        {t(`doctorProfile.status.${status}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="dprof-working-hours">
                <div className="dprof-working-hours-header">
                  <h4>{t("doctorProfile.workingHours.title")}</h4>
                  <button type="button" className="dprof-btn-text" onClick={copySundayToOpenDays}>
                    {t("doctorProfile.workingHours.copySunday")}
                  </button>
                </div>

                <div className="dprof-hours-list">
                  {WEEKDAY_ORDER.map((day) => {
                    const value = draft.workingHours[day];
                    return (
                      <div key={day} className="dprof-hours-row">
                        <label className="dprof-hours-day">
                          <input type="checkbox" checked={value.enabled} onChange={(event) => setWorkingHoursField(day, { enabled: event.target.checked })} />
                          <span>{t(`doctorProfile.workingHours.days.${day}`)}</span>
                        </label>
                        {value.enabled ? (
                          <div className="dprof-hours-times">
                            <input type="time" aria-label={t("doctorProfile.workingHours.startLabel", { day: t(`doctorProfile.workingHours.days.${day}`) })} value={value.start} onChange={(event) => setWorkingHoursField(day, { start: event.target.value })} />
                            <span className="dprof-hours-sep">–</span>
                            <input type="time" aria-label={t("doctorProfile.workingHours.endLabel", { day: t(`doctorProfile.workingHours.days.${day}`) })} value={value.end} onChange={(event) => setWorkingHoursField(day, { end: event.target.value })} />
                          </div>
                        ) : (
                          <span className="dprof-hours-closed">{t("doctorProfile.workingHours.closed")}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {errors.workingHours && <p className="dprof-field-error">{errors.workingHours}</p>}
              </div>
            </section>
          </div>

          {hoursConflict && (
            <div className="dprof-conflict-banner">
              <p>{t("doctorProfile.workingHours.conflictWarning", { count: hoursConflict.length })}</p>
              <div className="dprof-conflict-actions">
                <button type="button" className="dprof-btn-secondary" onClick={() => navigate(ROUTES.APPOINTMENTS)}>
                  {t("doctorProfile.workingHours.reviewAppointments")}
                </button>
                <button type="button" className="dprof-btn-primary" onClick={commitSave}>
                  {t("doctorProfile.workingHours.saveAnyway")}
                </button>
              </div>
            </div>
          )}

          <div className="dprof-save-bar">
            <button type="button" className="dprof-btn-secondary" onClick={handleCancel} disabled={!dirty}>
              {t("doctorProfile.cancel")}
            </button>
            <button type="button" className="dprof-btn-primary" onClick={handleSave} disabled={!dirty}>
              {t("doctorProfile.saveChanges")}
            </button>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorProfile;
